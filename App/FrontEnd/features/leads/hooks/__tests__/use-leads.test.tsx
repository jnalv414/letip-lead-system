import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  useLeads,
  useLead,
  useIndustries,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  useBulkDeleteLeads,
  useBulkEnrichLeads,
  leadKeys,
} from '../use-leads'

// Mock the leads API module
vi.mock('../../api/leads-api', () => ({
  fetchLeads: vi.fn(),
  fetchLead: vi.fn(),
  createLead: vi.fn(),
  updateLead: vi.fn(),
  deleteLead: vi.fn(),
  bulkDeleteLeads: vi.fn(),
  bulkEnrichLeads: vi.fn(),
  fetchIndustries: vi.fn(),
}))

import {
  fetchLeads,
  fetchLead,
  createLead,
  updateLead,
  deleteLead,
  bulkDeleteLeads,
  bulkEnrichLeads,
  fetchIndustries,
} from '../../api/leads-api'

// --- Mock Data ---

const mockBusiness = {
  id: '1',
  name: 'Test Business',
  address: '123 Main St',
  phone: '555-0100',
  website: 'https://test.com',
  email: 'info@test.com',
  latitude: null,
  longitude: null,
  enrichment_status: 'pending' as const,
  industry: 'Technology',
  employee_count: null,
  year_founded: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockPaginatedResponse = {
  data: [mockBusiness],
  total: 1,
  page: 1,
  pageSize: 10,
}

const mockLeadWithContacts = {
  ...mockBusiness,
  contacts: [
    {
      id: 'c1',
      business_id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      position: 'CEO',
      confidence: 0.9,
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
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

beforeEach(() => {
  vi.clearAllMocks()
})

// --- Key Factory ---

describe('leadKeys', () => {
  it('generates correct query keys', () => {
    expect(leadKeys.all).toEqual(['leads'])
    expect(leadKeys.lists()).toEqual(['leads', 'list'])
    expect(leadKeys.list(1, 10)).toEqual(['leads', 'list', { page: 1, pageSize: 10, filters: undefined }])
    expect(leadKeys.list(2, 20, { search: 'test' })).toEqual([
      'leads', 'list', { page: 2, pageSize: 20, filters: { search: 'test' } },
    ])
    expect(leadKeys.details()).toEqual(['leads', 'detail'])
    expect(leadKeys.detail('123')).toEqual(['leads', 'detail', '123'])
    expect(leadKeys.industries()).toEqual(['leads', 'industries'])
  })
})

// --- Query Hooks ---

describe('useLeads', () => {
  it('fetches leads with default params', async () => {
    vi.mocked(fetchLeads).mockResolvedValue(mockPaginatedResponse)

    const { result } = renderHook(() => useLeads(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchLeads).toHaveBeenCalledWith(1, 10, undefined)
    expect(result.current.data).toEqual(mockPaginatedResponse)
  })

  it('fetches leads with custom params and filters', async () => {
    vi.mocked(fetchLeads).mockResolvedValue(mockPaginatedResponse)
    const filters = { search: 'acme', enrichment_status: 'enriched' as const }

    const { result } = renderHook(() => useLeads(2, 20, filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchLeads).toHaveBeenCalledWith(2, 20, filters)
  })

  it('handles fetch error', async () => {
    vi.mocked(fetchLeads).mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useLeads(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useLead', () => {
  it('fetches a single lead by id', async () => {
    vi.mocked(fetchLead).mockResolvedValue(mockLeadWithContacts)

    const { result } = renderHook(() => useLead('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchLead).toHaveBeenCalledWith('1')
    expect(result.current.data).toEqual(mockLeadWithContacts)
  })

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useLead(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchLead).not.toHaveBeenCalled()
  })
})

describe('useIndustries', () => {
  it('fetches industries list', async () => {
    const mockIndustries = ['Technology', 'Finance', 'Healthcare']
    vi.mocked(fetchIndustries).mockResolvedValue(mockIndustries)

    const { result } = renderHook(() => useIndustries(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockIndustries)
    expect(fetchIndustries).toHaveBeenCalledOnce()
  })
})

// --- Mutation Hooks ---

describe('useCreateLead', () => {
  it('creates a lead and invalidates list queries', async () => {
    const newBusiness = { ...mockBusiness, id: '2', name: 'New Biz' }
    vi.mocked(createLead).mockResolvedValue(newBusiness)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useCreateLead(), { wrapper })

    act(() => {
      result.current.mutate({ name: 'New Biz', address: '456 Oak Ave' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(createLead).toHaveBeenCalledWith({ name: 'New Biz', address: '456 Oak Ave' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: leadKeys.lists() })
  })

  it('handles creation failure', async () => {
    vi.mocked(createLead).mockRejectedValue(new Error('Validation error'))

    const { result } = renderHook(() => useCreateLead(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({ name: '' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpdateLead', () => {
  it('updates a lead, invalidates lists, and sets detail cache', async () => {
    const updatedBusiness = { ...mockBusiness, name: 'Updated Biz' }
    vi.mocked(updateLead).mockResolvedValue(updatedBusiness)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useUpdateLead(), { wrapper })

    act(() => {
      result.current.mutate({ id: '1', name: 'Updated Biz' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(updateLead).toHaveBeenCalledWith({ id: '1', name: 'Updated Biz' })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: leadKeys.lists() })
    expect(setQueryDataSpy).toHaveBeenCalledWith(leadKeys.detail('1'), updatedBusiness)
  })
})

describe('useDeleteLead', () => {
  it('deletes a lead and invalidates list queries', async () => {
    vi.mocked(deleteLead).mockResolvedValue(undefined)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useDeleteLead(), { wrapper })

    act(() => {
      result.current.mutate('1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(deleteLead).toHaveBeenCalledWith('1')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: leadKeys.lists() })
  })
})

describe('useBulkDeleteLeads', () => {
  it('bulk deletes leads and invalidates list queries', async () => {
    const mockResult = { success: 3, failed: 0 }
    vi.mocked(bulkDeleteLeads).mockResolvedValue(mockResult)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useBulkDeleteLeads(), { wrapper })

    act(() => {
      result.current.mutate(['1', '2', '3'])
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bulkDeleteLeads).toHaveBeenCalledWith(['1', '2', '3'])
    expect(result.current.data).toEqual(mockResult)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: leadKeys.lists() })
  })
})

describe('useBulkEnrichLeads', () => {
  it('bulk enriches leads and invalidates list queries', async () => {
    const mockResult = { success: 2, failed: 1, errors: ['ID 3 not found'] }
    vi.mocked(bulkEnrichLeads).mockResolvedValue(mockResult)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useBulkEnrichLeads(), { wrapper })

    act(() => {
      result.current.mutate(['1', '2', '3'])
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(bulkEnrichLeads).toHaveBeenCalledWith(['1', '2', '3'])
    expect(result.current.data).toEqual(mockResult)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: leadKeys.lists() })
  })

  it('handles bulk enrich failure', async () => {
    vi.mocked(bulkEnrichLeads).mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useBulkEnrichLeads(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate(['1'])
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
