'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, TestTube } from 'lucide-react'

interface TestCaseDisplayProps {
  content: string
}

export default function TestCaseDisplay({ content }: TestCaseDisplayProps) {
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted')
  
  // Parse the test case content into structured format
  const parseTestCases = (content: string) => {
    const sections: Array<{
      title: string
      type: 'positive' | 'negative' | 'edge' | 'other'
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

    // Split content into lines and process
    const lines = content.split('\n')
    let currentSection: any = null
    let currentTestCase: any = null
    let currentField = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines
      if (!line) continue

      // Detect section headers (## POSITIVE TEST CASES)
      if (line.match(/^##\s+/)) {
        // Save previous test case
        if (currentTestCase && currentSection) {
          currentSection.testCases.push(currentTestCase)
          currentTestCase = null
        }
        
        const sectionTitle = line.replace(/^##\s*/, '').trim()
        let sectionType: 'positive' | 'negative' | 'edge' | 'other' = 'positive'
        
        if (sectionTitle.toLowerCase().includes('negative')) {
          sectionType = 'negative'
        } else if (sectionTitle.toLowerCase().includes('edge')) {
          sectionType = 'edge'
        }
        
        currentSection = {
          title: sectionTitle,
          type: sectionType,
          testCases: []
        }
        sections.push(currentSection)
        continue
      }

      // Skip main title (# Title)
      if (line.match(/^#\s+/) && !line.match(/^##/)) {
        continue
      }

      // Detect test case headers (### TC-001: Title)
      if (line.match(/^###\s+TC-?\d+:/i)) {
        // Save previous test case
        if (currentTestCase && currentSection) {
          currentSection.testCases.push(currentTestCase)
        }
        
        // Create default section if none exists
        if (!currentSection) {
          currentSection = {
            title: 'Test Cases',
            type: 'positive',
            testCases: []
          }
          sections.push(currentSection)
        }
        
        // Extract test case info
        const testCaseMatch = line.match(/^###\s+(TC-?\d+):\s*(.*)/i)
        
        currentTestCase = {
          id: testCaseMatch ? testCaseMatch[1] : `TC${(currentSection?.testCases.length || 0) + 1}`,
          title: testCaseMatch ? testCaseMatch[2] : line.replace(/^###\s*/, '').trim(),
          steps: [],
          priority: 'Medium'
        }
        currentField = ''
        continue
      }

      // Detect field headers (**Priority:** High)
      if (line.match(/^\*\*(Priority|Preconditions?|Test Steps?|Steps?|Expected Results?|Test Data|Notes?).*?\*\*:?\s*/i)) {
        const fieldMatch = line.match(/^\*\*(Priority|Preconditions?|Test Steps?|Steps?|Expected Results?|Test Data|Notes?).*?\*\*:?\s*(.*)/i)
        if (fieldMatch && currentTestCase) {
          const fieldName = fieldMatch[1].toLowerCase()
          const fieldValue = fieldMatch[2].trim()
          
          if (fieldName.includes('priority')) {
            currentField = 'priority'
            currentTestCase.priority = fieldValue || 'Medium'
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
      if (line.match(/^\d+\.\s+/) && currentTestCase) {
        const stepContent = line.replace(/^\d+\.\s+/, '')
        currentTestCase.steps.push(stepContent)
        currentField = 'steps'
        continue
      }

      // Handle bullet points (- Bullet content)
      if (line.match(/^[-•]\s+/) && currentTestCase) {
        const bulletContent = line.replace(/^[-•]\s+/, '')
        
        if (currentField === 'preconditions') {
          if (currentTestCase.preconditions) {
            currentTestCase.preconditions += '\n- ' + bulletContent
          } else {
            currentTestCase.preconditions = '- ' + bulletContent
          }
        } else if (currentField === 'expectedResults') {
          if (currentTestCase.expectedResults) {
            currentTestCase.expectedResults += '\n- ' + bulletContent
          } else {
            currentTestCase.expectedResults = '- ' + bulletContent
          }
        } else if (currentField === 'testData') {
          if (currentTestCase.testData) {
            currentTestCase.testData += '\n- ' + bulletContent
          } else {
            currentTestCase.testData = '- ' + bulletContent
          }
        } else {
          // Default to steps
          currentTestCase.steps.push(bulletContent)
          currentField = 'steps'
        }
        continue
      }

      // Handle horizontal rules (---)
      if (line.match(/^---+$/)) {
        if (currentTestCase && currentSection) {
          currentSection.testCases.push(currentTestCase)
          currentTestCase = null
          currentField = ''
        }
        continue
      }

      // Handle continuation of multiline fields
      if (currentTestCase && currentField && line) {
        // Skip if it's another field header or section header
        if (line.match(/^\*\*/) || line.match(/^##/) || line.match(/^###/)) {
          i-- // Let the next iteration handle this line
          continue
        }
        
        if (currentField === 'preconditions') {
          currentTestCase.preconditions = (currentTestCase.preconditions || '') + '\n' + line
        } else if (currentField === 'expectedResults') {
          currentTestCase.expectedResults = (currentTestCase.expectedResults || '') + '\n' + line
        } else if (currentField === 'testData') {
          currentTestCase.testData = (currentTestCase.testData || '') + '\n' + line
        } else if (currentField === 'notes') {
          currentTestCase.notes = (currentTestCase.notes || '') + '\n' + line
        }
      }
    }

    // Don't forget to add the last test case
    if (currentTestCase && currentSection) {
      currentSection.testCases.push(currentTestCase)
    }

    console.log('🔍 Parsed sections:', sections.length)
    sections.forEach((section, index) => {
      console.log(`📁 Section ${index + 1}: "${section.title}" (${section.type}) - ${section.testCases.length} test cases`)
      section.testCases.forEach((tc, tcIndex) => {
        console.log(`  📝 TC ${tcIndex + 1}: ${tc.id} - "${tc.title}" (${tc.steps.length} steps)`)
      })
    })

    return sections
  }

  // Early return if no content
  if (!content || content.length === 0) {
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

  const sections = parseTestCases(content)

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'negative': return <XCircle className="h-5 w-5 text-red-600" />
      case 'edge': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default: return <TestTube className="h-5 w-5 text-blue-600" />
    }
  }

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-green-200 bg-green-50 dark:bg-green-900/20'
      case 'negative': return 'border-red-200 bg-red-50 dark:bg-red-900/20'
      case 'edge': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
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
            sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className={`border rounded-lg ${getSectionColor(section.type)}`}>
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center">
                    {getSectionIcon(section.type)}
                    <h4 className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                      {section.title}
                    </h4>
                    <span className="ml-auto text-sm text-gray-500">
                      {section.testCases.length} test case{section.testCases.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
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
              </div>
            ))
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