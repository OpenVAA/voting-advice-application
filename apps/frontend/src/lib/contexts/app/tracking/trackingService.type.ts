import type { TrackingEvent, TrackingEventData, TrackingEventName } from './trackingEvent.type';

/**
 * A service provider for tracking functions.
 *
 * This is the ONE tracking-service type: the producer (`trackingService.svelte.ts`) implements it directly and `appContext` forwards it.
 *
 * CONSUMER-FACING SURFACE — deliberately narrower than the producer. The producer owns two further handle members: the gate input, which `appContext` forwards under its own name `analyticsGate`, and the survey link's session id, which is read only producer to producer — `appContext` passes it into the survey-link producer and forwards it onto NO context. Both are therefore ABSENT from this type; see the selective forward in `appContext.svelte.ts`.
 *
 * Every event goes into one buffer, and `submitAllEvents` sends the view's pageview and the buffered events the gates allow as one batch to the relay.
 */
export type TrackingService = {
  /**
   * Call at the start of a page view. The view's pageview is sent at the first flush after this call and never again. A route that is not on the pageview list, or no route at all, starts no view.
   * @param routeId - The route id of the page, e.g. `page.route.id`, or `null` when there is none
   * @param params - The route parameters of the page; only those the pageview list allows for the route are kept
   */
  startPageview: (routeId: string | null, params: Readonly<Record<string, string | undefined>> | null) => void;
  /**
   * Buffer an analytics event, to be sent with the next flush.
   * @param name - Event name, one of the vocabulary
   * @param data - The event's attributes. Required when the event has a required attribute, optional when it has none.
   * @returns The buffered event object.
   */
  startEvent: <TName extends TrackingEventName>(name: TName, ...data: TrackingDataArgument<TName>) => TrackingEvent;
  /**
   * Buffer an analytics event, to be sent with the next flush, like `startEvent`. Nothing is sent by this call.
   * @param name - Event name, one of the vocabulary
   * @param data - The event's attributes. Required when the event has a required attribute, optional when it has none.
   */
  track: <TName extends TrackingEventName>(name: TName, ...data: TrackingDataArgument<TName>) => void;
  /**
   * Flush: send the current view's pageview, when it has not been sent, and the buffered events the gates allow, in one request to the relay. The buffer is empty afterwards; events the gates did not allow are discarded.
   */
  submitAllEvents: () => void;
  /**
   * Clear the event buffer. The current view and its pageview are kept.
   */
  resetAllEvents: () => void;
  /**
   * Report a change of the page's visibility, so that the view's duration counts only the time the page was visible.
   * @param visible - Whether the page is visible now
   */
  setPageVisible: (visible: boolean) => void;
};

/**
 * The keys of `TData` that are required, or `never` when every key is optional or there is none.
 */
type RequiredKeys<TData> = {
  [TKey in keyof TData]-?: Record<never, never> extends Pick<TData, TKey> ? never : TKey;
}[keyof TData];

/**
 * The data argument of a tracking call for the event `TName`: required when the event has at least one required attribute, optional when it has none.
 */
export type TrackingDataArgument<TName extends TrackingEventName> = [RequiredKeys<TrackingEventData<TName>>] extends [
  never
]
  ? [data?: TrackingEventData<TName>]
  : [data: TrackingEventData<TName>];
