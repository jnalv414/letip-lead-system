import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkDeleteModal } from '@/components/leads/modals/bulk-delete-modal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the useBulkDeleteBusinesses hook
const mockMutateAsync = jest.fn();
jest.mock('@/features/business-management', () => ({
  useBulkDeleteBusinesses: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
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

describe('BulkDeleteModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  test('renders confirmation dialog', () => {
    render(
      <BulkDeleteModal
        isOpen
        selectedIds={[1, 2, 3]}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Multiple elements contain "delete", so check the heading specifically
    expect(screen.getByRole('heading', { name: /delete/i })).toBeInTheDocument();
  });

  test('displays count of items to delete', () => {
    render(
      <BulkDeleteModal
        isOpen
        selectedIds={[1, 2, 3, 4, 5]}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Count appears multiple times (heading, display, button) - use getAllBy
    expect(screen.getAllByText(/5/).length).toBeGreaterThan(0);
    expect(screen.getByText(/permanently deleted/i)).toBeInTheDocument();
  });

  test('warns about irreversible action', () => {
    render(
      <BulkDeleteModal
        isOpen
        selectedIds={[1, 2]}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  test('calls onClose when cancel is clicked', async () => {
    render(
      <BulkDeleteModal
        isOpen
        selectedIds={[1, 2]}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('calls onSuccess after successful deletion', async () => {
    render(
      <BulkDeleteModal
        isOpen
        selectedIds={[1, 2, 3]}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    // Find the confirm delete button (not the title)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('is not rendered when closed', () => {
    render(
      <BulkDeleteModal
        isOpen={false}
        selectedIds={[1, 2]}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
