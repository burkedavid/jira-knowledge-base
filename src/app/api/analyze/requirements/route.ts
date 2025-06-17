import { NextRequest, NextResponse } from 'next/server'
import { analyzeRequirements } from '@/lib/claude'
import { prisma } from '@/lib/prisma'
import { vectorSearch, SourceType } from '@/lib/vector-db'

// Helper function to perform semantic search and enrich with entity details
async function semanticSearchWithDetails(
  query: string,
  sourceTypes: SourceType[],
  limit: number = 10,
  threshold: number = 0.7
) {
  const searchResults = await vectorSearch(query, sourceTypes, limit, threshold)
  
  // Enrich results with full entity details
  const enrichedResults = await Promise.all(
    searchResults.map(async (result) => {
      let entity = null

      try {
        switch (result.sourceType) {
          case 'user_story':
            entity = await prisma.userStory.findUnique({
              where: { id: result.sourceId },
              include: {
                qualityScores: { 
                  select: { score: true, riskFactors: true },
                  orderBy: { generatedAt: 'desc' },
                  take: 1
                }
              }
            })
            break

          case 'defect':
            entity = await prisma.defect.findUnique({
              where: { id: result.sourceId }
            })
            break

          case 'test_case':
            entity = await prisma.testCase.findUnique({
              where: { id: result.sourceId }
            })
            break

          case 'document':
            entity = await prisma.document.findUnique({
              where: { id: result.sourceId }
            })
            break
        }
      } catch (error) {
        console.error(`Error fetching details for ${result.sourceType} ${result.sourceId}:`, error)
      }

      return {
        ...result,
        entity
      }
    })
  )

  return enrichedResults.filter(result => result.entity !== null)
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting requirements analysis with RAG...')
    
    const { userStoryId, criteria = ['invest', 'risk', 'defectPatterns'] } = await request.json()

    if (!userStoryId) {
      return NextResponse.json(
        { error: 'User story ID is required' },
        { status: 400 }
      )
    }

    console.log('📖 Fetching user story:', userStoryId)

    // Get user story details
    const userStory = await prisma.userStory.findUnique({
      where: { id: userStoryId },
      include: {
        qualityScores: {
          orderBy: { generatedAt: 'desc' },
          take: 1
        }
      }
    })

    if (!userStory) {
      return NextResponse.json(
        { error: 'User story not found' },
        { status: 404 }
      )
    }

    console.log('🔍 Building RAG context for requirements analysis...')

    // Create search query from user story
    const searchQuery = `${userStory.title} ${userStory.description || ''} ${userStory.component || ''}`.trim()
    console.log('  - Search query:', searchQuery)

    let ragContext = ''

    try {
      // Search for related defects (quality issues and patterns)
      const relatedDefects = await semanticSearchWithDetails(
        searchQuery,
        ['defect'],
        5, // limit
        0.3 // threshold - lower for more results
      )
      console.log('🐛 Found related defects via semantic search:', relatedDefects.length)

      // Search for similar user stories (quality benchmarks)
      const similarStories = await semanticSearchWithDetails(
        searchQuery,
        ['user_story'],
        3, // limit
        0.4 // threshold
      )
      console.log('📖 Found similar user stories via semantic search:', similarStories.length)

      // Search for related test cases (testability insights)
      const relatedTestCases = await semanticSearchWithDetails(
        searchQuery,
        ['test_case'],
        3, // limit
        0.4 // threshold
      )
      console.log('🧪 Found related test cases via semantic search:', relatedTestCases.length)

      // Search for related documentation (technical context and patterns)
      const relatedDocs = await semanticSearchWithDetails(
        searchQuery,
        ['document'],
        3, // limit
        0.3 // threshold - lower for more results since docs are important
      )
      console.log('📚 Found related documentation via semantic search:', relatedDocs.length)

      // Build RAG context with better formatting and source attribution
      if (relatedDefects.length > 0 || similarStories.length > 0 || relatedTestCases.length > 0 || relatedDocs.length > 0) {
        ragContext += '\n**KNOWLEDGE BASE CONTEXT:**\n'
        
        if (relatedDefects.length > 0) {
          ragContext += '\n=== HISTORICAL QUALITY ISSUES (Learn from past problems) ===\n'
          relatedDefects.forEach((defect, index) => {
            if (defect.entity) {
              ragContext += `Defect ${index + 1}: ${defect.entity.title}\n`
              ragContext += `Description: ${(defect.entity as any).description || 'No description'}\n`
              ragContext += `Severity: ${(defect.entity as any).severity || 'Unknown'}\n`
              ragContext += `Component: ${(defect.entity as any).component || 'Unknown'}\n`
              ragContext += `Source: Defect Database (ID: ${defect.entity.id})\n`
              ragContext += '---\n'
            }
          })
        }

        if (similarStories.length > 0) {
          ragContext += '\n=== RELATED USER STORIES (Similar requirements) ===\n'
          similarStories.forEach((story, index) => {
            if (story.entity) {
              ragContext += `Story ${index + 1}: ${story.entity.title}\n`
              ragContext += `Description: ${((story.entity as any).description || 'No description').substring(0, 200)}...\n`
              ragContext += `Priority: ${(story.entity as any).priority || 'Unknown'}\n`
              ragContext += `Status: ${(story.entity as any).status || 'Unknown'}\n`
              ragContext += `Source: Requirements Database (ID: ${story.entity.id})\n`
              ragContext += '---\n'
            }
          })
        }

        if (relatedTestCases.length > 0) {
          ragContext += '\n=== RELATED TEST CASES (Testing insights) ===\n'
          relatedTestCases.forEach((testCase, index) => {
            if (testCase.entity) {
              ragContext += `Test ${index + 1}: ${testCase.entity.title}\n`
              ragContext += `Steps: ${((testCase.entity as any).steps || 'No steps').substring(0, 150)}...\n`
              ragContext += `Expected Results: ${((testCase.entity as any).expectedResults || 'No expected results').substring(0, 150)}...\n`
              ragContext += `Source: Test Case Database (ID: ${testCase.entity.id})\n`
              ragContext += '---\n'
            }
          })
        }

        if (relatedDocs.length > 0) {
          ragContext += '\n=== TECHNICAL DOCUMENTATION (Domain knowledge and patterns) ===\n'
          relatedDocs.forEach((doc, index) => {
            if (doc.entity) {
              ragContext += `Document ${index + 1}: ${doc.entity.title}\n`
              ragContext += `Content: ${((doc.entity as any).content || 'No content').substring(0, 300)}...\n`
              ragContext += `Type: ${(doc.entity as any).type || 'Unknown'}\n`
              ragContext += `Source: Documentation Database (ID: ${doc.entity.id})\n`
              ragContext += '---\n'
            }
          })
        }
      }

      console.log('📋 RAG context built with', ragContext.length, 'characters')
      console.log('📋 RAG context preview:', ragContext.substring(0, 200))

    } catch (searchError) {
      console.error('⚠️ Semantic search failed, falling back to basic search:', searchError)
      
      // Fallback to basic search if semantic search fails
      const relatedDefects = await prisma.defect.findMany({
        where: {
          OR: [
            { component: userStory.component },
            { title: { contains: userStory.title.split(' ')[0] } },
          ],
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
      })

      ragContext = relatedDefects.map((defect: any) => 
        `Historical Quality Issue: ${defect.title} - ${defect.description}`
      ).join('\n')
    }

    console.log('🤖 Calling analyzeRequirements with RAG context...')

    // Analyze requirements using Claude with RAG context
    const analysis = await analyzeRequirements(
      userStory.title + '\n\n' + userStory.description,
      userStory.acceptanceCriteria || 'No acceptance criteria provided',
      ragContext // Pass RAG context as string
    )

    console.log('✅ Requirements analysis completed')

    // Parse the analysis response to extract structured data
    let structuredResult: any = {
      qualityScore: 5,
      strengths: [],
      improvements: [],
      riskFactors: [],
      ragSuggestions: [], // New field for RAG-specific suggestions
      analysis: analysis
    }

    try {
      // Try to extract structured information from the analysis
      const scoreMatch = analysis.match(/(?:Quality Score|Score).*?(\d+(?:\.\d+)?)/i)
      if (scoreMatch) {
        structuredResult.qualityScore = parseFloat(scoreMatch[1])
      }

      // Extract strengths
      const strengthsMatch = analysis.match(/(?:Strengths?|Positive aspects?)[\s\S]*?(?=(?:Improvements?|Weaknesses?|Risk|$))/i)
      if (strengthsMatch) {
        const strengthsText = strengthsMatch[0]
        const strengthsList = strengthsText.match(/[•\-\*]\s*(.+)/g)
        if (strengthsList) {
          structuredResult.strengths = strengthsList.map(s => s.replace(/[•\-\*]\s*/, '').trim())
        }
      }

      // Extract improvements
      const improvementsMatch = analysis.match(/(?:Improvements?|Recommendations?|Suggestions?)[\s\S]*?(?=(?:Risk|Strengths?|$))/i)
      if (improvementsMatch) {
        const improvementsText = improvementsMatch[0]
        const improvementsList = improvementsText.match(/[•\-\*]\s*(.+)/g)
        if (improvementsList) {
          structuredResult.improvements = improvementsList.map(s => s.replace(/[•\-\*]\s*/, '').trim())
        }
      }

      // Extract risk factors
      const riskMatch = analysis.match(/(?:Risk|Concerns?)[\s\S]*?(?=(?:Improvements?|Strengths?|$))/i)
      if (riskMatch) {
        const riskText = riskMatch[0]
        const riskList = riskText.match(/[•\-\*]\s*(.+)/g)
        if (riskList) {
          structuredResult.riskFactors = riskList.map(s => s.replace(/[•\-\*]\s*/, '').trim())
        }
      }

      // Extract RAG-based suggestions from the RAG-Based Insights section
      const ragMatch = analysis.match(/(?:RAG-Based Insights?)[\s\S]*?(?=(?:Recommended Actions|$))/i)
      if (ragMatch) {
        const ragText = ragMatch[0]
        
        // Extract suggestions from Related Dependencies, Potential Risks, and Testing Considerations
        const ragSuggestions = []
        
        // Related Dependencies suggestions
        const dependenciesMatch = ragText.match(/Related Dependencies[\s\S]*?(?=(?:Potential Risks|Testing Considerations|$))/i)
        if (dependenciesMatch) {
          const depText = dependenciesMatch[0]
          const depSuggestions = depText.match(/[•\-\*]\s*(.+)/g)
          if (depSuggestions) {
            ragSuggestions.push(...depSuggestions.map(s => 
              `Integration: ${s.replace(/[•\-\*]\s*/, '').trim()}`
            ))
          }
        }
        
        // Potential Risks suggestions  
        const potentialRisksMatch = ragText.match(/Potential Risks[\s\S]*?(?=(?:Testing Considerations|$))/i)
        if (potentialRisksMatch) {
          const riskText = potentialRisksMatch[0]
          const riskSuggestions = riskText.match(/[•\-\*]\s*(.+)/g)
          if (riskSuggestions) {
            ragSuggestions.push(...riskSuggestions.map(s => 
              `Risk Mitigation: ${s.replace(/[•\-\*]\s*/, '').trim()}`
            ))
          }
        }
        
        // Testing Considerations suggestions
        const testingMatch = ragText.match(/Testing Considerations[\s\S]*?$/i)
        if (testingMatch) {
          const testText = testingMatch[0]
          const testSuggestions = testText.match(/[•\-\*]\s*(.+)/g)
          if (testSuggestions) {
            ragSuggestions.push(...testSuggestions.map(s => 
              `Testing: ${s.replace(/[•\-\*]\s*/, '').trim()}`
            ))
          }
        }
        
        structuredResult.ragSuggestions = ragSuggestions
      }

    } catch (parseError) {
      console.error('⚠️ Error parsing analysis response:', parseError)
    }

    console.log('💾 Saving quality score to database...')

    // Save quality score with RAG context metadata
    await prisma.qualityScore.create({
      data: {
        userStoryId: userStory.id,
        score: structuredResult.qualityScore,
        riskFactors: JSON.stringify(structuredResult.riskFactors),
        suggestions: analysis,
      },
    })

    // CRITICAL: Update the user story with the latest quality score
    // This allows analysts to see which requirements need work
    const riskLevel = structuredResult.qualityScore >= 8 ? 'Low' : 
                     structuredResult.qualityScore >= 6 ? 'Medium' : 
                     structuredResult.qualityScore >= 4 ? 'High' : 'Critical'
    
    await prisma.userStory.update({
      where: { id: userStory.id },
      data: {
        qualityScore: structuredResult.qualityScore,
        riskLevel: riskLevel
      }
    })

    // CRITICAL FIX: Also create a record in requirementAnalysis table for consistency
    // This ensures individual analyses are counted in the platform overview stats
    // For individual analyses, we'll use a special batch ID to distinguish them
    await prisma.requirementAnalysis.create({
      data: {
        userStoryId: userStory.id,
        qualityScore: structuredResult.qualityScore,
        riskLevel: riskLevel,
        strengths: JSON.stringify(structuredResult.strengths),
        improvements: JSON.stringify(structuredResult.improvements),
        riskFactors: JSON.stringify(structuredResult.riskFactors),
        aiAnalysis: analysis,
        batchId: 'individual-analysis' // Special identifier for individual analyses
      }
    })

    console.log('✅ Requirements analysis completed successfully')

    return NextResponse.json({
      message: 'Requirements analysis completed with RAG context',
      ...structuredResult,
      userStory: {
        id: userStory.id,
        title: userStory.title,
        description: userStory.description,
        acceptanceCriteria: userStory.acceptanceCriteria,
      },
      ragContextUsed: ragContext.length > 0,
      ragContextLines: ragContext ? ragContext.split('\n').length : 0,
    })
  } catch (error) {
    console.error('💥 Error analyzing requirements:', error)
    return NextResponse.json(
      { error: 'Failed to analyze requirements' },
      { status: 500 }
    )
  }
} 