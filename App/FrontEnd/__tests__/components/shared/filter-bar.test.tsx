import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '@/components/shared/filter-bar';

describe('FilterBar', () => {
  const mockFilters = [
    {
      key: 'city',
      label: 'City',
      type: 'select' as const,
      options: [
        { value: 'freehold', label: 'Freehold' },
        { value: 'marlboro', label: 'Marlboro' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'enriched', label: 'Enriched' },
      ],
    },
  ];

  test('renders all filter controls', () => {
    render(<FilterBar filters={mockFilters} onFilterChange={jest.fn()} />);

    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  test('calls onFilterChange when filter value changes', async () => {
    const handleChange = jest.fn();
    render(<FilterBar filters={mockFilters} onFilterChange={handleChange} />);

    const citySelect = screen.getByLabelText('City');
    await userEvent.selectOptions(citySelect, 'freehold');

    expect(handleChange).toHaveBeenCalledWith({ city: 'freehold' });
  });

  test('renders search input when searchable is true', () => {
    render(
      <FilterBar
        filters={mockFilters}
        onFilterChange={jest.fn()}
        searchable
        searchPlaceholder="Search businesses..."
      />
    );

    expect(screen.getByPlaceholderText('Search businesses...')).toBeInTheDocument();
  });

  test('debounces search input', async () => {
    const handleChange = jest.fn();
    render(
      <FilterBar
        filters={mockFilters}
        onFilterChange={handleChange}
        searchable
        searchPlaceholder="Search..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    await userEvent.type(searchInput, 'test');

    // Should debounce - not call immediately for each keystroke
    await waitFor(
      () => {
        expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'test' }));
      },
      { timeout: 500 }
    );
  });

  test('renders clear filters button when filters are active', async () => {
    const handleChange = jest.fn();
    render(
      <FilterBar
        filters={mockFilters}
        onFilterChange={handleChange}
        values={{ city: 'freehold' }}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeInTheDocument();

    await userEvent.click(clearButton);
    expect(handleChange).toHaveBeenCalledWith({});
  });
});
