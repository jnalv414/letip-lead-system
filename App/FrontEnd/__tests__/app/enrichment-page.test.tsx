import { render, screen } from '@testing-library/react';
import EnrichmentPage from '@/app/enrichment/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
const mockBatchEnrich = jest.fn();
jest.mock('@/features/lead-enrichment', () => ({
  useEnrichBusiness: () => ({ mutate: jest.fn(), isPending: false }),
  useBatchEnrichment: () => ({ mutate: mockBatchEnrich, isPending: false }),
}));

jest.mock('@/features/business-management', () => ({
  useBusinesses: jest.fn(() => ({
    data: {
      data: [
        { id: 1, name: 'Test Business', enrichment_status: 'pending' },
        { id: 2, name: 'Enriched Business', enrichment_status: 'enriched' },
      ],
      meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
    },
    isLoading: false,
    error: null,
  })),
}));

jest.mock('@/features/dashboard-analytics', () => ({
  useStats: () => ({
    data: {
      totalBusinesses: 100,
      enrichedBusinesses: 60,
      pendingEnrichment: 40,
      totalContacts: 150,
    },
    isLoading: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('EnrichmentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders page header with title', () => {
    render(<EnrichmentPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /enrichment/i, level: 1 })).toBeInTheDocument();
  });

  test('renders enrichment stats section', () => {
    render(<EnrichmentPage />, { wrapper: createWrapper() });

    // Should show pending count
    expect(screen.getByText(/40/)).toBeInTheDocument();
    // Should show enriched count (appears multiple times - stat card and rate indicator)
    expect(screen.getAllByText(/60/).length).toBeGreaterThan(0);
  });

  test('renders batch enrichment controls', () => {
    render(<EnrichmentPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /start batch/i })).toBeInTheDocument();
  });

  test('renders pending businesses queue', () => {
    render(<EnrichmentPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Test Business')).toBeInTheDocument();
  });

  test('shows enrichment rate info', () => {
    render(<EnrichmentPage />, { wrapper: createWrapper() });

    // Should display some rate limit info
    expect(screen.getByText(/rate limits/i)).toBeInTheDocument();
  });
});
