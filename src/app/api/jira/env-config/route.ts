import { NextResponse } from 'next/server'

export async function GET() {
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
    console.error('Error fetching Jira env config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Jira configuration' },
      { status: 500 }
    )
  }
} 