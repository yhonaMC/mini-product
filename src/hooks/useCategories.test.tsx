import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useCategories } from './useCategories';
import { createQueryHarness, jsonResponse } from './useProducts.testing';

let harness: ReturnType<typeof createQueryHarness>;
let fetchMock: jest.SpyInstance<
  ReturnType<typeof fetch>,
  Parameters<typeof fetch>
>;

beforeEach(() => {
  harness = createQueryHarness();
  fetchMock = jest.spyOn(globalThis, 'fetch');
});
afterEach(() => {
  harness.client.clear();
  jest.restoreAllMocks();
});

test('loads category objects from the API', async () => {
  const categories = [
    {
      slug: 'beauty',
      name: 'Beauty',
      url: 'https://dummyjson.com/products/category/beauty',
    },
  ];
  fetchMock.mockResolvedValue(jsonResponse(categories));
  const { result } = renderHook(useCategories, { wrapper: harness.wrapper });
  await waitFor(() => expect(result.current.categories).toEqual(categories));
  expect(fetchMock).toHaveBeenCalledWith(
    'https://dummyjson.com/products/categories',
    expect.any(Object),
  );
});

test('exposes failures and retries category loading', async () => {
  fetchMock
    .mockRejectedValueOnce(new TypeError('offline'))
    .mockResolvedValueOnce(jsonResponse([]));
  const { result } = renderHook(useCategories, { wrapper: harness.wrapper });
  await waitFor(() => expect(result.current.error?.name).toBe('NetworkError'));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.error).toBeNull());
  expect(result.current.isLoading).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('cancels category loading on unmount', () => {
  fetchMock.mockImplementation(() => new Promise(() => {}));
  const { unmount } = renderHook(useCategories, { wrapper: harness.wrapper });
  const signal = fetchMock.mock.calls[0]?.[1]?.signal;
  unmount();
  expect(signal?.aborted).toBe(true);
});
