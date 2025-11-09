import type { Readable, Writable } from 'svelte/store';
import type { TrackingEvent } from './trackingEvent.type';

/**
 * A service provider for tracking functions.
 */
export type TrackingService = {
  /**
   * Call at the start of a page view to create an event that will be automatically submitted when the user leaves the page or hides or closes the window.
   * @param url - The url of the page
   * @param from - Optional route from which the page was loaded
   */
  startPageview: (url: string, from?: string | null) => void;
  /**
   * Start an analytics event into which you want to add data to later, and which will be automatically submitted as part of the `pageview` event when the user leaves the page or hides or closes the window.
   * @param name - Event name
   * @param data - Initial event data
   * @returns The event object that can be used to add data to.
   */
  startEvent: (name: TrackingEvent['name'], data?: TrackingEvent['data']) => TrackingEvent;
  /**
   * Track an analytics event and send it immediately. For most purposes, it's better to use the `startEvent` function instead, which will collect the events by page and only submit them when the page is unloaded.
   * NB. All event data is routed via `track` when submitted.
   * @param name - Event name
   * @param data - Optional event data
   */
  track: (name: TrackingEvent['name'], data?: TrackingEvent['data']) => void;
  /**
   * Submit all unsubmitted compound events started with `startEvent` and the `pageview` event.
   */
  submitAllEvents: () => void;
  /**
   * Reset all unsubmitted events, including the `pageview` event.
   */
  resetAllEvents: () => void;
  /**
   * A writable store, which contains the function that will send the events. In order for tracking to do anything, this value must be set.
   */
  sendTrackingEvent: Writable<TrackingHandler | null | undefined>;
  /**
   * A store containing the persistent session data.
   * NB. Only edit `sessionData.vaaSessionId` if you're absolutely sure you want to change it.
   */
  sessionData: Writable<SessionData>;
  /**
   * A store resolving to `true` if we should track events.
   */
  shouldTrack: Readable<boolean>;
};

export type TrackingHandler = (event: TrackingEvent<Record<string, JSONData>>) => void;
/**
 * The common data stored for all sessions.
 */

export type SessionData = {
  /**
   * A generated unique identifier for the session, persisting across page loads but regenerated if the tab is closed.
   */
  vaaSessionId: string;
  /**
   * A possible trackingId for the session, passed as a query parameter to the outermost layout.
   */
  trackingId?: string;
};
