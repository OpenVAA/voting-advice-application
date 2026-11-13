/**
 * The sign-out helper of the Contestant App's protected loads, driven with a fake request event: a redirect to the login page after a sign-out that worked; after one that failed, in both forms a failure takes, a logged failure and then a redirect to the login page when the request's client answers no session, and an error page when it answers a session or an error.
 *
 * The logout count is withdrawn with the request's event once the outcome is known: after a sign-out that worked, or after a failed one when the client answers no session, and before the redirect. The error page keeps it. The withdrawal is replaced here; what it removes is asserted in its own test file.
 */

import { log } from '@openvaa/app-shared';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import { signOutToLogin } from './signOutToLogin';

const { withdrawLogoutCount } = vi.hoisted(() => ({ withdrawLogoutCount: vi.fn() }));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/server/auth/logoutCount', () => ({ withdrawLogoutCount }));

type HelperEvent = Parameters<typeof signOutToLogin>[0];

const signOut = vi.fn();
const getSession = vi.fn();

const SESSION = { access_token: 'access', refresh_token: 'refresh', expires_at: 1893456000 };

/**
 * A request event whose locals expose only the sign-out the helper calls and the session read it makes after a failure, with the cookies, the `Cookie` header and the address the helper hands to the withdrawal of the logout count.
 */
function makeEvent(): HelperEvent {
  return {
    cookies: { get: vi.fn(), delete: vi.fn() },
    locals: { supabase: { auth: { getSession, signOut } } },
    request: new Request('http://localhost/contestant'),
    url: new URL('http://localhost/contestant')
  } as unknown as HelperEvent;
}

/** The two forms a failed sign-out takes. */
const FAILURES = [
  ['rejects', () => signOut.mockRejectedValue(new Error('network down'))],
  ['answers { error }', () => signOut.mockResolvedValue({ error: new Error('network down') })]
] as const;

/** What the helper throws. */
async function thrownBy(run: () => Promise<never>): Promise<{ status: number; location: string }> {
  try {
    await run();
  } catch (e) {
    return e as { status: number; location: string };
  }
  throw new Error('signOutToLogin resolved, and it must never return');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('signOutToLogin', () => {
  it('signs out with scope local, once', async () => {
    signOut.mockResolvedValue({ error: null });

    await thrownBy(() => signOutToLogin(makeEvent(), 'en', 'loginFailed'));

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it.each([['loginFailed']] as const)('throws a 307 redirect to the login page carrying %s', async (code) => {
    signOut.mockResolvedValue({ error: null });

    const redirected = await thrownBy(() => signOutToLogin(makeEvent(), 'en', code));

    expect(redirected.status).toBe(307);
    expect(redirected.location).toBe(buildRoute({ route: 'ContestantAppLogin', locale: 'en', errorMessage: code }));
    expect(redirected.location).toContain(code);
  });

  it.each(FAILURES)(
    'logs the failure once and throws a 307 redirect to the login page carrying its code when the sign-out %s and no session is left',
    async (_name, arrange) => {
      const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      arrange();
      getSession.mockResolvedValue({ data: { session: null }, error: null });

      const redirected = await thrownBy(() => signOutToLogin(makeEvent(), 'en', 'loginFailed'));

      expect(redirected.status).toBe(307);
      expect(redirected.location).toBe(
        buildRoute({ route: 'ContestantAppLogin', locale: 'en', errorMessage: 'loginFailed' })
      );
      expect(getSession).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledTimes(1);
      expect(String(error.mock.calls[0][0])).toContain('network down');
    }
  );

  it.each(
    FAILURES.flatMap(([name, arrange]) => [
      [name, 'a session', arrange, () => getSession.mockResolvedValue({ data: { session: SESSION }, error: null })],
      [
        name,
        'an error',
        arrange,
        () => getSession.mockResolvedValue({ data: { session: null }, error: new Error('The refresh failed.') })
      ]
    ])
  )(
    'logs the failure once and throws a 503 with the text of error.default, with no redirect, when the sign-out %s and the client then answers %s',
    async (_name, _answer, arrange, answer) => {
      const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      arrange();
      answer();

      const failed = await thrownBy(() => signOutToLogin(makeEvent(), 'en', 'loginFailed'));

      expect(isRedirect(failed)).toBe(false);
      expect(isHttpError(failed, 503)).toBe(true);
      expect((failed as unknown as { body: unknown }).body).toEqual({ message: 'error.default' });
      expect(getSession).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledTimes(1);
      expect(String(error.mock.calls[0][0])).toContain('network down');
    }
  );
});

describe('the logout count', () => {
  /** The names of the sign-out, the session read and the withdrawal, in the order of their first calls; one never called is left out. */
  function callOrder(): Array<string> {
    const calls = { signOut, getSession, withdrawLogoutCount };
    return Object.entries(calls)
      .filter(([, mock]) => mock.mock.invocationCallOrder.length > 0)
      .sort(([, a], [, b]) => a.mock.invocationCallOrder[0] - b.mock.invocationCallOrder[0])
      .map(([name]) => name);
  }

  it("is withdrawn with the request's event after a sign-out that worked, and the redirect to the login page with the code follows", async () => {
    signOut.mockResolvedValue({ error: null });
    const event = makeEvent();

    const redirected = await thrownBy(() => signOutToLogin(event, 'en', 'loginFailed'));

    expect(withdrawLogoutCount).toHaveBeenCalledTimes(1);
    expect(withdrawLogoutCount.mock.calls[0][0]).toBe(event);
    expect(callOrder()).toEqual(['signOut', 'withdrawLogoutCount']);
    expect(redirected.status).toBe(307);
    expect(redirected.location).toBe(
      buildRoute({ route: 'ContestantAppLogin', locale: 'en', errorMessage: 'loginFailed' })
    );
  });

  it.each(FAILURES)(
    "is withdrawn with the request's event after the session read when the sign-out %s and no session is left, and the redirect follows",
    async (_name, arrange) => {
      vi.spyOn(log, 'error').mockImplementation(() => undefined);
      arrange();
      getSession.mockResolvedValue({ data: { session: null }, error: null });
      const event = makeEvent();

      const redirected = await thrownBy(() => signOutToLogin(event, 'en', 'loginFailed'));

      expect(withdrawLogoutCount).toHaveBeenCalledTimes(1);
      expect(withdrawLogoutCount.mock.calls[0][0]).toBe(event);
      expect(callOrder()).toEqual(['signOut', 'getSession', 'withdrawLogoutCount']);
      expect(redirected.status).toBe(307);
      expect(redirected.location).toBe(
        buildRoute({ route: 'ContestantAppLogin', locale: 'en', errorMessage: 'loginFailed' })
      );
    }
  );

  it.each(
    FAILURES.flatMap(([name, arrange]) => [
      [name, 'a session', arrange, () => getSession.mockResolvedValue({ data: { session: SESSION }, error: null })],
      [
        name,
        'an error',
        arrange,
        () => getSession.mockResolvedValue({ data: { session: null }, error: new Error('The refresh failed.') })
      ]
    ])
  )(
    'is not withdrawn when the sign-out %s and the client then answers %s, and the error page follows',
    async (_name, _answer, arrange, answer) => {
      vi.spyOn(log, 'error').mockImplementation(() => undefined);
      arrange();
      answer();

      const failed = await thrownBy(() => signOutToLogin(makeEvent(), 'en', 'loginFailed'));

      expect(withdrawLogoutCount).not.toHaveBeenCalled();
      expect(isRedirect(failed)).toBe(false);
      expect(isHttpError(failed, 503)).toBe(true);
    }
  );
});
