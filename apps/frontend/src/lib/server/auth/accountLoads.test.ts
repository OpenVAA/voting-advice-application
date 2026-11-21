/**
 * The server loads the Admin App and the Contestant App share, each driven directly with a fake request context.
 *
 * No server is stood up. Each load touches one surface of the request — `locals` or `cookies` — and the fakes record every other read where a load must not look.
 *
 * What this file holds:
 *
 * 1. **`passwordResetLoad`**, for each app's login route — without a session, a 303 redirect to that login route in the request's locale, with no parameter; with one, the address of the verified user under one key and nothing else; and no part of the URL read.
 * 2. **`signedOutReasonLoad`** — the automatic logout when the request carries the settled logout value, nothing otherwise, and no session read.
 * 3. **`sessionProjectionLoad`** — exactly the `{ userId, expiresAt }` projection, never a credential, with the identifier from the verified user; and, at compile time, a payload `getUserData`'s ancestor-data type accepts.
 */

import { describe, expect, it, vi } from 'vitest';
import { LOGOUT_DEADLINE_SETTLED } from '$lib/auth/logoutDeadline';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import { passwordResetLoad, sessionProjectionLoad, signedOutReasonLoad } from './accountLoads';
import type { getUserData } from '$lib/auth/getUserData';

type SessionAnswer = { session: unknown; user: unknown };

/** A session as the auth service issues one, with the members that must never reach a page. */
function fakeSession({
  expiresAt,
  nestedUserId = 'nested-user-id'
}: { expiresAt?: number; nestedUserId?: string } = {}) {
  return {
    access_token: 'fake-access-token-value',
    refresh_token: 'fake-refresh-token-value',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    // The session's OWN nested user. `@supabase/ssr` wraps this in an insecure-use proxy because it is unverified; no load may read it.
    user: { id: nestedUserId, email: 'unverified@example.test' }
  };
}

