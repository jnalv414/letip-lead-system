import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessDetailCard } from '@/components/enrichment/business-detail-card';
import type { Business } from '@/types/api';

describe('BusinessDetailCard', () => {
  const mockOnEnrich = jest.fn();

  const enrichedBusiness: Business = {
    id: 100,
    name: 'Acme Corporation',
    city: 'Freehold',
    state: 'NJ',
    phone: '732-555-0100',
    website: 'https://acme.com',
    industry: 'Manufacturing',
    employee_count: 50,
    year_founded: 2010,
    enrichment_status: 'enriched',
    source: 'google_maps',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-20T10:00:00Z',
  };

  const pendingBusiness: Business = {
    id: 101,
    name: 'Best Plumbing',
    city: 'Marlboro',
    enrichment_status: 'pending',
    source: 'google_maps',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders business name', () => {
    render(
      <BusinessDetailCard
        business={enrichedBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
  });

  test('shows enriched status badge for enriched business', () => {
    render(
      <BusinessDetailCard
        business={enrichedBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByText(/enriched/i)).toBeInTheDocument();
  });

  test('shows pending status badge for pending business', () => {
    render(
      <BusinessDetailCard
        business={pendingBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  test('shows enrich button for pending business', () => {
    render(
      <BusinessDetailCard
        business={pendingBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByRole('button', { name: /enrich/i })).toBeInTheDocument();
  });

  test('hides enrich button for enriched business', () => {
    render(
      <BusinessDetailCard
        business={enrichedBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.queryByRole('button', { name: /enrich/i })).not.toBeInTheDocument();
  });

  test('calls onEnrich when button clicked', async () => {
    render(
      <BusinessDetailCard
        business={pendingBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /enrich/i }));

    expect(mockOnEnrich).toHaveBeenCalledWith(101);
  });

  test('shows industry when available', () => {
    render(
      <BusinessDetailCard
        business={enrichedBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByText(/manufacturing/i)).toBeInTheDocument();
  });

  test('shows employee count when available', () => {
    render(
      <BusinessDetailCard
        business={enrichedBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  test('shows year founded when available', () => {
    render(
      <BusinessDetailCard
        business={enrichedBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByText(/2010/)).toBeInTheDocument();
  });

  test('shows website link when available', () => {
    render(
      <BusinessDetailCard
        business={enrichedBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={false}
      />
    );

    expect(screen.getByRole('link', { name: /acme\.com/i })).toBeInTheDocument();
  });

  test('disables enrich button when isEnriching', () => {
    render(
      <BusinessDetailCard
        business={pendingBusiness}
        onEnrich={mockOnEnrich}
        isEnriching={true}
      />
    );

    expect(screen.getByRole('button', { name: /enrich/i })).toBeDisabled();
  });
});
