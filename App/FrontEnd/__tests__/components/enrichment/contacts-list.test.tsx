import { render, screen } from '@testing-library/react';
import { ContactsList } from '@/components/enrichment/contacts-list';
import type { Contact } from '@/types/api';

describe('ContactsList', () => {
  const mockContacts: Contact[] = [
    {
      id: 1,
      business_id: 100,
      name: 'John Smith',
      title: 'CEO',
      email: 'john@acme.com',
      email_verified: true,
      phone: '732-555-0100',
      is_primary: true,
      created_at: '2025-01-20T10:00:00Z',
      updated_at: '2025-01-20T10:00:00Z',
    },
    {
      id: 2,
      business_id: 100,
      name: 'Jane Doe',
      title: 'CFO',
      email: 'jane@acme.com',
      email_verified: false,
      is_primary: false,
      created_at: '2025-01-20T10:00:00Z',
      updated_at: '2025-01-20T10:00:00Z',
    },
  ];

  test('renders contacts header', () => {
    render(<ContactsList contacts={mockContacts} />);

    expect(screen.getByText(/contacts/i)).toBeInTheDocument();
  });

  test('shows contact names', () => {
    render(<ContactsList contacts={mockContacts} />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  test('shows contact titles', () => {
    render(<ContactsList contacts={mockContacts} />);

    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByText('CFO')).toBeInTheDocument();
  });

  test('shows email addresses', () => {
    render(<ContactsList contacts={mockContacts} />);

    expect(screen.getByText('john@acme.com')).toBeInTheDocument();
    expect(screen.getByText('jane@acme.com')).toBeInTheDocument();
  });

  test('shows verified badge for verified emails', () => {
    render(<ContactsList contacts={mockContacts} />);

    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });

  test('shows primary contact indicator', () => {
    render(<ContactsList contacts={mockContacts} />);

    expect(screen.getByText(/primary/i)).toBeInTheDocument();
  });

  test('shows phone number when available', () => {
    render(<ContactsList contacts={mockContacts} />);

    expect(screen.getByText('732-555-0100')).toBeInTheDocument();
  });

  test('shows empty state when no contacts', () => {
    render(<ContactsList contacts={[]} />);

    expect(screen.getByText(/no contacts/i)).toBeInTheDocument();
  });

  test('shows loading state when isLoading', () => {
    render(<ContactsList contacts={[]} isLoading />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  test('displays count of contacts', () => {
    render(<ContactsList contacts={mockContacts} />);

    // Count may appear multiple times (in badge and phone number)
    expect(screen.getByText(/2 found/)).toBeInTheDocument();
  });
});
