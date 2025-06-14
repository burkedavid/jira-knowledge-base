'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Brain, Search, TestTube, FileText, AlertTriangle, Database, Copy, Check, Filter, Eye, Code, Zap, ArrowLeft } from 'lucide-react'

interface AIPrompt {
  id: string
  category: string
  name: string
  description: string
  prompt: string
  endpoint: string
  model: string
  parameters: {
    maxTokens: number
    temperature: number
    [key: string]: any
  }
  usage: string
  example?: string
}

const AI_PROMPTS: AIPrompt[] = [
  {
    id: 'test-case-generation',
    category: 'Test Generation',
    name: 'Test Case Generation',
    description: 'Generates comprehensive test cases from user stories using RAG context and industry scenarios',
    endpoint: '/api/generate/test-cases',
    model: 'Claude Sonnet 4',
    parameters: {
      maxTokens: 4000,
      temperature: 0.3
    },
    usage: 'Used when generating test cases from user stories with historical defect patterns',
    prompt: `Generate comprehensive test cases for the following user story using the EXACT format specified below:

**User Story:**
{userStory}

**Acceptance Criteria:**
{acceptanceCriteria}

**Test Types to Include:** {testTypes}

{defectContext}

CRITICAL: You MUST follow this EXACT format structure for proper parsing:

# Generated Test Cases for User Story

{testTypeSections}

For EACH test case, use this EXACT format:

### TC-001: [Test Case Title]
**Priority:** [High/Medium/Low]
**Preconditions:**
- [Precondition 1]
- [Precondition 2]

**Test Steps:**
1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]

**Expected Results:**
- [Expected result 1]
- [Expected result 2]

**Test Data:**
- [Test data if applicable]

**Notes:**
- [Additional notes if applicable]

---

REQUIREMENTS:
1. Generate 3-5 test cases per test type section
2. Use sequential TC numbers (TC-001, TC-002, etc.)
3. Include realistic test steps based on the user story
4. Consider field usage scenarios and real-world conditions
5. Include appropriate test data examples
6. Set realistic priority levels (High for critical paths, Medium for standard flows, Low for edge cases)
7. Use the exact markdown formatting shown above
8. Separate each test case with "---"
9. Include preconditions that reflect real system states
10. Make expected results specific and measurable

Focus on practical, executable test cases that cover all acceptance criteria and consider the industry context provided.`,
    example: 'User Story: "As a user, I want to login to the system" → Generates positive, negative, and edge case test scenarios'
  },
  {
    id: 'requirements-analysis',
    category: 'Quality Analysis',
    name: 'Requirements Analysis',
    description: 'Analyzes user story quality against INVEST criteria with RAG-based insights',
    endpoint: '/api/analyze/requirements',
    model: 'Claude Sonnet 4',
    parameters: {
      maxTokens: 3000,
      temperature: 0.4
    },
    usage: 'Used to analyze user story quality and provide improvement suggestions',
    prompt: `Analyze the quality of this user story and provide improvement suggestions with RAG-based insights:

**User Story:**
{userStory}

**Acceptance Criteria:**
{acceptanceCriteria}

{ragContext}

Please provide a comprehensive analysis with the following sections:

## 1. Quality Score (1-10) with justification

## 2. Strengths of the current user story

## 3. Areas for Improvement with specific suggestions

## 4. Missing Elements that should be added

## 5. Risk Assessment based on clarity and completeness

## 6. RAG-Based Insights (ONLY if knowledge base context is available)
{ragContextAvailable ? 'Based on the knowledge base context provided above, identify:' : 'No knowledge base context available for this analysis.'}

### Related Dependencies
- Existing functionality that connects to this requirement (from user stories, guides)
- Integration points that need consideration
- Shared components or services

### Potential Risks  
- Historical defects that could indicate similar risks
- Known issues from past implementations
- Component-specific vulnerabilities

### Testing Considerations
- Additional testing needed based on past experiences
- Edge cases discovered in similar features
- Integration testing requirements

**IMPORTANT:** Only include RAG-Based Insights if actual knowledge base context is provided. Base all suggestions strictly on the context found in the knowledge base - never invent or assume information not present in the context. Always cite the source (e.g., "Based on Defect ID: xyz" or "According to User Story ID: abc").

## 7. Recommended Actions for the business analyst

Focus on INVEST criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable) and industry best practices.`,
    example: 'Analyzes user stories for clarity, completeness, and testability with historical context'
  },
  {
    id: 'defect-pattern-analysis',
    category: 'Defect Analysis',
    name: 'Defect Pattern Analysis',
    description: 'Identifies patterns in defects using AI analysis with comprehensive RAG context',
    endpoint: '/api/analyze/defect-patterns',
    model: 'Claude Sonnet 4',
    parameters: {
      maxTokens: 4000,
      temperature: 0.2
    },
    usage: 'Used to analyze defect patterns and provide prevention strategies',
    prompt: `You are an expert software quality analyst specializing in defect pattern recognition and quality improvement strategies. Analyze the following defects and provide comprehensive insights.

DEFECT DATA ({defectCount} defects from last {timeRange} days):
{defectSummaries}

RELATED CONTEXT FROM KNOWLEDGE BASE:
{ragContextText}

ANALYSIS REQUIREMENTS:
Please provide a comprehensive JSON response with the following structure:

{
  "patterns": [
    {
      "id": "unique_pattern_id",
      "name": "Pattern Name",
      "description": "Detailed description of the pattern",
      "severity": "Critical|High|Medium|Low",
      "frequency": number_of_occurrences,
      "affectedComponents": ["component1", "component2"],
      "rootCauses": ["cause1", "cause2"],
      "businessImpact": "Description of business impact",
      "preventionStrategy": "How to prevent this pattern",
      "testingRecommendations": ["test1", "test2"],
      "relatedDefects": ["defect_ids"],
      "confidence": 0.0-1.0
    }
  ],
  "insights": {
    "overallTrend": "Analysis of overall quality trend",
    "riskAssessment": "Current risk level and factors",
    "priorityActions": ["action1", "action2"],
    "qualityMetrics": {
      "patternDiversity": number,
      "componentCoverage": number,
      "severityDistribution": {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    }
  },
  "recommendations": {
    "immediate": ["urgent actions needed now"],
    "shortTerm": ["actions for next 1-3 months"],
    "longTerm": ["strategic improvements for 6+ months"]
  }
}

ANALYSIS FOCUS:
1. Identify recurring patterns in defect types, components, and root causes
2. Assess the business impact and risk level of each pattern
3. Provide actionable prevention strategies
4. Recommend specific testing approaches
5. Prioritize actions based on severity and frequency
6. Consider the related context from the knowledge base
7. Provide confidence scores based on data quality and pattern clarity

Ensure all recommendations are specific, actionable, and prioritized by impact.`,
    example: 'Identifies patterns like "Authentication failures in mobile app" with prevention strategies'
  },
  {
    id: 'defect-root-cause',
    category: 'Defect Analysis',
    name: 'Defect Root Cause Analysis',
    description: 'Analyzes individual defects to determine root causes using RAG context',
    endpoint: '/api/analyze/defect-root-cause',
    model: 'Claude Sonnet 4',
    parameters: {
      maxTokens: 4000,
      temperature: 0.1
    },
    usage: 'Used to analyze specific defects and identify root causes',
    prompt: `You are an expert software quality analyst. Analyze the following defect and provide insights into its root cause using the provided context from user stories, documentation, and similar defects.

DEFECT INFORMATION:
Title: {defectTitle}
Description: {defectDescription}
Component: {defectComponent}
Severity: {defectSeverity}
Steps to Reproduce: {stepsToReproduce}
Existing Root Cause: {existingRootCause}

CONTEXT FROM RAG SEARCH:

Related User Stories:
{relatedUserStories}

Related Documentation:
{relatedDocumentation}

Similar Defects:
{similarDefects}

Component Information:
{componentInfo}

Based on this information, provide a comprehensive analysis in JSON format:

{
  "rootCauseAnalysis": "Detailed analysis of the likely root cause",
  "requirementGaps": ["gap1", "gap2"],
  "relatedUserStories": ["story_ids"],
  "documentationReferences": ["doc_references"],
  "preventionRecommendations": ["recommendation1", "recommendation2"],
  "confidence": 0.0-1.0
}

Focus on:
1. Identifying the most likely root cause based on available evidence
2. Connecting the defect to requirement gaps or unclear specifications
3. Referencing related user stories that might have contributed to the issue
4. Suggesting specific prevention measures
5. Providing a confidence score based on the quality of available information`,
    example: 'Analyzes login failures and identifies missing validation requirements'
  },
  {
    id: 'rag-search',
    category: 'Knowledge Search',
    name: 'RAG-Powered Search',
    description: 'Provides intelligent answers using semantic search and AI synthesis',
    endpoint: '/api/search/rag',
    model: 'Claude Sonnet 4',
    parameters: {
      maxTokens: 1500,
      temperature: 0.2
    },
    usage: 'Used for intelligent search across the knowledge base',
    prompt: `You are an AI assistant helping users understand their comprehensive knowledge base. You have access to information from multiple sources including user stories, defects, documents, and test cases.

User Question: "{query}"

Context from Knowledge Base ({sourceCount} sources found):
{contextSections}

Instructions:
1. Provide a comprehensive answer based on ALL the context provided from different source types
2. If the question is about "Activities" or any specific topic, explain what they are based on the available information
3. Draw connections between different types of sources (user stories, defects, documents)
4. Reference specific sources when relevant (e.g., "According to User Story X..." or "As mentioned in Defect Y...")
5. If the context doesn't fully answer the question, acknowledge what information IS available and suggest related topics
6. Organize your response clearly with sections if appropriate
7. Be specific and detailed, synthesizing information from multiple sources
8. If you see patterns across multiple sources, highlight them

Please provide a comprehensive, helpful response that gives the user a full picture from their knowledge base:`,
    example: 'User asks "What are Activities?" → AI synthesizes information from all relevant sources'
  },
  {
    id: 'story-refinement',
    category: 'Quality Analysis',
    name: 'User Story Refinement',
    description: 'Refines user stories based on selected improvement suggestions',
    endpoint: '/api/refine-story',
    model: 'Claude Sonnet 4',
    parameters: {
      maxTokens: 1000,
      temperature: 0.7
    },
    usage: 'Used to automatically improve user stories based on analysis feedback',
    prompt: `You are an expert in Agile methodologies and user story writing. Your task is to refine the following user story based on the provided context and specific improvement suggestions. 

Original User Story Context:
{storyContext}

Selected Improvement Suggestions to address:
{improvementPoints}

Please provide a revised and improved version of the user story description. Focus on clarity, conciseness, testability, and incorporating the suggested improvements. The refined story should follow standard user story format (e.g., "As a [persona], I want [goal] so that [benefit]") if applicable, or maintain the original structure if it's more of a task or technical story, but ensure it's significantly improved based on the suggestions.

Output only the refined user story description text. Do not include any preamble, apologies, or explanations before or after the refined text itself.`,
    example: 'Takes vague requirements and makes them specific, testable, and complete'
  },
  {
    id: 'analytics-query',
    category: 'Analytics',
    name: 'Defect Analytics Query',
    description: 'Analyzes defect queries with RAG context for comprehensive insights',
    endpoint: '/api/analytics/defects/query',
    model: 'Claude Sonnet 4',
    parameters: {
      maxTokens: 2000,
      temperature: 0.3
    },
    usage: 'Used for intelligent defect analytics with natural language queries',
    prompt: `You are a senior QA analyst analyzing defect patterns and trends. Based on the user's query and the comprehensive data provided, generate a detailed, actionable analysis.

**User Query:** "{query}"
**Timeframe:** {timeframe}

**Database Statistics:**
- Total Defects: {totalDefects}
- Defects by Severity: {defectsBySeverity}
- Top Components: {defectsByComponent}
- Root Cause Patterns: {defectPatterns}

**Semantically Relevant Context ({contextCount} items found):**
{enrichedContext}

**Related Defects Found:** {relevantDefectsCount}
**Related User Stories:** {relatedUserStoriesCount}  
**Related Test Cases:** {relatedTestCasesCount}

Please provide a comprehensive analysis that:
1. Directly answers the user's specific question
2. Uses the semantic search results to provide deeper insights
3. Identifies patterns and trends from the data
4. Provides actionable recommendations
5. Highlights any concerning patterns or risks

Format your response in markdown with clear sections, bullet points, and emphasis on key findings.`,
    example: 'Query: "Authentication issues" → Provides detailed analysis with trends and recommendations'
  }
]

