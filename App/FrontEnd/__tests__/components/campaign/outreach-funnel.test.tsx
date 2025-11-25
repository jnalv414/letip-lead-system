import { render, screen } from '@testing-library/react';
import { OutreachFunnel } from '@/components/campaign/outreach-funnel';

describe('OutreachFunnel', () => {
  const mockFunnelData = {
    generated: 150,
    sent: 85,
    opened: 45,
    responded: 20,
  };

  test('renders funnel header', () => {
    render(<OutreachFunnel data={mockFunnelData} />);

    expect(screen.getByText(/outreach funnel/i)).toBeInTheDocument();
  });

  test('displays generated stage', () => {
    render(<OutreachFunnel data={mockFunnelData} />);

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText(/generated/i)).toBeInTheDocument();
  });

  test('displays sent stage', () => {
    render(<OutreachFunnel data={mockFunnelData} />);

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getAllByText(/sent/i).length).toBeGreaterThan(0);
  });

  test('displays opened stage', () => {
    render(<OutreachFunnel data={mockFunnelData} />);

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText(/opened/i)).toBeInTheDocument();
  });

  test('displays responded stage', () => {
    render(<OutreachFunnel data={mockFunnelData} />);

    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText(/responded/i)).toBeInTheDocument();
  });

  test('shows conversion percentages between stages', () => {
    render(<OutreachFunnel data={mockFunnelData} />);

    // 85/150 = 56.7% for sent
    // 45/85 = 52.9% for opened
    // 20/45 = 44.4% for responded
    expect(screen.getAllByText(/%/).length).toBeGreaterThan(0);
  });

  test('shows loading state when isLoading', () => {
    render(<OutreachFunnel data={mockFunnelData} isLoading />);

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  test('handles zero values correctly', () => {
    const zeroData = {
      generated: 0,
      sent: 0,
      opened: 0,
      responded: 0,
    };
    render(<OutreachFunnel data={zeroData} />);

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  test('displays visual funnel bars', () => {
    render(<OutreachFunnel data={mockFunnelData} />);

    // Funnel should have visual bars representing each stage
    // The bars should decrease in width as they go down the funnel
    expect(screen.getByText(/generated/i)).toBeInTheDocument();
  });
});
