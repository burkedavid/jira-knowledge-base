import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Temporarily disable all middleware logic for debugging
  console.log('Middleware called for:', request.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Temporarily match nothing to disable middleware
    '/disabled-for-debugging'
  ],
} 