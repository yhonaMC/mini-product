import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProductCard } from './ProductCard';
import { FavoriteButton } from './FavoriteButton';
import { ThemeProvider } from '../theme/ThemeProvider';
import { useFavoritesStore } from '../store/favoritesStore';
import { makeProduct } from '../storage/testing/productFixture';

beforeEach(() => {
  useFavoritesStore.setState({ productsById: {}, storageError: null });
});

test('opens a product and toggles its favorite without opening the detail again', () => {
  const product = makeProduct(17);
  const openProduct = jest.fn();
  render(
    <ThemeProvider>
      <ProductCard product={product} onPress={openProduct} />
    </ThemeProvider>,
  );

  fireEvent.press(
    screen.getByRole('button', { name: 'Ver detalle de Producto 17' }),
  );
  expect(openProduct).toHaveBeenCalledWith(17);
  fireEvent.press(
    screen.getByRole('button', { name: 'Añadir Producto 17 a favoritos' }),
  );
  expect(
    screen.getByRole('button', {
      name: 'Quitar Producto 17 de favoritos',
      selected: true,
    }),
  ).toBeOnTheScreen();
  expect(useFavoritesStore.getState().productsById['17']).toEqual(product);
  expect(openProduct).toHaveBeenCalledTimes(1);
});

test('keeps the list indicator and an animated detail control in sync', () => {
  const product = makeProduct(19);
  render(
    <ThemeProvider>
      <ProductCard product={product} onPress={jest.fn()} />
      <FavoriteButton product={product} animated />
    </ThemeProvider>,
  );

  const addButtons = screen.getAllByRole('button', {
    name: 'Añadir Producto 19 a favoritos',
  });
  const listButton = addButtons[0];
  if (!listButton) {
    throw new Error('Missing list favorite control');
  }
  fireEvent.press(listButton);
  const removeButtons = screen.getAllByRole('button', {
    name: 'Quitar Producto 19 de favoritos',
  });
  expect(removeButtons).toHaveLength(2);
  const detailButton = removeButtons[1];
  if (!detailButton) {
    throw new Error('Missing detail favorite control');
  }
  fireEvent.press(detailButton);
  expect(
    screen.getAllByRole('button', { name: 'Añadir Producto 19 a favoritos' }),
  ).toHaveLength(2);
  expect(useFavoritesStore.getState().productsById).toEqual({});
});

test('retries a failed thumbnail without opening detail and keeps the image itself tappable', () => {
  const product = makeProduct(23);
  const openProduct = jest.fn();
  render(
    <ThemeProvider>
      <ProductCard product={product} onPress={openProduct} />
    </ThemeProvider>,
  );
  const thumbnail = screen.getByLabelText('Imagen de Producto 23');

  fireEvent(thumbnail, 'onError');
  fireEvent.press(
    screen.getByRole('button', {
      name: 'Reintentar imagen: Imagen de Producto 23',
    }),
  );

  expect(openProduct).not.toHaveBeenCalled();
  expect(thumbnail).not.toBeOnTheScreen();
  expect(screen.getByLabelText('Imagen de Producto 23')).toHaveProp('source', {
    uri: product.thumbnail,
    cache: 'immutable',
  });
  fireEvent.press(screen.getByRole('button', { name: 'Abrir Producto 23' }));
  expect(openProduct).toHaveBeenCalledWith(23);
});
