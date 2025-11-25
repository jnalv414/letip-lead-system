import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessCard } from '@/components/leads/business-card';
import type { Business } from '@/types/api';

const mockBusiness: Business = {
  id: 1,
  name: 'Acme Corporation',
  address: '123 Main St',
  city: 'Freehold',
  state: 'NJ',
  zip: '07728',
  phone: '732-555-1234',
  website: 'https://acme.com',
  business_type: 'retail',
  industry: 'Technology',
  employee_count: 50,
  year_founded: 2010,
  enrichment_status: 'enriched',
  source: 'google_maps',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T15:30:00Z',
  _count: {
    contacts: 3,
    outreach_messages: 2,
  },
};

describe('BusinessCard', () => {
  test('renders business name', () => {
    render(<BusinessCard business={mockBusiness} />);

    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
  });

  test('renders business location', () => {
    render(<BusinessCard business={mockBusiness} />);

    expect(screen.getByText(/Freehold/)).toBeInTheDocument();
  });

  test('renders enrichment status badge', () => {
    render(<BusinessCard business={mockBusiness} />);

    expect(screen.getByText(/enriched/i)).toBeInTheDocument();
  });

  test('renders contact count when available', () => {
    render(<BusinessCard business={mockBusiness} />);

    // Contact count should be displayed (3 contacts in mockBusiness)
    const contactElements = screen.getAllByText('3');
    expect(contactElements.length).toBeGreaterThan(0);
  });

  test('renders pending status for unenriched businesses', () => {
    const pendingBusiness = { ...mockBusiness, enrichment_status: 'pending' as const };
    render(<BusinessCard business={pendingBusiness} />);

    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  test('calls onClick when card is clicked', async () => {
    const handleClick = jest.fn();
    render(<BusinessCard business={mockBusiness} onClick={handleClick} />);

    await userEvent.click(screen.getByText('Acme Corporation'));

    expect(handleClick).toHaveBeenCalledWith(mockBusiness);
  });

  test('renders phone number when available', () => {
    render(<BusinessCard business={mockBusiness} />);

    expect(screen.getByText(/732-555-1234/)).toBeInTheDocument();
  });

  test('renders industry when available', () => {
    render(<BusinessCard business={mockBusiness} />);

    expect(screen.getByText(/Technology/)).toBeInTheDocument();
  });
});
