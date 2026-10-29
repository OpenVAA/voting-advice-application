import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INACTIVE_PROJECTION } from '$lib/analytics/modes';
import { ROUTE } from '$lib/routes/route';
import type { AnalyticsProjection, ConsentMode, VisitIdMode } from '$lib/analytics/modes';
import type { ConsentStatus, UserPreferences } from '../userPreferences.type';

/** Minimal rune-shaped `{ current }` handle for a producer input. */
function handle<TValue>(value: TValue): { current: TValue } {
  return { current: value };
}

/** The bodies handed to the mocked transport, in order. */
let sentBodies: Array<string> = [];

async function importTracking(browser: boolean) {
  vi.doMock('$app/environment', () => ({ browser }));
  vi.doMock('./relayTransport', () => ({
    sendBatch: (body: string) => {
      sentBodies.push(body);
    }
  }));
  const mod = await import('./trackingService.svelte');
  // Imported after the producer, so these are the module instances the producer holds. `vi.resetModules()` also gives the producer a fresh Svelte runtime, so a `$state` of this file is not a dependency it can track; a `SvelteMap` of that same runtime is.
  const { getVisitId } = await import('./visitId');
  const { SvelteMap } = await import('svelte/reactivity');
  /** A `{ current }` handle whose changes reach the producer's `$derived` gate. */
  function reactiveHandle<TValue>(value: TValue): { current: TValue } {
    const store = new SvelteMap<'current', TValue>([['current', value]]);
    return {
      get current() {
        return store.get('current') as TValue;
      },
      set current(next: TValue) {
        store.set('current', next);
      }
    };
  }
  return { ...mod, getVisitId, reactiveHandle };
}

function appSettingsHandle(trackEvents: boolean) {
  return handle({ analytics: { trackEvents } } as unknown as AppSettings);
}

function userPrefsHandle(consent: ConsentStatus | undefined) {
  return handle({ dataCollection: consent ? { consent, date: '2026-10-19' } : undefined } as UserPreferences);
}

function activeProjection(consentMode: ConsentMode = 'gated', visitIdMode: VisitIdMode = 'memory') {
  return handle<AnalyticsProjection>({ active: true, consentMode, visitIdMode });
}

/** The service inputs: an active gated projection, `trackEvents` on and no consent, unless overridden. */
function inputs(
  overrides: {
    trackEvents?: boolean;
    consent?: ConsentStatus;
    projection?: { current: AnalyticsProjection };
  } = {}
) {
  return {
    appSettings: appSettingsHandle(overrides.trackEvents ?? true),
    userPreferences: userPrefsHandle(overrides.consent),
    projection: overrides.projection ?? activeProjection(),
    locale: () => 'en'
  };
}

type SentEvent = { name: string; ago: number; id?: string; attributes: Record<string, unknown> };
type SentBody = { routeId: string; locale: string; events: Array<SentEvent> };

/** The parsed bodies handed to the transport. */
function bodies(): Array<SentBody> {
  return sentBodies.map((body) => JSON.parse(body) as SentBody);
}

/** The event names of every body handed to the transport, one list per body. */
function namesPerBody(): Array<Array<string>> {
  return bodies().map((body) => body.events.map((event) => event.name));
}

/** A listed pageview route with no parameters. */
const HOME = ROUTE.Home;
const QUESTION_ID = 'question-1';

/** The stand-in clock the producer reads through `performance.now()`. */
let clock = 0;

