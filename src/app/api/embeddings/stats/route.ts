import { NextRequest, NextResponse } from 'next/server'
import { getEmbeddingStats } from '@/lib/vector-db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const stats = await getEmbeddingStats()
    
    return NextResponse.json({
      total: stats.total,
      bySourceType: stats.bySourceType,
      success: true
    })
  } catch (error) {
    console.error('Error fetching embedding stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch embedding stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 