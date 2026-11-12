/**
 * The server load of the password-reset page, driven directly with a fake request context.
 *
 * No server is stood up: the only surface the load touches is `locals`. The fake event's `url` and `route` record every read, so a load that looked at the address it was asked for would be seen to.
 *
 * What this file holds:
 *
 * 1. **Without a session** — a 303 redirect to the login route in the request's locale, with no parameter.
 * 2. **With a session** — the address of the verified user under one key, and nothing else: no part of the session.
 * 3. **The address is not read** — whatever the search parameters say, a link's `type` and a `code` among them, the answer is the same and no part of the URL was looked at.
 */

import { describe, expect, it, vi } from 'vitest';
import { buildRoute } from '$lib/routes';
import { load } from './+page.server';

/** A made-up address of the signed-in user. */
const ADDRESS = 'person@example.test';

/** A session as the auth service issues one, with the members that must never reach a page. */
const SESSION = {
  access_token: 'an-access-token',
  refresh_token: 'a-refresh-token',
  expires_at: 1893456000,
  user: { id: 'user-1', email: 'unverified@example.test' }
};

/** The user the server verified, which is the one the load may read. */
const VERIFIED_USER = { id: 'user-1', email: ADDRESS };

type SessionAnswer = { session: unknown; user: unknown };

/**
 * A request as the load sees it.
 * @param answer - What the verified-session read answers.
 * @param options.locale - The request's locale.
 * @param options.search - The search part of the address that was asked for.
 * @returns The event, the session read's mock, and the names of the address members the load read.
 */
function makeEvent(answer: SessionAnswer, { locale = 'en', search = '' }: { locale?: string; search?: string } = {}) {
  const addressReads: Array<string> = [];
  const safeGetSession = vi.fn(async () => answer);
  const url = new URL(`http://localhost/${locale}/contestant/password-reset${search}`);
  const event = {
    fetch: vi.fn(),
    params: {},
    locals: { currentLocale: locale, safeGetSession },
    get url() {
      addressReads.push('url');
      return url;
    },
    get route() {
      addressReads.push('route');
      return { id: '/[[lang=locale]]/contestant/password-reset' };
    },
    get request() {
      addressReads.push('request');
      return new Request(url);
    }
  };
  return { event, safeGetSession, addressReads };
}

/** The redirect the load throws, or `undefined` when it returns. */
async function redirectOf(event: unknown): Promise<{ status: number; location: string } | undefined> {
  try {
    await load(event as never);
    return undefined;
  } catch (e) {
    return e as { status: number; location: string };
  }
}

describe('without a session', () => {
  it.each([
    ['no session and no user', { session: null, user: null }],
    ['a session the server could not verify a user for', { session: SESSION, user: null }]
  ])('redirects with 303 to the login route for %s', async (_name, answer) => {
    const { event, safeGetSession } = makeEvent(answer);
    expect(await redirectOf(event)).toMatchObject({
      status: 303,
      location: buildRoute({ route: 'ContestantAppLogin', locale: 'en' })
    });
    expect(safeGetSession).toHaveBeenCalledTimes(1);
  });

  it.each(['en', 'fi', 'sv'])('names the login route in the locale %s of the request', async (locale) => {
    const { event } = makeEvent({ session: null, user: null }, { locale });
    const redirected = await redirectOf(event);
    expect(redirected?.status).toBe(303);
    expect(redirected?.location).toBe(buildRoute({ route: 'ContestantAppLogin', locale }));
  });

  it('carries no parameter, whatever the address asked for held', async () => {
    const { event, addressReads } = makeEvent(
      { session: null, user: null },
      { search: '?type=recovery&code=abc&next=%2Fadmin&redirectTo=https%3A%2F%2Fevil.example' }
    );
    const redirected = await redirectOf(event);
    expect(redirected?.location).toBe(buildRoute({ route: 'ContestantAppLogin', locale: 'en' }));
    expect(redirected?.location).not.toContain('?');
    expect(addressReads).toEqual([]);
  });
});

describe('with a session', () => {
  it("returns the verified user's address under one key, and nothing else", async () => {
    const { event, safeGetSession } = makeEvent({ session: SESSION, user: VERIFIED_USER });
    const data = await load(event as never);
    expect(data).toEqual({ email: ADDRESS });
    expect(Object.keys(data as object)).toEqual(['email']);
    expect(safeGetSession).toHaveBeenCalledTimes(1);
  });

  it('returns no part of the session', async () => {
    const { event } = makeEvent({ session: SESSION, user: VERIFIED_USER });
    const serialised = JSON.stringify(await load(event as never));
    for (const secret of [SESSION.access_token, SESSION.refresh_token, String(SESSION.expires_at), 'user-1']) {
      expect(serialised).not.toContain(secret);
    }
    expect(serialised, "the address is the verified user's, not the one inside the session").not.toContain(
      SESSION.user.email
    );
  });

  it('serves a user whose account has no address, with no address', async () => {
    const { event } = makeEvent({ session: SESSION, user: { id: 'user-1' } });
    expect(await load(event as never)).toEqual({ email: undefined });
  });
});

describe('the address is not read', () => {
  it.each([
    ['none', ''],
    ['the type of a recovery link', '?type=recovery'],
    ['the type of a sign-in link', '?type=magiclink'],
    ['a code', '?code=abc'],
    ['a token', '?token_hash=abc&type=recovery']
  ])('answers the same with %s among the search parameters, and reads no part of the URL', async (_name, search) => {
    const { event, addressReads } = makeEvent({ session: SESSION, user: VERIFIED_USER }, { search });
    expect(await load(event as never)).toEqual({ email: ADDRESS });
    expect(addressReads).toEqual([]);
  });
});
