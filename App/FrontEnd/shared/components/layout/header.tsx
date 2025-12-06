'use client'

import * as React from 'react'
import { Search, Bell, User } from 'lucide-react'
import { SidebarTrigger } from './sidebar'
import { cn } from '@/shared/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
  title?: string
}

export function Header({ onMenuClick, title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      {/* Menu trigger */}
      <SidebarTrigger onClick={onMenuClick} />

      {/* Page title */}
      {title && (
        <h1 className="text-lg font-semibold hidden sm:block">{title}</h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search businesses..."
          className={cn(
            'h-9 w-64 rounded-lg border border-border bg-transparent pl-9 pr-3 text-sm',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'transition-all duration-200 focus:w-80'
          )}
        />
      </div>

      {/* Notifications */}
      <button
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-violet-500" />
      </button>

      {/* User menu */}
      <button
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="User menu"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      </button>
    </header>
  )
}
