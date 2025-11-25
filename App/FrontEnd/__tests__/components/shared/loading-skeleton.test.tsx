import { render, screen } from '@testing-library/react';
import {
  LoadingSkeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
} from '@/components/shared/loading-skeleton';

describe('LoadingSkeleton', () => {
  test('renders with default props', () => {
    render(<LoadingSkeleton />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  test('renders with custom width and height', () => {
    render(<LoadingSkeleton width="200px" height="100px" />);

    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
  });

  test('renders multiple lines when count is provided', () => {
    render(<LoadingSkeleton count={3} />);

    const skeletons = screen.getAllByTestId('loading-skeleton');
    expect(skeletons).toHaveLength(3);
  });

  test('applies rounded variant', () => {
    render(<LoadingSkeleton variant="rounded" />);

    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toHaveClass('rounded-lg');
  });

  test('applies circle variant', () => {
    render(<LoadingSkeleton variant="circle" />);

    const skeleton = screen.getByTestId('loading-skeleton');
    expect(skeleton).toHaveClass('rounded-full');
  });
});

describe('CardSkeleton', () => {
  test('renders card skeleton structure', () => {
    render(<CardSkeleton />);

    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument();
  });

  test('renders multiple card skeletons when count provided', () => {
    render(<CardSkeleton count={3} />);

    const cards = screen.getAllByTestId('card-skeleton');
    expect(cards).toHaveLength(3);
  });
});

describe('TableSkeleton', () => {
  test('renders table skeleton with specified rows', () => {
    render(<TableSkeleton rows={5} columns={4} />);

    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    // Should have 5 row skeletons
    const rows = screen.getAllByTestId('table-row-skeleton');
    expect(rows).toHaveLength(5);
  });
});

describe('ListSkeleton', () => {
  test('renders list skeleton items', () => {
    render(<ListSkeleton count={4} />);

    const items = screen.getAllByTestId('list-item-skeleton');
    expect(items).toHaveLength(4);
  });
});
