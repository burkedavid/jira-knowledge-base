import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface RAGConfig {
  searchTypes: {
    defects: boolean
    userStories: boolean
    testCases: boolean
    documents: boolean
  }
  maxResults: {
    defects: number
    userStories: number
    testCases: number
    documents: number
  }
  similarityThresholds: {
    defects: number
    userStories: number
    testCases: number
    documents: number
  }
  contentLimits: {
    maxItemLength: number
    maxTotalRAGLength: number
    enableSmartTruncation: boolean
  }
  relevanceFiltering: {
    enabled: boolean
    minKeywordMatches: number
    minStoryKeywordMatches: number
    keywordBoostTerms: string[]
  }
  performance: {
    searchTimeout: number
    enableParallelSearch: boolean
    cacheResults: boolean
  }
}

// Default RAG configuration
const DEFAULT_RAG_CONFIG: RAGConfig = {
  searchTypes: {
    defects: true,
    userStories: false,
    testCases: true,
    documents: false
  },
  maxResults: {
    defects: 2,
    userStories: 2,
    testCases: 2,
    documents: 1
  },
  similarityThresholds: {
    defects: 0.8,
    userStories: 0.75,
    testCases: 0.8,
    documents: 0.85
  },
  contentLimits: {
    maxItemLength: 200,
    maxTotalRAGLength: 800,
    enableSmartTruncation: true
  },
  relevanceFiltering: {
    enabled: true,
    minKeywordMatches: 1,
    minStoryKeywordMatches: 2,
    keywordBoostTerms: [
      'test', 'defect', 'bug', 'issue', 'error', 'validation', 
      'field', 'user', 'system', 'authentication', 'authorization',
      'ui', 'interface', 'performance', 'security', 'integration'
    ]
  },
  performance: {
    searchTimeout: 45,
    enableParallelSearch: true,
    cacheResults: false
  }
}

async function loadRAGConfig(): Promise<RAGConfig> {
  try {
    const configFile = path.join(process.cwd(), 'data', 'rag-config.json')
    const data = await fs.readFile(configFile, 'utf-8')
    const config = JSON.parse(data)
    
    // Merge with defaults to ensure all properties exist
    return {
      ...DEFAULT_RAG_CONFIG,
      ...config,
      searchTypes: { ...DEFAULT_RAG_CONFIG.searchTypes, ...config.searchTypes },
      maxResults: { ...DEFAULT_RAG_CONFIG.maxResults, ...config.maxResults },
      similarityThresholds: { ...DEFAULT_RAG_CONFIG.similarityThresholds, ...config.similarityThresholds },
      contentLimits: { ...DEFAULT_RAG_CONFIG.contentLimits, ...config.contentLimits },
      relevanceFiltering: { ...DEFAULT_RAG_CONFIG.relevanceFiltering, ...config.relevanceFiltering },
      performance: { ...DEFAULT_RAG_CONFIG.performance, ...config.performance }
    }
  } catch (error) {
    console.log('RAG config file not found, using defaults')
    return DEFAULT_RAG_CONFIG
  }
}

