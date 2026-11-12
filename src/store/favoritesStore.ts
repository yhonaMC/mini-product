import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../domain/product';
import { createMMKVStorage, type StringStorage } from '../storage/mmkvStorage';
import type { FavoritesState } from './contracts';
import {
  createFavoritesPersistence,
  FAVORITES_STORAGE_KEY,
  FAVORITES_STORAGE_VERSION,
  readPersistedFavorites,
  type PersistedFavorites,
} from './favoritesPersistence';

function describeError(operation: 'read' | 'write', error: unknown): string {
  const reason = error instanceof Error ? ` ${error.message}` : '';
  return operation === 'read'
    ? `No se pudieron cargar los favoritos guardados.${reason}`
    : `No se pudieron guardar los favoritos. Los cambios siguen en esta sesión.${reason}`;
}

export function createFavoritesStore(
  storage: StringStorage = createMMKVStorage(),
) {
  let readBlocked = false;
  // Retain deletions too, so retrying a failed read cannot resurrect removed items.
  const pendingChanges = new Map<string, Product | null>();
  let reportError: (error: string | null) => void = () => {};
  const persistence = createFavoritesPersistence(
    storage,
    error => reportError(describeError('write', error)),
    () => reportError(null),
    () => !readBlocked,
  );

  const store = create<FavoritesState>()<
    [['zustand/persist', PersistedFavorites]]
  >((set, get, api) => {
    // Use the original setter: reporting storage errors must not trigger a write.
    reportError = storageError => {
      if (get().storageError !== storageError) {
        set({ storageError });
      }
    };
    return persist<
      FavoritesState,
      [],
      [],
      { productsById: Record<string, Product> }
    >(
      update => ({
        productsById: {},
        storageError: null,
        retryPersistence: () => {
          if (readBlocked) {
            rehydrate();
          } else {
            store.setState({});
          }
        },
        add: product => {
          const id = String(product.id);
          if (readBlocked) {
            pendingChanges.set(id, product);
          }
          update(state => ({
            productsById: { ...state.productsById, [id]: product },
          }));
        },
        remove: productId => {
          const id = String(productId);
          if (readBlocked) {
            pendingChanges.set(id, null);
          }
          update(state => {
            const productsById = { ...state.productsById };
            delete productsById[id];
            return { productsById };
          });
        },
        toggle: product => {
          if (get().productsById[String(product.id)]) {
            get().remove(product.id);
          } else {
            get().add(product);
          }
        },
      }),
      {
        name: FAVORITES_STORAGE_KEY,
        version: FAVORITES_STORAGE_VERSION,
        storage: persistence,
        partialize: state => ({ productsById: state.productsById }),
        skipHydration: true,
        merge: (persisted, current) => {
          const productsById = {
            ...(persisted === undefined
              ? current.productsById
              : readPersistedFavorites(persisted).productsById),
          };
          pendingChanges.forEach((product, id) => {
            if (product === null) {
              delete productsById[id];
            } else {
              productsById[id] = product;
            }
          });
          return { ...current, productsById };
        },
        onRehydrateStorage: () => (_state, error) => {
          if (error !== undefined) {
            readBlocked = true;
            reportError(describeError('read', error));
            return;
          }
          readBlocked = false;
          reportError(null);
          if (pendingChanges.size > 0) {
            pendingChanges.clear();
            store.setState({});
          }
        },
      },
    )(set, get, api);
  });

  function rehydrate(): void {
    store.persist.rehydrate().catch(error => {
      readBlocked = true;
      reportError(describeError('read', error));
    });
  }

  // MMKV is synchronous; hydration completes before consumers receive this store.
  rehydrate();
  return store;
}

export const useFavoritesStore = createFavoritesStore();
