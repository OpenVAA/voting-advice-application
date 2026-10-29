/**
 * The auth callback, driven with fake request locals.
 *
 * The callback hands a mailed link to the confirm page and spends nothing: every auth call and the data writer record themselves, so a test reads off one list that none of them was made. The handler always ends in a redirect, which is what it throws.
 *
 * What happens after Continue is pressed on the confirm page, the verification and every landing, is tested in `$lib/server/auth/mailedLink.test.ts` and in the page's own tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import { GET } from './+server';

const writerMocks = vi.hoisted(() => ({ createDataWriter: vi.fn() }));
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter: writerMocks.createDataWriter }));

// The shared runtime stub returns every path unlocalized. Here the locale is made visible as a prefix, so a redirect that dropped the request's locale is seen.
vi.mock('$lib/paraglide/runtime', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  localizeHref: (href: string, options?: { locale?: string }) => (options?.locale ? `/${options.locale}${href}` : href)
}));

const LOCALE = 'fi';

/**
 * Build the event the handler receives, with every auth call recording itself in `calls`.
 * @param search - The query string of the request.
 * @returns The event and the ordered names of the auth calls made.
 */
function eventWith(search: string) {
  const calls = new Array<string>();
  function record(name: string) {
    return async () => {
      calls.push(name);
      return { data: { user: null, session: null }, error: null };
    };
  }
  const auth = {
    verifyOtp: record('verifyOtp'),
    refreshSession: record('refreshSession'),
    getUser: record('getUser'),
    getSession: record('getSession'),
    signOut: record('signOut')
  };
  async function safeGetSession() {
    calls.push('safeGetSession');
    return { session: null, user: null };
  }
  const locals = { supabase: { auth }, safeGetSession, currentLocale: LOCALE };
  return {
    calls,
    event: {
      url: new URL(`http://localhost/${LOCALE}/api/auth/callback${search}`),
      locals,
      fetch: vi.fn()
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

/** The query of a redirect's target, as ordered name and value pairs. */
function queryOf(location: string): Array<[string, string]> {
  return [...new URL(location, 'http://localhost').searchParams.entries()];
}

/** The login page carrying the auth error, in the request's locale. */
const LOGIN_WITH_AUTH_ERROR = buildRoute({ route: 'ContestantAppLogin', locale: LOCALE, errorMessage: 'authError' });

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    writerMocks.createDataWriter.mockImplementation(() => {
      throw new Error('the callback made a data writer');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    writerMocks.createDataWriter.mockReset();
  });

  it.each([['magiclink'], ['recovery'], ['email_change']])(
    'hands a %s link to the confirm page in the request locale, with its token and type, and spends nothing',
    async (type) => {
      const { event, calls } = eventWith(`?token_hash=hash-1&type=${type}`);

      const redirected = await redirectOf(event);

      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(`/${LOCALE}/auth/confirm?token_hash=hash-1&type=${type}`);
      expect(redirected.location).toBe(
        buildRoute({ route: 'AuthConfirm', locale: LOCALE, token_hash: 'hash-1', type })
      );
      expect(calls).toEqual([]);
      expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
    }
  );

  it('hands the link’s next over too, unvalidated, for the confirm page’s verification to validate', async () => {
    const valid = eventWith('?token_hash=hash-1&type=magiclink&next=contestant%2Fhelp');
    const foreign = eventWith(`?token_hash=hash-1&type=magiclink&next=${encodeURIComponent('//evil.example/x')}`);

    const validRedirect = await redirectOf(valid.event);
    const foreignRedirect = await redirectOf(foreign.event);

    expect(new URL(validRedirect.location, 'http://localhost').pathname).toBe(`/${LOCALE}/auth/confirm`);
    expect(queryOf(validRedirect.location)).toEqual([
      ['token_hash', 'hash-1'],
      ['type', 'magiclink'],
      ['next', 'contestant/help']
    ]);
    expect(queryOf(foreignRedirect.location)).toEqual([
      ['token_hash', 'hash-1'],
      ['type', 'magiclink'],
      ['next', '//evil.example/x']
    ]);
    expect(valid.calls).toEqual([]);
    expect(foreign.calls).toEqual([]);
  });

  it('names no next on the confirm page when the link names none, or an empty one', async () => {
    const without = eventWith('?token_hash=hash-1&type=magiclink');
    const empty = eventWith('?token_hash=hash-1&type=magiclink&next=');

    expect(queryOf((await redirectOf(without.event)).location).map(([name]) => name)).toEqual(['token_hash', 'type']);
    expect(queryOf((await redirectOf(empty.event)).location).map(([name]) => name)).toEqual(['token_hash', 'type']);
  });

  it('hands the token over as the link holds it, decoded once and encoded once', async () => {
    const { event } = eventWith('?token_hash=ab%2Bcd%2Fef%25gh&type=magiclink');

    const redirected = await redirectOf(event);

    expect(new URL(redirected.location, 'http://localhost').searchParams.get('token_hash')).toBe('ab+cd/ef%gh');
  });

  it('sends a link with no token, an empty token or no type to the login page with the auth error, and spends nothing', async () => {
    for (const search of ['?type=magiclink', '?token_hash=&type=magiclink', '?token_hash=hash-1', '']) {
      const { event, calls } = eventWith(search);

      const redirected = await redirectOf(event);

      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
      expect(calls).toEqual([]);
    }
    expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
  });

  it.each([['invite'], ['signup'], ['email']])(
    'refuses a link of the type %s whatever next it names: the login page with the auth error, and nothing spent',
    async (type) => {
      const { event, calls } = eventWith(`?token_hash=hash-1&type=${type}&next=contestant%2Fhelp`);

      const redirected = await redirectOf(event);

      expect(redirected.status).toBe(303);
      expect(redirected.location).toBe(LOGIN_WITH_AUTH_ERROR);
      expect(calls).toEqual([]);
      expect(writerMocks.createDataWriter).not.toHaveBeenCalled();
    }
  );

  it('puts nothing of the token into the landing of a refused link', async () => {
    const { event } = eventWith('?token_hash=hash-secret&type=invite');

    expect((await redirectOf(event)).location).not.toContain('hash-secret');
  });
});
