import { prisma } from './prisma'
import { generateChatCompletion } from './claude'
import { vectorSearch } from './vector-db'

export interface DefectAnalysis {
  patterns: DefectPattern[]
  hotspots: ComponentHotspot[]
  trends: DefectTrend[]
  riskAssessment: RiskAssessment
}

export interface DefectPattern {
  id: string
  name: string
  description: string
  frequency: number
  severity: string
  component?: string
  rootCause?: string
  affectedDefects: string[]
}

export interface ComponentHotspot {
  component: string
  defectCount: number
  severityDistribution: Record<string, number>
  riskScore: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface DefectTrend {
  period: string
  defectCount: number
  resolvedCount: number
  avgResolutionTime: number
  topComponents: string[]
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: string[]
  recommendations: string[]
  predictedDefects: number
}

export interface QualityScore {
  score: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: string[]
  suggestions: string[]
  confidence: number
}

export class AnalyticsEngine {
  async analyzeDefectPatterns(): Promise<DefectAnalysis> {
    const defects = await prisma.defect.findMany()

    const patterns = await this.identifyDefectPatterns(defects)
    const hotspots = await this.identifyComponentHotspots(defects)
    const trends = await this.analyzeDefectTrends(defects)
    const riskAssessment = await this.assessOverallRisk(defects, patterns, hotspots)

    return {
      patterns,
      hotspots,
      trends,
      riskAssessment,
    }
  }

