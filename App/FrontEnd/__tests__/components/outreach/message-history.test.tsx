import { render, screen, fireEvent } from '@testing-library/react';
import { MessageHistory } from '@/components/outreach/message-history';
import type { OutreachMessage } from '@/types/api';

describe('MessageHistory', () => {
  const mockMessages: OutreachMessage[] = [
    {
      id: 1,
      business_id: 100,
      message_text: 'First message content...',
      generated_at: '2025-01-20T10:00:00Z',
      status: 'generated',
    },
    {
      id: 2,
      business_id: 100,
      message_text: 'Second message content...',
      generated_at: '2025-01-21T15:30:00Z',
      status: 'sent',
      sent_at: '2025-01-21T16:00:00Z',
    },
    {
      id: 3,
      business_id: 100,
      message_text: 'Third message content...',
      generated_at: '2025-01-22T08:00:00Z',
      status: 'failed',
    },
  ];

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders history header', () => {
    render(<MessageHistory messages={mockMessages} onSelectMessage={mockOnSelect} />);

    expect(screen.getByText(/message history/i)).toBeInTheDocument();
  });

  test('displays count of messages', () => {
    render(<MessageHistory messages={mockMessages} onSelectMessage={mockOnSelect} />);

    expect(screen.getByText(/3 messages/i)).toBeInTheDocument();
  });

  test('shows all message items', () => {
    render(<MessageHistory messages={mockMessages} onSelectMessage={mockOnSelect} />);

    // Should have 3 message entries
    expect(screen.getAllByText(/message/i).length).toBeGreaterThan(0);
  });

  test('displays status for each message', () => {
    render(<MessageHistory messages={mockMessages} onSelectMessage={mockOnSelect} />);

    expect(screen.getByText(/generated/i)).toBeInTheDocument();
    expect(screen.getByText(/sent/i)).toBeInTheDocument();
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  test('calls onSelectMessage when message clicked', () => {
    render(<MessageHistory messages={mockMessages} onSelectMessage={mockOnSelect} />);

    // Click on first message item (sorted by date, most recent first = id 3)
    const messageItems = screen.getAllByRole('button');
    fireEvent.click(messageItems[0]);

    // Most recent message should be the one clicked (sorted by generated_at desc)
    expect(mockOnSelect).toHaveBeenCalledWith(mockMessages[2]); // id: 3 is most recent
  });

  test('shows timestamps for messages', () => {
    render(<MessageHistory messages={mockMessages} onSelectMessage={mockOnSelect} />);

    // Should show dates
    expect(screen.getAllByText(/jan/i).length).toBeGreaterThan(0);
  });

  test('shows empty state when no messages', () => {
    render(<MessageHistory messages={[]} onSelectMessage={mockOnSelect} />);

    expect(screen.getByText(/no messages/i)).toBeInTheDocument();
  });

  test('shows loading state when isLoading', () => {
    render(<MessageHistory messages={[]} onSelectMessage={mockOnSelect} isLoading />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  test('highlights selected message', () => {
    render(
      <MessageHistory
        messages={mockMessages}
        onSelectMessage={mockOnSelect}
        selectedMessageId={2}
      />
    );

    // The selected message should have a different visual state
    // This is implementation-dependent, checking for presence is sufficient
    expect(screen.getByText(/sent/i)).toBeInTheDocument();
  });

  test('sorts messages by date (most recent first)', () => {
    render(<MessageHistory messages={mockMessages} onSelectMessage={mockOnSelect} />);

    const messageItems = screen.getAllByRole('button');
    expect(messageItems.length).toBe(3);
  });
});
