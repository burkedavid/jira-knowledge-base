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
  RefreshCw
} from 'lucide-react'
import UserMenu from '@/components/auth/user-menu'

interface PlatformStats {
  userStories: number
  testCases: number
  defects: number
  documents: number
  embeddings: number
  requirementAnalyses: number
  averageQualityScore: number
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
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      // Fetch all stats in parallel
      const [userStoriesRes, testCasesRes, defectsRes, documentsRes] = await Promise.all([
        fetch('/api/user-stories'),
        fetch('/api/test-cases'),
        fetch('/api/defects'),
        fetch('/api/documents')
      ])

      const [userStoriesData, testCasesData, defectsData, documentsData] = await Promise.all([
        userStoriesRes.json(),
        testCasesRes.json(),
        defectsRes.json(),
        documentsRes.json()
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
        userStories: userStoriesData.total || userStoriesData.userStories?.length || (Array.isArray(userStoriesData) ? userStoriesData.length : 0),
        testCases: testCasesData.total || testCasesData.testCases?.length || (Array.isArray(testCasesData) ? testCasesData.length : 0),
        defects: defectsData.total || defectsData.defects?.length || (Array.isArray(defectsData) ? defectsData.length : 0),
        documents: documentsData.total || documentsData.documents?.length || (Array.isArray(documentsData) ? documentsData.length : 0),
        embeddings: embeddingsCount,
        requirementAnalyses: requirementAnalysesCount,
        averageQualityScore: Math.round(averageQualityScore * 10) / 10 // Round to 1 decimal place
      })
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
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                RAG Knowledge Base
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <UserMenu />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Testing & Requirements Platform
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Leverage RAG technology powered by Claude Sonnet 4 to generate comprehensive test cases, analyze requirements quality, 
            and identify defect patterns from your Jira data and documentation.
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
          
          {!isLoading && (stats.userStories > 0 || stats.defects > 0 || stats.documents > 0) && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  RAG System Active
                </div>
                {stats.embeddings > 0 && (
                  <div className="flex items-center">
                    <Brain className="h-4 w-4 mr-1 text-indigo-600" />
                    Vector Search Enabled
                  </div>
                )}
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