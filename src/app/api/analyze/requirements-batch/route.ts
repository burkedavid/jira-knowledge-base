import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBedrockClient } from '@/lib/aws-bedrock'

// Import semantic search for RAG context
async function semanticSearchWithDetails(
  query: string,
  sourceTypes: ('user_story' | 'defect' | 'test_case' | 'document')[],
  limit: number = 10,
  threshold: number = 0.7
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search/semantic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        sourceTypes,
        limit,
        threshold,
        includeDetails: true
      })
    })

    if (!response.ok) {
      throw new Error(`Semantic search failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Semantic search error:', error)
    return []
  }
}

interface BatchAnalysisRequest {
  name: string
  description?: string
  filters?: {
    priority?: string[]
    status?: string[]
    component?: string[]
    assignee?: string[]
    dateRange?: {
      start: string
      end: string
    }
  }
  userStoryIds?: string[] // Optional: specific user stories to analyze
}

interface RequirementAnalysis {
  id: string
  qualityScore: number
  riskLevel: string
  userStory: {
    id: string
    title: string
    jiraKey: string | null
    priority: string | null
    status: string | null
  }
}

// POST: Create a new batch analysis
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting batch analysis request...')
    const body: BatchAnalysisRequest = await request.json()
    console.log('📋 Request body:', JSON.stringify(body, null, 2))
    
    const { name, description, filters, userStoryIds } = body

    // Create analysis batch record
    console.log('💾 Creating batch record...')
    const batch = await prisma.analysisBatch.create({
      data: {
        name,
        description,
        status: 'pending',
        filters: filters ? JSON.stringify(filters) : null
      }
    })
    console.log('✅ Batch created:', batch.id)

    // Build query for user stories to analyze
    let whereClause: any = {}
    
    if (userStoryIds && userStoryIds.length > 0) {
      console.log('🎯 Using specific user story IDs:', userStoryIds)
      whereClause.id = { in: userStoryIds }
    } else if (filters) {
      console.log('🔍 Applying filters:', JSON.stringify(filters, null, 2))
      
      if (filters.priority && filters.priority.length > 0) {
        whereClause.priority = { in: filters.priority }
        console.log('📋 Priority filter:', filters.priority)
      }
      if (filters.status && filters.status.length > 0) {
        whereClause.status = { in: filters.status }
        console.log('📊 Status filter:', filters.status)
      }
      if (filters.component && filters.component.length > 0) {
        whereClause.component = { in: filters.component }
        console.log('🔧 Component filter:', filters.component)
      }
      if (filters.assignee && filters.assignee.length > 0) {
        whereClause.assignee = { in: filters.assignee }
        console.log('👤 Assignee filter:', filters.assignee)
      }
      if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
        const dateConditions: any = {}
        
        if (filters.dateRange.start && filters.dateRange.start.trim()) {
          const startDate = new Date(filters.dateRange.start)
          if (!isNaN(startDate.getTime())) {
            dateConditions.gte = startDate
            console.log('📅 Start date filter:', startDate.toISOString())
          }
        }
        
        if (filters.dateRange.end && filters.dateRange.end.trim()) {
          const endDate = new Date(filters.dateRange.end)
          if (!isNaN(endDate.getTime())) {
            // Set end date to end of day to include stories created on that day
            endDate.setHours(23, 59, 59, 999)
            dateConditions.lte = endDate
            console.log('📅 End date filter:', endDate.toISOString())
          }
        }
        
        if (Object.keys(dateConditions).length > 0) {
          whereClause.createdAt = dateConditions
          console.log('📅 Date range filter applied:', dateConditions)
        }
      }
    } else {
      console.log('⚠️ No filters or user story IDs provided - will analyze ALL user stories')
    }

    console.log('🔍 Final query where clause:', JSON.stringify(whereClause, null, 2))

    // Get user stories to analyze
    const userStories = await prisma.userStory.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        acceptanceCriteria: true,
        jiraKey: true,
        priority: true,
        status: true,
        component: true
      }
    })
    console.log(`📊 Found ${userStories.length} user stories to analyze`)

    // Update batch with total count and set to running
    const updatedBatch = await prisma.analysisBatch.update({
      where: { id: batch.id },
      data: {
        totalStories: userStories.length,
        status: 'running'
      }
    })
    console.log('🔄 Updated batch status to running')

    // CRITICAL FIX: We do NOT start any background processing here
    // The frontend will poll the PUT endpoint to process stories one by one
    // This prevents overwhelming AWS Bedrock with concurrent requests
    
    const response = {
      success: true,
      batch: {
        id: updatedBatch.id,
        name: updatedBatch.name,
        status: updatedBatch.status,
        totalStories: updatedBatch.totalStories,
        analyzedStories: updatedBatch.analyzedStories,
        createdAt: updatedBatch.startedAt.toISOString()
      },
      message: `Started analysis of ${userStories.length} user stories`
    }
    
    console.log('✅ Sending response:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Error starting batch analysis:', error)
    return NextResponse.json(
      { error: 'Failed to start batch analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET: Retrieve batch analysis results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')

    if (batchId) {
      // Get specific batch with its analyses
      const batch = await prisma.analysisBatch.findUnique({
        where: { id: batchId }
      })

      if (!batch) {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        )
      }

      const analyses = await prisma.requirementAnalysis.findMany({
        where: { batchId },
        include: {
          userStory: {
            select: {
              id: true,
              title: true,
              jiraKey: true,
              priority: true,
              status: true
            }
          }
        },
        orderBy: { qualityScore: 'desc' }
      })

      // Map database fields to frontend expectations
      const mappedAnalyses = analyses.map(analysis => ({
        ...analysis,
        fullAnalysis: analysis.aiAnalysis, // Map aiAnalysis to fullAnalysis for frontend
        strengths: JSON.parse(analysis.strengths || '[]'),
        improvements: JSON.parse(analysis.improvements || '[]'),
        riskFactors: JSON.parse(analysis.riskFactors || '[]')
      }))

      return NextResponse.json({
        batch,
        analyses: mappedAnalyses,
        summary: {
          totalAnalyzed: mappedAnalyses.length,
          averageScore: mappedAnalyses.length > 0 
            ? mappedAnalyses.reduce((sum: number, a: any) => sum + a.qualityScore, 0) / mappedAnalyses.length 
            : 0,
          riskDistribution: {
            Critical: mappedAnalyses.filter((analysis: any) => analysis.riskLevel === 'Critical').length,
            High: mappedAnalyses.filter((analysis: any) => analysis.riskLevel === 'High').length,
            Medium: mappedAnalyses.filter((analysis: any) => analysis.riskLevel === 'Medium').length,
            Low: mappedAnalyses.filter((analysis: any) => analysis.riskLevel === 'Low').length
          }
        }
      })
    } else {
      // Check if we need to get all analyses stats
      const getAllAnalyses = searchParams.get('getAllAnalyses')
      
      if (getAllAnalyses === 'true') {
        // Get all requirement analyses for platform overview stats
        const totalAnalyses = await prisma.requirementAnalysis.count()
        
        if (totalAnalyses > 0) {
          const allAnalyses = await prisma.requirementAnalysis.findMany({
            select: { qualityScore: true }
          })
          
          const averageScore = allAnalyses.reduce((sum: number, analysis: { qualityScore: number }) => sum + analysis.qualityScore, 0) / allAnalyses.length
          
          return NextResponse.json({
            totalAnalyses,
            averageScore: Math.round(averageScore * 10) / 10
          })
        } else {
          return NextResponse.json({
            totalAnalyses: 0,
            averageScore: 0
          })
        }
      }
      
      // Get all batches
      const batches = await prisma.analysisBatch.findMany({
        orderBy: { startedAt: 'desc' },
        take: 20
      })

      // Serialize dates properly for JSON response
      const serializedBatches = batches.map(batch => ({
        ...batch,
        createdAt: batch.startedAt?.toISOString() || new Date().toISOString(),
        completedAt: batch.completedAt?.toISOString() || null,
        startedAt: batch.startedAt?.toISOString() || new Date().toISOString()
      }))

      return NextResponse.json({ batches: serializedBatches })
    }

  } catch (error) {
    console.error('Error fetching batch analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch batch analysis' },
      { status: 500 }
    )
  }
}

// DELETE: Cancel or delete batch analysis
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    const action = searchParams.get('action') // 'cancel' or 'delete'

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      )
    }

    const batch = await prisma.analysisBatch.findUnique({
      where: { id: batchId }
    })

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    if (action === 'cancel') {
      // Cancel a running batch - preserve completed analyses
      if (batch.status !== 'running') {
        return NextResponse.json(
          { error: 'Can only cancel running batches' },
          { status: 400 }
        )
      }

      // Get current analysis count
      const analysisCount = await prisma.requirementAnalysis.count({
        where: { batchId }
      })

      // Update batch status to cancelled and set final counts
      const updatedBatch = await prisma.analysisBatch.update({
        where: { id: batchId },
        data: {
          status: 'cancelled',
          analyzedStories: analysisCount,
          completedAt: new Date()
        }
      })

      // Calculate final average score if there are analyses
      if (analysisCount > 0) {
        const analyses = await prisma.requirementAnalysis.findMany({
          where: { batchId },
          select: { qualityScore: true }
        })
        
        const averageScore = analyses.reduce((sum: number, analysis: { qualityScore: number }) => sum + analysis.qualityScore, 0) / analyses.length
        
        await prisma.analysisBatch.update({
          where: { id: batchId },
          data: { averageScore }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Batch cancelled successfully',
        batch: updatedBatch
      })

    } else if (action === 'delete') {
      // Delete batch and all its analyses
      await prisma.requirementAnalysis.deleteMany({
        where: { batchId }
      })

      await prisma.analysisBatch.delete({
        where: { id: batchId }
      })

      return NextResponse.json({
        success: true,
        message: 'Batch deleted successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "cancel" or "delete"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error deleting/cancelling batch:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// PUT: Process next story in batch (controlled processing)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    const action = searchParams.get('action')

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      )
    }

    if (action === 'process') {
      // Process the next user story in the batch
      const batch = await prisma.analysisBatch.findUnique({
        where: { id: batchId }
      })

      if (!batch) {
        return NextResponse.json(
          { error: 'Batch not found' },
          { status: 404 }
        )
      }

      if (batch.status !== 'running') {
        return NextResponse.json(
          { error: 'Batch is not in running state' },
          { status: 400 }
        )
      }

      // Get the filters from the batch
      const filters = batch.filters ? JSON.parse(batch.filters) : null
      
      // Build the same query as in POST to get user stories
      let whereClause: any = {}
      
      if (filters) {
        if (filters.priority && filters.priority.length > 0) {
          whereClause.priority = { in: filters.priority }
        }
        if (filters.status && filters.status.length > 0) {
          whereClause.status = { in: filters.status }
        }
        if (filters.component && filters.component.length > 0) {
          whereClause.component = { in: filters.component }
        }
        if (filters.assignee && filters.assignee.length > 0) {
          whereClause.assignee = { in: filters.assignee }
        }
        if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
          const dateConditions: any = {}
          
          if (filters.dateRange.start && filters.dateRange.start.trim()) {
            const startDate = new Date(filters.dateRange.start)
            if (!isNaN(startDate.getTime())) {
              dateConditions.gte = startDate
              console.log('📅 Start date filter:', startDate.toISOString())
            }
          }
          
          if (filters.dateRange.end && filters.dateRange.end.trim()) {
            const endDate = new Date(filters.dateRange.end)
            if (!isNaN(endDate.getTime())) {
              // Set end date to end of day to include stories created on that day
              endDate.setHours(23, 59, 59, 999)
              dateConditions.lte = endDate
              console.log('📅 End date filter:', endDate.toISOString())
            }
          }
          
          if (Object.keys(dateConditions).length > 0) {
            whereClause.createdAt = dateConditions
            console.log('📅 Date range filter applied:', dateConditions)
          }
        }
      }

      // Get all user stories that match the criteria
      const allUserStories = await prisma.userStory.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          acceptanceCriteria: true,
          jiraKey: true,
          priority: true,
          status: true,
          component: true
        }
      })

      // Get already analyzed stories for this batch
      const analyzedStoryIds = await prisma.requirementAnalysis.findMany({
        where: { batchId },
        select: { userStoryId: true }
      })
      
      const analyzedIds = new Set(analyzedStoryIds.map((a: { userStoryId: string }) => a.userStoryId))
      
      // Find the next story to analyze
      const nextStory = allUserStories.find((story: any) => !analyzedIds.has(story.id))
      
      if (!nextStory) {
        // All stories have been analyzed, mark batch as completed
        const analysisCount = await prisma.requirementAnalysis.count({
          where: { batchId }
        })
        
        // Calculate final average score
        const analyses = await prisma.requirementAnalysis.findMany({
          where: { batchId },
          select: { qualityScore: true }
        })
        
        const averageScore = analyses.length > 0 
          ? analyses.reduce((sum: number, a: { qualityScore: number }) => sum + a.qualityScore, 0) / analyses.length 
          : 0

        await prisma.analysisBatch.update({
          where: { id: batchId },
          data: {
            status: 'completed',
            analyzedStories: analysisCount,
            averageScore,
            completedAt: new Date()
          }
        })

        return NextResponse.json({
          success: true,
          completed: true,
          message: 'Batch analysis completed',
          analyzedStories: analysisCount,
          totalStories: allUserStories.length
        })
      }

      // Analyze the next story using the individual requirements analysis API
      try {
        console.log(`🔍 Processing story: ${nextStory.title}`)
        
        // Call the individual requirements analysis API
        const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analyze/requirements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userStoryId: nextStory.id
          })
        })

        if (!analysisResponse.ok) {
          throw new Error(`Analysis API returned ${analysisResponse.status}: ${await analysisResponse.text()}`)
        }

        const analysisData = await analysisResponse.json()
        console.log(`✅ Analysis completed for story: ${nextStory.title}`)

        // Extract the analysis results
        const { 
          qualityScore: score, 
          strengths, 
          improvements, 
          riskFactors,
          analysis: fullAnalysis 
        } = analysisData
        
        // Calculate risk level based on score (same logic as individual analysis)
        const riskLevel = score >= 8 ? 'Low' : 
                         score >= 6 ? 'Medium' : 
                         score >= 4 ? 'High' : 'Critical'

        // Store the analysis in the batch
        const createdAnalysis = await prisma.requirementAnalysis.create({
          data: {
            batchId,
            userStoryId: nextStory.id,
            qualityScore: score,
            riskLevel,
            strengths: JSON.stringify(strengths),
            improvements: JSON.stringify(improvements),
            riskFactors: JSON.stringify(riskFactors),
            aiAnalysis: fullAnalysis
          },
          include: {
            userStory: {
              select: {
                id: true,
                title: true,
                jiraKey: true,
                priority: true,
                status: true
              }
            }
          }
        })

        // Update the user story with the latest quality score and risk level
        await prisma.userStory.update({
          where: { id: nextStory.id },
          data: {
            qualityScore: score,
            riskLevel: riskLevel
          }
        })

        // Update batch progress
        const newAnalyzedCount = analyzedIds.size + 1
        const currentAnalyses = await prisma.requirementAnalysis.findMany({
          where: { batchId },
          select: { qualityScore: true }
        })
        
        const currentAverage = currentAnalyses.reduce((sum: number, analysis: { qualityScore: number }) => sum + analysis.qualityScore, 0) / currentAnalyses.length

        await prisma.analysisBatch.update({
          where: { id: batchId },
          data: {
            analyzedStories: newAnalyzedCount,
            averageScore: currentAverage
          }
        })

        console.log(`✅ Analyzed story ${newAnalyzedCount}/${allUserStories.length}: ${nextStory.title}`)

        // Return the complete analysis for real-time display
        return NextResponse.json({
          success: true,
          completed: false,
          analyzedStories: newAnalyzedCount,
          totalStories: allUserStories.length,
          analysis: {
            id: createdAnalysis.id,
            userStoryId: createdAnalysis.userStoryId,
            qualityScore: createdAnalysis.qualityScore,
            riskLevel: createdAnalysis.riskLevel,
            strengths: strengths,
            improvements: improvements,
            riskFactors: riskFactors,
            fullAnalysis: fullAnalysis, // Frontend expects this field name
            createdAt: createdAnalysis.createdAt.toISOString(),
            userStory: createdAnalysis.userStory
          }
        })

      } catch (error) {
        console.error(`❌ Error analyzing story ${nextStory.id}:`, error)
        return NextResponse.json(
          { error: 'Failed to analyze story', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error processing batch:', error)
    return NextResponse.json(
      { error: 'Failed to process batch' },
      { status: 500 }
    )
  }
}

// Helper function to parse AI analysis response
function parseAnalysisResponse(analysis: string) {
  // Extract quality score (look for patterns like "Score: 7/10" or "Quality Score: **7/10**")
  const scoreMatch = analysis.match(/(?:Quality\s+)?Score[:\s]*\*?\*?(\d+)(?:\/10)?\*?\*?/i)
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 5

  // Extract risk level (look for patterns like "Risk: High" or "Risk Assessment: **MEDIUM**")
  const riskMatch = analysis.match(/Risk(?:\s+Assessment)?[:\s]*\*?\*?(Critical|High|Medium|Low|CRITICAL|HIGH|MEDIUM|LOW)\*?\*?/i)
  const riskLevel = riskMatch ? riskMatch[1].charAt(0).toUpperCase() + riskMatch[1].slice(1).toLowerCase() : 'Medium'

  // Extract strengths (look for bullet points or numbered lists after "Strengths")
  const strengthsMatch = analysis.match(/(?:##\s*)?(?:\d+\.\s*)?Strengths[:\s]*\n((?:[-*•]\s*.+\n?)+)/i)
  const strengths = strengthsMatch 
    ? strengthsMatch[1].split('\n').filter(s => s.trim()).map(s => s.replace(/^[-*•]\s*/, '').trim())
    : ['Clear user story structure']

  // Extract improvements (look for bullet points or numbered lists after "Improvement" or "Areas for Improvement")
  const improvementsMatch = analysis.match(/(?:##\s*)?(?:\d+\.\s*)?(?:Areas for )?Improvement[s]?[:\s]*\n((?:[-*•]\s*.+\n?)+)/i)
  const improvements = improvementsMatch 
    ? improvementsMatch[1].split('\n').filter(s => s.trim()).map(s => s.replace(/^[-*•]\s*/, '').trim())
    : ['Add more specific acceptance criteria']

  // Extract risk factors (look for bullet points after "Risk" sections)
  const riskFactorsMatch = analysis.match(/(?:##\s*)?(?:\d+\.\s*)?(?:Risk\s+Factors?|High\s+Risks?)[:\s]*\n((?:[-*•]\s*.+\n?)+)/i)
  const riskFactors = riskFactorsMatch 
    ? riskFactorsMatch[1].split('\n').filter(s => s.trim()).map(s => s.replace(/^[-*•]\s*/, '').trim())
    : ['Potential scope ambiguity']

  return {
    score: Math.max(1, Math.min(10, score)), // Ensure score is between 1-10
    riskLevel,
    strengths: strengths.slice(0, 5), // Limit to 5 items
    improvements: improvements.slice(0, 5), // Limit to 5 items
    riskFactors: riskFactors.slice(0, 5) // Limit to 5 items
  }
} 