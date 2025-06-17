import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, getAuditStats } from '@/lib/ai-audit'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing AI audit functions directly...')
    
    const { searchParams } = new URL(request.url)
    const test = searchParams.get('test') || 'both'
    
    let results: any = {
      timestamp: new Date().toISOString(),
      test_type: test
    }
    
    if (test === 'logs' || test === 'both') {
      try {
        console.log('📋 Testing getAuditLogs...')
        const logsResult = await getAuditLogs(1, 10)
        results.logs_test = {
          success: true,
          total: logsResult.total,
          count: logsResult.logs.length,
          sample: logsResult.logs[0] || null
        }
        console.log('✅ Logs test successful')
      } catch (error) {
        console.error('❌ Logs test failed:', error)
        results.logs_test = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
    
    if (test === 'stats' || test === 'both') {
      try {
        console.log('📊 Testing getAuditStats...')
        const statsResult = await getAuditStats('month')
        results.stats_test = {
          success: true,
          data: statsResult
        }
        console.log('✅ Stats test successful')
      } catch (error) {
        console.error('❌ Stats test failed:', error)
        results.stats_test = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}