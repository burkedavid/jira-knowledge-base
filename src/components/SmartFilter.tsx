import React, { useState, useEffect, useCallback } from 'react'
import { Search, Filter, X, Calendar, ChevronDown, ChevronUp, Clock, Star, AlertTriangle } from 'lucide-react'

interface UserStory {
  id: string
  title: string
  description: string
  jiraKey?: string
  component?: string
  priority?: string
  status?: string
  assignee?: string
  latestQualityScore?: number
  createdAt?: string
  updatedAt?: string
  testCaseCount: number
  acceptanceCriteria?: string
  reporter?: string
}

interface FilterState {
  search: string
  priority: string[]
  status: string[]
  component: string[]
  assignee: string[]
  qualityThreshold: number | null
  dateRange: {
    start: string
    end: string
    field: 'createdAt' | 'updatedAt'
  } | null
}

interface SmartFilterProps {
  userStories: UserStory[]
  onFilterChange: (filteredStories: UserStory[]) => void
  qualityThreshold?: number
  showQualityFilter?: boolean
}

const SmartFilter: React.FC<SmartFilterProps> = ({
  userStories,
  onFilterChange,
  qualityThreshold = 7,
  showQualityFilter = true
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: [],
    status: [],
    component: [],
    assignee: [],
    qualityThreshold: null,
    dateRange: null
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Quick filter presets
  const presets = [
    {
      id: 'high-priority',
      label: 'High Priority',
      icon: AlertTriangle,
      filters: { priority: ['High', 'Showstopper'] }
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      icon: Clock,
      filters: { status: ['In Progress', 'In Development'] }
    },
    {
      id: 'high-quality',
      label: 'High Quality',
      icon: Star,
      filters: { qualityThreshold: 8 }
    },
    {
      id: 'recent',
      label: 'Recent (7 days)',
      icon: Calendar,
      filters: {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
          field: 'createdAt' as const
        }
      }
    }
  ]

  // Get unique values for each filter type
  const getUniqueValues = (field: keyof UserStory): string[] => {
    return Array.from(new Set(userStories.map(story => story[field]).filter(Boolean))) as string[]
  }

  // Apply filters and update parent component
  const applyFilters = useCallback(() => {
    const filteredStories = userStories.filter(story => {
      // Text search
      const searchMatch = !filters.search || 
        story.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        story.jiraKey?.toLowerCase().includes(filters.search.toLowerCase()) ||
        story.component?.toLowerCase().includes(filters.search.toLowerCase()) ||
        story.description?.toLowerCase().includes(filters.search.toLowerCase())

      // Category filters
      const priorityMatch = filters.priority.length === 0 || 
        (story.priority && filters.priority.includes(story.priority))
      
      const statusMatch = filters.status.length === 0 || 
        (story.status && filters.status.includes(story.status))
      
      const componentMatch = filters.component.length === 0 || 
        (story.component && filters.component.includes(story.component))
      
      const assigneeMatch = filters.assignee.length === 0 || 
        (story.assignee && filters.assignee.includes(story.assignee))

      // Quality filter
      const qualityMatch = filters.qualityThreshold === null || 
        (story.latestQualityScore !== null && story.latestQualityScore !== undefined && 
         story.latestQualityScore >= filters.qualityThreshold)

      // Date range filter
      const dateMatch = !filters.dateRange || (() => {
        const storyDate = story[filters.dateRange.field]
        if (!storyDate) return false
        
        const storyDateObj = new Date(storyDate)
        const startDate = new Date(filters.dateRange.start)
        const endDate = new Date(filters.dateRange.end)
        endDate.setHours(23, 59, 59, 999) // Include the entire end date
        
        return storyDateObj >= startDate && storyDateObj <= endDate
      })()

      return searchMatch && priorityMatch && statusMatch && componentMatch && assigneeMatch && qualityMatch && dateMatch
    })

    onFilterChange(filteredStories)
  }, [filters, userStories, onFilterChange])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Handle filter changes
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setActivePreset(null) // Clear preset when manually changing filters
  }

  const toggleArrayFilter = (key: 'priority' | 'status' | 'component' | 'assignee', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }))
    setActivePreset(null)
  }

  const applyPreset = (preset: typeof presets[0]) => {
    setActivePreset(preset.id)
    setFilters(prev => ({
      ...prev,
      ...preset.filters
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      priority: [],
      status: [],
      component: [],
      assignee: [],
      qualityThreshold: null,
      dateRange: null
    })
    setActivePreset(null)
  }

  const activeFiltersCount = 
    filters.priority.length + 
    filters.status.length + 
    filters.component.length + 
    filters.assignee.length + 
    (filters.qualityThreshold !== null ? 1 : 0) +
    (filters.dateRange !== null ? 1 : 0)

  const hasActiveFilters = activeFiltersCount > 0 || filters.search.length > 0

  return (
    <div className="space-y-4">
      {/* Search Bar with Quick Actions */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search stories by title, JIRA key, component, or description..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full pl-10 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="h-3 w-3 mr-1" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
            {showAdvanced ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => {
          const Icon = preset.icon
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                activePreset === preset.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {preset.label}
            </button>
          )
        })}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            {/* Category Filters as Tag Pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                <div className="flex flex-wrap gap-1">
                  {getUniqueValues('priority').map(priority => (
                    <button
                      key={priority}
                      onClick={() => toggleArrayFilter('priority', priority)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.priority.includes(priority)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <div className="flex flex-wrap gap-1">
                  {getUniqueValues('status').map(status => (
                    <button
                      key={status}
                      onClick={() => toggleArrayFilter('status', status)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.status.includes(status)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Component */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Component</label>
                <div className="flex flex-wrap gap-1">
                  {getUniqueValues('component').map(component => (
                    <button
                      key={component}
                      onClick={() => toggleArrayFilter('component', component)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.component.includes(component)
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {component}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Assignee</label>
                <div className="flex flex-wrap gap-1">
                  {getUniqueValues('assignee').map(assignee => (
                    <button
                      key={assignee}
                      onClick={() => toggleArrayFilter('assignee', assignee)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        filters.assignee.includes(assignee)
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {assignee}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Range and Quality Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                <div className="space-y-2">
                  <select
                    value={filters.dateRange?.field || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        updateFilter('dateRange', {
                          start: filters.dateRange?.start || '',
                          end: filters.dateRange?.end || '',
                          field: e.target.value as 'createdAt' | 'updatedAt'
                        })
                      } else {
                        updateFilter('dateRange', null)
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No date filter</option>
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                  </select>
                  {filters.dateRange && (
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={filters.dateRange.start}
                        onChange={(e) => updateFilter('dateRange', {
                          ...filters.dateRange,
                          start: e.target.value
                        })}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="date"
                        value={filters.dateRange.end}
                        onChange={(e) => updateFilter('dateRange', {
                          ...filters.dateRange,
                          end: e.target.value
                        })}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Quality Filter */}
              {showQualityFilter && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Quality Score</label>
                  <div className="space-y-2">
                    <select
                      value={filters.qualityThreshold || ''}
                      onChange={(e) => updateFilter('qualityThreshold', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All quality scores</option>
                      <option value="8">Excellent (8-10)</option>
                      <option value="6">Good (6-10)</option>
                      <option value="4">Fair (4-10)</option>
                      <option value="1">Any score (1-10)</option>
                    </select>
                    {filters.qualityThreshold !== null && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Showing stories with score ≥ {filters.qualityThreshold}/10
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartFilter 