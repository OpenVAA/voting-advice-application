import { staticSettings } from '@openvaa/app-shared';
import { browser } from '$app/environment';
import { toStore } from 'svelte/store';
import { logDebugError } from '$lib/utils/logger';
import type { Writable } from 'svelte/store';

export type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Data saved in `localStorage` is accompanied by a version number, which can be checked against to expire the data.
 */
type LocallyStoredValue<TData> = {
  version: number;
  data: TData;
};

/**
 * Create a store that is persisted in `localStorage` and initiate it unless a saved value is found.
 * The version number saved with the item is checked and the data is expired if it does not match the
 * required version defined in `settings`.
 *
 * NB. The type of `defaultValue` should be one that can be serialized to JSON. We cannot define typing
 * for that in a satisfactory way due to TS limitations.
 * See: https://github.com/microsoft/TypeScript/issues/1897#issuecomment-1415776159
 *
 * @param key - The key to store the value under.
 * @param defaultValue - The default value for the store.
 */
export function localStorageWritable<TValue>(key: string, defaultValue: TValue): Writable<TValue> {
  return storageWritable('localStorage', key, defaultValue);
}

/**
 * Create a store that is persisted in `sessionStorage` and initiate it unless a saved value is found.
 *
 * NB. The type of `defaultValue` should be one that can be serialized to JSON. We cannot define typing
 * for that in a satisfactory way due to TS limitations.
 * See: https://github.com/microsoft/TypeScript/issues/1897#issuecomment-1415776159
 *
 * @param key - The key to store the value under.
 * @param defaultValue - The default value for the store.
 */
export function sessionStorageWritable<TValue>(key: string, defaultValue: TValue): Writable<TValue> {
  return storageWritable('sessionStorage', key, defaultValue);
}

/**
 * Create a store backed by `$state` that is persisted in `localStorage` or `sessionStorage`.
 * Reads initial value from storage; subscribes to changes to write them back.
 * Returns a backward-compatible `Writable<T>` via `toStore()` for existing `$store` consumers.
 *
 * Uses `$state` for the internal reactive value instead of `writable()` from svelte/store.
 * The `toStore()` bridge provides a `Writable<T>` interface so existing `$store` subscribers
 * continue to work. Persistence is achieved via subscribing to the store (same as the old
 * implementation) rather than `$effect`, so this utility can be called outside component
 * initialization context (e.g. in `initXxxContext()` factories).
 *
 * @param type - The type of storage to use.
 * @param key - The key to store the value under.
 * @param defaultValue - The default value for the store.
 */
function storageWritable<TValue>(type: StorageType, key: string, defaultValue: TValue): Writable<TValue> {
  const stored = getItemFromStorage<TValue>(type, key);
  let value = $state<TValue>(stored ?? defaultValue);

  const store = toStore(
    () => value,
    (v: TValue) => {
      value = v;
    }
  );

  // Subscribe to persist changes back to storage.
  // The subscription is never torn down, matching the old storageStore behavior
  // where the writable's subscribe was used for persistence.
  store.subscribe((v) => saveItemToStorage(type, key, v));

  return store;
}

/**
 * Get an item from storage. If the `type` is `localStorage`, the version number saved with the
 * item is checked and the data is expired if it does not match the required version defined in
 * `settings`.
 */
function getItemFromStorage<TValue>(type: StorageType, key: string): TValue | null {
  let item: TValue | null = null;
  const storage = getStorage(type);
  if (!storage) return null;
  const savedItem = storage.getItem(key);
  if (savedItem) {
    let savedValue: TValue | null;
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
        savedValue.version >= staticSettings.appVersion.requireUserDataVersion
      ) {
        item = savedValue.data as TValue;
      } else {
        storage.removeItem(key);
      }
    } else {
      item = savedValue as TValue;
    }
  }
  return item;
}

/**
 * Save an item to storage. If the `type` is `localStorage`, the data is versioned.
 */
function saveItemToStorage<TValue>(type: StorageType, key: string, value: TValue): void {
  const storage = getStorage(type);
  if (!storage) return;
  const toSave =
    type === 'localStorage'
      ? ({
          version: staticSettings.appVersion.version,
          data: value
        } as LocallyStoredValue<TValue>)
      : (value ?? null); // Convert `undefined` to `null` because when read back it'd be treated as a string
  storage.setItem(key, JSON.stringify(toSave));
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
    throw new Error(`Invalid storage type: ${type}`);
  }
}
