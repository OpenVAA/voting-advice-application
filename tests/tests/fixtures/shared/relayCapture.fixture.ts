/**
 * @file relayCapture fixture.
 *
 * Captures the usage-event batches the browser sends to the application's own relay path, so a spec can assert which events were sent, when, and with what attributes.
 *
 * ## Capture seam
 *
 * Every batch is one `POST` to `RELAY_PATH` on the app's origin with a JSON body `{ routeId, locale, events }`. The fixture listens on the BROWSER CONTEXT's `request` event, not on a page's, so that a batch a page sends at a client navigation is seen whichever page object it belongs to. The body is read from the request itself, so the capture does not depend on a response arriving.
 *
 * ## What it does not see
 *
 * The capture sees the batches sent while their document is alive: at a client navigation, and at the hidden flush point when a spec reaches it on the same document. It does NOT see a batch sent as the document is left by a full navigation or closed (at `pagehide`, or at `visibilitychange` to hidden on the way out): Chromium hands such a `keepalive` request to the browser process, and Playwright reports it neither as a context `request` event nor to a `context.route` handler, though the relay receives it. A spec that must observe a page-hide batch uses `startRelayRecordingProxy()` from `relayProxy.fixture.ts`, which sits on the network path and records it with the relay's answer.
 *
 * ## Arming
 *
 * Call `createRelayCapture(context)` BEFORE the first navigation of the context; a batch sent before the listener is attached is not seen. The listener lives as long as the context.
 *
 * The fixture only listens. It never stubs, blocks, delays or answers a request, so the browser sends exactly what it would send without it, and the relay answers as it would.
 *
 * ## Surface
 *  - `getBatches()`    — the parsed bodies, in the order sent.
 *  - `getEvents()`     — the events of all batches, flattened, each with its batch's `routeId`.
 *  - `getEventNames()` — the names of those events, in the same order.
 *  - `clear()`         — forget everything captured so far.
 *
 * Beside the capture, this module holds what the usage-data specs share about the events and the consent surface: `flushTrackingBuffer` and `flushUntil` reach the hidden flush point, `hasVisitId` and `visitIdOf` read an event's visit id through the one key `VISIT_ID_KEY`, and `PREFS_KEY` names the stored user preferences. `CONSENT_PROMPT` and `GRANTED_BUTTON`, the consent prompt and its granting button, are re-exported from `consentPrompt.fixture.ts`, where the prompt's surface lives.
 *
 * ## Every event is held to the vocabulary
 *
 * `getBatches()` parses every event of every batch with the application's own `EventSchema`, the strict vocabulary the relay applies. An event the vocabulary does not admit, such as one carrying an attribute outside it, makes `getBatches()` throw an error naming the batch and the event, so no spec passes over a send the relay would drop.
 *
 * **Rigidity contract**: every assertion is hard — no soft assertion, no `try/catch` wrapping `expect(...)`, no `.catch(() => null)` on assertion-bearing interactions.
 * The capture performs no assertions itself (it is a capture seam) — the consuming spec asserts against what it returns. A body that is not JSON, or an event outside the vocabulary, is not hidden: `getBatches()` throws on it.
 */

import { expect } from '@playwright/test';
import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import { EventSchema } from '../../../../apps/frontend/src/lib/analytics/events.schema';
import { TIMEOUTS } from '../../helpers';
import type { BrowserContext, Page, Request } from '@playwright/test';
import type { z } from 'zod';

/** One event of a batch, as the browser sends it: a member of the application's event vocabulary. */
export type RelayEvent = z.input<typeof EventSchema>;

/**
 * The member of a wire event that holds the visit id. Every read of the visit id goes through it, by `hasVisitId` and `visitIdOf`; the `satisfies` clause stops the typecheck when the vocabulary names the member differently.
 */
export const VISIT_ID_KEY = 'visitId' satisfies keyof Extract<RelayEvent, { name: 'menu_open' }>;

/** True when `event` has a visit-id member at all, whatever its value. */
export function hasVisitId(event: RelayEvent): boolean {
  return VISIT_ID_KEY in event;
}

/** The visit id `event` carries, or `undefined` when it has none. */
export function visitIdOf(event: RelayEvent): string | undefined {
  return hasVisitId(event) ? (event as Record<typeof VISIT_ID_KEY, string | undefined>)[VISIT_ID_KEY] : undefined;
}

