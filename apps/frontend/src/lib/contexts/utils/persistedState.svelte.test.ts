import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// These top-level vi.mock calls are hoisted and apply to ALL dynamic imports.
vi.mock('@openvaa/app-shared', () => ({
  // `persistedState` now logs through the shared logger, so this factory must supply it or the parse-failure path throws on an undefined member.
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  staticSettings: {
    appVersion: {
      version: 2,
      requireUserDataVersion: 1
    }
  }
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

    // Regression guard: the default must be persisted on init (not only on set/update) so a non-deterministic default — e.g. a generated session UUID that is never explicitly `set` — survives a reload. A fresh handle created with a DIFFERENT default must read the FIRST handle's value.
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
