import { NextRequest, NextResponse } from 'next/server';
import { generateTestCases } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing new test case format...');
    
    const result = await generateTestCases(
      'As a user, I want to export a list of documents so that I can work with them offline',
      'Given I have selected documents, when I click export, then I should receive a downloadable file with the document list',
      [], // No defect patterns for this test
      ['positive', 'negative', 'edge'],
      'us.anthropic.claude-sonnet-4-20250514-v1:0'
    );
    
    console.log('✅ Test case generation result:');
    console.log('Length:', result.length);
    console.log('Content preview:', result.substring(0, 500));
    console.log('Full content:', result);
    
    return NextResponse.json({
      success: true,
      result: result,
      length: result.length,
      preview: result.substring(0, 500)
    });
    
  } catch (error) {
    console.error('💥 Test case format test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 