import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { logAIUsage } from './ai-audit'

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
  id: string
  model: string
  role: 'assistant'
  stop_reason: string
  stop_sequence: null
  type: 'message'
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

export class BedrockClient {
  private client: BedrockRuntimeClient

  constructor() {
    console.log('🔧 Initializing BedrockClient with:')
    console.log('  - AWS_REGION:', process.env.AWS_REGION || 'us-east-1')
    console.log('  - AWS_ACCESS_KEY_ID exists:', !!process.env.AWS_ACCESS_KEY_ID)
    console.log('  - AWS_SECRET_ACCESS_KEY exists:', !!process.env.AWS_SECRET_ACCESS_KEY)
    
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
    console.log('✅ BedrockRuntimeClient initialized')
  }

  async generateText(
    messages: ClaudeMessage[],
    options: {
      maxTokens?: number
      temperature?: number
      topP?: number
      topK?: number
      stopSequences?: string[]
      modelId?: string
      promptType?: string
      promptName?: string
      endpoint?: string
    } = {}
  ): Promise<string> {
    const {
      maxTokens = 4000,
      temperature = 1,
      topP = 0.999,
      topK = 250,
      stopSequences = [],
      modelId = 'us.anthropic.claude-sonnet-4-20250514-v1:0', // Default to Claude Sonnet 4 with US region prefix
      promptType = 'general',
      promptName = 'AI Text Generation',
      endpoint = '/api/bedrock/generate'
    } = options

    const startTime = Date.now()
    let success = false
    let errorMessage: string | undefined
    let responseBody: ClaudeResponse | undefined

    try {
      console.log('🚀 Starting Bedrock API call with detailed config:')
      console.log('  📋 Parameters:')
      console.log('    - modelId:', modelId)
      console.log('    - maxTokens:', maxTokens)
      console.log('    - temperature:', temperature)
      console.log('    - topP:', topP)
      console.log('    - topK:', topK)
      console.log('    - stopSequences:', stopSequences)
      console.log('    - messagesCount:', messages.length)
      console.log('    - region:', process.env.AWS_REGION || 'us-east-1')
      
      console.log('  📝 Input messages:')
      messages.forEach((msg, index) => {
        console.log(`    Message ${index + 1}:`)
        console.log(`      - role: ${msg.role}`)
        console.log(`      - content length: ${msg.content.length} chars`)
        console.log(`      - content preview: ${msg.content.substring(0, 100)}...`)
      })

      // Convert messages to the correct format with content array
      const formattedMessages = messages.map((msg, index) => {
        const formatted = {
          role: msg.role,
          content: [
            {
              type: "text",
              text: msg.content
            }
          ]
        }
        console.log(`  🔄 Formatted message ${index + 1}:`, JSON.stringify(formatted, null, 2))
        return formatted
      })

      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: maxTokens,
        top_k: topK,
        stop_sequences: stopSequences,
        temperature,
        top_p: topP,
        messages: formattedMessages,
      }

      console.log('📦 Complete request payload:')
      console.log(JSON.stringify(payload, null, 2))

      const commandParams = {
        modelId: modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      }

      console.log('🎯 InvokeModelCommand parameters:')
      console.log('  - modelId:', commandParams.modelId)
      console.log('  - contentType:', commandParams.contentType)
      console.log('  - accept:', commandParams.accept)
      console.log('  - body length:', commandParams.body.length, 'chars')

      const command = new InvokeModelCommand(commandParams)

      console.log('📡 Sending command to Bedrock...')
      console.log('  - Command type:', command.constructor.name)
      console.log('  - Client region:', this.client.config.region)
      
      const response = await this.client.send(command)
      console.log('✅ Received response from Bedrock')
      console.log('  - Response metadata:', response.$metadata)
      
      if (!response.body) {
        console.error('❌ No response body from Bedrock')
        console.error('  - Full response:', response)
        throw new Error('No response body from Bedrock')
      }

      console.log('📄 Processing response body...')
      console.log('  - Body type:', typeof response.body)
      console.log('  - Body constructor:', response.body.constructor.name)

      const responseText = new TextDecoder().decode(response.body)
      console.log('📄 Raw Bedrock response:')
      console.log('  - Length:', responseText.length, 'chars')
      console.log('  - Content:', responseText)
      
      try {
        responseBody = JSON.parse(responseText) as ClaudeResponse
        console.log('✅ Successfully parsed JSON response')
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError)
        console.error('  - Parse error type:', parseError instanceof Error ? parseError.constructor.name : typeof parseError)
        console.error('  - Parse error message:', parseError instanceof Error ? parseError.message : parseError)
        console.error('  - Raw response text:', responseText)
        throw new Error(`Failed to parse response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`)
      }
      
