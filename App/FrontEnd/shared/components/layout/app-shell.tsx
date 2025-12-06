'use client'

import * as React from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { AuthGuard } from '@/features/auth'

interface AppShellProps {
  children: React.ReactNode
  title?: string
  /** Set to true to skip auth protection (for public pages) */
  public?: boolean
}

export function AppShell({ children, title, public: isPublic }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const shell = (
    <div className="min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
      <main className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )

  // Skip auth guard for public pages
  if (isPublic) {
    return shell
  }

  return <AuthGuard>{shell}</AuthGuard>
}
