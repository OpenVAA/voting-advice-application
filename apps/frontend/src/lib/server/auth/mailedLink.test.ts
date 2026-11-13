/**
 * The verification of a mailed link, driven with fake request locals and a mocked data writer.
 *
 * Every auth call and the claim record themselves in one list, so the order verify, claim, refresh is read off it. The function always ends in a redirect, which is what it throws.
 *
 * The request's cookies record every write in their own list, apart from the calls, so the marker of a confirmed address is read off it.
 *
 * An auth error is faked with the status and the code the auth client gives it: a link whose new address another account took answers status 500 with no code, an expired or replaced link 403 with the code `otp_expired`.
 *
 * The withdrawal of the logout count is replaced and records itself in the call list when a test asks it to; what it removes is asserted in its own test file.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configureLogger, log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import { buildRoute, ROUTE } from '$lib/routes';
import {
  isMailedLinkType,
  MAILED_LINK_LANDINGS,
  MAILED_LINK_TYPES,
  mailedLinkLanding,
  verifyMailedLink
} from './mailedLink';
import type { InvitationClaimResult } from '$lib/api/base/dataWriter.type';
import type { GrantClaim } from '$lib/auth/roles';

const writerMocks = vi.hoisted(() => ({ createDataWriter: vi.fn() }));
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter: writerMocks.createDataWriter }));

const { withdrawLogoutCount } = vi.hoisted(() => ({ withdrawLogoutCount: vi.fn() }));
vi.mock('$lib/server/auth/logoutCount', () => ({ withdrawLogoutCount }));

// The shared runtime stub returns every path unlocalized. Here the locale is made visible as a prefix, so a redirect that dropped the request's locale is seen.
vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  localizeHref: (href: string, options?: { locale?: string }) => (options?.locale ? `/${options.locale}${href}` : href)
}));

const ADDRESS = 'invited+one@example.com';
const LOCALE = 'fi';

const editorGrant = { scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' };

/** What a claim answers for a user who has a password and no open invitation. */
const NOTHING_CLAIMED: InvitationClaimResult = { claimed: [], skipped: [], passwordSet: true };

/** A session as the verification answers it and as the request's cookies hold it; only its presence is read. */
const SESSION = { access_token: 'access-1' };

/** The error of a link whose new address another account took after the link was mailed. */
const ADDRESS_TAKEN = { message: 'Error confirming email change', status: 500, code: undefined };

/** The error of a link that expired or that a newer link replaced. */
const LINK_EXPIRED = { message: 'Email link is invalid or has expired', status: 403, code: 'otp_expired' };

/** The claim of each request built in a test, keyed by that request's locals, so a writer made for one request claims for that request alone. */
const claimsByLocals = new WeakMap<object, () => Promise<InvitationClaimResult>>();

/** The read of the grants that reach the project, of each request built in a test, keyed by that request's locals. */
const projectGrantsByLocals = new WeakMap<object, () => Promise<Array<GrantClaim>>>();

const PROJECT_ADMIN_GRANT: GrantClaim = { scope: 'project', target_type: null, target_id: 'project-1', role: 'admin' };
const CANDIDATE_EDITOR_GRANT: GrantClaim = {
  scope: 'entity',
  target_type: 'candidate',
  target_id: 'cand-1',
  role: 'editor'
};

/** A cookie the function wrote on the request's cookies. */
type CookieWrite = { name: string; value: string; options: Record<string, unknown> };

/** The attributes of the marker a browser receives once it has confirmed an address. */
const REGISTERED_ATTRIBUTES = { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 };

/** The link a test verifies: its `token_hash`, `type` and `next`, each `null` when the link lacks it. */
type Link = { tokenHash?: string | null; type?: string | null; next?: string | null };

/**
 * Build the arguments the function receives, with every auth call and the claim recording itself in `calls`.
 * @param options.link - The link's parameters.
 * @param options.verifyError - What the verification returns as its error; `null` for a token that verifies.
 * @param options.verifySession - The session the verification answers with; a session unless a test says otherwise.
 * @param options.heldSession - The session the request's cookies already hold; none unless a test says otherwise.
 * @param options.claim - What the claim resolves to, or the error it rejects with.
 * @param options.refreshError - What the refresh returns as its error.
 * @param options.projectGrants - What the read of the grants that reach the project resolves to, or the error it rejects with. No grant unless a test says otherwise.
 * @returns The arguments, the ordered call names, the recorded arguments, the cookies written, and the request and address handed over.
 */