describe('trackingService (pure-rune producer)', () => {
  beforeEach(() => {
    vi.resetModules();
    sentBodies = [];
    clock = 1_000;
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock('./relayTransport');
    Reflect.deleteProperty(navigator, 'globalPrivacyControl');
  });

  it('sends nothing when the projection is inactive', async () => {
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted', projection: handle(INACTIVE_PROJECTION) }));
      svc.startPageview(HOME, {});
      svc.startEvent('menu_open');
      svc.track('maintenance_shown');
      svc.submitAllEvents();
      expect(sentBodies).toHaveLength(0);
    });
    cleanup();
  });

  it('sends only the pageview when trackEvents is off', async () => {
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ trackEvents: false, consent: 'granted' }));
      svc.startPageview(HOME, {});
      svc.startEvent('menu_open');
      svc.submitAllEvents();
      expect(namesPerBody()).toEqual([['pageview']]);
    });
    cleanup();
  });

  it('in gated mode with no consent sends only the pageview, and never flushes the earlier events later', async () => {
    const { trackingService, reactiveHandle } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const prefs = reactiveHandle({ dataCollection: undefined } as UserPreferences);
      const svc = trackingService({ ...inputs(), userPreferences: prefs });
      svc.startPageview(HOME, {});
      svc.startEvent('menu_open');
      svc.startEvent('answer_delete', { questionId: QUESTION_ID });
      svc.submitAllEvents();
      expect(namesPerBody()).toEqual([['pageview']]);

      prefs.current = { ...prefs.current, dataCollection: { consent: 'granted', date: '2026-10-19' } };
      svc.submitAllEvents();
      svc.startEvent('answer_resetAll');
      svc.submitAllEvents();
      expect(namesPerBody()).toEqual([['pageview'], ['answer_resetAll']]);
    });
    cleanup();
  });

  it('with consent granted sends the pageview with no id and the events with the visit id', async () => {
    const { trackingService, getVisitId } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted' }));
      svc.startPageview(HOME, {});
      svc.startEvent('menu_open');
      svc.startEvent('answer_delete', { questionId: QUESTION_ID });
      svc.submitAllEvents();
      const [body] = bodies();
      expect(body.events.map((event) => event.name)).toEqual(['pageview', 'menu_open', 'answer_delete']);
      expect(body.events[0].id).toBeUndefined();
      expect(body.events[1].id).toBe(getVisitId());
      expect(body.events[2].id).toBe(getVisitId());
    });
    cleanup();
  });

  it('in free mode with no consent sends the events, the sensitive one without an id', async () => {
    const { trackingService, getVisitId } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ projection: activeProjection('free') }));
      svc.startPageview(HOME, {});
      svc.startEvent('answer_delete', { questionId: QUESTION_ID });
      svc.startEvent('menu_open');
      svc.submitAllEvents();
      const [body] = bodies();
      const byName = Object.fromEntries(body.events.map((event) => [event.name, event]));
      expect(Object.keys(byName)).toEqual(['pageview', 'answer_delete', 'menu_open']);
      expect(byName.answer_delete.id).toBeUndefined();
      expect(byName.menu_open.id).toBe(getVisitId());
    });
    cleanup();
  });

  it('in visit-id mode none attaches no id to any event', async () => {
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted', projection: activeProjection('gated', 'none') }));
      svc.startPageview(HOME, {});
      svc.startEvent('menu_open');
      svc.startEvent('answer_delete', { questionId: QUESTION_ID });
      svc.submitAllEvents();
      const [body] = bodies();
      expect(body.events).toHaveLength(3);
      for (const event of body.events) expect(event.id).toBeUndefined();
    });
    cleanup();
  });

  it('sends nothing when Global Privacy Control is set', async () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true });
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted', projection: activeProjection('free') }));
      svc.startPageview(HOME, {});
      svc.startEvent('menu_open');
      svc.submitAllEvents();
      expect(sentBodies).toHaveLength(0);
    });
    cleanup();
  });

  it('puts the pageview of a view in the first flush only', async () => {
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted' }));
      svc.startPageview(HOME, {});
      svc.submitAllEvents();
      svc.startEvent('menu_open');
      svc.submitAllEvents();
      svc.submitAllEvents();
      expect(namesPerBody()).toEqual([['pageview'], ['menu_open']]);
    });
    cleanup();
  });

  it('resetAllEvents clears the events and keeps the pageview of the view', async () => {
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted' }));
      svc.startPageview(HOME, {});
      svc.startEvent('menu_open');
      svc.startEvent('answer_delete', { questionId: QUESTION_ID });
      svc.resetAllEvents();
      svc.submitAllEvents();
      expect(namesPerBody()).toEqual([['pageview']]);
    });
    cleanup();
  });

  it('track() buffers: it sends nothing by itself and its event is in the next flush', async () => {
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted' }));
      svc.startPageview(HOME, {});
      svc.track('maintenance_shown');
      expect(sentBodies).toHaveLength(0);
      svc.submitAllEvents();
      expect(namesPerBody()).toEqual([['pageview', 'maintenance_shown']]);
    });
    cleanup();
  });

  it('startPageview(null, null) starts no view, so a flush sends no pageview', async () => {
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted' }));
      svc.startPageview(null, null);
      svc.submitAllEvents();
      expect(sentBodies).toHaveLength(0);
    });
    cleanup();
  });

  describe('surveySessionId', () => {
    it('is the visit id in visit-id mode memory when events may be sent', async () => {
      const { trackingService, getVisitId } = await importTracking(true);
      const cleanup = $effect.root(() => {
        const svc = trackingService(inputs({ consent: 'granted' }));
        expect(svc.surveySessionId.current).toBe(getVisitId());
      });
      cleanup();
    });

    it('is undefined in every other case', async () => {
      const { trackingService } = await importTracking(true);
      const cleanup = $effect.root(() => {
        const cases = [
          inputs({ consent: 'granted', projection: activeProjection('gated', 'none') }),
          inputs({ consent: undefined }),
          inputs({ consent: 'denied' }),
          inputs({ trackEvents: false, consent: 'granted' }),
          inputs({ consent: 'granted', projection: handle(INACTIVE_PROJECTION) })
        ];
        for (const input of cases) expect(trackingService(input).surveySessionId.current).toBeUndefined();
      });
      cleanup();
    });

    it('is undefined when Global Privacy Control is set', async () => {
      Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true });
      const { trackingService } = await importTracking(true);
      const cleanup = $effect.root(() => {
        expect(trackingService(inputs({ consent: 'granted' })).surveySessionId.current).toBeUndefined();
      });
      cleanup();
    });
  });

  it('never writes to a browser store', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted' }));
      svc.startPageview(HOME, {});
      svc.startEvent('menu_open');
      svc.track('maintenance_shown');
      expect(svc.surveySessionId.current).toBeTypeOf('string');
      svc.submitAllEvents();
    });
    cleanup();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('passes no event name or payload to a log call', async () => {
    const methods = ['debug', 'info', 'log', 'warn', 'error'] as const;
    const spies = methods.map((method) => vi.spyOn(console, method).mockImplementation(() => undefined));
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted' }));
      svc.startPageview(HOME, {});
      svc.startEvent('answer_delete', { questionId: QUESTION_ID });
      svc.track('maintenance_shown');
      svc.submitAllEvents();
      svc.startPageview(null, null);
      svc.startEvent('menu_open');
      svc.submitAllEvents();
    });
    cleanup();
    const logged = spies.flatMap((spy) => spy.mock.calls).map((args) => JSON.stringify(args));
    for (const line of logged) {
      for (const needle of ['answer_delete', 'maintenance_shown', 'menu_open', QUESTION_ID])
        expect(line).not.toContain(needle);
    }
  });

  // The members `appContext` takes from this producer travel on through the three downstream `{ ...appContext }` spreads, and the forward itself is an `Object.assign`, which, like spread, copies OWN-ENUMERABLE properties only. Svelte 5 compiles bare `$state`/`$derived` CLASS fields to PROTOTYPE accessors that are not own-enumerable and would be dropped by both.
  it('reactive members and methods survive `{ ...svc }` spread', async () => {
    const { trackingService, getVisitId } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted' }));
      const spread = { ...svc };
      expect(spread.gate?.current.projection.active).toBe(true);
      expect(spread.surveySessionId?.current).toBe(getVisitId());
      expect(typeof spread.startEvent).toBe('function');
      expect(typeof spread.setPageVisible).toBe('function');
      expect(typeof spread.submitAllEvents).toBe('function');
    });
    cleanup();
  });

  // EXACT own-enumerable surface lock, deliberately not a superset check. `appContext` forwards an explicit list of these members and withholds `surveySessionId`, which it reads producer to producer. Add a member here on purpose, and decide explicitly whether it joins appContext's forward and the `AppContext` type.
  it('exposes EXACTLY eight own-enumerable members', async () => {
    const { trackingService } = await importTracking(true);
    const cleanup = $effect.root(() => {
      const svc = trackingService(inputs({ consent: 'granted' }));
      const expected = [
        'startPageview',
        'startEvent',
        'track',
        'submitAllEvents',
        'resetAllEvents',
        'setPageVisible',
        'gate',
        'surveySessionId'
      ];
      expect(Object.keys(svc).sort()).toEqual([...expected].sort());
    });
    cleanup();
  });
});
