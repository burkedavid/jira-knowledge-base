import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { vectorSearchWithTimeframe } from '@/lib/vector-db'
import { generateTextWithClaude } from '@/lib/aws-bedrock'

// Phase-based processing for progressive loading
type AnalysisPhase = 'init' | 'semantic' | 'enrich' | 'analyze-overview' | 'analyze-patterns' | 'analyze-actions' | 'analyze-complete'

export async function POST(request: NextRequest) {
  try {
    const { query, timeframe = '1y', phase = 'init', context } = await request.json()
    
    console.log(`🚀 PROGRESSIVE API CALLED: Phase ${phase} for query: "${query}"`)
    console.log(`📊 Timeframe: ${timeframe}`)
    console.log(`📊 Timeframe type: ${typeof timeframe}`)

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Calculate date range based on timeframe
    let dateFilter: any = {}
    const now = new Date()
    
    switch (timeframe) {
      case '30d':
        dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        break
      case '90d':
        dateFilter = { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
        break
      case '1y':
        dateFilter = { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) }
        break
      case 'all':
      default:
        dateFilter = {}
        break
    }
    
    console.log(`📊 Date filter for timeframe "${timeframe}":`, dateFilter)
    console.log(`📊 Date filter has keys:`, Object.keys(dateFilter).length > 0)

    // Process based on requested phase
    switch (phase) {
      case 'init':
        return await handleInitPhase(query, timeframe, dateFilter)
      
      case 'semantic':
        return await handleSemanticPhase(query, timeframe)
      
      case 'enrich':
        return await handleEnrichPhase(context?.semanticResults || [])
      
      case 'analyze-overview':
        return await handleAnalyzeOverviewPhase(query, timeframe, context)
      
      case 'analyze-patterns':
        return await handleAnalyzePatternsPhase(query, timeframe, context)
      
      case 'analyze-actions':
        return await handleAnalyzeActionsPhase(query, timeframe, context)
        
      case 'analyze-complete':
        return await handleAnalyzeCompletePhase(query, timeframe, context)
      
      default:
        return NextResponse.json(
          { error: 'Invalid phase specified' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in defect query processing:', error)
    return NextResponse.json(
      { error: 'Failed to process defect query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PHASE 1: Initialize - Get basic statistics AND all defect titles for timeframe (fast)
async function handleInitPhase(query: string, timeframe: string, dateFilter: any) {
  console.log('📊 Phase 1: Getting basic statistics and all defect titles...')
  
  // For 'all' timeframe, use current approach (too much data)
  // For specific timeframes, get all defect titles for better AI context
  const shouldFetchAllDefects = timeframe !== 'all'
  
  const [totalDefects, defectsBySeverity, defectsByComponent, defectPatterns] = await Promise.all([
    prisma.defect.count({
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
    }),
    
    prisma.defect.groupBy({
      by: ['severity'],
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      _count: { id: true }
    }),
    
    prisma.defect.groupBy({
      by: ['component'],
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    }),
    
    prisma.defect.groupBy({
      by: ['rootCause'],
      where: {
        rootCause: { not: null },
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })
  ])
  
  // Get all defect titles for specific timeframes (better AI context)
  const allDefects = shouldFetchAllDefects ? await prisma.defect.findMany({
    where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
    select: {
      id: true,
      title: true,
      severity: true,
      component: true,
      status: true,
      createdAt: true
      // Note: Excluding description for performance as discussed
    },
    orderBy: { createdAt: 'desc' }
  }) : null

  // Calculate realistic timeframe-specific cost impact based on severity
  const timeframeLabel = timeframe === '1y' ? 'last year' : 
                        timeframe === '90d' ? 'last 90 days' : 
                        timeframe === '30d' ? 'last 30 days' : 'all time'

  // Realistic cost calculation based on severity
  const calculateRealisticCostImpact = (severityData: any[]) => {
    const hourlyRate = 75 // £75/hour
    let totalCost = 0
    
    severityData.forEach(item => {
      const count = item._count.id
      const severity = item.severity?.toLowerCase()
      
      // Realistic hours per defect by severity
      let hoursPerDefect = 0
      switch (severity) {
        case 'critical':
          hoursPerDefect = 16 // 2 days for critical issues
          break
        case 'high':
          hoursPerDefect = 8 // 1 day for high priority
          break
        case 'medium':
          hoursPerDefect = 4 // Half day for medium
          break
        case 'low':
          hoursPerDefect = 2 // 2 hours for low priority
          break
        case 'minor':
          hoursPerDefect = 1 // 1 hour for minor issues
          break
        default:
          hoursPerDefect = 3 // Default 3 hours for unknown severity
      }
      
      totalCost += count * hoursPerDefect * hourlyRate
    })
    
    return Math.round(totalCost)
  }

  const costImpact = calculateRealisticCostImpact(defectsBySeverity)

  return NextResponse.json({
    phase: 'init',
    query,
    timeframe,
    statistics: {
      totalDefects,
      defectsBySeverity,
      defectsByComponent, // Keep the full objects with counts
      defectPatterns, // Keep the full objects with counts
      qualityScore: Math.max(1, Math.min(10, Math.round(10 - (totalDefects / 100)))),
      costImpact,
      timeframeLabel,
      allDefects: allDefects ? allDefects.map(d => ({
        id: d.id,
        title: d.title,
        severity: d.severity,
        component: d.component,
        status: d.status,
        createdAt: d.createdAt
      })) : null,
      defectTitlesCount: allDefects ? allDefects.length : 0
    },
    nextPhase: 'semantic',
    progress: 25
  })
}

// PHASE 2: Semantic Search - Get relevant context (medium speed)
async function handleSemanticPhase(query: string, timeframe: string) {
  console.log('🔍 Phase 2: Performing semantic search...')
  
  // Map API timeframe to vector search timeframe
  let vectorTimeframe: 'last_week' | 'last_month' | 'last_quarter' | 'last_year' | 'all'
  switch (timeframe) {
    case '30d':
      vectorTimeframe = 'last_month'
      break
    case '90d':
      vectorTimeframe = 'last_quarter'
      break
    case '1y':
      vectorTimeframe = 'last_year'
      break
    case 'all':
    default:
      vectorTimeframe = 'all'
      break
  }
  
  const semanticResults = await vectorSearchWithTimeframe(
    query,
    vectorTimeframe,
    ['defect', 'user_story', 'test_case'],
    10, // Get top 10 most relevant items
    0.6 // Lower threshold for broader context
  )

  return NextResponse.json({
    phase: 'semantic',
    semanticResults,
    nextPhase: 'enrich',
    progress: 50
  })
}

// PHASE 3: Enrich - Process semantic results in chunks (slower)
async function handleEnrichPhase(semanticResults: any[]) {
  console.log('🔧 Phase 3: Enriching semantic results...')
  
  if (!semanticResults || semanticResults.length === 0) {
    return NextResponse.json({
      phase: 'enrich',
      enrichedContext: [],
      nextPhase: 'analyze',
      progress: 75
    })
  }

  // Process in smaller chunks to avoid timeout
  const chunkSize = 5
  const enrichedContext = []
  
  for (let i = 0; i < semanticResults.length; i += chunkSize) {
    const chunk = semanticResults.slice(i, i + chunkSize)
    
    const enrichedChunk = await Promise.all(
      chunk.map(async (result) => {
        try {
          let entityData = null
          
          switch (result.sourceType) {
            case 'defect':
              entityData = await prisma.defect.findUnique({
                where: { id: result.sourceId },
                select: {
                  id: true,
                  title: true,
                  status: true,
                  severity: true,
                  component: true,
                  createdAt: true,
                  description: true
                }
              })
              break
            case 'user_story':
              entityData = await prisma.userStory.findUnique({
                where: { id: result.sourceId },
                select: {
                  id: true,
                  title: true,
                  status: true,
                  priority: true,
                  description: true
                }
              })
              break
            case 'test_case':
              entityData = await prisma.testCase.findUnique({
                where: { id: result.sourceId },
                select: {
                  id: true,
                  title: true,
                  status: true,
                  priority: true,
                  steps: true
                }
              })
              break
          }

          return {
            ...result,
            entityData,
            type: result.sourceType
          }
        } catch (error) {
          console.error(`Error enriching ${result.sourceType}:`, error)
          return { ...result, entityData: null, type: result.sourceType }
        }
      })
    )
    
    enrichedContext.push(...enrichedChunk)
  }

  return NextResponse.json({
    phase: 'enrich',
    enrichedContext: enrichedContext.filter(r => r.entityData !== null),
    nextPhase: 'analyze',
    progress: 75
  })
}

// PHASE 4A: Analyze Overview - Generate executive summary and dataset overview (fast, ~10-15 seconds)
async function handleAnalyzeOverviewPhase(query: string, timeframe: string, context: any) {
  console.log('📊 Phase 4A: Generating overview and executive summary...')
  
  const { statistics, enrichedContext } = context
  
  if (!statistics || !enrichedContext) {
    throw new Error('Missing required context for analysis overview phase')
  }

  const overviewPrompt = `You are an Executive Analytics Intelligence System. Generate a properly formatted executive overview for defect analysis.

**User Query:** "${query}"
**Timeframe:** ${timeframe}

**CORE DATA:**
- Total Defects: ${statistics.totalDefects}
- Top Components: ${JSON.stringify(statistics.defectsByComponent.slice(0, 3))}
- Top Patterns: ${JSON.stringify(statistics.defectPatterns.slice(0, 3))}

**GENERATE EXECUTIVE OVERVIEW:**

## Executive Summary

Analysis of ${statistics.totalDefects} defects across all components in ${statistics.timeframeLabel || timeframe} reveals [analyze the data and provide specific insights about quality challenges and concentration patterns].

## Key Metrics

- **Total Defects Analyzed:** ${statistics.totalDefects}
- **Quality Score:** [Calculate 1-10 based on severity distribution from data above]  
- **Business Risk Level:** [HIGH/MEDIUM/LOW based on critical defects and patterns]

## Quick Insights

- **Worst Component:** [Use the actual top component from data above]
- **Primary Risk:** [Main concern based on patterns and severity data]
- **Immediate Action:** [One specific priority action based on the analysis]

**CRITICAL FORMATTING REQUIREMENTS:**
- Use proper markdown with double line breaks between sections
- Use bullet points with proper spacing
- Keep each bullet point on its own line
- Use **bold** for emphasis only
- Ensure clean paragraph breaks between sections`

  try {
    const aiResponse = await generateTextWithClaude([
      { role: 'user', content: overviewPrompt }
    ], {
      maxTokens: 800,
      temperature: 0.2
    })

    return NextResponse.json({
      phase: 'analyze-overview',
      content: aiResponse,
      nextPhase: 'analyze-patterns',
      progress: 85
    })

  } catch (error) {
    console.error('Overview analysis failed:', error)
    throw new Error('Failed to generate executive overview')
  }
}

// PHASE 4B: Analyze Patterns - Focus on defect patterns and hotspots (medium, ~15-20 seconds)
async function handleAnalyzePatternsPhase(query: string, timeframe: string, context: any) {
  console.log('🔍 Phase 4B: Analyzing defect patterns and hotspots...')
  
  const { statistics, enrichedContext } = context
  
  // Build comprehensive defect titles context for better AI analysis
  let defectTitlesContext = ''
  if (statistics.allDefects && statistics.allDefects.length > 0) {
    const titlesByComponent = statistics.allDefects.reduce((acc: any, defect: any) => {
      const component = defect.component || 'Unknown'
      if (!acc[component]) acc[component] = []
      acc[component].push(`"${defect.title}" (${defect.severity})`)
      return acc
    }, {})
    
    defectTitlesContext = Object.entries(titlesByComponent)
      .map(([component, titles]: [string, any]) => 
        `**${component}:** ${titles.slice(0, 15).join(', ')}${titles.length > 15 ? ` ... and ${titles.length - 15} more` : ''}`
      ).join('\n')
  }
  
  const patternsPrompt = `You are a Defect Pattern Recognition System. Analyze patterns using ALL actual defect titles.

**FOCUS:** Identify the top 10 most critical defect patterns from actual defect titles.

**REAL DEFECT DATA (${statistics.timeframeLabel}):** 
- Total Defects: ${statistics.totalDefects}
- Component Breakdown: ${JSON.stringify(statistics.defectsByComponent.slice(0, 10).map((c: any) => `${c.component}: ${c._count.id} defects`))}
- Pattern Breakdown: ${JSON.stringify(statistics.defectPatterns.slice(0, 10).map((p: any) => `${p.rootCause}: ${p._count.id} occurrences`))}
- Severity Distribution: ${JSON.stringify(statistics.defectsBySeverity.map((s: any) => `${s.severity}: ${s._count.id}`))}
- Related Context: ${enrichedContext.length} items

**ACTUAL DEFECT TITLES BY COMPONENT:**
${defectTitlesContext || 'No specific defect titles available for this timeframe'}

**GENERATE PATTERN ANALYSIS:**

## Critical Patterns Identified

**1. [Pattern Name] - Risk: [HIGH/MEDIUM/LOW]**
- Frequency: [USE REAL NUMBERS FROM DATA ABOVE] occurrences
- Components: [affected components from data]
- Business Impact: [brief impact]
- Example Defects: [Reference actual defect titles above]

**2. [Pattern Name] - Risk: [HIGH/MEDIUM/LOW]**
- Frequency: [USE REAL NUMBERS FROM DATA ABOVE] occurrences  
- Components: [affected components from data]
- Business Impact: [brief impact]
- Example Defects: [Reference actual defect titles above]

**3. [Pattern Name] - Risk: [HIGH/MEDIUM/LOW]**
- Frequency: [USE REAL NUMBERS FROM DATA ABOVE] occurrences
- Components: [affected components from data]
- Business Impact: [brief impact]
- Example Defects: [Reference actual defect titles above]

**4. [Pattern Name] - Risk: [HIGH/MEDIUM/LOW]**
- Frequency: [USE REAL NUMBERS FROM DATA ABOVE] occurrences
- Components: [affected components from data]
- Business Impact: [brief impact]
- Example Defects: [Reference actual defect titles above]

**5. [Pattern Name] - Risk: [HIGH/MEDIUM/LOW]**
- Frequency: [USE REAL NUMBERS FROM DATA ABOVE] occurrences
- Components: [affected components from data]
- Business Impact: [brief impact]
- Example Defects: [Reference actual defect titles above]

**6. [Pattern Name] - Risk: [HIGH/MEDIUM/LOW]**
- Frequency: [USE REAL NUMBERS FROM DATA ABOVE] occurrences
- Components: [affected components from data]
- Business Impact: [brief impact]
- Example Defects: [Reference actual defect titles above]

**7. [Pattern Name] - Risk: [HIGH/MEDIUM/LOW]**
- Frequency: [USE REAL NUMBERS FROM DATA ABOVE] occurrences
- Components: [affected components from data]
- Business Impact: [brief impact]
- Example Defects: [Reference actual defect titles above]

**8. [Pattern Name] - Risk: [HIGH/MEDIUM/LOW]**
- Frequency: [USE REAL NUMBERS FROM DATA ABOVE] occurrences
- Components: [affected components from data]
- Business Impact: [brief impact]
- Example Defects: [Reference actual defect titles above]

**9. [Pattern Name] - Risk: [HIGH/MEDIUM/LOW]**
- Frequency: [USE REAL NUMBERS FROM DATA ABOVE] occurrences
- Components: [affected components from data]
- Business Impact: [brief impact]
- Example Defects: [Reference actual defect titles above]

**10. [Pattern Name] - Risk: [HIGH/MEDIUM/LOW]**
- Frequency: [USE REAL NUMBERS FROM DATA ABOVE] occurrences
- Components: [affected components from data]
- Business Impact: [brief impact]
- Example Defects: [Reference actual defect titles above]

## Component Hotspots
[List top 3 components with REAL defect counts and example defect titles from above]

**IMPORTANT:** Use the ACTUAL frequency numbers and defect counts from the data provided above. Reference specific defect titles when possible for concrete insights.

**FORMAT:** Keep each pattern to 2-3 lines. Use **bold** for emphasis only.`

  try {
    const aiResponse = await generateTextWithClaude([
      { role: 'user', content: patternsPrompt }
    ], {
      maxTokens: 1500,
      temperature: 0.2
    })

    return NextResponse.json({
      phase: 'analyze-patterns',
      content: aiResponse,
      nextPhase: 'analyze-actions',
      progress: 90
    })

  } catch (error) {
    console.error('Pattern analysis failed:', error)
    throw new Error('Failed to analyze patterns')
  }
}

// PHASE 4C: Analyze Actions - Generate actionable recommendations (medium, ~15-20 seconds)
async function handleAnalyzeActionsPhase(query: string, timeframe: string, context: any) {
  console.log('🎯 Phase 4C: Generating actionable recommendations...')
  
  const { statistics, enrichedContext } = context
  
  if (!statistics || !enrichedContext) {
    throw new Error('Missing required context for action recommendations phase')
  }

  // Build sample defect titles for context
  let sampleDefectTitles = ''
  if (statistics.allDefects && statistics.allDefects.length > 0) {
    const topComponentDefects = statistics.allDefects
      .filter((d: any) => d.component === statistics.defectsByComponent[0]?.component)
      .slice(0, 5)
      .map((d: any) => `"${d.title}"`)
      .join(', ')
    
    sampleDefectTitles = topComponentDefects ? `Sample defects from ${statistics.defectsByComponent[0]?.component}: ${topComponentDefects}` : ''
  }

  const actionsPrompt = `You are an Action Intelligence System. Generate specific, actionable recommendations based on defect analysis.

**DEFECT ANALYSIS CONTEXT (${statistics.timeframeLabel}):**
- Total Defects: ${statistics.totalDefects}
- Top Problem Components: ${JSON.stringify(statistics.defectsByComponent.slice(0, 3).map((c: any) => `${c.component}: ${c._count.id} defects`))}
- Critical Patterns: ${JSON.stringify(statistics.defectPatterns.slice(0, 3).map((p: any) => `${p.rootCause}: ${p._count.id} occurrences`))}
- Timeframe: ${timeframe}

**ACTUAL DEFECT EXAMPLES:**
${sampleDefectTitles || 'No specific defect examples available for this timeframe'}

**GENERATE ACTION INTELLIGENCE:**

## Immediate Actions (This Week)
1. Assign dedicated QA team to ${statistics.defectsByComponent[0] || 'top component'} - Start Monday
2. Implement emergency hotfix for critical ${statistics.defectPatterns[0] || 'pattern'} issues - 48 hours
3. Conduct root cause analysis session with engineering leads - Friday

## Short-term Actions (1-3 Months)
1. Deploy enhanced testing automation for ${statistics.defectsByComponent[0] || 'high-risk components'} - Reduce defects by 40%
2. Implement code review process improvements - Target 30% faster detection
3. Establish component-specific quality gates - Prevent 60% of recurring issues

## Long-term Actions (6+ Months)
1. Architect system redesign for ${statistics.defectsByComponent[0] || 'problematic components'} - Eliminate structural issues
2. Implement predictive quality analytics platform - Proactive defect prevention

## Success Metrics
- **Defect Reduction**: Target 50% reduction in ${timeframe}
- **Component Quality**: ${statistics.defectsByComponent[0] || 'Top component'} defects < 10/month
- **Pattern Elimination**: Zero recurrence of top 3 critical patterns

**FORMAT:** Keep each action to 1 line. Be specific and measurable.`

  try {
    const aiResponse = await generateTextWithClaude([
      { role: 'user', content: actionsPrompt }
    ], {
      maxTokens: 800,
      temperature: 0.3
    })

    return NextResponse.json({
      phase: 'analyze-actions',
      content: aiResponse,
      nextPhase: 'analyze-complete',
      progress: 95
    })

  } catch (error) {
    console.error('Action analysis failed:', error)
    throw new Error('Failed to generate action recommendations')
  }
}

// PHASE 4D: Analyze Complete - Combine all results and generate final context
async function handleAnalyzeCompletePhase(query: string, timeframe: string, context: any) {
  console.log('✅ Phase 4D: Finalizing complete analysis...')
  
  const { statistics, enrichedContext } = context
  
  // Build comprehensive context for final response
  const contextData = {
    query,
    timeframe,
    ...statistics,
    semanticResults: enrichedContext || [],
    relevantDefects: (enrichedContext || []).filter((r: any) => r.type === 'defect' && r.entityData).map((r: any) => r.entityData),
    relatedUserStories: (enrichedContext || []).filter((r: any) => r.type === 'user_story' && r.entityData).map((r: any) => r.entityData),
    relatedTestCases: (enrichedContext || []).filter((r: any) => r.type === 'test_case' && r.entityData).map((r: any) => r.entityData)
  }

  return NextResponse.json({
    phase: 'analyze-complete',
    query,
    timeframe,
    message: "Analysis complete! All sections have been generated progressively.",
    ragContext: {
      semanticResultsCount: (enrichedContext || []).length,
      relevantDefectsFound: contextData.relevantDefects.length,
      relatedUserStoriesFound: contextData.relatedUserStories.length,
      relatedTestCasesFound: contextData.relatedTestCases.length,
      totalDefects: statistics.totalDefects,
      defectTitlesAnalyzed: statistics.defectTitlesCount || 0,
      richContextUsed: statistics.allDefects ? true : false,
      topComponents: (statistics.defectsByComponent || []).slice(0, 3).map((c: any) => c.component), // Extract component names
      topPatterns: (statistics.defectPatterns || []).slice(0, 3).map((p: any) => p.rootCause) // Extract pattern names
    },
    progress: 100,
    completed: true
  })
} 