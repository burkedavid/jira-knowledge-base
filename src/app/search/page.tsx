'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Search, Brain, FileText, TestTube, AlertTriangle, Loader2, Sparkles, Copy, Download, History, Trash2, Clock } from 'lucide-react'
import PageLayout from '@/components/ui/page-layout'

interface SearchResult {
  id: string
  type: string
  title: string
  content: string
  similarity: number
  metadata?: any
  entityData?: {
    jiraKey?: string
    title?: string
    [key: string]: any
  }
}

interface RAGResponse {
  answer: string
  sources: SearchResult[]
  confidence: number
  query?: string
  totalSources?: number
  searchDetails?: any
  followUpQuestions?: string[]
}

interface SearchHistoryItem {
  id: string
  query: string
  mode: 'semantic' | 'rag'
  timestamp: number
  ragResponse?: RAGResponse
  results?: SearchResult[]
  confidence?: number
  totalSources?: number
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [ragResponse, setRagResponse] = useState<RAGResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState<'semantic' | 'rag'>('rag')
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('knowledgeSearchHistory')
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory)
        setSearchHistory(history)
      } catch (error) {
        console.error('Error loading search history:', error)
      }
    }
  }, [])

  // Save search history to localStorage
  const saveSearchHistory = (historyItems: SearchHistoryItem[]) => {
    try {
      localStorage.setItem('knowledgeSearchHistory', JSON.stringify(historyItems))
      setSearchHistory(historyItems)
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  }

  // Add search to history
  const addToHistory = (query: string, mode: 'semantic' | 'rag', ragResponse?: RAGResponse, results?: SearchResult[]) => {
    const historyItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query,
      mode,
      timestamp: Date.now(),
      ragResponse,
      results,
      confidence: ragResponse?.confidence,
      totalSources: ragResponse?.totalSources || results?.length || 0
    }

    const updatedHistory = [historyItem, ...searchHistory.slice(0, 19)] // Keep last 20 searches
    saveSearchHistory(updatedHistory)
  }

  // Clear search history
  const clearHistory = () => {
    saveSearchHistory([])
  }

  // Load search from history
  const loadFromHistory = (historyItem: SearchHistoryItem) => {
    setQuery(historyItem.query)
    setSearchMode(historyItem.mode)
    if (historyItem.ragResponse) {
      setRagResponse(historyItem.ragResponse)
      setResults(historyItem.ragResponse.sources || [])
    } else if (historyItem.results) {
      setResults(historyItem.results)
      setRagResponse(null)
    }
    setShowHistory(false)
  }

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return
    
    setIsSearching(true)
    setResults([])
    setRagResponse(null)
    
    try {
      if (searchMode === 'rag') {
        // RAG-powered search with intelligent response
        const finalQuery = searchQuery || query;

        const response = await fetch('/api/search/rag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: finalQuery.trim(),
            maxResults: 10,
            includeTypes: ['user_story', 'defect', 'document', 'test_case'],
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
          })
        })

        if (response.ok) {
          const data = await response.json()
          setRagResponse(data)
          setResults(data.sources || [])
          // Add to history
          addToHistory(finalQuery.trim(), searchMode, data)
        } else {
          throw new Error('RAG search failed')
        }
      } else {
        // Basic semantic search
        const response = await fetch('/api/search/semantic', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: finalQuery.trim(),
            limit: 10,
            threshold: 0.7
          })
        })

        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
          // Add to history
          addToHistory(finalQuery.trim(), searchMode, undefined, data.results || [])
        } else {
          throw new Error('Semantic search failed')
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSearching(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const getDisplayIdentifier = (result: SearchResult) => {
    // Priority 1: Jira Key
    if (result.entityData?.jiraKey) {
      return result.entityData.jiraKey
    }
    
    // Priority 2: Title (truncated if too long)
    if (result.entityData?.title) {
      const title = result.entityData.title
      return title.length > 50 ? `${title.substring(0, 50)}...` : title
    }
    
    // Priority 3: Content-based identifier
    if (result.title) {
      return result.title.length > 50 ? `${result.title.substring(0, 50)}...` : result.title
    }
    
    // Priority 4: Generate meaningful ID based on type
    const typePrefix = {
      'user_story': 'Story',
      'defect': 'Defect', 
      'test_case': 'Test',
      'document': 'Doc'
    }
    
    const prefix = typePrefix[result.type as keyof typeof typePrefix] || result.type
    const shortId = result.id.substring(result.id.length - 8) // Last 8 chars
    
    return `${prefix}-${shortId}`
  }

  const handleFollowUpClick = (question: string) => {
    setQuery(question);
    handleSearch(question);
  };

  const downloadResponse = (ragResponse: RAGResponse) => {
    const content = `Knowledge Search Results
Query: ${ragResponse.query || query}
Confidence: ${Math.round(ragResponse.confidence * 100)}%
Sources: ${ragResponse.totalSources || 0}
Generated: ${new Date().toLocaleString()}

${ragResponse.answer}

Sources:
${ragResponse.sources?.map((source, index) => 
  `${index + 1}. ${source.type.toUpperCase()}: ${source.content.substring(0, 200)}...`
).join('\n') || 'No sources'}
`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `knowledge-search-${query.replace(/\s+/g, '-')}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user_story': return <FileText className="h-4 w-4 text-blue-600" />
      case 'defect': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'test_case': return <TestTube className="h-4 w-4 text-green-600" />
      case 'document': return <Brain className="h-4 w-4 text-purple-600" />
      default: return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user_story': return 'User Story'
      case 'defect': return 'Defect'
      case 'test_case': return 'Test Case'
      case 'document': return 'Document'
      default: return 'Unknown'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user_story': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'defect': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'test_case': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'document': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const actionButtons = [
    {
      label: `History (${searchHistory.length})`,
      onClick: () => setShowHistory(!showHistory),
      icon: <History className="h-4 w-4" />,
      variant: 'outline' as const
    }
  ];

  return (
    <PageLayout
      title="Knowledge Search"
      subtitle="AI-powered search across your knowledge base using semantic similarity and RAG"
      icon={<Brain className="h-6 w-6 text-indigo-600" />}
      actionButtons={actionButtons}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Brain className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                AI-Powered Knowledge Search
              </h2>
            </div>
            
            {/* Search Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Mode:</span>
              <button
                onClick={() => setSearchMode('rag')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  searchMode === 'rag'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-1" />
                RAG
              </button>
              <button
                onClick={() => setSearchMode('semantic')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  searchMode === 'semantic'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Search className="h-4 w-4 inline mr-1" />
                Semantic
              </button>
            </div>
          </div>
          
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={searchMode === 'rag' 
                  ? "Ask me anything about your knowledge base (e.g., 'Tell me about Activities')" 
                  : "Search across user stories, defects, test cases, and documents..."
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-lg"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
              className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Date Range Filter */}
          {searchMode === 'rag' && (
            <div className="mt-4 space-y-4">
              {/* Quick Date Suggestions */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  📅 Quick Date Ranges:
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const today = new Date()
                      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                      setStartDate(lastWeek.toISOString().split('T')[0])
                      setEndDate(today.toISOString().split('T')[0])
                    }}
                    className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-300 rounded-full transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date()
                      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                      setStartDate(lastMonth.toISOString().split('T')[0])
                      setEndDate(today.toISOString().split('T')[0])
                    }}
                    className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full transition-colors"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date()
                      const lastQuarter = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
                      setStartDate(lastQuarter.toISOString().split('T')[0])
                      setEndDate(today.toISOString().split('T')[0])
                    }}
                    className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full transition-colors"
                  >
                    Last 3 Months
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date()
                      const currentYear = today.getFullYear()
                      setStartDate(`${currentYear}-01-01`)
                      setEndDate(today.toISOString().split('T')[0])
                    }}
                    className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full transition-colors"
                  >
                    This Year
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date()
                      const lastYear = today.getFullYear() - 1
                      setStartDate(`${lastYear}-01-01`)
                      setEndDate(`${lastYear}-12-31`)
                    }}
                    className="px-3 py-1 text-xs bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-800 dark:text-orange-300 rounded-full transition-colors"
                  >
                    Last Year
                  </button>
                  <button
                    onClick={() => {
                      setStartDate('')
                      setEndDate('')
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
                  >
                    Clear Dates
                  </button>
                </div>
              </div>

              {/* Manual Date Inputs */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Filter results created on or after this date.</p>
                </div>
                <div className="flex-1">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Filter results created on or before this date.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {searchMode === 'rag' 
                ? 'Get intelligent answers powered by Claude 4 and your knowledge base'
                : 'Find relevant content using semantic similarity search'
              }
            </p>
            {searchMode === 'rag' && (
              <div className="flex items-center text-xs text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by Claude 4
              </div>
            )}
          </div>
        </div>

        {/* Search History Panel */}
        {showHistory && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Search History
              </h3>
              {searchHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex items-center text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </button>
              )}
            </div>
            
            {searchHistory.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No search history yet. Start searching to see your queries here.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.query}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.mode === 'rag' 
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                          {item.mode.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                        {item.confidence && (
                          <div>Confidence: {Math.round(item.confidence * 100)}%</div>
                        )}
                        <div>{item.totalSources} sources</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enhanced RAG Response */}
        {ragResponse && searchMode === 'rag' && (
          <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-900/10 dark:via-gray-800 dark:to-purple-900/10 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-lg p-8 mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-4">
                  <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    AI Analysis
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive insights from your knowledge base
                  </p>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg px-3 py-1 border border-gray-200 dark:border-gray-600">
                  <span className="text-xs text-gray-600 dark:text-gray-300 mr-2">Confidence:</span>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {Math.round(ragResponse.confidence * 100)}%
                  </span>
                  <div className="ml-2 w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full" 
                      style={{ width: `${ragResponse.confidence * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <button
                  onClick={() => copyToClipboard(ragResponse.answer)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Copy response"
                >
                  <Copy className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => downloadResponse(ragResponse)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Download response"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Response Content */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-3">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside space-y-2 mb-4 ml-6 pl-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside space-y-2 mb-4 ml-6 pl-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900 dark:text-white">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-800 dark:text-gray-200">
                      {children}
                    </em>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-600 dark:text-gray-400 mb-4">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {ragResponse.answer}
              </ReactMarkdown>
            </div>

            {/* Follow-up Questions */}
            {ragResponse.followUpQuestions && ragResponse.followUpQuestions.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <Sparkles className="h-5 w-5 text-indigo-500 mr-2" />
                  Suggested Follow-ups
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ragResponse.followUpQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleFollowUpClick(q)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700/80 text-sm text-gray-900 dark:text-gray-100 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-all duration-200 ease-in-out transform hover:scale-105"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sources Summary */}
            {ragResponse.sources && ragResponse.sources.length > 0 && (
              <div className="mt-6 pt-6 border-t border-indigo-200 dark:border-indigo-800">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Sources Referenced ({ragResponse.sources.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ragResponse.sources.slice(0, 6).map((source, index) => (
                    <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        {getTypeIcon(source.type)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(source.similarity * 100)}% match
                        </span>
                      </div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                        {source.title}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {source.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {results.length > 0 && searchMode === 'semantic' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Search Results ({results.length})
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Sorted by relevance
              </div>
            </div>
            
            {results.map((result, index) => {
              return (
                <div key={result.id || index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      {getTypeIcon(result.type)}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(result.similarity * 100)}% match
                      </span>
                      <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${result.similarity * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {getDisplayIdentifier(result)}
                  </h4>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                    {result.content}
                  </p>
                  
                  <div className="mt-4 flex justify-end">
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !isSearching && !ragResponse && (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start searching your knowledge base
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchMode === 'rag' 
                ? 'Ask questions in natural language and get intelligent answers from your data'
                : 'Enter a query above to search across all your imported data using semantic similarity'
              }
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-w-4xl mx-auto">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-4">
                {searchMode === 'rag' ? 'Ask a question or try one of these suggestions:' : 'Enter a query or try one of these examples:'}
              </h4>
              
              {searchMode === 'rag' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* FusionLive Core Features */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-purple-800 dark:text-purple-200 uppercase tracking-wide flex items-center">
                      📁 Document Management
                    </h5>
                    <button
                      onClick={() => { setQuery('What are the common document upload issues and how can they be resolved?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What are the common document upload issues and how can they be resolved?
                    </button>
                    <button
                      onClick={() => { setQuery('Explain the FFC (Fusion File Converter) supported file formats and conversion process.'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      Explain the FFC (Fusion File Converter) supported file formats and conversion process.
                    </button>
                    <button
                      onClick={() => { setQuery('How does the PDFTron viewer handle markup conversion and what are the accuracy improvements?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      How does the PDFTron viewer handle markup conversion and what are the accuracy improvements?
                    </button>
                  </div>

                  {/* Activities & Workflows */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide flex items-center">
                      ⚡ Activities & Workflows
                    </h5>
                    <button
                      onClick={() => { setQuery('What are the different approval statuses available in FusionLive and when should each be used?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What are the different approval statuses available in FusionLive and when should each be used?
                    </button>
                    <button
                      onClick={() => { setQuery('How do Technical Query (TQ) stakeholders receive alerts and notifications?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      How do Technical Query (TQ) stakeholders receive alerts and notifications?
                    </button>
                    <button
                      onClick={() => { setQuery('What issues exist with submittal visibility for document controllers?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What issues exist with submittal visibility for document controllers?
                    </button>
                  </div>

                  {/* Mobile & Desktop Issues */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-green-800 dark:text-green-200 uppercase tracking-wide flex items-center">
                      📱 Mobile & Desktop
                    </h5>
                    <button
                      onClick={() => { setQuery('What are the key mobile issue management features and cross-company assignment capabilities?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What are the key mobile issue management features and cross-company assignment capabilities?
                    </button>
                    <button
                      onClick={() => { setQuery('What are the common .NET archiver application crashes and their solutions?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What are the common .NET archiver application crashes and their solutions?
                    </button>
                    <button
                      onClick={() => { setQuery('How do language preferences affect workspace loading in desktop applications?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      How do language preferences affect workspace loading in desktop applications?
                    </button>
                  </div>

                  {/* Web Services & Integration */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wide flex items-center">
                      🔗 Web Services & APIs
                    </h5>
                    <button
                      onClick={() => { setQuery('What webservice improvements are needed for document search API paging and performance?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What webservice improvements are needed for document search API paging and performance?
                    </button>
                    <button
                      onClick={() => { setQuery('How do code table metadata filters work in registerDocument and searchDocument webservices?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      How do code table metadata filters work in registerDocument and searchDocument webservices?
                    </button>
                    <button
                      onClick={() => { setQuery('What reporting webservice upgrades support deleted document information?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What reporting webservice upgrades support deleted document information?
                    </button>
                  </div>

                  {/* Critical Defects & Showstoppers */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-red-800 dark:text-red-200 uppercase tracking-wide flex items-center">
                      🚨 Critical Issues
                    </h5>
                    <button
                      onClick={() => { setQuery('What are the showstopper defects in PDFTron viewer and mobile issue management?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What are the showstopper defects in PDFTron viewer and mobile issue management?
                    </button>
                    <button
                      onClick={() => { setQuery('Analyze the high-severity defects in search functionality and date filtering.'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      Analyze the high-severity defects in search functionality and date filtering.
                    </button>
                    <button
                      onClick={() => { setQuery('What are the recent archiver and FFC rendition failure patterns?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What are the recent archiver and FFC rendition failure patterns?
                    </button>
                  </div>

                  {/* User Experience & Documentation */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-indigo-800 dark:text-indigo-200 uppercase tracking-wide flex items-center">
                      📚 User Experience
                    </h5>
                    <button
                      onClick={() => { setQuery('What user guide documentation updates are needed for BPA and file conversion?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What user guide documentation updates are needed for BPA and file conversion?
                    </button>
                    <button
                      onClick={() => { setQuery('How do browser zoom levels affect the user interface layout and controls?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      How do browser zoom levels affect the user interface layout and controls?
                    </button>
                    <button
                      onClick={() => { setQuery('What are the user preferences and settings available in FusionLive?'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      What are the user preferences and settings available in FusionLive?
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* FusionLive Components */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-purple-800 dark:text-purple-200 uppercase tracking-wide">🏗️ FusionLive Components</h5>
                    <button
                      onClick={() => { setQuery('PDFTron viewer markup conversion'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      PDFTron viewer markup conversion
                    </button>
                    <button
                      onClick={() => { setQuery('Tag Extraction FusionLive features'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      Tag Extraction FusionLive features
                    </button>
                    <button
                      onClick={() => { setQuery('Issue Management Web mobile'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      Issue Management Web mobile
                    </button>
                  </div>

                  {/* Critical Defects */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-red-800 dark:text-red-200 uppercase tracking-wide">🚨 Critical Issues</h5>
                    <button
                      onClick={() => { setQuery('showstopper severity archiver crash'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      showstopper severity archiver crash
                    </button>
                    <button
                      onClick={() => { setQuery('high severity search date filter'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      high severity search date filter
                    </button>
                    <button
                      onClick={() => { setQuery('FFC rendition failure conversion'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      FFC rendition failure conversion
                    </button>
                  </div>

                  {/* Document Management */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide">📄 Document Management</h5>
                    <button
                      onClick={() => { setQuery('document upload size limit 9GB'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      document upload size limit 9GB
                    </button>
                    <button
                      onClick={() => { setQuery('file formats xlsm msg conversion'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      file formats xlsm msg conversion
                    </button>
                    <button
                      onClick={() => { setQuery('work packages repackage folder'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      work packages repackage folder
                    </button>
                  </div>

                  {/* Activities & Approvals */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-green-800 dark:text-green-200 uppercase tracking-wide">⚡ Activities & Approvals</h5>
                    <button
                      onClick={() => { setQuery('approval status handed over operations'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      approval status handed over operations
                    </button>
                    <button
                      onClick={() => { setQuery('technical query TQ stakeholders alerts'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      technical query TQ stakeholders alerts
                    </button>
                    <button
                      onClick={() => { setQuery('submittal document controller visibility'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      submittal document controller visibility
                    </button>
                  </div>

                  {/* Web Services & APIs */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wide">🔗 Web Services</h5>
                    <button
                      onClick={() => { setQuery('webservice document search API paging'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      webservice document search API paging
                    </button>
                    <button
                      onClick={() => { setQuery('code table metadata filter register'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      code table metadata filter register
                    </button>
                    <button
                      onClick={() => { setQuery('reporting webservice deleted documents'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      reporting webservice deleted documents
                    </button>
                  </div>

                  {/* User Experience */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-indigo-800 dark:text-indigo-200 uppercase tracking-wide">👥 User Experience</h5>
                    <button
                      onClick={() => { setQuery('user guide BPA prerequisites update'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      user guide BPA prerequisites update
                    </button>
                    <button
                      onClick={() => { setQuery('browser zoom layout controls misaligned'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      browser zoom layout controls misaligned
                    </button>
                    <button
                      onClick={() => { setQuery('single sign-on preferences settings'); handleSearch(); }}
                      className="w-full text-left p-3 bg-white dark:bg-gray-700 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      single sign-on preferences settings
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs text-indigo-800 dark:text-indigo-200">
                  <strong>💡 Pro Tip:</strong> These suggestions are based on your actual FusionLive data - click any to get instant results! 
                  {searchMode === 'rag' ? ' RAG mode provides intelligent answers with context from your user stories, defects, and documents.' : ' Semantic mode finds the most similar content using AI embeddings across all your imported data.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchMode === 'rag' ? 'Analyzing your knowledge base...' : 'Searching...'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchMode === 'rag' 
                ? 'Claude 4 is processing your query and finding relevant information'
                : 'Finding the most relevant content for your query'
              }
            </p>
          </div>
        )}
      </main>
    </PageLayout>
  )
} 