import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { vectorSearch } from '@/lib/vector-db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Running RAG system diagnostics...')
    
    // 1. Check data availability
    const [userStoryCount, defectCount, testCaseCount, documentCount] = await Promise.all([
      prisma.userStory.count(),
      prisma.defect.count(),
      prisma.testCase.count(),
      prisma.document.count()
    ])
    
    // 2. Check embedding availability
    const embeddingStats = await prisma.embedding.groupBy({
      by: ['sourceType'],
      _count: { id: true }
    })
    
    const totalEmbeddings = await prisma.embedding.count()
    
    const embeddingsByType = embeddingStats.reduce((acc: Record<string, number>, item: any) => {
      acc[item.sourceType] = item._count.id
      return acc
    }, {})
    
    // 3. Test a simple semantic search
    let searchTest = null
    try {
      if (totalEmbeddings > 0) {
        const testSearchResults = await vectorSearch(
          'user authentication login',
          ['user_story', 'defect', 'test_case', 'document'],
          3,
          0.1 // Low threshold for testing
        )
        
        searchTest = {
          success: true,
          resultsFound: testSearchResults.length,
          topResult: testSearchResults.length > 0 ? {
            sourceType: testSearchResults[0].sourceType,
            similarity: testSearchResults[0].similarity,
            contentPreview: testSearchResults[0].content.substring(0, 100)
          } : null
        }
      } else {
        searchTest = {
          success: false,
          error: 'No embeddings available for testing'
        }
      }
    } catch (error) {
      searchTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown search error'
      }
    }
    
    // 4. Check AWS Bedrock availability
    let bedrockStatus = null
    try {
      const { checkTitanAvailability } = await import('@/lib/embeddings')
      const isAvailable = await checkTitanAvailability()
      bedrockStatus = {
        available: isAvailable,
        model: 'amazon.titan-embed-text-v2:0'
      }
    } catch (error) {
      bedrockStatus = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown Bedrock error'
      }
    }
    
    // 5. Generate diagnostic report
    const diagnostics = {
      timestamp: new Date().toISOString(),
      dataAvailability: {
        userStories: userStoryCount,
        defects: defectCount,
        testCases: testCaseCount,
        documents: documentCount,
        total: userStoryCount + defectCount + testCaseCount + documentCount
      },
      embeddings: {
        total: totalEmbeddings,
        byType: embeddingsByType,
        coverage: {
          userStories: embeddingsByType.user_story || 0,
          defects: embeddingsByType.defect || 0,
          testCases: embeddingsByType.test_case || 0,
          documents: embeddingsByType.document || 0
        }
      },
      searchTest,
      bedrockStatus,
      ragSystemHealth: {
        status: totalEmbeddings > 0 && searchTest?.success ? 'healthy' : 'needs_attention',
        issues: [] as string[]
      }
    }
    
    // Add specific issues to the health report
    if (diagnostics.dataAvailability.total === 0) {
      diagnostics.ragSystemHealth.issues.push('No data available - import user stories, defects, or documents first')
    }
    
    if (totalEmbeddings === 0) {
      diagnostics.ragSystemHealth.issues.push('No embeddings generated - run /api/embeddings/generate to create embeddings')
    }
    
    if (!bedrockStatus?.available) {
      diagnostics.ragSystemHealth.issues.push('AWS Bedrock not available - check AWS credentials and region configuration')
    }
    
    if (searchTest && !searchTest.success) {
      diagnostics.ragSystemHealth.issues.push(`Semantic search failed: ${searchTest.error}`)
    }
    
    // Determine overall status
    if (diagnostics.ragSystemHealth.issues.length === 0) {
      diagnostics.ragSystemHealth.status = 'healthy'
    } else if (diagnostics.ragSystemHealth.issues.length <= 2) {
      diagnostics.ragSystemHealth.status = 'needs_attention'
    } else {
      diagnostics.ragSystemHealth.status = 'critical'
    }
    
    console.log('✅ RAG diagnostics completed')
    
    return NextResponse.json({
      success: true,
      diagnostics,
      recommendations: [
        totalEmbeddings === 0 ? 'Generate embeddings by calling POST /api/embeddings/generate' : null,
        diagnostics.dataAvailability.total === 0 ? 'Import data via /import page or document upload' : null,
        !bedrockStatus?.available ? 'Configure AWS Bedrock credentials in environment variables' : null,
        'Lower similarity thresholds in requirements analysis if searches return few results',
        'Monitor console logs during requirements analysis for detailed debugging'
      ].filter(Boolean)
    })
    
  } catch (error) {
    console.error('💥 RAG diagnostics failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to run RAG diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 