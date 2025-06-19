import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { embedContent } from '@/lib/vector-db'

export async function POST(request: NextRequest) {
  try {
    const { 
      sourceTypes = ['user_story', 'defect', 'test_case'], 
      forceRegenerate = false,
      dateRange = null 
    } = await request.json()
    
    console.log('🚀 Starting embedding generation for:', sourceTypes)
    if (dateRange) {
      console.log('📅 Date range filter:', dateRange)
    }
    
    // Build date filter for database queries
    let dateFilter: any = {}
    if (dateRange?.fromDate || dateRange?.toDate) {
      dateFilter = {}
      if (dateRange.fromDate) {
        dateFilter.gte = new Date(dateRange.fromDate)
      }
      if (dateRange.toDate) {
        dateFilter.lte = new Date(dateRange.toDate)
      }
    }
    
    let totalProcessed = 0
    const results: any = {}

    // Process User Stories
    if (sourceTypes.includes('user_story')) {
      console.log('📖 Processing user stories...')
      const whereClause: any = {}
      if (Object.keys(dateFilter).length > 0) {
        whereClause.createdAt = dateFilter
      }
      
      const userStories = await prisma.userStory.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      })
      
      for (const story of userStories) {
        try {
          const content = `${story.title}\n\n${story.description}\n\nAcceptance Criteria: ${story.acceptanceCriteria || 'Not provided'}\n\nComponent: ${story.component || 'Not specified'}\n\nPriority: ${story.priority || 'Not set'}`
          
          const result = await embedContent(content, story.id, 'user_story', '1.0', story.createdAt, forceRegenerate)
          totalProcessed++
          
          if (totalProcessed % 5 === 0) {
            console.log(`  ✅ Processed ${totalProcessed} items... (${result.action}: ${result.reason})`)
          }
        } catch (error) {
          console.error(`Error embedding user story ${story.id}:`, error)
        }
      }
      
      results.user_stories = userStories.length
      console.log(`✅ Completed user stories: ${userStories.length} processed${Object.keys(dateFilter).length > 0 ? ' (date filtered)' : ''}`)
    }

    // Process Defects
    if (sourceTypes.includes('defect')) {
      console.log('🐛 Processing defects...')
      const whereClause: any = {}
      if (Object.keys(dateFilter).length > 0) {
        whereClause.createdAt = dateFilter
      }
      
      const defects = await prisma.defect.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      })
      
      for (const defect of defects) {
        try {
          const content = `${defect.title}\n\n${defect.description}\n\nSteps to Reproduce: ${defect.stepsToReproduce || 'Not provided'}\n\nRoot Cause: ${defect.rootCause || 'Not identified'}\n\nComponent: ${defect.component || 'Not specified'}\n\nSeverity: ${defect.severity || 'Not set'}`
          
          const result = await embedContent(content, defect.id, 'defect', '1.0', defect.createdAt, forceRegenerate)
          totalProcessed++
          
          if (totalProcessed % 5 === 0) {
            console.log(`  ✅ Processed ${totalProcessed} items... (${result.action}: ${result.reason})`)
          }
        } catch (error) {
          console.error(`Error embedding defect ${defect.id}:`, error)
        }
      }
      
      results.defects = defects.length
      console.log(`✅ Completed defects: ${defects.length} processed${Object.keys(dateFilter).length > 0 ? ' (date filtered)' : ''}`)
    }

    // Process Test Cases
    if (sourceTypes.includes('test_case')) {
      console.log('🧪 Processing test cases...')
      const whereClause: any = {}
      if (Object.keys(dateFilter).length > 0) {
        whereClause.createdAt = dateFilter
      }
      
      const testCases = await prisma.testCase.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      })
      
      for (const testCase of testCases) {
        try {
          const content = `${testCase.title}\n\nSteps: ${testCase.steps}\n\nExpected Results: ${testCase.expectedResults}\n\nPriority: ${testCase.priority || 'Not set'}\n\nGenerated From: ${testCase.generatedFrom || 'Unknown'}`
          
          const result = await embedContent(content, testCase.id, 'test_case', '1.0', testCase.createdAt, forceRegenerate)
          totalProcessed++
          
          if (totalProcessed % 5 === 0) {
            console.log(`  ✅ Processed ${totalProcessed} items... (${result.action}: ${result.reason})`)
          }
        } catch (error) {
          console.error(`Error embedding test case ${testCase.id}:`, error)
        }
      }
      
      results.test_cases = testCases.length
      console.log(`✅ Completed test cases: ${testCases.length} processed${Object.keys(dateFilter).length > 0 ? ' (date filtered)' : ''}`)
    }

    console.log(`🎉 Embedding generation complete! Total processed: ${totalProcessed}`)

    return NextResponse.json({
      success: true,
      totalProcessed,
      results,
      dateRangeApplied: Object.keys(dateFilter).length > 0 ? dateFilter : null,
      message: 'Embeddings generated successfully'
    })

  } catch (error) {
    console.error('💥 Error generating embeddings:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate embeddings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get embedding statistics
    const stats = await prisma.embedding.groupBy({
      by: ['sourceType'],
      _count: {
        id: true,
      },
    })

    const total = await prisma.embedding.count()

    const statsByType = stats.reduce((acc: Record<string, number>, item: any) => {
      acc[item.sourceType] = item._count.id
      return acc
    }, {})

    return NextResponse.json({
      total,
      bySourceType: statsByType,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 Error getting embedding stats:', error)
    return NextResponse.json(
      { error: 'Failed to get embedding statistics' },
      { status: 500 }
    )
  }
} 