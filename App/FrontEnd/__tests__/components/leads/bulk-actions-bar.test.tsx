import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkActionsBar } from '@/components/leads/bulk-actions-bar';

describe('BulkActionsBar', () => {
  const mockOnDelete = jest.fn();
  const mockOnEnrich = jest.fn();
  const mockOnClearSelection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('is not visible when no items selected', () => {
    const { container } = render(
      <BulkActionsBar
        selectedCount={0}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
        onClearSelection={mockOnClearSelection}
      />
    );

    expect(container.querySelector('[data-testid="bulk-actions-bar"]')).not.toBeInTheDocument();
  });

  test('shows selection count when items selected', () => {
    render(
      <BulkActionsBar
        selectedCount={5}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
        onClearSelection={mockOnClearSelection}
      />
    );

    // Count is shown in a badge, "selected" is separate text
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('selected')).toBeInTheDocument();
  });

  test('displays delete button', () => {
    render(
      <BulkActionsBar
        selectedCount={3}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
        onClearSelection={mockOnClearSelection}
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  test('displays enrich button', () => {
    render(
      <BulkActionsBar
        selectedCount={3}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
        onClearSelection={mockOnClearSelection}
      />
    );

    expect(screen.getByRole('button', { name: /enrich/i })).toBeInTheDocument();
  });

  test('calls onDelete when delete button clicked', async () => {
    render(
      <BulkActionsBar
        selectedCount={3}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
        onClearSelection={mockOnClearSelection}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(mockOnDelete).toHaveBeenCalled();
  });

  test('calls onEnrich when enrich button clicked', async () => {
    render(
      <BulkActionsBar
        selectedCount={3}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
        onClearSelection={mockOnClearSelection}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /enrich/i }));

    expect(mockOnEnrich).toHaveBeenCalled();
  });

  test('displays clear selection button', () => {
    render(
      <BulkActionsBar
        selectedCount={3}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
        onClearSelection={mockOnClearSelection}
      />
    );

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  test('calls onClearSelection when clear button clicked', async () => {
    render(
      <BulkActionsBar
        selectedCount={3}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
        onClearSelection={mockOnClearSelection}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(mockOnClearSelection).toHaveBeenCalled();
  });

  test('disables actions when isLoading is true', () => {
    render(
      <BulkActionsBar
        selectedCount={3}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
        onClearSelection={mockOnClearSelection}
        isLoading
      />
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /enrich/i })).toBeDisabled();
  });
});
