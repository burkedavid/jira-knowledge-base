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

interface SmartSamplingResult {
  defects: any[]
  samplingStrategy: string
  totalDefectsInPeriod: number
  representativenesScore: number
  samplingDetails: {
    criticalDefects: number
    highDefects: number
    mediumDefects: number
    lowDefects: number
    componentsCovered: number
    timeSpanCovered: string
  }
}

async function getSmartDefectSample(
  whereClause: any, 
  timeRange: number, 
  component?: string
): Promise<SmartSamplingResult> {
  console.log('🎯 Starting smart defect sampling...')
  
  // First, get total count to determine sampling strategy
  const totalDefects = await prisma.defect.count({ where: whereClause })
  console.log(`📊 Total defects in period: ${totalDefects}`)

  if (totalDefects <= 100) {
    // If we have 100 or fewer defects, take them all
    const defects = await prisma.defect.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })
    
    return {
      defects,
      samplingStrategy: 'complete_dataset',
      totalDefectsInPeriod: totalDefects,
      representativenesScore: 1.0,
      samplingDetails: {
        criticalDefects: defects.filter((d: any) => d.severity === 'Critical').length,
        highDefects: defects.filter((d: any) => d.severity === 'High').length,
        mediumDefects: defects.filter((d: any) => d.severity === 'Medium').length,
        lowDefects: defects.filter((d: any) => d.severity === 'Low').length,
        componentsCovered: new Set(defects.map((d: any) => d.component).filter(Boolean)).size,
        timeSpanCovered: `${timeRange} days (complete)`
      }
    }
  }

  // For larger datasets, use intelligent stratified sampling
  console.log('🧠 Using intelligent stratified sampling for large dataset...')
  
  // Strategy: Ensure representation across key dimensions
  const samplingQuotas = {
    critical: Math.max(10, Math.min(25, Math.floor(totalDefects * 0.1))), // At least 10, max 25% of sample
    high: Math.max(15, Math.min(30, Math.floor(totalDefects * 0.15))),    // At least 15, max 30% of sample
    medium: Math.max(10, Math.min(25, Math.floor(totalDefects * 0.1))),   // At least 10, max 25% of sample
    low: Math.max(5, Math.min(15, Math.floor(totalDefects * 0.05))),      // At least 5, max 15% of sample
    recent: 20,  // Always include 20 most recent defects
    oldest: 10   // Include 10 oldest defects for historical context
  }

  let selectedDefects: any[] = []
  
  // 1. Get most recent defects (always important for current state)
  const recentDefects = await prisma.defect.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: samplingQuotas.recent
  })
  selectedDefects.push(...recentDefects)
  console.log(`✅ Added ${recentDefects.length} recent defects`)

  // 2. Get oldest defects (historical context)
  const oldestDefects = await prisma.defect.findMany({
    where: whereClause,
    orderBy: { createdAt: 'asc' },
    take: samplingQuotas.oldest
  })
  // Filter out duplicates
  const newOldestDefects = oldestDefects.filter((old: any) => 
    !selectedDefects.some(selected => selected.id === old.id)
  )
  selectedDefects.push(...newOldestDefects)
  console.log(`✅ Added ${newOldestDefects.length} historical defects`)

  // 3. Stratified sampling by severity
  const severities = ['Critical', 'High', 'Medium', 'Low']
  for (const severity of severities) {
    const quota = samplingQuotas[severity.toLowerCase() as keyof typeof samplingQuotas] as number
    const existingCount = selectedDefects.filter(d => d.severity === severity).length
    const needed = Math.max(0, quota - existingCount)
    
    if (needed > 0) {
      const severityDefects = await prisma.defect.findMany({
        where: {
          ...whereClause,
          severity,
          id: { notIn: selectedDefects.map(d => d.id) }
        },
        orderBy: { createdAt: 'desc' },
        take: needed
      })
      selectedDefects.push(...severityDefects)
      console.log(`✅ Added ${severityDefects.length} ${severity} severity defects`)
    }
  }

  // 4. Component diversity sampling (ensure we cover different components)
  const componentStats = await prisma.defect.groupBy({
    by: ['component'],
    where: {
      ...whereClause,
      component: { not: null },
      id: { notIn: selectedDefects.map(d => d.id) }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  })

  // Add samples from top components not well represented
  const remainingQuota = Math.max(0, 100 - selectedDefects.length)
  const componentsToSample = Math.min(componentStats.length, Math.floor(remainingQuota / 2))
  
  for (let i = 0; i < componentsToSample && selectedDefects.length < 100; i++) {
    const component = componentStats[i].component
    const componentDefects = await prisma.defect.findMany({
      where: {
        ...whereClause,
        component,
        id: { notIn: selectedDefects.map(d => d.id) }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(3, 100 - selectedDefects.length) // Max 3 per component
    })
    selectedDefects.push(...componentDefects)
    console.log(`✅ Added ${componentDefects.length} defects from ${component} component`)
  }

  // 5. Fill remaining quota with random sampling for diversity
  if (selectedDefects.length < 100) {
    const remaining = 100 - selectedDefects.length
    const randomDefects = await prisma.defect.findMany({
      where: {
        ...whereClause,
        id: { notIn: selectedDefects.map(d => d.id) }
      },
      orderBy: { createdAt: 'desc' },
      take: remaining
    })
    selectedDefects.push(...randomDefects)
    console.log(`✅ Added ${randomDefects.length} additional defects for diversity`)
  }

  // Calculate representativeness score
  const severityDistribution = selectedDefects.reduce((acc, d: any) => {
    acc[d.severity || 'Unknown'] = (acc[d.severity || 'Unknown'] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const componentsCovered = new Set(selectedDefects.map((d: any) => d.component).filter(Boolean)).size
  const totalComponents = new Set((await prisma.defect.findMany({
    where: whereClause,
    select: { component: true }
  })).map((d: any) => d.component).filter(Boolean)).size

  const representativenesScore = Math.min(1.0, 
    (componentsCovered / Math.max(1, totalComponents)) * 0.4 + // 40% component coverage
    (selectedDefects.length / Math.min(100, totalDefects)) * 0.3 + // 30% sample size
    (Object.keys(severityDistribution).length / 4) * 0.3 // 30% severity diversity
  )

  const timeSpan = selectedDefects.length > 0 ? 
    `${Math.floor((new Date(Math.max(...selectedDefects.map(d => new Date(d.createdAt).getTime()))).getTime() - 
                   new Date(Math.min(...selectedDefects.map(d => new Date(d.createdAt).getTime()))).getTime()) / 
                   (1000 * 60 * 60 * 24))} days` : '0 days'

  return {
    defects: selectedDefects.slice(0, 100), // Ensure we don't exceed 100
    samplingStrategy: 'intelligent_stratified',
    totalDefectsInPeriod: totalDefects,
    representativenesScore,
    samplingDetails: {
      criticalDefects: selectedDefects.filter((d: any) => d.severity === 'Critical').length,
      highDefects: selectedDefects.filter((d: any) => d.severity === 'High').length,
      mediumDefects: selectedDefects.filter((d: any) => d.severity === 'Medium').length,
      lowDefects: selectedDefects.filter((d: any) => d.severity === 'Low').length,
      componentsCovered,
      timeSpanCovered: timeSpan
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { component, timeRange = 90, severity, includeResolved = true } = await request.json()

    console.log('🔍 Starting AI-powered defect pattern analysis...')
    console.log(`📊 Parameters: component=${component}, timeRange=${timeRange}d, severity=${severity}`)

    // Build comprehensive defect query
    const whereClause: any = {}

    // Handle timeRange - if it's a very large number (like 36500 for "all time"), don't add date filter
    if (timeRange < 36500) { // Less than ~100 years means it's a real timeframe
      whereClause.createdAt = {
        gte: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000),
      }
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

    // Use smart sampling to get representative defect set
    const samplingResult = await getSmartDefectSample(whereClause, timeRange, component)
    const defects = samplingResult.defects

    console.log(`📈 Smart sampling completed:`)
    console.log(`   - Strategy: ${samplingResult.samplingStrategy}`)
    console.log(`   - Sample size: ${defects.length} / ${samplingResult.totalDefectsInPeriod} total`)
    console.log(`   - Representativeness: ${(samplingResult.representativenesScore * 100).toFixed(1)}%`)
    console.log(`   - Components covered: ${samplingResult.samplingDetails.componentsCovered}`)
    console.log(`   - Time span: ${samplingResult.samplingDetails.timeSpanCovered}`)

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
    const defectSummaries = defects.map((defect: any, index: number) => {
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
    const ragContextText = ragContext.slice(0, 15).map((item: any, index: number) => {
      return `RELATED CONTEXT ${index + 1} (${item.sourceType}):
${item.content.substring(0, 300)}...
---`
    }).join('\n\n')

    // Enhanced sampling context for AI
    const samplingContext = samplingResult.samplingStrategy === 'intelligent_stratified' ? 
      `\n\nSAMPLING CONTEXT:
This analysis is based on an intelligent sample of ${defects.length} defects from a total of ${samplingResult.totalDefectsInPeriod} defects in the specified timeframe.
Sampling Strategy: ${samplingResult.samplingStrategy}
Representativeness Score: ${(samplingResult.representativenesScore * 100).toFixed(1)}%
Sample Distribution:
- Critical: ${samplingResult.samplingDetails.criticalDefects}
- High: ${samplingResult.samplingDetails.highDefects}  
- Medium: ${samplingResult.samplingDetails.mediumDefects}
- Low: ${samplingResult.samplingDetails.lowDefects}
- Components Covered: ${samplingResult.samplingDetails.componentsCovered}
- Time Span: ${samplingResult.samplingDetails.timeSpanCovered}

Please consider this sampling context in your analysis and extrapolate patterns to the full dataset of ${samplingResult.totalDefectsInPeriod} defects.` : ''

    // Add temporal context for accurate trend analysis
    const now = new Date()
    const currentDay = now.getDate()
    const currentMonth = now.toLocaleString('default', { month: 'long' })
    const currentYear = now.getFullYear()
    const daysInCurrentMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate()
    const monthProgress = (currentDay / daysInCurrentMonth * 100).toFixed(1)
    
    const temporalContext = `

TEMPORAL ANALYSIS CONTEXT:
Current Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Current Month Progress: ${currentDay} of ${daysInCurrentMonth} days (${monthProgress}% complete)
Analysis Period: ${timeRange === 36500 ? 'ALL TIME' : `Last ${timeRange} days`}

CRITICAL: When comparing current month to previous month, remember we are only ${currentDay} days into ${currentMonth}. 
Any month-over-month comparisons must be normalized by day count or clearly state they are partial month comparisons.
For accurate trend analysis, compare equivalent day ranges (e.g., first 17 days of current month vs first 17 days of previous month).`

    // Step 3: Create comprehensive AI prompt
    const aiPrompt = `You are an expert software quality analyst specializing in defect pattern recognition and quality improvement strategies. Analyze the following defects and provide comprehensive insights.

DEFECT DATA (${defects.length} defects from ${timeRange === 36500 ? 'ALL TIME' : `last ${timeRange} days`}):
${defectSummaries}

RELATED CONTEXT FROM KNOWLEDGE BASE:
${ragContextText}${samplingContext}${temporalContext}

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
    "overallTrend": "Executive-level summary of quality trajectory for directors: improving/declining/stable with key metrics",
    "riskAssessment": "High-level business risk assessment with quantified impact and immediate concerns",
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

CRITICAL REQUIREMENTS:
1. Limit to TOP 10 most impactful patterns only - focus on highest business impact
2. Overall Trend: Write a concise executive summary for directors - focus on business impact, not technical details
3. Risk Assessment: Provide clear business risk level with quantified impact where possible
4. NO text highlighting, bold formatting, or special characters in responses
5. Use plain text only - no markdown, asterisks, or emphasis formatting
6. Focus on actionable business insights, not technical implementation details
7. TEMPORAL ACCURACY: When making month-over-month comparisons, account for partial month data. Use normalized rates or equivalent time periods.

ANALYSIS FOCUS:
1. Identify the TOP 10 most critical recurring patterns by business impact
2. Assess business risk and financial impact of each pattern
3. Provide actionable prevention strategies focused on ROI
4. Recommend testing approaches that reduce business risk
5. Prioritize actions based on business impact and implementation effort
6. Consider the related context from the knowledge base
7. Provide confidence scores based on data quality and pattern clarity
8. For trend analysis, use proper temporal normalization - compare equivalent time periods or use daily/weekly rates
${samplingResult.samplingStrategy === 'intelligent_stratified' ? 
  '9. Scale your analysis to represent the full dataset based on the sampling context provided' : ''}

Remember: This analysis will be reviewed by directors and executives. Focus on business impact, clear risk assessment, and actionable recommendations without technical jargon or formatting.`

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
          affectedComponents: Array.from(new Set(defects.map((d: any) => d.component).filter(Boolean))),
          rootCauses: Array.from(new Set(defects.map((d: any) => d.rootCause).filter(Boolean))),
          businessImpact: 'Analysis provided in description',
          preventionStrategy: 'See detailed analysis in description',
          testingRecommendations: ['Review AI analysis for specific recommendations'],
          relatedDefects: defects.map((d: any) => d.id),
          confidence: 0.8
        }],
        insights: {
          overallTrend: 'See AI analysis for trend information',
          riskAssessment: 'Detailed risk assessment in AI response',
          priorityActions: ['Review AI analysis for priority actions'],
          qualityMetrics: {
            patternDiversity: defects.length,
            componentCoverage: new Set(defects.map((d: any) => d.component).filter(Boolean)).size,
            severityDistribution: defects.reduce((acc: any, d: any) => {
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
              severity: pattern.severity,
              component: component || null,
              rootCause: pattern.rootCauses.join(', '),
              pattern: JSON.stringify({
                affectedComponents: pattern.affectedComponents,
                rootCauses: pattern.rootCauses,
                businessImpact: pattern.businessImpact,
                preventionStrategy: pattern.preventionStrategy,
                testingRecommendations: pattern.testingRecommendations,
                confidence: pattern.confidence
              })
            }
          })
        } else {
          // Create new pattern
          await prisma.defectPattern.create({
            data: {
              name: pattern.name,
              description: pattern.description,
              frequency: pattern.frequency,
              severity: pattern.severity,
              component: component || null,
              rootCause: pattern.rootCauses.join(', '),
              pattern: JSON.stringify({
                affectedComponents: pattern.affectedComponents,
                rootCauses: pattern.rootCauses,
                businessImpact: pattern.businessImpact,
                preventionStrategy: pattern.preventionStrategy,
                testingRecommendations: pattern.testingRecommendations,
                confidence: pattern.confidence
              })
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
        totalDefectsInPeriod: samplingResult.totalDefectsInPeriod,
        samplingStrategy: samplingResult.samplingStrategy,
        representativenesScore: samplingResult.representativenesScore,
        samplingDetails: samplingResult.samplingDetails,
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