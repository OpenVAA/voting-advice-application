import { dynamicSettings } from '@openvaa/app-shared';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

// How `AppContextProvider` recomputes its effective settings when the root loader hands it a new payload. The first payload of a session and a later one may differ on purpose (an anonymous visitor and a signed-in user read different rows), so a member the earlier payload set and the later one omits has to read its shipped default again.
//
// The provider is constructed headlessly with the same stubs as `appContext.spread.svelte.test.ts`. The one difference is `page.data`, which is reactive here so that assigning a payload reruns the provider's effect.

// The loader payload `page.data.appSettingsData` holds, and a counter that changes on a navigation which hands over the same payload again.
let appSettingsData = $state.raw<unknown>(undefined);
let navigations = $state.raw(0);

const { stubs } = vi.hoisted(() => ({
  stubs: {
    component: {
      t: (key: string) => key,
      translate: (key: string) => key,
      locale: 'en',
      locales: ['en', 'fi'],
      darkMode: false
    },
    data: {
      get dataRoot(): unknown {
        return {};
      },
      setDataRoot: (_v: unknown) => {}
    },
    tracking: {
      startPageview: (_routeId: string | null, _params: Readonly<Record<string, string | undefined>> | null) => {},
      startEvent: (_name: string) => {},
      track: (_name: string, _data?: unknown) => {},
      submitAllEvents: () => {},
      resetAllEvents: () => {},
      setPageVisible: (_visible: boolean) => {},
      gate: {
        current: {
          projection: { active: false, consentMode: 'gated', visitIdMode: 'memory' },
          globalPrivacyControl: false,
          trackEvents: false,
          consent: undefined
        }
      },
      surveySessionId: { current: undefined as string | undefined }
    },
    survey: { current: undefined as string | undefined },
    popup: { current: undefined, push: (_item: unknown) => {}, shift: () => {} },
    getRoute: { current: (() => '/') as unknown },
    userPreferences: { current: {}, set: (_v: unknown) => {}, update: (_fn: unknown) => {} }
  }
}));

vi.mock('$app/state', () => ({
  page: {
    get data() {
      // Carrying the counter makes every navigation rerun the effects that read `page.data`, also when the payload is the same object.
      return { appSettingsData, navigations };
    },
    params: {},
    route: { id: null },
    url: new URL('http://localhost/')
  }
}));

vi.mock('$app/environment', () => ({ browser: false }));
vi.mock('../component', () => ({ getComponentContext: () => stubs.component }));
vi.mock('../data', () => ({ getDataContext: () => stubs.data }));
vi.mock('./tracking', () => ({ trackingService: () => stubs.tracking }));
vi.mock('./survey.svelte', () => ({ surveyLink: () => stubs.survey }));
vi.mock('./popup', () => ({ popupState: () => stubs.popup }));
vi.mock('./getRoute.svelte', () => ({ createGetRoute: () => stubs.getRoute }));
vi.mock('../utils/persistedState.svelte', () => ({
  localStorageState: () => stubs.userPreferences
}));

const { AppContextProvider } = await import('./appContext.svelte');

describe('AppContextProvider — the settings recompute on a new loader payload', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    appSettingsData = undefined;
    navigations = 0;
  });

  /**
   * Construct the provider inside `$effect.root` so its constructor effects settle, then flush.
   */
  function setup(): InstanceType<typeof AppContextProvider> {
    let instance!: InstanceType<typeof AppContextProvider>;
    cleanup = $effect.root(() => {
      instance = new AppContextProvider();
    });
    flushSync();
    return instance;
  }

  /**
   * Hand the provider a loader payload, as a navigation or an invalidation does.
   */
  function load(payload: unknown): void {
    appSettingsData = payload;
    navigations += 1;
    flushSync();
  }

  it('starts from the shipped defaults when the loader has handed over nothing', () => {
    const instance = setup();

    expect(instance.appSettings.access).toEqual(dynamicSettings.access);
  });

  it('reads the shipped default again for a member the previous payload set and the new one omits', () => {
    const instance = setup();
    expect(dynamicSettings.access.voterApp).toBe(true);

    load({ access: { voterApp: false } });
    expect(instance.appSettings.access.voterApp).toBe(false);

    load({ access: { contestantApp: true } });
    expect(instance.appSettings.access.voterApp).toBe(true);
    expect(instance.appSettings.access).toEqual(dynamicSettings.access);
  });

  it('reads the shipped default again for a root the previous payload set and the new one omits', () => {
    const instance = setup();

    load({ access: { voterApp: false }, contestantApp: { entityTypes: ['organization'] } });
    expect(instance.appSettings.access.voterApp).toBe(false);
    expect(instance.appSettings.contestantApp.entityTypes).toEqual(['organization']);

    load({ matching: { minimumAnswers: 1 } });
    expect(instance.appSettings.access).toEqual(dynamicSettings.access);
    expect(instance.appSettings.contestantApp).toEqual(dynamicSettings.contestantApp);
    expect(instance.appSettings.matching.minimumAnswers).toBe(1);
  });

  it('keeps the effective settings object when a navigation hands over the same payload', () => {
    const instance = setup();
    const payload = { access: { voterApp: false } };
    load(payload);
    const before = instance.appSettings;

    load(payload);

    expect(instance.appSettings).toBe(before);
  });

  it('keeps the effective settings when the new payload is an Error or is missing', () => {
    const instance = setup();
    load({ access: { voterApp: false } });

    load(new Error('the settings failed to load'));
    expect(instance.appSettings.access.voterApp).toBe(false);

    load(undefined);
    expect(instance.appSettings.access.voterApp).toBe(false);
  });
});
