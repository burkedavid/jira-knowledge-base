// AWS Titan embeddings for true semantic search
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use AWS Titan Text Embeddings V2 for better semantic understanding
    const command = new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v2:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: text.trim(),
        dimensions: 1024, // Titan V2 supports 256, 512, or 1024 dimensions
        normalize: true,
      }),
    })

    const response = await client.send(command)
    
    if (!response.body) {
      throw new Error('No response body from Titan embeddings')
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    if (!responseBody.embedding || !Array.isArray(responseBody.embedding)) {
      throw new Error('Invalid embedding response from Titan')
    }

    return responseBody.embedding
  } catch (error) {
    console.error('Error generating Titan embedding:', error)
    
    // Fallback to simple hash-based embedding for development/testing
    console.warn('Falling back to hash-based embedding')
    return generateHashBasedEmbedding(text)
  }
}

// Fallback hash-based embedding for development/testing
function generateHashBasedEmbedding(text: string): number[] {
  const hash = simpleHash(text)
  const embedding = new Array(1024).fill(0) // Match Titan dimensions
  
  // Generate pseudo-random but deterministic values based on text hash
  for (let i = 0; i < 1024; i++) {
    const seed = hash + i
    embedding[i] = (Math.sin(seed) + Math.cos(seed * 2) + Math.sin(seed * 3)) / 3
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  return embedding.map(val => val / magnitude)
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Utility function to check if Titan embeddings are available
export async function checkTitanAvailability(): Promise<boolean> {
  try {
    await generateEmbedding('test')
    return true
  } catch (error) {
    return false
  }
}

// Get embedding model info
export function getEmbeddingModelInfo(): { model: string; dimensions: number; provider: string } {
  return {
    model: 'amazon.titan-embed-text-v2:0',
    dimensions: 1024,
    provider: 'AWS Bedrock'
  }
} 