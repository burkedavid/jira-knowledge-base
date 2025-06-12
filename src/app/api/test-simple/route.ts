import { NextResponse } from 'next/server'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ 
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString()
  })
} 