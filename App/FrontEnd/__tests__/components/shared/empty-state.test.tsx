import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/shared/empty-state';

describe('EmptyState', () => {
  test('renders title correctly', () => {
    render(<EmptyState title="No leads found" />);

    expect(screen.getByText('No leads found')).toBeInTheDocument();
  });

  test('renders description when provided', () => {
    render(
      <EmptyState
        title="No leads found"
        description="Start by adding your first lead or import from Google Maps"
      />
    );

    expect(screen.getByText(/Start by adding your first lead/)).toBeInTheDocument();
  });

  test('renders action button when provided', async () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        title="No leads found"
        action={{ label: 'Add Lead', onClick: handleClick }}
      />
    );

    const button = screen.getByRole('button', { name: 'Add Lead' });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders icon when provided', () => {
    render(<EmptyState title="No leads found" icon="users" />);

    // Icon should be rendered (we'll check for the container)
    expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
  });

  test('applies correct variant styling', () => {
    const { container } = render(
      <EmptyState title="No results" variant="search" />
    );

    // Should have search variant class or styling
    expect(container.firstChild).toHaveClass('empty-state');
  });
});
