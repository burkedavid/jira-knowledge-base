import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Direct AI audit test...')
    
    const prisma = new PrismaClient()
    
    try {
      // Direct database query for AI audit logs
      const logs = await prisma.aIAuditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
      
      const count = await prisma.aIAuditLog.count()
      
      const settings = await prisma.aISettings.findFirst()
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        directQuery: {
          totalLogs: count,
          recentLogs: logs,
          settings: settings
        },
        message: `Found ${count} AI audit logs directly from database`
      })
      
    } finally {
      await prisma.$disconnect()
    }
    
  } catch (error) {
    console.error('❌ Direct AI audit test failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Direct test failed', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}