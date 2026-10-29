/**
 * The server load and the form action of the confirm page between a mailed link and its verification, each driven directly with a fake request context and a mocked data writer.
 *
 * What this file holds:
 *
 * 1. **The load verifies nothing** — it answers the link's `token_hash`, `type` and `next` for the page's form and calls no auth method, and it leads a link with a missing token or type, or of a type nothing mails, to the login page with the auth error.
 * 2. **The action verifies** — it reads the three fields from the posted form, not from the address, and lands the user as the auth callback lands them: verify, claim, refresh, land.
 * 3. **A browser that is signed in** — the load says so and names where Cancel leads, the Admin App's home for a session whose grants open the Admin App alone and the Contestant App's home otherwise, and answers no part of the session; the action signs that session out locally before it verifies.
 *
 * Every auth call and the claim record themselves in one list, so the order is read off it. The cookies the action writes record themselves in another. The session the request's cookies hold is read through its own recorder, so the list holds the effects alone.
 */

import { configureLogger, log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import { actions, load } from './+page.server';
import type { InvitationClaimResult } from '$lib/api/base/dataWriter.type';

const writerMocks = vi.hoisted(() => ({ createDataWriter: vi.fn() }));
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter: writerMocks.createDataWriter }));

// The shared runtime stub returns every path unlocalized. Here the locale is made visible as a prefix, so a redirect that dropped the request's locale is seen.
vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  localizeHref: (href: string, options?: { locale?: string }) => (options?.locale ? `/${options.locale}${href}` : href)
}));

const LOCALE = 'fi';

const projectGrant = { scope: 'project', target_type: null, target_id: 'project-1', role: 'editor' };

/** What a claim answers for a user who has a password and no open invitation. */
const NOTHING_CLAIMED: InvitationClaimResult = { claimed: [], skipped: [], passwordSet: true };

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

/**
 * Build the locals of a request, with every auth call and the claim recording itself in `calls`.
 * @param options.claim - What the claim resolves to, or the error it rejects with.
 * @returns The locals, the request's `fetch`, the ordered call names, the recorded verification arguments and the number of session reads.
 */
function requestWith({
  claim = NOTHING_CLAIMED,
  heldSession = null,
  verifyError = null
}: {
  claim?: InvitationClaimResult | Error;
  heldSession?: { access_token: string } | null;
  verifyError?: { message: string; status?: number; code?: string } | null;
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
      held = null;
      return { error: null };
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
    }
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  writerMocks.createDataWriter.mockReset();
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
});

describe('the confirm page action', () => {
  it('verifies the posted token, claims, refreshes and lands a magiclink on the posted next', async () => {
    const { locals, fetch, calls, verifyArguments } = requestWith({
      claim: { claimed: [projectGrant], skipped: [], passwordSet: true }
    });

    const redirected = await redirectOf(() =>
      confirm({
        url: pageUrl('?token_hash=hash-in-the-address&type=recovery'),
        locals,
        fetch,
        request: postOf({ token_hash: 'hash-1', type: 'magiclink', next: 'contestant/help' })
      })
    );

    expect(verifyArguments).toEqual([{ token_hash: 'hash-1', type: 'magiclink' }]);
    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'refreshSession']);
    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(`/${LOCALE}/contestant/help`);
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
      claim: { claimed: [projectGrant], skipped: [], passwordSet: true }
    });

    const redirected = await redirectOf(() =>
      confirm({ url: pageUrl(''), locals, fetch, request: postOf({ token_hash: 'hash-1', type: 'magiclink' }) })
    );

    expect(calls).toEqual(['signOut', 'verifyOtp', 'claimInvitations', 'refreshSession']);
    expect(signOutArguments).toEqual([{ scope: 'local' }]);
    expect(redirected.location).toBe(APP_ROOT);
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
