import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary, ErrorState } from '@/components/shared/error-boundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorState', () => {
  test('renders error title', () => {
    render(<ErrorState title="Something went wrong" />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('renders error message when provided', () => {
    render(
      <ErrorState
        title="Error"
        message="Failed to load businesses. Please try again."
      />
    );

    expect(screen.getByText(/Failed to load businesses/)).toBeInTheDocument();
  });

  test('renders retry button when onRetry is provided', async () => {
    const handleRetry = jest.fn();
    render(<ErrorState title="Error" onRetry={handleRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    await userEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  test('applies correct variant styling', () => {
    const { container } = render(
      <ErrorState title="Not found" variant="not-found" />
    );

    expect(container.firstChild).toHaveClass('error-state');
  });
});

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  test('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  test('renders fallback when error occurs', () => {
    render(
      <ErrorBoundary fallback={<div>Error fallback</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error fallback')).toBeInTheDocument();
  });

  test('renders default error UI when no fallback provided', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  test('calls onError callback when error occurs', () => {
    const handleError = jest.fn();

    render(
      <ErrorBoundary onError={handleError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(handleError).toHaveBeenCalled();
  });
});
