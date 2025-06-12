import { NextRequest, NextResponse } from 'next/server'
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock'

export async function GET(request: NextRequest) {
  try {
    // Initialize Bedrock client
    const client = new BedrockClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })

    // List all available foundation models
    const command = new ListFoundationModelsCommand({})
    const response = await client.send(command)

    // Filter for Claude models only
    const claudeModels = response.modelSummaries?.filter((model: any) => 
      model.modelName?.toLowerCase().includes('claude') ||
      model.modelId?.toLowerCase().includes('claude')
    ) || []

    // Sort by model name to get the latest versions first
    claudeModels.sort((a: any, b: any) => {
      const aName = a.modelName || a.modelId || ''
      const bName = b.modelName || b.modelId || ''
      return bName.localeCompare(aName)
    })

    return NextResponse.json({
      success: true,
      totalModels: response.modelSummaries?.length || 0,
      claudeModels: claudeModels.map((model: any) => ({
        modelId: model.modelId,
        modelName: model.modelName,
        providerName: model.providerName,
        inputModalities: model.inputModalities,
        outputModalities: model.outputModalities,
        responseStreamingSupported: model.responseStreamingSupported,
        customizationsSupported: model.customizationsSupported,
        inferenceTypesSupported: model.inferenceTypesSupported
      })),
      recommendedModel: claudeModels[0]?.modelId || null
    })

  } catch (error: any) {
    console.error('Error listing Claude models:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        code: error.name,
        region: process.env.AWS_REGION,
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      }
    }, { status: 500 })
  }
} 