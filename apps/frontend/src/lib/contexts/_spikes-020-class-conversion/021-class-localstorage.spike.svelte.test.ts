import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';

/**
 * SPIKE 021 — Group C, localStorage-wrapping variant as a CLASS.
 *
 * Production shape: `localStorageState<T>(key, default) → { current, set, update }`
 * (utils/persistedState.svelte.ts). Persistence is IMPERATIVE inside set/update —
 * deliberately NOT an `$effect` — "so the helper can be called outside
 * component-init context (e.g. inside initXxxContext() factories)" and so it is
 * SSR-safe ($effect does not run on the server).
 *
 * This spike rebuilds it as a class with a `$state` field. Questions:
 *   1. Does a class `$state` field + `get current()` stay reactive across reads?
 *   2. Can the class be constructed OUTSIDE any effect context (factory / SSR)?
 *      → it MUST contain no `$effect` (mirrors the production imperative-persist
 *        decision). Constructing it bare is the test.
 *   3. Do `set`/`update` survive being DETACHED (`const { set } = persisted`)?
 *      → they must be ARROW fields (Spike 020 Group E discipline).
 */

// In-memory storage double — deterministic, no jsdom dependency.
function makeFakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string): string | null => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string): void => void map.set(k, v),
    removeItem: (k: string): void => void map.delete(k),
    _raw: map
  };
}

/** Class form of `localStorageState`. No `$effect`; imperative persistence. */
class PersistedState<TValue> {
  #value: TValue = $state(undefined as unknown as TValue);
  #key: string;
  #storage: ReturnType<typeof makeFakeStorage>;

  constructor(storage: ReturnType<typeof makeFakeStorage>, key: string, defaultValue: TValue) {
    this.#storage = storage;
    this.#key = key;
    const raw = storage.getItem(key);
    this.#value = raw !== null ? (JSON.parse(raw) as TValue) : defaultValue;
    if (raw === null) this.#persist(defaultValue); // CR-01: persist default on init
  }

  #persist(v: TValue): void {
    this.#storage.setItem(this.#key, JSON.stringify(v));
  }

  // Reactive read — invoking the getter tracks the `$state` dependency.
  get current(): TValue {
    return this.#value;
  }

  // Arrow fields so `const { set, update } = persisted` keeps `this` (Group E).
  set = (v: TValue): void => {
    this.#value = v;
    this.#persist(v);
  };

  update = (fn: (cur: TValue) => TValue): void => {
    this.#value = fn(this.#value);
    this.#persist(this.#value);
  };
}

describe('Spike 021 — localStorage wrapping as a class', () => {
  it('constructs OUTSIDE any effect context (factory / SSR safe — contains no $effect)', () => {
    const storage = makeFakeStorage();
    // No $effect.root here — bare construction, like calling it inside initXxxContext().
    expect(() => new PersistedState(storage, 'k', { n: 0 })).not.toThrow();
    // Default was persisted on init (CR-01).
    expect(storage.getItem('k')).toBe(JSON.stringify({ n: 0 }));
  });

  it('reads the stored value on init (rehydration) and exposes it via current', () => {
    const storage = makeFakeStorage();
    storage.setItem('pref', JSON.stringify({ dark: true }));
    const p = new PersistedState(storage, 'pref', { dark: false });
    expect(p.current).toEqual({ dark: true }); // rehydrated, not default
  });

  it('current is reactive: a $derived off it recomputes after set(), and storage is written', () => {
    const storage = makeFakeStorage();
    let p!: PersistedState<{ n: number }>;
    const seen: Array<number> = [];

    const cleanup = $effect.root(() => {
      p = new PersistedState(storage, 'count', { n: 0 });
      const n = $derived(p.current.n);
      $effect(() => {
        seen.push(n);
      });
    });
    flushSync();
    expect(seen.at(-1)).toBe(0);

    p.set({ n: 7 });
    flushSync();
    expect(seen.at(-1)).toBe(7); // reactive read propagated
    expect(storage.getItem('count')).toBe(JSON.stringify({ n: 7 })); // persisted
    cleanup();
  });

  it('update() is reactive and persists; both set/update survive DETACH (arrow fields)', () => {
    const storage = makeFakeStorage();
    let p!: PersistedState<{ n: number }>;
    const seen: Array<number> = [];

    const cleanup = $effect.root(() => {
      p = new PersistedState(storage, 'c', { n: 1 });
      const n = $derived(p.current.n);
      $effect(() => {
        seen.push(n);
      });
    });
    flushSync();

    // Detach the writers — the trap that kills regular methods.
    const { set, update } = p;
    update((cur) => ({ n: cur.n + 1 }));
    flushSync();
    expect(seen.at(-1)).toBe(2);

    set({ n: 100 });
    flushSync();
    expect(seen.at(-1)).toBe(100);
    expect(storage.getItem('c')).toBe(JSON.stringify({ n: 100 }));
    cleanup();
  });
});
