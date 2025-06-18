'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AIHeader from './ai-header'

interface ActionButton {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
  loading?: boolean
}

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  showBackButton?: boolean
  backUrl?: string
  backLabel?: string
  className?: string
  actionButtons?: ActionButton[]
  showAIHeader?: boolean
}

export default function PageLayout({ 
  children, 
  title, 
  subtitle, 
  icon, 
  showBackButton = true, 
  backUrl = '/',
  backLabel = 'Back to Home',
  className = "min-h-screen bg-gray-50 dark:bg-gray-900",
  actionButtons = [],
  showAIHeader = true
}: PageLayoutProps) {
  const router = useRouter()

  const getButtonClasses = (variant: ActionButton['variant'] = 'secondary') => {
    const baseClasses = "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`
      case 'outline':
        return `${baseClasses} text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700`
      default: // secondary
        return `${baseClasses} text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600`
    }
  }

  return (
    <div className={className}>
      {/* AI Header */}
      {showAIHeader && <AIHeader />}
      
      {/* Page Header/Breadcrumb Section */}
      {(title || showBackButton || actionButtons.length > 0) && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left side - Back button */}
              {showBackButton && (
                <button
                  onClick={() => router.push(backUrl)}
                  className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {backLabel}
                </button>
              )}
              
              {/* Center - Title */}
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  {icon && <span className="mr-3">{icon}</span>}
                  {title}
                </h1>
              )}
              
              {/* Right side - Action buttons */}
              {actionButtons.length > 0 && (
                <div className="flex items-center space-x-3">
                  {actionButtons.map((button, index) => (
                    <button
                      key={index}
                      onClick={button.onClick}
                      disabled={button.disabled || button.loading}
                      className={getButtonClasses(button.variant)}
                    >
                      {button.loading ? (
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                      ) : (
                        button.icon && <span className="mr-2">{button.icon}</span>
                      )}
                      {button.label}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Handle layout when no title but has back button and actions */}
              {!title && showBackButton && actionButtons.length > 0 && (
                <div className="flex-1"></div>
              )}
            </div>
            
            {/* Subtitle */}
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