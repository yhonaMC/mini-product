import React from 'react';
import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProductDetail } from './useProductDetail';
import { makeProduct } from '../storage/testing/productFixture';
import { useFavoritesStore } from '../store/favoritesStore';

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

let queryClient: QueryClient;
let fetchMock: jest.SpyInstance<
  ReturnType<typeof fetch>,
  Parameters<typeof fetch>
>;

function Wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  useFavoritesStore.setState({ productsById: {}, storageError: null });
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  queryClient.clear();
  jest.restoreAllMocks();
});

test('does not fetch when no product has been selected', () => {
  const { result } = renderHook(() => useProductDetail(undefined), {
    wrapper: Wrapper,
  });

  expect(fetchMock).not.toHaveBeenCalled();
  expect(result.current.product).toBeUndefined();
  expect(result.current.isLoading).toBe(false);
  expect(result.current.errorMessage).toBeNull();
});

test('fetches the selected detail through HTTP with a cancellation signal', async () => {
  const product = makeProduct(27);
  fetchMock.mockResolvedValue(jsonResponse(product));
  const { result } = renderHook(() => useProductDetail(27), {
    wrapper: Wrapper,
  });

  expect(result.current.isLoading).toBe(true);
  await waitFor(() => expect(result.current.product).toEqual(product));
  expect(result.current.isLoading).toBe(false);
  expect(fetchMock).toHaveBeenCalledWith(
    'https://dummyjson.com/products/27',
    expect.objectContaining({
      signal: expect.objectContaining({ aborted: false }),
    }),
  );
});

test('cancels the underlying fetch when the detail consumer unmounts', async () => {
  fetchMock.mockImplementation(() => new Promise<Response>(() => undefined));
  const { unmount } = renderHook(() => useProductDetail(8), {
    wrapper: Wrapper,
  });
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  const requestSignal = fetchMock.mock.calls[0]?.[1]?.signal;
  expect(requestSignal?.aborted).toBe(false);

  unmount();

  await waitFor(() => expect(requestSignal?.aborted).toBe(true));
});

test('cancels an old selection and loads the newly selected product', async () => {
  const product = makeProduct(9);
  fetchMock.mockImplementationOnce(
    () => new Promise<Response>(() => undefined),
  );
  fetchMock.mockResolvedValue(jsonResponse(product));
  const { result, rerender } = renderHook(
    ({ id }: { id: number | undefined }) => useProductDetail(id),
    { wrapper: Wrapper, initialProps: { id: 8 } },
  );
  const firstSignal = fetchMock.mock.calls[0]?.[1]?.signal;

  rerender({ id: 9 });

  await waitFor(() => expect(result.current.product).toEqual(product));
  expect(firstSignal?.aborted).toBe(true);
  expect(fetchMock).toHaveBeenLastCalledWith(
    'https://dummyjson.com/products/9',
    expect.anything(),
  );
});

test('reports connection failure and recovers through an explicit retry', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('offline'));
  const product = makeProduct(5);
  const { result } = renderHook(() => useProductDetail(5), {
    wrapper: Wrapper,
  });
  await waitFor(() =>
    expect(result.current.errorMessage).toContain('Revisa tu conexión'),
  );
  expect(result.current.product).toBeUndefined();
  fetchMock.mockResolvedValue(jsonResponse(product));

  act(() => result.current.retry());

  await waitFor(() => expect(result.current.product).toEqual(product));
  expect(result.current.errorMessage).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('keeps a full saved favorite visible after a failed mandatory refresh', async () => {
  const savedProduct = makeProduct(11);
  useFavoritesStore.getState().add(savedProduct);
  fetchMock.mockRejectedValue(new TypeError('offline'));
  const { result } = renderHook(() => useProductDetail(11), {
    wrapper: Wrapper,
  });

  expect(result.current.product).toEqual(savedProduct);
  expect(result.current.isRefreshing).toBe(true);
  expect(result.current.isLoading).toBe(false);
  await waitFor(() =>
    expect(result.current.errorMessage).toContain('Revisa tu conexión'),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    'https://dummyjson.com/products/11',
    expect.anything(),
  );
  expect(result.current.product).toEqual(savedProduct);
});

test('refreshes again on entering an already cached detail and replaces saved data', async () => {
  const savedProduct = makeProduct(12);
  const updatedProduct = {
    ...savedProduct,
    price: 49,
    description: 'Descripción actualizada',
  };
  useFavoritesStore.getState().add(savedProduct);
  // Even a cache configured as fresh must refresh when the detail is entered.
  queryClient.setDefaultOptions({
    queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
  });
  fetchMock.mockResolvedValue(jsonResponse(updatedProduct));
  const first = renderHook(() => useProductDetail(12), { wrapper: Wrapper });
  await waitFor(() =>
    expect(first.result.current.product).toEqual(updatedProduct),
  );
  first.unmount();

  const revisitedProduct = { ...updatedProduct, price: 59 };
  fetchMock.mockResolvedValue(jsonResponse(revisitedProduct));
  const second = renderHook(() => useProductDetail(12), { wrapper: Wrapper });

  // The request count changes before the response and scheduled observer update.
  // Wait for the completed second refresh while this consumer is still mounted.
  await waitFor(() => {
    expect(second.result.current.product).toEqual(revisitedProduct);
    expect(second.result.current.isRefreshing).toBe(false);
  });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('uses a saved favorite even when an earlier failed query already occupies its cache key', async () => {
  await queryClient
    .fetchQuery({
      queryKey: ['product', 23],
      queryFn: () => Promise.reject(new Error('Earlier failure')),
    })
    .catch(() => undefined);
  const savedProduct = makeProduct(23);
  useFavoritesStore.getState().add(savedProduct);
  fetchMock.mockRejectedValue(new TypeError('offline'));

  const { result } = renderHook(() => useProductDetail(23), {
    wrapper: Wrapper,
  });

  expect(result.current.product).toEqual(savedProduct);
  expect(result.current.isLoading).toBe(false);
  await waitFor(() =>
    expect(result.current.errorMessage).toContain('Revisa tu conexión'),
  );
  expect(result.current.product).toEqual(savedProduct);
});
