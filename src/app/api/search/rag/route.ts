import { NextRequest, NextResponse } from 'next/server'
import { vectorSearch, SourceType, DateFilter } from '@/lib/vector-db'
import { generateTextWithClaude } from '@/lib/aws-bedrock'
import { prisma } from '@/lib/prisma'
import { promises as fs } from 'fs'
import path from 'path'

// Define interfaces for config and request/response
interface RAGConfig {
  searchTypes: { [key: string]: boolean }
  maxResults: { [key: string]: number }
  similarityThresholds: { [key: string]: number }
  contentLimits: {
    maxItemLength: number
    maxTotalRAGLength: number
    enableSmartTruncation: boolean
  }
  relevanceFiltering: {
    enabled: boolean
    minKeywordMatches: number
    minStoryKeywordMatches: number
    keywordBoostTerms: string[]
  }
  performance: {
    searchTimeout: number
    enableParallelSearch: boolean
    cacheResults: boolean
  }
}

interface RAGSearchRequest {
  query: string
  maxResults?: number // This will be overridden by config
  includeTypes?: string[] // This will be overridden by config
  threshold?: number // This can be an override
  startDate?: string
  endDate?: string
}

interface SearchResult {
  id: string
  type: string
  title: string
  content: string
  similarity: number
  metadata?: any
}

