import axios, { AxiosInstance } from 'axios'

export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
  projectKey?: string
}

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    description?: string
    issuetype: {
      name: string
    }
    status: {
      name: string
    }
    priority?: {
      name: string
    }
    assignee?: {
      displayName: string
      emailAddress: string
    }
    reporter?: {
      displayName: string
      emailAddress: string
    }
    created: string
    updated: string
    resolutiondate?: string
    resolution?: {
      name: string
    }
    components?: Array<{
      name: string
    }>
    customfield_10000?: string // Story points or acceptance criteria
  }
}

export interface JiraSearchResult {
  issues: JiraIssue[]
  total: number
  startAt: number
  maxResults: number
}

export class JiraClient {
  private client: AxiosInstance
  private config: JiraConfig

  constructor(config: JiraConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseUrl,
      auth: {
        username: config.email,
        password: config.apiToken,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/rest/api/3/myself')
      return true
    } catch (error) {
      console.error('Jira connection test failed:', error)
      return false
    }
  }

  async getProjects(): Promise<Array<{ key: string; name: string; id: string }>> {
    try {
      const response = await this.client.get('/rest/api/3/project')
      return response.data.map((project: any) => ({
        key: project.key,
        name: project.name,
        id: project.id,
      }))
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw new Error('Failed to fetch projects')
    }
  }

  async searchIssues(
    jql: string,
    startAt: number = 0,
    maxResults: number = 50
  ): Promise<JiraSearchResult> {
    try {
      const response = await this.client.post('/rest/api/3/search', {
        jql,
        startAt,
        maxResults,
        fields: [
          'summary',
          'description',
          'issuetype',
          'status',
          'priority',
          'assignee',
          'reporter',
          'created',
          'updated',
          'resolutiondate',
          'resolution',
          'components',
          'customfield_10000', // Common field for acceptance criteria
        ],
      })

      return response.data
    } catch (error) {
      console.error('Error searching issues:', error)
      throw new Error('Failed to search issues')
    }
  }

  async getIssueCount(jql: string): Promise<number> {
    try {
      const response = await this.client.post('/rest/api/3/search', {
        jql,
        startAt: 0,
        maxResults: 0,
      })

      return response.data.total
    } catch (error) {
      console.error('Error getting issue count:', error)
      throw new Error('Failed to get issue count')
    }
  }

  async getUserStories(
    projectKey: string,
    startAt: number = 0,
    maxResults: number = 50
  ): Promise<JiraSearchResult> {
    const jql = `project = "${projectKey}" AND issuetype in ("Story", "User Story", "Epic") ORDER BY created DESC`
    return this.searchIssues(jql, startAt, maxResults)
  }

  async getDefects(
    projectKey: string,
    startAt: number = 0,
    maxResults: number = 50
  ): Promise<JiraSearchResult> {
    const jql = `project = "${projectKey}" AND issuetype in ("Bug", "Defect") ORDER BY created DESC`
    return this.searchIssues(jql, startAt, maxResults)
  }

  async getUpdatedIssues(
    projectKey: string,
    since: Date,
    startAt: number = 0,
    maxResults: number = 50
  ): Promise<JiraSearchResult> {
    const sinceStr = since.toISOString().split('T')[0] // YYYY-MM-DD format
    const jql = `project = "${projectKey}" AND updated >= "${sinceStr}" ORDER BY updated DESC`
    return this.searchIssues(jql, startAt, maxResults)
  }

  // Rate limiting helper
  async withRateLimit<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limited, wait and retry
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60')
        console.log(`Rate limited, waiting ${retryAfter} seconds...`)
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        return operation()
      }
      throw error
    }
  }
}

export function createJiraClient(): JiraClient | null {
  const baseUrl = process.env.JIRA_BASE_URL
  const email = process.env.JIRA_EMAIL
  const apiToken = process.env.JIRA_API_TOKEN

  if (!baseUrl || !email || !apiToken) {
    console.warn('Jira configuration missing, client not available')
    return null
  }

  return new JiraClient({
    baseUrl,
    email,
    apiToken,
    projectKey: process.env.JIRA_PROJECT_KEY,
  })
} 