function requestWith({
  link,
  verifyError = null,
  verifySession = SESSION,
  heldSession = null,
  claim = NOTHING_CLAIMED,
  refreshError = null,
  projectGrants = []
}: {
  link: Link;
  verifyError?: { message: string; status?: number; code?: string } | null;
  verifySession?: typeof SESSION | null;
  heldSession?: typeof SESSION | null;
  claim?: InvitationClaimResult | Error;
  refreshError?: { message: string } | null;
  projectGrants?: Array<GrantClaim> | Error;
}) {
  const calls = new Array<string>();
  const verifyArguments = new Array<unknown>();
  const signOutArguments = new Array<unknown>();
  const cookieWrites = new Array<CookieWrite>();
  const cookies = {
    set: (name: string, value: string, options: Record<string, unknown>) => {
      cookieWrites.push({ name, value, options });
    }
  };
  const auth = {
    verifyOtp: async (credentials: unknown) => {
      calls.push('verifyOtp');
      verifyArguments.push(credentials);
      return verifyError
        ? { data: { user: null, session: null }, error: verifyError }
        : { data: { user: null, session: verifySession }, error: null };
    },
    refreshSession: async () => {
      calls.push('refreshSession');
      return { error: refreshError };
    },
    getUser: async () => {
      calls.push('getUser');
      return { data: { user: { email: ADDRESS } } };
    },
    signOut: async (options: unknown) => {
      calls.push('signOut');
      signOutArguments.push(options);
      return { error: null };
    }
  };
  async function safeGetSession() {
    calls.push('safeGetSession');
    return { session: heldSession, user: null };
  }
  const locals = { supabase: { auth }, safeGetSession, currentLocale: LOCALE };
  const fetch = vi.fn();
  const request = new Request(`http://localhost/${LOCALE}/auth/confirm`, { method: 'POST' });
  const url = new URL(`http://localhost/${LOCALE}/auth/confirm`);
  claimsByLocals.set(locals, async () => {
    calls.push('claimInvitations');
    if (claim instanceof Error) throw claim;
    return claim;
  });
  projectGrantsByLocals.set(locals, async () => {
    if (projectGrants instanceof Error) throw projectGrants;
    return projectGrants;
  });
  return {
    calls,
    verifyArguments,
    signOutArguments,
    cookieWrites,
    cookies,
    request,
    url,
    locals,
    fetch,
    args: {
      tokenHash: link.tokenHash ?? null,
      type: link.type ?? null,
      next: link.next ?? null,
      locals,
      cookies,
      fetch,
      request,
      url
    } as unknown as Parameters<typeof verifyMailedLink>[0]
  };
}

/** What the function throws. */
async function redirectOf(args: Parameters<typeof verifyMailedLink>[0]): Promise<{ status: number; location: string }> {
  try {
    await verifyMailedLink(args);
  } catch (e) {
    return e as { status: number; location: string };
  }
  throw new Error('verifyMailedLink resolved, and it must always redirect');
}

/** The login page carrying the auth error, in the request's locale. */
const LOGIN_WITH_AUTH_ERROR = buildRoute({ route: 'ContestantAppLogin', locale: LOCALE, errorMessage: 'authError' });
/** The login page carrying the notice of an address another account now holds, in the request's locale. */
const LOGIN_WITH_EMAIL_TAKEN = buildRoute({ route: 'ContestantAppLogin', locale: LOCALE, errorMessage: 'emailTaken' });
/** The Contestant App's root, in the request's locale. */
const APP_ROOT = buildRoute({ route: 'ContestantAppHome', locale: LOCALE });

describe('the mailed link types', () => {
  it('are the three types the account-access function mails', () => {
    expect([...MAILED_LINK_TYPES]).toEqual(['magiclink', 'recovery', 'email_change']);
  });

  it.each([['magiclink'], ['recovery'], ['email_change']])('names %s a mailed link type', (type) => {
    expect(isMailedLinkType(type)).toBe(true);
  });

  it.each([['invite'], ['signup'], ['email'], ['sms'], [''], [null], [undefined]])(
    'does not name %j a mailed link type',
    (type) => {
      expect(isMailedLinkType(type)).toBe(false);
    }
  );
});

