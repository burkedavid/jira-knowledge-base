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
  console.log(`🔍 Semantic search: "${query}" for types [${sourceTypes.join(', ')}] with threshold ${threshold}`)
  
  const searchResults = await vectorSearch(query, sourceTypes, limit, threshold)
  console.log(`📊 Raw search results: ${searchResults.length} found`)
  
  // If no results with the initial threshold, try progressively lower thresholds
  let finalResults = searchResults
  if (searchResults.length === 0) {
    console.log('⚠️ No results with initial threshold, trying lower thresholds...')
    
    const fallbackThresholds = [0.2, 0.1, 0.05, 0.01]
    for (const fallbackThreshold of fallbackThresholds) {
      console.log(`🔄 Trying threshold ${fallbackThreshold}...`)
      const fallbackResults = await vectorSearch(query, sourceTypes, limit, fallbackThreshold)
      if (fallbackResults.length > 0) {
        console.log(`✅ Found ${fallbackResults.length} results with threshold ${fallbackThreshold}`)
        finalResults = fallbackResults
        break
      }
    }
  }
  
  // Enrich results with full entity details
  const enrichedResults = await Promise.all(
    finalResults.map(async (result) => {
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

  const validResults = enrichedResults.filter(result => result.entity !== null)
  console.log(`✅ Final enriched results: ${validResults.length} valid entities`)
  
  return validResults
}

// Helper function to get smart display identifier (same as search results)
function getDisplayIdentifier(entity: any, sourceType: string): string {
  // Priority order: Jira Key > Entity Title > Smart ID
  if (entity.jiraKey) {
    return entity.jiraKey;
  }
  
  if (entity.title) {
    // Truncate long titles to 50 chars
    const title = entity.title.length > 50 ? entity.title.substring(0, 50) + '...' : entity.title;
    return title;
  }
  
  // Fallback to smart ID (type + short ID)
  const shortId = entity.id.substring(entity.id.length - 8);
  const typeMap: { [key: string]: string } = {
    'user_story': 'Story',
    'defect': 'Defect',
    'test_case': 'Test',
    'document': 'Doc'
  };
  return `${typeMap[sourceType] || sourceType}-${shortId}`;
}

export async function POST(request: NextRequest) {
  let requestBody: any = {}
  
  try {
    console.log('🔍 Starting requirements analysis with RAG...')
    
    requestBody = await request.json()
    const { userStoryId, criteria = ['invest', 'risk', 'defectPatterns'] } = requestBody

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
      // First, check if we have any embeddings at all
      const embeddingStats = await prisma.embedding.count()
      console.log(`📊 Total embeddings in database: ${embeddingStats}`)
      
      if (embeddingStats === 0) {
        console.log('⚠️ No embeddings found in database - RAG will not work without embeddings')
        console.log('💡 You need to generate embeddings first via /api/embeddings/generate')
      }

      // Search for related defects (quality issues and patterns) - much lower threshold
      const relatedDefects = await semanticSearchWithDetails(
        searchQuery,
        ['defect'],
        5, // limit
        0.1 // threshold - much lower for more results
      )
      console.log('🐛 Found related defects via semantic search:', relatedDefects.length)

      // Search for similar user stories (quality benchmarks) - much lower threshold
      const similarStories = await semanticSearchWithDetails(
        searchQuery,
        ['user_story'],
        3, // limit
        0.1 // threshold - much lower
      )
      console.log('📖 Found similar user stories via semantic search:', similarStories.length)

      // Search for related test cases (testability insights) - much lower threshold
      const relatedTestCases = await semanticSearchWithDetails(
        searchQuery,
        ['test_case'],
        3, // limit
        0.1 // threshold - much lower
      )
      console.log('🧪 Found related test cases via semantic search:', relatedTestCases.length)

      // Search for related documentation (technical context and patterns) - much lower threshold
      const relatedDocs = await semanticSearchWithDetails(
        searchQuery,
        ['document'],
        3, // limit
        0.1 // threshold - much lower for more results since docs are important
      )
      console.log('📚 Found related documentation via semantic search:', relatedDocs.length)

      // Build RAG context with better formatting and source attribution
      if (relatedDefects.length > 0 || similarStories.length > 0 || relatedTestCases.length > 0 || relatedDocs.length > 0) {
        ragContext += '\n**KNOWLEDGE BASE CONTEXT:**\n'
        
        if (relatedDefects.length > 0) {
          ragContext += '\n=== HISTORICAL QUALITY ISSUES (Learn from past problems) ===\n'
          relatedDefects.forEach((defect, index) => {
            if (defect.entity) {
              ragContext += `Defect ${index + 1}: ${getDisplayIdentifier(defect.entity, 'defect')}\n`
              ragContext += `Description: ${(defect.entity as any).description || 'No description'}\n`
              ragContext += `Severity: ${(defect.entity as any).severity || 'Unknown'}\n`
              ragContext += `Component: ${(defect.entity as any).component || 'Unknown'}\n`
              ragContext += `Source: Defect Database (${getDisplayIdentifier(defect.entity, 'defect')})\n`
              ragContext += '---\n'
            }
          })
        }

        if (similarStories.length > 0) {
          ragContext += '\n=== RELATED USER STORIES (Similar requirements) ===\n'
          similarStories.forEach((story, index) => {
            if (story.entity) {
              ragContext += `Story ${index + 1}: ${getDisplayIdentifier(story.entity, 'user_story')}\n`
              ragContext += `Description: ${((story.entity as any).description || 'No description').substring(0, 200)}...\n`
              ragContext += `Priority: ${(story.entity as any).priority || 'Unknown'}\n`
              ragContext += `Status: ${(story.entity as any).status || 'Unknown'}\n`
              ragContext += `Source: Requirements Database (${getDisplayIdentifier(story.entity, 'user_story')})\n`
              ragContext += '---\n'
            }
          })
        }

        if (relatedTestCases.length > 0) {
          ragContext += '\n=== RELATED TEST CASES (Testing insights) ===\n'
          relatedTestCases.forEach((testCase, index) => {
            if (testCase.entity) {
              ragContext += `Test ${index + 1}: ${getDisplayIdentifier(testCase.entity, 'test_case')}\n`
              ragContext += `Steps: ${((testCase.entity as any).steps || 'No steps').substring(0, 150)}...\n`
              ragContext += `Expected Results: ${((testCase.entity as any).expectedResults || 'No expected results').substring(0, 150)}...\n`
              ragContext += `Source: Test Case Database (${getDisplayIdentifier(testCase.entity, 'test_case')})\n`
              ragContext += '---\n'
            }
          })
        }

        if (relatedDocs.length > 0) {
          ragContext += '\n=== TECHNICAL DOCUMENTATION (Domain knowledge and patterns) ===\n'
          relatedDocs.forEach((doc, index) => {
            if (doc.entity) {
              ragContext += `Document ${index + 1}: ${getDisplayIdentifier(doc.entity, 'document')}\n`
              ragContext += `Content: ${((doc.entity as any).content || 'No content').substring(0, 300)}...\n`
              ragContext += `Type: ${(doc.entity as any).type || 'Unknown'}\n`
              ragContext += `Source: Documentation Database (${getDisplayIdentifier(doc.entity, 'document')})\n`
              ragContext += '---\n'
            }
          })
        }
      }

      console.log('📋 RAG context built with', ragContext.length, 'characters')
      console.log('📋 RAG context preview:', ragContext.substring(0, 200))

    } catch (searchError) {
      console.error('⚠️ Semantic search failed, falling back to basic database search:', searchError)
      
      // Comprehensive fallback to basic search if semantic search fails
      try {
        console.log('🔄 Attempting fallback database searches...')
        
        // Search for defects by component and keywords
        const relatedDefects = await prisma.defect.findMany({
          where: {
            OR: [
              { component: userStory.component },
              { title: { contains: userStory.title.split(' ')[0] } },
              { description: { contains: userStory.title.split(' ')[0] } },
            ],
          },
          take: 3,
          orderBy: { createdAt: 'desc' },
        })
        console.log(`🐛 Fallback: Found ${relatedDefects.length} related defects`)

        // Search for similar user stories
        const similarStories = await prisma.userStory.findMany({
          where: {
            AND: [
              { id: { not: userStory.id } }, // Exclude current story
              {
                OR: [
                  { component: userStory.component },
                  { title: { contains: userStory.title.split(' ')[0] } },
                  { description: { contains: userStory.title.split(' ')[0] } },
                ],
              }
            ]
          },
          take: 2,
          orderBy: { createdAt: 'desc' },
        })
        console.log(`📖 Fallback: Found ${similarStories.length} similar user stories`)

        // Search for related test cases
        const relatedTestCases = await prisma.testCase.findMany({
          where: {
            OR: [
              { title: { contains: userStory.title.split(' ')[0] } },
              { steps: { contains: userStory.title.split(' ')[0] } },
            ],
          },
          take: 2,
          orderBy: { createdAt: 'desc' },
        })
        console.log(`🧪 Fallback: Found ${relatedTestCases.length} related test cases`)

        // Search for related documents
        const relatedDocs = await prisma.document.findMany({
          where: {
            OR: [
              { title: { contains: userStory.title.split(' ')[0] } },
              { content: { contains: userStory.title.split(' ')[0] } },
            ],
          },
          take: 2,
          orderBy: { createdAt: 'desc' },
        })
        console.log(`📚 Fallback: Found ${relatedDocs.length} related documents`)

        // Build fallback RAG context
        if (relatedDefects.length > 0 || similarStories.length > 0 || relatedTestCases.length > 0 || relatedDocs.length > 0) {
          ragContext += '\n**KNOWLEDGE BASE CONTEXT (Database Fallback):**\n'
          
          if (relatedDefects.length > 0) {
            ragContext += '\n=== HISTORICAL QUALITY ISSUES ===\n'
            relatedDefects.forEach((defect: any, index) => {
              ragContext += `Defect ${index + 1}: ${getDisplayIdentifier(defect, 'defect')}\n`
              ragContext += `Description: ${defect.description || 'No description'}\n`
              ragContext += `Severity: ${defect.severity || 'Unknown'}\n`
              ragContext += `Component: ${defect.component || 'Unknown'}\n`
              ragContext += '---\n'
            })
          }

          if (similarStories.length > 0) {
            ragContext += '\n=== RELATED USER STORIES ===\n'
            similarStories.forEach((story: any, index) => {
              ragContext += `Story ${index + 1}: ${getDisplayIdentifier(story, 'user_story')}\n`
              ragContext += `Description: ${(story.description || 'No description').substring(0, 200)}...\n`
              ragContext += `Priority: ${story.priority || 'Unknown'}\n`
              ragContext += `Status: ${story.status || 'Unknown'}\n`
              ragContext += '---\n'
            })
          }

          if (relatedTestCases.length > 0) {
            ragContext += '\n=== RELATED TEST CASES ===\n'
            relatedTestCases.forEach((testCase: any, index) => {
              ragContext += `Test ${index + 1}: ${getDisplayIdentifier(testCase, 'test_case')}\n`
              ragContext += `Steps: ${(testCase.steps || 'No steps').substring(0, 150)}...\n`
              ragContext += `Expected Results: ${(testCase.expectedResults || 'No expected results').substring(0, 150)}...\n`
              ragContext += '---\n'
            })
          }

          if (relatedDocs.length > 0) {
            ragContext += '\n=== TECHNICAL DOCUMENTATION ===\n'
            relatedDocs.forEach((doc: any, index) => {
              ragContext += `Document ${index + 1}: ${getDisplayIdentifier(doc, 'document')}\n`
              ragContext += `Content: ${(doc.content || 'No content').substring(0, 300)}...\n`
              ragContext += `Type: ${doc.type || 'Unknown'}\n`
              ragContext += '---\n'
            })
          }
        }

        console.log(`📋 Fallback RAG context built with ${ragContext.length} characters`)
        
      } catch (fallbackError) {
        console.error('💥 Even fallback search failed:', fallbackError)
        ragContext = '\n**No related context found** - This is a standalone analysis.\n'
      }
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
      // Look for the actual score in format "**Score: X/10**" or "Score: X/10"
      const scoreMatch = analysis.match(/\*?\*?Score:\s*(\d+(?:\.\d+)?)(?:\/10)?\*?\*?/i)
      if (scoreMatch) {
        structuredResult.qualityScore = parseFloat(scoreMatch[1])
        console.log('🐛 DEBUG - Score Parsing:', {
          rawAnalysis: analysis.substring(0, 500),
          scoreMatch: scoreMatch,
          parsedScore: structuredResult.qualityScore
        });
      } else {
        console.warn('⚠️ No quality score found in analysis text');
        console.warn('🔍 Analysis preview:', analysis.substring(0, 200));
        structuredResult.qualityScore = 0;
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
      ...structuredResult,
      qualityScore: structuredResult.qualityScore,
      userStory: {
        id: userStory.id,
        title: userStory.title,
        description: userStory.description,
        acceptanceCriteria: userStory.acceptanceCriteria,
      },
      ragContextUsed: ragContext.length > 0,
      ragContextLines: ragContext.split('\n').length,
      ragSuggestions: structuredResult.ragSuggestions,
      analysis: analysis,
      _debug: {
        parsedQualityScore: structuredResult.qualityScore,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('💥 Error analyzing requirements:', error)
    
    // Ensure we always return JSON, even on errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = error instanceof Error ? error.stack : 'No stack trace available'
    
    console.error('💥 Error details:', {
      message: errorMessage,
      stack: errorDetails,
      userStoryId: requestBody?.userStoryId || 'unknown'
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze requirements',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
} 