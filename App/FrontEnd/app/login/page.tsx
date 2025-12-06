'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm, useAuth } from '@/features/auth'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Don't render form if authenticated (while redirecting)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Le Tip Lead System</h1>
          <p className="text-muted-foreground mt-2">
            Lead generation and enrichment platform
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
