import { NextRequest, NextResponse } from 'next/server'
import { JiraConfigManager, JiraProjectConfig } from '@/lib/jira-config'
import { createJiraClient } from '@/lib/jira-client'

const configManager = new JiraConfigManager()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectKey = searchParams.get('projectKey')

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
    const config: JiraProjectConfig = await request.json()

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

export async function GET_ENV() {
  try {
    // Return Jira configuration from environment variables
    // Don't expose the API token for security
    return NextResponse.json({
      jiraUrl: process.env.JIRA_BASE_URL || 'https://your-company.atlassian.net',
      projectKey: process.env.JIRA_PROJECT_KEY || 'PROJ',
      username: process.env.JIRA_EMAIL || 'your-email@company.com',
      hasApiToken: !!process.env.JIRA_API_TOKEN, // Just indicate if it exists
    })
  } catch (error) {
    console.error('Error fetching Jira config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Jira configuration' },
      { status: 500 }
    )
  }
} 