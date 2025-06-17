import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { vectorSearchWithTimeframe } from '@/lib/vector-db'
import { generateTextWithClaude } from '@/lib/aws-bedrock'

export async function POST(request: NextRequest) {
  try {
    const { query, timeframe = '1y' } = await request.json()

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

    // 🔍 RAG STEP 1: Semantic Search for Relevant Context with Time Filtering
    console.log('🔍 Performing semantic search for query:', query)
    
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
      vectorTimeframe, // Use the mapped timeframe parameter for date filtering
      ['defect', 'user_story', 'test_case'], // Search across relevant content types
      10, // Get top 10 most relevant items
      0.6 // Lower threshold for broader context
    )

    // 🔍 RAG STEP 2: Enrich semantic results with full entity data
    const enrichedContext = await Promise.all(
      semanticResults.map(async (result) => {
        try {
          let entityData = null
          
          switch (result.sourceType) {
            case 'defect':
              entityData = await prisma.defect.findUnique({
                where: { id: result.sourceId }
              })
              break
            case 'user_story':
              entityData = await prisma.userStory.findUnique({
                where: { id: result.sourceId }
              })
              break
            case 'test_case':
              entityData = await prisma.testCase.findUnique({
                where: { id: result.sourceId }
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

    // 🔍 RAG STEP 3: Get comprehensive database statistics
    const totalDefects = await prisma.defect.count({
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
    })

    const defectsBySeverity = await prisma.defect.groupBy({
      by: ['severity'],
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      _count: { id: true }
    })

    const defectsByComponent = await prisma.defect.groupBy({
      by: ['component'],
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })

    const defectPatterns = await prisma.defect.groupBy({
      by: ['rootCause'],
      where: {
        rootCause: { not: null },
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })

    // 🔍 RAG STEP 4: Build comprehensive context for AI analysis
    const contextData = {
      query,
      timeframe,
      totalDefects,
      defectsBySeverity,
      defectsByComponent,
      defectPatterns,
      semanticResults: enrichedContext.filter(r => r.entityData !== null),
      relevantDefects: enrichedContext.filter(r => r.type === 'defect' && r.entityData).map(r => r.entityData),
      relatedUserStories: enrichedContext.filter(r => r.type === 'user_story' && r.entityData).map(r => r.entityData),
      relatedTestCases: enrichedContext.filter(r => r.type === 'test_case' && r.entityData).map(r => r.entityData)
    }

    // 🔍 RAG STEP 5: Generate AI-powered analysis using Enhanced Intelligence Framework
    const aiPrompt = `You are an Enhanced Defect Analytics Intelligence System implementing Business Risk Coverage (BRC) methodology. Transform raw defect data into strategic intelligence that drives measurable quality improvements and automation ROI.

**MISSION:** Generate insights that enable immediate action and long-term strategic planning using the Intelligence Generation Framework.

**User Query:** "${query}"
**Timeframe:** ${timeframe}
**Analysis Context:** ${timeframe === 'all' ? 'System Quality Baseline Report' : 'Periodic Quality Intelligence Report'}

**CORE DATA ANALYSIS:**
- Total Defects: ${totalDefects}
- Defects by Severity: ${JSON.stringify(defectsBySeverity)}
- Top Components: ${JSON.stringify(defectsByComponent.slice(0, 5))}
- Root Cause Patterns: ${JSON.stringify(defectPatterns.slice(0, 5))}

**RAG CONTEXT (${enrichedContext.length} items found):**
${enrichedContext.map((item, index) => `
${index + 1}. **${item.type.toUpperCase()}** (Similarity: ${(item.similarity * 100).toFixed(1)}%)
   Content: ${item.content.substring(0, 200)}...
   ${item.entityData ? `
   Details: ${JSON.stringify(item.entityData, null, 2).substring(0, 300)}...` : ''}
`).join('\n')}

**INTELLIGENCE GENERATION FRAMEWORK:**

## 1. EXECUTIVE INTELLIGENCE LAYER
Generate:
- **Risk Assessment:** Quantify quality risk levels and business impact
- **Trend Velocity:** Calculate defect acceleration/deceleration patterns  
- **Quality Debt:** Identify accumulating technical debt indicators
- **Investment ROI:** Predict automation investment returns

## 2. STRATEGIC PATTERN RECOGNITION
Identify:
- **Defect Hotspots:** Modules/features with highest defect density
- **Seasonal Patterns:** Cyclical quality issues (release cycles, team changes)
- **Cascade Effects:** Defects that trigger downstream issues
- **Quality Momentum:** Improving vs declining quality trajectories

## 3. BUSINESS RISK COVERAGE (BRC) ANALYSIS

**CRITICAL FORMATTING:** Present this as a clean, readable list format - NOT as a table. Use the following structure exactly:

**COMPONENT RISK ASSESSMENT:**

**1. [Component Name] - RISK LEVEL: [CRITICAL/HIGH/MEDIUM/LOW]**
   • Defect Count: [number] defects
   • Business Impact: [HIGH/MEDIUM/LOW] - [brief impact description]
   • Usage Level: [VERY HIGH/HIGH/MEDIUM/LOW]
   • Risk Score: [number]/100
   • Priority Action: [specific action needed]

**2. [Next Component Name] - RISK LEVEL: [CRITICAL/HIGH/MEDIUM/LOW]**
   • Defect Count: [number] defects
   • Business Impact: [HIGH/MEDIUM/LOW] - [brief impact description]
   • Usage Level: [VERY HIGH/HIGH/MEDIUM/LOW]
   • Risk Score: [number]/100
   • Priority Action: [specific action needed]

Continue for the top 5-8 most critical components only.

**Risk Scoring Logic:**
- Impact: HIGH (10 pts), MEDIUM (6 pts), LOW (3 pts)  
- Usage: VERY HIGH (10 pts), HIGH (7 pts), MEDIUM (5 pts), LOW (2 pts)
- Risk Score = (Impact × Usage × Defect Count) ÷ 10

**ABSOLUTELY NO TABLES** - Use the numbered list format above for maximum readability.

## 4. ROLE-SPECIFIC ACTION INTELLIGENCE

### For Test Automation Engineers (Especially New Hires):
- **System Weakness Map:** Priority 1-3 areas for automation
- **Automation ROI Calculator:** Estimated time savings per test suite
- **Quick Wins:** Low-effort, high-impact automation opportunities
- **Architecture Insights:** Test framework gaps revealed by defect patterns

### For QA Engineers:
- **Testing Gap Analysis:** Uncovered scenarios based on defect origins
- **Coverage Optimization:** Areas needing enhanced test coverage
- **Process Improvements:** Workflow changes to prevent defect types

### For Developers:
- **Code Quality Hotspots:** Modules requiring refactoring attention
- **Development Patterns:** Coding practices contributing to defects
- **Technical Debt Priorities:** Areas where shortcuts cause quality issues

### For Product Owners/Managers:
- **Feature Quality Scores:** User-facing impact of defect trends
- **Release Readiness Indicators:** Quality gates and risk assessments
- **Resource Allocation Guidance:** Where to invest QA resources for maximum impact

## 5. PREDICTIVE INTELLIGENCE
Provide:
- **Defect Forecasting:** Predict likely defect volumes for upcoming periods
- **Quality Trajectory:** Project quality trends based on current patterns
- **Intervention Points:** When quality issues require immediate action
- **Success Metrics:** Define measurable outcomes for quality initiatives

## OUTPUT REQUIREMENTS:
- **Strategic Value:** Every insight must be actionable within 30 days
- **Quantified Impact:** Include effort estimates and ROI projections where possible
- **Clear Metrics:** Provide success/failure criteria
- **Business Context:** Connect defect patterns to business outcomes

## RESPONSE FORMAT:
Structure your analysis with clear sections, executive summary, detailed findings, and specific action plans. 

**CRITICAL FORMATTING RULES - STRICTLY ENFORCE:**
- Use ONLY plain text with **bold** for emphasis
- ABSOLUTELY FORBIDDEN: ==text==, <mark>text</mark>, highlighting, background colors
- ABSOLUTELY FORBIDDEN: Any form of text highlighting or coloring
- ABSOLUTELY FORBIDDEN: HTML tags, colored backgrounds, or visual emphasis beyond bold
- ABSOLUTELY FORBIDDEN: Tables of any kind - use numbered lists instead
- Use simple bullet points (•) and numbered lists only
- Keep ALL text completely clean with NO visual formatting beyond **bold**
- For data presentation: Use numbered lists with bullet points, NEVER tables
- For emphasis: ONLY use **bold** - nothing else is allowed
- NEVER highlight section titles, component names, or any other text
- All text must render as plain black/white text with only bold emphasis
- NO TABLES ANYWHERE - Always use structured lists for data presentation

Focus on generating a comprehensive intelligence report that serves as both immediate tactical guidance and long-term strategic planning foundation.`

    console.log('🤖 Generating AI analysis with RAG context...')
    
    try {
      const aiResponse = await generateTextWithClaude([
        { role: 'user', content: aiPrompt }
      ], {
        maxTokens: 4000, // Increased for comprehensive intelligence reports
        temperature: 0.2 // Even lower temperature for more structured analysis
      })

      return NextResponse.json({
        query,
        timeframe,
        analysis: aiResponse,
        ragContext: {
          semanticResultsCount: enrichedContext.length,
          relevantDefectsFound: contextData.relevantDefects.length,
          relatedUserStoriesFound: contextData.relatedUserStories.length,
          relatedTestCasesFound: contextData.relatedTestCases.length,
          totalDefects,
          topComponents: defectsByComponent.slice(0, 3).map((d: any) => ({
            component: d.component || 'Unknown',
            count: d._count.id
          })),
          topPatterns: defectPatterns.slice(0, 3).map((d: any) => ({
            rootCause: d.rootCause,
            frequency: d._count.id
          }))
        }
      })

    } catch (aiError) {
      console.error('AI analysis failed, falling back to rule-based analysis:', aiError)
      
      // Fallback to rule-based analysis if AI fails
      const queryLower = query.toLowerCase()
      let analysis = ''

      if (queryLower.includes('worst') && queryLower.includes('functionality')) {
        const worstComponent = defectsByComponent[0]
        analysis = `## Worst Functionality Analysis (RAG-Enhanced)

**🎯 Answer: "${worstComponent?.component || 'Unknown'}" is the worst performing component**

**Key Findings:**
- **${worstComponent?.component || 'Unknown'}** has the highest defect count with **${worstComponent?._count.id || 0} defects**
- This represents **${Math.round(((worstComponent?._count.id || 0) / totalDefects) * 100)}%** of all defects

**RAG Context Found:**
- ${enrichedContext.length} semantically related items
- ${contextData.relevantDefects.length} related defects with similar patterns

**Component Ranking:**
${defectsByComponent.slice(0, 5).map((comp: any, index: number) => 
  `${index + 1}. **${comp.component || 'Unknown'}**: ${comp._count.id} defects`
).join('\n')}`

      } else {
        analysis = `## RAG-Enhanced Analysis for: "${query}"

**Summary:**
- Total defects: ${totalDefects}
- Semantic search found: ${enrichedContext.length} related items
- Related defects: ${contextData.relevantDefects.length}
- Related user stories: ${contextData.relatedUserStories.length}

**Top Components:**
${defectsByComponent.slice(0, 3).map((item: any) => 
  `- ${item.component || 'Unknown'}: ${item._count.id} defects`
).join('\n')}

**Semantic Insights:**
${enrichedContext.slice(0, 3).map((item, index) => 
  `${index + 1}. ${item.type}: ${item.content.substring(0, 100)}... (${(item.similarity * 100).toFixed(1)}% match)`
).join('\n')}

**💡 Try specific questions for deeper RAG analysis:**
- "What patterns do we see in authentication defects?"
- "Which components have recurring issues?"
- "What are the root causes of high-severity defects?"`
      }

      return NextResponse.json({
        query,
        timeframe,
        analysis,
        ragContext: {
          semanticResultsCount: enrichedContext.length,
          relevantDefectsFound: contextData.relevantDefects.length,
          relatedUserStoriesFound: contextData.relatedUserStories.length,
          relatedTestCasesFound: contextData.relatedTestCases.length,
          totalDefects,
          aiAnalysisFailed: true
        }
      })
    }

  } catch (error) {
    console.error('Error in RAG-enhanced defect query:', error)
    return NextResponse.json(
      { error: 'Failed to analyze defect query with RAG', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 