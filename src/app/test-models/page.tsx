'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ClaudeModel {
  modelId: string
  modelName: string
  providerName: string
  inputModalities: string[]
  outputModalities: string[]
  responseStreamingSupported: boolean
}

interface ModelTestResult {
  success: boolean
  totalModels: number
  claudeModels: ClaudeModel[]
  recommendedModel: string | null
  error?: string
}

export default function TestModelsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ModelTestResult | null>(null)
  const [testingModel, setTestingModel] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const checkModels = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test/claude-models')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error checking models:', error)
      setResult({
        success: false,
        totalModels: 0,
        claudeModels: [],
        recommendedModel: null,
        error: 'Failed to fetch models'
      })
    } finally {
      setLoading(false)
    }
  }

  const testModel = async (modelId: string) => {
    setTestingModel(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/generate/test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userStory: 'As a user, I want to login to the system so that I can access my account.',
          testTypes: ['positive'],
          modelId: modelId // Pass the specific model to test
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult(`✅ Model ${modelId} working! Generated ${data.testCases?.length || 0} test cases.`)
      } else {
        const error = await response.json()
        setTestResult(`❌ Model ${modelId} failed: ${error.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Model ${modelId} error: ${error}`)
    } finally {
      setTestingModel(false)
    }
  }

  useEffect(() => {
    checkModels()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/"
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Claude Model Test
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Available Claude Models
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Check which Claude models are available in your AWS Bedrock account and test the latest one.
            </p>
          </div>

          <div className="space-y-6">
            <button
              onClick={checkModels}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking Models...
                </>
              ) : (
                'Check Available Models'
              )}
            </button>

            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <>
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Found {result.claudeModels.length} Claude models out of {result.totalModels} total models</span>
                    </div>

                    {result.recommendedModel && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Recommended Latest Model
                        </h3>
                        <p className="text-blue-800 dark:text-blue-200 font-mono text-sm mb-3">
                          {result.recommendedModel}
                        </p>
                        <button
                          onClick={() => testModel(result.recommendedModel!)}
                          disabled={testingModel}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {testingModel ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            'Test This Model'
                          )}
                        </button>
                      </div>
                    )}

                    {testResult && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                        <p className="text-sm text-gray-900 dark:text-gray-100">{testResult}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-white">All Claude Models</h3>
                      {result.claudeModels.map((model, index) => (
                        <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {model.modelName || 'Unnamed Model'}
                            </h4>
                            <button
                              onClick={() => testModel(model.modelId)}
                              disabled={testingModel}
                              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                            >
                              Test
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 font-mono mb-2">
                            {model.modelId}
                          </p>
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <p>Provider: {model.providerName}</p>
                            <p>Input: {model.inputModalities?.join(', ') || 'N/A'}</p>
                            <p>Output: {model.outputModalities?.join(', ') || 'N/A'}</p>
                            <p>Streaming: {model.responseStreamingSupported ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Error: {result.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 