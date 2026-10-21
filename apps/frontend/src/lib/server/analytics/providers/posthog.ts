/**
 * The provider that forwards events to PostHog's batch capture endpoint.
 *
 * The onward request is built from the events alone. The provider is never given the visitor's request, so no address, user agent, cookie, URL or referrer can reach PostHog through it; the only header set is the content type. Every item asks PostHog to keep no person profile and to derive no location.
 *
 * A failed forward is logged with a closed whitelist of facts: the transport error's symbolic code, or the HTTP status. Never the host, the key, the request body or the response body.
 */
import { log } from '@openvaa/app-shared';
import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';
import type { AnalyticsProvider, ProviderDeps } from './provider.type';

/** The path of PostHog's batch capture endpoint, joined to the configured host. */
const BATCH_PATH = '/batch/';

/** How long one forward may take before it is abandoned. */
const FORWARD_TIMEOUT_MS = 10_000;

/** The event whose record must never be linked to a visit. */
const PAGEVIEW = 'pageview';

/** One item of a PostHog batch request. */
export type PostHogBatchItem = {
  /** The event name. */
  event: string;
  /** When the event happened, in ISO 8601. */
  timestamp: string;
  /** The id PostHog groups events by: the visit id, or a fresh random id. */
  distinct_id: string;
  /** The event's attributes and the PostHog properties the relay sets. */
  properties: Record<string, JSONData>;
};

/**
 * Map one event to a PostHog batch item. This is the one place an event becomes a PostHog item.
 *
 * The id is the event's visit id when it has one, otherwise one fresh value from `randomId`. A pageview always gets a fresh value, so it is never linked to the visit's other events. `$session_id` is set only from a visit id. The id is written at the top level of the item and inside `properties`, with the same value, because which of the two placements the batch endpoint reads is not settled.
 *
 * @param event - The event as the relay keeps it. It is not changed.
 * @param randomId - Returns a fresh random id; called at most once.
 * @returns The item.
 */
export function toPostHogBatchItem(event: AnalyticsEvent, randomId: () => string): PostHogBatchItem {
  const visitId = event.name === PAGEVIEW ? undefined : event.id;
  const distinctId = visitId ?? randomId();
  return {
    event: event.name,
    timestamp: new Date(event.time).toISOString(),
    distinct_id: distinctId,
    properties: {
      ...event.attributes,
      'openvaa.app': event.app,
      distinct_id: distinctId,
      ...(visitId === undefined ? {} : { $session_id: visitId }),
      $process_person_profile: false,
      $geoip_disable: true
    }
  };
}

/**
 * Create the PostHog provider.
 *
 * @param options - The PostHog host (an origin) and project key, the `fetch` to send with and the random id function.
 * @returns A provider that sends one request per non-empty batch and whose `capture` always resolves.
 */
export function createPostHogProvider({
  host,
  key,
  fetch,
  randomId
}: { host: string; key: string } & Pick<ProviderDeps, 'fetch' | 'randomId'>): AnalyticsProvider {
  const url = new URL(BATCH_PATH, host).href;
  return {
    name: 'posthog',
    async capture(events) {
      if (events.length === 0) return;
      const body = JSON.stringify({ api_key: key, batch: events.map((event) => toPostHogBatchItem(event, randomId)) });
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          redirect: 'error',
          signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS)
        });
      } catch (error) {
        log.warn('Analytics forward to PostHog failed', { transport: transportCode(error) });
        return;
      }
      // The body is not read: it comes from a host outside the deployment. Cancelling it releases the connection.
      response.body?.cancel().catch(() => undefined);
      if (response.status >= 400) log.warn('Analytics forward to PostHog failed', { status: response.status });
    }
  };
}

/**
 * Extract a transport error's symbolic code without touching its message, which may name the host.
 *
 * @param error - The rejection of `fetch`.
 * @returns `TIMEOUT` for an abandoned forward, the cause's code when it is a symbolic constant, otherwise `unidentified`.
 */
function transportCode(error: unknown): string {
  if ((error as { name?: unknown })?.name === 'TimeoutError') return 'TIMEOUT';
  const cause = (error as { cause?: unknown })?.cause;
  const code = (cause as { code?: unknown })?.code;
  return typeof code === 'string' && /^[A-Z][A-Z0-9_]*$/.test(code) ? code : 'unidentified';
}
