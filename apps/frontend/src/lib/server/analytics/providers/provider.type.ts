import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';
import type { ProviderName } from '../config';

/**
 * One destination for usage events. A provider receives events only, never the request that carried them, so nothing about the visitor's request can reach it.
 */
export type AnalyticsProvider = {
  /** Which provider this is. */
  readonly name: ProviderName;
  /**
   * Hand a batch of events on. The promise always resolves: a failure is logged without any event content and is not passed to the caller.
   *
   * @param events - The events of one batch, already validated and stamped by the relay.
   */
  capture(events: ReadonlyArray<AnalyticsEvent>): Promise<void>;
};

/** What a provider may use from its surroundings, passed in so that a test can hand it stand-ins. */
export type ProviderDeps = {
  /** The function a provider makes outbound requests with. */
  fetch: typeof fetch;
  /** Writes one output line, including its trailing newline, to the server's output stream. */
  write: (line: string) => void;
  /** Returns a fresh random identifier on every call. */
  randomId: () => string;
};
