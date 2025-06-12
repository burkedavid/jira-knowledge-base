import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow access to login page, auth API routes, health check, and test endpoints
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/test-simple') ||
    pathname.startsWith('/api/ping') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/manifest.json')
  ) {
    return NextResponse.next()
  }

  try {
    // Check if user has a valid token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // If authenticated, continue
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    
    // For health and test endpoints, allow through even if auth fails
    if (pathname.startsWith('/api/health') || pathname.startsWith('/api/test-simple') || pathname.startsWith('/api/ping')) {
      return NextResponse.next()
    }
    
    // If there's an error with authentication, redirect to login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - api/health (health check endpoint)
     * - api/test-simple (test endpoint)
     * - api/ping (ping endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    '/((?!api/auth|api/health|api/test-simple|api/ping|_next/static|_next/image|favicon.ico|login).*)',
  ],
} 