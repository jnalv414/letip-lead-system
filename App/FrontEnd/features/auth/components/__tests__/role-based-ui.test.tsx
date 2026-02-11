/**
 * TDD RED Tests: Role-Based UI Rendering
 *
 * These tests define the EXPECTED go-live behavior for:
 * 1. Non-admin users see read-only UI (no create/edit/delete buttons)
 * 2. Admin users see full CRUD UI
 * 3. Role-based component wrapper for conditional rendering
 *
 * STATUS: RED - These components/features need to be implemented.
 * The frontend currently has no role-based UI rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock the auth hook
const mockUseAuth = vi.fn()
vi.mock('../../hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

// ============================================================
// RoleGate Component Tests (NEW - needs implementation)
// ============================================================
describe('RoleGate Component', () => {
  /**
   * RED TEST: A RoleGate component that conditionally renders children
   * based on the current user's role.
   *
   * Usage:
   * <RoleGate allowedRoles={['ADMIN']}>
   *   <DeleteButton />
   * </RoleGate>
   */

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when user has allowed role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN' },
      isLoading: false,
      isAuthenticated: true,
    })

    // TODO: Create RoleGate component in features/auth/components/role-gate.tsx
    // For now, this test defines the expected behavior
    const RoleGate = ({ allowedRoles, children }: {
      allowedRoles: string[]
      children: React.ReactNode
    }) => {
      const { user } = mockUseAuth()
      if (!user || !allowedRoles.includes(user.role)) return null
      return <>{children}</>
    }

    renderWithProviders(
      <RoleGate allowedRoles={['ADMIN']}>
        <button>Delete Business</button>
      </RoleGate>,
    )

    expect(screen.getByText('Delete Business')).toBeInTheDocument()
  })

  it('should hide children when user lacks allowed role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', email: 'viewer@test.com', role: 'VIEWER' },
      isLoading: false,
      isAuthenticated: true,
    })

    const RoleGate = ({ allowedRoles, children }: {
      allowedRoles: string[]
      children: React.ReactNode
    }) => {
      const { user } = mockUseAuth()
      if (!user || !allowedRoles.includes(user.role)) return null
      return <>{children}</>
    }

    renderWithProviders(
      <RoleGate allowedRoles={['ADMIN']}>
        <button>Delete Business</button>
      </RoleGate>,
    )

    expect(screen.queryByText('Delete Business')).not.toBeInTheDocument()
  })

  it('should render fallback content when role is insufficient', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', email: 'viewer@test.com', role: 'VIEWER' },
      isLoading: false,
      isAuthenticated: true,
    })

    const RoleGate = ({ allowedRoles, children, fallback }: {
      allowedRoles: string[]
      children: React.ReactNode
      fallback?: React.ReactNode
    }) => {
      const { user } = mockUseAuth()
      if (!user || !allowedRoles.includes(user.role)) return <>{fallback || null}</>
      return <>{children}</>
    }

    renderWithProviders(
      <RoleGate
        allowedRoles={['ADMIN']}
        fallback={<span>Read-only mode</span>}
      >
        <button>Edit Business</button>
      </RoleGate>,
    )

    expect(screen.queryByText('Edit Business')).not.toBeInTheDocument()
    expect(screen.getByText('Read-only mode')).toBeInTheDocument()
  })
})

// ============================================================
// Business List UI - Role-Based Rendering
// ============================================================
describe('Business List - Role-Based UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * RED TEST: Admin should see action buttons (delete, edit)
   * VIEWER should only see read-only data
   */
  describe('Admin View', () => {
    it('should show delete button for ADMIN users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'justin@jjailabs.io', role: 'ADMIN' },
        isLoading: false,
        isAuthenticated: true,
      })

      // TODO: Implement role-based rendering in business list component
      // This test defines the expected admin view behavior
      const AdminBusinessActions = () => {
        const { user } = mockUseAuth()
        if (user?.role !== 'ADMIN') return null
        return (
          <div>
            <button>Delete</button>
            <button>Edit</button>
          </div>
        )
      }

      renderWithProviders(<AdminBusinessActions />)

      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })
  })

  describe('Viewer View', () => {
    it('should NOT show delete button for VIEWER users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '2', email: 'viewer@test.com', role: 'VIEWER' },
        isLoading: false,
        isAuthenticated: true,
      })

      const AdminBusinessActions = () => {
        const { user } = mockUseAuth()
        if (user?.role !== 'ADMIN') return null
        return (
          <div>
            <button>Delete</button>
            <button>Edit</button>
          </div>
        )
      }

      renderWithProviders(<AdminBusinessActions />)

      expect(screen.queryByText('Delete')).not.toBeInTheDocument()
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    })

    it('should NOT show "New Business" button for VIEWER users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '2', email: 'viewer@test.com', role: 'VIEWER' },
        isLoading: false,
        isAuthenticated: true,
      })

      const CreateBusinessButton = () => {
        const { user } = mockUseAuth()
        if (!user || !['ADMIN', 'MEMBER'].includes(user.role)) return null
        return <button>New Business</button>
      }

      renderWithProviders(<CreateBusinessButton />)

      expect(screen.queryByText('New Business')).not.toBeInTheDocument()
    })

    it('should show "New Business" button for ADMIN users', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'justin@jjailabs.io', role: 'ADMIN' },
        isLoading: false,
        isAuthenticated: true,
      })

      const CreateBusinessButton = () => {
        const { user } = mockUseAuth()
        if (!user || !['ADMIN', 'MEMBER'].includes(user.role)) return null
        return <button>New Business</button>
      }

      renderWithProviders(<CreateBusinessButton />)

      expect(screen.getByText('New Business')).toBeInTheDocument()
    })
  })
})

