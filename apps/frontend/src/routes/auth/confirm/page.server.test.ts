/**
 * The server load and the form action of the confirm page between a mailed link and its verification, each driven directly with a fake request context and a mocked data writer.
 *
 * What this file holds:
 *
 * 1. **The load verifies nothing** — it answers the link's `token_hash`, `type` and `next` for the page's form and calls no auth method, and it leads a link with a missing token or type, or of a type nothing mails, to the login page with the auth error.
 * 2. **The action verifies** — it reads the three fields from the posted form, not from the address, and lands the user as the auth callback lands them: verify, claim, refresh, land.
 * 3. **A browser that is signed in** — the load says so and names where Cancel leads, the Admin App's home for a session whose grants in this project open the Admin App alone and the Contestant App's home otherwise, a read of those grants that fails included, and answers no part of the session; the action signs that session out locally before it verifies.
 * 4. **The logout count** — through the real verification, it is withdrawn with the request's event once the verification has set the session: with no session held, after a held session's sign-out that worked, and after a failed one that left no session. A failed sign-out that leaves a session ends on the error page with nothing verified, and it, a failed verification and a post the action refuses keep the count. The withdrawal is replaced; what it removes is asserted in its own test file.
 *
 * Every auth call and the claim record themselves in one list, so the order is read off it. The cookies the action writes record themselves in another. The session the request's cookies hold is read through its own recorders, the hook's reader and the client's, so the list holds the effects alone.
 */

import { configureLogger, log } from '@openvaa/app-shared';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readGrants } from '$lib/auth/roles';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import { actions, load } from './+page.server';
import type { InvitationClaimResult } from '$lib/api/base/dataWriter.type';

const writerMocks = vi.hoisted(() => ({ createDataWriter: vi.fn() }));
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter: writerMocks.createDataWriter }));

const { withdrawLogoutCount } = vi.hoisted(() => ({ withdrawLogoutCount: vi.fn() }));
vi.mock('$lib/server/auth/logoutCount', () => ({ withdrawLogoutCount }));

// The shared runtime stub returns every path unlocalized. Here the locale is made visible as a prefix, so a redirect that dropped the request's locale is seen.
vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  localizeHref: (href: string, options?: { locale?: string }) => (options?.locale ? `/${options.locale}${href}` : href)
}));

const LOCALE = 'fi';

const projectGrant = { scope: 'project', target_type: null, target_id: 'project-1', role: 'editor' };

/** What a claim answers for a user who has a password and no open invitation. */
const NOTHING_CLAIMED: InvitationClaimResult = { claimed: [], skipped: [] };

/** A session as the verification answers it; only its presence is read. */
const SESSION = { access_token: 'access-1' };

/**
 * A session the request's cookies hold, whose access token claims the given grants.
 * @param grants - The token's `grants` claim.
 */
function heldSessionWith(grants: Array<Record<string, unknown>>): { access_token: string; refresh_token: string } {
  function segment(value: object): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }
  return {
    access_token: `${segment({ alg: 'HS256' })}.${segment({ sub: 'user-1', grants })}.signature`,
    refresh_token: 'refresh-1'
  };
}

