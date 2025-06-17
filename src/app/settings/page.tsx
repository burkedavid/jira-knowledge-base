'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings, Database, Brain, Shield, TestTube, Zap, Building2, Users, Save, Play, Square, RefreshCw, ExternalLink, DollarSign, AlertCircle, Search, Filter, Target } from 'lucide-react'

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
          Configure semantic search and AI analysis parameters for test case generation
        </p>
      </div>
      <div className="p-6 space-y-8">
        {/* Search Types */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Search Types</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select which content types to include in RAG context for test case generation
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(ragConfig.searchTypes).map(([type, enabled]) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={enabled}
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
                  value={value}
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
                  value={value}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    similarityThresholds: { ...ragConfig.similarityThresholds, [type]: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current: {(value * 100).toFixed(0)}% similarity
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content Limits */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Content Limits</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Item Length (characters)
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Total RAG Length (characters)
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
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={ragConfig.contentLimits.enableSmartTruncation}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    contentLimits: { ...ragConfig.contentLimits, enableSmartTruncation: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable Smart Truncation
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Performance Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={ragConfig.performance.enableParallelSearch}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    performance: { ...ragConfig.performance, enableParallelSearch: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable Parallel Search
                </span>
              </label>
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={ragConfig.performance.cacheResults}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    performance: { ...ragConfig.performance, cacheResults: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Cache Results
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Relevance Filtering */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Relevance Filtering</h4>
          <div className="space-y-4">
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={ragConfig.relevanceFiltering.enabled}
                  onChange={(e) => setRagConfig({
                    ...ragConfig,
                    relevanceFiltering: { ...ragConfig.relevanceFiltering, enabled: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable Relevance Filtering
                </span>
              </label>
            </div>
            
            {ragConfig.relevanceFiltering.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-purple-200 dark:border-purple-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Keyword Matches
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={ragConfig.relevanceFiltering.minKeywordMatches}
                    onChange={(e) => setRagConfig({
                      ...ragConfig,
                      relevanceFiltering: { ...ragConfig.relevanceFiltering, minKeywordMatches: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Story Keyword Matches
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={ragConfig.relevanceFiltering.minStoryKeywordMatches}
                    onChange={(e) => setRagConfig({
                      ...ragConfig,
                      relevanceFiltering: { ...ragConfig.relevanceFiltering, minStoryKeywordMatches: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Keyword Boost Terms
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {ragConfig.relevanceFiltering.keywordBoostTerms.map((term, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                      >
                        {term}
                        <button
                          onClick={() => {
                            const newTerms = ragConfig.relevanceFiltering.keywordBoostTerms.filter((_, i) => i !== index)
                            setRagConfig({
                              ...ragConfig,
                              relevanceFiltering: { ...ragConfig.relevanceFiltering, keywordBoostTerms: newTerms }
                            })
                          }}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add keyword (press Enter)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const newTerm = e.currentTarget.value.trim().toLowerCase()
                        if (!ragConfig.relevanceFiltering.keywordBoostTerms.includes(newTerm)) {
                          setRagConfig({
                            ...ragConfig,
                            relevanceFiltering: {
                              ...ragConfig.relevanceFiltering,
                              keywordBoostTerms: [...ragConfig.relevanceFiltering.keywordBoostTerms, newTerm]
                            }
                          })
                        }
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
              </div>
            )}
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

        {/* Date Range Filter */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="enableDateRange"
              checked={dateRange.enabled}
              onChange={(e) => setDateRange({...dateRange, enabled: e.target.checked})}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="enableDateRange" className="ml-2 font-medium text-gray-900 dark:text-white">
              Filter by Date Range (for testing)
            </label>
          </div>
          
          {dateRange.enabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.fromDate}
                    onChange={(e) => setDateRange({...dateRange, fromDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.toDate}
                    onChange={(e) => setDateRange({...dateRange, toDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              {/* Quick Date Presets */}
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Presets:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0]
                      setDateRange({...dateRange, fromDate: today, toDate: today})
                    }}
                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date()
                      const yesterday = new Date(today)
                      yesterday.setDate(yesterday.getDate() - 1)
                      setDateRange({...dateRange, fromDate: yesterday.toISOString().split('T')[0], toDate: today.toISOString().split('T')[0]})
                    }}
                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Last 2 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date()
                      const lastWeek = new Date(today)
                      lastWeek.setDate(lastWeek.getDate() - 7)
                      setDateRange({...dateRange, fromDate: lastWeek.toISOString().split('T')[0], toDate: today.toISOString().split('T')[0]})
                    }}
                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Last Week
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date()
                      const lastMonth = new Date(today)
                      lastMonth.setMonth(lastMonth.getMonth() - 1)
                      setDateRange({...dateRange, fromDate: lastMonth.toISOString().split('T')[0], toDate: today.toISOString().split('T')[0]})
                    }}
                    className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Last Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateRange({...dateRange, fromDate: '', toDate: ''})}
                    className="px-3 py-1 text-xs bg-red-200 dark:bg-red-600 text-red-700 dark:text-red-300 rounded hover:bg-red-300 dark:hover:bg-red-500"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </>
          )}
          
          {dateRange.enabled && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Date Range Mode:</strong> Only items created within the specified date range will be processed. 
                This is useful for testing embeddings on specific data sets or recent imports.
                {dateRange.fromDate && ` From: ${new Date(dateRange.fromDate).toLocaleDateString()}`}
                {dateRange.toDate && ` To: ${new Date(dateRange.toDate).toLocaleDateString()}`}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <li>Testing with specific date ranges (use the date filter above)</li>
            </ul>
            <p className="mt-3">
              <strong>When to use Force Regenerate:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>After system updates or configuration changes</li>
              <li>When troubleshooting search quality issues</li>
              <li>First-time setup or complete refresh needed</li>
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

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
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

  if (session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
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
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </button>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Product Context Configuration */}
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

          {/* Vector Search Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Vector Search Configuration
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Embedding Model
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
                    <option>AWS Titan Text Embeddings V2 (Current)</option>
                    <option>Hash-based Fallback (Development)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Similarity Threshold
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    defaultValue="0.7"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0.1 (More results)</span>
                    <span>1.0 (Exact matches)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Case Generation Settings */}
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

          {/* AI Cost Settings */}
          <AISettingsSection />

          {/* RAG Configuration */}
          <RAGSettingsSection />

          {/* Embeddings Management */}
          <EmbeddingsManagementSection />

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Security Settings
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Enable audit logging for all AI operations
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Require authentication for API access
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Enable data encryption at rest
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Tools */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <TestTube className="h-6 w-6 text-orange-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Developer Tools & Testing
                </h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link 
                  href="/test-models"
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Brain className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Claude Models Test</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Test available Claude models and their capabilities
                    </p>
                  </div>
                </Link>

                <Link 
                  href="/test-embeddings"
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Zap className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Embeddings Test</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Test AWS Titan embeddings and semantic similarity
                    </p>
                  </div>
                </Link>

                <Link 
                  href="/api-docs"
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">API Documentation</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Comprehensive REST API documentation with examples
                    </p>
                  </div>
                </Link>

                {/* Enhanced Prisma Studio Component */}
                <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Database className="h-8 w-8 text-green-600 mr-3" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">Prisma Studio</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Browse and edit database records visually
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center mb-3">
                    <div className={`w-2 h-2 rounded-full mr-2 ${prismaStudioStatus.isRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {prismaStudioStatus.isRunning ? `Running on port ${prismaStudioStatus.port}` : 'Not running'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!prismaStudioStatus.isRunning ? (
                      <button
                        onClick={() => handlePrismaStudioAction('start')}
                        disabled={prismaStudioLoading}
                        className="flex items-center px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {prismaStudioLoading ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Start
                      </button>
                    ) : (
                      <>
                        <a
                          href={prismaStudioStatus.url || 'http://localhost:5555'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </a>
                        <button
                          onClick={() => handlePrismaStudioAction('stop')}
                          disabled={prismaStudioLoading}
                          className="flex items-center px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {prismaStudioLoading ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Square className="h-3 w-3 mr-1" />
                          )}
                          Stop
                        </button>
                      </>
                    )}
                    <button
                      onClick={checkPrismaStudioStatus}
                      className="flex items-center px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Current Configuration Status
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>• <strong>LLM:</strong> Claude Sonnet 4 (anthropic.claude-sonnet-4-20250514-v1:0)</p>
                  <p>• <strong>Embeddings:</strong> AWS Titan Text Embeddings V2 (1024 dimensions)</p>
                  <p>• <strong>Database:</strong> SQLite with Prisma ORM</p>
                  <p>• <strong>Vector Search:</strong> Cosine similarity with semantic understanding</p>
                  <p>• <strong>Prisma Studio:</strong> {prismaStudioStatus.isRunning ? `Running on port ${prismaStudioStatus.port}` : 'Stopped'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
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
      </main>
    </div>
  )
} 