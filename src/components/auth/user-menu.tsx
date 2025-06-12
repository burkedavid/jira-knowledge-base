'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { User, LogOut, Settings, ChevronDown, Brain, DollarSign } from 'lucide-react'

export default function UserMenu() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (!session?.user) {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium">{session.user.name || session.user.email}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{session.user.role}</div>
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {session.user.name || 'User'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate break-all">
                {session.user.email}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 capitalize mt-2">
                {session.user.role} Account
              </div>
            </div>
            
            <div className="py-1">
              <a
                href="/ai-prompts"
                onClick={() => setIsOpen(false)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Brain className="w-4 h-4 mr-3" />
                AI Prompts
              </a>
              
              {/* Admin-only features */}
              {session.user.role === 'admin' && (
                <>
                  <a
                    href="/ai-audit"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <DollarSign className="w-4 h-4 mr-3" />
                    AI Cost Audit
                  </a>
                  
                  <a
                    href="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </a>
                </>
              )}
              
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 