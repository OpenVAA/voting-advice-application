import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserPreferences } from '../userPreferences.type';

/** Minimal rune-shaped `{ current }` handle for a producer input. */
function handle<TValue>(value: TValue): { current: TValue } {
  return { current: value };
}

async function importTracking(browser: boolean) {
  vi.doMock('$app/environment', () => ({ browser }));
  const mod = await import('./trackingService.svelte');
  return mod;
}

function appSettingsHandle(trackEvents: boolean) {
  return handle({ analytics: { trackEvents } } as unknown as AppSettings);
}

function userPrefsHandle(consent: 'granted' | 'denied' | undefined) {
  return handle({ dataCollection: consent ? { consent } : undefined } as UserPreferences);
}

describe('trackingService (pure-rune producer)', () => {
  beforeEach(() => {
    vi.resetModules();
    // sessionStorage is needed by the sessionStorageWritable('appContext-sessionId') call.
    const data: Record<string, string> = {};
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: {
        getItem: (k: string) => data[k] ?? null,
        setItem: (k: string, v: string) => {
          data[k] = v;
        },
        removeItem: (k: string) => {
          delete data[k];
        },
        clear: () => {},
        length: 0,
        key: () => null
      },
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shouldTrack gating truth table', () => {
    it('is true ONLY when browser && trackEvents && consent === granted', async () => {
      const { trackingService } = await importTracking(true);
      const cleanup = $effect.root(() => {
        const svc = trackingService({
          appSettings: appSettingsHandle(true),
          userPreferences: userPrefsHandle('granted')
        });
        expect(svc.shouldTrack.current).toBe(true);
      });
      cleanup();
    });

    it('is false when trackEvents is disabled', async () => {
      const { trackingService } = await importTracking(true);
      const cleanup = $effect.root(() => {
        const svc = trackingService({
          appSettings: appSettingsHandle(false),
          userPreferences: userPrefsHandle('granted')
        });
        expect(svc.shouldTrack.current).toBe(false);
      });
      cleanup();
    });

    it('is false when consent is not granted', async () => {
      const { trackingService } = await importTracking(true);
      const cleanup = $effect.root(() => {
        const svc = trackingService({
          appSettings: appSettingsHandle(true),
          userPreferences: userPrefsHandle('denied')
        });
        expect(svc.shouldTrack.current).toBe(false);
      });
      cleanup();
    });

    it('is false under SSR (browser=false) even when trackEvents+consent allow', async () => {
      const { trackingService } = await importTracking(false);
      const cleanup = $effect.root(() => {
        const svc = trackingService({
          appSettings: appSettingsHandle(true),
          userPreferences: userPrefsHandle('granted')
        });
        expect(svc.shouldTrack.current).toBe(false);
      });
      cleanup();
    });
  });

  describe('event queue + track', () => {
    it('startEvent queues a compound event and submitAllEvents sends a pageview when tracking', async () => {
      const { trackingService } = await importTracking(true);
      const cleanup = $effect.root(() => {
        const svc = trackingService({
          appSettings: appSettingsHandle(true),
          userPreferences: userPrefsHandle('granted')
        });
        const sent: Array<{ name: string; data: Record<string, unknown> }> = [];
        svc.sendTrackingEvent.set((event) => sent.push(event as { name: string; data: Record<string, unknown> }));

        svc.startPageview('/results');
        svc.startEvent('dataConsent_granted');
        svc.submitAllEvents();

        expect(sent).toHaveLength(1);
        expect(sent[0].name).toBe('pageview');
        // track() still includes the vaaSessionId from the session id handle.
        expect(sent[0].data).toHaveProperty('vaaSessionId');
        expect(typeof sent[0].data.vaaSessionId).toBe('string');
      });
      cleanup();
    });

    it('track() is a no-op when shouldTrack is false', async () => {
      const { trackingService } = await importTracking(true);
      const cleanup = $effect.root(() => {
        const svc = trackingService({
          appSettings: appSettingsHandle(false),
          userPreferences: userPrefsHandle('granted')
        });
        const sent: Array<unknown> = [];
        svc.sendTrackingEvent.set((event) => sent.push(event));
        svc.track('pageview', { href: '/x' });
        expect(sent).toHaveLength(0);
      });
      cleanup();
    });
  });

  describe('spread-safety (gate regression guard)', () => {
    // The members `appContext` takes from this producer travel on through the three downstream `{ ...appContext }` spreads (candidateContext / adminContext / voterContext), and the forward itself is an `Object.assign` — which, exactly like spread, copies OWN-ENUMERABLE properties only. Svelte 5 compiles bare `$state`/`$derived` CLASS fields to PROTOTYPE accessors that are NOT own-enumerable and would be DROPPED by both. This case FAILS if any consumed member was implemented as a bare `$derived`/`$state` public class field. It checks all eight rather than only the six appContext forwards, because `sessionId` is additionally read producer-to-producer straight off `#tracking` and so has to stay own-enumerable too.
    it('reactive members + methods survive `{ ...svc }` spread', async () => {
      const { trackingService } = await importTracking(true);
      const cleanup = $effect.root(() => {
        const svc = trackingService({
          appSettings: appSettingsHandle(true),
          userPreferences: userPrefsHandle('granted')
        });
        const spread = { ...svc };
        expect(spread.shouldTrack?.current).toBe(true);
        expect(typeof spread.sendTrackingEvent?.set).toBe('function');
        expect(typeof spread.sessionId?.current).toBe('string');
        expect(typeof spread.startEvent).toBe('function');
        expect(typeof spread.submitAllEvents).toBe('function');
      });
      cleanup();
    });

    // EXACT own-enumerable surface lock — deliberately NOT a `toContain` superset check. It pins THIS PRODUCER's surface at eight members. `appContext` no longer blanket-forwards them: since the tracking-layer collapse it forwards an EXPLICIT list of SIX (the `Object.assign` in `appContext.svelte.ts`'s forwarding block), deliberately withholding `sessionId` and `shouldTrack`. That explicit list is what now stops a new producer member from reaching the contexts implicitly, so this case is no longer a tripwire on silent downstream widening — it locks the producer surface that the list is maintained against, and it is the only place the two withheld members are pinned at all. Add a member here on purpose and you must add it to this list AND decide explicitly whether it joins the six in appContext's forward and the `AppContext` type. The appContext spread guard (`appContext.spread.svelte.test.ts`) is a superset check over `AppContext` and says nothing about this producer.
    it('exposes EXACTLY eight own-enumerable members, of which appContext forwards six', async () => {
      const { trackingService } = await importTracking(true);
      const cleanup = $effect.root(() => {
        const svc = trackingService({
          appSettings: appSettingsHandle(true),
          userPreferences: userPrefsHandle('granted')
        });
        const expected = [
          'sessionId',
          'sendTrackingEvent',
          'shouldTrack',
          'startPageview',
          'startEvent',
          'submitAllEvents',
          'track',
          'resetAllEvents'
        ];
        expect(Object.keys(svc).sort()).toEqual([...expected].sort());
      });
      cleanup();
    });
  });
});
