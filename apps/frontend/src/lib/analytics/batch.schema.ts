/**
 * The envelope the browser posts to the relay, and the parser the browser and the relay share.
 *
 * One body is one batch: the route id and locale of the view the events belong to, and the events. The envelope is strict; the events inside it are left unjudged by the envelope and parsed one at a time, so one bad event does not take the batch down.
 */
import { z } from 'zod';
import { locales } from '$lib/paraglide/runtime';
import { MAX_BATCH_EVENTS } from './constants';
import { EventSchema } from './events.schema';
import { isPageviewRoute } from './pageviewRoutes';
import type { WireEvent } from './events.schema';

/** The longest route id or locale the envelope admits; the allowlist and the locale list decide the rest. */
const MAX_ENVELOPE_STRING_LENGTH = 256;

/**
 * The batch envelope. `routeId` must be a key of the pageview allowlist and `locale` one of the supported locales. `events` holds one to `MAX_BATCH_EVENTS` entries of any shape; each is judged by `parseBatch`.
 */
export const BatchSchema = z.strictObject({
  routeId: z.string().max(MAX_ENVELOPE_STRING_LENGTH).refine(isPageviewRoute, { message: 'Unknown route id' }),
  locale: z
    .string()
    .max(MAX_ENVELOPE_STRING_LENGTH)
    .refine((value) => (locales as ReadonlyArray<string>).includes(value), { message: 'Unsupported locale' }),
  events: z.array(z.unknown()).min(1).max(MAX_BATCH_EVENTS)
});

/** A batch whose envelope has been checked and whose events have not. */
export type Batch = z.output<typeof BatchSchema>;

/** The outcome of `parseBatch`: the kept events and how many were dropped, or a refusal of the whole body. */
export type ParsedBatch =
  { ok: true; routeId: string; locale: string; events: Array<WireEvent>; dropped: number } | { ok: false };

/**
 * Parse a batch body.
 *
 * The envelope is checked first; a body whose envelope fails is refused whole. Each event is then parsed on its own: an event that parses is kept in its parsed form, and one that fails is counted and nothing else. The result never holds a rejected event, a parse issue or a message built from a value, so it is safe to log.
 *
 * The function is pure and synchronous and imports nothing server-only, so the browser and the relay run the same check.
 *
 * @param input - The parsed JSON of a request body, of any shape.
 * @returns `{ ok: false }` when the envelope fails; otherwise the route id, the locale, the kept events in their order and the number dropped.
 */
export function parseBatch(input: unknown): ParsedBatch {
  const envelope = BatchSchema.safeParse(input);
  if (!envelope.success) return { ok: false };
  const events = new Array<WireEvent>();
  let dropped = 0;
  for (const entry of envelope.data.events) {
    const event = EventSchema.safeParse(entry);
    if (event.success) events.push(event.data);
    else dropped++;
  }
  return { ok: true, routeId: envelope.data.routeId, locale: envelope.data.locale, events, dropped };
}
