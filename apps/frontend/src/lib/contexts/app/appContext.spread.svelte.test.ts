import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Own-enumerability spread regression guard for `AppContextProvider` (CLASS-04).
//
// appContext is spread by ALL THREE downstream orchestrators which Phase 109 does
// NOT touch:
//   candidateContext.svelte.ts:366   ...appContext
//   adminContext.svelte.ts:98        ...appContext
//   voterContext.svelte.ts:488       ...appContext
//
// `{ ...instance }` copies only OWN-ENUMERABLE properties. Svelte 5 compiles bare
// `$state`/`$derived` class fields AND prototype `get` accessors to non-own
// members, which object spread silently DROPS. This test proves every AppContext
// member survives `{ ...new AppContextProvider() }` as an own-enumerable property
// (asserted via `Object.keys`, NOT `in` — `in` would also pass for prototype
// members, defeating the whole point).
//
// `new AppContextProvider()` relies on `getComponentContext()` / `getDataContext()`
// from the Svelte context (absent headlessly) and the app producers
// (tracking/survey/popup/getRoute) + `localStorageState`. All are mocked to
// minimal own-enumerable handle stubs so construction runs without a live tree,
// mirroring the authContext/trackingService test idiom.
// ─────────────────────────────────────────────────────────────────────────────

// `vi.mock` factories are hoisted; mutable holders they reference are created via
// `vi.hoisted` (also hoisted, evaluated first).
const { stubs } = vi.hoisted(() => {
  const handle = <TValue>(value: TValue): { current: TValue } => ({ current: value });
  return {
    stubs: {
      // componentCtx: STABLE members (t/translate) + reactive reads
      // (locale/locales/darkMode read directly, not as handles).
      component: {
        t: (key: string) => key,
        translate: (key: string) => key,
        locale: 'en',
        locales: ['en', 'fi'],
        darkMode: false
      },
      // dataCtx: bare own-enumerable reactive accessor (Phase 113 FLATTEN-02) +
      // arrow-field writer. `dataRoot` is now a bare value, not a `{ current }` handle.
      data: {
        dataRoot: {} as unknown,
        setDataRoot: (_v: unknown) => {}
      },
      // tracking producer: own-enumerable handle objects + arrow-field methods.
      tracking: {
        sendTrackingEvent: { current: () => {}, set: (_v: unknown) => {} },
        sessionId: handle('sess-0'),
        shouldTrack: handle(false),
        startPageview: (_href: string) => {},
        startEvent: (_name: string) => {},
        track: (_name: string, _data?: unknown) => {},
        submitAllEvents: () => {},
        resetAllEvents: () => {}
      },
      // survey producer: `{ readonly current }` handle.
      survey: handle('https://example.invalid/survey' as string | undefined),
      // popup queue producer — matches the real `PopupState` surface
      // (`current` getter + `push`/`shift` arrow fields; no store-style `subscribe`).
      popup: { current: undefined, push: (_item: unknown) => {}, shift: () => {} },
      // getRoute producer: `{ readonly current: RouteBuilder }` handle.
      getRoute: handle((() => '/') as unknown),
      // localStorageState persisted handle.
      userPreferences: { current: {}, set: (_v: unknown) => {}, update: (_fn: unknown) => {} }
    }
  };
});

// `page.data` is read synchronously by the SSR field initializers
// (`mergeInitialAppSettings(..., page.data?.appSettingsData)`); provide a minimal
// page with empty `data` so the merge falls back to static defaults.
vi.mock('$app/state', () => ({
  page: {
    get data() {
      return {};
    },
    params: {},
    route: { id: null },
    url: new URL('http://localhost/')
  }
}));

vi.mock('$app/environment', () => ({ browser: false }));

// Upstream contexts (absent headlessly) — return own-enumerable stubs.
vi.mock('../component', () => ({ getComponentContext: () => stubs.component }));
vi.mock('../data', () => ({ getDataContext: () => stubs.data }));

// App producers — minimal own-enumerable handle stubs so construction runs.
vi.mock('./tracking', () => ({ trackingService: () => stubs.tracking }));
vi.mock('./survey.svelte', () => ({ surveyLink: () => stubs.survey }));
vi.mock('./popup', () => ({ popupState: () => stubs.popup }));
vi.mock('./getRoute.svelte', () => ({ createGetRoute: () => stubs.getRoute }));
vi.mock('../utils/persistedState.svelte', () => ({
  localStorageState: () => stubs.userPreferences
}));