  private async identifyDefectPatterns(defects: any[]): Promise<DefectPattern[]> {
    // Group defects by component and root cause
    const componentGroups = defects.reduce((acc: Record<string, any[]>, defect) => {
      const key = `${defect.component || 'unknown'}_${defect.rootCause || 'unknown'}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(defect)
      return acc
    }, {})

    const patterns: DefectPattern[] = []

    for (const [key, groupDefects] of Object.entries(componentGroups)) {
      if (groupDefects.length >= 3) { // Minimum threshold for a pattern
        const [component, rootCause] = key.split('_')
        
        // Use AI to analyze the pattern
        const patternDescription = await this.generatePatternDescription(groupDefects)
        
        patterns.push({
          id: `pattern_${key}`,
          name: `${component} - ${rootCause} Pattern`,
          description: patternDescription,
          frequency: groupDefects.length,
          severity: this.calculateAverageSeverity(groupDefects),
          component: component !== 'unknown' ? component : undefined,
          rootCause: rootCause !== 'unknown' ? rootCause : undefined,
          affectedDefects: groupDefects.map(d => d.id),
        })
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency)
  }

  private async generatePatternDescription(defects: any[]): Promise<string> {
    const defectSummaries = defects.slice(0, 5).map(d => 
      `Title: ${d.title}\nDescription: ${d.description?.substring(0, 200) || 'N/A'}`
    ).join('\n\n')

    const prompt = `Analyze these related defects and identify the common pattern:

${defectSummaries}

Provide a concise description of the pattern, including:
1. What type of issues these are
2. Common characteristics
3. Potential root cause
4. Impact on the system

Keep the response under 200 words.`

    try {
      return await generateChatCompletion([
        { role: 'user', content: 'You are a software quality analyst specializing in defect pattern recognition.\n\n' + prompt }
      ])
    } catch (error) {
      console.error('Error generating pattern description:', error)
      return 'Pattern analysis unavailable'
    }
  }

  private calculateAverageSeverity(defects: any[]): string {
    const severityWeights = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
    const totalWeight = defects.reduce((sum: number, defect) => {
      return sum + (severityWeights[defect.severity as keyof typeof severityWeights] || 1)
    }, 0)
    
    const avgWeight = totalWeight / defects.length
    
    if (avgWeight >= 3.5) return 'Critical'
    if (avgWeight >= 2.5) return 'High'
    if (avgWeight >= 1.5) return 'Medium'
    return 'Low'
  }

  private async identifyComponentHotspots(defects: any[]): Promise<ComponentHotspot[]> {
    const componentStats = defects.reduce((acc, defect) => {
      const component = defect.component || 'Unknown'
      if (!acc[component]) {
        acc[component] = {
          defects: [],
          severityDistribution: { Critical: 0, High: 0, Medium: 0, Low: 0 },
        }
      }
      acc[component].defects.push(defect)
      acc[component].severityDistribution[defect.severity || 'Low']++
      return acc
    }, {} as Record<string, any>)

    const hotspots: ComponentHotspot[] = []

    for (const [component, stats] of Object.entries(componentStats)) {
      const riskScore = this.calculateComponentRiskScore((stats as any).defects, (stats as any).severityDistribution)
      const trend = await this.calculateComponentTrend(component, (stats as any).defects)

      hotspots.push({
        component,
        defectCount: (stats as any).defects.length,
        severityDistribution: (stats as any).severityDistribution,
        riskScore,
        trend,
      })
    }

    return hotspots.sort((a, b) => b.riskScore - a.riskScore)
  }

  private calculateComponentRiskScore(defects: any[], severityDistribution: Record<string, number>): number {
    const severityWeights = { Critical: 10, High: 5, Medium: 2, Low: 1 }
    const weightedScore = Object.entries(severityDistribution).reduce((sum, [severity, count]) => {
      return sum + (count * (severityWeights[severity as keyof typeof severityWeights] || 1))
    }, 0)

    // Normalize to 0-100 scale
    return Math.min(100, (weightedScore / defects.length) * 10)
  }

  private async calculateComponentTrend(component: string, defects: any[]): Promise<'increasing' | 'decreasing' | 'stable'> {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const recentDefects = defects.filter(d => new Date(d.createdAt) > thirtyDaysAgo).length
    const olderDefects = defects.filter(d => 
      new Date(d.createdAt) > sixtyDaysAgo && new Date(d.createdAt) <= thirtyDaysAgo
    ).length

    if (recentDefects > olderDefects * 1.2) return 'increasing'
    if (recentDefects < olderDefects * 0.8) return 'decreasing'
    return 'stable'
  }

  private async analyzeDefectTrends(defects: any[]): Promise<DefectTrend[]> {
    const trends: DefectTrend[] = []
    const periods = ['last_7_days', 'last_30_days', 'last_90_days']

    for (const period of periods) {
      const periodDefects = this.getDefectsForPeriod(defects, period)
      const resolvedDefects = periodDefects.filter(d => d.status === 'Resolved' || d.status === 'Closed')
      
      const avgResolutionTime = this.calculateAverageResolutionTime(resolvedDefects)
      const topComponents = this.getTopComponents(periodDefects, 5)

      trends.push({
        period,
        defectCount: periodDefects.length,
        resolvedCount: resolvedDefects.length,
        avgResolutionTime,
        topComponents,
      })
    }

    return trends
  }

  private getDefectsForPeriod(defects: any[], period: string): any[] {
    const now = new Date()
    let cutoffDate: Date

    switch (period) {
      case 'last_7_days':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last_30_days':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last_90_days':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        cutoffDate = new Date(0)
    }

    return defects.filter(d => new Date(d.createdAt) > cutoffDate)
  }

  private calculateAverageResolutionTime(resolvedDefects: any[]): number {
    if (resolvedDefects.length === 0) return 0

    const totalTime = resolvedDefects.reduce((sum, defect) => {
      if (defect.resolvedAt) {
        const resolutionTime = new Date(defect.resolvedAt).getTime() - new Date(defect.createdAt).getTime()
        return sum + resolutionTime
      }
      return sum
    }, 0)

    return totalTime / resolvedDefects.length / (1000 * 60 * 60 * 24) // Convert to days
  }

  private getTopComponents(defects: any[], limit: number): string[] {
    const componentCounts = defects.reduce((acc, defect) => {
      const component = defect.component || 'Unknown'
      acc[component] = (acc[component] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(componentCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([component]) => component)
  }

  private async assessOverallRisk(
    defects: any[],
    patterns: DefectPattern[],
    hotspots: ComponentHotspot[]
  ): Promise<RiskAssessment> {
    const criticalDefects = defects.filter(d => d.severity === 'Critical').length
    const highSeverityPatterns = patterns.filter(p => p.severity === 'Critical' || p.severity === 'High').length
    const highRiskComponents = hotspots.filter(h => h.riskScore > 70).length

    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low'
    const riskFactors: string[] = []
    const recommendations: string[] = []

    if (criticalDefects > 10 || highRiskComponents > 3) {
      overallRisk = 'critical'
      riskFactors.push('High number of critical defects')
      recommendations.push('Immediate attention required for critical components')
    } else if (criticalDefects > 5 || highSeverityPatterns > 2) {
      overallRisk = 'high'
      riskFactors.push('Multiple high-severity patterns identified')
      recommendations.push('Focus on addressing recurring defect patterns')
    } else if (criticalDefects > 2 || highRiskComponents > 1) {
      overallRisk = 'medium'
      riskFactors.push('Some concerning trends identified')
      recommendations.push('Monitor high-risk components closely')
    }

    // Predict future defects based on trends
    const predictedDefects = this.predictFutureDefects(defects, patterns)

    return {
      overallRisk,
      riskFactors,
      recommendations,
      predictedDefects,
    }
  }

  private predictFutureDefects(defects: any[], patterns: DefectPattern[]): number {
    // Simple prediction based on recent trends
    const recentDefects = this.getDefectsForPeriod(defects, 'last_30_days')
    const avgDefectsPerDay = recentDefects.length / 30
    
    // Factor in pattern frequency
    const patternMultiplier = patterns.reduce((sum, pattern) => sum + pattern.frequency, 0) / patterns.length || 1
    
    return Math.round(avgDefectsPerDay * 30 * (patternMultiplier / 10))
  }

  async assessUserStoryQuality(userStoryId: string): Promise<QualityScore> {
    const userStory = await prisma.userStory.findUnique({
      where: { id: userStoryId },
    })

    if (!userStory) {
      throw new Error('User story not found')
    }

    // Find similar defects using vector search
    const similarDefects = await vectorSearch(
      `${userStory.title} ${userStory.description}`,
      ['defect'],
      10,
      0.6
    )

    // Analyze the user story content
    const contentAnalysis = await this.analyzeUserStoryContent(userStory)
    
    // Calculate risk based on similar defects and content quality
    const riskScore = this.calculateUserStoryRiskScore(similarDefects, contentAnalysis)
    
    const qualityScore: QualityScore = {
      score: Math.max(0, 100 - riskScore),
      riskLevel: this.getRiskLevel(riskScore),
      riskFactors: contentAnalysis.riskFactors,
      suggestions: contentAnalysis.suggestions,
      confidence: contentAnalysis.confidence,
    }

    // Store the quality score
    await prisma.qualityScore.create({
      data: {
        userStoryId,
        score: qualityScore.score,
        riskFactors: JSON.stringify(qualityScore.riskFactors),
        suggestions: JSON.stringify(qualityScore.suggestions),
      },
    })

    return qualityScore
  }

  private async analyzeUserStoryContent(userStory: any): Promise<{
    riskFactors: string[]
    suggestions: string[]
    confidence: number
  }> {
    const prompt = `Analyze this user story for quality and potential risks:

Title: ${userStory.title}
Description: ${userStory.description}
Acceptance Criteria: ${userStory.acceptanceCriteria || 'Not provided'}

Identify:
1. Quality issues (vague requirements, missing details, etc.)
2. Potential risk factors
3. Suggestions for improvement

Respond in JSON format:
{
  "riskFactors": ["factor1", "factor2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "confidence": 0.8
}`

    try {
          const response = await generateChatCompletion([
      { role: 'user', content: 'You are a business analyst expert in requirements quality assessment.\n\n' + prompt }
    ])

      const analysis = JSON.parse(response)
      return {
        riskFactors: analysis.riskFactors || [],
        suggestions: analysis.suggestions || [],
        confidence: analysis.confidence || 0.5,
      }
    } catch (error) {
      console.error('Error analyzing user story content:', error)
      return {
        riskFactors: ['Analysis unavailable'],
        suggestions: ['Manual review recommended'],
        confidence: 0.1,
      }
    }
  }

  private calculateUserStoryRiskScore(similarDefects: any[], contentAnalysis: any): number {
    let riskScore = 0

    // Risk from similar defects
    riskScore += similarDefects.length * 5

    // Risk from content analysis
    riskScore += contentAnalysis.riskFactors.length * 10

    // Adjust based on confidence
    riskScore *= contentAnalysis.confidence

    return Math.min(100, riskScore)
  }

  private getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical'
    if (riskScore >= 60) return 'high'
    if (riskScore >= 40) return 'medium'
    return 'low'
  }
} 