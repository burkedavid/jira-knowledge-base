import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Force database setup initiated...')
    
    const prisma = new PrismaClient()
    
    try {
      await prisma.$connect()
      console.log('✅ Database connected')
      
      let results: any = {
        timestamp: new Date().toISOString(),
        operations: [],
        success: false
      }
      
      // Try to create default AI settings if table exists but no records
      try {
        const existingSettings = await prisma.aISettings.findFirst()
        if (!existingSettings) {
          const settings = await prisma.aISettings.create({
            data: {
              inputTokenCostUSD: 0.000003,
              outputTokenCostUSD: 0.000015,
              exchangeRateUSDToGBP: 0.74,
              model: 'Claude Sonnet 4',
              trackingEnabled: true,
              retentionDays: 90
            }
          })
          results.operations.push({
            operation: 'create_ai_settings',
            success: true,
            settingsId: settings.id
          })
          console.log('✅ Created default AI settings')
        } else {
          results.operations.push({
            operation: 'check_ai_settings',
            success: true,
            message: 'AI settings already exist',
            settingsId: existingSettings.id
          })
        }
      } catch (error) {
        results.operations.push({
          operation: 'create_ai_settings',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
        console.log('❌ Failed to create AI settings:', error)
      }
      
      // Try to create a test AI audit log
      try {
        const testLog = await prisma.aIAuditLog.create({
          data: {
            promptType: 'force-setup-test',
            promptName: 'Force Database Setup Test',
            endpoint: '/api/debug/force-db-setup',
            model: 'Claude Sonnet 4',
            inputTokens: 100,
            outputTokens: 200,
            totalTokens: 300,
            costUSD: 0.001,
            costGBP: 0.0008,
            success: true
          }
        })
        
        results.operations.push({
          operation: 'create_test_audit_log',
          success: true,
          logId: testLog.id
        })
        console.log('✅ Created test AI audit log')
        
        // Get total count
        const totalLogs = await prisma.aIAuditLog.count()
        results.totalAuditLogs = totalLogs
        results.success = true
        
      } catch (error) {
        results.operations.push({
          operation: 'create_test_audit_log',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
        console.log('❌ Failed to create test audit log:', error)
      }
      
      return NextResponse.json(results)
      
    } finally {
      await prisma.$disconnect()
    }
    
  } catch (error) {
    console.error('❌ Force database setup failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Force database setup failed', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}