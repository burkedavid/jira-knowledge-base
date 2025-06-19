'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Database, Brain, Shield, TestTube, Zap, Building2, Users, Save, Play, Square, RefreshCw, ExternalLink, DollarSign, AlertCircle, Search, Filter, Target, HelpCircle } from 'lucide-react'
import AIHeader from '@/components/ui/ai-header'
import { Tooltip } from '@/components/ui/tooltip'

interface ProductContext {
  productName: string
  description: string
  industry: string
  userTypes: string[]
  keyFeatures: string[]
  securityStandards: string[]
  qualityThreshold?: number
}

interface PrismaStudioStatus {
  isRunning: boolean
  port: number | null
  url: string | null
  pid: number | null
}

interface AISettings {
  id: string
  inputTokenCostUSD: number
  outputTokenCostUSD: number
  exchangeRateUSDToGBP: number
  model: string
  trackingEnabled: boolean
  retentionDays: number
}

interface RAGConfig {
  searchTypes: {
    defects: boolean
    userStories: boolean
    testCases: boolean
    documents: boolean
  }
  maxResults: {
    defects: number
    userStories: number
    testCases: number
    documents: number
  }
  similarityThresholds: {
    defects: number
    userStories: number
    testCases: number
    documents: number
  }
  contentLimits: {
    maxItemLength: number
    maxTotalRAGLength: number
    enableSmartTruncation: boolean
  }
  relevanceFiltering: {
    enabled: boolean
    minKeywordMatches: number
    minStoryKeywordMatches: number
    keywordBoostTerms: string[]
  }
  performance: {
    searchTimeout: number
    enableParallelSearch: boolean
    cacheResults: boolean
  }
}