export default function AIPromptsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<AIPrompt | null>(null)
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [showRawPrompt, setShowRawPrompt] = useState<{[key: string]: boolean}>({})

  const categories = ['all', ...Array.from(new Set(AI_PROMPTS.map(p => p.category)))]

  const filteredPrompts = AI_PROMPTS.filter(prompt => {
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory
    const matchesSearch = !searchQuery || 
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  const copyToClipboard = async (text: string, promptId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedPromptId(promptId)
      setTimeout(() => setCopiedPromptId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const toggleRawPrompt = (promptId: string) => {
    setShowRawPrompt(prev => ({
      ...prev,
      [promptId]: !prev[promptId]
    }))
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Test Generation': return <TestTube className="h-5 w-5" />
      case 'Quality Analysis': return <FileText className="h-5 w-5" />
      case 'Defect Analysis': return <AlertTriangle className="h-5 w-5" />
      case 'Knowledge Search': return <Search className="h-5 w-5" />
      case 'Analytics': return <Database className="h-5 w-5" />
      default: return <Brain className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Test Generation': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'Quality Analysis': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'Defect Analysis': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'Knowledge Search': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'Analytics': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white mr-6">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                AI Prompts Viewer
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            AI Prompts & Templates
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Explore all the AI prompts used throughout the platform. See how Claude Sonnet 4 
            generates test cases, analyzes requirements, identifies defect patterns, and provides intelligent insights.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {AI_PROMPTS.length}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Prompts</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {categories.length - 1}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Categories</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Code className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Claude 4
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">AI Model</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  RAG
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Enhanced</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPrompts.map((prompt) => (
            <div key={prompt.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getCategoryIcon(prompt.category)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {prompt.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(prompt.category)}`}>
                        {prompt.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleRawPrompt(prompt.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={showRawPrompt[prompt.id] ? "Hide raw prompt" : "Show raw prompt"}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(prompt.prompt, prompt.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Copy prompt"
                    >
                      {copiedPromptId === prompt.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {prompt.description}
                </p>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                {/* Technical Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Model:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">{prompt.model}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Endpoint:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-300 font-mono text-xs">{prompt.endpoint}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Max Tokens:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">{prompt.parameters.maxTokens}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Temperature:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">{prompt.parameters.temperature}</span>
                  </div>
                </div>

                {/* Usage */}
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">Usage:</span>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{prompt.usage}</p>
                </div>

                {/* Example */}
                {prompt.example && (
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Example:</span>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 italic">{prompt.example}</p>
                  </div>
                )}

                {/* Raw Prompt */}
                {showRawPrompt[prompt.id] && (
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Raw Prompt:</span>
                    <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border">
                      <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                        {prompt.prompt}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No prompts found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search or category filter.
            </p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
            About AI Prompts
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>• <strong>RAG Enhancement:</strong> Most prompts use Retrieval-Augmented Generation with semantic search for context-aware responses</p>
            <p>• <strong>Claude Sonnet 4:</strong> Latest Anthropic model via AWS Bedrock for superior analysis and generation capabilities</p>
            <p>• <strong>Structured Outputs:</strong> Prompts are designed to return consistent, parseable responses for integration</p>
            <p>• <strong>Industry Context:</strong> Prompts include domain-specific knowledge for engineering and construction workflows</p>
            <p>• <strong>Temperature Control:</strong> Lower temperatures (0.1-0.4) for analysis, higher (0.5-0.7) for creative generation</p>
          </div>
        </div>
      </main>
    </div>
  )
}