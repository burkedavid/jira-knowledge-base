import { NextRequest, NextResponse } from 'next/server'
import { generateTestCases } from '@/lib/claude'
import { prisma } from '@/lib/prisma'
import { vectorSearch, SourceType } from '@/lib/vector-db'
import fs from 'fs/promises'
import path from 'path'

// Load product context for industry-specific test generation
async function loadProductContext() {
  try {
    const settingsFile = path.join(process.cwd(), 'data', 'product-context.json')
    const data = await fs.readFile(settingsFile, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Return default context if file doesn't exist
    return {
      productName: 'Fusion Live',
      description: 'Idox FusionLive is a secure, cloud‑based engineering document management system (EDMS) and common data environment (CDE) tailored for engineering, construction, and asset‑intensive industries.',
      industry: 'Engineering & Construction',
      userTypes: ['EPCs', 'Owner-operators', 'Contractors', 'Field teams', 'Project managers', 'Engineers'],
      keyFeatures: ['Document management', 'Version control', 'Automated workflows', 'Tag extraction', 'Real-time dashboards', '3D model support', 'Compliance tracking'],
      securityStandards: ['ISO 27001', 'Cloud security', 'Data encryption', 'Access controls']
    }
  }
}

// Generate industry-specific scenarios based on context selection
function getIndustryScenarios(contextType: string) {
  const scenarios: { [key: string]: string[] } = {
    'field-usage': [
      '• Field engineer accessing drawings on tablet during site inspection in poor weather conditions',
      '• Construction worker uploading photos and progress reports from remote construction site',
      '• Site supervisor reviewing and approving work packages while moving between locations',
      '• Quality inspector marking up drawings with non-conformance issues using touch interface',
      '• Field technician accessing equipment manuals and specifications in industrial environment',
      '• Mobile user working with limited battery life and intermittent connectivity',
      '• Contractor accessing latest revision drawings while wearing safety gloves',
      '• Field team collaborating on urgent design changes during construction phase'
    ],
    'compliance': [
      '• Regulatory auditor reviewing complete document history and approval chains',
      '• Quality manager generating compliance reports for ISO certification',
      '• Project manager ensuring all documents meet regulatory submission requirements',
      '• Legal team reviewing document retention and deletion policies',
      '• External auditor verifying document integrity and tamper-proof controls',
      '• Compliance officer tracking document approval workflows and timelines',
      '• Regulatory inspector accessing audit trails for specific document versions',
      '• Quality assurance team validating document control procedures'
    ],
    'integration': [
      '• ERP system automatically syncing project data and document metadata',
      '• CAD software pushing latest drawings and 3D models to document repository',
      '• Project management system linking tasks to relevant documents and deliverables',
      '• Asset management system accessing commissioning and maintenance documents',
      '• Third-party contractor systems accessing shared project documentation',
      '• API integration with client systems for automated document exchange',
      '• Single sign-on integration with corporate identity management systems',
      '• Automated workflow triggers based on external system events'
    ],
    'performance': [
      '• Uploading and processing large 3D models (500MB+) and high-resolution drawings',
      '• Multiple users simultaneously accessing the same large document sets',
      '• Bulk document operations (import/export of thousands of files)',
      '• Real-time collaboration on large documents with multiple concurrent editors',
      '• System performance during peak usage periods (project milestones)',
      '• Document search and indexing performance with large document repositories',
      '• Version comparison and diff operations on large technical drawings',
      '• Backup and recovery operations for large document databases'
    ],
    'collaboration': [
      '• Multiple stakeholders from different organizations collaborating on design reviews',
      '• Cross-functional teams working on shared documents with different permission levels',
      '• International teams collaborating across time zones and languages',
      '• Client and contractor teams sharing documents with controlled access',
      '• Design team collaborating with construction and operations teams',
      '• Real-time document review and markup sessions with distributed teams',
      '• Workflow approvals involving multiple organizations and approval chains',
      '• Document handover between project phases with different team compositions'
    ],
    'security': [
      '• Role-based access control for sensitive project documents and drawings',
      '• Document encryption and secure transmission to external parties',
      '• User authentication and authorization for different security clearance levels',
      '• Audit logging of all document access and modification activities',
      '• Secure document sharing with time-limited access and watermarking',
      '• Data loss prevention and unauthorized download protection',
      '• Multi-factor authentication for high-security project environments',
      '• Secure document disposal and retention policy enforcement'
    ],
    'offline': [
      '• Field teams working in areas with no internet connectivity for extended periods',
      '• Mobile users synchronizing documents when connectivity is restored',
      '• Offline document viewing and markup capabilities on tablets and mobile devices',
      '• Conflict resolution when multiple users modify documents offline',
      '• Cached document access for frequently used drawings and specifications',
      '• Offline search capabilities within downloaded document sets',
      '• Battery optimization for extended offline usage in field conditions',
      '• Automatic sync prioritization based on document importance and usage'
    ],
    'comprehensive': [
      '• Field engineer accessing drawings on tablet during site inspection in challenging conditions',
      '• Regulatory auditor reviewing complete document history and approval chains',
      '• ERP system automatically syncing project data with real-time updates',
      '• Multiple users simultaneously accessing large 3D models and drawings',
      '• Cross-functional teams collaborating on design reviews across organizations',
      '• Role-based access control for sensitive documents with audit trails',
      '• Field teams working offline in remote locations with periodic sync',
      '• Integration with existing enterprise systems and third-party tools',
      '• Performance optimization for large file handling and concurrent users',
      '• Compliance reporting and regulatory submission workflows'
    ]
  }
  
  return scenarios[contextType] || scenarios['comprehensive']
}

// Helper function to perform semantic search and enrich with entity details
async function semanticSearchWithDetails(
  query: string,
  sourceTypes: SourceType[],
  limit: number = 10,
  threshold: number = 0.7
) {
  const searchResults = await vectorSearch(query, sourceTypes, limit, threshold)
  
  // Enrich results with full entity details
  const enrichedResults = await Promise.all(
    searchResults.map(async (result) => {
      let entity = null

      try {
        switch (result.sourceType) {
          case 'user_story':
            entity = await prisma.userStory.findUnique({
              where: { id: result.sourceId }
            })
            break

          case 'defect':
            entity = await prisma.defect.findUnique({
              where: { id: result.sourceId }
            })
            break

          case 'test_case':
            entity = await prisma.testCase.findUnique({
              where: { id: result.sourceId }
            })
            break

          case 'document':
            entity = await prisma.document.findUnique({
              where: { id: result.sourceId }
            })
            break
        }
      } catch (error) {
        console.error(`Error fetching details for ${result.sourceType} ${result.sourceId}:`, error)
      }

      return {
        ...result,
        entity
      }
    })
  )

  return enrichedResults.filter(result => result.entity !== null)
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting test case generation endpoint')
    
    const requestBody = await request.json()
    console.log('📋 Request body received:', JSON.stringify(requestBody, null, 2))
    
    const { 
      userStoryId, 
      userStory: directUserStory, 
      testTypes = ['positive', 'negative', 'edge'],
      industryContext = 'comprehensive',
      industryContexts = [industryContext],
      modelId 
    } = requestBody

    console.log('🔍 Parsed request parameters:')
    console.log('  - userStoryId:', userStoryId)
    console.log('  - directUserStory:', directUserStory)
    console.log('  - testTypes:', testTypes)
    console.log('  - industryContext:', industryContext)
    console.log('  - industryContexts:', industryContexts)
    console.log('  - modelId:', modelId)

    let userStory: any
    let ragContext: string[] = []

    if (userStoryId) {
      console.log('📖 Fetching user story from database with ID:', userStoryId)
      
      // Get user story from database
      userStory = await prisma.userStory.findUnique({
        where: { id: userStoryId },
      })

      console.log('📖 Database user story result:', userStory)

      if (!userStory) {
        console.error('❌ User story not found in database')
        return NextResponse.json(
          { error: 'User story not found' },
          { status: 404 }
        )
      }

      console.log('🔍 User story title analysis:')
      console.log('  - Title exists:', !!userStory.title)
      console.log('  - Title type:', typeof userStory.title)
      console.log('  - Title value:', userStory.title)
      console.log('  - Title length:', userStory.title?.length)

      // Use RAG semantic search to find relevant context
      if (userStory.title && typeof userStory.title === 'string') {
        console.log('🔍 Using RAG semantic search for relevant context...')
        
        // Create search query from user story
        const searchQuery = `${userStory.title} ${userStory.description || ''} ${userStory.component || ''}`.trim()
        console.log('  - Search query:', searchQuery)
        
        try {
          // Search for relevant defects (historical issues)
          const relatedDefects = await semanticSearchWithDetails(
            searchQuery,
            ['defect'],
            5, // limit
            0.3 // threshold - lower for more results
          )
          console.log('🐛 Found related defects via semantic search:', relatedDefects.length)
          
          // Search for related user stories (similar functionality)
          const relatedStories = await semanticSearchWithDetails(
            searchQuery,
            ['user_story'],
            3, // limit
            0.4 // threshold - slightly higher for user stories
          )
          console.log('📖 Found related user stories via semantic search:', relatedStories.length)
          
          // Search for existing test cases (testing patterns)
          const relatedTestCases = await semanticSearchWithDetails(
            searchQuery,
            ['test_case'],
            3, // limit
            0.4 // threshold
          )
          console.log('🧪 Found related test cases via semantic search:', relatedTestCases.length)

          // Search for related documentation (technical context and patterns)
          const relatedDocs = await semanticSearchWithDetails(
            searchQuery,
            ['document'],
            3, // limit
            0.3 // threshold - lower for more results since docs are important
          )
          console.log('📚 Found related documentation via semantic search:', relatedDocs.length)
          
          // Build RAG context from semantic search results
          ragContext = []
          
          if (relatedDefects.length > 0) {
            ragContext.push('=== HISTORICAL DEFECTS (Learn from past issues) ===')
            relatedDefects.forEach((defect: any, index: number) => {
              ragContext.push(`Defect ${index + 1}: ${defect.entity.title}`)
              ragContext.push(`Description: ${defect.entity.description}`)
              ragContext.push(`Component: ${defect.entity.component || 'N/A'}`)
              ragContext.push(`Severity: ${defect.entity.severity || 'N/A'}`)
              if (defect.entity.stepsToReproduce) {
                ragContext.push(`Steps to Reproduce: ${defect.entity.stepsToReproduce}`)
              }
              ragContext.push('---')
            })
          }
          
          if (relatedStories.length > 0) {
            ragContext.push('=== RELATED USER STORIES (Similar functionality) ===')
            relatedStories.forEach((story: any, index: number) => {
              ragContext.push(`Story ${index + 1}: ${story.entity.title}`)
              ragContext.push(`Description: ${story.entity.description}`)
              ragContext.push(`Component: ${story.entity.component || 'N/A'}`)
              if (story.entity.acceptanceCriteria) {
                ragContext.push(`Acceptance Criteria: ${story.entity.acceptanceCriteria}`)
              }
              ragContext.push('---')
            })
          }
          
          if (relatedTestCases.length > 0) {
            ragContext.push('=== EXISTING TEST PATTERNS (Testing approaches) ===')
            relatedTestCases.forEach((testCase: any, index: number) => {
              ragContext.push(`Test Case ${index + 1}: ${testCase.entity.title}`)
              ragContext.push(`Steps: ${testCase.entity.steps.substring(0, 200)}...`)
              ragContext.push(`Priority: ${testCase.entity.priority || 'N/A'}`)
              ragContext.push('---')
            })
          }

          if (relatedDocs.length > 0) {
            ragContext.push('=== TECHNICAL DOCUMENTATION (Domain knowledge and patterns) ===')
            relatedDocs.forEach((doc: any, index: number) => {
              ragContext.push(`Document ${index + 1}: ${doc.entity.title}`)
              ragContext.push(`Content: ${(doc.entity.content || 'No content').substring(0, 300)}...`)
              ragContext.push(`Type: ${doc.entity.type || 'Unknown'}`)
              ragContext.push(`Source: Documentation Database (ID: ${doc.entity.id})`)
              ragContext.push('---')
            })
          }
          
          console.log('📋 RAG context built with', ragContext.length, 'lines')
          console.log('📋 RAG context preview:', ragContext.slice(0, 5).join('\n'))
          
        } catch (searchError) {
          console.error('⚠️ Semantic search failed, falling back to basic search:', searchError)
          
          // Fallback to basic search if semantic search fails
          const titleFirstWord = userStory.title.split(' ')[0]
          const relatedDefects = await prisma.defect.findMany({
            where: {
              OR: [
                { component: userStory.component },
                { title: { contains: titleFirstWord } },
              ],
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
          })
          
          ragContext = relatedDefects.map((defect: any) => 
            `Historical Defect: ${defect.title} - ${defect.description}`
          )
        }
      } else {
        console.log('⚠️ Skipping RAG search due to invalid title')
      }
    } else if (directUserStory) {
      console.log('📝 Using direct user story from request')
      console.log('  - Direct user story type:', typeof directUserStory)
      console.log('  - Direct user story value:', directUserStory)
      
      // Use provided user story directly (for testing)
      if (typeof directUserStory === 'string') {
        userStory = {
          id: 'direct-story',
          title: directUserStory,
          description: '',
          acceptanceCriteria: 'Standard functionality',
          component: 'Not specified',
          priority: 'Medium',
          jiraKey: 'N/A'
        }
      } else if (typeof directUserStory === 'object' && directUserStory !== null) {
        userStory = {
          id: directUserStory.id || 'direct-story',
          title: directUserStory.title || 'Untitled',
          description: directUserStory.description || '',
          acceptanceCriteria: directUserStory.acceptanceCriteria || 'Standard functionality',
          component: directUserStory.component || 'Not specified',
          priority: directUserStory.priority || 'Medium',
          jiraKey: directUserStory.jiraKey || 'N/A'
        }
      } else {
        console.error('❌ Invalid directUserStory format')
        return NextResponse.json(
          { error: 'Invalid user story format' },
          { status: 400 }
        )
      }
      
      console.log('📝 Constructed user story object:', JSON.stringify(userStory, null, 2))
    } else {
      console.error('❌ No user story provided')
      return NextResponse.json(
        { error: 'User story ID or user story text is required' },
        { status: 400 }
      )
    }

    console.log('✅ Final user story object:')
    console.log('  - ID:', userStory.id)
    console.log('  - Title:', userStory.title)
    console.log('  - Description:', userStory.description)
    console.log('  - Acceptance Criteria:', userStory.acceptanceCriteria)
    console.log('  - Component:', userStory.component)
    console.log('  - Priority:', userStory.priority)

    // Load product context for industry-specific test generation
    console.log('🏭 Loading product context for industry-specific test generation...')
    const productContext = await loadProductContext()
    console.log('  - Product:', productContext.productName)
    console.log('  - Industry:', productContext.industry)
    console.log('  - User types:', productContext.userTypes.length)
    console.log('  - Key features:', productContext.keyFeatures.length)

    // Build industry context for AI with multiple contexts
    const industryContextArray = [
      `=== PRODUCT CONTEXT ===`,
      `Product: ${productContext.productName}`,
      `Industry: ${productContext.industry}`,
      `Description: ${productContext.description}`,
      ``,
      `=== TARGET USERS & FIELD USAGE ===`,
      `Primary Users: ${productContext.userTypes.join(', ')}`,
      ``,
      `Key Considerations for Real-World Usage:`,
      `• Field teams often work in challenging environments (construction sites, industrial facilities)`,
      `• Users may have limited technical expertise and need intuitive interfaces`,
      `• Mobile/tablet usage is common for field inspections and data collection`,
      `• Network connectivity may be intermittent in remote locations`,
      `• Compliance and audit trails are critical for regulatory requirements`,
      `• Integration with existing enterprise systems (ERP, CAD, etc.) is essential`,
      `• Multi-user collaboration across different organizations and roles`,
      `• Document version control is critical to prevent costly errors`,
      ``,
      `=== KEY PRODUCT FEATURES ===`,
      productContext.keyFeatures.map((feature: string) => `• ${feature}`).join('\n'),
      ``,
      `=== SECURITY & COMPLIANCE REQUIREMENTS ===`,
      productContext.securityStandards.map((standard: string) => `• ${standard}`).join('\n'),
      ``,
      `=== INDUSTRY-SPECIFIC TEST SCENARIOS ===`,
      `Focus Areas: ${industryContexts.map((ctx: string) => ctx.toUpperCase()).join(', ')}`,
      `Consider these real-world scenarios when generating test cases:`,
      ``
    ]

    // Add scenarios for selected industry contexts (limit to prevent prompt overflow)
    if (industryContexts.length === 0) {
      // No industry contexts selected - use basic product context only
      console.log('🎯 No industry contexts selected, using basic product context only')
      industryContextArray.push(`--- BASIC TEST SCENARIOS ---`)
      industryContextArray.push(`• Standard functionality testing based on acceptance criteria`)
      industryContextArray.push(`• User interface and usability validation`)
      industryContextArray.push(`• Data validation and error handling`)
      industryContextArray.push(`• Basic integration and workflow testing`)
      industryContextArray.push(``)
    } else if (industryContexts.length > 3) {
      // If more than 3 contexts selected, use comprehensive scenarios only
      console.log('🎯 Multiple contexts selected, using comprehensive scenarios to prevent prompt overflow')
      industryContextArray.push(`--- COMPREHENSIVE SCENARIOS (Multiple Contexts Selected) ---`)
      industryContextArray.push(...getIndustryScenarios('comprehensive'))
      industryContextArray.push(``)
    } else {
      // Use specific scenarios for 1-3 contexts
      industryContexts.forEach((context: string) => {
        industryContextArray.push(`--- ${context.toUpperCase()} SCENARIOS ---`)
        industryContextArray.push(...getIndustryScenarios(context))
        industryContextArray.push(``)
      })
    }

    // Combine RAG context with industry context
    const fullContext = [...industryContextArray, ...ragContext]

    // Generate test cases using Claude with enhanced context
    console.log('🤖 Calling generateTestCases with enhanced RAG + Industry context:')
    const storyText = userStory.title + '\n\n' + userStory.description
    const acceptanceCriteria = userStory.acceptanceCriteria || 'No acceptance criteria provided'
    
    console.log('  - Story text:', storyText)
    console.log('  - Acceptance criteria:', acceptanceCriteria)
    console.log('  - Full context lines:', fullContext.length)
    console.log('  - Industry context lines:', industryContextArray.length)
    console.log('  - RAG context lines:', ragContext.length)
    console.log('  - Test types:', testTypes)
    console.log('  - Model ID:', modelId)

    console.log('🤖 About to call generateTestCases with:')
    console.log('  - Story text length:', storyText.length)
    console.log('  - Acceptance criteria length:', acceptanceCriteria.length)
    console.log('  - Full context lines:', fullContext.length)
    console.log('  - Full context character count:', fullContext.join('\n').length)
    console.log('  - Industry contexts selected:', industryContexts.length)
    console.log('  - Test types:', testTypes)
    console.log('  - Model ID:', modelId)
    
    // Log prompt size warning if too large
    const totalPromptSize = storyText.length + acceptanceCriteria.length + fullContext.join('\n').length
    if (totalPromptSize > 50000) {
      console.warn('⚠️ Large prompt detected:', totalPromptSize, 'characters - may cause AI processing issues')
    }

    let testCases: string
    try {
      console.log('🔄 Calling generateTestCases function...')
      testCases = await generateTestCases(
        storyText,
        acceptanceCriteria,
        fullContext, // Pass enhanced context with industry + RAG
        testTypes,
        modelId
      )
      console.log('✅ generateTestCases completed successfully')
    } catch (aiError) {
      console.error('💥 AI Service Error in generateTestCases:')
      console.error('  - Error type:', aiError instanceof Error ? aiError.constructor.name : typeof aiError)
      console.error('  - Error message:', aiError instanceof Error ? aiError.message : aiError)
      console.error('  - Error stack:', aiError instanceof Error ? aiError.stack : 'No stack trace')
      console.error('  - Full error object:', aiError)
      
      // Re-throw with more context
      throw new Error(`AI service failed during test case generation: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`)
    }

    console.log('✅ Test cases generated successfully')
    console.log('  - Test cases type:', typeof testCases)
    console.log('  - Test cases length:', typeof testCases === 'string' ? testCases.length : 'N/A')
    console.log('  - Test cases preview:', typeof testCases === 'string' ? testCases.substring(0, 200) + '...' : testCases)

    // Save generated test cases
    console.log('💾 Saving test cases to database...')
    
    // Only include sourceStoryId if it's a real database ID (not a direct story)
    const testCaseData: any = {
      title: `Generated Test Cases for ${userStory.title}`,
      steps: testCases,
      expectedResults: 'See individual test case descriptions',
      generatedFrom: 'ai_generated_with_rag',
      priority: userStory.priority || 'medium',
      status: 'draft',
    }
    
    // Only add sourceStoryId if it's from the database (not a direct story)
    if (userStoryId && userStory.id !== 'direct-story') {
      testCaseData.sourceStoryId = userStory.id
      console.log('  - Including sourceStoryId:', userStory.id)
    } else {
      console.log('  - Skipping sourceStoryId for direct story')
    }
    
    const testCase = await prisma.testCase.create({
      data: testCaseData,
    })

    console.log('✅ Test cases saved to database with ID:', testCase.id)

    return NextResponse.json({
      message: 'Test cases generated successfully with RAG context',
      testCase,
      content: testCases,
      ragContextUsed: ragContext.length > 0,
      ragContextLines: ragContext.length,
    })
  } catch (error) {
    console.error('💥 DETAILED ERROR in test case generation:')
    console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('  - Error message:', error instanceof Error ? error.message : error)
    console.error('  - Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('  - Full error object:', error)
    
    // Provide more specific error message to help with debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const isAIError = errorMessage.includes('AI service failed') || errorMessage.includes('Bedrock') || errorMessage.includes('generateTestCases')
    
    return NextResponse.json(
      { 
        error: isAIError ? 'AI service error during test case generation' : 'Failed to generate test cases',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 