      console.log('🔍 Parsed response body structure:')
      console.log('  - Type:', responseBody.type)
      console.log('  - Role:', responseBody.role)
      console.log('  - Model:', responseBody.model)
      console.log('  - Stop reason:', responseBody.stop_reason)
      console.log('  - Content array length:', responseBody.content?.length)
      console.log('  - Full parsed response:', JSON.stringify(responseBody, null, 2))
      
      if (!responseBody.content || responseBody.content.length === 0) {
        console.error('❌ No content in response:', responseBody)
        throw new Error('No content in response')
      }

      console.log('🔍 Content validation:')
      console.log('  - Content[0] exists:', !!responseBody.content[0])
      console.log('  - Content[0] type:', responseBody.content[0]?.type)
      console.log('  - Content[0] text exists:', !!responseBody.content[0]?.text)

      if (!responseBody.content[0] || !responseBody.content[0].text) {
        console.error('❌ Invalid content structure in response:', responseBody.content)
        throw new Error('Invalid content structure in response')
      }

      const extractedText = responseBody.content[0].text
      console.log('🎉 Successfully extracted text from response')
      console.log('  - Text length:', extractedText.length, 'chars')
      console.log('  - Text preview:', extractedText.substring(0, 200) + '...')
      
      success = true
      return extractedText
    } catch (error) {
      console.error('💥 DETAILED ERROR ANALYSIS:')
      console.error('  - Error occurred in generateText method')
      console.error('  - Model ID attempted:', modelId)
      console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error)
      
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('  📋 Error Details:')
        console.error('    - Name:', error.name)
        console.error('    - Message:', error.message)
        console.error('    - Stack:', error.stack)
      }
      
      // Check for specific AWS errors and provide helpful messages
      if (error && typeof error === 'object' && 'name' in error) {
        const awsError = error as any
        console.error('  🔍 AWS Error Analysis:')
        console.error('    - AWS Error Name:', awsError.name)
        console.error('    - AWS Error Message:', awsError.message)
        console.error('    - AWS Error Code:', awsError.code)
        console.error('    - HTTP Status Code:', awsError.$metadata?.httpStatusCode)
        console.error('    - Request ID:', awsError.$metadata?.requestId)
        console.error('    - Full AWS Error Object:', JSON.stringify(awsError, null, 2))

        // Provide specific guidance based on error type
        if (awsError.name === 'AccessDeniedException') {
          const errorMsg = `AWS Bedrock Model Access Required: You need to enable access to the Claude model "${modelId}" in the AWS Bedrock console. Go to AWS Console > Bedrock > Model Access and request access to Anthropic models.`
          console.error('  🚨 SOLUTION:', errorMsg)
          throw new Error(errorMsg)
        } else if (awsError.name === 'ValidationException' && awsError.message?.includes('inference profile')) {
          const errorMsg = `AWS Bedrock Inference Profile Required: The model "${modelId}" requires an inference profile. Claude 4 and newer models don't support on-demand throughput. Please use Claude 3 models or set up an inference profile in AWS Bedrock.`
          console.error('  🚨 SOLUTION:', errorMsg)
          throw new Error(errorMsg)
        }
      }
      
      throw new Error(`Bedrock API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Log AI usage for audit
      const duration = Date.now() - startTime
      
      // Get actual token usage from response if available
      const inputTokens = responseBody?.usage?.input_tokens || 0
      const outputTokens = responseBody?.usage?.output_tokens || 0
      
      if (inputTokens > 0 || outputTokens > 0) {
        await logAIUsage({
          promptType,
          promptName,
          endpoint,
          model: 'Claude Sonnet 4',
          metrics: {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            duration
          },
          success,
          errorMessage,
          requestData: { modelId, maxTokens, temperature },
          responseData: success ? { textLength: responseBody?.content?.[0]?.text?.length } : undefined
        }).catch(err => console.warn('Failed to log AI usage:', err))
      }
    }
  }

  async generateTestCases(
    userStory: string,
    acceptanceCriteria: string,
    defectPatterns: string[] = [],
    testTypes: string[] = ['positive', 'negative', 'edge'],
    modelId?: string,
    testTypeCounts?: { [key: string]: number }
  ): Promise<string> {
    const defectContext = defectPatterns.length > 0 
      ? `\n\n=== HISTORICAL DEFECT PATTERNS & RAG CONTEXT ===\n${defectPatterns.join('\n')}`
      : ''

    // Build test type sections
    const testTypeSections = []
    if (testTypes.includes('positive')) {
      testTypeSections.push('## POSITIVE TEST CASES\nTest cases that verify the system works correctly under normal conditions.')
    }
    if (testTypes.includes('negative')) {
      testTypeSections.push('## NEGATIVE TEST CASES\nTest cases that verify proper error handling and system behavior under invalid conditions.')
    }
    if (testTypes.includes('edge')) {
      testTypeSections.push('## EDGE CASES\nTest cases that verify system behavior at boundary conditions and unusual scenarios.')
    }

    // Use shorter prompt for single test types (streaming mode) or when context is large
    const isStreamingMode = testTypes.length === 1
    const contextSize = defectContext.length + userStory.length + acceptanceCriteria.length
    const useShortPrompt = isStreamingMode || contextSize > 3000

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: useShortPrompt ? 
          // SHORT PROMPT for faster generation
          `Generate ${testTypes.join(', ')} test cases for this user story:

**User Story:** ${userStory}
**Acceptance Criteria:** ${acceptanceCriteria}${defectContext}

CRITICAL: Use this EXACT format with section headers:

${testTypeSections.join('\n\n')}

For each test case, use this format:
### TC-001: [Title]
**Priority:** [High/Medium/Low]
**Test Steps:**
1. [Step 1]
2. [Step 2]
**Expected Results:**
- [Result 1]
---

Generate ${testTypeCounts && testTypes.length === 1 ? testTypeCounts[testTypes[0]] || 2 : '3-4'} focused test cases. Be concise but thorough.` :
          // FULL PROMPT for comprehensive generation
          `Generate comprehensive test cases for the following user story using the EXACT format specified below:

**User Story:**
${userStory}

**Acceptance Criteria:**
${acceptanceCriteria}

**Test Types to Include:** ${testTypes.join(', ')}${defectContext}

CRITICAL: You MUST follow this EXACT format structure for proper parsing:

# Generated Test Cases for User Story

${testTypeSections.join('\n\n')}

For EACH test case, use this EXACT format:

### TC-001: [Test Case Title]
**Priority:** [High/Medium/Low]
**Preconditions:**
- [Precondition 1]
- [Precondition 2]

**Test Steps:**
1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]