const ADMIN_GRANT = { scope: 'project', target_type: null, target_id: 'project-1', role: 'admin' };
const CANDIDATE_EDITOR_GRANT = { scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' };

/** The claim of each request built in a test, keyed by that request's locals. */
const claimsByLocals = new WeakMap<object, () => Promise<InvitationClaimResult>>();

/** The read of the grants that reach the project, of each request built in a test, keyed by that request's locals. */
const projectGrantsByLocals = new WeakMap<object, () => Promise<Array<Record<string, unknown>>>>();

/** How the sign-out of a held session ends: it works, it answers `{ error }`, or it rejects. */
type SignOutOutcome = 'works' | 'answers { error }' | 'rejects';

/** The error of a sign-out whose call to the auth service failed. */
const SIGN_OUT_FAILURE = { name: 'AuthRetryableFetchError', message: 'fetch failed', status: 0 };

/**
 * Build the locals of a request, with every auth call and the claim recording itself in `calls`.
 * @param options.claim - What the claim resolves to, or the error it rejects with.
 * @param options.heldSession - The session the request's cookies hold; none unless a test says otherwise.
 * @param options.verifyError - What the verification returns as its error; `null` for a token that verifies.
 * @param options.signOut - How the sign-out ends.
 * @param options.sessionLeftAfterFailure - Whether a failed sign-out leaves the held session on the client.
 * @param options.projectGrants - What the read of the grants that reach the project resolves to, or the error it rejects with. The held session's own grants unless a test says otherwise.
 * @returns The locals, the request's `fetch`, the ordered call names, the recorded verification arguments and the number of session reads.
 */
function requestWith({
  claim = NOTHING_CLAIMED,
  heldSession = null,
  verifyError = null,
  signOut = 'works',
  sessionLeftAfterFailure = true,
  projectGrants
}: {
  claim?: InvitationClaimResult | Error;
  heldSession?: { access_token: string } | null;
  verifyError?: { message: string; status?: number; code?: string } | null;
  signOut?: SignOutOutcome;
  sessionLeftAfterFailure?: boolean;
  projectGrants?: Array<Record<string, unknown>> | Error;
} = {}) {
  const calls = new Array<string>();
  const verifyArguments = new Array<unknown>();
  const signOutArguments = new Array<unknown>();
  const sessionReads = { count: 0 };
  // The session the request's client holds: the cookies' one until a sign-out drops it or a verification replaces it.
  let held = heldSession;
  const auth = {
    verifyOtp: async (credentials: unknown) => {
      calls.push('verifyOtp');
      verifyArguments.push(credentials);
      if (verifyError) return { data: { user: null, session: null }, error: verifyError };
      held = SESSION;
      return { data: { user: null, session: SESSION }, error: null };
    },
    refreshSession: async () => {
      calls.push('refreshSession');
      return { error: null };
    },
    signOut: async (options: unknown) => {
      calls.push('signOut');
      signOutArguments.push(options);
      if (signOut === 'works' || !sessionLeftAfterFailure) held = null;
      if (signOut === 'rejects') throw new Error('network down');
      return { error: signOut === 'answers { error }' ? SIGN_OUT_FAILURE : null };
    },
    getSession: async () => {
      sessionReads.count += 1;
      return { data: { session: held }, error: null };
    }
  };
  async function safeGetSession() {
    sessionReads.count += 1;
    return { session: held, user: held ? { id: 'user-1' } : null };
  }
  const locals = { supabase: { auth }, safeGetSession, currentLocale: LOCALE };
  const fetch = vi.fn();
  claimsByLocals.set(locals, async () => {
    calls.push('claimInvitations');
    if (claim instanceof Error) throw claim;
    return claim;
  });
  projectGrantsByLocals.set(locals, async () => {
    if (projectGrants instanceof Error) throw projectGrants;
    return projectGrants ?? (heldSession ? readGrants(heldSession.access_token) : []);
  });
  return { calls, verifyArguments, signOutArguments, sessionReads, locals, fetch };
}

/**
 * The URL of the confirm page with a query.
 * @param search - The query string, with its leading `?`.
 */
function pageUrl(search: string): URL {
  return new URL(`http://localhost/${LOCALE}/auth/confirm${search}`);
}

/**
 * A posted form holding the given fields.
 * @param fields - The form's fields.
 */
function postOf(fields: Record<string, string>): { formData: () => Promise<FormData> } {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  return { formData: async () => form };
}

type LoadEvent = { url: URL; locals: ReturnType<typeof requestWith>['locals'] };
type ActionEvent = LoadEvent & { request: { formData: () => Promise<FormData> }; fetch: typeof fetch };
/** A cookie the action wrote on the request's cookies. */
type CookieWrite = { name: string; value: string; options: unknown };
type FakeCookies = { set: (name: string, value: string, options: unknown) => void };
const runLoad = load as unknown as (event: LoadEvent) => Promise<Record<string, unknown>>;
const confirmAction = actions.default as unknown as (event: ActionEvent & { cookies: FakeCookies }) => Promise<unknown>;

/** The cookies the actions of the running test wrote, oldest first. */
let cookieWrites: Array<CookieWrite> = [];

/**
 * Run the action on a request whose cookies record every write in {@link cookieWrites}.
 * @param event - The rest of the request.
 */
function confirm(event: ActionEvent): Promise<unknown> {
  const cookies: FakeCookies = {
    set: (name, value, options) => {
      cookieWrites.push({ name, value, options });
    }
  };
  return confirmAction({ ...event, cookies });
}

/**
 * What a call throws, which is a redirect for every path that leaves the page.
 * @param call - The call.
 */
async function redirectOf(call: () => Promise<unknown>): Promise<{ status: number; location: string }> {
  try {
    await call();
  } catch (e) {
    return e as { status: number; location: string };
  }
  throw new Error('the call resolved, and it was expected to redirect');
}

/** The login page carrying the auth error, in the request's locale. */
const LOGIN_WITH_AUTH_ERROR = buildRoute({ route: 'ContestantAppLogin', locale: LOCALE, errorMessage: 'authError' });
/** The Admin App's login page carrying the auth error, in the request's locale. */
const ADMIN_LOGIN_WITH_AUTH_ERROR = buildRoute({ route: 'AdminAppLogin', locale: LOCALE, errorMessage: 'authError' });
/** The Contestant App's root, in the request's locale. */
const APP_ROOT = buildRoute({ route: 'ContestantAppHome', locale: LOCALE });
/** The Admin App's root, in the request's locale. */
const ADMIN_ROOT = buildRoute({ route: 'AdminAppHome', locale: LOCALE });

beforeEach(() => {
  cookieWrites = [];
  configureLogger({ level: 'silent' });
  writerMocks.createDataWriter.mockImplementation((source: { locals: object }) => ({
    claimInvitations: () => {
      const claim = claimsByLocals.get(source.locals);
      if (!claim) throw new Error('a writer was made over locals no test built');
      return claim();
    },
    getProjectGrants: () => {
      const read = projectGrantsByLocals.get(source.locals);
      if (!read) throw new Error('a writer was made over locals no test built');
      return read();
    }
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  writerMocks.createDataWriter.mockReset();
  withdrawLogoutCount.mockReset();
});

describe('the confirm page load', () => {
  it.each([['magiclink'], ['recovery'], ['email_change']])(
    'answers the token, the type and the next of a %s link for the form, and verifies nothing',
    async (type) => {
      const { locals, calls } = requestWith();

      const data = await runLoad({ url: pageUrl(`?token_hash=hash-1&type=${type}&next=contestant%2Fhelp`), locals });

      expect(data).toMatchObject({ tokenHash: 'hash-1', type, next: 'contestant/help' });
      expect(calls).toEqual([]);
      expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
    }
  );

  it('answers no next for a link that names none', async () => {
    const { locals } = requestWith();

    const data = await runLoad({ url: pageUrl('?token_hash=hash-1&type=magiclink'), locals });

    expect(data).toMatchObject({ tokenHash: 'hash-1', type: 'magiclink', next: null });
  });

  it.each([
    ['no type', '?token_hash=hash-1'],
    ['no token', '?type=magiclink'],
    ['an empty token', '?token_hash=&type=magiclink'],
    ['the type invite', '?token_hash=hash-1&type=invite'],
    ['the type signup', '?token_hash=hash-1&type=signup'],
    ['the type email', '?token_hash=hash-1&type=email'],
    ['a type nothing mails', '?token_hash=hash-1&type=sms']
  ])('leads a link with %s to the login page with the auth error, and verifies nothing', async (_kind, search) => {
    const { locals, calls } = requestWith();

    const redirected = await redirectOf(() => runLoad({ url: pageUrl(search), locals }));

    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
    expect(calls).toEqual([]);
  });

  it.each([
    ['no token', '?type=magiclink&next=%2Fadmin'],
    ['no type', '?token_hash=hash-1&next=%2Fadmin'],
    ['the type invite', '?token_hash=hash-1&type=invite&next=%2Fadmin']
  ])(
    'leads a link the Admin App asked for with %s to the Admin App’s login with the auth error',
    async (_kind, search) => {
      const { locals, calls } = requestWith();

      const redirected = await redirectOf(() => runLoad({ url: pageUrl(search), locals }));

      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(ADMIN_LOGIN_WITH_AUTH_ERROR);
      expect(calls).toEqual([]);
    }
  );

  it('leads a refused link whose next names no app to the Contestant App’s login', async () => {
    const { locals } = requestWith();

    const redirected = await redirectOf(() =>
      runLoad({ url: pageUrl('?type=magiclink&next=%2Fadmin%2Fjobs'), locals })
    );

    expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
  });
});

describe('the confirm page action', () => {
  it('verifies the posted token, claims, refreshes and lands a magiclink where the posted next names', async () => {
    const { locals, fetch, calls, verifyArguments } = requestWith({
      claim: { claimed: [projectGrant], skipped: [] }
    });

    const redirected = await redirectOf(() =>
      confirm({
        url: pageUrl('?token_hash=hash-in-the-address&type=recovery'),
        locals,
        fetch,
        request: postOf({ token_hash: 'hash-1', type: 'magiclink', next: '/admin' })
      })
    );

    expect(verifyArguments).toEqual([{ token_hash: 'hash-1', type: 'magiclink' }]);
    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'refreshSession']);
    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(`/${LOCALE}/admin`);
  });

  it("hands the request's cookies to the verification, which marks the browser as one that has confirmed an address", async () => {
    const { locals, fetch } = requestWith();

    await redirectOf(() =>
      confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'magiclink' }) })
    );

    expect(cookieWrites.map(({ name }) => name)).toEqual([COOKIE.registered]);
  });

  it('lands a magiclink posted with an empty next on the app root', async () => {
    const { locals, fetch } = requestWith();

    const redirected = await redirectOf(() =>
      confirm({
        url: pageUrl(''),
        locals,
        fetch,
        request: postOf({ token_hash: 'hash-1', type: 'magiclink', next: '' })
      })
    );

    expect(redirected.location).toBe(APP_ROOT);
  });

  it('signs out and leads a magiclink to the login page with the auth error when the claim throws', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { locals, fetch, calls } = requestWith({ claim: new Error('claimInvitations: the database is unreachable') });

    const redirected = await redirectOf(() =>
      confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'magiclink' }) })
    );

    expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'signOut']);
  });

  it('refuses a post with no token or of the type invite, and verifies nothing', async () => {
    const withoutToken = requestWith();
    const invite = requestWith();

    const refusals = [
      await redirectOf(() =>
        confirm({
          url: pageUrl(''),
          locals: withoutToken.locals,
          fetch: withoutToken.fetch,
          request: postOf({ type: 'magiclink' })
        })
      ),
      await redirectOf(() =>
        confirm({
          url: pageUrl(''),
          locals: invite.locals,
          fetch: invite.fetch,
          request: postOf({ token_hash: 'hash-1', type: 'invite' })
        })
      )
    ];

    for (const redirected of refusals) expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
    expect(withoutToken.calls).toEqual([]);
    expect(invite.calls).toEqual([]);
  });

  it('refuses a post the Admin App’s link made with no token or of the type invite to the Admin App’s login', async () => {
    const withoutToken = requestWith();
    const invite = requestWith();

    const refusals = [
      await redirectOf(() =>
        confirm({
          url: pageUrl(''),
          locals: withoutToken.locals,
          fetch: withoutToken.fetch,
          request: postOf({ type: 'magiclink', next: '/admin' })
        })
      ),
      await redirectOf(() =>
        confirm({
          url: pageUrl(''),
          locals: invite.locals,
          fetch: invite.fetch,
          request: postOf({ token_hash: 'hash-1', type: 'invite', next: '/admin' })
        })
      )
    ];

    for (const redirected of refusals) expect(redirected.location).toBe(ADMIN_LOGIN_WITH_AUTH_ERROR);
    expect(withoutToken.calls).toEqual([]);
    expect(invite.calls).toEqual([]);
  });
});

