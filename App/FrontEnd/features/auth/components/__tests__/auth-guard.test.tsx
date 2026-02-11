/**
 * TDD RED Tests: Frontend AuthGuard - Role-Based Rendering
 *
 * These tests define the EXPECTED go-live behavior for:
 * 1. AuthGuard redirects unauthenticated users to /login
 * 2. AuthGuard shows loading state during auth check
 * 3. AuthGuard renders children for authenticated users
 * 4. Role-aware AuthGuard restricts by role (NEW - go-live feature)
 *
 * STATUS: RED - The current AuthGuard only checks authentication.
 * Go-live requires role-based access control in the frontend.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock the auth hook
const mockUseAuth = vi.fn()
vi.mock('../../hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Import after mocking
import { AuthGuard } from '../auth-guard'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================
  // Loading State
  // ============================================================
  describe('Loading State', () => {
    it('should show loading spinner while auth is being checked', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
      })

      renderWithProviders(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should render custom fallback during loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
      })

      renderWithProviders(
        <AuthGuard fallback={<div>Custom Loading...</div>}>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument()
    })
  })

  // ============================================================
  // Authenticated Access
  // ============================================================
  describe('Authenticated Access', () => {
    it('should render children when user is authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' },
        isLoading: false,
        isAuthenticated: true,
      })

      renderWithProviders(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })
  })

  // ============================================================
  // Unauthenticated Redirect
  // ============================================================
  describe('Unauthenticated Redirect', () => {
    it('should not render children when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })

      renderWithProviders(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
      })
    })
  })

  // ============================================================
  // Role-Based Access (Go-Live Feature - RED TESTS)
  // ============================================================
  describe('Role-Based Access (Go-Live)', () => {
    /**
     * RED TEST: AuthGuard should accept a `requiredRole` prop that
     * restricts access based on user role.
     *
     * This feature needs to be implemented in AuthGuard.
     */
    it('should accept a requiredRole prop', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'admin@test.com', role: 'ADMIN' },
        isLoading: false,
        isAuthenticated: true,
      })

      // TODO: Add requiredRole prop to AuthGuard
      renderWithProviders(
        <AuthGuard requiredRole="ADMIN">
          <div>Admin Content</div>
        </AuthGuard>,
      )

      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })

    it('should deny access when user role does not match requiredRole', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '2', email: 'viewer@test.com', role: 'VIEWER' },
        isLoading: false,
        isAuthenticated: true,
      })

      // TODO: AuthGuard should not render children if role doesn't match
      renderWithProviders(
        <AuthGuard requiredRole="ADMIN">
          <div>Admin Only Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument()
      })
    })

    it('should show access denied message when role is insufficient', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '2', email: 'viewer@test.com', role: 'VIEWER' },
        isLoading: false,
        isAuthenticated: true,
      })

      // TODO: AuthGuard should show "Access Denied" for insufficient role
      renderWithProviders(
        <AuthGuard requiredRole="ADMIN">
          <div>Admin Only Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(screen.getByText(/access denied/i)).toBeInTheDocument()
      })
    })

    it('should accept allowedRoles array prop', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'member@test.com', role: 'MEMBER' },
        isLoading: false,
        isAuthenticated: true,
      })

      // TODO: AuthGuard should support allowedRoles prop
      renderWithProviders(
        <AuthGuard allowedRoles={['ADMIN', 'MEMBER']}>
          <div>Member Content</div>
        </AuthGuard>,
      )

      expect(screen.getByText('Member Content')).toBeInTheDocument()
    })

    it('should deny VIEWER when allowedRoles is [ADMIN, MEMBER]', async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '3', email: 'viewer@test.com', role: 'VIEWER' },
        isLoading: false,
        isAuthenticated: true,
      })

      renderWithProviders(
        <AuthGuard allowedRoles={['ADMIN', 'MEMBER']}>
          <div>Write Access Content</div>
        </AuthGuard>,
      )

      await waitFor(() => {
        expect(screen.queryByText('Write Access Content')).not.toBeInTheDocument()
      })
    })
  })
})