**Expected Results:**
- [Expected result 1]
- [Expected result 2]

**Test Data:**
- [Test data if applicable]

**Notes:**
- [Additional notes if applicable]

---

REQUIREMENTS:
1. Generate ${testTypeCounts ? Object.entries(testTypeCounts).map(([type, count]) => testTypes.includes(type) ? `${count} test cases for ${type}` : '').filter(Boolean).join(', ') || '3-5 test cases per test type section' : '3-5 test cases per test type section'}
2. Use sequential TC numbers (TC-001, TC-002, etc.)
3. Include realistic test steps based on the user story
4. Consider field usage scenarios and real-world conditions
5. Include appropriate test data examples
6. Set realistic priority levels (High for critical paths, Medium for standard flows, Low for edge cases)
7. Use the exact markdown formatting shown above
8. Separate each test case with "---"
9. Include preconditions that reflect real system states
10. Make expected results specific and measurable

Focus on practical, executable test cases that cover all acceptance criteria and consider the industry context provided.`
      }
    ]

    return this.generateText(messages, { 
      maxTokens: useShortPrompt ? 2000 : 4000, // Shorter response for streaming
      temperature: 0.3, 
      modelId,
      promptType: 'test-case-generation',
      promptName: 'Test Case Generation',
      endpoint: '/api/generate/test-cases'
    })
  }

  async analyzeRequirements(
    userStory: string,
    acceptanceCriteria: string,
    ragContext: string = ''
  ): Promise<string> {
    const contextSection = ragContext.length > 0
      ? `\n\n${ragContext}`
      : ''

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `You are an expert Business Analyst and Requirements Engineer. Analyze this user story using professional quality assessment frameworks and provide a comprehensive quality score with detailed improvement recommendations.