describe.each(['AdminAppLogin', 'ContestantAppLogin'] as const)('passwordResetLoad(%s)', (loginRoute) => {
  const load = passwordResetLoad(loginRoute);

  /** A made-up address of the signed-in user. */
  const ADDRESS = 'person@example.test';
  const SESSION = fakeSession({ expiresAt: 1893456000, nestedUserId: 'user-1' });
  /** The user the server verified, which is the one the load may read. */
  const VERIFIED_USER = { id: 'user-1', email: ADDRESS };

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
    const url = new URL(`http://localhost/${locale}/password-reset${search}`);
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
        return { id: '/password-reset' };
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
        location: buildRoute({ route: loginRoute, locale: 'en' })
      });
      expect(safeGetSession).toHaveBeenCalledTimes(1);
    });

    it.each(['en', 'fi', 'sv'])('names the login route in the locale %s of the request', async (locale) => {
      const { event } = makeEvent({ session: null, user: null }, { locale });
      const redirected = await redirectOf(event);
      expect(redirected?.status).toBe(303);
      expect(redirected?.location).toBe(buildRoute({ route: loginRoute, locale }));
    });

    it('carries no parameter, whatever the address asked for held', async () => {
      const { event, addressReads } = makeEvent(
        { session: null, user: null },
        { search: '?type=recovery&code=abc&next=%2Fadmin&redirectTo=https%3A%2F%2Fevil.example' }
      );
      const redirected = await redirectOf(event);
      expect(redirected?.location).toBe(buildRoute({ route: loginRoute, locale: 'en' }));
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

    it.each([
      ['nothing pending', {}],
      ['an address pending', { new_email: ADDRESS }]
    ])(
      'serves an account an identity provider made, still on its placeholder with %s, with no address',
      async (_name, pending) => {
        const user = {
          id: 'user-1',
          email: 'a-subject@bank-auth.placeholder',
          app_metadata: { identity_provider: 'idura-ftn' },
          ...pending
        };
        const { event } = makeEvent({ session: SESSION, user });
        const data = await load(event as never);
        expect(data).toEqual({ email: undefined });
        expect(JSON.stringify(data)).not.toContain('bank-auth.placeholder');
      }
    );

    it('serves an account an identity provider made, on a proved address, with that address', async () => {
      const user = { id: 'user-1', email: ADDRESS, app_metadata: { identity_provider: 'idura-ftn' } };
      const { event } = makeEvent({ session: SESSION, user });
      expect(await load(event as never)).toEqual({ email: ADDRESS });
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
});

describe('signedOutReasonLoad', () => {
  /** What the load may touch of the request. */
  type FakeEvent = {
    cookies: { get: (name: string) => string | undefined };
    locals: { safeGetSession: () => Promise<unknown> };
  };
  const runLoad = signedOutReasonLoad as unknown as (event: FakeEvent) => unknown;

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

  it('answers the automatic logout when the request carries the value the server writes once it has signed out at a count’s end', async () => {
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
  ])('answers no reason for %s', async (_, cookies: Record<string, string>) => {
    expect(await runLoad(requestWith(cookies))).toEqual({});
  });

  it('reads no session', async () => {
    const event = requestWith({ [COOKIE.logoutPending]: LOGOUT_DEADLINE_SETTLED });
    await runLoad(event);
    expect(event.locals.safeGetSession).not.toHaveBeenCalled();
  });
});

describe('sessionProjectionLoad', () => {
  /** The exact member list the projection is allowed to carry. An adjacent extra member fails by name against this array. */
  const PROJECTION_MEMBERS = ['expiresAt', 'userId'];

  /** Members a reintroduction would most plausibly add back. Each is asserted absent BY NAME rather than by a single spot-check. */
  const FORBIDDEN_MEMBERS = ['access_token', 'refresh_token', 'user', 'provider_token', 'token_type'];

  type Projection = { session: { userId: string; expiresAt: number | null } | null };
  const load = sessionProjectionLoad as unknown as (event: {
    locals: { safeGetSession: () => Promise<SessionAnswer> };
  }) => Promise<Projection>;

  /**
   * The minimum request context the load touches. Every call builds its own object, so nothing is shared between invocations — which is what the concurrency case below leans on.
   */
  function makeEvent(result: SessionAnswer) {
    return { locals: { safeGetSession: async () => result } };
  }

  function authenticatedEvent({
    verifiedUserId,
    nestedUserId,
    expiresAt
  }: {
    verifiedUserId: string;
    nestedUserId?: string;
    expiresAt?: number;
  }) {
    return makeEvent({
      session: fakeSession({ expiresAt, nestedUserId }),
      user: { id: verifiedUserId, email: 'verified@example.test' }
    });
  }

  it('returns exactly one member, `session`, and that member carries exactly the declared projection members', async () => {
    const data = await load(authenticatedEvent({ verifiedUserId: 'verified-user-id', expiresAt: 1893456000 }));
    expect(Object.keys(data)).toEqual(['session']);
    // The key SET is enumerated and compared, so an adjacent extra member fails by name rather than being missed by a spot-check.
    expect(Object.keys(data.session ?? {}).sort()).toEqual(PROJECTION_MEMBERS);
  });

  it.each(FORBIDDEN_MEMBERS)('does not carry `%s` into the payload', async (member) => {
    const data = await load(authenticatedEvent({ verifiedUserId: 'verified-user-id', expiresAt: 1893456000 }));
    expect(member in (data.session ?? {})).toBe(false);
    // The whole serialised payload must not contain the fake credential values either, which catches a member nested one level down.
    expect(JSON.stringify(data)).not.toContain('fake-access-token-value');
    expect(JSON.stringify(data)).not.toContain('fake-refresh-token-value');
  });

  it('takes the identifier from the separately VERIFIED user, not from the session’s nested user', async () => {
    const data = await load(
      authenticatedEvent({
        verifiedUserId: 'id-from-the-verified-user',
        nestedUserId: 'id-from-the-sessions-nested-user',
        expiresAt: 1893456000
      })
    );
    expect(data.session?.userId).toBe('id-from-the-verified-user');
  });

  it('passes the expiry through by identity — not re-derived from a clock, not rounded, not converted', async () => {
    const knownExpiry = 1893456000;
    const data = await load(authenticatedEvent({ verifiedUserId: 'u', expiresAt: knownExpiry }));
    expect(data.session?.expiresAt).toBe(knownExpiry);
  });

  it('carries the null form when the session reports no expiry', async () => {
    const data = await load(authenticatedEvent({ verifiedUserId: 'u', expiresAt: undefined }));
    expect(data.session?.expiresAt).toBeNull();
  });

  it('returns the null form for `session` when there is no session at all', async () => {
    const data = await load(makeEvent({ session: null, user: null }));
    expect(Object.keys(data)).toEqual(['session']);
    // The consumers read truthiness, so the null form is what makes both of them treat this as unauthenticated.
    expect(data.session).toBeNull();
  });

  it('returns the null form when a session exists but the verifying user call did not return a user', async () => {
    const data = await load(makeEvent({ session: fakeSession({ expiresAt: 1 }), user: null }));
    expect(data.session).toBeNull();
  });

  it('resolves its session from its own request on every call — one request’s identifier never appears in another’s payload', async () => {
    const [first, second] = await Promise.all([
      load(authenticatedEvent({ verifiedUserId: 'request-one-user', expiresAt: 111 })),
      load(authenticatedEvent({ verifiedUserId: 'request-two-user', expiresAt: 222 }))
    ]);
    expect(first.session).toEqual({ userId: 'request-one-user', expiresAt: 111 });
    expect(second.session).toEqual({ userId: 'request-two-user', expiresAt: 222 });
    // Two independent objects, not one shared module-level cell handed out twice.
    expect(first.session).not.toBe(second.session);
  });
});

/**
 * The identity helper's structural ancestor-data type, read off the SHIPPED signature rather than re-declared here, so the copy and the original cannot drift apart.
 */
type ParentData = Awaited<ReturnType<NonNullable<NonNullable<Parameters<typeof getUserData>[1]>['parent']>>>;

/** `true` when `TShape` is accepted where the helper’s ancestor data is expected. */
type Accepts<TShape> = TShape extends ParentData ? true : false;

describe('getUserData’s structural ancestor-data type', () => {
  it('rejects a bare boolean, a string and a number where a session is expected', () => {
    // Compile-level assertions. Each line fails `yarn typecheck` if the type is relaxed to an optional or unconstrained member.
    const rejectsBareBoolean: Accepts<{ session: true }> = false;
    const rejectsString: Accepts<{ session: 'yes' }> = false;
    const rejectsNumber: Accepts<{ session: 1 }> = false;
    expect([rejectsBareBoolean, rejectsString, rejectsNumber]).toEqual([false, false, false]);
  });

  it('rejects a projection missing the required identifier, and accepts the projection and its null form', () => {
    const rejectsExpiryOnly: Accepts<{ session: { expiresAt: number | null } }> = false;
    const acceptsTheProjection: Accepts<{ session: { userId: string; expiresAt: number | null } }> = true;
    const acceptsTheNullForm: Accepts<{ session: null }> = true;
    expect([rejectsExpiryOnly, acceptsTheProjection, acceptsTheNullForm]).toEqual([false, true, true]);
  });

  /**
   * The producer-to-consumer coupling, asserted at COMPILE time from the load's own return type: if the load widens its payload back to the whole `Session`, or narrows past the member the helper requires, this line stops compiling.
   */
  it('accepts the return type of `sessionProjectionLoad` where the helper expects its ancestor data', () => {
    const payloadSatisfiesTheHelper: Accepts<Awaited<ReturnType<typeof sessionProjectionLoad>>> = true;
    expect(payloadSatisfiesTheHelper).toBe(true);
  });
});
