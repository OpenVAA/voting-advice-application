import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// These top-level vi.mock calls are hoisted and apply to ALL dynamic imports.
vi.mock('@openvaa/app-shared', () => ({
  staticSettings: {
    appVersion: {
      version: 2,
      requireUserDataVersion: 1
    }
  }
}));

vi.mock('$lib/utils/logger', () => ({
  logDebugError: vi.fn()
}));

/**
 * Helper to import the module with a specific browser value.
 * Uses vi.doMock (not hoisted) combined with vi.resetModules() for per-test isolation.
 */
async function importWithBrowser(browser: boolean) {
  vi.doMock('$app/environment', () => ({ browser }));
  const mod = await import('./persistedState.svelte');
  return mod;
}

describe('persistedState helpers', () => {
  let mockStorageData: Record<string, string>;
  let mockLocalStorage: Storage;
  let mockSessionStorage: Storage;

  beforeEach(() => {
    vi.resetModules();
    mockStorageData = {};

    function createMockStorage(): Storage {
      return {
        getItem: vi.fn((key: string) => mockStorageData[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorageData[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorageData[key];
        }),
        clear: vi.fn(() => {
          mockStorageData = {};
        }),
        get length() {
          return Object.keys(mockStorageData).length;
        },
        key: vi.fn((index: number) => Object.keys(mockStorageData)[index] ?? null)
      };
    }
    mockLocalStorage = createMockStorage();
    mockSessionStorage = createMockStorage();

    Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, configurable: true });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: mockSessionStorage,
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('localStorageWritable returns defaultValue when localStorage is empty', async () => {
    const { localStorageWritable } = await importWithBrowser(true);
    const store = localStorageWritable('test-key', 'default');
    let value: string | undefined;
    const unsub = store.subscribe((v) => (value = v));
    expect(value).toBe('default');
    unsub();
  });

  it('localStorageWritable reads existing versioned data when version >= requireUserDataVersion', async () => {
    mockStorageData['test-key'] = JSON.stringify({ version: 2, data: 'stored-value' });
    const { localStorageWritable } = await importWithBrowser(true);
    const store = localStorageWritable('test-key', 'default');
    let value: string | undefined;
    const unsub = store.subscribe((v) => (value = v));
    expect(value).toBe('stored-value');
    unsub();
  });

  it('localStorageWritable ignores stored data and removes key when version < requireUserDataVersion', async () => {
    mockStorageData['test-key'] = JSON.stringify({ version: 0, data: 'old-value' });
    const { localStorageWritable } = await importWithBrowser(true);
    const store = localStorageWritable('test-key', 'default');
    let value: string | undefined;
    const unsub = store.subscribe((v) => (value = v));
    expect(value).toBe('default');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    unsub();
  });

  it('sessionStorageWritable returns defaultValue when sessionStorage is empty', async () => {
    const { sessionStorageWritable } = await importWithBrowser(true);
    const store = sessionStorageWritable('session-key', 42);
    let value: number | undefined;
    const unsub = store.subscribe((v) => (value = v));
    expect(value).toBe(42);
    unsub();
  });

  it('sessionStorageWritable reads existing data from sessionStorage (no versioning)', async () => {
    mockStorageData['session-key'] = JSON.stringify('session-data');
    const { sessionStorageWritable } = await importWithBrowser(true);
    const store = sessionStorageWritable('session-key', 'default');
    let value: string | undefined;
    const unsub = store.subscribe((v) => (value = v));
    expect(value).toBe('session-data');
    unsub();
  });

  it('saves localStorage data in versioned format { version, data }', async () => {
    const { localStorageWritable } = await importWithBrowser(true);
    const store = localStorageWritable('save-test', 'initial');
    const unsub = store.subscribe(() => {});

    // The subscribe callback in storageWritable fires synchronously on creation,
    // persisting the initial value immediately.
    const saved = mockStorageData['save-test'];
    expect(saved).toBeDefined();
    const parsed = JSON.parse(saved);
    expect(parsed).toHaveProperty('version', 2);
    expect(parsed).toHaveProperty('data', 'initial');
    unsub();
  });

  it('handles JSON parse errors gracefully (returns null / uses default)', async () => {
    mockStorageData['bad-json'] = 'not-valid-json{{{';
    const { localStorageWritable } = await importWithBrowser(true);
    const store = localStorageWritable('bad-json', 'fallback');
    let value: string | undefined;
    const unsub = store.subscribe((v) => (value = v));
    expect(value).toBe('fallback');
    unsub();
  });

  it('returns defaultValue when browser is false (SSR)', async () => {
    const { localStorageWritable } = await importWithBrowser(false);
    const store = localStorageWritable('ssr-key', 'ssr-default');
    let value: string | undefined;
    const unsub = store.subscribe((v) => (value = v));
    expect(value).toBe('ssr-default');
    unsub();
  });

  describe('localStorageState (rune-native helper)', () => {
    it('returns defaultValue when nothing is stored', async () => {
      const { localStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const store = localStorageState('ls-empty', 'default');
        expect(store.current).toBe('default');
      });
      cleanup();
    });

    it('returns defaultValue under the SSR (browser=false) path', async () => {
      const { localStorageState } = await importWithBrowser(false);
      const cleanup = $effect.root(() => {
        const store = localStorageState('ls-ssr', 'ssr-default');
        expect(store.current).toBe('ssr-default');
      });
      cleanup();
    });

    it('set(v) updates current AND writes the versioned { version, data } payload', async () => {
      const { localStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const store = localStorageState('ls-set', 'initial');
        store.set('next');
        expect(store.current).toBe('next');
        const saved = mockStorageData['ls-set'];
        expect(saved).toBeDefined();
        const parsed = JSON.parse(saved);
        expect(parsed).toHaveProperty('version', 2);
        expect(parsed).toHaveProperty('data', 'next');
      });
      cleanup();
    });

    it('update(fn) applies fn(current) and persists', async () => {
      const { localStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const store = localStorageState<number>('ls-update', 1);
        store.update((cur) => cur + 4);
        expect(store.current).toBe(5);
        const parsed = JSON.parse(mockStorageData['ls-update']);
        expect(parsed).toHaveProperty('data', 5);
      });
      cleanup();
    });

    it('round-trips a previously-written value via a fresh localStorageState', async () => {
      const { localStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const a = localStorageState('ls-roundtrip', 'default');
        a.set('persisted');
        const b = localStorageState('ls-roundtrip', 'default');
        expect(b.current).toBe('persisted');
      });
      cleanup();
    });

    it('discards a stale/wrong-version payload and falls back to default (no migration shim)', async () => {
      mockStorageData['ls-stale'] = JSON.stringify({ version: 0, data: 'old-value' });
      const { localStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const store = localStorageState('ls-stale', 'default');
        expect(store.current).toBe('default');
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('ls-stale');
      });
      cleanup();
    });
  });

  describe('sessionStorageState (rune-native helper)', () => {
    it('returns defaultValue when nothing is stored', async () => {
      const { sessionStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const store = sessionStorageState('ss-empty', 'default');
        expect(store.current).toBe('default');
      });
      cleanup();
    });

    it('returns defaultValue under the SSR (browser=false) path', async () => {
      const { sessionStorageState } = await importWithBrowser(false);
      const cleanup = $effect.root(() => {
        const store = sessionStorageState('ss-ssr', 'ssr-default');
        expect(store.current).toBe('ssr-default');
      });
      cleanup();
    });

    it('set(v) updates current AND writes the RAW (non-versioned) payload', async () => {
      const { sessionStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const store = sessionStorageState('ss-set', 'initial');
        store.set('next');
        expect(store.current).toBe('next');
        const saved = mockSessionStorage.setItem;
        expect(saved).toHaveBeenCalled();
        const raw = mockStorageData['ss-set'];
        expect(raw).toBeDefined();
        // Session payload is the RAW JSON value — NO { version, data } wrapper.
        const parsed = JSON.parse(raw);
        expect(parsed).toBe('next');
        expect(parsed).not.toHaveProperty('version');
        expect(parsed).not.toHaveProperty('data');
      });
      cleanup();
    });

    it('update(fn) applies fn(current) and persists the raw value', async () => {
      const { sessionStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const store = sessionStorageState<number>('ss-update', 1);
        store.update((cur) => cur + 4);
        expect(store.current).toBe(5);
        expect(JSON.parse(mockStorageData['ss-update'])).toBe(5);
      });
      cleanup();
    });

    it('round-trips a previously-written value via a fresh sessionStorageState', async () => {
      const { sessionStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const a = sessionStorageState('ss-roundtrip', 'default');
        a.set('persisted');
        const b = sessionStorageState('ss-roundtrip', 'default');
        expect(b.current).toBe('persisted');
      });
      cleanup();
    });

    it('reads a pre-existing raw (non-versioned) sessionStorage payload', async () => {
      mockStorageData['ss-preexisting'] = JSON.stringify('session-data');
      const { sessionStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const store = sessionStorageState('ss-preexisting', 'default');
        expect(store.current).toBe('session-data');
      });
      cleanup();
    });

    // CR-01 regression: the default must be persisted on init (not only on
    // set/update) so a non-deterministic default — e.g. a generated session
    // UUID that is never explicitly `set` — survives a reload. A fresh handle
    // created with a DIFFERENT default must read the FIRST handle's value.
    it('persists the default on init so a never-set value survives a fresh handle (reload)', async () => {
      const { sessionStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        // First load: nothing stored, default is "generated" once. Never `set`.
        const first = sessionStorageState('ss-sessionid', 'uuid-first');
        expect(first.current).toBe('uuid-first');
        expect(mockStorageData['ss-sessionid']).toBeDefined();
        // Reload: a fresh handle with a *different* default must NOT regenerate.
        const second = sessionStorageState('ss-sessionid', 'uuid-second');
        expect(second.current).toBe('uuid-first');
      });
      cleanup();
    });

    it('does NOT persist on init under the SSR (browser=false) path', async () => {
      const { sessionStorageState } = await importWithBrowser(false);
      const cleanup = $effect.root(() => {
        sessionStorageState('ss-ssr-noinit', 'default');
        expect(mockStorageData['ss-ssr-noinit']).toBeUndefined();
      });
      cleanup();
    });
  });

  describe('storageState init persistence (CR-01)', () => {
    it('localStorageState persists the default on init so a never-set value survives a fresh handle', async () => {
      const { localStorageState } = await importWithBrowser(true);
      const cleanup = $effect.root(() => {
        const first = localStorageState('ls-initpersist', 'uuid-first');
        expect(first.current).toBe('uuid-first');
        const saved = mockStorageData['ls-initpersist'];
        expect(saved).toBeDefined();
        expect(JSON.parse(saved)).toHaveProperty('data', 'uuid-first');
        const second = localStorageState('ls-initpersist', 'uuid-second');
        expect(second.current).toBe('uuid-first');
      });
      cleanup();
    });
  });
});
