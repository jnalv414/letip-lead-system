// Auth feature types

export type UserRole = 'ADMIN' | 'MEMBER' | 'VIEWER'

export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
}
