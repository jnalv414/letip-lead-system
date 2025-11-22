/**
 * Centralized mock data factory for all tests
 * Provides consistent, realistic test data across the test suite
 */

export const MockDataFactory = {
  // ==================== Entity Mocks ====================

  /**
   * Creates a mock business entity
   */
  business: (overrides = {}) => ({
    id: Math.floor(Math.random() * 10000),
    name: 'ABC Plumbing Services',
    phone: '732-555-0100',
    email: 'contact@abcplumbing.com',
    website: 'https://abcplumbing.com',
    address: '123 Main Street, Freehold, NJ 07728',
    city: 'Freehold',
    state: 'NJ',
    zip: '07728',
    industry: 'plumbing',
    year_founded: 2015,
    employee_count: 12,
    annual_revenue: '$1.2M',
    enrichment_status: 'enriched' as const,
    created_at: new Date('2024-01-15T10:30:00Z').toISOString(),
    updated_at: new Date('2024-01-20T14:45:00Z').toISOString(),
    ...overrides,
  }),

  /**
   * Creates a mock contact entity
   */
  contact: (overrides = {}) => ({
    id: Math.floor(Math.random() * 10000),
    business_id: 1,
    name: 'John Smith',
    title: 'Owner',
    email: 'john@abcplumbing.com',
    phone: '732-555-0101',
    linkedin: 'https://linkedin.com/in/johnsmith',
    confidence_score: 0.95,
    created_at: new Date('2024-01-20T14:45:00Z').toISOString(),
    ...overrides,
  }),

  /**
   * Creates a mock enrichment log entry
   */
  enrichmentLog: (overrides = {}) => ({
    id: Math.floor(Math.random() * 10000),
    business_id: 1,
    service: 'hunter',
    status: 'success',
    request_data: JSON.stringify({ domain: 'abcplumbing.com' }),
    response_data: JSON.stringify({ emails: ['john@abcplumbing.com'] }),
    error_message: null,
    created_at: new Date('2024-01-20T14:45:00Z').toISOString(),
    ...overrides,
  }),

  /**
   * Creates a mock outreach message
   */
  outreachMessage: (overrides = {}) => ({
    id: Math.floor(Math.random() * 10000),
    business_id: 1,
    contact_id: 1,
    subject: 'Exclusive Business Networking Opportunity - Le Tip Western Monmouth',
    message: 'Dear John, I hope this message finds you well...',
    status: 'generated' as const,
    sent_at: null,
    opened_at: null,
    replied_at: null,
    created_at: new Date('2024-01-21T09:00:00Z').toISOString(),
    ...overrides,
  }),

  // ==================== Chart Data Mocks ====================

  chartData: {
    /**
     * Business growth over time data
     */
    growth: (months = 6) => {
      const data = [];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      for (let i = 0; i < months; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);

        data.push({
          date: date.toISOString().slice(0, 7), // YYYY-MM format
          businesses: 120 + Math.floor(Math.random() * 50) + i * 15,
          contacts: 340 + Math.floor(Math.random() * 100) + i * 35,
          enriched: 100 + Math.floor(Math.random() * 40) + i * 12,
        });
      }

      return data;
    },

    /**
     * Lead sources breakdown
     */
    sources: () => [
      { source: 'Google Maps', count: 234, percentage: 45, color: '#14B8A6' },
      { source: 'Direct Entry', count: 156, percentage: 30, color: '#0F766E' },
      { source: 'Referrals', count: 78, percentage: 15, color: '#5EEAD4' },
      { source: 'Imported', count: 52, percentage: 10, color: '#0D9488' },
    ],

    /**
     * Sales pipeline stages
     */
    pipeline: () => [
      {
        stage: 'New Leads',
        count: 45,
        value: 125000,
        color: '#FB923C',
        percentage: 35,
      },
      {
        stage: 'Qualified',
        count: 23,
        value: 89000,
        color: '#F59E0B',
        percentage: 25,
      },
      {
        stage: 'Proposal Sent',
        count: 12,
        value: 67000,
        color: '#EAB308',
        percentage: 20,
      },
      {
        stage: 'Negotiation',
        count: 8,
        value: 45000,
        color: '#F97316',
        percentage: 12,
      },
      {
        stage: 'Closed Won',
        count: 5,
        value: 32000,
        color: '#EA580C',
        percentage: 8,
      },
    ],

    /**
     * Geographic distribution
     */
    geographic: () => [
      { city: 'Freehold', count: 124, latitude: 40.2601, longitude: -74.2765 },
      { city: 'Red Bank', count: 89, latitude: 40.3471, longitude: -74.0643 },
      { city: 'Marlboro', count: 67, latitude: 40.3154, longitude: -74.2460 },
      { city: 'Manalapan', count: 54, latitude: 40.2448, longitude: -74.3585 },
      { city: 'Howell', count: 45, latitude: 40.1484, longitude: -74.1951 },
    ],

    /**
     * Time series data for sparklines
     */
    sparkline: (points = 20) => {
      const data = [];
      let value = 50;

      for (let i = 0; i < points; i++) {
        value += Math.random() * 10 - 5; // Random walk
        value = Math.max(0, Math.min(100, value)); // Clamp between 0-100
        data.push(value);
      }

      return data;
    },
  },

  // ==================== Dashboard Stats ====================

  /**
   * Creates mock dashboard statistics
   */
  stats: (overrides = {}) => ({
    totalBusinesses: 524,
    totalContacts: 1567,
    enrichedCount: 412,
    pendingEnrichment: 89,
    failedEnrichment: 23,
    messageSent: 234,
    messageOpened: 156,
    messageReplied: 45,
    avgEnrichmentRate: 78.6,
    avgResponseRate: 19.2,
    todayAdded: 12,
    weekAdded: 67,
    monthAdded: 289,
    topIndustries: [
      { industry: 'plumbing', count: 87 },
      { industry: 'restaurants', count: 65 },
      { industry: 'lawyers', count: 54 },
      { industry: 'dentists', count: 43 },
      { industry: 'real estate', count: 38 },
    ],
    topCities: [
      { city: 'Freehold', count: 124 },
      { city: 'Red Bank', count: 89 },
      { city: 'Marlboro', count: 67 },
    ],
    recentActivity: [
      {
        type: 'business_added',
        message: 'ABC Plumbing added',
        timestamp: new Date().toISOString(),
      },
      {
        type: 'enrichment_completed',
        message: 'XYZ Dental enriched successfully',
        timestamp: new Date(Date.now() - 300000).toISOString(),
      },
    ],
    ...overrides,
  }),

  // ==================== WebSocket Event Mocks ====================

  /**
   * Creates a WebSocket event payload
   */
  wsEvent: (type: string, data: any) => ({
    timestamp: new Date().toISOString(),
    type,
    data,
  }),

  /**
   * Creates various WebSocket event types
   */
  wsEvents: {
    businessCreated: (business?: any) => ({
      timestamp: new Date().toISOString(),
      type: 'business:created',
      data: business || MockDataFactory.business(),
    }),

    businessUpdated: (business?: any) => ({
      timestamp: new Date().toISOString(),
      type: 'business:updated',
      data: business || MockDataFactory.business({ updated_at: new Date().toISOString() }),
    }),

    businessDeleted: (id = 1) => ({
      timestamp: new Date().toISOString(),
      type: 'business:deleted',
      data: { id },
    }),

    statsUpdated: (stats?: any) => ({
      timestamp: new Date().toISOString(),
      type: 'stats:updated',
      data: stats || MockDataFactory.stats(),
    }),

    scrapingProgress: (current: number, total: number) => ({
      timestamp: new Date().toISOString(),
      type: 'scraping:progress',
      data: {
        current,
        total,
        percentage: (current / total) * 100,
        message: `Processing ${current} of ${total} businesses...`,
      },
    }),

    enrichmentProgress: (current: number, total: number) => ({
      timestamp: new Date().toISOString(),
      type: 'enrichment:progress',
      data: {
        current,
        total,
        percentage: (current / total) * 100,
        message: `Enriching ${current} of ${total} businesses...`,
      },
    }),
  },

  // ==================== Lists and Collections ====================

  /**
   * Creates a list of mock businesses
   */
  businessList: (count = 10, overrides = {}) => {
    const industries = ['plumbing', 'restaurants', 'lawyers', 'dentists', 'real estate'];
    const cities = ['Freehold', 'Red Bank', 'Marlboro', 'Manalapan', 'Howell'];
    const statuses = ['pending', 'enriched', 'failed'] as const;

    return Array.from({ length: count }, (_, i) => ({
      ...MockDataFactory.business({
        id: i + 1,
        name: `Business ${i + 1}`,
        industry: industries[i % industries.length],
        city: cities[i % cities.length],
        enrichment_status: statuses[i % statuses.length],
        ...overrides,
      }),
    }));
  },

  /**
   * Creates a paginated response
   */
  paginatedResponse: (data: any[], page = 1, limit = 20, total?: number) => ({
    data,
    meta: {
      page,
      limit,
      total: total || data.length,
      totalPages: Math.ceil((total || data.length) / limit),
      hasNext: page < Math.ceil((total || data.length) / limit),
      hasPrev: page > 1,
    },
  }),

  // ==================== Activity Feed ====================

  /**
   * Creates activity feed items
   */
  activityFeed: (count = 10) => {
    const activities = [
      { type: 'business_added', icon: '🏢', color: 'teal' },
      { type: 'enrichment_completed', icon: '✨', color: 'orange' },
      { type: 'message_sent', icon: '📧', color: 'teal' },
      { type: 'contact_discovered', icon: '👤', color: 'orange' },
      { type: 'scraping_completed', icon: '🔍', color: 'teal' },
    ];

    return Array.from({ length: count }, (_, i) => {
      const activity = activities[i % activities.length];
      const minutesAgo = i * 5;
      const timestamp = new Date(Date.now() - minutesAgo * 60000);

      return {
        id: i + 1,
        type: activity.type,
        icon: activity.icon,
        color: activity.color,
        title: `Activity ${i + 1}`,
        description: `Description for activity ${i + 1}`,
        timestamp: timestamp.toISOString(),
        metadata: {
          businessName: `Business ${i + 1}`,
          count: Math.floor(Math.random() * 10) + 1,
        },
      };
    });
  },

  // ==================== Calendar Events ====================

  /**
   * Creates calendar events for the widget
   */
  calendarEvents: (month = new Date().getMonth(), year = new Date().getFullYear()) => {
    const events = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add some random events
    for (let i = 0; i < 8; i++) {
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      events.push({
        date: new Date(year, month, day).toISOString().slice(0, 10),
        type: ['meeting', 'follow_up', 'deadline'][i % 3],
        title: `Event ${i + 1}`,
        count: Math.floor(Math.random() * 5) + 1,
      });
    }

    return events;
  },
};

// Type exports for TypeScript
export type MockBusiness = ReturnType<typeof MockDataFactory.business>;
export type MockContact = ReturnType<typeof MockDataFactory.contact>;
export type MockStats = ReturnType<typeof MockDataFactory.stats>;
export type MockChartData = typeof MockDataFactory.chartData;