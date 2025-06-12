import { NextRequest, NextResponse } from 'next/server'
import { vectorSearchWithTimeframe, DateFilter } from '@/lib/vector-db'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      sourceTypes, 
      limit = 10, 
      threshold = 0.7,
      timeframe,
      dateRange 
    } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    let results

    if (timeframe) {
      // Use timeframe-based search (last_week, last_month, etc.)
      results = await vectorSearchWithTimeframe(
        query,
        timeframe,
        sourceTypes,
        limit,
        threshold
      )
    } else {
      // Use regular search with optional custom date range
      const { vectorSearch } = await import('@/lib/vector-db')
      
      let dateFilter: DateFilter | undefined
      if (dateRange?.fromDate || dateRange?.toDate) {
        dateFilter = {
          fromDate: dateRange.fromDate ? new Date(dateRange.fromDate) : undefined,
          toDate: dateRange.toDate ? new Date(dateRange.toDate) : undefined
        }
      }

      results = await vectorSearch(
        query,
        sourceTypes,
        limit,
        threshold,
        dateFilter
      )
    }

    // Enrich results with full entity data
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        try {
          let entityData = null
          
          switch (result.sourceType) {
            case 'user_story':
              entityData = await prisma.userStory.findUnique({
                where: { id: result.sourceId },
                include: {
                  qualityScores: {
                    orderBy: { generatedAt: 'desc' },
                    take: 1
                  }
                }
              })
              break
            case 'defect':
              entityData = await prisma.defect.findUnique({
                where: { id: result.sourceId }
              })
              break
            case 'test_case':
              entityData = await prisma.testCase.findUnique({
                where: { id: result.sourceId },
                include: {
                  sourceStory: {
                    select: { title: true, jiraKey: true }
                  }
                }
              })
              break
            case 'document':
              entityData = await prisma.document.findUnique({
                where: { id: result.sourceId }
              })
              break
          }

          return {
            ...result,
            entityData
          }
        } catch (error) {
          console.error(`Error enriching ${result.sourceType}:`, error)
          return { ...result, entityData: null }
        }
      })
    )

    return NextResponse.json({
      query,
      timeframe,
      dateRange,
      results: enrichedResults,
      totalFound: enrichedResults.length,
      searchParams: {
        sourceTypes,
        limit,
        threshold
      }
    })

  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform semantic search' },
      { status: 500 }
    )
  }
}

// GET endpoint for simple queries with time filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const timeframe = searchParams.get('timeframe') as 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'all' | null
    const sourceTypes = searchParams.get('types')?.split(',')
    const limit = parseInt(searchParams.get('limit') || '10')
    const threshold = parseFloat(searchParams.get('threshold') || '0.7')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    const results = await vectorSearchWithTimeframe(
      query,
      timeframe || 'all',
      sourceTypes as any,
      limit,
      threshold
    )

    return NextResponse.json({
      query,
      timeframe: timeframe || 'all',
      results,
      totalFound: results.length
    })

  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform semantic search' },
      { status: 500 }
    )
  }
} 