import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { INACTIVE_PROJECTION } from '$lib/analytics/modes';

// ─────────────────────────────────────────────────────────────────────────────
// Own-enumerability spread regression guard for `AppContextProvider`.
//
// appContext is spread by ALL THREE downstream orchestrators:
//   contestantContext.svelte.ts   ...appContext adminContext.svelte.ts       ...appContext voterContext.svelte.ts       ...appContext
//
// `{ ...instance }` copies only OWN-ENUMERABLE properties. Svelte 5 compiles bare `$state`/`$derived` class fields AND prototype `get` accessors to non-own members, which object spread silently DROPS. This test proves every AppContext member survives `{ ...new AppContextProvider() }` as an own-enumerable property (asserted via `Object.keys`, NOT `in` — `in` would also pass for prototype members, defeating the whole point).
//
// `new AppContextProvider()` relies on `getComponentContext()` / `getDataContext()` from the Svelte context (absent headlessly) and the app producers (tracking/survey/popup/getRoute) + `localStorageState`. All are mocked to minimal own-enumerable handle stubs so construction runs without a live tree, mirroring the authContext/trackingService test idiom.
// ─────────────────────────────────────────────────────────────────────────────

// `vi.mock` factories are hoisted; mutable holders they reference are created via `vi.hoisted` (also hoisted, evaluated first).
const { stubs, dataRootHolder, initialDataRoot, trackingLog } = vi.hoisted(() => {
  function handle<TValue>(value: TValue): { current: TValue } {
    return { current: value };
  }
  // What appContext hands the tracking and survey producers, and what it calls on the tracking stand-in.
  const trackingLog: {
    input: { projection: { current: unknown }; locale: () => string } | undefined;
    surveyInput: { sessionId: unknown } | undefined;
    calls: Array<string>;
    buffer: Array<string>;
    flushed: Array<Array<string>>;
  } = { input: undefined, surveyInput: undefined, calls: [], buffer: [], flushed: [] };
  // Mutable backing for the dataCtx stub's `dataRoot` ACCESSOR (below), so a case can replace the value AFTER construction and observe whether appContext re-reads the source or serves a construction-time snapshot.
  const initialDataRoot: unknown = { marker: 'dataRoot-initial' };
  const dataRootHolder: { value: unknown } = { value: initialDataRoot };
  return {
    trackingLog,
    dataRootHolder,
    initialDataRoot,
    stubs: {
      // componentCtx: STABLE members (t/translate) + reactive reads (locale/locales/darkMode read directly, not as handles).
      component: {
        t: (key: string) => key,
        translate: (key: string) => key,
        locale: 'en',
        locales: ['en', 'fi'],
        darkMode: false
      },
      // dataCtx: bare own-enumerable reactive accessor + arrow-field writer. `dataRoot` is a bare value, not a `{ current }` handle.
      //
      // The ACCESSOR SHAPE here is LOAD-BEARING, not cosmetic: production's `DataContextProvider` installs `dataRoot` as an own-enumerable accessor (`Object.defineProperty(…, { get, enumerable: true })`), and appContext forwards the whole dataCtx surface with `inheritContextMembers`, which installs a LIVE forwarding accessor for an accessor member but a frozen VALUE COPY for a plain data member. A plain-data stub would therefore make a value-copy regression pass silently. An object-literal `get` is an own-enumerable accessor property — the same descriptor shape production has.
      data: {
        get dataRoot(): unknown {
          return dataRootHolder.value;
        },
        setDataRoot: (_v: unknown) => {}
      },
      // tracking producer: own-enumerable handle objects + arrow-field methods, the producer's whole surface.
      //
      // The stand-in records what appContext does with it: `startEvent` / `resetAllEvents` / `submitAllEvents` keep a stand-in buffer and a call log, and `gate` reads the projection handle appContext passes in, so a case can check the order of the consent writes and the projection fallback. `surveySessionId` is on the stand-in because the producer has it; appContext must withhold it, which the forward case below asserts.
      tracking: {
        startPageview: (_routeId: string | null, _params: Readonly<Record<string, string | undefined>> | null) => {},
        startEvent: (name: string) => {
          trackingLog.calls.push(`startEvent:${name}`);
          trackingLog.buffer.push(name);
        },
        track: (_name: string, _data?: unknown) => {},
        submitAllEvents: () => {
          trackingLog.flushed.push([...trackingLog.buffer]);
          trackingLog.buffer.length = 0;
        },
        resetAllEvents: () => {
          trackingLog.calls.push('resetAllEvents');
          trackingLog.buffer.length = 0;
        },
        setPageVisible: (_visible: boolean) => {},
        gate: {
          get current() {
            return {
              projection: trackingLog.input?.projection.current,
              globalPrivacyControl: false,
              trackEvents: true,
              consent: undefined
            };
          }
        },
        surveySessionId: handle<string | undefined>('visit-id')
      },
      // survey producer: `{ readonly current }` handle.
      survey: handle('https://example.invalid/survey' as string | undefined),
      // popup queue producer — matches the real `PopupState` surface (`current` getter + `push`/`shift` arrow fields; no store-style `subscribe`).
      popup: { current: undefined, push: (_item: unknown) => {}, shift: () => {} },
      // getRoute producer: `{ readonly current: RouteBuilder }` handle.
      getRoute: handle((() => '/') as unknown),
      // localStorageState persisted handle.
      // localStorageState persisted handle; `update` is logged so a case can check it runs before the buffer is cleared.
      userPreferences: {
        current: {},
        set: (_v: unknown) => {},
        update: (_fn: unknown) => {
          trackingLog.calls.push('userPreferences.update');
        }
      }
    }
  };
});

