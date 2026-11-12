import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { mockMMKV } from '../storage/testing/mmkvMock';
import { makeProduct } from '../storage/testing/productFixture';
import { useFavoritesStore } from '../store/favoritesStore';
import {
  useFavorites,
  useFavoritesActions,
  useIsFavorite,
} from './useFavorites';

jest.mock('react-native-mmkv', () => require('../storage/testing/mmkvMock'));

beforeEach(() => {
  mockMMKV.reset();
  useFavoritesStore.setState({ productsById: {}, storageError: null });
});

function Indicator({ name }: { name: string }) {
  const favorite = useIsFavorite(1);
  return <Text>{`${name}: ${favorite ? 'favorito' : 'sin favorito'}`}</Text>;
}

function FavoriteList() {
  const { favorites, removeFavorite, storageError, retryPersistence } =
    useFavorites();
  return (
    <View>
      <Text>{`${favorites.length} guardados`}</Text>
      {favorites.map(product => (
        <Pressable
          key={product.id}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${product.title}`}
          onPress={() => removeFavorite(product.id)}
        >
          <Text>{product.description}</Text>
        </Pressable>
      ))}
      {storageError && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reintentar guardado"
          onPress={retryPersistence}
        >
          <Text>{storageError}</Text>
        </Pressable>
      )}
    </View>
  );
}

function ToggleButton({ onRender }: { onRender: () => void }) {
  const { toggleFavorite } = useFavoritesActions();
  onRender();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Alternar favorito"
      onPress={() => toggleFavorite(makeProduct())}
    >
      <Text>Alternar</Text>
    </Pressable>
  );
}

test('two consumers react immediately to toggles and removal without rerendering the actions consumer', () => {
  const onActionsRender = jest.fn();
  render(
    <View>
      <Indicator name="Lista" />
      <Indicator name="Detalle" />
      <FavoriteList />
      <ToggleButton onRender={onActionsRender} />
    </View>,
  );
  expect(screen.getByText('Lista: sin favorito')).toBeOnTheScreen();
  expect(screen.getByText('Detalle: sin favorito')).toBeOnTheScreen();
  expect(screen.getByText('0 guardados')).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: 'Alternar favorito' }));
  expect(screen.getByText('Lista: favorito')).toBeOnTheScreen();
  expect(screen.getByText('Detalle: favorito')).toBeOnTheScreen();
  expect(screen.getByText(makeProduct().description)).toBeOnTheScreen();
  expect(screen.getByText('1 guardados')).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: 'Eliminar Producto 1' }));
  expect(screen.getByText('Lista: sin favorito')).toBeOnTheScreen();
  expect(screen.getByText('Detalle: sin favorito')).toBeOnTheScreen();
  expect(screen.queryByText(makeProduct().description)).toBeNull();
  expect(onActionsRender).toHaveBeenCalledTimes(1);
});

test('exposes write failures and clears them reactively after retry', () => {
  render(<FavoriteList />);
  mockMMKV.failWrite = true;
  act(() => useFavoritesStore.getState().add(makeProduct()));
  expect(screen.getByText('1 guardados')).toBeOnTheScreen();
  expect(screen.getByText(/No se pudieron guardar/)).toBeOnTheScreen();

  mockMMKV.failWrite = false;
  fireEvent.press(screen.getByRole('button', { name: 'Reintentar guardado' }));
  expect(screen.queryByText(/No se pudieron guardar/)).toBeNull();
  expect(screen.getByText('1 guardados')).toBeOnTheScreen();
});
