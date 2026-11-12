import type { Product } from '../domain/product';

export interface FavoritesState {
  productsById: Record<string, Product>;
  storageError: string | null;
  retryPersistence: () => void;
  add: (product: Product) => void;
  remove: (id: number) => void;
  toggle: (product: Product) => void;
}
