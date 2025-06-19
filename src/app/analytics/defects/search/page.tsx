'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Brain, FileText, Users, AlertTriangle, Calendar, Component, Tag, RefreshCw, MessageSquare, Lightbulb, BookOpen, Bug, History, Download, Clock, X } from 'lucide-react'
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
  const [filteredDefects, setFilteredDefects] = useState<Defect[]>([])
  const [loading, setLoading] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([])
  
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
  }, [])

  useEffect(() => {
    applyFilters()
  }, [defects, filters])

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
      
      const response = await fetch('/api/defects')
      if (!response.ok) {
        throw new Error('Failed to fetch defects')
      }
      
      const data = await response.json()
      const defectsArray = data.defects || []
      setDefects(defectsArray)
      
      // Extract unique values for filters with proper typing
      const severities = Array.from(new Set(defectsArray.map((d: Defect) => d.severity).filter(Boolean))) as string[]
      const priorities = Array.from(new Set(defectsArray.map((d: Defect) => d.priority).filter(Boolean))) as string[]
      const components = Array.from(new Set(defectsArray.map((d: Defect) => d.component).filter(Boolean))) as string[]
      const statuses = Array.from(new Set(defectsArray.map((d: Defect) => d.status).filter(Boolean))) as string[]
      const assignees = Array.from(new Set(defectsArray.map((d: Defect) => d.assignee).filter(Boolean))) as string[]
      
      setFilterOptions({
        severities,
        priorities,
        components,
        statuses,
        assignees
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = defects

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(defect =>
        defect.title.toLowerCase().includes(searchLower) ||
        defect.description.toLowerCase().includes(searchLower) ||
        defect.jiraKey?.toLowerCase().includes(searchLower) ||
        defect.component?.toLowerCase().includes(searchLower)
      )
    }

    // Dropdown filters
    if (filters.severity) {
      filtered = filtered.filter(defect => defect.severity === filters.severity)
    }
    if (filters.priority) {
      filtered = filtered.filter(defect => defect.priority === filters.priority)
    }
    if (filters.component) {
      filtered = filtered.filter(defect => defect.component === filters.component)
    }
    if (filters.status) {
      filtered = filtered.filter(defect => defect.status === filters.status)
    }
    if (filters.assignee) {
      filtered = filtered.filter(defect => defect.assignee === filters.assignee)
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(defect => new Date(defect.createdAt) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter(defect => new Date(defect.createdAt) <= new Date(filters.dateTo))
    }

    setFilteredDefects(filtered)
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
      icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search defects by title, description, Jira key, or component..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Filter className="h-4 w-4" />
                Filters
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Defects List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Defects ({filteredDefects.length})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Select a defect to analyze with AI
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading defects...</p>
                </div>
              ) : filteredDefects.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDefects.map((defect) => (
                    <div
                      key={defect.id}
                      onClick={() => {
                        setSelectedDefect(defect)
                        setAiAnalysis(null) // Clear any previous analysis when selecting a new defect
                      }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedDefect?.id === defect.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {defect.jiraKey && (
                            <span className="text-blue-600 dark:text-blue-400 mr-2">
                              {defect.jiraKey}
                            </span>
                          )}
                          {defect.title}
                        </h3>
                        {defect.severity && (
                          <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(defect.severity)}`}>
                            {defect.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {defect.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {defect.component && (
                          <span className="flex items-center gap-1">
                            <Component className="h-3 w-3" />
                            {defect.component}
                          </span>
                        )}
                        {defect.status && (
                          <span className={`px-2 py-1 rounded-full ${getStatusColor(defect.status)}`}>
                            {defect.status}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(defect.createdAt).toLocaleDateString()}
                        </span>
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

          {/* AI Analysis Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                AI Root Cause Analysis
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Intelligent analysis using user stories and documentation
              </p>
            </div>
            <div className="p-6">
              {!selectedDefect ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Select a defect to start AI analysis</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Defect Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      {selectedDefect.jiraKey && (
                        <span className="text-blue-600 dark:text-blue-400 mr-2">
                          {selectedDefect.jiraKey}
                        </span>
                      )}
                      {selectedDefect.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {selectedDefect.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {selectedDefect.severity && (
                        <span className={`px-2 py-1 rounded-full border ${getSeverityColor(selectedDefect.severity)}`}>
                          {selectedDefect.severity}
                        </span>
                      )}
                      {selectedDefect.component && (
                        <span className="flex items-center gap-1">
                          <Component className="h-3 w-3" />
                          {selectedDefect.component}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Analyze Button */}
                  <button
                    onClick={() => analyzeDefectWithAI(selectedDefect)}
                    disabled={analysisLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analysisLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Analyze Root Cause with AI
                      </>
                    )}
                  </button>

                  {/* AI Analysis Results */}
                  {aiAnalysis && (
                    <div className="space-y-4">
                      {/* Root Cause Analysis */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">Root Cause Analysis</h4>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {aiAnalysis.rootCauseAnalysis}
                        </p>
                      </div>

                      {/* Requirement Gaps */}
                      {aiAnalysis.requirementGaps.length > 0 && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                            <h4 className="font-medium text-orange-900 dark:text-orange-100">Requirement Gaps</h4>
                          </div>
                          <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                            {aiAnalysis.requirementGaps.map((gap, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-orange-600 dark:text-orange-400 mt-1">•</span>
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Related User Stories */}
                      {aiAnalysis.relatedUserStories.length > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <Users className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <h4 className="font-medium text-green-900 dark:text-green-100">Related User Stories</h4>
                          </div>
                          <div className="space-y-2">
                            {aiAnalysis.relatedUserStories.map((story, index) => (
                              <div key={index} className="text-sm">
                                <p className="font-medium text-green-900 dark:text-green-100">{story.title}</p>
                                <p className="text-green-800 dark:text-green-200">{story.relevance}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documentation References */}
                      {aiAnalysis.documentationReferences.length > 0 && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                            <h4 className="font-medium text-purple-900 dark:text-purple-100">Documentation References</h4>
                          </div>
                          <div className="space-y-2">
                            {aiAnalysis.documentationReferences.map((doc, index) => (
                              <div key={index} className="text-sm">
                                <p className="font-medium text-purple-900 dark:text-purple-100">{doc.title} - {doc.section}</p>
                                <p className="text-purple-800 dark:text-purple-200">{doc.relevance}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prevention Recommendations */}
                      {aiAnalysis.preventionRecommendations.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">Prevention Recommendations</h4>
                          </div>
                          <ul className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
                            {aiAnalysis.preventionRecommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-gray-600 dark:text-gray-400 mt-1">•</span>
                                {rec}
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