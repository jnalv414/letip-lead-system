import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import {
  createMockAuthResponse,
  createMockBusiness,
  createMockContact,
  createMockDashboardOverview,
  createMockDashboardStats,
} from './mock-data'

const API_BASE = 'http://localhost:3030'

// Default handlers - tests can override these with server.use()
export const handlers = [
  // ---- Auth ----
  http.post(`${API_BASE}/api/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email === 'fail@test.com') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }
    return HttpResponse.json(createMockAuthResponse({ email: body.email }))
  }),

  http.post(`${API_BASE}/api/auth/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string; name?: string }
    if (body.email === 'exists@test.com') {
      return HttpResponse.json({ message: 'Email already registered' }, { status: 409 })
    }
    return HttpResponse.json(createMockAuthResponse({ email: body.email, name: body.name || null }))
  }),

  http.post(`${API_BASE}/api/auth/refresh`, () => {
    return HttpResponse.json({ accessToken: 'refreshed-token' })
  }),

  http.get(`${API_BASE}/api/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(createMockAuthResponse().user)
  }),

  // ---- Businesses ----
  http.get(`${API_BASE}/api/businesses`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || '1')
    const pageSize = Number(url.searchParams.get('pageSize') || '10')
    const businesses = Array.from({ length: pageSize }, () => createMockBusiness())
    return HttpResponse.json({
      data: businesses,
      total: 50,
      page,
      pageSize,
    })
  }),

  http.get(`${API_BASE}/api/businesses/:id`, ({ params }) => {
    return HttpResponse.json(createMockBusiness({ id: params.id as string }))
  }),

  http.post(`${API_BASE}/api/businesses`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(createMockBusiness(body), { status: 201 })
  }),

  http.patch(`${API_BASE}/api/businesses/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json(createMockBusiness({ id: params.id as string, ...body }))
  }),

  http.delete(`${API_BASE}/api/businesses/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // ---- Contacts ----
  http.get(`${API_BASE}/api/businesses/:id/contacts`, ({ params }) => {
    const contacts = Array.from({ length: 3 }, () =>
      createMockContact({ business_id: params.id as string })
    )
    return HttpResponse.json(contacts)
  }),

  // ---- Dashboard / Analytics ----
  http.get(`${API_BASE}/api/analytics/stats`, () => {
    return HttpResponse.json(createMockDashboardStats())
  }),

  http.get(`${API_BASE}/api/analytics/overview`, () => {
    return HttpResponse.json(createMockDashboardOverview())
  }),

  // ---- Enrichment ----
  http.post(`${API_BASE}/api/enrichment/enrich/:id`, ({ params }) => {
    return HttpResponse.json(
      createMockBusiness({ id: params.id as string, enrichment_status: 'enriched' })
    )
  }),

  // ---- Scraping ----
  http.post(`${API_BASE}/api/scraping/search`, async ({ request }) => {
    const body = (await request.json()) as { query: string; location: string }
    return HttpResponse.json({ runId: 'run-1', query: body.query, location: body.location })
  }),
]

export const server = setupServer(...handlers)
