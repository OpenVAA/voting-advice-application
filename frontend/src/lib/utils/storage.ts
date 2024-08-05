import { error } from '@sveltejs/kit';
import { get, writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { settings } from '../stores/stores';
import { browser } from '$app/environment';
import { logDebugError } from './logger';

export type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Data saved in `localStorage` is accompanied by a version number, which can be checked agains to expire the data.
 */
type LocallyStoredValue<TData> = {
  version: number;
  data: TData;
};

/**
 * Create a store that is persisted in `localStorage` and initiate it unless a saved value is found. The version number saved with the item is checked and the data is expired if it does match the required version defined in `settings`.
 * NB. The type of `defaultValue` should be one that can be serialized to JSON. We cannot define typing for that in a satisfactory way due to TS limitations. See: https://github.com/microsoft/TypeScript/issues/1897#issuecomment-1415776159
 * @param key The key to store the value under.
 * @param defaultValue The default value for the store.
 */
export function localStorageWritable<TValue>(key: string, defaultValue: TValue) {
  return storageWritable('localStorage', key, defaultValue);
}

/**
 * Create a store that is persisted in `sessionStorage` and initiate it unless a saved value is found.
 * NB. The type of `defaultValue` should be one that can be serialized to JSON. We cannot define typing for that in a satisfactory way due to TS limitations. See: https://github.com/microsoft/TypeScript/issues/1897#issuecomment-1415776159
 * @param key The key to store the value under.
 * @param defaultValue The default value for the store.
 */
export function sessionStorageWritable<TValue>(key: string, defaultValue: TValue) {
  return storageWritable('sessionStorage', key, defaultValue);
}

/**
 * Create a store that is persisted in `localStorage` or `sessionStorage` and initiate it unless a saved value is found.
 * NB. The type of `defaultValue` should be one that can be serialized to JSON. We cannot define typing for that in a satisfactory way due to TS limitations. See: https://github.com/microsoft/TypeScript/issues/1897#issuecomment-1415776159
 * @param type The type of storage to use.
 * @param key The key to store the value under.
 * @param defaultValue The default value for the store.
 */
export function storageWritable<TValue>(
  type: StorageType,
  key: string,
  defaultValue: TValue
): Writable<TValue> {
  const value = getItemFromStorage<TValue>(type, key);
  // TODO: Check that the value matches the defaultValue's type
  const store = writable(value == null ? defaultValue : value) as Writable<TValue>;
  store.subscribe((value) => saveItemToStorage(type, key, value));
  return store;
}

/**
 * Get an item from storage. If the `type` is `localStorage`, the version number saved with the item is checked and the data is expired if it does match the required version defined in `settings`.
 */
function getItemFromStorage<TType>(type: StorageType, key: string): TType | null {
  let item: TType | null = null;
  const storage = getStorage(type);
  if (!storage) return null;
  const savedItem = storage.getItem(key);
  if (savedItem) {
    let savedValue: TType | null;
    try {
      savedValue = JSON.parse(savedItem);
    } catch (e) {
      logDebugError(`Failed to parse ${key} from ${type}`, e);
      savedValue = null;
    }
    if (type === 'localStorage') {
      // Check that stored data is versioned and the version is greater than or equal to the required version
      if (
        savedValue &&
        typeof savedValue === 'object' &&
        'version' in savedValue &&
        'data' in savedValue &&
        typeof savedValue.version === 'number' &&
        savedValue.version >= get(settings).appVersion.requireUserDataVersion
      ) {
        item = savedValue.data as TType;
      } else {
        storage.removeItem(key);
      }
    } else {
      item = savedValue as TType;
    }
  }
  return item;
}

/**
 * Save an item to storage. If the `type` is `localStorage`, the data is versioned.
 */
function saveItemToStorage<TType>(type: StorageType, key: string, value: TType): void {
  const storage = getStorage(type);
  if (!storage) return;
  const toStore =
    type === 'localStorage'
      ? ({
          version: get(settings).appVersion.version,
          data: value
        } as LocallyStoredValue<TType>)
      : value ?? null; // Convert `undefined` to `null` because when read back it'd be treated as a string
  storage.setItem(key, JSON.stringify(toStore));
}

/**
 * Get the `localStorage` or `sessionStorage` object if available.
 */
function getStorage(type: StorageType): Storage | null {
  if (!browser) return null;
  if (type === 'localStorage') {
    return localStorage;
  } else if (type === 'sessionStorage') {
    return sessionStorage;
  } else {
    error(500, `Invalid storage type: ${type}`);
  }
}
