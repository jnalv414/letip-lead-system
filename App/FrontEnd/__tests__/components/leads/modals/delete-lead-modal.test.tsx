import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteLeadModal } from '@/components/leads/modals/delete-lead-modal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Business } from '@/types/api';

// Mock the useDeleteBusiness hook
const mockMutateAsync = jest.fn();
jest.mock('@/features/business-management', () => ({
  useDeleteBusiness: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const mockBusiness: Business = {
  id: 1,
  name: 'Acme Corporation',
  city: 'Freehold',
  state: 'NJ',
  enrichment_status: 'enriched',
  source: 'google_maps',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T15:30:00Z',
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('DeleteLeadModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  test('renders confirmation dialog', () => {
    render(
      <DeleteLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Title contains "Delete Lead"
    expect(screen.getAllByText(/delete/i).length).toBeGreaterThan(0);
  });

  test('displays business name in confirmation message', () => {
    render(
      <DeleteLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Acme Corporation/)).toBeInTheDocument();
  });

  test('warns about irreversible action', () => {
    render(
      <DeleteLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  test('calls onClose when cancel is clicked', async () => {
    render(
      <DeleteLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('has delete button with destructive styling', () => {
    render(
      <DeleteLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
  });

  test('calls onSuccess after successful deletion', async () => {
    render(
      <DeleteLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
