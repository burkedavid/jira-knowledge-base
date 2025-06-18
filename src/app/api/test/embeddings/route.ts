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
    console.log('🔍 Starting embeddings test...')
    
    // Test AWS Titan connection
    let awsConnection = false
    let embeddingTest = null
    let similarityTest: Array<{ text1: string; text2: string; similarity: number }> = []
    let recommendations: string[] = []
    
    try {
      console.log('🔌 Testing AWS Titan connection...')
      const testText = "This is a test for AWS Titan embeddings"
      const startTime = Date.now()
      
      const embedding = await generateEmbedding(testText)
      const processingTime = Date.now() - startTime
      
      awsConnection = true
      embeddingTest = {
        testText,
        dimensions: embedding.length,
        processingTime
      }
      console.log('✅ AWS Titan connection successful')
      
      // Test semantic similarity
      console.log('🧪 Testing semantic similarity...')
      const text1 = "User authentication failed"
      const text2 = "Login system not working"
      const text3 = "Database connection timeout"
      
      const emb1 = await generateEmbedding(text1)
      const emb2 = await generateEmbedding(text2)
      const emb3 = await generateEmbedding(text3)
      
      similarityTest = [
        {
          text1,
          text2,
          similarity: cosineSimilarity(emb1, emb2)
        },
        {
          text1,
          text2: text3,
          similarity: cosineSimilarity(emb1, emb3)
        }
      ]
      
      console.log('✅ Similarity tests completed')
      
    } catch (error: any) {
      console.error('❌ AWS Titan connection failed:', error)
      awsConnection = false
      
      if (error.message.includes('credentials')) {
        recommendations.push('Check AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)')
      }
      if (error.message.includes('region')) {
        recommendations.push('Verify AWS region is set correctly (AWS_REGION)')
      }
      if (error.message.includes('Titan')) {
        recommendations.push('Ensure AWS Titan Text Embeddings V2 is available in your region')
      }
      if (error.message.includes('permissions')) {
        recommendations.push('Verify IAM permissions for Bedrock access')
      }
      if (recommendations.length === 0) {
        recommendations.push('Check network connectivity and AWS service status')
        recommendations.push('Verify all AWS environment variables are set correctly')
      }
    }

    const modelInfo = getEmbeddingModelInfo()

    return NextResponse.json({
      awsConnection,
      embeddingTest,
      similarityTest,
      recommendations,
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
    console.error('Error in embeddings test:', error)
    return NextResponse.json({
      awsConnection: false,
      error: error.message,
      recommendations: [
        'Check AWS credentials and configuration',
        'Verify network connectivity',
        'Ensure AWS Bedrock service is available in your region'
      ]
    }, { status: 500 })
  }
} 