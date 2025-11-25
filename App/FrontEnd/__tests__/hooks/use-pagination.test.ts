import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/use-pagination';

describe('usePagination', () => {
  test('initializes with default values', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.itemsPerPage).toBe(20);
    expect(result.current.totalPages).toBe(5);
  });

  test('initializes with custom page and items per page', () => {
    const { result } = renderHook(() =>
      usePagination({
        totalItems: 100,
        initialPage: 3,
        initialItemsPerPage: 10,
      })
    );

    expect(result.current.currentPage).toBe(3);
    expect(result.current.itemsPerPage).toBe(10);
    expect(result.current.totalPages).toBe(10);
  });

  test('goToPage changes current page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);
  });

  test('goToPage clamps to valid range', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    act(() => {
      result.current.goToPage(0);
    });
    expect(result.current.currentPage).toBe(1);

    act(() => {
      result.current.goToPage(100);
    });
    expect(result.current.currentPage).toBe(5);
  });

  test('nextPage increments current page', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  test('nextPage does not exceed total pages', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, initialPage: 5 })
    );

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(5);
  });

  test('prevPage decrements current page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, initialPage: 3 })
    );

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  test('prevPage does not go below 1', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  test('setItemsPerPage updates items per page and recalculates total pages', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    act(() => {
      result.current.setItemsPerPage(50);
    });

    expect(result.current.itemsPerPage).toBe(50);
    expect(result.current.totalPages).toBe(2);
  });

  test('hasNextPage returns correct value', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    expect(result.current.hasNextPage).toBe(true);

    act(() => {
      result.current.goToPage(5);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  test('hasPrevPage returns correct value', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    expect(result.current.hasPrevPage).toBe(false);

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.hasPrevPage).toBe(true);
  });

  test('startIndex and endIndex are calculated correctly', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, initialItemsPerPage: 20 })
    );

    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(19);

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.startIndex).toBe(20);
    expect(result.current.endIndex).toBe(39);
  });

  test('reset returns to initial state', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, initialPage: 1, initialItemsPerPage: 20 })
    );

    act(() => {
      result.current.goToPage(3);
      result.current.setItemsPerPage(50);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.itemsPerPage).toBe(20);
  });
});
