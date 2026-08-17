import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ComponentContextProvider } from './componentContext.svelte';
import type { ComponentContext } from './componentContext.type';

// `DarkMode` (composed by `ComponentContextProvider`) reads `browser` from
// `$app/environment` in its constructor. A mutable holder lets each test pick
// the SSR path (browser=false → `$state(false)` default, no matchMedia) or the
// browser path (browser=true → reads the mocked `matchMedia` below).
const { env } = vi.hoisted(() => ({ env: { browser: false } }));

vi.mock('$app/environment', () => ({
  get browser() {
    return env.browser;
  },
  dev: true,
  building: false,
  version: 'test'
}));

// `getI18nContext()` reads from a Svelte context in production. Mock the i18n
// module so it returns a deterministic plain object literal `{ locale, locales,
// t, translate }` — all OWN properties, mirroring the real factory's return
// shape — so the provider's `Object.assign(this, getI18nContext())` copies them
// onto the instance as own (spread-safe) properties.
const i18n = {
  locale: 'en',
  locales: ['en', 'fi'] as ReadonlyArray<string>,
  t: vi.fn((key: string) => key),
  translate: vi.fn((s: unknown) => String(s))
};
vi.mock('../i18n', () => ({
  getI18nContext: () => i18n
}));

describe('ComponentContextProvider', () => {
  afterEach(() => {
    env.browser = false;
    vi.clearAllMocks();
  });

  // Behavior 1 — i18n members are OWN enumerable properties so `{ ...instance }`
  // carries all four (the appContext `...componentCtx` spread contract, line ~297).
  it('exposes locale/locales/t/translate as own properties surviving the spread', () => {
    const spread = { ...new ComponentContextProvider() };
    expect('locale' in spread).toBe(true);
    expect('locales' in spread).toBe(true);
    expect('t' in spread).toBe(true);
    expect('translate' in spread).toBe(true);
    // Values copied verbatim from the i18n surface.
    expect(spread.locale).toBe('en');
    expect(spread.locales).toEqual(['en', 'fi']);
    expect(typeof spread.t).toBe('function');
    expect(typeof spread.translate).toBe('function');
    // darkMode is a prototype delegation getter — must NOT survive the spread
    // so appContext's post-spread override is the sole source.
    expect('darkMode' in spread).toBe(false); // prototype getter — must not survive the spread
  });

  // Behavior 2 — `instance.darkMode` is a delegation getter forwarding the
  // composed DarkMode helper, reflecting the mocked prefers-color-scheme state.
  it('darkMode delegates to the composed DarkMode helper (SSR default false)', () => {
    const instance = new ComponentContextProvider();
    // browser=false (SSR path): DarkMode keeps its `$state(false)` default.
    expect(instance.darkMode).toBe(false);
  });

  it('darkMode reflects matchMedia(prefers-color-scheme: dark) in the browser path', () => {
    env.browser = true;
    const matchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
    vi.stubGlobal('matchMedia', matchMedia);
    vi.stubGlobal('window', { matchMedia });

    let instance!: ComponentContextProvider;
    const cleanup = $effect.root(() => {
      instance = new ComponentContextProvider();
    });
    flushSync();
    expect(instance.darkMode).toBe(true);
    cleanup();
    vi.unstubAllGlobals();
  });

  // Behavior 3 — the instance structurally satisfies `ComponentContext`
  // (I18nContext & { darkMode: boolean }).
  it('structurally satisfies ComponentContext', () => {
    const instance: ComponentContext = new ComponentContextProvider();
    expect(typeof instance.t).toBe('function');
    expect(typeof instance.translate).toBe('function');
    expect(typeof instance.locale).toBe('string');
    expect(Array.isArray(instance.locales)).toBe(true);
    expect(typeof instance.darkMode).toBe('boolean');
  });
});
