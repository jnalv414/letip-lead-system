import { render, screen } from '@testing-library/react';
import SearchPage from '@/app/search/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the useScraping hook
jest.mock('@/features/map-scraping', () => ({
  useScraping: () => ({
    progress: {
      jobId: null,
      status: 'idle',
      progress: 0,
      found: 0,
      saved: 0,
      message: '',
    },
    startScrape: jest.fn(),
    isStarting: false,
    resetProgress: jest.fn(),
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

describe('SearchPage', () => {
  test('renders page header with title', () => {
    render(<SearchPage />, { wrapper: createWrapper() });

    // Get the h1 specifically
    expect(screen.getByRole('heading', { name: 'Search', level: 1 })).toBeInTheDocument();
  });

  test('renders search form', () => {
    render(<SearchPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business type/i)).toBeInTheDocument();
  });

  test('renders description text', () => {
    render(<SearchPage />, { wrapper: createWrapper() });

    // Multiple elements contain "google maps", check for the subtitle
    expect(screen.getByText(/find new business leads/i)).toBeInTheDocument();
  });

  test('shows search tips section', () => {
    render(<SearchPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /search tips/i })).toBeInTheDocument();
  });

  test('renders recent searches section', () => {
    render(<SearchPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /recent searches/i })).toBeInTheDocument();
  });
});
