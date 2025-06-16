import { NextRequest, NextResponse } from 'next/server';
import { generateTestCases } from '@/lib/claude';

export async function GET() {
  return NextResponse.json({
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing generateTestCases directly...');
    
    const { userStory, acceptanceCriteria, testTypes, modelId } = await request.json();
    
    console.log('📝 Request parameters:');
    console.log('  - userStory:', userStory);
    console.log('  - acceptanceCriteria:', acceptanceCriteria);
    console.log('  - testTypes:', testTypes);
    console.log('  - modelId:', modelId);
    
    // Use simple test data if not provided
    const testUserStory = userStory || 'As a user, I want to log in to the system so that I can access my account';
    const testAcceptanceCriteria = acceptanceCriteria || 'Given valid credentials, when I log in, then I should be authenticated';
    const testTestTypes = testTypes || ['positive'];
    const testModelId = modelId || 'us.anthropic.claude-sonnet-4-20250514-v1:0';
    
    console.log('🤖 Calling generateTestCases with test data...');
    
    const result = await generateTestCases(
      testUserStory,
      testAcceptanceCriteria,
      [], // No defect patterns
      testTestTypes,
      testModelId
    );
    
    console.log('✅ generateTestCases result length:', result.length);
    console.log('✅ generateTestCases result preview:', result.substring(0, 200));
    
    return NextResponse.json({
      success: true,
      result: result,
      metadata: {
        userStory: testUserStory,
        acceptanceCriteria: testAcceptanceCriteria,
        testTypes: testTestTypes,
        modelId: testModelId,
        resultLength: result.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('💥 generateTestCases error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 