import { derived, get, type Readable, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getUUID } from '$lib/utils/components';
import { logDebugError } from '$lib/utils/logger';
import { purgeNullish } from '../../../utils/purgeNullish';
import { sessionStorageWritable } from '../../utils/storageStore';
import type { UserPreferences } from '../userPreferences.type';
import type { TrackingEvent } from './trackingEvent.type';
import type { TrackingHandler, TrackingService } from './trackingService.type';

export function trackingService({
  appSettings,
  userPreferences
}: {
  appSettings: Readable<AppSettings>;
  userPreferences: Readable<UserPreferences>;
}): TrackingService {
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
  // Stores
  ////////////////////////////////////////////////////////////////////

  const sessionId = sessionStorageWritable('appContext-sessionId', getUUID());

  const sendTrackingEvent = writable<TrackingHandler | null | undefined>(undefined);

  const shouldTrack = derived(
    [appSettings, userPreferences],
    ([appSettings, userPreferences]) =>
      browser && appSettings.analytics.trackEvents && userPreferences.dataCollection?.consent === 'granted',
    false
  );

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
    if (get(shouldTrack) && (pageviewEvent || unsubmittedEvents?.length)) {
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
    if (!get(shouldTrack)) return;
    const send = get(sendTrackingEvent);
    if (!send) return;
    const dataToSend = purgeNullish({ vaaSessionId: get(sessionId), ...data });
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
