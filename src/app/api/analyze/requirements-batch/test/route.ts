import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: Count user stories that match filters (for batch analysis preview)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filters } = body

    console.log('🔍 Counting stories with filters:', JSON.stringify(filters, null, 2))

    // Build query for user stories based on filters
    let whereClause: any = {}
    
    if (filters) {
      console.log('🔍 Applying filters:', JSON.stringify(filters, null, 2))
      
      if (filters.priority && filters.priority.length > 0) {
        whereClause.priority = { in: filters.priority }
        console.log('🏷️ Priority filter applied:', filters.priority)
      }
      
      if (filters.status && filters.status.length > 0) {
        whereClause.status = { in: filters.status }
        console.log('📊 Status filter applied:', filters.status)
      }
      
      if (filters.component && filters.component.length > 0) {
        whereClause.component = { in: filters.component }
        console.log('🧩 Component filter applied:', filters.component)
      }
      
      if (filters.dateRange) {
        const { start, end } = filters.dateRange
        const dateRangeFilter: any = {}
        
        if (start && start.trim()) {
          const startDate = new Date(start)
          startDate.setHours(0, 0, 0, 0)
          dateRangeFilter.gte = startDate.toISOString()
          console.log('📅 Start date filter:', startDate.toISOString())
        }
        
        if (end && end.trim()) {
          const endDate = new Date(end)
          endDate.setHours(23, 59, 59, 999)
          dateRangeFilter.lte = endDate.toISOString()
          console.log('📅 End date filter:', endDate.toISOString())
        }
        
        if (dateRangeFilter.gte || dateRangeFilter.lte) {
          whereClause.createdAt = dateRangeFilter
          console.log('📅 Date range filter applied:', dateRangeFilter)
        }
      }
    } else {
      console.log('⚠️ No filters provided - will count ALL user stories')
    }

    console.log('🔍 Final query where clause:', JSON.stringify(whereClause, null, 2))

    // Count user stories that match the criteria
    const count = await prisma.userStory.count({
      where: whereClause
    })

    console.log(`📊 Found ${count} user stories matching criteria`)

    return NextResponse.json({
      success: true,
      count,
      filters: filters || null,
      message: `Found ${count} user stories matching the specified criteria`
    })

  } catch (error) {
    console.error('❌ Error counting stories:', error)
    return NextResponse.json(
      { 
        error: 'Failed to count stories', 
        details: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing batch analysis components...')
    
    // Get a sample user story for testing
    const sampleStory = await prisma.userStory.findFirst({
      select: {
        id: true,
        title: true,
        description: true
      }
    })
    
    if (!sampleStory) {
      return NextResponse.json({
        status: 'no_data',
        message: 'No user stories found in database for testing'
      })
    }
    
    console.log('📖 Found sample story:', sampleStory.title)
    
    // Test the individual requirements analysis API
    try {
      console.log('📡 Testing individual requirements analysis API...')
      
      const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analyze/requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userStoryId: sampleStory.id
        })
      })
      
      console.log('📡 Response status:', analysisResponse.status)
      console.log('📡 Response headers:', Object.fromEntries(analysisResponse.headers.entries()))
      
      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text()
        console.error('❌ API error:', errorText)
        
        return NextResponse.json({
          status: 'api_error',
          httpStatus: analysisResponse.status,
          errorText: errorText.substring(0, 1000),
          sampleStory,
          message: 'Individual requirements analysis API returned error'
        })
      }
      
      // Check content type
      const contentType = analysisResponse.headers.get('content-type')
      console.log('📄 Content-Type:', contentType)
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await analysisResponse.text()
        console.error('❌ Non-JSON response:', responseText.substring(0, 1000))
        
        return NextResponse.json({
          status: 'non_json_response',
          contentType,
          responseText: responseText.substring(0, 1000),
          sampleStory,
          message: 'Individual requirements analysis API returned non-JSON response'
        })
      }
      
      const analysisData = await analysisResponse.json()
      console.log('✅ Successfully parsed JSON response')
      
      return NextResponse.json({
        status: 'success',
        sampleStory,
        analysisResult: {
          qualityScore: analysisData.qualityScore,
          hasStrengths: Array.isArray(analysisData.strengths) && analysisData.strengths.length > 0,
          hasImprovements: Array.isArray(analysisData.improvements) && analysisData.improvements.length > 0,
          hasAnalysis: !!analysisData.analysis,
          ragContextUsed: !!analysisData.ragContextUsed
        },
        message: 'Individual requirements analysis API test completed successfully'
      })
      
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError)
      
      return NextResponse.json({
        status: 'fetch_error',
        error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        sampleStory,
        message: 'Failed to call individual requirements analysis API'
      })
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error)
    
    return NextResponse.json(
      {
        status: 'test_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Batch analysis test failed'
      },
      { status: 500 }
    )
  }
} 