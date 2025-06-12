'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface EmbeddingTest {
  text1: string
  text2: string
  expectedSimilarity: string
}

export default function TestEmbeddingsPage() {
  const [loading, setLoading] = useState(false)
  const [text1, setText1] = useState('User wants to login to the system')
  const [text2, setText2] = useState('Authentication and user access')
  const [result, setResult] = useState<any>(null)

  const testSuggestions: EmbeddingTest[] = [
    {
      text1: "User wants to login to the system",
      text2: "Authentication and user access",
      expectedSimilarity: "High - both about login/authentication"
    },
    {
      text1: "Payment processing failed",
      text2: "Transaction error occurred", 
      expectedSimilarity: "High - both about payment issues"
    },
    {
      text1: "User interface is slow",
      text2: "Database connection timeout",
      expectedSimilarity: "Medium - both about performance but different causes"
    },
    {
      text1: "Create new user account",
      text2: "Delete user profile",
      expectedSimilarity: "Medium - both about user management but opposite actions"
    }
  ]

  const testEmbeddings = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text1, text2 })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error testing embeddings:', error)
      setResult({
        success: false,
        error: 'Failed to test embeddings'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSuggestion = (suggestion: EmbeddingTest) => {
    setText1(suggestion.text1)
    setText2(suggestion.text2)
  }

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
              AWS Titan Embeddings Test
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Test Semantic Similarity
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Test AWS Titan embeddings to see how well they understand semantic similarity.
            </p>
          </div>

          <div className="space-y-6">
            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text 1
                </label>
                <textarea
                  value={text1}
                  onChange={(e) => setText1(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text 2
                </label>
                <textarea
                  value={text2}
                  onChange={(e) => setText2(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Test Button */}
            <button
              onClick={testEmbeddings}
              disabled={loading || !text1.trim()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Semantic Similarity'
              )}
            </button>

            {/* Results */}
            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <>
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Embeddings generated successfully!</span>
                    </div>

                    {result.results.similarity && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Similarity Score</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          <p><strong>Score:</strong> {result.results.similarity.score.toFixed(4)}</p>
                          <p><strong>Interpretation:</strong> {result.results.similarity.interpretation}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Error: {result.error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Test Suggestions */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Test Suggestions</h3>
              <div className="grid grid-cols-1 gap-3">
                {testSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Test Case {index + 1}
                      </span>
                      <button
                        onClick={() => loadSuggestion(suggestion)}
                        className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Load
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <p><strong>Text 1:</strong> "{suggestion.text1}"</p>
                      <p><strong>Text 2:</strong> "{suggestion.text2}"</p>
                      <p><strong>Expected:</strong> {suggestion.expectedSimilarity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 