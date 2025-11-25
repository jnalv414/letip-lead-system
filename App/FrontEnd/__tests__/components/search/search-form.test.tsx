import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from '@/components/search/search-form';

describe('SearchForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders location input', () => {
    render(<SearchForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
  });

  test('renders business type input', () => {
    render(<SearchForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/business type/i)).toBeInTheDocument();
  });

  test('renders radius selector', () => {
    render(<SearchForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/radius/i)).toBeInTheDocument();
  });

  test('renders max results input', () => {
    render(<SearchForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/max results/i)).toBeInTheDocument();
  });

  test('renders search button', () => {
    render(<SearchForm onSubmit={mockOnSubmit} />);

    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  test('submits form with entered values', async () => {
    render(<SearchForm onSubmit={mockOnSubmit} />);

    await userEvent.type(screen.getByLabelText(/location/i), 'Freehold, NJ');
    await userEvent.type(screen.getByLabelText(/business type/i), 'restaurant');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'Freehold, NJ',
        businessType: 'restaurant',
      })
    );
  });

  test('disables form when isLoading is true', () => {
    render(<SearchForm onSubmit={mockOnSubmit} isLoading />);

    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled();
    expect(screen.getByLabelText(/location/i)).toBeDisabled();
  });

  test('shows default radius value', () => {
    render(<SearchForm onSubmit={mockOnSubmit} />);

    // Default radius is typically 5 miles
    expect(screen.getByLabelText(/radius/i)).toHaveValue('5');
  });

  test('shows default max results value', () => {
    render(<SearchForm onSubmit={mockOnSubmit} />);

    // Default max results is typically 50
    expect(screen.getByLabelText(/max results/i)).toHaveValue(50);
  });

  test('validates required location field', async () => {
    render(<SearchForm onSubmit={mockOnSubmit} />);

    // Try to submit without location
    await userEvent.type(screen.getByLabelText(/business type/i), 'restaurant');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    // Should not submit without location
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