/** The source of the `account-access` function's link builder. The frontend cannot import the Deno module, so its constant is read as text. */
const SIGN_IN_LINK_SOURCE = fs.readFileSync(
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../../../supabase/supabase/functions/account-access/signInLink.ts'
  ),
  'utf8'
);

/** The values of the function's `APP_NEXT`: the `next` it writes for each app, read off the constant's object literal. */
function appNextValues(): Array<string> {
  const literal = SIGN_IN_LINK_SOURCE.match(/export const APP_NEXT\b[^=]*=\s*Object\.freeze\(\{([^}]*)\}\)/);
  if (!literal) throw new Error('signInLink.ts declares no APP_NEXT this test can read');
  return [...literal[1].matchAll(/:\s*'([^']*)'/g)].map((value) => value[1]);
}

const CONTESTANT_APP_LANDING = {
  home: 'ContestantAppHome',
  resetPassword: 'ContestantAppResetPassword',
  login: 'ContestantAppLogin'
};

describe('the landing a link’s next names', () => {
  it('answers the Admin App’s home, password-reset page and login for /admin', () => {
    expect(mailedLinkLanding('/admin')).toStrictEqual({
      home: 'AdminAppHome',
      resetPassword: 'AdminAppResetPassword',
      login: 'AdminAppLogin'
    });
  });

  it.each([
    [null],
    [undefined],
    [''],
    ['/admin/'],
    ['/admin/jobs'],
    ['admin'],
    ['//evil.example'],
    ['constructor'],
    ['__proto__']
  ])('answers the Contestant App’s three for %j', (next) => {
    expect(mailedLinkLanding(next)).toStrictEqual(CONTESTANT_APP_LANDING);
  });

  it('names a route key in every entry and in the default', () => {
    for (const landing of [...Object.values(MAILED_LINK_LANDINGS), mailedLinkLanding(null)]) {
      for (const route of Object.values(landing)) expect(Object.hasOwn(ROUTE, route)).toBe(true);
    }
  });

  it('holds an entry for every next the account-access function writes, and is frozen', () => {
    const written = appNextValues();
    expect(written.length).toBeGreaterThan(0);
    for (const next of written) expect(Object.hasOwn(MAILED_LINK_LANDINGS, next)).toBe(true);
    expect(Object.isFrozen(MAILED_LINK_LANDINGS)).toBe(true);
    for (const landing of Object.values(MAILED_LINK_LANDINGS)) expect(Object.isFrozen(landing)).toBe(true);
  });
});

