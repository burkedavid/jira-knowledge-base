import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force this route to be dynamic since it uses request.url
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    const component = searchParams.get('component')

    // Calculate date range based on timeframe
    let dateFilter: any = {}
    const now = new Date()
    
    switch (timeframe) {
      case '7d':
        dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        break
      case '30d':
        dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        break
      case '90d':
        dateFilter = { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
        break
      case '1y':
        dateFilter = { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
        break
      case 'all':
      default:
        dateFilter = {}
        break
    }

    // Build where clause - FIXED: Don't apply date filter for "all" timeframe
    const whereClause: any = {}
    if (timeframe !== 'all' && Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter
    }
    if (component) {
      whereClause.component = component
    }

    // Get total defects
    const totalDefects = await prisma.defect.count({
      where: whereClause
    })

    // Get defects by severity
    const defectsBySeverity = await prisma.defect.groupBy({
      by: ['severity'],
      where: whereClause,
      _count: {
        id: true
      }
    })

    // Get defects by component
    const defectsByComponent = await prisma.defect.groupBy({
      by: ['component'],
      where: whereClause,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    // Get defects by status
    const defectsByStatus = await prisma.defect.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true
      }
    })

    // Get defect patterns (most common root causes)
    const defectPatterns = await prisma.defect.groupBy({
      by: ['rootCause'],
      where: {
        ...whereClause,
        rootCause: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    // Calculate risk score based on recent defect activity
    const recentDefects = await prisma.defect.count({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    const criticalDefects = await prisma.defect.count({
      where: {
        ...whereClause,
        severity: 'Critical'
      }
    })

    // Simple risk score calculation (0-100)
    const riskScore = Math.min(100, (recentDefects * 10) + (criticalDefects * 20))

    // Get component hotspots
    const componentHotspots = defectsByComponent
      .filter((item: any) => item.component)
      .map((item: any) => ({
        component: item.component,
        defectCount: item._count.id,
        riskLevel: item._count.id > 5 ? 'High' : item._count.id > 2 ? 'Medium' : 'Low'
      }))

    // Calculate monthly trends - FIXED to show actual data range
    const monthlyTrends: any[] = []
    
    // For "all" timeframe, we need to get the actual date range of all data
    let trendsLookback: Date
    let maxMonths: number
    
    if (timeframe === 'all') {
      // Get the oldest defect to determine the actual data range
      const oldestDefect = await prisma.defect.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      })
      
      if (oldestDefect) {
        trendsLookback = oldestDefect.createdAt
        // Calculate months between oldest and now
        const monthsDiff = Math.ceil((now.getTime() - oldestDefect.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000))
        maxMonths = Math.min(24, monthsDiff) // Cap at 24 months for performance
      } else {
        trendsLookback = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        maxMonths = 12
      }
    } else {
      switch (timeframe) {
        case '7d':
          trendsLookback = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          maxMonths = 7 // 7 days
          break
        case '30d':
          trendsLookback = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000)
          maxMonths = 5 // 5 weeks
          break
        case '90d':
          trendsLookback = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
          maxMonths = 4 // 4 months
          break
        case '1y':
          trendsLookback = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          maxMonths = 12
          break
        default:
          trendsLookback = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          maxMonths = 12
          break
      }
    }
    
    const defectsWithDates = await prisma.defect.findMany({
      where: {
        createdAt: {
          gte: trendsLookback
        },
        ...(component ? { component } : {})
      },
      select: {
        createdAt: true,
        severity: true
      }
    })

    // Group defects by appropriate time period based on timeframe
    const timeData: { [key: string]: { count: number; critical: number; high: number; medium: number; low: number } } = {}
    
    defectsWithDates.forEach((defect: { createdAt: Date; severity: string | null }) => {
      let timeKey: string
      
      if (timeframe === '7d') {
        // Group by day for 7-day view
        timeKey = defect.createdAt.toISOString().substring(0, 10) // YYYY-MM-DD format
      } else if (timeframe === '30d') {
        // Group by week for 30-day view
        const weekStart = new Date(defect.createdAt)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday)
        timeKey = weekStart.toISOString().substring(0, 10) // YYYY-MM-DD format
      } else {
        // Group by month for longer periods
        timeKey = defect.createdAt.toISOString().substring(0, 7) // YYYY-MM format
      }
      
      if (!timeData[timeKey]) {
        timeData[timeKey] = { count: 0, critical: 0, high: 0, medium: 0, low: 0 }
      }
      
      timeData[timeKey].count++
      
      switch (defect.severity?.toLowerCase()) {
        case 'critical':
          timeData[timeKey].critical++
          break
        case 'high':
          timeData[timeKey].high++
          break
        case 'medium':
          timeData[timeKey].medium++
          break
        case 'low':
          timeData[timeKey].low++
          break
      }
    })

    // Convert to array and sort by time period (most recent first)
    Object.keys(timeData)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, maxMonths)
      .forEach(timeKey => {
        let displayName: string
        
        if (timeframe === '7d') {
          // Format as day name for daily view
          const date = new Date(timeKey + 'T00:00:00')
          displayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } else if (timeframe === '30d') {
          // Format as week range for weekly view
          const weekStart = new Date(timeKey + 'T00:00:00')
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 6)
          displayName = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        } else {
          // Format as month name for monthly view - INCLUDE YEAR for "all" timeframe
          const date = new Date(timeKey + '-01')
          if (timeframe === 'all') {
            // For "all time", always show year to distinguish between different years
            displayName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
          } else {
            // For specific timeframes (90d, 1y), show year only if data spans multiple years
            const currentYear = new Date().getFullYear()
            const dataYear = date.getFullYear()
            if (dataYear !== currentYear) {
              displayName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
            } else {
              displayName = date.toLocaleDateString('en-US', { month: 'short' })
            }
          }
        }
        
        monthlyTrends.push({
          month: displayName,
          count: timeData[timeKey].count,
          critical: timeData[timeKey].critical,
          high: timeData[timeKey].high,
          medium: timeData[timeKey].medium,
          low: timeData[timeKey].low
        })
      })

    return NextResponse.json({
      summary: {
        totalDefects,
        patternsFound: defectPatterns.length,
        hotspots: componentHotspots.filter((h: any) => h.riskLevel === 'High').length,
        riskScore: riskScore > 0 ? riskScore : null
      },
      defectsBySeverity: defectsBySeverity.map((item: any) => ({
        severity: item.severity || 'Unknown',
        count: item._count.id
      })),
      defectsByComponent: defectsByComponent.map((item: any) => ({
        component: item.component || 'Unknown',
        count: item._count.id
      })),
      defectsByStatus: defectsByStatus.map((item: any) => ({
        status: item.status || 'Unknown',
        count: item._count.id
      })),
      monthlyTrends,
      resolutionTimes: [],
      defectPatterns: defectPatterns.map((item: any) => ({
        rootCause: item.rootCause,
        frequency: item._count.id
      })),
      componentHotspots,
      timeframe,
      component
    })
  } catch (error) {
    console.error('Error fetching defect analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch defect analytics' },
      { status: 500 }
    )
  }
} 