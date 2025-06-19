'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  FileText, 
  TestTube, 
  AlertTriangle, 
  TrendingUp,
  Database,
  Brain,
  Loader2,
  RefreshCw,
  Calendar
} from 'lucide-react'
import UserMenu from '@/components/auth/user-menu'
import AIHeader from '@/components/ui/ai-header'

interface PlatformStats {
  userStories: number
  testCases: number
  defects: number
  documents: number
  embeddings: number
  requirementAnalyses: number
  averageQualityScore: number
}

interface DateRangeInfo {
  hasData: boolean
  overall: {
    startDate: string
    endDate: string
    spanDays: number
    daysSinceLastUpdate: number
  }
  breakdown: {
    userStories: { startDate: string | null; endDate: string | null; spanDays: number }
    defects: { startDate: string | null; endDate: string | null; spanDays: number }
    documents: { startDate: string | null; endDate: string | null; spanDays: number }
    testCases: { startDate: string | null; endDate: string | null; spanDays: number }
  }
  freshness: {
    status: 'current' | 'recent' | 'moderate' | 'stale'
    daysSinceLastUpdate: number
    lastUpdateDate: string
  }
}

export default function HomePage() {
  const [stats, setStats] = useState<PlatformStats>({
    userStories: 0,
    testCases: 0,
    defects: 0,
    documents: 0,
    embeddings: 0,
    requirementAnalyses: 0,
    averageQualityScore: 0
  })
  const [dateRange, setDateRange] = useState<DateRangeInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      // Fetch all stats in parallel
      const [userStoriesRes, testCasesRes, defectsRes, documentsRes, dateRangeRes] = await Promise.all([
        fetch('/api/user-stories'),
        fetch('/api/test-cases'),
        fetch('/api/defects'),
        fetch('/api/documents'),
        fetch('/api/platform/date-range')
      ])

      const [userStoriesData, testCasesData, defectsData, documentsData, dateRangeData] = await Promise.all([
        userStoriesRes.json(),
        testCasesRes.json(),
        defectsRes.json(),
        documentsRes.json(),
        dateRangeRes.json()
      ])

      // Try to get embeddings stats
      let embeddingsCount = 0
      try {
        const embeddingsRes = await fetch('/api/embeddings/stats')
        if (embeddingsRes.ok) {
          const embeddingsData = await embeddingsRes.json()
          embeddingsCount = embeddingsData.total || 0
        }
      } catch (error) {
        console.log('Embeddings stats not available')
      }

      // Try to get requirement analysis stats
      let requirementAnalysesCount = 0
      let averageQualityScore = 0
      try {
        // Get all requirement analyses directly from the database
        const analysisRes = await fetch('/api/analyze/requirements-batch?getAllAnalyses=true')
        if (analysisRes.ok) {
          const analysisData = await analysisRes.json()
          requirementAnalysesCount = analysisData.totalAnalyses || 0
          averageQualityScore = analysisData.averageScore || 0
        }
      } catch (error) {
        console.log('Requirement analysis stats not available')
      }

      setStats({
        userStories: userStoriesData.originalTotal || userStoriesData.total || userStoriesData.userStories?.length || (Array.isArray(userStoriesData) ? userStoriesData.length : 0),
        testCases: testCasesData.originalTotal || testCasesData.total || testCasesData.testCases?.length || (Array.isArray(testCasesData) ? testCasesData.length : 0),
        defects: defectsData.originalTotal || defectsData.total || defectsData.defects?.length || (Array.isArray(defectsData) ? defectsData.length : 0),
        documents: documentsData.originalTotal || documentsData.total || documentsData.documents?.length || (Array.isArray(documentsData) ? documentsData.length : 0),
        embeddings: embeddingsCount,
        requirementAnalyses: requirementAnalysesCount,
        averageQualityScore: Math.round(averageQualityScore * 10) / 10 // Round to 1 decimal place
      })

      // Set date range data
      setDateRange(dateRangeData)

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* AI Header */}
      <AIHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Testing & Requirements Platform
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Analyze requirements, generate test cases and identify defect patterns using AI and your data.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Data Import */}
          <Link href="/import" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <Database className="h-8 w-8 text-orange-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Data Import
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Import data from Jira and upload documentation with batch processing and progress tracking.
              </p>
              <div className="text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                Import Data →
              </div>
            </div>
          </Link>

          {/* Requirements Analysis */}
          <Link href="/analyze/requirements" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Requirements Analysis
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Analyze user story quality, identify risks, and get AI-powered improvement suggestions.
              </p>
              <div className="text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                Analyze Quality →
              </div>
            </div>
          </Link>

          {/* Test Case Generation */}
          <Link href="/generate/test-cases" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <TestTube className="h-8 w-8 text-green-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Test Case Generation
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Generate comprehensive test cases from user stories using AI and historical defect patterns.
              </p>
              <div className="text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                Generate Tests →
              </div>
            </div>
          </Link>

          {/* Defect Intelligence */}
          <Link href="/analytics/defects" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Defect Intelligence
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Discover defect patterns, identify hotspots, and predict quality risks across components.
              </p>
              <div className="text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                View Analytics →
              </div>
            </div>
          </Link>

          {/* AI Defect Root Cause Analysis */}
          <Link href="/analytics/defects/search" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                  AI Defect Root Cause Analysis
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Search defects with AI-powered root cause analysis using user stories and documentation.
              </p>
              <div className="text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                Search & Analyze →
              </div>
            </div>
          </Link>

          {/* Knowledge Search */}
          <Link href="/search" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <Brain className="h-8 w-8 text-indigo-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Knowledge Search
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Semantic search across user stories, defects, and documentation using vector embeddings.
              </p>
              <div className="text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                Search Knowledge →
              </div>
            </div>
          </Link>
        </div>

        {/* Dynamic Platform Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Platform Overview
            </h3>
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={fetchStats}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Refresh stats"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading platform stats...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.userStories.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">User Stories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.testCases.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Test Cases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.defects.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Defects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.documents.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.requirementAnalyses.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Quality Assessments</div>
                {stats.requirementAnalyses > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Avg: {stats.averageQualityScore}/10
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats.embeddings.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Embeddings</div>
              </div>
            </div>
          )}

          {/* Enhanced RAG Data Coverage */}
          {!isLoading && dateRange && dateRange.hasData && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {/* Header with animated status */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-sm opacity-30 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                      <Database className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      RAG Data Coverage Analysis
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Comprehensive data span and freshness metrics
                    </p>
                  </div>
                </div>
                
                {/* Status Badge with glow effect */}
                <div className="relative">
                  <div className={`absolute inset-0 rounded-full blur-md opacity-50 ${
                    dateRange.freshness.status === 'current' ? 'bg-green-400' :
                    dateRange.freshness.status === 'recent' ? 'bg-blue-400' :
                    dateRange.freshness.status === 'moderate' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}></div>
                  <div className={`relative px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 ${
                    dateRange.freshness.status === 'current' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    dateRange.freshness.status === 'recent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                    dateRange.freshness.status === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      dateRange.freshness.status === 'current' ? 'bg-green-500' :
                      dateRange.freshness.status === 'recent' ? 'bg-blue-500' :
                      dateRange.freshness.status === 'moderate' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span>
                      {dateRange.freshness.status === 'current' ? 'Current' :
                       dateRange.freshness.status === 'recent' ? 'Recent' :
                       dateRange.freshness.status === 'moderate' ? 'Moderate' :
                       'Stale'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Main Coverage Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Date Range Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h5 className="font-semibold text-blue-900 dark:text-blue-100">Date Range</h5>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-800 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {dateRange.overall.spanDays} days
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700 dark:text-blue-300">From:</span>
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {new Date(dateRange.overall.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700 dark:text-blue-300">To:</span>
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {new Date(dateRange.overall.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Visual timeline */}
                    <div className="mt-4">
                      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" style={{width: '100%'}}></div>
                      </div>
                      <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 mt-1">
                        <span>Start</span>
                        <span>Current</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Data Freshness Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <h5 className="font-semibold text-green-900 dark:text-green-100">Data Freshness</h5>
                    </div>
                    <div className="bg-green-100 dark:bg-green-800 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        {dateRange.freshness.daysSinceLastUpdate === 0 ? 'Today' : 
                         `${dateRange.freshness.daysSinceLastUpdate}d ago`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-700 dark:text-green-300">Last Update:</span>
                      <span className="text-sm font-medium text-green-900 dark:text-green-100">
                        {new Date(dateRange.freshness.lastUpdateDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Freshness indicator */}
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-green-700 dark:text-green-300">Freshness Score:</span>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          dateRange.freshness.status === 'current' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' :
                          dateRange.freshness.status === 'recent' ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200' :
                          dateRange.freshness.status === 'moderate' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                          'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                        }`}>
                          {dateRange.freshness.status === 'current' ? '95%' :
                           dateRange.freshness.status === 'recent' ? '80%' :
                           dateRange.freshness.status === 'moderate' ? '60%' :
                           '30%'}
                        </div>
                      </div>
                      <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                        <div className={`h-2 rounded-full ${
                          dateRange.freshness.status === 'current' ? 'bg-green-500 w-[95%]' :
                          dateRange.freshness.status === 'recent' ? 'bg-blue-500 w-[80%]' :
                          dateRange.freshness.status === 'moderate' ? 'bg-yellow-500 w-[60%]' :
                          'bg-red-500 w-[30%]'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Data Breakdown Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h5 className="font-semibold text-purple-900 dark:text-purple-100">Coverage Breakdown</h5>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* User Stories */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-purple-700 dark:text-purple-300">User Stories</span>
                      </div>
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        {dateRange.breakdown.userStories.spanDays}d
                      </span>
                    </div>
                    
                    {/* Defects */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-purple-700 dark:text-purple-300">Defects</span>
                      </div>
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        {dateRange.breakdown.defects.spanDays}d
                      </span>
                    </div>
                    
                    {/* Documents */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-purple-700 dark:text-purple-300">Documents</span>
                      </div>
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        {dateRange.breakdown.documents.spanDays}d
                      </span>
                    </div>
                    
                    {/* Test Cases */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-purple-700 dark:text-purple-300">Test Cases</span>
                      </div>
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        {dateRange.breakdown.testCases.spanDays}d
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* RAG System Status */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">RAG System Active</span>
                    </div>
                    
                    {stats.embeddings > 0 && (
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Vector Search Enabled</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Semantic Search</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span>AI Analysis</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Real-time</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-300">
            <p>&copy; 2025 RAG Knowledge Base. Powered by AWS Bedrock + Claude Sonnet 4 and Next.js.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 