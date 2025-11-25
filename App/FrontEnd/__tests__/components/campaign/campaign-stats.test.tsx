import { render, screen } from '@testing-library/react';
import { CampaignStats } from '@/components/campaign/campaign-stats';

describe('CampaignStats', () => {
  const mockStats = {
    totalMessages: 150,
    sentMessages: 85,
    pendingMessages: 45,
    failedMessages: 20,
    responseRate: 23.5,
  };

  test('renders campaign stats header', () => {
    render(<CampaignStats stats={mockStats} />);

    expect(screen.getByText(/campaign overview/i)).toBeInTheDocument();
  });

  test('displays total messages count', () => {
    render(<CampaignStats stats={mockStats} />);

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText(/total/i)).toBeInTheDocument();
  });

  test('displays sent messages count', () => {
    render(<CampaignStats stats={mockStats} />);

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText(/sent/i)).toBeInTheDocument();
  });

  test('displays pending messages count', () => {
    render(<CampaignStats stats={mockStats} />);

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  test('displays failed messages count', () => {
    render(<CampaignStats stats={mockStats} />);

    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  test('displays response rate percentage', () => {
    render(<CampaignStats stats={mockStats} />);

    expect(screen.getByText(/23.5/)).toBeInTheDocument();
    expect(screen.getByText(/response rate/i)).toBeInTheDocument();
  });

  test('shows loading state when isLoading', () => {
    render(<CampaignStats stats={mockStats} isLoading />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  test('displays zero counts correctly', () => {
    const zeroStats = {
      totalMessages: 0,
      sentMessages: 0,
      pendingMessages: 0,
      failedMessages: 0,
      responseRate: 0,
    };
    render(<CampaignStats stats={zeroStats} />);

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
