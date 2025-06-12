import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getAISettings, updateAISettings } from '@/lib/ai-audit'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getAISettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching AI settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    
    const updates: any = {}
    
    if (typeof body.inputTokenCostUSD === 'number') {
      updates.inputTokenCostUSD = body.inputTokenCostUSD
    }
    
    if (typeof body.outputTokenCostUSD === 'number') {
      updates.outputTokenCostUSD = body.outputTokenCostUSD
    }
    
    if (typeof body.exchangeRateUSDToGBP === 'number') {
      updates.exchangeRateUSDToGBP = body.exchangeRateUSDToGBP
    }
    
    if (typeof body.model === 'string') {
      updates.model = body.model
    }
    
    if (typeof body.trackingEnabled === 'boolean') {
      updates.trackingEnabled = body.trackingEnabled
    }
    
    if (typeof body.retentionDays === 'number') {
      updates.retentionDays = body.retentionDays
    }

    const updatedSettings = await updateAISettings(updates, session.user?.email || undefined)

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating AI settings:', error)
    return NextResponse.json(
      { error: 'Failed to update AI settings' },
      { status: 500 }
    )
  }
} 