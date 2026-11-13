import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { useFavoritesStore } from '../../store/favoritesStore';
import { makeProduct } from '../../storage/testing/productFixture';
import {
  createQueryHarness,
  jsonResponse,
} from '../../hooks/useProducts.testing';
import { ProductsScreen } from './ProductsScreen';

jest.mock('react-native-mmkv', () => require('../../storage/testing/mmkvMock'));
jest.mock('../../hooks/useOpenProduct', () => ({
  useOpenProduct: () => mockOpenProduct,
}));
const mockOpenProduct = jest.fn();
const category = {
  slug: 'beauty',
  name: 'Beauty',
  url: 'https://dummyjson.com/products/category/beauty',
};
const productPage = (ids: number[], skip = 0, total = ids.length) =>
  jsonResponse({
    products: ids.map(id => makeProduct(id)),
    skip,
    total,
    limit: 20,
  });
let harness: ReturnType<typeof createQueryHarness>;
let fetchMock: jest.SpyInstance<
  ReturnType<typeof fetch>,
  Parameters<typeof fetch>
>;

beforeEach(() => {
  jest.useFakeTimers();
  harness = createQueryHarness();
  fetchMock = jest.spyOn(globalThis, 'fetch');
  mockOpenProduct.mockClear();
  useFavoritesStore.setState({ productsById: {}, storageError: null });
});
afterEach(() => {
  harness.client.clear();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function renderScreen() {
  return render(
    <QueryClientProvider client={harness.client}>
      <ThemeProvider>
        <ProductsScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

test('renders real results, searches after debounce and updates the favorite indicator reactively', async () => {
  fetchMock.mockImplementation(async input => {
    const url = String(input);
    return url.endsWith('/categories')
      ? jsonResponse([category])
      : url.includes('/search?')
      ? productPage([7])
      : productPage([1]);
  });
  renderScreen();
  expect(screen.getByLabelText('Cargando productos')).toBeOnTheScreen();
  await waitFor(() => expect(screen.getByText('Producto 1')).toBeOnTheScreen());
  fireEvent.changeText(screen.getByLabelText('Buscar productos'), 'café');
  act(() => jest.advanceTimersByTime(299));
  expect(
    fetchMock.mock.calls.some(([url]) => String(url).includes('/search?')),
  ).toBe(false);
  act(() => jest.advanceTimersByTime(1));
  await waitFor(() => expect(screen.getByText('Producto 7')).toBeOnTheScreen());
  expect(screen.queryByText('Producto 1')).toBeNull();

  fireEvent.press(
    screen.getByRole('button', { name: 'Añadir Producto 7 a favoritos' }),
  );
  expect(
    screen.getByRole('button', {
      name: 'Quitar Producto 7 de favoritos',
      selected: true,
    }),
  ).toBeOnTheScreen();
  expect(useFavoritesStore.getState().productsById['7']).toEqual(
    makeProduct(7),
  );
  act(() => useFavoritesStore.getState().remove(7));
  expect(
    screen.getByRole('button', {
      name: 'Añadir Producto 7 a favoritos',
      selected: false,
    }),
  ).toBeOnTheScreen();
  fireEvent.press(
    screen.getByRole('button', { name: 'Ver detalle de Producto 7' }),
  );
  expect(mockOpenProduct).toHaveBeenCalledWith(7);
});

test('selecting an API category clears pending search immediately', async () => {
  fetchMock.mockImplementation(async input =>
    String(input).endsWith('/categories')
      ? jsonResponse([category])
      : productPage([1]),
  );
  renderScreen();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Categoría Beauty' }),
    ).toBeOnTheScreen(),
  );
  fireEvent.changeText(screen.getByLabelText('Buscar productos'), 'pending');
  fireEvent.press(screen.getByRole('button', { name: 'Categoría Beauty' }));
  expect(screen.getByLabelText('Buscar productos')).toHaveProp('value', '');
  expect(
    screen.getByRole('button', { name: 'Categoría Beauty', selected: true }),
  ).toBeOnTheScreen();
  act(() => jest.advanceTimersByTime(500));
  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/products/category/beauty?'),
      expect.any(Object),
    ),
  );
  expect(
    fetchMock.mock.calls.some(([url]) => String(url).includes('/search?')),
  ).toBe(false);
});

test('shows an initial error and recovers to an empty state after retry', async () => {
  let failProducts = true;
  fetchMock.mockImplementation(async input => {
    if (String(input).endsWith('/categories')) {
      return jsonResponse([]);
    }
    if (failProducts) {
      throw new TypeError('offline');
    }
    return productPage([]);
  });
  renderScreen();
  await waitFor(() =>
    expect(screen.getByText('No pudimos cargar esta página')).toBeOnTheScreen(),
  );
  expect(screen.getByText(/No se pudo conectar/)).toBeOnTheScreen();
  failProducts = false;
  fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
  await waitFor(() =>
    expect(screen.getByText('No encontramos productos')).toBeOnTheScreen(),
  );
});

test('keeps loaded rows on a page error and retries the same offset from the footer', async () => {
  let failNext = true;
  fetchMock.mockImplementation(async input => {
    const url = String(input);
    if (url.endsWith('/categories')) {
      return jsonResponse([]);
    }
    if (url.endsWith('skip=0')) {
      return productPage([1, 2], 0, 3);
    }
    if (failNext) {
      throw new TypeError('offline');
    }
    return productPage([3], 2, 3);
  });
  renderScreen();
  await waitFor(() => expect(screen.getByText('Producto 1')).toBeOnTheScreen());
  fireEvent(screen.getByTestId('products-list'), 'onEndReached');
  await waitFor(() =>
    expect(
      screen.getByText('No pudimos cargar más productos'),
    ).toBeOnTheScreen(),
  );
  expect(screen.getByText('Producto 1')).toBeOnTheScreen();
  failNext = false;
  fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
  await waitFor(() => expect(screen.getByText('Producto 3')).toBeOnTheScreen());
  expect(screen.getByText('Llegaste al final')).toBeOnTheScreen();
});

test('allows retrying category errors independently of the product list', async () => {
  let failCategories = true;
  fetchMock.mockImplementation(async input => {
    if (String(input).endsWith('/categories')) {
      if (failCategories) {
        throw new TypeError('offline');
      }
      return jsonResponse([category]);
    }
    return productPage([1]);
  });
  renderScreen();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Reintentar categorías' }),
    ).toBeOnTheScreen(),
  );
  expect(screen.getByText('Producto 1')).toBeOnTheScreen();
  failCategories = false;
  fireEvent.press(
    screen.getByRole('button', { name: 'Reintentar categorías' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Categoría Beauty' }),
    ).toBeOnTheScreen(),
  );
});
