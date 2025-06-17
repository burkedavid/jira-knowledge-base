'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, TrendingUp, AlertTriangle, Target, RefreshCw, Calendar, Filter, Send, MessageSquare, HelpCircle, Shield, Activity, Brain, Play, Settings, Save, History, Clock, Trash2, FileText, Copy } from 'lucide-react'
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

interface SavedReport {
  id: string
  title: string
  query: string
  response: string
  timestamp: string
  timeframe: string
  component: string
  description: string
}

function DefectQueryInterface({ timeframe, component, onAnalyze }: DefectQueryInterfaceProps) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoAnalysisTriggered, setAutoAnalysisTriggered] = useState(false)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [showSavedReports, setShowSavedReports] = useState(false)
  const [reportTitle, setReportTitle] = useState('')

  // Load saved reports on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedDefectReports')
    if (saved) {
      try {
        setSavedReports(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved reports:', error)
      }
    }
  }, [])

  // Auto-trigger comprehensive analysis for "all time" timeframe
  useEffect(() => {
    if (timeframe === 'all' && !autoAnalysisTriggered && !response) {
      setAutoAnalysisTriggered(true)
      setQuery("Generate a System Quality Baseline Report with comprehensive Business Risk Coverage analysis")
      // Auto-submit after a short delay to allow UI to update
      setTimeout(() => {
        handleAutoSubmit("Generate a System Quality Baseline Report with comprehensive Business Risk Coverage analysis")
      }, 1000)
    } else if (timeframe !== 'all') {
      setAutoAnalysisTriggered(false)
    }
  }, [timeframe, autoAnalysisTriggered, response])

  const saveReport = () => {
    if (!response || !query) return

    const timeframeLabel = timeframe === '7d' ? 'Last 7 days' :
                          timeframe === '30d' ? 'Last 30 days' :
                          timeframe === '90d' ? 'Last 90 days' :
                          timeframe === '1y' ? 'Last year' :
                          timeframe === 'all' ? 'All time' : timeframe

    const componentLabel = component || 'All Components'
    
    const defaultTitle = reportTitle.trim() || 
      `${query.includes('System Quality Baseline') ? 'System Baseline Report' :
        query.includes('Business Risk Coverage') ? 'BRC Analysis' :
        query.includes('automation') ? 'Automation Intelligence' :
        'Defect Analysis'} - ${timeframeLabel}`

    const description = `${query} (${componentLabel}, ${timeframeLabel})`

    const newReport: SavedReport = {
      id: Date.now().toString(),
      title: defaultTitle,
      query: query.trim(),
      response,
      timestamp: new Date().toISOString(),
      timeframe: timeframeLabel,
      component: componentLabel,
      description
    }

    const updatedReports = [newReport, ...savedReports].slice(0, 20) // Keep only last 20
    setSavedReports(updatedReports)
    localStorage.setItem('savedDefectReports', JSON.stringify(updatedReports))
    setReportTitle('')
    
    // Show success notification
    alert('Report saved successfully!')
  }

  const loadSavedReport = (report: SavedReport) => {
    setQuery(report.query)
    setResponse(report.response)
    setShowSavedReports(false)
  }

  const deleteSavedReport = (reportId: string) => {
    const updatedReports = savedReports.filter(r => r.id !== reportId)
    setSavedReports(updatedReports)
    localStorage.setItem('savedDefectReports', JSON.stringify(updatedReports))
  }

  const clearAllReports = () => {
    if (confirm('Are you sure you want to delete all saved reports?')) {
      setSavedReports([])
      localStorage.removeItem('savedDefectReports')
    }
  }

  const copyReportToClipboard = async (report: SavedReport) => {
    const reportText = `# ${report.title}
Generated: ${new Date(report.timestamp).toLocaleString()}
Query: ${report.query}
Context: ${report.description}

---

${report.response}`

    try {
      await navigator.clipboard.writeText(reportText)
      alert('Report copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleAutoSubmit = async (autoQuery: string) => {
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
          query: autoQuery,
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

  // Enhanced queries based on Intelligence Generation Framework
  const getContextualQueries = (timeframe: string) => {
    if (timeframe === 'all') {
      return [
        "Generate a System Quality Baseline Report with automation ROI analysis",
        "What are the top 10 Business Risk Coverage priorities for new automation engineers?",
        "Create a comprehensive defect hotspot map with technical debt indicators",
        "Analyze quality trajectory and predict intervention points needed",
        "Generate role-specific action intelligence for the entire development team"
      ]
    } else {
      return [
        "Generate Executive Intelligence summary with risk assessment for this period",
        "What Business Risk Coverage patterns emerged and what's the damage × frequency analysis?",
        "Identify quality momentum changes and trend velocity for strategic planning",
        "Create automation ROI calculator for the highest impact opportunities",
        "Generate predictive intelligence for upcoming quality interventions needed"
      ]
    }
  }

  const exampleQueries = getContextualQueries(timeframe)

  return (
    <div className="space-y-6">
      {/* Enhanced Intelligence System Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Enhanced Defect Analytics Intelligence System
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Business Risk Coverage (BRC) + AI-Powered Strategic Intelligence
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Current Context</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Timeframe:</span> {
                timeframe === '7d' ? 'Last 7 days' :
                timeframe === '30d' ? 'Last 30 days' :
                timeframe === '90d' ? 'Last 90 days' :
                timeframe === '1y' ? 'Last year' :
                timeframe === 'all' ? 'All time - System Baseline' : timeframe
              }
              {component && (
                <>
                  <br />
                  <span className="font-medium">Component:</span> {component}
                </>
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Intelligence Mode</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {timeframe === 'all' ? (
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  📊 System Quality Baseline Report
                </span>
              ) : (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  📈 Periodic Quality Intelligence
                </span>
              )}
            </div>
          </div>
        </div>

        {timeframe === 'all' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Play className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Auto-Analysis Active
              </span>
            </div>
            <p className="text-xs text-orange-800 dark:text-orange-200">
              Generating comprehensive System Quality Baseline Report with automation ROI analysis, defect hotspots, and role-specific action intelligence.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {timeframe === 'all' ? 
              'Generate Strategic Intelligence Reports' : 
              'Ask Questions Using Intelligence Framework'
            }
          </label>
          <div className="relative">
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={timeframe === 'all' ? 
                "e.g., Generate role-specific action intelligence for test automation engineers" :
                "e.g., What Business Risk Coverage patterns emerged this period?"
              }
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
              {loading ? 'Generating Intelligence...' : 'Generate Report'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {timeframe === 'all' ? 'Strategic Intelligence Templates:' : 'Intelligence Framework Queries:'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setQuery(example)}
                className="text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {example}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {timeframe === 'all' ? 
                        'Strategic baseline analysis with long-term planning insights' :
                        'Tactical intelligence for immediate action and trend analysis'
                      }
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {response && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {timeframe === 'all' ? 
                      'System Quality Baseline Intelligence Report' : 
                      'Strategic Quality Intelligence Analysis'
                    }
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Generated using Business Risk Coverage (BRC) methodology + AI-powered insights
                  </p>
                </div>
              </div>
              
              {/* Save Report Controls */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Report title (optional)"
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white w-48"
                />
                <button
                  onClick={saveReport}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  title="Save report for demos"
                >
                  <Save className="h-4 w-4" />
                  Save Report
                </button>
                <button
                  onClick={() => setShowSavedReports(true)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  title="View saved reports"
                >
                  <History className="h-4 w-4" />
                  Saved ({savedReports.length})
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown 
              components={{
                h1: ({children}) => (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                    {children}
                  </h1>
                ),
                h2: ({children}) => (
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6 pb-1 border-b border-gray-100 dark:border-gray-800">
                    {children}
                  </h2>
                ),
                h3: ({children}) => (
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 mt-5 flex items-center">
                    <span className="w-1 h-5 bg-blue-500 mr-3 rounded"></span>
                    {children}
                  </h3>
                ),
                h4: ({children}) => (
                  <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2 mt-4 flex items-center">
                    <span className="w-1 h-4 bg-gray-400 mr-2 rounded"></span>
                    {children}
                  </h4>
                ),
                p: ({children}) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed text-sm">{children}</p>,
                ul: ({children}) => <ul className="list-none mb-4 space-y-2 text-gray-700 dark:text-gray-300 ml-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300 ml-2">{children}</ol>,
                li: ({children}) => (
                  <li className="text-gray-700 dark:text-gray-300 text-sm flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>{children}</span>
                  </li>
                ),
                strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                em: ({children}) => <em className="italic text-blue-600 dark:text-blue-400 font-medium">{children}</em>,
                code: ({children}) => <code className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-sm font-mono border border-blue-200 dark:border-blue-800">{children}</code>,
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/10 pl-4 pr-4 py-3 italic text-orange-800 dark:text-orange-300 my-4 rounded-r">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="border-gray-200 dark:border-gray-700 my-6" />
              }}
            >
              {response}
            </ReactMarkdown>
            </div>
            <div className="px-6 pb-4">
              <button
                onClick={onAnalyze}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
              >
                Run full AI pattern analysis with these filters →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Reports Sidebar */}
      {showSavedReports && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSavedReports(false)} />
          <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Saved Reports
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    {savedReports.length > 0 && (
                      <button
                        onClick={clearAllReports}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Clear all reports"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowSavedReports(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Perfect for demos and presentations
                </p>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {savedReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      No saved reports yet
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Generate reports and save them for easy access during demos
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedReports.map((report) => (
                      <div
                        key={report.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                            {report.title}
                          </h4>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => copyReportToClipboard(report)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteSavedReport(report.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title="Delete report"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{new Date(report.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Context:</span> {report.timeframe} • {report.component}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            <span className="font-medium">Query:</span> {report.query}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => loadSavedReport(report)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Load Report
                          </button>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {Math.round(report.response.length / 1000)}k chars
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
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [showSavedReports, setShowSavedReports] = useState(false)
  const [viewingReport, setViewingReport] = useState<SavedReport | null>(null)

  // Load available components and saved reports on mount
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

    // Load saved reports from localStorage
    const loadSavedReports = () => {
      try {
        const saved = localStorage.getItem('savedDefectReports')
        if (saved) {
          setSavedReports(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Error loading saved reports:', error)
      }
    }

    loadComponents()
    loadSavedReports()
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

  // Helper functions for saved reports management
  const loadSavedReport = (report: SavedReport) => {
    // Simply display the saved report without running new analysis
    setViewingReport(report)
    setShowSavedReports(false)
    
    // Set the timeframe and component to match the saved report for context
    setTimeframe(
      report.timeframe === 'Last 7 days' ? '7d' :
      report.timeframe === 'Last 30 days' ? '30d' :
      report.timeframe === 'Last 90 days' ? '90d' :
      report.timeframe === 'Last year' ? '1y' :
      report.timeframe === 'All time' ? 'all' : ''
    )
    
    if (report.component !== 'All Components') {
      setSelectedComponent(report.component)
    } else {
      setSelectedComponent('')
    }
    
    // Mark as analyzed to show the report viewing section
    setHasAnalyzed(true)
  }

  const deleteSavedReport = (reportId: string) => {
    const updatedReports = savedReports.filter(r => r.id !== reportId)
    setSavedReports(updatedReports)
    localStorage.setItem('savedDefectReports', JSON.stringify(updatedReports))
  }

  const clearAllReports = () => {
    if (confirm('Are you sure you want to delete all saved reports?')) {
      setSavedReports([])
      localStorage.removeItem('savedDefectReports')
    }
  }

  const copyReportToClipboard = async (report: SavedReport) => {
    const reportText = `# ${report.title}
Generated: ${new Date(report.timestamp).toLocaleString()}
Query: ${report.query}
Context: ${report.description}

---

${report.response}`

    try {
      await navigator.clipboard.writeText(reportText)
      alert('Report copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const closeReportViewer = () => {
    setViewingReport(null)
    setHasAnalyzed(false)
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

        {/* Saved Reports Section - Show when there are saved reports */}
        {savedReports.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Saved Analysis Reports
                  </h2>
                  <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {savedReports.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSavedReports(!showSavedReports)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showSavedReports ? 'Hide' : 'Show'} Reports
                  </button>
                  {savedReports.length > 0 && (
                    <button
                      onClick={clearAllReports}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                      title="Clear all saved reports"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Access your previously saved defect analysis reports and insights
              </p>
            </div>
            
            {showSavedReports && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                            {report.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => copyReportToClipboard(report)}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            title="Copy to clipboard"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteSavedReport(report.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Delete report"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{new Date(report.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Context:</span> {report.timeframe} • {report.component}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          <span className="font-medium">Query:</span> {report.query}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => loadSavedReport(report)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <FileText className="h-3 w-3" />
                          Load Report
                        </button>
                        <span className="text-xs text-gray-400">
                          {new Date(report.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {savedReports.length === 0 && (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No saved reports yet. Run some analyses to see them here.
                    </p>
                  </div>
                )}
              </div>
            )}
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

        {/* Saved Report Viewer */}
        {viewingReport && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {viewingReport.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Saved Report • Generated {new Date(viewingReport.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyReportToClipboard(viewingReport)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                  <button
                    onClick={closeReportViewer}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 text-sm text-blue-800 dark:text-blue-200">
                  <span><strong>Query:</strong> {viewingReport.query}</span>
                  <span><strong>Context:</strong> {viewingReport.timeframe} • {viewingReport.component}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{viewingReport.response}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results - Only show after analysis is run */}
        {hasAnalyzed && !viewingReport && analytics && (
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
                      {/* Enhanced Professional Chart with Better Label Space */}
                      <div className="h-[28rem] w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <svg viewBox="0 0 1000 400" className="w-full h-full">
                          {/* Enhanced Definitions */}
                          <defs>
                            {/* Main area gradient */}
                            <linearGradient id="mainAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
                              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                            </linearGradient>
                            
                            {/* Critical severity gradient */}
                            <linearGradient id="criticalAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7"/>
                              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.3"/>
                              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
                            </linearGradient>
                            
                            {/* High severity gradient */}
                            <linearGradient id="highAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#f97316" stopOpacity="0.6"/>
                              <stop offset="50%" stopColor="#f97316" stopOpacity="0.3"/>
                              <stop offset="100%" stopColor="#f97316" stopOpacity="0.1"/>
                            </linearGradient>
                            
                            {/* Glow filters */}
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                              <feMerge> 
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                            
                            {/* Drop shadow */}
                            <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                            </filter>
                          </defs>
                          
                          {/* Enhanced Chart Area */}
                          <g transform="translate(80, 40)">
                            {(() => {
                              const chartWidth = 840
                              const chartHeight = 220
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
                                  {/* Enhanced Background Grid */}
                                  <rect 
                                    x="0" 
                                    y="0" 
                                    width={chartWidth} 
                                    height={chartHeight} 
                                    fill="rgba(255,255,255,0.02)" 
                                    stroke="rgba(156,163,175,0.1)" 
                                    strokeWidth="1" 
                                    rx="8"
                                  />
                                  
                                  {/* Horizontal Grid Lines */}
                                  {[0, 1, 2, 3, 4, 5].map(i => {
                                    const y = (chartHeight / 5) * i
                                    const value = yMax - (yRange / 5) * i
                                    return (
                                      <g key={i}>
                                        <line
                                          x1="0"
                                          y1={y}
                                          x2={chartWidth}
                                          y2={y}
                                          stroke={i === 5 ? "#374151" : "#e5e7eb"}
                                          strokeWidth={i === 5 ? "2" : "1"}
                                          strokeDasharray={i === 5 ? "none" : "3,3"}
                                          opacity={i === 5 ? "0.8" : "0.4"}
                                        />
                                        <text
                                          x="-15"
                                          y={y + 4}
                                          textAnchor="end"
                                          className="text-xs fill-gray-600 dark:fill-gray-400 font-medium"
                                        >
                                          {Math.round(value)}
                                        </text>
                                      </g>
                                    )
                                  })}

                                  {/* Vertical Grid Lines */}
                                  {analytics.monthlyTrends.map((_, index) => {
                                    const x = index * stepX
                                    return (
                                      <line
                                        key={index}
                                        x1={x}
                                        y1="0"
                                        x2={x}
                                        y2={chartHeight}
                                        stroke="#e5e7eb"
                                        strokeWidth="1"
                                        strokeDasharray="2,4"
                                        opacity="0.3"
                                      />
                                    )
                                  })}

                                  {/* Critical Severity Area */}
                                  {criticalPoints.length > 0 && (
                                    <path
                                      d={createAreaPath(criticalPoints)}
                                      fill="url(#criticalAreaGradient)"
                                      filter="url(#dropshadow)"
                                    />
                                  )}

                                  {/* High Severity Area */}
                                  {highPoints.length > 0 && (
                                    <path
                                      d={createAreaPath(highPoints)}
                                      fill="url(#highAreaGradient)"
                                      filter="url(#dropshadow)"
                                    />
                                  )}

                                  {/* Main Total Area */}
                                  <path
                                    d={createAreaPath(totalPoints)}
                                    fill="url(#mainAreaGradient)"
                                    filter="url(#dropshadow)"
                                  />
                                  
                                  {/* Main Line with Glow Effect */}
                                  <polyline
                                    points={totalPoints.join(' ')}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3"
                                    filter="url(#glow)"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />

                                  {/* Critical Line */}
                                  {criticalPoints.length > 0 && (
                                    <polyline
                                      points={criticalPoints.join(' ')}
                                      fill="none"
                                      stroke="#ef4444"
                                      strokeWidth="2"
                                      strokeDasharray="4,4"
                                      strokeLinecap="round"
                                    />
                                  )}

                                  {/* Enhanced Data Points */}
                                  {totalPoints.map((point, index) => {
                                    const [x, y] = point.split(',').map(Number)
                                    const trend = analytics.monthlyTrends[index]
                                    return (
                                      <g key={index}>
                                        {/* Outer glow circle */}
                                        <circle
                                          cx={x}
                                          cy={y}
                                          r="8"
                                          fill="#3b82f6"
                                          opacity="0.2"
                                        />
                                        {/* Main data point */}
                                        <circle
                                          cx={x}
                                          cy={y}
                                          r="5"
                                          fill="#3b82f6"
                                          stroke="white"
                                          strokeWidth="3"
                                          filter="url(#dropshadow)"
                                        />
                                        {/* Enhanced hover tooltip area */}
                                        <circle
                                          cx={x}
                                          cy={y}
                                          r="20"
                                          fill="transparent"
                                          className="cursor-pointer hover:stroke-blue-400 hover:stroke-2"
                                        >
                                          <title>
                                            {trend.month}: {trend.count} total defects
                                            {trend.critical > 0 && `\n${trend.critical} critical`}
                                            {trend.high > 0 && `\n${trend.high} high severity`}
                                            {trend.medium > 0 && `\n${trend.medium} medium severity`}
                                            {trend.low > 0 && `\n${trend.low} low severity`}
                                          </title>
                                        </circle>
                                      </g>
                                    )
                                  })}

                                  {/* Improved X-axis labels with smart spacing */}
                                  {analytics.monthlyTrends.map((trend, index) => {
                                    const x = index * stepX
                                    const totalLabels = analytics.monthlyTrends.length
                                    
                                    // Smart label showing logic based on data density
                                    let shouldShowLabel = true
                                    let labelInterval = 1
                                    
                                    if (totalLabels > 20) {
                                      labelInterval = 4 // Show every 4th label
                                      shouldShowLabel = index % 4 === 0 || index === totalLabels - 1
                                    } else if (totalLabels > 15) {
                                      labelInterval = 3 // Show every 3rd label
                                      shouldShowLabel = index % 3 === 0 || index === totalLabels - 1
                                    } else if (totalLabels > 10) {
                                      labelInterval = 2 // Show every 2nd label
                                      shouldShowLabel = index % 2 === 0 || index === totalLabels - 1
                                    }
                                    
                                    // Always show first and last labels
                                    if (index === 0 || index === totalLabels - 1) {
                                      shouldShowLabel = true
                                    }
                                    
                                    return (
                                      <g key={index}>
                                        {shouldShowLabel && (
                                          <text
                                            x={x}
                                            y={chartHeight + (totalLabels > 12 ? 35 : 25)}
                                            textAnchor={totalLabels > 12 ? "end" : "middle"}
                                            className="text-xs fill-gray-700 dark:fill-gray-300 font-medium"
                                            transform={totalLabels > 12 ? `rotate(-45, ${x}, ${chartHeight + 35})` : ''}
                                          >
                                            {/* Smart label formatting based on timeframe and space */}
                                            {(() => {
                                              // For "All Time" with years, handle differently
                                              if (trend.month.includes('202') || trend.month.includes('201')) {
                                                // This is a month with year (e.g., "Jan 2023")
                                                if (totalLabels > 20) {
                                                  // Very crowded: show "Jan23" format (3-letter month + 2-digit year)
                                                  const parts = trend.month.split(' ')
                                                  return parts[0] + parts[1]?.substring(2) || trend.month
                                                } else if (totalLabels > 15) {
                                                  // Crowded: show "Jan'23" format
                                                  return trend.month.replace(' 20', "'")
                                                } else {
                                                  // Normal: show full "Jan 2023"
                                                  return trend.month
                                                }
                                              } else {
                                                // This is just a month name, use original logic
                                                return totalLabels > 15 ? trend.month.substring(0, 6) : trend.month
                                              }
                                            })()}
                                          </text>
                                        )}
                                        {/* Tick marks - different sizes for labeled vs unlabeled */}
                                        <line
                                          x1={x}
                                          y1={chartHeight}
                                          x2={x}
                                          y2={chartHeight + (shouldShowLabel ? 8 : 4)}
                                          stroke="#6b7280"
                                          strokeWidth={shouldShowLabel ? "2" : "1"}
                                          opacity={shouldShowLabel ? "0.8" : "0.4"}
                                        />
                                      </g>
                                    )
                                  })}

                                  {/* Y-axis label */}
                                  <text
                                    x="-50"
                                    y={chartHeight / 2}
                                    textAnchor="middle"
                                    className="text-sm fill-gray-700 dark:fill-gray-300 font-semibold"
                                    transform={`rotate(-90, -50, ${chartHeight / 2})`}
                                  >
                                    Defect Count
                                  </text>
                                </>
                              )
                            })()}
                          </g>

                          {/* Enhanced Legend */}
                          <g transform="translate(80, 370)">
                            <rect x="-10" y="-15" width="840" height="35" fill="rgba(255,255,255,0.05)" rx="8" stroke="rgba(156,163,175,0.1)" strokeWidth="1"/>
                            
                            {/* Total Defects */}
                            <circle cx="20" cy="0" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" filter="url(#dropshadow)" />
                            <text x="35" y="4" className="text-sm fill-gray-700 dark:fill-gray-300 font-medium">Total Defects</text>
                            
                            {/* Critical Defects */}
                            <line x1="150" y1="0" x2="175" y2="0" stroke="#ef4444" strokeWidth="3" strokeDasharray="4,4" strokeLinecap="round" />
                            <text x="185" y="4" className="text-sm fill-gray-700 dark:fill-gray-300 font-medium">Critical Defects</text>
                            
                            {/* High Defects */}
                            <rect x="320" y="-6" width="20" height="12" fill="url(#highAreaGradient)" rx="2" />
                            <text x="350" y="4" className="text-sm fill-gray-700 dark:fill-gray-300 font-medium">High Severity</text>
                            
                            {/* Trend Area */}
                            <rect x="480" y="-6" width="20" height="12" fill="url(#mainAreaGradient)" rx="2" />
                            <text x="510" y="4" className="text-sm fill-gray-700 dark:fill-gray-300 font-medium">Trend Area</text>
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
                                  {(() => {
                                    const latestMonthName = analytics.monthlyTrends[analytics.monthlyTrends.length - 1]?.month || ''
                                    const now = new Date()
                                    const currentMonth = now.toLocaleString('default', { month: 'short' })
                                    const currentYear = now.getFullYear()
                                    const isCurrentMonthPartial = latestMonthName.includes(currentMonth) && 
                                      (latestMonthName.includes(currentYear.toString()) || !latestMonthName.includes('20'))
                                    
                                    if (isCurrentMonthPartial) {
                                      return 'Partial month'
                                    } else {
                                      return `${monthlyChange > 0 ? '+' : ''}${monthlyChange.toFixed(1)}%`
                                    }
                                  })()}
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
                            const latestMonthName = analytics.monthlyTrends[analytics.monthlyTrends.length - 1]?.month || ''
                            const previousMonthName = analytics.monthlyTrends[analytics.monthlyTrends.length - 2]?.month || ''
                            
                            // Check if we're comparing partial month data
                            const now = new Date()
                            const currentDay = now.getDate()
                            const currentMonth = now.toLocaleString('default', { month: 'short' })
                            const currentYear = now.getFullYear()
                            const daysInCurrentMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate()
                            const monthProgress = (currentDay / daysInCurrentMonth * 100).toFixed(0)
                            
                            // Check if latest month is current partial month
                            const isCurrentMonthPartial = latestMonthName.includes(currentMonth) && 
                              (latestMonthName.includes(currentYear.toString()) || !latestMonthName.includes('20'))
                            
                            if (analytics.monthlyTrends.length < 2) {
                              return `Insufficient data for trend analysis. Need at least 2 time periods for comparison.`
                            }
                            
                            const monthlyChange = previousMonth > 0 ? ((latestMonth - previousMonth) / previousMonth * 100) : 0
                            
                            if (isCurrentMonthPartial) {
                              // Provide context about partial month comparison
                              const partialMonthWarning = `Note: ${latestMonthName} is ${monthProgress}% complete (${currentDay} of ${daysInCurrentMonth} days). `
                              
                              if (Math.abs(monthlyChange) < 5) {
                                return `${partialMonthWarning}Current month trends appear stable compared to ${previousMonthName}. Monitor as month progresses.`
                              } else if (monthlyChange > 0) {
                                return `${partialMonthWarning}Current month is tracking ${monthlyChange.toFixed(1)}% higher than ${previousMonthName}, but this is a partial month comparison.`
                              } else {
                                return `${partialMonthWarning}Current month is tracking ${Math.abs(monthlyChange).toFixed(1)}% lower than ${previousMonthName}, but this is a partial month comparison.`
                              }
                            } else {
                              // Full month comparison
                              if (monthlyChange > 10) {
                                return `Defect rate increased by ${monthlyChange.toFixed(1)}% from ${previousMonthName} to ${latestMonthName}. Consider investigating quality issues.`
                              } else if (monthlyChange < -10) {
                                return `Defect rate decreased by ${Math.abs(monthlyChange).toFixed(1)}% from ${previousMonthName} to ${latestMonthName}. Quality improvements are showing results.`
                              } else {
                                return `Defect rate is relatively stable with ${monthlyChange.toFixed(1)}% change from ${previousMonthName} to ${latestMonthName}.`
                              }
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