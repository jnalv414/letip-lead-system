import { render, screen, fireEvent } from '@testing-library/react';
import { BusinessSelector } from '@/components/outreach/business-selector';
import type { Business } from '@/types/api';

describe('BusinessSelector', () => {
  const mockBusinesses: Business[] = [
    {
      id: 1,
      name: 'ABC Plumbing',
      city: 'Freehold',
      state: 'NJ',
      enrichment_status: 'enriched',
      source: 'google_maps',
      created_at: '2025-01-20T10:00:00Z',
      updated_at: '2025-01-20T10:00:00Z',
    },
    {
      id: 2,
      name: 'XYZ Electric',
      city: 'Manalapan',
      state: 'NJ',
      enrichment_status: 'enriched',
      source: 'google_maps',
      created_at: '2025-01-21T10:00:00Z',
      updated_at: '2025-01-21T10:00:00Z',
    },
    {
      id: 3,
      name: 'Pending Corp',
      city: 'Freehold',
      state: 'NJ',
      enrichment_status: 'pending',
      source: 'google_maps',
      created_at: '2025-01-22T10:00:00Z',
      updated_at: '2025-01-22T10:00:00Z',
    },
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders selector header', () => {
    render(<BusinessSelector businesses={mockBusinesses} onSelect={mockOnSelect} />);

    expect(screen.getByText(/select business/i)).toBeInTheDocument();
  });

  test('shows search input', () => {
    render(<BusinessSelector businesses={mockBusinesses} onSelect={mockOnSelect} />);

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  test('displays business names', () => {
    render(<BusinessSelector businesses={mockBusinesses} onSelect={mockOnSelect} />);

    expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
    expect(screen.getByText('XYZ Electric')).toBeInTheDocument();
  });

  test('calls onSelect when business clicked', () => {
    render(<BusinessSelector businesses={mockBusinesses} onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByText('ABC Plumbing'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockBusinesses[0]);
  });

  test('filters businesses by search query', () => {
    render(<BusinessSelector businesses={mockBusinesses} onSelect={mockOnSelect} />);

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'plumbing' },
    });

    expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
    expect(screen.queryByText('XYZ Electric')).not.toBeInTheDocument();
  });

  test('shows only enriched businesses by default', () => {
    render(<BusinessSelector businesses={mockBusinesses} onSelect={mockOnSelect} />);

    expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
    expect(screen.getByText('XYZ Electric')).toBeInTheDocument();
    expect(screen.queryByText('Pending Corp')).not.toBeInTheDocument();
  });

  test('displays city for each business', () => {
    render(<BusinessSelector businesses={mockBusinesses} onSelect={mockOnSelect} />);

    expect(screen.getAllByText(/freehold/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/manalapan/i)).toBeInTheDocument();
  });

  test('shows empty state when no businesses match', () => {
    render(<BusinessSelector businesses={mockBusinesses} onSelect={mockOnSelect} />);

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'nonexistent' },
    });

    expect(screen.getByText(/no businesses/i)).toBeInTheDocument();
  });

  test('shows loading state when isLoading', () => {
    render(<BusinessSelector businesses={[]} onSelect={mockOnSelect} isLoading />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  test('highlights selected business', () => {
    render(
      <BusinessSelector
        businesses={mockBusinesses}
        onSelect={mockOnSelect}
        selectedBusinessId={1}
      />
    );

    // Selected business should be visually distinct
    expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
  });

  test('shows count of enriched businesses', () => {
    render(<BusinessSelector businesses={mockBusinesses} onSelect={mockOnSelect} />);

    // 2 enriched businesses
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });
});
