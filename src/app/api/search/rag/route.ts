import { NextRequest, NextResponse } from 'next/server'
import { vectorSearch } from '@/lib/vector-db'
import { generateTextWithClaude } from '@/lib/aws-bedrock'

interface RAGSearchRequest {
  query: string
  maxResults?: number
  includeTypes?: string[]
  threshold?: number
}

interface SearchResult {
  id: string
  type: string
  title: string
  content: string
  similarity: number
  metadata?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: RAGSearchRequest = await request.json()
    const { query, maxResults = 10, includeTypes = [], threshold = 0.1 } = body // Much lower threshold

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    console.log('🔍 RAG Search Query:', query)
    console.log('🎯 Search threshold:', threshold)
    console.log('📊 Include types:', includeTypes.length > 0 ? includeTypes : 'ALL TYPES')

    // Step 1: Perform semantic search to find relevant content
    // Search ALL content types if none specified
    const searchResults = await vectorSearch(
      query,
      includeTypes.length > 0 ? includeTypes as any : undefined, // undefined = search all types
      maxResults * 3, // Get even more results for better context
      threshold
    )

    console.log('📈 Found search results:', searchResults.length)
    
    if (searchResults.length > 0) {
      console.log('🏆 Top 3 results:')
      searchResults.slice(0, 3).forEach((result, index) => {
        console.log(`  ${index + 1}. Type: ${result.sourceType}, Similarity: ${result.similarity.toFixed(3)}`)
        console.log(`     Content: ${result.content.substring(0, 100)}...`)
      })
    } else {
      console.log('❌ No results found with threshold', threshold)
      
      // Try with an extremely low threshold to see if we can find anything
      console.log('🔄 Trying with threshold 0.01...')
      const fallbackResults = await vectorSearch(
        query,
        undefined, // Search ALL types
        20, // More results
        0.01 // Very low threshold
      )
      
      console.log('📈 Fallback results:', fallbackResults.length)
      
      if (fallbackResults.length > 0) {
        console.log('🏆 Fallback top 3 results:')
        fallbackResults.slice(0, 3).forEach((result, index) => {
          console.log(`  ${index + 1}. Type: ${result.sourceType}, Similarity: ${result.similarity.toFixed(3)}`)
          console.log(`     Content: ${result.content.substring(0, 100)}...`)
        })
        searchResults.push(...fallbackResults)
      }
    }

    if (searchResults.length === 0) {
      return NextResponse.json({
        answer: `I couldn't find any relevant information in your knowledge base for "${query}". This could mean:

1. The content doesn't exist in your imported data
2. The search terms don't match the embedded content
3. The content exists but wasn't properly embedded

Your knowledge base contains:
- User Stories
- Defects  
- Documents
- Document Sections

Try rephrasing your question or using different keywords. For example, instead of "Activities", try searching for specific features, processes, or functionality names that might be in your imported data.`,
        sources: [],
        confidence: 0.0,
        debug: {
          searchAttempted: true,
          threshold: threshold,
          fallbackThreshold: 0.01,
          totalEmbeddings: 'Check /api/embeddings/stats'
        }
      })
    }

    // Step 2: Prepare context for Claude with more detail
    const contextSections = searchResults.slice(0, maxResults).map((result, index) => {
      return `[Source ${index + 1}: ${result.sourceType.toUpperCase()} - ID: ${result.sourceId} - Similarity: ${result.similarity.toFixed(3)}]
${result.content}
---`
    }).join('\n\n')

    // Step 3: Create a comprehensive prompt for Claude
    const prompt = `You are an AI assistant helping users understand their comprehensive knowledge base. You have access to information from multiple sources including user stories, defects, documents, and test cases.

User Question: "${query}"

Context from Knowledge Base (${searchResults.length} sources found):
${contextSections}

Instructions:
1. Provide a comprehensive answer based on ALL the context provided from different source types
2. If the question is about "Activities" or any specific topic, explain what they are based on the available information
3. Draw connections between different types of sources (user stories, defects, documents)
4. Reference specific sources when relevant (e.g., "According to User Story X..." or "As mentioned in Defect Y...")
5. If the context doesn't fully answer the question, acknowledge what information IS available and suggest related topics
6. Organize your response clearly with sections if appropriate
7. Be specific and detailed, synthesizing information from multiple sources
8. If you see patterns across multiple sources, highlight them

Please provide a comprehensive, helpful response that gives the user a full picture from their knowledge base:`

    // Step 4: Get response from Claude
    console.log('🤖 Sending query to Claude 4 with', searchResults.length, 'sources...')
    const claudeResponse = await generateTextWithClaude([
      { role: 'user', content: prompt }
    ], {
      maxTokens: 1500, // More tokens for comprehensive responses
      temperature: 0.2 // Lower temperature for more focused responses
    })

    console.log('✅ Claude response received')

    // Step 5: Calculate confidence based on search results quality
    const avgSimilarity = searchResults.length > 0 
      ? searchResults.reduce((sum, result) => sum + result.similarity, 0) / searchResults.length
      : 0

    const confidence = Math.min(avgSimilarity * 1.5, 1.0) // Boost confidence, cap at 1.0

    // Step 6: Format sources for response with more detail
    const sources: SearchResult[] = searchResults.slice(0, maxResults).map(result => ({
      id: result.sourceId,
      type: result.sourceType,
      title: `${result.sourceType.toUpperCase()}: ${result.sourceId}`,
      content: result.content.substring(0, 300) + (result.content.length > 300 ? '...' : ''),
      similarity: result.similarity
    }))

    return NextResponse.json({
      answer: claudeResponse,
      sources,
      confidence,
      query,
      totalSources: searchResults.length,
      searchDetails: {
        threshold: threshold,
        typesSearched: includeTypes.length > 0 ? includeTypes : 'all',
        avgSimilarity: avgSimilarity
      }
    })

  } catch (error) {
    console.error('💥 RAG search error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process RAG search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    )
  }

  // Simple GET endpoint for basic queries with lower threshold
  try {
    const searchResults = await vectorSearch(query, undefined, 10, 0.1) // Search all types, lower threshold

    const sources: SearchResult[] = searchResults.map(result => ({
      id: result.sourceId,
      type: result.sourceType,
      title: `${result.sourceType.toUpperCase()}: ${result.sourceId}`,
      content: result.content.substring(0, 300) + (result.content.length > 300 ? '...' : ''),
      similarity: result.similarity
    }))

    return NextResponse.json({
      query,
      sources,
      total: searchResults.length
    })

  } catch (error) {
    console.error('Simple RAG search error:', error)
    return NextResponse.json(
      { error: 'Failed to process search' },
      { status: 500 }
    )
  }
} 