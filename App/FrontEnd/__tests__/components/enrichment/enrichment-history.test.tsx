import { render, screen } from '@testing-library/react';
import { EnrichmentHistory } from '@/components/enrichment/enrichment-history';
import type { EnrichmentLog } from '@/types/api';

describe('EnrichmentHistory', () => {
  const mockLogs: EnrichmentLog[] = [
    {
      id: 1,
      business_id: 100,
      service: 'hunter',
      status: 'success',
      created_at: '2025-01-20T10:00:00Z',
      response_data: JSON.stringify({ emails_found: 3 }),
    },
    {
      id: 2,
      business_id: 100,
      service: 'abstract',
      status: 'success',
      created_at: '2025-01-20T10:01:00Z',
      response_data: JSON.stringify({ industry: 'Plumbing', employee_count: 15 }),
    },
    {
      id: 3,
      business_id: 101,
      service: 'hunter',
      status: 'failed',
      created_at: '2025-01-19T15:00:00Z',
      error_message: 'No domain found',
    },
  ];

  test('renders history header', () => {
    render(<EnrichmentHistory logs={mockLogs} />);

    expect(screen.getByText(/history/i)).toBeInTheDocument();
  });

  test('shows success logs with check icon', () => {
    render(<EnrichmentHistory logs={mockLogs} />);

    // Two success logs
    expect(screen.getAllByText(/success/i).length).toBeGreaterThan(0);
  });

  test('shows failed logs with error icon', () => {
    render(<EnrichmentHistory logs={mockLogs} />);

    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  test('displays service name (hunter, abstract)', () => {
    render(<EnrichmentHistory logs={mockLogs} />);

    expect(screen.getAllByText(/hunter/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/abstract/i)).toBeInTheDocument();
  });

  test('shows error message for failed logs', () => {
    render(<EnrichmentHistory logs={mockLogs} />);

    expect(screen.getByText(/no domain found/i)).toBeInTheDocument();
  });

  test('shows empty state when no logs', () => {
    render(<EnrichmentHistory logs={[]} />);

    expect(screen.getByText(/no enrichment/i)).toBeInTheDocument();
  });

  test('displays timestamps', () => {
    render(<EnrichmentHistory logs={mockLogs} />);

    // Should show dates in some format - multiple logs may have Jan dates
    expect(screen.getAllByText(/jan/i).length).toBeGreaterThan(0);
  });

  test('shows loading state when isLoading', () => {
    render(<EnrichmentHistory logs={[]} isLoading />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});