describe('the confirm page in a browser with no session', () => {
  it('answers that the browser is not signed in, and names no Cancel', async () => {
    const { locals } = requestWith();

    const data = await runLoad({ url: pageUrl('?token_hash=hash-1&type=magiclink'), locals });

    expect(data.signedIn).toBe(false);
    expect('cancelRoute' in data).toBe(false);
  });

  it('verifies without signing anything out first', async () => {
    const { locals, fetch, calls } = requestWith();

    await redirectOf(() =>
      confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'magiclink' }) })
    );

    expect(calls[0]).toBe('verifyOtp');
    expect(calls).not.toContain('signOut');
  });

  it('takes a session that cannot be read for none', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { locals } = requestWith();
    (locals as { safeGetSession: () => Promise<unknown> }).safeGetSession = async () => {
      throw new Error('the auth service is unreachable');
    };

    const data = await runLoad({ url: pageUrl('?token_hash=hash-1&type=magiclink'), locals });

    expect(data.signedIn).toBe(false);
  });
});

describe('the confirm page in a browser that is signed in', () => {
  it.each([
    ['admin grants alone', [ADMIN_GRANT], ADMIN_ROOT],
    ['a candidate editor grant alone', [CANDIDATE_EDITOR_GRANT], APP_ROOT],
    ['admin and candidate editor grants', [ADMIN_GRANT, CANDIDATE_EDITOR_GRANT], APP_ROOT],
    ['no grant', [], APP_ROOT]
  ])('answers that the browser is signed in, with Cancel to the right home for %s', async (_kind, grants, home) => {
    const { locals, calls } = requestWith({ heldSession: heldSessionWith(grants) });

    const data = await runLoad({ url: pageUrl('?token_hash=hash-1&type=magiclink'), locals });

    expect(data.signedIn).toBe(true);
    expect(data.cancelRoute).toBe(home);
    expect(calls).toEqual([]);
  });

  it.each([
    ['an admin of another project only', [ADMIN_GRANT], [], APP_ROOT],
    [
      'an admin here who edits a candidate of another project only',
      [ADMIN_GRANT, CANDIDATE_EDITOR_GRANT],
      [ADMIN_GRANT],
      ADMIN_ROOT
    ]
  ])('leads Cancel by the grants that reach this project for %s', async (_kind, grants, projectGrants, home) => {
    const { locals } = requestWith({ heldSession: heldSessionWith(grants), projectGrants });

    const data = await runLoad({ url: pageUrl('?token_hash=hash-1&type=magiclink'), locals });

    expect(data.cancelRoute).toBe(home);
  });

  it("leads Cancel to the Contestant App's home when the grants that reach this project cannot be read", async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { locals } = requestWith({
      heldSession: heldSessionWith([ADMIN_GRANT]),
      projectGrants: new Error('the database is unreachable')
    });

    const data = await runLoad({ url: pageUrl('?token_hash=hash-1&type=magiclink'), locals });

    expect(data.cancelRoute).toBe(APP_ROOT);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('answers no part of the session', async () => {
    const session = heldSessionWith([ADMIN_GRANT]);
    const { locals } = requestWith({ heldSession: session });

    const data = await runLoad({ url: pageUrl('?token_hash=hash-1&type=magiclink'), locals });

    const answered = JSON.stringify(data);
    expect(answered).not.toContain(session.access_token);
    expect(answered).not.toContain(session.refresh_token);
    expect(answered).not.toContain('user-1');
    expect(Object.keys(data).sort()).toEqual(['cancelRoute', 'next', 'signedIn', 'tokenHash', 'type']);
  });

  it('signs the held session out locally before it verifies, then claims, refreshes and lands', async () => {
    const { locals, fetch, calls, signOutArguments } = requestWith({
      heldSession: heldSessionWith([CANDIDATE_EDITOR_GRANT]),
      claim: { claimed: [projectGrant], skipped: [] }
    });

    const redirected = await redirectOf(() =>
      confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'magiclink' }) })
    );

    expect(calls).toEqual(['signOut', 'verifyOtp', 'claimInvitations', 'refreshSession']);
    expect(signOutArguments).toEqual([{ scope: 'local' }]);
    expect(redirected.location).toBe(APP_ROOT);
  });

  it.each([
    ['no token', { type: 'magiclink' }],
    ['an empty token', { token_hash: '', type: 'magiclink' }],
    ['no type', { token_hash: 'hash-1' }],
    ['the type invite', { token_hash: 'hash-1', type: 'invite' }],
    ['a type nothing mails', { token_hash: 'hash-1', type: 'sms' }]
  ])('keeps the held session and verifies nothing for a post with %s', async (_kind, fields) => {
    const { locals, fetch, calls } = requestWith({ heldSession: heldSessionWith([CANDIDATE_EDITOR_GRANT]) });

    const redirected = await redirectOf(() => confirm({ url: pageUrl(''), locals, fetch, request: postOf(fields) }));

    expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
    expect(calls).toEqual([]);
  });

  it('lands a failed email_change link on the login page, because the browser was signed out first', async () => {
    const { locals, fetch, calls } = requestWith({
      heldSession: heldSessionWith([CANDIDATE_EDITOR_GRANT]),
      verifyError: { message: 'Email link is invalid or has expired', status: 403, code: 'otp_expired' }
    });

    const redirected = await redirectOf(() =>
      confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'email_change' }) })
    );

    expect(calls).toEqual(['signOut', 'verifyOtp']);
    expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
  });
});

