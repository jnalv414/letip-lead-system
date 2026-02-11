import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  useCurrentUser,
  useLogin,
  useRegister,
  useLogout,
  useLogoutAll,
  useUpdateProfile,
  useAuth,
  authKeys,
} from '../use-auth'

// Mock the auth API module
vi.mock('../../api/auth-api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  logoutAll: vi.fn(),
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
}))

// Mock the shared api lib (for getAccessToken / clearAccessToken)
vi.mock('@/shared/lib/api', () => ({
  getAccessToken: vi.fn(() => 'mock-token'),
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}))

import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  logoutAll as logoutAllApi,
  getCurrentUser as getCurrentUserApi,
  updateProfile as updateProfileApi,
} from '../../api/auth-api'
import { getAccessToken } from '@/shared/lib/api'

const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'MEMBER' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockAuthResponse = {
  user: mockUser,
  accessToken: 'new-access-token',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('authKeys', () => {
  it('generates correct query keys', () => {
    expect(authKeys.all).toEqual(['auth'])
    expect(authKeys.user()).toEqual(['auth', 'user'])
  })
})

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches current user when token exists', async () => {
    vi.mocked(getAccessToken).mockReturnValue('mock-token')
    vi.mocked(getCurrentUserApi).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockUser)
    expect(getCurrentUserApi).toHaveBeenCalledOnce()
  })

  it('does not fetch when no token exists', () => {
    vi.mocked(getAccessToken).mockReturnValue(null)

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(getCurrentUserApi).not.toHaveBeenCalled()
  })

  it('handles API error', async () => {
    vi.mocked(getAccessToken).mockReturnValue('mock-token')
    vi.mocked(getCurrentUserApi).mockRejectedValue(new Error('Unauthorized'))

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls login API and sets user data on success', async () => {
    vi.mocked(loginApi).mockResolvedValue(mockAuthResponse)

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'test@example.com', password: 'password123' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(loginApi).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.current.data).toEqual(mockAuthResponse)
  })

  it('handles login failure', async () => {
    vi.mocked(loginApi).mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'bad@example.com', password: 'wrong' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Invalid credentials')
  })
})

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls register API and sets user data on success', async () => {
    vi.mocked(registerApi).mockResolvedValue(mockAuthResponse)

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(registerApi).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
    })
  })

  it('handles registration failure', async () => {
    vi.mocked(registerApi).mockRejectedValue(new Error('Email already exists'))

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({ email: 'existing@example.com', password: 'password123' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Email already exists')
  })
})

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls logout API and clears query cache', async () => {
    vi.mocked(logoutApi).mockResolvedValue(undefined)

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(logoutApi).toHaveBeenCalledOnce()
  })

  it('handles logout failure', async () => {
    vi.mocked(logoutApi).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useLogoutAll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls logoutAll API', async () => {
    vi.mocked(logoutAllApi).mockResolvedValue(undefined)

    const { result } = renderHook(() => useLogoutAll(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(logoutAllApi).toHaveBeenCalledOnce()
  })
})

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls updateProfile API and updates cached user', async () => {
    const updatedUser = { ...mockUser, name: 'Updated Name' }
    vi.mocked(updateProfileApi).mockResolvedValue(updatedUser)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    // Pre-seed user in cache
    queryClient.setQueryData(authKeys.user(), mockUser)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    act(() => {
      result.current.mutate({ name: 'Updated Name' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(updateProfileApi).toHaveBeenCalledWith({ name: 'Updated Name' })

    // Cache should be updated with new user data
    const cachedUser = queryClient.getQueryData(authKeys.user())
    expect(cachedUser).toEqual(updatedUser)
  })
})

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns authenticated state when user exists', async () => {
    vi.mocked(getAccessToken).mockReturnValue('mock-token')
    vi.mocked(getCurrentUserApi).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(typeof result.current.logout).toBe('function')
  })

  it('returns unauthenticated state when no token', () => {
    vi.mocked(getAccessToken).mockReturnValue(null)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(result.current.user).toBeUndefined()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns unauthenticated state when user fetch fails', async () => {
    vi.mocked(getAccessToken).mockReturnValue('mock-token')
    vi.mocked(getCurrentUserApi).mockRejectedValue(new Error('Unauthorized'))

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('exposes isLoggingOut state', async () => {
    vi.mocked(getAccessToken).mockReturnValue(null)

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoggingOut).toBe(false)
  })
})
