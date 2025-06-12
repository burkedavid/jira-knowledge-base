import { prisma } from './prisma'

export interface JiraFieldMapping {
  // Core fields
  summary: string
  description: string
  issueType: string
  status: string
  priority: string
  assignee: string
  reporter: string
  created: string
  updated: string
  resolved: string
  resolution: string
  
  // Custom fields (commonly used)
  acceptanceCriteria?: string
  storyPoints?: string
  epic?: string
  sprint?: string
  component?: string
  fixVersion?: string
  affectedVersion?: string
  environment?: string
  severity?: string
  rootCause?: string
  stepsToReproduce?: string
  
  // Organization-specific custom fields
  customFields?: Record<string, string>
}

export interface JiraIssueTypeMapping {
  userStoryTypes: string[]
  defectTypes: string[]
  epicTypes: string[]
  taskTypes: string[]
  // Allow custom mappings
  customTypes?: Record<string, 'user_story' | 'defect' | 'epic' | 'task'>
}

export interface JiraStatusMapping {
  // Map Jira statuses to standardized statuses
  todo: string[]
  inProgress: string[]
  done: string[]
  blocked: string[]
  // Custom status categories
  customStatuses?: Record<string, string[]>
}

export interface JiraPriorityMapping {
  critical: string[]
  high: string[]
  medium: string[]
  low: string[]
  // Custom priority mappings
  customPriorities?: Record<string, string[]>
}

export interface JiraProjectConfig {
  id: string
  projectKey: string
  projectName: string
  baseUrl: string
  
  // Field mappings
  fieldMappings: JiraFieldMapping
  
  // Issue type mappings
  issueTypeMappings: JiraIssueTypeMapping
  
  // Status mappings
  statusMappings: JiraStatusMapping
  
  // Priority mappings
  priorityMappings: JiraPriorityMapping
  
  // Workflow configuration
  workflowConfig: {
    // Which statuses indicate completion
    completedStatuses: string[]
    // Which statuses indicate active work
    activeStatuses: string[]
    // Which statuses indicate blocking issues
    blockedStatuses: string[]
  }
  
  // Import settings
  importSettings: {
    batchSize: number
    rateLimitDelay: number
    includeSubtasks: boolean
    includeComments: boolean
    includeAttachments: boolean
    dateRange?: {
      from?: string
      to?: string
    }
  }
  
  // Custom JQL filters
  customFilters: {
    userStoryFilter?: string
    defectFilter?: string
    excludeFilter?: string
  }
  
  createdAt: Date
  updatedAt: Date
}

// Default configuration for common Jira setups
export const DEFAULT_JIRA_CONFIGS: Record<string, Partial<JiraProjectConfig>> = {
  // Standard Atlassian Cloud setup
  'atlassian-cloud': {
    fieldMappings: {
      summary: 'summary',
      description: 'description',
      issueType: 'issuetype.name',
      status: 'status.name',
      priority: 'priority.name',
      assignee: 'assignee.displayName',
      reporter: 'reporter.displayName',
      created: 'created',
      updated: 'updated',
      resolved: 'resolutiondate',
      resolution: 'resolution.name',
      acceptanceCriteria: 'customfield_10000', // Common AC field
      storyPoints: 'customfield_10002',
      epic: 'customfield_10001',
      sprint: 'customfield_10003',
      component: 'components[0].name',
    },
    issueTypeMappings: {
      userStoryTypes: ['Story', 'User Story'],
      defectTypes: ['Bug', 'Defect'],
      epicTypes: ['Epic'],
      taskTypes: ['Task', 'Sub-task'],
    },
    statusMappings: {
      todo: ['To Do', 'Open', 'Backlog'],
      inProgress: ['In Progress', 'In Development', 'In Review'],
      done: ['Done', 'Closed', 'Resolved'],
      blocked: ['Blocked', 'Impediment'],
    },
    priorityMappings: {
      critical: ['Highest', 'Critical'],
      high: ['High'],
      medium: ['Medium'],
      low: ['Low', 'Lowest'],
    },
  },
  
  // Jira Server setup
  'jira-server': {
    fieldMappings: {
      summary: 'summary',
      description: 'description',
      issueType: 'issuetype.name',
      status: 'status.name',
      priority: 'priority.name',
      assignee: 'assignee.name',
      reporter: 'reporter.name',
      created: 'created',
      updated: 'updated',
      resolved: 'resolutiondate',
      resolution: 'resolution.name',
      component: 'components[0].name',
    },
    issueTypeMappings: {
      userStoryTypes: ['Story'],
      defectTypes: ['Bug'],
      epicTypes: ['Epic'],
      taskTypes: ['Task'],
    },
    statusMappings: {
      todo: ['Open', 'To Do'],
      inProgress: ['In Progress'],
      done: ['Resolved', 'Closed'],
      blocked: ['Blocked'],
    },
    priorityMappings: {
      critical: ['Blocker'],
      high: ['Critical'],
      medium: ['Major'],
      low: ['Minor', 'Trivial'],
    },
  },
  
  // Scaled Agile (SAFe) setup
  'safe-framework': {
    fieldMappings: {
      summary: 'summary',
      description: 'description',
      issueType: 'issuetype.name',
      status: 'status.name',
      priority: 'priority.name',
      assignee: 'assignee.displayName',
      reporter: 'reporter.displayName',
      created: 'created',
      updated: 'updated',
      resolved: 'resolutiondate',
      resolution: 'resolution.name',
      acceptanceCriteria: 'customfield_10000',
      storyPoints: 'customfield_10002',
      epic: 'customfield_10001',
      sprint: 'customfield_10003',
      component: 'components[0].name',
    },
    issueTypeMappings: {
      userStoryTypes: ['Story', 'Feature', 'Capability'],
      defectTypes: ['Bug', 'Defect'],
      epicTypes: ['Epic', 'Feature'],
      taskTypes: ['Task', 'Enabler'],
    },
    statusMappings: {
      todo: ['Backlog', 'Ready', 'To Do'],
      inProgress: ['In Progress', 'In Development', 'In Test'],
      done: ['Done', 'Accepted', 'Released'],
      blocked: ['Blocked', 'Impediment'],
    },
    priorityMappings: {
      critical: ['Highest', 'Critical'],
      high: ['High'],
      medium: ['Medium'],
      low: ['Low', 'Lowest'],
    },
  },
}

