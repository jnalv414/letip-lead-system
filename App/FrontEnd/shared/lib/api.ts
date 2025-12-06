const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  skipAuth?: boolean
}

// Token management
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
  if (token) {
    localStorage.setItem('accessToken', token)
  } else {
    localStorage.removeItem('accessToken')
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken')
  }
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken')
  }
}

// Refresh token handler
async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Include HTTP-only cookie
    })

    if (response.ok) {
      const data = await response.json()
      setAccessToken(data.accessToken)
      return data.accessToken
    }
    return null
  } catch {
    return null
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

export async function api<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Add auth header if we have a token and auth is not skipped
  const token = getAccessToken()
  if (token && !skipAuth) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // Include cookies for refresh token
  })

  // If unauthorized, try to refresh token and retry
  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      requestHeaders['Authorization'] = `Bearer ${newToken}`
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      })
    }
  }

  if (!response.ok) {
    let errorData: unknown
    try {
      errorData = await response.json()
    } catch {
      errorData = undefined
    }
    throw new ApiError(response.status, response.statusText, errorData)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

// Multipart form data upload (for CSV)
export async function uploadFile<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  })

  if (!response.ok) {
    let errorData: unknown
    try {
      errorData = await response.json()
    } catch {
      errorData = undefined
    }
    throw new ApiError(response.status, response.statusText, errorData)
  }

  return response.json()
}
