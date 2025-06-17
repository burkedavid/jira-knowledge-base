import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API routes are working',
    timestamp: new Date().toISOString(),
    available_routes: [
      '/api/ai-audit/logs',
      '/api/ai-audit/stats', 
      '/api/ai-audit/settings',
      '/api/ai-audit/clear'
    ]
  })
}