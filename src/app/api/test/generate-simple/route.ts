import { NextRequest, NextResponse } from 'next/server';
import { generateTestCases } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing generateTestCases directly...');
    
    const { userStory, acceptanceCriteria, testTypes, modelId } = await request.json();
    
    console.log('📝 Request parameters:');
    console.log('  - userStory:', userStory);
    console.log('  - acceptanceCriteria:', acceptanceCriteria);
    console.log('  - testTypes:', testTypes);
    console.log('  - modelId:', modelId);
    
    const result = await generateTestCases(
      userStory || 'User login functionality',
      acceptanceCriteria || 'User should be able to log in with valid credentials',
      [], // No defect patterns
      testTypes || ['positive'],
      modelId || 'us.anthropic.claude-sonnet-4-20250514-v1:0'
    );
    
    console.log('✅ generateTestCases result:', result);
    
    return NextResponse.json({
      success: true,
      result: result
    });
    
  } catch (error) {
    console.error('💥 generateTestCases error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 