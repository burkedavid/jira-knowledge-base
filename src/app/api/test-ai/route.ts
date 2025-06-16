import { NextRequest, NextResponse } from 'next/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing AWS Bedrock connection...')
    
    // Environment check
    console.log('🔧 Environment variables:')
    console.log('  - AWS_REGION:', process.env.AWS_REGION || 'NOT SET')
    console.log('  - AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET')
    console.log('  - AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET')

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json({
        success: false,
        error: 'AWS credentials not configured',
        details: {
          region: process.env.AWS_REGION || 'NOT SET',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'
        }
      }, { status: 500 })
    }

    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 50,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please respond with exactly: TEST SUCCESS"
            }
          ]
        }
      ]
    }

    console.log('📡 Sending test request to Bedrock...')
    const command = new InvokeModelCommand({
      modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    })

    const response = await client.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    console.log('✅ Bedrock test successful')
    
    return NextResponse.json({
      success: true,
      message: 'AWS Bedrock connection successful',
      response: responseBody.content[0]?.text || 'No text in response',
      modelUsed: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      region: process.env.AWS_REGION || 'us-east-1'
    })

  } catch (error) {
    console.error('💥 Bedrock test failed:', error)
    
    const errorDetails: any = {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    }

    if (error && typeof error === 'object' && 'name' in error) {
      const awsError = error as any
      errorDetails.awsErrorName = awsError.name
      errorDetails.awsErrorCode = awsError.code
      errorDetails.httpStatusCode = awsError.$metadata?.httpStatusCode
      errorDetails.requestId = awsError.$metadata?.requestId
    }

    return NextResponse.json({
      success: false,
      error: 'AWS Bedrock connection failed',
      details: errorDetails
    }, { status: 500 })
  }
} 