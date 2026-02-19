import { api } from '@/shared/lib/api'
import type { ApiStatusResponse } from '../types'

export async function getApiStatus(): Promise<ApiStatusResponse> {
  return api<ApiStatusResponse>('/api/admin/api-status')
}
