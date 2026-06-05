import { staticSettings } from '@openvaa/app-shared';
import { browser } from '$app/environment';
import { logDebugError } from '$lib/utils/logger';

export type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Data saved in `localStorage` is accompanied by a version number, which can be checked against to expire the data.
 */
type LocallyStoredValue<TData> = {
  version: number;
  data: TData;
};

/**
 * A rune-native persisted state handle. Reactive reads happen via the `current`
 * getter (which tracks the underlying `$state` dependency); `set`/`update`
 * write the value through to the backing storage.
 */
export interface PersistedState<TValue> {
  /** Reactive read — invocation tracks the `$state` dependency. */
  readonly current: TValue;
  /** Replace the value (and persist). */
  set: (v: TValue) => void;
  /** Functional update (and persist). */
  update: (fn: (cur: TValue) => TValue) => void;
}

/**
 * Create a rune-native state handle persisted in `localStorage`, replacing the
 * three-layer `$state → store-shaped writable → fromStore` bridge with a single
 * `{ current, set, update }` handle. Reads the initial value via the versioned
 * `getItemFromStorage` helper (so a stale/wrong-version or old-format payload is
 * discarded and `defaultValue` is returned — there is NO format-migration shim,
 * per D-03) and persists every `set`/`update` via `saveItemToStorage`.
 *
 * NB. The type of `defaultValue` should be one that can be serialized to JSON.
 * See: https://github.com/microsoft/TypeScript/issues/1897#issuecomment-1415776159
 *
 * @param key - The key to store the value under.
 * @param defaultValue - The default value used when nothing valid is stored.
 */
export function localStorageState<TValue>(key: string, defaultValue: TValue): PersistedState<TValue> {
  return storageState('localStorage', key, defaultValue);
}

/**
 * Create a rune-native state handle persisted in `sessionStorage` — the
 * `sessionStorage` sibling of `localStorageState`, sharing the SAME
 * `StorageType`-parametrized `storageState` core. The only behavioural
 * difference comes from that shared core's session branch:
 *   - reads/writes are NOT version-wrapped (the persisted payload is the RAW
 *     JSON value, not a `{ version, data }` envelope — see `saveItemToStorage`),
 *     so there is no version-expiry check; a malformed/unparseable payload
 *     simply falls back to `defaultValue`, and
 *   - both reads and writes are `browser`-gated (SSR → `defaultValue`).
 *
 * NB. The type of `defaultValue` should be one that can be serialized to JSON.
 * See: https://github.com/microsoft/TypeScript/issues/1897#issuecomment-1415776159
 *
 * @param key - The key to store the value under.
 * @param defaultValue - The default value used when nothing valid is stored.
 */
export function sessionStorageState<TValue>(key: string, defaultValue: TValue): PersistedState<TValue> {
  return storageState('sessionStorage', key, defaultValue);
}

/**
 * Shared versioned-payload core backing `localStorageState` and
 * `sessionStorageState`. Parametrized on `StorageType` so the versioned
 * storage helpers (`getItemFromStorage`/`saveItemToStorage`) are reused — no
 * re-implementation of the `{ version, data }` payload, `requireUserDataVersion`
 * expiry, or `browser` gate.
 *
 * Uses a `$state` value + a `get current()` getter (reactive read) and writes
 * through imperatively on `set`/`update`. Persistence is imperative (not via
 * `$effect`), so the helper can be called outside component-init context (e.g.
 * inside `initXxxContext()` factories).
 *
 * When nothing valid is stored, the freshly-defaulted value is persisted on
 * init. The superseded store-shaped bridge persisted on subscribe (which
 * fires synchronously on creation); dropping to `set`/`update`-only persistence
 * silently regressed any consumer whose default is non-deterministic and is
 * never explicitly `set` — notably the tracking `sessionId`, whose generated
 * UUID was regenerated on every fresh load instead of surviving the reload it
 * lives in `sessionStorage` to survive. The write is `browser`-gated via
 * `saveItemToStorage` (SSR → no-op). (CR-01, Phase 96)
 */
function storageState<TValue>(type: StorageType, key: string, defaultValue: TValue): PersistedState<TValue> {
  const stored = getItemFromStorage<TValue>(type, key);
  let value = $state<TValue>(stored ?? defaultValue);

  // Persist the default on init when nothing valid was stored (CR-01) so a
  // non-deterministic default round-trips a reload, matching the old
  // subscribe-on-init persistence.
  if (stored === null) saveItemToStorage(type, key, defaultValue);

  return {
    get current() {
      return value;
    },
    set(v: TValue) {
      value = v;
      saveItemToStorage(type, key, v);
    },
    update(fn: (cur: TValue) => TValue) {
      value = fn(value);
      saveItemToStorage(type, key, value);
    }
  };
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
