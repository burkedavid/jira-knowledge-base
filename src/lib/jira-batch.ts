import { prisma } from './prisma'
import { JiraClient, JiraIssue } from './jira-client'
import { embedContent } from './vector-db'
import { JiraConfigManager, JiraProjectConfig } from './jira-config'

export interface BatchImportOptions {
  projectKey: string
  batchSize?: number
  includeUserStories?: boolean
  includeDefects?: boolean
  onProgress?: (processed: number, total: number, status: string) => void
  onError?: (error: Error, item?: any) => void
}

export interface BatchImportResult {
  jobId: string
  totalProcessed: number
  userStoriesProcessed: number
  defectsProcessed: number
  errors: string[]
}

export class JiraBatchProcessor {
  private jiraClient: JiraClient
  private configManager: JiraConfigManager

  constructor(jiraClient: JiraClient) {
    this.jiraClient = jiraClient
    this.configManager = new JiraConfigManager()
  }

  async importProject(options: BatchImportOptions): Promise<BatchImportResult> {
    const {
      projectKey,
      batchSize = 50,
      includeUserStories = true,
      includeDefects = true,
      onProgress,
      onError,
    } = options

    // Get project configuration
    const config = await this.configManager.getProjectConfig(projectKey)
    if (!config) {
      throw new Error(`No configuration found for project ${projectKey}`)
    }

    // Create import job
    const job = await prisma.importJob.create({
      data: {
        type: 'jira',
        status: 'in_progress',
        metadata: JSON.stringify({ projectKey, includeUserStories, includeDefects }),
      },
    })

    const errors: string[] = []
    let totalProcessed = 0
    let userStoriesProcessed = 0
    let defectsProcessed = 0 

    try {
      onProgress?.(0, 0, 'Starting import...') 

      // Import user stories
      if (includeUserStories) {
        const userStoryResult = await this.importUserStories(
          projectKey,
          config,
          batchSize,
          (processed, total, status) => {
            onProgress?.(processed, total, `User Stories: ${status}`)
          },
          (error, item) => {
            errors.push(`User Story Error: ${error.message}`)
            onError?.(error, item)
          }
        )
        userStoriesProcessed = userStoryResult.processed
        totalProcessed += userStoryResult.processed
      }

      // Import defects
      if (includeDefects) {
        const defectResult = await this.importDefects(
          projectKey,
          batchSize,
          (processed, total, status) => {
            onProgress?.(processed, total, `Defects: ${status}`)
          },
          (error, item) => {
            errors.push(`Defect Error: ${error.message}`)
            onError?.(error, item)
          }
        )
        defectsProcessed = defectResult.processed
        totalProcessed += defectResult.processed
      }

      // Update job status
      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: errors.length > 0 ? 'completed_with_errors' : 'completed',
          processedItems: totalProcessed,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          completedAt: new Date(),
        },
      })

      onProgress?.(totalProcessed, totalProcessed, 'Import completed')

      return {
        jobId: job.id,
        totalProcessed,
        userStoriesProcessed,
        defectsProcessed,
        errors,
      }
    } catch (error) {
      // Update job with failure status
      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errors: JSON.stringify([error instanceof Error ? error.message : 'Unknown error']),
          completedAt: new Date(),
        },
      })

      throw error
    }
  }

  private async importUserStories(
    projectKey: string,
    config: JiraProjectConfig,
    batchSize: number,
    onProgress: (processed: number, total: number, status: string) => void,
    onError: (error: Error, item?: any) => void
  ): Promise<{ processed: number }> {
    let processed = 0
    let startAt = 0
    let total = 0

    try {
      // Get total count first
      const jql = `project = "${projectKey}" AND issuetype in ("Story", "User Story", "Epic")`
      total = await this.jiraClient.getIssueCount(jql)
      
      onProgress(0, total, 'Fetching user stories...')

      while (startAt < total) {
        try {
          const result = await this.jiraClient.withRateLimit(() =>
            this.jiraClient.getUserStories(projectKey, startAt, batchSize)
          )

          for (const issue of result.issues) {
            try {
              await this.processUserStory(issue, config)
              processed++
              onProgress(processed, total, `Processing user story ${issue.key}`)
            } catch (error) {
              onError(error as Error, issue)
            }
          }

          startAt += batchSize
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          onError(error as Error, { startAt, batchSize })
          startAt += batchSize // Continue with next batch
        }
      }
    } catch (error) {
      onError(error as Error, { projectKey })
    }

    return { processed }
  }

  private async importDefects(
    projectKey: string,
    batchSize: number,
    onProgress: (processed: number, total: number, status: string) => void,
    onError: (error: Error, item?: any) => void
  ): Promise<{ processed: number }> {
    let processed = 0
    let startAt = 0
    let total = 0

    try {
      // Get total count first
      const jql = `project = "${projectKey}" AND issuetype in ("Bug", "Defect")`
      total = await this.jiraClient.getIssueCount(jql)
      
      onProgress(0, total, 'Fetching defects...')

      while (startAt < total) {
        try {
          const result = await this.jiraClient.withRateLimit(() =>
            this.jiraClient.getDefects(projectKey, startAt, batchSize)
          )

          for (const issue of result.issues) {
            try {
              await this.processDefect(issue)
              processed++
              onProgress(processed, total, `Processing defect ${issue.key}`)
            } catch (error) {
              onError(error as Error, issue)
            }
          }

          startAt += batchSize
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          onError(error as Error, { startAt, batchSize })
          startAt += batchSize // Continue with next batch
        }
      }
    } catch (error) {
      onError(error as Error, { projectKey })
    }

    return { processed }
  }

  private async processUserStory(issue: JiraIssue, config: JiraProjectConfig): Promise<void> {
    const fieldMappings = config.fieldMappings
    
    // Extract field values using configuration
    const title = this.configManager.mapFieldValue(issue, fieldMappings.summary) || ''
    const description = this.configManager.mapFieldValue(issue, fieldMappings.description) || ''
    const acceptanceCriteria = fieldMappings.acceptanceCriteria 
      ? this.configManager.mapFieldValue(issue, fieldMappings.acceptanceCriteria) 
      : null
    const priority = this.configManager.mapFieldValue(issue, fieldMappings.priority)
    const status = this.configManager.mapFieldValue(issue, fieldMappings.status)
    const component = fieldMappings.component 
      ? this.configManager.mapFieldValue(issue, fieldMappings.component) 
      : null
    const assignee = this.configManager.mapFieldValue(issue, fieldMappings.assignee)
    const reporter = this.configManager.mapFieldValue(issue, fieldMappings.reporter)
    const created = this.configManager.mapFieldValue(issue, fieldMappings.created)
    const updated = this.configManager.mapFieldValue(issue, fieldMappings.updated)
    
    // Normalize status and priority using configuration
    const normalizedStatus = status ? this.configManager.normalizeStatus(status, config.statusMappings) : null
    const normalizedPriority = priority ? this.configManager.normalizePriority(priority, config.priorityMappings) : null
    
    const content = `${title}\n\n${description}\n\n${acceptanceCriteria || ''}`
    
    const userStory = await prisma.userStory.upsert({
      where: { jiraId: issue.id },
      update: {
        title,
        description,
        acceptanceCriteria,
        jiraKey: issue.key,
        priority: normalizedPriority,
        status: normalizedStatus,
        component,
        assignee,
        reporter,
        updatedAt: new Date(updated),
      },
      create: {
        title,
        description,
        acceptanceCriteria,
        jiraId: issue.id,
        jiraKey: issue.key,
        priority: normalizedPriority,
        status: normalizedStatus,
        component,
        assignee,
        reporter,
        createdAt: new Date(created),
        updatedAt: new Date(updated),
      },
    })

    // Generate embeddings
    await embedContent(content, userStory.id, 'user_story')
  }

  private async processDefect(issue: JiraIssue): Promise<void> {
    const content = `${issue.fields.summary}\n\n${issue.fields.description || ''}`
    
    const defect = await prisma.defect.upsert({
      where: { jiraId: issue.id },
      update: {
        title: issue.fields.summary,
        description: issue.fields.description || '',
        jiraKey: issue.key,
        priority: issue.fields.priority?.name || null,
        severity: issue.fields.priority?.name || null, // Map as needed
        status: issue.fields.status.name,
        component: issue.fields.components?.[0]?.name || null,
        assignee: issue.fields.assignee?.displayName || null,
        reporter: issue.fields.reporter?.displayName || null,
        resolution: issue.fields.resolution?.name || null,
        resolvedAt: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null,
        updatedAt: new Date(issue.fields.updated),
      },
      create: {
        title: issue.fields.summary,
        description: issue.fields.description || '',
        jiraId: issue.id,
        jiraKey: issue.key,
        priority: issue.fields.priority?.name || null,
        severity: issue.fields.priority?.name || null, // Map as needed
        status: issue.fields.status.name,
        component: issue.fields.components?.[0]?.name || null,
        assignee: issue.fields.assignee?.displayName || null,
        reporter: issue.fields.reporter?.displayName || null,
        resolution: issue.fields.resolution?.name || null,
        resolvedAt: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null,
        createdAt: new Date(issue.fields.created),
        updatedAt: new Date(issue.fields.updated),
      },
    })

    // Generate embeddings
    await embedContent(content, defect.id, 'defect')
  }

  async syncUpdatedIssues(projectKey: string, since: Date): Promise<BatchImportResult> {
    const job = await prisma.importJob.create({
      data: {
        type: 'jira_sync',
        status: 'in_progress',
        metadata: JSON.stringify({ projectKey, since: since.toISOString() }),
      },
    })

    const errors: string[] = []
    let totalProcessed = 0

    try {
      // Get project configuration
      const config = await this.configManager.getProjectConfig(projectKey)
      if (!config) {
        throw new Error(`No configuration found for project ${projectKey}`)
      }

      const result = await this.jiraClient.getUpdatedIssues(projectKey, since, 0, 1000)
      
      for (const issue of result.issues) {
        try {
          if (issue.fields.issuetype.name.toLowerCase().includes('story') || 
              issue.fields.issuetype.name.toLowerCase().includes('epic')) {
            await this.processUserStory(issue, config)
          } else if (issue.fields.issuetype.name.toLowerCase().includes('bug') || 
                     issue.fields.issuetype.name.toLowerCase().includes('defect')) {
            await this.processDefect(issue)
          }
          totalProcessed++
        } catch (error) {
          errors.push(`Sync Error for ${issue.key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: errors.length > 0 ? 'completed_with_errors' : 'completed',
          processedItems: totalProcessed,
          errors: errors.length > 0 ? JSON.stringify(errors) : null,
          completedAt: new Date(),
        },
      })

      return {
        jobId: job.id,
        totalProcessed,
        userStoriesProcessed: 0, // Not tracked separately in sync
        defectsProcessed: 0, // Not tracked separately in sync
        errors,
      }
    } catch (error) {
      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errors: JSON.stringify([error instanceof Error ? error.message : 'Unknown error']),
          completedAt: new Date(),
        },
      })

      throw error
    }
  }
} 