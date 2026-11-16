/**
 * The auth callback, driven with fake request locals and a mocked data writer.
 *
 * Every auth call and the claim record themselves in one list, so the order verify, claim, refresh is read off it. The handler always ends in a redirect, which is what it throws.
 */

import { configureLogger, log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import { GET } from './+server';
import type { InvitationClaimResult } from '$lib/api/base/dataWriter.type';

const writerMocks = vi.hoisted(() => ({ createDataWriter: vi.fn() }));
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter: writerMocks.createDataWriter }));

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

/** The claim of each event built in a test, keyed by that event's locals, so a writer made for one request claims for that request alone. */
const claimsByLocals = new WeakMap<object, () => Promise<InvitationClaimResult>>();

/**
 * Build the event the handler receives, with every auth call and the claim recording itself in `calls`.
 * @param options.search - The query string of the request.
 * @param options.verifyError - What the verification returns as its error; `null` for a token that verifies.
 * @param options.claim - What the claim resolves to, or the error it rejects with.
 * @param options.refreshError - What the refresh returns as its error.
 * @returns The event, the ordered call names, and the recorded arguments.
 */
function eventWith({
  search,
  verifyError = null,
  claim = NOTHING_CLAIMED,
  refreshError = null
}: {
  search: string;
  verifyError?: { message: string } | null;
  claim?: InvitationClaimResult | Error;
  refreshError?: { message: string } | null;
}) {
  const calls = new Array<string>();
  const verifyArguments = new Array<unknown>();
  const signOutArguments = new Array<unknown>();
  const auth = {
    verifyOtp: async (credentials: unknown) => {
      calls.push('verifyOtp');
      verifyArguments.push(credentials);
      return { error: verifyError };
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
  const locals = { supabase: { auth }, currentLocale: LOCALE };
  const fetch = vi.fn();
  claimsByLocals.set(locals, async () => {
    calls.push('claimInvitations');
    if (claim instanceof Error) throw claim;
    return claim;
  });
  return {
    calls,
    verifyArguments,
    signOutArguments,
    locals,
    fetch,
    event: {
      url: new URL(`http://localhost/${LOCALE}/api/auth/callback${search}`),
      locals,
      fetch
    } as unknown as Parameters<typeof GET>[0]
  };
}

/** What the handler throws. */
async function redirectOf(event: Parameters<typeof GET>[0]): Promise<{ status: number; location: string }> {
  try {
    await GET(event);
  } catch (e) {
    return e as { status: number; location: string };
  }
  throw new Error('the callback resolved, and it must always redirect');
}

/** The login page carrying the auth error, in the request's locale. */
const LOGIN_WITH_AUTH_ERROR = buildRoute({ route: 'ContestantAppLogin', locale: LOCALE, errorMessage: 'authError' });
/** The Contestant App's root, in the request's locale. */
const APP_ROOT = buildRoute({ route: 'ContestantAppHome', locale: LOCALE });

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
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

  it('sends a verified magiclink of a user without a password to the app root, in the request locale, with nothing in its query', async () => {
    const { event, calls, verifyArguments } = eventWith({
      search: '?token_hash=hash-1&type=magiclink',
      claim: { claimed: [editorGrant], skipped: [], passwordSet: false }
    });

    const redirected = await redirectOf(event);

    expect(verifyArguments).toEqual([{ token_hash: 'hash-1', type: 'magiclink' }]);
    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(APP_ROOT);
    const target = new URL(redirected.location, 'http://localhost');
    expect(target.pathname).toBe(`/${LOCALE}/contestant`);
    expect([...target.searchParams.keys()]).toEqual([]);
    expect(redirected.location).not.toContain(ADDRESS);
    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'refreshSession']);
    expect(calls).not.toContain('getUser');
  });

  it('sends that user to a valid relative next path when one is given, and to the app root for one that is not', async () => {
    const claim: InvitationClaimResult = { claimed: [], skipped: [], passwordSet: false };
    const valid = eventWith({ search: '?token_hash=hash-1&type=magiclink&next=contestant%2Fhelp', claim });
    const refused = eventWith({
      search: `?token_hash=hash-1&type=magiclink&next=${encodeURIComponent('//evil.example/contestant')}`,
      claim
    });

    expect((await redirectOf(valid.event)).location).toBe(`/${LOCALE}/contestant/help`);
    expect((await redirectOf(refused.event)).location).toBe(APP_ROOT);
  });

  it('sends a verified magiclink of a user with a password to the app root', async () => {
    const { event, calls } = eventWith({ search: '?token_hash=hash-1&type=magiclink' });

    const redirected = await redirectOf(event);

    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(APP_ROOT);
    expect(redirected.location).toBe(`/${LOCALE}/contestant`);
    expect(calls).not.toContain('getUser');
  });

  it('sends a user with a password to a valid relative next path when one is given', async () => {
    const withSeparator = eventWith({ search: '?token_hash=hash-1&type=magiclink&next=%2Fcontestant%2Fhelp' });
    const withoutSeparator = eventWith({ search: '?token_hash=hash-1&type=magiclink&next=contestant%2Fhelp' });

    expect((await redirectOf(withSeparator.event)).location).toBe(`/${LOCALE}/contestant/help`);
    expect((await redirectOf(withoutSeparator.event)).location).toBe(`/${LOCALE}/contestant/help`);
  });

  it.each([
    ['an absolute', 'https://evil.example/contestant'],
    ['a protocol-relative', '//evil.example/contestant'],
    ['a backslash-led', '\\\\evil.example\\contestant'],
    ['a parent-relative', '../admin']
  ])('ignores %s next and sends that user to the app root', async (_kind, next) => {
    const { event } = eventWith({ search: `?token_hash=hash-1&type=magiclink&next=${encodeURIComponent(next)}` });

    expect((await redirectOf(event)).location).toBe(APP_ROOT);
  });

  it('verifies, claims on the request client, refreshes and only then redirects when a grant was claimed', async () => {
    const { event, calls, locals, fetch } = eventWith({
      search: '?token_hash=hash-1&type=magiclink',
      claim: { claimed: [editorGrant], skipped: [], passwordSet: true }
    });

    const redirected = await redirectOf(event);

    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'refreshSession']);
    expect(redirected.location).toBe(APP_ROOT);
    expect(writerMocks.createDataWriter).toHaveBeenCalledTimes(1);
    const [source] = writerMocks.createDataWriter.mock.calls[0] as [{ fetch: unknown; locals: unknown }];
    expect(Object.keys(source).sort()).toEqual(['fetch', 'locals']);
    expect(source.locals).toBe(locals);
    expect(source.fetch).toBe(fetch);
  });

  it('does not refresh when nothing was claimed', async () => {
    const skippedOnly = eventWith({
      search: '?token_hash=hash-1&type=magiclink',
      claim: { claimed: [], skipped: [{ ...editorGrant, reason: 'candidate_has_editor' }], passwordSet: true }
    });
    const nothing = eventWith({ search: '?token_hash=hash-1&type=magiclink' });

    await redirectOf(skippedOnly.event);
    await redirectOf(nothing.event);

    expect(skippedOnly.calls).toEqual(['verifyOtp', 'claimInvitations']);
    expect(nothing.calls).toEqual(['verifyOtp', 'claimInvitations']);
  });

  it('signs out locally and sends a magiclink to the login page with the auth error when the claim throws', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { event, calls, signOutArguments } = eventWith({
      search: '?token_hash=hash-1&type=magiclink&next=contestant%2Fhelp',
      claim: new Error('claimInvitations: the database is unreachable')
    });

    const redirected = await redirectOf(event);

    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'signOut']);
    expect(signOutArguments).toEqual([{ scope: 'local' }]);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('the database is unreachable');
    expect(String(error.mock.calls[0][0])).not.toContain('hash-1');
  });

  it('still lands a recovery link on the reset-password page when the claim throws, and keeps the session', async () => {
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { event, calls } = eventWith({
      search: '?token_hash=hash-1&type=recovery',
      claim: new Error('claimInvitations: the database is unreachable')
    });

    const redirected = await redirectOf(event);

    expect(redirected.status).toBe(303);
    expect(redirected.location).toBe(buildRoute({ route: 'ContestantAppResetPassword', locale: LOCALE }));
    expect(calls).toEqual(['verifyOtp', 'claimInvitations']);
  });

  it('sends a failed verification and missing parameters to the login page with the auth error, and claims nothing', async () => {
    const failed = eventWith({
      search: '?token_hash=hash-1&type=magiclink',
      verifyError: { message: 'Email link is invalid or has expired' }
    });
    const withoutType = eventWith({ search: '?token_hash=hash-1' });
    const withoutToken = eventWith({ search: '?type=magiclink' });

    for (const { event } of [failed, withoutType, withoutToken]) {
      const redirected = await redirectOf(event);
      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
    }
    expect(failed.calls).toEqual(['verifyOtp']);
    expect(withoutType.calls).toEqual([]);
    expect(withoutToken.calls).toEqual([]);
    expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
  });

  it.each([['invite'], ['signup'], ['email']])(
    'refuses a link of the type %s whatever next it names, and verifies and claims nothing',
    async (type) => {
      const { event, calls, verifyArguments } = eventWith({
        search: `?token_hash=hash-1&type=${type}&next=contestant%2Fhelp`
      });

      const redirected = await redirectOf(event);

      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
      expect(calls).toEqual([]);
      expect(verifyArguments).toEqual([]);
      expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
    }
  );

  it('logs a refresh that returns an error and still lands the user', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { event, calls } = eventWith({
      search: '?token_hash=hash-1&type=magiclink',
      claim: { claimed: [editorGrant], skipped: [], passwordSet: true },
      refreshError: { message: 'refresh token revoked' }
    });

    expect((await redirectOf(event)).location).toBe(APP_ROOT);
    expect(calls).toEqual(['verifyOtp', 'claimInvitations', 'refreshSession']);
    expect(String(error.mock.calls[0][0])).toContain('refresh token revoked');
  });
});
