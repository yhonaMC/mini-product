import { useMemo } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';

export function useFavoritesActions() {
  const addFavorite = useFavoritesStore(state => state.add);
  const removeFavorite = useFavoritesStore(state => state.remove);
  const toggleFavorite = useFavoritesStore(state => state.toggle);
  return useMemo(
    () => ({ addFavorite, removeFavorite, toggleFavorite }),
    [addFavorite, removeFavorite, toggleFavorite],
  );
}

export function useIsFavorite(id: number): boolean {
  return useFavoritesStore(state => Boolean(state.productsById[String(id)]));
}

export function useFavorites() {
  const productsById = useFavoritesStore(state => state.productsById);
  const storageError = useFavoritesStore(state => state.storageError);
  const retryPersistence = useFavoritesStore(state => state.retryPersistence);
  const favorites = useMemo(() => Object.values(productsById), [productsById]);
  const actions = useFavoritesActions();
  return useMemo(
    () => ({ favorites, storageError, retryPersistence, ...actions }),
    [favorites, storageError, retryPersistence, actions],
  );
}
