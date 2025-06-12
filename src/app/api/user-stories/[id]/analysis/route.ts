import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userStoryId = params.id

    // Get the most recent analysis from both sources
    const [qualityScore, requirementAnalysis] = await Promise.all([
      // Get latest from qualityScore table (individual analyses)
      prisma.qualityScore.findFirst({
        where: { userStoryId },
        orderBy: { generatedAt: 'desc' },
        include: {
          userStory: {
            select: {
              id: true,
              title: true,
              jiraKey: true,
              component: true,
              priority: true,
              qualityScore: true,
              riskLevel: true
            }
          }
        }
      }),
      
      // Get latest from requirementAnalysis table (batch analyses)
      prisma.requirementAnalysis.findFirst({
        where: { userStoryId },
        orderBy: { createdAt: 'desc' },
        include: {
          userStory: {
            select: {
              id: true,
              title: true,
              jiraKey: true,
              component: true,
              priority: true,
              qualityScore: true,
              riskLevel: true
            }
          }
        }
      })
    ])

    // Determine which analysis is more recent
    let latestAnalysis = null
    let analysisSource = null

    if (qualityScore && requirementAnalysis) {
      // Compare dates to find the most recent
      const qualityScoreDate = new Date(qualityScore.generatedAt)
      const requirementAnalysisDate = new Date(requirementAnalysis.createdAt)
      
      if (qualityScoreDate > requirementAnalysisDate) {
        latestAnalysis = qualityScore
        analysisSource = 'individual'
      } else {
        latestAnalysis = requirementAnalysis
        analysisSource = 'batch'
      }
    } else if (qualityScore) {
      latestAnalysis = qualityScore
      analysisSource = 'individual'
    } else if (requirementAnalysis) {
      latestAnalysis = requirementAnalysis
      analysisSource = 'batch'
    }

    if (!latestAnalysis) {
      return NextResponse.json(
        { error: 'No analysis found for this user story' },
        { status: 404 }
      )
    }

    // Format the response based on the source
    let formattedAnalysis
    
    if (analysisSource === 'individual') {
      // Parse the suggestions field which contains the full analysis
      const qualityScoreAnalysis = latestAnalysis as any // Type assertion for qualityScore table
      const suggestions = qualityScoreAnalysis.suggestions || ''
      const riskFactors = qualityScoreAnalysis.riskFactors ? JSON.parse(qualityScoreAnalysis.riskFactors) : []
      
      formattedAnalysis = {
        qualityScore: qualityScoreAnalysis.score,
        riskLevel: qualityScoreAnalysis.userStory.riskLevel,
        analysis: suggestions,
        riskFactors: riskFactors,
        strengths: [], // Not stored separately in qualityScore table
        improvements: [], // Not stored separately in qualityScore table
        analyzedAt: qualityScoreAnalysis.generatedAt,
        source: 'individual',
        userStory: qualityScoreAnalysis.userStory
      }
    } else {
      // From requirementAnalysis table (batch analysis)
      const requirementAnalysisData = latestAnalysis as any // Type assertion for requirementAnalysis table
      const strengths = requirementAnalysisData.strengths ? JSON.parse(requirementAnalysisData.strengths) : []
      const improvements = requirementAnalysisData.improvements ? JSON.parse(requirementAnalysisData.improvements) : []
      const riskFactors = requirementAnalysisData.riskFactors ? JSON.parse(requirementAnalysisData.riskFactors) : []
      
      formattedAnalysis = {
        qualityScore: requirementAnalysisData.qualityScore,
        riskLevel: requirementAnalysisData.riskLevel,
        analysis: requirementAnalysisData.aiAnalysis,
        strengths: strengths,
        improvements: improvements,
        riskFactors: riskFactors,
        analyzedAt: requirementAnalysisData.createdAt,
        source: 'batch',
        batchId: requirementAnalysisData.batchId === 'individual-analysis' ? null : requirementAnalysisData.batchId,
        userStory: requirementAnalysisData.userStory
      }
    }

    return NextResponse.json(formattedAnalysis)

  } catch (error) {
    console.error('Error fetching user story analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
} 