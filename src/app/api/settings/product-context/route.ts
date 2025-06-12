import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'product-context.json')

interface ProductContext {
  productName: string
  description: string
  industry: string
  userTypes: string[]
  keyFeatures: string[]
  securityStandards: string[]
  qualityThreshold?: number
}

const DEFAULT_CONTEXT: ProductContext = {
  productName: 'Fusion Live',
  description: 'Idox FusionLive is a secure, cloud‑based engineering document management system (EDMS) and common data environment (CDE) tailored for engineering, construction, and asset‑intensive industries. It centralises all project documentation—drawings, 3D models, deliverables—in a single, version‑controlled environment, enabling automated workflows, intelligent tag extraction, and real‑time dashboards to improve collaboration, compliance, and decision‑making. Designed for EPCs, owner‑operators, contractors, and field teams, FusionLive supports the full asset lifecycle—from design and construction through commissioning and operations—while ensuring ISO 27001‑grade security.',
  industry: 'Engineering & Construction',
  userTypes: ['EPCs', 'Owner-operators', 'Contractors', 'Field teams', 'Project managers', 'Engineers'],
  keyFeatures: ['Document management', 'Version control', 'Automated workflows', 'Tag extraction', 'Real-time dashboards', '3D model support', 'Compliance tracking'],
  securityStandards: ['ISO 27001', 'Cloud security', 'Data encryption', 'Access controls'],
  qualityThreshold: 7
}

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    await ensureDataDirectory()
    
    try {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
      const context = JSON.parse(data)
      return NextResponse.json(context)
    } catch {
      // File doesn't exist, return default
      return NextResponse.json(DEFAULT_CONTEXT)
    }
  } catch (error) {
    console.error('Error reading product context:', error)
    return NextResponse.json(DEFAULT_CONTEXT)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const context: ProductContext = await request.json()
    
    // Validate required fields
    if (!context.productName || !context.description || !context.industry) {
      return NextResponse.json(
        { error: 'Missing required fields: productName, description, industry' },
        { status: 400 }
      )
    }

    await ensureDataDirectory()
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(context, null, 2))
    
    return NextResponse.json({ success: true, context })
  } catch (error) {
    console.error('Error saving product context:', error)
    return NextResponse.json(
      { error: 'Failed to save product context' },
      { status: 500 }
    )
  }
} 