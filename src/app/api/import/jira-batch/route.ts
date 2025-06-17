import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface JQLMapping {
  type: 'user_stories' | 'defects' | 'epics'
  label: string
  jql: string
  enabled: boolean
  count: number
}

interface JiraImportRequest {
  jiraUrl: string
  projectKey: string
  username: string
  apiToken: string
  importOptions: {
    userStories: boolean
    defects: boolean
    epics: boolean
  }
  dateRange?: {
    fromDate?: string
    toDate?: string
  }
  batchSettings: {
    batchSize: number
    delayBetweenBatches: number
  }
  customJQL?: JQLMapping[]
  generateEmbeddings?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const config: JiraImportRequest = await request.json()

    // Validate required fields
    if (!config.jiraUrl || !config.projectKey || !config.username || !config.apiToken) {
      return NextResponse.json(
        { error: 'Missing required Jira configuration' },
        { status: 400 }
      )
    }

    // Create import job
    const importJob = await prisma.importJob.create({
      data: {
        type: 'jira',
        status: 'pending',
        metadata: JSON.stringify({
          projectKey: config.projectKey,
          dateRange: config.dateRange,
          batchSettings: config.batchSettings,
          importOptions: config.importOptions,
          customJQL: config.customJQL
        })
      }
    })

    // Start the import process asynchronously
    processJiraImport(importJob.id, config).catch(error => {
      console.error('Import process failed:', error)
      // Update job status to failed
      prisma.importJob.update({
        where: { id: importJob.id },
        data: { 
          status: 'failed',
          errors: JSON.stringify([error.message])
        }
      }).catch(console.error)
    })

    return NextResponse.json({
      message: 'Import job started',
      jobId: importJob.id,
      status: 'pending'
    })

  } catch (error) {
    console.error('Error starting Jira import:', error)
    return NextResponse.json(
      { error: 'Failed to start import' },
      { status: 500 }
    )
  }
}