**USER STORY TO ANALYZE:**
${userStory}

**ACCEPTANCE CRITERIA:**
${acceptanceCriteria}${contextSection}

**ANALYSIS FRAMEWORK:**
Use the INVEST criteria as your primary evaluation framework:
- **I**ndependent: Can be developed independently (25% weight)
- **N**egotiable: Flexible, allows for discussion (10% weight)  
- **V**aluable: Delivers clear business value (20% weight)
- **E**stimable: Can be estimated for effort (15% weight)
- **S**mall: Right-sized for a sprint (10% weight)
- **T**estable: Has clear acceptance criteria (20% weight)

**SCORING GUIDELINES:**
- **8-10 points**: Excellent - High-quality, ready for development
- **6-7.9 points**: Good - Minor improvements needed
- **4-5.9 points**: Needs Work - Significant issues, requires rework
- **1-3.9 points**: Poor - Major quality issues, complete rewrite needed
- **0 points**: Critical - Unusable, missing essential elements

## REQUIRED ANALYSIS SECTIONS:

### 1. **Score: X/10** (Must be clearly stated as "Score: X/10")

Provide your overall quality assessment with detailed justification covering:
- **Clarity Assessment** (25%): How well-written and understandable is the story?
- **Completeness Analysis** (25%): Are all necessary elements present?
- **Testability Evaluation** (20%): Are acceptance criteria clear and measurable?
- **Business Value Assessment** (15%): Is the benefit to users/business clear?
- **Feasibility Review** (10%): Is the story realistic and achievable?
- **Independence Check** (5%): Can this be developed without dependencies?

### 2. **Strengths** 
Identify what's working well in this user story:
- Well-defined elements that meet INVEST criteria
- Clear business value propositions
- Specific and measurable acceptance criteria
- Appropriate scope and sizing

### 3. **Areas for Improvement**
Provide specific, actionable recommendations:
- Missing INVEST criteria elements
- Vague or ambiguous language that needs clarification
- Acceptance criteria that are too broad or unmeasurable
- Missing stakeholder perspectives or edge cases
- Scope issues (too large/small for a sprint)

### 4. **Missing Elements**
Identify critical components that should be added:
- Essential acceptance criteria
- Non-functional requirements (performance, security, accessibility)
- Error handling and edge case scenarios
- Integration requirements with existing systems
- User experience considerations

### 5. **Risk Assessment**
Evaluate potential risks based on story quality:
- **High Risk**: Unclear requirements leading to rework
- **Medium Risk**: Missing edge cases causing defects
- **Low Risk**: Minor clarifications needed
- **Technical Risks**: Integration complexities or dependencies
- **Business Risks**: Misaligned expectations or value delivery

### 6. **RAG-Based Insights** ${ragContext ? '(Enhanced with Knowledge Base Context)' : '(No Knowledge Base Context Available)'}