describe('the other two link types, through the page', () => {
  it('lands a recovery link on the reset-password page', async () => {
    const { locals, fetch, verifyArguments } = requestWith();

    const redirected = await redirectOf(() =>
      confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'recovery' }) })
    );

    expect(verifyArguments).toEqual([{ token_hash: 'hash-1', type: 'recovery' }]);
    expect(redirected.location).toBe(buildRoute({ route: 'ContestantAppResetPassword', locale: LOCALE }));
  });

  it('lands an email_change link that answers a session on the app root', async () => {
    const { locals, fetch, verifyArguments } = requestWith();

    const redirected = await redirectOf(() =>
      confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'email_change' }) })
    );

    expect(verifyArguments).toEqual([{ token_hash: 'hash-1', type: 'email_change' }]);
    expect(redirected.location).toBe(APP_ROOT);
  });
});

describe('the logout count', () => {
  /**
   * Make each withdrawal record itself in a request's call list.
   * @param calls - The request's ordered call names.
   */
  function recordWithdrawals(calls: Array<string>): void {
    withdrawLogoutCount.mockImplementation(() => {
      calls.push('withdrawLogoutCount');
    });
  }

  it("is withdrawn with the request's event once the verification has set the session, when no session is held", async () => {
    const { locals, fetch, calls } = requestWith({
      claim: { claimed: [projectGrant], skipped: [] }
    });
    recordWithdrawals(calls);
    const url = pageUrl('');
    const request = postOf({ token_hash: 'hash-1', type: 'magiclink' });

    await redirectOf(() => confirm({ url, locals, fetch, request }));

    expect(withdrawLogoutCount).toHaveBeenCalledTimes(1);
    const [event] = withdrawLogoutCount.mock.calls[0];
    expect(event.request).toBe(request);
    expect(event.url).toBe(url);
    expect(event.cookies).toBeDefined();
    expect(calls).toEqual(['verifyOtp', 'withdrawLogoutCount', 'claimInvitations', 'refreshSession']);
  });

  it('is withdrawn once the verification has set the session, after the sign-out of a held session worked', async () => {
    const { locals, fetch, calls } = requestWith({
      heldSession: heldSessionWith([CANDIDATE_EDITOR_GRANT]),
      claim: { claimed: [projectGrant], skipped: [] }
    });
    recordWithdrawals(calls);

    await redirectOf(() =>
      confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'magiclink' }) })
    );

    expect(withdrawLogoutCount).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['signOut', 'verifyOtp', 'withdrawLogoutCount', 'claimInvitations', 'refreshSession']);
  });

  it.each([['answers { error }' as const], ['rejects' as const]])(
    "is kept, and the action logs the failure and ends on a 503 with the text of error.default with nothing verified, when the held session's sign-out %s and a session is left",
    async (signOut) => {
      const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      const { locals, fetch, calls } = requestWith({ heldSession: heldSessionWith([CANDIDATE_EDITOR_GRANT]), signOut });
      recordWithdrawals(calls);

      const failed = await redirectOf(() =>
        confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'magiclink' }) })
      );

      expect(isRedirect(failed)).toBe(false);
      expect(isHttpError(failed, 503)).toBe(true);
      expect((failed as unknown as { body: unknown }).body).toEqual({ message: 'error.default' });
      expect(calls).toEqual(['signOut']);
      expect(withdrawLogoutCount).not.toHaveBeenCalled();
      expect(cookieWrites).toEqual([]);
      expect(error).toHaveBeenCalledTimes(1);
    }
  );

  it("is withdrawn once the verification has set the session, when the held session's sign-out answers { error } and no session is left", async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { locals, fetch, calls } = requestWith({
      heldSession: heldSessionWith([CANDIDATE_EDITOR_GRANT]),
      signOut: 'answers { error }',
      sessionLeftAfterFailure: false
    });
    recordWithdrawals(calls);

    const redirected = await redirectOf(() =>
      confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'magiclink' }) })
    );

    expect(calls).toEqual(['signOut', 'verifyOtp', 'withdrawLogoutCount', 'claimInvitations']);
    expect(redirected.location).toBe(APP_ROOT);
  });

  it.each([
    ['no session is held', null],
    ['a held session was signed out', heldSessionWith([CANDIDATE_EDITOR_GRANT])]
  ])(
    'is kept when the verification fails, and the action leads to the login page with the auth error, when %s',
    async (_kind, heldSession) => {
      const { locals, fetch, calls } = requestWith({
        heldSession,
        verifyError: { message: 'Email link is invalid or has expired', status: 403, code: 'otp_expired' }
      });
      recordWithdrawals(calls);

      const redirected = await redirectOf(() =>
        confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'magiclink' }) })
      );

      expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
      expect(withdrawLogoutCount).not.toHaveBeenCalled();
      expect(calls).not.toContain('withdrawLogoutCount');
    }
  );

  it('is not withdrawn by a post the action refuses', async () => {
    const { locals, fetch } = requestWith({ heldSession: heldSessionWith([CANDIDATE_EDITOR_GRANT]) });

    await redirectOf(() => confirm({ url: pageUrl(''), locals, fetch, request: postOf({ type: 'magiclink' }) }));

    expect(withdrawLogoutCount).not.toHaveBeenCalled();
  });
});
