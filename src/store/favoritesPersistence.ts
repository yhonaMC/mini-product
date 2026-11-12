import type { PersistStorage } from 'zustand/middleware';
import type { Product } from '../domain/product';
import type { StringStorage } from '../storage/mmkvStorage';

export const FAVORITES_STORAGE_KEY = 'minitienda.favorites.v1';
export const FAVORITES_STORAGE_VERSION = 1;

export interface PersistedFavorites {
  productsById: Record<string, Product>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isProduct(value: unknown): value is Product {
  if (!isRecord(value)) {
    return false;
  }
  const strings = [
    'title',
    'description',
    'category',
    'sku',
    'warrantyInformation',
    'shippingInformation',
    'availabilityStatus',
    'returnPolicy',
    'thumbnail',
  ];
  const numbers = [
    'price',
    'discountPercentage',
    'rating',
    'stock',
    'weight',
    'minimumOrderQuantity',
  ];
  return (
    typeof value.id === 'number' &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    strings.every(key => typeof value[key] === 'string') &&
    numbers.every(key => isNumber(value[key])) &&
    (value.brand === undefined || typeof value.brand === 'string') &&
    isStringArray(value.tags) &&
    isStringArray(value.images) &&
    isRecord(value.dimensions) &&
    ['width', 'height', 'depth'].every(key =>
      isNumber((value.dimensions as Record<string, unknown>)[key]),
    ) &&
    isRecord(value.meta) &&
    ['createdAt', 'updatedAt', 'barcode', 'qrCode'].every(
      key => typeof (value.meta as Record<string, unknown>)[key] === 'string',
    ) &&
    Array.isArray(value.reviews) &&
    value.reviews.every(
      review =>
        isRecord(review) &&
        isNumber(review.rating) &&
        ['comment', 'date', 'reviewerName', 'reviewerEmail'].every(
          key => typeof review[key] === 'string',
        ),
    )
  );
}

export function readPersistedFavorites(value: unknown): PersistedFavorites {
  if (
    !isRecord(value) ||
    !isRecord(value.productsById) ||
    !Object.entries(value.productsById).every(
      ([id, product]) => isProduct(product) && id === String(product.id),
    )
  ) {
    throw new Error('Los favoritos guardados están dañados o incompletos.');
  }
  return { productsById: value.productsById as Record<string, Product> };
}

/** Validate the envelope before Zustand can merge untrusted JSON into state. */
export function createFavoritesPersistence(
  storage: StringStorage,
  onWriteError: (error: unknown) => void,
  onWriteSuccess: () => void,
  canWrite: () => boolean,
): PersistStorage<PersistedFavorites> {
  return {
    getItem: key => {
      const text = storage.getItem(key);
      if (text === null) {
        return null;
      }
      const envelope: unknown = JSON.parse(text);
      if (!isRecord(envelope)) {
        throw new Error('El archivo de favoritos está dañado.');
      }
      if (envelope.version !== FAVORITES_STORAGE_VERSION) {
        throw new Error(
          'La versión de los favoritos guardados no es compatible.',
        );
      }
      return {
        state: readPersistedFavorites(envelope.state),
        version: FAVORITES_STORAGE_VERSION,
      };
    },
    setItem: (key, value) => {
      // A failed read must never turn the empty initial state into data loss.
      if (!canWrite()) {
        return;
      }
      try {
        storage.setItem(key, JSON.stringify(value));
        onWriteSuccess();
      } catch (error) {
        onWriteError(error);
      }
    },
    removeItem: key => {
      try {
        storage.removeItem(key);
        onWriteSuccess();
      } catch (error) {
        onWriteError(error);
      }
    },
  };
}
