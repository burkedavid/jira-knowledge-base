'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AIHeader from './ai-header'

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  showBackButton?: boolean
  backUrl?: string
  className?: string
}

export default function PageLayout({ 
  children, 
  title, 
  subtitle, 
  icon, 
  showBackButton = true, 
  backUrl = '/',
  className = "min-h-screen bg-gray-50 dark:bg-gray-900"
}: PageLayoutProps) {
  const router = useRouter()

  return (
    <div className={className}>
      {/* AI Header */}
      <AIHeader />
      
      {/* Breadcrumb/Title Section */}
      {(title || showBackButton) && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {showBackButton && (
                <button
                  onClick={() => router.push(backUrl)}
                  className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </button>
              )}
              
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  {icon}
                  {title}
                </h1>
              )}
            </div>
            
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {children}
    </div>
  )
} 