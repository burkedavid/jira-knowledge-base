import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '500')
    const search = searchParams.get('search') || ''
    const priority = searchParams.get('priority') || ''
    const status = searchParams.get('status') || ''
    const sourceStoryId = searchParams.get('sourceStoryId') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { steps: { contains: search, mode: 'insensitive' } },
        { expectedResults: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (priority) {
      where.priority = priority
    }

    if (status) {
      where.status = status
    }

    if (sourceStoryId) {
      where.sourceStoryId = sourceStoryId
    }

    // Get test cases with related data
    const [testCases, total] = await Promise.all([
      prisma.testCase.findMany({
        where,
        skip,
        take: limit,
        include: {
          sourceStory: {
            select: {
              id: true,
              title: true,
              jiraKey: true
            }
          },

        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.testCase.count({ where })
    ])

    return NextResponse.json({
      testCases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Error fetching test cases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test cases' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      steps,
      expectedResults,
      priority = 'Medium',
      sourceStoryId,
      generatedFrom,
      status = 'Active'
    } = body

    // Validate required fields
    if (!title || !steps || !expectedResults) {
      return NextResponse.json(
        { error: 'Missing required fields: title, steps, expectedResults' },
        { status: 400 }
      )
    }

    // Validate sourceStoryId if provided
    if (sourceStoryId) {
      const story = await prisma.userStory.findUnique({
        where: { id: sourceStoryId }
      })
      if (!story) {
        return NextResponse.json(
          { error: 'Source story not found' },
          { status: 404 }
        )
      }
    }

    const testCase = await prisma.testCase.create({
      data: {
        title,
        steps,
        expectedResults,
        priority: priority || null,
        status: status || null,
        sourceStoryId: sourceStoryId || null,
        generatedFrom: generatedFrom || null
      },
      include: {
        sourceStory: {
          select: {
            id: true,
            title: true,
            jiraKey: true
          }
        }
      }
    })

    return NextResponse.json({ testCase }, { status: 201 })

  } catch (error) {
    console.error('Error creating test case:', error)
    return NextResponse.json(
      { error: 'Failed to create test case' },
      { status: 500 }
    )
  }
} 