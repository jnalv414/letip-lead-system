'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import {
  login,
  register,
  logout,
  logoutAll,
  getCurrentUser,
  updateProfile,
} from '../api/auth-api'
import { getAccessToken, clearAccessToken } from '@/shared/lib/api'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest } from '../types'

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: getCurrentUser,
    enabled: !!getAccessToken(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user(), data.user)
      router.push('/')
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user(), data.user)
      router.push('/')
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear()
      router.push('/login')
    },
  })
}

export function useLogoutAll() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: logoutAll,
    onSuccess: () => {
      queryClient.clear()
      router.push('/login')
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.user(), user)
    },
  })
}

export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser()
  const logoutMutation = useLogout()

  const isAuthenticated = !!user && !error

  const handleLogout = useCallback(() => {
    logoutMutation.mutate()
  }, [logoutMutation])

  return {
    user,
    isLoading,
    isAuthenticated,
    logout: handleLogout,
    isLoggingOut: logoutMutation.isPending,
  }
}
