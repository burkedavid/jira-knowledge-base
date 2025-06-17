import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching platform date range statistics...')

    // Get date ranges for all major data types
    const [userStoryRange, defectRange, documentRange, testCaseRange] = await Promise.all([
      // User Stories date range
      prisma.userStory.aggregate({
        _min: { createdAt: true },
        _max: { createdAt: true }
      }),
      
      // Defects date range
      prisma.defect.aggregate({
        _min: { createdAt: true },
        _max: { createdAt: true }
      }),
      
      // Documents date range
      prisma.document.aggregate({
        _min: { createdAt: true },
        _max: { createdAt: true }
      }),
      
      // Test Cases date range (if any exist)
      prisma.testCase.aggregate({
        _min: { createdAt: true },
        _max: { createdAt: true }
      }).catch(() => ({ _min: { createdAt: null }, _max: { createdAt: null } }))
    ])

    // Collect all dates to find overall range
    const allDates = [
      userStoryRange._min.createdAt,
      userStoryRange._max.createdAt,
      defectRange._min.createdAt,
      defectRange._max.createdAt,
      documentRange._min.createdAt,
      documentRange._max.createdAt,
      testCaseRange._min.createdAt,
      testCaseRange._max.createdAt
    ].filter(date => date !== null) as Date[]

    if (allDates.length === 0) {
      return NextResponse.json({
        hasData: false,
        message: 'No data found in the database'
      })
    }

    // Find overall min and max dates
    const overallMinDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const overallMaxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

    // Calculate data freshness (days since last update)
    const daysSinceLastUpdate = Math.floor((new Date().getTime() - overallMaxDate.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate total data span in days
    const totalDataSpanDays = Math.floor((overallMaxDate.getTime() - overallMinDate.getTime()) / (1000 * 60 * 60 * 24))

    // Format the response
    const result = {
      hasData: true,
      overall: {
        startDate: overallMinDate.toISOString(),
        endDate: overallMaxDate.toISOString(),
        spanDays: totalDataSpanDays,
        daysSinceLastUpdate: daysSinceLastUpdate
      },
      breakdown: {
        userStories: {
          startDate: userStoryRange._min.createdAt?.toISOString() || null,
          endDate: userStoryRange._max.createdAt?.toISOString() || null,
          spanDays: userStoryRange._min.createdAt && userStoryRange._max.createdAt 
            ? Math.floor((userStoryRange._max.createdAt.getTime() - userStoryRange._min.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0
        },
        defects: {
          startDate: defectRange._min.createdAt?.toISOString() || null,
          endDate: defectRange._max.createdAt?.toISOString() || null,
          spanDays: defectRange._min.createdAt && defectRange._max.createdAt 
            ? Math.floor((defectRange._max.createdAt.getTime() - defectRange._min.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0
        },
        documents: {
          startDate: documentRange._min.createdAt?.toISOString() || null,
          endDate: documentRange._max.createdAt?.toISOString() || null,
          spanDays: documentRange._min.createdAt && documentRange._max.createdAt 
            ? Math.floor((documentRange._max.createdAt.getTime() - documentRange._min.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0
        },
        testCases: {
          startDate: testCaseRange._min.createdAt?.toISOString() || null,
          endDate: testCaseRange._max.createdAt?.toISOString() || null,
          spanDays: testCaseRange._min.createdAt && testCaseRange._max.createdAt 
            ? Math.floor((testCaseRange._max.createdAt.getTime() - testCaseRange._min.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : 0
        }
      },
      freshness: {
        status: daysSinceLastUpdate === 0 ? 'current' : 
               daysSinceLastUpdate <= 7 ? 'recent' : 
               daysSinceLastUpdate <= 30 ? 'moderate' : 'stale',
        daysSinceLastUpdate,
        lastUpdateDate: overallMaxDate.toISOString()
      }
    }

    console.log('✅ Date range statistics calculated:', {
      span: `${totalDataSpanDays} days`,
      freshness: result.freshness.status
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Error fetching date range:', error)
    return NextResponse.json(
      { error: 'Failed to fetch date range statistics' },
      { status: 500 }
    )
  }
}