/**
 * The server load of the Contestant App's login page, driven directly with a fake request context.
 *
 * The load answers why the visitor was sent here when the request hook has just signed the browser out at the end of a logout count, which it says by writing the settled value into `COOKIE.logoutPending`. It reads that one cookie and no session.
 */

import { describe, expect, it, vi } from 'vitest';
import { LOGOUT_DEADLINE_SETTLED } from '$lib/auth/logoutDeadline';
import { COOKIE } from '$lib/cookies';
import * as server from './+page.server';

/** What the load may touch of the request. */
type FakeEvent = {
  cookies: { get: (name: string) => string | undefined };
  locals: { safeGetSession: () => Promise<unknown> };
};
const runLoad = server.load as unknown as (event: FakeEvent) => unknown;

/**
 * A request carrying the given cookies, whose session read is a spy.
 * @param cookies - The request's cookies, by name.
 */
function requestWith(cookies: Record<string, string> = {}): FakeEvent {
  return {
    cookies: { get: vi.fn((name: string) => cookies[name]) },
    locals: { safeGetSession: vi.fn(async () => ({ session: null, user: null })) }
  };
}

describe('the reason the login page is shown for', () => {
  it('is the automatic logout when the request carries the value the server writes once it has signed out at a count’s end', async () => {
    const event = requestWith({ [COOKIE.logoutPending]: LOGOUT_DEADLINE_SETTLED });
    expect(await runLoad(event)).toEqual({ signedOutReason: 'loggedOutAutomatically' });
    expect(event.cookies.get).toHaveBeenCalledWith(COOKIE.logoutPending);
  });

  it.each([
    ['no logout cookie', {}],
    ['the id of a count still running', { [COOKIE.logoutPending]: '0123456789abcdef0123456789abcdef' }],
    ['an empty value', { [COOKIE.logoutPending]: '' }],
    ['another value', { [COOKIE.logoutPending]: 'Passed' }],
    ['the settled value under another name', { [COOKIE.logoutDeadline]: LOGOUT_DEADLINE_SETTLED }]
  ])('is none for %s', async (_, cookies: Record<string, string>) => {
    expect(await runLoad(requestWith(cookies))).toEqual({});
  });

  it('reads no session', async () => {
    const event = requestWith({ [COOKIE.logoutPending]: LOGOUT_DEADLINE_SETTLED });
    await runLoad(event);
    expect(event.locals.safeGetSession).not.toHaveBeenCalled();
  });
});
