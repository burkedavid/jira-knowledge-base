import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuditStats } from '@/lib/ai-audit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow both admin and regular users to view AI audit stats
    // Note: Stats are aggregated so no user-specific filtering needed here

    const { searchParams } = new URL(request.url)
    const timeframe = (searchParams.get('timeframe') || 'month') as 'day' | 'week' | 'month' | 'all'

    const stats = await getAuditStats(timeframe)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching audit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit stats' },
      { status: 500 }
    )
  }
} 