import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// CRITICAL: Configure NextAuth for proxy environments
// Set NEXTAUTH_URL_INTERNAL for proxy environments
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 