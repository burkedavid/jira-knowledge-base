import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, email, apiToken } = await request.json()

    if (!baseUrl || !email || !apiToken) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: baseUrl, email, apiToken' 
        },
        { status: 400 }
      )
    }

    // Test connection by fetching user info
    const authString = Buffer.from(`${email}:${apiToken}`).toString('base64')
    
    // First, test authentication with myself endpoint
    const userResponse = await fetch(`${baseUrl}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      return NextResponse.json({
        success: false,
        error: `Authentication failed: ${userResponse.status} ${userResponse.statusText}. ${errorText}`,
        connectionTest: {
          baseUrl,
          email,
          authenticated: false
        }
      })
    }

    const userInfo = await userResponse.json()

    // If authentication successful, fetch projects
    const projectsResponse = await fetch(`${baseUrl}/rest/api/3/project`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!projectsResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch projects: ${projectsResponse.status} ${projectsResponse.statusText}`,
        connectionTest: {
          baseUrl,
          email,
          authenticated: true
        }
      })
    }

    const projects = await projectsResponse.json()

    return NextResponse.json({
      success: true,
      message: `Successfully connected as ${userInfo.displayName}`,
      connectionTest: {
        baseUrl,
        email,
        authenticated: true,
        user: userInfo.displayName
      },
      projects: projects.map((project: any) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        projectTypeKey: project.projectTypeKey,
        style: project.style,
        isPrivate: project.isPrivate || false
      }))
    })

  } catch (error) {
    console.error('Error testing Jira connection:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
} 