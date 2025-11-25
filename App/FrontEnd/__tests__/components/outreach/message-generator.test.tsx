import { render, screen, fireEvent } from '@testing-library/react';
import { MessageGenerator } from '@/components/outreach/message-generator';
import type { Business } from '@/types/api';

describe('MessageGenerator', () => {
  const mockBusiness: Business = {
    id: 1,
    name: 'ABC Plumbing',
    city: 'Freehold',
    state: 'NJ',
    enrichment_status: 'enriched',
    source: 'google_maps',
    created_at: '2025-01-20T10:00:00Z',
    updated_at: '2025-01-20T10:00:00Z',
  };

  const mockOnGenerate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders generator header with title', () => {
    render(
      <MessageGenerator
        business={mockBusiness}
        onGenerate={mockOnGenerate}
        isGenerating={false}
      />
    );

    expect(screen.getByText(/message generator/i)).toBeInTheDocument();
  });

  test('displays business name in generator', () => {
    render(
      <MessageGenerator
        business={mockBusiness}
        onGenerate={mockOnGenerate}
        isGenerating={false}
      />
    );

    expect(screen.getByText('ABC Plumbing')).toBeInTheDocument();
  });

  test('shows generate button when not generating', () => {
    render(
      <MessageGenerator
        business={mockBusiness}
        onGenerate={mockOnGenerate}
        isGenerating={false}
      />
    );

    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument();
  });

  test('calls onGenerate when generate button clicked', () => {
    render(
      <MessageGenerator
        business={mockBusiness}
        onGenerate={mockOnGenerate}
        isGenerating={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    expect(mockOnGenerate).toHaveBeenCalledWith(mockBusiness.id, false);
  });

  test('shows regenerate option checkbox', () => {
    render(
      <MessageGenerator
        business={mockBusiness}
        onGenerate={mockOnGenerate}
        isGenerating={false}
      />
    );

    expect(screen.getByLabelText(/regenerate/i)).toBeInTheDocument();
  });

  test('passes regenerate flag when checkbox checked', () => {
    render(
      <MessageGenerator
        business={mockBusiness}
        onGenerate={mockOnGenerate}
        isGenerating={false}
      />
    );

    fireEvent.click(screen.getByLabelText(/regenerate/i));
    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    expect(mockOnGenerate).toHaveBeenCalledWith(mockBusiness.id, true);
  });

  test('shows loading state when generating', () => {
    render(
      <MessageGenerator
        business={mockBusiness}
        onGenerate={mockOnGenerate}
        isGenerating={true}
      />
    );

    expect(screen.getByText(/generating/i)).toBeInTheDocument();
  });

  test('disables button when generating', () => {
    render(
      <MessageGenerator
        business={mockBusiness}
        onGenerate={mockOnGenerate}
        isGenerating={true}
      />
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('displays business location', () => {
    render(
      <MessageGenerator
        business={mockBusiness}
        onGenerate={mockOnGenerate}
        isGenerating={false}
      />
    );

    expect(screen.getByText(/freehold/i)).toBeInTheDocument();
  });
});
