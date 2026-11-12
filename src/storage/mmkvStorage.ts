import { MMKV } from 'react-native-mmkv';

export interface StringStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const FAVORITES_STORAGE_ID = 'minitienda.favorites';

/** Lazy initialization lets the store report native initialization failures too. */
export function createMMKVStorage(
  id: string = FAVORITES_STORAGE_ID,
): StringStorage {
  let instance: MMKV | undefined;
  const getInstance = () => {
    instance ??= new MMKV({ id });
    return instance;
  };

  return {
    getItem: key => {
      const mmkv = getInstance();
      const value = mmkv.getString(key);
      if (value === undefined && mmkv.contains(key)) {
        throw new Error('El valor guardado de favoritos no es texto.');
      }
      return value ?? null;
    },
    setItem: (key, value) => getInstance().set(key, value),
    removeItem: key => getInstance().delete(key),
  };
}