${ragContext ? `Based on the knowledge base context provided above, provide specific insights:

#### **Related Dependencies & Integration Points**
- Existing functionality that connects to this requirement
- Shared components or services that need consideration
- API endpoints or data flows that will be affected

#### **Historical Risk Patterns**
- Similar defects from past implementations in this component
- Known issues that have occurred in related functionality
- Component-specific vulnerabilities or failure patterns

#### **Testing & Quality Considerations**
- Additional testing scenarios based on past experiences
- Edge cases discovered in similar features
- Integration testing requirements with existing systems
- Performance or security considerations from documentation

#### **Implementation Guidance**
- Best practices from existing user stories
- Technical patterns or approaches that have worked well
- Compliance or regulatory requirements from documentation

**CRITICAL**: Base all insights strictly on the provided knowledge base context. Always cite specific sources (e.g., "Based on Defect FL-12345" or "According to User Story FL-67890"). Never invent information not present in the context.` : `No knowledge base context is available for this analysis. The assessment is based solely on the user story content and general best practices.`}

### 7. **Recommended Actions**
Provide a prioritized action plan for the business analyst:

#### **Immediate Actions (Critical - Do First)**
- Most important clarifications needed
- Essential missing elements to add
- Critical acceptance criteria to refine

#### **Short-term Improvements (Important - Do Next)**
- Additional stakeholder input needed
- Non-functional requirements to define
- Edge cases to consider

#### **Long-term Enhancements (Nice to Have)**
- Future considerations for story evolution
- Additional validation or testing approaches
- Documentation or training needs

### 8. **Quality Improvement Checklist**
Provide a specific checklist for improving this story:
- [ ] Specific action item 1
- [ ] Specific action item 2
- [ ] Specific action item 3
- [ ] etc.

**FORMATTING REQUIREMENTS:**
- Use clear section headers with ## markdown
- Include bullet points for easy scanning
- Provide specific, actionable recommendations
- Always include the score in the exact format "Score: X/10"
- Cite knowledge base sources when available
- Focus on practical, implementable improvements`
      }
    ]

    return this.generateText(messages, { 
      maxTokens: 4000, 
      temperature: 0.3,
      promptType: 'requirements-analysis',
      promptName: 'Enhanced Requirements Analysis with INVEST Framework',
      endpoint: '/api/analyze/requirements'
    })
  }

  async refineUserStory(
    originalStoryContent: { title: string; description: string; acceptanceCriteria: string[] },
    selectedSuggestions: string[],
    previousAnalysisFullText: string
  ): Promise<string> {
    const prompt = `
You are an expert Business Analyst tasked with refining a user story based on specific feedback.
Your goal is to rewrite the user story to be clearer, more complete, and of higher quality.

**CONTEXT:**

1.  **Original User Story:**
    *   **Title:** ${originalStoryContent.title}
    *   **Description:** ${originalStoryContent.description}
    *   **Acceptance Criteria:**
        ${(originalStoryContent.acceptanceCriteria || []).map(ac => `- ${ac}`).join('\n')}

2.  **Previous AI Analysis (for context only):**
    ---
    ${previousAnalysisFullText}
    ---

3.  **User-Selected Improvements to Apply:**
    The user has specifically requested that you apply the following improvements:
    ${selectedSuggestions.map(s => `- ${s}`).join('\n')}

**YOUR TASK:**

Rewrite the user story by incorporating the selected improvements. Produce a complete, well-formed user story.

**CRITICAL OUTPUT FORMAT:**

You MUST return your response as a single, valid JSON object. Do NOT include any text, explanations, or markdown formatting before or after the JSON object. The JSON object must have the following structure:

{
  "title": "A new, clear, and concise title for the user story.",
  "description": "A rewritten user story description in the format 'As a [persona], I want [goal], so that [benefit].' This should be a well-articulated paragraph.",
  "acceptanceCriteria": [
    "A clear, specific, and testable acceptance criterion.",
    "Another clear, specific, and testable acceptance criterion.",
    "Ensure all original acceptance criteria are reviewed and improved if necessary, and new ones are added based on the suggestions."
  ],
  "definitionOfDone": [
    "A checklist item for what it means for this story to be complete (e.g., 'Code implemented and peer-reviewed').",
    "Another checklist item (e.g., 'Unit and integration tests passed').",
    "Another checklist item (e.g., 'API documentation updated').",
    "Another checklist item (e.g., 'Product owner has approved the implementation')."
  ]
}

