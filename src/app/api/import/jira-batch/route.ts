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

    for (const { type, jql } of jqlQueries) {
      console.log(`\n🔄 Processing ${type} with JQL: ${jql}`)
      
      try {
        const totalItems = await getJiraIssueCount(jiraClient, jql)
        console.log(`📊 Found ${totalItems} ${type} to import`)

        // Update total items in job
        const currentJob = await prisma.importJob.findUnique({ where: { id: jobId } })
        await prisma.importJob.update({
          where: { id: jobId },
          data: { totalItems: totalItems + (currentJob?.totalItems || 0) }
        })

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

        while (startAt < totalItems) {
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
            if (startAt < totalItems) {
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
    const importSummary = {
      totalProcessed,
      created: stats.created,
      updated: stats.updated,
      skipped: stats.skipped,
      errors: stats.errors,
      duplicatesPrevented: stats.skipped
    }

    console.log(`📊 Import Summary:`)
    console.log(`   ✅ Created: ${stats.created} items`)
    console.log(`   🔄 Updated: ${stats.updated} items`)
    console.log(`   ⏭️  Skipped: ${stats.skipped} items (duplicates prevented)`)
    console.log(`   ❌ Errors: ${stats.errors} items`)
    console.log(`   📈 Total processed: ${totalProcessed} items`)
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

    console.log(`Import completed successfully!`)

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
        // Combine the custom JQL with project and date filters
        let fullJQL = `${baseJql} AND (${mapping.jql})`
        if (dateFilter) {
          fullJQL += dateFilter
        }
        fullJQL += ' ORDER BY created DESC'
        
        queries.push({
          type: mapping.type,
          jql: fullJQL
        })
      }
    })
  } else {
    // Fallback to default behavior
    if (config.importOptions.userStories) {
      queries.push({
        type: 'user_stories',
        jql: `${baseJql} AND type = "Story"${dateFilter} ORDER BY created DESC`
      })
    }

    if (config.importOptions.defects) {
      queries.push({
        type: 'defects',
        jql: `${baseJql} AND type = "Bug"${dateFilter} ORDER BY created DESC`
      })
    }

    if (config.importOptions.epics) {
      queries.push({
        type: 'epics',
        jql: `${baseJql} AND type = "Epic"${dateFilter} ORDER BY created DESC`
      })
    }
  }

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