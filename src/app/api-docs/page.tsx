'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronRight, Copy, Check, ExternalLink } from 'lucide-react'

interface APIEndpoint {
  method: string
  path: string
  summary: string
  description: string
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Response[]
  tags: string[]
  examples?: Example[]
}

interface Parameter {
  name: string
  in: 'query' | 'path' | 'header'
  required: boolean
  type: string
  description: string
  example?: any
}

interface RequestBody {
  required: boolean
  contentType: string
  schema: any
  example?: any
}

interface Response {
  status: number
  description: string
  schema?: any
  example?: any
}

interface Example {
  title: string
  description: string
  request?: any
  response?: any
}

const API_ENDPOINTS: APIEndpoint[] = [
  // User Stories API
  {
    method: 'GET',
    path: '/api/user-stories',
    summary: 'Get User Stories',
    description: 'Retrieve user stories with filtering, pagination, and search capabilities',
    parameters: [
      { name: 'limit', in: 'query', required: false, type: 'integer', description: 'Number of items to return (default: 50)', example: 50 },
      { name: 'offset', in: 'query', required: false, type: 'integer', description: 'Number of items to skip (default: 0)', example: 0 },
      { name: 'search', in: 'query', required: false, type: 'string', description: 'Search in title, description, or Jira key', example: 'authentication' },
      { name: 'component', in: 'query', required: false, type: 'string', description: 'Filter by component', example: 'Authentication' },
      { name: 'priority', in: 'query', required: false, type: 'string', description: 'Filter by priority', example: 'High' },
      { name: 'status', in: 'query', required: false, type: 'string', description: 'Filter by status', example: 'In Progress' }
    ],
    responses: [
      {
        status: 200,
        description: 'Successful response',
        example: {
          userStories: [
            {
              id: "story-123",
              title: "User Authentication",
              description: "As a user, I want to log in securely...",
              acceptanceCriteria: "Given valid credentials...",
              jiraKey: "PROJ-123",
              priority: "High",
              status: "In Progress",
              component: "Authentication",
              testCaseCount: 5,
              latestQualityScore: 8.5
            }
          ],
          total: 150,
          limit: 50,
          offset: 0,
          hasMore: true
        }
      }
    ],
    tags: ['User Stories']
  },
  {
    method: 'POST',
    path: '/api/user-stories',
    summary: 'Create User Story',
    description: 'Create a new user story',
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['title', 'description'],
        properties: {
          title: { type: 'string', description: 'Story title' },
          description: { type: 'string', description: 'Story description' },
          acceptanceCriteria: { type: 'string', description: 'Acceptance criteria' },
          priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
          status: { type: 'string', default: 'To Do' },
          component: { type: 'string', description: 'Component name' },
          jiraKey: { type: 'string', description: 'Jira issue key' }
        }
      },
      example: {
        title: "User Authentication",
        description: "As a user, I want to log in securely so that I can access my account",
        acceptanceCriteria: "Given valid credentials, when I log in, then I should be authenticated",
        priority: "High",
        component: "Authentication",
        jiraKey: "PROJ-123"
      }
    },
    responses: [
      {
        status: 201,
        description: 'User story created successfully',
        example: {
          id: "story-123",
          title: "User Authentication",
          createdAt: "2025-01-27T10:00:00Z"
        }
      }
    ],
    tags: ['User Stories']
  },

  // Test Cases API
  {
    method: 'GET',
    path: '/api/test-cases',
    summary: 'Get Test Cases',
    description: 'Retrieve test cases with filtering and pagination',
    parameters: [
      { name: 'limit', in: 'query', required: false, type: 'integer', description: 'Number of items to return', example: 50 },
      { name: 'offset', in: 'query', required: false, type: 'integer', description: 'Number of items to skip', example: 0 },
      { name: 'userStoryId', in: 'query', required: false, type: 'string', description: 'Filter by user story ID', example: 'story-123' },
      { name: 'priority', in: 'query', required: false, type: 'string', description: 'Filter by priority', example: 'High' }
    ],
    responses: [
      {
        status: 200,
        description: 'Successful response',
        example: {
          testCases: [
            {
              id: "tc-123",
              title: "Valid Login Test",
              description: "Test successful login with valid credentials",
              testSteps: "1. Navigate to login page\n2. Enter valid credentials\n3. Click login",
              expectedResult: "User should be logged in successfully",
              priority: "High",
              category: "Positive",
              userStoryId: "story-123"
            }
          ],
          total: 75,
          hasMore: true
        }
      }
    ],
    tags: ['Test Cases']
  },

  // Generate Test Cases API
  {
    method: 'POST',
    path: '/api/generate/test-cases',
    summary: 'Generate Test Cases with AI',
    description: 'Generate comprehensive test cases from user stories using Claude Sonnet 4 with RAG context',
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        properties: {
          userStoryId: { type: 'string', description: 'ID of user story to generate tests for' },
          userStory: { type: 'object', description: 'Direct user story object (alternative to userStoryId)' },
          testTypes: { type: 'array', items: { type: 'string' }, default: ['positive', 'negative', 'edge'], description: 'Types of tests to generate' },
          industryContext: { type: 'string', default: 'comprehensive', description: 'Industry context for test scenarios' },
          modelId: { type: 'string', description: 'Claude model ID to use' }
        }
      },
      example: {
        userStoryId: "story-123",
        testTypes: ["positive", "negative", "edge"],
        industryContext: "field-usage",
        modelId: "anthropic.claude-sonnet-4-20250514-v1:0"
      }
    },
    responses: [
      {
        status: 200,
        description: 'Test cases generated successfully',
        example: {
          testCases: {
            positive: [
              {
                id: "TC-001",
                title: "Valid User Login",
                priority: "High",
                preconditions: "User has valid account",
                testSteps: "1. Navigate to login\n2. Enter credentials\n3. Click login",
                expectedResult: "User logged in successfully"
              }
            ],
            negative: [],
            edge: []
          },
          ragContext: {
            historicalDefects: 5,
            relatedUserStories: 3,
            existingTestCases: 2,
            technicalDocs: 1
          },
          metadata: {
            modelUsed: "Claude Sonnet 4",
            generationTime: "2.3s",
            industryContext: "field-usage"
          }
        }
      }
    ],
    tags: ['AI Generation', 'Test Cases']
  },

  // Defects API
  {
    method: 'GET',
    path: '/api/defects',
    summary: 'Get Defects',
    description: 'Retrieve defects with filtering and search capabilities',
    parameters: [
      { name: 'limit', in: 'query', required: false, type: 'integer', description: 'Number of items to return', example: 50 },
      { name: 'search', in: 'query', required: false, type: 'string', description: 'Search in title or description', example: 'login error' },
      { name: 'severity', in: 'query', required: false, type: 'string', description: 'Filter by severity', example: 'Critical' },
      { name: 'status', in: 'query', required: false, type: 'string', description: 'Filter by status', example: 'Open' },
      { name: 'component', in: 'query', required: false, type: 'string', description: 'Filter by component', example: 'Authentication' }
    ],
    responses: [
      {
        status: 200,
        description: 'Successful response',
        example: {
          defects: [
            {
              id: "defect-123",
              title: "Login fails with special characters",
              description: "Users cannot login when password contains special characters",
              severity: "High",
              status: "Open",
              component: "Authentication",
              rootCause: "Input validation issue",
              jiraKey: "BUG-456"
            }
          ],
          total: 89
        }
      }
    ],
    tags: ['Defects']
  },

  // Analytics API
  {
    method: 'GET',
    path: '/api/analytics/defects',
    summary: 'Get Defect Analytics',
    description: 'Comprehensive defect analytics with trends, patterns, and risk assessment',
    parameters: [
      { name: 'timeframe', in: 'query', required: false, type: 'string', description: 'Time period for analysis', example: '30d' },
      { name: 'component', in: 'query', required: false, type: 'string', description: 'Filter by component', example: 'Authentication' }
    ],
    responses: [
      {
        status: 200,
        description: 'Analytics data',
        example: {
          totalDefects: 89,
          riskScore: 45,
          defectsBySeverity: [
            { severity: "Critical", _count: { id: 5 } },
            { severity: "High", _count: { id: 15 } }
          ],
          componentHotspots: [
            { component: "Authentication", defectCount: 12, riskLevel: "High" }
          ],
          monthlyTrends: [
            { period: "2025-01", count: 8, critical: 1 }
          ],
          defectPatterns: [
            { rootCause: "Input validation", _count: { id: 8 } }
          ]
        }
      }
    ],
    tags: ['Analytics', 'Defects']
  },

  // Search APIs
  {
    method: 'POST',
    path: '/api/search/rag',
    summary: 'RAG Knowledge Search',
    description: 'Semantic search with AI-powered answers using Claude Sonnet 4 and vector embeddings',
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', description: 'Natural language search query' },
          maxResults: { type: 'integer', default: 10, description: 'Maximum number of sources to include' },
          includeTypes: { type: 'array', items: { type: 'string' }, description: 'Content types to search' },
          threshold: { type: 'number', default: 0.1, description: 'Similarity threshold (0-1)' }
        }
      },
      example: {
        query: "How does user authentication work in the mobile app?",
        maxResults: 10,
        includeTypes: ["user_story", "document"],
        threshold: 0.3
      }
    },
    responses: [
      {
        status: 200,
        description: 'AI-powered search results',
        example: {
          answer: "Based on your knowledge base, user authentication in the mobile app works through...",
          sources: [
            {
              id: "story-123",
              type: "user_story",
              title: "USER_STORY: story-123",
              content: "As a mobile user, I want to authenticate...",
              similarity: 0.85
            }
          ],
          confidence: 0.82,
          totalSources: 5,
          searchDetails: {
            threshold: 0.3,
            typesSearched: ["user_story", "document"],
            avgSimilarity: 0.75
          }
        }
      }
    ],
    tags: ['Search', 'AI', 'RAG']
  },

  {
    method: 'POST',
    path: '/api/search/semantic',
    summary: 'Semantic Vector Search',
    description: 'Direct semantic search using vector embeddings without AI interpretation',
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'integer', default: 20, description: 'Number of results to return' },
          threshold: { type: 'number', default: 0.3, description: 'Similarity threshold' },
          sourceTypes: { type: 'array', items: { type: 'string' }, description: 'Content types to search' }
        }
      }
    },
    responses: [
      {
        status: 200,
        description: 'Vector search results',
        example: {
          results: [
            {
              sourceId: "story-123",
              sourceType: "user_story",
              content: "User authentication functionality...",
              similarity: 0.85,
              metadata: { title: "User Login Story" }
            }
          ],
          totalResults: 15,
          searchQuery: "authentication",
          threshold: 0.3
        }
      }
    ],
    tags: ['Search', 'Vector']
  },

  // Import APIs
  {
    method: 'POST',
    path: '/api/import/jira-batch',
    summary: 'Batch Import from Jira',
    description: 'Import user stories, defects, and epics from Jira with batch processing and progress tracking',
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['jiraUrl', 'projectKey', 'username', 'apiToken'],
        properties: {
          jiraUrl: { type: 'string', description: 'Jira instance URL' },
          projectKey: { type: 'string', description: 'Jira project key' },
          username: { type: 'string', description: 'Jira username' },
          apiToken: { type: 'string', description: 'Jira API token' },
          importOptions: {
            type: 'object',
            properties: {
              userStories: { type: 'boolean', default: true },
              defects: { type: 'boolean', default: true },
              epics: { type: 'boolean', default: false }
            }
          },
          batchSettings: {
            type: 'object',
            properties: {
              batchSize: { type: 'integer', default: 50 },
              delayBetweenBatches: { type: 'integer', default: 1000 }
            }
          }
        }
      },
      example: {
        jiraUrl: "https://company.atlassian.net",
        projectKey: "PROJ",
        username: "user@company.com",
        apiToken: "ATATT3xFfGF0...",
        importOptions: {
          userStories: true,
          defects: true,
          epics: false
        },
        batchSettings: {
          batchSize: 50,
          delayBetweenBatches: 1000
        }
      }
    },
    responses: [
      {
        status: 200,
        description: 'Import job started',
        example: {
          message: "Import job started",
          jobId: "job-123",
          status: "pending"
        }
      }
    ],
    tags: ['Import', 'Jira']
  },

  // Requirements Analysis API
  {
    method: 'POST',
    path: '/api/analyze/requirements',
    summary: 'Analyze Requirements Quality',
    description: 'AI-powered analysis of user story quality with scoring and improvement suggestions',
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['userStoryId'],
        properties: {
          userStoryId: { type: 'string', description: 'ID of user story to analyze' },
          modelId: { type: 'string', description: 'Claude model to use for analysis' }
        }
      },
      example: {
        userStoryId: "story-123",
        modelId: "anthropic.claude-sonnet-4-20250514-v1:0"
      }
    },
    responses: [
      {
        status: 200,
        description: 'Quality analysis results',
        example: {
          overallScore: 8.5,
          scores: {
            clarity: 9,
            completeness: 8,
            testability: 8,
            acceptanceCriteria: 9
          },
          strengths: [
            "Clear user persona and goal",
            "Well-defined acceptance criteria"
          ],
          improvements: [
            "Add more specific error handling scenarios",
            "Include performance requirements"
          ],
          riskFactors: [
            {
              category: "Technical Complexity",
              level: "Medium",
              description: "Integration with multiple systems"
            }
          ]
        }
      }
    ],
    tags: ['Analysis', 'AI', 'Requirements']
  },

  // Embeddings APIs
  {
    method: 'GET',
    path: '/api/embeddings/stats',
    summary: 'Get Embeddings Statistics',
    description: 'Get statistics about vector embeddings in the system',
    responses: [
      {
        status: 200,
        description: 'Embeddings statistics',
        example: {
          total: 1250,
          byType: {
            user_story: 450,
            defect: 300,
            document: 250,
            document_section: 250
          },
          lastGenerated: "2025-01-27T10:00:00Z",
          model: "amazon.titan-embed-text-v2:0"
        }
      }
    ],
    tags: ['Embeddings', 'Statistics']
  },

  {
    method: 'POST',
    path: '/api/embeddings/generate',
    summary: 'Generate Embeddings',
    description: 'Generate vector embeddings for content using AWS Titan',
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        properties: {
          sourceTypes: { type: 'array', items: { type: 'string' }, description: 'Content types to generate embeddings for' },
          batchSize: { type: 'integer', default: 10, description: 'Batch size for processing' }
        }
      },
      example: {
        sourceTypes: ["user_story", "defect"],
        batchSize: 10
      }
    },
    responses: [
      {
        status: 200,
        description: 'Embeddings generation started',
        example: {
          message: "Embeddings generation started",
          totalItems: 750,
          estimatedTime: "5-10 minutes"
        }
      }
    ],
    tags: ['Embeddings', 'Generation']
  },

  // Documents API
  {
    method: 'GET',
    path: '/api/documents',
    summary: 'Get Documents',
    description: 'Retrieve uploaded documents with metadata',
    parameters: [
      { name: 'limit', in: 'query', required: false, type: 'integer', description: 'Number of items to return', example: 50 },
      { name: 'search', in: 'query', required: false, type: 'string', description: 'Search in filename or content', example: 'requirements' }
    ],
    responses: [
      {
        status: 200,
        description: 'Documents list',
        example: {
          documents: [
            {
              id: "doc-123",
              filename: "requirements.pdf",
              originalName: "System Requirements v2.1.pdf",
              mimeType: "application/pdf",
              size: 2048576,
              uploadedAt: "2025-01-27T10:00:00Z",
              sectionsCount: 15
            }
          ],
          total: 25
        }
      }
    ],
    tags: ['Documents']
  },

  // Settings APIs
  {
    method: 'GET',
    path: '/api/settings/product-context',
    summary: 'Get Product Context Settings',
    description: 'Retrieve product context configuration including quality threshold settings',
    responses: [
      {
        status: 200,
        description: 'Product context settings',
        example: {
          productName: "Fusion Live",
          description: "Idox FusionLive is a secure, cloud‑based engineering document management system...",
          industry: "Engineering & Construction",
          userTypes: ["EPCs", "Owner-operators", "Contractors", "Field teams"],
          keyFeatures: ["Document management", "Version control", "Automated workflows"],
          securityStandards: ["ISO 27001", "Cloud security", "Data encryption"],
          qualityThreshold: 7
        }
      }
    ],
    tags: ['Settings']
  },
  {
    method: 'POST',
    path: '/api/settings/product-context',
    summary: 'Update Product Context Settings',
    description: 'Update product context configuration including quality threshold for test case generation',
    requestBody: {
      required: true,
      contentType: 'application/json',
      schema: {
        type: 'object',
        required: ['productName', 'description', 'industry'],
        properties: {
          productName: { type: 'string', description: 'Product name' },
          description: { type: 'string', description: 'Product description' },
          industry: { type: 'string', description: 'Industry sector' },
          userTypes: { type: 'array', items: { type: 'string' }, description: 'User types and roles' },
          keyFeatures: { type: 'array', items: { type: 'string' }, description: 'Key product features' },
          securityStandards: { type: 'array', items: { type: 'string' }, description: 'Security standards' },
          qualityThreshold: { type: 'integer', minimum: 1, maximum: 10, description: 'Minimum quality score for test case generation (1-10)' }
        }
      },
      example: {
        productName: "Fusion Live",
        description: "Engineering document management system",
        industry: "Engineering & Construction",
        userTypes: ["Engineers", "Project managers"],
        keyFeatures: ["Document management", "Version control"],
        securityStandards: ["ISO 27001"],
        qualityThreshold: 7
      }
    },
    responses: [
      {
        status: 200,
        description: 'Settings updated successfully',
        example: {
          success: true,
          context: {
            productName: "Fusion Live",
            qualityThreshold: 7
          }
        }
      }
    ],
    tags: ['Settings']
  },
  {
    method: 'GET',
    path: '/api/settings/quality-threshold',
    summary: 'Get Quality Threshold Setting',
    description: 'Get the minimum quality score threshold for test case generation warnings',
    responses: [
      {
        status: 200,
        description: 'Quality threshold setting',
        example: {
          qualityThreshold: 7
        }
      }
    ],
    tags: ['Settings']
  },

  // Health Check API
  {
    method: 'GET',
    path: '/api/health',
    summary: 'Health Check',
    description: 'Check system health and component status',
    responses: [
      {
        status: 200,
        description: 'System health status',
        example: {
          status: "healthy",
          timestamp: "2025-01-27T10:00:00Z",
          components: {
            database: "healthy",
            aws_bedrock: "healthy",
            embeddings: "healthy"
          },
          version: "1.0.0"
        }
      }
    ],
    tags: ['System']
  }
]

