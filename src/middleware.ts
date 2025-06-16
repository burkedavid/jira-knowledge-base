import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow access to login page, auth API routes, and test endpoints
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/test-simple') ||
    pathname.startsWith('/api/test/') ||
    pathname.startsWith('/api/ping') ||
    pathname.startsWith('/api/hello') ||
    pathname.startsWith('/api/static-test') ||
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

    if (!token) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // In case of error, allow the request to proceed
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - api/health, api/ping, api/hello, api/test-simple, api/test/, api/static-test (test endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    '/((?!api/auth|api/health|api/ping|api/hello|api/test-simple|api/test/|api/static-test|_next/static|_next/image|favicon.ico|login).*)',
  ],
} 