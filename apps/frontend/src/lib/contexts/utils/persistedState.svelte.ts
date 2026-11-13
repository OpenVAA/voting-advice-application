import { log, staticSettings } from '@openvaa/app-shared';
import { browser } from '$app/environment';

export type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Data saved in `localStorage` is accompanied by a version number, which can be checked against to expire the data.
 */
type LocallyStoredValue<TData> = {
  version: number;
  data: TData;
};

/**
 * A rune-native persisted state handle. Reactive reads happen via the `current` getter (which tracks the underlying `$state` dependency); `set`/`update` write the value through to the backing storage. A `localStorage` handle also follows another document's change of its key: see `localStorageState`.
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
 * Create a rune-native state handle persisted in `localStorage`, replacing the three-layer `$state → store-shaped writable → fromStore` bridge with a single `{ current, set, update }` handle. Reads the initial value via the versioned `getItemFromStorage` helper (so a stale/wrong-version or old-format payload is discarded and `defaultValue` is returned — there is deliberately NO format-migration shim) and persists every `set`/`update` via `saveItemToStorage`.
 *
 * In the browser the handle follows another document's change of its key, as the `storage` event announces it, and writes nothing back: a removed key or a cleared storage returns it to `defaultValue`, and a new value is read as the handle's first read reads one. So a later `set` or `update` stores only what it adds, and cannot store again what another tab removed.
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
 * Create a rune-native state handle persisted in `sessionStorage` — the `sessionStorage` sibling of `localStorageState`, sharing the SAME `StorageType`-parametrized `storageState` core. The behavioural differences come from that shared core's session branch:
 *   - reads/writes are NOT version-wrapped (the persisted payload is the RAW JSON value, not a `{ version, data }` envelope — see `saveItemToStorage`), so there is no version-expiry check; a malformed/unparseable payload simply falls back to `defaultValue`,
 *   - both reads and writes are `browser`-gated (SSR → `defaultValue`), and
 *   - the handle does not follow other documents: `sessionStorage` is the tab's own.
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
 * Remove from storage every item whose key starts with `prefix` and not with `keepPrefix`. Keys are matched as they are stored: `localStorageState` and `sessionStorageState` store an item under the key they are given, unchanged. Does nothing outside the browser.
 *
 * A handle already constructed for a removed key keeps its value in memory and stores it again on its next `set` or `update`, so drop such handles before calling this. This holds in the document that removes: a `localStorage` handle in another document follows the removal.
 *
 * @param type - The storage to remove from.
 * @param prefix - The start of the keys to remove.
 * @param keepPrefix - The start of the keys among them to keep. Left out, none is kept.
 * @throws An error if `prefix` is empty: every key starts with the empty string, so the whole storage would be cleared.
 */
export function removePersistedByPrefix(type: StorageType, prefix: string, keepPrefix?: string): void {
  if (!prefix) throw new Error('removePersistedByPrefix: an empty prefix would clear the whole storage');
  const storage = getStorage(type);
  if (!storage) return;
  // The matching keys are listed before any is removed, because a removal renumbers the storage's index.
  const keys = new Array<string>();
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(prefix) && !(keepPrefix && key.startsWith(keepPrefix))) keys.push(key);
  }
  for (const key of keys) storage.removeItem(key);
}

/**
 * Shared versioned-payload core backing `localStorageState` and `sessionStorageState` as a Svelte 5 CLASS. Parametrized on `StorageType` so the versioned storage helpers (`getItemFromStorage`/`saveItemToStorage`) are reused — no re-implementation of the `{ version, data }` payload, `requireUserDataVersion` expiry, or `browser` gate.
 *
 * The reactive core is the private `#value` `$state` field; the public `current` getter reads it (reactive read tracks the `$state` dependency).
 * `set`/`update` are ARROW-FUNCTION FIELDS so they survive `const { set } = handle` detach (the candidate stores destructure them) — they capture `this` on detach. Each mutates `#value` then persists IMPERATIVELY via `saveItemToStorage` (NEVER `$effect`); this is what keeps the class constructable OUTSIDE any effect context (e.g. inside `initXxxContext()` factories / module scope) without `effect_orphan`.
 *
 * When nothing valid is stored, the freshly-defaulted value is persisted on init in the CONSTRUCTOR BODY (a synchronous side-effect, NOT an `$effect`).
 * Persisting ONLY on `set`/`update` would silently break any consumer whose default is non-deterministic and is never explicitly `set`: a generated default (a random id, a timestamp) would be regenerated on every fresh load instead of surviving the reload it is stored to survive. The write is `browser`-gated via `saveItemToStorage` (SSR → no-op).
 */
class PersistedStateImpl<TValue> implements PersistedState<TValue> {
  #type: StorageType;
  #key: string;
  #defaultValue: TValue;
  #value: TValue;

