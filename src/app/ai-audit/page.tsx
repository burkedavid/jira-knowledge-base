'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  DollarSign, 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  Filter, 
  Download, 
  Trash2, 
  RefreshCw,
  Calendar,
  User,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  ArrowLeft
} from 'lucide-react'

interface AuditLog {
  id: string
  promptType: string
  promptName: string
  endpoint: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUSD: number
  costGBP: number
  userId?: string
  userEmail?: string
  duration?: number
  success: boolean
  errorMessage?: string
  createdAt: string
}

interface AuditStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  successRate: number
  totalCostUSD: number
  totalCostGBP: number
  totalTokens: number
  promptTypeStats: Array<{
    promptType: string
    requests: number
    costUSD: number
    tokens: number
  }>
}

interface PaginatedLogs {
  logs: AuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AIAuditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<PaginatedLogs | null>(null)
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    promptType: '',
    success: '',
    timeframe: 'month',
    userId: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [users, setUsers] = useState<Array<{id: string, email: string}>>([])
  const [usersLoading, setUsersLoading] = useState(false)

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const usersData = await response.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [logsResponse, statsResponse] = await Promise.all([
        fetch(`/api/ai-audit/logs?page=${currentPage}&limit=20${filters.promptType ? `&promptType=${filters.promptType}` : ''}${filters.success ? `&success=${filters.success}` : ''}${filters.userId ? `&userId=${filters.userId}` : ''}`),
        fetch(`/api/ai-audit/stats?timeframe=${filters.timeframe}`)
      ])

      if (logsResponse.ok && statsResponse.ok) {
        const logsData = await logsResponse.json()
        const statsData = await statsResponse.json()
        setLogs(logsData)
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentPage, filters])

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/ai-audit/clear', {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully cleared ${result.count} audit log entries`)
        fetchData()
      } else {
        alert('Failed to clear audit logs')
      }
    } catch (error) {
      console.error('Error clearing logs:', error)
      alert('Error clearing audit logs')
    }
  }

  const formatCurrency = (amount: number, currency: 'USD' | 'GBP') => {
    const symbol = currency === 'USD' ? '$' : '£'
    return `${symbol}${amount.toFixed(4)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const getPromptTypeColor = (promptType: string) => {
    const colors: { [key: string]: string } = {
      'test-case-generation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'requirements-analysis': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'defect-analysis': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'knowledge-search': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'analytics': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    }
    return colors[promptType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }

  // Check for admin access
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  // Allow both admin and regular users to access AI audit
  // (API will filter results appropriately)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600 dark:text-gray-300">Loading audit data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Home
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-green-600" />
                AI Cost Audit
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Track AI usage, costs, and performance across all prompts
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              <button
                onClick={fetchData}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={handleClearLogs}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt Type
                </label>
                <select
                  value={filters.promptType}
                  onChange={(e) => setFilters({ ...filters, promptType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="test-case-generation">Test Case Generation</option>
                  <option value="requirements-analysis">Requirements Analysis</option>
                  <option value="defect-analysis">Defect Analysis</option>
                  <option value="knowledge-search">Knowledge Search</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.success}
                  onChange={(e) => setFilters({ ...filters, success: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="true">Success</option>
                  <option value="false">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timeframe
                </label>
                <select
                  value={filters.timeframe}
                  onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="day">Last 24 Hours</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User
                </label>
                <select
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={usersLoading}
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
                {usersLoading && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Loading users...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRequests.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Cost (USD)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalCostUSD, 'USD')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Cost (GBP)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalCostGBP, 'GBP')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Logs</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Prompt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cost (USD)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cost (GBP)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs?.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(log.success)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.promptName}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPromptTypeColor(log.promptType)}`}>
                            {log.promptType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900 dark:text-white">
                          {log.userEmail || 'System'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <Zap className="w-4 h-4 text-yellow-500 mr-1" />
                          {log.totalTokens.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {log.inputTokens.toLocaleString()} in / {log.outputTokens.toLocaleString()} out
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(log.costUSD, 'USD')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(log.costGBP, 'GBP')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <Clock className="w-4 h-4 text-gray-400 mr-1" />
                        {log.duration ? `${log.duration}ms` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(log.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logs && logs.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((logs.page - 1) * logs.limit) + 1} to {Math.min(logs.page * logs.limit, logs.total)} of {logs.total} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {logs.page} of {logs.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(logs.totalPages, currentPage + 1))}
                    disabled={currentPage === logs.totalPages}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {logs && logs.logs.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No audit logs found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              No AI usage has been recorded yet, or your filters are too restrictive.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}