import { NextRequest, NextResponse } from 'next/server'
import { JiraConfigManager } from '@/lib/jira-config'
import { createJiraClient } from '@/lib/jira-client'

const configManager = new JiraConfigManager()

export async function POST(request: NextRequest) {
  try {
    const { projectKey, baseUrl, email, apiToken } = await request.json()

    if (!projectKey || !baseUrl || !email || !apiToken) {
      return NextResponse.json(
        { error: 'Missing required fields: projectKey, baseUrl, email, apiToken' },
        { status: 400 }
      )
    }

    // Create a temporary Jira client for discovery
    const jiraClient = new (await import('@/lib/jira-client')).JiraClient({
      baseUrl,
      email,
      apiToken,
    })

    // Discover project schema
    const schema = await configManager.discoverProjectSchema(projectKey, jiraClient)

    return NextResponse.json({ 
      message: 'Project schema discovered successfully',
      schema,
      suggestions: generateConfigurationSuggestions(schema)
    })
  } catch (error) {
    console.error('Error discovering project schema:', error)
    return NextResponse.json(
      { error: 'Failed to discover project schema. Please check your credentials and project key.' },
      { status: 500 }
    )
  }
}

function generateConfigurationSuggestions(schema: {
  issueTypes: Array<{ id: string; name: string; description?: string }>
  statuses: Array<{ id: string; name: string; category: string }>
  priorities: Array<{ id: string; name: string }>
  customFields: Array<{ id: string; name: string; type: string }>
}) {
  const suggestions = {
    issueTypeMappings: {
      userStoryTypes: [] as string[],
      defectTypes: [] as string[],
      epicTypes: [] as string[],
      taskTypes: [] as string[],
    },
    statusMappings: {
      todo: [] as string[],
      inProgress: [] as string[],
      done: [] as string[],
      blocked: [] as string[],
    },
    priorityMappings: {
      critical: [] as string[],
      high: [] as string[],
      medium: [] as string[],
      low: [] as string[],
    },
    customFieldSuggestions: [] as Array<{ field: string; mapping: string; reason: string }>,
  }

  // Suggest issue type mappings based on common names
  schema.issueTypes.forEach(type => {
    const name = type.name.toLowerCase()
    if (name.includes('story') || name.includes('user story')) {
      suggestions.issueTypeMappings.userStoryTypes.push(type.name)
    } else if (name.includes('bug') || name.includes('defect')) {
      suggestions.issueTypeMappings.defectTypes.push(type.name)
    } else if (name.includes('epic')) {
      suggestions.issueTypeMappings.epicTypes.push(type.name)
    } else if (name.includes('task') || name.includes('sub-task')) {
      suggestions.issueTypeMappings.taskTypes.push(type.name)
    }
  })

  // Suggest status mappings based on categories and common names
  schema.statuses.forEach(status => {
    const name = status.name.toLowerCase()
    const category = status.category.toLowerCase()
    
    if (category === 'done' || name.includes('done') || name.includes('closed') || name.includes('resolved')) {
      suggestions.statusMappings.done.push(status.name)
    } else if (category === 'indeterminate' || name.includes('progress') || name.includes('development') || name.includes('review')) {
      suggestions.statusMappings.inProgress.push(status.name)
    } else if (name.includes('blocked') || name.includes('impediment')) {
      suggestions.statusMappings.blocked.push(status.name)
    } else if (category === 'new' || name.includes('to do') || name.includes('open') || name.includes('backlog')) {
      suggestions.statusMappings.todo.push(status.name)
    }
  })

  // Suggest priority mappings based on common names
  schema.priorities.forEach(priority => {
    const name = priority.name.toLowerCase()
    if (name.includes('highest') || name.includes('critical') || name.includes('blocker')) {
      suggestions.priorityMappings.critical.push(priority.name)
    } else if (name.includes('high') || name.includes('major')) {
      suggestions.priorityMappings.high.push(priority.name)
    } else if (name.includes('medium') || name.includes('normal')) {
      suggestions.priorityMappings.medium.push(priority.name)
    } else if (name.includes('low') || name.includes('minor') || name.includes('trivial') || name.includes('lowest')) {
      suggestions.priorityMappings.low.push(priority.name)
    }
  })

  // Suggest custom field mappings based on common patterns
  schema.customFields.forEach(field => {
    const name = field.name.toLowerCase()
    if (name.includes('acceptance') && name.includes('criteria')) {
      suggestions.customFieldSuggestions.push({
        field: field.id,
        mapping: 'acceptanceCriteria',
        reason: 'Field name suggests acceptance criteria'
      })
    } else if (name.includes('story') && name.includes('point')) {
      suggestions.customFieldSuggestions.push({
        field: field.id,
        mapping: 'storyPoints',
        reason: 'Field name suggests story points'
      })
    } else if (name.includes('epic')) {
      suggestions.customFieldSuggestions.push({
        field: field.id,
        mapping: 'epic',
        reason: 'Field name suggests epic link'
      })
    } else if (name.includes('sprint')) {
      suggestions.customFieldSuggestions.push({
        field: field.id,
        mapping: 'sprint',
        reason: 'Field name suggests sprint information'
      })
    } else if (name.includes('environment')) {
      suggestions.customFieldSuggestions.push({
        field: field.id,
        mapping: 'environment',
        reason: 'Field name suggests environment information'
      })
    } else if (name.includes('severity')) {
      suggestions.customFieldSuggestions.push({
        field: field.id,
        mapping: 'severity',
        reason: 'Field name suggests defect severity'
      })
    } else if (name.includes('root') && name.includes('cause')) {
      suggestions.customFieldSuggestions.push({
        field: field.id,
        mapping: 'rootCause',
        reason: 'Field name suggests root cause analysis'
      })
    } else if (name.includes('steps') && (name.includes('reproduce') || name.includes('repro'))) {
      suggestions.customFieldSuggestions.push({
        field: field.id,
        mapping: 'stepsToReproduce',
        reason: 'Field name suggests reproduction steps'
      })
    }
  })

  return suggestions
} 