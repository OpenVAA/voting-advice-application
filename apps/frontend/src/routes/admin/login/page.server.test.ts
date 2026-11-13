/**
 * The server load and the form action of the Admin App's login page, each driven directly with a fake request context.
 *
 * The load answers why the visitor was sent here when the request hook has just signed the browser out at the end of a logout count, which it says by writing the settled value into `COOKIE.logoutPending`. It reads that one cookie and no session.
 *
 * The action withdraws the logout count with the request's event once the sign-in helper has admitted the session, before the redirect, and keeps it on each of the helper's refusals. The helper and the withdrawal are replaced, so nothing is signed in; what the withdrawal removes is asserted in its own test file.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { LOGOUT_DEADLINE_SETTLED } from '$lib/auth/logoutDeadline';
import { COOKIE } from '$lib/cookies';
import * as server from './+page.server';

const { passwordLogin, withdrawLogoutCount } = vi.hoisted(() => ({
  passwordLogin: vi.fn(),
  withdrawLogoutCount: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/auth', async (importOriginal) => ({ ...(await importOriginal<object>()), passwordLogin }));
vi.mock('$lib/server/auth/logoutCount', () => ({ withdrawLogoutCount }));
// The action builds a data writer only inside the claim it hands the helper, which the replaced helper never calls.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter: vi.fn() }));

afterEach(() => {
  vi.resetAllMocks();
});

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

describe('the reason the Admin App’s login page is shown for', () => {
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

/** What the action touches of the request. */
type FakeActionEvent = {
  request: { formData: () => Promise<FormData> };
  fetch: typeof fetch;
  locals: { currentLocale: string; safeGetSession: () => Promise<unknown>; supabase: { auth: object } };
};
const signIn = server.actions.default as unknown as (event: FakeActionEvent) => Promise<unknown>;

/** A request posting the login form. */
function postedLogin(): FakeActionEvent {
  const data = new FormData();
  data.set('email', 'admin@example.test');
  data.set('password', 'a pass phrase');
  return {
    request: { formData: async () => data },
    fetch: vi.fn() as unknown as typeof fetch,
    locals: { currentLocale: 'en', safeGetSession: vi.fn(), supabase: { auth: {} } }
  };
}

describe('the logout count', () => {
  /** Each refusal the helper can answer. */
  const HELPER_REFUSALS = [
    { status: 400, reason: 'invalidCredentials' },
    { status: 403, reason: 'grantNotAllowed' },
    { status: 500, reason: 'noSession' }
  ] as const;

  /** The order in which the withdrawal and the helper were called. */
  function recordOrder(outcome: { ok: true } | { ok: false; status: number; reason: string }): Array<string> {
    const order: Array<string> = [];
    withdrawLogoutCount.mockImplementation(() => {
      order.push('withdrawLogoutCount');
    });
    passwordLogin.mockImplementation(async () => {
      order.push('passwordLogin');
      return outcome;
    });
    return order;
  }

  it("is withdrawn with the request's event once the helper has admitted the session, before the redirect", async () => {
    const order = recordOrder({ ok: true });
    const event = postedLogin();
    const redirected = await signIn(event).catch((e: unknown) => e);
    expect(withdrawLogoutCount).toHaveBeenCalledTimes(1);
    expect(withdrawLogoutCount.mock.calls[0][0]).toBe(event);
    expect(order).toEqual(['passwordLogin', 'withdrawLogoutCount']);
    expect(redirected).toMatchObject({ status: 303 });
  });

  it.each(HELPER_REFUSALS)(
    'is not withdrawn when the helper refuses the sign-in with $status $reason',
    async ({ status, reason }) => {
      const order = recordOrder({ ok: false, status, reason });
      const answer = await signIn(postedLogin());
      expect(answer).toMatchObject({ status });
      expect(withdrawLogoutCount).not.toHaveBeenCalled();
      expect(order).toEqual(['passwordLogin']);
    }
  );
});
