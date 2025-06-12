import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Use environment variables instead of hardcoded values
    const jiraBaseUrl = process.env.JIRA_BASE_URL || 'https://your-company.atlassian.net';
    const jiraApiToken = process.env.JIRA_API_TOKEN;
    const jiraEmail = process.env.JIRA_EMAIL || 'your-email@company.com';
    
    if (!jiraApiToken) {
      return NextResponse.json({
        success: false,
        error: 'JIRA_API_TOKEN environment variable is not set'
      }, { status: 400 });
    }
    
    // Test basic connection - get server info
    const serverInfoResponse = await fetch(`${jiraBaseUrl}/rest/api/3/serverInfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!serverInfoResponse.ok) {
      const errorText = await serverInfoResponse.text();
      return NextResponse.json({
        success: false,
        error: `Server info failed: ${serverInfoResponse.status} - ${errorText}`,
        status: serverInfoResponse.status
      }, { status: 400 });
    }

    const serverInfo = await serverInfoResponse.json();

    // Test getting projects
    const projectsResponse = await fetch(`${jiraBaseUrl}/rest/api/3/project`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    let projects = [];
    if (projectsResponse.ok) {
      projects = await projectsResponse.json();
    }

    return NextResponse.json({
      success: true,
      message: 'Jira connection successful!',
      serverInfo: {
        version: serverInfo.version,
        versionNumbers: serverInfo.versionNumbers,
        deploymentType: serverInfo.deploymentType,
        buildNumber: serverInfo.buildNumber,
        serverTitle: serverInfo.serverTitle
      },
      projectCount: projects.length,
      availableProjects: projects.slice(0, 5).map((p: any) => ({
        key: p.key,
        name: p.name,
        projectTypeKey: p.projectTypeKey
      }))
    });

  } catch (error) {
    console.error('Jira connection test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 