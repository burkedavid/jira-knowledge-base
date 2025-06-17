import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, getAuditStats } from '@/lib/ai-audit'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing AI audit without auth...')
    
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint') || 'logs'
    
    if (endpoint === 'logs') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      
      const result = await getAuditLogs(page, limit)
      
      return NextResponse.json({
        ...result,
        debug: {
          endpoint: 'logs',
          page,
          limit,
          timestamp: new Date().toISOString()
        }
      })
    } else if (endpoint === 'stats') {
      const timeframe = (searchParams.get('timeframe') || 'month') as 'day' | 'week' | 'month' | 'all'
      
      const stats = await getAuditStats(timeframe)
      
      return NextResponse.json({
        ...stats,
        debug: {
          endpoint: 'stats',
          timeframe,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json({ error: 'Invalid endpoint. Use ?endpoint=logs or ?endpoint=stats' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ AI audit test failed:', error)
    return NextResponse.json(
      { 
        error: 'AI audit test failed', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}