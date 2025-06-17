import { NextRequest, NextResponse } from 'next/server'
import { getBedrockClient } from '@/lib/aws-bedrock'

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Health check for requirements analysis API...')
    
    // Check environment variables
    const envCheck = {
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION || 'us-east-1',
      DATABASE_URL: !!process.env.DATABASE_URL
    }
    
    console.log('🔧 Environment variables check:', envCheck)
    
    // Test Bedrock client initialization
    let bedrockStatus = 'unknown'
    try {
      const bedrockClient = getBedrockClient()
      bedrockStatus = 'initialized'
      console.log('✅ Bedrock client initialized successfully')
    } catch (error) {
      bedrockStatus = `error: ${error instanceof Error ? error.message : 'unknown error'}`
      console.error('❌ Bedrock client initialization failed:', error)
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      bedrock: bedrockStatus,
      message: 'Requirements analysis API health check completed'
    })
    
  } catch (error) {
    console.error('💥 Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Requirements analysis API health check failed'
      },
      { status: 500 }
    )
  }
} 