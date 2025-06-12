// Core entity types
export interface UserStory {
  id: string
  title: string
  description: string
  acceptanceCriteria?: string
  jiraId?: string
  jiraKey?: string
  priority?: string
  status?: string
  qualityScore?: number
  riskLevel?: string
  component?: string
  assignee?: string
  reporter?: string
  createdAt: Date
  updatedAt: Date
}

export interface Defect {
  id: string
  title: string
  description: string
  stepsToReproduce?: string
  rootCause?: string
  resolution?: string
  severity?: string
  priority?: string
  component?: string
  status?: string
  jiraId?: string
  jiraKey?: string
  assignee?: string
  reporter?: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
}

export interface TestCase {
  id: string
  title: string
  steps: string
  expectedResults: string
  sourceStoryId?: string
  generatedFrom?: 'manual' | 'ai_generated' | 'defect_based'
  affectedByChanges: boolean
  priority?: string
  status?: string
  lastExecuted?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  title: string
  content: string
  type: string
  version: string
  changelog?: string
  metadata?: string
  fileName?: string
  fileSize?: number
  createdAt: Date
  updatedAt: Date
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Import/Export types
export interface ImportJobStatus {
  id: string
  type: 'jira' | 'document'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'completed_with_errors'
  totalItems: number
  processedItems: number
  errors?: string[]
  startedAt: Date
  completedAt?: Date
}

export interface BatchImportProgress {
  jobId: string
  processed: number
  total: number
  status: string
  errors: string[]
}

// Analytics types
export interface DefectAnalytics {
  totalDefects: number
  openDefects: number
  resolvedDefects: number
  criticalDefects: number
  defectsByComponent: Record<string, number>
  defectsBySeverity: Record<string, number>
  avgResolutionTime: number
  trends: {
    period: string
    count: number
  }[]
}

export interface QualityMetrics {
  averageQualityScore: number
  highRiskStories: number
  storiesWithoutCriteria: number
  componentRiskScores: Record<string, number>
}

// Search and RAG types
export interface SearchResult {
  id: string
  title: string
  content: string
  type: 'user_story' | 'defect' | 'document' | 'test_case'
  similarity: number
  metadata?: Record<string, any>
}

export interface GeneratedTestCase {
  title: string
  steps: string[]
  expectedResults: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  category: string
  rationale: string
}

export interface RequirementAnalysis {
  qualityScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  issues: string[]
  suggestions: string[]
  missingElements: string[]
  confidence: number
}

// UI Component types
export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => any
}

export interface FilterOption {
  label: string
  value: string
  count?: number
}



// Form types
export interface JiraImportForm {
  projectKey: string
  includeUserStories: boolean
  includeDefects: boolean
  batchSize: number
}

export interface DocumentUploadForm {
  title: string
  file: File
  version?: string
  description?: string
}

export interface TestGenerationForm {
  userStoryId: string
  includeEdgeCases: boolean
  includeNegativeTests: boolean
  testTypes: string[]
}

// Notification types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: Date
  relatedId?: string
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: string
  variant?: 'primary' | 'secondary'
}

// Chart data types
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface TimeSeriesDataPoint {
  date: string
  value: number
  category?: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: Date
}

// Theme types
export interface ThemeConfig {
  mode: 'light' | 'dark'
  primaryColor: string
  accentColor: string
}

// User types
export interface User {
  id: string
  name?: string
  email?: string
  image?: string
  role: 'admin' | 'user' | 'viewer'
  createdAt: Date
  updatedAt: Date
}

// Settings types
export interface AppSettings {
  jiraIntegration: {
    enabled: boolean
    baseUrl?: string
    projectKey?: string
  }
  aiSettings: {
    model: string
    temperature: number
    maxTokens: number
  }
  notifications: {
    emailEnabled: boolean
    browserEnabled: boolean
    frequency: 'immediate' | 'daily' | 'weekly'
  }
} 