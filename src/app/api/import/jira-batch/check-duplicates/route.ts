import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface DuplicateCheckRequest {
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
}

export async function POST(request: NextRequest) {
  try {
    const config: DuplicateCheckRequest = await request.json()

    // Create Jira client
    const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64')
    const jiraClient = {
      baseUrl: config.jiraUrl.replace(/\/$/, ''),
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }

    const duplicateReport = {
      userStories: { total: 0, existing: 0, new: 0, outdated: 0, existingItems: [] as any[] },
      defects: { total: 0, existing: 0, new: 0, outdated: 0, existingItems: [] as any[] },
      epics: { total: 0, existing: 0, new: 0, outdated: 0, existingItems: [] as any[] }
    }

    // Build JQL queries
    const baseJql = `project = "${config.projectKey}"`
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

    // Check User Stories
    if (config.importOptions.userStories) {
      const jql = `${baseJql} AND type = "Story"${dateFilter}`
      const response = await fetch(`${jiraClient.baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=1000&fields=id,key,summary,updated`, {
        headers: jiraClient.headers
      })

      if (response.ok) {
        const data = await response.json()
        duplicateReport.userStories.total = data.total

        // Check which ones already exist in our database
        for (const issue of data.issues) {
          const existing = await prisma.userStory.findUnique({
            where: { jiraId: issue.id },
            select: { id: true, jiraKey: true, title: true, updatedAt: true }
          })

          if (existing) {
            duplicateReport.userStories.existing++
            const jiraUpdated = new Date(issue.fields.updated)
            const dbUpdated = existing.updatedAt
            
            if (jiraUpdated > dbUpdated) {
              duplicateReport.userStories.outdated++
            }

            duplicateReport.userStories.existingItems.push({
              jiraKey: issue.key,
              title: issue.fields.summary,
              jiraUpdated: issue.fields.updated,
              dbUpdated: existing.updatedAt,
              needsUpdate: jiraUpdated > dbUpdated
            })
          } else {
            duplicateReport.userStories.new++
          }
        }
      }
    }

    // Check Defects
    if (config.importOptions.defects) {
      const jql = `${baseJql} AND type = "Bug"${dateFilter}`
      const response = await fetch(`${jiraClient.baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=1000&fields=id,key,summary,updated`, {
        headers: jiraClient.headers
      })

      if (response.ok) {
        const data = await response.json()
        duplicateReport.defects.total = data.total

        for (const issue of data.issues) {
          const existing = await prisma.defect.findUnique({
            where: { jiraId: issue.id },
            select: { id: true, jiraKey: true, title: true, updatedAt: true }
          })

          if (existing) {
            duplicateReport.defects.existing++
            const jiraUpdated = new Date(issue.fields.updated)
            const dbUpdated = existing.updatedAt
            
            if (jiraUpdated > dbUpdated) {
              duplicateReport.defects.outdated++
            }

            duplicateReport.defects.existingItems.push({
              jiraKey: issue.key,
              title: issue.fields.summary,
              jiraUpdated: issue.fields.updated,
              dbUpdated: existing.updatedAt,
              needsUpdate: jiraUpdated > dbUpdated
            })
          } else {
            duplicateReport.defects.new++
          }
        }
      }
    }

    // Calculate summary
    const summary = {
      totalItems: duplicateReport.userStories.total + duplicateReport.defects.total + duplicateReport.epics.total,
      totalExisting: duplicateReport.userStories.existing + duplicateReport.defects.existing + duplicateReport.epics.existing,
      totalNew: duplicateReport.userStories.new + duplicateReport.defects.new + duplicateReport.epics.new,
      totalOutdated: duplicateReport.userStories.outdated + duplicateReport.defects.outdated + duplicateReport.epics.outdated,
      duplicatePercentage: 0
    }

    if (summary.totalItems > 0) {
      summary.duplicatePercentage = Math.round((summary.totalExisting / summary.totalItems) * 100)
    }

    return NextResponse.json({
      summary,
      details: duplicateReport,
      recommendations: {
        shouldProceed: summary.totalNew > 0 || summary.totalOutdated > 0,
        message: summary.totalNew === 0 && summary.totalOutdated === 0 
          ? "All items already exist and are up to date. No import needed."
          : summary.totalNew > 0 
            ? `${summary.totalNew} new items will be imported, ${summary.totalOutdated} existing items will be updated.`
            : `${summary.totalOutdated} existing items will be updated.`
      }
    })

  } catch (error) {
    console.error('Duplicate check error:', error)
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    )
  }
} 