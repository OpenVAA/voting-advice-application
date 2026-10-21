/**
 * Turn one flush into one request body for the relay.
 *
 * The builder applies, in the browser, the rules the relay applies again on arrival, so the browser does not send what the relay would drop: every event is checked against the vocabulary, the pageview never carries an id, the visit id goes only on events allowed to carry it, and the body stays within the event and byte caps.
 */
import { MAX_BATCH_BYTES, MAX_BATCH_EVENTS } from '$lib/analytics/constants';
import { EventSchema, isSensitiveEvent } from '$lib/analytics/events.schema';
import { mayAttachVisitId } from './gates';
import type { EventName, WireEvent } from '$lib/analytics/events.schema';
import type { AnalyticsProjection } from '$lib/analytics/modes';
import type { PageviewDraft, View } from './viewTracker';

/** An event waiting in the buffer for the next flush. */
export type BufferedEvent = {
  name: EventName;
  attributes: Record<string, JSONData>;
  /** When the event happened, on the same clock as the `now` given to {@link buildBatch}. */
  at: number;
};

/** The UTF-8 length of a string, which is what the keepalive budget counts. */
function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** The event in its checked wire form, or `undefined` when it fails the vocabulary. */
function checked(event: Record<string, unknown>): WireEvent | undefined {
  const result = EventSchema.safeParse(event);
  return result.success ? result.data : undefined;
}

/**
 * Build the body of one batch.
 *
 * - The envelope's route id and locale are those of `view`; a given pageview must belong to that view.
 * - The pageview, when given, comes first, with `ago` 0 and no id.
 * - Each buffered event gets `ago`, its age at `now` in whole milliseconds and never negative, and the visit id when one is given and the modes allow it on that event.
 * - An event that fails the vocabulary is left out.
 * - Events are dropped from the end, never the pageview, until the body holds at most `MAX_BATCH_EVENTS` events and `MAX_BATCH_BYTES` UTF-8 bytes.
 *
 * The function is pure: it reads no clock and no global.
 *
 * @returns The serialised body, or `undefined` when no event remains.
 */
export function buildBatch(input: {
  view: View;
  pageview?: PageviewDraft;
  events: ReadonlyArray<BufferedEvent>;
  visitId?: string;
  projection: AnalyticsProjection;
  now: number;
}): string | undefined {
  const { view, pageview, visitId, projection, now } = input;

  let pageviewEvent: WireEvent | undefined;
  if (pageview)
    pageviewEvent = checked({
      name: 'pageview',
      ago: 0,
      attributes: { params: pageview.params, duration: pageview.duration }
    });

  const rest = new Array<WireEvent>();
  for (const { name, attributes, at } of input.events) {
    const event: Record<string, unknown> = { name, ago: Math.max(0, Math.round(now - at)), attributes };
    if (visitId !== undefined && mayAttachVisitId({ projection, sensitive: isSensitiveEvent(name) }))
      event.id = visitId;
    const wire = checked(event);
    if (wire) rest.push(wire);
  }

  const head = pageviewEvent ? [pageviewEvent] : [];
  rest.splice(Math.max(0, MAX_BATCH_EVENTS - head.length));

  // JSON.stringify joins array items with one comma, so the body's size is the empty envelope plus each event plus the separators.
  let size = byteLength(JSON.stringify({ routeId: view.routeId, locale: view.locale, events: [] }));
  const sizes = [...head, ...rest].map((event) => byteLength(JSON.stringify(event)));
  size += sizes.reduce((sum, eventSize) => sum + eventSize, 0) + Math.max(0, sizes.length - 1);
  while (rest.length > 0 && size > MAX_BATCH_BYTES) {
    rest.pop();
    size -= (sizes.pop() ?? 0) + (sizes.length > 0 ? 1 : 0);
  }

  const events = [...head, ...rest];
  if (events.length === 0) return undefined;
  return JSON.stringify({ routeId: view.routeId, locale: view.locale, events });
}
