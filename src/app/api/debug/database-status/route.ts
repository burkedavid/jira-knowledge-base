import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database status...')
    
    const prisma = new PrismaClient()
    
    try {
      await prisma.$connect()
      console.log('✅ Database connected')
      
      // Check if AI audit tables exist
      let results: any = {
        connected: true,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'Present' : 'Missing',
        tables: {}
      }
      
      // Test AIAuditLog table
      try {
        const auditCount = await prisma.aIAuditLog.count()
        results.tables.AIAuditLog = { exists: true, count: auditCount }
        console.log(`✅ AIAuditLog table exists with ${auditCount} records`)
      } catch (error) {
        results.tables.AIAuditLog = { 
          exists: false, 
          error: error instanceof Error ? error.message : String(error) 
        }
        console.log('❌ AIAuditLog table missing or inaccessible')
      }
      
      // Test AISettings table
      try {
        const settingsCount = await prisma.aISettings.count()
        results.tables.AISettings = { exists: true, count: settingsCount }
        console.log(`✅ AISettings table exists with ${settingsCount} records`)
      } catch (error) {
        results.tables.AISettings = { 
          exists: false, 
          error: error instanceof Error ? error.message : String(error) 
        }
        console.log('❌ AISettings table missing or inaccessible')
      }
      
      // Test other core tables
      try {
        const userCount = await prisma.user.count()
        results.tables.User = { exists: true, count: userCount }
      } catch (error) {
        results.tables.User = { 
          exists: false, 
          error: error instanceof Error ? error.message : String(error) 
        }
      }
      
      // Test UserStory table
      try {
        const storyCount = await prisma.userStory.count()
        results.tables.UserStory = { exists: true, count: storyCount }
      } catch (error) {
        results.tables.UserStory = { 
          exists: false, 
          error: error instanceof Error ? error.message : String(error) 
        }
      }
      
      return NextResponse.json(results)
      
    } finally {
      await prisma.$disconnect()
    }
    
  } catch (error) {
    console.error('❌ Database status check failed:', error)
    return NextResponse.json(
      { 
        connected: false,
        error: 'Database connection failed', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}