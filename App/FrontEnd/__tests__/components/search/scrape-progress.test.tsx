import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScrapeProgress } from '@/components/search/scrape-progress';
import type { ScrapingProgress } from '@/features/map-scraping';

describe('ScrapeProgress', () => {
  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('is not rendered when status is idle', () => {
    const progress: ScrapingProgress = {
      jobId: null,
      status: 'idle',
      progress: 0,
      found: 0,
      saved: 0,
      message: '',
    };

    const { container } = render(
      <ScrapeProgress progress={progress} onReset={mockOnReset} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('shows progress bar when scraping', () => {
    const progress: ScrapingProgress = {
      jobId: 'job-123',
      status: 'scraping',
      progress: 45,
      found: 23,
      saved: 20,
      message: 'Scraping in progress...',
    };

    render(<ScrapeProgress progress={progress} onReset={mockOnReset} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/45%/)).toBeInTheDocument();
  });

  test('shows found count during scraping', () => {
    const progress: ScrapingProgress = {
      jobId: 'job-123',
      status: 'scraping',
      progress: 50,
      found: 15,
      saved: 12,
      message: 'Scraping...',
    };

    render(<ScrapeProgress progress={progress} onReset={mockOnReset} />);

    expect(screen.getByText(/15/)).toBeInTheDocument();
    expect(screen.getByText(/found/i)).toBeInTheDocument();
  });

  test('shows success state when completed', () => {
    const progress: ScrapingProgress = {
      jobId: 'job-123',
      status: 'completed',
      progress: 100,
      found: 47,
      saved: 47,
      message: 'Scraping completed successfully',
    };

    render(<ScrapeProgress progress={progress} onReset={mockOnReset} />);

    // Status label shows "Completed"
    expect(screen.getByText('Completed')).toBeInTheDocument();
    // Found count of 47
    expect(screen.getAllByText(/47/).length).toBeGreaterThan(0);
  });

  test('shows error state when failed', () => {
    const progress: ScrapingProgress = {
      jobId: 'job-123',
      status: 'failed',
      progress: 30,
      found: 5,
      saved: 5,
      message: 'Failed to complete scraping',
    };

    render(<ScrapeProgress progress={progress} onReset={mockOnReset} />);

    // Status label shows "Failed"
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  test('shows reset button when completed', () => {
    const progress: ScrapingProgress = {
      jobId: 'job-123',
      status: 'completed',
      progress: 100,
      found: 30,
      saved: 30,
      message: 'Done',
    };

    render(<ScrapeProgress progress={progress} onReset={mockOnReset} />);

    expect(screen.getByRole('button', { name: /new search/i })).toBeInTheDocument();
  });

  test('calls onReset when reset button clicked', async () => {
    const progress: ScrapingProgress = {
      jobId: 'job-123',
      status: 'completed',
      progress: 100,
      found: 30,
      saved: 30,
      message: 'Done',
    };

    render(<ScrapeProgress progress={progress} onReset={mockOnReset} />);

    await userEvent.click(screen.getByRole('button', { name: /new search/i }));

    expect(mockOnReset).toHaveBeenCalled();
  });

  test('shows view leads button when completed with results', () => {
    const progress: ScrapingProgress = {
      jobId: 'job-123',
      status: 'completed',
      progress: 100,
      found: 30,
      saved: 30,
      message: 'Done',
    };

    render(<ScrapeProgress progress={progress} onReset={mockOnReset} />);

    expect(screen.getByRole('link', { name: /view leads/i })).toBeInTheDocument();
  });

  test('shows message text', () => {
    const progress: ScrapingProgress = {
      jobId: 'job-123',
      status: 'scraping',
      progress: 60,
      found: 25,
      saved: 22,
      message: 'Processing results...',
    };

    render(<ScrapeProgress progress={progress} onReset={mockOnReset} />);

    expect(screen.getByText('Processing results...')).toBeInTheDocument();
  });
});
