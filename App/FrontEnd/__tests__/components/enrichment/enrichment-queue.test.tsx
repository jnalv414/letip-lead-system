import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnrichmentQueue } from '@/components/enrichment/enrichment-queue';
import type { Business } from '@/types/api';

describe('EnrichmentQueue', () => {
  const mockOnEnrich = jest.fn();

  const pendingBusinesses: Business[] = [
    {
      id: 1,
      name: 'ABC Plumbing',
      city: 'Freehold',
      enrichment_status: 'pending',
      source: 'google_maps',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'XYZ Electric',
      city: 'Marlboro',
      enrichment_status: 'pending',
      source: 'google_maps',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 3,
      name: 'Best Dental',
      city: 'Holmdel',
      enrichment_status: 'pending',
      source: 'google_maps',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders queue header with count', () => {
    render(
      <EnrichmentQueue
        businesses={pendingBusinesses}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByText(/queue/i)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  test('renders list of pending businesses', () => {
    render(
      <EnrichmentQueue
        businesses={pendingBusinesses}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
    expect(screen.getByText('XYZ Electric')).toBeInTheDocument();
    expect(screen.getByText('Best Dental')).toBeInTheDocument();
  });

  test('shows enrich button for each business', () => {
    render(
      <EnrichmentQueue
        businesses={pendingBusinesses}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    const enrichButtons = screen.getAllByRole('button', { name: /enrich/i });
    expect(enrichButtons.length).toBe(3);
  });

  test('calls onEnrich with business id when enrich button clicked', async () => {
    render(
      <EnrichmentQueue
        businesses={pendingBusinesses}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    const enrichButtons = screen.getAllByRole('button', { name: /enrich/i });
    await userEvent.click(enrichButtons[0]);

    expect(mockOnEnrich).toHaveBeenCalledWith(1);
  });

  test('disables all buttons when isEnriching is true', () => {
    render(
      <EnrichmentQueue
        businesses={pendingBusinesses}
        onEnrich={mockOnEnrich}
        isEnriching={true}
      />
    );

    const enrichButtons = screen.getAllByRole('button', { name: /enrich/i });
    enrichButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  test('shows empty state when no pending businesses', () => {
    render(
      <EnrichmentQueue businesses={[]} onEnrich={mockOnEnrich} isEnriching={false} />
    );

    expect(screen.getByText(/no pending/i)).toBeInTheDocument();
  });

  test('shows city for each business', () => {
    render(
      <EnrichmentQueue
        businesses={pendingBusinesses}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByText('Freehold')).toBeInTheDocument();
    expect(screen.getByText('Marlboro')).toBeInTheDocument();
    expect(screen.getByText('Holmdel')).toBeInTheDocument();
  });
});
