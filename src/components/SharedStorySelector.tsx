import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, ChevronDown, Loader2, X, Clock, Star, Filter, AlertTriangle, CheckCircle } from 'lucide-react'

interface UserStory {
  id: string
  title: string
  description: string
  jiraKey?: string
  jiraId?: string
  component?: string
  priority?: string
  status?: string
  assignee?: string
  reporter?: string
  qualityScore?: number
  storyPoints?: number
  acceptanceCriteria?: string
  createdAt?: string
  updatedAt?: string
  testCases?: Array<{ id: string }>
}

interface FilterState {
  search: string
  priority: string[]
  status: string[]
  component: string[]
  assignee: string[]
  reporter: string[]
  qualityScoreMin: number | null
  qualityScoreMax: number | null
  storyPointsMin: number | null
  storyPointsMax: number | null
  hasAcceptanceCriteria: boolean | null
  hasTestCases: boolean | null
}

interface SharedStorySelectorProps {
  selectedStoryId: string
  onStorySelect: (storyId: string) => void
  placeholder?: string
  showQualityScore?: boolean
  showTestCaseCount?: boolean
  showStoryPoints?: boolean
  className?: string
  context?: 'analysis' | 'test-generation' | 'general'
}

const SharedStorySelector: React.FC<SharedStorySelectorProps> = ({
  selectedStoryId,
  onStorySelect,
  placeholder = "Search user stories...",
  showQualityScore = true,
  showTestCaseCount = false,
  showStoryPoints = false,
  className = "",
  context = 'general'
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false)
  const [recentStories, setRecentStories] = useState<UserStory[]>([])
  const [searchResults, setSearchResults] = useState<UserStory[]>([])
  const [isLoadingRecent, setIsLoadingRecent] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showingRecentStories, setShowingRecentStories] = useState(true)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: [],
    status: [],
    component: [],
    assignee: [],
    reporter: [],
    qualityScoreMin: null,
    qualityScoreMax: null,
    storyPointsMin: null,
    storyPointsMax: null,
    hasAcceptanceCriteria: null,
    hasTestCases: null
  })

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    priorities: [] as string[],
    statuses: [] as string[],
    components: [] as string[],
    assignees: [] as string[],
    reporters: [] as string[]
  })

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get selected story
  const selectedStory = [...recentStories, ...searchResults].find(story => story.id === selectedStoryId)

  // Load recent stories on mount
  useEffect(() => {
    loadRecentStories()
  }, [])

  const loadRecentStories = async () => {
    setIsLoadingRecent(true)
    try {
      const response = await fetch('/api/user-stories?limit=100&orderBy=updatedAt&order=desc')
      if (response.ok) {
        const data = await response.json()
        const stories = data.userStories || []
        setRecentStories(stories)
        
        // Extract unique values for filter options
        const priorities = Array.from(new Set(stories.map((s: UserStory) => s.priority).filter(Boolean))) as string[]
        const statuses = Array.from(new Set(stories.map((s: UserStory) => s.status).filter(Boolean))) as string[]
        const components = Array.from(new Set(stories.map((s: UserStory) => s.component).filter(Boolean))) as string[]
        const assignees = Array.from(new Set(stories.map((s: UserStory) => s.assignee).filter(Boolean))) as string[]
        const reporters = Array.from(new Set(stories.map((s: UserStory) => s.reporter).filter(Boolean))) as string[]
        
        setFilterOptions({
          priorities,
          statuses, 
          components,
          assignees,
          reporters
        })
      }
    } catch (error) {
      console.error('Error loading recent stories:', error)
    } finally {
      setIsLoadingRecent(false)
    }
  }

  // Advanced search with filters
  const searchStoriesWithFilters = useCallback(async () => {
    if (!filters.search.trim() && !hasActiveFilters()) {
      setSearchResults([])
      setShowingRecentStories(true)
      return
    }

    setIsSearching(true)
    setShowingRecentStories(false)

    try {
      const searchParams = new URLSearchParams()
      
      if (filters.search.trim()) {
        searchParams.append('search', filters.search)
      }
      
      if (filters.priority.length > 0) {
        searchParams.append('priority', filters.priority.join(','))
      }
      
      if (filters.status.length > 0) {
        searchParams.append('status', filters.status.join(','))
      }
      
      if (filters.component.length > 0) {
        searchParams.append('component', filters.component.join(','))
      }
      
      if (filters.assignee.length > 0) {
        searchParams.append('assignee', filters.assignee.join(','))
      }
      
      if (filters.reporter.length > 0) {
        searchParams.append('reporter', filters.reporter.join(','))
      }
      
      if (filters.qualityScoreMin !== null) {
        searchParams.append('qualityScoreMin', filters.qualityScoreMin.toString())
      }
      
      if (filters.qualityScoreMax !== null) {
        searchParams.append('qualityScoreMax', filters.qualityScoreMax.toString())
      }
      
      if (filters.storyPointsMin !== null) {
        searchParams.append('storyPointsMin', filters.storyPointsMin.toString())
      }
      
      if (filters.storyPointsMax !== null) {
        searchParams.append('storyPointsMax', filters.storyPointsMax.toString())
      }
      
      if (filters.hasAcceptanceCriteria !== null) {
        searchParams.append('hasAcceptanceCriteria', filters.hasAcceptanceCriteria.toString())
      }
      
      if (filters.hasTestCases !== null) {
        searchParams.append('hasTestCases', filters.hasTestCases.toString())
      }

      // For searches, don't limit results so we can find any story regardless of age
      // Only apply a reasonable limit for performance (but much higher than the initial 200)
      searchParams.append('limit', '5000')

      const response = await fetch(`/api/user-stories?${searchParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.userStories || [])
      } else {
        console.error('Failed to search stories')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching stories:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [filters])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchStoriesWithFilters()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchStoriesWithFilters])

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.priority.length > 0 ||
           filters.status.length > 0 ||
           filters.component.length > 0 ||
           filters.assignee.length > 0 ||
           filters.reporter.length > 0 ||
           filters.qualityScoreMin !== null ||
           filters.qualityScoreMax !== null ||
           filters.storyPointsMin !== null ||
           filters.storyPointsMax !== null ||
           filters.hasAcceptanceCriteria !== null ||
           filters.hasTestCases !== null
  }

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Event handlers
  const handleStorySelect = (story: UserStory) => {
    onStorySelect(story.id)
    setIsOpen(false)
  }

  const clearSelection = () => {
    onStorySelect('')
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const clearAllFilters = () => {
    setFilters({
      search: '',
      priority: [],
      status: [],
      component: [],
      assignee: [],
      reporter: [],
      qualityScoreMin: null,
      qualityScoreMax: null,
      storyPointsMin: null,
      storyPointsMax: null,
      hasAcceptanceCriteria: null,
      hasTestCases: null
    })
  }

  const toggleArrayFilter = (key: keyof Pick<FilterState, 'priority' | 'status' | 'component' | 'assignee' | 'reporter'>, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }))
  }

  // Helper functions
  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400'
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number | undefined) => {
    if (!score) return 'No Score'
    if (score >= 8) return 'Excellent'
    if (score >= 6) return 'Good'
    return 'Needs Work'
  }

  const getPriorityIcon = (priority: string | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'showstopper':
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      case 'medium':
        return <Star className="h-3 w-3 text-yellow-500" />
      case 'low':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      default:
        return null
    }
  }

  const displayStories = showingRecentStories ? recentStories : searchResults
  const activeFiltersCount = Object.values(filters).filter(v => 
    Array.isArray(v) ? v.length > 0 : v !== null && v !== ''
  ).length

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Story Display / Search Input */}
      <div 
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 cursor-pointer"
        onClick={handleInputFocus}
      >
        {selectedStory ? (
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                {selectedStory.jiraKey && (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {selectedStory.jiraKey}
                  </span>
                )}
                <span className="text-gray-900 dark:text-white truncate">
                  {selectedStory.title}
                </span>
                {getPriorityIcon(selectedStory.priority)}
              </div>
              <div className="flex items-center space-x-2 mt-1 flex-wrap">
                {selectedStory.component && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                    {selectedStory.component}
                  </span>
                )}
                {showQualityScore && selectedStory.qualityScore !== null && selectedStory.qualityScore !== undefined && (
                  <span className={`text-xs font-medium ${getScoreColor(selectedStory.qualityScore)}`}>
                    Quality: {selectedStory.qualityScore}/10
                  </span>
                )}
                {showStoryPoints && selectedStory.storyPoints && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                    {selectedStory.storyPoints} pts
                  </span>
                )}
                {showTestCaseCount && selectedStory.testCases && (
                  <span className="text-xs bg-green-100 dark:bg-green-600 text-green-600 dark:text-green-300 px-2 py-1 rounded">
                    {selectedStory.testCases.length} tests
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearSelection()
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        ) : (
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <Search className="h-4 w-4 mr-2" />
            <span>{placeholder}</span>
            <ChevronDown className="h-4 w-4 ml-auto" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by title, Jira key, or component..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              {(isSearching || isLoadingRecent) && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>
            
            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
              >
                <Filter className="h-4 w-4 mr-1" />
                Advanced Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Priority Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <div className="space-y-1">
                    {filterOptions.priorities.map(priority => (
                      <label key={priority} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.priority.includes(priority)}
                          onChange={() => toggleArrayFilter('priority', priority)}
                          className="mr-2 h-3 w-3"
                        />
                        <span className="text-xs">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <div className="space-y-1">
                    {filterOptions.statuses.map(status => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={() => toggleArrayFilter('status', status)}
                          className="mr-2 h-3 w-3"
                        />
                        <span className="text-xs">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Component Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Component</label>
                  <div className="space-y-1">
                    {filterOptions.components.slice(0, 5).map(component => (
                      <label key={component} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.component.includes(component)}
                          onChange={() => toggleArrayFilter('component', component)}
                          className="mr-2 h-3 w-3"
                        />
                        <span className="text-xs">{component}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Quality Score Range */}
                {showQualityScore && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quality Score</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={filters.qualityScoreMin ?? ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          qualityScoreMin: e.target.value ? Number(e.target.value) : null 
                        }))}
                        placeholder="Min"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={filters.qualityScoreMax ?? ''}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          qualityScoreMax: e.target.value ? Number(e.target.value) : null 
                        }))}
                        placeholder="Max"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stories List Header */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                {showingRecentStories ? (
                  <>
                    <Clock className="h-4 w-4 inline mr-1" />
                    Recent Stories ({recentStories.length})
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 inline mr-1" />
                    Search Results ({searchResults.length})
                  </>
                )}
              </span>
              {!showingRecentStories && searchResults.length === 0 && !isSearching && (
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, search: '' }))
                    clearAllFilters()
                  }}
                  className="text-blue-600 hover:text-blue-700 text-xs"
                >
                  Show Recent
                </button>
              )}
            </div>
          </div>

          {/* Stories List */}
          <div className="max-h-64 overflow-y-auto">
            {isLoadingRecent && showingRecentStories ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-gray-500">Loading recent stories...</span>
              </div>
            ) : displayStories.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {showingRecentStories ? 'No recent stories found' : 'No stories match your search criteria'}
              </div>
            ) : (
              displayStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => handleStorySelect(story)}
                  className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {story.jiraKey && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                            {story.jiraKey}
                          </span>
                        )}
                        {getPriorityIcon(story.priority)}
                        <span className="text-gray-900 dark:text-white text-sm truncate">
                          {story.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        {story.component && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                            {story.component}
                          </span>
                        )}
                        {story.status && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded">
                            {story.status}
                          </span>
                        )}
                        {showStoryPoints && story.storyPoints && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-600 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded">
                            {story.storyPoints} pts
                          </span>
                        )}
                        {showTestCaseCount && story.testCases && (
                          <span className="text-xs bg-green-100 dark:bg-green-600 text-green-600 dark:text-green-300 px-2 py-0.5 rounded">
                            {story.testCases.length} tests
                          </span>
                        )}
                      </div>
                    </div>
                    {showQualityScore && story.qualityScore !== null && story.qualityScore !== undefined && (
                      <div className="ml-2 flex flex-col items-end">
                        <span className={`text-xs font-medium ${getScoreColor(story.qualityScore)}`}>
                          {story.qualityScore}/10
                        </span>
                        <span className={`text-xs ${getScoreColor(story.qualityScore)}`}>
                          {getScoreLabel(story.qualityScore)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SharedStorySelector