export class JiraConfigManager {
  async getProjectConfig(projectKey: string): Promise<JiraProjectConfig | null> {
    // Try to load from database first
    const config = await this.loadConfigFromDatabase(projectKey)
    if (config) {
      return config
    }
    
    // Fall back to default configuration
    return this.createDefaultConfig(projectKey)
  }
  
  async saveProjectConfig(config: JiraProjectConfig): Promise<void> {
    // Save configuration to database
    await prisma.jiraProjectConfig.upsert({
      where: { projectKey: config.projectKey },
      update: {
        projectName: config.projectName,
        baseUrl: config.baseUrl,
        configuration: JSON.stringify(config),
        updatedAt: new Date(),
      },
      create: {
        projectKey: config.projectKey,
        projectName: config.projectName,
        baseUrl: config.baseUrl,
        configuration: JSON.stringify(config),
      },
    })
  }
  
  private async loadConfigFromDatabase(projectKey: string): Promise<JiraProjectConfig | null> {
    try {
      const dbConfig = await prisma.jiraProjectConfig.findUnique({
        where: { projectKey },
      })
      
      if (dbConfig) {
        return JSON.parse(dbConfig.configuration) as JiraProjectConfig
      }
    } catch (error) {
      console.error('Error loading Jira config from database:', error)
    }
    
    return null
  }
  
  private createDefaultConfig(projectKey: string): JiraProjectConfig {
    const baseConfig = DEFAULT_JIRA_CONFIGS['atlassian-cloud']
    
    return {
      id: `config_${projectKey}`,
      projectKey,
      projectName: projectKey,
      baseUrl: process.env.JIRA_BASE_URL || '',
      fieldMappings: baseConfig.fieldMappings!,
      issueTypeMappings: baseConfig.issueTypeMappings!,
      statusMappings: baseConfig.statusMappings!,
      priorityMappings: baseConfig.priorityMappings!,
      workflowConfig: {
        completedStatuses: ['Done', 'Closed', 'Resolved'],
        activeStatuses: ['In Progress', 'In Development'],
        blockedStatuses: ['Blocked'],
      },
      importSettings: {
        batchSize: 50,
        rateLimitDelay: 1000,
        includeSubtasks: false,
        includeComments: false,
        includeAttachments: false,
      },
      customFilters: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
  
  async discoverProjectSchema(projectKey: string, jiraClient: any): Promise<{
    issueTypes: Array<{ id: string; name: string; description?: string }>
    statuses: Array<{ id: string; name: string; category: string }>
    priorities: Array<{ id: string; name: string }>
    customFields: Array<{ id: string; name: string; type: string }>
  }> {
    try {
      // Discover issue types
      const issueTypesResponse = await jiraClient.get(`/rest/api/3/project/${projectKey}`)
      const issueTypes = issueTypesResponse.data.issueTypes || []
      
      // Discover statuses
      const statusesResponse = await jiraClient.get('/rest/api/3/status')
      const statuses = statusesResponse.data || []
      
      // Discover priorities
      const prioritiesResponse = await jiraClient.get('/rest/api/3/priority')
      const priorities = prioritiesResponse.data || []
      
      // Discover custom fields by analyzing a sample of issues
      const sampleIssuesResponse = await jiraClient.post('/rest/api/3/search', {
        jql: `project = "${projectKey}"`,
        maxResults: 10,
        expand: ['schema'],
      })
      
      const customFields = this.extractCustomFields(sampleIssuesResponse.data)
      
      return {
        issueTypes: issueTypes.map((type: any) => ({
          id: type.id,
          name: type.name,
          description: type.description,
        })),
        statuses: statuses.map((status: any) => ({
          id: status.id,
          name: status.name,
          category: status.statusCategory?.name || 'Unknown',
        })),
        priorities: priorities.map((priority: any) => ({
          id: priority.id,
          name: priority.name,
        })),
        customFields,
      }
    } catch (error) {
      console.error('Error discovering project schema:', error)
      throw new Error('Failed to discover project schema')
    }
  }
  
  private extractCustomFields(searchResponse: any): Array<{ id: string; name: string; type: string }> {
    const customFields: Array<{ id: string; name: string; type: string }> = []
    
    if (searchResponse.issues && searchResponse.issues.length > 0) {
      const sampleIssue = searchResponse.issues[0]
      
      // Extract custom fields from the issue
      Object.keys(sampleIssue.fields).forEach(fieldKey => {
        if (fieldKey.startsWith('customfield_')) {
          // Try to get field name from schema or use a generic name
          const fieldName = this.getCustomFieldName(fieldKey, searchResponse.schema)
          const fieldType = this.getCustomFieldType(sampleIssue.fields[fieldKey])
          
          customFields.push({
            id: fieldKey,
            name: fieldName,
            type: fieldType,
          })
        }
      })
    }
    
    return customFields
  }
  
  private getCustomFieldName(fieldKey: string, schema?: any): string {
    if (schema && schema[fieldKey]) {
      return schema[fieldKey].name || fieldKey
    }
    return fieldKey
  }
  
  private getCustomFieldType(fieldValue: any): string {
    if (fieldValue === null || fieldValue === undefined) return 'unknown'
    if (typeof fieldValue === 'string') return 'string'
    if (typeof fieldValue === 'number') return 'number'
    if (typeof fieldValue === 'boolean') return 'boolean'
    if (Array.isArray(fieldValue)) return 'array'
    if (typeof fieldValue === 'object') return 'object'
    return 'unknown'
  }
  
  // Helper method to map Jira field value using configuration
  mapFieldValue(jiraIssue: any, fieldPath: string): any {
    const pathParts = fieldPath.split('.')
    let value = jiraIssue.fields
    
    for (const part of pathParts) {
      if (part.includes('[') && part.includes(']')) {
        // Handle array access like 'components[0].name'
        const [arrayField, indexStr] = part.split('[')
        const index = parseInt(indexStr.replace(']', ''))
        value = value?.[arrayField]?.[index]
      } else {
        value = value?.[part]
      }
      
      if (value === undefined || value === null) {
        break
      }
    }
    
    return value
  }
  
  // Helper method to normalize status using configuration
  normalizeStatus(jiraStatus: string, statusMappings: JiraStatusMapping): string {
    for (const [normalizedStatus, jiraStatuses] of Object.entries(statusMappings)) {
      if (jiraStatuses.includes(jiraStatus)) {
        return normalizedStatus
      }
    }
    
    // Check custom statuses
    if (statusMappings.customStatuses) {
      for (const [customStatus, jiraStatuses] of Object.entries(statusMappings.customStatuses)) {
        if (jiraStatuses.includes(jiraStatus)) {
          return customStatus
        }
      }
    }
    
    return jiraStatus // Return original if no mapping found
  }
  
  // Helper method to normalize priority using configuration
  normalizePriority(jiraPriority: string, priorityMappings: JiraPriorityMapping): string {
    for (const [normalizedPriority, jiraPriorities] of Object.entries(priorityMappings)) {
      if (jiraPriorities.includes(jiraPriority)) {
        return normalizedPriority
      }
    }
    
    // Check custom priorities
    if (priorityMappings.customPriorities) {
      for (const [customPriority, jiraPriorities] of Object.entries(priorityMappings.customPriorities)) {
        if (jiraPriorities.includes(jiraPriority)) {
          return customPriority
        }
      }
    }
    
    return jiraPriority // Return original if no mapping found
  }
  
  // Helper method to determine issue type category
  categorizeIssueType(issueType: string, issueTypeMappings: JiraIssueTypeMapping): 'user_story' | 'defect' | 'epic' | 'task' | 'unknown' {
    if (issueTypeMappings.userStoryTypes.includes(issueType)) return 'user_story'
    if (issueTypeMappings.defectTypes.includes(issueType)) return 'defect'
    if (issueTypeMappings.epicTypes.includes(issueType)) return 'epic'
    if (issueTypeMappings.taskTypes.includes(issueType)) return 'task'
    
    // Check custom mappings
    if (issueTypeMappings.customTypes && issueTypeMappings.customTypes[issueType]) {
      return issueTypeMappings.customTypes[issueType]
    }
    
    return 'unknown'
  }
} 