import { prisma } from './prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export interface AIUsageMetrics {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  duration?: number
}

export interface AIAuditEntry {
  promptType: string
  promptName: string
  endpoint: string
  model: string
  metrics: AIUsageMetrics
  success: boolean
  errorMessage?: string
  requestData?: any
  responseData?: any
}

// Get current AI settings
export async function getAISettings() {
  let settings = await prisma.aISettings.findFirst()
  
  if (!settings) {
    // Create default settings if none exist
    settings = await prisma.aISettings.create({
      data: {
        inputTokenCostUSD: 0.000003,  // $3 per 1M input tokens (0.000003 per token)
        outputTokenCostUSD: 0.000015, // $15 per 1M output tokens (0.000015 per token)
        exchangeRateUSDToGBP: 0.74,
        model: 'Claude Sonnet 4',
        trackingEnabled: true,
        retentionDays: 90
      }
    })
  }
  
  return settings
}

// Calculate costs based on token usage
export function calculateCosts(metrics: AIUsageMetrics, settings: any) {
  const inputCostUSD = metrics.inputTokens * settings.inputTokenCostUSD
  const outputCostUSD = metrics.outputTokens * settings.outputTokenCostUSD
  const totalCostUSD = inputCostUSD + outputCostUSD
  const totalCostGBP = totalCostUSD * settings.exchangeRateUSDToGBP
  
  return {
    costUSD: totalCostUSD,
    costGBP: totalCostGBP
  }
}

// Log AI usage to audit table
export async function logAIUsage(entry: AIAuditEntry) {
  try {
    const settings = await getAISettings()
    
    // Skip logging if tracking is disabled
    if (!settings.trackingEnabled) {
      return null
    }
    
    const costs = calculateCosts(entry.metrics, settings)
    
    // Get current user session
    let userId: string | null = null
    let userEmail: string | null = null
    
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        userId = session.user.id || null
        userEmail = session.user.email || null
      }
    } catch (error) {
      // Session might not be available in all contexts
      console.warn('Could not get session for AI audit log:', error)
    }
    
    const auditLog = await prisma.aIAuditLog.create({
      data: {
        promptType: entry.promptType,
        promptName: entry.promptName,
        endpoint: entry.endpoint,
        model: entry.model,
        inputTokens: entry.metrics.inputTokens,
        outputTokens: entry.metrics.outputTokens,
        totalTokens: entry.metrics.totalTokens,
        costUSD: costs.costUSD,
        costGBP: costs.costGBP,
        userId,
        userEmail,
        requestData: entry.requestData ? JSON.stringify(entry.requestData) : null,
        responseData: entry.responseData ? JSON.stringify(entry.responseData) : null,
        duration: entry.metrics.duration,
        success: entry.success,
        errorMessage: entry.errorMessage
      }
    })
    
    console.log(`💰 AI Usage Logged: ${entry.promptName} - $${costs.costUSD.toFixed(4)} (£${costs.costGBP.toFixed(4)})`)
    
    return auditLog
  } catch (error) {
    console.error('Failed to log AI usage:', error)
    return null
  }
}

// Get audit logs with pagination
export async function getAuditLogs(page: number = 1, limit: number = 50, filters?: {
  promptType?: string
  userId?: string
  success?: boolean
  dateFrom?: Date
  dateTo?: Date
}) {
  const offset = (page - 1) * limit
  
  const where: any = {}
  
  if (filters?.promptType) {
    where.promptType = filters.promptType
  }
  
  if (filters?.userId) {
    where.userId = filters.userId
  }
  
  if (filters?.success !== undefined) {
    where.success = filters.success
  }
  
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) {
      where.createdAt.gte = filters.dateFrom
    }
    if (filters.dateTo) {
      where.createdAt.lte = filters.dateTo
    }
  }
  
  const [logs, total] = await Promise.all([
    prisma.aIAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.aIAuditLog.count({ where })
  ])
  
  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

// Get audit statistics
export async function getAuditStats(timeframe: 'day' | 'week' | 'month' | 'all' = 'month') {
  let dateFilter: any = {}
  
  if (timeframe !== 'all') {
    const now = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }
    
    dateFilter = {
      createdAt: {
        gte: startDate
      }
    }
  }
  
  const [
    totalRequests,
    successfulRequests,
    failedRequests,
    totalCostUSD,
    totalCostGBP,
    totalTokens,
    promptTypeStats
  ] = await Promise.all([
    prisma.aIAuditLog.count({ where: dateFilter }),
    prisma.aIAuditLog.count({ where: { ...dateFilter, success: true } }),
    prisma.aIAuditLog.count({ where: { ...dateFilter, success: false } }),
    prisma.aIAuditLog.aggregate({
      where: dateFilter,
      _sum: { costUSD: true }
    }),
    prisma.aIAuditLog.aggregate({
      where: dateFilter,
      _sum: { costGBP: true }
    }),
    prisma.aIAuditLog.aggregate({
      where: dateFilter,
      _sum: { totalTokens: true }
    }),
    prisma.aIAuditLog.groupBy({
      by: ['promptType'],
      where: dateFilter,
      _count: { id: true },
      _sum: { costUSD: true, totalTokens: true }
    })
  ])
  
  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    totalCostUSD: totalCostUSD._sum.costUSD || 0,
    totalCostGBP: totalCostGBP._sum.costGBP || 0,
    totalTokens: totalTokens._sum.totalTokens || 0,
    promptTypeStats: promptTypeStats.map(stat => ({
      promptType: stat.promptType,
      requests: stat._count.id,
      costUSD: stat._sum.costUSD || 0,
      tokens: stat._sum.totalTokens || 0
    }))
  }
}

// Clear audit logs (with optional filters)
export async function clearAuditLogs(filters?: {
  olderThan?: Date
  promptType?: string
  userId?: string
}) {
  const where: any = {}
  
  if (filters?.olderThan) {
    where.createdAt = { lt: filters.olderThan }
  }
  
  if (filters?.promptType) {
    where.promptType = filters.promptType
  }
  
  if (filters?.userId) {
    where.userId = filters.userId
  }
  
  const result = await prisma.aIAuditLog.deleteMany({ where })
  
  console.log(`🗑️ Cleared ${result.count} audit log entries`)
  
  return result
}

// Update AI settings
export async function updateAISettings(updates: {
  inputTokenCostUSD?: number
  outputTokenCostUSD?: number
  exchangeRateUSDToGBP?: number
  model?: string
  trackingEnabled?: boolean
  retentionDays?: number
}, updatedBy?: string) {
  const settings = await getAISettings()
  
  const updated = await prisma.aISettings.update({
    where: { id: settings.id },
    data: {
      ...updates,
      updatedBy
    }
  })
  
  console.log('⚙️ AI settings updated:', updates)
  
  return updated
}

// Cleanup old audit logs based on retention policy
export async function cleanupOldAuditLogs() {
  const settings = await getAISettings()
  
  if (settings.retentionDays > 0) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - settings.retentionDays)
    
    const result = await clearAuditLogs({ olderThan: cutoffDate })
    
    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} old audit logs (older than ${settings.retentionDays} days)`)
    }
    
    return result
  }
  
  return { count: 0 }
} 