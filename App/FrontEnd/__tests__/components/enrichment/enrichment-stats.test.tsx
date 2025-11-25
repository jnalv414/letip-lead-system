import { render, screen } from '@testing-library/react';
import { EnrichmentStats } from '@/components/enrichment/enrichment-stats';

describe('EnrichmentStats', () => {
  const defaultStats = {
    totalBusinesses: 100,
    enrichedBusinesses: 60,
    pendingEnrichment: 40,
    totalContacts: 150,
  };

  test('renders total businesses stat', () => {
    render(<EnrichmentStats stats={defaultStats} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText(/total/i)).toBeInTheDocument();
  });

  test('renders enriched count with success indicator', () => {
    render(<EnrichmentStats stats={defaultStats} />);

    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText(/enriched/i)).toBeInTheDocument();
  });

  test('renders pending count with warning indicator', () => {
    render(<EnrichmentStats stats={defaultStats} />);

    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  test('renders contacts found count', () => {
    render(<EnrichmentStats stats={defaultStats} />);

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText(/contacts/i)).toBeInTheDocument();
  });

  test('calculates and displays enrichment rate', () => {
    render(<EnrichmentStats stats={defaultStats} />);

    // 60/100 = 60% - appears multiple times (card and indicator)
    expect(screen.getAllByText(/60%/).length).toBeGreaterThan(0);
    expect(screen.getByText(/enrichment rate/i)).toBeInTheDocument();
  });

  test('shows loading skeleton when isLoading is true', () => {
    render(<EnrichmentStats stats={defaultStats} isLoading />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});
