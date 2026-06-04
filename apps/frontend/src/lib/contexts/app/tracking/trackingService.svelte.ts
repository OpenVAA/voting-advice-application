import { browser } from '$app/environment';
import { getUUID } from '$lib/utils/components';
import { logDebugError } from '$lib/utils/logger';
import { purgeNullish } from '../../../utils/purgeNullish';
import { sessionStorageState } from '../../utils/persistedState.svelte';
import type { UserPreferences } from '../userPreferences.type';
import type { TrackingEvent } from './trackingEvent.type';
import type { TrackingHandler, TrackingService } from './trackingService.type';

/**
 * A rune-shaped read handle: a value exposed via a `current` getter so the
 * producer can take a reactive read-dependency without a store bridge.
 */
type ReactiveHandle<TValue> = { readonly current: TValue };

/**
 * A rune-shaped read+write handle (the producer's `sendTrackingEvent` surface).
 */
type WritableHandle<TValue> = { current: TValue; set: (v: TValue) => void };

/**
 * The pure-rune internal shape of the tracking service. The `appContext` seam
 * owns the store conversion of the store-shaped properties (`sendTrackingEvent`,
 * `sessionId`, `shouldTrack`) declared on the exported `TrackingService` type —
 * this producer exposes them as rune handles.
 */
export type RuneTrackingService = Omit<TrackingService, 'sendTrackingEvent' | 'sessionId' | 'shouldTrack'> & {
  sendTrackingEvent: WritableHandle<TrackingHandler | null | undefined>;
  sessionId: ReactiveHandle<string>;
  shouldTrack: ReactiveHandle<boolean>;
};

/**
 * Pure-rune tracking-service producer (CTX-06): reads its `appSettings` /
 * `userPreferences` inputs via `.current` getters and exposes its outputs as
 * rune handles — no store bridge over the inputs nor the outputs. The
 * store-shaped exported surface (`sendTrackingEvent`/`sessionId`/`shouldTrack`
 * per `trackingService.type.ts`) is reconstructed by the `appContext` seam.
 */
export function trackingService({
  appSettings,
  userPreferences
}: {
  appSettings: ReactiveHandle<AppSettings>;
  userPreferences: ReactiveHandle<UserPreferences>;
}): RuneTrackingService {
  ////////////////////////////////////////////////////////////////////
  // Internal state variables
  ////////////////////////////////////////////////////////////////////

  /**
   * Contains the current pageview event, which will be automatically submitted containing any other submitted events when the user leaves the page or hides or closes the window.
   */
  let pageviewEvent:
    | {
        href: string;
        from?: string;
        start?: number;
      }
    | undefined = undefined;

  /**
   * Contains any unsubmitted compound events. These will be automatically submitted when the user leaves the app.
   */
  let unsubmittedEvents: Array<TrackingEvent> = [];

  ////////////////////////////////////////////////////////////////////
  // Reactive state
  ////////////////////////////////////////////////////////////////////

  // Persistent session id, read as a rune handle (`.current`) so this producer
  // stays store-free. The seam wraps it back to a `Readable<string>` for the
  // exported `sessionId` surface (trackingService.type.ts).
  const sessionId = sessionStorageState('appContext-sessionId', getUUID());

  let sendTrackingEventValue = $state<TrackingHandler | null | undefined>(undefined);
  const sendTrackingEvent: WritableHandle<TrackingHandler | null | undefined> = {
    get current() {
      return sendTrackingEventValue;
    },
    set(v) {
      sendTrackingEventValue = v;
    }
  };

  const shouldTrackValue = $derived(
    browser &&
      appSettings.current.analytics.trackEvents &&
      userPreferences.current.dataCollection?.consent === 'granted'
  );
  const shouldTrack: ReactiveHandle<boolean> = {
    get current() {
      return shouldTrackValue;
    }
  };

  ////////////////////////////////////////////////////////////////////
  // Tracking functions
  ////////////////////////////////////////////////////////////////////

  function startPageview(href: string, from?: string | null) {
    if (pageviewEvent) logDebugError('Pageview already started');
    pageviewEvent = {
      href,
      from: from ?? undefined,
      start: Date.now()
    };
  }

  function startEvent(name: TrackingEvent['name'], data: TrackingEvent['data'] = {}) {
    const event = { name, data };
    unsubmittedEvents.push(event);
    return event;
  }

  function submitAllEvents() {
    if (shouldTrackValue && (pageviewEvent || unsubmittedEvents?.length)) {
      const events: Record<string, TrackingEvent['data']> = {};
      // This shouldn't happen
      if (!pageviewEvent) {
        logDebugError(`No pageviewEvent is available for events: ${JSON.stringify(unsubmittedEvents)}`);
        pageviewEvent = { href: 'UNKNOWN' };
      }
      // Prefix a number to all subevent names
      for (let i = 0; i < unsubmittedEvents.length; i++) {
        // We limit the max events to 50 (umami's limit) minus the ones we're adding by default
        if (i >= 50 - 5) {
          logDebugError(`Too many unsubmitted events: ${unsubmittedEvents.length}`);
          break;
        }
        const { name, data } = unsubmittedEvents[i];
        events[`${i < 10 ? '0' : ''}${i}__${name}`] = data;
      }
      const { href, from, start } = pageviewEvent;
      const duration = start ? Date.now() - start : undefined;
      track('pageview', { href, from, start, duration, ...events });
    }
    resetAllEvents();
  }

  function track(name: TrackingEvent['name'], data: TrackingEvent['data'] = {}) {
    if (!shouldTrackValue) return;
    const send = sendTrackingEventValue;
    if (!send) return;
    const dataToSend = purgeNullish({ vaaSessionId: sessionId.current, ...data });
    logDebugError({ name, data: dataToSend });
    send({ name, data: dataToSend });
  }

  function resetAllEvents() {
    pageviewEvent = undefined;
    unsubmittedEvents = [];
  }

  return {
    resetAllEvents,
    sendTrackingEvent,
    sessionId,
    shouldTrack,
    startEvent,
    startPageview,
    submitAllEvents,
    track
  };
}
