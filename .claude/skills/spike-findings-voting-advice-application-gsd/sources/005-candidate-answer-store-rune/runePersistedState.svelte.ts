/**
 * SPIKE 003 + 005 — Shared utility: rune-native localStorage-persisted state.
 *
 * Replaces `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts`,
 * which currently uses `toStore()` + `store.subscribe()` for persistence and
 * returns a `Writable<T>` that callers wrap in `fromStore()`.
 *
 * This version uses pure runes:
 *   - `$state` for the in-memory value
 *   - Imperative `saveItemToStorage()` call on every `set`/`update`
 *     (no $effect needed — works outside component init context)
 *   - Returns a `{ current, set, update }` shape directly — no Writable<T>
 *     compatibility surface, no toStore, no fromStore in consumers.
 *
 * Persistence semantics match the production helper:
 *   - localStorage values are versioned via `staticSettings.appVersion`
 *   - Stale-version reads are discarded
 *   - SSR-safe: storage operations are gated on `browser`
 */

import { staticSettings } from '@openvaa/app-shared';
import { browser } from '$app/environment';
import { logDebugError } from '$lib/utils/logger';

export interface RunePersistedState<TValue> {
  /** Reactive read — invocation tracks the $state dependency. */
  readonly current: TValue;
  /** Replace the value (and persist). */
  set: (v: TValue) => void;
  /** Functional update (and persist). */
  update: (fn: (cur: TValue) => TValue) => void;
}

type LocallyStoredValue<TData> = {
  version: number;
  data: TData;
};

export function runeLocalStorage<TValue>(key: string, defaultValue: TValue): RunePersistedState<TValue> {
  const initial = readVersioned<TValue>(key) ?? defaultValue;
  let value = $state<TValue>(initial);

  return {
    get current() {
      return value;
    },
    set(v) {
      value = v;
      writeVersioned(key, v);
    },
    update(fn) {
      value = fn(value);
      writeVersioned(key, value);
    }
  };
}

function readVersioned<TValue>(key: string): TValue | null {
  if (!browser) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LocallyStoredValue<TValue>;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.version === 'number' &&
      parsed.version >= staticSettings.appVersion.requireUserDataVersion
    ) {
      return parsed.data;
    }
    localStorage.removeItem(key);
  } catch (e) {
    logDebugError(`Failed to parse ${key} from localStorage`, e);
  }
  return null;
}

function writeVersioned<TValue>(key: string, value: TValue): void {
  if (!browser) return;
  const payload: LocallyStoredValue<TValue> = {
    version: staticSettings.appVersion.version,
    data: value
  };
  localStorage.setItem(key, JSON.stringify(payload));
}
