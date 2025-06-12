import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding, checkTitanAvailability, getEmbeddingModelInfo, cosineSimilarity } from '@/lib/embeddings'

export async function POST(request: NextRequest) {
  try {
    const { text1, text2 } = await request.json()

    if (!text1) {
      return NextResponse.json(
        { error: 'text1 is required' },
        { status: 400 }
      )
    }

    // Test embedding generation
    const embedding1 = await generateEmbedding(text1)
    let similarity = null
    let embedding2 = null

    if (text2) {
      embedding2 = await generateEmbedding(text2)
      similarity = cosineSimilarity(embedding1, embedding2)
    }

    const modelInfo = getEmbeddingModelInfo()

    return NextResponse.json({
      success: true,
      modelInfo,
      results: {
        text1: {
          text: text1,
          embeddingLength: embedding1.length,
          embeddingPreview: embedding1.slice(0, 5), // First 5 dimensions
        },
        ...(text2 && embedding2 && {
          text2: {
            text: text2,
            embeddingLength: embedding2.length,
            embeddingPreview: embedding2.slice(0, 5),
          },
          similarity: {
            score: similarity,
            interpretation: similarity! > 0.8 ? 'Very Similar' : 
                           similarity! > 0.6 ? 'Similar' : 
                           similarity! > 0.4 ? 'Somewhat Similar' : 'Different'
          }
        })
      }
    })

  } catch (error: any) {
    console.error('Error testing embeddings:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      fallbackUsed: error.message.includes('Falling back')
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAvailable = await checkTitanAvailability()
    const modelInfo = getEmbeddingModelInfo()

    return NextResponse.json({
      available: isAvailable,
      modelInfo,
      testSuggestions: [
        {
          text1: "User wants to login to the system",
          text2: "Authentication and user access",
          expectedSimilarity: "High - both about login/authentication"
        },
        {
          text1: "Payment processing failed",
          text2: "Transaction error occurred", 
          expectedSimilarity: "High - both about payment issues"
        },
        {
          text1: "User interface is slow",
          text2: "Database connection timeout",
          expectedSimilarity: "Medium - both about performance but different causes"
        }
      ]
    })

  } catch (error: any) {
    console.error('Error checking embedding availability:', error)
    return NextResponse.json({
      available: false,
      error: error.message
    }, { status: 500 })
  }
} 