import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get total count first
    const total = await prisma.defect.count()

    const defects = await prisma.defect.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        stepsToReproduce: true,
        rootCause: true,
        resolution: true,
        severity: true,
        priority: true,
        component: true,
        status: true,
        jiraId: true,
        jiraKey: true,
        assignee: true,
        reporter: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    return NextResponse.json({
      defects,
      total,
      originalTotal: total,
      limit,
      offset,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching defects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch defects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      jiraKey,
      severity = 'Medium',
      status = 'Open',
      component,
      rootCause,
      resolution,
      stepsToReproduce
    } = body

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description' },
        { status: 400 }
      )
    }

    // Check if jiraKey already exists
    if (jiraKey) {
      const existingDefect = await prisma.defect.findFirst({
        where: { jiraKey }
      })
      if (existingDefect) {
        return NextResponse.json(
          { error: 'Defect with this Jira key already exists' },
          { status: 409 }
        )
      }
    }

    const defect = await prisma.defect.create({
      data: {
        title,
        description,
        jiraKey: jiraKey || null,
        severity,
        status,
        component: component || null,
        rootCause: rootCause || null,
        resolution: resolution || null,
        stepsToReproduce: stepsToReproduce || null
      }
    })

    return NextResponse.json({ defect }, { status: 201 })

  } catch (error) {
    console.error('Error creating defect:', error)
    return NextResponse.json(
      { error: 'Failed to create defect' },
      { status: 500 }
    )
  }
} 