import { getBedrockClient } from './aws-bedrock'

// Main Claude integration functions for the platform
export async function generateTestCases(
  userStory: string,
  acceptanceCriteria: string,
  defectPatterns: string[] = [],
  testTypes: string[] = ['positive', 'negative', 'edge'],
  modelId?: string
): Promise<string> {
  try {
    const bedrockClient = getBedrockClient()
    return await bedrockClient.generateTestCases(userStory, acceptanceCriteria, defectPatterns, testTypes, modelId)
  } catch (error) {
    console.error('Error generating test cases:', error)
    throw new Error('Failed to generate test cases')
  }
}

export async function analyzeRequirements(
  userStory: string,
  acceptanceCriteria: string,
  ragContext: string = ''
): Promise<string> {
  try {
    const bedrockClient = getBedrockClient()
    return await bedrockClient.analyzeRequirements(userStory, acceptanceCriteria, ragContext)
  } catch (error) {
    console.error('Error analyzing requirements:', error)
    throw new Error('Failed to analyze requirements')
  }
}

export async function analyzeDefectPatterns(
  defects: Array<{
    summary: string
    description: string
    component?: string
    severity?: string
  }>
): Promise<string> {
  try {
    const bedrockClient = getBedrockClient()
    return await bedrockClient.analyzeDefectPatterns(defects)
  } catch (error) {
    console.error('Error analyzing defect patterns:', error)
    throw new Error('Failed to analyze defect patterns')
  }
}

export async function generateKnowledgeInsights(
  query: string,
  context: string[]
): Promise<string> {
  try {
    const bedrockClient = getBedrockClient()
    return await bedrockClient.generateKnowledgeInsights(query, context)
  } catch (error) {
    console.error('Error generating knowledge insights:', error)
    throw new Error('Failed to generate insights')
  }
}

export async function assessRisk(
  userStory: string,
  historicalData: {
    similarDefects: string[]
    componentRisk: string
    complexityFactors: string[]
  }
): Promise<string> {
  try {
    const bedrockClient = getBedrockClient()
    return await bedrockClient.assessRisk(userStory, historicalData)
  } catch (error) {
    console.error('Error assessing risk:', error)
    throw new Error('Failed to assess risk')
  }
}

export async function generateChatCompletion(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: {
    maxTokens?: number
    temperature?: number
  }
): Promise<string> {
  try {
    const bedrockClient = getBedrockClient()
    return await bedrockClient.generateText(messages, options)
  } catch (error) {
    console.error('Error generating chat completion:', error)
    throw new Error('Failed to generate chat completion')
  }
} 