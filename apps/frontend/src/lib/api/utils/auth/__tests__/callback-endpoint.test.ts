/**
 * OIDC callback endpoint tests.
 *
 * Tests the GET handler the identity provider redirects back to. Each provider declares the browser-bound proof its callback requires (`callbackBinding`), and the handler must refuse to exchange a code that arrives without that proof: otherwise an attacker could hand their own authorization code to a victim and sign the victim in as the attacker (login CSRF).
 *
 * The real providers and the real `getActiveProvider` factory drive the route; only their network-facing methods are spied.
 *
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import { GET } from '../../../../../routes/api/oidc/callback/+server';
import { iduraProvider } from '../providers/idura';
import { signicatProvider } from '../providers/signicat';
import type { IdentityProvider } from '../providers/types';

const { mockServerConstants, mockPublicConstants } = vi.hoisted(() => ({
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
  }
}));

vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$env/dynamic/private', () => ({ env: {} }));

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

const PREREGISTER = '/candidate/preregister';
const INVALID_STATE = `${PREREGISTER}?error=invalid_state`;

/**
 * Build a minimal `RequestEvent` for the GET handler.
 *
 * @param query - The callback query string, without the leading `?`.
 * @param initialCookies - Cookies present on the incoming request.
 */
function createEvent(query: string, initialCookies: Record<string, string> = {}) {
  const store = new Map(Object.entries(initialCookies));
  return {
    url: new URL(`http://localhost/api/oidc/callback?${query}`),
    cookies: {
      get: vi.fn((name: string) => store.get(name)),
      set: vi.fn(),
      delete: vi.fn(),
      getAll: vi.fn(() => []),
      serialize: vi.fn()
    },
    locals: { currentLocale: 'en' }
  } as unknown as Parameters<typeof GET>[0] & {
    cookies: { set: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  };
}

/**
 * Spy the network-facing methods of a provider so the route runs without an IdP.
 */
function stubProvider(provider: IdentityProvider) {
  const exchange = vi.spyOn(provider, 'exchangeCodeForToken').mockResolvedValue({ idToken: 'test.id.token' });
  vi.spyOn(provider, 'getIdTokenClaims').mockResolvedValue({
    success: true,
    data: { firstName: 'Test', lastName: 'Candidate', identifier: 'test-sub', extractedClaims: {} }
  });
  return exchange;
}

function idTokenWasSet(event: ReturnType<typeof createEvent>): boolean {
  return event.cookies.set.mock.calls.some(([name]) => name === COOKIE.idToken);
}

describe('GET /api/oidc/callback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Idura (state binding)', () => {
    let exchange: ReturnType<typeof stubProvider>;

    beforeEach(() => {
      mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'idura-ftn';
      exchange = stubProvider(iduraProvider);
    });

    it('rejects a code that arrives without the state cookie', async () => {
      const event = createEvent('code=attacker-code&state=anything');
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: INVALID_STATE });
      expect(exchange).not.toHaveBeenCalled();
      expect(idTokenWasSet(event)).toBe(false);
    });

    it('rejects a callback that carries no state parameter', async () => {
      const event = createEvent('code=c-1', { [COOKIE.oidcState]: 's-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: INVALID_STATE });
      expect(exchange).not.toHaveBeenCalled();
      expect(idTokenWasSet(event)).toBe(false);
    });

    it('rejects a state that differs from the state cookie and clears the flow cookies', async () => {
      const event = createEvent('code=c-1&state=s-2', { [COOKIE.oidcState]: 's-1', [COOKIE.oidcNonce]: 'n-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: INVALID_STATE });
      expect(exchange).not.toHaveBeenCalled();
      expect(idTokenWasSet(event)).toBe(false);
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcState, { path: '/' });
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcNonce, { path: '/' });
    });

    it('exchanges the code and sets the id_token cookie when the state matches', async () => {
      const event = createEvent('code=c-1&state=s-1', { [COOKIE.oidcState]: 's-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: PREREGISTER });
      expect(exchange).toHaveBeenCalledTimes(1);
      expect(exchange).toHaveBeenCalledWith({
        authorizationCode: 'c-1',
        redirectUri: 'http://localhost/api/oidc/callback',
        codeVerifier: undefined
      });
      expect(event.cookies.set).toHaveBeenCalledWith(
        COOKIE.idToken,
        'test.id.token',
        expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'strict', path: '/' })
      );
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcState, { path: '/' });
    });

    it('redirects an IdP error before any binding check', async () => {
      const event = createEvent('error=access_denied');
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: `${PREREGISTER}?error=access_denied` });
      expect(exchange).not.toHaveBeenCalled();
    });

    it('redirects a missing code before any binding check', async () => {
      const event = createEvent('state=s-1');
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: `${PREREGISTER}?error=missing_code` });
      expect(exchange).not.toHaveBeenCalled();
    });
  });

  describe('Signicat (PKCE binding)', () => {
    let exchange: ReturnType<typeof stubProvider>;

    beforeEach(() => {
      mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'signicat-ftn';
      exchange = stubProvider(signicatProvider);
    });

    it('rejects a code that arrives without the PKCE verifier cookie', async () => {
      const event = createEvent('code=attacker-code');
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: INVALID_STATE });
      expect(exchange).not.toHaveBeenCalled();
      expect(idTokenWasSet(event)).toBe(false);
    });

    it('exchanges the code with the verifier and needs no state', async () => {
      const event = createEvent('code=c-1', { [COOKIE.oidcCodeVerifier]: 'v-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: PREREGISTER });
      expect(exchange).toHaveBeenCalledTimes(1);
      expect(exchange).toHaveBeenCalledWith({
        authorizationCode: 'c-1',
        redirectUri: 'http://localhost/api/oidc/callback',
        codeVerifier: 'v-1'
      });
      expect(idTokenWasSet(event)).toBe(true);
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcCodeVerifier, { path: '/' });
    });

    it('redirects an IdP error whatever the cookies are', async () => {
      const event = createEvent('error=access_denied', { [COOKIE.oidcCodeVerifier]: 'v-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: `${PREREGISTER}?error=access_denied` });
      expect(exchange).not.toHaveBeenCalled();
    });

    it('redirects a missing code before any binding check', async () => {
      const event = createEvent('');
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: `${PREREGISTER}?error=missing_code` });
      expect(exchange).not.toHaveBeenCalled();
    });
  });

  describe('provider declarations', () => {
    it('binds Idura callbacks by state and Signicat callbacks by PKCE', () => {
      expect(iduraProvider.callbackBinding).toBe('state');
      expect(signicatProvider.callbackBinding).toBe('pkce');
    });
  });
});
