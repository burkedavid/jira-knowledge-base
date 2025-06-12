import { NextRequest, NextResponse } from 'next/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { prisma } from '@/lib/prisma'
import { vectorSearch } from '@/lib/vector-db'
import { logAIUsage } from '@/lib/ai-audit'

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

interface DefectAnalysisRequest {
  defect: {
    id: string
    title: string
    description: string
    stepsToReproduce?: string
    component?: string
    severity?: string
    rootCause?: string
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let success = false
  let errorMessage: string | undefined

  try {
    const { defect }: DefectAnalysisRequest = await request.json()

    if (!defect || !defect.title || !defect.description) {
      return NextResponse.json(
        { error: 'Defect information is required' },
        { status: 400 }
      )
    }

    // Step 1: Gather context using RAG
    const ragContext = await gatherRAGContext(defect)

    // Step 2: Analyze with Claude 4
    const analysis = await analyzeDefectWithClaude(defect, ragContext)

    success = true
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing defect:', error)
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to analyze defect' },
      { status: 500 }
    )
  } finally {
    // Log AI usage for audit
    const duration = Date.now() - startTime
    
    // Estimate token usage (these are rough estimates)
    const inputTokens = 2500 // Estimated based on prompt size
    const outputTokens = 800  // Estimated based on typical response
    
    await logAIUsage({
      promptType: 'defect-analysis',
      promptName: 'Defect Root Cause Analysis',
      endpoint: '/api/analyze/defect-root-cause',
      model: 'Claude Sonnet 4',
      metrics: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        duration
      },
      success,
      errorMessage,
      requestData: { defectId: request.url },
      responseData: success ? { analysisCompleted: true } : undefined
    }).catch(err => console.warn('Failed to log AI usage:', err))
  }
}

async function gatherRAGContext(defect: any) {
  const context = {
    relatedUserStories: [] as any[],
    relatedDocuments: [] as any[],
    similarDefects: [] as any[],
    componentInfo: null as any
  }

  try {
    // Search for related user stories
    const userStoryQueries = [
      `${defect.title} ${defect.component || ''}`,
      `functionality ${defect.component || ''} requirements`,
      defect.description.substring(0, 100)
    ]

    for (const query of userStoryQueries) {
      try {
        const userStoryResults = await vectorSearch(query, ['user_story'], 3)
        if (userStoryResults.length > 0) {
          const storyIds = userStoryResults.map(r => r.sourceId)
          const stories = await prisma.userStory.findMany({
            where: { id: { in: storyIds } },
            select: {
              id: true,
              title: true,
              description: true,
              acceptanceCriteria: true,
              component: true,
              status: true
            }
          })
          context.relatedUserStories.push(...stories)
        }
      } catch (err) {
        console.warn('Error searching user stories:', err)
      }
    }

    // Search for related documentation
    const docQueries = [
      `${defect.component || ''} specification requirements`,
      `${defect.title} documentation`,
      `${defect.component || ''} architecture design`
    ]

    for (const query of docQueries) {
      try {
        const docResults = await vectorSearch(query, ['document', 'document_section'], 3)
        if (docResults.length > 0) {
          const docIds = docResults.map(r => r.sourceId)
          const documents = await prisma.document.findMany({
            where: { id: { in: docIds } },
            select: {
              id: true,
              title: true,
              content: true,
              type: true,
              sections: {
                select: {
                  title: true,
                  content: true
                }
              }
            }
          })
          context.relatedDocuments.push(...documents)
        }
      } catch (err) {
        console.warn('Error searching documents:', err)
      }
    }

    // Find similar defects
    try {
      const similarDefects = await prisma.defect.findMany({
        where: {
          OR: [
            { component: defect.component },
            { 
              title: {
                contains: defect.title.split(' ')[0] // First word of title
              }
            }
          ],
          NOT: { id: defect.id }
        },
        select: {
          id: true,
          title: true,
          description: true,
          rootCause: true,
          resolution: true,
          component: true,
          severity: true
        },
        take: 3
      })
      context.similarDefects = similarDefects
    } catch (err) {
      console.warn('Error finding similar defects:', err)
    }

    // Get component-specific information
    if (defect.component) {
      try {
        const componentDefects = await prisma.defect.findMany({
          where: { component: defect.component },
          select: {
            rootCause: true,
            severity: true
          }
        })
        
        const componentStories = await prisma.userStory.findMany({
          where: { component: defect.component },
          select: {
            title: true,
            description: true,
            status: true
          },
          take: 5
        })

        const rootCauses = componentDefects.map(d => d.rootCause).filter(Boolean)
        const commonRootCauses = Array.from(new Set(rootCauses))

        context.componentInfo = {
          defectCount: componentDefects.length,
          commonRootCauses,
          relatedStories: componentStories
        }
      } catch (err) {
        console.warn('Error gathering component info:', err)
      }
    }

  } catch (error) {
    console.warn('Error gathering RAG context:', error)
  }

  return context
}

