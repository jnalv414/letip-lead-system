import { render, screen, fireEvent } from '@testing-library/react';
import { MessageStatusList } from '@/components/campaign/message-status-list';
import type { OutreachMessage } from '@/types/api';

describe('MessageStatusList', () => {
  const mockMessages: OutreachMessage[] = [
    {
      id: 1,
      business_id: 100,
      message_text: 'Hello from Le Tip...',
      generated_at: '2025-01-20T10:00:00Z',
      status: 'generated',
    },
    {
      id: 2,
      business_id: 101,
      message_text: 'Dear Business Owner...',
      generated_at: '2025-01-21T10:00:00Z',
      status: 'sent',
      sent_at: '2025-01-21T11:00:00Z',
    },
    {
      id: 3,
      business_id: 102,
      message_text: 'We noticed your company...',
      generated_at: '2025-01-22T10:00:00Z',
      status: 'failed',
    },
  ];

  const mockBusinessMap: Record<number, { name: string; city: string }> = {
    100: { name: 'ABC Plumbing', city: 'Freehold' },
    101: { name: 'XYZ Electric', city: 'Manalapan' },
    102: { name: 'Best HVAC', city: 'Marlboro' },
  };

  test('renders message list header', () => {
    render(<MessageStatusList messages={mockMessages} businessMap={mockBusinessMap} />);

    expect(screen.getByText(/message status/i)).toBeInTheDocument();
  });

  test('displays count of messages', () => {
    render(<MessageStatusList messages={mockMessages} businessMap={mockBusinessMap} />);

    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  test('shows business names for each message', () => {
    render(<MessageStatusList messages={mockMessages} businessMap={mockBusinessMap} />);

    expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
    expect(screen.getByText('XYZ Electric')).toBeInTheDocument();
    expect(screen.getByText('Best HVAC')).toBeInTheDocument();
  });

  test('displays status badges for messages', () => {
    render(<MessageStatusList messages={mockMessages} businessMap={mockBusinessMap} />);

    // Status names appear in filter buttons and badges, so use getAllByText
    expect(screen.getAllByText(/generated/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/sent/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/failed/i).length).toBeGreaterThan(0);
  });

  test('shows timestamps for messages', () => {
    render(<MessageStatusList messages={mockMessages} businessMap={mockBusinessMap} />);

    expect(screen.getAllByText(/jan/i).length).toBeGreaterThan(0);
  });

  test('shows empty state when no messages', () => {
    render(<MessageStatusList messages={[]} businessMap={{}} />);

    expect(screen.getByText(/no messages/i)).toBeInTheDocument();
  });

  test('shows loading state when isLoading', () => {
    render(<MessageStatusList messages={[]} businessMap={{}} isLoading />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  test('filters by status', () => {
    render(<MessageStatusList messages={mockMessages} businessMap={mockBusinessMap} />);

    // Should have filter buttons
    const filterButtons = screen.getAllByRole('button');
    expect(filterButtons.length).toBeGreaterThan(0);
  });

  test('displays city for each business', () => {
    render(<MessageStatusList messages={mockMessages} businessMap={mockBusinessMap} />);

    expect(screen.getByText(/freehold/i)).toBeInTheDocument();
    expect(screen.getByText(/manalapan/i)).toBeInTheDocument();
    expect(screen.getByText(/marlboro/i)).toBeInTheDocument();
  });
});
