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

// Load RAG configuration
async function loadRAGConfig() {
  try {
    const configFile = path.join(process.cwd(), 'data', 'rag-config.json')
    const data = await fs.readFile(configFile, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Return default configuration if file doesn't exist
    return {
      searchTypes: {
        defects: true,
        userStories: false,
        testCases: true,
        documents: false
      },
      maxResults: {
        defects: 2,
        userStories: 2,
        testCases: 2,
        documents: 1
      },
      similarityThresholds: {
        defects: 0.8,
        userStories: 0.75,
        testCases: 0.8,
        documents: 0.85
      },
      contentLimits: {
        maxItemLength: 200,
        maxTotalRAGLength: 800,
        enableSmartTruncation: true
      },
      relevanceFiltering: {
        enabled: true,
        minKeywordMatches: 1,
        minStoryKeywordMatches: 2,
        keywordBoostTerms: [
          'test', 'defect', 'bug', 'issue', 'error', 'validation', 
          'field', 'user', 'system', 'authentication', 'authorization',
          'ui', 'interface', 'performance', 'security', 'integration'
        ]
      },
      performance: {
        searchTimeout: 45,
        enableParallelSearch: true,
        cacheResults: false
      }
    }
  }
}

// Generate industry-specific scenarios based on context selection
// Smart RAG context builder - uses configuration-driven relevance filtering
async function buildSmartRAGContext(userStory: any, ragConfig: any, testType?: string) {
  const context = [
    `=== USER STORY ===`,
    `Title: ${userStory.title}`,
    `Description: ${userStory.description}`,
    `Acceptance Criteria: ${userStory.acceptanceCriteria || 'None provided'}`,
    ``,
    `=== CONTEXT ===`,
    `Product: Fusion Live - Engineering Document Management`,
    testType ? `Focus: Generate focused ${testType} test cases only` : `Focus: Generate comprehensive test cases`,
    ``
  ]

  // Build RAG context based on configuration
  const ragResults = []

  try {
    // Search for different types of content based on configuration
    const searchPromises = []

    if (ragConfig.searchTypes.defects) {
      searchPromises.push(
        semanticSearchWithDetails(
          userStory.title + ' ' + userStory.description,
          ['defect'],
          ragConfig.maxResults.defects,
          ragConfig.similarityThresholds.defects
        ).then(results => ({ type: 'defects', results }))
      )
    }

    if (ragConfig.searchTypes.userStories) {
      searchPromises.push(
        semanticSearchWithDetails(
          userStory.title + ' ' + userStory.description,
          ['user_story'],
          ragConfig.maxResults.userStories,
          ragConfig.similarityThresholds.userStories
        ).then(results => ({ type: 'userStories', results }))
      )
    }

    if (ragConfig.searchTypes.testCases) {
      searchPromises.push(
        semanticSearchWithDetails(
          userStory.title + ' ' + userStory.description,
          ['test_case'],
          ragConfig.maxResults.testCases,
          ragConfig.similarityThresholds.testCases
        ).then(results => ({ type: 'testCases', results }))
      )
    }

    if (ragConfig.searchTypes.documents) {
      searchPromises.push(
        semanticSearchWithDetails(
          userStory.title + ' ' + userStory.description,
          ['document'],
          ragConfig.maxResults.documents,
          ragConfig.similarityThresholds.documents
        ).then(results => ({ type: 'documents', results }))
      )
    }

    // Execute searches in parallel if enabled
    const searchResults = ragConfig.performance.enableParallelSearch 
      ? await Promise.all(searchPromises)
      : await searchPromises.reduce(async (acc, promise) => {
          const results = await acc
          const result = await promise
          return [...results, result]
        }, Promise.resolve([] as { type: string; results: any[] }[]))

    // Process and filter results
    for (const { type, results } of searchResults) {
      for (const result of results) {
        if (result.entity) {
          let ragItem = ''
          
          switch (type) {
            case 'defects':
              ragItem = `Defect: ${result.entity.title} - ${result.entity.description}`
              break
            case 'userStories':
              ragItem = `Related Story: ${result.entity.title} - ${result.entity.description}`
              break
            case 'testCases':
              ragItem = `Similar Test: ${result.entity.title} - ${result.entity.description}`
              break
            case 'documents':
              ragItem = `Document: ${result.entity.title} - ${result.entity.content || result.entity.description}`
              break
          }

          if (ragItem) {
            // Apply relevance filtering if enabled
            if (ragConfig.relevanceFiltering.enabled) {
              const itemLower = ragItem.toLowerCase()
              const storyLower = (userStory.title + ' ' + userStory.description).toLowerCase()
              
              // Check for keyword overlap
              const keywordMatches = ragConfig.relevanceFiltering.keywordBoostTerms.filter((keyword: string) => 
                itemLower.includes(keyword.toLowerCase()) && storyLower.includes(keyword.toLowerCase())
              ).length
              
              const storyKeywords = storyLower.split(/\s+/).filter(word => word.length > 3)
              const storyKeywordMatches = storyKeywords.filter(keyword => 
                itemLower.includes(keyword)
              ).length
              
              // Apply filtering thresholds
              if (keywordMatches < ragConfig.relevanceFiltering.minKeywordMatches && 
                  storyKeywordMatches < ragConfig.relevanceFiltering.minStoryKeywordMatches) {
                continue
              }
            }

            // Apply content limits
            if (ragConfig.contentLimits.enableSmartTruncation && 
                ragItem.length > ragConfig.contentLimits.maxItemLength) {
              ragItem = ragItem.substring(0, ragConfig.contentLimits.maxItemLength) + '...'
            }

            ragResults.push(ragItem)
          }
        }
      }
    }

    // Apply total length limit
    let totalLength = 0
    const filteredResults = []
    
    for (const item of ragResults) {
      if (totalLength + item.length <= ragConfig.contentLimits.maxTotalRAGLength) {
        filteredResults.push(item)
        totalLength += item.length
      } else {
        break
      }
    }

    // Add RAG context to the response
    if (filteredResults.length > 0) {
      context.push(`=== RELEVANT INSIGHTS ===`)
      filteredResults.forEach((item, index) => {
        context.push(`${index + 1}. ${item}`)
      })
      context.push(``)
    }

  } catch (error) {
    console.error('Error building RAG context:', error)
    // Continue without RAG context if there's an error
  }

  const contextString = context.join('\n')
  console.log(`🧠 Smart RAG context built: ${context.length} lines, ${contextString.length} chars, ${ragResults.length} RAG items`)
  
  return context
}

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
  // Set a timeout for the entire request
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout after 4 minutes')), 240000) // 4 minutes
  })

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
      modelId,
      streamingMode = false // New parameter for streaming mode
    } = requestBody

    console.log('🔍 Parsed request parameters:')
    console.log('  - userStoryId:', userStoryId)
    console.log('  - directUserStory:', directUserStory)
    console.log('  - testTypes:', testTypes)
    console.log('  - industryContext:', industryContext)
    console.log('  - industryContexts:', industryContexts)
    console.log('  - modelId:', modelId)
    console.log('  - streamingMode:', streamingMode)

    // Determine if we should use streaming chunked generation
    const shouldUseStreamingChunks = testTypes.length > 1
    console.log('🌊 Using streaming chunks:', shouldUseStreamingChunks)

    // Wrap the main logic in a promise that can be timed out
    const mainLogicPromise = async () => {
      let userStory: any
      let ragContext: string[] = []
      
      // Load RAG configuration
      console.log('⚙️ Loading RAG configuration...')
      const ragConfig = await loadRAGConfig()
      console.log('✅ RAG configuration loaded:', {
        searchTypes: ragConfig.searchTypes,
        maxResults: ragConfig.maxResults,
        relevanceFiltering: ragConfig.relevanceFiltering.enabled
      })

      if (userStoryId) {
        console.log('📖 Fetching user story from database with ID:', userStoryId)
        
        try {
          // Fetch user story with timeout
          const userStoryPromise = prisma.userStory.findUnique({
            where: { id: userStoryId },
            include: {
              testCases: {
                select: {
                  id: true,
                  title: true,
                  steps: true,
                  priority: true
                }
              }
            }
          })

          const userStoryTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database query timeout')), 30000) // 30 seconds
          })

          userStory = await Promise.race([userStoryPromise, userStoryTimeout])

          if (!userStory) {
            console.error('❌ User story not found with ID:', userStoryId)
            return NextResponse.json(
              { error: 'User story not found' },
              { status: 404 }
            )
          }

          console.log('✅ User story found:', userStory.title)
          console.log('  - Description length:', userStory.description?.length || 0)
          console.log('  - Acceptance criteria length:', userStory.acceptanceCriteria?.length || 0)
          console.log('  - Existing test cases:', userStory.testCases?.length || 0)

          // Build RAG context with timeout protection
          console.log('🔍 Building RAG context with semantic search...')
          
          try {
            const searchTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Semantic search timeout')), 45000) // 45 seconds
            })

            const searchPromise = (async () => {
              const searchQuery = `${userStory.title} ${userStory.description} ${userStory.acceptanceCriteria}`
              console.log('  - Search query length:', searchQuery.length)
              
                        // Perform selective semantic searches - prioritize defects and test cases
          const [relatedDefects, relatedTestCases] = await Promise.all([
            semanticSearchWithDetails(searchQuery, ['defect'], 2, 0.8).catch(err => {
              console.warn('Defect search failed:', err.message)
              return []
            }),
            semanticSearchWithDetails(searchQuery, ['test_case'], 2, 0.8).catch(err => {
              console.warn('Test case search failed:', err.message)
              return []
            })
          ])

              console.log('📊 RAG search results:')
              console.log('  - Related defects:', relatedDefects.length)
              console.log('  - Related test cases:', relatedTestCases.length)

              // Build focused RAG context (only most relevant items)
              if (relatedDefects.length > 0) {
                ragContext.push('=== HISTORICAL DEFECTS (Patterns to avoid) ===')
                relatedDefects.slice(0, 2).forEach((defect: any, index: number) => {
                  ragContext.push(`${index + 1}. ${defect.entity.summary} (${defect.entity.severity || 'Unknown'} severity)`)
                  if (defect.entity.description) {
                    ragContext.push(`   Issue: ${defect.entity.description.substring(0, 150)}...`)
                  }
                })
                ragContext.push('')
              }

              if (relatedTestCases.length > 0) {
                ragContext.push('=== EXISTING TEST PATTERNS ===')
                relatedTestCases.slice(0, 2).forEach((testCase: any, index: number) => {
                  ragContext.push(`${index + 1}. ${testCase.entity.title}`)
                  if (testCase.entity.steps) {
                    ragContext.push(`   Pattern: ${testCase.entity.steps.substring(0, 150)}...`)
                  }
                })
                ragContext.push('')
              }

              console.log('📋 RAG context built with', ragContext.length, 'lines')
              console.log('📋 RAG context preview:', ragContext.slice(0, 5).join('\n'))
            })()

            await Promise.race([searchPromise, searchTimeout])
          } catch (searchError) {
            const errorMsg = searchError instanceof Error ? searchError.message : 'Unknown search error'
            console.warn('⚠️ RAG context building failed, continuing without context:', errorMsg)
            ragContext = ['=== RAG CONTEXT UNAVAILABLE ===', 'Semantic search timed out or failed, generating test cases without historical context.']
          }

        } catch (dbError) {
          const errorMsg = dbError instanceof Error ? dbError.message : 'Unknown database error'
          console.error('💥 Database error:', dbError)
          return NextResponse.json(
            { error: 'Database connection failed', details: errorMsg },
            { status: 500 }
          )
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
        
        if (shouldUseStreamingChunks) {
          console.log('🌊 Using streaming chunked generation for multiple test types')
          
          // Generate FIRST test type immediately and return it
          const firstTestType = testTypes[0]
          console.log(`🚀 Generating FIRST chunk: ${firstTestType} test cases...`)
          
          const firstChunkTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`${firstTestType} test case generation timeout`)), 90000) // 1.5 minutes
          })
          
          // Build smart, selective RAG context for speed + relevance
          const smartContext = await buildSmartRAGContext(userStory, ragConfig, firstTestType)
          
          const firstChunkPromise = generateTestCases(
            storyText,
            acceptanceCriteria,
                          smartContext, // Use smart RAG context for relevance + speed
            [firstTestType], // Single test type for first chunk
            modelId
          )
          
          const firstChunkResult = await Promise.race([firstChunkPromise, firstChunkTimeout]) as string
          console.log(`✅ FIRST chunk (${firstTestType}) generated successfully (${firstChunkResult.length} chars)`)
          
          // Validate the result is not empty
          if (!firstChunkResult || firstChunkResult.trim().length < 50) {
            throw new Error(`${firstTestType} test case generation returned empty or invalid result`)
          }
          
          // Save the first chunk immediately
          const firstTestCaseData: any = {
            title: `Generated Test Cases for ${userStory.title} - ${firstTestType.toUpperCase()}`,
            steps: firstChunkResult,
            expectedResults: 'See individual test case descriptions',
            generatedFrom: 'ai_generated_streaming_first_chunk',
            priority: userStory.priority || 'medium',
            status: 'draft',
          }
          
          if (userStoryId && userStory.id !== 'direct-story') {
            firstTestCaseData.sourceStoryId = userStory.id
          }
          
          let firstTestCase: any
          try {
            firstTestCase = await prisma.testCase.create({
              data: firstTestCaseData,
            })
            console.log('✅ First chunk saved to database with ID:', firstTestCase.id)
          } catch (dbSaveError) {
            console.warn('⚠️ Failed to save first chunk to database:', dbSaveError)
          }
          
          // Return first chunk immediately with streaming info
          const remainingTestTypes = testTypes.slice(1)
          
          return NextResponse.json({
            message: 'First test cases generated successfully - remaining types processing in background',
            testCase: firstTestCase,
            content: firstChunkResult,
            ragContextUsed: ragContext.length > 0,
            ragContextLines: ragContext.length,
            streamingMode: true,
            isFirstChunk: true,
            completedTestTypes: [firstTestType],
            remainingTestTypes: remainingTestTypes,
            totalTestTypes: testTypes.length,
            progress: Math.round((1 / testTypes.length) * 100)
          })
          
        } else {
          console.log('🔄 Using single generation for single test type')
          
          // Add timeout for AI generation
          const aiGenerationPromise = generateTestCases(
            storyText,
            acceptanceCriteria,
            fullContext, // Pass enhanced context with industry + RAG
            testTypes,
            modelId
          )

          const aiTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('AI generation timeout after 2 minutes')), 120000) // 2 minutes
          })

          testCases = await Promise.race([aiGenerationPromise, aiTimeout]) as string
        }
        
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
      
      try {
        const dbSavePromise = prisma.testCase.create({
          data: testCaseData,
        })

        const dbTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database save timeout')), 30000) // 30 seconds
        })

        const testCase = await Promise.race([dbSavePromise, dbTimeout]) as any
        console.log('✅ Test cases saved to database with ID:', testCase.id)

        return NextResponse.json({
          message: 'Test cases generated successfully with RAG context',
          testCase,
          content: testCases,
          ragContextUsed: ragContext.length > 0,
          ragContextLines: ragContext.length,
        })
      } catch (dbSaveError) {
        console.error('💥 Database save error:', dbSaveError)
        // Return success even if save fails
        return NextResponse.json({
          message: 'Test cases generated successfully (save failed)',
          content: testCases,
          ragContextUsed: ragContext.length > 0,
          ragContextLines: ragContext.length,
          warning: 'Failed to save to database but generation succeeded'
        })
      }
    }

    // Race the main logic against the timeout
    const result = await Promise.race([mainLogicPromise(), timeoutPromise])
    return result as NextResponse

  } catch (error) {
    console.error('💥 DETAILED ERROR in test case generation:')
    console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('  - Error message:', error instanceof Error ? error.message : error)
    console.error('  - Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('  - Full error object:', error)
    
    // Provide more specific error message to help with debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const isTimeoutError = errorMessage.includes('timeout') || errorMessage.includes('Timeout')
    const isAIError = errorMessage.includes('AI service failed') || errorMessage.includes('Bedrock') || errorMessage.includes('generateTestCases')
    const isDBError = errorMessage.includes('Database') || errorMessage.includes('Prisma')
    
    let errorType = 'Unknown error'
    if (isTimeoutError) errorType = 'Request timeout'
    else if (isAIError) errorType = 'AI service error'
    else if (isDBError) errorType = 'Database error'
    
    return NextResponse.json(
      { 
        error: `${errorType} during test case generation`,
        details: errorMessage,
        timestamp: new Date().toISOString(),
        type: errorType
      },
      { status: 500 }
    )
  }
} 