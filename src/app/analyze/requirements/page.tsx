'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react'
import { ArrowLeft, BarChart3, Loader2, CheckCircle, AlertTriangle, History, Trash2, Clock, FileText, AlertCircle, Database, ChevronDown, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog'
import ReactMarkdown from 'react-markdown'
import SmartFilter from '../../../components/SmartFilter'

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



// Simple Analysis Result Component - Clean and Readable
const AnalysisResult = ({ result, userStory, selectedSuggestions, onSuggestionToggle }: { result: any, userStory?: UserStory, selectedSuggestions: string[], onSuggestionToggle: (suggestion: string) => void }) => {
  const analysisText = result.analysis || '';
  // Always use the database score, don't parse from text to avoid inconsistencies
  const displayScore = result.qualityScore || 0;






  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    return 'Needs Work';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {userStory?.jiraKey && (
                <span className="text-blue-600 mr-2">{userStory.jiraKey}</span>
              )}
              {userStory?.title || 'Analysis Result'}
            </h3>
            {userStory?.component && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                {userStory.component}
              </span>
            )}
          </div>
          {/* Quality Score */}
          <div className={`px-4 py-2 rounded-lg border ${getScoreColor(displayScore)}`}>
            <div className="text-center">
              <div className="text-2xl font-bold">{displayScore}/10</div>
              <div className="text-sm font-medium">{getScoreLabel(displayScore)}</div>
            </div>
          </div>
        </div>
        {result.ragContextUsed && (
          <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-md">
            <Database className="h-4 w-4 mr-2" />
            Enhanced with Knowledge Base ({result.ragContextLines} lines)
          </div>
        )}
      </div>

      {/* Content with Integrated Interactive Suggestions */}
      <div className="px-6 py-4 space-y-6">
        {analysisText && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>
              {analysisText}
            </ReactMarkdown>
          </div>
        )}

        {/* Interactive Suggestions Section */}
        {(result?.suggestions || result?.improvements) && (result?.suggestions || result?.improvements).length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">
              Select Suggestions for AI Refinement
            </h4>
            <div className="space-y-2">
              {(result.suggestions || result.improvements).map((suggestion: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedSuggestions.includes(suggestion)}
                    onCheckedChange={() => onSuggestionToggle(suggestion)}
                    className="mt-1 border-blue-400 dark:border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <div 
                    className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed"
                    onClick={() => onSuggestionToggle(suggestion)}
                  >
                    {suggestion}
                  </div>
                </div>
              ))}
            </div>
            {selectedSuggestions.length > 0 && (
              <div className="mt-4 text-sm text-blue-700 dark:text-blue-300">
                {selectedSuggestions.length} suggestion{selectedSuggestions.length !== 1 ? 's' : ''} selected for refinement
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyzeRequirementsPage() {
  const router = useRouter()
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])

  const [isRefinementModalOpen, setIsRefinementModalOpen] = useState(false)
  const [refinedStory, setRefinedStory] = useState<any | null>(null) 
  const [isRefining, setIsRefining] = useState(false)
  const [refinementError, setRefinementError] = useState<string | null>(null)
  const [rawRefinementError, setRawRefinementError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyStoryId, setHistoryStoryId] = useState<string | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<UserStory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [qualityThreshold, setQualityThreshold] = useState(7);
  const [showQualityWarning, setShowQualityWarning] = useState(false);
  const [selectedStoryQualityScore, setSelectedStoryQualityScore] = useState<number | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [existingAnalysis, setExistingAnalysis] = useState<any | null>(null);
  const [filteredUserStories, setFilteredUserStories] = useState<UserStory[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Derived state for selected story
  const selectedStory = userStories.find(s => s.id === selectedStoryId)

  const handleSuggestionToggle = (suggestion: string) => {
    setSelectedSuggestions(prev =>
      prev.includes(suggestion)
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
    )
  }

  const handleOpenRefinementModal = async () => {
    if (selectedSuggestions.length === 0) {
      setRefinementError("Please select at least one improvement suggestion to refine the story.");
      setToastMessage({ type: 'error', message: 'Please select at least one improvement suggestion.' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setRefinementError(null);
    setRawRefinementError(null);
    setRefinedStory(null);
    setIsRefinementModalOpen(true);

    if (!selectedStory) {
      setRefinementError("No user story selected for refinement.");
      setToastMessage({ type: 'error', message: 'No user story selected.' });
      setTimeout(() => setToastMessage(null), 3000);
      setIsRefinementModalOpen(false); // Close modal if no story
      return;
    }

    setIsRefining(true);
    try {
      const prompt = `Refine the following user story based on the selected improvement suggestions. Original Story: "${selectedStory.title}: ${selectedStory.description}". Selected suggestions for improvement: ${selectedSuggestions.join(', ')}. Provide the refined user story text only.`;
      
      const response = await fetch('/api/refine-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalStory: {
            title: selectedStory.title,
            description: selectedStory.description,
            jiraKey: selectedStory.jiraKey,
            component: selectedStory.component,
            priority: selectedStory.priority
          },
          suggestions: selectedSuggestions,
          // You might want to send the full analysis context if the API needs it
          // analysisContext: result?.analysis 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRefinedStory({ 
          text: data.refinedText || data.text || 'No refined text provided by AI.',
          title: selectedStory.title || 'Refined Story'
        });
        setRefinementError(null);
        setRawRefinementError(null);
      } else {
        const errorData = await response.json();
        setRefinementError(errorData.error || `Refinement failed with status: ${response.status}`);
        setRawRefinementError(JSON.stringify(errorData, null, 2));
        setRefinedStory(null);
      }
    } catch (error: any) {
      console.error('Error refining story:', error);
      setRefinementError('An unexpected error occurred during refinement. Check console for details.');
      setRawRefinementError(error.message || String(error));
      setRefinedStory(null);
    } finally {
      setIsRefining(false);
    }
  };

  // Fetch user stories on component mount
  useEffect(() => {
    const fetchUserStories = async () => {
      try {
        const response = await fetch('/api/user-stories?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setUserStories(data.userStories || [])
        } else {
          console.error('Failed to fetch user stories')
        }
      } catch (error) {
        console.error('Error fetching user stories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserStories()
    fetchQualityThreshold()
  }, [])

  // Fetch quality threshold from settings
  const fetchQualityThreshold = async () => {
    try {
      const response = await fetch('/api/settings/quality-threshold')
      const data = await response.json()
      setQualityThreshold(data.qualityThreshold || 7)
    } catch (error) {
      console.error('Error fetching quality threshold:', error)
      setQualityThreshold(7) // fallback
    }
  }

  // Load saved analyses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('requirementAnalyses')
    if (saved) {
      try {
        setSavedAnalyses(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved analyses:', error)
      }
    }
  }, [])

  // Initialize filtered stories with all stories
  useEffect(() => {
    setFilteredUserStories(userStories)
  }, [userStories])

  // Handle filter changes from SmartFilter component
  const handleFilterChange = useCallback((filtered: UserStory[]) => {
    setFilteredUserStories(filtered)
  }, [])

  const saveAnalysisToStorage = (result: any, userStoryTitle: string, userStoryKey?: string) => {
    const newAnalysis = {
      id: Date.now().toString(),
      title: userStoryTitle,
      result,
      timestamp: new Date().toISOString(),
      userStoryTitle,
      userStoryKey
    }
    
    const updated = [newAnalysis, ...savedAnalyses.slice(0, 9)] // Keep last 10
    setSavedAnalyses(updated)
    localStorage.setItem('requirementAnalyses', JSON.stringify(updated))
  }

  const loadSavedAnalysis = (savedAnalysis: typeof savedAnalyses[0]) => {
    setResult(savedAnalysis.result)
    const story = userStories.find(s => s.title === savedAnalysis.userStoryTitle)
    if (story) {
      setSelectedStoryId(story.id)
    }
    setShowHistory(false)
  }

  const clearSavedAnalyses = () => {
    setSavedAnalyses([])
    localStorage.removeItem('requirementAnalyses')
  }

  const fetchExistingAnalysis = async (userStoryId: string) => {
    setIsLoadingExisting(true)
    setExistingAnalysis(null)
    
    try {
      const response = await fetch(`/api/user-stories/${userStoryId}/analysis`)
      if (response.ok) {
        const data = await response.json()
        setExistingAnalysis(data)
      } else if (response.status !== 404) {
        console.error('Failed to fetch existing analysis')
      }
    } catch (error) {
      console.error('Error fetching existing analysis:', error)
    } finally {
      setIsLoadingExisting(false)
    }
  }

  // Handle user story selection with quality score checking
  const handleStorySelection = async (storyId: string) => {
    setSelectedStoryId(storyId)
    if (storyId) {
      const story = userStories.find(s => s.id === storyId)
      if (story && story.latestQualityScore !== null && story.latestQualityScore !== undefined) {
        setSelectedStoryQualityScore(story.latestQualityScore)
        // Show warning if quality score is below threshold
        if (story.latestQualityScore < qualityThreshold) {
          setShowQualityWarning(true)
        }
      } else {
        setSelectedStoryQualityScore(null)
      }
    } else {
      setSelectedStoryQualityScore(null)
    }
  }

  // Fetch existing analysis when user story is selected
  useEffect(() => {
    if (selectedStoryId) {
      fetchExistingAnalysis(selectedStoryId)
      setResult(null) // Clear any current analysis result
      setSelectedSuggestions([]) // Clear selected suggestions when story changes
    } else {
      setExistingAnalysis(null)
    }
  }, [selectedStoryId])


  const handleAnalyze = async () => {
    if (!selectedStoryId) return

    setIsAnalyzing(true)
    setResult(null)

    try {
      const response = await fetch('/api/analyze/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userStoryId: selectedStoryId })
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        
        const storyForSaving = userStories.find(s => s.id === selectedStoryId)
        if (storyForSaving) {
          saveAnalysisToStorage(data, storyForSaving.title, storyForSaving.jiraKey)
        }
        
        // Refresh existing analysis to show the new one
        fetchExistingAnalysis(selectedStoryId)
      } else {
        const errorData = await response.json()
        setResult({ error: errorData.error || 'Analysis failed' })
      }
    } catch (error) {
      console.error('Error analyzing requirements:', error)
      setResult({ error: 'Network error occurred' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const convertedDescription = useMemo(() => {
    if (!selectedStory?.description) return '';
    // Convert Confluence h-tags to Markdown hashes and remove anchors
    let converted = selectedStory.description
      .replace(/^h([1-6])\.\s/gm, (_: string, level: string) => '#'.repeat(parseInt(level)) + ' ')
      .replace(/{anchor:[^}]+}/g, '');
    
    // Convert numbered list items that use # to proper markdown numbered lists
    // This prevents # from being interpreted as headers
    const lines = converted.split('\n');
    let listCounter = 1;
    let inList = false;
    
    const processedLines = lines.map(line => {
      const trimmedLine = line.trim();
      
      // Check if this line starts with # followed by space (numbered list item)
      if (trimmedLine.match(/^#\s+/)) {
        if (!inList) {
          listCounter = 1;
          inList = true;
        }
        // Replace # with numbered list format
        const content = trimmedLine.replace(/^#\s+/, '');
        return `${listCounter++}. ${content}`;
      }
      // Check for sub-items (#*)
      else if (trimmedLine.match(/^#\*\s+/)) {
        const content = trimmedLine.replace(/^#\*\s+/, '');
        return `   - ${content}`;
      }
      // If we encounter a non-list line, reset the list state
      else if (trimmedLine.length > 0 && !trimmedLine.match(/^(#|\s)/)) {
        inList = false;
        listCounter = 1;
      }
      
      return line;
    });
    
    return processedLines.join('\n');
  }, [selectedStory?.description]);

  const convertedRefinedStoryText = useMemo(() => {
    if (!refinedStory?.text) return '';
    // Also convert the refined story text from the AI, which may use Confluence-style headings
    return refinedStory.text
      .replace(/^h([1-6])\.\s/gm, (_: string, level: string) => '#'.repeat(parseInt(level)) + ' ');
  }, [refinedStory?.text]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <div className="flex items-center space-x-4">
              <Link 
                href="/analyze/requirements/batch" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Batch Analysis
              </Link>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <History className="h-4 w-4 mr-2" />
                History ({savedAnalyses.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* History Panel */}
      {showHistory && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analysis History</h3>
                {savedAnalyses.length > 0 && (
                  <button
                    onClick={clearSavedAnalyses}
                    className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {savedAnalyses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No saved analyses yet</p>
              ) : (
                <div className="space-y-3">
                  {savedAnalyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => loadSavedAnalysis(analysis)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {analysis.userStoryKey && (
                              <span className="text-blue-600 mr-2">{analysis.userStoryKey}</span>
                            )}
                            {analysis.userStoryTitle}
                          </span>
                          {analysis.result?.qualityScore && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              analysis.result.qualityScore >= 8 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 
                              analysis.result.qualityScore >= 6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' : 
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            }`}>
                              Score: {analysis.result.qualityScore}/10
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(analysis.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-blue-600 hover:text-blue-700">
                        <span className="text-sm">Load →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI-Powered Requirement Analysis & Refinement
              </h1>
            </div>
          </div>
          
          <div className="p-8">
            <div className="mb-8">
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
              Analyze user story quality against INVEST criteria, get AI-powered recommendations, then select suggestions to automatically refine and improve the requirement.
            </p>
            </div>

            {/* Form */}
            <div className="space-y-8">
              <div>
                <div className="mb-6">
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Select User Story
                  </label>
                  
                  {/* Smart Filter Component */}
                  <SmartFilter
                    userStories={userStories}
                    onFilterChange={handleFilterChange}
                    qualityThreshold={qualityThreshold}
                    showQualityFilter={true}
                  />
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-3" />
                    <span className="text-gray-500 text-lg">Loading user stories...</span>
                  </div>
                ) : userStories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-3 text-lg">No user stories available</p>
                    <Link 
                      href="/import" 
                      className="text-blue-600 hover:text-blue-700 underline text-lg"
                    >
                      Import data first
                    </Link>
                  </div>
                ) : (
                  <div>
                    <select
                      value={selectedStoryId || ''}
                      onChange={(e) => {
                        handleStorySelection(e.target.value)
                        // Clear previous results when selecting a new story
                        if (result) {
                          setResult(null)
                        }
                      }}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white py-4 text-base"
                    >
                      <option value="">Choose a user story to analyze...</option>
                      {filteredUserStories.map((story) => (
                        <option key={story.id} value={story.id}>
                          {story.jiraKey ? `${story.jiraKey} - ` : ''}{story.title}
                          {story.component ? ` (${story.component})` : ''}
                          {story.latestQualityScore ? ` [Score: ${story.latestQualityScore}/10]` : ' [Not analyzed]'}
                        </option>
                      ))}
                    </select>
                    
                    {filteredUserStories.length === 0 && userStories.length > 0 && (
                      <p className="mt-3 text-sm text-gray-500">
                        No stories match your filters.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Show selected story details */}
              {selectedStoryId && selectedStory && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-lg">
                    {selectedStory.jiraKey && (
                      <span className="text-blue-600 mr-2">{selectedStory.jiraKey}</span>
                    )}
                    {selectedStory.title}
                  </h3>
                  {selectedStory.description && (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-base text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      <ReactMarkdown>{convertedDescription}</ReactMarkdown>
                    </div>
                  )}
                  <div className="flex gap-6 text-sm text-gray-500">
                    {selectedStory.component && (
                      <span>Component: {selectedStory.component}</span>
                    )}
                    {selectedStory.priority && (
                      <span>Priority: {selectedStory.priority}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Existing Analysis */}
              {selectedStoryId && (
                <div>
                  {isLoadingExisting ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                      <div className="flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-3" />
                        <span className="text-blue-800 dark:text-blue-200">Checking for existing analysis...</span>
                      </div>
                    </div>
                  ) : existingAnalysis ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                          <span className="text-green-800 dark:text-green-200 font-medium">
                            Previous Analysis Found
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            existingAnalysis.qualityScore >= 8 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            existingAnalysis.qualityScore >= 6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {existingAnalysis.qualityScore}/10
                          </div>
                          <span className="text-xs text-gray-500">
                            {existingAnalysis.source === 'batch' ? 'Batch Analysis' : 'Individual Analysis'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300 mb-3">
                        <Clock className="h-4 w-4 inline mr-2" />
                        Analyzed: {new Date(existingAnalysis.analyzedAt).toLocaleString()}
                      </div>
                      <button
                        onClick={() => setResult(existingAnalysis)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      >
                        View Previous Analysis
                      </button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                        <span className="text-yellow-800 dark:text-yellow-200">
                          No previous analysis found. Run a new analysis below.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !selectedStoryId || userStories.length === 0}
                className="w-full flex items-center justify-center px-6 py-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Analyzing Requirements...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-5 w-5 mr-3" />
                    {existingAnalysis ? 'Re-analyze Quality' : 'Analyze Quality'}
                  </>
                )}
              </button>
            </div>

            {/* Results */}
            {result && !result.error && (
              <div className="mt-12">
                <AnalysisResult result={result} userStory={selectedStory} selectedSuggestions={selectedSuggestions} onSuggestionToggle={handleSuggestionToggle} />
                {result && (
                  <div className="mt-6 flex justify-end">
                    <Button 
                      onClick={handleOpenRefinementModal} 
                      disabled={selectedSuggestions.length === 0 || isAnalyzing || isRefining}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center space-x-2"
                    >
                      {isRefining ? (
                        <Loader2 className="h-5 w-5 animate-spin" /> 
                      ) : (
                        <BarChart3 className="h-5 w-5" />
                      )}
                      <span>Refine with AI ({selectedSuggestions.length} selected)</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {result?.error && (
              <div className="mt-12 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                  <span className="text-red-800 dark:text-red-200 font-medium text-lg">Analysis Failed</span>
                </div>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{result.error}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Refinement Modal */}
      {isRefinementModalOpen && (
        <Dialog open={isRefinementModalOpen} onOpenChange={setIsRefinementModalOpen}>
          <DialogContent className="max-w-2xl w-full bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-300 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
                {refinedStory?.title ? `Refined: ${refinedStory.title}` : 'Refine User Story with AI'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Review the AI-refined user story below. You can copy the refined text.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {isRefining && (
                <div className="flex flex-col items-center justify-center h-40">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                  <p className="text-lg text-gray-700 dark:text-gray-300">AI is refining your story...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This may take a moment.</p>
                </div>
              )}

              {refinementError && !isRefining && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                    <h4 className="font-medium text-red-800 dark:text-red-200">Refinement Error</h4>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">{refinementError}</p>
                  {rawRefinementError && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:underline">Error Details</summary>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">{rawRefinementError}</pre>
                    </details>
                  )}
                </div>
              )}

              {refinedStory?.text && !isRefining && !refinementError && (
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                  <ReactMarkdown>{convertedRefinedStoryText}</ReactMarkdown>
                </div>
              )}
            </div>

            <DialogFooter className="sm:justify-between gap-2 flex-col-reverse sm:flex-row">
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Close
                </Button>
              </DialogClose>
              {refinedStory?.text && !isRefining && !refinementError && (
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(refinedStory.text || '');
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150 flex items-center"
                >
                  {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {isCopied ? 'Copied!' : 'Copy Refined Text'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Quality Warning Dialog */}
      {showQualityWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Low Quality Score Warning
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  This user story has a quality score of <strong>{selectedStoryQualityScore}/10</strong>, 
                  which is below the configured threshold of <strong>{qualityThreshold}/10</strong>.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Re-analyzing low-quality requirements may not provide significantly different results. 
                  Consider improving the requirement first based on previous analysis recommendations.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowQualityWarning(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowQualityWarning(false)
                    // Continue with analysis
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700"
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 