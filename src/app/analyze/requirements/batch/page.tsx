'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Play, RefreshCw, Filter, X, Calendar, CheckCircle, AlertTriangle, Clock, BarChart3, FileText, Users, Target, TrendingUp, Shield, Lightbulb, Bug, Zap, Award, AlertCircle, Download, StopCircle, Trash2, Database, ExternalLink, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import PageLayout from '@/components/ui/page-layout'

interface UserStory {
  id: string
  title: string
  description: string
  jiraKey?: string
  component?: string
  priority?: string
  assignee?: string
  status?: string
  createdAt?: string
}

interface BatchJob {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  totalStories: number
  analyzedStories: number
  createdAt: string
  completedAt?: string
}

interface BatchResult {
  id: string
  batchId: string
  userStoryId: string
  userStory: UserStory
  overallScore: number
  completenessScore: number
  clarityScore: number
  testabilityScore: number
  analysisResult: any
  createdAt: string
}

interface Filters {
  priority: string[]
  status: string[]
  component: string[]
  dateRange: {
    start: string
    end: string
  }
}

export default function BatchAnalysisPage() {
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([])
  const [selectedBatch, setSelectedBatch] = useState<BatchJob | null>(null)
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedResult, setSelectedResult] = useState<BatchResult | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const resultsPerPage = 10

  // Form state
  const [batchName, setBatchName] = useState('')
  const [filters, setFilters] = useState<Filters>({
    priority: [],
    status: [],
    component: [],
    dateRange: {
      start: '',
      end: ''
    }
  })
  const [totalStories, setTotalStories] = useState(0)

  // Load batch jobs on component mount
  useEffect(() => {
    loadBatchJobs()
  }, [])

  // Poll for updates when a batch is selected and running
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (selectedBatch && selectedBatch.status === 'running') {
      interval = setInterval(() => {
        loadBatchJobs()
        if (selectedBatch) {
          loadBatchResults(selectedBatch.id)
        }
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [selectedBatch?.id, selectedBatch?.status])

  const loadBatchJobs = async () => {
    try {
      const response = await fetch('/api/analyze/requirements-batch')
      if (response.ok) {
        const data = await response.json()
        setBatchJobs(data.batches || [])
        
        // Update selected batch if it exists
        if (selectedBatch) {
          const updatedBatch = data.batches?.find((b: BatchJob) => b.id === selectedBatch.id)
          if (updatedBatch) {
            setSelectedBatch(updatedBatch)
          }
        }
      }
    } catch (error) {
      console.error('Error loading batch jobs:', error)
    }
  }

  const loadBatchResults = async (batchId: string) => {
    setResultsLoading(true)
    try {
      const response = await fetch(`/api/analyze/requirements-batch?batchId=${batchId}`)
      if (response.ok) {
        const data = await response.json()
        setBatchResults(data.results || [])
      }
    } catch (error) {
      console.error('Error loading batch results:', error)
    } finally {
      setResultsLoading(false)
    }
  }

  const startBatchAnalysis = async () => {
    if (!batchName.trim()) {
      alert('Please enter a batch name')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/analyze/requirements-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: batchName,
          filters
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBatchName('')
        setFilters({
          priority: [],
          status: [],
          component: [],
          dateRange: { start: '', end: '' }
        })
        await loadBatchJobs()
        
        // Auto-select the new batch
        if (data.batch) {
          setSelectedBatch(data.batch)
          await loadBatchResults(data.batch.id)
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error starting batch analysis:', error)
      alert('Error starting batch analysis')
    } finally {
      setLoading(false)
    }
  }

  const selectBatch = async (batch: BatchJob) => {
    setSelectedBatch(batch)
    setCurrentPage(1)
    await loadBatchResults(batch.id)
  }

  const deleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return

    try {
      const response = await fetch(`/api/analyze/requirements-batch?batchId=${batchId}&action=delete`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadBatchJobs()
        if (selectedBatch?.id === batchId) {
          setSelectedBatch(null)
          setBatchResults([])
        }
      } else {
        const error = await response.json()
        alert(`Error deleting batch: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting batch:', error)
      alert('Error deleting batch')
    }
  }

  const updateStoryCount = async () => {
    try {
      const response = await fetch('/api/analyze/requirements-batch/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      })
      
      if (response.ok) {
        const data = await response.json()
        setTotalStories(data.count || 0)
      }
    } catch (error) {
      console.error('Error getting story count:', error)
      setTotalStories(0)
    }
  }

  // Update story count when filters change
  useEffect(() => {
    updateStoryCount()
  }, [filters])

  const handleFilterChange = (type: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      priority: [],
      status: [],
      component: [],
      dateRange: { start: '', end: '' }
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50'
    if (score >= 6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const calculateProgress = (batch: BatchJob) => {
    if (!batch.totalStories || batch.totalStories === 0) return 0
    return Math.round((batch.analyzedStories / batch.totalStories) * 100)
  }

  // Pagination
  const totalPages = Math.ceil(batchResults.length / resultsPerPage)
  const startIndex = (currentPage - 1) * resultsPerPage
  const endIndex = startIndex + resultsPerPage
  const currentResults = batchResults.slice(startIndex, endIndex)

  return (
    <PageLayout
      title="Batch Requirements Analysis"
      subtitle="Start and monitor batch analysis of user stories with real-time progress tracking"
      icon={<BarChart3 className="h-6 w-6" />}
             actionButtons={[
         {
           label: 'Refresh',
           onClick: loadBatchJobs,
           variant: 'outline',
           icon: <RefreshCw className="h-4 w-4" />
         }
       ]}
    >
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <div className="col-span-3 space-y-6 overflow-y-auto">
          {/* New Batch Form */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Start New Batch</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Name
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g., Sprint 24 Analysis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filters */}
              <div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm font-medium text-gray-700 mb-2"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                  {showFilters ? (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-1" />
                  )}
                </button>

                {showFilters && (
                  <div className="space-y-3 pl-4 border-l-2 border-gray-100">
                    {/* Date Range */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={filters.dateRange.start}
                          onChange={(e) => handleFilterChange('dateRange', {
                            ...filters.dateRange,
                            start: e.target.value
                          })}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="date"
                          value={filters.dateRange.end}
                          onChange={(e) => handleFilterChange('dateRange', {
                            ...filters.dateRange,
                            end: e.target.value
                          })}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={clearFilters}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600">
                {totalStories} user stories will be analyzed
              </div>

              <button
                onClick={startBatchAnalysis}
                disabled={loading || !batchName.trim() || totalStories === 0}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Starting...' : 'Start Batch Analysis'}
              </button>
            </div>
          </div>

          {/* Recent Batches */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Batches</h3>
            
            <div className="space-y-2">
              {batchJobs.map((batch) => (
                <div
                  key={batch.id}
                  onClick={() => selectBatch(batch)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedBatch?.id === batch.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getStatusIcon(batch.status)}
                      <span className="ml-2 font-medium text-sm">{batch.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteBatch(batch.id)
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    {batch.analyzedStories}/{batch.totalStories} analyzed
                  </div>
                  
                  {batch.status === 'running' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress(batch)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {calculateProgress(batch)}% complete
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {batchJobs.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No batch jobs yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {selectedBatch ? (
            <div className="bg-white rounded-lg border h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      {getStatusIcon(selectedBatch.status)}
                      <span className="ml-2">{selectedBatch.name}</span>
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedBatch.analyzedStories}/{selectedBatch.totalStories} stories analyzed
                      {selectedBatch.status === 'running' && (
                        <span className="ml-2">• {calculateProgress(selectedBatch)}% complete</span>
                      )}
                    </p>
                  </div>
                  
                  {selectedBatch.status === 'completed' && (
                    <button className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200">
                      <Download className="w-4 h-4 mr-1" />
                      Export Results
                    </button>
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto p-6">
                {resultsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Loading results...</span>
                  </div>
                ) : selectedBatch.status === 'running' && batchResults.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <Clock className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Analysis in progress...</span>
                  </div>
                ) : batchResults.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {currentResults.map((result) => (
                        <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {result.userStory.jiraKey ? (
                                  <span className="text-blue-600">{result.userStory.jiraKey}</span>
                                ) : (
                                  <span>Story {result.userStory.id.slice(-8)}</span>
                                )}
                                {result.userStory.title && (
                                  <span className="ml-2 text-gray-700">{result.userStory.title}</span>
                                )}
                              </h3>
                              
                              <div className="flex items-center space-x-4 mt-2">
                                <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.overallScore)}`}>
                                  Overall: {result.overallScore.toFixed(1)}
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.completenessScore)}`}>
                                  Complete: {result.completenessScore.toFixed(1)}
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.clarityScore)}`}>
                                  Clarity: {result.clarityScore.toFixed(1)}
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(result.testabilityScore)}`}>
                                  Testable: {result.testabilityScore.toFixed(1)}
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => setSelectedResult(result)}
                              className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Showing {startIndex + 1}-{Math.min(endIndex, batchResults.length)} of {batchResults.length} results
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          <span className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md">
                            {currentPage} of {totalPages}
                          </span>
                          
                          <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No results yet</p>
                      <p className="text-sm text-gray-500">Results will appear here as the analysis progresses</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border h-full flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Batch Job</h3>
                <p className="text-gray-600">
                  Choose a batch analysis job from the sidebar to view its results, or start a new batch analysis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Analysis Details: {selectedResult.userStory.jiraKey || `Story ${selectedResult.userStory.id.slice(-8)}`}
                </h2>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className={`p-4 rounded-lg ${getScoreColor(selectedResult.overallScore)} border-2 border-opacity-50`}>
                  <div className="text-2xl font-bold">{selectedResult.overallScore.toFixed(1)}</div>
                  <div className="text-sm font-medium">Overall Score</div>
                </div>
                <div className={`p-4 rounded-lg ${getScoreColor(selectedResult.completenessScore)}`}>
                  <div className="text-2xl font-bold">{selectedResult.completenessScore.toFixed(1)}</div>
                  <div className="text-sm">Completeness</div>
                </div>
                <div className={`p-4 rounded-lg ${getScoreColor(selectedResult.clarityScore)}`}>
                  <div className="text-2xl font-bold">{selectedResult.clarityScore.toFixed(1)}</div>
                  <div className="text-sm">Clarity</div>
                </div>
                <div className={`p-4 rounded-lg ${getScoreColor(selectedResult.testabilityScore)}`}>
                  <div className="text-2xl font-bold">{selectedResult.testabilityScore.toFixed(1)}</div>
                  <div className="text-sm">Testability</div>
                </div>
              </div>

              {/* Quality Summary */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Quality Assessment</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedResult.overallScore >= 8 ? '✅ High Quality - Well-defined requirements' :
                       selectedResult.overallScore >= 6 ? '⚠️ Medium Quality - Some improvements needed' :
                       selectedResult.overallScore >= 4 ? '🔶 Low Quality - Significant improvements required' :
                       '🚨 Critical - Major quality issues identified'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">{selectedResult.overallScore.toFixed(1)}/10</div>
                    <div className="text-sm text-blue-700">AI Quality Score</div>
                  </div>
                </div>
              </div>

                             {selectedResult.analysisResult && (
                 <div className="space-y-6">
                   <h3 className="font-semibold text-gray-900">Analysis Results</h3>
                   
                   {/* Beautiful ReactMarkdown Analysis */}
                   {selectedResult.analysisResult.analysis && (
                     <div className="bg-gray-50 p-6 rounded-lg">
                       <h4 className="font-medium text-gray-900 mb-4">Detailed Analysis</h4>
                       <div className="prose prose-gray max-w-none">
                         <ReactMarkdown
                           components={{
                             h1: ({ children }) => (
                               <h1 className="text-xl font-bold text-gray-900 mt-6 mb-4 border-b border-gray-200 pb-2">
                                 {children}
                               </h1>
                             ),
                             h2: ({ children }) => (
                               <h2 className="text-lg font-bold text-gray-900 mt-5 mb-3 border-b border-gray-200 pb-1">
                                 {children}
                               </h2>
                             ),
                             h3: ({ children }) => (
                               <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">
                                 {children}
                               </h3>
                             ),
                             h4: ({ children }) => (
                               <h4 className="text-sm font-medium text-gray-700 mt-3 mb-2">
                                 {children}
                               </h4>
                             ),
                             p: ({ children }) => (
                               <p className="text-gray-700 mb-3 leading-relaxed">
                                 {children}
                               </p>
                             ),
                             ul: ({ children }) => (
                               <ul className="list-disc list-outside space-y-1 mb-4 ml-6 pl-2">
                                 {children}
                               </ul>
                             ),
                             ol: ({ children }) => (
                               <ol className="list-decimal list-outside space-y-1 mb-4 ml-6 pl-2">
                                 {children}
                               </ol>
                             ),
                             li: ({ children }) => (
                               <li className="text-gray-700 leading-relaxed">
                                 {children}
                               </li>
                             ),
                             strong: ({ children }) => (
                               <strong className="font-semibold text-gray-900">
                                 {children}
                               </strong>
                             ),
                             em: ({ children }) => (
                               <em className="italic text-gray-800">
                                 {children}
                               </em>
                             ),
                             code: ({ children }) => (
                               <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-gray-800">
                                 {children}
                               </code>
                             ),
                             pre: ({ children }) => (
                               <pre className="bg-gray-200 p-3 rounded-lg overflow-x-auto mb-4">
                                 {children}
                               </pre>
                             ),
                             blockquote: ({ children }) => (
                               <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4">
                                 {children}
                               </blockquote>
                             ),
                           }}
                         >
                           {selectedResult.analysisResult.analysis}
                         </ReactMarkdown>
                       </div>
                     </div>
                   )}
                   
                   {/* Structured Data Sections */}
                   {selectedResult.analysisResult.strengths && selectedResult.analysisResult.strengths.length > 0 && (
                     <div className="bg-green-50 p-4 rounded-lg">
                       <h4 className="font-medium text-green-900 mb-3 flex items-center">
                         <CheckCircle className="w-5 h-5 mr-2" />
                         Strengths ({selectedResult.analysisResult.strengths.length})
                       </h4>
                       <ul className="space-y-2">
                         {selectedResult.analysisResult.strengths.map((strength: string, index: number) => (
                           <li key={index} className="flex items-start text-green-800">
                             <span className="flex-shrink-0 w-5 h-5 bg-green-200 text-green-700 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                               {index + 1}
                             </span>
                             <span>{strength}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                   
                   {selectedResult.analysisResult.improvements && selectedResult.analysisResult.improvements.length > 0 && (
                     <div className="bg-yellow-50 p-4 rounded-lg">
                       <h4 className="font-medium text-yellow-900 mb-3 flex items-center">
                         <AlertTriangle className="w-5 h-5 mr-2" />
                         Recommended Improvements ({selectedResult.analysisResult.improvements.length})
                       </h4>
                       <ul className="space-y-2">
                         {selectedResult.analysisResult.improvements.map((improvement: string, index: number) => (
                           <li key={index} className="flex items-start text-yellow-800">
                             <span className="flex-shrink-0 w-5 h-5 bg-yellow-200 text-yellow-700 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                               {index + 1}
                             </span>
                             <span>{improvement}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                   
                   {selectedResult.analysisResult.riskFactors && selectedResult.analysisResult.riskFactors.length > 0 && (
                     <div className="bg-red-50 p-4 rounded-lg">
                       <h4 className="font-medium text-red-900 mb-3 flex items-center">
                         <AlertCircle className="w-5 h-5 mr-2" />
                         Risk Factors ({selectedResult.analysisResult.riskFactors.length})
                       </h4>
                       <ul className="space-y-2">
                         {selectedResult.analysisResult.riskFactors.map((risk: string, index: number) => (
                           <li key={index} className="flex items-start text-red-800">
                             <span className="flex-shrink-0 w-5 h-5 bg-red-200 text-red-700 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                               {index + 1}
                             </span>
                             <span>{risk}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
} 