// Helper to load RAG configuration
async function getRagConfig(): Promise<RAGConfig> {
  const configPath = path.join(process.cwd(), 'data', 'rag-config.json')
  try {
    const fileContent = await fs.readFile(configPath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error('Error reading RAG config, using defaults:', error)
    // Return a default configuration if the file is missing or invalid
    return {
      searchTypes: { defects: true, userStories: true, documents: true, testCases: false },
      maxResults: { defects: 3, userStories: 3, documents: 3, testCases: 3 },
      similarityThresholds: { defects: 0.5, userStories: 0.5, documents: 0.5, testCases: 0.5 },
      contentLimits: { maxItemLength: 1500, maxTotalRAGLength: 4000, enableSmartTruncation: true },
      relevanceFiltering: { enabled: false, minKeywordMatches: 1, minStoryKeywordMatches: 2, keywordBoostTerms: [] },
      performance: { searchTimeout: 45, enableParallelSearch: true, cacheResults: false },
    }
  }
}

// Function to get display title for a search result
async function getDisplayTitle(sourceType: string, sourceId: string): Promise<string> {
  let displayTitle = `${sourceType.toUpperCase()}: ${sourceId}`
  try {
    switch (sourceType) {
      case 'user_story':
        const userStory = await prisma.userStory.findUnique({ where: { id: sourceId }, select: { jiraKey: true, title: true } })
        if (userStory) displayTitle = userStory.jiraKey || userStory.title || displayTitle
        break
      case 'defect':
        const defect = await prisma.defect.findUnique({ where: { id: sourceId }, select: { jiraKey: true, title: true } })
        if (defect) displayTitle = defect.jiraKey || defect.title || displayTitle
        break
      case 'test_case':
        const testCase = await prisma.testCase.findUnique({ where: { id: sourceId }, select: { title: true } })
        if (testCase) displayTitle = testCase.title || displayTitle
        break
      case 'document':
        const document = await prisma.document.findUnique({ where: { id: sourceId }, select: { title: true } })
        if (document) displayTitle = document.title || displayTitle
        break
      case 'document_section':
        const section = await prisma.documentSection.findUnique({
          where: { id: sourceId },
          select: { title: true, document: { select: { title: true } } },
        })
        if (section) displayTitle = `${section.document.title} > ${section.title}`
        break
    }
  } catch (error) {
    console.error(`Error fetching entity title for ${sourceType}:${sourceId}:`, error)
  }
  return displayTitle
}


export async function POST(request: NextRequest) {
  try {
    const body: RAGSearchRequest = await request.json();
    const { query, startDate, endDate } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Step 1: Load RAG configuration
    const config = await getRagConfig();
    console.log('🧠 Loaded RAG Config:', config.searchTypes);

    // Step 2: Perform parallel vector searches based on config
    const enabledSearchTypes = Object.keys(config.searchTypes).filter(
      type => config.searchTypes[type]
    );

    const dateFilter: DateFilter | undefined =
      startDate || endDate
        ? {
            fromDate: startDate ? new Date(startDate) : undefined,
            toDate: endDate ? new Date(endDate) : undefined,
          }
        : undefined;

    const searchPromises = enabledSearchTypes.map(type =>
      vectorSearch(
        query,
        [type as SourceType],
        config.maxResults[type] || 3,
        body.threshold || config.similarityThresholds[type] || 0.5,
        dateFilter
      )
    );

    const searchResultsArrays = await Promise.all(searchPromises);
    const combinedResults = searchResultsArrays.flat().sort((a, b) => b.similarity - a.similarity);

    console.log(`📈 Found ${combinedResults.length} total results from [${enabledSearchTypes.join(', ')}]`);

    if (combinedResults.length === 0) {
      return NextResponse.json({
        answer: `I couldn't find any relevant information for "${query}". Please try rephrasing your question or checking the RAG configuration to adjust search thresholds.`,
        sources: [],
      });
    }

    // Step 3: Prepare context for the AI
    let totalLength = 0;
    const contextSections = [];
    for (const result of combinedResults) {
      const truncatedContent = result.content.substring(0, config.contentLimits.maxItemLength);
      if (totalLength + truncatedContent.length > config.contentLimits.maxTotalRAGLength) {
        break;
      }
      const displayTitle = await getDisplayTitle(result.sourceType, result.sourceId);
      contextSections.push(`[Source: ${displayTitle} | Type: ${result.sourceType.toUpperCase()} | Similarity: ${result.similarity.toFixed(3)}]\n${truncatedContent}\n---`);
      totalLength += truncatedContent.length;
    }
    const contextString = contextSections.join('\n\n');

    // Step 4: Create a more robust prompt
    const prompt = `You are an expert AI assistant for a software development team. Your task is to answer questions based on a curated knowledge base and suggest relevant next steps.
      
User Question: "${query}"

Synthesize an answer from the following context. The context is composed of various sources like user stories, defects, and documents.

<context>
${contextString}
</context>

Instructions:
1.  **Synthesize, Don't Just List:** Create a cohesive, well-written answer. Do not simply list the sources.
2.  **Be Direct:** Start with a direct answer to the user's question.
3.  **Cite Sources:** When you use information, refer to the source title (e.g., "According to user story 'PROJ-123'..." or "As mentioned in the document 'API Guide'...").
4.  **Acknowledge Limits:** If the context does not fully answer the question, state what you *can* answer and identify what information is missing. Do not invent information.
5.  **Identify Patterns:** If you see connections or contradictions between sources, point them out.
6.  **Suggest Follow-up Questions:** After your analysis, provide 3-4 relevant follow-up questions that a user might ask next. These questions should explore related topics, dive deeper into mentioned subjects, or clarify ambiguities.

Your final output **MUST** be a single, valid JSON object with two keys:
- "answer": A string containing your full, formatted analysis.
- "followUpQuestions": An array of strings, where each string is a suggested follow-up question.

Example Output Format:
{
  "answer": "Based on the context, the password reset process is initiated by clicking the 'Forgot Password' link...",
  "followUpQuestions": [
    "What are the specific password requirements?",
    "Tell me more about the defect 'Password validation error message unclear'.",
    "Is there a user story for email verification during password reset?"
  ]
}

Provide your expert analysis in the specified JSON format below:`;

    // Step 5: Generate the response from Claude
    console.log(`🤖 Sending query to Claude with ${contextSections.length} sources...`);
    const claudeResponse = await generateTextWithClaude(
      [{ role: 'user', content: prompt }],
      { maxTokens: 2048, temperature: 0.1 } // Increased tokens for JSON
    );
    console.log('✅ Claude response received');

    // Step 6: Parse AI response and format sources
    let answer = '';
    let followUpQuestions: string[] = [];
    try {
      // Find the start and end of the JSON object
      const jsonStart = claudeResponse.indexOf('{');
      const jsonEnd = claudeResponse.lastIndexOf('}') + 1;
      const jsonString = claudeResponse.substring(jsonStart, jsonEnd);
      
      const parsedResponse = JSON.parse(jsonString);
      answer = parsedResponse.answer;
      followUpQuestions = parsedResponse.followUpQuestions || [];
    } catch (e) {
      console.error("Failed to parse Claude's JSON response. Using raw response.", e);
      answer = claudeResponse; // Fallback to raw response
    }

    const sources: SearchResult[] = await Promise.all(
      combinedResults.slice(0, contextSections.length).map(async (result) => ({
        id: result.sourceId,
        type: result.sourceType,
        title: await getDisplayTitle(result.sourceType, result.sourceId),
        content: result.content.substring(0, 300) + (result.content.length > 300 ? '...' : ''),
        similarity: result.similarity,
      }))
    );
    
    const avgSimilarity = sources.length > 0 ? sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length : 0;

    return NextResponse.json({
      answer,
      followUpQuestions,
      sources,
      confidence: Math.min(avgSimilarity * 1.2, 1.0),
      debug: {
        configUsed: config,
        enabledTypes: enabledSearchTypes,
        resultsFound: combinedResults.length,
        resultsUsed: sources.length,
      }
    });

  } catch (error) {
    console.error('💥 RAG search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {
        answer: 'An unexpected error occurred while processing your request. Please check the server logs for details.',
        error: 'RAG Pipeline Failed',
        details: errorMessage,
      },
      { status: 500 }
    );
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

    const sources: SearchResult[] = await Promise.all(
      searchResults.map(async (result) => {
        let displayTitle = `${result.sourceType.toUpperCase()}: ${result.sourceId}`
        
        try {
          // Fetch entity data to get jiraKey and title
          switch (result.sourceType) {
            case 'user_story':
              const userStory = await prisma.userStory.findUnique({
                where: { id: result.sourceId },
                select: { jiraKey: true, title: true }
              })
              if (userStory) {
                displayTitle = userStory.jiraKey || userStory.title || displayTitle
              }
              break
            case 'defect':
              const defect = await prisma.defect.findUnique({
                where: { id: result.sourceId },
                select: { jiraKey: true, title: true }
              })
              if (defect) {
                displayTitle = defect.jiraKey || defect.title || displayTitle
              }
              break
            case 'test_case':
              const testCase = await prisma.testCase.findUnique({
                where: { id: result.sourceId },
                select: { title: true }
              })
              if (testCase) {
                displayTitle = testCase.title || displayTitle
              }
              break
            case 'document':
              const document = await prisma.document.findUnique({
                where: { id: result.sourceId },
                select: { title: true }
              })
              if (document) {
                displayTitle = document.title || displayTitle
              }
              break
          }
        } catch (error) {
          console.error(`Error fetching entity data for ${result.sourceType}:`, error)
          // Keep default title if fetch fails
        }

        return {
          id: result.sourceId,
          type: result.sourceType,
          title: displayTitle,
          content: result.content.substring(0, 300) + (result.content.length > 300 ? '...' : ''),
          similarity: result.similarity
        }
      })
    )

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