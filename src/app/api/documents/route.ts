import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const version = searchParams.get('version') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { metadata: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (type) {
      where.type = type
    }

    if (version) {
      where.version = version
    }

    // Get documents with related data
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { createdAt: 'desc' }
        ]
      }),
      prisma.document.count({ where })
    ])

    return NextResponse.json({
      documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      content,
      fileName,
      type = 'text',
      version = '1.0',
      changelog,
      metadata,
      fileSize
    } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content' },
        { status: 400 }
      )
    }

    const document = await prisma.document.create({
      data: {
        title,
        content,
        fileName: fileName || null,
        type,
        version,
        changelog: changelog || null,
        metadata: metadata || null,
        fileSize: fileSize || null
      }
    })

    return NextResponse.json({ document }, { status: 201 })

  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
} 