async function saveRAGConfig(config: RAGConfig): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), 'data')
    const configFile = path.join(dataDir, 'rag-config.json')
    
    // Ensure data directory exists
    try {
      await fs.mkdir(dataDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
    
    await fs.writeFile(configFile, JSON.stringify(config, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save RAG config:', error)
    throw new Error('Failed to save RAG configuration')
  }
}

// GET /api/settings/rag-config
export async function GET() {
  try {
    const config = await loadRAGConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error loading RAG config:', error)
    return NextResponse.json(
      { error: 'Failed to load RAG configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/rag-config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the configuration structure
    const config: RAGConfig = {
      searchTypes: {
        defects: body.searchTypes?.defects ?? DEFAULT_RAG_CONFIG.searchTypes.defects,
        userStories: body.searchTypes?.userStories ?? DEFAULT_RAG_CONFIG.searchTypes.userStories,
        testCases: body.searchTypes?.testCases ?? DEFAULT_RAG_CONFIG.searchTypes.testCases,
        documents: body.searchTypes?.documents ?? DEFAULT_RAG_CONFIG.searchTypes.documents
      },
      maxResults: {
        defects: Math.max(0, Math.min(10, body.maxResults?.defects ?? DEFAULT_RAG_CONFIG.maxResults.defects)),
        userStories: Math.max(0, Math.min(10, body.maxResults?.userStories ?? DEFAULT_RAG_CONFIG.maxResults.userStories)),
        testCases: Math.max(0, Math.min(10, body.maxResults?.testCases ?? DEFAULT_RAG_CONFIG.maxResults.testCases)),
        documents: Math.max(0, Math.min(10, body.maxResults?.documents ?? DEFAULT_RAG_CONFIG.maxResults.documents))
      },
      similarityThresholds: {
        defects: Math.max(0.0, Math.min(1.0, body.similarityThresholds?.defects ?? DEFAULT_RAG_CONFIG.similarityThresholds.defects)),
        userStories: Math.max(0.0, Math.min(1.0, body.similarityThresholds?.userStories ?? DEFAULT_RAG_CONFIG.similarityThresholds.userStories)),
        testCases: Math.max(0.0, Math.min(1.0, body.similarityThresholds?.testCases ?? DEFAULT_RAG_CONFIG.similarityThresholds.testCases)),
        documents: Math.max(0.0, Math.min(1.0, body.similarityThresholds?.documents ?? DEFAULT_RAG_CONFIG.similarityThresholds.documents))
      },
      contentLimits: {
        maxItemLength: Math.max(50, Math.min(1000, body.contentLimits?.maxItemLength ?? DEFAULT_RAG_CONFIG.contentLimits.maxItemLength)),
        maxTotalRAGLength: Math.max(100, Math.min(5000, body.contentLimits?.maxTotalRAGLength ?? DEFAULT_RAG_CONFIG.contentLimits.maxTotalRAGLength)),
        enableSmartTruncation: body.contentLimits?.enableSmartTruncation ?? DEFAULT_RAG_CONFIG.contentLimits.enableSmartTruncation
      },
      relevanceFiltering: {
        enabled: body.relevanceFiltering?.enabled ?? DEFAULT_RAG_CONFIG.relevanceFiltering.enabled,
        minKeywordMatches: Math.max(0, Math.min(10, body.relevanceFiltering?.minKeywordMatches ?? DEFAULT_RAG_CONFIG.relevanceFiltering.minKeywordMatches)),
        minStoryKeywordMatches: Math.max(0, Math.min(10, body.relevanceFiltering?.minStoryKeywordMatches ?? DEFAULT_RAG_CONFIG.relevanceFiltering.minStoryKeywordMatches)),
        keywordBoostTerms: Array.isArray(body.relevanceFiltering?.keywordBoostTerms) 
          ? body.relevanceFiltering.keywordBoostTerms.filter((term: any) => typeof term === 'string' && term.length > 0)
          : DEFAULT_RAG_CONFIG.relevanceFiltering.keywordBoostTerms
      },
      performance: {
        searchTimeout: Math.max(10, Math.min(120, body.performance?.searchTimeout ?? DEFAULT_RAG_CONFIG.performance.searchTimeout)),
        enableParallelSearch: body.performance?.enableParallelSearch ?? DEFAULT_RAG_CONFIG.performance.enableParallelSearch,
        cacheResults: body.performance?.cacheResults ?? DEFAULT_RAG_CONFIG.performance.cacheResults
      }
    }
    
    await saveRAGConfig(config)
    
    return NextResponse.json({
      success: true,
      message: 'RAG configuration updated successfully',
      config
    })
  } catch (error) {
    console.error('Error updating RAG config:', error)
    return NextResponse.json(
      { error: 'Failed to update RAG configuration' },
      { status: 500 }
    )
  }
}