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
 * **Rigidity contract**: every assertion is hard — no soft assertion, no `try/catch` wrapping `expect(...)`, no `.catch(() => null)` on assertion-bearing interactions.
 * This fixture performs no assertions itself (it is a capture seam) — the consuming spec asserts against what it returns. A body that is not JSON is not hidden: `getBatches()` throws on it.
 */

import { RELAY_PATH } from '../../../../apps/frontend/src/lib/analytics/constants';
import type { BrowserContext, Request } from '@playwright/test';

/** One event of a batch, as the browser sends it. */
export interface RelayEvent {
  name: string;
  /** Milliseconds between the event and the send. */
  ago: number;
  /** The visit id, on the events allowed to carry one. */
  id?: string;
  attributes: Record<string, unknown>;
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
  /** The parsed batches, in the order sent. Throws if a captured body is not JSON. */
  getBatches(): Array<RelayBatch>;
  /** The events of all batches, flattened in order, each with its batch's `routeId`. */
  getEvents(): Array<CapturedRelayEvent>;
  /** The names of the events of all batches, in order. */
  getEventNames(): Array<string>;
  /** Forget every batch captured so far. */
  clear(): void;
}

/** True when `request` is a batch sent to the relay. */
function isRelayRequest(request: Request): boolean {
  return request.method() === 'POST' && new URL(request.url()).pathname === RELAY_PATH;
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
      return bodies.map((body, index) => {
        try {
          return JSON.parse(body) as RelayBatch;
        } catch (error) {
          throw new Error(`relayCapture: batch ${index} is not JSON: ${JSON.stringify(body)}`, { cause: error });
        }
      });
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
