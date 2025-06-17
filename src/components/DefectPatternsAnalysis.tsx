'use client'

import { useState, useEffect } from 'react'
import { Brain, AlertTriangle, TrendingUp, Target, Shield, TestTube, Lightbulb, RefreshCw, Download, Copy, ChevronDown, ChevronRight, Save, History, Clock, Trash2 } from 'lucide-react'

interface DefectPattern {
  id: string
  name: string
  description: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  frequency: number
  affectedComponents: string[]
  rootCauses: string[]
  businessImpact: string
  preventionStrategy: string
  testingRecommendations: string[]
  relatedDefects: string[]
  confidence: number
}

interface DefectPatternAnalysis {
  patterns: DefectPattern[]
  insights: {
    overallTrend: string
    riskAssessment: string
    priorityActions: string[]
    qualityMetrics: {
      patternDiversity: number
      componentCoverage: number
      severityDistribution: Record<string, number>
    }
  }
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
}

interface DefectPatternsAnalysisProps {
  timeframe?: string
  component?: string
}

export default function DefectPatternsAnalysis({ timeframe = 'last_90_days', component }: DefectPatternsAnalysisProps) {
  const [analysis, setAnalysis] = useState<DefectPatternAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set())
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [savedAnalyses, setSavedAnalyses] = useState<Array<{
    id: string
    title: string
    content: string
    timestamp: string
    timeframe: string
    component: string
    severity: string
    patternsCount: number
  }>>([])
  const [showHistory, setShowHistory] = useState(false)

  const analyzePatterns = async () => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      console.log('🔍 Starting defect pattern analysis...')
      
      const timeRangeMap: Record<string, number> = {
        'last_30_days': 30,
        'last_60_days': 60,
        'last_90_days': 90,
        'last_180_days': 180,
        'last_year': 365,
        'all': 36500 // ~100 years - triggers "all time" analysis with smart sampling
      }

      const response = await fetch('/api/analyze/defect-patterns-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          component: component || 'all',
          timeRange: timeRangeMap[timeframe] || 90,
          severity: selectedSeverity === 'all' ? null : selectedSeverity,
          includeResolved: true
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.analysis) {
        setAnalysis(data.analysis)
        console.log('✅ Pattern analysis completed:', data.analysis)
        
        // Auto-save the analysis to localStorage
        saveAnalysisToStorage(data.analysis)
      } else {
        throw new Error(data.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('❌ Pattern analysis error:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Load saved analyses from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedDefectAnalyses')
    if (saved) {
      try {
        setSavedAnalyses(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved analyses:', error)
      }
    }
  }, [])

  useEffect(() => {
    analyzePatterns()
  }, [timeframe, component, selectedSeverity])

  // Save analysis to localStorage
  const saveAnalysisToStorage = (analysisData: DefectPatternAnalysis) => {
    const timeframeLabel = timeframe === 'last_30_days' ? 'Last 30 days' :
                          timeframe === 'last_60_days' ? 'Last 60 days' :
                          timeframe === 'last_90_days' ? 'Last 90 days' :
                          timeframe === 'last_180_days' ? 'Last 180 days' :
                          timeframe === 'last_year' ? 'Last year' :
                          timeframe === 'all' ? 'All time' : timeframe

    const componentLabel = component || 'All Components'
    const severityLabel = selectedSeverity === 'all' ? 'All Severities' : selectedSeverity

    const analysisContent = `AI-Powered Defect Pattern Analysis Report
Generated: ${new Date().toLocaleString()}
Timeframe: ${timeframeLabel}
Component: ${componentLabel}
Severity Filter: ${severityLabel}

=== SUMMARY ===
Patterns Identified: ${analysisData.patterns.length}
Overall Trend: ${analysisData.insights.overallTrend}
Risk Assessment: ${analysisData.insights.riskAssessment}

=== PATTERNS IDENTIFIED ===
${analysisData.patterns.map((pattern, index) => `
${index + 1}. ${pattern.name} (${pattern.severity})
   Frequency: ${pattern.frequency} occurrences
   Components: ${pattern.affectedComponents.join(', ')}
   Root Causes: ${pattern.rootCauses.join(', ')}
   Business Impact: ${pattern.businessImpact}
   Prevention: ${pattern.preventionStrategy}
   Testing: ${pattern.testingRecommendations.join(', ')}
   Confidence: ${Math.round(pattern.confidence * 100)}%
`).join('\n')}

=== INSIGHTS ===
Overall Trend: ${analysisData.insights.overallTrend}
Risk Assessment: ${analysisData.insights.riskAssessment}
Priority Actions: ${analysisData.insights.priorityActions.join(', ')}

=== RECOMMENDATIONS ===
Immediate: ${analysisData.recommendations.immediate.join(', ')}
Short-term: ${analysisData.recommendations.shortTerm.join(', ')}
Long-term: ${analysisData.recommendations.longTerm.join(', ')}
`

    const newAnalysis = {
      id: Date.now().toString(),
      title: `Defect Analysis - ${componentLabel} (${timeframeLabel})`,
      content: analysisContent,
      timestamp: new Date().toISOString(),
      timeframe: timeframeLabel,
      component: componentLabel,
      severity: severityLabel,
      patternsCount: analysisData.patterns.length
    }

    const updated = [newAnalysis, ...savedAnalyses].slice(0, 10) // Keep only last 10
    setSavedAnalyses(updated)
    localStorage.setItem('savedDefectAnalyses', JSON.stringify(updated))

    // Show save notification
    showNotification('Analysis saved to history', 'success')
  }

  // Parse and format saved analysis content for better display
  const parseAnalysisContent = (content: string) => {
    const lines = content.split('\n')
    const sections: { [key: string]: string[] } = {}
    let currentSection = ''
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('===') && trimmed.endsWith('===')) {
        currentSection = trimmed.replace(/=/g, '').trim()
        sections[currentSection] = []
      } else if (currentSection && trimmed) {
        sections[currentSection].push(trimmed)
      } else if (!currentSection && trimmed) {
        if (!sections['Header']) sections['Header'] = []
        sections['Header'].push(trimmed)
      }
    })
    
    return sections
  }

  // Load a saved analysis
  const loadSavedAnalysis = (savedAnalysis: typeof savedAnalyses[0]) => {
    setShowHistory(false)
    
    const sections = parseAnalysisContent(savedAnalysis.content)
    
    // Create a modal to display the saved analysis content with better formatting
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-50 overflow-y-auto'
    
    const formatSection = (title: string, content: string[]) => {
      if (!content || content.length === 0) return ''
      
      const sectionClass = title === 'SUMMARY' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                          title === 'PATTERNS IDENTIFIED' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                          title === 'INSIGHTS' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' :
                          title === 'RECOMMENDATIONS' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                          'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
      
      const iconClass = title === 'SUMMARY' ? '📊' :
                       title === 'PATTERNS IDENTIFIED' ? '🔍' :
                       title === 'INSIGHTS' ? '💡' :
                       title === 'RECOMMENDATIONS' ? '🎯' : '📋'
      
      return `
        <div class="border rounded-lg p-4 mb-4 ${sectionClass}">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <span class="mr-2">${iconClass}</span>
            ${title}
          </h4>
          <div class="space-y-2">
            ${content.map(line => {
              if (line.match(/^\d+\./)) {
                // Numbered items
                return `<div class="ml-4 text-sm text-gray-700 dark:text-gray-300">${line}</div>`
              } else if (line.includes(':')) {
                // Key-value pairs
                const [key, ...valueParts] = line.split(':')
                const value = valueParts.join(':').trim()
                return `<div class="text-sm"><span class="font-medium text-gray-900 dark:text-white">${key}:</span> <span class="text-gray-700 dark:text-gray-300">${value}</span></div>`
              } else {
                // Regular text
                return `<div class="text-sm text-gray-700 dark:text-gray-300">${line}</div>`
              }
            }).join('')}
          </div>
        </div>
      `
    }
    
    modal.innerHTML = `
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${savedAnalysis.title}</h3>
              <div class="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
                <span>📅 ${new Date(savedAnalysis.timestamp).toLocaleString()}</span>
                <span>🔍 ${savedAnalysis.patternsCount} patterns</span>
                <span>⏱️ ${savedAnalysis.timeframe}</span>
                <span>🏗️ ${savedAnalysis.component}</span>
              </div>
            </div>
            <button id="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="p-6 overflow-y-auto max-h-[65vh]">
            ${sections['Header'] ? `
              <div class="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <h4 class="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center">
                  <span class="mr-2">📋</span>
                  Analysis Details
                </h4>
                ${sections['Header'].map(line => `<div class="text-sm text-indigo-800 dark:text-indigo-200">${line}</div>`).join('')}
              </div>
            ` : ''}
            
            ${Object.entries(sections).filter(([key]) => key !== 'Header').map(([title, content]) => 
              formatSection(title, content)
            ).join('')}
          </div>
          
          <div class="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Generated by AI-Powered Defect Pattern Analysis
            </div>
            <div class="flex space-x-3">
              <button id="copyContent" class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md">
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <button id="downloadContent" class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Add event listeners
    const closeModal = () => {
      document.body.removeChild(modal)
    }
    
    modal.querySelector('#closeModal')?.addEventListener('click', closeModal)
    modal.querySelector('.bg-black')?.addEventListener('click', closeModal)
    
    modal.querySelector('#copyContent')?.addEventListener('click', () => {
      navigator.clipboard.writeText(savedAnalysis.content)
      showNotification('Content copied to clipboard', 'success')
    })
    
    modal.querySelector('#downloadContent')?.addEventListener('click', () => {
      const blob = new Blob([savedAnalysis.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${savedAnalysis.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    
    showNotification('Analysis loaded from history', 'info')
  }

  // Clear all saved analyses
  const clearSavedAnalyses = () => {
    setSavedAnalyses([])
    localStorage.removeItem('savedDefectAnalyses')
    showNotification('Analysis history cleared', 'info')
  }

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'info' | 'error') => {
    const notification = document.createElement('div')
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg z-50`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }

  const togglePatternExpansion = (patternId: string) => {
    const newExpanded = new Set(expandedPatterns)
    if (newExpanded.has(patternId)) {
      newExpanded.delete(patternId)
    } else {
      newExpanded.add(patternId)
    }
    setExpandedPatterns(newExpanded)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
      case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const downloadAnalysis = () => {
    if (!analysis) return
    
    const content = `Defect Pattern Analysis Report
Generated: ${new Date().toLocaleString()}
Timeframe: ${timeframe}
Component: ${component || 'All'}

=== PATTERNS IDENTIFIED ===
${analysis.patterns.map((pattern, index) => `
${index + 1}. ${pattern.name} (${pattern.severity})
   Frequency: ${pattern.frequency} occurrences
   Components: ${pattern.affectedComponents.join(', ')}
   Root Causes: ${pattern.rootCauses.join(', ')}
   Business Impact: ${pattern.businessImpact}
   Prevention: ${pattern.preventionStrategy}
   Testing: ${pattern.testingRecommendations.join(', ')}
   Confidence: ${Math.round(pattern.confidence * 100)}%
`).join('\n')}

=== INSIGHTS ===
Overall Trend: ${analysis.insights.overallTrend}
Risk Assessment: ${analysis.insights.riskAssessment}
Priority Actions: ${analysis.insights.priorityActions.join(', ')}

=== RECOMMENDATIONS ===
Immediate: ${analysis.recommendations.immediate.join(', ')}
Short-term: ${analysis.recommendations.shortTerm.join(', ')}
Long-term: ${analysis.recommendations.longTerm.join(', ')}
`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `defect-patterns-analysis-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100">Analysis Failed</h3>
            <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
            <button
              onClick={analyzePatterns}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center">
          <Brain className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            AI Analyzing Defect Patterns...
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Claude 4 is analyzing your defects using RAG to identify patterns and insights
          </p>
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span className="text-sm text-indigo-600">Processing defect data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Analysis Available
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Click the button below to start AI-powered defect pattern analysis
          </p>
          <button
            onClick={analyzePatterns}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
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
                    Analysis History
                  </h3>
                  <div className="flex items-center space-x-2">
                    {savedAnalyses.length > 0 && (
                      <button
                        onClick={clearSavedAnalyses}
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
                {savedAnalyses.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No saved analyses yet. Run some defect pattern analyses to see them here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedAnalyses.map((savedAnalysis) => (
                      <div
                        key={savedAnalysis.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => loadSavedAnalysis(savedAnalysis)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {savedAnalysis.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(savedAnalysis.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="space-y-1 mb-2">
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Timeframe:</span>
                            <span className="ml-1">{savedAnalysis.timeframe}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Component:</span>
                            <span className="ml-1">{savedAnalysis.component}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Severity:</span>
                            <span className="ml-1">{savedAnalysis.severity}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                            {savedAnalysis.patternsCount} patterns
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(savedAnalysis.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI-Powered Defect Pattern Analysis
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {analysis.patterns.length} patterns identified • Powered by Claude 4 + RAG
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              title="View saved analyses"
            >
              <History className="h-4 w-4 mr-1" />
              History
              {savedAnalyses.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                  {savedAnalyses.length}
                </span>
              )}
            </button>
            <button
              onClick={() => analysis && saveAnalysisToStorage(analysis)}
              disabled={!analysis}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save analysis to history"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              onClick={analyzePatterns}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Refresh analysis"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={downloadAnalysis}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Download report"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary - Compact Layout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Executive Summary</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Director-level quality assessment and business impact analysis</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Trend */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Quality Trajectory</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Business impact assessment</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-11">
                {analysis.insights.overallTrend}
              </p>
            </div>

            {/* Risk Assessment */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Business Risk Level</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Current exposure and impact</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-11">
                {analysis.insights.riskAssessment}
              </p>
            </div>
          </div>

          {/* Quality Metrics Bar */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-300">Top {Math.min(10, analysis.patterns.length)} Critical Patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-300">{analysis.insights.qualityMetrics.componentCoverage} Components Analyzed</span>
                </div>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {Object.values(analysis.insights.qualityMetrics.severityDistribution).reduce((a, b) => a + b, 0)} Total Defects
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Critical Patterns */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top 10 Critical Patterns ({Math.min(10, analysis.patterns.length)})
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Ranked by business impact
            </span>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {analysis.patterns.slice(0, 10).map((pattern, index) => (
            <div key={pattern.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                onClick={() => togglePatternExpansion(pattern.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {pattern.name}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(pattern.severity)}`}>
                          {pattern.severity}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {pattern.frequency} occurrences
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {Math.round(pattern.confidence * 100)}% confidence
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {pattern.affectedComponents.length} components
                        </span>
                      </div>
                    </div>
                    {expandedPatterns.has(pattern.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(pattern.description)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Copy pattern details"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedPatterns.has(pattern.id) && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Description</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {pattern.description}
                      </p>

                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Affected Components</h5>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pattern.affectedComponents.map((component, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs">
                            {component}
                          </span>
                        ))}
                      </div>

                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Root Causes</h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {pattern.rootCauses.map((cause, index) => (
                          <li key={index}>• {cause}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Business Impact</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {pattern.businessImpact}
                      </p>

                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Prevention Strategy</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {pattern.preventionStrategy}
                      </p>

                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Testing Recommendations</h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {pattern.testingRecommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <TestTube className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100">Immediate Actions</h3>
          </div>
          <ul className="space-y-2">
            {analysis.recommendations.immediate.map((action, index) => (
              <li key={index} className="text-sm text-red-800 dark:text-red-200">
                • {action}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <TrendingUp className="h-6 w-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100">Short-term (1-3 months)</h3>
          </div>
          <ul className="space-y-2">
            {analysis.recommendations.shortTerm.map((action, index) => (
              <li key={index} className="text-sm text-yellow-800 dark:text-yellow-200">
                • {action}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <Lightbulb className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100">Long-term (6+ months)</h3>
          </div>
          <ul className="space-y-2">
            {analysis.recommendations.longTerm.map((action, index) => (
              <li key={index} className="text-sm text-green-800 dark:text-green-200">
                • {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Priority Actions */}
      {analysis.insights.priorityActions.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <Target className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-100">Priority Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.insights.priorityActions.map((action, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-indigo-800 dark:text-indigo-200">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
} 