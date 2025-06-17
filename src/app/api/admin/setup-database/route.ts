import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin access
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🚀 Admin-triggered database setup...')
    
    const prisma = new PrismaClient()
    
    try {
      await prisma.$connect()
      console.log('✅ Connected to database')
      
      // Check if AI audit tables exist
      let auditTableExists = false
      let settingsTableExists = false
      
      try {
        await prisma.aIAuditLog.count()
        auditTableExists = true
        console.log('✅ AIAuditLog table exists')
      } catch (error) {
        console.log('❌ AIAuditLog table missing:', error instanceof Error ? error.message : String(error))
      }
      
      try {
        await prisma.aISettings.count()
        settingsTableExists = true
        console.log('✅ AISettings table exists')
      } catch (error) {
        console.log('❌ AISettings table missing:', error instanceof Error ? error.message : String(error))
      }
      
      if (!auditTableExists || !settingsTableExists) {
        return NextResponse.json({
          success: false,
          message: 'AI audit tables are missing from the database',
          details: {
            auditTableExists,
            settingsTableExists,
            recommendation: 'Run "npx prisma db push" to create missing tables'
          }
        }, { status: 500 })
      }
      
      // Check for default AI settings
      let settings = await prisma.aISettings.findFirst()
      if (!settings) {
        console.log('📝 Creating default AI settings...')
        settings = await prisma.aISettings.create({
          data: {
            inputTokenCostUSD: 0.000003,
            outputTokenCostUSD: 0.000015,
            exchangeRateUSDToGBP: 0.74,
            model: 'Claude Sonnet 4',
            trackingEnabled: true,
            retentionDays: 90
          }
        })
        console.log('✅ Default AI settings created')
      }
      
      // Test AI audit logging
      const testLog = await prisma.aIAuditLog.create({
        data: {
          promptType: 'admin-test',
          promptName: 'Admin Database Test',
          endpoint: '/api/admin/setup-database',
          model: 'Claude Sonnet 4',
          inputTokens: 50,
          outputTokens: 100,
          totalTokens: 150,
          costUSD: 0.0005,
          costGBP: 0.0004,
          userId: session.user.id,
          userEmail: session.user.email,
          success: true
        }
      })
      
      console.log('✅ Test AI audit log created:', testLog.id)
      
      // Get current audit log count
      const totalLogs = await prisma.aIAuditLog.count()
      
      return NextResponse.json({
        success: true,
        message: 'Database setup completed successfully',
        details: {
          auditTableExists: true,
          settingsTableExists: true,
          defaultSettingsCreated: !settings,
          testLogCreated: testLog.id,
          totalAuditLogs: totalLogs,
          settings: {
            trackingEnabled: settings.trackingEnabled,
            model: settings.model,
            retentionDays: settings.retentionDays
          }
        }
      })
      
    } finally {
      await prisma.$disconnect()
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Database setup failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin access
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const prisma = new PrismaClient()
    
    try {
      await prisma.$connect()
      
      // Check database status
      let auditTableExists = false
      let settingsTableExists = false
      let auditLogCount = 0
      let settingsCount = 0
      
      try {
        auditLogCount = await prisma.aIAuditLog.count()
        auditTableExists = true
      } catch (error) {
        console.log('AIAuditLog table check failed:', error instanceof Error ? error.message : String(error))
      }
      
      try {
        settingsCount = await prisma.aISettings.count()
        settingsTableExists = true
      } catch (error) {
        console.log('AISettings table check failed:', error instanceof Error ? error.message : String(error))
      }
      
      return NextResponse.json({
        databaseStatus: {
          connected: true,
          auditTableExists,
          settingsTableExists,
          auditLogCount,
          settingsCount
        },
        environment: {
          databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing',
          nodeEnv: process.env.NODE_ENV,
          vercel: process.env.VERCEL || 'false'
        }
      })
      
    } finally {
      await prisma.$disconnect()
    }
    
  } catch (error) {
    console.error('Database status check failed:', error)
    return NextResponse.json(
      { 
        error: 'Database status check failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}