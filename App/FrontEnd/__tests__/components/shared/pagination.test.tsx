import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '@/components/shared/pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders current page and total pages', () => {
    render(<Pagination {...defaultProps} />);

    expect(screen.getByText(/page 1 of 10/i)).toBeInTheDocument();
  });

  test('renders previous and next buttons', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  test('disables previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  test('disables next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={10} />);

    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  test('calls onPageChange with correct page when clicking next', async () => {
    const handleChange = jest.fn();
    render(<Pagination {...defaultProps} currentPage={5} onPageChange={handleChange} />);

    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(handleChange).toHaveBeenCalledWith(6);
  });

  test('calls onPageChange with correct page when clicking previous', async () => {
    const handleChange = jest.fn();
    render(<Pagination {...defaultProps} currentPage={5} onPageChange={handleChange} />);

    await userEvent.click(screen.getByRole('button', { name: /previous/i }));

    expect(handleChange).toHaveBeenCalledWith(4);
  });

  test('renders page numbers for navigation', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);

    // Page buttons have aria-label "Page X"
    expect(screen.getByRole('button', { name: /page 5/i })).toBeInTheDocument();
  });

  test('calls onPageChange when clicking a page number', async () => {
    const handleChange = jest.fn();
    render(<Pagination {...defaultProps} currentPage={5} onPageChange={handleChange} />);

    await userEvent.click(screen.getByRole('button', { name: /page 6/i }));

    expect(handleChange).toHaveBeenCalledWith(6);
  });
});
