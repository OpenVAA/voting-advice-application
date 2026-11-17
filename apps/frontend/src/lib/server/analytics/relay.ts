/**
 * The relay: the one place a visitor's usage request is judged and turned into events.
 *
 * It is a function over the request and the configuration rather than a route, so that what it reads and what it keeps can be tested with no server. The route hands it the request and the server's own origin, and answers with the status it returns.
 *
 * ## What it reads
 *
 * Five request headers by name, `sec-gpc`, `sec-fetch-site`, `origin`, `content-type` and `content-length`, and the body. No other header is read and no client address is taken, so the visitor's address, software and credentials never reach an event, a log record or a provider. No hash of anything is computed.
 *
 * ## What it keeps
 *
 * Only events rebuilt from the fields the closed vocabulary admits. The pageview is built here from the batch's route id and locale, its allowed parameters and a coarsened duration, and it never has an id. Every other event keeps its visit id only when the deployment's modes allow it and the id is a current UUIDv7, whatever the browser sent.
 *
 * ## When it answers
 *
 * As soon as the events are in the queue. It never waits for a provider. A request that carries `Sec-GPC` is answered exactly like an accepted one, so the answer does not reveal that it was dropped.
 */
import { log } from '@openvaa/app-shared';
import { appOfRoute } from '$lib/analytics/appOfRoute';
import { parseBatch } from '$lib/analytics/batch.schema';
import {
  MAX_BODY_BYTES,
  MAX_PAGEVIEW_DURATION_MS,
  MAX_VISIT_ID_SKEW_MS,
  PAGEVIEW_DURATION_ROUNDING_MS
} from '$lib/analytics/constants';
import { isSensitiveEvent } from '$lib/analytics/events.schema';
import { allowedPageviewParams } from '$lib/analytics/pageviewRoutes';
import { isUuidV7, uuidV7TimestampMs } from '$lib/analytics/uuidv7';
import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';
import type { WireEvent } from '$lib/analytics/events.schema';
import type { AnalyticsApp } from '$lib/analytics/modes';
import type { AnalyticsConfig } from './config';

/** What the route hands the relay. */
export type RelayInput = {
  /** The incoming request. */
  request: Request;
  /** The server's own origin, e.g. `https://vaa.example.org`, against which the request's origin is checked. */
  origin: string;
};

/** What the relay may use from its surroundings. */
export type RelayDeps = {
  /** The resolved analytics configuration. */
  config: AnalyticsConfig;
  /** Puts events in the queue without waiting and returns how many were kept. */
  enqueue: (events: ReadonlyArray<AnalyticsEvent>) => number;
  /** The relay's clock in epoch milliseconds; `Date.now` by default. */
  now?: () => number;
};

/** The statuses the relay answers with: 204 accepted or dropped silently, 400 not a valid batch, 403 not same-origin, 413 too large, 415 not JSON. */
export type RelayStatus = 204 | 400 | 403 | 413 | 415;

/** The only media type the relay reads. */
const JSON_MEDIA_TYPE = 'application/json';

/** The outcome of reading the body: its text, or the status to refuse it with. */
type BodyRead = { text: string } | { status: 400 | 413 };

/**
 * Judge one usage request and queue the events it carries.
 *
 * The steps run in order and each returns as soon as it decides: provider `none`, `Sec-GPC`, same origin, media type and size, the batch, the rebuilt events, the queue.
 *
 * @param input - The request and the server's own origin.
 * @param deps - The configuration, the queue's `enqueue` and an optional clock.
 * @returns The status to answer with. It never throws for anything a client sends.
 */
export async function relay(
  { request, origin }: RelayInput,
  { config, enqueue, now = Date.now }: RelayDeps
): Promise<RelayStatus> {
  // Nothing is kept, so nothing of the request is read.
  if (config.provider === 'none') return 204;

  const { headers } = request;
  if (headers.get('sec-gpc') !== null) return 204;
  if (!isSameOrigin(headers.get('sec-fetch-site'), headers.get('origin'), origin)) return 403;
  if (mediaType(headers.get('content-type')) !== JSON_MEDIA_TYPE) return 415;
  const declaredLength = headers.get('content-length');
  if (declaredLength !== null && Number(declaredLength) > MAX_BODY_BYTES) return 413;

  const body = await readBody(request);
  if ('status' in body) return body.status;

  let json: unknown;
  try {
    json = JSON.parse(body.text);
  } catch {
    return 400;
  }
  const batch = parseBatch(json);
  if (!batch.ok) return 400;

  const app = appOfRoute(batch.routeId);
  if (app === undefined) return 400;

  // The count only: a rejected event, its parse issues and the request stay out of the log.
  if (batch.dropped > 0) log.debug('Analytics relay dropped events that failed validation', { dropped: batch.dropped });
  if (batch.events.length === 0) return 204;

  const receivedAt = now();
  const context: BuildContext = { config, app, routeId: batch.routeId, locale: batch.locale, receivedAt };
  enqueue(batch.events.map((event) => buildEvent(event, context)));
  return 204;
}

