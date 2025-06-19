'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Brain, FileText, Users, Calendar, Component, Tag, RefreshCw, MessageSquare, Lightbulb, BookOpen, Bug, History, Download, Clock, X } from 'lucide-react'
import PageLayout from '@/components/ui/page-layout'

interface Defect {
  id: string
  title: string
  description: string
  stepsToReproduce?: string
  rootCause?: string
  resolution?: string
  severity?: string
  priority?: string
  component?: string
  status?: string
  jiraId?: string
  jiraKey?: string
  assignee?: string
  reporter?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

interface DefectFilters {
  search: string
  severity: string
  priority: string
  component: string
  status: string
  assignee: string
  dateFrom: string
  dateTo: string
}

interface AIAnalysis {
  rootCauseAnalysis: string
  requirementGaps: string[]
  relatedUserStories: Array<{
    id: string
    title: string
    relevance: string
  }>
  documentationReferences: Array<{
    title: string
    section: string
    relevance: string
  }>
  preventionRecommendations: string[]
  confidence: number
}

interface AnalysisHistoryItem {
  id: string
  defect: {
    id: string
    title: string
    jiraKey?: string
    component?: string
    severity?: string
  }
  analysis: AIAnalysis
  timestamp: string
}

export default function DefectSearchPage() {
  const [defects, setDefects] = useState<Defect[]>([])
  const [loading, setLoading] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([])
  const [totalDefects, setTotalDefects] = useState(0)
  const [originalTotal, setOriginalTotal] = useState(0)
  
  const [filters, setFilters] = useState<DefectFilters>({
    search: '',
    severity: '',
    priority: '',
    component: '',
    status: '',
    assignee: '',
    dateFrom: '',
    dateTo: ''
  })

  // Get unique values for filter dropdowns
  const [filterOptions, setFilterOptions] = useState({
    severities: [] as string[],
    priorities: [] as string[],
    components: [] as string[],
    statuses: [] as string[],
    assignees: [] as string[]
  })

  useEffect(() => {
    fetchDefects()
    loadAnalysisHistory()
    fetchFilterOptions()
  }, [])

  // Debounced search - refetch when filters change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchDefects()
    }, 500) // 500ms debounce

    return () => clearTimeout(debounceTimer)
  }, [filters])

  const loadAnalysisHistory = () => {
    try {
      const saved = localStorage.getItem('defect-analysis-history')
      if (saved) {
        const history = JSON.parse(saved)
        setAnalysisHistory(history)
      }
    } catch (error) {
      console.error('Error loading analysis history:', error)
    }
  }

  const saveAnalysisToHistory = (defect: Defect, analysis: AIAnalysis) => {
    try {
      const historyItem: AnalysisHistoryItem = {
        id: `${defect.id}-${Date.now()}`,
        defect: {
          id: defect.id,
          title: defect.title,
          jiraKey: defect.jiraKey,
          component: defect.component,
          severity: defect.severity
        },
        analysis,
        timestamp: new Date().toISOString()
      }

      const updatedHistory = [historyItem, ...analysisHistory].slice(0, 50) // Keep last 50 analyses
      setAnalysisHistory(updatedHistory)
      localStorage.setItem('defect-analysis-history', JSON.stringify(updatedHistory))
      
      // Debug logging for AI analysis count verification
      console.log('🧠 AI Analysis History Updated:', {
        newAnalysisId: historyItem.id,
        totalAnalyses: updatedHistory.length,
        defectTitle: defect.title,
        jiraKey: defect.jiraKey
      })
    } catch (error) {
      console.error('Error saving analysis to history:', error)
    }
  }

  const clearAnalysisHistory = () => {
    setAnalysisHistory([])
    localStorage.removeItem('defect-analysis-history')
  }

  const exportAnalysisHistory = () => {
    try {
      const dataStr = JSON.stringify(analysisHistory, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `defect-analysis-history-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting analysis history:', error)
    }
  }

  const loadAnalysisFromHistory = (historyItem: AnalysisHistoryItem) => {
    // Find the defect in current list or create a minimal version
    const defect = defects.find(d => d.id === historyItem.defect.id) || {
      id: historyItem.defect.id,
      title: historyItem.defect.title,
      description: 'Historical analysis - defect details may not be current',
      jiraKey: historyItem.defect.jiraKey,
      component: historyItem.defect.component,
      severity: historyItem.defect.severity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Defect

    setSelectedDefect(defect)
    setAiAnalysis(historyItem.analysis)
    setShowHistory(false)
  }

  const fetchDefects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters for server-side filtering
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.severity) params.append('severity', filters.severity)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.component) params.append('component', filters.component)
      if (filters.status) params.append('status', filters.status)
      if (filters.assignee) params.append('assignee', filters.assignee)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      params.append('limit', '100') // Show 100 results at a time
      
      const response = await fetch(`/api/defects?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch defects')
      }
      
      const data = await response.json()
      const defectsArray = data.defects || []
      setDefects(defectsArray)
      setTotalDefects(data.total || 0)
      setOriginalTotal(data.originalTotal || 0)
      
      // Debug logging for statistics verification
      const percentage = data.originalTotal > 0 ? ((data.total || 0) / data.originalTotal) * 100 : 0;
      console.log('📊 Defects Statistics Updated:', {
        totalDefects: data.total || 0,
        originalTotal: data.originalTotal || 0,
        exactPercentage: percentage,
        displayedPercentage: percentage < 1 && percentage > 0 ? percentage.toFixed(2) + '%' : Math.round(percentage) + '%',
        displayedDefects: defectsArray.length
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    try {
      // Fetch all unique values for filter dropdowns without any filters
      const response = await fetch('/api/defects?limit=10000') // Get all for filter options
      if (!response.ok) {
        throw new Error('Failed to fetch filter options')
      }
      
      const data = await response.json()
      const allDefects = data.defects || []
      
      // Extract unique values for filters with proper typing
      const severities = Array.from(new Set(allDefects.map((d: Defect) => d.severity).filter(Boolean))) as string[]
      const priorities = Array.from(new Set(allDefects.map((d: Defect) => d.priority).filter(Boolean))) as string[]
      const components = Array.from(new Set(allDefects.map((d: Defect) => d.component).filter(Boolean))) as string[]
      const statuses = Array.from(new Set(allDefects.map((d: Defect) => d.status).filter(Boolean))) as string[]
      const assignees = Array.from(new Set(allDefects.map((d: Defect) => d.assignee).filter(Boolean))) as string[]
      
      setFilterOptions({
        severities,
        priorities,
        components,
        statuses,
        assignees
      })
    } catch (err) {
      console.error('Error fetching filter options:', err)
    }
  }



  const analyzeDefectWithAI = async (defect: Defect) => {
    try {
      setAnalysisLoading(true)
      setAiAnalysis(null)
      setSelectedDefect(defect) // Ensure we set the current defect being analyzed
      
      const response = await fetch('/api/analyze/defect-root-cause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defect: {
            id: defect.id,
            title: defect.title,
            description: defect.description,
            stepsToReproduce: defect.stepsToReproduce,
            component: defect.component,
            severity: defect.severity,
            rootCause: defect.rootCause
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze defect')
      }

      const analysis = await response.json()
      setAiAnalysis(analysis)
      
      // Save to history
      saveAnalysisToHistory(defect, analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze defect')
    } finally {
      setAnalysisLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 border-green-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'text-red-600 bg-red-100'
      case 'in progress': return 'text-blue-600 bg-blue-100'
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      severity: '',
      priority: '',
      component: '',
      status: '',
      assignee: '',
      dateFrom: '',
      dateTo: ''
    })
  }

  const actionButtons = [
    {
      label: `History (${analysisHistory.length})`,
      onClick: () => setShowHistory(!showHistory),
      icon: <History className="h-4 w-4" />,
      variant: 'outline' as const
    }
  ];

  return (
    <PageLayout
      title="AI Defect Root Cause Analysis"
      subtitle="Search defects and use AI + RAG to understand root causes through user stories and documentation"
      icon={<Bug className="h-6 w-6 text-red-600" />}
      backUrl="/analytics/defects"
      backLabel="Back to Defect Analytics"
      actionButtons={actionButtons}
    >
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Analysis History Panel */}
        {showHistory && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Analysis History ({analysisHistory.length})
                </h2>
                <div className="flex items-center gap-2">
                  {analysisHistory.length > 0 && (
                    <>
                      <button
                        onClick={exportAnalysisHistory}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <Download className="h-4 w-4" />
                        Export
                      </button>
                      <button
                        onClick={clearAnalysisHistory}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {analysisHistory.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analysisHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadAnalysisFromHistory(item)}
                      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {item.defect.jiraKey && (
                            <span className="text-blue-600 dark:text-blue-400 mr-2">
                              {item.defect.jiraKey}
                            </span>
                          )}
                          {item.defect.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {item.defect.severity && (
                            <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(item.defect.severity)}`}>
                              {item.defect.severity}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.analysis.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {item.defect.component && (
                          <span className="flex items-center gap-1">
                            <Component className="h-3 w-3" />
                            {item.defect.component}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No analysis history yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Analyze defects to build your history.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search across all defects by title, description, Jira key, or component..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 border rounded-lg transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-300' 
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters</span>
                {Object.values(filters).some(v => v) && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
                    {Object.values(filters).filter(v => v).length}
                  </span>
                )}
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="">All Severities</option>
                    {filterOptions.severities.map(severity => (
                      <option key={severity} value={severity}>{severity}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="">All Priorities</option>
                    {filterOptions.priorities.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Component
                  </label>
                  <select
                    value={filters.component}
                    onChange={(e) => setFilters(prev => ({ ...prev, component: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="">All Components</option>
                    {filterOptions.components.map(component => (
                      <option key={component} value={component}>{component}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    {filterOptions.statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assignee
                  </label>
                  <select
                    value={filters.assignee}
                    onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="">All Assignees</option>
                    {filterOptions.assignees.map(assignee => (
                      <option key={assignee} value={assignee}>{assignee}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" title="Total number of defects in the system">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Bug className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Defects</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{originalTotal}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">All defects in system</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" title="Number of defects matching your current search and filter criteria">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Search className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Matching Results</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalDefects}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Found by search/filters</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" title="Number of AI root cause analyses you've performed in this session. Data is stored in browser localStorage and persists between visits.">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Analyses</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{analysisHistory.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completed analyses (max 50)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Defects List - Takes up 2/5 of the width on large screens */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Defects Library
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {totalDefects < originalTotal 
                      ? `Showing ${defects.length} of ${totalDefects} matching defects (${originalTotal} total)` 
                      : `Browse ${totalDefects} defects and select one for AI analysis`}
                  </p>
                </div>
                {selectedDefect && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Selected: {selectedDefect.jiraKey || selectedDefect.title.substring(0, 20) + '...'}
                  </div>
                )}
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading defects...</p>
                </div>
              ) : defects.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {defects.map((defect: Defect) => (
                    <div
                      key={defect.id}
                      onClick={() => {
                        setSelectedDefect(defect)
                        setAiAnalysis(null) // Clear any previous analysis when selecting a new defect
                      }}
                      className={`p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-md ${
                        selectedDefect?.id === defect.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 shadow-md' 
                          : 'hover:border-l-4 hover:border-blue-200 dark:hover:border-blue-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {defect.jiraKey && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                                {defect.jiraKey}
                              </span>
                            )}
                            {defect.severity && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(defect.severity)}`}>
                                {defect.severity}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-2 line-clamp-1">
                            {defect.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 leading-relaxed">
                            {defect.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {defect.component && (
                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              <Component className="h-3 w-3" />
                              {defect.component}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(defect.createdAt).toLocaleDateString()}
                          </span>
                          {defect.assignee && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {defect.assignee}
                            </span>
                          )}
                        </div>
                        
                        {defect.status && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(defect.status)}`}>
                            {defect.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bug className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No defects found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis Panel - Takes up 3/5 of the width on large screens */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    AI Root Cause Analysis
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Powered by Claude 4 + RAG
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {!selectedDefect ? (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full"></div>
                    </div>
                    <div className="relative">
                      <Search className="h-12 w-12 mx-auto text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready for AI Analysis</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                    Select a defect from the list to start intelligent root cause analysis using Claude 4 and RAG technology
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      User Stories
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Documentation
                    </span>
                    <span className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      AI Insights
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Defect Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Bug className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {selectedDefect.jiraKey && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                              {selectedDefect.jiraKey}
                            </span>
                          )}
                          {selectedDefect.severity && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedDefect.severity)}`}>
                              {selectedDefect.severity}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm leading-snug">
                          {selectedDefect.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3 leading-relaxed">
                          {selectedDefect.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {selectedDefect.component && (
                            <span className="flex items-center gap-1">
                              <Component className="h-3 w-3" />
                              {selectedDefect.component}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedDefect.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Analyze Button */}
                  <button
                    onClick={() => analyzeDefectWithAI(selectedDefect)}
                    disabled={analysisLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {analysisLoading ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span className="font-medium">Analyzing with Claude 4...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5" />
                        <span className="font-medium">Analyze Root Cause with AI</span>
                      </>
                    )}
                  </button>

                  {/* AI Analysis Results */}
                  {aiAnalysis && (
                    <div className="space-y-6">
                      {/* Root Cause Analysis */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3 mb-4">
                          <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Root Cause Analysis</h4>
                        </div>
                        <div className="prose prose-blue dark:prose-invert max-w-none">
                          <p className="text-base text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">
                            {aiAnalysis.rootCauseAnalysis}
                          </p>
                        </div>
                      </div>

                      {/* Requirement Gaps */}
                      {aiAnalysis.requirementGaps.length > 0 && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                          <div className="flex items-start gap-3 mb-4">
                            <RefreshCw className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-0.5" />
                            <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100">Requirement Gaps</h4>
                          </div>
                          <ul className="space-y-3">
                            {aiAnalysis.requirementGaps.map((gap, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full mt-2"></span>
                                <p className="text-base text-orange-800 dark:text-orange-200 leading-relaxed">{gap}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Related User Stories */}
                      {aiAnalysis.relatedUserStories.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                          <div className="flex items-start gap-3 mb-4">
                            <Users className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5" />
                            <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">Related User Stories</h4>
                          </div>
                          <div className="space-y-4">
                            {aiAnalysis.relatedUserStories.map((story, index) => (
                              <div key={index} className="bg-white dark:bg-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                <p className="font-semibold text-green-900 dark:text-green-100 mb-2">{story.title}</p>
                                <p className="text-base text-green-800 dark:text-green-200 leading-relaxed">{story.relevance}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documentation References */}
                      {aiAnalysis.documentationReferences.length > 0 && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                          <div className="flex items-start gap-3 mb-4">
                            <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-0.5" />
                            <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100">Documentation References</h4>
                          </div>
                          <div className="space-y-4">
                            {aiAnalysis.documentationReferences.map((doc, index) => (
                              <div key={index} className="bg-white dark:bg-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                <p className="font-semibold text-purple-900 dark:text-purple-100 mb-2">{doc.title} - {doc.section}</p>
                                <p className="text-base text-purple-800 dark:text-purple-200 leading-relaxed">{doc.relevance}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prevention Recommendations */}
                      {aiAnalysis.preventionRecommendations.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-start gap-3 mb-4">
                            <MessageSquare className="h-6 w-6 text-gray-600 dark:text-gray-400 mt-0.5" />
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prevention Recommendations</h4>
                          </div>
                          <ul className="space-y-3">
                            {aiAnalysis.preventionRecommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full mt-2"></span>
                                <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">{rec}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Confidence Score */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Analysis Confidence
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {aiAnalysis.confidence}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${aiAnalysis.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  )
} 