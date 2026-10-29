/**
 * OIDC callback endpoint tests.
 *
 * Tests the GET handler the identity provider redirects back to. Each provider declares the browser-bound proof its callback requires (`callbackBinding`), and the handler must refuse to exchange a code that arrives without that proof: otherwise an attacker could hand their own authorization code to a victim and sign the victim in as the attacker (login CSRF).
 *
 * Every failure lands on the identity provider's error screen with one code of the closed set, and no value the provider sent reaches the address: its cancel is `cancelled`, any other value `provider_error`.
 *
 * After the token is verified the route registers the user: it checks the entity type the flow was started for against the registration matrix again, invokes `identity-callback` with the token, the project and the type and with the server's secret in the credential header, establishes the session from the token the function answers with, leaves the arrival marker and sends the browser to the Contestant App's root. The ID token is never set in a cookie. Every failure of that part is one closed code, and no message the function or the auth service sent reaches the address or a log line.
 *
 * The real providers and the real `getActiveProvider` factory drive the route; only their network-facing methods are spied. The data provider the route reads the settings and the project through is replaced, and so is the request's Supabase client.
 *
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import { GET } from '../../../../../routes/api/oidc/callback/+server';
import { iduraProvider } from '../providers/idura';
import { signicatProvider } from '../providers/signicat';
import type { IdentityProvider } from '../providers/types';

const { SERVER_SECRET, mockServerConstants, mockPublicConstants } = vi.hoisted(() => ({
  SERVER_SECRET: 'test-server-secret',
  mockServerConstants: {
    IDURA_SIGNING_JWKS: '[]',
    IDURA_SIGNING_KEY_KID: 'test-signing-kid',
    IDURA_DOMAIN: 'test.idura.broker',
    IDENTITY_PROVIDER_DECRYPTION_JWKS: '[]',
    IDENTITY_PROVIDER_JWKS_URI: 'https://test.idura.broker/.well-known/jwks',
    IDENTITY_PROVIDER_ISSUER: 'https://test.idura.broker',
    IDENTITY_PROVIDER_TOKEN_ENDPOINT: 'https://test.idura.broker/oauth2/token',
    IDENTITY_PROVIDER_CLIENT_SECRET: '',
    IDENTITY_CALLBACK_SERVER_SECRET: 'test-server-secret',
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

const { createDataProvider, getAppSettings, invoke, verifyOtp } = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  getAppSettings: vi.fn(),
  invoke: vi.fn(),
  verifyOtp: vi.fn()
}));

vi.mock('$lib/api/dataProvider', () => ({
  createDataProvider,
  createSupabaseAnonClient: () => ({})
}));

const PROJECT_ID = '00000000-0000-4000-8000-0000000000aa';
const SIGN_IN_TOKEN = 'function-sign-in-token';
const HOME = buildRoute({ route: 'ContestantAppHome', locale: 'en' });
const ERROR_SCREEN = '/contestant/register/identity-provider/error';

/** The error screen's address for a code. */
function errorScreen(code: string): string {
  return `${ERROR_SCREEN}?error=${code}`;
}

const INVALID_STATE = errorScreen('invalid_state');

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
    fetch: vi.fn(),
    locals: { currentLocale: 'en', supabase: { functions: { invoke }, auth: { verifyOtp } } }
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

/** Whether any cookie the route set holds the provider's ID token as its value. */
function tokenWasSetInACookie(event: ReturnType<typeof createEvent>): boolean {
  return event.cookies.set.mock.calls.some(([, value]) => value === 'test.id.token');
}

/** Settings serving the given types, each allowing the given modes. */
function settingsAllowing(modes: Partial<Record<'candidate' | 'organization', Array<string>>>) {
  return {
    contestantApp: {
      entityTypes: Object.keys(modes),
      registrationModes: modes
    }
  };
}

/** An answer of `identity-callback` as `functions.invoke` resolves it for a 2xx response. */
function functionAnswered(body: Record<string, unknown>) {
  return { data: body, error: null };
}

/** A failed answer of `identity-callback` as `functions.invoke` resolves it: the function's response is the error's `context`. */
function functionFailed(status: number, body: unknown) {
  return {
    data: null,
    error: Object.assign(new Error('Edge Function returned a non-2xx status code'), {
      context: new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
    })
  };
}

