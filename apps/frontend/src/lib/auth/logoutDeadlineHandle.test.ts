/**
 * The request hook's handling of the logout deadline.
 *
 * `logoutDeadlineHandle` signs out a request whose logout count the browser has let run out, the count's id pending and its deadline cookie gone, and settles the pending cookie in the same response with a value it never acts on again; two different pending ids sign nothing out and every copy is expired, the host's own domain's included. Which state the cookies are in, and which domains a removal names, are tested with `logoutDeadline` itself; here one case per state proves what the hook does with it.
 *
 * @vitest-environment node
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import { LOGOUT_DEADLINE_SETTLED, LOGOUT_PENDING_MAX_AGE_SECONDS } from './logoutDeadline';
import { logoutDeadlineHandle } from './logoutDeadlineHandle';
import type { RequestEvent } from '@sveltejs/kit';
import type { MockInstance } from 'vitest';

/** A well-formed id of a count's opening, and a second one. */
const ID = '0123456789abcdef0123456789abcdef';
const OTHER_ID = 'fedcba9876543210fedcba9876543210';

/** A count the browser has let run out: its id pending, and its deadline gone. */
const RUN_OUT = `${COOKIE.logoutPending}=${ID}`;

const signOut = vi.fn();

/**
 * Run the handler for a request carrying the given `Cookie` header, with a request client whose `signOut` is the fake.
 *
 * @param cookieHeader - The request's `Cookie` header.
 * @param host - The request's host.
 * @returns The cookie writes the request made, and the `resolve` the handler was given.
 */
async function request(cookieHeader: string, host = 'localhost') {
  const url = new URL(`http://${host}/`);
  const cookies = {
    get: vi.fn(() => undefined),
    getAll: vi.fn(() => []),
    set: vi.fn(),
    delete: vi.fn(),
    serialize: vi.fn()
  };
  const event = {
    url,
    request: new Request(url, { headers: { cookie: cookieHeader } }),
    cookies
  } as unknown as RequestEvent;
  const resolve = vi.fn(async () => new Response('ok'));
  await logoutDeadlineHandle(() => signOut({ scope: 'local' }))({ event, resolve });
  return { cookies, resolve };
}

describe('logoutDeadlineHandle', () => {
  let logError: MockInstance<typeof log.error>;
  let logWarn: MockInstance<typeof log.warn>;

  beforeEach(() => {
    signOut.mockReset();
    signOut.mockResolvedValue({ error: null });
    logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    logWarn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logError.mockRestore();
    logWarn.mockRestore();
  });

  it('signs out a request whose count has run out once, locally, and settles the pending cookie in the same response', async () => {
    const { cookies, resolve } = await request(RUN_OUT);

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(cookies.set).toHaveBeenCalledTimes(1);
    expect(cookies.set).toHaveBeenCalledWith(COOKIE.logoutPending, LOGOUT_DEADLINE_SETTLED, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: false,
      maxAge: LOGOUT_PENDING_MAX_AGE_SECONDS
    });
    expect(cookies.delete).not.toHaveBeenCalled();
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('settles the pending cookie when the request had no session to sign out', async () => {
    signOut.mockResolvedValue({ error: Object.assign(new Error('no session'), { name: 'AuthSessionMissingError' }) });

    const { cookies, resolve } = await request(RUN_OUT);

    expect(cookies.set).toHaveBeenCalledWith(COOKIE.logoutPending, LOGOUT_DEADLINE_SETTLED, expect.anything());
    expect(logError).not.toHaveBeenCalled();
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('signs nothing out and writes nothing for a count still running', async () => {
    const { cookies, resolve } = await request(`${COOKIE.logoutPending}=${ID}; ${COOKIE.logoutDeadline}=${ID}`);

    expect(signOut).not.toHaveBeenCalled();
    expect(cookies.set).not.toHaveBeenCalled();
    expect(cookies.delete).not.toHaveBeenCalled();
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it("signs nothing out for two different pending ids and expires every copy of both names, host-only, for the host's own domain and for each parent domain", async () => {
    const { cookies, resolve } = await request(
      `${COOKIE.logoutPending}=${ID}; ${COOKIE.logoutPending}=${OTHER_ID}`,
      'app.example.org'
    );

    expect(signOut).not.toHaveBeenCalled();
    expect(cookies.set).not.toHaveBeenCalled();
    expect(cookies.delete.mock.calls).toEqual(
      expect.arrayContaining([
        [COOKIE.logoutPending, { path: '/' }],
        [COOKIE.logoutDeadline, { path: '/' }],
        [COOKIE.logoutPending, { path: '/', domain: 'app.example.org' }],
        [COOKIE.logoutDeadline, { path: '/', domain: 'app.example.org' }],
        [COOKIE.logoutPending, { path: '/', domain: 'example.org' }],
        [COOKIE.logoutDeadline, { path: '/', domain: 'example.org' }]
      ])
    );
    expect(cookies.delete).toHaveBeenCalledTimes(6);
    const hostOnly = cookies.delete.mock.calls.filter(([, options]) => !('domain' in options));
    expect(hostOnly).toHaveLength(2);
    expect(logWarn).toHaveBeenCalledTimes(1);
    expect(logWarn.mock.calls[0][0]).toContain(COOKIE.logoutPending);
    expect(logWarn.mock.calls[0][0]).not.toContain(ID);
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'answers',
      () => signOut.mockResolvedValue({ error: Object.assign(new Error('refused'), { name: 'AuthApiError' }) })
    ],
    ['rejects', () => signOut.mockRejectedValue(Object.assign(new Error('refused'), { name: 'AuthApiError' }))]
  ])(
    'logs a sign-out that %s with another error by its name, writes nothing and lets the request through',
    async (_, failSignOut) => {
      failSignOut();

      const { cookies, resolve } = await request(RUN_OUT);

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError.mock.calls[0][0]).toContain('AuthApiError');
      expect(logError.mock.calls[0][0]).not.toContain('refused');
      expect(cookies.set).not.toHaveBeenCalled();
      expect(resolve).toHaveBeenCalledTimes(1);
    }
  );
});
