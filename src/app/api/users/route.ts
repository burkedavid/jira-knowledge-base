import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get unique users from audit logs
    const users = await prisma.aIAuditLog.findMany({
      select: {
        userId: true,
        userEmail: true,
      },
      distinct: ['userId'],
      where: {
        userId: {
          not: null
        }
      },
      orderBy: {
        userEmail: 'asc'
      }
    })

    // Filter out null values and format response
    const formattedUsers = users
      .filter((user: any) => user.userId && user.userEmail)
      .map((user: any) => ({
        id: user.userId!,
        email: user.userEmail!
      }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
} 