// `page.data` is read synchronously by the SSR field initializers (`mergeInitialAppSettings(..., page.data?.appSettingsData)`); provide a minimal page with empty `data` so the merge falls back to static defaults.
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
vi.mock('./tracking', () => ({
  trackingService: (input: { projection: { current: unknown }; locale: () => string }) => {
    trackingLog.input = input;
    return stubs.tracking;
  }
}));
vi.mock('./survey.svelte', () => ({
  surveyLink: (input: { sessionId: unknown }) => {
    trackingLog.surveyInput = input;
    return stubs.survey;
  }
}));
vi.mock('./popup', () => ({ popupState: () => stubs.popup }));
vi.mock('./getRoute.svelte', () => ({ createGetRoute: () => stubs.getRoute }));
vi.mock('../utils/persistedState.svelte', () => ({
  localStorageState: () => stubs.userPreferences
}));

// `AppContextProvider` is exported as a documented test seam.
// Production code must use the `initAppContext()` / `getAppContext()` factory wrappers.
const { AppContextProvider } = await import('./appContext.svelte');

describe('AppContextProvider — own-enumerability spread guard', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.clearAllMocks();
    // Reset the dataCtx stub backing so no case leaks its replacement into another.
    dataRootHolder.value = initialDataRoot;
    trackingLog.input = undefined;
    trackingLog.surveyInput = undefined;
    trackingLog.calls.length = 0;
    trackingLog.buffer.length = 0;
    trackingLog.flushed.length = 0;
  });

  /**
   * Construct the provider inside `$effect.root` so its constructor `$effect`s settle, then `flushSync`. Returns the instance.
   */
  function setup(): InstanceType<typeof AppContextProvider> {
    let instance!: InstanceType<typeof AppContextProvider>;
    cleanup = $effect.root(() => {
      instance = new AppContextProvider();
    });
    flushSync();
    return instance;
  }

  // The AppContext member list — derived from appContext.type.ts. Every one of these must survive the `{ ...appContext }` spread as an OWN-ENUMERABLE key.
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
    // forwarded tracking members — the six consumer-facing functions and the producer's `gate` under the name `analyticsGate`. The producer's `surveySessionId` is withheld, and its `gate` is not forwarded under its own name; the tracking-forward case below asserts both.
    'startPageview',
    'startEvent',
    'track',
    'submitAllEvents',
    'resetAllEvents',
    'setPageVisible',
    'analyticsGate'
  ] as const;

  // Test 1 — own-enumerability: `Object.keys(spread)` is a superset of the AppContext member list. A per-key loop names any missing member in the failure.
  it('`{ ...instance }` captures every AppContext member as an own-enumerable property', () => {
    const instance = setup();
    const spread = { ...instance };
    const keys = Object.keys(spread);
    for (const key of EXPECTED_KEYS) {
      // `Object.keys` (own-enumerable only) — NOT `in`, which also passes for prototype members and would hide a dropped-from-spread regression.
      expect(keys, `member "${key}" missing from { ...appContext } own keys`).toContain(key);
    }
  });

  // Test 2 — bare reactive-accessor integrity: appSettings/dataRoot/locale are BARE own-enumerable reactive accessors, installed via `Object.defineProperty(this, …, { enumerable: true })`. `{ ...instance }` copies a defineProperty enumerable getter as a VALUE (the getter is invoked once at spread time), so the bare members are present and readable on the spread copy.
  // The guard that matters: a PROTOTYPE getter would be DROPPED by the spread — the own-enumerable defineProperty is what makes "bare field" + "spread-safe" coexist.
  it('bare reactive members survive the spread as own-enumerable values', () => {
    const instance = setup();
    const spread = { ...instance };
    // Bare reads — no `.current` wrapper.
    expect(spread.appSettings).toBeDefined();
    // locale reads through the defineProperty getter → live (mocked) componentCtx locale.
    expect(spread.locale).toBe('en');
    // The defineProperty enumerable accessors must STILL appear in Object.keys(spread) (a prototype getter would silently vanish from the spread).
    expect(Object.keys(spread)).toContain('appSettings');
    expect(Object.keys(spread)).toContain('dataRoot');
    expect(Object.keys(spread)).toContain('locale');
  });

  // Live-forwarding guard for the dataCtx inherit. appContext forwards the whole dataCtx surface via `inheritContextMembers`, which re-installs `dataRoot` as a LIVE accessor delegating to `dataContext` on EVERY read — not a snapshot taken at construction. That liveness is the whole point: production's `dataRoot` is an identity-stable `#version`-bridge accessor populated AFTER appContext is built, so a value copy would hand every consumer a permanently empty DataRoot.
  //
  // Asserted on the INSTANCE, deliberately NOT on a spread copy: `{ ...instance }` necessarily invokes the getter once and snapshots the result (Test 2 covers that side). A value-copy forward cannot satisfy this case — negative-control verified by temporarily forwarding `dataRoot` by value, which makes the second assertion report the stale initial marker.
  it('dataRoot is forwarded LIVE from dataContext, not snapshotted at construction', () => {
    const instance = setup();
    expect(instance.dataRoot as unknown).toBe(initialDataRoot);

    // Replace the source value AFTER construction, exactly as the real DataRoot population happens after appContext is built.
    const replacement: unknown = { marker: 'dataRoot-replaced' };
    dataRootHolder.value = replacement;

    expect(instance.dataRoot as unknown).toBe(replacement);
  });

  // Edge case — the read-write `appType` handle survives the spread intact so downstream consumers can call `.set` / `.update` on the spread copy.
  it('the read-write appType handle (set/update) survives the spread', () => {
    const instance = setup();
    const spread = { ...instance };
    expect(typeof spread.appType.set).toBe('function');
    expect(typeof spread.appType.update).toBe('function');
    spread.appType.set('voter');
    expect(spread.appType.current).toBe('voter');
  });

  describe('tracking wiring', () => {
    it('forwards exactly the consumer-facing tracking members, by reference, and the gate as analyticsGate', () => {
      const instance = setup();
      const keys = Object.keys(instance);
      expect(keys).not.toContain('surveySessionId');
      expect(keys).not.toContain('gate');
      // No send handler of any name: the only `send*` member of the context is its own `sendFeedback`.
      expect(keys.filter((key) => key.startsWith('send'))).toEqual(['sendFeedback']);
      expect(instance.analyticsGate).toBe(stubs.tracking.gate);
      expect(instance.setPageVisible).toBe(stubs.tracking.setPageVisible);
      expect(instance.startPageview).toBe(stubs.tracking.startPageview);
      expect(instance.resetAllEvents).toBe(stubs.tracking.resetAllEvents);
    });

    it('falls back to INACTIVE_PROJECTION when page.data has no analytics member', () => {
      const instance = setup();
      expect(trackingLog.input?.projection.current).toEqual(INACTIVE_PROJECTION);
      expect(instance.analyticsGate.current.projection).toEqual(INACTIVE_PROJECTION);
      expect(typeof trackingLog.input?.locale()).toBe('string');
    });

    it("fills the survey link from the producer's surveySessionId", () => {
      setup();
      expect(trackingLog.surveyInput?.sessionId).toBe(stubs.tracking.surveySessionId);
    });

    it("setDataConsent('granted') writes the choice, clears the buffer, then starts dataConsent_granted", () => {
      const instance = setup();
      instance.startEvent('menu_open');
      trackingLog.calls.length = 0;
      instance.setDataConsent('granted');
      instance.submitAllEvents();
      expect(trackingLog.calls).toEqual(['userPreferences.update', 'resetAllEvents', 'startEvent:dataConsent_granted']);
      expect(trackingLog.flushed).toEqual([['dataConsent_granted']]);
    });

    it("setDataConsent('denied') writes the choice and clears the buffer", () => {
      const instance = setup();
      instance.startEvent('menu_open');
      trackingLog.calls.length = 0;
      instance.setDataConsent('denied');
      instance.submitAllEvents();
      expect(trackingLog.calls).toEqual(['userPreferences.update', 'resetAllEvents']);
      expect(trackingLog.flushed).toEqual([[]]);
    });
  });
});
