import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')
    const component = searchParams.get('component')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { jiraKey: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (component) {
      where.component = component
    }
    
    if (priority) {
      where.priority = priority
    }
    
    if (status) {
      where.status = status
    }

    // Get user stories with counts
    const [userStories, total] = await Promise.all([
      prisma.userStory.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
        include: {
          testCases: {
            select: { id: true }
          },
          qualityScores: {
            select: { score: true, generatedAt: true },
            orderBy: { generatedAt: 'desc' },
            take: 1
          },
          requirementAnalyses: {
            select: { qualityScore: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.userStory.count({ where })
    ])

    // Helper function to get the most recent quality score (same logic as analysis API)
    const getLatestQualityScore = (story: any) => {
      const qualityScore = story.qualityScores[0]
      const requirementAnalysis = story.requirementAnalyses[0]

      if (qualityScore && requirementAnalysis) {
        // Compare dates to find the most recent
        const qualityScoreDate = new Date(qualityScore.generatedAt)
        const requirementAnalysisDate = new Date(requirementAnalysis.createdAt)
        
        if (qualityScoreDate > requirementAnalysisDate) {
          return qualityScore.score
        } else {
          return requirementAnalysis.qualityScore
        }
      } else if (qualityScore) {
        return qualityScore.score
      } else if (requirementAnalysis) {
        return requirementAnalysis.qualityScore
      }
      
      return null
    }

    // Format response
    const formattedStories = userStories.map((story: any) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      acceptanceCriteria: story.acceptanceCriteria,
      jiraKey: story.jiraKey,
      priority: story.priority,
      status: story.status,
      component: story.component,
      assignee: story.assignee,
      reporter: story.reporter,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      testCaseCount: story.testCases.length,
      latestQualityScore: getLatestQualityScore(story)
    }))

    return NextResponse.json({
      userStories: formattedStories,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    })

  } catch (error) {
    console.error('Error fetching user stories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const userStory = await prisma.userStory.create({
      data: {
        title: data.title,
        description: data.description,
        acceptanceCriteria: data.acceptanceCriteria,
        priority: data.priority || 'Medium',
        status: data.status || 'To Do',
        component: data.component,
        assignee: data.assignee,
        reporter: data.reporter,
        jiraKey: data.jiraKey,
        jiraId: data.jiraId
      }
    })

    return NextResponse.json(userStory, { status: 201 })

  } catch (error) {
    console.error('Error creating user story:', error)
    return NextResponse.json(
      { error: 'Failed to create user story' },
      { status: 500 }
    )
  }
} 