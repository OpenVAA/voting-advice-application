import type { AnalyticsApp } from './modes';

/**
 * One usage event in the shape the relay keeps it in, before it is mapped to any provider's format.
 *
 * @typeParam TName - The event name, narrowed by the vocabulary that admits it.
 */
export type AnalyticsEvent<TName extends string = string> = {
  /** The event name. */
  name: TName;
  /** Epoch milliseconds, as stamped by the relay. */
  time: number;
  /** The app the event belongs to, derived from the route id of the view it belongs to. */
  app: AnalyticsApp;
  /** The visit id, present only when the event may carry it. */
  id?: string;
  /** The event's attributes, as its vocabulary entry admits them. */
  attributes: Record<string, JSONData>;
};
