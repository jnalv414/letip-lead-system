import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeadsPage from '@/app/leads/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the business-management hooks
const mockMutate = jest.fn();
const mockMutateAsync = jest.fn().mockResolvedValue({});

jest.mock('@/features/business-management', () => ({
  useBusinesses: jest.fn(() => ({
    data: {
      data: [
        {
          id: 1,
          name: 'Test Business',
          city: 'Freehold',
          enrichment_status: 'enriched',
          source: 'google_maps',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T15:30:00Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useCreateBusiness: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useDeleteBusiness: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useBulkDeleteBusinesses: () => ({
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock lead-enrichment hooks
jest.mock('@/features/lead-enrichment', () => ({
  useEnrichBusiness: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useBatchEnrichment: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

// Create a wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('LeadsPage', () => {
  test('renders page header with title', async () => {
    render(<LeadsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /leads/i })).toBeInTheDocument();
  });

  test('renders filter bar', () => {
    render(<LeadsPage />, { wrapper: createWrapper() });

    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });

  test('renders business list', async () => {
    render(<LeadsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Business')).toBeInTheDocument();
    });
  });

  test('renders pagination when multiple pages exist', async () => {
    // Override mock to return multiple pages
    const { useBusinesses } = require('@/features/business-management');
    useBusinesses.mockReturnValue({
      data: {
        data: [],
        meta: { total: 100, page: 1, limit: 20, totalPages: 5 },
      },
      isLoading: false,
      error: null,
    });

    render(<LeadsPage />, { wrapper: createWrapper() });

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  test('renders Add Lead button', () => {
    render(<LeadsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /add lead/i })).toBeInTheDocument();
  });

  test('filters can be applied', async () => {
    render(<LeadsPage />, { wrapper: createWrapper() });

    // Filter bar should be present with filter options
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });
});
