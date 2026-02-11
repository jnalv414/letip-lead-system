import type { User, UserRole } from '@/features/auth/types'
import type { Business, Contact, EnrichmentLog, OutreachMessage } from '@/shared/types'
import type {
  DashboardStats,
  DashboardOverview,
  LocationStat,
  SourceStat,
  PipelineStat,
  TimelineStat,
  RecentBusiness,
  ActivityItem,
} from '@/features/dashboard/types'

// ---- Counters for unique IDs ----
let idCounter = 0
function nextId(prefix = '') {
  idCounter += 1
  return `${prefix}${idCounter}`
}

export function resetIdCounter() {
  idCounter = 0
}

// ---- User ----
export function createMockUser(overrides: Partial<User> = {}): User {
  const id = nextId('user-')
  return {
    id,
    email: `${id}@test.com`,
    name: 'Test User',
    role: 'MEMBER' as UserRole,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---- Business ----
export function createMockBusiness(overrides: Partial<Business> = {}): Business {
  const id = nextId('biz-')
  return {
    id,
    name: `Business ${id}`,
    address: '123 Main St, Test City',
    phone: '555-0100',
    website: 'https://example.com',
    email: `contact@${id}.com`,
    latitude: 34.0522,
    longitude: -118.2437,
    enrichment_status: 'pending',
    industry: 'Technology',
    employee_count: 50,
    year_founded: 2020,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---- Contact ----
export function createMockContact(overrides: Partial<Contact> = {}): Contact {
  const id = nextId('contact-')
  return {
    id,
    business_id: 'biz-1',
    first_name: 'John',
    last_name: 'Doe',
    email: `${id}@test.com`,
    position: 'Manager',
    confidence: 0.85,
    created_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---- EnrichmentLog ----
export function createMockEnrichmentLog(overrides: Partial<EnrichmentLog> = {}): EnrichmentLog {
  const id = nextId('log-')
  return {
    id,
    business_id: 'biz-1',
    source: 'google',
    status: 'success',
    error_message: null,
    created_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---- OutreachMessage ----
export function createMockOutreachMessage(overrides: Partial<OutreachMessage> = {}): OutreachMessage {
  const id = nextId('msg-')
  return {
    id,
    business_id: 'biz-1',
    message_type: 'email',
    content: 'Hello, we would like to connect.',
    status: 'draft',
    created_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---- Dashboard Stats ----
export function createMockDashboardStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    totalBusinesses: 100,
    enrichedCount: 65,
    pendingCount: 25,
    failedCount: 10,
    totalContacts: 320,
    messagesGenerated: 45,
    enrichmentRate: 65,
    avgContactsPerBusiness: 3.2,
    ...overrides,
  }
}

export function createMockDashboardOverview(overrides: Partial<DashboardOverview> = {}): DashboardOverview {
  const locations: LocationStat[] = [
    { city: 'Los Angeles', count: 40, percentage: 40 },
    { city: 'San Francisco', count: 30, percentage: 30 },
    { city: 'New York', count: 30, percentage: 30 },
  ]

  const sources: SourceStat[] = [
    { source: 'Google Maps', count: 60, percentage: 60 },
    { source: 'CSV Import', count: 40, percentage: 40 },
  ]

  const pipeline: PipelineStat[] = [
    { status: 'enriched', count: 65, percentage: 65 },
    { status: 'pending', count: 25, percentage: 25 },
    { status: 'failed', count: 10, percentage: 10 },
  ]

  const timeline: TimelineStat[] = [
    { date: '2025-01-01', businesses: 10, enriched: 5, contacts: 15 },
    { date: '2025-01-02', businesses: 15, enriched: 10, contacts: 30 },
    { date: '2025-01-03', businesses: 20, enriched: 15, contacts: 45 },
  ]

  const recentBusinesses: RecentBusiness[] = [
    { id: 'biz-1', name: 'Acme Corp', city: 'LA', enrichment_status: 'enriched', created_at: '2025-01-03T00:00:00Z', contacts_count: 3 },
    { id: 'biz-2', name: 'Beta Inc', city: 'SF', enrichment_status: 'pending', created_at: '2025-01-02T00:00:00Z', contacts_count: 0 },
  ]

  return {
    stats: createMockDashboardStats(),
    locations,
    sources,
    pipeline,
    timeline,
    recentBusinesses,
    ...overrides,
  }
}

// ---- Activity Items ----
export function createMockActivityItem(overrides: Partial<ActivityItem> = {}): ActivityItem {
  const id = nextId('activity-')
  return {
    id,
    type: 'business_added',
    businessName: 'Acme Corp',
    businessId: 'biz-1',
    timestamp: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---- Auth Response helper ----
export function createMockAuthResponse(userOverrides: Partial<User> = {}) {
  const user = createMockUser(userOverrides)
  return {
    user,
    accessToken: 'mock-access-token-' + user.id,
  }
}
