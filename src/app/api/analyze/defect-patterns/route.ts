import { NextRequest, NextResponse } from 'next/server'
import { generateTextWithClaude } from '@/lib/aws-bedrock'
import { vectorSearch } from '@/lib/vector-db'
import { prisma } from '@/lib/prisma'

interface DefectPatternAnalysis {
  patterns: Array<{
    id: string
    name: string
    description: string
    severity: 'Critical' | 'High' | 'Medium' | 'Low'
    frequency: number
    affectedComponents: string[]
    rootCauses: string[]
    businessImpact: string
    preventionStrategy: string
    testingRecommendations: string[]
    relatedDefects: string[]
    confidence: number
  }>
  insights: {
    overallTrend: string
    riskAssessment: string
    priorityActions: string[]
    qualityMetrics: {
      patternDiversity: number
      componentCoverage: number
      severityDistribution: Record<string, number>
    }
  }
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const { component, timeRange = 90, severity, includeResolved = true } = await request.json()

    console.log('🔍 Starting AI-powered defect pattern analysis...')
    console.log(`📊 Parameters: component=${component}, timeRange=${timeRange}d, severity=${severity}`)

    // Build comprehensive defect query
    const whereClause: any = {
      createdAt: {
        gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000),
      },
    }

    if (component && component !== 'all') {
      whereClause.component = component
    }

    if (severity && severity !== 'all') {
      whereClause.severity = severity
    }

    if (!includeResolved) {
      whereClause.status = { not: 'Resolved' }
    }

    // Get defects with full context
    const defects = await prisma.defect.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100, // Analyze up to 100 recent defects
    })

    console.log(`📈 Found ${defects.length} defects for analysis`)

    if (defects.length === 0) {
      return NextResponse.json({
        message: 'No defects found for analysis',
        patterns: [],
        insights: {
          overallTrend: 'No data available',
          riskAssessment: 'Cannot assess risk without defect data',
          priorityActions: ['Import defect data to enable pattern analysis'],
          qualityMetrics: {
            patternDiversity: 0,
            componentCoverage: 0,
            severityDistribution: {}
          }
        },
        recommendations: {
          immediate: ['Import defect data from your tracking system'],
          shortTerm: ['Set up automated defect tracking'],
          longTerm: ['Implement continuous quality monitoring']
        }
      })
    }

    // Step 1: Use RAG to find related context
    console.log('🔍 Performing semantic search for related context...')
    const searchQueries = [
      `defect patterns ${component || ''} ${severity || ''}`,
      'quality issues root causes',
      'testing failures common problems',
      'software defects prevention strategies'
    ]

    let ragContext: any[] = []
    for (const query of searchQueries) {
      try {
        const results = await vectorSearch(
          query,
          ['defect', 'user_story', 'test_case', 'document'],
          10,
          0.3
        )
        ragContext.push(...results)
      } catch (error) {
        console.error(`Error in semantic search for "${query}":`, error)
      }
    }

    console.log(`🎯 Found ${ragContext.length} related items via semantic search`)

    // Step 2: Prepare comprehensive context for Claude
    const defectSummaries = defects.map((defect, index) => {
      return `DEFECT ${index + 1}:
Title: ${defect.title}
Component: ${defect.component || 'Unknown'}
Severity: ${defect.severity || 'Unknown'}
Status: ${defect.status || 'Unknown'}
Description: ${defect.description || 'No description'}
Root Cause: ${defect.rootCause || 'Not determined'}
Steps to Reproduce: ${defect.stepsToReproduce || 'Not provided'}
Resolution: ${defect.resolution || 'Not resolved'}
Created: ${defect.createdAt.toISOString().split('T')[0]}
---`
    }).join('\n\n')

    // Prepare RAG context
    const ragContextText = ragContext.slice(0, 15).map((item, index) => {
      return `RELATED CONTEXT ${index + 1} (${item.sourceType}):
${item.content.substring(0, 300)}...
---`
    }).join('\n\n')

    // Step 3: Create comprehensive AI prompt
    const aiPrompt = `You are an expert software quality analyst specializing in defect pattern recognition and quality improvement strategies. Analyze the following defects and provide comprehensive insights.

DEFECT DATA (${defects.length} defects from last ${timeRange} days):
${defectSummaries}

RELATED CONTEXT FROM KNOWLEDGE BASE:
${ragContextText}

ANALYSIS REQUIREMENTS:
Please provide a comprehensive JSON response with the following structure:

{
  "patterns": [
    {
      "id": "unique_pattern_id",
      "name": "Pattern Name",
      "description": "Detailed description of the pattern",
      "severity": "Critical|High|Medium|Low",
      "frequency": number_of_occurrences,
      "affectedComponents": ["component1", "component2"],
      "rootCauses": ["cause1", "cause2"],
      "businessImpact": "Description of business impact",
      "preventionStrategy": "How to prevent this pattern",
      "testingRecommendations": ["test1", "test2"],
      "relatedDefects": ["defect_ids"],
      "confidence": 0.0-1.0
    }
  ],
  "insights": {
    "overallTrend": "Analysis of overall quality trend",
    "riskAssessment": "Current risk level and factors",
    "priorityActions": ["action1", "action2"],
    "qualityMetrics": {
      "patternDiversity": number,
      "componentCoverage": number,
      "severityDistribution": {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    }
  },
  "recommendations": {
    "immediate": ["urgent actions needed now"],
    "shortTerm": ["actions for next 1-3 months"],
    "longTerm": ["strategic improvements for 6+ months"]
  }
}

ANALYSIS FOCUS:
1. Identify recurring patterns in defect types, components, and root causes
2. Assess the business impact and risk level of each pattern
3. Provide actionable prevention strategies
4. Recommend specific testing approaches
5. Prioritize actions based on severity and frequency
6. Consider the related context from the knowledge base
7. Provide confidence scores based on data quality and pattern clarity

Ensure all recommendations are specific, actionable, and prioritized by impact.`

    console.log('🤖 Sending comprehensive analysis request to Claude 4...')

    // Step 4: Get AI analysis
    const aiResponse = await generateTextWithClaude([
      { role: 'user', content: aiPrompt }
    ], {
      maxTokens: 4000,
      temperature: 0.2 // Lower temperature for more consistent analysis
    })

    console.log('✅ Received AI analysis response')

    // Step 5: Parse AI response
    let analysisResult: DefectPatternAnalysis
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      // Fallback: create structured response from text
      analysisResult = {
        patterns: [{
          id: 'ai_analysis_pattern',
          name: 'AI Analysis Results',
          description: aiResponse,
          severity: 'Medium' as const,
          frequency: defects.length,
          affectedComponents: Array.from(new Set(defects.map(d => d.component).filter(Boolean))) as string[],
          rootCauses: Array.from(new Set(defects.map(d => d.rootCause).filter(Boolean))) as string[],
          businessImpact: 'Analysis provided in description',
          preventionStrategy: 'See detailed analysis in description',
          testingRecommendations: ['Review AI analysis for specific recommendations'],
          relatedDefects: defects.map(d => d.id),
          confidence: 0.8
        }],
        insights: {
          overallTrend: 'See AI analysis for trend information',
          riskAssessment: 'Detailed risk assessment in AI response',
          priorityActions: ['Review AI analysis for priority actions'],
          qualityMetrics: {
            patternDiversity: defects.length,
            componentCoverage: new Set(defects.map(d => d.component).filter(Boolean)).size,
            severityDistribution: defects.reduce((acc, d) => {
              acc[d.severity || 'Unknown'] = (acc[d.severity || 'Unknown'] || 0) + 1
              return acc
            }, {} as Record<string, number>)
          }
        },
        recommendations: {
          immediate: ['Review detailed AI analysis'],
          shortTerm: ['Implement recommendations from AI analysis'],
          longTerm: ['Establish continuous quality monitoring']
        }
      }
    }

    // Step 6: Save patterns to database for future reference
    console.log('💾 Saving analysis results to database...')
    for (const pattern of analysisResult.patterns) {
      try {
        // Check if pattern already exists
        const existingPattern = await prisma.defectPattern.findFirst({
          where: { name: pattern.name }
        })

        if (existingPattern) {
          // Update existing pattern
          await prisma.defectPattern.update({
            where: { id: existingPattern.id },
            data: {
              description: pattern.description,
              frequency: pattern.frequency,
              severity: pattern.severity || 'medium',
              component: component || null,
              rootCause: pattern.rootCauses.join(', '),
              pattern: JSON.stringify(pattern)
            }
          })
        } else {
          // Create new pattern
          await prisma.defectPattern.create({
            data: {
              name: pattern.name,
              description: pattern.description,
              frequency: pattern.frequency,
              severity: pattern.severity || 'medium',
              component: component || null,
              rootCause: pattern.rootCauses.join(', '),
              pattern: JSON.stringify(pattern)
            }
          })
        }
      } catch (dbError) {
        console.error('Error saving pattern to database:', dbError)
      }
    }

    console.log('🎉 Defect pattern analysis completed successfully')

    return NextResponse.json({
      success: true,
      message: 'AI-powered defect pattern analysis completed',
      analysis: analysisResult,
      metadata: {
        defectCount: defects.length,
        timeRange,
        component: component || 'all',
        severity: severity || 'all',
        ragContextItems: ragContext.length,
        analysisTimestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('💥 Error in defect pattern analysis:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze defect patterns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 