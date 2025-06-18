import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Interface for manager metrics (copied from main route)
interface ManagerMetrics {
  totalDefects: number
  severityBreakdown: Record<string, number>
  componentBreakdown: Record<string, number>
  monthlyTrends: Array<{
    month: string
    count: number
    avgResolutionDays: number
  }>
  qualityScore: number
  defectEscapeRate: number
  avgResolutionTime: number
  topProblemAreas: string[]
  costImpactEstimate: number
}

async function getManagerMetricsOnly(
  whereClause: any,
  timeRange: number
): Promise<ManagerMetrics> {
  console.log('🏢 Starting quick manager metrics calculation...')
  const startTime = Date.now()

  // 1. Get basic counts and stats (fast queries)
  const [totalDefects, severityStats, componentStats, statusStats] = await Promise.all([
    prisma.defect.count({ where: whereClause }),
    prisma.defect.groupBy({
      by: ['severity'],
      where: whereClause,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    }),
    prisma.defect.groupBy({
      by: ['component'],
      where: whereClause,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    }),
    prisma.defect.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { id: true }
    })
  ])

  console.log(`   - Basic stats calculated: ${totalDefects} total defects`)

  // 2. Calculate monthly trends (simplified for speed)
  let monthlyTrends: Array<{ month: string; count: number; avgResolutionDays: number }> = []
  
  try {
    // Get last 24 months of data for trends
    const monthsAgo = new Date()
    monthsAgo.setMonth(monthsAgo.getMonth() - 24)
    
    const monthlyDefects = await prisma.defect.findMany({
      where: {
        ...whereClause,
        createdAt: { gte: monthsAgo }
      },
      select: {
        createdAt: true,
        resolvedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Group by month in JavaScript (database agnostic)
    const monthlyData: Record<string, { count: number; totalResolutionDays: number; resolvedCount: number }> = {}
    
    monthlyDefects.forEach(defect => {
      const monthKey = defect.createdAt.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, totalResolutionDays: 0, resolvedCount: 0 }
      }
      monthlyData[monthKey].count++
      
      if (defect.resolvedAt) {
        const resolutionDays = Math.floor(
          (defect.resolvedAt.getTime() - defect.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        monthlyData[monthKey].totalResolutionDays += resolutionDays
        monthlyData[monthKey].resolvedCount++
      }
    })
    
    // Convert to array and sort
    monthlyTrends = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        count: data.count,
        avgResolutionDays: data.resolvedCount > 0 ? Math.round(data.totalResolutionDays / data.resolvedCount) : 0
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 24)
    
    console.log(`   - Monthly trends calculated: ${monthlyTrends.length} months`)
    
  } catch (error) {
    console.error('Error calculating monthly trends:', error)
    monthlyTrends = []
  }

  // 3. Calculate quality metrics
  const resolvedDefects = statusStats.find(s => s.status === 'Resolved')?._count.id || 0
  const defectEscapeRate = totalDefects > 0 ? ((totalDefects - resolvedDefects) / totalDefects) * 100 : 0
  
  const avgResolutionTime = monthlyTrends.reduce((sum, trend) => 
    sum + trend.avgResolutionDays, 0
  ) / Math.max(1, monthlyTrends.filter(t => t.avgResolutionDays > 0).length)

  // 4. Calculate quality score (0-10 scale)
  const criticalCount = severityStats.find(s => s.severity === 'Critical')?._count.id || 0
  const highCount = severityStats.find(s => s.severity === 'High')?._count.id || 0
  const qualityScore = Math.max(0, 10 - (
    (criticalCount * 3 + highCount * 2) / Math.max(1, totalDefects) * 10
  ))

  // 5. Identify top problem areas
  const topProblemAreas = componentStats
    .slice(0, 5)
    .map(c => c.component || 'Unknown')
    .filter(c => c !== 'Unknown')

  // 6. Estimate cost impact
  const avgDeveloperHoursPerDefect = 8
  const avgHourlyRate = 75
  const costImpactEstimate = totalDefects * avgDeveloperHoursPerDefect * avgHourlyRate

  const metrics: ManagerMetrics = {
    totalDefects,
    severityBreakdown: severityStats.reduce((acc, s) => {
      acc[s.severity || 'Unknown'] = s._count.id
      return acc
    }, {} as Record<string, number>),
    componentBreakdown: componentStats.reduce((acc, c) => {
      acc[c.component || 'Unknown'] = c._count.id
      return acc
    }, {} as Record<string, number>),
    monthlyTrends: monthlyTrends.map(t => ({
      month: t.month,
      count: t.count,
      avgResolutionDays: t.avgResolutionDays
    })),
    qualityScore: Math.round(qualityScore * 10) / 10,
    defectEscapeRate: Math.round(defectEscapeRate * 10) / 10,
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
    topProblemAreas,
    costImpactEstimate
  }

  console.log(`⚡ Quick manager metrics completed in ${Date.now() - startTime}ms`)
  
  return metrics
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Quick preprocessing metrics endpoint called')
    
    const { component, timeRange, severity } = await request.json()

    // Build where clause (same logic as main route)
    let whereClause: any = {}
    
    if (component && component !== 'all') {
      whereClause.component = component
    }
    
    if (severity && severity !== 'all') {
      whereClause.severity = severity
    }
    
    if (timeRange && timeRange < 36500) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - timeRange)
      whereClause.createdAt = { gte: startDate }
    }

    // Get quick manager metrics
    const metrics = await getManagerMetricsOnly(whereClause, timeRange || 36500)
    
    // Create basic sampling info for UI
    const samplingInfo = {
      strategy: timeRange >= 36500 ? 'manager_metrics_preprocessing' : 'quick_overview',
      totalDefectsInPeriod: metrics.totalDefects,
      representativenesScore: 1.0,
      samplingDetails: {
        criticalDefects: metrics.severityBreakdown['Critical'] || 0,
        highDefects: metrics.severityBreakdown['High'] || 0,
        mediumDefects: metrics.severityBreakdown['Medium'] || 0,
        lowDefects: metrics.severityBreakdown['Low'] || 0,
        componentsCovered: Object.keys(metrics.componentBreakdown).length,
        timeSpanCovered: timeRange >= 36500 ? 'All time (complete)' : `${timeRange} days`
      }
    }

    console.log('✅ Quick preprocessing metrics completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Quick preprocessing metrics calculated',
      metrics,
      samplingInfo,
      metadata: {
        calculationTime: Date.now(),
        timeRange: timeRange || 36500,
        component: component || 'all',
        severity: severity || 'all'
      }
    })

  } catch (error) {
    console.error('💥 Error in quick preprocessing:', error)
    return NextResponse.json(
      { 
        error: 'Failed to calculate preprocessing metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 