import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../theme/ThemeProvider';
import { makeProduct } from '../storage/testing/productFixture';
import { useFavoritesStore } from '../store/favoritesStore';
import { jsonResponse } from '../hooks/useProducts.testing';
import { RootNavigator } from './RootNavigator';
import { useSelectionStore } from './selectionStore';

jest.mock('react-native-mmkv', () => require('../storage/testing/mmkvMock'));

// Native gesture attachment cannot run with Reanimated's JS mock in Jest.
jest.mock(
  'react-native-gesture-handler/lib/commonjs/handlers/gestures/GestureDetector',
  () => ({
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  }),
);

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  useFavoritesStore.setState({ productsById: {}, storageError: null });
  useSelectionStore.getState().clearSelection();
  jest.spyOn(globalThis, 'fetch').mockImplementation(async input => {
    const path = String(input).replace('https://dummyjson.com', '');
    if (path === '/products/categories') {
      return jsonResponse([]);
    }
    const detail = /^\/products\/(\d+)$/.exec(path);
    return jsonResponse(
      detail
        ? makeProduct(Number(detail[1]))
        : {
            products: [makeProduct(1), makeProduct(2)],
            total: 2,
            skip: 0,
            limit: 20,
          },
    );
  });
});

afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

function renderNavigation() {
  return render(
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <QueryClientProvider client={client}>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>,
  );
}

test('opens products in the Detail tab and clears the selection when leaving it', async () => {
  renderNavigation();
  fireEvent.press(await screen.findByLabelText('Ver detalle de Producto 1'));

  await screen.findByRole('header', { name: 'Producto 1' });
  expect(
    screen.getByLabelText('Ver detalle del producto seleccionado'),
  ).toHaveProp(
    'accessibilityState',
    expect.objectContaining({ selected: true }),
  );
  expect(screen.getByLabelText('Ver productos')).toHaveProp(
    'accessibilityState',
    expect.objectContaining({ selected: false }),
  );

  fireEvent.press(screen.getByLabelText('Ver productos'));
  await waitFor(() =>
    expect(useSelectionStore.getState().productId).toBeUndefined(),
  );
  fireEvent.press(
    screen.getByLabelText('Ver detalle del producto seleccionado'),
  );
  await screen.findByRole('header', { name: 'Elige un producto' });
  expect(screen.queryByRole('header', { name: 'Producto 1' })).toBeNull();

  fireEvent.press(screen.getByLabelText('Ver productos'));
  fireEvent.press(await screen.findByLabelText('Ver detalle de Producto 2'));
  await screen.findByRole('header', { name: 'Producto 2' });
  expect(useSelectionStore.getState().productId).toBe(2);

  fireEvent.press(screen.getByLabelText('Ver favoritos guardados'));
  await waitFor(() =>
    expect(useSelectionStore.getState().productId).toBeUndefined(),
  );
  fireEvent.press(
    screen.getByLabelText('Ver detalle del producto seleccionado'),
  );
  await screen.findByRole('header', { name: 'Elige un producto' });
});

test('opens a local favorite in the Detail tab and clears it after returning to Products', async () => {
  useFavoritesStore.getState().add(makeProduct(17));
  renderNavigation();
  fireEvent.press(screen.getByLabelText('Ver favoritos guardados'));
  fireEvent.press(await screen.findByLabelText('Ver detalle de Producto 17'));

  await screen.findByRole('header', { name: 'Producto 17' });
  expect(
    screen.getByLabelText('Ver detalle del producto seleccionado'),
  ).toHaveProp(
    'accessibilityState',
    expect.objectContaining({ selected: true }),
  );
  fireEvent.press(screen.getByLabelText('Ver productos'));
  await waitFor(() =>
    expect(useSelectionStore.getState().productId).toBeUndefined(),
  );
  fireEvent.press(
    screen.getByLabelText('Ver detalle del producto seleccionado'),
  );
  await screen.findByRole('header', { name: 'Elige un producto' });
  expect(useFavoritesStore.getState().productsById['17']).toEqual(
    makeProduct(17),
  );
});
