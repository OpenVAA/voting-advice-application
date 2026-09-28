import type { WritableHandle } from '../../utils/reactiveHandle.type';
import type { TrackingEvent } from './trackingEvent.type';

/**
 * A service provider for tracking functions.
 *
 * This is the ONE tracking-service type: the producer (`trackingService.svelte.ts`) implements it directly and `appContext` forwards it. There is no second, rune-shaped layer — the one this type used to be paired with existed only to re-declare the handle-shaped members while the `appContext` seam still converted them to stores, and that seam is gone.
 *
 * CONSUMER-FACING SURFACE — deliberately narrower than the producer. The producer owns two further handle members (the persistent analytics session id and the tracking-enabled gate) that are read only producer-to-producer: the producer stamps the session id onto every event it sends, and `appContext` passes the same handle into the survey-link producer. Both are therefore ABSENT from this type and forwarded onto NO context — see the selective forward in `appContext.svelte.ts`, which names them and says why they are withheld.
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
   * A writable rune handle containing the function that will send the events. In order for tracking to do anything, this value must be set via `.set(...)` — it is set from the root layout, which is why it stays consumer-facing while the other two handle members do not.
   */
  sendTrackingEvent: WritableHandle<TrackingHandler | null | undefined>;
};

export type TrackingHandler = (event: TrackingEvent<Record<string, JSONData>>) => void;