async function processJiraImport(jobId: string, config: JiraImportRequest) {
  const jiraClient = createJiraClient(config)
  let totalProcessed = 0
  const errors: string[] = []
  
  // Enhanced statistics tracking
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  }

  try {
    // Build JQL queries using custom mappings or defaults
    const jqlQueries = buildJQLQueries(config)
    console.log(`\n🚀 Starting import process for ${jqlQueries.length} issue types`)

    // First, calculate total items across all queries for accurate progress tracking
    let grandTotal = 0
    const queryTotals: { [key: string]: number } = {}
    
    console.log(`\n📊 Calculating total items for accurate progress tracking...`)
    for (const { type, jql } of jqlQueries) {
      try {
        const count = await getJiraIssueCount(jiraClient, jql)
        queryTotals[type] = count
        grandTotal += count
        console.log(`   ${type}: ${count} items`)
      } catch (error: any) {
        console.error(`❌ Failed to count ${type}:`, error.message)
        queryTotals[type] = 0
        errors.push(`Failed to count ${type}: ${error.message}`)
      }
    }

    console.log(`📈 Total items to process: ${grandTotal}`)
    
    // Update job with accurate total
    await prisma.importJob.update({
      where: { id: jobId },
      data: { 
        totalItems: grandTotal,
        status: 'in_progress'
      }
    })

    // Process each query type
    for (const { type, jql } of jqlQueries) {
      const typeTotal = queryTotals[type]
      if (typeTotal === 0) {
        console.log(`⏭️  Skipping ${type} - no items found`)
        continue
      }
      
      console.log(`\n🔄 Processing ${type} (${typeTotal} items)`)
      console.log(`   JQL: ${jql}`)
      
      try {

        // Track statistics for this type
        const typeStats = {
          created: 0,
          updated: 0,
          skipped: 0,
          errors: 0
        }

        // Process in batches
        let startAt = 0
        const batchSize = config.batchSettings.batchSize

        while (startAt < typeTotal) {
          try {
            console.log(`Processing batch ${Math.floor(startAt / batchSize) + 1} for ${type}`)
            
            const issues = await fetchJiraIssues(jiraClient, jql, startAt, batchSize)
            
            // Process each issue in the batch
            for (const issue of issues) {
              try {
                const result = await processJiraIssue(issue, type)
                
                // Track statistics
                switch (result.action) {
                  case 'created':
                    stats.created++
                    typeStats.created++
                    break
                  case 'updated':
                    stats.updated++
                    typeStats.updated++
                    break
                  case 'skipped':
                    stats.skipped++
                    typeStats.skipped++
                    break
                }
                
                // Always increment total processed (including skipped items)
                totalProcessed++
                
                // Update progress (count all processed items including skipped)
                await prisma.importJob.update({
                  where: { id: jobId },
                  data: { processedItems: totalProcessed }
                })
              } catch (issueError: any) {
                console.error(`Error processing issue ${issue.key}:`, issueError)
                errors.push(`Issue ${issue.key}: ${issueError.message}`)
                stats.errors++
                typeStats.errors++
              }
            }

            startAt += batchSize

            // Delay between batches to respect rate limits
            if (startAt < typeTotal) {
              await new Promise(resolve => setTimeout(resolve, config.batchSettings.delayBetweenBatches))
            }

          } catch (batchError: any) {
            console.error(`Error processing batch starting at ${startAt}:`, batchError)
            errors.push(`Batch error at ${startAt}: ${batchError.message}`)
            stats.errors++
            typeStats.errors++
            
            // Continue with next batch instead of failing completely
            startAt += batchSize
          }
        }

        // Summary for this type
        console.log(`\n✅ Completed ${type}:`)
        console.log(`   ✅ Created: ${typeStats.created}`)
        console.log(`   🔄 Updated: ${typeStats.updated}`)
        console.log(`   ⏭️  Skipped: ${typeStats.skipped}`)
        console.log(`   ❌ Errors: ${typeStats.errors}`)

      } catch (typeError: any) {
        console.error(`Error processing ${type}:`, typeError)
        errors.push(`${type} processing error: ${typeError.message}`)
        stats.errors++
      }
    }

    // Enhanced completion logging with statistics
    const importSummary: any = {
      totalProcessed,
      created: stats.created,
      updated: stats.updated,
      skipped: stats.skipped,
      errors: stats.errors,
      duplicatesPrevented: stats.skipped,
      embeddingsGenerated: 0
    }

    console.log(`📊 Import Summary:`)
    console.log(`   ✅ Created: ${stats.created} items`)
    console.log(`   🔄 Updated: ${stats.updated} items`)
    console.log(`   ⏭️  Skipped: ${stats.skipped} items (duplicates prevented)`)
    console.log(`   ❌ Errors: ${stats.errors} items`)
    console.log(`   📈 Total processed: ${totalProcessed} items`)

    // Generate embeddings for newly imported content (if enabled)
    if (config.generateEmbeddings !== false) { // Default to true if not specified
      console.log(`\n🔮 Generating embeddings for imported content...`)
      try {
      const { embedContent } = await import('@/lib/vector-db')
      let embeddingsGenerated = 0

      // Generate embeddings for user stories if they were processed (created, updated, or skipped)
      if (config.importOptions.userStories && totalProcessed > 0) {
        console.log(`🔍 Looking for user stories to generate embeddings...`)
        
        // Get user stories from the import - respect the date range if specified
        let userStoryWhere: any = {}
        
        if (config.dateRange?.fromDate || config.dateRange?.toDate) {
          // Use the same date range as the import
          const dateConditions: any = {}
          if (config.dateRange.fromDate) {
            dateConditions.gte = new Date(config.dateRange.fromDate)
          }
          if (config.dateRange.toDate) {
            dateConditions.lte = new Date(config.dateRange.toDate)
          }
          userStoryWhere.createdAt = dateConditions
          console.log(`📅 Using import date range for embeddings: ${config.dateRange.fromDate} to ${config.dateRange.toDate}`)
        } else {
          // Fallback to recent items if no date range specified
          userStoryWhere = {
            OR: [
              { createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } }, // Last 2 hours
              { updatedAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } }   // Last 2 hours
            ]
          }
          console.log(`📅 No date range specified, using last 2 hours for embeddings`)
        }
        
        const recentUserStories = await prisma.userStory.findMany({
          where: userStoryWhere,
          take: 500 // Increased limit for date range imports
        })
        
        console.log(`📊 Found ${recentUserStories.length} user stories for embedding generation`)

        for (const story of recentUserStories) {
          try {
            const content = `${story.title}\n\n${story.description}\n\nAcceptance Criteria: ${story.acceptanceCriteria || 'Not provided'}\n\nComponent: ${story.component || 'Not specified'}\n\nPriority: ${story.priority || 'Not set'}`
            // During import, be more aggressive about generating embeddings
            // Force regeneration if explicitly requested via checkbox
            const shouldForceRegenerate = config.generateEmbeddings === true
            const result = await embedContent(content, story.id, 'user_story', '1.0', shouldForceRegenerate, true)
            if (result.action === 'created' || result.action === 'updated') {
              embeddingsGenerated++
              console.log(`✅ Generated embedding for user story ${story.id} (${result.action}: ${result.reason})`)
            } else {
              console.log(`⏭️ Skipped embedding for user story ${story.id} (${result.reason})`)
            }
          } catch (embeddingError) {
            console.error(`Failed to generate embedding for user story ${story.id}:`, embeddingError)
          }
        }
      }

      // Generate embeddings for defects if they were processed (created, updated, or skipped)
      if (config.importOptions.defects && totalProcessed > 0) {
        console.log(`🔍 Looking for defects to generate embeddings...`)
        
        // Get defects from the import - respect the date range if specified
        let defectWhere: any = {}
        
        if (config.dateRange?.fromDate || config.dateRange?.toDate) {
          // Use the same date range as the import
          const dateConditions: any = {}
          if (config.dateRange.fromDate) {
            dateConditions.gte = new Date(config.dateRange.fromDate)
          }
          if (config.dateRange.toDate) {
            dateConditions.lte = new Date(config.dateRange.toDate)
          }
          defectWhere.createdAt = dateConditions
          console.log(`📅 Using import date range for defect embeddings: ${config.dateRange.fromDate} to ${config.dateRange.toDate}`)
        } else {
          // Fallback to recent items if no date range specified
          defectWhere = {
            OR: [
              { createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } }, // Last 2 hours
              { updatedAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } }   // Last 2 hours
            ]
          }
          console.log(`📅 No date range specified, using last 2 hours for defect embeddings`)
        }
        
        const recentDefects = await prisma.defect.findMany({
          where: defectWhere,
          take: 500 // Increased limit for date range imports
        })
        
        console.log(`📊 Found ${recentDefects.length} defects for embedding generation`)

        for (const defect of recentDefects) {
          try {
            const content = `${defect.title}\n\n${defect.description}\n\nSteps to Reproduce: ${defect.stepsToReproduce || 'Not provided'}\n\nRoot Cause: ${defect.rootCause || 'Not identified'}\n\nComponent: ${defect.component || 'Not specified'}\n\nSeverity: ${defect.severity || 'Not set'}`
            // During import, be more aggressive about generating embeddings
            // Force regeneration if explicitly requested via checkbox
            const shouldForceRegenerate = config.generateEmbeddings === true
            const result = await embedContent(content, defect.id, 'defect', '1.0', shouldForceRegenerate, true)
            if (result.action === 'created' || result.action === 'updated') {
              embeddingsGenerated++
              console.log(`✅ Generated embedding for defect ${defect.id} (${result.action}: ${result.reason})`)
            } else {
              console.log(`⏭️ Skipped embedding for defect ${defect.id} (${result.reason})`)
            }
          } catch (embeddingError) {
            console.error(`Failed to generate embedding for defect ${defect.id}:`, embeddingError)
          }
        }
      }

      // Note: Epics are not currently supported in the database schema
      // The import configuration allows selecting epics, but they are not processed or stored

      console.log(`✅ Generated ${embeddingsGenerated} embeddings for imported content`)
      importSummary.embeddingsGenerated = embeddingsGenerated

      } catch (embeddingError) {
        console.error('⚠️ Failed to generate embeddings after import:', embeddingError)
        errors.push(`Embedding generation failed: ${embeddingError instanceof Error ? embeddingError.message : 'Unknown error'}`)
      }
    } else {
      console.log(`⏭️ Skipping embeddings generation (disabled)`)
      importSummary.embeddingsGenerated = 0
    }

    console.log(`Import completed successfully!`)

    // Complete the job with enhanced metadata
    await prisma.importJob.update({
      where: { id: jobId },
      data: { 
        status: 'completed',
        completedAt: new Date(),
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
        metadata: JSON.stringify(importSummary)
      }
    })

    console.log(`🎉 Jira import process completed with ${importSummary.embeddingsGenerated || 0} embeddings generated!`)

  } catch (error: any) {
    console.error('Import process failed:', error)
    await prisma.importJob.update({
      where: { id: jobId },
      data: { 
        status: 'failed',
        errors: JSON.stringify([error.message])
      }
    })
  }
}

