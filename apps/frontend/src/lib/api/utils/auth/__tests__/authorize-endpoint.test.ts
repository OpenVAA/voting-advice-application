/**
 * OIDC Authorize endpoint tests.
 *
 * Tests the POST handler that starts the identity provider's flow: it checks the entity type the body names against the project's registration matrix, builds the redirect from its own origin, builds the authorization URL through the active identity provider, and sets the flow's cookies — the provider's own bindings and the type cookie.
 *
 * `$lib/api/dataProvider` is replaced, so no Supabase client is built: `createDataProvider` answers a provider whose `getAppSettings` each case controls. The matrix functions are the real ones, and the function the registration screen reads its types from is wrapped in a spy that calls through, so a case can show the endpoint asks that same function.
 *
 * For Idura: verifies the JAR (JWT Authorization Request) is correctly signed with RS256, contains the required payload fields, and is verifiable with the signing public key. For Signicat: verifies the server generates the PKCE pair and keeps the verifier in an httpOnly cookie.
 *
 * @vitest-environment node
 */

import { log } from '@openvaa/app-shared';
import * as jose from 'jose';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityProviderEntityType } from '$lib/contestant/utils/registrationOffer';
import { COOKIE } from '$lib/cookies';
import { POST } from '../../../../../routes/api/oidc/authorize/+server';
import type { RegistrationMode } from '@openvaa/app-shared';
import type * as RegistrationOfferModule from '$lib/contestant/utils/registrationOffer';

// Use vi.hoisted for dynamic mock state (signing keys injected in beforeAll)
const { mockServerConstants, mockPublicConstants, createDataProvider, createSupabaseAnonClient, getAppSettings } =
  vi.hoisted(() => ({
    mockServerConstants: {
      IDURA_SIGNING_JWKS: '[]',
      IDURA_SIGNING_KEY_KID: 'test-signing-kid',
      IDURA_DOMAIN: 'test.idura.broker',
      IDENTITY_PROVIDER_DECRYPTION_JWKS: '[]',
      IDENTITY_PROVIDER_JWKS_URI: 'https://test.idura.broker/.well-known/jwks',
      IDENTITY_PROVIDER_ISSUER: 'https://test.idura.broker',
      IDENTITY_PROVIDER_TOKEN_ENDPOINT: 'https://test.idura.broker/oauth2/token',
      IDENTITY_PROVIDER_CLIENT_SECRET: '',
      LOCAL_DATA_DIR: '',
      LLM_OPENAI_API_KEY: ''
    },
    mockPublicConstants: {
      PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'test-client-id',
      PUBLIC_IDENTITY_PROVIDER_TYPE: 'idura-ftn',
      PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT: '',
      PUBLIC_BROWSER_FRONTEND_URL: '',
      PUBLIC_SERVER_FRONTEND_URL: '',
      PUBLIC_DEBUG: false,
      PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
    },
    createDataProvider: vi.fn(),
    createSupabaseAnonClient: vi.fn(),
    getAppSettings: vi.fn()
  }));

// Mock env modules before importing modules that depend on them
vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$env/dynamic/private', () => ({ env: {} }));

// Mock constants modules directly for dynamic value injection
vi.mock('$lib/server/constants', () => ({
  get constants() {
    return mockServerConstants;
  }
}));

vi.mock('$lib/utils/constants', () => ({
  get constants() {
    return mockPublicConstants;
  }
}));

vi.mock('$lib/api/dataProvider', () => ({ createDataProvider, createSupabaseAnonClient }));

vi.mock('$lib/contestant/utils/registrationOffer', async (importOriginal) => {
  const actual = await importOriginal<typeof RegistrationOfferModule>();
  return { ...actual, identityProviderEntityType: vi.fn(actual.identityProviderEntityType) };
});

/** The origin every request of this file is made on. */
const ORIGIN = 'http://localhost:5173';

