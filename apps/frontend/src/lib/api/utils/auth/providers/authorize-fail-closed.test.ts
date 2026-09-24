/**
 * Fail-closed guards on both providers' `getAuthorizeUrl`.
 *
 * The defect these pin: with a configuration variable unset, `$lib/utils/constants.ts` hands the builder an empty string (it flattens everything with `?? ''` and deliberately never throws), the builder concatenated it, and `signicatProvider` returned `?client_id=&response_type=code&…`. That is a well-formed RELATIVE url. `window.location.href = authorizeUrl` in `routes/candidate/preregister/+page.svelte` therefore resolved it against the current document and navigated back to the page the user was already on, carrying the authorization request as a query string — endpoint 200, nothing thrown, no console error, no clue. See `.planning/debug/resolved/idura-bank-auth-empty-client.md`.
 *
 * So the property under test is NOT "rejects for some reason". It is that the url is never BUILT from a blank input, and that the error names the offending variable — that name is the entire difference between a five-second fix and a debugging session. Assertions therefore check the variable name appears in the message, and that no url is returned.
 *
 * Both providers are exercised in one file because they share `requireConfigured` and must not drift apart: a guard on only one of them leaves the other silently fail-open.
 *
 * Separate from `signicat.test.ts` / `idura.test.ts` on purpose: those mock `$env/dynamic/public` statically and let the real `constants.ts` read it once at import, which cannot express "this variable is blank for this one case". The mutable `$lib/utils/constants` seam used here is the same one `decryptAndVerifyIdToken.test.ts` uses for its fail-closed `aud`/`iss` cases.
 *
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { iduraProvider } from './idura';
import { signicatProvider } from './signicat';

// Mutable mocks. `constants.ts` and `server/constants.ts` are eager object literals evaluated once at import, so mutating an `$env` mock after import is invisible — the CONSTANTS modules are the only seam that can vary per test.
const { mockConstants, mockPublicConstants } = vi.hoisted(() => ({
  // Full shape rather than the subset this file reads: a partial object typechecks under vitest (which does not typecheck) and then drifts silently from the real module.
  mockConstants: {
    BACKEND_API_TOKEN: '',
    IDENTITY_PROVIDER_CLIENT_SECRET: '',
    IDENTITY_PROVIDER_DECRYPTION_JWKS: '[]',
    IDENTITY_PROVIDER_JWKS_URI: '',
    IDENTITY_PROVIDER_ISSUER: '',
    IDENTITY_PROVIDER_TOKEN_ENDPOINT: '',
    IDURA_SIGNING_JWKS: '[]',
    IDURA_SIGNING_KEY_KID: '',
    IDURA_DOMAIN: 'test.idura.broker',
    LOCAL_DATA_DIR: '',
    CACHE_DIR: '',
    CACHE_TTL: '',
    CACHE_LRU_SIZE: '',
    CACHE_EXPIRATION_INTERVAL: '',
    LLM_OPENAI_API_KEY: ''
  },
  mockPublicConstants: {
    PUBLIC_BROWSER_BACKEND_URL: '',
    PUBLIC_SERVER_BACKEND_URL: '',
    PUBLIC_BROWSER_FRONTEND_URL: '',
    PUBLIC_SERVER_FRONTEND_URL: '',
    PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'test-client',
    PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT: 'https://signicat.example/authorize',
    PUBLIC_IDENTITY_PROVIDER_TYPE: 'signicat',
    PUBLIC_DEBUG: false,
    PUBLIC_LOG_LEVEL: '',
    PUBLIC_CACHE_ENABLED: false,
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    PUBLIC_PROJECT_ID: '00000000-0000-0000-0000-000000000001'
  }
}));

vi.mock('$lib/server/constants', () => ({ constants: mockConstants }));
vi.mock('$lib/utils/constants', () => ({ constants: mockPublicConstants }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$env/dynamic/private', () => ({ env: {} }));

// The configured baseline every test starts from, so a case only varies the ONE thing it is about.
const GOOD_PUBLIC = { ...mockPublicConstants };
const GOOD_PRIVATE = { ...mockConstants };

const REDIRECT_URI = 'http://localhost:5173/api/oidc/callback';

/**
 * The boundary neighbours of "unset". A single `''` case would miss the adjacent members of the same equivalence class, and whitespace is the realistic one — `FOO= ` with a stray space is what an env file actually contains after a bad edit, and it is exactly as unusable as `''` while looking populated to a human and to a `!value` check.
 */
const BLANKS: Array<[label: string, value: string | undefined]> = [
  ['empty string', ''],
  ['a single space', ' '],
  ['tabs and spaces', '\t  '],
  ['undefined', undefined]
];

beforeEach(() => {
  Object.assign(mockPublicConstants, GOOD_PUBLIC);
  Object.assign(mockConstants, GOOD_PRIVATE);
});

