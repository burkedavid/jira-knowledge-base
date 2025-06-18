'use client'

import { useState, useEffect } from 'react'
import { Brain, Sparkles, Zap } from 'lucide-react'
import UserMenu from '@/components/auth/user-menu'
import Link from 'next/link'

interface ProductContext {
  productName: string
  description: string
  industry: string
  userTypes: string[]
  keyFeatures: string[]
  securityStandards: string[]
  qualityThreshold?: number
}

export default function AIHeader() {
  const [productContext, setProductContext] = useState<ProductContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProductContext = async () => {
    try {
      const response = await fetch('/api/settings/product-context')
      if (response.ok) {
        const context = await response.json()
        setProductContext(context)
      }
    } catch (error) {
      console.error('Failed to load product context:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProductContext()
    
    // Listen for product context updates from settings page
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'productContextUpdated') {
        loadProductContext()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Custom event listener for same-tab updates
    const handleCustomUpdate = () => {
      loadProductContext()
    }
    
    window.addEventListener('productContextUpdated', handleCustomUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('productContextUpdated', handleCustomUpdate)
    }
  }, [])

  return (
    <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/20 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-ping"></div>
        <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-purple-400/40 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-pink-400/30 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-cyan-400/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            {/* AI Logo with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Product Name and AI Badge */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-3">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    {productContext?.productName || 'RAG Knowledge Base'}
                  </h1>
                )}
                
                {/* AI Powered Badge */}
                <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-3 py-1">
                  <Sparkles className="h-3 w-3 text-blue-300" />
                  <span className="text-xs font-medium text-blue-200">AI Powered</span>
                  <Zap className="h-3 w-3 text-purple-300" />
                </div>
              </div>
              
              {/* Industry subtitle */}
              {productContext?.industry && (
                <p className="text-sm text-blue-200/80 font-medium mt-1">
                  {productContext.industry} Intelligence Platform
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {/* Claude 4 Badge */}
            <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-200">Claude Sonnet 4</span>
            </div>



            {/* User Menu */}
            <UserMenu />
          </nav>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>
    </header>
  )
} 