export { CONSENT_PROMPT, GRANTED_BUTTON } from '../voter/consentPrompt.fixture';

/** localStorage key the app persists `userPreferences` under (the `localStorageState` call in appContext.svelte.ts). */
export const PREFS_KEY = 'appContext-userPreferences';

/**
 * Reach the hidden flush point on the SAME document. The root layout sends the pending batch when the document becomes hidden, so this overrides `document.visibilityState` with `'hidden'` and dispatches `visibilitychange`; it then removes the override, so the real value shows through again, and dispatches the event once more, which marks the page visible.
 * @param page - The page to flush.
 */
export async function flushTrackingBuffer(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Reflect.deleteProperty(document, 'visibilityState');
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

/**
 * Flush until `arrived` holds, and fail with `message` when it never does within the slow-page budget. A flush made before the page has hydrated reaches no listener, and a batch is captured a moment after it is sent, so this flushes again on each poll; a flush with nothing to send sends nothing, so the repeats add no batch.
 * @param page - The page to flush.
 * @param arrived - True once the expected batch is captured.
 * @param message - The failure message when it never is.
 */
export async function flushUntil(page: Page, arrived: () => boolean, message: string): Promise<void> {
  await expect
    .poll(
      async () => {
        await flushTrackingBuffer(page);
        return arrived();
      },
      { message, timeout: TIMEOUTS.slowPage }
    )
    .toBe(true);
}

/** One batch, as the browser sends it. */
export interface RelayBatch {
  routeId: string;
  locale: string;
  events: Array<RelayEvent>;
}

/** An event together with the route id of the batch it was sent in. */
export type CapturedRelayEvent = RelayEvent & { routeId: string };

export interface RelayCaptureFixture {
  /** The parsed batches, in the order sent. Throws if a captured body is not JSON or holds an event outside the vocabulary. */
  getBatches(): Array<RelayBatch>;
  /** The events of all batches, flattened in order, each with its batch's `routeId`. */
  getEvents(): Array<CapturedRelayEvent>;
  /** The names of the events of all batches, in order. */
  getEventNames(): Array<string>;
  /** Forget every batch captured so far. */
  clear(): void;
}

/**
 * Start capturing the relay batches of `context`.
 * @param context - The browser context whose requests are captured. Attach before its first navigation.
 * @returns The capture, filled as batches are sent.
 */
export function createRelayCapture(context: BrowserContext): RelayCaptureFixture {
  const bodies: Array<string> = [];

  context.on('request', (request: Request) => {
    if (!isRelayRequest(request)) return;
    // Read at once: the body belongs to the request and stays readable after the document that sent it is gone.
    bodies.push(request.postData() ?? '');
  });

  const fixture: RelayCaptureFixture = {
    getBatches(): Array<RelayBatch> {
      return bodies.map((body, index) => parseCapturedBatch(body, index));
    },

    getEvents(): Array<CapturedRelayEvent> {
      return fixture
        .getBatches()
        .flatMap((batch) => batch.events.map((event) => ({ ...event, routeId: batch.routeId })));
    },

    getEventNames(): Array<string> {
      return fixture.getEvents().map((event) => event.name);
    },

    clear(): void {
      bodies.length = 0;
    }
  };

  return fixture;
}

/** True when `request` is a batch sent to the relay. */
function isRelayRequest(request: Request): boolean {
  return request.method() === 'POST' && new URL(request.url()).pathname === RELAY_PATH;
}

/**
 * Parse one captured body, and check each of its events against `EventSchema`.
 * @param body - The request body as sent.
 * @param index - The batch's position in the capture, for the error messages.
 * @returns The batch as sent.
 */
function parseCapturedBatch(body: string, index: number): RelayBatch {
  let batch: RelayBatch;
  try {
    batch = JSON.parse(body) as RelayBatch;
  } catch (error) {
    throw new Error(`relayCapture: batch ${index} is not JSON: ${JSON.stringify(body)}`, { cause: error });
  }
  for (const event of batch.events) {
    const result = EventSchema.safeParse(event);
    if (!result.success) {
      throw new Error(
        `relayCapture: batch ${index} holds an event outside the vocabulary: ${JSON.stringify((event as { name?: unknown }).name)}: ${result.error.message}`,
        { cause: result.error }
      );
    }
  }
  return batch;
}
