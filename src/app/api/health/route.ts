import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      database: 'SQLite',
      vectorEmbeddings: 'AWS Titan Text Embeddings V2',
      llm: 'AWS Bedrock Claude Sonnet 4',
      jiraIntegration: 'Available',
      documentProcessing: 'PDF, DOCX, TXT',
    },
  })
} 