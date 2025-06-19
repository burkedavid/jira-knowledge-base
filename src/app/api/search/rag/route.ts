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
  includeTypes?: string[] // User-selected source types to include
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

    // Step 2: Determine which types to search based on user selection (includeTypes)
    // If includeTypes is provided, use that; otherwise fall back to config
    let enabledSearchTypes: string[];
    
    if (body.includeTypes && body.includeTypes.length > 0) {
      // Map frontend includeTypes to config type names
      const typeMapping: { [key: string]: string } = {
        'user_story': 'userStories',
        'defect': 'defects', 
        'document': 'documents',
        'test_case': 'testCases'
      };
      
      enabledSearchTypes = body.includeTypes
        .map(type => typeMapping[type])
        .filter(type => type !== undefined);
      
      console.log('🎯 Using user-selected types:', body.includeTypes, '→', enabledSearchTypes);
    } else {
      // Fall back to config if no user selection
      enabledSearchTypes = Object.keys(config.searchTypes).filter(
        type => config.searchTypes[type]
      );
      console.log('📋 Using config types:', enabledSearchTypes);
    }

    const dateFilter: DateFilter | undefined =
      startDate || endDate
        ? {
            fromDate: startDate ? new Date(startDate) : undefined,
            toDate: endDate ? new Date(endDate) : undefined,
          }
        : undefined;

    const searchPromises = enabledSearchTypes.map(type => {
      // Map config types to actual source types
      let sourceTypes: SourceType[];
      switch (type) {
        case 'documents':
          // When documents are enabled, search both document and document_section
          sourceTypes = ['document', 'document_section'];
          break;
        case 'defects':
          sourceTypes = ['defect'];
          break;
        case 'userStories':
          sourceTypes = ['user_story'];
          break;
        case 'testCases':
          sourceTypes = ['test_case'];
          break;
        default:
          sourceTypes = [type as SourceType];
      }
      
      return vectorSearch(
        query,
        sourceTypes,
        config.maxResults[type] || 3,
        body.threshold || config.similarityThresholds[type] || 0.5,
        dateFilter
      );
    });

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

    // Step 4: Create a comprehensive, improved prompt
    const prompt = `You are an AI assistant helping users understand their comprehensive knowledge base. You have access to information from multiple sources including user stories, defects, documents, and test cases.

User Question: "${query}"

Context from Knowledge Base (${contextSections.length} sources found):
${contextString}

Instructions:
1. **Provide a comprehensive answer** based on ALL the context provided from different source types
2. **If the question is about "Activities" or any specific topic**, explain what they are based on the available information
3. **Draw connections between different types of sources** (user stories, defects, documents) - show how they relate to each other
4. **Reference specific sources when relevant** (e.g., "According to User Story FL-12345..." or "As mentioned in Defect FL-67890...")
5. **If the context doesn't fully answer the question**, acknowledge what information IS available and suggest related topics
6. **Organize your response clearly** with sections if appropriate (e.g., ## Overview, ## Key Features, ## Known Issues, ## Implementation Details)
7. **Be specific and detailed**, synthesizing information from multiple sources to give a complete picture
8. **If you see patterns across multiple sources**, highlight them (e.g., "Multiple defects indicate issues with...", "Several user stories focus on...")
9. **Include practical insights** - what does this mean for users, developers, or the business?
10. **Provide actionable information** - what can users do with this knowledge?

Your final output **MUST** be a single, valid JSON object with two keys:
- "answer": A string containing your comprehensive, well-organized analysis with clear sections and detailed synthesis
- "followUpQuestions": An array of 3-4 specific, actionable follow-up questions that dive deeper into the topic

Example Output Format:
{
  "answer": "## Overview\\n\\nBased on the comprehensive context from your knowledge base...\\n\\n## Key Features\\n\\n...\\n\\n## Known Issues\\n\\n...\\n\\n## Implementation Status\\n\\n...",
  "followUpQuestions": [
    "What are the specific implementation details for the authentication workflow?",
    "Which defects are currently blocking the user registration feature?",
    "Are there any test cases covering the edge cases mentioned in the user stories?"
  ]
}

Please provide a comprehensive, helpful response that gives the user a full picture from their knowledge base:`;

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