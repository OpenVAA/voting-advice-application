import type { EventAttributes, EventName } from '$lib/analytics/events.schema';

/**
 * A name a call site may track: every name of the event vocabulary except the pageview, which the tracking service builds itself.
 */
export type TrackingEventName = Exclude<EventName, 'pageview'>;

/**
 * The attributes a call site passes for the event `TName`, exactly as the event vocabulary defines them.
 */
export type TrackingEventData<TName extends TrackingEventName> = EventAttributes<TName>;

/**
 * An analytics event of the vocabulary: its name and the attributes that event may carry.
 */
export interface TrackingEvent<TName extends TrackingEventName = TrackingEventName> {
  name: TName;
  data: TrackingEventData<TName>;
}
