import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthSessionProvider from '@/components/providers/session-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RAG Knowledge Base - Testing & Requirements Platform',
  description: 'AI-powered platform for generating test cases and analyzing requirements using RAG technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  )
} 