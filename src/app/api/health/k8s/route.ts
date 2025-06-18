import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Kubernetes-optimized health check
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const startTime = Date.now()
    
    // Check database connectivity
    let dbStatus = 'unknown'
    let dbLatency = 0
    
    try {
      const dbStart = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbLatency = Date.now() - dbStart
      dbStatus = 'healthy'
    } catch (error) {
      dbStatus = 'unhealthy'
      console.error('Database health check failed:', error)
    }

    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]
    
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])
    const envStatus = missingEnvVars.length === 0 ? 'healthy' : 'unhealthy'

    // Overall health status
    const isHealthy = dbStatus === 'healthy' && envStatus === 'healthy'
    const totalLatency = Date.now() - startTime

    const health = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbStatus,
          latency: dbLatency
        },
        environment: {
          status: envStatus,
          missingVars: missingEnvVars
        }
      },
      metadata: {
        totalLatency,
        nodeEnv: process.env.NODE_ENV,
        isK8s: !!(process.env.KUBERNETES_SERVICE_HOST),
        isVercel: process.env.VERCEL === '1',
        headers: {
          host: request.headers.get('host'),
          'x-forwarded-for': request.headers.get('x-forwarded-for'),
          'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
          'x-real-ip': request.headers.get('x-real-ip'),
        }
      }
    }

    // Return appropriate HTTP status for K8s
    const statusCode = isHealthy ? 200 : 503

    return new NextResponse(JSON.stringify(health), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Health check error:', error)
    
    return new NextResponse(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
} 