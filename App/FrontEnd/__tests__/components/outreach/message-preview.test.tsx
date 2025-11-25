import { render, screen, fireEvent } from '@testing-library/react';
import { MessagePreview } from '@/components/outreach/message-preview';
import type { OutreachMessage } from '@/types/api';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});

describe('MessagePreview', () => {
  const mockMessage: OutreachMessage = {
    id: 1,
    business_id: 100,
    message_text: `Subject: Business Networking Opportunity

Dear Business Owner,

I hope this message finds you well. I'm reaching out from Le Tip of Western Monmouth County...

Best regards,
Le Tip Member`,
    generated_at: '2025-01-20T10:00:00Z',
    status: 'generated',
  };

  test('renders preview header', () => {
    render(<MessagePreview message={mockMessage} />);

    expect(screen.getByText(/message preview/i)).toBeInTheDocument();
  });

  test('displays message text', () => {
    render(<MessagePreview message={mockMessage} />);

    expect(screen.getByText(/business networking opportunity/i)).toBeInTheDocument();
  });

  test('shows copy button', () => {
    render(<MessagePreview message={mockMessage} />);

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  test('copies message text when copy button clicked', async () => {
    render(<MessagePreview message={mockMessage} />);

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockMessage.message_text);
  });

  test('shows success feedback after copy', async () => {
    render(<MessagePreview message={mockMessage} />);

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  test('displays message status badge', () => {
    render(<MessagePreview message={mockMessage} />);

    // Look for the status badge specifically
    expect(screen.getAllByText(/generated/i).length).toBeGreaterThan(0);
  });

  test('shows sent status for sent messages', () => {
    const sentMessage = { ...mockMessage, status: 'sent' as const, sent_at: '2025-01-21T10:00:00Z' };
    render(<MessagePreview message={sentMessage} />);

    expect(screen.getByText(/sent/i)).toBeInTheDocument();
  });

  test('displays generation timestamp', () => {
    render(<MessagePreview message={mockMessage} />);

    expect(screen.getByText(/jan/i)).toBeInTheDocument();
  });

  test('shows empty state when no message', () => {
    render(<MessagePreview message={null} />);

    expect(screen.getByText(/no message/i)).toBeInTheDocument();
  });

  test('shows loading state when isLoading', () => {
    render(<MessagePreview message={null} isLoading />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  test('displays formatted message with line breaks', () => {
    render(<MessagePreview message={mockMessage} />);

    // The message should contain the subject line and body
    expect(screen.getByText(/dear business owner/i)).toBeInTheDocument();
    expect(screen.getByText(/le tip member/i)).toBeInTheDocument();
  });
});
