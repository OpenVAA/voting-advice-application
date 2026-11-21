/**
 * The one network call of the tracking path: a batch body posted to the same-origin relay.
 */
import { RELAY_PATH } from '$lib/analytics/constants';

/**
 * Send one batch body to the relay and forget it.
 *
 * - The request uses `keepalive`, so it can outlive the page it was sent from. Unfinished keepalive requests of a page share a 64 KiB budget, which is why a flush makes exactly one call with a capped body.
 * - Cookies are left out, so a signed-in user's session never reaches the relay.
 * - A lost send is a lost count: a rejection or a synchronous throw is swallowed, nothing is awaited and nothing is logged.
 *
 * @param body - The serialised batch.
 */
export function sendBatch(body: string): void {
  try {
    fetch(RELAY_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'omit'
    }).catch(() => undefined);
  } catch {
    // A fetch that throws before it returns a promise is dropped like a rejected one.
  }
}