/** The redirect the endpoint must give the provider: its own origin and the callback's path. */
const CALLBACK = `${ORIGIN}/api/oidc/callback`;

/** The flow cookies' attributes. */
const FLOW_COOKIE_OPTIONS = { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 };

type Matrix = { candidate?: Array<RegistrationMode>; organization?: Array<RegistrationMode> };

/** Settings as a data provider returns them, serving the given types with the given matrix. */
function settingsFor(entityTypes: Array<string>, registrationModes: Matrix) {
  return { contestantApp: { entityTypes, registrationModes } };
}

const CANDIDATES_ONLY = settingsFor(['candidate', 'organization'], {
  candidate: ['identity_provider'],
  organization: ['email']
});
const BOTH_TYPES = settingsFor(['candidate', 'organization'], {
  candidate: ['identity_provider'],
  organization: ['identity_provider']
});
const ORGANIZATIONS_ONLY = settingsFor(['candidate', 'organization'], {
  candidate: ['email'],
  organization: ['identity_provider']
});
const NONE = settingsFor(['candidate'], { candidate: ['email', 'code'] });
const ORGANIZATION_NOT_SERVED = settingsFor(['candidate'], {
  candidate: ['email'],
  organization: ['identity_provider']
});

type MockEvent = Parameters<typeof POST>[0] & {
  cookies: { set: ReturnType<typeof vi.fn> };
};

/**
 * Build a mock RequestEvent for the POST handler.
 * @param body - The JSON body, or a raw string sent as it is.
 * @param currentLocale - The locale the request was resolved to.
 */
function createMockRequestEvent(body: Record<string, unknown> | string, currentLocale = 'en'): MockEvent {
  return {
    locals: { currentLocale },
    url: new URL(`${ORIGIN}/api/oidc/authorize`),
    fetch: vi.fn(),
    request: new Request(`${ORIGIN}/api/oidc/authorize`, {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }),
    cookies: {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(() => []),
      serialize: vi.fn()
    }
  } as unknown as MockEvent;
}

/** The value a cookie was set to, or `undefined` when it was not set. */
function cookieSet(event: MockEvent, name: string): string | undefined {
  const call = event.cookies.set.mock.calls.find(([setName]) => setName === name);
  return call?.[1];
}

/** The redirect URI the JAR of an Idura authorize URL carries. */
function jarRedirectUri(authorizeUrl: string): unknown {
  return jose.decodeJwt(new URL(authorizeUrl).searchParams.get('request')!).redirect_uri;
}

