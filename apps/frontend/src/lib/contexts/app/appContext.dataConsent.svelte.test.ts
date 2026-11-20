import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Which stored consent choice `AppContextProvider` writes and hands to the tracking service.
//
// The Contestant App keeps its own choice (`contestantDataConsent`), so a contestant's choice never answers the voter app's consent prompt nor covers the voter app's sensitive events. The user-preferences stub is LIVE and the page's route id is mutable, so a case can set the route, write a choice and read back which member holds it.
// ─────────────────────────────────────────────────────────────────────────────

type Choice = { consent: string; date: string };
type Prefs = { dataCollection?: Choice; contestantDataConsent?: Choice };

const { stubs, prefsHolder, route, trackingInputs } = vi.hoisted(() => {
  const prefsHolder: { value: { dataCollection?: unknown; contestantDataConsent?: unknown } } = { value: {} };
  const route: { id: string | null } = { id: null };
  const trackingInputs: { routeId?: () => string | null | undefined } = {};
  return {
    prefsHolder,
    route,
    trackingInputs,
    stubs: {
      component: {
        t: (key: string) => key,
        translate: (key: string) => key,
        locale: 'en',
        locales: ['en'],
        darkMode: false
      },
      data: {
        get dataRoot(): unknown {
          return undefined;
        },
        setDataRoot: (_v: unknown) => {}
      },
      tracking: {
        startPageview: (_routeId: string | null, _params: unknown) => {},
        track: vi.fn((_name: string, _data?: unknown) => {}),
        submitAllEvents: () => {},
        resetAllEvents: vi.fn(() => {}),
        setPageVisible: (_visible: boolean) => {},
        gate: { current: {} },
        surveySessionId: { current: undefined as string | undefined }
      },
      survey: { current: undefined as string | undefined },
      popup: { current: undefined, push: (_item: unknown) => {}, shift: () => {} },
      getRoute: { current: (() => '/') as unknown },
      userPreferences: {
        get current() {
          return prefsHolder.value;
        },
        set(v: typeof prefsHolder.value) {
          prefsHolder.value = v;
        },
        update(fn: (d: typeof prefsHolder.value) => typeof prefsHolder.value) {
          prefsHolder.value = fn(prefsHolder.value);
        }
      }
    }
  };
});

vi.mock('$app/state', () => ({
  page: {
    get data() {
      return {};
    },
    params: {},
    route,
    url: new URL('http://localhost/')
  }
}));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('../component', () => ({ getComponentContext: () => stubs.component }));
vi.mock('../data', () => ({ getDataContext: () => stubs.data }));
vi.mock('./tracking', () => ({
  trackingService: (inputs: { routeId?: () => string | null | undefined }) => {
    trackingInputs.routeId = inputs.routeId;
    return stubs.tracking;
  }
}));
vi.mock('./survey.svelte', () => ({ surveyLink: () => stubs.survey }));
vi.mock('./popup', () => ({ popupState: () => stubs.popup }));
vi.mock('./getRoute.svelte', () => ({ createGetRoute: () => stubs.getRoute }));
vi.mock('../utils/persistedState.svelte', () => ({
  localStorageState: () => stubs.userPreferences
}));

const { AppContextProvider } = await import('./appContext.svelte');

describe('AppContextProvider — the stored consent choice of each app', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    prefsHolder.value = {};
    route.id = null;
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.clearAllMocks();
  });

  function setup(): InstanceType<typeof AppContextProvider> {
    let instance!: InstanceType<typeof AppContextProvider>;
    cleanup = $effect.root(() => {
      instance = new AppContextProvider();
    });
    flushSync();
    return instance;
  }

  function prefs(): Prefs {
    return prefsHolder.value as Prefs;
  }

  it('on a Contestant App route writes contestantDataConsent and leaves the voter choice untouched', () => {
    const ctx = setup();
    route.id = '/contestant/(protected)';
    ctx.setDataConsent('granted');
    expect(prefs().contestantDataConsent?.consent).toBe('granted');
    expect(prefs().dataCollection).toBeUndefined();
  });

  it('on a voter app route writes dataCollection and leaves the contestant choice untouched', () => {
    prefsHolder.value = { contestantDataConsent: { consent: 'granted', date: '2026-10-19' } };
    const ctx = setup();
    route.id = '/(voters)/privacy';
    ctx.setDataConsent('denied');
    expect(prefs().dataCollection?.consent).toBe('denied');
    expect(prefs().contestantDataConsent?.consent).toBe('granted');
  });

  it('with no matched route writes the voter choice', () => {
    const ctx = setup();
    ctx.setDataConsent('denied');
    expect(prefs().dataCollection?.consent).toBe('denied');
    expect(prefs().contestantDataConsent).toBeUndefined();
  });

  it('empties the event buffer on every change and tracks a grant', () => {
    const ctx = setup();
    route.id = '/contestant/privacy';
    ctx.setDataConsent('granted');
    expect(stubs.tracking.resetAllEvents).toHaveBeenCalledTimes(1);
    expect(stubs.tracking.track).toHaveBeenCalledWith('dataConsent_granted');
  });

  it('hands the tracking service the current route id, read at each call', () => {
    setup();
    expect(trackingInputs.routeId).toBeTypeOf('function');
    route.id = '/contestant/privacy';
    expect(trackingInputs.routeId?.()).toBe('/contestant/privacy');
    route.id = '/(voters)/questions';
    expect(trackingInputs.routeId?.()).toBe('/(voters)/questions');
  });
});
