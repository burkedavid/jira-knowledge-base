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

    // 🔍 RAG STEP 5: Generate AI-powered analysis using Claude with full context
    const aiPrompt = `You are a senior QA analyst analyzing defect patterns and trends. Based on the user's query and the comprehensive data provided, generate a detailed, actionable analysis.

**User Query:** "${query}"
**Timeframe:** ${timeframe}

**Database Statistics:**
- Total Defects: ${totalDefects}
- Defects by Severity: ${JSON.stringify(defectsBySeverity)}
- Top Components: ${JSON.stringify(defectsByComponent.slice(0, 5))}
- Root Cause Patterns: ${JSON.stringify(defectPatterns.slice(0, 5))}

**Semantically Relevant Context (${enrichedContext.length} items found):**
${enrichedContext.map((item, index) => `
${index + 1}. **${item.type.toUpperCase()}** (Similarity: ${(item.similarity * 100).toFixed(1)}%)
   Content: ${item.content.substring(0, 200)}...
   ${item.entityData ? `
   Details: ${JSON.stringify(item.entityData, null, 2).substring(0, 300)}...` : ''}
`).join('\n')}

**Related Defects Found:** ${contextData.relevantDefects.length}
**Related User Stories:** ${contextData.relatedUserStories.length}  
**Related Test Cases:** ${contextData.relatedTestCases.length}

Please provide a comprehensive analysis that:
1. Directly answers the user's specific question
2. Uses the semantic search results to provide deeper insights
3. Identifies patterns and trends from the data
4. Provides actionable recommendations
5. Highlights any concerning patterns or risks

Format your response in markdown with clear sections, bullet points, and emphasis on key findings.`

    console.log('🤖 Generating AI analysis with RAG context...')
    
    try {
      const aiResponse = await generateTextWithClaude([
        { role: 'user', content: aiPrompt }
      ], {
        maxTokens: 2000,
        temperature: 0.3 // Lower temperature for more focused analysis
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