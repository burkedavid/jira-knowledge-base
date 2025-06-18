import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, ChevronDown, Loader2, X, Clock, Star } from 'lucide-react'

interface UserStory {
  id: string
  title: string
  description: string
  jiraKey?: string
  component?: string
  priority?: string
  status?: string
  assignee?: string
  reporter?: string
  testCaseCount: number
  latestQualityScore?: number
  createdAt?: string
  updatedAt?: string
}

interface StorySearchSelectorProps {
  selectedStoryId: string
  onStorySelect: (storyId: string) => void
  recentStories: UserStory[]
  qualityThreshold?: number
  placeholder?: string
}

const StorySearchSelector: React.FC<StorySearchSelectorProps> = ({
  selectedStoryId,
  onStorySelect,
  recentStories,
  qualityThreshold = 7,
  placeholder = "Search all user stories..."
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserStory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showingRecentStories, setShowingRecentStories] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedStory = [...recentStories, ...searchResults].find(story => story.id === selectedStoryId)

  // Search across all stories in database
  const searchAllStories = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowingRecentStories(true)
      return
    }

    setIsSearching(true)
    setShowingRecentStories(false)

    try {
      const response = await fetch(`/api/user-stories?search=${encodeURIComponent(query)}&limit=50`)
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
  }, [])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAllStories(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchAllStories])

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

  const handleStorySelect = (story: UserStory) => {
    onStorySelect(story.id)
    setIsOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setShowingRecentStories(true)
  }

  const clearSelection = () => {
    onStorySelect('')
    setSearchQuery('')
    setSearchResults([])
    setShowingRecentStories(true)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400'
    if (score >= qualityThreshold) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const displayStories = showingRecentStories ? recentStories : searchResults

  return (
    <div className="relative" ref={dropdownRef}>
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
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {selectedStory.component && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                    {selectedStory.component}
                  </span>
                )}
                {selectedStory.latestQualityScore !== null && selectedStory.latestQualityScore !== undefined && (
                  <span className={`text-xs font-medium ${getScoreColor(selectedStory.latestQualityScore)}`}>
                    Score: {selectedStory.latestQualityScore}/10
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, Jira key, or component..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Header */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {showingRecentStories ? (
                  <>
                    <Clock className="inline h-4 w-4 mr-1" />
                    Recent Stories ({recentStories.length})
                  </>
                ) : (
                  <>
                    <Search className="inline h-4 w-4 mr-1" />
                    Search Results ({searchResults.length})
                  </>
                )}
              </span>
              {!showingRecentStories && searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setShowingRecentStories(true)
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Show Recent
                </button>
              )}
            </div>
          </div>

          {/* Stories List */}
          <div className="max-h-64 overflow-y-auto">
            {displayStories.length > 0 ? (
              displayStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => handleStorySelect(story)}
                  className={`px-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                    story.id === selectedStoryId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {story.jiraKey && (
                          <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                            {story.jiraKey}
                          </span>
                        )}
                        <span className="text-gray-900 dark:text-white font-medium text-sm truncate">
                          {story.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        {story.component && (
                          <span className="bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                            {story.component}
                          </span>
                        )}
                        {story.priority && (
                          <span className={`px-2 py-1 rounded ${
                            story.priority === 'High' || story.priority === 'Showstopper' 
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                              : story.priority === 'Medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          }`}>
                            {story.priority}
                          </span>
                        )}
                        {story.testCaseCount > 0 && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {story.testCaseCount} test cases
                          </span>
                        )}
                      </div>
                    </div>
                    {story.latestQualityScore !== null && story.latestQualityScore !== undefined && (
                      <div className="flex items-center ml-2">
                        <Star className={`h-4 w-4 mr-1 ${getScoreColor(story.latestQualityScore)}`} />
                        <span className={`text-sm font-medium ${getScoreColor(story.latestQualityScore)}`}>
                          {story.latestQualityScore}/10
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                {isSearching ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Searching...</span>
                  </div>
                ) : showingRecentStories ? (
                  <div>
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No recent stories available</p>
                  </div>
                ) : (
                  <div>
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No stories found matching "{searchQuery}"</p>
                    <p className="text-sm mt-1">Try different keywords or check spelling</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StorySearchSelector 