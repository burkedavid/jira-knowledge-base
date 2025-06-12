import { NextResponse } from 'next/server'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    console.log('Health check endpoint called:', {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    })

    // Basic health check
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        databaseType: process.env.DATABASE_URL?.startsWith('postgresql') ? 'postgresql' : 
                     process.env.DATABASE_URL?.startsWith('file:') ? 'sqlite' : 'unknown',
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasAwsCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        isVercel: process.env.VERCEL === '1',
        vercelEnv: process.env.VERCEL_ENV,
        ci: process.env.CI,
      },
      build: {
        buildTime: new Date().toISOString(),
        version: '1.0.0'
      },
      request: {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
      }
    }

    console.log('Health check response:', health)
    return NextResponse.json(health)
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isVercel: process.env.VERCEL === '1',
        }
      }, 
      { status: 500 }
    )
  }
} 