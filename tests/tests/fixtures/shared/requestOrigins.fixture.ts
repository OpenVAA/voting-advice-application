/**
 * @file requestOrigins fixture.
 *
 * Records every request a browser context makes and asserts that each went to the app's origin or to Supabase's, and that every script came from the app's origin. A companion route keeps any other request from leaving the machine.
 *
 * ## The boundary of the claim
 *
 * The assertion covers the requests observed in this journey, from the moment the recorder is attached, against an allowlist of two origins: the app's and Supabase's. It says nothing about a request the journey did not cause, nor about what the app would request on a page the journey did not visit. WebSocket connections (the dev server's hot-reload socket) are not requests in this sense and are not recorded. The pure core and its tests are in `tests/tests/utils/privacyAllowlists.ts`.
 *
 * ## Recording and blocking together
 *
 * `blockForeignOrigins` installs one `context.route` handler over every URL: a request to one of the two origins continues, any other is aborted. The recorder listens on the context's `request` event, which fires before routing, so an aborted request is still recorded and still fails the origin assertion; it only never reaches the network. That is the point: a run on a tree that still loads a third-party script must show that request, without sending a test visit to a real analytics service. A `data:` or `blob:` URL has no network origin and continues.
 *
 * Attach the recorder and then the route BEFORE the first navigation of the context.
 *
 * **Rigidity contract**: every assertion is hard — no soft assertion, no `try/catch` wrapping `expect(...)`, no `.catch(() => null)` on assertion-bearing interactions.
 */

import { expect } from '@playwright/test';
import { findThirdPartyRequests } from '../../utils/privacyAllowlists';
import type { BrowserContext, Request, Route } from '@playwright/test';
import type { ObservedRequest } from '../../utils/privacyAllowlists';

/** The requests a context made, filled in order as they are made. */
export interface RequestRecorder {
  readonly requests: Array<ObservedRequest>;
}

/**
 * Start recording the requests of `context`.
 * @param context - The browser context to record. Attach before its first navigation.
 * @returns The recorder, filled as requests are made.
 */
export function attachRequestRecorder(context: BrowserContext): RequestRecorder {
  const recorder: RequestRecorder = { requests: [] };
  context.on('request', (request: Request) => {
    recorder.requests.push({ url: request.url(), resourceType: request.resourceType() });
  });
  return recorder;
}

/** True when `url` never leaves the browser. */
function isLocalUrl(url: string): boolean {
  return url.startsWith('data:') || url.startsWith('blob:');
}

/**
 * Let requests to the app's origin and Supabase's through, and abort every other.
 * @param context - The browser context to route.
 * @param appOrigin - The app's origin.
 * @param supabaseOrigin - Supabase's origin.
 */
export async function blockForeignOrigins(
  context: BrowserContext,
  appOrigin: string,
  supabaseOrigin: string
): Promise<void> {
  const allowed = [appOrigin, supabaseOrigin];
  await context.route('**/*', async (route: Route) => {
    const url = route.request().url();
    if (isLocalUrl(url) || allowed.includes(new URL(url).origin)) {
      await route.continue();
      return;
    }
    await route.abort('blockedbyclient');
  });
}

/**
 * Assert that every recorded request went to the app's origin or Supabase's, and that every script came from the app's origin.
 * @param recorder - The recorder of the journey.
 * @param appOrigin - The app's origin.
 * @param supabaseOrigin - Supabase's origin.
 */
export function expectOnlyAllowedOrigins(recorder: RequestRecorder, appOrigin: string, supabaseOrigin: string): void {
  // A recorder that saw nothing proves nothing: the journey always loads at least its first document.
  expect(recorder.requests.length, 'the request recorder observed no request').toBeGreaterThan(0);
  const offenders = findThirdPartyRequests(recorder.requests, [appOrigin, supabaseOrigin], appOrigin);
  expect(
    offenders,
    `requests outside the app's and Supabase's origins, or scripts from another origin: ${offenders.join(', ')}`
  ).toStrictEqual([]);
}