describe('signicatProvider.getAuthorizeUrl — fail-closed on blank configuration', () => {
  it('builds an ABSOLUTE url when everything is configured (the control)', async () => {
    const { authorizeUrl } = await signicatProvider.getAuthorizeUrl({
      redirectUri: REDIRECT_URI,
      codeChallenge: 'test-challenge'
    });

    // The control matters as much as the negatives: it proves the guards are not simply rejecting everything.
    expect(authorizeUrl).toMatch(/^https:\/\/signicat\.example\/authorize\?/);
    expect(authorizeUrl).toContain('client_id=test-client');
  });

  describe.each(BLANKS)('with a blank authorization endpoint (%s)', (_label, value) => {
    it('throws naming PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT instead of returning a relative url', async () => {
      // `as string` because the production type is `string` (constants.ts flattens with `?? ''`); feeding `undefined` covers the case where a future refactor stops flattening.
      mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT = value as string;

      await expect(
        signicatProvider.getAuthorizeUrl({ redirectUri: REDIRECT_URI, codeChallenge: 'test-challenge' })
      ).rejects.toThrow(/PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT/);
    });
  });

  describe.each(BLANKS)('with a blank client id (%s)', (_label, value) => {
    it('throws naming PUBLIC_IDENTITY_PROVIDER_CLIENT_ID', async () => {
      mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID = value as string;

      await expect(
        signicatProvider.getAuthorizeUrl({ redirectUri: REDIRECT_URI, codeChallenge: 'test-challenge' })
      ).rejects.toThrow(/PUBLIC_IDENTITY_PROVIDER_CLIENT_ID/);
    });
  });

  it('names BOTH variables when both are blank, rather than only the first', async () => {
    // The realistic shape of this incident: no env file was read at all, so everything was blank at once. Reporting one name at a time turns one fix into several round trips.
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT = '';
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID = '';

    await expect(
      signicatProvider.getAuthorizeUrl({ redirectUri: REDIRECT_URI, codeChallenge: 'test-challenge' })
    ).rejects.toThrow(/PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT.*PUBLIC_IDENTITY_PROVIDER_CLIENT_ID/s);
  });

  describe.each(BLANKS)('with a blank PKCE code challenge (%s)', (_label, value) => {
    it('throws rather than emitting code_challenge= with nothing after it', async () => {
      await expect(
        signicatProvider.getAuthorizeUrl({ redirectUri: REDIRECT_URI, codeChallenge: value })
      ).rejects.toThrow(/codeChallenge/);
    });
  });

  it('never returns a relative url — the precise regression', async () => {
    // Stated as the defect itself rather than as a message assertion, so this keeps biting even if the wording changes. Before the fix this call RESOLVED with '?client_id=&response_type=code&…'.
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT = '';

    let resolved: string | undefined;
    try {
      resolved = (await signicatProvider.getAuthorizeUrl({ redirectUri: REDIRECT_URI, codeChallenge: 'c' }))
        .authorizeUrl;
    } catch {
      // Throwing is the pass condition.
    }

    expect(resolved).toBeUndefined();
  });
});

describe('iduraProvider.getAuthorizeUrl — fail-closed on blank configuration', () => {
  describe.each(BLANKS)('with a blank IDURA_DOMAIN (%s)', (_label, value) => {
    it('throws naming IDURA_DOMAIN, not a misleading signing-key error', async () => {
      mockConstants.IDURA_DOMAIN = value as string;

      // The guard is ordered before `getSigningKey()` precisely so this reports the domain. With the mock's empty `IDURA_SIGNING_JWKS`, a guard placed after it would instead say "Idura signing key not found for kid: ", sending the reader to JWKS parsing when the real problem is that no env file was read. Asserting on the caught message rather than with `.rejects.not.toThrow` so that BOTH halves — what it says and what it must not say — are read off one rejection.
      const error = await iduraProvider
        .getAuthorizeUrl({ redirectUri: REDIRECT_URI })
        .then(() => null)
        .catch((e: Error) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('IDURA_DOMAIN');
      expect((error as Error).message).not.toContain('signing key');
    });
  });

  describe.each(BLANKS)('with a blank client id (%s)', (_label, value) => {
    it('throws naming PUBLIC_IDENTITY_PROVIDER_CLIENT_ID', async () => {
      mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID = value as string;

      await expect(iduraProvider.getAuthorizeUrl({ redirectUri: REDIRECT_URI })).rejects.toThrow(
        /PUBLIC_IDENTITY_PROVIDER_CLIENT_ID/
      );
    });
  });

  it('never builds an https:/// url from a blank domain', async () => {
    mockConstants.IDURA_DOMAIN = '';

    let resolved: string | undefined;
    try {
      resolved = (await iduraProvider.getAuthorizeUrl({ redirectUri: REDIRECT_URI })).authorizeUrl;
    } catch {
      // Throwing is the pass condition.
    }

    expect(resolved).toBeUndefined();
  });
});

describe('requireConfigured — the error message contract', () => {
  it('reports variable NAMES and never a value', async () => {
    // The message is logged server-side and surfaced in a 500, so it must stay safe to print. A guard that helpfully echoed the resolved value would leak a client secret the first time it was reused elsewhere.
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID = '';
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT = 'https://signicat.example/authorize';

    const error = await signicatProvider
      .getAuthorizeUrl({ redirectUri: REDIRECT_URI, codeChallenge: 'c' })
      .then(() => null)
      .catch((e: Error) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('PUBLIC_IDENTITY_PROVIDER_CLIENT_ID');
    // Points at the canonical file, which is the actual remedy and the thing this whole incident turned on.
    expect((error as Error).message).toContain('.env');
  });
});
