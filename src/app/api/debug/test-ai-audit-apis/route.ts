import { NextRequest, NextResponse } from 'next/server'
import { getAuditLogs, getAuditStats } from '@/lib/ai-audit'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing AI audit APIs...')
    
    let results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    }
    
    // Test getAuditLogs function
    try {
      console.log('📋 Testing getAuditLogs...')
      const logsResult = await getAuditLogs(1, 10)
      results.tests.push({
        test: 'getAuditLogs',
        success: true,
        data: {
          totalLogs: logsResult.total,
          logsReturned: logsResult.logs.length,
          page: logsResult.page,
          totalPages: logsResult.totalPages,
          sampleLog: logsResult.logs[0] || null
        }
      })
      console.log('✅ getAuditLogs successful:', logsResult.total, 'total logs')
    } catch (error) {
      results.tests.push({
        test: 'getAuditLogs',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
      console.log('❌ getAuditLogs failed:', error)
    }
    
    // Test getAuditStats function
    try {
      console.log('📊 Testing getAuditStats...')
      const statsResult = await getAuditStats('all')
      results.tests.push({
        test: 'getAuditStats',
        success: true,
        data: statsResult
      })
      console.log('✅ getAuditStats successful')
    } catch (error) {
      results.tests.push({
        test: 'getAuditStats',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
      console.log('❌ getAuditStats failed:', error)
    }
    
    // Test direct database query
    try {
      console.log('🗄️ Testing direct database query...')
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()
      
      const directLogs = await prisma.aIAuditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      
      const directStats = await prisma.aIAuditLog.aggregate({
        _count: { id: true },
        _sum: { costUSD: true, costGBP: true, inputTokens: true, outputTokens: true }
      })
      
      results.tests.push({
        test: 'directDatabaseQuery',
        success: true,
        data: {
          recentLogs: directLogs,
          aggregateStats: directStats
        }
      })
      console.log('✅ Direct database query successful')
      
      await prisma.$disconnect()
    } catch (error) {
      results.tests.push({
        test: 'directDatabaseQuery',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
      console.log('❌ Direct database query failed:', error)
    }
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('❌ Test AI audit APIs failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}