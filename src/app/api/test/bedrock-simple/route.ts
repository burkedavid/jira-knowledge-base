import { NextRequest, NextResponse } from 'next/server';
import { generateTextWithClaude } from '@/lib/aws-bedrock';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Bedrock simple call...');
    
    const { message, modelId } = await request.json();
    
    console.log('📝 Request:', { message, modelId });
    
    const response = await generateTextWithClaude([
      {
        role: 'user',
        content: message || 'Hello! Please respond with just the word SUCCESS.'
      }
    ], {
      maxTokens: 100,
      temperature: 0.3
    });
    
    console.log('✅ Bedrock response:', response);
    
    return NextResponse.json({
      success: true,
      response: response,
      modelUsed: modelId || 'us.anthropic.claude-sonnet-4-20250514-v1:0'
    });
    
  } catch (error) {
    console.error('💥 Bedrock simple test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 