import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchControls } from '@/components/enrichment/batch-controls';

describe('BatchControls', () => {
  const mockOnStartBatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders start batch button', () => {
    render(
      <BatchControls
        onStartBatch={mockOnStartBatch}
        isPending={false}
        pendingCount={40}
      />
    );

    expect(screen.getByRole('button', { name: /start batch/i })).toBeInTheDocument();
  });

  test('renders batch size selector', () => {
    render(
      <BatchControls
        onStartBatch={mockOnStartBatch}
        isPending={false}
        pendingCount={40}
      />
    );

    expect(screen.getByLabelText(/batch size/i)).toBeInTheDocument();
  });

  test('calls onStartBatch with selected count when button clicked', async () => {
    render(
      <BatchControls
        onStartBatch={mockOnStartBatch}
        isPending={false}
        pendingCount={40}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /start batch/i }));

    expect(mockOnStartBatch).toHaveBeenCalled();
  });

  test('disables button when isPending is true', () => {
    render(
      <BatchControls
        onStartBatch={mockOnStartBatch}
        isPending={true}
        pendingCount={40}
      />
    );

    // Button shows "Processing..." when pending
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
  });

  test('shows processing indicator when isPending', () => {
    render(
      <BatchControls
        onStartBatch={mockOnStartBatch}
        isPending={true}
        pendingCount={40}
      />
    );

    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  test('disables button when pendingCount is 0', () => {
    render(
      <BatchControls
        onStartBatch={mockOnStartBatch}
        isPending={false}
        pendingCount={0}
      />
    );

    expect(screen.getByRole('button', { name: /start batch/i })).toBeDisabled();
  });

  test('shows rate limit warning', () => {
    render(
      <BatchControls
        onStartBatch={mockOnStartBatch}
        isPending={false}
        pendingCount={40}
      />
    );

    // Should display API rate limit info
    expect(screen.getByText(/rate limits/i)).toBeInTheDocument();
  });

  test('allows selecting different batch sizes', async () => {
    render(
      <BatchControls
        onStartBatch={mockOnStartBatch}
        isPending={false}
        pendingCount={40}
      />
    );

    const select = screen.getByLabelText(/batch size/i);
    await userEvent.selectOptions(select, '20');

    await userEvent.click(screen.getByRole('button', { name: /start batch/i }));

    expect(mockOnStartBatch).toHaveBeenCalledWith(20);
  });
});
