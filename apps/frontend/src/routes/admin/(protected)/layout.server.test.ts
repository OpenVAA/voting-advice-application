/**
 * The two admin feature subtrees' own cookie-array server loaders (phase 158, `OB-1`, D10 criteria 8 and 11).
 *
 * ## What these loads are for
 *
 * `routes/admin/(protected)/argument-condensation/+layout.ts` and its `question-info` sibling used to take their Supabase client from `await parent()`. `parent()` does not resolve until the ROOT load has finished, and the root load makes four Supabase round-trips, so both feature loads were SERIALISED behind them. Giving each subtree its own `+layout.server.ts` — this spec's subject — lets each universal load build its client from data it has SYNCHRONOUSLY, with no `parent()` await for the client, which is what restores the parallelism. The operator ruled that shape (option `a+`) on 2026-09-01; `routes/(voters)/(located)/+layout.server.ts` is the in-tree analog it was copied from.
 *
 * ## Why this spec exists, and what it would catch
 *
 * Everything a server load returns is serialised into the hydration payload in the HTML body. `cookies.getAll()` yields the request's WHOLE jar, which includes every cookie this application sets `httpOnly: true` — the bank-authentication `id_token`, the two OIDC replay/CSRF guards, and the PKCE companion. Serialising any of those defeats the flag outright. The filter is therefore a data-protection boundary, and this spec is what makes it a checked one.
 *
 * ⚠ AN ABSENCE-ONLY ASSERTION PASSES TRIVIALLY AGAINST AN EMPTY ARRAY, and an empty array is exactly what a broken filter produces — a spelled prefix literal that stopped matching would empty it, `createServerClient` would find no session, and the server-rendered pass would silently go anonymous with no throw, no log and no failing test. Every case below therefore carries its POSITIVE CONTROL inside the same `expect`: the absences and the forwarded array are compared as one object, so a load that returned `[]` fails on the presence half. That vacuity was MEASURED here rather than reasoned about — see the summary's negative control, where stub loads returning `{ supabaseCookies: [] }` passed every absence and failed every presence.
 *
 * ## ⚠ Why the prefix is INJECTED rather than read from the real constant
 *
 * MEASURED under this workspace's vitest configuration on 2026-09-02: `SUPABASE_COOKIE_PREFIX` resolves to the three-character `'sb-'` FALLBACK, because `$env/dynamic/public` supplies no `PUBLIC_SUPABASE_URL` in a unit run and `resolveSupabaseCookiePrefix` degrades rather than throwing (it is evaluated at module scope, and a throw there would take the SSR process down at server start). Against that fallback the decoy below — a name that begins with the vendor prefix but is NOT the storage key — genuinely matches, so a spec written against the ambient constant would pass in production and fail here, i.e. it would be environment-dependent. This project treats an intermittently-failing test as a defect, not as a flake to annotate.
 *
 * Mocking the module the loads import the constant FROM removes the environment from the question and makes a strictly STRONGER claim: the decoy case now fails unless the load actually reads `SUPABASE_COOKIE_PREFIX` at request time. A load that spelled `'sb-'` as a literal would ignore the injected storage key, forward the decoy, and be caught here — which is the fail-open shape `OB-1` names and the shape the comment-filtered grep in the plan's verify block covers from the other side.
 *
 * ## Both loads, from one file
 *
 * The two loads are byte-identical, and a spec that pinned only one would let the other drift into a second idiom for one problem. Every case runs against both.
 */

import { describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import { load as argumentCondensationLoad } from './argument-condensation/+layout.server';
import { load as questionInfoLoad } from './question-info/+layout.server';

/**
 * The storage key injected in place of the real constant, in the production shape `@supabase/supabase-js` computes (`sb-${hostname.split('.')[0]}-auth-token`). Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
 */
const { STORAGE_KEY } = vi.hoisted(() => ({ STORAGE_KEY: 'sb-testproject-auth-token' }));

// The seam the two loads import the prefix through — `$lib/api/dataProvider`, never `$lib/supabase/universal`, because the adapter-boundary guard bans the direct module path at every route. Replacing the module here is what makes the decoy case below deterministic AND load-bearing; see the docstring's fourth section for the measurement behind it.
vi.mock('$lib/api/dataProvider', () => ({ SUPABASE_COOKIE_PREFIX: STORAGE_KEY }));

/** One cookie as the request jar carries it. The real jar also carries `path` and friends; they are present here so the projection has something to drop. */
type RequestCookie = { name: string; value: string; path: string };

/** The shape either load is driven with. The two loads' generated event types are typed against DIFFERENT route ids, so neither is assignable to the other; this is the surface they genuinely share. */
type FakeEvent = { cookies: { getAll: () => Array<RequestCookie> } };
type LoadFn = (event: FakeEvent) => Promise<{ supabaseCookies: Array<{ name: string; value: string }> }>;

/**
 * Every cookie name this application CHOOSES, taken from the one registry that declares them rather than spelled here. A fifth registered cookie fails the set assertion below instead of silently escaping the fixture jar.
 */
const APPLICATION_COOKIE_NAMES = Object.values(COOKIE);

/** A distinctive value per `httpOnly` cookie, so a leak is findable in the serialised payload by substring rather than only by key. */
function secretValueFor(name: string): string {
  return `HTTPONLY-SECRET-${name}-MUST-NOT-CROSS`;
}

/** The four `httpOnly` cookies as they would arrive in a real admin request's jar. */
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
 * A request context exposing only the surface either load touches. Every call builds its own jar and its own object, so nothing is shared between invocations — which is what the concurrency case leans on.
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

const LOADS: Array<[string, LoadFn]> = [
  ['argument-condensation', argumentCondensationLoad as unknown as LoadFn],
  ['question-info', questionInfoLoad as unknown as LoadFn]
];

describe('the registry this spec derives its forbidden set from', () => {
  it('declares exactly the four cookies the fixture jar carries', () => {
    // If a fifth cookie is registered, this fails and the fixture jar must grow with it, rather than the new cookie escaping the spec unnoticed.
    expect([...APPLICATION_COOKIE_NAMES].sort()).toEqual([
      'id_token',
      'oidc_code_verifier',
      'oidc_nonce',
      'oidc_state'
    ]);
  });

  it('names no cookie any reachable value of the prefix could admit', () => {
    // `resolveSupabaseCookiePrefix` returns `sb-${…}-auth-token` or, on an unparseable URL, the `'sb-'` fallback. Every value it can produce starts with `sb-`, so no registered application cookie is reachable by the filter under ANY environment — which is why the four absences below are environment-independent even though the decoy case is not.
    expect(APPLICATION_COOKIE_NAMES.filter((name) => name.startsWith('sb-'))).toEqual([]);
  });
});

describe.each(LOADS)('%s subtree server load — the payload filter', (_feature, load) => {
  it('forwards exactly the auth-storage cookie, with the four httpOnly values absent and the sentinel present in one expectation', async () => {
    const { supabaseCookies } = await load(eventWithJar([...httpOnlyJarEntries, SENTINEL, DECOY]));

    // ONE expectation, both halves. `leaked: []` alone would pass against `supabaseCookies: []`; `forwarded` is the positive control that makes the empty array fail. `toEqual` is exact on keys, so a forwarded `path` or `httpOnly` also fails here.
    expect(report(supabaseCookies)).toEqual({
      leaked: [],
      forwarded: [{ name: STORAGE_KEY, value: 'the-session-blob' }]
    });
  });

  it('forwards the chunked and PKCE companion cookies the client writes, and still nothing else', async () => {
    const chunked: Array<RequestCookie> = [
      { name: `${STORAGE_KEY}.0`, value: 'chunk-0', path: '/' },
      { name: `${STORAGE_KEY}.1`, value: 'chunk-1', path: '/' },
      { name: `${STORAGE_KEY}-code-verifier`, value: 'pkce', path: '/' }
    ];

    const { supabaseCookies } = await load(eventWithJar([...httpOnlyJarEntries, ...chunked, DECOY]));

    expect(report(supabaseCookies)).toEqual({
      leaked: [],
      forwarded: [
        { name: `${STORAGE_KEY}.0`, value: 'chunk-0' },
        { name: `${STORAGE_KEY}.1`, value: 'chunk-1' },
        { name: `${STORAGE_KEY}-code-verifier`, value: 'pkce' }
      ]
    });
  });

  it('excludes a decoy that begins with the vendor prefix but is not the storage key', async () => {
    // Non-vacuous by construction: the storage-key cookie is in the same jar, so an empty return fails this case too. A load that spelled `'sb-'` rather than reading the constant forwards the decoy and fails here.
    const { supabaseCookies } = await load(eventWithJar([DECOY, SENTINEL]));

    expect(supabaseCookies).toEqual([{ name: STORAGE_KEY, value: 'the-session-blob' }]);
  });

  it('returns an empty array, and does not throw, on an empty jar', async () => {
    await expect(load(eventWithJar([]))).resolves.toEqual({ supabaseCookies: [] });
  });

  it('returns an empty array when the jar carries only httpOnly cookies', async () => {
    const { supabaseCookies } = await load(eventWithJar(httpOnlyJarEntries));

    expect(supabaseCookies).toEqual([]);
  });

  it('keeps two concurrent requests independent — neither jar contributes to the other payload', async () => {
    const jarA: Array<RequestCookie> = [{ name: STORAGE_KEY, value: 'request-a-session', path: '/' }];
    const jarB: Array<RequestCookie> = [{ name: STORAGE_KEY, value: 'request-b-session', path: '/' }];

    // Issued together rather than in sequence: the load holds no module-level state, and a load that did would be visible as one request's value appearing in the other's array.
    const [a, b] = await Promise.all([load(eventWithJar(jarA)), load(eventWithJar(jarB))]);

    expect({ a: a.supabaseCookies, b: b.supabaseCookies }).toEqual({
      a: [{ name: STORAGE_KEY, value: 'request-a-session' }],
      b: [{ name: STORAGE_KEY, value: 'request-b-session' }]
    });
  });
});

describe('the two subtree loads do not diverge', () => {
  it('returns deep-equal payloads for the same jar', async () => {
    const jar = [...httpOnlyJarEntries, SENTINEL, DECOY];

    const [argumentCondensation, questionInfo] = await Promise.all([
      (argumentCondensationLoad as unknown as LoadFn)(eventWithJar(jar)),
      (questionInfoLoad as unknown as LoadFn)(eventWithJar(jar))
    ]);

    // The byte-level half of this claim is a `diff` in the plan's verify block; this is the behavioural half, and it fails if one file is edited without the other.
    expect(argumentCondensation).toEqual(questionInfo);
    expect(argumentCondensation.supabaseCookies).toEqual([{ name: STORAGE_KEY, value: 'the-session-blob' }]);
  });
});
