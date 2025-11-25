import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewLeadModal } from '@/components/leads/modals/view-lead-modal';
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
  contacts: [
    {
      id: 1,
      business_id: 1,
      name: 'John Doe',
      title: 'CEO',
      email: 'john@acme.com',
      email_verified: true,
      is_primary: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ],
  _count: {
    contacts: 1,
    outreach_messages: 2,
  },
};

describe('ViewLeadModal', () => {
  const mockOnClose = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnEnrich = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal with business details', () => {
    render(
      <ViewLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
  });

  test('displays business contact information', () => {
    render(
      <ViewLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
      />
    );

    expect(screen.getByText(/Freehold/)).toBeInTheDocument();
    expect(screen.getByText(/732-555-1234/)).toBeInTheDocument();
  });

  test('displays contacts when available', () => {
    render(
      <ViewLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/CEO/)).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', async () => {
    render(
      <ViewLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    expect(mockOnEdit).toHaveBeenCalledWith(mockBusiness);
  });

  test('calls onDelete when delete button is clicked', async () => {
    render(
      <ViewLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(mockOnDelete).toHaveBeenCalledWith(mockBusiness);
  });

  test('shows enrich button for pending businesses', async () => {
    const pendingBusiness = { ...mockBusiness, enrichment_status: 'pending' as const };
    render(
      <ViewLeadModal
        isOpen
        business={pendingBusiness}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
      />
    );

    const enrichButton = screen.getByRole('button', { name: /enrich/i });
    expect(enrichButton).toBeInTheDocument();

    await userEvent.click(enrichButton);
    expect(mockOnEnrich).toHaveBeenCalledWith(pendingBusiness);
  });

  test('calls onClose when close button is clicked', async () => {
    render(
      <ViewLeadModal
        isOpen
        business={mockBusiness}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onEnrich={mockOnEnrich}
      />
    );

    // The Close button in the footer (not the X icon)
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    await userEvent.click(closeButtons[closeButtons.length - 1]); // Get the last one (footer button)

    expect(mockOnClose).toHaveBeenCalled();
  });
});
