/**
 * The Supabase cookie filter every server load that hands a universal load its `supabaseCookies` goes through: `supabaseCookiesOf` and the `supabaseCookiesLoad` the subtree server loads re-export.
 *
 * ## Why this spec exists, and what it would catch
 *
 * Everything a server load returns is serialised into the hydration payload in the HTML body. `cookies.getAll()` yields the request's WHOLE jar, which includes every cookie this application sets `httpOnly: true` — the two OIDC replay/CSRF guards, the PKCE companion, the identity provider's entity-type cookie, the identity provider's locale cookie and its arrival marker. Serialising any of those defeats the flag outright. The filter is therefore a data-protection boundary, and this spec is what makes it a checked one.
 *
 * ⚠ AN ABSENCE-ONLY ASSERTION PASSES TRIVIALLY AGAINST AN EMPTY ARRAY, and an empty array is exactly what a broken filter produces — a spelled prefix literal that stopped matching would empty it, `createServerClient` would find no session, and the server-rendered pass would silently go anonymous with no throw, no log and no failing test. Every case below therefore carries its POSITIVE CONTROL inside the same `expect`: the absences and the forwarded array are compared as one object, so a filter that returned `[]` fails on the presence half.
 *
 * ## ⚠ Why the prefix is INJECTED rather than read from the real constant
 *
 * Under this workspace's vitest configuration `SUPABASE_COOKIE_PREFIX` resolves to the three-character `'sb-'` FALLBACK, because `$env/dynamic/public` supplies no `PUBLIC_SUPABASE_URL` in a unit run and `resolveSupabaseCookiePrefix` degrades rather than throwing (it is evaluated at module scope, and a throw there would take the SSR process down at server start). Against that fallback the decoy below — a name that begins with the vendor prefix but is NOT the storage key — genuinely matches, so a spec written against the ambient constant would pass in production and fail here, i.e. it would be environment-dependent.
 *
 * Mocking the module the helper imports the constant FROM removes the environment from the question and makes a strictly STRONGER claim: the decoy case now fails unless the filter actually reads `SUPABASE_COOKIE_PREFIX` at request time. A filter that spelled `'sb-'` as a literal would ignore the injected storage key, forward the decoy, and be caught here.
 *
 * ## The routes that use it
 *
 * The subtree server loads are one-line re-exports of `supabaseCookiesLoad`; the last block checks that each one still is.
 */

import { describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import { supabaseCookiesLoad } from './supabaseCookies';
import { load as locatedVoterLoad } from '../../routes/(voters)/(located)/+layout.server';
import { load as adminQuestionsLoad } from '../../routes/admin/(protected)/(questions)/+layout.server';

/**
 * The storage key injected in place of the real constant, in the production shape `@supabase/supabase-js` computes (`sb-${hostname.split('.')[0]}-auth-token`). Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
 */
const { STORAGE_KEY } = vi.hoisted(() => ({ STORAGE_KEY: 'sb-testproject-auth-token' }));

// The seam the helper imports the prefix through. Replacing the module here is what makes the decoy case below deterministic AND load-bearing; see the docstring's third section.
vi.mock('$lib/api/dataProvider', () => ({ SUPABASE_COOKIE_PREFIX: STORAGE_KEY }));

/** One cookie as the request jar carries it. The real jar also carries `path` and friends; they are present here so the projection has something to drop. */
type RequestCookie = { name: string; value: string; path: string };

/** The surface of the request event the filter reads. */
type FakeEvent = { cookies: { getAll: () => Array<RequestCookie> } };

/**
 * Run the load the subtree routes re-export against a fake event.
 * @param event - The fake request event.
 * @returns What the load returned.
 */
function load(event: FakeEvent): { supabaseCookies: Array<{ name: string; value: string }> } {
  return supabaseCookiesLoad(event as unknown as Parameters<typeof supabaseCookiesLoad>[0]);
}

/**
 * Every cookie name this application CHOOSES, taken from the one registry that declares them rather than spelled here. A newly registered cookie fails the set assertion below instead of silently escaping the fixture jar.
 */
const APPLICATION_COOKIE_NAMES = Object.values(COOKIE);

/** A distinctive value per `httpOnly` cookie, so a leak is findable in the serialised payload by substring rather than only by key. */
function secretValueFor(name: string): string {
  return `HTTPONLY-SECRET-${name}-MUST-NOT-CROSS`;
}

/** The application's `httpOnly` cookies as they would arrive in a real admin request's jar. */
const httpOnlyJarEntries: Array<RequestCookie> = APPLICATION_COOKIE_NAMES.map((name) => ({
  name,
  value: secretValueFor(name),
  path: '/'
}));

/** The values that must never appear anywhere in what a load returns. */
const FORBIDDEN_VALUES = APPLICATION_COOKIE_NAMES.map(secretValueFor);

/** The auth-storage cookie, and the value the positive control looks for. */
const SENTINEL: RequestCookie = { name: STORAGE_KEY, value: 'the-session-blob', path: '/' };

/** A name beginning with the two-character vendor prefix that is NOT the auth storage key. Forwarding it would be the bare-`sb-` over-match the storage-key narrowing exists to close. */
const DECOY: RequestCookie = { name: 'sb-feature-flags', value: 'decoy-value', path: '/' };

/**
 * A request context exposing only the surface the filter touches. Every call builds its own jar and its own object, so nothing is shared between invocations — which is what the concurrency case leans on.
 * @param jar - The cookies this request arrives with.
 * @returns The fake event.
 */
function eventWithJar(jar: Array<RequestCookie>): FakeEvent {
  return { cookies: { getAll: () => jar } };
}

/**
 * The leak report the primary assertion compares. Returned as data rather than asserted piecemeal so the absences and the positive control land in ONE expectation.
 * @param supabaseCookies - What the load returned.
 * @returns The forbidden values that crossed, and the array that did.
 */
function report(supabaseCookies: Array<{ name: string; value: string }>) {
  const serialised = JSON.stringify(supabaseCookies);
  return {
    leaked: FORBIDDEN_VALUES.filter((secret) => serialised.includes(secret)),
    forwarded: supabaseCookies
  };
}

describe('the registry this spec derives its forbidden set from', () => {
  it('declares exactly the cookies the fixture jar carries', () => {
    // If another cookie is registered, this fails and the fixture jar must grow with it, rather than the new cookie escaping the spec unnoticed. A new `httpOnly` cookie also joins `HTTP_ONLY_COOKIE_NAMES` in `tests/tests/specs/admin/admin-access.spec.ts`, the end-to-end copy of the names, which nothing checks against this list.
    expect([...APPLICATION_COOKIE_NAMES].sort()).toEqual([
      'identity_provider_arrival',
      'logout-deadline',
      'logout-pending',
      'oidc_code_verifier',
      'oidc_entity_type',
      'oidc_intent',
      'oidc_locale',
      'oidc_nonce',
      'oidc_state',
      'registered'
    ]);
  });

  it('names no cookie any reachable value of the prefix could admit', () => {
    // `resolveSupabaseCookiePrefix` returns `sb-${…}-auth-token` or, on an unparseable URL, the `'sb-'` fallback. Every value it can produce starts with `sb-`, so no registered application cookie is reachable by the filter under ANY environment — which is why the absences below are environment-independent even though the decoy case is not.
    expect(APPLICATION_COOKIE_NAMES.filter((name) => name.startsWith('sb-'))).toEqual([]);
  });
});

describe('supabaseCookiesLoad — the payload filter', () => {
  it('forwards exactly the auth-storage cookie, with the httpOnly values absent and the sentinel present in one expectation', () => {
    const { supabaseCookies } = load(eventWithJar([...httpOnlyJarEntries, SENTINEL, DECOY]));

    // ONE expectation, both halves. `leaked: []` alone would pass against `supabaseCookies: []`; `forwarded` is the positive control that makes the empty array fail. `toEqual` is exact on keys, so a forwarded `path` or `httpOnly` also fails here.
    expect(report(supabaseCookies)).toEqual({
      leaked: [],
      forwarded: [{ name: STORAGE_KEY, value: 'the-session-blob' }]
    });
  });

  it('forwards the chunked and PKCE companion cookies the client writes, and still nothing else', () => {
    const chunked: Array<RequestCookie> = [
      { name: `${STORAGE_KEY}.0`, value: 'chunk-0', path: '/' },
      { name: `${STORAGE_KEY}.1`, value: 'chunk-1', path: '/' },
      { name: `${STORAGE_KEY}-code-verifier`, value: 'pkce', path: '/' }
    ];

    const { supabaseCookies } = load(eventWithJar([...httpOnlyJarEntries, ...chunked, DECOY]));

    expect(report(supabaseCookies)).toEqual({
      leaked: [],
      forwarded: [
        { name: `${STORAGE_KEY}.0`, value: 'chunk-0' },
        { name: `${STORAGE_KEY}.1`, value: 'chunk-1' },
        { name: `${STORAGE_KEY}-code-verifier`, value: 'pkce' }
      ]
    });
  });

  it('excludes a decoy that begins with the vendor prefix but is not the storage key', () => {
    // Non-vacuous by construction: the storage-key cookie is in the same jar, so an empty return fails this case too. A load that spelled `'sb-'` rather than reading the constant forwards the decoy and fails here.
    const { supabaseCookies } = load(eventWithJar([DECOY, SENTINEL]));

    expect(supabaseCookies).toEqual([{ name: STORAGE_KEY, value: 'the-session-blob' }]);
  });

  it('returns an empty array, and does not throw, on an empty jar', () => {
    expect(load(eventWithJar([]))).toEqual({ supabaseCookies: [] });
  });

  it('returns an empty array when the jar carries only httpOnly cookies', () => {
    const { supabaseCookies } = load(eventWithJar(httpOnlyJarEntries));

    expect(supabaseCookies).toEqual([]);
  });

  it('keeps two concurrent requests independent — neither jar contributes to the other payload', () => {
    const jarA: Array<RequestCookie> = [{ name: STORAGE_KEY, value: 'request-a-session', path: '/' }];
    const jarB: Array<RequestCookie> = [{ name: STORAGE_KEY, value: 'request-b-session', path: '/' }];

    // The load holds no module-level state; one that did would be visible as one request's value appearing in the other's array.
    const [a, b] = [load(eventWithJar(jarA)), load(eventWithJar(jarB))];

    expect({ a: a.supabaseCookies, b: b.supabaseCookies }).toEqual({
      a: [{ name: STORAGE_KEY, value: 'request-a-session' }],
      b: [{ name: STORAGE_KEY, value: 'request-b-session' }]
    });
  });
});

describe('the subtree server loads', () => {
  it.each([
    ['(voters)/(located)', locatedVoterLoad],
    ['admin/(protected)/(questions)', adminQuestionsLoad]
  ])('%s re-exports supabaseCookiesLoad', (_route, routeLoad) => {
    expect(routeLoad).toBe(supabaseCookiesLoad);
  });
});
