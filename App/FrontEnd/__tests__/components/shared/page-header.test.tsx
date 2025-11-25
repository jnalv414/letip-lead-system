import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageHeader } from '@/components/shared/page-header';

describe('PageHeader', () => {
  test('renders title correctly', () => {
    render(<PageHeader title="Leads" />);
    expect(screen.getByRole('heading', { name: 'Leads' })).toBeInTheDocument();
  });

  test('renders subtitle when provided', () => {
    render(<PageHeader title="Leads" subtitle="Manage your business leads" />);
    expect(screen.getByText('Manage your business leads')).toBeInTheDocument();
  });

  test('renders action button when provided', async () => {
    const handleClick = jest.fn();
    render(
      <PageHeader
        title="Leads"
        action={{ label: 'Add Lead', onClick: handleClick }}
      />
    );

    const button = screen.getByRole('button', { name: 'Add Lead' });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders breadcrumbs when provided', () => {
    render(
      <PageHeader
        title="Business Details"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Leads', href: '/leads' },
          { label: 'Business Details' },
        ]}
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Leads')).toBeInTheDocument();
  });
});
