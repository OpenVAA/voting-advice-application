/**
 * The server's error hook and its request hook's handling of the logout deadline.
 *
 * `handleError` answers the error the error page renders: its `message` is the response's status, which the page shows as its title. A server error is logged through the shared logger and never reaches the page; a missing page is not logged.
 *
 * `handle` signs out a request whose logout count the browser has let run out, the count's id pending and its deadline cookie gone, and settles the pending cookie in the same response with a value it never acts on again; two different pending ids sign nothing out and every copy is expired, the host's own domain's included. It is driven whole, for a request that names no route, so the gate lets it through.
 *
 * The paraglide server middleware is generated at build time, so it is replaced by one that calls straight through; the Supabase client, the session read and the locale are replaced too. The module's other imports are the real ones, over the test stubs of the environment modules.
 *
 * @vitest-environment node
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOGOUT_DEADLINE_SETTLED, LOGOUT_PENDING_MAX_AGE_SECONDS } from '$lib/auth/logoutDeadline';
import { COOKIE } from '$lib/cookies';
import { handle, handleError } from './hooks.server';
import type { RequestEvent } from '@sveltejs/kit';
import type { MockInstance } from 'vitest';

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock('$lib/paraglide/server', () => ({
  paraglideMiddleware: vi.fn(
    (request: Request, resolve: (args: { request: Request; locale: string }) => Promise<Response>) =>
      resolve({ request, locale: 'en' })
  )
}));

vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getLocale: () => 'en'
}));

vi.mock('$lib/supabase/server', () => ({
  createSupabaseServerClient: () => ({ auth: { signOut } })
}));

vi.mock('$lib/supabase/safeGetSession', () => ({
  createSafeGetSession: () => ({
    safeGetSession: async () => ({ session: null, user: null }),
    endRequest: () => undefined
  })
}));

/** SvelteKit's request store, which `sequence` reads and the server sets around every request. The module ships no type declarations of its own, so it is named by a variable and typed here. */
type RequestStoreRunner = { with_request_store: <TResult>(store: unknown, fn: () => TResult) => TResult };
const REQUEST_STORE_MODULE = '@sveltejs/kit/internal/server';
const { with_request_store } = (await import(/* @vite-ignore */ REQUEST_STORE_MODULE)) as RequestStoreRunner;

/** The request store's state as the server holds it with tracing off: a span records nothing. */
const UNTRACED_STATE = { tracing: { record_span: ({ fn }: { fn: (span: unknown) => unknown }) => fn({}) } };

const event = {} as RequestEvent;

describe('handleError', () => {
  let logError: MockInstance<typeof log.error>;
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    logError = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logError.mockRestore();
    consoleError.mockRestore();
  });

  it('answers a page that does not exist with the message 404', async () => {
    const error = new Error('Not found: /no-such-page');
    expect(await handleError({ error, event, status: 404, message: 'Not Found' })).toEqual({ message: '404' });
  });

  it('answers a server error with the message 500', async () => {
    const error = new Error('the database is unreachable');
    expect(await handleError({ error, event, status: 500, message: 'Internal Error' })).toEqual({ message: '500' });
  });

  it('logs a server error through the shared logger, with the error, and returns nothing of it', async () => {
    const error = new Error('the database is unreachable');
    const answer = await handleError({ error, event, status: 500, message: 'Internal Error' });
    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith('Server error', { err: error, status: 500 });
    expect(consoleError).not.toHaveBeenCalled();
    expect(JSON.stringify(answer)).not.toContain('unreachable');
  });

  it('logs nothing for a page that does not exist', async () => {
    const error = new Error('Not found: /no-such-page');
    await handleError({ error, event, status: 404, message: 'Not Found' });
    expect(logError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe('handle — the logout deadline', () => {
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

  /** A well-formed id of a count's opening, and a second one. */
  const ID = '0123456789abcdef0123456789abcdef';
  const OTHER_ID = 'fedcba9876543210fedcba9876543210';

  /**
   * Run `handle` for a request to a URL that names no route, carrying the given `Cookie` header.
   *
   * @param cookieHeader - The request's `Cookie` header, or `undefined` for none.
   * @param host - The request's host.
   * @returns The cookie writes the request made, and the final `resolve` the hook was given.
   */
  async function request(cookieHeader: string | undefined, host = 'localhost') {
    const url = new URL(`http://${host}/no-route`);
    const cookies = {
      get: vi.fn(() => undefined),
      getAll: vi.fn(() => []),
      set: vi.fn(),
      delete: vi.fn(),
      serialize: vi.fn()
    };
    const event = {
      url,
      request: new Request(url, { headers: cookieHeader === undefined ? {} : { cookie: cookieHeader } }),
      route: { id: null },
      locals: {},
      cookies
    } as unknown as RequestEvent;
    const resolve = vi.fn(async () => new Response('ok'));
    await with_request_store({ event, state: UNTRACED_STATE }, () => handle({ event, resolve }));
    return { cookies, resolve };
  }

  /** A count the browser has let run out: its id pending, and its deadline gone. */
  const RUN_OUT = `${COOKIE.logoutPending}=${ID}`;

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

  it.each([
    ['a count still running', `${COOKIE.logoutPending}=${ID}; ${COOKIE.logoutDeadline}=${ID}`],
    ['no pending value', `${COOKIE.logoutDeadline}=${ID}; other=1`],
    ['no cookie header', undefined],
    [
      'the settled marker beside a planted id',
      `${COOKIE.logoutPending}=${LOGOUT_DEADLINE_SETTLED}; ${COOKIE.logoutPending}=${ID}`
    ],
    ['a pending value that is no id', `${COOKIE.logoutPending}=1794125376808`]
  ])('signs nothing out and writes nothing for %s', async (_, header) => {
    const { cookies, resolve } = await request(header);

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

  it("on an apex host, two different pending ids sign nothing out and expire both names host-only and for the host's own domain", async () => {
    const { cookies, resolve } = await request(
      `${COOKIE.logoutPending}=${ID}; ${COOKIE.logoutPending}=${OTHER_ID}`,
      'example.org'
    );

    expect(signOut).not.toHaveBeenCalled();
    expect(cookies.set).not.toHaveBeenCalled();
    expect(cookies.delete.mock.calls).toEqual(
      expect.arrayContaining([
        [COOKIE.logoutPending, { path: '/' }],
        [COOKIE.logoutDeadline, { path: '/' }],
        [COOKIE.logoutPending, { path: '/', domain: 'example.org' }],
        [COOKIE.logoutDeadline, { path: '/', domain: 'example.org' }]
      ])
    );
    expect(cookies.delete).toHaveBeenCalledTimes(4);
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
