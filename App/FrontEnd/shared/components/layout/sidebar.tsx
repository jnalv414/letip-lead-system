'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Search,
  Sparkles,
  MessageSquare,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const navItems: Array<{ href: string; label: string; icon: React.ElementType }> = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/enrichment', label: 'Enrichment', icon: Sparkles },
  { href: '/outreach', label: 'Outreach', icon: MessageSquare },
]

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname()

  // Close on route change
  React.useEffect(() => {
    onOpenChange(false)
  }, [pathname, onOpenChange])

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Sidebar Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed left-0 top-0 z-50 h-full w-72 bg-card border-r border-border shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">Le Tip</h1>
                  <p className="text-xs text-muted-foreground">Lead System</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-1">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-violet-500/20 to-blue-500/20 text-foreground shadow-lg shadow-violet-500/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <Icon className={cn('h-5 w-5', isActive && 'text-violet-400')} />
                      </motion.div>
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="ml-auto h-2 w-2 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50"
                        />
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <Link
                href={'/settings' as string}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              <p className="mt-4 text-xs text-center text-muted-foreground/60">
                Lead System v1.0
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-muted transition-colors"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
