import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Clock, AlertTriangle, CheckCircle, Star, Users, Calendar, Component, Flag } from 'lucide-react'

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
  latestQualityScore?: number
  qualityScore?: number
  createdAt?: string
  updatedAt?: string
  testCaseCount?: number
  acceptanceCriteria?: string
}

interface SelectedStoryDisplayProps {
  story: UserStory
  showDebugInfo?: boolean
  className?: string
  compact?: boolean
}

const SelectedStoryDisplay: React.FC<SelectedStoryDisplayProps> = ({
  story,
  showDebugInfo = false,
  className = "",
  compact = false
}) => {
  // Convert Confluence-style formatting to Markdown
  const convertedDescription = useMemo(() => {
    if (!story.description) return '';
    
    // Check for null, undefined, or non-string values
    if (typeof story.description !== 'string') {
      console.warn('Non-string description found:', story.description);
      return String(story.description || '');
    }
    
    // Handle empty strings
    if (story.description.trim() === '') {
      return '';
    }
    
    try {
      // Convert Confluence h-tags to Markdown hashes and remove anchors
      let converted = story.description
        .replace(/^h([1-6])\.\s/gm, (_: string, level: string) => '#'.repeat(parseInt(level)) + ' ')
        .replace(/{anchor:[^}]+}/g, '');
      
      // Convert numbered list items that use # to proper markdown numbered lists
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
      console.error('Error processing description for story:', story.jiraKey, error);
      // Fallback to raw description if processing fails
      return story.description;
    }
  }, [story.description, story.jiraKey]);

  // Get quality score (support both field names)
  const qualityScore = story.qualityScore ?? story.latestQualityScore;

  // Get priority color and icon
  const getPriorityDisplay = (priority: string | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'showstopper':
        return { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: <AlertTriangle className="h-3 w-3" /> };
      case 'medium':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: <Star className="h-3 w-3" /> };
      case 'low':
        return { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: <CheckCircle className="h-3 w-3" /> };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700', icon: <Flag className="h-3 w-3" /> };
    }
  };

  // Get quality score color
  const getQualityScoreColor = (score: number | undefined) => {
    if (!score) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    if (score >= 8) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  const priorityDisplay = getPriorityDisplay(story.priority);

  return (
    <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-6 ${className}`}>
      {/* Title and Jira Key */}
      <div className="flex items-start justify-between mb-4">
        <h3 className={`font-medium text-gray-900 dark:text-white ${compact ? 'text-base' : 'text-lg'} leading-tight`}>
          {story.jiraKey && (
            <span className="text-blue-600 dark:text-blue-400 mr-2 font-mono text-sm bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
              {story.jiraKey}
            </span>
          )}
          <span className="break-words">{story.title}</span>
        </h3>
        
        {/* Quality Score Badge */}
        {qualityScore !== null && qualityScore !== undefined && (
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getQualityScoreColor(qualityScore)} ml-4 flex-shrink-0`}>
            <Star className="h-3 w-3 mr-1" />
            {qualityScore}/10
          </div>
        )}
      </div>
      
      {/* Description */}
      {story.description ? (
        <div className={`prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-4 ${compact ? 'text-sm' : 'text-base'} leading-relaxed`}>
          <ReactMarkdown>{convertedDescription}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 mb-4 italic">
          No description available for this story.
        </div>
      )}
      
      {/* Acceptance Criteria */}
      {story.acceptanceCriteria && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
            Acceptance Criteria:
          </h4>
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/10 p-3 rounded border-l-4 border-green-400">
            <ReactMarkdown>{story.acceptanceCriteria}</ReactMarkdown>
          </div>
        </div>
      )}
      
      {/* Metadata Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Priority */}
        {story.priority && (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${priorityDisplay.bg} ${priorityDisplay.color}`}>
            {priorityDisplay.icon}
            <span className="ml-1">Priority: {story.priority}</span>
          </span>
        )}
        
        {/* Status */}
        {story.status && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <Flag className="h-3 w-3 mr-1" />
            {story.status}
          </span>
        )}
        
        {/* Component */}
        {story.component && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            <Component className="h-3 w-3 mr-1" />
            {story.component}
          </span>
        )}
        
        {/* Test Case Count */}
        {story.testCaseCount !== undefined && story.testCaseCount > 0 && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            {story.testCaseCount} test cases
          </span>
        )}
        
        {/* Assignee */}
        {story.assignee && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
            <Users className="h-3 w-3 mr-1" />
            Assigned: {story.assignee}
          </span>
        )}
        
        {/* Reporter */}
        {story.reporter && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
            <Users className="h-3 w-3 mr-1" />
            Reporter: {story.reporter}
          </span>
        )}
      </div>
      
      {/* Timestamps */}
      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
        {story.createdAt && (
          <span className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Created: {new Date(story.createdAt).toLocaleDateString()}
          </span>
        )}
        {story.updatedAt && (
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Updated: {new Date(story.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
      
      {/* Debug info for development */}
      {showDebugInfo && process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Debug Info</summary>
          <div className="mt-2 text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
            <div>Story ID: {story.id}</div>
            <div>Description type: {typeof story.description}</div>
            <div>Description length: {story.description?.length || 0}</div>
            <div>Has description: {!!story.description}</div>
            <div>Quality Score: {qualityScore || 'N/A'}</div>
            <div>Test Case Count: {story.testCaseCount || 0}</div>
            <div>Description preview: {story.description?.substring(0, 50)}...</div>
          </div>
        </details>
      )}
    </div>
  );
};

export default SelectedStoryDisplay; 