import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeProduct } from '../storage/testing/productFixture';
import { PRODUCTS_PAGE_SIZE, useProducts } from './useProducts';
import { createQueryHarness, jsonResponse } from './useProducts.testing';

let harness: ReturnType<typeof createQueryHarness>;
let fetchMock: jest.SpyInstance<
  ReturnType<typeof fetch>,
  Parameters<typeof fetch>
>;
const firstProducts = Array.from({ length: PRODUCTS_PAGE_SIZE }, (_, index) =>
  makeProduct(index + 1),
);
const page = (ids: number[], skip: number, total: number) =>
  jsonResponse({
    products: ids.map(id => makeProduct(id)),
    skip,
    total,
    limit: PRODUCTS_PAGE_SIZE,
  });

beforeEach(() => {
  jest.useFakeTimers();
  harness = createQueryHarness();
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  harness.client.clear();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('requests the next offset, deduplicates products and stops at the total', async () => {
  fetchMock
    .mockResolvedValueOnce(
      jsonResponse({
        products: firstProducts,
        skip: 0,
        total: 21,
        limit: PRODUCTS_PAGE_SIZE,
      }),
    )
    .mockResolvedValueOnce(page([20, 21], 20, 22));
  const { result } = renderHook(useProducts, { wrapper: harness.wrapper });
  await waitFor(() => expect(result.current.products).toHaveLength(20));
  act(() => {
    result.current.loadMore();
    result.current.loadMore();
  });
  await waitFor(() => expect(result.current.products).toHaveLength(21));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenLastCalledWith(
    `https://dummyjson.com/products?limit=${PRODUCTS_PAGE_SIZE}&skip=20`,
    expect.any(Object),
  );
  expect(result.current.hasNextPage).toBe(false);
  act(() => result.current.loadMore());
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test.each([{ ids: [] }, { ids: [1, 2] }])(
  'stops when a server returns $ids despite a larger total',
  async ({ ids }) => {
    fetchMock
      .mockResolvedValueOnce(page([1, 2], 0, 100))
      .mockResolvedValueOnce(page(ids, 2, 100));
    const { result } = renderHook(useProducts, { wrapper: harness.wrapper });
    await waitFor(() => expect(result.current.products).toHaveLength(2));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
    expect(result.current.products.map(product => product.id)).toEqual([1, 2]);
    act(() => result.current.loadMore());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  },
);

test('debounces returning to the same cached search after leaving its mode', async () => {
  fetchMock.mockResolvedValue(page([1], 0, 1));
  const { result } = renderHook(useProducts, { wrapper: harness.wrapper });
  await waitFor(() => expect(result.current.products).toHaveLength(1));
  act(() => result.current.setSearchText('café'));
  act(() => jest.advanceTimersByTime(300));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  act(() => result.current.selectCategory('beauty'));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  act(() => result.current.setSearchText('café'));
  expect(result.current.products).toEqual([]);
  act(() => jest.advanceTimersByTime(299));
  expect(result.current.isLoading).toBe(true);
  act(() => jest.advanceTimersByTime(1));
  expect(result.current.products).toHaveLength(1);
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

test('debounces search, drops intermediate requests and clears category immediately', async () => {
  fetchMock.mockResolvedValue(page([1], 0, 1));
  const { result } = renderHook(useProducts, { wrapper: harness.wrapper });
  await waitFor(() => expect(result.current.products).toHaveLength(1));
  act(() => result.current.selectCategory('beauty'));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  act(() => result.current.setSearchText('ca'));
  expect(result.current.selectedCategory).toBeNull();
  expect(result.current.products).toEqual([]);
  act(() => jest.advanceTimersByTime(200));
  act(() => result.current.setSearchText('café'));
  act(() => jest.advanceTimersByTime(299));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  act(() => jest.advanceTimersByTime(1));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(fetchMock).toHaveBeenLastCalledWith(
    expect.stringContaining('/products/search?q=caf%C3%A9&'),
    expect.any(Object),
  );
});

test('selecting a category cancels a pending search debounce and clears the input immediately', async () => {
  fetchMock.mockResolvedValue(page([1], 0, 1));
  const { result } = renderHook(useProducts, { wrapper: harness.wrapper });
  await waitFor(() => expect(result.current.products).toHaveLength(1));
  act(() => result.current.setSearchText('never send this'));
  act(() => jest.advanceTimersByTime(100));
  act(() => result.current.selectCategory('fragrances'));
  expect(result.current.searchText).toBe('');
  expect(result.current.selectedCategory).toBe('fragrances');
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  act(() => jest.advanceTimersByTime(500));
  expect(
    fetchMock.mock.calls.every(([url]) => !String(url).includes('/search')),
  ).toBe(true);
  expect(fetchMock).toHaveBeenLastCalledWith(
    expect.stringContaining('/products/category/fragrances?'),
    expect.any(Object),
  );
});

test('retries an initial failure and exposes the recovered products', async () => {
  fetchMock
    .mockRejectedValueOnce(new TypeError('offline'))
    .mockResolvedValueOnce(page([9], 0, 1));
  const { result } = renderHook(useProducts, { wrapper: harness.wrapper });
  await waitFor(() => expect(result.current.error?.name).toBe('NetworkError'));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.products[0]?.id).toBe(9));
  expect(result.current.error).toBeNull();
});

test('retries the failed next page without losing the first page or auto retrying on scroll', async () => {
  fetchMock
    .mockResolvedValueOnce(page([1, 2], 0, 3))
    .mockRejectedValueOnce(new TypeError('offline'))
    .mockResolvedValueOnce(page([3], 2, 3));
  const { result } = renderHook(useProducts, { wrapper: harness.wrapper });
  await waitFor(() => expect(result.current.products).toHaveLength(2));
  act(() => result.current.loadMore());
  await waitFor(() =>
    expect(result.current.nextPageError?.name).toBe('NetworkError'),
  );
  expect(result.current.products).toHaveLength(2);
  act(() => result.current.loadMore());
  expect(fetchMock).toHaveBeenCalledTimes(2);
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.products).toHaveLength(3));
  expect(fetchMock).toHaveBeenLastCalledWith(
    expect.stringContaining('skip=2'),
    expect.any(Object),
  );
  expect(result.current.nextPageError).toBeNull();
});

test('aborts an obsolete request and ignores a late response after switching categories', async () => {
  let resolveOld: ((response: Response) => void) | undefined;
  fetchMock
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveOld = resolve;
        }),
    )
    .mockResolvedValueOnce(page([2], 0, 1));
  const { result } = renderHook(useProducts, { wrapper: harness.wrapper });
  const oldSignal = fetchMock.mock.calls[0]?.[1]?.signal;
  act(() => result.current.selectCategory('beauty'));
  await waitFor(() => expect(result.current.products[0]?.id).toBe(2));
  expect(oldSignal?.aborted).toBe(true);
  await act(async () => {
    resolveOld?.(page([99], 0, 1));
  });
  expect(result.current.products.map(product => product.id)).toEqual([2]);
});

test('aborts the active request when the hook unmounts', () => {
  fetchMock.mockImplementation(() => new Promise(() => {}));
  const { unmount } = renderHook(useProducts, { wrapper: harness.wrapper });
  const signal = fetchMock.mock.calls[0]?.[1]?.signal;
  expect(signal?.aborted).toBe(false);
  unmount();
  expect(signal?.aborted).toBe(true);
});

test('reuses cached category data when returning to a filter', async () => {
  fetchMock.mockResolvedValue(page([1], 0, 1));
  const { result } = renderHook(useProducts, { wrapper: harness.wrapper });
  await waitFor(() => expect(result.current.products).toHaveLength(1));
  act(() => result.current.selectCategory('beauty'));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  act(() => result.current.selectCategory(null));
  expect(result.current.products).toHaveLength(1);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
