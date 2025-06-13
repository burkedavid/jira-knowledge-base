import { NextRequest, NextResponse } from 'next/server'
import { JiraConfigManager, JiraProjectConfig } from '@/lib/jira-config'
import { createJiraClient } from '@/lib/jira-client'

const configManager = new JiraConfigManager()

// Interface for user import configuration
interface UserImportConfig {
  id?: string
  projectKey: string
  formData: {
    jiraUrl: string
    projectKey: string
    username: string
    apiToken: string
    fromDate: string
    toDate: string
    batchSize: number
    delayBetweenBatches: number
  }
  jqlMappings: Array<{
    type: 'user_stories' | 'defects' | 'epics'
    label: string
    jql: string
    enabled: boolean
    count: number
  }>
  lastSaved: Date
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectKey = searchParams.get('projectKey')
    const action = searchParams.get('action')

    // Handle user config loading
    if (action === 'load-user-config') {
      if (!projectKey) {
        return NextResponse.json(
          { error: 'Project key is required' },
          { status: 400 }
        )
      }

      // For now, we'll use localStorage on the client side
      // In the future, this could be stored in the database with user authentication
      return NextResponse.json({ 
        message: 'User config loading handled on client side',
        projectKey 
      })
    }

    // Original project config functionality
    if (!projectKey) {
      return NextResponse.json(
        { error: 'Project key is required' },
        { status: 400 }
      )
    }

    const config = await configManager.getProjectConfig(projectKey)
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching Jira config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Handle user config saving
    if (action === 'save-user-config') {
      const { projectKey, formData, jqlMappings } = body
      
      if (!projectKey || !formData || !jqlMappings) {
        return NextResponse.json(
          { error: 'Missing required fields: projectKey, formData, jqlMappings' },
          { status: 400 }
        )
      }

      // For now, we'll return success and let the client handle localStorage
      // In the future, this could be stored in the database with user authentication
      return NextResponse.json({ 
        message: 'User config saved successfully',
        projectKey,
        timestamp: new Date().toISOString()
      })
    }

    // Original project config functionality
    const config: JiraProjectConfig = body

    // Validate required fields
    if (!config.projectKey || !config.projectName || !config.baseUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: projectKey, projectName, baseUrl' },
        { status: 400 }
      )
    }

    await configManager.saveProjectConfig(config)

    return NextResponse.json({ 
      message: 'Configuration saved successfully',
      config 
    })
  } catch (error) {
    console.error('Error saving Jira config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const config: JiraProjectConfig = await request.json()

    if (!config.projectKey) {
      return NextResponse.json(
        { error: 'Project key is required' },
        { status: 400 }
      )
    }

    // Check if config exists
    const existingConfig = await configManager.getProjectConfig(config.projectKey)
    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    // Update the configuration
    const updatedConfig = {
      ...existingConfig,
      ...config,
      updatedAt: new Date(),
    }

    await configManager.saveProjectConfig(updatedConfig)

    return NextResponse.json({ 
      message: 'Configuration updated successfully',
      config: updatedConfig 
    })
  } catch (error) {
    console.error('Error updating Jira config:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}

 