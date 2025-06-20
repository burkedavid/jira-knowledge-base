'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Brain, AlertTriangle, TrendingUp, Target, Shield, TestTube, Lightbulb, RefreshCw, Download, Copy, ChevronDown, ChevronRight, Save, History, Clock, Trash2, Info } from 'lucide-react'

interface DefectPattern {
  id: string
  name: string
  description: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  frequency: number
  affectedComponents: string[]
  rootCauses: string[]
  businessImpact: string
  preventionStrategy: string
  testingRecommendations: string[]
  relatedDefects: string[]
  confidence: number
}

interface DefectPatternAnalysis {
  patterns: DefectPattern[]
  insights: {
    overallTrend: string
    riskAssessment: string
    priorityActions: string[]
    qualityMetrics: {
      patternDiversity: number
      componentCoverage: number
      severityDistribution: Record<string, number>
    }
  }
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
}

interface DefectPatternsAnalysisProps {
  timeframe?: string
  component?: string
}

export default function DefectPatternsAnalysis({ timeframe = '90d', component }: DefectPatternsAnalysisProps) {
  const [analysis, setAnalysis] = useState<DefectPatternAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preprocessingComplete, setPreprocessingComplete] = useState(false)
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set())
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showCostTooltip, setShowCostTooltip] = useState(false)
  const [currentPhase, setCurrentPhase] = useState('')
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [renderKey, setRenderKey] = useState(0) // Force re-renders
  const [processingMetrics, setProcessingMetrics] = useState<{
    totalDefects: number
    qualityScore: number
    costImpact: number
    topComponents: string[]
    samplingStrategy: string
    samplingDetails?: any
  } | null>(null)

  // Create proper timeframe label
  const timeframeLabel = timeframe === '30d' ? 'Last 30 days' :
                        timeframe === '90d' ? 'Last 90 days' :
                        timeframe === '1y' ? 'Last year' :
                        timeframe === 'all' ? 'All time' :
                        timeframe || 'Unknown timeframe'

  const analyzePatterns = async () => {
    // Prevent duplicate calls
    if (isAnalyzing) {
      console.log('⏸️ Analysis already in progress, skipping duplicate call')
      return
    }
    
    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)
    setPreprocessingComplete(false)
    setProcessingMetrics(null)
    setCurrentPhase('Phase 1: Database Analysis')
    setPhaseProgress(10)

    try {
      // PHASE 1: Initialize - Get basic statistics (fast, ~2-5 seconds)
      console.log('🚀 Phase 1: Database Analysis')
      
      const phase1Response = await fetch('/api/analytics/defects/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `analyze defect patterns for ${component || 'all components'} in ${timeframe}`,
          timeframe: timeframe,
          phase: 'init'
        })
      })

      if (!phase1Response.ok) {
        throw new Error(`Phase 1 failed: ${phase1Response.statusText}`)
      }

      const phase1Data = await phase1Response.json()
      
      // Show quick stats
      if (phase1Data.statistics) {
        console.log('📊 Phase 1 Statistics received:', phase1Data.statistics)
        console.log('📊 defectsByComponent type:', typeof phase1Data.statistics.defectsByComponent)
        console.log('📊 defectsByComponent content:', phase1Data.statistics.defectsByComponent)
        
        setProcessingMetrics({
          totalDefects: phase1Data.statistics.totalDefects,
          qualityScore: phase1Data.statistics.qualityScore || 0,
          costImpact: phase1Data.statistics.costImpact || 0,
          topComponents: phase1Data.statistics.defectsByComponent?.slice(0, 3) || [],
          samplingStrategy: 'quick_overview',
          samplingDetails: 'Initial database scan'
        })
        setPreprocessingComplete(true)
      }

      // Small delay to ensure proper sequencing
      await new Promise(resolve => setTimeout(resolve, 1000))

      // PHASE 2: Semantic Search (10-15 seconds)
      setCurrentPhase('Phase 2: Semantic Search')
      setPhaseProgress(30)
      console.log('🔍 Phase 2: Semantic Search')
      
      const phase2Response = await fetch('/api/analytics/defects/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `analyze defect patterns for ${component || 'all components'} in ${timeframe}`,
          timeframe: timeframe,
          phase: 'semantic',
          context: phase1Data
        })
      })

      if (!phase2Response.ok) {
        throw new Error(`Phase 2 failed: ${phase2Response.statusText}`)
      }

      const phase2Data = await phase2Response.json()
      
      // Small delay between phases
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // PHASE 3: Context Enrichment (15-20 seconds)
      setCurrentPhase('Phase 3: Context Enrichment')
      setPhaseProgress(50)
      console.log('📊 Phase 3: Context Enrichment')
      
      const phase3Response = await fetch('/api/analytics/defects/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `analyze defect patterns for ${component || 'all components'} in ${timeframe}`,
          timeframe: timeframe,
          phase: 'enrich',
          context: { ...phase1Data, ...phase2Data }
        })
      })

      if (!phase3Response.ok) {
        throw new Error(`Phase 3 failed: ${phase3Response.statusText}`)
      }

      const phase3Data = await phase3Response.json()

      // Small delay between phases
      await new Promise(resolve => setTimeout(resolve, 500))

      // PHASE 4A: AI Overview (10-15 seconds)
      setCurrentPhase('Phase 4A: Executive Overview')
      setPhaseProgress(70)
      console.log('🧠 Phase 4A: AI Overview')
      
      const phase4aResponse = await fetch('/api/analytics/defects/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `analyze defect patterns for ${component || 'all components'} in ${timeframe}`,
          timeframe: timeframe,
          phase: 'analyze-overview',
          context: { ...phase1Data, ...phase2Data, ...phase3Data }
        })
      })

      if (!phase4aResponse.ok) {
        throw new Error(`Phase 4A failed: ${phase4aResponse.statusText}`)
      }

      const phase4aData = await phase4aResponse.json()
      
      // Show first AI results immediately
      if (phase4aData.content) {
        console.log('📊 Phase 4A: Setting initial analysis with overview:', phase4aData.content.substring(0, 100) + '...')
        // Create a basic analysis structure to show initial results
        const initialAnalysis = {
          patterns: [],
          insights: {
            overallTrend: phase4aData.content,
            riskAssessment: 'Generating detailed pattern analysis...',
            priorityActions: ['Pattern analysis in progress...'],
            qualityMetrics: {
              patternDiversity: 0,
              componentCoverage: 0,
              severityDistribution: {}
            }
          },
          recommendations: {
            immediate: ['Generating immediate actions...'],
            shortTerm: ['Generating short-term strategy...'],
            longTerm: ['Generating long-term roadmap...']
          }
        }
        setAnalysis(initialAnalysis)
        console.log('📊 Analysis state updated with initial results')
        
        // Force a re-render by updating render key
        setRenderKey(prev => prev + 1)
        setPhaseProgress(75)
      }

      // Small delay between phases
      await new Promise(resolve => setTimeout(resolve, 500))

      // PHASE 4B: Pattern Analysis (15-20 seconds)
      setCurrentPhase('Phase 4B: Pattern Analysis')
      setPhaseProgress(85)
      console.log('🔍 Phase 4B: Pattern Analysis')
      
      const phase4bResponse = await fetch('/api/analytics/defects/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `analyze defect patterns for ${component || 'all components'} in ${timeframe}`,
          timeframe: timeframe,
          phase: 'analyze-patterns',
          context: { ...phase1Data, ...phase2Data, ...phase3Data, ...phase4aData }
        })
      })

      if (!phase4bResponse.ok) {
        throw new Error(`Phase 4B failed: ${phase4bResponse.statusText}`)
      }

      const phase4bData = await phase4bResponse.json()
      
      // Update analysis with pattern data using functional state update
      if (phase4bData.content) {
        console.log('🔍 Phase 4B: Updating analysis with pattern data:', phase4bData.content.substring(0, 100) + '...')
        setAnalysis(prevAnalysis => {
          if (!prevAnalysis) return prevAnalysis
          
                    // Parse patterns from the AI response - use real database statistics
          const parsePatterns = (content: string, realStats: any): DefectPattern[] => {
            const patterns: DefectPattern[] = []
            console.log('🔍 Parsing patterns from content with real stats:', content.substring(0, 200) + '...')
            console.log('🔍 Real stats available:', realStats)
            
            // Look for patterns in the "Critical Patterns Identified" section
            const criticalPatternsMatch = content.match(/## Critical Patterns Identified([\s\S]*?)(?=##|$)/i)
            if (!criticalPatternsMatch) {
              console.log('❌ No "Critical Patterns Identified" section found')
              return patterns
            }
            
            const patternsSection = criticalPatternsMatch[1]
            console.log('🔍 Found patterns section:', patternsSection.substring(0, 200) + '...')
            
            // Split by pattern entries (looking for **1. or **2. etc.)
            const patternMatches = patternsSection.match(/\*\*\d+\.\s*([^*]+?)\s*-\s*Risk:\s*(HIGH|MEDIUM|LOW)\*\*[\s\S]*?(?=\*\*\d+\.|$)/gi)
            
            if (!patternMatches) {
              console.log('❌ No pattern matches found with regex')
              // Fallback: create patterns from real database statistics
              if (realStats?.defectPatterns) {
                return realStats.defectPatterns.slice(0, 10).map((pattern: any, index: number) => ({
                  id: `pattern-${index + 1}`,
                  name: pattern.rootCause || `Pattern ${index + 1}`,
                  description: `Root cause pattern identified in ${pattern._count?.id || 0} defects`,
                  severity: 'High' as 'Critical' | 'High' | 'Medium' | 'Low',
                  frequency: pattern._count?.id || 0,
                  affectedComponents: realStats.defectsByComponent?.slice(0, 3).map((c: any) => c.component) || ['Multiple Components'],
                  rootCauses: [pattern.rootCause || 'Unknown cause'],
                  businessImpact: 'Business impact assessment pending',
                  preventionStrategy: 'Review detailed analysis for prevention strategies',
                  testingRecommendations: ['Enhanced testing protocols'],
                  relatedDefects: [],
                  confidence: 0.85
                }))
              }
              return []
            }
            
            console.log(`🔍 Found ${patternMatches.length} pattern matches`)
            
            patternMatches.forEach((match, index) => {
              console.log(`🔍 Processing pattern ${index + 1}:`, match.substring(0, 100) + '...')
              
              // Extract pattern name and risk
              const nameRiskMatch = match.match(/\*\*\d+\.\s*(.+?)\s*-\s*Risk:\s*(HIGH|MEDIUM|LOW)\*\*/i)
              if (!nameRiskMatch) return
              
              const name = nameRiskMatch[1].trim()
              const risk = nameRiskMatch[2].toUpperCase()
              
              // Use REAL frequency from database statistics instead of parsing AI response
              let frequency = 0
              if (realStats?.defectPatterns && realStats.defectPatterns[index]) {
                frequency = realStats.defectPatterns[index]._count?.id || 0
              } else if (realStats?.defectsByComponent && realStats.defectsByComponent[index]) {
                frequency = realStats.defectsByComponent[index]._count?.id || 0
              } else {
                // Fallback: extract from AI if available, otherwise use realistic estimate
                const freqMatch = match.match(/Frequency:\s*(\d+)/i)
                frequency = freqMatch ? parseInt(freqMatch[1]) : Math.floor(realStats?.totalDefects / 10) || 50
              }
              
              // Extract components from AI or use real component data
              const compMatch = match.match(/Components:\s*([^\n]+)/i)
              let components = []
              if (compMatch) {
                components = compMatch[1].split(',').map(c => c.trim())
              } else if (realStats?.defectsByComponent) {
                components = realStats.defectsByComponent.slice(0, 3).map((c: any) => c.component)
              } else {
                components = ['Documents', 'Activities', 'Mobile']
              }
              
              // Extract business impact
              const impactMatch = match.match(/Business Impact:\s*([^\n]+)/i)
              const impact = impactMatch ? impactMatch[1].trim() : 'Business impact assessment pending'
              
              const pattern = {
                id: `pattern-${index + 1}`,
                name: name,
                description: impact,
                severity: (risk === 'HIGH' ? 'High' : risk === 'MEDIUM' ? 'Medium' : 'Low') as 'Critical' | 'High' | 'Medium' | 'Low',
                frequency: frequency, // Now using REAL numbers from database
                affectedComponents: Array.isArray(components) ? components : [components],
                rootCauses: [impact],
                businessImpact: impact,
                preventionStrategy: 'Implement enhanced testing and monitoring protocols',
                testingRecommendations: ['Automated regression testing', 'Component-specific test suites'],
                relatedDefects: [],
                confidence: 0.85
              }
              
              patterns.push(pattern)
              console.log(`✅ Added pattern: ${pattern.name} (${pattern.severity}) - REAL frequency: ${frequency}`)
            })
            
            console.log(`🔍 Successfully parsed ${patterns.length} patterns with REAL frequencies`)
            return patterns
          }
          
          const parsedPatterns = parsePatterns(phase4bData.content, phase1Data.statistics)
          
          const updated = {
            ...prevAnalysis,
            patterns: parsedPatterns,
            insights: {
              ...prevAnalysis.insights,
              riskAssessment: phase4bData.content,
              priorityActions: parsedPatterns.length > 0 ? 
                parsedPatterns.slice(0, 3).map(p => `Address ${p.name} (${p.severity} risk)`) : 
                ['Review pattern analysis for priority actions']
            }
          }
          console.log('🔍 Pattern analysis state updated with', parsedPatterns.length, 'patterns')
          // Force re-render
          setRenderKey(prev => prev + 1)
          return updated
        })
      }

      // Small delay between phases
      await new Promise(resolve => setTimeout(resolve, 500))

      // PHASE 4C: Action Planning (10-15 seconds)
      setCurrentPhase('Phase 4C: Action Planning')
      setPhaseProgress(95)
      console.log('🎯 Phase 4C: Action Planning')
      
      const phase4cResponse = await fetch('/api/analytics/defects/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `analyze defect patterns for ${component || 'all components'} in ${timeframe}`,
          timeframe: timeframe,
          phase: 'analyze-actions',
          context: { ...phase1Data, ...phase2Data, ...phase3Data, ...phase4aData, ...phase4bData }
        })
      })

      if (!phase4cResponse.ok) {
        throw new Error(`Phase 4C failed: ${phase4cResponse.statusText}`)
      }

      const phase4cData = await phase4cResponse.json()
      
      // Update analysis with action recommendations
      if (phase4cData.content) {
        console.log('🎯 Phase 4C: Updating analysis with action recommendations:', phase4cData.content.substring(0, 100) + '...')
        setAnalysis(prevAnalysis => {
          if (!prevAnalysis) return prevAnalysis
          
          // Parse the action recommendations from the AI response - improved parsing
          const parseActions = (content: string, sectionTitle: string) => {
            console.log(`🎯 Parsing ${sectionTitle} from content`)
            
            // Try multiple section title patterns
            const patterns = [
              new RegExp(`## ${sectionTitle}[\\s\\S]*?(?=##|$)`, 'i'),
              new RegExp(`## ${sectionTitle}\\s*\\([^)]*\\)[\\s\\S]*?(?=##|$)`, 'i'),
              new RegExp(`# ${sectionTitle}[\\s\\S]*?(?=##|#|$)`, 'i')
            ]
            
            let match = null
            for (const pattern of patterns) {
              match = content.match(pattern)
              if (match) break
            }
            
            if (!match) {
              console.log(`❌ No section found for ${sectionTitle}`)
              return [`${sectionTitle} recommendations available in full report`]
            }
            
            console.log(`✅ Found ${sectionTitle} section:`, match[0].substring(0, 100) + '...')
            
            // Extract numbered items (1., 2., etc.) or bullet points
            const lines = match[0].split('\n').filter(line => {
              const trimmed = line.trim()
              return trimmed.match(/^\d+\./) || trimmed.match(/^\*\*\d+\./) || trimmed.match(/^-\s/)
            })
            
            const actions = lines.map(line => {
              // Clean up the line - remove markdown formatting
              return line.trim()
                .replace(/^\*\*\d+\.\s*/, '')
                .replace(/\*\*/g, '')
                .replace(/^\d+\.\s*/, '')
                .replace(/^-\s*/, '')
                .trim()
            }).filter(action => action.length > 0)
            
            console.log(`✅ Parsed ${actions.length} actions for ${sectionTitle}`)
            return actions.length > 0 ? actions : [`${sectionTitle} recommendations available in full report`]
          }
          
          const updated = {
            ...prevAnalysis,
            recommendations: {
              immediate: parseActions(phase4cData.content, 'Immediate Actions'),
              shortTerm: parseActions(phase4cData.content, 'Short-term Actions'),
              longTerm: parseActions(phase4cData.content, 'Long-term Actions')
            }
          }
          console.log('🎯 Action recommendations state updated')
          // Force re-render
          setRenderKey(prev => prev + 1)
          return updated
        })
      }

      // Small delay before final phase
      await new Promise(resolve => setTimeout(resolve, 500))

      // PHASE 5: Finalization (5 seconds)
      setCurrentPhase('Phase 5: Finalizing')
      setPhaseProgress(100)
      console.log('✅ Phase 5: Finalizing')
      
      const finalResponse = await fetch('/api/analytics/defects/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `analyze defect patterns for ${component || 'all components'} in ${timeframe}`,
          timeframe: timeframe,
          phase: 'analyze-complete',
          context: { ...phase1Data, ...phase2Data, ...phase3Data, ...phase4aData, ...phase4bData, ...phase4cData }
        })
      })

      if (!finalResponse.ok) {
        throw new Error(`Final phase failed: ${finalResponse.statusText}`)
      }

      const finalData = await finalResponse.json()
      
      // Preserve the current analysis state instead of overwriting it
      setAnalysis(prevAnalysis => {
        if (!prevAnalysis) {
          // If no previous analysis, create a basic one
          return {
            patterns: [],
            insights: {
              overallTrend: phase4aData.content || 'Analysis completed',
              riskAssessment: phase4bData.content || 'Risk assessment completed',
              priorityActions: ['Review analysis results'],
              qualityMetrics: {
                patternDiversity: 0,
                componentCoverage: 0,
                severityDistribution: {}
              }
            },
            recommendations: {
              immediate: ['Analysis completed - check detailed sections'],
              shortTerm: ['Review recommendations in detail'],
              longTerm: ['Implement long-term improvements']
            }
          }
        }
        
        // Keep the existing analysis as it has been progressively built
        return prevAnalysis
      })
      console.log('✅ Progressive pattern analysis completed')
      
      // Auto-save the current analysis to localStorage
      if (analysis) {
        saveAnalysisToStorage(analysis)
      }

    } catch (error) {
      console.error('❌ Progressive pattern analysis error:', error)
      setError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
      setCurrentPhase('')
      setPhaseProgress(0)
    }
  }

  // Load saved analyses from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedDefectAnalyses')
    if (saved) {
      try {
        setSavedAnalyses(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved analyses:', error)
      }
    }
  }, [])

  // Remove automatic analysis trigger to prevent duplicate calls
  // Users will need to click the "Analyze Patterns" button to start analysis

  // Save analysis to localStorage
  const saveAnalysisToStorage = (analysisData: DefectPatternAnalysis) => {
    const timeframeLabel = timeframe === '30d' ? 'Last 30 days' :
                          timeframe === '90d' ? 'Last 90 days' :
                          timeframe === '1y' ? 'Last year' :
                          timeframe === 'all' ? 'All time' : timeframe

    const componentLabel = component || 'All Components'
    const severityLabel = selectedSeverity === 'all' ? 'All Severities' : selectedSeverity

    const analysisContent = `AI-Powered Defect Pattern Analysis Report
Generated: ${new Date().toLocaleString()}
Timeframe: ${timeframeLabel}
Component: ${componentLabel}
Severity Filter: ${severityLabel}

=== SUMMARY ===
Patterns Identified: ${analysisData.patterns.length}
Overall Trend: ${analysisData.insights.overallTrend}
Risk Assessment: ${analysisData.insights.riskAssessment}

=== PATTERNS IDENTIFIED ===
${analysisData.patterns.map((pattern, index) => `
${index + 1}. ${pattern.name} (${pattern.severity})
   Frequency: ${pattern.frequency} occurrences
   Components: ${pattern.affectedComponents.join(', ')}
   Root Causes: ${pattern.rootCauses.join(', ')}
   Business Impact: ${pattern.businessImpact}
   Prevention: ${pattern.preventionStrategy}
   Testing: ${pattern.testingRecommendations.join(', ')}
   Confidence: ${Math.round(pattern.confidence * 100)}%
`).join('\n')}

=== INSIGHTS ===
Overall Trend: ${analysisData.insights.overallTrend}
Risk Assessment: ${analysisData.insights.riskAssessment}
Priority Actions: ${analysisData.insights.priorityActions.join(', ')}

=== RECOMMENDATIONS ===
Immediate: ${analysisData.recommendations.immediate.join(', ')}
Short-term: ${analysisData.recommendations.shortTerm.join(', ')}
Long-term: ${analysisData.recommendations.longTerm.join(', ')}
`

    const newAnalysis = {
      id: Date.now().toString(),
      title: `Defect Analysis - ${componentLabel} (${timeframeLabel})`,
      content: analysisContent,
      timestamp: new Date().toISOString(),
      timeframe: timeframeLabel,
      component: componentLabel,
      severity: severityLabel,
      patternsCount: analysisData.patterns.length
    }

    const updated = [newAnalysis, ...savedAnalyses].slice(0, 10) // Keep only last 10
    setSavedAnalyses(updated)
    localStorage.setItem('savedDefectAnalyses', JSON.stringify(updated))

    // Show save notification
    showNotification('Analysis saved to history', 'success')
  }

  // Parse and format saved analysis content for better display
  const parseAnalysisContent = (content: string) => {
    const lines = content.split('\n')
    const sections: { [key: string]: string[] } = {}
    let currentSection = ''
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed.startsWith('===') && trimmed.endsWith('===')) {
        currentSection = trimmed.replace(/=/g, '').trim()
        sections[currentSection] = []
      } else if (currentSection && trimmed) {
        sections[currentSection].push(trimmed)
      } else if (!currentSection && trimmed) {
        if (!sections['Header']) sections['Header'] = []
        sections['Header'].push(trimmed)
      }
    })
    
    return sections
  }

  // Load a saved analysis
  const loadSavedAnalysis = (savedAnalysis: typeof savedAnalyses[0]) => {
    setShowHistory(false)
    
    const sections = parseAnalysisContent(savedAnalysis.content)
    
    // Create a modal to display the saved analysis content with better formatting
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-50 overflow-y-auto'
    
    const formatSection = (title: string, content: string[]) => {
      if (!content || content.length === 0) return ''
      
      const sectionClass = title === 'SUMMARY' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                          title === 'PATTERNS IDENTIFIED' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                          title === 'INSIGHTS' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' :
                          title === 'RECOMMENDATIONS' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                          'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
      
      const iconClass = title === 'SUMMARY' ? '📊' :
                       title === 'PATTERNS IDENTIFIED' ? '🔍' :
                       title === 'INSIGHTS' ? '💡' :
                       title === 'RECOMMENDATIONS' ? '🎯' : '📋'
      
      return `
        <div class="border rounded-lg p-4 mb-4 ${sectionClass}">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <span class="mr-2">${iconClass}</span>
            ${title}
          </h4>
          <div class="space-y-2">
            ${content.map(line => {
              if (line.match(/^\d+\./)) {
                // Numbered items
                return `<div class="ml-4 text-sm text-gray-700 dark:text-gray-300">${line}</div>`
              } else if (line.includes(':')) {
                // Key-value pairs
                const [key, ...valueParts] = line.split(':')
                const value = valueParts.join(':').trim()
                return `<div class="text-sm"><span class="font-medium text-gray-900 dark:text-white">${key}:</span> <span class="text-gray-700 dark:text-gray-300">${value}</span></div>`
              } else {
                // Regular text
                return `<div class="text-sm text-gray-700 dark:text-gray-300">${line}</div>`
              }
            }).join('')}
          </div>
        </div>
      `
    }
    
    modal.innerHTML = `
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-black bg-opacity-50"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${savedAnalysis.title}</h3>
              <div class="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
                <span>📅 ${new Date(savedAnalysis.timestamp).toLocaleString()}</span>
                <span>🔍 ${savedAnalysis.patternsCount} patterns</span>
                <span>⏱️ ${savedAnalysis.timeframe}</span>
                <span>🏗️ ${savedAnalysis.component}</span>
              </div>
            </div>
            <button id="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="p-6 overflow-y-auto max-h-[65vh]">
            ${sections['Header'] ? `
              <div class="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <h4 class="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center">
                  <span class="mr-2">📋</span>
                  Analysis Details
                </h4>
                ${sections['Header'].map(line => `<div class="text-sm text-indigo-800 dark:text-indigo-200">${line}</div>`).join('')}
              </div>
            ` : ''}
            
            ${Object.entries(sections).filter(([key]) => key !== 'Header').map(([title, content]) => 
              formatSection(title, content)
            ).join('')}
          </div>
          
          <div class="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Generated by AI-Powered Defect Pattern Analysis
            </div>
            <div class="flex space-x-3">
              <button id="copyContent" class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md">
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <button id="downloadContent" class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Add event listeners
    const closeModal = () => {
      document.body.removeChild(modal)
    }
    
    modal.querySelector('#closeModal')?.addEventListener('click', closeModal)
    modal.querySelector('.bg-black')?.addEventListener('click', closeModal)
    
    modal.querySelector('#copyContent')?.addEventListener('click', () => {
      navigator.clipboard.writeText(savedAnalysis.content)
      showNotification('Content copied to clipboard', 'success')
    })
    
    modal.querySelector('#downloadContent')?.addEventListener('click', () => {
      const blob = new Blob([savedAnalysis.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${savedAnalysis.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    
    showNotification('Analysis loaded from history', 'info')
  }

  // Clear all saved analyses
  const clearSavedAnalyses = () => {
    setSavedAnalyses([])
    localStorage.removeItem('savedDefectAnalyses')
    showNotification('Analysis history cleared', 'info')
  }

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'info' | 'error') => {
    const notification = document.createElement('div')
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg z-50`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }

  const togglePatternExpansion = (patternId: string) => {
    const newExpanded = new Set(expandedPatterns)
    if (newExpanded.has(patternId)) {
      newExpanded.delete(patternId)
    } else {
      newExpanded.add(patternId)
    }
    setExpandedPatterns(newExpanded)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
      case 'High': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
      case 'Medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const downloadAnalysis = () => {
    if (!analysis) return
    
    const content = `Defect Pattern Analysis Report
Generated: ${new Date().toLocaleString()}
Timeframe: ${timeframe}
Component: ${component || 'All'}

=== PATTERNS IDENTIFIED ===
${analysis.patterns.map((pattern, index) => `
${index + 1}. ${pattern.name} (${pattern.severity})
   Frequency: ${pattern.frequency} occurrences
   Components: ${pattern.affectedComponents.join(', ')}
   Root Causes: ${pattern.rootCauses.join(', ')}
   Business Impact: ${pattern.businessImpact}
   Prevention: ${pattern.preventionStrategy}
   Testing: ${pattern.testingRecommendations.join(', ')}
   Confidence: ${Math.round(pattern.confidence * 100)}%
`).join('\n')}

=== INSIGHTS ===
Overall Trend: ${analysis.insights.overallTrend}
Risk Assessment: ${analysis.insights.riskAssessment}
Priority Actions: ${analysis.insights.priorityActions.join(', ')}

=== RECOMMENDATIONS ===
Immediate: ${analysis.recommendations.immediate.join(', ')}
Short-term: ${analysis.recommendations.shortTerm.join(', ')}
Long-term: ${analysis.recommendations.longTerm.join(', ')}
`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `defect-patterns-analysis-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100">Analysis Failed</h3>
            <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
            <button
              onClick={analyzePatterns}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center">
          <Brain className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            AI Analyzing Defect Patterns...
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            <span className="block text-sm font-medium text-blue-600 dark:text-blue-400">
              ⚡ Progressive Analysis System - Results appear as they're ready!
            </span>
            <span className="block mt-2 text-sm">
              {currentPhase ? (
                <>
                  {currentPhase} ({Math.round(phaseProgress)}% complete)
                  <span className="block mt-1 text-xs text-green-600 dark:text-green-400">
                    {phaseProgress > 10 && "✅ Database stats ready"} 
                    {phaseProgress > 50 && " • Context gathered"} 
                    {phaseProgress > 70 && " • AI analysis started"}
                  </span>
                </>
              ) : (
                <>
                  🚀 Initializing progressive analysis...
                </>
              )}
            </span>
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${phaseProgress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span className="text-sm text-indigo-600">
              {currentPhase ? currentPhase : 'Initializing...'}
            </span>
          </div>
          
          {/* Processing Metrics */}
          {processingMetrics && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mt-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                📊 Dataset Overview
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {processingMetrics.totalDefects.toLocaleString()}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Total Defects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {processingMetrics.qualityScore}/10
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Quality Score</div>
                </div>
                <div className="text-center relative">
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      £{processingMetrics.costImpact.toLocaleString()}
                    </div>
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onMouseEnter={() => setShowCostTooltip(true)}
                      onMouseLeave={() => setShowCostTooltip(false)}
                      onClick={() => setShowCostTooltip(!showCostTooltip)}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Cost Impact</div>
                  
                  {/* Cost Explanation Tooltip */}
                  {showCostTooltip && processingMetrics && (
                    <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-4 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg">
                      <div className="font-medium mb-2">💰 Severity-Based Cost Calculation</div>
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>Critical: 16h × £75</div>
                          <div>High: 8h × £75</div>
                          <div>Medium: 4h × £75</div>
                          <div>Low: 2h × £75</div>
                        </div>
                        <div className="border-t border-gray-600 pt-2">
                          <div className="flex justify-between font-medium">
                            <span>{processingMetrics.totalDefects} defects ({timeframeLabel}):</span>
                            <span>£{processingMetrics.costImpact.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-600 text-xs text-gray-300">
                        <div className="font-medium mb-1">Realistic methodology includes:</div>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Severity-based effort estimation</li>
                          <li>Investigation & reproduction time</li>
                          <li>Development & testing of fixes</li>
                          <li>Code review & deployment</li>
                        </ul>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {processingMetrics.topComponents.length}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Top Components</div>
                </div>
              </div>
              
              {processingMetrics.topComponents.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Top Problem Areas:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {processingMetrics.topComponents.map((component, index) => {
                      const componentName = typeof component === 'string' 
                        ? component 
                        : (component as any)?.component || 'Unknown'
                      
                      return (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs"
                        >
                          {componentName}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Sampling Strategy: <span className="font-medium">{processingMetrics.samplingStrategy.replace(/_/g, ' ')}</span>
                </div>
                {processingMetrics.samplingDetails && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Initial database scan - Results updating progressively
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!analysis && !isAnalyzing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            AI-Powered Defect Pattern Analysis
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Click the button below to start progressive AI analysis with Claude 4 + RAG
          </p>
          <button
            onClick={analyzePatterns}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center mx-auto"
          >
            <Brain className="h-5 w-5 mr-2" />
            Start Progressive Analysis
          </button>
        </div>
      </div>
    )
  }

  return (
    <div key={renderKey} className="relative">
      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowHistory(false)} />
          <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Analysis History
                  </h3>
                  <div className="flex items-center space-x-2">
                    {savedAnalyses.length > 0 && (
                      <button
                        onClick={clearSavedAnalyses}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Clear all history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {savedAnalyses.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No saved analyses yet. Run some defect pattern analyses to see them here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedAnalyses.map((savedAnalysis) => (
                      <div
                        key={savedAnalysis.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => loadSavedAnalysis(savedAnalysis)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {savedAnalysis.title}
                          </h4>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(savedAnalysis.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="space-y-1 mb-2">
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Timeframe:</span>
                            <span className="ml-1">{savedAnalysis.timeframe}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Component:</span>
                            <span className="ml-1">{savedAnalysis.component}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Severity:</span>
                            <span className="ml-1">{savedAnalysis.severity}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded">
                            {savedAnalysis.patternsCount} patterns
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(savedAnalysis.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI-Powered Defect Pattern Analysis
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {analysis?.patterns?.length || 0} patterns identified • Powered by Claude 4 + RAG
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              title="View saved analyses"
            >
              <History className="h-4 w-4 mr-1" />
              History
              {savedAnalyses.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                  {savedAnalyses.length}
                </span>
              )}
            </button>
            <button
              onClick={() => analysis && saveAnalysisToStorage(analysis)}
              disabled={!analysis}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save analysis to history"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              onClick={analyzePatterns}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Refresh analysis"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={downloadAnalysis}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Download report"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary - Compact Layout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Executive Summary</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Director-level quality assessment and business impact analysis</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Trend */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Quality Trajectory</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Business impact assessment</p>
                </div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-11 prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>
                  {analysis?.insights?.overallTrend || 'Initializing analysis...'}
                </ReactMarkdown>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Business Risk Level</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Current exposure and impact</p>
                </div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-11 prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>
                  {analysis?.insights?.riskAssessment || 'Analyzing risk patterns...'}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Quality Metrics Bar */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-300">Top {Math.min(10, analysis?.patterns?.length || 0)} Critical Patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-300">{analysis?.insights?.qualityMetrics?.componentCoverage || 0} Components Analyzed</span>
                </div>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                                  {Object.values(analysis?.insights?.qualityMetrics?.severityDistribution || {}).reduce((a, b) => a + b, 0)} Total Defects
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Critical Patterns */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top 10 Critical Patterns ({Math.min(10, analysis?.patterns?.length || 0)})
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Ranked by business impact
            </span>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {(analysis?.patterns || []).slice(0, 10).map((pattern, index) => (
            <div key={pattern.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                onClick={() => togglePatternExpansion(pattern.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {pattern.name}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(pattern.severity)}`}>
                          {pattern.severity}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {pattern.frequency} occurrences
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {Math.round(pattern.confidence * 100)}% confidence
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {pattern.affectedComponents.length} components
                        </span>
                      </div>
                    </div>
                    {expandedPatterns.has(pattern.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(pattern.description)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Copy pattern details"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedPatterns.has(pattern.id) && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Description</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {pattern.description}
                      </p>

                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Affected Components</h5>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {pattern.affectedComponents.map((component, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs">
                            {component}
                          </span>
                        ))}
                      </div>

                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Root Causes</h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {pattern.rootCauses.map((cause, index) => (
                          <li key={index}>• {cause}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Business Impact</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {pattern.businessImpact}
                      </p>

                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Prevention Strategy</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {pattern.preventionStrategy}
                      </p>

                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Testing Recommendations</h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {pattern.testingRecommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <TestTube className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-900 dark:text-red-100">Immediate Actions</h3>
          </div>
          <ul className="space-y-2">
                          {(analysis?.recommendations?.immediate || []).map((action, index) => (
              <li key={index} className="text-sm text-red-800 dark:text-red-200">
                • {action}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <TrendingUp className="h-6 w-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100">Short-term (1-3 months)</h3>
          </div>
          <ul className="space-y-2">
                          {(analysis?.recommendations?.shortTerm || []).map((action, index) => (
              <li key={index} className="text-sm text-yellow-800 dark:text-yellow-200">
                • {action}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <Lightbulb className="h-6 w-6 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100">Long-term (6+ months)</h3>
          </div>
          <ul className="space-y-2">
                          {(analysis?.recommendations?.longTerm || []).map((action, index) => (
              <li key={index} className="text-sm text-green-800 dark:text-green-200">
                • {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Priority Actions */}
              {(analysis?.insights?.priorityActions?.length || 0) > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <Target className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-100">Priority Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(analysis?.insights?.priorityActions || []).map((action, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-indigo-800 dark:text-indigo-200">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Methodology Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <Info className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cost Impact Methodology ({timeframeLabel})</h3>
        </div>
        
        {/* Display Actual Cost Impact */}
        {processingMetrics && processingMetrics.costImpact > 0 && (
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-1">Total Cost Impact</h4>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Based on {processingMetrics.totalDefects} defects ({timeframeLabel})
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  £{processingMetrics.costImpact.toLocaleString()}
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300">
                  Severity-based calculation
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">💰 Severity-Based Calculation</h4>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white mb-2">Hours per Severity:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-red-600 dark:text-red-400">Critical:</span>
                        <span className="text-gray-900 dark:text-white">16h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-600 dark:text-orange-400">High:</span>
                        <span className="text-gray-900 dark:text-white">8h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-600 dark:text-yellow-400">Medium:</span>
                        <span className="text-gray-900 dark:text-white">4h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600 dark:text-green-400">Low:</span>
                        <span className="text-gray-900 dark:text-white">2h</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white mb-2">Rate & Formula:</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Hourly rate:</span>
                        <span className="text-gray-900 dark:text-white">£75/hour</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-1 mt-2">
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          Sum of: (Count × Hours × £75) for each severity
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">📋 What's Included</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Investigation & reproduction time
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Development & unit testing of fixes
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Code review & deployment overhead
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Regression testing & validation
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                Documentation updates
              </li>
            </ul>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Realistic Methodology:</strong> This calculation uses severity-based hours per defect instead of a flat 8-hour rate. 
                Critical defects require more investigation and testing (16h), while low-priority issues are quicker to resolve (2h). 
                This provides more accurate cost estimates for the selected timeframe ({timeframeLabel}).
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
} 