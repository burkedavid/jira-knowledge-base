import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { clearAuditLogs } from '@/lib/ai-audit'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const promptType = searchParams.get('promptType') || undefined
    const userId = searchParams.get('userId') || undefined
    const olderThanDays = searchParams.get('olderThanDays')
    
    let olderThan: Date | undefined
    if (olderThanDays) {
      olderThan = new Date()
      olderThan.setDate(olderThan.getDate() - parseInt(olderThanDays))
    }

    const result = await clearAuditLogs({
      promptType,
      userId,
      olderThan
    })

    return NextResponse.json({
      message: `Successfully cleared ${result.count} audit log entries`,
      count: result.count
    })
  } catch (error) {
    console.error('Error clearing audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to clear audit logs' },
      { status: 500 }
    )
  }
} 