function createJiraClient(config: JiraImportRequest) {
  const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64')
  
  return {
    baseUrl: config.jiraUrl.replace(/\/$/, ''),
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
}

function buildJQLQueries(config: JiraImportRequest): Array<{ type: string, jql: string }> {
  const queries: Array<{ type: string, jql: string }> = []
  const baseJql = `project = "${config.projectKey}"`
  
  // Add date filtering if specified
  let dateFilter = ''
  if (config.dateRange?.fromDate || config.dateRange?.toDate) {
    const dateConditions = []
    if (config.dateRange.fromDate) {
      dateConditions.push(`created >= "${config.dateRange.fromDate}"`)
    }
    if (config.dateRange.toDate) {
      dateConditions.push(`created <= "${config.dateRange.toDate}"`)
    }
    dateFilter = ` AND ${dateConditions.join(' AND ')}`
  }

  // Use custom JQL mappings if provided, otherwise fall back to defaults
  if (config.customJQL && config.customJQL.length > 0) {
    config.customJQL.forEach(mapping => {
      if (mapping.enabled) {
        // Use custom JQL as-is (it already includes project filter)
        // Only add date filtering if specified
        let fullJQL = mapping.jql
        if (dateFilter) {
          fullJQL += dateFilter
        }
        fullJQL += ' ORDER BY created DESC'
        
        console.log(`🔍 Built JQL for ${mapping.type}: ${fullJQL}`)
        
        queries.push({
          type: mapping.type,
          jql: fullJQL
        })
      }
    })
  } else {
    // Fallback to default behavior
    if (config.importOptions.userStories) {
      const jql = `${baseJql} AND type = "Story"${dateFilter} ORDER BY created DESC`
      console.log(`🔍 Built default JQL for user_stories: ${jql}`)
      queries.push({
        type: 'user_stories',
        jql
      })
    }

    if (config.importOptions.defects) {
      const jql = `${baseJql} AND type = "Bug"${dateFilter} ORDER BY created DESC`
      console.log(`🔍 Built default JQL for defects: ${jql}`)
      queries.push({
        type: 'defects',
        jql
      })
    }

    if (config.importOptions.epics) {
      const jql = `${baseJql} AND type = "Epic"${dateFilter} ORDER BY created DESC`
      console.log(`🔍 Built default JQL for epics: ${jql}`)
      queries.push({
        type: 'epics',
        jql
      })
    }
  }

  console.log(`📋 Generated ${queries.length} JQL queries for import`)
  return queries
}

async function getJiraIssueCount(jiraClient: any, jql: string): Promise<number> {
  const response = await fetch(`${jiraClient.baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=0`, {
    headers: jiraClient.headers
  })

  if (!response.ok) {
    throw new Error(`Failed to get issue count: ${response.statusText}`)
  }

  const data = await response.json()
  return data.total
}

async function fetchJiraIssues(jiraClient: any, jql: string, startAt: number, maxResults: number): Promise<any[]> {
  const url = `${jiraClient.baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}&expand=changelog`
  
  const response = await fetch(url, {
    headers: jiraClient.headers
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch issues: ${response.statusText}`)
  }

  const data = await response.json()
  return data.issues
}

async function processJiraIssue(issue: any, type: string): Promise<{ action: 'created' | 'updated' | 'skipped', reason?: string }> {
  const commonData = {
    title: issue.fields.summary,
    description: issue.fields.description || '',
    priority: issue.fields.priority?.name || 'Medium',
    status: issue.fields.status?.name || 'Unknown',
    jiraId: issue.id,
    jiraKey: issue.key,
    assignee: issue.fields.assignee?.displayName || null,
    reporter: issue.fields.reporter?.displayName || null,
    createdAt: new Date(issue.fields.created),
    updatedAt: new Date(issue.fields.updated)
  }

  // Check if item already exists and if it needs updating
  let existingItem = null
  let result: { action: 'created' | 'updated' | 'skipped', reason?: string }

  if (type === 'user_stories') {
    existingItem = await prisma.userStory.findUnique({
      where: { jiraId: issue.id }
    })

    // Check if update is needed (compare updatedAt timestamps)
    const needsUpdate = !existingItem || 
      new Date(issue.fields.updated) > existingItem.updatedAt

    if (existingItem && !needsUpdate) {
      console.log(`⏭️  Skipping user story ${issue.key} - already up to date`)
      return { action: 'skipped', reason: 'already_up_to_date' }
    }

    const upsertResult = await prisma.userStory.upsert({
      where: { jiraId: issue.id },
      update: {
        ...commonData,
        acceptanceCriteria: issue.fields.customfield_10007 || null,
        storyPoints: issue.fields.customfield_10004 || null,
        component: issue.fields.components?.[0]?.name || null
      },
      create: {
        ...commonData,
        acceptanceCriteria: issue.fields.customfield_10007 || null,
        storyPoints: issue.fields.customfield_10004 || null,
        component: issue.fields.components?.[0]?.name || null
      }
    })

    result = { action: existingItem ? 'updated' : 'created' }
    console.log(`${existingItem ? '🔄' : '✅'} ${existingItem ? 'Updated' : 'Created'} user story: ${issue.key}`)

  } else if (type === 'defects') {
    existingItem = await prisma.defect.findUnique({
      where: { jiraId: issue.id }
    })

    // Check if update is needed
    const needsUpdate = !existingItem || 
      new Date(issue.fields.updated) > existingItem.updatedAt

    if (existingItem && !needsUpdate) {
      console.log(`⏭️  Skipping defect ${issue.key} - already up to date`)
      return { action: 'skipped', reason: 'already_up_to_date' }
    }

    const upsertResult = await prisma.defect.upsert({
      where: { jiraId: issue.id },
      update: {
        ...commonData,
        severity: issue.fields.customfield_10005?.value || issue.fields.priority?.name || 'Medium',
        stepsToReproduce: issue.fields.customfield_10008 || null,
        component: issue.fields.components?.[0]?.name || null,
        resolvedAt: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null
      },
      create: {
        ...commonData,
        severity: issue.fields.customfield_10005?.value || issue.fields.priority?.name || 'Medium',
        stepsToReproduce: issue.fields.customfield_10008 || null,
        component: issue.fields.components?.[0]?.name || null,
        resolvedAt: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null
      }
    })

    result = { action: existingItem ? 'updated' : 'created' }
    console.log(`${existingItem ? '🔄' : '✅'} ${existingItem ? 'Updated' : 'Created'} defect: ${issue.key}`)
  } else {
    throw new Error(`Unsupported issue type: ${type}`)
  }

  return result
}

// GET endpoint to check import job status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    )
  }

  try {
    const job = await prisma.importJob.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Parse metadata for detailed statistics
    let statistics = null
    if (job.metadata) {
      try {
        statistics = JSON.parse(job.metadata)
      } catch (error) {
        console.error('Error parsing job metadata:', error)
      }
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      errors: job.errors ? JSON.parse(job.errors) : null,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      progress: job.totalItems > 0 ? Math.round((job.processedItems / job.totalItems) * 100) : 0,
      statistics: statistics || {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        duplicatesPrevented: 0
      },
      duplicatePrevention: {
        enabled: true,
        method: 'jiraId unique key with timestamp comparison',
        description: 'Items are skipped if they exist and are up to date, updated if they exist but are outdated, or created if they are new.'
      }
    })

  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    )
  }
} 