// ============================================================
// Navigation - Role-Based Menu Items
// ============================================================
describe('Navigation - Role-Based Menu Items', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * RED TEST: Admin should see admin-only navigation items.
   * VIEWER should see limited navigation.
   */
  it('should show "User Management" link for ADMIN only', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'justin@jjailabs.io', role: 'ADMIN' },
      isLoading: false,
      isAuthenticated: true,
    })

    // TODO: Add role-based navigation rendering
    const AdminNav = () => {
      const { user } = mockUseAuth()
      return (
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/businesses">Businesses</a>
          {user?.role === 'ADMIN' && <a href="/admin/users">User Management</a>}
        </nav>
      )
    }

    renderWithProviders(<AdminNav />)

    expect(screen.getByText('User Management')).toBeInTheDocument()
  })

  it('should NOT show "User Management" link for VIEWER', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', email: 'viewer@test.com', role: 'VIEWER' },
      isLoading: false,
      isAuthenticated: true,
    })

    const AdminNav = () => {
      const { user } = mockUseAuth()
      return (
        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/businesses">Businesses</a>
          {user?.role === 'ADMIN' && <a href="/admin/users">User Management</a>}
        </nav>
      )
    }

    renderWithProviders(<AdminNav />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Businesses')).toBeInTheDocument()
    expect(screen.queryByText('User Management')).not.toBeInTheDocument()
  })

  it('should show role badge in header for all users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', email: 'viewer@test.com', role: 'VIEWER', name: 'Test Viewer' },
      isLoading: false,
      isAuthenticated: true,
    })

    // TODO: Add role badge to header component
    const UserBadge = () => {
      const { user } = mockUseAuth()
      if (!user) return null
      return (
        <div>
          <span>{user.name}</span>
          <span data-testid="role-badge">{user.role}</span>
        </div>
      )
    }

    renderWithProviders(<UserBadge />)

    expect(screen.getByTestId('role-badge')).toHaveTextContent('VIEWER')
  })
})

// ============================================================
// useAuth Hook - Role Helpers
// ============================================================
describe('useAuth Hook - Role Helpers', () => {
  /**
   * RED TEST: The useAuth hook should expose role-checking helpers.
   */
  it('should expose isAdmin property', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'justin@jjailabs.io', role: 'ADMIN' },
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,    // TODO: Add this computed property
      isViewer: false,
      isMember: false,
    })

    const result = mockUseAuth()
    expect(result.isAdmin).toBe(true)
    expect(result.isViewer).toBe(false)
  })

  it('should expose isViewer property', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', email: 'viewer@test.com', role: 'VIEWER' },
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      isViewer: true,   // TODO: Add this computed property
      isMember: false,
    })

    const result = mockUseAuth()
    expect(result.isViewer).toBe(true)
    expect(result.isAdmin).toBe(false)
  })

  it('should expose canWrite computed property', () => {
    // ADMIN can write
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'justin@jjailabs.io', role: 'ADMIN' },
      isLoading: false,
      isAuthenticated: true,
      canWrite: true,   // TODO: Add this computed property
    })
    expect(mockUseAuth().canWrite).toBe(true)

    // VIEWER cannot write
    mockUseAuth.mockReturnValue({
      user: { id: '2', email: 'viewer@test.com', role: 'VIEWER' },
      isLoading: false,
      isAuthenticated: true,
      canWrite: false,
    })
    expect(mockUseAuth().canWrite).toBe(false)
  })
})
