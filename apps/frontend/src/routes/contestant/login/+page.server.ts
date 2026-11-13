import { LOGOUT_DEADLINE_SETTLED } from '$lib/auth/logoutDeadline';
import { COOKIE } from '$lib/cookies';
import type { ContestantLoginError } from '$contestant/utils/loginError';

/**
 * The login page's load serves two purposes.
 *
 * - A client-side navigation to this page sends a request the request hook sees, which sends a caller with a session to the app's home; see `appGates.ts`.
 * - It answers why the visitor was sent here when the request hook has just ended the session at the end of a logout count. The hook writes {@link LOGOUT_DEADLINE_SETTLED} into `COOKIE.logoutPending` in the response that signs out, the gate sends the request here, and the browser's request for this page carries the value; the root layout removes it only after this page has loaded. The load reads that one cookie and no session.
 *
 * Tested in `page.server.test.ts`.
 *
 * @returns `{ signedOutReason: 'loggedOutAutomatically' }` when the request carries the settled value, and an empty object otherwise.
 */
export function load({ cookies }): { signedOutReason?: Extract<ContestantLoginError, 'loggedOutAutomatically'> } {
  return cookies.get(COOKIE.logoutPending) === LOGOUT_DEADLINE_SETTLED
    ? { signedOutReason: 'loggedOutAutomatically' }
    : {};
}