// `AppContextProvider` is exported as a documented test seam (109-03).
// Production code must use the `initAppContext()` / `getAppContext()` factory wrappers.
const { AppContextProvider } = await import('./appContext.svelte');

describe('AppContextProvider — own-enumerability spread guard', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.clearAllMocks();
  });

  /**
   * Construct the provider inside `$effect.root` so its constructor `$effect`s
   * settle, then `flushSync`. Returns the instance.
   */
  function setup(): InstanceType<typeof AppContextProvider> {
    let instance!: InstanceType<typeof AppContextProvider>;
    cleanup = $effect.root(() => {
      instance = new AppContextProvider();
    });
    flushSync();
    return instance;
  }

  // The AppContext member list — derived from appContext.type.ts. Every one of
  // these must survive the `{ ...appContext }` spread as an OWN-ENUMERABLE key.
  const EXPECTED_KEYS = [
    // appContext-owned reactive handles + members
    'locale',
    'locales',
    'darkMode',
    'appType',
    'appCustomization',
    'appSettings',
    'getRoute',
    'surveyLink',
    'userPreferences',
    'popupQueue',
    'openFeedbackModal',
    'sendFeedback',
    'startFeedbackPopupCountdown',
    'startSurveyPopupCountdown',
    'setDataConsent',
    'setFeedbackStatus',
    'setSurveyStatus',
    // forwarded componentCtx STABLE members
    't',
    'translate',
    // forwarded dataCtx members
    'dataRoot',
    'setDataRoot',
    // forwarded tracking members
    'sendTrackingEvent',
    'sessionId',
    'shouldTrack',
    'startPageview',
    'startEvent',
    'track',
    'submitAllEvents',
    'resetAllEvents'
  ] as const;

  // Test 1 — own-enumerability: `Object.keys(spread)` is a superset of the
  // AppContext member list. A per-key loop names any missing member in the failure.
  it('`{ ...instance }` captures every AppContext member as an own-enumerable property', () => {
    const instance = setup();
    const spread = { ...instance };
    const keys = Object.keys(spread);
    for (const key of EXPECTED_KEYS) {
      // `Object.keys` (own-enumerable only) — NOT `in`, which also passes for
      // prototype members and would hide a dropped-from-spread regression.
      expect(keys, `member "${key}" missing from { ...appContext } own keys`).toContain(key);
    }
  });

  // Test 2 — bare reactive-accessor integrity: appSettings/dataRoot/locale are now
  // BARE own-enumerable reactive accessors (Phase 113 FLATTEN-02), installed via
  // `Object.defineProperty(this, …, { enumerable: true })`. `{ ...instance }` copies
  // a defineProperty enumerable getter as a VALUE (the getter is invoked once at
  // spread time), so the bare members are present and readable on the spread copy.
  // The Pitfall-3 guard: a PROTOTYPE getter would be DROPPED by the spread — the
  // own-enumerable defineProperty is what makes "bare field" + "spread-safe" coexist.
  it('bare reactive members survive the spread as own-enumerable values', () => {
    const instance = setup();
    const spread = { ...instance };
    // Bare reads — no `.current` wrapper.
    expect(spread.appSettings).toBeDefined();
    // locale reads through the defineProperty getter → live (mocked) componentCtx locale.
    expect(spread.locale).toBe('en');
    // Pitfall-3 guard: the defineProperty enumerable accessors must STILL appear in
    // Object.keys(spread) (a prototype getter would silently vanish from the spread).
    expect(Object.keys(spread)).toContain('appSettings');
    expect(Object.keys(spread)).toContain('dataRoot');
    expect(Object.keys(spread)).toContain('locale');
  });

  // Edge case — the read-write `appType` handle survives the spread intact so
  // downstream consumers can call `.set` / `.update` on the spread copy.
  it('the read-write appType handle (set/update) survives the spread', () => {
    const instance = setup();
    const spread = { ...instance };
    expect(typeof spread.appType.set).toBe('function');
    expect(typeof spread.appType.update).toBe('function');
    spread.appType.set('voter');
    expect(spread.appType.current).toBe('voter');
  });
});