const API_TAGS = [
  { name: 'User Stories', description: 'Manage user stories and requirements' },
  { name: 'Test Cases', description: 'Test case management and operations' },
  { name: 'Defects', description: 'Defect tracking and management' },
  { name: 'AI Generation', description: 'AI-powered content generation using Claude Sonnet 4' },
  { name: 'Analysis', description: 'Quality analysis and insights' },
  { name: 'Search', description: 'Search and discovery capabilities' },
  { name: 'RAG', description: 'Retrieval-Augmented Generation features' },
  { name: 'Vector', description: 'Vector embeddings and semantic search' },
  { name: 'Analytics', description: 'Analytics and reporting' },
  { name: 'Import', description: 'Data import and integration' },
  { name: 'Jira', description: 'Jira integration features' },
  { name: 'Embeddings', description: 'Vector embeddings management' },
  { name: 'Documents', description: 'Document management' },
  { name: 'Settings', description: 'Configuration and settings management' },
  { name: 'System', description: 'System utilities and health checks' }
]

export default function APIDocsPage() {
  const [selectedTag, setSelectedTag] = useState<string>('All')
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())
  const [copiedText, setCopiedText] = useState<string>('')

  const filteredEndpoints = selectedTag === 'All' 
    ? API_ENDPOINTS 
    : API_ENDPOINTS.filter(endpoint => endpoint.tags.includes(selectedTag))

  const toggleEndpoint = (endpointKey: string) => {
    const newExpanded = new Set(expandedEndpoints)
    if (newExpanded.has(endpointKey)) {
      newExpanded.delete(endpointKey)
    } else {
      newExpanded.add(endpointKey)
    }
    setExpandedEndpoints(newExpanded)
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label)
      setTimeout(() => setCopiedText(''), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'POST': return 'bg-green-100 text-green-800 border-green-200'
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/settings" className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Settings
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                API Documentation
              </h1>
              <a
                href="https://swagger.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Swagger-style
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            RAG Knowledge Base API
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Comprehensive REST API for the RAG Knowledge Base platform. This API provides endpoints for managing user stories, 
            generating test cases with AI, analyzing requirements quality, searching knowledge with semantic understanding, 
            and importing data from Jira.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI-Powered</h3>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Uses Claude Sonnet 4 for intelligent test generation and analysis
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100">RAG Technology</h3>
              <p className="text-sm text-green-700 dark:text-green-200">
                Retrieval-Augmented Generation with vector embeddings
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Jira Integration</h3>
              <p className="text-sm text-purple-700 dark:text-purple-200">
                Seamless import and sync with Jira projects
              </p>
            </div>
          </div>
        </div>

        {/* Tag Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('All')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTag === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All ({API_ENDPOINTS.length})
            </button>
            {API_TAGS.map(tag => {
              const count = API_ENDPOINTS.filter(endpoint => endpoint.tags.includes(tag.name)).length
              return (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(tag.name)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                  title={tag.description}
                >
                  {tag.name} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="space-y-4">
          {filteredEndpoints.map((endpoint, index) => {
            const endpointKey = `${endpoint.method}-${endpoint.path}`
            const isExpanded = expandedEndpoints.has(endpointKey)
            
            return (
              <div key={endpointKey} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {/* Endpoint Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleEndpoint(endpointKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                        {endpoint.path}
                      </code>
                      <span className="text-gray-600 dark:text-gray-300">
                        {endpoint.summary}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {endpoint.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Endpoint Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {endpoint.description}
                    </p>

                    {/* Parameters */}
                    {endpoint.parameters && endpoint.parameters.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Parameters</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">In</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Required</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {endpoint.parameters.map((param, paramIndex) => (
                                <tr key={paramIndex}>
                                  <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">{param.name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{param.in}</td>
                                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{param.type}</td>
                                  <td className="px-4 py-2 text-sm">
                                    {param.required ? (
                                      <span className="text-red-600 dark:text-red-400">Yes</span>
                                    ) : (
                                      <span className="text-gray-400">No</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Request Body */}
                    {endpoint.requestBody && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Request Body</h4>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Content-Type: {endpoint.requestBody.contentType}
                              {endpoint.requestBody.required && <span className="text-red-600 dark:text-red-400 ml-2">Required</span>}
                            </span>
                            <button
                              onClick={() => copyToClipboard(JSON.stringify(endpoint.requestBody?.example, null, 2), `${endpointKey}-request`)}
                              className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              {copiedText === `${endpointKey}-request` ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                              Copy
                            </button>
                          </div>
                          {endpoint.requestBody.example && (
                            <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                              {JSON.stringify(endpoint.requestBody.example, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Responses */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Responses</h4>
                      {endpoint.responses.map((response, responseIndex) => (
                        <div key={responseIndex} className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                response.status >= 200 && response.status < 300 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : response.status >= 400 
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                {response.status}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-300">{response.description}</span>
                            </div>
                            {response.example && (
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2), `${endpointKey}-response-${response.status}`)}
                                className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                {copiedText === `${endpointKey}-response-${response.status}` ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                Copy
                              </button>
                            )}
                          </div>
                          {response.example && (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                              <pre className="text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                                {JSON.stringify(response.example, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
          <p>Generated from codebase analysis • {API_ENDPOINTS.length} endpoints documented</p>
          <p className="text-sm mt-2">
            Base URL: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">http://localhost:3000</code>
          </p>
        </div>
      </main>
    </div>
  )
}