describe('verifyMailedLink', () => {
  beforeEach(() => {
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

  it('sends a verified magiclink to the app root, in the request locale, with nothing in its query', async () => {
    const { args, calls, verifyArguments } = requestWith({
      link: { tokenHash: 'hash-1', type: 'magiclink' },
      claim: { claimed: [editorGrant], skipped: [], passwordSet: false }
    });

    const redirected = await redirectOf(args);

    expect(verifyArguments).toEqual([{ token_hash: 'hash-1', type: 'magiclink' }]);
    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(APP_ROOT);
    const target = new URL(redirected.location, 'http://localhost');
    expect(target.pathname).toBe(`/${LOCALE}/contestant`);
    expect([...target.searchParams.keys()]).toEqual([]);
    expect(redirected.location).not.toContain(ADDRESS);
    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'refreshSession']);
  });

  it('sends a magiclink whose next names an app path it has no landing for to the app root, with nothing of the path', async () => {
    const withSeparator = requestWith({ link: { tokenHash: 'hash-1', type: 'magiclink', next: '/contestant/help' } });
    const withoutSeparator = requestWith({ link: { tokenHash: 'hash-1', type: 'magiclink', next: 'contestant/help' } });

    expect((await redirectOf(withSeparator.args)).location).toBe(APP_ROOT);
    expect((await redirectOf(withoutSeparator.args)).location).toBe(APP_ROOT);
  });

  it('sends a magiclink whose next is the Admin App’s to the Admin home, in the request locale', async () => {
    const { args, calls } = requestWith({ link: { tokenHash: 'hash-1', type: 'magiclink', next: '/admin' } });

    const redirected = await redirectOf(args);

    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(buildRoute({ route: 'AdminAppHome', locale: LOCALE }));
    expect(new URL(redirected.location, 'http://localhost').pathname).toBe(`/${LOCALE}/admin`);
    expect(calls).toEqual(['verifyOtp', 'claimInvitations']);
  });

  it.each([
    ['an absolute', 'https://evil.example/contestant'],
    ['a protocol-relative', '//evil.example/contestant'],
    ['a backslash-led', '\\\\evil.example\\contestant'],
    ['a parent-relative', '../admin'],
    ['an empty', ''],
    ['a trailing-separator Admin App', '/admin/'],
    ['a deeper Admin App', '/admin/jobs'],
    ['an unled Admin App', 'admin'],
    ['a bare protocol-relative', '//evil.example'],
    ['an absolute Admin App', 'https://evil.example/admin'],
    ['a prototype key', 'constructor'],
    ['another prototype key', '__proto__']
  ])('ignores %s next and sends the user to the app root', async (_kind, next) => {
    const { args } = requestWith({ link: { tokenHash: 'hash-1', type: 'magiclink', next } });

    expect((await redirectOf(args)).location).toBe(APP_ROOT);
  });

  it('verifies, claims on the request client, refreshes and only then redirects when a grant was claimed', async () => {
    const { args, calls, locals, fetch } = requestWith({
      link: { tokenHash: 'hash-1', type: 'magiclink' },
      claim: { claimed: [editorGrant], skipped: [], passwordSet: true }
    });

    const redirected = await redirectOf(args);

    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'refreshSession']);
    expect(redirected.location).toBe(APP_ROOT);
    expect(writerMocks.createDataWriter).toHaveBeenCalledTimes(1);
    const [source] = writerMocks.createDataWriter.mock.calls[0] as [{ fetch: unknown; locals: unknown }];
    expect(Object.keys(source).sort()).toEqual(['fetch', 'locals']);
    expect(source.locals).toBe(locals);
    expect(source.fetch).toBe(fetch);
  });

  it('does not refresh when nothing was claimed', async () => {
    const { args, calls } = requestWith({
      link: { tokenHash: 'hash-1', type: 'magiclink' },
      claim: { claimed: [], skipped: [{ ...editorGrant, reason: 'candidate_has_editor' }], passwordSet: true }
    });

    await redirectOf(args);

    expect(calls).toEqual(['verifyOtp', 'claimInvitations']);
  });

  it('signs out locally and sends a magiclink to the login page with the auth error when the claim throws', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { args, calls, signOutArguments } = requestWith({
      link: { tokenHash: 'hash-1', type: 'magiclink', next: 'contestant/help' },
      claim: new Error('claimInvitations: the database is unreachable')
    });

    const redirected = await redirectOf(args);

    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'signOut']);
    expect(signOutArguments).toEqual([{ scope: 'local' }]);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('the database is unreachable');
    expect(String(error.mock.calls[0][0])).not.toContain('hash-1');
  });

  it('lands a recovery link on the reset-password page, and still does when the claim throws', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const claimed = requestWith({ link: { tokenHash: 'hash-1', type: 'recovery' } });
    const failed = requestWith({
      link: { tokenHash: 'hash-1', type: 'recovery' },
      claim: new Error('claimInvitations: the database is unreachable')
    });

    for (const { args } of [claimed, failed]) {
      const redirected = await redirectOf(args);
      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(buildRoute({ route: 'ContestantAppResetPassword', locale: LOCALE }));
    }
    expect(failed.calls).toEqual(['verifyOtp', 'claimInvitations']);
  });

  it.each([
    ['a candidate editor grant alone', [CANDIDATE_EDITOR_GRANT], 'ContestantAppHome', 'ContestantAppResetPassword'],
    [
      'an admin grant and a candidate editor grant',
      [PROJECT_ADMIN_GRANT, CANDIDATE_EDITOR_GRANT],
      'AdminAppHome',
      'AdminAppResetPassword'
    ],
    ['an admin grant alone', [PROJECT_ADMIN_GRANT], 'AdminAppHome', 'AdminAppResetPassword'],
    ['no grant that opens either app', [], 'AdminAppHome', 'AdminAppResetPassword']
  ] as const)(
    'lands a link the Admin App asked for, of a user whose grants here are %s, in the app those grants open',
    async (_kind, grants, home, resetPassword) => {
      const signIn = requestWith({
        link: { tokenHash: 'hash-1', type: 'magiclink', next: '/admin' },
        projectGrants: [...grants]
      });
      const recovery = requestWith({
        link: { tokenHash: 'hash-1', type: 'recovery', next: '/admin' },
        projectGrants: [...grants]
      });

      expect((await redirectOf(signIn.args)).location).toBe(buildRoute({ route: home, locale: LOCALE }));
      expect((await redirectOf(recovery.args)).location).toBe(buildRoute({ route: resetPassword, locale: LOCALE }));
    }
  );

  it('lands a link the Admin App asked for in the Admin App when the grants cannot be read, and logs it', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { args } = requestWith({
      link: { tokenHash: 'hash-1', type: 'magiclink', next: '/admin' },
      projectGrants: new Error('the database is unreachable')
    });

    expect((await redirectOf(args)).location).toBe(buildRoute({ route: 'AdminAppHome', locale: LOCALE }));
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('lands a link that names no app in the Contestant App whatever the grants, without reading them', async () => {
    const { args } = requestWith({
      link: { tokenHash: 'hash-1', type: 'magiclink' },
      projectGrants: new Error('the grants were read')
    });

    expect((await redirectOf(args)).location).toBe(APP_ROOT);
  });

  it('lands a recovery link the Admin App asked for on its password-reset page', async () => {
    const { args, calls } = requestWith({ link: { tokenHash: 'hash-1', type: 'recovery', next: '/admin' } });

    const redirected = await redirectOf(args);

    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(buildRoute({ route: 'AdminAppResetPassword', locale: LOCALE }));
    expect(calls).toEqual(['verifyOtp', 'claimInvitations']);
  });

  it('sends a link the Admin App asked for that fails, or whose claim fails, to the Admin App’s login with the auth error', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const adminLogin = buildRoute({ route: 'AdminAppLogin', locale: LOCALE, errorMessage: 'authError' });
    const failed = requestWith({
      link: { tokenHash: 'hash-1', type: 'recovery', next: '/admin' },
      verifyError: { message: 'Email link is invalid or has expired' }
    });
    const failedClaim = requestWith({
      link: { tokenHash: 'hash-1', type: 'magiclink', next: '/admin' },
      claim: new Error('claimInvitations: the database is unreachable')
    });
    const withoutToken = requestWith({ link: { type: 'magiclink', next: '/admin' } });
    const refused = requestWith({ link: { tokenHash: 'hash-1', type: 'invite', next: '/admin' } });

    for (const { args } of [failed, failedClaim, withoutToken, refused]) {
      const redirected = await redirectOf(args);
      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(adminLogin);
    }
    expect(refused.calls).toEqual([]);
  });

  it('leaves the landing of a failed email_change link to the Contestant App, whatever next it names', async () => {
    const { args } = requestWith({
      link: { tokenHash: 'hash-1', type: 'email_change', next: '/admin' },
      verifyError: LINK_EXPIRED
    });

    expect((await redirectOf(args)).location).toBe(LOGIN_WITH_AUTH_ERROR);
  });

  it('sends a failed verification and a missing token or type to the login page with the auth error, and claims nothing', async () => {
    const failed = requestWith({
      link: { tokenHash: 'hash-1', type: 'magiclink' },
      verifyError: { message: 'Email link is invalid or has expired' }
    });
    const withoutType = requestWith({ link: { tokenHash: 'hash-1' } });
    const withoutToken = requestWith({ link: { type: 'magiclink' } });
    const withEmptyToken = requestWith({ link: { tokenHash: '', type: 'magiclink' } });

    for (const { args } of [failed, withoutType, withoutToken, withEmptyToken]) {
      const redirected = await redirectOf(args);
      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
    }
    expect(failed.calls).toEqual(['verifyOtp']);
    expect(withoutType.calls).toEqual([]);
    expect(withoutToken.calls).toEqual([]);
    expect(withEmptyToken.calls).toEqual([]);
    expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
  });

  it.each([['invite'], ['signup'], ['email']])(
    'refuses a link of the type %s whatever next it names, and verifies and claims nothing',
    async (type) => {
      const { args, calls, verifyArguments } = requestWith({
        link: { tokenHash: 'hash-1', type, next: 'contestant/help' }
      });

      const redirected = await redirectOf(args);

      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
      expect(calls).toEqual([]);
      expect(verifyArguments).toEqual([]);
      expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
    }
  );

  it.each([['sms'], ['phone_change'], ['unknown']])(
    'refuses a link of the type %s, which the account-access function does not mail, and verifies and claims nothing',
    async (type) => {
      const { args, calls, verifyArguments } = requestWith({ link: { tokenHash: 'hash-1', type } });

      const redirected = await redirectOf(args);

      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
      expect(calls).toEqual([]);
      expect(verifyArguments).toEqual([]);
      expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
    }
  );

  it('logs a refresh that returns an error and still lands the user', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { args, calls } = requestWith({
      link: { tokenHash: 'hash-1', type: 'magiclink' },
      claim: { claimed: [editorGrant], skipped: [], passwordSet: true },
      refreshError: { message: 'refresh token revoked' }
    });

    expect((await redirectOf(args)).location).toBe(APP_ROOT);
    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'refreshSession']);
    expect(String(error.mock.calls[0][0])).toContain('refresh token revoked');
  });

  describe('a link that confirms a new address', () => {
    it('claims and lands a verified link that answers a session on the app root, without asking for the held session', async () => {
      const { args, calls, verifyArguments } = requestWith({ link: { tokenHash: 'hash-1', type: 'email_change' } });

      const redirected = await redirectOf(args);

      expect(verifyArguments).toEqual([{ token_hash: 'hash-1', type: 'email_change' }]);
      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(APP_ROOT);
      expect(calls).toEqual(['verifyOtp', 'claimInvitations']);
    });

    it('takes a verification that answers no session for a failure: nothing is claimed, and a browser with no session meets the auth error', async () => {
      const { args, calls } = requestWith({
        link: { tokenHash: 'hash-1', type: 'email_change' },
        verifySession: null
      });

      expect((await redirectOf(args)).location).toBe(LOGIN_WITH_AUTH_ERROR);
      expect(calls).toEqual(['verifyOtp', 'safeGetSession']);
      expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
    });

    it('sends a browser that holds a session back to the app root when the address was taken, and claims nothing', async () => {
      const { args, calls } = requestWith({
        link: { tokenHash: 'hash-1', type: 'email_change' },
        verifyError: ADDRESS_TAKEN,
        heldSession: SESSION
      });

      expect((await redirectOf(args)).location).toBe(APP_ROOT);
      expect(calls).toEqual(['verifyOtp', 'safeGetSession']);
      expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
    });

    it('tells a browser with no session that the address is now another account’s when the address was taken', async () => {
      const { args } = requestWith({ link: { tokenHash: 'hash-1', type: 'email_change' }, verifyError: ADDRESS_TAKEN });

      expect((await redirectOf(args)).location).toBe(LOGIN_WITH_EMAIL_TAKEN);
    });

    it.each([
      ['an expired or replaced link', LINK_EXPIRED],
      ['a gateway error', { message: 'Bad gateway', status: 502, code: undefined }],
      ['an unreachable auth service', { message: 'fetch failed', status: 0, code: undefined }]
    ])('gives a browser with no session the auth error for %s', async (_kind, verifyError) => {
      const { args } = requestWith({ link: { tokenHash: 'hash-1', type: 'email_change' }, verifyError });

      expect((await redirectOf(args)).location).toBe(LOGIN_WITH_AUTH_ERROR);
    });

    it('takes a session that cannot be read for none, logs no detail of it and still ends on the login page', async () => {
      const { args, locals } = requestWith({
        link: { tokenHash: 'hash-1', type: 'email_change' },
        verifyError: ADDRESS_TAKEN
      });
      const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
      (locals as { safeGetSession: () => Promise<unknown> }).safeGetSession = async () => {
        throw new Error(`the auth service is unreachable for ${ADDRESS}`);
      };

      expect((await redirectOf(args)).location).toBe(LOGIN_WITH_EMAIL_TAKEN);
      expect(error).toHaveBeenCalledTimes(1);
      expect(String(error.mock.calls[0][0])).not.toContain(ADDRESS);
    });

    it('puts nothing of the failure or the token into the landing', async () => {
      const { args } = requestWith({
        link: { tokenHash: 'hash-1', type: 'email_change' },
        verifyError: { ...ADDRESS_TAKEN, message: `duplicate key value for ${ADDRESS}` }
      });

      const redirected = await redirectOf(args);

      expect(redirected.location).not.toContain(ADDRESS);
      expect(redirected.location).not.toContain('hash-1');
      expect(redirected.location).not.toContain('duplicate');
    });
  });
  describe('the marker of a browser that has confirmed an address', () => {
    it('is written with its attributes after a verified magiclink or email_change link, and for no other link', async () => {
      vi.spyOn(log, 'error').mockImplementation(() => undefined);
      const cases: Array<[string, Parameters<typeof requestWith>[0]]> = [
        ['a verified magiclink', { link: { tokenHash: 'hash-1', type: 'magiclink' } }],
        ['a verified email_change', { link: { tokenHash: 'hash-1', type: 'email_change' } }],
        ['a verified recovery', { link: { tokenHash: 'hash-1', type: 'recovery' } }],
        ['a magiclink that fails', { link: { tokenHash: 'hash-1', type: 'magiclink' }, verifyError: LINK_EXPIRED }],
        [
          'an email_change that fails',
          { link: { tokenHash: 'hash-1', type: 'email_change' }, verifyError: ADDRESS_TAKEN }
        ],
        [
          'an email_change that answers no session',
          { link: { tokenHash: 'hash-1', type: 'email_change' }, verifySession: null }
        ],
        ['a link with no token', { link: { type: 'magiclink' } }],
        ['a link with no type', { link: { tokenHash: 'hash-1' } }],
        ['a link of the type invite', { link: { tokenHash: 'hash-1', type: 'invite' } }],
        ['a link of the type signup', { link: { tokenHash: 'hash-1', type: 'signup' } }],
        ['a link of the type email', { link: { tokenHash: 'hash-1', type: 'email' } }]
      ];

      const written: Record<string, Array<CookieWrite>> = {};
      for (const [label, options] of cases) {
        const { args, cookieWrites } = requestWith(options);
        await redirectOf(args);
        written[label] = cookieWrites;
      }

      const marker = { name: COOKIE.registered, value: expect.any(String), options: REGISTERED_ATTRIBUTES };
      expect(written).toEqual({
        'a verified magiclink': [marker],
        'a verified email_change': [marker],
        'a verified recovery': [],
        'a magiclink that fails': [],
        'an email_change that fails': [],
        'an email_change that answers no session': [],
        'a link with no token': [],
        'a link with no type': [],
        'a link of the type invite': [],
        'a link of the type signup': [],
        'a link of the type email': []
      });
    });

    it('names no account and holds nothing of the link', async () => {
      const { args, cookieWrites } = requestWith({
        link: { tokenHash: 'hash-1', type: 'magiclink', next: 'contestant/help' }
      });

      await redirectOf(args);

      expect(cookieWrites).toHaveLength(1);
      const [{ value }] = cookieWrites;
      expect(value).not.toBe('');
      for (const part of [ADDRESS, 'hash-1', 'access-1', 'contestant/help', 'magiclink'])
        expect(value).not.toContain(part);
    });
  });

  describe('the logout count', () => {
    it('is withdrawn once, with the given cookies, request and address, when the verification answers a session, before the claim', async () => {
      const { args, calls, cookies, request, url } = requestWith({
        link: { tokenHash: 'hash-1', type: 'magiclink' },
        claim: { claimed: [editorGrant], skipped: [], passwordSet: true }
      });
      withdrawLogoutCount.mockImplementation(() => {
        calls.push('withdrawLogoutCount');
      });

      await redirectOf(args);

      expect(withdrawLogoutCount).toHaveBeenCalledTimes(1);
      const [event] = withdrawLogoutCount.mock.calls[0];
      expect(Object.keys(event).sort()).toEqual(['cookies', 'request', 'url']);
      expect(event.cookies).toBe(cookies);
      expect(event.request).toBe(request);
      expect(event.url).toBe(url);
      expect(calls).toEqual(['verifyOtp', 'withdrawLogoutCount', 'claimInvitations', 'refreshSession']);
    });

    it.each([
      ['a magiclink', 'magiclink'],
      ['a recovery link', 'recovery'],
      ['an email_change link', 'email_change']
    ])('is not withdrawn when the verification of %s answers an error', async (_kind, type) => {
      const { args } = requestWith({ link: { tokenHash: 'hash-1', type }, verifyError: LINK_EXPIRED });

      await redirectOf(args);

      expect(withdrawLogoutCount).not.toHaveBeenCalled();
    });

    it('is not withdrawn when an email_change link answers no session', async () => {
      const { args } = requestWith({ link: { tokenHash: 'hash-1', type: 'email_change' }, verifySession: null });

      await redirectOf(args);

      expect(withdrawLogoutCount).not.toHaveBeenCalled();
    });
  });
});
