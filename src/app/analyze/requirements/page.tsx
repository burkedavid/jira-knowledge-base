'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo, ReactNode } from 'react'
import { BarChart3, Loader2, CheckCircle, AlertTriangle, History, Trash2, Clock, FileText, AlertCircle, Database, ChevronDown, Copy, Check, Save } from 'lucide-react'
import PageLayout from '@/components/ui/page-layout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog'
import ReactMarkdown from 'react-markdown'
import SharedStorySelector from '../../../components/SharedStorySelector'

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
  // CRITICAL FIX: Use the correct qualityScore field from the API response
  const displayScore = result.qualityScore || result.overallScore || 0;
  
  console.log('🐛 DEBUG - Analysis Result:', {
    resultQualityScore: result.qualityScore,
    resultOverallScore: result.overallScore,
    displayScore: displayScore,
    fullResult: result
  });

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
        {(result?.suggestions || result?.improvements || result?.ragSuggestions) && 
         ((result?.suggestions || result?.improvements || []).length > 0 || (result?.ragSuggestions || []).length > 0) && (
          <RefinementSuggestionsSection 
            suggestions={[
              ...(result.ragSuggestions || []),
              ...(result.suggestions || result.improvements || [])
            ]}
            selectedSuggestions={selectedSuggestions}
            onSuggestionToggle={onSuggestionToggle}
          />
        )}
      </div>
    </div>
  );
}

