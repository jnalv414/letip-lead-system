import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessList } from '@/components/leads/business-list';
import type { Business } from '@/types/api';

const mockBusinesses: Business[] = [
  {
    id: 1,
    name: 'Acme Corporation',
    city: 'Freehold',
    state: 'NJ',
    enrichment_status: 'enriched',
    source: 'google_maps',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    _count: { contacts: 3 },
  },
  {
    id: 2,
    name: 'Tech Solutions LLC',
    city: 'Marlboro',
    state: 'NJ',
    enrichment_status: 'pending',
    source: 'manual',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-21T15:30:00Z',
    _count: { contacts: 0 },
  },
  {
    id: 3,
    name: 'Global Enterprises',
    city: 'Manalapan',
    state: 'NJ',
    enrichment_status: 'failed',
    source: 'google_maps',
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-22T15:30:00Z',
    _count: { contacts: 1 },
  },
];

describe('BusinessList', () => {
  test('renders all businesses', () => {
    render(<BusinessList businesses={mockBusinesses} />);

    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('Tech Solutions LLC')).toBeInTheDocument();
    expect(screen.getByText('Global Enterprises')).toBeInTheDocument();
  });

  test('renders empty state when no businesses', () => {
    render(<BusinessList businesses={[]} />);

    expect(screen.getByText(/no leads found/i)).toBeInTheDocument();
  });

  test('renders loading skeleton when isLoading is true', () => {
    render(<BusinessList businesses={[]} isLoading />);

    expect(screen.getByTestId('business-list-skeleton')).toBeInTheDocument();
  });

  test('calls onBusinessClick when a business is clicked', async () => {
    const handleClick = jest.fn();
    render(<BusinessList businesses={mockBusinesses} onBusinessClick={handleClick} />);

    await userEvent.click(screen.getByText('Acme Corporation'));

    expect(handleClick).toHaveBeenCalledWith(mockBusinesses[0]);
  });

  test('renders in grid view by default', () => {
    const { container } = render(<BusinessList businesses={mockBusinesses} />);

    expect(container.querySelector('[data-view="grid"]')).toBeInTheDocument();
  });

  test('renders in table view when viewMode is table', () => {
    const { container } = render(
      <BusinessList businesses={mockBusinesses} viewMode="table" />
    );

    expect(container.querySelector('[data-view="table"]')).toBeInTheDocument();
  });

  test('displays total count of businesses', () => {
    render(<BusinessList businesses={mockBusinesses} totalCount={100} />);

    expect(screen.getByText(/100/)).toBeInTheDocument();
  });
});