/**
 * Whether the request comes from a page of this origin: by `Sec-Fetch-Site` when the browser sent it, otherwise by `Origin`.
 *
 * @param fetchSite - The `Sec-Fetch-Site` value, or `null`.
 * @param requestOrigin - The `Origin` value, or `null`.
 * @param ownOrigin - The server's own origin.
 */
function isSameOrigin(fetchSite: string | null, requestOrigin: string | null, ownOrigin: string): boolean {
  if (fetchSite !== null) return fetchSite === 'same-origin';
  return requestOrigin !== null && requestOrigin === ownOrigin;
}

/**
 * The media type of a `Content-Type` value: the part before any parameter, trimmed and in lower case.
 *
 * @param contentType - The header value, or `null`.
 */
function mediaType(contentType: string | null): string | undefined {
  return contentType?.split(';', 1)[0].trim().toLowerCase();
}

/**
 * Read the body as UTF-8 text, stopping as soon as it passes the cap, so a body with no declared length cannot make the server hold more than the cap.
 *
 * @param request - The request.
 * @returns The text, 413 when the body is over the cap, or 400 when it cannot be read or is not UTF-8.
 */
async function readBody(request: Request): Promise<BodyRead> {
  if (request.body === null) return { text: '' };
  const reader = request.body.getReader();
  const chunks = new Array<Uint8Array>();
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { status: 400 };
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { status: 400 };
  }
}

/** What every event of one batch is built with. */
type BuildContext = {
  config: AnalyticsConfig;
  app: AnalyticsApp;
  routeId: string;
  locale: string;
  receivedAt: number;
};

/**
 * Rebuild one parsed event as the event the relay keeps.
 *
 * @param event - An event that passed the vocabulary.
 * @param context - The batch's configuration, app, route id, locale and receive time.
 */
function buildEvent(event: WireEvent, { config, app, routeId, locale, receivedAt }: BuildContext): AnalyticsEvent {
  const time = receivedAt - event.ago;
  if (event.name === 'pageview') {
    return {
      name: event.name,
      time,
      app,
      attributes: {
        routeId,
        locale,
        duration: coarseDuration(event.attributes.duration),
        params: allowedPageviewParams(routeId, event.attributes.params)
      }
    };
  }
  const built: AnalyticsEvent = { name: event.name, time, app, attributes: { ...event.attributes } };
  const id = keptId(event, config, receivedAt);
  if (id !== undefined) built.id = id;
  return built;
}

/**
 * The visit id an event may keep under the deployment's modes, whatever the browser decided.
 *
 * @param event - An event other than the pageview.
 * @param config - The configuration, for its two modes.
 * @param receivedAt - The relay's clock.
 * @returns The id, or `undefined` when the event has none or must not keep it.
 */
function keptId(
  event: Exclude<WireEvent, { name: 'pageview' }>,
  config: AnalyticsConfig,
  receivedAt: number
): string | undefined {
  const { id } = event;
  if (id === undefined) return undefined;
  if (config.visitIdMode !== 'memory') return undefined;
  if (config.consentMode === 'free' && isSensitiveEvent(event.name)) return undefined;
  if (!isUuidV7(id)) return undefined;
  // A negated comparison, so that a NaN timestamp removes the id too.
  if (!(Math.abs(receivedAt - uuidV7TimestampMs(id)) <= MAX_VISIT_ID_SKEW_MS)) return undefined;
  return id;
}

/**
 * A pageview duration capped at the longest recorded and rounded down to the rounding step.
 *
 * @param duration - The visible milliseconds the browser reported.
 */
function coarseDuration(duration: number): number {
  const capped = Math.min(Math.max(0, duration), MAX_PAGEVIEW_DURATION_MS);
  return Math.floor(capped / PAGEVIEW_DURATION_ROUNDING_MS) * PAGEVIEW_DURATION_ROUNDING_MS;
}