**INSTRUCTIONS:**

1.  **Title:** Create a new title that is concise and value-oriented.
2.  **Description:** Rewrite the description into the standard user story format ("As a... I want... So that...").
3.  **Acceptance Criteria (AC):**
    *   Review and refine the original AC.
    *   Add new AC based directly on the selected improvements.
    *   Ensure each criterion is specific, measurable, and testable.
4.  **Definition of Done (DoD):**
    *   Create a generic but comprehensive DoD checklist. This is a critical part of a complete user story. Include items for development, testing, documentation, and approval.

Do not just list the changes; provide the complete, rewritten user story in the specified JSON format.
`;

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: prompt
      }
    ];

    return this.generateText(messages, { maxTokens: 4000, temperature: 0.5 });
  }

  async analyzeDefectPatterns(
    defects: Array<{
      summary: string
      description: string
      component?: string
      severity?: string
    }>
  ): Promise<string> {
    const defectList = defects.map((defect, index) => 
      `${index + 1}. **${defect.summary}**
   Component: ${defect.component || 'Unknown'}
   Severity: ${defect.severity || 'Unknown'}
   Description: ${defect.description}`
    ).join('\n\n')

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `Analyze the following defects and identify patterns:

${defectList}

Please provide:
1. **Common Patterns** - recurring themes or root causes
2. **Component Analysis** - which components are most affected
3. **Severity Trends** - distribution and patterns in severity
4. **Root Cause Categories** - group defects by likely root causes
5. **Prevention Strategies** - recommendations to prevent similar defects
6. **Testing Focus Areas** - where to concentrate testing efforts

Provide actionable insights for improving quality and preventing future defects.`
      }
    ]

    return this.generateText(messages, { maxTokens: 2500, temperature: 0.5 })
  }

  async generateKnowledgeInsights(
    query: string,
    context: string[]
  ): Promise<string> {
    const contextText = context.join('\n\n---\n\n')

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `Based on the following context from our knowledge base, provide insights for this query:

**Query:** ${query}

**Relevant Context:**
${contextText}

Please provide:
1. **Direct Answer** to the query based on the context
2. **Related Information** that might be helpful
3. **Recommendations** for next steps or actions
4. **Knowledge Gaps** if any information is missing
5. **Best Practices** relevant to the query

Focus on actionable insights and practical recommendations.`
      }
    ]

    return this.generateText(messages, { maxTokens: 2000, temperature: 0.6 })
  }

  async assessRisk(
    userStory: string,
    historicalData: {
      similarDefects: string[]
      componentRisk: string
      complexityFactors: string[]
    }
  ): Promise<string> {
    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `Assess the risk level for implementing this user story:

**User Story:**
${userStory}

**Historical Context:**
- Similar defects: ${historicalData.similarDefects.join(', ')}
- Component risk level: ${historicalData.componentRisk}
- Complexity factors: ${historicalData.complexityFactors.join(', ')}

Please provide:
1. **Risk Level** (Low/Medium/High) with justification
2. **Key Risk Factors** identified
3. **Mitigation Strategies** to reduce risk
4. **Testing Recommendations** based on risk assessment
5. **Monitoring Suggestions** for post-implementation

Provide a comprehensive risk assessment with actionable recommendations.`
      }
    ]

    return this.generateText(messages, { maxTokens: 1500, temperature: 0.4 })
  }
}

// Singleton instance
let bedrockClient: BedrockClient | null = null

export function getBedrockClient(): BedrockClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockClient()
  }
  return bedrockClient
}

export async function generateTextWithClaude(
  messages: ClaudeMessage[],
  options?: {
    maxTokens?: number
    temperature?: number
    topP?: number
    stopSequences?: string[]
  }
): Promise<string> {
  const client = getBedrockClient()
  return client.generateText(messages, options)
} 