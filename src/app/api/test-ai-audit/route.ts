import { NextRequest, NextResponse } from 'next/server'
import { logAIUsage, getAuditLogs } from '@/lib/ai-audit'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing AI audit logging...')
    
    // Create a test AI usage log
    const testEntry = {
      promptType: 'test-case-generation',
      promptName: 'Test Case Generation',
      endpoint: '/api/generate/test-cases',
      model: 'Claude Sonnet 4',
      metrics: {
        inputTokens: 1500,
        outputTokens: 2500,
        totalTokens: 4000,
        duration: 3500
      },
      success: true,
      requestData: { maxTokens: 4000, temperature: 0.3 },
      responseData: { textLength: 8500 }
    }

    console.log('📝 Creating test audit log entry...')
    const result = await logAIUsage(testEntry)
    
    if (result) {
      console.log('✅ Test audit log created successfully:', result.id)
      return NextResponse.json({ 
        success: true, 
        message: 'Test audit log created',
        logId: result.id,
        costUSD: result.costUSD,
        costGBP: result.costGBP
      })
    } else {
      console.log('❌ Failed to create test audit log')
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create test audit log - logAIUsage returned null' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('💥 Error testing AI audit:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test AI audit logging', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing AI audit log fetch directly...')
    
    // Test fetching audit logs directly using the database function
    const logs = await getAuditLogs(1, 10)
    
    console.log('📊 Direct fetch result:', logs.total, 'total logs')
    
    return NextResponse.json({
      success: true,
      message: 'Successfully fetched audit logs directly',
      logsCount: logs.logs.length,
      totalLogs: logs.total,
      logs: logs.logs.map(log => ({
        id: log.id,
        promptType: log.promptType,
        promptName: log.promptName,
        model: log.model,
        costUSD: log.costUSD,
        success: log.success,
        createdAt: log.createdAt
      }))
    })
  } catch (error) {
    console.error('💥 Error testing audit log fetch:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test audit log fetch', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}