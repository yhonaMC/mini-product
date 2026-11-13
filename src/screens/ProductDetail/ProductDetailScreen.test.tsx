import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FlatList } from 'react-native';
import { ProductDetailScreen } from './ProductDetailScreen';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { makeProduct } from '../../storage/testing/productFixture';
import { useFavoritesStore } from '../../store/favoritesStore';

let queryClient: QueryClient;
let fetchMock: jest.SpyInstance<
  ReturnType<typeof fetch>,
  Parameters<typeof fetch>
>;

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function renderDetail(productId: number | undefined) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ProductDetailScreen productId={productId} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  useFavoritesStore.setState({ productsById: {}, storageError: null });
  fetchMock = jest.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  queryClient.clear();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('waits for a measured viewport before mounting an image and reloads its native target at a new width', async () => {
  const product = makeProduct(33);
  fetchMock.mockResolvedValue(jsonResponse(product));
  renderDetail(33);
  await screen.findByRole('header', { name: 'Producto 33' });
  const carousel = screen.getByLabelText('Imágenes de Producto 33');
  expect(carousel).toHaveStyle({ height: 300 });
  expect(
    screen.queryByRole('image', { name: 'Producto 33, imagen 1 de 1' }),
  ).toBeNull();

  fireEvent(carousel, 'onLayout', {
    nativeEvent: { layout: { width: 360, height: 300, x: 0, y: 0 } },
  });
  const portraitImage = screen.getByRole('image', {
    name: 'Producto 33, imagen 1 de 1',
  });
  expect(portraitImage).toHaveProp('source', {
    uri: product.images[0],
    cache: 'immutable',
  });
  fireEvent(carousel, 'onLayout', {
    nativeEvent: { layout: { width: 720, height: 300, x: 0, y: 0 } },
  });

  expect(portraitImage).not.toBeOnTheScreen();
  const landscapeImage = screen.getByRole('image', {
    name: 'Producto 33, imagen 1 de 1',
  });
  expect(landscapeImage).not.toBe(portraitImage);
  expect(landscapeImage).toHaveProp('source', {
    uri: product.images[0],
    cache: 'immutable',
  });
  fireEvent(carousel, 'onLayout', {
    nativeEvent: { layout: { width: 720, height: 300, x: 0, y: 0 } },
  });
  expect(
    screen.getByRole('image', { name: 'Producto 33, imagen 1 de 1' }),
  ).toBe(landscapeImage);
});