async function analyzeDefectWithClaude(defect: any, ragContext: any) {
  const prompt = `You are an expert software quality analyst. Analyze the following defect and provide insights into its root cause using the provided context from user stories, documentation, and similar defects.

DEFECT INFORMATION:
Title: ${defect.title}
Description: ${defect.description}
Component: ${defect.component || 'Not specified'}
Severity: ${defect.severity || 'Not specified'}
Steps to Reproduce: ${defect.stepsToReproduce || 'Not provided'}
Existing Root Cause: ${defect.rootCause || 'Not identified'}

CONTEXT FROM RAG SEARCH:

Related User Stories:
${ragContext.relatedUserStories.map((story: any) => `
- ${story.title}
  Description: ${story.description}
  Acceptance Criteria: ${story.acceptanceCriteria || 'Not specified'}
  Status: ${story.status || 'Unknown'}
`).join('\n')}

Related Documentation:
${ragContext.relatedDocuments.map((doc: any) => `
- ${doc.title} (${doc.type})
  Content: ${doc.content.substring(0, 500)}...
  Sections: ${doc.sections.map((s: any) => s.title).join(', ')}
`).join('\n')}

Similar Defects:
${ragContext.similarDefects.map((similar: any) => `
- ${similar.title}
  Description: ${similar.description}
  Root Cause: ${similar.rootCause || 'Not identified'}
  Resolution: ${similar.resolution || 'Not resolved'}
`).join('\n')}

Component Information:
${ragContext.componentInfo ? `
- Total defects in component: ${ragContext.componentInfo.defectCount}
- Common root causes: ${ragContext.componentInfo.commonRootCauses?.join(', ') || 'None identified'}
- Related stories: ${ragContext.componentInfo.relatedStories?.length || 0} stories found
` : 'No component-specific information available'}

ANALYSIS INSTRUCTIONS:
1. Analyze the defect against the user stories and documentation to identify potential root causes
2. Determine if this defect represents:
   - A gap in requirements (missing user story or acceptance criteria)
   - A misunderstanding of requirements
   - An implementation error despite clear requirements
   - A design flaw or architectural issue
   - An edge case not covered in testing

3. Provide specific insights about:
   - What requirement gaps might have led to this defect
   - Which user stories are most relevant and why
   - What documentation sections are pertinent
   - How similar defects were resolved
   - Actionable prevention recommendations

4. Rate your confidence in the analysis (0-100%)

Respond with a JSON object in this exact format:
{
  "rootCauseAnalysis": "Detailed analysis of why this defect likely occurred, referencing specific user stories and documentation",
  "requirementGaps": ["List of specific requirement gaps or missing specifications that may have contributed"],
  "relatedUserStories": [
    {
      "id": "story_id",
      "title": "Story title",
      "relevance": "Explanation of how this story relates to the defect"
    }
  ],
  "documentationReferences": [
    {
      "title": "Document title",
      "section": "Relevant section",
      "relevance": "How this documentation relates to the defect"
    }
  ],
  "preventionRecommendations": ["Specific actionable recommendations to prevent similar defects"],
  "confidence": 85
}`

  try {
    const command = new InvokeModelCommand({
      modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    const response = await bedrock.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    let analysisText = responseBody.content[0].text
    
    // Extract JSON from the response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      
      // Validate and enhance the response
      return {
        rootCauseAnalysis: analysis.rootCauseAnalysis || 'Unable to determine root cause from available information.',
        requirementGaps: Array.isArray(analysis.requirementGaps) ? analysis.requirementGaps : [],
        relatedUserStories: Array.isArray(analysis.relatedUserStories) ? analysis.relatedUserStories : [],
        documentationReferences: Array.isArray(analysis.documentationReferences) ? analysis.documentationReferences : [],
        preventionRecommendations: Array.isArray(analysis.preventionRecommendations) ? analysis.preventionRecommendations : [],
        confidence: typeof analysis.confidence === 'number' ? Math.min(100, Math.max(0, analysis.confidence)) : 50
      }
    } else {
      throw new Error('Could not parse JSON response from Claude')
    }
  } catch (error) {
    console.error('Error calling Claude:', error)
    
    // Fallback analysis based on available context
    return {
      rootCauseAnalysis: `Based on the available information, this defect in the ${defect.component || 'system'} component appears to be related to ${defect.severity?.toLowerCase() || 'unknown severity'} issues. ${ragContext.similarDefects.length > 0 ? `Similar defects have been found in this component, suggesting a pattern that may need investigation.` : 'This appears to be an isolated issue.'}`,
      requirementGaps: ragContext.relatedUserStories.length === 0 ? ['No related user stories found - this functionality may not be properly specified'] : [],
      relatedUserStories: ragContext.relatedUserStories.slice(0, 3).map((story: any) => ({
        id: story.id,
        title: story.title,
        relevance: 'Found through semantic search - may contain relevant requirements'
      })),
      documentationReferences: ragContext.relatedDocuments.slice(0, 3).map((doc: any) => ({
        title: doc.title,
        section: doc.sections[0]?.title || 'Main content',
        relevance: 'Found through semantic search - may contain relevant specifications'
      })),
      preventionRecommendations: [
        'Review and enhance test coverage for this component',
        'Consider adding more specific acceptance criteria to related user stories',
        'Implement additional validation for edge cases'
      ],
      confidence: 40
    }
  }
} 