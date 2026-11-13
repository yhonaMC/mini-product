import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { makeProduct } from '../../storage/testing/productFixture';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useSelectionStore } from '../../navigation/selectionStore';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { FavoritesScreen } from './FavoritesScreen';

const mockNavigate = jest.fn();

// Navigation is a boundary here; the real open-product hook still sets selection.
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

// Keep Swipeable's public callbacks and rendering real. Native gesture
// attachment cannot run with the official Reanimated JS mock's worklets.
jest.mock(
  'react-native-gesture-handler/lib/commonjs/handlers/gestures/GestureDetector',
  () => ({
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  }),
);

let fetchSpy: jest.SpiedFunction<typeof fetch>;

beforeEach(() => {
  jest.useFakeTimers();
  useFavoritesStore.setState({ productsById: {}, storageError: null });
  useSelectionStore.setState({ productId: undefined });
  mockNavigate.mockClear();
  fetchSpy = jest
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('Offline'));
});

afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
  // Rendering and all favorite interactions must use local objects exclusively.
  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
});

function renderFavorites() {
  return render(
    <GestureHandlerRootView>
      <ThemeProvider>
        <FavoritesScreen />
      </ThemeProvider>
    </GestureHandlerRootView>,
  );
}

test('shows a useful empty state with an action that returns to the catalog', () => {
  renderFavorites();
  expect(screen.getByText('Tu selección empieza aquí')).toBeOnTheScreen();
  expect(screen.getByText(/incluso sin conexión/)).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Explorar productos' }));
  expect(mockNavigate).toHaveBeenCalledWith('Products', {
    screen: 'ProductsList',
  });
});

test('renders stored products offline and opens the selected product detail', () => {
  const product = makeProduct(17);
  useFavoritesStore.getState().add(product);
  renderFavorites();

  expect(screen.getByText(product.title)).toBeOnTheScreen();
  expect(screen.getByText('1 producto guardado')).toBeOnTheScreen();
  fireEvent.press(
    screen.getByRole('button', { name: 'Ver detalle de Producto 17' }),
  );
  expect(mockNavigate).toHaveBeenCalledWith('Detail');
  expect(useSelectionStore.getState().productId).toBe(17);
  expect(useFavoritesStore.getState().productsById['17']).toEqual(product);
});

test('removes only the chosen favorite through its accessible control and reaches the empty state', () => {
  useFavoritesStore.getState().add(makeProduct(1));
  useFavoritesStore.getState().add(makeProduct(2));
  renderFavorites();
  expect(screen.getByText('2 productos guardados')).toBeOnTheScreen();

  fireEvent.press(
    screen.getByRole('button', { name: 'Quitar Producto 1 de favoritos' }),
  );
  expect(screen.queryByText('Producto 1')).toBeNull();
  expect(screen.getByText('Producto 2')).toBeOnTheScreen();
  expect(screen.getByText('1 producto guardado')).toBeOnTheScreen();
  expect(useFavoritesStore.getState().productsById).toEqual({
    2: makeProduct(2),
  });

  fireEvent.press(
    screen.getByRole('button', { name: 'Quitar Producto 2 de favoritos' }),
  );
  expect(screen.getByText('Tu selección empieza aquí')).toBeOnTheScreen();
  expect(screen.queryByText('Producto 2')).toBeNull();
  expect(useFavoritesStore.getState().productsById).toEqual({});
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('a completed swipe removes the row and updates the real local store', () => {
  useFavoritesStore.getState().add(makeProduct(3));
  renderFavorites();
  // Native gesture recognition/animation is covered on-device; deliver its
  // completion event to the real Swipeable boundary and keep store logic real.
  fireEvent(screen.getByTestId('favorite-swipe-3'), 'swipeableOpen', 'left');
  expect(screen.queryByText('Producto 3')).toBeNull();
  expect(screen.getByText('Tu selección empieza aquí')).toBeOnTheScreen();
  expect(useFavoritesStore.getState().productsById).toEqual({});
});

test('reacts to favorites added and removed from another mounted screen', () => {
  renderFavorites();
  act(() => useFavoritesStore.getState().add(makeProduct(4)));
  expect(screen.getByText('Producto 4')).toBeOnTheScreen();
  expect(screen.queryByText('Tu selección empieza aquí')).toBeNull();
  act(() => useFavoritesStore.getState().remove(4));
  expect(screen.queryByText('Producto 4')).toBeNull();
  expect(screen.getByText('Tu selección empieza aquí')).toBeOnTheScreen();
});