test('keeps the selected page aligned to the actual carousel viewport after resizing', async () => {
  const product = {
    ...makeProduct(31),
    images: [
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
    ],
  };
  fetchMock.mockResolvedValue(jsonResponse(product));
  // The imperative scroll command is the native boundary under observation.
  const scroll = jest
    .spyOn(FlatList.prototype, 'scrollToOffset')
    .mockImplementation(() => {});
  renderDetail(31);
  await screen.findByRole('header', { name: 'Producto 31' });
  const carousel = screen.getByLabelText('Imágenes de Producto 31');
  fireEvent(carousel, 'onLayout', {
    nativeEvent: { layout: { width: 320, height: 300, x: 0, y: 0 } },
  });
  act(() => jest.advanceTimersByTime(20));
  fireEvent.press(screen.getByRole('button', { name: 'Imagen siguiente' }));
  expect(scroll).toHaveBeenLastCalledWith({ offset: 320, animated: true });

  fireEvent(carousel, 'onLayout', {
    nativeEvent: { layout: { width: 720, height: 300, x: 0, y: 0 } },
  });
  act(() => jest.advanceTimersByTime(20));

  expect(scroll).toHaveBeenLastCalledWith({ offset: 720, animated: false });
  expect(screen.getByText('Imagen 2 de 3')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Imagen anterior' })).toBeEnabled();
  expect(
    screen.getByRole('button', { name: 'Imagen siguiente' }),
  ).toBeEnabled();
  const calls = scroll.mock.calls.length;
  fireEvent(carousel, 'onLayout', {
    nativeEvent: { layout: { width: 720, height: 300, x: 0, y: 0 } },
  });
  act(() => jest.advanceTimersByTime(20));
  expect(scroll).toHaveBeenCalledTimes(calls);
  expect(screen.getByText('Imagen 2 de 3')).toBeOnTheScreen();
});

test('clamps the current page and native offset when the same product receives fewer images', async () => {
  const product = {
    ...makeProduct(32),
    images: [
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
    ],
  };
  fetchMock.mockResolvedValue(jsonResponse(product));
  const scroll = jest
    .spyOn(FlatList.prototype, 'scrollToOffset')
    .mockImplementation(() => {});
  renderDetail(32);
  await screen.findByRole('header', { name: 'Producto 32' });
  const carousel = screen.getByLabelText('Imágenes de Producto 32');
  fireEvent(carousel, 'onLayout', {
    nativeEvent: { layout: { width: 400, height: 300, x: 0, y: 0 } },
  });
  act(() => jest.advanceTimersByTime(20));
  fireEvent.press(screen.getByRole('button', { name: 'Imagen siguiente' }));
  fireEvent.press(screen.getByRole('button', { name: 'Imagen siguiente' }));
  expect(screen.getByText('Imagen 3 de 3')).toBeOnTheScreen();

  act(() =>
    queryClient.setQueryData(['product', 32], {
      ...product,
      images: product.images.slice(0, 2),
    }),
  );
  act(() => jest.advanceTimersByTime(50));
  act(() => jest.advanceTimersByTime(20));

  expect(screen.getByText('Imagen 2 de 2')).toBeOnTheScreen();
  expect(scroll).toHaveBeenLastCalledWith({ offset: 400, animated: false });
  expect(
    screen.getByRole('button', { name: 'Imagen siguiente' }),
  ).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Imagen anterior' }));
  expect(screen.getByText('Imagen 1 de 2')).toBeOnTheScreen();
  expect(scroll).toHaveBeenLastCalledWith({ offset: 0, animated: true });
});

test('invites the user to select a product without a network request', () => {
  renderDetail(undefined);

  expect(
    screen.getByRole('header', { name: 'Elige un producto' }),
  ).toBeOnTheScreen();
  expect(fetchMock).not.toHaveBeenCalled();
});

test('loads complete detail, navigates its cached carousel and toggles the real favorite store', async () => {
  const product = {
    ...makeProduct(7),
    images: ['https://example.com/one.jpg', 'https://example.com/two.jpg'],
  };
  fetchMock.mockResolvedValue(jsonResponse(product));
  renderDetail(7);

  expect(screen.getByLabelText('Cargando productos')).toBeOnTheScreen();
  expect(
    await screen.findByRole('header', { name: 'Producto 7' }),
  ).toBeOnTheScreen();
  fireEvent(screen.getByLabelText('Imágenes de Producto 7'), 'onLayout', {
    nativeEvent: { layout: { width: 360, height: 300, x: 0, y: 0 } },
  });
  expect(screen.getByText(product.description)).toBeOnTheScreen();
  expect(screen.getByText('−15 %')).toBeOnTheScreen();
  expect(
    screen.getByLabelText('Calificación 4.5 de 5 estrellas'),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Etiqueta beauty')).toBeOnTheScreen();
  expect(screen.getByLabelText('Producto 7, imagen 1 de 2')).toHaveProp(
    'source',
    { uri: product.images[0], cache: 'immutable' },
  );
  expect(
    screen.getByRole('button', { name: 'Imagen anterior' }),
  ).toBeDisabled();

  fireEvent.press(screen.getByRole('button', { name: 'Imagen siguiente' }));
  expect(screen.getByText('Imagen 2 de 2')).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: 'Imagen siguiente' }),
  ).toBeDisabled();

  fireEvent.press(
    screen.getByRole('button', { name: 'Añadir Producto 7 a favoritos' }),
  );
  expect(
    screen.getByRole('button', {
      name: 'Quitar Producto 7 de favoritos',
      selected: true,
    }),
  ).toBeOnTheScreen();
  expect(useFavoritesStore.getState().productsById['7']).toEqual(product);

  // Removing from a different consumer must immediately update the detail control.
  act(() => useFavoritesStore.getState().remove(7));
  expect(
    screen.getByRole('button', {
      name: 'Añadir Producto 7 a favoritos',
      selected: false,
    }),
  ).toBeOnTheScreen();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('shows a visible request error and loads the product when retry is pressed', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('offline'));
  renderDetail(3);
  expect(
    await screen.findByText(
      'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.',
    ),
  ).toBeOnTheScreen();
  fetchMock.mockResolvedValue(jsonResponse(makeProduct(3)));

  fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));

  expect(
    await screen.findByRole('header', { name: 'Producto 3' }),
  ).toBeOnTheScreen();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('retains offline favorite detail with a visible refresh error and can retry', async () => {
  const product = makeProduct(4);
  useFavoritesStore.getState().add(product);
  fetchMock.mockRejectedValueOnce(new TypeError('offline'));
  renderDetail(4);

  expect(screen.getByRole('header', { name: 'Producto 4' })).toBeOnTheScreen();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Revisa tu conexión/,
  );
  expect(
    screen.getByText('Mostramos la última información disponible.'),
  ).toBeOnTheScreen();
  expect(screen.getByText(product.description)).toBeOnTheScreen();
  fetchMock.mockResolvedValue(
    jsonResponse({
      ...product,
      description: 'Detalle actualizado desde la API',
    }),
  );

  fireEvent.press(
    screen.getByRole('button', { name: 'Reintentar actualización' }),
  );

  await waitFor(() =>
    expect(
      screen.getByText('Detalle actualizado desde la API'),
    ).toBeOnTheScreen(),
  );
  expect(screen.queryByRole('alert')).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('recovers an offline favorite image separately after a successful detail refresh with the same URI', async () => {
  const product = makeProduct(21);
  useFavoritesStore.getState().add(product);
  fetchMock.mockRejectedValueOnce(new TypeError('offline'));
  renderDetail(21);
  fireEvent(screen.getByLabelText('Imágenes de Producto 21'), 'onLayout', {
    nativeEvent: { layout: { width: 360, height: 300, x: 0, y: 0 } },
  });
  const label = 'Producto 21, imagen 1 de 1';
  const failedImage = screen.getByRole('image', { name: label });
  fireEvent(failedImage, 'onError', { nativeEvent: { error: 'offline' } });
  await screen.findByText('Mostramos la última información disponible.');
  expect(failedImage).not.toBeOnTheScreen();

  fetchMock.mockResolvedValue(
    jsonResponse({ ...product, description: 'Actualizado' }),
  );
  fireEvent.press(
    screen.getByRole('button', { name: 'Reintentar actualización' }),
  );
  await screen.findByText('Actualizado');
  fireEvent.press(
    screen.getByRole('button', { name: `Reintentar imagen: ${label}` }),
  );

  const retriedImage = screen.getByRole('image', { name: label });
  expect(retriedImage).not.toBe(failedImage);
  expect(retriedImage).toHaveProp('source', {
    uri: product.images[0],
    cache: 'immutable',
  });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