describe('POST /api/oidc/authorize', () => {
  let signingPublicKey: CryptoKey;

  beforeAll(async () => {
    // Generate RS256 signing key pair for Idura JAR construction
    const { privateKey, publicKey } = await jose.generateKeyPair('RS256', { extractable: true });
    signingPublicKey = publicKey;

    const jwk = {
      ...(await jose.exportJWK(privateKey)),
      kid: 'test-signing-kid',
      alg: 'RS256'
    };
    mockServerConstants.IDURA_SIGNING_JWKS = JSON.stringify([jwk]);
  });

  beforeEach(() => {
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'idura-ftn';
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT = '';
    createSupabaseAnonClient.mockReturnValue({ marker: 'anonymous client' });
    createDataProvider.mockReturnValue({ getAppSettings });
    getAppSettings.mockResolvedValue(CANDIDATES_ONLY);
    vi.spyOn(log, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  describe('Idura', () => {
    it('returns 200 with an authorizeUrl in the response', async () => {
      const event = createMockRequestEvent({ entityType: 'candidate' });
      const response = await POST(event);

      expect(response.status).toBe(200);

      const data = await response.json();
      // ONE non-blind assertion rather than a toBeDefined + typeof pair, which is null-blind: `data` crosses a JSON boundary (response.json()), so `authorizeUrl` could plausibly arrive `null` there.
      expect(data.authorizeUrl, 'authorize response is missing authorizeUrl').toEqual(expect.any(String));
    });

    it('authorizeUrl contains client_id query parameter', async () => {
      const response = await POST(createMockRequestEvent({ entityType: 'candidate' }));
      const { authorizeUrl } = await response.json();

      expect(authorizeUrl).toContain('client_id=test-client-id');
    });

    it('authorizeUrl contains a signed JWT request parameter', async () => {
      const response = await POST(createMockRequestEvent({ entityType: 'candidate' }));
      const { authorizeUrl } = await response.json();

      const requestParam = new URL(authorizeUrl).searchParams.get('request');
      expect(requestParam, "authorize URL is missing the 'request' (JAR) parameter").toEqual(
        expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/)
      );
    });

    it('JAR is signed with RS256 algorithm', async () => {
      const response = await POST(createMockRequestEvent({ entityType: 'candidate' }));
      const { authorizeUrl } = await response.json();

      const header = jose.decodeProtectedHeader(new URL(authorizeUrl).searchParams.get('request')!);
      expect(header.alg).toBe('RS256');
    });

    it('JAR payload contains required OIDC fields', async () => {
      const response = await POST(createMockRequestEvent({ entityType: 'candidate' }));
      const { authorizeUrl } = await response.json();

      const payload = jose.decodeJwt(new URL(authorizeUrl).searchParams.get('request')!);
      expect(payload.response_type).toBe('code');
      expect(payload.response_mode).toBe('query');
      expect(payload.client_id).toBe('test-client-id');
      expect(payload.redirect_uri).toBe(CALLBACK);
      expect(payload.scope).toBe('openid profile');
      expect(payload.iss).toBe('test-client-id');
      expect(payload.aud).toBe('https://test.idura.broker');
      expect(payload.state).toBeDefined();
      expect(payload.nonce).toBeDefined();
    });

    it('JAR signature is verifiable with the signing public key', async () => {
      const response = await POST(createMockRequestEvent({ entityType: 'candidate' }));
      const { authorizeUrl } = await response.json();

      // Should not throw -- signature is valid
      const { payload } = await jose.jwtVerify(new URL(authorizeUrl).searchParams.get('request')!, signingPublicKey);
      expect(payload.client_id).toBe('test-client-id');
    });

    it('sets the oidc_state and oidc_nonce cookies with the flow attributes', async () => {
      const event = createMockRequestEvent({ entityType: 'candidate' });
      await POST(event);

      expect(event.cookies.set).toHaveBeenCalledWith(COOKIE.oidcState, expect.any(String), FLOW_COOKIE_OPTIONS);
      expect(event.cookies.set).toHaveBeenCalledWith(COOKIE.oidcNonce, expect.any(String), FLOW_COOKIE_OPTIONS);
    });

    it('sets no PKCE verifier cookie', async () => {
      const event = createMockRequestEvent({ entityType: 'candidate' });
      await POST(event);
      expect(cookieSet(event, COOKIE.oidcCodeVerifier)).toBeUndefined();
    });

    it('gives the provider its own origin and the callback path, whatever redirect the body names', async () => {
      const response = await POST(
        createMockRequestEvent({ entityType: 'candidate', redirectUri: 'https://attacker.example/steal' })
      );
      const { authorizeUrl } = await response.json();
      expect(jarRedirectUri(authorizeUrl)).toBe(CALLBACK);
    });

    it('asks the provider for the locale the request was resolved to, as ui_locales in the JAR', async () => {
      const response = await POST(createMockRequestEvent({ entityType: 'candidate' }, 'fi'));
      const { authorizeUrl } = await response.json();
      expect(jose.decodeJwt(new URL(authorizeUrl).searchParams.get('request')!).ui_locales).toBe('fi');
    });
  });

  describe('the entity type', () => {
    it('sets the type cookie to an allowed type with the flow attributes, beside the flow cookies', async () => {
      const event = createMockRequestEvent({ entityType: 'candidate' });
      const response = await POST(event);

      expect(response.status).toBe(200);
      expect(event.cookies.set).toHaveBeenCalledWith(COOKIE.oidcEntityType, 'candidate', FLOW_COOKIE_OPTIONS);
      expect(cookieSet(event, COOKIE.oidcState)).toEqual(expect.any(String));
    });

    it('accepts an allowed organization', async () => {
      getAppSettings.mockResolvedValue(ORGANIZATIONS_ONLY);
      const event = createMockRequestEvent({ entityType: 'organization' });
      const response = await POST(event);
      expect(response.status).toBe(200);
      expect(cookieSet(event, COOKIE.oidcEntityType)).toBe('organization');
    });

    it.each<[string, Record<string, unknown>, ReturnType<typeof settingsFor>]>([
      ['a type the matrix forbids', { entityType: 'organization' }, CANDIDATES_ONLY],
      ['a type the project does not serve', { entityType: 'organization' }, ORGANIZATION_NOT_SERVED],
      ['an unknown type', { entityType: 'alliance' }, CANDIDATES_ONLY],
      ['an inherited name', { entityType: 'constructor' }, CANDIDATES_ONLY],
      ['a type that is not a string', { entityType: 1 }, CANDIDATES_ONLY],
      ['a null type', { entityType: null }, CANDIDATES_ONLY],
      ['an absent type where no served type allows the mode', {}, NONE],
      ['an absent type where several served types allow the mode', {}, BOTH_TYPES]
    ])('refuses %s with 403 mode_not_allowed and sets no cookie', async (_name, body, settings) => {
      getAppSettings.mockResolvedValue(settings);
      const event = createMockRequestEvent(body);
      const response = await POST(event);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'mode_not_allowed' });
      expect(event.cookies.set).not.toHaveBeenCalled();
    });

    it.each<[string, ReturnType<typeof settingsFor>, string]>([
      ['candidates alone', CANDIDATES_ONLY, 'candidate'],
      ['organizations alone', ORGANIZATIONS_ONLY, 'organization']
    ])('takes an absent type as the one served type that allows the mode, for %s', async (_name, settings, type) => {
      getAppSettings.mockResolvedValue(settings);
      const event = createMockRequestEvent({});
      const response = await POST(event);
      expect(response.status).toBe(200);
      expect(cookieSet(event, COOKIE.oidcEntityType)).toBe(type);
    });

    it('asks the shared function over the registration screen’s list of types, with the settings it read and the named type', async () => {
      getAppSettings.mockResolvedValue(BOTH_TYPES);
      const event = createMockRequestEvent({ entityType: 'organization' });
      const response = await POST(event);

      expect(response.status).toBe(200);
      expect(vi.mocked(identityProviderEntityType).mock.calls).toEqual([[BOTH_TYPES, 'organization']]);
      expect(cookieSet(event, COOKIE.oidcEntityType)).toBe('organization');
    });

    it.each(['candidate', 'organization'])(
      'refuses %s with 403 mode_not_allowed while answers are locked, and sets no cookie',
      async (entityType) => {
        getAppSettings.mockResolvedValue({ ...BOTH_TYPES, access: { answersLocked: true } });
        const event = createMockRequestEvent({ entityType });
        const response = await POST(event);

        expect(response.status).toBe(403);
        expect(await response.json()).toEqual({ error: 'mode_not_allowed' });
        expect(event.cookies.set).not.toHaveBeenCalled();
      }
    );

    it('answers a failed settings read with 503 unavailable and sets no cookie', async () => {
      getAppSettings.mockRejectedValue(new Error('connection refused'));
      const event = createMockRequestEvent({ entityType: 'candidate' });
      const response = await POST(event);

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: 'unavailable' });
      expect(event.cookies.set).not.toHaveBeenCalled();
    });

    it('reads the settings through a data provider on an anonymous client and the request fetch', async () => {
      const event = createMockRequestEvent({ entityType: 'candidate' });
      await POST(event);
      expect(createSupabaseAnonClient).toHaveBeenCalledWith({ fetch: event.fetch });
      expect(createDataProvider).toHaveBeenCalledWith({ fetch: event.fetch, client: { marker: 'anonymous client' } });
    });

    it('returns 400 for a body that is not JSON, and sets no cookie', async () => {
      const event = createMockRequestEvent('not json');
      // Assert the STATUS, not merely that something was thrown: a bare rejection matcher is also satisfied by the 500 the endpoint's own catch arm would return if it swallowed the 400 instead of re-throwing it. `toMatchObject` because kit's HttpError is not an Error subclass.
      await expect(POST(event)).rejects.toMatchObject({ status: 400 });
      expect(event.cookies.set).not.toHaveBeenCalled();
    });
  });

  describe('Signicat', () => {
    beforeEach(() => {
      mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'signicat-ftn';
      mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT = 'https://test.signicat.example/authorize';
    });

    it('generates the PKCE pair, keeps the verifier in an httpOnly cookie and gives the provider its challenge', async () => {
      const event = createMockRequestEvent({ entityType: 'candidate' });
      const response = await POST(event);
      expect(response.status).toBe(200);

      expect(event.cookies.set).toHaveBeenCalledWith(COOKIE.oidcCodeVerifier, expect.any(String), FLOW_COOKIE_OPTIONS);
      const verifier = cookieSet(event, COOKIE.oidcCodeVerifier)!;
      const expected = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
        .toString('base64url')
        .replace(/=+$/, '');

      const { authorizeUrl } = await response.json();
      const url = new URL(authorizeUrl);
      expect(url.searchParams.get('code_challenge')).toBe(expected);
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('ignores a challenge and a redirect the body sends', async () => {
      const event = createMockRequestEvent({
        entityType: 'candidate',
        codeChallenge: 'client-chosen-challenge',
        redirectUri: 'https://attacker.example/steal'
      });
      const { authorizeUrl } = await (await POST(event)).json();
      const url = new URL(authorizeUrl);
      expect(url.searchParams.get('code_challenge')).not.toBe('client-chosen-challenge');
      expect(url.searchParams.get('redirect_uri')).toBe(CALLBACK);
    });

    it('sets the type cookie and no state or nonce cookie', async () => {
      const event = createMockRequestEvent({ entityType: 'candidate' });
      await POST(event);
      expect(cookieSet(event, COOKIE.oidcEntityType)).toBe('candidate');
      expect(cookieSet(event, COOKIE.oidcState)).toBeUndefined();
      expect(cookieSet(event, COOKIE.oidcNonce)).toBeUndefined();
    });

    it('generates a new verifier for every start', async () => {
      const first = createMockRequestEvent({ entityType: 'candidate' });
      const second = createMockRequestEvent({ entityType: 'candidate' });
      await POST(first);
      await POST(second);
      expect(cookieSet(first, COOKIE.oidcCodeVerifier)).not.toBe(cookieSet(second, COOKIE.oidcCodeVerifier));
    });

    it('asks the provider for the locale the request was resolved to, as the ui_locales query parameter', async () => {
      const response = await POST(createMockRequestEvent({ entityType: 'candidate' }, 'sv'));
      const { authorizeUrl } = await response.json();
      expect(new URL(authorizeUrl).searchParams.getAll('ui_locales')).toEqual(['sv']);
    });

    it('refuses a forbidden type before generating anything', async () => {
      const event = createMockRequestEvent({ entityType: 'organization' });
      const response = await POST(event);
      expect(response.status).toBe(403);
      expect(event.cookies.set).not.toHaveBeenCalled();
    });
  });

  it('answers 500 and sets no cookie when the provider cannot build the URL', async () => {
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'signicat-ftn';
    mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT = '';
    const event = createMockRequestEvent({ entityType: 'candidate' });
    await expect(POST(event)).rejects.toMatchObject({ status: 500 });
    expect(event.cookies.set).not.toHaveBeenCalled();
  });
});
