import { useState } from 'react'
import { CheckCircle, AlertTriangle, AlertCircle, Database, FileText, ChevronDown } from 'lucide-react'

interface UserStory {
  id: string
  title: string
  description?: string
  jiraKey?: string
  component?: string
  priority?: string
}

interface AnalysisResultProps {
  result: any
  userStory?: UserStory
  showTitle?: boolean
}

export default function AnalysisResult({ result, userStory, showTitle = true }: AnalysisResultProps) {
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)
  
  // Always use the database score, don't parse from text to avoid inconsistencies
  const analysisText = result.analysis || result.fullAnalysis || result.aiAnalysis || ''
  const displayScore = result.qualityScore || 0
  
  // Clean up arrays - handle both string arrays and JSON strings
  const parseArray = (data: any) => {
    if (Array.isArray(data)) return data.filter((s: string) => s && s.trim().length > 5)
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data)
        return Array.isArray(parsed) ? parsed.filter((s: string) => s && s.trim().length > 5) : []
      } catch {
        return []
      }
    }
    return []
  }
  
  const strengths = parseArray(result.strengths)
  const improvements = parseArray(result.improvements)
  const risks = parseArray(result.riskFactors)
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
    return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
  }
  
  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent'
    if (score >= 6) return 'Good'
    return 'Needs Work'
  }

  const cleanText = (text: string) => {
    return text.replace(/^\*\*[^*]+\*\*:?\s*/, '').trim()
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      
      {/* Header */}
      {showTitle && (
        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {userStory?.jiraKey && (
                  <span className="text-blue-600 mr-3">{userStory.jiraKey}</span>
                )}
                {userStory?.title || 'Analysis Result'}
              </h3>
              {userStory?.component && (
                <span className="inline-block mt-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  {userStory.component}
                </span>
              )}
            </div>
            
            {/* Quality Score */}
            <div className={`px-6 py-4 rounded-lg border ${getScoreColor(displayScore)}`}>
              <div className="text-center">
                <div className="text-3xl font-bold">{displayScore}/10</div>
                <div className="text-base font-medium mt-1">{getScoreLabel(displayScore)}</div>
              </div>
            </div>
          </div>
          
          {/* RAG Enhancement Badge */}
          {result.ragContextUsed && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-md">
              <Database className="h-4 w-4 mr-2" />
              Enhanced with Knowledge Base ({result.ragContextLines} lines)
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-8 py-6 space-y-8">
        
        {/* Quality Score (if no title shown) */}
        {!showTitle && (
          <div className="flex items-center justify-between">
            <div className={`px-6 py-4 rounded-lg border ${getScoreColor(displayScore)}`}>
              <div className="text-center">
                <div className="text-2xl font-bold">{displayScore}/10</div>
                <div className="text-sm font-medium mt-1">{getScoreLabel(displayScore)}</div>
              </div>
            </div>
            
            {/* RAG Enhancement Badge */}
            {result.ragContextUsed && (
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-md">
                <Database className="h-4 w-4 mr-2" />
                Enhanced with KB
              </div>
            )}
          </div>
        )}
        
        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <h4 className="flex items-center text-base font-semibold text-green-700 dark:text-green-300 mb-4">
              <CheckCircle className="h-5 w-5 mr-3" />
              Strengths ({strengths.length})
            </h4>
            <ul className="space-y-3">
              {strengths.map((strength: string, index: number) => (
                <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs font-medium mr-4 mt-1">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{cleanText(strength)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {improvements.length > 0 && (
          <div>
            <h4 className="flex items-center text-base font-semibold text-yellow-700 dark:text-yellow-300 mb-4">
              <AlertTriangle className="h-5 w-5 mr-3" />
              Recommended Improvements ({improvements.length})
            </h4>
            <ul className="space-y-3">
              {improvements.map((improvement: string, index: number) => (
                <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-xs font-medium mr-4 mt-1">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{cleanText(improvement)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Factors */}
        {risks.length > 0 && (
          <div>
            <h4 className="flex items-center text-base font-semibold text-red-700 dark:text-red-300 mb-4">
              <AlertCircle className="h-5 w-5 mr-3" />
              Risk Factors ({risks.length})
            </h4>
            <ul className="space-y-3">
              {risks.map((risk: string, index: number) => (
                <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-medium mr-4 mt-1">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{cleanText(risk)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Full Analysis Toggle */}
        {analysisText && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              onClick={() => setShowFullAnalysis(!showFullAnalysis)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              {showFullAnalysis ? 'Hide' : 'Show'} Complete Analysis Report
              <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${showFullAnalysis ? 'rotate-180' : ''}`} />
            </button>
            
            {showFullAnalysis && (
              <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                    {analysisText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
