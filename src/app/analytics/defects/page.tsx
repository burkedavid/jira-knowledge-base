'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, TrendingUp, AlertTriangle, Target, RefreshCw, Calendar, Filter, Send, MessageSquare, HelpCircle, Shield, Activity, Brain, Play, Settings } from 'lucide-react'
import DefectPatternsAnalysis from '@/components/DefectPatternsAnalysis'
import ReactMarkdown from 'react-markdown'

interface DefectAnalytics {
  summary: {
    totalDefects: number
    patternsFound: number
    hotspots: number
    riskScore: number | null
  }
  defectsBySeverity: Array<{ severity: string; count: number }>
  defectsByComponent: Array<{ component: string; count: number }>
  defectsByStatus: Array<{ status: string; count: number }>
  monthlyTrends: Array<{
    month: string
    count: number
    critical: number
    high: number
    medium: number
    low: number
  }>
  defectPatterns: Array<{ rootCause: string; frequency: number }>
  componentHotspots: Array<{
    component: string
    defectCount: number
    riskLevel: string
  }>
  timeframe: string
  component?: string
}

interface DefectQueryInterfaceProps {
  timeframe: string
  component: string
  onAnalyze: () => void
}

function DefectQueryInterface({ timeframe, component, onAnalyze }: DefectQueryInterfaceProps) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch('/api/analytics/defects/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          timeframe,
          component: component || undefined
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to analyze query')
      }

      const data = await res.json()
      setResponse(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const exampleQueries = [
    "What's the worst functionality this year for defects?",
    "Which components have the most critical defects?",
    "What are the most common root causes?",
    "Show me authentication-related issues",
    "What defect patterns should we focus on?"
  ]

  return (
    <div className="space-y-6">
      {/* Current Analysis Context */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Current Analysis Context
          </span>
        </div>
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <span className="font-medium">Timeframe:</span> {
            timeframe === '7d' ? 'Last 7 days' :
            timeframe === '30d' ? 'Last 30 days' :
            timeframe === '90d' ? 'Last 90 days' :
            timeframe === '1y' ? 'Last year' :
            timeframe === 'all' ? 'All time' : timeframe
          }
          {component && (
            <>
              <span className="mx-2">•</span>
              <span className="font-medium">Component:</span> {component}
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ask a question about your defect patterns
          </label>
          <div className="relative">
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., What are the most critical defect patterns in the authentication component?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              rows={3}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Try:</span>
          {exampleQueries.slice(0, 3).map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setQuery(example)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
            >
              "{example}"
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {response && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">AI Analysis Results</h4>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown 
              components={{
                h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-6">{children}</h1>,
                h2: ({children}) => <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-5">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">{children}</h3>,
                h4: ({children}) => <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2 mt-3">{children}</h4>,
                p: ({children}) => <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700 dark:text-gray-300">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700 dark:text-gray-300">{children}</ol>,
                li: ({children}) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                em: ({children}) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
                code: ({children}) => <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200">{children}</code>,
                blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-3">{children}</blockquote>,
                hr: () => <hr className="border-gray-200 dark:border-gray-700 my-4" />
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
          <button
            onClick={onAnalyze}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
          >
            Run full AI pattern analysis with these filters →
          </button>
        </div>
      )}
    </div>
  )
}

export default function DefectAnalyticsPage() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<DefectAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('')
  const [selectedComponent, setSelectedComponent] = useState<string>('')
  const [availableComponents, setAvailableComponents] = useState<string[]>([])
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load available components on mount
  useEffect(() => {
    const loadComponents = async () => {
      try {
        // Get all unique components from defects table (not filtered by timeframe)
        const response = await fetch('/api/defects')
        if (response.ok) {
          const data = await response.json()
          // Extract unique components from all defects
          const uniqueComponents = Array.from(new Set(
            data.defects
              .map((defect: any) => defect.component)
              .filter((component: string) => component && component.trim() !== '')
          )) as string[]
          
          setAvailableComponents(uniqueComponents.sort())
        }
      } catch (error) {
        console.error('Error loading components:', error)
        // Fallback: try the analytics endpoint
        try {
          const response = await fetch('/api/analytics/defects?timeframe=all')
          if (response.ok) {
            const data = await response.json()
            const components = data.defectsByComponent?.map((item: any) => item.component) || []
            setAvailableComponents(components)
          }
        } catch (fallbackError) {
          console.error('Fallback component loading also failed:', fallbackError)
        }
      } finally {
        setIsInitialized(true)
      }
    }
    loadComponents()
  }, [])

  const fetchAnalytics = async () => {
    if (!timeframe) return
    
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({ timeframe })
      if (selectedComponent) {
        params.append('component', selectedComponent)
      }
      
      const response = await fetch(`/api/analytics/defects?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = () => {
    if (timeframe) {
      fetchAnalytics()
      setHasAnalyzed(true)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Initializing defect analytics...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI-Powered Defect Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Comprehensive defect pattern analysis using Claude 4 and RAG technology
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Brain className="h-4 w-4" />
              <span>Powered by Claude 4 + RAG</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Analysis Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Analysis Configuration
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Select your analysis parameters. All data and AI analysis will be based on these selections.
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Timeframe Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Analysis Timeframe *
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select timeframe...</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                  <option value="all">All time (with smart sampling)</option>
                </select>
              </div>

              {/* Component Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Filter className="h-4 w-4 inline mr-1" />
                  Component Filter
                </label>
                <select
                  value={selectedComponent}
                  onChange={(e) => setSelectedComponent(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All components</option>
                  {availableComponents.map((component) => (
                    <option key={component} value={component}>
                      {component}
                    </option>
                  ))}
                </select>
              </div>

              {/* Analyze Button */}
              <div className="flex items-end">
                <button
                  onClick={handleAnalyze}
                  disabled={!timeframe || loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {loading ? 'Analyzing...' : 'Start Analysis'}
                </button>
              </div>
            </div>

            {/* Current Selection Display */}
            {timeframe && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Data Scope for AI Analysis
                  </span>
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-medium">Timeframe:</span> {
                    timeframe === '7d' ? 'Last 7 days' :
                    timeframe === '30d' ? 'Last 30 days' :
                    timeframe === '90d' ? 'Last 90 days' :
                    timeframe === '1y' ? 'Last year' :
                    timeframe === 'all' ? 'All time (intelligent sampling will be used for large datasets)' : timeframe
                  }
                  {selectedComponent && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="font-medium">Component:</span> {selectedComponent}
                    </>
                  )}
                  {!selectedComponent && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="font-medium">Component:</span> All components
                    </>
                  )}
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  All analytics, charts, and AI analysis will be based on this data scope.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Show content only after analysis is started */}
        {!hasAnalyzed && timeframe && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Brain className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Ready to Analyze
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Click "Start Analysis" to begin AI-powered defect pattern analysis
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Analysis scope: {
                timeframe === '7d' ? 'Last 7 days' :
                timeframe === '30d' ? 'Last 30 days' :
                timeframe === '90d' ? 'Last 90 days' :
                timeframe === '1y' ? 'Last year' :
                timeframe === 'all' ? 'All time' : timeframe
              }
              {selectedComponent && ` • ${selectedComponent} component`}
            </p>
          </div>
        )}

        {!timeframe && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Settings className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Configure Your Analysis
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Select a timeframe to begin defect pattern analysis
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose your analysis parameters above to get started
            </p>
          </div>
        )}

        {/* Analysis Results - Only show after analysis is run */}
        {hasAnalyzed && analytics && (
          <>
            {/* AI-Powered Defect Pattern Analysis - Full Width Report */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      AI-Powered Defect Pattern Analysis Report
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Comprehensive intelligent pattern recognition using Claude 4 and RAG • Generated {new Date().toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Timeframe: {
                      timeframe === '7d' ? 'Last 7 days' :
                      timeframe === '30d' ? 'Last 30 days' :
                      timeframe === '90d' ? 'Last 90 days' :
                      timeframe === '1y' ? 'Last year' :
                      timeframe === 'all' ? 'All time' : timeframe
                    }</span>
                    {selectedComponent && <span>• Component: {selectedComponent}</span>}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <DefectPatternsAnalysis 
                  timeframe={
                    timeframe === '7d' ? 'last_30_days' :
                    timeframe === '30d' ? 'last_30_days' :
                    timeframe === '90d' ? 'last_90_days' :
                    timeframe === '1y' ? 'last_year' :
                    timeframe === 'all' ? 'all' :
                    'last_90_days'
                  } 
                  component={selectedComponent}
                />
              </div>
            </div>

            {/* RAG Query Interface */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Interactive Defect Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Ask natural language questions about your defect patterns and get AI-powered insights
                </p>
              </div>
              <div className="p-6">
                <DefectQueryInterface 
                  timeframe={timeframe} 
                  component={selectedComponent}
                  onAnalyze={handleAnalyze}
                />
              </div>
            </div>

            {/* Supporting Analytics - Grid Layout */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Supporting Analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Additional metrics and breakdowns filtered by your selected timeframe and component
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Component Hotspots */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Component Hotspots
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Components with highest defect concentrations in selected timeframe
                    </p>
                  </div>
                  <div className="p-6">
                    {loading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Loading hotspots...</p>
                      </div>
                    ) : analytics?.componentHotspots && analytics.componentHotspots.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.componentHotspots.map((hotspot, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {hotspot.component}
                              </span>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {hotspot.defectCount} defects
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(hotspot.riskLevel)}`}>
                              {hotspot.riskLevel} Risk
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No component hotspots identified.</p>
                        <p className="text-sm mt-2">No high-risk components found in selected timeframe.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Defects by Severity */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Severity Distribution
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Breakdown of defects by severity level in selected timeframe
                    </p>
                  </div>
                  <div className="p-6">
                    {loading ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">Loading severity data...</p>
                      </div>
                    ) : analytics?.defectsBySeverity && analytics.defectsBySeverity.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.defectsBySeverity.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className={`text-sm px-2 py-1 rounded-full ${getSeverityColor(item.severity)}`}>
                              {item.severity}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.count} defects
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No severity data available.</p>
                        <p className="text-sm mt-2">No defects found in selected timeframe.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Trends - Full Width */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Historical Trends
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Monthly defect trends and patterns over time (filtered by component if selected)
                  </p>
                </div>
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Loading trends...</p>
                    </div>
                  ) : analytics?.monthlyTrends && analytics.monthlyTrends.length > 0 ? (
                    <div className="space-y-6">
                      {/* Chart */}
                      <div className="h-80 w-full bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <svg viewBox="0 0 900 280" className="w-full h-full">
                          {/* Definitions */}
                          <defs>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                            </linearGradient>
                            <linearGradient id="criticalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6"/>
                              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
                            </linearGradient>
                            <linearGradient id="highGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#f97316" stopOpacity="0.5"/>
                              <stop offset="100%" stopColor="#f97316" stopOpacity="0.1"/>
                            </linearGradient>
                          </defs>
                          
                          {/* Chart area */}
                          <g transform="translate(70, 30)">
                            {(() => {
                              const chartWidth = 760
                              const chartHeight = 200
                              const allCounts = analytics.monthlyTrends.map(t => t.count)
                              const minCount = Math.min(...allCounts)
                              const maxCount = Math.max(...allCounts)
                              const padding = (maxCount - minCount) * 0.1 // 10% padding
                              const yMin = Math.max(0, minCount - padding)
                              const yMax = maxCount + padding
                              const yRange = yMax - yMin
                              const stepX = chartWidth / Math.max(analytics.monthlyTrends.length - 1, 1)
                              
                              // Generate points for different severity levels (stacked areas)
                              const generateStackedPoints = () => {
                                const criticalPoints: string[] = []
                                const highPoints: string[] = []
                                const totalPoints: string[] = []
                                
                                analytics.monthlyTrends.forEach((trend, index) => {
                                  const x = index * stepX
                                  const criticalY = chartHeight - ((trend.critical - yMin) / yRange) * chartHeight
                                  const highY = chartHeight - (((trend.critical + trend.high) - yMin) / yRange) * chartHeight
                                  const totalY = chartHeight - ((trend.count - yMin) / yRange) * chartHeight
                                  
                                  criticalPoints.push(`${x},${criticalY}`)
                                  highPoints.push(`${x},${highY}`)
                                  totalPoints.push(`${x},${totalY}`)
                                })
                                
                                return { criticalPoints, highPoints, totalPoints }
                              }
                              
                              const { criticalPoints, highPoints, totalPoints } = generateStackedPoints()
                              
                              // Create area paths
                              const createAreaPath = (points: string[], baseline: number = chartHeight) => {
                                if (points.length === 0) return ''
                                const firstPoint = points[0].split(',')
                                const lastPoint = points[points.length - 1].split(',')
                                return `M${firstPoint[0]},${baseline} L${points.join(' L')} L${lastPoint[0]},${baseline} Z`
                              }

                              return (
                                <>
                                  {/* Grid lines */}
                                  {[0, 1, 2, 3, 4].map(i => {
                                    const y = (chartHeight / 4) * i
                                    const value = yMax - (yRange / 4) * i
                                    return (
                                      <g key={i}>
                                        <line
                                          x1="0"
                                          y1={y}
                                          x2={chartWidth}
                                          y2={y}
                                          stroke="#e5e7eb"
                                          strokeWidth="1"
                                          strokeDasharray="2,2"
                                        />
                                        <text
                                          x="-10"
                                          y={y + 4}
                                          textAnchor="end"
                                          className="text-xs fill-gray-500"
                                        >
                                          {Math.round(value)}
                                        </text>
                                      </g>
                                    )
                                  })}

                                  {/* Area fills */}
                                  <path
                                    d={createAreaPath(totalPoints)}
                                    fill="url(#areaGradient)"
                                  />
                                  
                                  {/* Lines */}
                                  <polyline
                                    points={totalPoints.join(' ')}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                  />

                                  {/* Data points */}
                                  {totalPoints.map((point, index) => {
                                    const [x, y] = point.split(',').map(Number)
                                    return (
                                      <circle
                                        key={index}
                                        cx={x}
                                        cy={y}
                                        r="4"
                                        fill="#3b82f6"
                                        stroke="white"
                                        strokeWidth="2"
                                      />
                                    )
                                  })}

                                  {/* X-axis labels */}
                                  {analytics.monthlyTrends.map((trend, index) => {
                                    const x = index * stepX
                                    return (
                                      <text
                                        key={index}
                                        x={x}
                                        y={chartHeight + 20}
                                        textAnchor="middle"
                                        className="text-xs fill-gray-500"
                                      >
                                        {trend.month}
                                      </text>
                                    )
                                  })}
                                </>
                              )
                            })()}
                          </g>

                          {/* Legend */}
                          <g transform="translate(70, 260)">
                            <circle cx="0" cy="0" r="4" fill="#3b82f6" />
                            <text x="10" y="4" className="text-xs fill-gray-600">Total Defects</text>
                            
                            <line x1="100" y1="0" x2="120" y2="0" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
                            <text x="125" y="4" className="text-xs fill-gray-600">Critical Defects</text>
                            
                            <rect x="250" y="-8" width="16" height="16" fill="url(#areaGradient)" />
                            <text x="270" y="4" className="text-xs fill-gray-600">Trend Area</text>
                          </g>
                        </svg>
                      </div>

                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(() => {
                          const totalDefects = analytics.monthlyTrends.reduce((sum, trend) => sum + trend.count, 0)
                          const criticalDefects = analytics.monthlyTrends.reduce((sum, trend) => sum + trend.critical, 0)
                          const highDefects = analytics.monthlyTrends.reduce((sum, trend) => sum + trend.high, 0)
                          const avgPerMonth = Math.round(totalDefects / analytics.monthlyTrends.length)
                          const latestMonth = analytics.monthlyTrends[analytics.monthlyTrends.length - 1]?.count || 0
                          const previousMonth = analytics.monthlyTrends[analytics.monthlyTrends.length - 2]?.count || 0
                          const monthlyChange = previousMonth > 0 ? ((latestMonth - previousMonth) / previousMonth * 100) : 0

                          return (
                            <>
                              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalDefects}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Total Defects</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{analytics.monthlyTrends.length} months</div>
                              </div>
                              
                              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalDefects}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Critical</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{totalDefects > 0 ? ((criticalDefects / totalDefects) * 100).toFixed(1) : 0}% of total</div>
                              </div>
                              
                              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{highDefects}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">High</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{totalDefects > 0 ? ((highDefects / totalDefects) * 100).toFixed(1) : 0}% of total</div>
                              </div>
                              
                              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{avgPerMonth}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Avg/Month</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
                                </div>
                              </div>
                            </>
                          )
                        })()}
                      </div>

                      {/* Trend Analysis */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Trend Analysis</h5>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {(() => {
                            const latestMonth = analytics.monthlyTrends[analytics.monthlyTrends.length - 1]?.count || 0
                            const previousMonth = analytics.monthlyTrends[analytics.monthlyTrends.length - 2]?.count || 0
                            const monthlyChange = previousMonth > 0 ? ((latestMonth - previousMonth) / previousMonth * 100) : 0
                            
                            if (monthlyChange > 10) {
                              return `Defect rate is increasing by ${monthlyChange.toFixed(1)}% compared to previous month. Consider immediate action to address quality issues.`
                            } else if (monthlyChange < -10) {
                              return `Defect rate is decreasing by ${Math.abs(monthlyChange).toFixed(1)}% compared to previous month. Good progress! Quality improvements are showing results.`
                            } else {
                              return `Defect rate is relatively stable with ${monthlyChange.toFixed(1)}% change compared to previous month. Monitor trends for emerging patterns.`
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No trend data available.</p>
                      <p className="text-sm mt-2">No defects found in selected timeframe to generate trends.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
} 