function AISettingsSection() {
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadAISettings = async () => {
      try {
        const response = await fetch('/api/ai-audit/settings')
        if (response.ok) {
          const settings = await response.json()
          setAiSettings(settings)
        }
      } catch (error) {
        console.error('Failed to load AI settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAISettings()
  }, [])

  const handleSaveAISettings = async () => {
    if (!aiSettings) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/ai-audit/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiSettings),
      })

      if (response.ok) {
        alert('AI settings saved successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to save AI settings: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving AI settings:', error)
      alert('Failed to save AI settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              AI Cost Settings
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!aiSettings) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 text-green-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            AI Cost Settings
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure AI usage costs and tracking settings. Costs are set in USD per million tokens and converted to GBP for display.
        </p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Input Token Cost (USD per 1M tokens)
            </label>
            <input
              type="number"
              step="0.1"
              value={aiSettings.inputTokenCostUSD * 1000000}
              onChange={(e) => setAiSettings({...aiSettings, inputTokenCostUSD: (parseFloat(e.target.value) || 0) / 1000000})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current: ${(aiSettings.inputTokenCostUSD * 1000000).toFixed(2)} per 1M input tokens
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Output Token Cost (USD per 1M tokens)
            </label>
            <input
              type="number"
              step="0.1"
              value={aiSettings.outputTokenCostUSD * 1000000}
              onChange={(e) => setAiSettings({...aiSettings, outputTokenCostUSD: (parseFloat(e.target.value) || 0) / 1000000})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current: ${(aiSettings.outputTokenCostUSD * 1000000).toFixed(2)} per 1M output tokens
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              USD to GBP Exchange Rate
            </label>
            <input
              type="number"
              step="0.01"
              value={aiSettings.exchangeRateUSDToGBP}
              onChange={(e) => setAiSettings({...aiSettings, exchangeRateUSDToGBP: parseFloat(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              1 USD = {aiSettings.exchangeRateUSDToGBP.toFixed(2)} GBP
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI Model
            </label>
            <input
              type="text"
              value={aiSettings.model}
              onChange={(e) => setAiSettings({...aiSettings, model: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audit Log Retention (Days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={aiSettings.retentionDays}
              onChange={(e) => setAiSettings({...aiSettings, retentionDays: parseInt(e.target.value) || 90})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Logs older than this will be automatically deleted
            </p>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={aiSettings.trackingEnabled}
                onChange={(e) => setAiSettings({...aiSettings, trackingEnabled: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Enable AI usage tracking
              </span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Current pricing based on Claude Sonnet 4 rates:</p>
              <p>• Input: ${(aiSettings.inputTokenCostUSD * 1000000).toFixed(2)} per 1M tokens (£{(aiSettings.inputTokenCostUSD * 1000000 * aiSettings.exchangeRateUSDToGBP).toFixed(2)})</p>
              <p>• Output: ${(aiSettings.outputTokenCostUSD * 1000000).toFixed(2)} per 1M tokens (£{(aiSettings.outputTokenCostUSD * 1000000 * aiSettings.exchangeRateUSDToGBP).toFixed(2)})</p>
            </div>
            <button
              onClick={handleSaveAISettings}
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save AI Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RAGSettingsSection() {
  const [ragConfig, setRagConfig] = useState<RAGConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadRAGConfig = async () => {
      try {
        const response = await fetch('/api/settings/rag-config')
        if (response.ok) {
          const config = await response.json()
          setRagConfig(config)
        }
      } catch (error) {
        console.error('Failed to load RAG config:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRAGConfig()
  }, [])

  const handleSaveRAGConfig = async () => {
    if (!ragConfig) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/rag-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ragConfig),
      })

      if (response.ok) {
        alert('RAG configuration saved successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to save RAG configuration: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving RAG config:', error)
      alert('Failed to save RAG configuration')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Search className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              RAG Configuration
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!ragConfig) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Search className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              RAG Configuration
            </h3>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center text-red-500 dark:text-red-400">
            <p>Failed to load RAG configuration</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Search className="h-6 w-6 text-purple-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            RAG Configuration
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure semantic search and AI analysis parameters for all AI features (test case generation, defect analysis, etc.)
        </p>
      </div>
      <div className="p-6 space-y-8">
        {/* Search Types */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Search Types</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select which content types to include in RAG context for AI analysis
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(ragConfig.searchTypes).map(([type, enabled]) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Boolean(enabled)}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    searchTypes: { ...ragConfig.searchTypes, [type]: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {type.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Max Results */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Maximum Results</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Set the maximum number of items to retrieve for each content type
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(ragConfig.maxResults).map(([type, value]) => (
              <div key={type}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                  {type.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={Number(value)}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    maxResults: { ...ragConfig.maxResults, [type]: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Similarity Thresholds */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Similarity Thresholds</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Set minimum similarity scores (0.0-1.0) for including content in RAG context
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(ragConfig.similarityThresholds).map(([type, value]) => (
              <div key={type}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                  {type.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type="number"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={Number(value)}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    similarityThresholds: { ...ragConfig.similarityThresholds, [type]: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current: {(Number(value) * 100).toFixed(0)}% similarity
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content Limits */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Content Limits</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Configure content length limits and truncation settings
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Item Length
              </label>
              <input
                type="number"
                min="50"
                max="1000"
                value={ragConfig.contentLimits.maxItemLength}
                onChange={(e) => setRagConfig({
                  ...ragConfig,
                  contentLimits: { ...ragConfig.contentLimits, maxItemLength: parseInt(e.target.value) || 200 }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Characters per item (50-1000)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Total RAG Length
              </label>
              <input
                type="number"
                min="100"
                max="5000"
                value={ragConfig.contentLimits.maxTotalRAGLength}
                onChange={(e) => setRagConfig({
                  ...ragConfig,
                  contentLimits: { ...ragConfig.contentLimits, maxTotalRAGLength: parseInt(e.target.value) || 800 }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total context length (100-5000)
              </p>
            </div>
            <div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ragConfig.contentLimits.enableSmartTruncation}
                    onChange={(e) => setRagConfig({
                      ...ragConfig,
                      contentLimits: { ...ragConfig.contentLimits, enableSmartTruncation: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Enable Smart Truncation
                  </span>
                </label>
                <Tooltip
                  content={
                    <div className="max-w-xs">
                      <div className="font-medium mb-1">Smart Truncation</div>
                      <div className="text-xs leading-relaxed">
                        Automatically limits individual content items to the Max Item Length setting. 
                        When enabled, long items are intelligently shortened with "..." to ensure 
                        better AI processing and allow more diverse content within the total context limit.
                      </div>
                    </div>
                  }
                  side="right"
                >
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2 cursor-help" />
                </Tooltip>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Intelligently truncate content
              </p>
            </div>
          </div>
        </div>

        {/* Relevance Filtering */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Relevance Filtering</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Configure keyword-based relevance filtering
          </p>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={ragConfig.relevanceFiltering.enabled}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    relevanceFiltering: { ...ragConfig.relevanceFiltering, enabled: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable Relevance Filtering
                </span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Keyword Matches
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={ragConfig.relevanceFiltering.minKeywordMatches}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    relevanceFiltering: { ...ragConfig.relevanceFiltering, minKeywordMatches: parseInt(e.target.value) || 1 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Min Story Keyword Matches
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={ragConfig.relevanceFiltering.minStoryKeywordMatches}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    relevanceFiltering: { ...ragConfig.relevanceFiltering, minStoryKeywordMatches: parseInt(e.target.value) || 2 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Performance</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Configure performance and timeout settings
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Timeout (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={ragConfig.performance.searchTimeout}
                onChange={(e) => setRagConfig({
                  ...ragConfig,
                  performance: { ...ragConfig.performance, searchTimeout: parseInt(e.target.value) || 45 }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={ragConfig.performance.enableParallelSearch}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    performance: { ...ragConfig.performance, enableParallelSearch: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable Parallel Search
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={ragConfig.performance.cacheResults}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    performance: { ...ragConfig.performance, cacheResults: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Cache Results
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end">
            <button
              onClick={handleSaveRAGConfig}
              disabled={isSaving}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save RAG Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmbeddingsManagementSection() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [embeddingStats, setEmbeddingStats] = useState<{
    total: number
    bySourceType: Record<string, number>
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{
    fromDate: string
    toDate: string
    enabled: boolean
  }>({
    fromDate: '',
    toDate: '',
    enabled: false
  })

  useEffect(() => {
    loadEmbeddingStats()
  }, [])

  const loadEmbeddingStats = async () => {
    try {
      const response = await fetch('/api/embeddings/stats')
      if (response.ok) {
        const stats = await response.json()
        setEmbeddingStats(stats)
        
        // Try to get the most recent embedding date
        const embeddingsResponse = await fetch('/api/debug/rag-status')
        if (embeddingsResponse.ok) {
          const ragStatus = await embeddingsResponse.json()
          setLastGenerated(ragStatus.diagnostics.timestamp)
        }
      }
    } catch (error) {
      console.error('Failed to load embedding stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateEmbeddings = async (forceRegenerate = false) => {
    setIsGenerating(true)
    try {
      const requestBody: any = {
        sourceTypes: ['user_story', 'defect', 'test_case', 'document'],
        forceRegenerate
      }
      
      // Add date range if enabled
      if (dateRange.enabled && (dateRange.fromDate || dateRange.toDate)) {
        requestBody.dateRange = {
          fromDate: dateRange.fromDate || null,
          toDate: dateRange.toDate || null
        }
      }
      
      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()
        let message = `Embeddings generated successfully!\n\nProcessed: ${result.totalProcessed} items\n\nDetails:\n${Object.entries(result.results).map(([type, count]) => `• ${type}: ${count}`).join('\n')}`
        
        // Add date range info if it was used
        if (dateRange.enabled && (dateRange.fromDate || dateRange.toDate)) {
          message += `\n\nDate Range Filter Applied:`
          if (dateRange.fromDate) message += `\n• From: ${new Date(dateRange.fromDate).toLocaleDateString()}`
          if (dateRange.toDate) message += `\n• To: ${new Date(dateRange.toDate).toLocaleDateString()}`
        }
        
        alert(message)
        
        // Reload stats after generation
        await loadEmbeddingStats()
      } else {
        const error = await response.json()
        alert(`Failed to generate embeddings: ${error.error}`)
      }
    } catch (error) {
      console.error('Error generating embeddings:', error)
      alert('Failed to generate embeddings')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateEmbeddings = () => generateEmbeddings(false)
  const handleForceRegenerate = () => generateEmbeddings(true)

  const handleTestRAGSystem = async () => {
    try {
      const response = await fetch('/api/debug/rag-status')
      if (response.ok) {
        const result = await response.json()
        const diagnostics = result.diagnostics
        
        let message = `RAG System Status: ${diagnostics.ragSystemHealth.status.toUpperCase()}\n\n`
        message += `Data Available:\n`
        message += `• User Stories: ${diagnostics.dataAvailability.userStories}\n`
        message += `• Defects: ${diagnostics.dataAvailability.defects}\n`
        message += `• Test Cases: ${diagnostics.dataAvailability.testCases}\n`
        message += `• Documents: ${diagnostics.dataAvailability.documents}\n\n`
        
        message += `Embeddings:\n`
        message += `• Total: ${diagnostics.embeddings.total}\n`
        Object.entries(diagnostics.embeddings.byType).forEach(([type, count]) => {
          message += `• ${type}: ${count}\n`
        })
        
        if (diagnostics.searchTest?.success) {
          message += `\nSearch Test: ✅ PASSED\n`
          message += `• Results found: ${diagnostics.searchTest.resultsFound}\n`
        } else {
          message += `\nSearch Test: ❌ FAILED\n`
          message += `• Error: ${diagnostics.searchTest?.error || 'Unknown'}\n`
        }
        
        if (diagnostics.ragSystemHealth.issues.length > 0) {
          message += `\nIssues:\n`
          diagnostics.ragSystemHealth.issues.forEach((issue: string) => {
            message += `• ${issue}\n`
          })
        }
        
        if (result.recommendations.length > 0) {
          message += `\nRecommendations:\n`
          result.recommendations.forEach((rec: string) => {
            message += `• ${rec}\n`
          })
        }
        
        alert(message)
      } else {
        alert('Failed to test RAG system')
      }
    } catch (error) {
      console.error('Error testing RAG system:', error)
      alert('Failed to test RAG system')
    }
  }

  const handleEmbeddingsTest = async () => {
    try {
      const response = await fetch('/api/test/embeddings')
      if (response.ok) {
        const result = await response.json()
        
        let message = `Embeddings Test Results\n\n`
        message += `AWS Titan Connection: ${result.awsConnection ? '✅ CONNECTED' : '❌ FAILED'}\n`
        
        if (result.embeddingTest) {
          message += `\nEmbedding Generation Test: ✅ PASSED\n`
          message += `• Test text: "${result.embeddingTest.testText}"\n`
          message += `• Vector dimensions: ${result.embeddingTest.dimensions}\n`
          message += `• Processing time: ${result.embeddingTest.processingTime}ms\n`
        }
        
        if (result.similarityTest && result.similarityTest.length > 0) {
          message += `\nSemantic Similarity Test:\n`
          result.similarityTest.forEach((test: any) => {
            const similarity = (test.similarity * 100).toFixed(1)
            message += `• "${test.text1}" vs "${test.text2}": ${similarity}% similar\n`
          })
        }
        
        if (result.recommendations && result.recommendations.length > 0) {
          message += `\nRecommendations:\n`
          result.recommendations.forEach((rec: string) => {
            message += `• ${rec}\n`
          })
        }
        
        alert(message)
      } else {
        const error = await response.json()
        alert(`Embeddings test failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error testing embeddings:', error)
      alert('Failed to test embeddings system')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Search className="h-6 w-6 text-purple-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Embeddings Management
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Generate and manage vector embeddings for RAG (Retrieval-Augmented Generation) search capabilities. 
          Embeddings enable semantic search across your user stories, defects, test cases, and documents.
        </p>
      </div>
      <div className="p-6 space-y-6">
        {/* Current Status */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Current Status</h4>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
          ) : embeddingStats ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${embeddingStats.total > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Total Embeddings: <strong>{embeddingStats.total}</strong>
                </span>
              </div>
              {Object.entries(embeddingStats.bySourceType).map(([type, count]) => (
                <div key={type} className="text-sm text-gray-600 dark:text-gray-400 ml-5">
                  • {type.replace('_', ' ')}: {count}
                </div>
              ))}
              {lastGenerated && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Last checked: {new Date(lastGenerated).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-red-600 dark:text-red-400">
              Failed to load embedding statistics
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleGenerateEmbeddings}
            disabled={isGenerating}
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Smart Generate
              </>
            )}
          </button>

          <button
            onClick={handleForceRegenerate}
            disabled={isGenerating}
            className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Force Regenerate
              </>
            )}
          </button>

          <button
            onClick={handleEmbeddingsTest}
            disabled={isGenerating}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <TestTube className="h-5 w-5 mr-2" />
            Embeddings Test
          </button>

          <button
            onClick={handleTestRAGSystem}
            disabled={isGenerating}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <TestTube className="h-5 w-5 mr-2" />
            Test RAG System
          </button>
        </div>

        {/* Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            What are Embeddings?
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              Embeddings are numerical representations of your content that enable AI to understand semantic meaning and relationships.
            </p>
            <p>
              <strong>Generation Options:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Smart Generate:</strong> Only processes new/changed content (recommended)</li>
              <li><strong>Force Regenerate:</strong> Regenerates all embeddings regardless of changes</li>
              <li><strong>Test RAG System:</strong> Runs comprehensive diagnostics</li>
            </ul>
            <p className="mt-3">
              <strong>When to use Smart Generate:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>After importing new user stories, defects, or documents</li>
              <li>When RAG search returns few or no results</li>
              <li>Regular maintenance (skips unchanged content)</li>
            </ul>
            <p className="mt-3">
              <strong>Note:</strong> Smart generation saves time and AWS costs by skipping unchanged content. 
              The system uses AWS Titan embeddings for high-quality semantic understanding.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SemanticSearchTestingSection() {
  const [searchText, setSearchText] = useState('')
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchStats, setSearchStats] = useState<any>(null)

  const handleSemanticSearch = async () => {
    if (!searchText.trim()) {
      alert('Please enter search text')
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch('/api/search/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchText.trim(),
          threshold: similarityThreshold,
          limit: 20,
          includeDetails: true,
          sourceTypes: ['user_story', 'defect', 'test_case', 'document']
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
        setSearchStats({
          totalResults: data.results?.length || 0,
          searchTime: data.searchTime || 0,
          threshold: similarityThreshold,
          query: searchText.trim()
        })
      } else {
        const error = await response.json()
        alert(`Search failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error performing semantic search:', error)
      alert('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user_story': return 'bg-blue-100 text-blue-800'
      case 'defect': return 'bg-red-100 text-red-800'
      case 'test_case': return 'bg-green-100 text-green-800'
      case 'document': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user_story': return 'User Story'
      case 'defect': return 'Defect'
      case 'test_case': return 'Test Case'
      case 'document': return 'Document'
      default: return type
    }
  }

  const getDisplayIdentifier = (result: any) => {
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
    
    const prefix = typePrefix[result.sourceType as keyof typeof typePrefix] || result.sourceType
    const shortId = result.sourceId.substring(result.sourceId.length - 8) // Last 8 chars
    
    return `${prefix}-${shortId}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Target className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Interactive Semantic Search Testing
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Test semantic search functionality with custom text and adjustable similarity thresholds to fine-tune accuracy and relevance.
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* How Semantic Search Works */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            How Semantic Search Works in Our System
          </h4>
          
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🧠 1. Embedding Vectors</h5>
                  <p>
                    Every piece of content (user stories, defects, test cases, documents) is converted into a 
                    <strong> 1024-dimensional vector</strong> using AWS Titan Text Embeddings V2. These vectors 
                    capture the semantic meaning of the text, not just keywords.
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🔍 2. Similarity Calculation</h5>
                  <p>
                    When you search, your query is also converted to a vector. We then calculate 
                    <strong> cosine similarity</strong> between your query vector and all stored content vectors. 
                    This finds content with similar meaning, even if different words are used.
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🎯 3. Threshold Filtering</h5>
                  <p>
                    The similarity threshold determines how "similar" content must be to appear in results. 
                    Higher thresholds (0.8+) return fewer, more precise matches. Lower thresholds (0.5-) 
                    return more results but may include less relevant content.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🤖 4. RAG Integration</h5>
                  <p>
                    <strong>Retrieval-Augmented Generation (RAG)</strong> uses semantic search to find relevant 
                    context for AI analysis. When analyzing requirements, the system searches for related 
                    defects, similar user stories, and relevant documentation to provide better insights.
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">⚡ 5. Real-World Example</h5>
                  <div className="bg-white dark:bg-gray-800 rounded p-3 text-xs">
                    <p><strong>Query:</strong> "user login problems"</p>
                    <p><strong>Finds:</strong> "authentication failures", "sign-in issues", "access denied errors"</p>
                    <p><strong>Why:</strong> These have similar semantic meaning despite different words</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📊 6. Quality Metrics</h5>
                  <p>
                    Similarity scores range from 0.0 (completely different) to 1.0 (identical meaning). 
                    Scores above 0.8 indicate very similar content, while 0.6-0.8 shows moderate similarity.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-300 dark:border-blue-700">
              <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🔬 Test Different Scenarios:</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <strong>High Similarity (0.8+):</strong><br/>
                  "payment failed" → "transaction error"
                </div>
                <div>
                  <strong>Medium Similarity (0.6-0.8):</strong><br/>
                  "user interface slow" → "performance issues"
                </div>
                <div>
                  <strong>Low Similarity (0.3-0.6):</strong><br/>
                  "login problems" → "database errors"
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Text
            </label>
            <textarea
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Enter text to search for semantically similar content..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Similarity Threshold: {similarityThreshold.toFixed(2)}
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">0.0 (Less strict)</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-xs text-gray-500">1.0 (More strict)</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lower values return more results but may be less relevant. Higher values return fewer but more precise matches.
            </p>
          </div>

          <button
            onClick={handleSemanticSearch}
            disabled={isSearching || !searchText.trim()}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Test Semantic Search
              </>
            )}
          </button>
        </div>

        {/* Search Results */}
        {searchStats && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Search Results
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {searchStats.totalResults} results • {searchStats.searchTime}ms • threshold: {searchStats.threshold}
              </div>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.sourceType)} mr-3`}>
                          {getTypeLabel(result.sourceType)}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getDisplayIdentifier(result)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                          {Math.round(result.similarity * 100)}% match
                        </span>
                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${result.similarity * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {result.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Results Found
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Try lowering the similarity threshold or using different search terms.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Threshold Guidance */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Threshold Tuning Guide
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <strong>0.0 - 0.3 (Very Loose):</strong>
                <p>Returns many results, including loosely related content. Good for broad exploration.</p>
              </div>
              <div>
                <strong>0.4 - 0.6 (Moderate):</strong>
                <p>Balanced approach. Returns moderately related content with some noise.</p>
              </div>
              <div>
                <strong>0.7 - 1.0 (Strict):</strong>
                <p>Returns only highly similar content. May miss relevant but differently worded items.</p>
              </div>
            </div>
            <p className="mt-3">
              <strong>Recommendation:</strong> Start with 0.7 for production use. Lower to 0.5-0.6 if too few results, raise to 0.8+ if too much noise.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('product')
  const [productContext, setProductContext] = useState<ProductContext>({
    productName: 'Fusion Live',
    description: '',
    industry: 'Engineering & Construction',
    userTypes: [],
    keyFeatures: [],
    securityStandards: [],
    qualityThreshold: 7
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [prismaStudioStatus, setPrismaStudioStatus] = useState<PrismaStudioStatus>({
    isRunning: false,
    port: null,
    url: null,
    pid: null
  })
  const [prismaStudioLoading, setPrismaStudioLoading] = useState(false)

  const tabs = [
    { id: 'product', name: 'Product Context', icon: Building2, description: 'Product information and industry settings' },
    { id: 'quality', name: 'Quality Settings', icon: TestTube, description: 'Test case generation and quality thresholds' },
    { id: 'ai', name: 'AI Configuration', icon: Brain, description: 'AI model settings and cost tracking' },
    { id: 'rag', name: 'RAG System', icon: Search, description: 'Vector search and retrieval settings' },
    { id: 'embeddings', name: 'Embeddings', icon: Zap, description: 'Vector embeddings management' },
    { id: 'search-test', name: 'Search Testing', icon: Target, description: 'Interactive semantic search testing' },
    { id: 'database', name: 'Database Tools', icon: Database, description: 'Database management and tools' },
    { id: 'api-docs', name: 'API Documentation', icon: ExternalLink, description: 'Browse available API endpoints' }
  ]

  const industryOptions = [
    'Engineering & Construction',
    'Oil & Gas',
    'Manufacturing',
    'Utilities',
    'Mining',
    'Infrastructure',
    'Aerospace',
    'Automotive',
    'Pharmaceuticals',
    'Other'
  ]

  // Load product context on component mount
  useEffect(() => {
    const loadProductContext = async () => {
      try {
        const response = await fetch('/api/settings/product-context')
        if (response.ok) {
          const context = await response.json()
          setProductContext(context)
        }
      } catch (error) {
        console.error('Failed to load product context:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProductContext()
  }, [])

  // Check Prisma Studio status on component mount
  useEffect(() => {
    checkPrismaStudioStatus()
  }, [])

  const checkPrismaStudioStatus = async () => {
    try {
      const response = await fetch('/api/prisma-studio')
      if (response.ok) {
        const status = await response.json()
        setPrismaStudioStatus({
          isRunning: status.isRunning,
          port: status.port,
          url: status.url,
          pid: status.pid
        })
      }
    } catch (error) {
      console.error('Failed to check Prisma Studio status:', error)
    }
  }

  const handlePrismaStudioAction = async (action: 'start' | 'stop') => {
    setPrismaStudioLoading(true)
    try {
      const response = await fetch('/api/prisma-studio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, port: 5555 }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update status after action
          setTimeout(() => {
            checkPrismaStudioStatus()
          }, 1000)
        } else {
          alert(`Failed to ${action} Prisma Studio: ${result.error}`)
        }
      } else {
        alert(`Failed to ${action} Prisma Studio`)
      }
    } catch (error) {
      console.error(`Error ${action}ing Prisma Studio:`, error)
      alert(`Failed to ${action} Prisma Studio`)
    } finally {
      setPrismaStudioLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/product-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productContext),
      })

      if (response.ok) {
        alert('Settings saved successfully!')
        // Trigger header refresh
        window.dispatchEvent(new Event('productContextUpdated'))
        localStorage.setItem('productContextUpdated', Date.now().toString())
      } else {
        const error = await response.json()
        alert(`Failed to save settings: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please sign in to access the settings.
          </p>
          <button 
            onClick={() => router.push('/login')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Access Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need administrator privileges to access Settings.
          </p>
          <button 
            onClick={() => router.push('/')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* AI Header */}
      <AIHeader />

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="h-6 w-6 mr-3 text-blue-600" />
              Settings
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 sticky top-8">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure your platform</p>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-3 text-left rounded-lg transition-colors mb-1 ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mr-3 ${
                        activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{tab.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tab.description}</div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* Product Context Tab */}
            {activeTab === 'product' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <Building2 className="h-6 w-6 text-indigo-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Product Context Configuration
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configure your product context to help AI generate more relevant and industry-specific test cases
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={productContext.productName}
                        onChange={(e) => setProductContext({...productContext, productName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., Fusion Live"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Industry
                      </label>
                      <select
                        value={productContext.industry}
                        onChange={(e) => setProductContext({...productContext, industry: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        {industryOptions.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Description
                    </label>
                    <textarea
                      value={productContext.description}
                      onChange={(e) => setProductContext({...productContext, description: e.target.value})}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Describe your product, its purpose, key capabilities, and target users..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This description helps AI understand your product context for generating relevant test cases
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User Types & Roles
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {productContext.userTypes.map((userType, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {userType}
                          <button
                            onClick={() => {
                              const newUserTypes = productContext.userTypes.filter((_, i) => i !== index)
                              setProductContext({...productContext, userTypes: newUserTypes})
                            }}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add user type (press Enter)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setProductContext({
                            ...productContext,
                            userTypes: [...productContext.userTypes, e.currentTarget.value.trim()]
                          })
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Key Features
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {productContext.keyFeatures.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        >
                          {feature}
                          <button
                            onClick={() => {
                              const newFeatures = productContext.keyFeatures.filter((_, i) => i !== index)
                              setProductContext({...productContext, keyFeatures: newFeatures})
                            }}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add key feature (press Enter)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setProductContext({
                            ...productContext,
                            keyFeatures: [...productContext.keyFeatures, e.currentTarget.value.trim()]
                          })
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Security Standards & Compliance
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {productContext.securityStandards.map((standard, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {standard}
                          <button
                            onClick={() => {
                              const newStandards = productContext.securityStandards.filter((_, i) => i !== index)
                              setProductContext({...productContext, securityStandards: newStandards})
                            }}
                            className="ml-1 text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add security standard (press Enter)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setProductContext({
                            ...productContext,
                            securityStandards: [...productContext.securityStandards, e.currentTarget.value.trim()]
                          })
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quality Settings Tab */}
            {activeTab === 'quality' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <TestTube className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Test Case Generation Settings
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configure quality thresholds and generation preferences
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Quality Score for Test Case Generation
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={productContext.qualityThreshold || 7}
                        onChange={(e) => setProductContext({...productContext, qualityThreshold: parseInt(e.target.value)})}
                        className="flex-1"
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 min-w-[2rem] text-center">
                          {productContext.qualityThreshold || 7}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/10</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>1 (Allow all)</span>
                      <span>10 (Perfect only)</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      User stories with quality scores below this threshold will show a warning before test case generation.
                      Set to 1 to disable quality checking.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Configuration Tab */}
            {activeTab === 'ai' && (
              <AISettingsSection />
            )}

            {/* RAG System Tab */}
            {activeTab === 'rag' && (
              <RAGSettingsSection />
            )}

            {/* Embeddings Tab */}
            {activeTab === 'embeddings' && (
              <EmbeddingsManagementSection />
            )}

            {/* Search Testing Tab */}
            {activeTab === 'search-test' && (
              <SemanticSearchTestingSection />
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                {/* Database Configuration */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <Database className="h-6 w-6 text-blue-600 mr-3" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Database Configuration
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Database Type
                        </label>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          SQLite (Local Development)
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Database Status
                        </label>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prisma Studio */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <Database className="h-6 w-6 text-green-600 mr-3" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Prisma Studio
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Browse and edit database records visually
                    </p>
                  </div>
                  <div className="p-6">
                    {/* Status Indicator */}
                    <div className="flex items-center mb-4">
                      <div className={`w-3 h-3 rounded-full mr-2 ${prismaStudioStatus.isRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {prismaStudioStatus.isRunning ? `Running on port ${prismaStudioStatus.port}` : 'Not running'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {!prismaStudioStatus.isRunning ? (
                        <button
                          onClick={() => handlePrismaStudioAction('start')}
                          disabled={prismaStudioLoading}
                          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {prismaStudioLoading ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Start Prisma Studio
                        </button>
                      ) : (
                        <>
                          <a
                            href={prismaStudioStatus.url || 'http://localhost:5555'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Prisma Studio
                          </a>
                          <button
                            onClick={() => handlePrismaStudioAction('stop')}
                            disabled={prismaStudioLoading}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {prismaStudioLoading ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Square className="h-4 w-4 mr-2" />
                            )}
                            Stop
                          </button>
                        </>
                      )}
                      <button
                        onClick={checkPrismaStudioStatus}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Documentation Tab */}
            {activeTab === 'api-docs' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <ExternalLink className="h-6 w-6 text-purple-600 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      API Documentation
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Browse and test available API endpoints
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Quick Access */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a
                      href="/api-docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          Interactive API Documentation
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Browse all endpoints with examples
                        </p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </a>

                    <a
                      href="/api/health"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">
                          Health Check
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Check system status and connectivity
                        </p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </a>
                  </div>

                  {/* Popular Endpoints */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                      Popular API Endpoints
                    </h4>
                    <div className="space-y-3">
                      {[
                        {
                          method: 'GET',
                          path: '/api/user-stories',
                          description: 'Retrieve user stories with filtering and pagination',
                          category: 'Data'
                        },
                        {
                          method: 'POST',
                          path: '/api/generate/test-cases',
                          description: 'Generate test cases from user stories using AI',
                          category: 'AI Generation'
                        },
                        {
                          method: 'POST',
                          path: '/api/analyze/requirements',
                          description: 'Analyze requirements quality and completeness',
                          category: 'Analysis'
                        },
                        {
                          method: 'GET',
                          path: '/api/search/semantic',
                          description: 'Semantic search across knowledge base',
                          category: 'Search'
                        },
                        {
                          method: 'POST',
                          path: '/api/import/jira-batch',
                          description: 'Batch import from Jira with mapping configuration',
                          category: 'Import'
                        },
                        {
                          method: 'GET',
                          path: '/api/embeddings/stats',
                          description: 'Get vector embeddings statistics',
                          category: 'Embeddings'
                        }
                      ].map((endpoint, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              endpoint.method === 'GET' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {endpoint.method}
                            </span>
                            <div>
                              <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                {endpoint.path}
                              </code>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {endpoint.description}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                            {endpoint.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* API Information */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                      API Information
                    </h4>
                    <div className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
                      <p>
                        <strong>Base URL:</strong> <code className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}</code>
                      </p>
                      <p>
                        <strong>Authentication:</strong> Session-based authentication required for most endpoints
                      </p>
                      <p>
                        <strong>Rate Limiting:</strong> Standard rate limits apply to prevent abuse
                      </p>
                      <p>
                        <strong>Response Format:</strong> All responses are in JSON format
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end mt-8">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 