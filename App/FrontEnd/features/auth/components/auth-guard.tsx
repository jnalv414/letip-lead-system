'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../hooks/use-auth'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Protects routes that require authentication.
 * Redirects to /login if user is not authenticated.
 * Redirects to /change-password if user must change their password.
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Track when component is mounted (client-side)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (mustChangePassword && pathname !== '/change-password') {
      router.push('/change-password')
    }
  }, [mounted, isLoading, isAuthenticated, mustChangePassword, pathname, router])

  // During SSR and initial hydration, render a consistent loading state
  if (!mounted || isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </div>
      )
    )
  }

  // Don't render children if not authenticated (while redirecting)
  if (!isAuthenticated) {
    return null
  }

  // Don't render children if password change is required (while redirecting)
  if (mustChangePassword && pathname !== '/change-password') {
    return null
  }

  return <>{children}</>
}
