import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen, waitFor } from '../setup/test-utils'
import { server } from '../setup/mock-server'
import { createMockAuthResponse } from '../setup/mock-data'
import { LoginForm } from '@/features/auth/components/login-form'
import { AuthGuard } from '@/features/auth/components/auth-guard'
import { clearAccessToken, setAccessToken } from '@/shared/lib/api'
import { routerMocks } from '../../vitest.setup'

const API_BASE = 'http://localhost:3030'

// Note: MSW server.listen/resetHandlers/close handled by vitest.setup.ts
afterEach(() => {
  clearAccessToken()
  localStorage.clear()
})

describe('Auth Flow Integration', () => {
  describe('Complete login flow', () => {
    it('renders login form with email and password fields', () => {
      renderWithProviders(<LoginForm />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('fills form, submits, and triggers redirect on success', async () => {
      const { user } = renderWithProviders(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // useLogin calls router.push('/') on success
      await waitFor(() => {
        expect(routerMocks.push).toHaveBeenCalledWith('/')
      })
    })

    it('shows error for invalid credentials', async () => {
      const { user } = renderWithProviders(<LoginForm />)

      // Use the email that triggers a 401 in the mock handler
      await user.type(screen.getByLabelText(/email/i), 'fail@test.com')
      await user.type(screen.getByLabelText(/password/i), 'badpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid/i)).toBeInTheDocument()
      })
    })

    it('stores access token in localStorage after successful login', async () => {
      const { user } = renderWithProviders(<LoginForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBeTruthy()
      })
    })
  })

  describe('Token refresh on 401', () => {
    it('refreshes token and retries the request when API returns 401', async () => {
      let meCallCount = 0

      server.use(
        http.get(`${API_BASE}/api/auth/me`, () => {
          meCallCount++
          if (meCallCount <= 1) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
          }
          return HttpResponse.json(createMockAuthResponse().user)
        }),
        http.post(`${API_BASE}/api/auth/refresh`, () => {
          return HttpResponse.json({ accessToken: 'refreshed-token-123' })
        }),
      )

      setAccessToken('expired-token')

      // Call the api function directly to test the refresh-and-retry logic
      const { api } = await import('@/shared/lib/api')
      const result = await api<{ email: string }>('/api/auth/me')

      expect(result).toHaveProperty('email')
      // Should have been called at least twice (initial 401 + retry after refresh)
      expect(meCallCount).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Logout clears state and redirects', () => {
    it('clears access token from localStorage on logout', async () => {
      setAccessToken('test-token')
      expect(localStorage.getItem('accessToken')).toBe('test-token')

      server.use(
        http.post(`${API_BASE}/api/auth/logout`, () => {
          return HttpResponse.json({ message: 'Logged out' })
        }),
      )

      const { logout } = await import('@/features/auth/api/auth-api')
      await logout()

      expect(localStorage.getItem('accessToken')).toBeNull()
    })
  })

  describe('Unauthenticated redirect to /login', () => {
    it('does not render protected content when unauthenticated', async () => {
      clearAccessToken()

      server.use(
        http.get(`${API_BASE}/api/auth/me`, () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }),
        http.post(`${API_BASE}/api/auth/refresh`, () => {
          return HttpResponse.json({ message: 'No refresh token' }, { status: 401 })
        }),
      )

      renderWithProviders(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      // The protected content should not appear
      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
      })
    })

    it('renders children when user is authenticated', async () => {
      setAccessToken('valid-token')

      renderWithProviders(
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      })
    })

    it('redirects to /login when auth check fails after mount', async () => {
      clearAccessToken()

      server.use(
        http.get(`${API_BASE}/api/auth/me`, () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }),
        http.post(`${API_BASE}/api/auth/refresh`, () => {
          return HttpResponse.json({ message: 'No refresh token' }, { status: 401 })
        }),
      )

      renderWithProviders(
        <AuthGuard>
          <div>Protected</div>
        </AuthGuard>
      )

      // AuthGuard calls router.push('/login') when not authenticated after mount
      await waitFor(() => {
        expect(routerMocks.push).toHaveBeenCalledWith('/login')
      })
    })
  })
})
