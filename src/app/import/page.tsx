'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft, Database, Upload, FileText, Settings, CheckCircle, AlertCircle, Loader2, FolderOpen, File, Brain, Save, RotateCcw } from 'lucide-react'

interface ImportJob {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  totalItems: number
  processedItems: number
  progress: number
  errors?: string[]
  statistics?: {
    created: number
    updated: number
    skipped: number
    errors: number
    duplicatesPrevented: number
  }
  duplicatePrevention?: {
    enabled: boolean
    method: string
    description: string
  }
}

interface JQLMapping {
  type: 'user_stories' | 'defects' | 'epics'
  label: string
  jql: string
  enabled: boolean
  count: number
}

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState('jira')
  const [isImporting, setIsImporting] = useState(false)
  const [isExploring, setIsExploring] = useState(false)
  const [exploreResult, setExploreResult] = useState<any | null>(null)
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null)
  const [jqlMappings, setJqlMappings] = useState<JQLMapping[]>([
    { type: 'user_stories', label: 'User Stories', jql: 'project = "PROJ" AND type = "Story"', enabled: false, count: 0 },
    { type: 'defects', label: 'Defects/Bugs', jql: 'project = "PROJ" AND type = "Bug"', enabled: false, count: 0 },
    { type: 'epics', label: 'Epics', jql: 'project = "PROJ" AND type = "Epic"', enabled: false, count: 0 }
  ])
  const [formData, setFormData] = useState({
    jiraUrl: 'https://your-company.atlassian.net',
    projectKey: 'PROJ',
    username: 'your-email@company.com',
    apiToken: '',
    fromDate: '',
    toDate: '',
    batchSize: 25,
    delayBetweenBatches: 1000
  })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Save configuration to localStorage
  const saveConfiguration = async () => {
    setIsSaving(true)
    try {
      const configToSave = {
        projectKey: formData.projectKey,
        formData: {
          ...formData,
          apiToken: '' // Don't save API token for security
        },
        jqlMappings,
        lastSaved: new Date()
      }
      
      // Save to localStorage
      localStorage.setItem(`jira-import-config-${formData.projectKey}`, JSON.stringify(configToSave))
      
      // Also call the API (for future database storage)
      await fetch('/api/jira/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-user-config',
          ...configToSave
        })
      })
      
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to save configuration:', error)
      alert('Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  // Load configuration from localStorage
  const loadConfiguration = () => {
    try {
      const saved = localStorage.getItem(`jira-import-config-${formData.projectKey}`)
      if (saved) {
        const config = JSON.parse(saved)
        setFormData(prev => ({
          ...prev,
          ...config.formData,
          projectKey: formData.projectKey // Keep current project key
        }))
        setJqlMappings(config.jqlMappings || jqlMappings)
        setLastSaved(new Date(config.lastSaved))
        setHasUnsavedChanges(false)
      }
    } catch (error) {
      console.error('Failed to load saved configuration:', error)
    }
  }

  // Load environment variables and saved config on component mount
  useEffect(() => {
    const loadJiraConfig = async () => {
      try {
        const response = await fetch('/api/jira/env-config')
        if (response.ok) {
          const config = await response.json()
          setFormData(prev => ({
            ...prev,
            jiraUrl: config.jiraUrl,
            projectKey: config.projectKey,
            username: config.username,
            // Don't pre-fill API token for security
          }))
          
          // After setting project key, try to load saved config
          setTimeout(() => {
            const saved = localStorage.getItem(`jira-import-config-${config.projectKey}`)
            if (saved) {
              const savedConfig = JSON.parse(saved)
              setFormData(prev => ({
                ...prev,
                ...savedConfig.formData,
                projectKey: config.projectKey // Keep env project key
              }))
              setJqlMappings(savedConfig.jqlMappings || jqlMappings)
              setLastSaved(new Date(savedConfig.lastSaved))
            }
          }, 100)
        }
      } catch (error) {
        console.error('Failed to load Jira config:', error)
      }
    }
    
    loadJiraConfig()
  }, [])

  // Poll for job status updates
  useEffect(() => {
    if (currentJob && (currentJob.status === 'pending' || currentJob.status === 'in_progress')) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/import/jira-batch?jobId=${currentJob.id}`)
          if (response.ok) {
            const updatedJob = await response.json()
            setCurrentJob(updatedJob)
            
            if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
              setIsImporting(false)
            }
          }
        } catch (error) {
          console.error('Error polling job status:', error)
        }
      }, 2000) // Poll every 2 seconds

      return () => clearInterval(interval)
    }
  }, [currentJob])

  const handleExploreProject = async () => {
    setIsExploring(true)
    setExploreResult(null)
    
    try {
      const response = await fetch('/api/jira/explore-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl: formData.jiraUrl,
          email: formData.username,
          apiToken: formData.apiToken,
          projectKey: formData.projectKey
        })
      })

      const result = await response.json()
      setExploreResult(result)

      // Auto-update JQL mappings based on exploration results
      if (result.success && result.suggestions?.recommendedJQL) {
        const newMappings = [...jqlMappings]
        
        // Collect all defect-related issue types for combined JQL
        const defectTypes: string[] = []
        let userStoryType: string | null = null
        let epicType: string | null = null
        
        result.suggestions.recommendedJQL.forEach((suggestion: any) => {
          const issueTypeName = suggestion.jql.match(/type = "([^"]+)"/)?.[1] || ''
          const lowerType = issueTypeName.toLowerCase()
          
                     if (lowerType.includes('story') || lowerType.includes('user story') || lowerType.includes('change request')) {
             userStoryType = issueTypeName
             const userStoryMapping = newMappings.find(m => m.type === 'user_stories')
             if (userStoryMapping) {
               userStoryMapping.jql = `project = "${formData.projectKey}" AND type = "${issueTypeName}"`
               userStoryMapping.count = suggestion.count
               userStoryMapping.enabled = suggestion.count > 0
             }
          } else if (lowerType.includes('bug') || lowerType.includes('defect')) {
            defectTypes.push(issueTypeName)
                     } else if (lowerType.includes('epic')) {
             epicType = issueTypeName
             const epicMapping = newMappings.find(m => m.type === 'epics')
             if (epicMapping) {
               epicMapping.jql = `project = "${formData.projectKey}" AND type = "${issueTypeName}"`
               epicMapping.count = suggestion.count
               epicMapping.enabled = suggestion.count > 0
             }
          }
        })
        
                 // Handle defects - combine multiple defect types into one JQL
         if (defectTypes.length > 0) {
           const defectMapping = newMappings.find(m => m.type === 'defects')
           if (defectMapping) {
             if (defectTypes.length === 1) {
               defectMapping.jql = `project = "${formData.projectKey}" AND type = "${defectTypes[0]}"`
             } else {
               defectMapping.jql = `project = "${formData.projectKey}" AND type in (${defectTypes.map(t => `"${t}"`).join(', ')})`
             }
            // Sum up counts for all defect types
            const totalDefectCount = result.suggestions.recommendedJQL
              .filter((s: any) => {
                const typeName = s.jql.match(/type = "([^"]+)"/)?.[1] || ''
                return typeName.toLowerCase().includes('bug') || typeName.toLowerCase().includes('defect')
              })
              .reduce((sum: number, s: any) => sum + s.count, 0)
            
            defectMapping.count = totalDefectCount
            defectMapping.enabled = totalDefectCount > 0
          }
        }
        
        setJqlMappings(newMappings)
        setHasUnsavedChanges(true)
      }
    } catch (error) {
      setExploreResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsExploring(false)
    }
  }

  const handleStartImport = async () => {
    setIsImporting(true)
    
    try {
      // Convert JQL mappings to import options
      const importOptions = {
        userStories: jqlMappings.find(m => m.type === 'user_stories')?.enabled || false,
        defects: jqlMappings.find(m => m.type === 'defects')?.enabled || false,
        epics: jqlMappings.find(m => m.type === 'epics')?.enabled || false
      }

      const response = await fetch('/api/import/jira-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jiraUrl: formData.jiraUrl,
          projectKey: formData.projectKey,
          username: formData.username,
          apiToken: formData.apiToken,
          dateRange: formData.fromDate || formData.toDate ? {
            fromDate: formData.fromDate || undefined,
            toDate: formData.toDate || undefined
          } : undefined,
          batchSettings: {
            batchSize: formData.batchSize,
            delayBetweenBatches: formData.delayBetweenBatches
          },
          importOptions,
          customJQL: jqlMappings // Pass custom JQL mappings
        })
      })

      if (response.ok) {
        const result = await response.json()
        setCurrentJob({
          id: result.jobId,
          status: result.status,
          totalItems: 0,
          processedItems: 0,
          progress: 0
        })
      } else {
        const error = await response.json()
        alert(`Import failed: ${error.error}`)
        setIsImporting(false)
      }
    } catch (error) {
      console.error('Error starting import:', error)
      alert('Failed to start import')
      setIsImporting(false)
    }
  }

  const updateJQLMapping = (type: 'user_stories' | 'defects' | 'epics', field: 'jql' | 'enabled', value: string | boolean) => {
    setJqlMappings(prev => prev.map(mapping => 
      mapping.type === type 
        ? { ...mapping, [field]: value }
        : mapping
    ))
    setHasUnsavedChanges(true)
  }

  // Track changes to form data
  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setHasUnsavedChanges(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Data Import
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('jira')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'jira'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Database className="h-4 w-4 mr-2 inline" />
                Jira Import
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 mr-2 inline" />
                Document Upload
              </button>
            </nav>
          </div>

          {/* Jira Import Tab */}
          {activeTab === 'jira' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Import from Jira
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Connect to your Jira instance to import user stories, defects, and related data.
                </p>
              </div>

              <div className="space-y-6">
                {/* Connection Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jira URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-company.atlassian.net"
                      value={formData.jiraUrl}
                      onChange={(e) => updateFormData({jiraUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Key
                    </label>
                    <input
                      type="text"
                      placeholder="PROJ"
                      value={formData.projectKey}
                      onChange={(e) => updateFormData({projectKey: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username/Email
                    </label>
                    <input
                      type="email"
                      placeholder="your-email@company.com"
                      value={formData.username}
                      onChange={(e) => updateFormData({username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Token
                    </label>
                    <input
                      type="password"
                      placeholder="Your Jira API token"
                      value={formData.apiToken}
                      onChange={(e) => updateFormData({apiToken: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Save/Load Configuration */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      {lastSaved ? (
                        <span className="text-gray-600 dark:text-gray-400">
                          Last saved: {lastSaved.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-500">No saved configuration</span>
                      )}
                      {hasUnsavedChanges && (
                        <span className="ml-2 text-orange-600 dark:text-orange-400 text-xs">
                          • Unsaved changes
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={loadConfiguration}
                      disabled={!lastSaved}
                      className="flex items-center px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Load Saved
                    </button>
                    <button
                      type="button"
                      onClick={saveConfiguration}
                      disabled={isSaving}
                      className="flex items-center px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-md text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          Save Config
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Project Analysis Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🔍 Project Analysis
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Analyze your project to discover issue types and automatically configure import settings.
                  </p>
                  <button 
                    type="button"
                    onClick={handleExploreProject}
                    disabled={isExploring || !formData.jiraUrl || !formData.projectKey || !formData.username || !formData.apiToken}
                    className="w-full flex items-center justify-center px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExploring ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing Project...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Explore Project Structure
                      </>
                    )}
                  </button>
                </div>

                {/* Explore Results */}
                {exploreResult && (
                  <div className={`p-4 rounded-lg border ${
                    exploreResult.success 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}>
                    {exploreResult.success ? (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                            ✅ Connected to {exploreResult.project?.name} ({exploreResult.project?.key})
                          </h4>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            Found {exploreResult.statistics?.totalIssues} total issues | Import settings updated automatically
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">❌ Failed to analyze project</h4>
                        <p className="text-sm text-red-700 dark:text-red-300">{exploreResult.error}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Import Options with JQL Editing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Import Configuration
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Configure what to import and customize JQL queries if needed.
                  </p>
                  
                  <div className="space-y-4">
                    {jqlMappings.map((mapping) => (
                      <div key={mapping.type} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={mapping.enabled}
                              onChange={(e) => updateJQLMapping(mapping.type, 'enabled', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" 
                            />
                            <span className="font-medium text-gray-900 dark:text-white">{mapping.label}</span>
                            {mapping.count > 0 && (
                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                {mapping.count} issues
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">JQL Query:</label>
                          <input
                            type="text"
                            value={mapping.jql}
                            onChange={(e) => updateJQLMapping(mapping.type, 'jql', e.target.value)}
                            disabled={!mapping.enabled}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                            placeholder={`type = "Story"`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Range (Optional)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From Date</label>
                      <input
                        type="date"
                        value={formData.fromDate}
                        onChange={(e) => updateFormData({fromDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To Date</label>
                      <input
                        type="date"
                        value={formData.toDate}
                        onChange={(e) => updateFormData({toDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty to import all data.
                  </p>
                </div>

                {/* Batch Processing Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Batch Processing
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Batch Size</label>
                      <select 
                        value={formData.batchSize}
                        onChange={(e) => updateFormData({batchSize: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="25">25 items per batch (Recommended)</option>
                        <option value="50">50 items per batch</option>
                        <option value="100">100 items per batch</option>
                        <option value="10">10 items per batch (Slow connection)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Delay Between Batches</label>
                      <select 
                        value={formData.delayBetweenBatches}
                        onChange={(e) => updateFormData({delayBetweenBatches: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="1000">1 second (Recommended)</option>
                        <option value="2000">2 seconds (Conservative)</option>
                        <option value="500">0.5 seconds (Fast)</option>
                        <option value="3000">3 seconds (Very conservative)</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Smaller batches and longer delays help avoid Jira API rate limits.
                  </p>
                </div>

                {/* Start Import Button */}
                <div>
                  <button 
                    type="button"
                    onClick={handleStartImport}
                    disabled={isImporting || !formData.jiraUrl || !formData.projectKey || !formData.username || !formData.apiToken || !jqlMappings.some(m => m.enabled)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Start Import
                      </>
                    )}
                  </button>
                </div>

                {/* Import Progress */}
                {currentJob && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Import Progress</h4>
                    
                    {/* Progress Bar */}
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                        style={{ width: `${currentJob.progress}%` }}
                      >
                        {currentJob.progress > 10 && (
                          <span className="text-xs text-white font-medium">{currentJob.progress}%</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Status and Basic Info */}
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
                      <span className="font-medium">Status: <span className="capitalize">{currentJob.status.replace('_', ' ')}</span></span>
                      <span>{currentJob.processedItems} / {currentJob.totalItems} items processed</span>
                    </div>

                    {/* Detailed Statistics */}
                    {currentJob.statistics && (currentJob.status === 'completed' || currentJob.status === 'failed' || (currentJob.statistics.created + currentJob.statistics.updated + currentJob.statistics.skipped) > 0) && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Import Summary</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {currentJob.statistics.created}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Created</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {currentJob.statistics.updated}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Updated</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                              {currentJob.statistics.skipped}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Skipped</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">
                              {currentJob.statistics.errors}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Errors</div>
                          </div>
                        </div>
                        
                        {/* Duplicate Prevention Info */}
                        {currentJob.duplicatePrevention && currentJob.statistics.skipped > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                  Duplicate Prevention Active
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {currentJob.statistics.skipped} items were skipped because they already exist and are up to date. 
                                  This prevents data duplication and improves import efficiency.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Messages */}
                    {currentJob.status === 'completed' && (
                      <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Import completed successfully!</p>
                          {currentJob.statistics && (
                            <p className="text-xs mt-1">
                              Processed {currentJob.statistics.created + currentJob.statistics.updated + currentJob.statistics.skipped} total items
                              {currentJob.statistics.skipped > 0 && ` (${currentJob.statistics.skipped} duplicates prevented)`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {currentJob.status === 'failed' && (
                      <div className="flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Import failed</p>
                          <p className="text-xs mt-1">Check the console logs for detailed error information.</p>
                        </div>
                      </div>
                    )}

                    {currentJob.status === 'in_progress' && (
                      <div className="flex items-center text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <Loader2 className="h-5 w-5 mr-2 animate-spin flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Import in progress...</p>
                          <p className="text-xs mt-1">Processing items in batches to respect API rate limits.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document Upload Tab */}
          {activeTab === 'documents' && (
            <DocumentUploadTab />
          )}
        </div>
      </main>
    </div>
  )
}

function DocumentUploadTab() {
  const [uploadMode, setUploadMode] = useState<'single' | 'folder'>('single')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<any>(null)
  const [category, setCategory] = useState('general')
  const [generateEmbeddings, setGenerateEmbeddings] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  // New state for chunked upload progress
  const [chunkProgress, setChunkProgress] = useState<{
    currentChunk: number
    totalChunks: number
    processedFiles: number
    totalFiles: number
    errors: string[]
  } | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files)
  }

  // Drag and drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      // Filter files to only include supported formats
      const supportedFiles = Array.from(files).filter(file => {
        const extension = file.name.toLowerCase().split('.').pop()
        return ['md', 'html', 'htm', 'txt'].includes(extension || '')
      })

      if (supportedFiles.length > 0) {
        // Create a new FileList-like object
        const dataTransfer = new DataTransfer()
        supportedFiles.forEach(file => dataTransfer.items.add(file))
        setSelectedFiles(dataTransfer.files)
      } else {
        alert('Please drop only supported file formats: .md, .html, .htm, .txt')
      }
    }
  }

  // New chunked upload function
  const uploadFilesInChunks = async (files: File[], chunkSize: number = 20) => {
    const totalFiles = files.length
    const totalChunks = Math.ceil(totalFiles / chunkSize)
    let processedFiles = 0
    const allErrors: string[] = []
    const allResults: any[] = []

    setChunkProgress({
      currentChunk: 0,
      totalChunks,
      processedFiles: 0,
      totalFiles,
      errors: []
    })

    for (let i = 0; i < totalFiles; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize)
      const currentChunk = Math.floor(i / chunkSize) + 1

      setChunkProgress(prev => prev ? {
        ...prev,
        currentChunk,
        processedFiles
      } : null)

      try {
        const formData = new FormData()
        
        // Add files from current chunk
        chunk.forEach(file => {
          formData.append('files', file)
        })
        
        formData.append('category', category)
        formData.append('generateEmbeddings', generateEmbeddings.toString())

        const endpoint = '/api/documents/upload'
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData
        })

        let result
        try {
          const responseText = await response.text()
          result = JSON.parse(responseText)
        } catch (parseError) {
          throw new Error(`Server returned invalid response: ${response.status} ${response.statusText}`)
        }
        
        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        // Accumulate results
        allResults.push(result)
        processedFiles += result.totalProcessed || chunk.length
        
        if (result.errors && result.errors.length > 0) {
          allErrors.push(...result.errors)
        }

        // Update progress
        setChunkProgress(prev => prev ? {
          ...prev,
          processedFiles,
          errors: allErrors
        } : null)

        // Small delay between chunks to prevent overwhelming the server
        if (currentChunk < totalChunks) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

      } catch (error) {
        const errorMessage = `Chunk ${currentChunk} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        allErrors.push(errorMessage)
        console.error('Chunk upload error:', error)
        
        setChunkProgress(prev => prev ? {
          ...prev,
          errors: [...prev.errors, errorMessage]
        } : null)
      }
    }

    // Combine all results for final display
    const combinedResult = {
      success: allResults.length > 0,
      totalProcessed: processedFiles,
      documentsCreated: allResults.reduce((sum, r) => sum + (r.documentsCreated || 0), 0),
      embeddingsGenerated: allResults.reduce((sum, r) => sum + (r.embeddingsGenerated || 0), 0),
      sectionsProcessed: allResults.reduce((sum, r) => sum + (r.sectionsProcessed || 0), 0),
      errors: allErrors,
      summary: `Processed ${processedFiles} files in ${totalChunks} chunks. ${allErrors.length > 0 ? `${allErrors.length} errors occurred.` : 'All files processed successfully.'}`
    }

    return combinedResult
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Please select files to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(null)
    setChunkProgress(null)

    try {
      const filesArray = Array.from(selectedFiles)
      
      // Use chunked upload for large batches or folder uploads
      if (filesArray.length > 10 || uploadMode === 'folder') {
        const result = await uploadFilesInChunks(filesArray)
        setUploadProgress(result)
      } else {
        // Use original single request for small batches
        const formData = new FormData()
        
        // Add all selected files
        filesArray.forEach(file => {
          formData.append('files', file)
        })
        
        formData.append('category', category)
        formData.append('generateEmbeddings', generateEmbeddings.toString())

        const endpoint = '/api/documents/upload'
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData
        })

        let result
        try {
          const responseText = await response.text()
          result = JSON.parse(responseText)
        } catch (parseError) {
          throw new Error(`Server returned invalid response: ${response.status} ${response.statusText}`)
        }
        
        if (!response.ok) {
          throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        setUploadProgress(result)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setChunkProgress(null)
    }
  }

  const resetUpload = () => {
    setSelectedFiles(null)
    setUploadProgress(null)
    setChunkProgress(null)
    // Reset file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Document Upload</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Upload Markdown (.md), HTML (.html, .htm), or Text (.txt) files to add them to your knowledge base with automatic RAG integration.
          </p>
        </div>

        {/* Upload Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Upload Mode
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => setUploadMode('single')}
              className={`flex items-center px-4 py-2 rounded-lg border ${
                uploadMode === 'single'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <File className="h-5 w-5 mr-2" />
              Single Files
            </button>
            <button
              onClick={() => setUploadMode('folder')}
              className={`flex items-center px-4 py-2 rounded-lg border ${
                uploadMode === 'folder'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FolderOpen className="h-5 w-5 mr-2" />
              Folder Upload
            </button>
          </div>
        </div>

        {/* Enhanced File Selection with Drag and Drop */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Files
          </label>
          <div 
            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <Upload className={`h-12 w-12 mx-auto mb-4 ${
                isDragOver ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <div className="mb-4">
                <label htmlFor="file-input" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 font-medium">
                    Click to select files
                  </span>
                  <span className="text-gray-600 dark:text-gray-300"> or drag and drop</span>
                </label>
                <input
                  id="file-input"
                  type="file"
                  multiple={uploadMode === 'folder'}
                  {...(uploadMode === 'folder' ? { webkitdirectory: 'true' } : {})}
                  accept=".md,.html,.htm,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supported formats: Markdown (.md), HTML (.html, .htm), Text (.txt)
                {uploadMode === 'folder' && <br />}
                {uploadMode === 'folder' && 'Select a folder to upload all supported files within it'}
              </p>
              {isDragOver && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-2">
                  Drop your files here!
                </p>
              )}
            </div>
          </div>
          
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded p-3">
                {Array.from(selectedFiles).map((file, index) => (
                  <div key={index} className="text-sm text-gray-600 dark:text-gray-300 py-1">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="general">General</option>
              <option value="documentation">Documentation</option>
              <option value="requirements">Requirements</option>
              <option value="specifications">Specifications</option>
              <option value="guides">Guides</option>
              <option value="policies">Policies</option>
            </select>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={generateEmbeddings}
                onChange={(e) => setGenerateEmbeddings(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generate Embeddings
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enable RAG search capabilities for uploaded documents
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFiles || selectedFiles.length === 0}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {chunkProgress ? 
                  `Processing chunk ${chunkProgress.currentChunk}/${chunkProgress.totalChunks}...` : 
                  'Uploading...'
                }
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </>
            )}
          </button>
        </div>

        {/* Chunked Upload Progress */}
        {chunkProgress && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Upload Progress</h4>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {chunkProgress.processedFiles}/{chunkProgress.totalFiles} files
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-3">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(chunkProgress.processedFiles / chunkProgress.totalFiles) * 100}%` 
                }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Current Chunk:</span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {chunkProgress.currentChunk}/{chunkProgress.totalChunks}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Files Processed:</span>
                <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                  {chunkProgress.processedFiles}
                </span>
              </div>
            </div>
            
            {chunkProgress.errors.length > 0 && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-1">
                  {chunkProgress.errors.length} error(s) occurred:
                </p>
                <div className="max-h-20 overflow-y-auto">
                  {chunkProgress.errors.slice(-3).map((error, index) => (
                    <p key={index} className="text-xs text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  ))}
                  {chunkProgress.errors.length > 3 && (
                    <p className="text-xs text-red-500 dark:text-red-400 italic">
                      ... and {chunkProgress.errors.length - 3} more errors
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Progress/Results */}
        {uploadProgress && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Upload Results</h4>
              <button
                onClick={resetUpload}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Upload More
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{uploadProgress.totalProcessed || uploadProgress.processedFiles || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Files Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{uploadProgress.documentsCreated || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Documents Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{uploadProgress.embeddingsGenerated || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Embeddings Generated</div>
              </div>
            </div>

            {uploadProgress.errors && uploadProgress.errors.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-red-600 mb-2">Errors:</h5>
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 max-h-32 overflow-y-auto">
                  {uploadProgress.errors.map((error: string, index: number) => (
                    <div key={index} className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadProgress.summary && (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                <strong>Summary:</strong> {uploadProgress.summary}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 