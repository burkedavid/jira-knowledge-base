'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, Play, Pause, RefreshCw, Filter, X, Calendar, CheckCircle, AlertTriangle, Clock, BarChart3, FileText, Users, Target, TrendingUp, Shield, Lightbulb, Bug, Zap, Award, AlertCircle, Download, StopCircle, Trash2, Database, ExternalLink, ChevronDown } from 'lucide-react'

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

interface AnalysisBatch {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  totalStories: number
  analyzedStories: number
  averageScore?: number
  riskDistribution?: {
    low: number
    medium: number
    high: number
    critical: number
  }
  createdAt: string
  completedAt?: string
  filters?: any
}

interface RequirementAnalysis {
  id: string
  userStoryId: string
  qualityScore: number
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  strengths: string[]
  improvements: string[]
  riskFactors: string[]
  fullAnalysis: string
  createdAt: string
  userStory?: UserStory
}

export default function BatchAnalysisPage() {
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [batches, setBatches] = useState<AnalysisBatch[]>([])
  const [batchAnalyses, setBatchAnalyses] = useState<RequirementAnalysis[]>([])
  const [selectedBatch, setSelectedBatch] = useState<AnalysisBatch | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStartingBatch, setIsStartingBatch] = useState(false)
  const [batchName, setBatchName] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  // Filter states
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedComponents, setSelectedComponents] = useState<string[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  // Real-time batch processing states
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)
  const [batchProgress, setBatchProgress] = useState<{[batchId: string]: RequirementAnalysis[]}>({})
  const [processingStoryId, setProcessingStoryId] = useState<string | null>(null)

  // Available filter options
  const [priorities, setPriorities] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [components, setComponents] = useState<string[]>([])
  const [assignees, setAssignees] = useState<string[]>([])

  useEffect(() => {
    fetchUserStories()
    fetchBatches()
  }, [])

  // Real-time processing effect for active batches
  useEffect(() => {
    const runningBatches = batches.filter(batch => batch.status === 'running')
    console.log('🔄 Processing effect triggered:', { runningBatches: runningBatches.length, activeBatchId })
    
    if (runningBatches.length > 0 && !activeBatchId) {
      // Only process one batch at a time
      const batchToProcess = runningBatches[0]
      console.log('🚀 Starting processing for batch:', batchToProcess.id)
      setActiveBatchId(batchToProcess.id)
      
      const processSequentially = async () => {
        try {
          console.log('📡 Making PUT request to process batch:', batchToProcess.id)
          const response = await fetch(`/api/analyze/requirements-batch?batchId=${batchToProcess.id}&action=process`, {
            method: 'PUT'
          })

          console.log('📡 Response status:', response.status)
          if (response.ok) {
            const data = await response.json()
            console.log('📡 Response data:', data)
            
            if (data.completed) {
              // Batch completed - refresh batches list
              console.log('✅ Batch completed!')
              fetchBatches()
              setActiveBatchId(null)
              setProcessingStoryId(null)
            } else if (data.analysis) {
              // New analysis completed - add to real-time progress
              setBatchProgress(prev => ({
                ...prev,
                [batchToProcess.id]: [...(prev[batchToProcess.id] || []), data.analysis]
              }))
              
              // Update batch progress in batches list
              setBatches(prev => prev.map(batch => 
                batch.id === batchToProcess.id 
                  ? { ...batch, analyzedStories: data.analyzedStories || batch.analyzedStories }
                  : batch
              ))
              
              setProcessingStoryId(null)
              
              // Continue processing next story after a short delay
              setTimeout(() => {
                if (activeBatchId === batchToProcess.id) {
                  processSequentially()
                }
              }, 1000)
            }
          } else if (response.status === 404) {
            // Batch not found (deleted), remove from state
            setBatches(prev => prev.filter(batch => batch.id !== batchToProcess.id))
            setBatchProgress(prev => {
              const newProgress = { ...prev }
              delete newProgress[batchToProcess.id]
              return newProgress
            })
            setActiveBatchId(null)
            setProcessingStoryId(null)
          }
        } catch (error) {
          console.error('Error processing batch step:', error)
          setActiveBatchId(null)
        }
      }
      
      processSequentially()
    }
  }, [batches, activeBatchId])

  const fetchUserStories = async () => {
    try {
      const response = await fetch('/api/user-stories?limit=10000')
      if (response.ok) {
        const data = await response.json()
        setUserStories(data.userStories || [])
        
        // Extract unique filter options
        const stories = data.userStories || []
        setPriorities(Array.from(new Set(stories.map((s: UserStory) => s.priority).filter(Boolean))))
        setStatuses(Array.from(new Set(stories.map((s: UserStory) => s.status).filter(Boolean))))
        setComponents(Array.from(new Set(stories.map((s: UserStory) => s.component).filter(Boolean))))
        setAssignees(Array.from(new Set(stories.map((s: UserStory) => s.assignee).filter(Boolean))))
      }
    } catch (error) {
      console.error('Error fetching user stories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/analyze/requirements-batch')
      if (response.ok) {
        const data = await response.json()
        setBatches(data.batches || [])
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
    }
  }

  const fetchBatchAnalyses = async (batchId: string) => {
    try {
      const response = await fetch(`/api/analyze/requirements-batch?batchId=${batchId}`)
      if (response.ok) {
        const data = await response.json()
        setBatchAnalyses(data.analyses || [])
      }
    } catch (error) {
      console.error('Error fetching batch analyses:', error)
    }
  }

  const startBatchAnalysis = async () => {
    if (!batchName.trim()) {
      alert('Please enter a batch name')
      return
    }

    setIsStartingBatch(true)
    try {
      console.log('🚀 Starting batch analysis...')
      const filters: any = {}
      
      if (selectedPriorities.length > 0) filters.priority = selectedPriorities
      if (selectedStatuses.length > 0) filters.status = selectedStatuses
      if (selectedComponents.length > 0) filters.component = selectedComponents
      if (selectedAssignees.length > 0) filters.assignee = selectedAssignees
      if (dateRange.start || dateRange.end) {
        const dateRangeFilter: any = {}
        if (dateRange.start && dateRange.start.trim()) {
          dateRangeFilter.start = dateRange.start
        }
        if (dateRange.end && dateRange.end.trim()) {
          dateRangeFilter.end = dateRange.end
        }
        if (dateRangeFilter.start || dateRangeFilter.end) {
          filters.dateRange = dateRangeFilter
        }
      }

      console.log('📋 Request payload:', { name: batchName, filters })

      const response = await fetch('/api/analyze/requirements-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: batchName,
          filters
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Response data:', data)
        
        if (data.success && data.batch) {
          setBatches(prev => [data.batch, ...prev])
          setBatchName('')
          clearFilters()
          
          // Start real-time processing for this batch
          setActiveBatchId(data.batch.id)
          setBatchProgress(prev => ({ ...prev, [data.batch.id]: [] }))
          
          alert(`Batch analysis "${data.batch.name}" started successfully!`)
        } else {
          console.error('❌ Unexpected response format:', data)
          alert('Failed to start batch analysis: Unexpected response format')
        }
      } else {
        const error = await response.json()
        console.error('❌ Server error:', error)
        alert(`Failed to start batch analysis: ${error.error}`)
      }
    } catch (error) {
      console.error('❌ Client error starting batch analysis:', error)
      alert(`Failed to start batch analysis: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsStartingBatch(false)
    }
  }

  const clearFilters = () => {
    setSelectedPriorities([])
    setSelectedStatuses([])
    setSelectedComponents([])
    setSelectedAssignees([])
    setDateRange({ start: '', end: '' })
  }

  const cancelBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`Cancel batch "${batchName}"? Any completed analyses will be preserved.`)) {
      return
    }

    try {
      const response = await fetch(`/api/analyze/requirements-batch?batchId=${batchId}&action=cancel`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        fetchBatches()
        
        // Stop real-time processing for this batch
        if (activeBatchId === batchId) {
          setActiveBatchId(null)
          setProcessingStoryId(null)
        }
      } else {
        const error = await response.json()
        alert(`Failed to cancel batch: ${error.error}`)
      }
    } catch (error) {
      console.error('Error cancelling batch:', error)
      alert('Failed to cancel batch')
    }
  }

  const deleteBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`Delete batch "${batchName}" and ALL its analyses? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/analyze/requirements-batch?batchId=${batchId}&action=delete`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        fetchBatches()
        
        // Clean up real-time state
        setBatchProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[batchId]
          return newProgress
        })
        
        if (activeBatchId === batchId) {
          setActiveBatchId(null)
          setProcessingStoryId(null)
        }
        
        if (selectedBatch?.id === batchId) {
          setSelectedBatch(null)
          setBatchAnalyses([])
        }
      } else {
        const error = await response.json()
        alert(`Failed to delete batch: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting batch:', error)
      alert('Failed to delete batch')
    }
  }

  // Fixed filtering logic to match backend exactly
  const getFilteredStoriesCount = () => {
    return userStories.filter(story => {
      // Priority filter
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(story.priority || '')) return false
      
      // Status filter  
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(story.status || '')) return false
      
      // Component filter
      if (selectedComponents.length > 0 && !selectedComponents.includes(story.component || '')) return false
      
      // Assignee filter
      if (selectedAssignees.length > 0 && !selectedAssignees.includes(story.assignee || '')) return false
      
      // Date range filter - match backend logic exactly
      if (dateRange.start && dateRange.start.trim() && story.createdAt) {
        const startDate = new Date(dateRange.start)
        const storyDate = new Date(story.createdAt)
        if (!isNaN(startDate.getTime()) && storyDate < startDate) return false
      }
      
      if (dateRange.end && dateRange.end.trim() && story.createdAt) {
        const endDate = new Date(dateRange.end)
        // Set end date to end of day to match backend logic
        endDate.setHours(23, 59, 59, 999)
        const storyDate = new Date(story.createdAt)
        if (!isNaN(endDate.getTime()) && storyDate > endDate) return false
      }
      
      return true
    }).length
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'running': return Play
      case 'failed': return AlertTriangle
      case 'cancelled': return StopCircle
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'running': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'cancelled': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                href="/analyze/requirements" 
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Requirements Analysis
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Batch Requirements Analysis
            </h1>
            <button
              onClick={fetchBatches}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Start New Batch */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Start New Batch Analysis
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Batch Name
                  </label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g., Sprint 24 Analysis"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Filters
                  </span>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    {showFilters ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showFilters && (
                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    {/* Priority Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Priority
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {priorities.map(priority => (
                          <label key={priority} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedPriorities.includes(priority)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPriorities(prev => [...prev, priority])
                                } else {
                                  setSelectedPriorities(prev => prev.filter(p => p !== priority))
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">{priority}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Status
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {statuses.map(status => (
                          <label key={status} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes(status)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStatuses(prev => [...prev, status])
                                } else {
                                  setSelectedStatuses(prev => prev.filter(s => s !== status))
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Component Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Component
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {components.slice(0, 5).map(component => (
                          <label key={component} className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedComponents.includes(component)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedComponents(prev => [...prev, component])
                                } else {
                                  setSelectedComponents(prev => prev.filter(c => c !== component))
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">{component}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                        />
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      onClick={clearFilters}
                      className="w-full px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getFilteredStoriesCount()} user stories will be analyzed
                </div>

                {isStartingBatch ? (
                  <div className="flex items-center justify-center py-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                    <span className="text-blue-600">Starting analysis...</span>
                  </div>
                ) : (
                  <button
                    onClick={startBatchAnalysis}
                    disabled={!batchName.trim() || getFilteredStoriesCount() === 0}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Batch Analysis
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Batch History with Real-time Progress */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Batch Analysis Progress
                </h2>
              </div>
              
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Loading batches...</span>
                  </div>
                ) : batches.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No batch analyses yet</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Start your first batch analysis to see real-time progress here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {batches.map((batch) => {
                      const StatusIcon = getStatusIcon(batch.status)
                      const batchResults = batchProgress[batch.id] || []
                      const isRunning = batch.status === 'running'
                      
                      return (
                        <div
                          key={batch.id}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden"
                        >
                          {/* Batch Header */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-md ${getStatusColor(batch.status)}`}>
                                  <StatusIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {batch.name}
                                  </h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span>{batch.analyzedStories}/{batch.totalStories} stories analyzed</span>
                                    {batch.averageScore && <span>Avg Score: {batch.averageScore.toFixed(1)}/10</span>}
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                                      {batch.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className="text-right mr-3">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {batch.createdAt && !isNaN(new Date(batch.createdAt).getTime()) 
                                      ? new Date(batch.createdAt).toLocaleDateString()
                                      : 'Invalid Date'
                                    }
                                  </p>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center space-x-1">
                                  {batch.status === 'running' && (
                                    <button
                                      onClick={() => cancelBatch(batch.id, batch.name)}
                                      className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded transition-colors"
                                      title="Cancel batch (preserve completed analyses)"
                                    >
                                      <StopCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => deleteBatch(batch.id, batch.name)}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Delete batch and all analyses"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            {isRunning && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  <span>Analysis Progress</span>
                                  <span>{Math.round((batch.analyzedStories / batch.totalStories) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(batch.analyzedStories / batch.totalStories) * 100}%` }}
                                  ></div>
                                </div>
                                {processingStoryId && (
                                  <div className="mt-2 flex items-center text-sm text-blue-600">
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                    Processing story...
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Real-time Results */}
                          {batchResults.length > 0 && (
                            <div className="p-4">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                Completed Analyses ({batchResults.length})
                              </h4>
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {batchResults.map((analysis, index) => {
                                  // Always use the database score, don't parse from text to avoid inconsistencies
                                  const analysisText = analysis.fullAnalysis || ''
                                  const displayScore = analysis.qualityScore || 0
                                  
                                  // Clean up arrays
                                  const strengths = (analysis.strengths || []).filter((s: string) => s && s.trim().length > 5)
                                  const improvements = (analysis.improvements || []).filter((i: string) => i && i.trim().length > 5)
                                  const risks = (analysis.riskFactors || []).filter((r: string) => r && r.trim().length > 5)
                                  
                                  const getScoreColor = (score: number) => {
                                    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                                    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
                                    return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                                  }
                                  
                                  const getScoreLabel = (score: number) => {
                                    if (score >= 8) return 'Excellent'
                                    if (score >= 6) return 'Good'
                                    return 'Needs Work'
                                  }

                                  const cleanText = (text: string) => {
                                    return text.replace(/^\*\*[^*]+\*\*:?\s*/, '').trim()
                                  }

                                  return (
                                    <div key={analysis.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                                      
                                      {/* Header */}
                                      <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                              {analysis.userStory?.jiraKey && (
                                                <span className="text-blue-600 mr-3">{analysis.userStory.jiraKey}</span>
                                              )}
                                              {analysis.userStory?.title || 'Analysis Result'}
                                            </h3>
                                            {analysis.userStory?.component && (
                                              <span className="inline-block mt-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                                {analysis.userStory.component}
                                              </span>
                                            )}
                                          </div>
                                          
                                          {/* Quality Score */}
                                          <div className={`px-6 py-4 rounded-lg border ${getScoreColor(displayScore)}`}>
                                            <div className="text-center">
                                              <div className="text-3xl font-bold">{displayScore}/10</div>
                                              <div className="text-base font-medium mt-1">{getScoreLabel(displayScore)}</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Content */}
                                      <div className="px-8 py-6 space-y-8">
                                        
                                        {/* Strengths */}
                                        {strengths.length > 0 && (
                                          <div>
                                            <h4 className="flex items-center text-base font-semibold text-green-700 dark:text-green-300 mb-4">
                                              <CheckCircle className="h-5 w-5 mr-3" />
                                              Strengths ({strengths.length})
                                            </h4>
                                            <ul className="space-y-3">
                                              {strengths.map((strength: string, index: number) => (
                                                <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-medium mr-4 mt-1">
                                                    {index + 1}
                                                  </span>
                                                  <span className="leading-relaxed">{cleanText(strength)}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {/* Improvements */}
                                        {improvements.length > 0 && (
                                          <div>
                                            <h4 className="flex items-center text-base font-semibold text-yellow-700 dark:text-yellow-300 mb-4">
                                              <AlertTriangle className="h-5 w-5 mr-3" />
                                              Recommended Improvements ({improvements.length})
                                            </h4>
                                            <ul className="space-y-3">
                                              {improvements.map((improvement: string, index: number) => (
                                                <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-xs font-medium mr-4 mt-1">
                                                    {index + 1}
                                                  </span>
                                                  <span className="leading-relaxed">{cleanText(improvement)}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {/* Risk Factors */}
                                        {risks.length > 0 && (
                                          <div>
                                            <h4 className="flex items-center text-base font-semibold text-red-700 dark:text-red-300 mb-4">
                                              <AlertCircle className="h-5 w-5 mr-3" />
                                              Risk Factors ({risks.length})
                                            </h4>
                                            <ul className="space-y-3">
                                              {risks.map((risk: string, index: number) => (
                                                <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                                  <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-medium mr-4 mt-1">
                                                    {index + 1}
                                                  </span>
                                                  <span className="leading-relaxed">{cleanText(risk)}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {/* Full Analysis Toggle */}
                                        {analysisText && (
                                          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                            <details className="group">
                                              <summary className="flex items-center cursor-pointer text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                                <FileText className="h-4 w-4 mr-2" />
                                                Show Complete Analysis Report
                                                <ChevronDown className="h-4 w-4 ml-2 transform transition-transform group-open:rotate-180" />
                                              </summary>
                                              
                                              <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                                                    {analysisText}
                                                  </pre>
                                                </div>
                                              </div>
                                            </details>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          
                          {/* Risk Distribution for Completed Batches */}
                          {batch.status === 'completed' && batch.riskDistribution && (
                            <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Risk Distribution</h4>
                              <div className="grid grid-cols-4 gap-3">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600">{batch.riskDistribution.low}</div>
                                  <div className="text-xs text-gray-500">Low Risk</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-yellow-600">{batch.riskDistribution.medium}</div>
                                  <div className="text-xs text-gray-500">Medium Risk</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-orange-600">{batch.riskDistribution.high}</div>
                                  <div className="text-xs text-gray-500">High Risk</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-red-600">{batch.riskDistribution.critical}</div>
                                  <div className="text-xs text-gray-500">Critical Risk</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results Modal */}
        {selectedBatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedBatch.name} - Analysis Results
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span>{selectedBatch.totalStories} stories analyzed</span>
                    <span>•</span>
                    <span>Avg Score: {selectedBatch.averageScore?.toFixed(1) || 'N/A'}/10</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                      <Database className="h-4 w-4" />
                      <span>Enhanced with Knowledge Base</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedBatch(null)
                    setBatchAnalyses([])
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                {selectedBatch.status === 'completed' && batchAnalyses.length > 0 ? (
                  <div className="space-y-6">
                    {batchAnalyses.map((analysis) => {
                      // Always use the database score, don't parse from text to avoid inconsistencies
                      const analysisText = analysis.fullAnalysis || ''
                      const displayScore = analysis.qualityScore || 0
                      
                      // Clean up arrays
                      const strengths = (analysis.strengths || []).filter((s: string) => s && s.trim().length > 5)
                      const improvements = (analysis.improvements || []).filter((i: string) => i && i.trim().length > 5)
                      const risks = (analysis.riskFactors || []).filter((r: string) => r && r.trim().length > 5)
                      
                      const getScoreColor = (score: number) => {
                        if (score >= 8) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                        if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
                        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                      }
                      
                      const getScoreLabel = (score: number) => {
                        if (score >= 8) return 'Excellent'
                        if (score >= 6) return 'Good'
                        return 'Needs Work'
                      }

                      const cleanText = (text: string) => {
                        return text.replace(/^\*\*[^*]+\*\*:?\s*/, '').trim()
                      }

                      return (
                        <div key={analysis.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                          
                          {/* Header */}
                          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                  {analysis.userStory?.jiraKey && (
                                    <span className="text-blue-600 mr-3">{analysis.userStory.jiraKey}</span>
                                  )}
                                  {analysis.userStory?.title || 'Analysis Result'}
                                </h3>
                                {analysis.userStory?.component && (
                                  <span className="inline-block mt-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                    {analysis.userStory.component}
                                  </span>
                                )}
                              </div>
                              
                              {/* Quality Score */}
                              <div className={`px-6 py-4 rounded-lg border ${getScoreColor(displayScore)}`}>
                                <div className="text-center">
                                  <div className="text-3xl font-bold">{displayScore}/10</div>
                                  <div className="text-base font-medium mt-1">{getScoreLabel(displayScore)}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="px-8 py-6 space-y-8">
                            
                            {/* Strengths */}
                            {strengths.length > 0 && (
                              <div>
                                <h4 className="flex items-center text-base font-semibold text-green-700 dark:text-green-300 mb-4">
                                  <CheckCircle className="h-5 w-5 mr-3" />
                                  Strengths ({strengths.length})
                                </h4>
                                <ul className="space-y-3">
                                  {strengths.map((strength: string, index: number) => (
                                    <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                      <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-medium mr-4 mt-1">
                                        {index + 1}
                                      </span>
                                      <span className="leading-relaxed">{cleanText(strength)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Improvements */}
                            {improvements.length > 0 && (
                              <div>
                                <h4 className="flex items-center text-base font-semibold text-yellow-700 dark:text-yellow-300 mb-4">
                                  <AlertTriangle className="h-5 w-5 mr-3" />
                                  Recommended Improvements ({improvements.length})
                                </h4>
                                <ul className="space-y-3">
                                  {improvements.map((improvement: string, index: number) => (
                                    <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                      <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-xs font-medium mr-4 mt-1">
                                        {index + 1}
                                      </span>
                                      <span className="leading-relaxed">{cleanText(improvement)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Risk Factors */}
                            {risks.length > 0 && (
                              <div>
                                <h4 className="flex items-center text-base font-semibold text-red-700 dark:text-red-300 mb-4">
                                  <AlertCircle className="h-5 w-5 mr-3" />
                                  Risk Factors ({risks.length})
                                </h4>
                                <ul className="space-y-3">
                                  {risks.map((risk: string, index: number) => (
                                    <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                      <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-medium mr-4 mt-1">
                                        {index + 1}
                                      </span>
                                      <span className="leading-relaxed">{cleanText(risk)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Full Analysis Toggle */}
                            {analysisText && (
                              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <details className="group">
                                  <summary className="flex items-center cursor-pointer text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Show Complete Analysis Report
                                    <ChevronDown className="h-4 w-4 ml-2 transform transition-transform group-open:rotate-180" />
                                  </summary>
                                  
                                  <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                      <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                                        {analysisText}
                                      </pre>
                                    </div>
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : selectedBatch.status === 'running' ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2 text-blue-600">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Analysis in progress... {selectedBatch.analyzedStories}/{selectedBatch.totalStories} completed</span>
                    </div>
                  </div>
                ) : selectedBatch.status === 'failed' ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Analysis failed</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No analysis results available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 