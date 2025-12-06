import { api, setAccessToken, clearAccessToken } from '@/shared/lib/api'
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UpdateProfileRequest,
} from '../types'

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await api<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: credentials,
    skipAuth: true,
  })
  setAccessToken(response.accessToken)
  return response
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await api<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: data,
    skipAuth: true,
  })
  setAccessToken(response.accessToken)
  return response
}

export async function logout(): Promise<void> {
  try {
    await api<{ message: string }>('/api/auth/logout', { method: 'POST' })
  } finally {
    clearAccessToken()
  }
}

export async function logoutAll(): Promise<void> {
  try {
    await api<{ message: string }>('/api/auth/logout/all', { method: 'POST' })
  } finally {
    clearAccessToken()
  }
}

export async function getCurrentUser(): Promise<User> {
  return api<User>('/api/auth/me')
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return api<User>('/api/auth/me', {
    method: 'PATCH',
    body: data,
  })
}
