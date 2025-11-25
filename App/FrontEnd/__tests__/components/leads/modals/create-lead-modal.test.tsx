import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateLeadModal } from '@/components/leads/modals/create-lead-modal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the useCreateBusiness hook
const mockMutateAsync = jest.fn();
jest.mock('@/features/business-management', () => ({
  useCreateBusiness: () => ({
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

describe('CreateLeadModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  test('renders modal when open', () => {
    render(
      <CreateLeadModal isOpen onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/add new lead/i)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(
      <CreateLeadModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders required form fields', () => {
    render(
      <CreateLeadModal isOpen onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/business name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
  });

  test('renders optional form fields', () => {
    render(
      <CreateLeadModal isOpen onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
  });

  test('calls onClose when cancel button is clicked', async () => {
    render(
      <CreateLeadModal isOpen onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    );

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('validates required fields before submission', async () => {
    render(
      <CreateLeadModal isOpen onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    );

    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/business name is required/i)).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    render(
      <CreateLeadModal isOpen onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      { wrapper: createWrapper() }
    );

    await userEvent.type(screen.getByLabelText(/business name/i), 'Test Company');
    await userEvent.type(screen.getByLabelText(/city/i), 'Freehold');

    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    // Form should be submitted (actual API call is mocked)
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