  /**
   * @param type - The storage backend (`localStorage` versioned / `sessionStorage` raw).
   * @param key - The key to store the value under.
   * @param defaultValue - The default value used when nothing valid is stored.
   */
  constructor(type: StorageType, key: string, defaultValue: TValue) {
    this.#type = type;
    this.#key = key;
    this.#defaultValue = defaultValue;
    const stored = getItemFromStorage<TValue>(type, key);
    this.#value = $state<TValue>(stored ?? defaultValue) as TValue;

    // Persist the default on init when nothing valid was stored, so a non-deterministic default round-trips a reload. This is a synchronous constructor side-effect (NOT an `$effect`); the write is `browser`-gated inside `saveItemToStorage`, so SSR is a no-op.
    if (stored === null) saveItemToStorage(type, key, defaultValue);
    if (type === 'localStorage') followLocalStorage(this);
  }

  /**
   * Take another document's change of `localStorage`, writing nothing back.
   * @param key - The key that changed, or `null` for a storage that was cleared.
   * @param newValue - The key's new value as stored, or `null` for a key that was removed.
   */
  followChange(key: string | null, newValue: string | null): void {
    if (key !== null && key !== this.#key) return;
    const stored = key === null || newValue === null ? null : parseStoredItem<TValue>(this.#type, key, newValue).value;
    this.#value = stored ?? this.#defaultValue;
  }

  get current(): TValue {
    return this.#value;
  }

  set = (v: TValue): void => {
    this.#value = v;
    saveItemToStorage(this.#type, this.#key, v);
  };

  update = (fn: (cur: TValue) => TValue): void => {
    this.#value = fn(this.#value);
    saveItemToStorage(this.#type, this.#key, this.#value);
  };
}

/**
 * The `localStorage` handles of this document, held weakly so that a handle nothing else holds is not kept alive by it. Empty outside the browser.
 */
const localStorageHandles = new Set<WeakRef<PersistedStateImpl<unknown>>>();
let followingLocalStorage = false;

/**
 * Make a `localStorage` handle follow another document's changes of the storage. The one `storage` listener is added with the first handle, in the browser only.
 * @param handle - The handle.
 */
function followLocalStorage<TValue>(handle: PersistedStateImpl<TValue>): void {
  if (!browser) return;
  localStorageHandles.add(new WeakRef(handle as PersistedStateImpl<unknown>));
  if (followingLocalStorage) return;
  followingLocalStorage = true;
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.storageArea !== getStorage('localStorage')) return;
    for (const ref of [...localStorageHandles]) {
      const live = ref.deref();
      if (live) live.followChange(event.key, event.newValue);
      else localStorageHandles.delete(ref);
    }
  });
}

/**
 * Shared versioned-payload core backing `localStorageState` and `sessionStorageState`. Returns a `PersistedStateImpl` instance.
 */
function storageState<TValue>(type: StorageType, key: string, defaultValue: TValue): PersistedState<TValue> {
  return new PersistedStateImpl(type, key, defaultValue);
}

/**
 * Get an item from storage. If the `type` is `localStorage`, the version number saved with the item is checked and the data is expired if it does not match the required version defined in `settings`.
 */
function getItemFromStorage<TValue>(type: StorageType, key: string): TValue | null {
  const storage = getStorage(type);
  if (!storage) return null;
  const savedItem = storage.getItem(key);
  if (!savedItem) return null;
  const { value, expired } = parseStoredItem<TValue>(type, key, savedItem);
  if (expired) storage.removeItem(key);
  return value;
}

/**
 * Read an item as it is stored. If the `type` is `localStorage`, an item that is not versioned, or whose version is older than the required version defined in `settings`, is expired.
 * @param type - The storage the item is stored in.
 * @param key - The item's key, for the log line of an item that cannot be parsed.
 * @param savedItem - The item as stored.
 * @returns The item's value, `null` when it cannot be read, and whether it is expired.
 */
function parseStoredItem<TValue>(
  type: StorageType,
  key: string,
  savedItem: string
): { value: TValue | null; expired: boolean } {
  let savedValue: TValue | null;
  try {
    savedValue = JSON.parse(savedItem);
  } catch (e) {
    log.error(`Failed to parse ${key} from ${type}`, { err: e });
    savedValue = null;
  }
  if (type !== 'localStorage') return { value: savedValue, expired: false };
  // Check that stored data is versioned and the version is greater than or equal to the required version
  if (
    savedValue &&
    typeof savedValue === 'object' &&
    'version' in savedValue &&
    'data' in savedValue &&
    typeof savedValue.version === 'number' &&
    savedValue.version >= staticSettings.appVersion.requireUserDataVersion
  ) {
    return { value: savedValue.data as TValue, expired: false };
  }
  return { value: null, expired: true };
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