/** The arrival marker the route set, with its options, or `undefined` when it set none. */
function arrivalSet(event: ReturnType<typeof createEvent>): [unknown, unknown] | undefined {
  const call = event.cookies.set.mock.calls.find(([name]) => name === COOKIE.identityProviderArrival);
  return call ? [call[1], call[2]] : undefined;
}

describe('GET /api/oidc/callback', () => {
  beforeEach(() => {
    createDataProvider.mockReturnValue({ projectId: PROJECT_ID, getAppSettings });
    getAppSettings.mockResolvedValue(settingsAllowing({ candidate: ['identity_provider', 'email'] }));
    invoke.mockResolvedValue(functionAnswered({ result: 'created', token: SIGN_IN_TOKEN }));
    verifyOtp.mockResolvedValue({ data: { session: { access_token: 'a' }, user: {} }, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
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
      expect(tokenWasSetInACookie(event)).toBe(false);
    });

    it('rejects a callback that carries no state parameter', async () => {
      const event = createEvent('code=c-1', { [COOKIE.oidcState]: 's-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: INVALID_STATE });
      expect(exchange).not.toHaveBeenCalled();
      expect(tokenWasSetInACookie(event)).toBe(false);
    });

    it('rejects a state that differs from the state cookie and clears the flow cookies', async () => {
      const event = createEvent('code=c-1&state=s-2', { [COOKIE.oidcState]: 's-1', [COOKIE.oidcNonce]: 'n-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: INVALID_STATE });
      expect(exchange).not.toHaveBeenCalled();
      expect(tokenWasSetInACookie(event)).toBe(false);
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcState, { path: '/' });
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcNonce, { path: '/' });
    });

    it('exchanges the code when the state matches, registers the user and sends them to the app root, setting no cookie that holds the token', async () => {
      const event = createEvent('code=c-1&state=s-1', { [COOKIE.oidcState]: 's-1', [COOKIE.oidcNonce]: 'n-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: HOME });
      expect(exchange).toHaveBeenCalledTimes(1);
      expect(exchange).toHaveBeenCalledWith({
        authorizationCode: 'c-1',
        redirectUri: 'http://localhost/api/oidc/callback',
        codeVerifier: undefined
      });
      expect(tokenWasSetInACookie(event)).toBe(false);
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcState, { path: '/' });
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcNonce, { path: '/' });
    });

    it("reports the provider's cancel as cancelled, before any binding check", async () => {
      const event = createEvent('error=access_denied');
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('cancelled') });
      expect(exchange).not.toHaveBeenCalled();
    });

    it.each(['server_error', 'login_required', 'temporarily_unavailable'])(
      "reports the provider's %s as provider_error",
      async (value) => {
        const event = createEvent(`error=${value}`);
        await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('provider_error') });
        expect(exchange).not.toHaveBeenCalled();
      }
    );

    it('puts no part of a value the provider chose on the address', async () => {
      const crafted = 'crafted-marker-1234';
      const event = createEvent(`error=${encodeURIComponent(`<b>${crafted}</b>`)}`);
      const thrown = await GET(event).catch((e: unknown) => e);
      expect(thrown).toMatchObject({ status: 303, location: errorScreen('provider_error') });
      expect(JSON.stringify(thrown)).not.toContain(crafted);
    });

    it('reports a missing code as missing_code, before any binding check', async () => {
      const event = createEvent('state=s-1');
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('missing_code') });
      expect(exchange).not.toHaveBeenCalled();
    });

    it.each([
      ['a provider error', 'error=server_error&state=s-1'],
      ['a missing code', 'state=s-1']
    ])('clears the flow cookies on %s, so the flow state cannot be retried', async (_name, query) => {
      const event = createEvent(query, { [COOKIE.oidcState]: 's-1', [COOKIE.oidcNonce]: 'n-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303 });
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcState, { path: '/' });
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcNonce, { path: '/' });
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcCodeVerifier, { path: '/' });
    });

    it('reports a rejected token as invalid_token and sets no cookie that holds the token', async () => {
      vi.spyOn(iduraProvider, 'getIdTokenClaims').mockResolvedValue({
        success: false,
        error: { code: 'ERR_JOSE_GENERIC' }
      } as unknown as Awaited<ReturnType<IdentityProvider['getIdTokenClaims']>>);
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const event = createEvent('code=c-1&state=s-1', { [COOKIE.oidcState]: 's-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('invalid_token') });
      expect(tokenWasSetInACookie(event)).toBe(false);
    });

    it('reports a failed exchange as token_exchange_failed and sets no cookie that holds the token', async () => {
      exchange.mockRejectedValue(new Error('exchange failed'));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const event = createEvent('code=c-1&state=s-1', { [COOKIE.oidcState]: 's-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('token_exchange_failed') });
      expect(tokenWasSetInACookie(event)).toBe(false);
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
      expect(tokenWasSetInACookie(event)).toBe(false);
    });

    it('exchanges the code with the verifier, needs no state, and registers the user', async () => {
      const event = createEvent('code=c-1', { [COOKIE.oidcCodeVerifier]: 'v-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: HOME });
      expect(exchange).toHaveBeenCalledTimes(1);
      expect(exchange).toHaveBeenCalledWith({
        authorizationCode: 'c-1',
        redirectUri: 'http://localhost/api/oidc/callback',
        codeVerifier: 'v-1'
      });
      expect(invoke).toHaveBeenCalledTimes(1);
      expect(tokenWasSetInACookie(event)).toBe(false);
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcCodeVerifier, { path: '/' });
    });

    it("reports the provider's cancel as cancelled whatever the cookies are", async () => {
      const event = createEvent('error=access_denied', { [COOKIE.oidcCodeVerifier]: 'v-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('cancelled') });
      expect(exchange).not.toHaveBeenCalled();
    });

    it('reports any other provider value as provider_error whatever the cookies are', async () => {
      const event = createEvent('error=server_error', { [COOKIE.oidcCodeVerifier]: 'v-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('provider_error') });
      expect(exchange).not.toHaveBeenCalled();
    });

    it('reports a missing code as missing_code, before any binding check', async () => {
      const event = createEvent('');
      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('missing_code') });
      expect(exchange).not.toHaveBeenCalled();
    });

    it.each([
      ['a provider error', 'error=server_error'],
      ['a missing code', '']
    ])('clears the verifier cookie on %s, so the flow state cannot be retried', async (_name, query) => {
      const event = createEvent(query, { [COOKIE.oidcCodeVerifier]: 'v-1' });
      await expect(GET(event)).rejects.toMatchObject({ status: 303 });
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcCodeVerifier, { path: '/' });
    });
  });

  describe('the entity type cookie', () => {
    /** Whether the type cookie was deleted on the path the event took. */
    function typeCookieDeleted(event: ReturnType<typeof createEvent>): boolean {
      return event.cookies.delete.mock.calls.some(
        ([name, options]) => name === COOKIE.oidcEntityType && (options as { path?: string })?.path === '/'
      );
    }

    const TYPE = { [COOKIE.oidcEntityType]: 'candidate' };

    describe('Idura', () => {
      let exchange: ReturnType<typeof stubProvider>;

      beforeEach(() => {
        mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'idura-ftn';
        exchange = stubProvider(iduraProvider);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
      });

      it.each<[string, string, Record<string, string>, () => void]>([
        ["the provider's cancel", 'error=access_denied', { [COOKIE.oidcState]: 's-1' }, () => undefined],
        ['another provider value', 'error=server_error', { [COOKIE.oidcState]: 's-1' }, () => undefined],
        ['a missing code', 'state=s-1', { [COOKIE.oidcState]: 's-1' }, () => undefined],
        ['a missing state cookie', 'code=c-1&state=s-1', {}, () => undefined],
        ['a state that differs', 'code=c-1&state=s-2', { [COOKIE.oidcState]: 's-1' }, () => undefined],
        [
          'a rejected token',
          'code=c-1&state=s-1',
          { [COOKIE.oidcState]: 's-1' },
          () =>
            vi.spyOn(iduraProvider, 'getIdTokenClaims').mockResolvedValue({
              success: false,
              error: { code: 'ERR_JOSE_GENERIC' }
            } as unknown as Awaited<ReturnType<IdentityProvider['getIdTokenClaims']>>)
        ],
        [
          'a failed exchange',
          'code=c-1&state=s-1',
          { [COOKIE.oidcState]: 's-1' },
          () => exchange.mockRejectedValue(new Error('exchange failed'))
        ],
        ['a success', 'code=c-1&state=s-1', { [COOKIE.oidcState]: 's-1' }, () => undefined]
      ])('deletes the type cookie on %s', async (_name, query, cookies, arrange) => {
        arrange();
        const event = createEvent(query, { ...cookies, ...TYPE });
        await expect(GET(event)).rejects.toMatchObject({ status: 303 });
        expect(typeCookieDeleted(event)).toBe(true);
      });
    });

    describe('Signicat', () => {
      beforeEach(() => {
        mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'signicat-ftn';
        stubProvider(signicatProvider);
      });

      it.each<[string, string, Record<string, string>]>([
        ['a missing verifier cookie', 'code=c-1', {}],
        ['a success', 'code=c-1', { [COOKIE.oidcCodeVerifier]: 'v-1' }]
      ])('deletes the type cookie on %s', async (_name, query, cookies) => {
        const event = createEvent(query, { ...cookies, ...TYPE });
        await expect(GET(event)).rejects.toMatchObject({ status: 303 });
        expect(typeCookieDeleted(event)).toBe(true);
      });
    });
  });

  describe('registration through identity-callback', () => {
    /** A callback that passes the binding and the token check, with the given extra cookies. */
    function verifiedCallback(cookies: Record<string, string> = {}) {
      return createEvent('code=c-1&state=s-1', { [COOKIE.oidcState]: 's-1', ...cookies });
    }

    beforeEach(() => {
      mockPublicConstants.PUBLIC_IDENTITY_PROVIDER_TYPE = 'idura-ftn';
      stubProvider(iduraProvider);
    });

    it("invokes the function once with the server's secret, the token, the project and the type, and nothing else", async () => {
      await GET(verifiedCallback({ [COOKIE.oidcEntityType]: 'candidate' })).catch(() => undefined);

      expect(invoke.mock.calls).toEqual([
        [
          'identity-callback',
          {
            headers: { 'x-identity-callback-secret': SERVER_SECRET },
            body: { id_token: 'test.id.token', project_id: PROJECT_ID, entity_type: 'candidate' }
          }
        ]
      ]);
    });

    it('answers an unset server secret as configuration_error, invoking nothing and signing nobody in', async () => {
      mockServerConstants.IDENTITY_CALLBACK_SERVER_SECRET = '';
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const event = verifiedCallback();

      try {
        await expect(GET(event)).rejects.toMatchObject({
          status: 303,
          location: errorScreen('configuration_error')
        });
      } finally {
        mockServerConstants.IDENTITY_CALLBACK_SERVER_SECRET = SERVER_SECRET;
      }
      expect(invoke).not.toHaveBeenCalled();
      expect(verifyOtp).not.toHaveBeenCalled();
      expect(arrivalSet(event)).toBeUndefined();
    });

    it("establishes the session from the function's token on the request's client, after the invoke", async () => {
      await GET(verifiedCallback()).catch(() => undefined);

      expect(verifyOtp.mock.calls).toEqual([[{ token_hash: SIGN_IN_TOKEN, type: 'magiclink' }]]);
      expect(invoke.mock.invocationCallOrder[0]).toBeLessThan(verifyOtp.mock.invocationCallOrder[0]);
    });

    it.each<[string, string]>([
      ['created', 'created'],
      ['found', 'existing'],
      ['no_entity', 'existing']
    ])(
      "leaves the marker %s answers as %s, httpOnly with the flow cookies' attributes, and sends the user to the app root",
      async (result, marker) => {
        invoke.mockResolvedValue(functionAnswered({ result, token: SIGN_IN_TOKEN }));
        const event = verifiedCallback();

        await expect(GET(event)).rejects.toMatchObject({ status: 303, location: HOME });

        expect(arrivalSet(event)).toEqual([
          marker,
          { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600 }
        ]);
        expect(tokenWasSetInACookie(event)).toBe(false);
      }
    );

    it('sets the marker only after the session is established', async () => {
      const event = verifiedCallback();
      await GET(event).catch(() => undefined);

      const setOrder =
        event.cookies.set.mock.invocationCallOrder[
          event.cookies.set.mock.calls.findIndex(([name]) => name === COOKIE.identityProviderArrival)
        ];
      expect(verifyOtp.mock.invocationCallOrder[0]).toBeLessThan(setOrder);
    });

    it('reads the type cookie and deletes it', async () => {
      const event = verifiedCallback({ [COOKIE.oidcEntityType]: 'candidate' });
      await GET(event).catch(() => undefined);

      expect(event.cookies.get).toHaveBeenCalledWith(COOKIE.oidcEntityType);
      expect(event.cookies.delete).toHaveBeenCalledWith(COOKIE.oidcEntityType, { path: '/' });
    });

    it('takes the one type that allows the provider when the type cookie is absent', async () => {
      getAppSettings.mockResolvedValue(settingsAllowing({ candidate: ['email'], organization: ['identity_provider'] }));
      await expect(GET(verifiedCallback())).rejects.toMatchObject({ status: 303, location: HOME });

      expect(invoke.mock.calls[0][1]).toEqual({
        headers: { 'x-identity-callback-secret': SERVER_SECRET },
        body: { id_token: 'test.id.token', project_id: PROJECT_ID, entity_type: 'organization' }
      });
    });

    it('registers the type the cookie names when the matrix allows it', async () => {
      getAppSettings.mockResolvedValue(
        settingsAllowing({ candidate: ['identity_provider'], organization: ['identity_provider'] })
      );
      await expect(GET(verifiedCallback({ [COOKIE.oidcEntityType]: 'organization' }))).rejects.toMatchObject({
        status: 303,
        location: HOME
      });

      expect((invoke.mock.calls[0][1] as { body: { entity_type: string } }).body.entity_type).toBe('organization');
    });

    it.each<[string, Record<string, string>, Parameters<typeof settingsAllowing>[0]]>([
      [
        'a type the matrix forbids',
        { [COOKIE.oidcEntityType]: 'organization' },
        { candidate: ['identity_provider'], organization: ['email'] }
      ],
      [
        'a type the project does not serve',
        { [COOKIE.oidcEntityType]: 'organization' },
        { candidate: ['identity_provider'] }
      ],
      ['an unknown type', { [COOKIE.oidcEntityType]: 'constructor' }, { candidate: ['identity_provider'] }],
      [
        'no type, with two types allowing the provider',
        {},
        { candidate: ['identity_provider'], organization: ['identity_provider'] }
      ],
      ['no type, with none allowing the provider', {}, { candidate: ['email'] }]
    ])('refuses %s as mode_not_allowed, invoking nothing and signing nobody in', async (_, cookies, modes) => {
      getAppSettings.mockResolvedValue(settingsAllowing(modes));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const event = verifiedCallback(cookies);

      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('mode_not_allowed') });

      expect(invoke).not.toHaveBeenCalled();
      expect(verifyOtp).not.toHaveBeenCalled();
      expect(arrivalSet(event)).toBeUndefined();
    });

    it('refuses every type as mode_not_allowed while answers are locked, invoking nothing', async () => {
      getAppSettings.mockResolvedValue({
        ...settingsAllowing({ candidate: ['identity_provider'], organization: ['identity_provider'] }),
        access: { answersLocked: true }
      });
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const event = verifiedCallback({ [COOKIE.oidcEntityType]: 'candidate' });

      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('mode_not_allowed') });

      expect(invoke).not.toHaveBeenCalled();
      expect(verifyOtp).not.toHaveBeenCalled();
      expect(arrivalSet(event)).toBeUndefined();
    });

    it('answers a failed settings read as registration_failed, invoking nothing', async () => {
      getAppSettings.mockRejectedValue(new Error('settings unavailable'));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(GET(verifiedCallback())).rejects.toMatchObject({
        status: 303,
        location: errorScreen('registration_failed')
      });
      expect(invoke).not.toHaveBeenCalled();
    });

    it('answers a project that cannot be resolved as configuration_error, invoking nothing', async () => {
      createDataProvider.mockImplementation(() => {
        throw new Error('PUBLIC_PROJECT_ID is required but not set.');
      });
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(GET(verifiedCallback())).rejects.toMatchObject({
        status: 303,
        location: errorScreen('configuration_error')
      });
      expect(invoke).not.toHaveBeenCalled();
    });

    it.each<[string, number, unknown, string]>([
      ['a refused mode', 403, { result: 'mode_not_allowed' }, 'mode_not_allowed'],
      ['a rejected token', 401, { result: 'invalid_token' }, 'invalid_token'],
      ['a refused credential', 401, { result: 'refused' }, 'configuration_error'],
      ['a request it could not read', 400, { result: 'bad_request' }, 'configuration_error'],
      ['its configuration', 500, { result: 'configuration' }, 'configuration_error'],
      ['an outage', 503, { result: 'unavailable' }, 'registration_failed'],
      ['an unknown result', 500, { result: 'something-else' }, 'registration_failed'],
      ['a body that is not JSON', 502, 'not json', 'registration_failed']
    ])('maps a failed answer for %s to %s, and signs nobody in', async (_, status, body, code) => {
      invoke.mockResolvedValue(functionFailed(status, body));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const event = verifiedCallback();

      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen(code) });

      expect(verifyOtp).not.toHaveBeenCalled();
      expect(arrivalSet(event)).toBeUndefined();
    });

    it('answers a function that was never reached as registration_failed', async () => {
      invoke.mockResolvedValue({ data: null, error: new Error('Failed to send a request to the Edge Function') });
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(GET(verifiedCallback())).rejects.toMatchObject({
        status: 303,
        location: errorScreen('registration_failed')
      });
    });

    it('answers an invoke that rejects as registration_failed', async () => {
      invoke.mockRejectedValue(new Error('network down'));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      await expect(GET(verifiedCallback())).rejects.toMatchObject({
        status: 303,
        location: errorScreen('registration_failed')
      });
    });

    it.each<[string, Record<string, unknown>]>([
      ['no token', { result: 'created' }],
      ['an empty token', { result: 'found', token: '' }],
      ['a token that is not text', { result: 'found', token: 42 }],
      ['an unknown result', { result: 'maybe', token: SIGN_IN_TOKEN }],
      ['no result', { token: SIGN_IN_TOKEN }]
    ])('answers a successful status with %s as registration_failed', async (_, body) => {
      invoke.mockResolvedValue(functionAnswered(body));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const event = verifiedCallback();

      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('registration_failed') });

      expect(verifyOtp).not.toHaveBeenCalled();
      expect(arrivalSet(event)).toBeUndefined();
    });

    it.each<[string, () => void]>([
      [
        'the verification fails',
        () =>
          verifyOtp.mockResolvedValue({ data: { session: null, user: null }, error: new Error('Token has expired') })
      ],
      [
        'the verification gives no session',
        () => verifyOtp.mockResolvedValue({ data: { session: null, user: null }, error: null })
      ],
      ['the verification rejects', () => verifyOtp.mockRejectedValue(new Error('auth unreachable'))]
    ])('answers registration_failed and leaves no marker when %s', async (_, arrange) => {
      arrange();
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const event = verifiedCallback();

      await expect(GET(event)).rejects.toMatchObject({ status: 303, location: errorScreen('registration_failed') });

      expect(arrivalSet(event)).toBeUndefined();
    });

    it('puts no message the function or the auth service sent on the address or in a log line', async () => {
      const crafted = 'crafted-message-5678';
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      invoke.mockResolvedValue(functionFailed(503, { result: 'unavailable', error: crafted }));

      const first = await GET(verifiedCallback()).catch((e: unknown) => e);

      invoke.mockResolvedValue(functionAnswered({ result: 'created', token: SIGN_IN_TOKEN }));
      verifyOtp.mockResolvedValue({ data: { session: null, user: null }, error: new Error(crafted) });
      const second = await GET(verifiedCallback()).catch((e: unknown) => e);

      expect(JSON.stringify([first, second])).not.toContain(crafted);
      expect(JSON.stringify(error.mock.calls)).not.toContain(crafted);
      expect(JSON.stringify(error.mock.calls)).not.toContain(SIGN_IN_TOKEN);
      expect(JSON.stringify(error.mock.calls)).not.toContain('test.id.token');
    });
  });

  describe('provider declarations', () => {
    it('binds Idura callbacks by state and Signicat callbacks by PKCE', () => {
      expect(iduraProvider.callbackBinding).toBe('state');
      expect(signicatProvider.callbackBinding).toBe('pkce');
    });
  });
});
