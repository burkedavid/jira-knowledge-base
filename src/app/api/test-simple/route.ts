import { NextResponse } from 'next/server'

// Force this route to be dynamic and configure runtime
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const response = { 
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString()
  }
  
  return new NextResponse(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
} 