// Improved Refinement Suggestions Component with grouped categories
const RefinementSuggestionsSection = ({ 
  suggestions, 
  selectedSuggestions, 
  onSuggestionToggle 
}: { 
  suggestions: string[], 
  selectedSuggestions: string[], 
  onSuggestionToggle: (suggestion: string) => void 
}) => {
  // Categorize suggestions into logical groups
  const categorizesuggestions = (suggestions: string[]) => {
    const categories = {
      'RAG-Enhanced Suggestions': [] as string[],
      'Story Structure & Format': [] as string[],
      'Requirements Definition': [] as string[],
      'Technical Specifications': [] as string[],
      'User Experience': [] as string[],
      'Quality & Testing': [] as string[],
      'Risk Management': [] as string[]
    }

    suggestions.forEach(suggestion => {
      const lower = suggestion.toLowerCase()
      
      // Prioritize RAG-based suggestions that reference knowledge base context
      if (lower.includes('drag and drop') || lower.includes('business rules') || lower.includes('bim document') || 
          lower.includes('existing') || lower.includes('integration') || lower.includes('knowledge base') || 
          lower.includes('document 1') || lower.includes('document 2') || lower.includes('document 3') ||
          lower.includes('based on the') || lower.includes('according to') || lower.includes('referenced') ||
          lower.includes('existing functionality') || lower.includes('current system') || lower.includes('established')) {
        categories['RAG-Enhanced Suggestions'].push(suggestion)
      } else if (lower.includes('user story format') || lower.includes('break down') || lower.includes('story points') || lower.includes('proper format')) {
        categories['Story Structure & Format'].push(suggestion)
      } else if (lower.includes('stakeholders') || lower.includes('personas') || lower.includes('define') || lower.includes('specify')) {
        categories['Requirements Definition'].push(suggestion)
      } else if (lower.includes('notification') || lower.includes('technical') || lower.includes('override') || lower.includes('methods') || lower.includes('timing')) {
        categories['Technical Specifications'].push(suggestion)
      } else if (lower.includes('user experience') || lower.includes('fatigue') || lower.includes('content') || lower.includes('ux')) {
        categories['User Experience'].push(suggestion)
      } else if (lower.includes('acceptance criteria') || lower.includes('definition of done') || lower.includes('testable') || lower.includes('edge cases') || lower.includes('non-functional')) {
        categories['Quality & Testing'].push(suggestion)
      } else if (lower.includes('rollback') || lower.includes('migration') || lower.includes('audit') || lower.includes('compliance') || lower.includes('risk')) {
        categories['Risk Management'].push(suggestion)
      } else {
        // Default to Requirements Definition for uncategorized items
        categories['Requirements Definition'].push(suggestion)
      }
    })

    return categories
  }

  const categories = categorizesuggestions(suggestions)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['RAG-Enhanced Suggestions', 'Story Structure & Format']))

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const selectAllInCategory = (categoryName: string) => {
    const categorySuggestions = categories[categoryName as keyof typeof categories]
    categorySuggestions.forEach(suggestion => {
      if (!selectedSuggestions.includes(suggestion)) {
        onSuggestionToggle(suggestion)
      }
    })
  }

  const deselectAllInCategory = (categoryName: string) => {
    const categorySuggestions = categories[categoryName as keyof typeof categories]
    categorySuggestions.forEach(suggestion => {
      if (selectedSuggestions.includes(suggestion)) {
        onSuggestionToggle(suggestion)
      }
    })
  }

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'RAG-Enhanced Suggestions': return '🧠'
      case 'Story Structure & Format': return '📝'
      case 'Requirements Definition': return '🎯'
      case 'Technical Specifications': return '⚙️'
      case 'User Experience': return '👤'
      case 'Quality & Testing': return '✅'
      case 'Risk Management': return '🛡️'
      default: return '📋'
    }
  }

  const getCategorySelectedCount = (categoryName: string) => {
    const categorySuggestions = categories[categoryName as keyof typeof categories]
    return categorySuggestions.filter(s => selectedSuggestions.includes(s)).length
  }

  // Quick selection presets
  const selectEssentials = () => {
    const essentials = [
      ...categories['RAG-Enhanced Suggestions'], // Prioritize RAG suggestions
      ...categories['Story Structure & Format'],
      ...categories['Quality & Testing'].filter(s => s.toLowerCase().includes('acceptance criteria'))
    ]
    essentials.forEach(suggestion => {
      if (!selectedSuggestions.includes(suggestion)) {
        onSuggestionToggle(suggestion)
      }
    })
  }

  const selectRAGOnly = () => {
    categories['RAG-Enhanced Suggestions'].forEach(suggestion => {
      if (!selectedSuggestions.includes(suggestion)) {
        onSuggestionToggle(suggestion)
      }
    })
  }

  const selectAll = () => {
    suggestions.forEach(suggestion => {
      if (!selectedSuggestions.includes(suggestion)) {
        onSuggestionToggle(suggestion)
      }
    })
  }

  const clearAll = () => {
    selectedSuggestions.forEach(suggestion => {
      onSuggestionToggle(suggestion)
    })
  }

  return (
    <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-medium text-blue-900 dark:text-blue-100">
          Select Suggestions for AI Refinement
        </h4>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectRAGOnly}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300"
          >
            🧠 RAG Context Only
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectEssentials}
            className="text-xs"
          >
            📝 Essentials + RAG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="text-xs"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Category-based suggestions */}
      <div className="space-y-4">
        {Object.entries(categories).map(([categoryName, categorySuggestions]) => {
          if (categorySuggestions.length === 0) return null
          
          const isExpanded = expandedCategories.has(categoryName)
          const selectedCount = getCategorySelectedCount(categoryName)
          
          return (
            <div key={categoryName} className="border border-gray-200 dark:border-gray-600 rounded-lg">
              {/* Category Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                onClick={() => toggleCategory(categoryName)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getCategoryIcon(categoryName)}</span>
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {categoryName}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedCount}/{categorySuggestions.length} selected
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedCount < categorySuggestions.length && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        selectAllInCategory(categoryName)
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </Button>
                  )}
                  {selectedCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deselectAllInCategory(categoryName)
                      }}
                      className="text-xs text-gray-600 hover:text-gray-700"
                    >
                      Clear
                    </Button>
                  )}
                  <ChevronDown className={`h-4 w-4 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Category Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="pt-3 space-y-3">
                    {categorySuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedSuggestions.includes(suggestion)}
                          onCheckedChange={() => onSuggestionToggle(suggestion)}
                          className="mt-1 border-blue-400 dark:border-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <div 
                          className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed hover:text-gray-900 dark:hover:text-white"
                          onClick={() => onSuggestionToggle(suggestion)}
                        >
                          {suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selection Summary */}
      {selectedSuggestions.length > 0 && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>{selectedSuggestions.length}</strong> suggestion{selectedSuggestions.length !== 1 ? 's' : ''} selected for refinement
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              The AI will focus on these specific areas when refining your user story
            </div>
          </div>
        </div>
      )}
    </div>
  )
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
  const [isUpdatingStory, setIsUpdatingStory] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

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

  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<{
    currentStep: string
    steps: string[]
    isVisible: boolean
  }>({ currentStep: '', steps: [], isVisible: false });

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

  // Handle updating the user story with refined content
  const handleUpdateUserStory = async () => {
    if (!selectedStory || !refinedStory?.text) {
      setToastMessage({ type: 'error', message: 'No refined story available to update.' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsUpdatingStory(true);
    setUpdateSuccess(false);

    try {
      const response = await fetch(`/api/user-stories/${selectedStory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: refinedStory.text,
          // Optionally update other fields if the refined story contains them
          // title: refinedStory.title !== selectedStory.title ? refinedStory.title : undefined
        }),
      });

      if (response.ok) {
        const updatedStory = await response.json();
        
        // Update the local state to reflect the changes
        setUserStories(prev => prev.map(story => 
          story.id === selectedStory.id 
            ? { ...story, description: refinedStory.text }
            : story
        ));

        setUpdateSuccess(true);
        setToastMessage({ type: 'success', message: 'User story updated successfully!' });
        setTimeout(() => {
          setToastMessage(null);
          setUpdateSuccess(false);
          setIsRefinementModalOpen(false); // Close modal after successful update
        }, 3000);
      } else {
        const errorData = await response.json();
        setToastMessage({ 
          type: 'error', 
          message: `Failed to update user story: ${errorData.error || 'Unknown error'}` 
        });
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('Error updating user story:', error);
      setToastMessage({ 
        type: 'error', 
        message: 'An unexpected error occurred while updating the story.' 
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsUpdatingStory(false);
    }
  };

  // Fetch user stories on component mount
  useEffect(() => {
    const fetchUserStories = async () => {
      try {
        // Fetch more stories initially to reduce the need for additional API calls
        const response = await fetch('/api/user-stories?limit=1000&orderBy=updatedAt&order=desc')
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
      let story = userStories.find(s => s.id === storyId)
      
      // If story not found in local array, fetch it from API
      if (!story) {
        try {
          const response = await fetch(`/api/user-stories?limit=5000&orderBy=updatedAt&order=desc`)
          if (response.ok) {
            const data = await response.json()
            const allStories = data.userStories || []
            story = allStories.find((s: UserStory) => s.id === storyId)
            
            // Update local array with all stories to avoid future API calls
            if (allStories.length > 0) {
              setUserStories(allStories)
            }
          }
        } catch (error) {
          console.error('Error fetching stories:', error)
        }
      }
      
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
    
    // Show analysis steps to the user
    const steps = [
      "📋 Gathering user story details...",
      "🔍 Searching knowledge base for similar requirements...",
      "🐛 Looking for related defects and quality issues...",
      "📚 Finding relevant documentation and patterns...",
      "🤖 Asking AI to analyze against INVEST criteria...",
      "⚡ Processing AI response and quality scores..."
    ]
    
    setAnalysisSteps({
      currentStep: steps[0],
      steps: steps,
      isVisible: true
    })

    try {
      // Step 1: Gathering story details
      await new Promise(resolve => setTimeout(resolve, 800))
      setAnalysisSteps(prev => ({ ...prev, currentStep: steps[1] }))
      
      // Step 2: Knowledge base search
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAnalysisSteps(prev => ({ ...prev, currentStep: steps[2] }))
      
      // Step 3: Defect search
      await new Promise(resolve => setTimeout(resolve, 800))
      setAnalysisSteps(prev => ({ ...prev, currentStep: steps[3] }))
      
      // Step 4: Documentation search
      await new Promise(resolve => setTimeout(resolve, 800))
      setAnalysisSteps(prev => ({ ...prev, currentStep: steps[4] }))
      
      // Step 5: AI Analysis
      const response = await fetch('/api/analyze/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userStoryId: selectedStoryId })
      })

      setAnalysisSteps(prev => ({ ...prev, currentStep: steps[5] }))
      await new Promise(resolve => setTimeout(resolve, 500))

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
      setAnalysisSteps({ currentStep: '', steps: [], isVisible: false })
    }
  }

  const convertedDescription = useMemo(() => {
    // Handle edge cases that might cause display issues
    if (!selectedStory?.description) return '';
    
    // Check for null, undefined, or non-string values
    if (typeof selectedStory.description !== 'string') {
      console.warn('Non-string description found:', selectedStory.description);
      return String(selectedStory.description || '');
    }
    
    // Handle empty strings
    if (selectedStory.description.trim() === '') {
      return '';
    }
    
    try {
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
    } catch (error) {
      console.error('Error processing description for story:', selectedStory.jiraKey, error);
      // Fallback to raw description if processing fails
      return selectedStory.description;
    }
  }, [selectedStory?.description]);

  const convertedRefinedStoryText = useMemo(() => {
    if (!refinedStory?.text) return '';
    // Also convert the refined story text from the AI, which may use Confluence-style headings
    return refinedStory.text
      .replace(/^h([1-6])\.\s/gm, (_: string, level: string) => '#'.repeat(parseInt(level)) + ' ');
  }, [refinedStory?.text]);

  const actionButtons = [
    {
      label: 'Batch Analysis',
      onClick: () => router.push('/analyze/requirements/batch'),
      icon: <BarChart3 className="h-4 w-4" />,
      variant: 'primary' as const
    },
    {
      label: `History (${savedAnalyses.length})`,
      onClick: () => setShowHistory(!showHistory),
      icon: <History className="h-4 w-4" />,
      variant: 'outline' as const
    }
  ];

  return (
    <PageLayout
      title="Requirements Analysis"
      subtitle="Analyze user story quality, identify risks, and get AI-powered improvement suggestions"
      icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
      actionButtons={actionButtons}
    >

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
                  
                  {/* Enhanced Story Search Selector */}
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8 border border-gray-300 dark:border-gray-600 rounded-md">
                      <Loader2 className="h-6 w-6 animate-spin mr-3" />
                      <span className="text-gray-500 text-lg">Loading recent stories...</span>
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
                    <SharedStorySelector
                      selectedStoryId={selectedStoryId || ''}
                      onStorySelect={(storyId: string) => {
                        handleStorySelection(storyId)
                        // Clear previous results when selecting a new story
                        if (result) {
                          setResult(null)
                        }
                      }}
                      placeholder="Search all user stories by title, Jira key, or component..."
                      showQualityScore={true}
                      context="analysis"
                    />
                  )}
                </div>


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
                  
                  {/* Description with better error handling */}
                  {selectedStory.description ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-base text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      <ReactMarkdown>{convertedDescription}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 mb-4 italic">
                      No description available for this story.
                    </div>
                  )}
                  
                  {/* Acceptance Criteria */}
                  {selectedStory.acceptanceCriteria && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Acceptance Criteria:</h4>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-400">
                        <ReactMarkdown>{selectedStory.acceptanceCriteria}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-6 text-sm text-gray-500 flex-wrap">
                    {selectedStory.component && (
                      <span>Component: {selectedStory.component}</span>
                    )}
                    {selectedStory.priority && (
                      <span>Priority: {selectedStory.priority}</span>
                    )}
                    {selectedStory.status && (
                      <span>Status: {selectedStory.status}</span>
                    )}
                    {selectedStory.assignee && (
                      <span>Assignee: {selectedStory.assignee}</span>
                    )}
                    {selectedStory.updatedAt && (
                      <span>Updated: {new Date(selectedStory.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  
                  {/* Debug info for problematic stories */}
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-4">
                      <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
                      <div className="mt-2 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        <div>Story ID: {selectedStory.id}</div>
                        <div>Description type: {typeof selectedStory.description}</div>
                        <div>Description length: {selectedStory.description?.length || 0}</div>
                        <div>Has description: {!!selectedStory.description}</div>
                        <div>Description preview: {selectedStory.description?.substring(0, 50)}...</div>
                      </div>
                    </details>
                  )}
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

              {/* Analyze Button */}
              {selectedStoryId && (
                <div className="flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Analyzing Requirements...</span>
                      </>
                    ) : (
                      <>
                        <span>📊</span>
                        <span>{existingAnalysis ? 'Re-analyze Quality' : 'Analyze Quality'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Analysis Steps Display */}
              {analysisSteps.isVisible && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                      AI Analysis in Progress
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-blue-800 dark:text-blue-200 font-medium">
                      {analysisSteps.currentStep}
                    </div>
                    
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="mb-3">Here's what we're asking the AI to analyze:</p>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Evaluate user story quality against INVEST criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Provide a Quality Score (1-10) with detailed justification</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Identify specific strengths and weaknesses in the requirement</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Generate actionable improvement suggestions</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Leverage knowledge base context for enhanced recommendations</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="mt-4 text-xs text-blue-600 dark:text-blue-400">
                      The AI is analyzing your story: "{selectedStory?.title}"
                    </div>
                  </div>
                </div>
              )}
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
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(refinedStory.text || '');
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    variant="outline"
                    className="flex-1 sm:flex-none border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 flex items-center"
                  >
                    {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {isCopied ? 'Copied!' : 'Copy Text'}
                  </Button>
                  <Button 
                    onClick={handleUpdateUserStory}
                    disabled={isUpdatingStory || updateSuccess}
                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white transition-colors duration-150 flex items-center"
                  >
                    {isUpdatingStory ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : updateSuccess ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isUpdatingStory ? 'Updating...' : updateSuccess ? 'Updated!' : 'Update User Story'}
                  </Button>
                </div>
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toastMessage.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            {toastMessage.type === 'success' ? (
              <Check className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}
    </PageLayout>
  )
} 