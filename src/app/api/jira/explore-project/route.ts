import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, email, apiToken, projectKey } = await request.json()

    if (!baseUrl || !email || !apiToken || !projectKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: baseUrl, email, apiToken, projectKey' 
        },
        { status: 400 }
      )
    }

    const authString = Buffer.from(`${email}:${apiToken}`).toString('base64')
    
    // Get project details
    const projectResponse = await fetch(`${baseUrl}/rest/api/3/project/${projectKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
      },
    })

    if (!projectResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch project details: ${projectResponse.status} ${projectResponse.statusText}`
      })
    }

    const project = await projectResponse.json()

    // Get recent issues (last 50) to see what's actually in the project
    const issuesResponse = await fetch(`${baseUrl}/rest/api/3/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jql: `project = "${projectKey}" ORDER BY created DESC`,
        maxResults: 50,
        fields: ['summary', 'issuetype', 'status', 'priority', 'created', 'updated', 'assignee', 'reporter']
      })
    })

    if (!issuesResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch issues: ${issuesResponse.status} ${issuesResponse.statusText}`
      })
    }

    const issuesData = await issuesResponse.json()

    // Get issue types for this project
    const issueTypesResponse = await fetch(`${baseUrl}/rest/api/3/project/${projectKey}/statuses`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
      },
    })

    let issueTypes = []
    if (issueTypesResponse.ok) {
      const statusData = await issueTypesResponse.json()
      issueTypes = statusData.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        iconUrl: item.iconUrl,
        subtask: item.subtask
      }))
    }

    // Analyze the issues to understand patterns
    const issueTypeCount: Record<string, number> = {}
    const statusCount: Record<string, number> = {}
    const recentIssues = issuesData.issues.map((issue: any) => {
      const issueType = issue.fields.issuetype.name
      const status = issue.fields.status.name
      
      issueTypeCount[issueType] = (issueTypeCount[issueType] || 0) + 1
      statusCount[status] = (statusCount[status] || 0) + 1

      return {
        key: issue.key,
        summary: issue.fields.summary,
        issueType: issueType,
        status: status,
        priority: issue.fields.priority?.name || 'None',
        created: issue.fields.created,
        updated: issue.fields.updated,
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        reporter: issue.fields.reporter?.displayName || 'Unknown'
      }
    })

    return NextResponse.json({
      success: true,
      project: {
        key: project.key,
        name: project.name,
        description: project.description,
        projectTypeKey: project.projectTypeKey,
        lead: project.lead?.displayName
      },
      statistics: {
        totalIssues: issuesData.total,
        recentIssuesCount: issuesData.issues.length,
        issueTypeBreakdown: issueTypeCount,
        statusBreakdown: statusCount
      },
      issueTypes,
      recentIssues: recentIssues.slice(0, 10), // Show first 10 for preview
      suggestions: {
        recommendedJQL: await generateJQLSuggestions(issueTypeCount, baseUrl, authString, projectKey),
        dateRange: getDateRangeSuggestion(recentIssues)
      }
    })

  } catch (error) {
    console.error('Error exploring project:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

async function generateJQLSuggestions(issueTypeCount: Record<string, number>, baseUrl: string, authString: string, projectKey: string) {
  const suggestions = []
  
  for (const [issueType, count] of Object.entries(issueTypeCount)) {
    const lowerType = issueType.toLowerCase()
    let actualCount = count // Default to sample count
    
    // Get actual count for this issue type across entire project
    try {
      const countResponse = await fetch(`${baseUrl}/rest/api/3/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jql: `project = "${projectKey}" AND type = "${issueType}"`,
          maxResults: 0, // We only want the count
          fields: []
        })
      })
      
      if (countResponse.ok) {
        const countData = await countResponse.json()
        actualCount = countData.total
      }
    } catch (error) {
      console.warn(`Failed to get count for ${issueType}:`, error)
    }
    
    if (lowerType.includes('story') || lowerType.includes('user story')) {
      suggestions.push({
        type: 'User Stories',
        jql: `type = "${issueType}"`,
        count: actualCount
      })
    } else if (lowerType.includes('bug') || lowerType.includes('defect')) {
      suggestions.push({
        type: 'Defects/Bugs',
        jql: `type = "${issueType}"`,
        count: actualCount
      })
    } else if (lowerType.includes('epic')) {
      suggestions.push({
        type: 'Epics',
        jql: `type = "${issueType}"`,
        count: actualCount
      })
    } else if (lowerType.includes('task')) {
      suggestions.push({
        type: 'Tasks',
        jql: `type = "${issueType}"`,
        count: actualCount
      })
    } else {
      suggestions.push({
        type: issueType,
        jql: `type = "${issueType}"`,
        count: actualCount
      })
    }
  }
  
  return suggestions
}

function getDateRangeSuggestion(recentIssues: any[]) {
  if (recentIssues.length === 0) return null
  
  const dates = recentIssues.map(issue => new Date(issue.created)).sort((a, b) => a.getTime() - b.getTime())
  const oldest = dates[0]
  const newest = dates[dates.length - 1]
  
  return {
    oldestIssue: oldest.toISOString().split('T')[0],
    newestIssue: newest.toISOString().split('T')[0],
    recommendedStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days ago
  }
} 