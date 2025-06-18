import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('orderBy') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    
    // Search and filter parameters
    const search = searchParams.get('search')
    const component = searchParams.get('component')
    const priority = searchParams.get('priority')
    const status = searchParams.get('status')
    const assignee = searchParams.get('assignee')
    const reporter = searchParams.get('reporter')
    
    // Quality score range
    const qualityScoreMin = searchParams.get('qualityScoreMin')
    const qualityScoreMax = searchParams.get('qualityScoreMax')
    
    // Story points range
    const storyPointsMin = searchParams.get('storyPointsMin')
    const storyPointsMax = searchParams.get('storyPointsMax')
    
    // Date range
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    const dateField = searchParams.get('dateField') || 'createdAt'
    
    // Boolean filters
    const hasAcceptanceCriteria = searchParams.get('hasAcceptanceCriteria')
    const hasTestCases = searchParams.get('hasTestCases')

    // Build where clause
    const where: any = {}
    
    if (search) {
      // For SQLite, we'll search for both the original search term and uppercase version
      // This helps find Jira keys like "FL-15984" regardless of how they're stored
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { jiraKey: { contains: search } },
        { jiraKey: { contains: search.toUpperCase() } },
        { component: { contains: search } }
      ]
    }
    
    // Handle multiple values (comma-separated)
    if (component) {
      const components = component.split(',').map(c => c.trim())
      where.component = components.length === 1 ? components[0] : { in: components }
    }
    
    if (priority) {
      const priorities = priority.split(',').map(p => p.trim())
      where.priority = priorities.length === 1 ? priorities[0] : { in: priorities }
    }
    
    if (status) {
      const statuses = status.split(',').map(s => s.trim())
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses }
    }
    
    if (assignee) {
      const assignees = assignee.split(',').map(a => a.trim())
      where.assignee = assignees.length === 1 ? assignees[0] : { in: assignees }
    }
    
    if (reporter) {
      const reporters = reporter.split(',').map(r => r.trim())
      where.reporter = reporters.length === 1 ? reporters[0] : { in: reporters }
    }
    
    // Story points range
    if (storyPointsMin || storyPointsMax) {
      where.storyPoints = {}
      if (storyPointsMin) where.storyPoints.gte = parseInt(storyPointsMin)
      if (storyPointsMax) where.storyPoints.lte = parseInt(storyPointsMax)
    }
    
    // Date range filter
    if (dateStart || dateEnd) {
      const dateFieldKey = dateField as 'createdAt' | 'updatedAt'
      where[dateFieldKey] = {}
      if (dateStart) where[dateFieldKey].gte = new Date(dateStart)
      if (dateEnd) {
        const endDate = new Date(dateEnd)
        endDate.setHours(23, 59, 59, 999) // Include the entire end date
        where[dateFieldKey].lte = endDate
      }
    }
    
    // Boolean filters
    if (hasAcceptanceCriteria !== null) {
      if (hasAcceptanceCriteria === 'true') {
        where.acceptanceCriteria = { not: null }
      } else if (hasAcceptanceCriteria === 'false') {
        where.acceptanceCriteria = null
      }
    }
    
    // For test cases, we'll need to handle this in the query since it's a relation
    let testCaseFilter = null
    if (hasTestCases !== null) {
      testCaseFilter = hasTestCases === 'true'
    }

    // Build orderBy clause
    const orderByClause: any = {}
    if (orderBy === 'priority') {
      orderByClause.priority = order
    } else if (orderBy === 'updatedAt') {
      orderByClause.updatedAt = order
    } else {
      orderByClause.createdAt = order
    }

    // Get user stories with counts
    let userStoriesQuery = prisma.userStory.findMany({
      where,
      orderBy: orderByClause,
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
    })

    // Create a separate where clause for count - should match the main where clause
    const countWhere = { ...where }
    if (search && countWhere.OR) {
      countWhere.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { jiraKey: { contains: search } },
        { jiraKey: { contains: search.toUpperCase() } },
        { component: { contains: search } }
      ]
    }

    const [userStories, total] = await Promise.all([
      userStoriesQuery,
      prisma.userStory.count({ where: countWhere })
    ])

    // Helper function to get the most recent quality score (same logic as analysis API)
    const getLatestQualityScore = (story: any) => {
      if (!story.qualityScores || story.qualityScores.length === 0) {
        return null;
      }
      
      // Get the most recent quality score
      const latestScore = story.qualityScores[0]?.score;
      console.log('🐛 DEBUG - Latest Quality Score:', {
        storyId: story.id,
        storyTitle: story.title,
        qualityScoresCount: story.qualityScores.length,
        latestScore: latestScore,
        allScores: story.qualityScores.map((qs: any) => ({ score: qs.score, date: qs.generatedAt }))
      });
      
      return latestScore;
    }

    // Apply post-query filters (for quality score and test cases)
    let filteredStories = userStories
    
    // Filter by test case count
    if (testCaseFilter !== null) {
      filteredStories = filteredStories.filter((story: any) => {
        const hasTests = story.testCases.length > 0
        return testCaseFilter ? hasTests : !hasTests
      })
    }
    
    // Filter by quality score range
    if (qualityScoreMin || qualityScoreMax) {
      filteredStories = filteredStories.filter((story: any) => {
        const qualityScore = getLatestQualityScore(story)
        if (qualityScore === null) return false
        
        if (qualityScoreMin && qualityScore < parseInt(qualityScoreMin)) return false
        if (qualityScoreMax && qualityScore > parseInt(qualityScoreMax)) return false
        
        return true
      })
    }

    // Format response
    const formattedStories = filteredStories.map((story: any) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      acceptanceCriteria: story.acceptanceCriteria,
      jiraKey: story.jiraKey,
      jiraId: story.jiraId,
      priority: story.priority,
      status: story.status,
      component: story.component,
      assignee: story.assignee,
      reporter: story.reporter,
      storyPoints: story.storyPoints,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      testCases: story.testCases, // Include full test case data for the component
      testCaseCount: story.testCases.length,
      qualityScore: getLatestQualityScore(story), // Use qualityScore instead of latestQualityScore
      latestQualityScore: getLatestQualityScore(story) // Keep for backward compatibility
    }))

    return NextResponse.json({
      userStories: formattedStories,
      total: filteredStories.length, // Use filtered count for pagination
      originalTotal: total, // Keep original total for reference
      limit,
      offset,
      hasMore: offset + limit < filteredStories.length
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