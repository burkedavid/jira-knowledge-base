import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import fs from 'fs/promises'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'product-context.json')

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
      const context = JSON.parse(data)
      return NextResponse.json({ qualityThreshold: context.qualityThreshold || 7 })
    } catch {
      // File doesn't exist, return default
      return NextResponse.json({ qualityThreshold: 7 })
    }
  } catch (error) {
    console.error('Error reading quality threshold:', error)
    return NextResponse.json({ qualityThreshold: 7 })
  }
} 