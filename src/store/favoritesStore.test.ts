import { createMMKVStorage } from '../storage/mmkvStorage';
import { mockMMKV } from '../storage/testing/mmkvMock';
import { makeProduct } from '../storage/testing/productFixture';
import { FAVORITES_STORAGE_KEY } from './favoritesPersistence';
import { createFavoritesStore } from './favoritesStore';

jest.mock('react-native-mmkv', () => require('../storage/testing/mmkvMock'));

beforeEach(() => mockMMKV.reset());

test('adds complete products, replaces duplicates, removes and toggles locally', () => {
  const store = createFavoritesStore();
  const product = makeProduct();
  store.getState().add(product);
  expect(store.getState().productsById).toEqual({ 1: product });

  const updated = { ...product, title: 'Título actualizado' };
  store.getState().add(updated);
  expect(Object.values(store.getState().productsById)).toEqual([updated]);
  store.getState().toggle(updated);
  expect(store.getState().productsById).toEqual({});
  store.getState().toggle(product);
  store.getState().add(makeProduct(2));
  store.getState().remove(1);
  store.getState().remove(999);
  expect(store.getState().productsById).toEqual({ 2: makeProduct(2) });
  expect(store.getState().storageError).toBeNull();
});

test('rehydrates complete objects from a new MMKV instance with the same id', () => {
  const first = createFavoritesStore(createMMKVStorage('shared'));
  first.getState().add(makeProduct());
  first.getState().add(makeProduct(2));
  first.getState().remove(2);

  const second = createFavoritesStore(createMMKVStorage('shared'));
  expect(second.persist.hasHydrated()).toBe(true);
  expect(second.getState().productsById).toEqual({ 1: makeProduct() });
  const persisted = JSON.parse(
    createMMKVStorage('shared').getItem(FAVORITES_STORAGE_KEY) ?? '',
  ) as unknown;
  expect(persisted).toEqual({
    version: 1,
    state: { productsById: { 1: makeProduct() } },
  });
  expect(
    createFavoritesStore(createMMKVStorage('other')).getState().productsById,
  ).toEqual({});
});

test('reports write failure, retains reactive changes and retries saving them', () => {
  const store = createFavoritesStore();
  mockMMKV.failWrite = true;
  expect(() => store.getState().add(makeProduct())).not.toThrow();
  expect(store.getState().productsById).toEqual({ 1: makeProduct() });
  expect(store.getState().storageError).toMatch('No se pudieron guardar');
  store.getState().retryPersistence();
  expect(store.getState().storageError).toMatch('No se pudieron guardar');

  mockMMKV.failWrite = false;
  store.getState().retryPersistence();
  expect(store.getState().storageError).toBeNull();
  expect(createFavoritesStore().getState().productsById).toEqual({
    1: makeProduct(),
  });
});

test('a successful later mutation also clears a previous write failure', () => {
  const store = createFavoritesStore();
  mockMMKV.failWrite = true;
  store.getState().add(makeProduct());
  mockMMKV.failWrite = false;
  store.getState().add(makeProduct(2));
  expect(store.getState().storageError).toBeNull();
  expect(createFavoritesStore().getState().productsById).toEqual({
    1: makeProduct(),
    2: makeProduct(2),
  });
});

test('failed reads preserve disk data and merge pending additions and deletions on retry', () => {
  const existing = createFavoritesStore();
  existing.getState().add(makeProduct());
  existing.getState().add(makeProduct(2));
  const storage = createMMKVStorage();
  const original = storage.getItem(FAVORITES_STORAGE_KEY);
  mockMMKV.failRead = true;

  const restarted = createFavoritesStore();
  expect(restarted.persist.hasHydrated()).toBe(false);
  expect(restarted.getState().storageError).toMatch('No se pudieron cargar');
  restarted.getState().remove(1);
  restarted.getState().add(makeProduct(3));
  restarted.getState().retryPersistence();
  expect(restarted.getState().storageError).toMatch('No se pudieron cargar');

  mockMMKV.failRead = false;
  expect(storage.getItem(FAVORITES_STORAGE_KEY)).toBe(original);
  restarted.getState().retryPersistence();
  expect(restarted.persist.hasHydrated()).toBe(true);
  expect(restarted.getState().storageError).toBeNull();
  expect(restarted.getState().productsById).toEqual({
    2: makeProduct(2),
    3: makeProduct(3),
  });
  expect(createFavoritesStore().getState().productsById).toEqual(
    restarted.getState().productsById,
  );
});

test('handles native initialization failure and can recover without recreating the store', () => {
  mockMMKV.failInitialization = true;
  const store = createFavoritesStore();
  expect(store.getState().storageError).toMatch('Native storage unavailable');
  store.getState().add(makeProduct());
  mockMMKV.failInitialization = false;
  store.getState().retryPersistence();
  expect(store.getState().storageError).toBeNull();
  expect(createFavoritesStore().getState().productsById).toEqual({
    1: makeProduct(),
  });
});

test.each([
  ['invalid JSON', '{not JSON'],
  ['invalid envelope', 'null'],
  ['unsupported version', JSON.stringify({ version: 2, state: {} })],
  [
    'missing version',
    JSON.stringify({ state: { productsById: { 1: makeProduct() } } }),
  ],
  ['missing map', JSON.stringify({ version: 1, state: {} })],
  [
    'incomplete product',
    JSON.stringify({ version: 1, state: { productsById: { 1: { id: 1 } } } }),
  ],
  [
    'mismatched id',
    JSON.stringify({
      version: 1,
      state: { productsById: { 2: makeProduct() } },
    }),
  ],
  [
    'invalid nested object',
    JSON.stringify({
      version: 1,
      state: { productsById: { 1: { ...makeProduct(), dimensions: null } } },
    }),
  ],
])(
  'reports corruption (%s) without destroying the saved value',
  (_name, text) => {
    const storage = createMMKVStorage();
    storage.setItem(FAVORITES_STORAGE_KEY, text);
    const store = createFavoritesStore();
    expect(store.getState().storageError).toMatch('No se pudieron cargar');
    expect(store.getState().productsById).toEqual({});
    store.getState().add(makeProduct(3));
    store.getState().retryPersistence();
    expect(store.getState().storageError).toMatch('No se pudieron cargar');
    expect(storage.getItem(FAVORITES_STORAGE_KEY)).toBe(text);
  },
);

test('reports deletion failure from the persistence API', () => {
  const store = createFavoritesStore();
  store.getState().add(makeProduct());
  mockMMKV.failDelete = true;
  store.persist.clearStorage();
  expect(store.getState().storageError).toMatch('Storage deletion failed');
  expect(createFavoritesStore().getState().productsById).toEqual({
    1: makeProduct(),
  });
});
