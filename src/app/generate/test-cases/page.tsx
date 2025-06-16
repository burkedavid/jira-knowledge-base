'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, TestTube, Loader2, Copy, Download, CheckCircle, XCircle, AlertTriangle, History, Trash2, Clock, FileText, Code, Eye, FileDown, Settings, TrendingUp, Users, Shield, Wifi, ChevronDown, ChevronRight, X } from 'lucide-react'
import SmartFilter from '../../../components/SmartFilter'

interface UserStory {
  id: string
  title: string
  description: string
  acceptanceCriteria?: string
  jiraKey?: string
  priority?: string
  status?: string
  component?: string
  assignee?: string
  reporter?: string
  testCaseCount: number
  latestQualityScore?: number
}



export default function GenerateTestCasesPage() {
  const router = useRouter()
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [selectedStoryId, setSelectedStoryId] = useState('')
  const [testTypes, setTestTypes] = useState({
    positive: true,
    negative: true,
    edge: true
  })
  const [industryContexts, setIndustryContexts] = useState<string[]>(['field-usage'])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState('')
  const [filteredUserStories, setFilteredUserStories] = useState<UserStory[]>([])
  const [savedTestCases, setSavedTestCases] = useState<Array<{
    id: string
    title: string
    content: string
    timestamp: string
    userStoryTitle: string
    testTypes: string[]
  }>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null)
  const [qualityThreshold, setQualityThreshold] = useState(7)
  const [showQualityWarning, setShowQualityWarning] = useState(false)
  const [selectedStoryQualityScore, setSelectedStoryQualityScore] = useState<number | null>(null)

  
  // Cypress test generation states
  const [cypressTests, setCypressTests] = useState('')
  const [showCypressPreview, setShowCypressPreview] = useState(false)
  const [isGeneratingCypress, setIsGeneratingCypress] = useState(false)

  // Fetch user stories on component mount
  useEffect(() => {
    fetchUserStories()
    fetchQualityThreshold()
  }, [])

  // Fetch quality threshold from settings
  const fetchQualityThreshold = async () => {
    try {
      const response = await fetch('/api/settings/quality-threshold')
      const data = await response.json()
      setQualityThreshold(data.qualityThreshold || 7)
    } catch (error) {
      console.error('Error fetching quality threshold:', error)
      setQualityThreshold(7) // fallback
    }
  }

  // Load saved test cases from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('generatedTestCases')
    if (saved) {
      try {
        setSavedTestCases(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved test cases:', error)
      }
    }
  }, [])

  const fetchUserStories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user-stories?limit=100')
      const data = await response.json()
      
      if (response.ok) {
        setUserStories(data.userStories || [])
      } else {
        console.error('Failed to fetch user stories:', data.error)
      }
    } catch (error) {
      console.error('Error fetching user stories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestTypeChange = (type: keyof typeof testTypes) => {
    setTestTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleIndustryContextChange = (context: string) => {
    setIndustryContexts(prev => {
      if (context === 'comprehensive') {
        // If selecting "Comprehensive (All Scenarios)", check all other contexts
        if (prev.includes('comprehensive')) {
          // If already selected, uncheck all
          return []
        } else {
          // Select all contexts including comprehensive
          return industryContextOptions.map(opt => opt.value)
        }
      } else {
        // Handle individual context selection
        let newContexts: string[]
        if (prev.includes(context)) {
          newContexts = prev.filter(c => c !== context)
        } else {
          newContexts = [...prev, context]
        }
        
        // Check if all non-comprehensive contexts are selected
        const nonComprehensiveContexts = industryContextOptions
          .filter(opt => opt.value !== 'comprehensive')
          .map(opt => opt.value)
        
        const allNonComprehensiveSelected = nonComprehensiveContexts.every(ctx => 
          newContexts.includes(ctx)
        )
        
        // If all non-comprehensive are selected, also select comprehensive
        if (allNonComprehensiveSelected && !newContexts.includes('comprehensive')) {
          newContexts.push('comprehensive')
        } else if (!allNonComprehensiveSelected && newContexts.includes('comprehensive')) {
          // If not all are selected, remove comprehensive
          newContexts = newContexts.filter(c => c !== 'comprehensive')
        }
        
        return newContexts
      }
    })
  }

  // Initialize filtered stories with all stories
  useEffect(() => {
    setFilteredUserStories(userStories)
  }, [userStories])

  // Handle filter changes from SmartFilter component
  const handleFilterChange = useCallback((filtered: UserStory[]) => {
    setFilteredUserStories(filtered)
  }, [])



  // Handle user story selection and check quality score
  const handleStorySelection = async (storyId: string) => {
    setSelectedStoryId(storyId)
    if (storyId) {
      // Use the quality score that's already available in the user story object
      const selectedStory = userStories.find(story => story.id === storyId)
      const qualityScore = selectedStory?.latestQualityScore || null
      setSelectedStoryQualityScore(qualityScore)
    } else {
      setSelectedStoryQualityScore(null)
    }
  }

  const handleGenerate = async (forceGenerate?: boolean | React.MouseEvent) => {
    // Handle both direct calls and button click events
    const shouldForce = typeof forceGenerate === 'boolean' ? forceGenerate : false
    if (!selectedStoryId) {
      alert('Please select a user story first')
      return
    }

    const selectedTestTypes = Object.entries(testTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type)

    if (selectedTestTypes.length === 0) {
      alert('Please select at least one test type')
      return
    }

    if (industryContexts.length === 0) {
      alert('Please select at least one industry context')
      return
    }

    // Check quality score if not forcing generation
    if (!shouldForce && (selectedStoryQualityScore === null || selectedStoryQualityScore < qualityThreshold)) {
      setShowQualityWarning(true)
      return
    }

    setIsGenerating(true)
    setResult('')

    try {
      const response = await fetch('/api/generate/test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userStoryId: selectedStoryId,
          testTypes: selectedTestTypes,
          industryContext: industryContexts.length === 1 ? industryContexts[0] : 'comprehensive',
          industryContexts: industryContexts,
          modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data.content || 'Test cases generated successfully!')
        saveTestCasesToStorage(data.content, userStories.find(story => story.id === selectedStoryId)?.title || '', selectedTestTypes)
        
        // Show save notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
        notification.textContent = 'Test cases saved to history'
        document.body.appendChild(notification)
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 3000)
      } else {
        setResult(`Error: ${data.error || 'Failed to generate test cases'}`)
      }
    } catch (error) {
      console.error('Error generating test cases:', error)
      setResult('Error generating test cases. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }



  const selectedStory = userStories.find(story => story.id === selectedStoryId)



  // Save test cases to localStorage
  const saveTestCasesToStorage = (content: string, userStoryTitle: string, testTypes: string[]) => {
    const newTestCase = {
      id: Date.now().toString(),
      title: `Test Cases for ${userStoryTitle}`,
      content,
      timestamp: new Date().toISOString(),
      userStoryTitle,
      testTypes
    }

    const updated = [newTestCase, ...savedTestCases].slice(0, 10) // Keep only last 10
    setSavedTestCases(updated)
    localStorage.setItem('generatedTestCases', JSON.stringify(updated))
  }

  // Load a saved test case
  const loadSavedTestCase = (savedCase: typeof savedTestCases[0]) => {
    setResult(savedCase.content)
    setShowHistory(false)
    
    // Show a brief notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
    notification.textContent = 'Test case loaded from history'
    document.body.appendChild(notification)
    
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 3000)
  }

  // Clear all saved test cases
  const clearSavedTestCases = () => {
    setSavedTestCases([])
    localStorage.removeItem('generatedTestCases')
  }

  // Generate Cypress tests from manual test cases
  const generateCypressTests = (manualTestCases: string) => {
    if (!manualTestCases.trim()) {
      return ''
    }

    const selectedStory = userStories.find(s => s.id === selectedStoryId)
    const storyTitle = selectedStory?.title || 'Feature Test'
    const storyKey = selectedStory?.jiraKey || 'TEST'
    
    // Parse manual test cases to extract test information
    const lines = manualTestCases.split('\n')
    const testCases: any[] = []
    let currentTestCase: any = null
    let currentField = ''
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Skip empty lines
      if (!trimmedLine) continue
      
      // Match test case headers (### TC-001: Title)
      const testCaseMatch = trimmedLine.match(/^###\s+(TC-\d+):\s*(.+)/)
      if (testCaseMatch) {
        if (currentTestCase) {
          testCases.push(currentTestCase)
        }
        currentTestCase = {
          id: testCaseMatch[1],
          title: testCaseMatch[2],
          steps: [],
          expectedResults: [],
          testData: [],
          category: 'positive' // default
        }
        currentField = ''
        continue
      }
      
      // Skip if no current test case
      if (!currentTestCase) continue
      
      // Detect field headers (**Priority:** High, **Test Steps:**, etc.)
      if (trimmedLine.match(/^\*\*(Priority|Type|Preconditions?|Test Steps?|Expected Results?|Test Data|Notes?).*?\*\*:?\s*/i)) {
        const fieldMatch = trimmedLine.match(/^\*\*(Priority|Type|Preconditions?|Test Steps?|Expected Results?|Test Data|Notes?).*?\*\*:?\s*(.*)/i)
        if (fieldMatch) {
          const fieldName = fieldMatch[1].toLowerCase()
          const fieldValue = fieldMatch[2].trim()
          
          if (fieldName.includes('step')) {
            currentField = 'steps'
            if (fieldValue) currentTestCase.steps.push(fieldValue)
          } else if (fieldName.includes('expected') || fieldName.includes('result')) {
            currentField = 'expectedResults'
            if (fieldValue) currentTestCase.expectedResults.push(fieldValue)
          } else if (fieldName.includes('data')) {
            currentField = 'testData'
            if (fieldValue) currentTestCase.testData.push(fieldValue)
          } else {
            currentField = ''
          }
        }
        continue
      }
      
      // Handle numbered steps (1. Step content)
      if (trimmedLine.match(/^\d+\.\s+/) && currentField === 'steps') {
        const stepContent = trimmedLine.replace(/^\d+\.\s+/, '')
        currentTestCase.steps.push(stepContent)
        continue
      }
      
      // Handle bullet points (- Content)
      if (trimmedLine.match(/^[-•]\s+/)) {
        const bulletContent = trimmedLine.replace(/^[-•]\s+/, '')
        if (currentField === 'steps') {
          currentTestCase.steps.push(bulletContent)
        } else if (currentField === 'expectedResults') {
          currentTestCase.expectedResults.push(bulletContent)
        } else if (currentField === 'testData') {
          currentTestCase.testData.push(bulletContent)
        }
        continue
      }
      
      // Handle continuation of current field
      if (currentField && trimmedLine && !trimmedLine.match(/^(##|###|\*\*)/)) {
        if (currentField === 'steps') {
          // Append to last step or create new one
          if (currentTestCase.steps.length > 0) {
            currentTestCase.steps[currentTestCase.steps.length - 1] += ' ' + trimmedLine
          } else {
            currentTestCase.steps.push(trimmedLine)
          }
        } else if (currentField === 'expectedResults') {
          if (currentTestCase.expectedResults.length > 0) {
            currentTestCase.expectedResults[currentTestCase.expectedResults.length - 1] += ' ' + trimmedLine
          } else {
            currentTestCase.expectedResults.push(trimmedLine)
          }
        } else if (currentField === 'testData') {
          if (currentTestCase.testData.length > 0) {
            currentTestCase.testData[currentTestCase.testData.length - 1] += ' ' + trimmedLine
          } else {
            currentTestCase.testData.push(trimmedLine)
          }
        }
      }
    }
    
    if (currentTestCase) {
      testCases.push(currentTestCase)
    }
    
    // Categorize test cases based on section context
    let currentSection = ''
    const categorizedTests: any = { positive: [], negative: [], edge: [] }
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.match(/^##\s+POSITIVE/i)) {
        currentSection = 'positive'
      } else if (trimmedLine.match(/^##\s+NEGATIVE/i)) {
        currentSection = 'negative'
      } else if (trimmedLine.match(/^##\s+EDGE/i)) {
        currentSection = 'edge'
      } else if (trimmedLine.match(/^###\s+(TC-\d+)/)) {
        const tcMatch = trimmedLine.match(/^###\s+(TC-\d+)/)
        if (tcMatch && currentSection) {
          const testCase = testCases.find(tc => tc.id === tcMatch[1])
          if (testCase) {
            testCase.category = currentSection
            categorizedTests[currentSection].push(testCase)
          }
        }
      }
    }
    
    // Generate Cypress spec file
    const cypressSpec = `describe('${storyTitle}', () => {
  before(() => {
    // Setup that runs once before all tests in this describe block
    // Include: database setup, test data creation, global configurations
    // TODO: Add environment setup for ${storyKey}
    // TODO: Create test users with appropriate permissions
    // TODO: Initialize test database with required data
  });

  beforeEach(() => {
    // Setup that runs before each individual test
    // Include: login, navigation to starting page, common preconditions
    // TODO: Login with valid test user credentials
    // TODO: Navigate to application starting page
    // TODO: Clear any existing form data or session storage
  });

  after(() => {
    // Cleanup that runs once after all tests in this describe block
    // Include: database cleanup, file cleanup, global teardown
    // TODO: Clean up test data created during test execution
    // TODO: Remove test files from server
    // TODO: Reset database to initial state
  });

  afterEach(() => {
    // Cleanup that runs after each individual test
    // Include: logout, cache clearing, test-specific cleanup
    // TODO: Logout current user session
    // TODO: Clear browser cache and local storage
    // TODO: Reset any modified application state
  });
${categorizedTests.positive.length > 0 ? `
  describe('Positive Test Cases', () => {
${categorizedTests.positive.map((tc: any) => `    it('${tc.id}: ${tc.title}', () => {
${tc.steps.map((step: string, index: number) => `      // Step ${index + 1}: ${step}`).join('\n')}
${tc.expectedResults.map((result: string) => `      // Assertion: ${result}`).join('\n')}
${tc.testData.length > 0 ? `      // Test Data: ${tc.testData.join(', ')}` : ''}
      // Expected Result: Test should pass with expected behavior
    });
`).join('')}  });
` : ''}${categorizedTests.negative.length > 0 ? `
  describe('Negative Test Cases', () => {
${categorizedTests.negative.map((tc: any) => `    it('${tc.id}: ${tc.title}', () => {
${tc.steps.map((step: string, index: number) => `      // Step ${index + 1}: ${step}`).join('\n')}
${tc.expectedResults.map((result: string) => `      // Assertion: ${result}`).join('\n')}
${tc.testData.length > 0 ? `      // Test Data: ${tc.testData.join(', ')}` : ''}
      // Expected Result: Test should handle error/failure gracefully
    });
`).join('')}  });
` : ''}${categorizedTests.edge.length > 0 ? `
  describe('Edge Cases', () => {
${categorizedTests.edge.map((tc: any) => `    it('${tc.id}: ${tc.title}', () => {
${tc.steps.map((step: string, index: number) => `      // Step ${index + 1}: ${step}`).join('\n')}
${tc.expectedResults.map((result: string) => `      // Assertion: ${result}`).join('\n')}
${tc.testData.length > 0 ? `      // Test Data: ${tc.testData.join(', ')}` : ''}
      // Expected Result: Test should handle boundary conditions correctly
    });
`).join('')}  });
` : ''}});`

    return cypressSpec
  }

  // Handle Cypress test generation
  const handleGenerateCypress = async () => {
    if (!result) {
      alert('Please generate manual test cases first')
      return
    }

    setIsGeneratingCypress(true)
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const cypressSpec = generateCypressTests(result)
      setCypressTests(cypressSpec)
    } catch (error) {
      console.error('Error generating Cypress tests:', error)
      alert('Failed to generate Cypress tests')
    } finally {
      setIsGeneratingCypress(false)
    }
  }

  // Download Cypress tests as file
  const downloadCypressTests = () => {
    if (!cypressTests) return
    
    const selectedStory = userStories.find(s => s.id === selectedStoryId)
    const fileName = `${selectedStory?.jiraKey || 'test'}-${selectedStory?.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'spec'}.spec.cy.js`
    
    const blob = new Blob([cypressTests], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Copy Cypress tests to clipboard
  const copyCypressTests = async () => {
    if (!cypressTests) return
    
    try {
      await navigator.clipboard.writeText(cypressTests)
      // You could add a toast notification here
      alert('Cypress tests copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Failed to copy to clipboard')
    }
  }

  const industryContextOptions = [
    { value: 'field-usage', label: 'Field Usage & Mobile Scenarios' },
    { value: 'compliance', label: 'Compliance & Audit Requirements' },
    { value: 'integration', label: 'System Integration & APIs' },
    { value: 'performance', label: 'Performance & Large Files' },
    { value: 'collaboration', label: 'Multi-user Collaboration' },
    { value: 'security', label: 'Security & Access Control' },
    { value: 'offline', label: 'Offline & Connectivity Issues' },
    { value: 'comprehensive', label: 'Comprehensive (All Scenarios)' }
  ]



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowHistory(false)} />
          <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Test Case History
                  </h3>
                  <div className="flex items-center space-x-2">
                    {savedTestCases.length > 0 && (
                      <button
                        onClick={clearSavedTestCases}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Clear all history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {savedTestCases.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No saved test cases yet. Generate some test cases to see them here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedTestCases.map((savedCase) => (
                      <div
                        key={savedCase.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => loadSavedTestCase(savedCase)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {savedCase.userStoryTitle}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(savedCase.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {savedCase.testTypes.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(savedCase.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Generate Test Cases
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <History className="h-4 w-4 mr-2" />
                History ({savedTestCases.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <TestTube className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                AI-Powered Test Case Generation
              </h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Generate comprehensive test cases from your user stories using Claude AI. 
                The system analyzes historical defect patterns and creates positive, negative, and edge case scenarios.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* User Story Selection */}
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Select User Story
                  </label>
                  
                  {/* Smart Filter Component */}
                  <SmartFilter
                    userStories={userStories}
                    onFilterChange={handleFilterChange}
                    qualityThreshold={qualityThreshold}
                    showQualityFilter={true}
                  />
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Loading user stories...</span>
                  </div>
                ) : (
                  <select 
                    value={selectedStoryId}
                    onChange={(e) => handleStorySelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">
                      {filteredUserStories.length === 0 
                        ? 'No user stories found' 
                        : `Select from ${filteredUserStories.length} user stories`}
                    </option>
                    {filteredUserStories.map((story) => (
                      <option key={story.id} value={story.id}>
                        {story.jiraKey ? `${story.jiraKey}: ` : ''}{story.title}
                        {story.component ? ` (${story.component})` : ''}
                        {story.latestQualityScore !== null && story.latestQualityScore !== undefined 
                          ? ` [Score: ${story.latestQualityScore}/10]` 
                          : ' [Not analyzed]'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Story Preview */}
              {selectedStory && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Selected Story: {selectedStory.jiraKey || selectedStory.title}
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    {selectedStory.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedStory.priority && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                        Priority: {selectedStory.priority}
                      </span>
                    )}
                    {selectedStory.component && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                        Component: {selectedStory.component}
                      </span>
                    )}
                    {selectedStory.testCaseCount > 0 && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                        {selectedStory.testCaseCount} existing test cases
                      </span>
                    )}
                    {selectedStoryQualityScore !== null && (
                      <span className={`px-2 py-1 rounded ${
                        selectedStoryQualityScore >= qualityThreshold 
                          ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                          : 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                      }`}>
                        Quality Score: {selectedStoryQualityScore}/10
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Test Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Test Types
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={testTypes.positive}
                      onChange={() => handleTestTypeChange('positive')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Positive Test Cases</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={testTypes.negative}
                      onChange={() => handleTestTypeChange('negative')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Negative Test Cases</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={testTypes.edge}
                      onChange={() => handleTestTypeChange('edge')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Edge Cases</span>
                  </label>
                </div>
              </div>

              {/* Industry Context - Multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry Context & Real-World Usage
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                  {industryContextOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={industryContexts.includes(option.value)}
                        onChange={() => handleIndustryContextChange(option.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Select one or more focus areas for generating industry-specific test cases that reflect real-world usage patterns.
                  {industryContexts.length > 0 && (
                    <span className="block mt-1 font-medium text-blue-600 dark:text-blue-400">
                      Selected: {industryContexts.map(ctx => industryContextOptions.find(opt => opt.value === ctx)?.label).join(', ')}
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedStoryId || industryContexts.length === 0}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Test Cases...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Generate Test Cases
                  </>
                )}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className="mt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generated Test Cases</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(result)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy All
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([result], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `test-cases-${selectedStory?.jiraKey || 'generated'}.txt`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                  </div>
                </div>

                <TestCaseDisplay content={result} />

                {/* Cypress Test Generation Section */}
                <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Code className="h-6 w-6 text-green-600 mr-3" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Cypress Test Automation
                      </h4>
                    </div>
                    <div className="flex gap-2">
                      {cypressTests && (
                        <>
                          <button
                            onClick={() => setShowCypressPreview(true)}
                            className="inline-flex items-center px-3 py-2 border border-green-300 dark:border-green-600 text-sm font-medium rounded-md text-green-700 dark:text-green-200 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Tests
                          </button>
                          <button
                            onClick={copyCypressTests}
                            className="inline-flex items-center px-3 py-2 border border-green-300 dark:border-green-600 text-sm font-medium rounded-md text-green-700 dark:text-green-200 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </button>
                          <button
                            onClick={downloadCypressTests}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Download .spec.cy.js
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Convert your manual test cases into a complete Cypress test specification file with proper structure, 
                      hooks, and detailed comments for your QA automation team.
                    </p>
                    
                    {cypressTests ? (
                      <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                          <span className="text-green-800 dark:text-green-200 font-medium">
                            Cypress tests generated successfully!
                          </span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                          Your test specification includes proper describe blocks, hooks (before/after), 
                          and detailed comments for each test case. Ready for implementation by your automation team.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <TestTube className="h-5 w-5 text-blue-600 mr-3" />
                          <span className="text-blue-800 dark:text-blue-200 font-medium">
                            Ready to generate Cypress tests
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                          Click the button below to convert your manual test cases into a structured Cypress specification file.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateCypress}
                    disabled={isGeneratingCypress || !result}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isGeneratingCypress ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        Generating Cypress Tests...
                      </>
                    ) : (
                      <>
                        <Code className="h-5 w-5 mr-3" />
                        Generate Cypress Tests
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
            How it works
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Product Context:</strong> Uses configured product information (Fusion Live) and industry knowledge</li>
            <li>• <strong>User Story Analysis:</strong> Analyzes acceptance criteria and functional requirements</li>
            <li>• <strong>Historical Learning:</strong> Reviews past defect patterns and similar user stories using RAG</li>
            <li>• <strong>Industry Scenarios:</strong> Generates test cases based on real-world field usage patterns</li>
            <li>• <strong>Multi-Context Testing:</strong> Creates positive, negative, and edge case scenarios</li>
            <li>• <strong>Field-Ready Tests:</strong> Considers mobile usage, offline scenarios, and challenging environments</li>
            <li>• <strong>Compliance Focus:</strong> Includes audit trails, security, and regulatory requirements</li>
          </ul>
          
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-indigo-800 dark:text-indigo-200">
              <strong>💡 Tip:</strong> Use filters to narrow down user stories by priority, status, component, or assignee. 
              Select multiple industry contexts to generate comprehensive test cases covering various real-world scenarios.
            </p>
          </div>
        </div>
      </main>

      {/* Quality Warning Dialog */}
      {showQualityWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedStoryQualityScore === null ? 'Unanalyzed User Story Warning' : 'Low Quality Score Warning'}
              </h3>
            </div>
            <div className="mb-6">
              {selectedStoryQualityScore === null ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    The selected user story has <strong>not been analyzed</strong> for quality yet.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Unanalyzed requirements may result in incomplete or inaccurate test cases. 
                    Consider running a quality analysis first, or proceed with caution.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    The selected user story has a quality score of <strong>{selectedStoryQualityScore}/10</strong>, 
                    which is below the configured threshold of <strong>{qualityThreshold}/10</strong>.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Low-quality requirements may result in incomplete or inaccurate test cases. 
                    Consider improving the user story quality first, or proceed with caution.
                  </p>
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowQualityWarning(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowQualityWarning(false)
                  handleGenerate(true) // Force generation
                }}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Generate Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cypress Preview Modal */}
      {showCypressPreview && cypressTests && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col border border-gray-700/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700/50 bg-gradient-to-r from-[#2d2d30] to-[#252526]">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Code className="h-5 w-5 text-cyan-400" />
                  <span className="text-gray-200 font-medium text-sm">
                    {userStories.find(s => s.id === selectedStoryId)?.jiraKey || 'test'}-spec.cy.js
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                    Cypress E2E Test
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCypressPreview(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 flex overflow-hidden bg-[#1e1e1e]">
              {/* Line Numbers */}
              <div className="bg-[#252526] px-4 py-4 text-gray-500 text-sm font-mono select-none border-r border-gray-700/50 min-w-[60px]">
                {cypressTests.split('\n').map((_, index) => (
                  <div key={index} className="leading-6 text-right pr-2 hover:text-gray-300 transition-colors">
                    {String(index + 1).padStart(3, ' ')}
                  </div>
                ))}
              </div>
              
              {/* Code Content with Enhanced Styling */}
              <div className="flex-1 overflow-auto">
                <pre className="p-4 text-sm font-mono leading-6 whitespace-pre-wrap bg-[#1e1e1e] text-gray-300">
                  <code className="language-javascript">
                    {cypressTests}
                  </code>
                </pre>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-between p-5 border-t border-gray-700/50 bg-gradient-to-r from-[#2d2d30] to-[#252526]">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  <span className="font-medium">{cypressTests.split('\n').length}</span> lines
                </div>
                <div className="text-sm text-gray-400">•</div>
                <div className="text-sm text-gray-400">
                  Cypress Test Specification
                </div>
                <div className="text-sm text-gray-400">•</div>
                <div className="text-sm text-gray-400">
                  JavaScript
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyCypressTests}
                  className="inline-flex items-center px-4 py-2 border border-gray-600/50 text-sm font-medium rounded-lg text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </button>
                <button
                  onClick={downloadCypressTests}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Download File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Component to display formatted test cases
function TestCaseDisplay({ content }: { content: string }) {
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted')
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const toggleSection = (sectionIndex: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionIndex)) {
        newSet.delete(sectionIndex)
      } else {
        newSet.add(sectionIndex)
      }
      return newSet
    })
  }

  // Initialize all sections as expanded on first load
  const [sectionsInitialized, setSectionsInitialized] = useState(false)
  
  // Debug: Check if content is being received
  console.log('🔍 TestCaseDisplay - Component rendered')
  console.log('📝 TestCaseDisplay - Content received:', !!content)
  console.log('📝 TestCaseDisplay - Content length:', content?.length || 0)
  console.log('📝 TestCaseDisplay - Content type:', typeof content)
  console.log('📝 TestCaseDisplay - Content preview (first 500 chars):', content?.substring(0, 500))
  
  // Early return if no content
  if (!content || content.length === 0) {
    console.log('❌ TestCaseDisplay - No content provided')
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            No test case content to display. Please generate test cases first.
          </p>
        </div>
      </div>
    )
  }

  // Parse the test case content into structured format
  const parseTestCases = (content: string) => {
    console.log('🔍 ParseTestCases - Starting to parse content')
    console.log('📝 ParseTestCases - Content length:', content.length)
    console.log('📝 ParseTestCases - First 500 chars:', content.substring(0, 500))
    
    // Test section header detection
    const allSectionMatches = content.match(/^##\s+[A-Z\s&]+.*$/gim)
    console.log('🎯 ParseTestCases - All ## headers found:', allSectionMatches)
    
    const sections: Array<{
      title: string
      type: 'positive' | 'negative' | 'edge' | 'field-usage' | 'compliance' | 'integration' | 'performance' | 'collaboration' | 'security' | 'offline' | 'other'
      testCases: Array<{
        id: string
        title: string
        priority?: string
        preconditions?: string
        steps: string[]
        expectedResults?: string
        testData?: string
        notes?: string
      }>
    }> = []

    // Split content into sections
    const lines = content.split('\n')
    let currentSection: any = null
    let currentTestCase: any = null
    let currentField = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines
      if (!line) continue

      // Detect main section headers (## **POSITIVE TEST CASES** or ## POSITIVE TEST CASES, ## EDGE CASES)
      if (line.match(/^##\s+\*?\*?([A-Z\s&]+(?:TEST\s+)?CASES?)\*?\*?/i)) {
        console.log('🎯 ParseTestCases - Found section header:', line)
        
        // Save previous test case
        if (currentTestCase && currentSection) {
          currentSection.testCases.push(currentTestCase)
          console.log(`📦 ParseTestCases - Saved test case ${currentTestCase.id} to section "${currentSection.title}"`)
        }
        
        // Create new section
        const sectionTitle = line.replace(/^##\s*\*?\*?/, '').replace(/\*?\*?$/, '').trim()
        console.log('📝 ParseTestCases - Creating section with title:', sectionTitle)
        
        let sectionType: 'positive' | 'negative' | 'edge' | 'field-usage' | 'compliance' | 'integration' | 'performance' | 'collaboration' | 'security' | 'offline' | 'other' = 'other'
        
        const titleLower = sectionTitle.toLowerCase()
        if (titleLower.includes('positive')) {
          sectionType = 'positive'
        } else if (titleLower.includes('negative')) {
          sectionType = 'negative'
        } else if (titleLower.includes('edge')) {
          sectionType = 'edge'
        } else if (titleLower.includes('field') || titleLower.includes('mobile')) {
          sectionType = 'field-usage'
        } else if (titleLower.includes('compliance') || titleLower.includes('audit')) {
          sectionType = 'compliance'
        } else if (titleLower.includes('integration') || titleLower.includes('api')) {
          sectionType = 'integration'
        } else if (titleLower.includes('performance') || titleLower.includes('large')) {
          sectionType = 'performance'
        } else if (titleLower.includes('collaboration') || titleLower.includes('multi-user')) {
          sectionType = 'collaboration'
        } else if (titleLower.includes('security') || titleLower.includes('access')) {
          sectionType = 'security'
        } else if (titleLower.includes('offline') || titleLower.includes('connectivity')) {
          sectionType = 'offline'
        } else {
          sectionType = 'other'
        }
        
        currentSection = {
          title: sectionTitle,
          type: sectionType,
          testCases: []
        }
        sections.push(currentSection)
        console.log(`✅ ParseTestCases - Added section "${sectionTitle}" (type: ${sectionType}). Total sections: ${sections.length}`)
        
        currentTestCase = null
        currentField = ''
        continue
      }

      // Detect test case headers (### **TC-001: Title** or ### TC-001: Title)
      if (line.match(/^###\s+\*?\*?(TC-?\w*\d+):\s*/i)) {
        console.log('🧪 ParseTestCases - Found test case header:', line)
        
        // Save previous test case
        if (currentTestCase && currentSection) {
          currentSection.testCases.push(currentTestCase)
          console.log(`📦 ParseTestCases - Saved previous test case ${currentTestCase.id} to section "${currentSection.title}"`)
        }
        
        // Create new section if needed
        if (!currentSection) {
          currentSection = {
            title: 'Test Cases',
            type: 'positive',
            testCases: []
          }
          sections.push(currentSection)
        }
        
        // Extract test case info
        const testCaseMatch = line.match(/^###\s+\*?\*?(TC-?\w*\d+):\s*(.*?)\*?\*?$/i)
        
        currentTestCase = {
          id: testCaseMatch ? testCaseMatch[1] : `TC${(currentSection?.testCases.length || 0) + 1}`,
          title: testCaseMatch ? testCaseMatch[2].replace(/\*\*/g, '').trim() : line.replace(/^###\s*\*?\*?/, '').replace(/\*?\*?$/, '').trim(),
          steps: [],
          priority: 'Medium'
        }
        currentField = ''
        continue
      }

      // Skip if no current test case
      if (!currentTestCase) continue

      // Detect field headers (- **Priority:** High)
      if (line.match(/^-?\s*\*\*(Priority|Type|Preconditions?|Test Steps?|Steps?|Expected Results?|Test Data|Notes?).*?\*\*:?\s*/i)) {
        const fieldMatch = line.match(/^-?\s*\*\*(Priority|Type|Preconditions?|Test Steps?|Steps?|Expected Results?|Test Data|Notes?).*?\*\*:?\s*(.*)/i)
        if (fieldMatch) {
          const fieldName = fieldMatch[1].toLowerCase()
          const fieldValue = fieldMatch[2].trim()
          
          if (fieldName.includes('priority')) {
            currentField = 'priority'
            currentTestCase.priority = fieldValue || 'Medium'
          } else if (fieldName.includes('type')) {
            currentField = 'type'
          } else if (fieldName.includes('precondition')) {
            currentField = 'preconditions'
            currentTestCase.preconditions = fieldValue
          } else if (fieldName.includes('step')) {
            currentField = 'steps'
            if (fieldValue) currentTestCase.steps.push(fieldValue)
          } else if (fieldName.includes('expected') || fieldName.includes('result')) {
            currentField = 'expectedResults'
            currentTestCase.expectedResults = fieldValue
          } else if (fieldName.includes('data')) {
            currentField = 'testData'
            currentTestCase.testData = fieldValue
          } else if (fieldName.includes('note')) {
            currentField = 'notes'
            currentTestCase.notes = fieldValue
          }
        }
        continue
      }

      // Handle numbered steps (1. Step content)
      if (line.match(/^\d+\.\s+/) && currentField === 'steps') {
        const stepContent = line.replace(/^\d+\.\s+/, '')
        currentTestCase.steps.push(stepContent)
        continue
      }

      // Handle bullet points (- Content)
      if (line.match(/^[-•]\s+/)) {
        const bulletContent = line.replace(/^[-•]\s+/, '')
        
        if (currentField === 'steps') {
          currentTestCase.steps.push(bulletContent)
        } else if (currentField === 'expectedResults') {
          if (currentTestCase.expectedResults) {
            currentTestCase.expectedResults += '\n- ' + bulletContent
          } else {
            currentTestCase.expectedResults = '- ' + bulletContent
          }
        } else if (currentField === 'preconditions') {
          if (currentTestCase.preconditions) {
            currentTestCase.preconditions += '\n- ' + bulletContent
          } else {
            currentTestCase.preconditions = '- ' + bulletContent
          }
        } else if (currentField === 'testData') {
          if (currentTestCase.testData) {
            currentTestCase.testData += '\n- ' + bulletContent
          } else {
            currentTestCase.testData = '- ' + bulletContent
          }
        }
        continue
      }

      // Handle continuation of current field (multiline content)
      if (currentField && line && !line.match(/^(##|###|\*\*)/)) {
        if (currentField === 'preconditions') {
          if (currentTestCase.preconditions) {
            currentTestCase.preconditions += '\n' + line
          } else {
            currentTestCase.preconditions = line
          }
        } else if (currentField === 'expectedResults') {
          if (currentTestCase.expectedResults) {
            currentTestCase.expectedResults += '\n' + line
          } else {
            currentTestCase.expectedResults = line
          }
        } else if (currentField === 'testData') {
          if (currentTestCase.testData) {
            currentTestCase.testData += '\n' + line
          } else {
            currentTestCase.testData = line
          }
        } else if (currentField === 'notes') {
          if (currentTestCase.notes) {
            currentTestCase.notes += '\n' + line
          } else {
            currentTestCase.notes = line
          }
        }
      }
    }

    // Add the last test case
    if (currentTestCase && currentSection) {
      currentSection.testCases.push(currentTestCase)
      console.log(`📦 ParseTestCases - Saved final test case ${currentTestCase.id} to section "${currentSection.title}"`)
    }

    console.log('🏁 ParseTestCases - Parsing complete!')
    console.log(`📊 ParseTestCases - Final result: ${sections.length} sections`)
    sections.forEach((section, i) => {
      console.log(`   Section ${i+1}: "${section.title}" (${section.type}) - ${section.testCases.length} test cases`)
    })

    return sections
  }

  const sections = parseTestCases(content)
  
  // Initialize all sections as expanded on first load
  if (!sectionsInitialized && sections.length > 0) {
    setExpandedSections(new Set(sections.map((_, index) => index)))
    setSectionsInitialized(true)
  }
  
  // Debug: Log parsed sections in browser console
  console.log('🔍 TestCaseDisplay - Parsed sections:', sections)
  console.log('📊 TestCaseDisplay - Section summary:', sections.map(s => ({ title: s.title, type: s.type, count: s.testCases.length })))
  console.log('📝 TestCaseDisplay - Content length:', content.length)
  console.log('📝 TestCaseDisplay - Content preview:', content.substring(0, 200))
  
  // Debug: Check if sections are empty
  if (sections.length === 0) {
    console.log('❌ TestCaseDisplay - No sections parsed from content')
  } else {
    const totalTestCases = sections.reduce((sum, section) => sum + section.testCases.length, 0)
    console.log(`✅ TestCaseDisplay - Found ${sections.length} sections with ${totalTestCases} total test cases`)
    
    // Debug each section
    sections.forEach((section, i) => {
      console.log(`   Section ${i+1}: "${section.title}" (${section.type}) - ${section.testCases.length} test cases`)
      if (section.testCases.length === 0) {
        console.log(`   ⚠️ Section "${section.title}" has no test cases!`)
      }
    })
  }

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'negative': return <XCircle className="h-5 w-5 text-red-600" />
      case 'edge': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'field-usage': return <TestTube className="h-5 w-5 text-blue-600" />
      case 'compliance': return <FileText className="h-5 w-5 text-purple-600" />
      case 'integration': return <Settings className="h-5 w-5 text-indigo-600" />
      case 'performance': return <TrendingUp className="h-5 w-5 text-orange-600" />
      case 'collaboration': return <Users className="h-5 w-5 text-teal-600" />
      case 'security': return <Shield className="h-5 w-5 text-red-700" />
      case 'offline': return <Wifi className="h-5 w-5 text-gray-600" />
      default: return <TestTube className="h-5 w-5 text-blue-600" />
    }
  }

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-green-200 bg-green-50 dark:bg-green-900/20'
      case 'negative': return 'border-red-200 bg-red-50 dark:bg-red-900/20'
      case 'edge': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
      case 'field-usage': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
      case 'compliance': return 'border-purple-200 bg-purple-50 dark:bg-purple-900/20'
      case 'integration': return 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20'
      case 'performance': return 'border-orange-200 bg-orange-50 dark:bg-orange-900/20'
      case 'collaboration': return 'border-teal-200 bg-teal-50 dark:bg-teal-900/20'
      case 'security': return 'border-red-300 bg-red-100 dark:bg-red-900/30'
      case 'offline': return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20'
      default: return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('formatted')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'formatted'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Formatted View
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'raw'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Raw Output
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'formatted' ? (
        <div className="space-y-6">
          {sections.length > 0 ? (
            <>
              {/* Collapse/Expand All Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const allExpanded = sections.every((_, index) => expandedSections.has(index))
                    if (allExpanded) {
                      setExpandedSections(new Set())
                    } else {
                      setExpandedSections(new Set(sections.map((_, index) => index)))
                    }
                  }}
                  className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {sections.every((_, index) => expandedSections.has(index)) ? (
                    <>
                      <ChevronRight className="h-3 w-3 mr-1" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Expand All
                    </>
                  )}
                                 </button>
               </div>
               
               {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className={`border rounded-lg ${getSectionColor(section.type)}`}>
                <button
                  onClick={() => toggleSection(sectionIndex)}
                  className="w-full px-4 py-3 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center">
                    {getSectionIcon(section.type)}
                    <h4 className="ml-2 text-lg font-medium text-gray-900 dark:text-white text-left">
                      {section.title}
                    </h4>
                    <span className="ml-auto text-sm text-gray-500 mr-2">
                      {section.testCases.length} test case{section.testCases.length !== 1 ? 's' : ''}
                    </span>
                    {expandedSections.has(sectionIndex) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {expandedSections.has(sectionIndex) && (
                  <div className="p-4 space-y-4">
                  {section.testCases.map((testCase, testIndex) => (
                    <div key={testIndex} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {testCase.id}: {testCase.title}
                          </h5>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(testCase.priority || 'Medium')}`}>
                          {testCase.priority || 'Medium'}
                        </span>
                      </div>

                      {testCase.preconditions && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preconditions:</h6>
                          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{testCase.preconditions}</div>
                        </div>
                      )}

                      {testCase.steps.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Test Steps:</h6>
                          <ol className="list-decimal list-inside space-y-1">
                            {testCase.steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="text-sm text-gray-600 dark:text-gray-400">
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {testCase.expectedResults && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Results:</h6>
                          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{testCase.expectedResults}</div>
                        </div>
                      )}

                      {testCase.testData && (
                        <div className="mb-3">
                          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Data:</h6>
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded whitespace-pre-line">
                            {testCase.testData}
                          </div>
                        </div>
                      )}

                      {testCase.notes && (
                        <div>
                          <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes:</h6>
                          <div className="text-sm text-gray-600 dark:text-gray-400 italic whitespace-pre-line">{testCase.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                )}
              </div>
            ))}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Generated Test Cases</h4>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
                  {content}
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300 max-h-96 overflow-y-auto">
            {content}
          </pre>
        </div>
      )}
    </div>
  )
}