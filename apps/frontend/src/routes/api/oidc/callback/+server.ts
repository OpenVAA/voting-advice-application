/**
 * The identity provider's callback: the provider redirects the browser here after identification, with an authorization code or an error in the query string.
 *
 * 1. An error the provider reports is mapped to a code first — its cancel to `cancelled`, every other value to `provider_error` — so no value the provider chose reaches an address. The flow cookies are cleared.
 * 2. A callback with no code is `missing_code`, and the flow cookies are cleared.
 * 3. The browser-bound proof the active provider declares in `callbackBinding` is demanded: a `state` equal to the `oidc_state` cookie (Idura), or the `oidc_code_verifier` cookie (Signicat PKCE). A callback without it is `invalid_state`, before any token request, and the flow cookies are cleared.
 * 4. The code is exchanged for an id_token and the token's claims are verified. A rejected token is `invalid_token`; any other failure of the exchange is `token_exchange_failed`.
 * 5. The entity type the flow was started for is checked against the registration matrix again, over the application settings read anonymously as the authorize endpoint reads them, by the function that endpoint decides by (`identityProviderEntityType`): a named type must be served and allow the provider's mode, an absent one is taken only when exactly one served type allows it, and while answers are locked every type is refused. A refusal is `mode_not_allowed`; a failed settings read is `registration_failed`.
 * 6. The `identity-callback` Edge Function is invoked with the id_token, the project and the type, and with this server's secret in the credential header: the function answers this server alone. It decides again, finds or creates the account and its entity, and answers one closed `result` with a sign-in token. A failed answer is mapped to a code by `oidcErrorFromFunction`; an unset or malformed project, and an unset secret, are `configuration_error`, and nothing is invoked.
 * 7. The session is established on this request's own client by verifying the function's token. A failure is `registration_failed`.
 * 8. The arrival marker is set as an httpOnly cookie, `created` when the function made the account's entity and `existing` when it found one, and the browser is sent to the Contestant App's root, where the protected layout shows what the account still lacks.
 *
 * The id_token never reaches the browser: it is exchanged and handed on within this request. The entity type cookie the authorize endpoint set is read once and deleted on every path, the successful one included.
 *
 * Every failure redirects to the identity provider's error screen with one code of `OIDC_ERROR`, which the screen shows as one of three classes. Both Idura (JAR + private_key_jwt) and Signicat (PKCE + client_secret) flows converge here.
 */

import { redirect } from '@sveltejs/kit';
import { OIDC_ERROR, oidcErrorFromFunction, oidcErrorFromProvider } from '$contestant/utils/oidcError';
import { identityProviderEntityType } from '$contestant/utils/registrationOffer';
import { createDataProvider, createSupabaseAnonClient } from '$lib/api/dataProvider';
import { formatOidcFailure } from '$lib/api/utils/auth/oidcFailure';
import { getActiveProvider } from '$lib/api/utils/auth/providers';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import { constants } from '$lib/server/constants';
import type { ContestantAppConfigInput } from '@openvaa/app-shared';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { OidcError } from '$contestant/utils/oidcError';

/** The attributes of the arrival marker: those of the flow's cookies. It is read by the server alone, and lives as long as one return. */
const ARRIVAL_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 600
} as const;

/** The marker each successful `result` of `identity-callback` leaves. */
const ARRIVAL_OF_RESULT: Readonly<Record<string, 'created' | 'existing'>> = Object.freeze({
  created: 'created',
  found: 'existing',
  no_entity: 'existing'
});

export async function GET({ url, cookies, fetch, locals }: RequestEvent): Promise<never> {
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');
  const locale = locals.currentLocale;

  // The entity type the flow was started for selects for this one return alone, so it is read once and removed on every path.
  const requestedType = cookies.get(COOKIE.oidcEntityType);
  cookies.delete(COOKIE.oidcEntityType, { path: '/' });

  if (errorParam) {
    clearFlowCookies(cookies);
    throw redirect(303, errorScreen(oidcErrorFromProvider(errorParam), locale));
  }

  if (!code) {
    clearFlowCookies(cookies);
    throw redirect(303, errorScreen(OIDC_ERROR.missingCode, locale));
  }

  try {
    const provider = getActiveProvider();
    const redirectUri = url.origin + url.pathname;

    // Bind this callback to the browser that started the flow, using the proof the provider declares. Neither binding has a legitimate case for a missing proof: the authorize step always leaves it behind in this browser, so its absence means the code was started elsewhere -- the login-CSRF shape, where an attacker hands their own code to a victim -- or the flow cookie expired. Either way the code is not redeemed.
    let codeVerifier: string | undefined;
    switch (provider.callbackBinding) {
      case 'state': {
        const storedState = cookies.get(COOKIE.oidcState);
        if (!storedState || !returnedState || returnedState !== storedState) {
          clearFlowCookies(cookies);
          throw redirect(303, errorScreen(OIDC_ERROR.invalidState, locale));
        }
        cookies.delete(COOKIE.oidcState, { path: '/' });
        break;
      }
      case 'pkce': {
        // The authorize endpoint keeps the verifier in an httpOnly cookie for this route. The provider issues no `state`, so none is required here.
        codeVerifier = cookies.get(COOKIE.oidcCodeVerifier);
        if (!codeVerifier) {
          clearFlowCookies(cookies);
          throw redirect(303, errorScreen(OIDC_ERROR.invalidState, locale));
        }
        cookies.delete(COOKIE.oidcCodeVerifier, { path: '/' });
        break;
      }
      default: {
        // Unreachable while every `CallbackBinding` has a case above: the `never` assignment stops compiling when a binding is added without one. A provider whose binding this route cannot check is refused rather than trusted.
        const unhandled: never = provider.callbackBinding;
        console.error('[oidc/callback] Unrecognised callback binding:', unhandled);
        clearFlowCookies(cookies);
        throw redirect(303, errorScreen(OIDC_ERROR.invalidState, locale));
      }
    }

    const { idToken } = await provider.exchangeCodeForToken({
      authorizationCode: code,
      redirectUri,
      codeVerifier
    });

    const claims = await provider.getIdTokenClaims(idToken);
    if (!claims.success) {
      // The log names the failure's code, resolved by `formatOidcFailure` to the stage it failed at and a fixed operator hint, and the provider type; it interpolates no value of the token or the error. The address carries only the coarse `invalid_token`.
      console.error('[oidc/callback] ID token claims rejected;', formatOidcFailure(claims.error.code, provider.type));
      throw redirect(303, errorScreen(OIDC_ERROR.invalidToken, locale));
    }

    // The authorize endpoint stores a nonce for Idura; it is cleared here.
    const storedNonce = cookies.get(COOKIE.oidcNonce);
    if (storedNonce) {
      cookies.delete(COOKIE.oidcNonce, { path: '/' });
    }

    throw redirect(303, await register({ idToken, requestedType, cookies, fetch, locals, locale }));
  } catch (e) {
    // A SvelteKit redirect is thrown as an exception, and is passed on.
    if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
      throw e;
    }
    console.error('Callback token exchange failed:', e);
    throw redirect(303, errorScreen(OIDC_ERROR.tokenExchangeFailed, locale));
  }
}

/**
 * Register the identified user through `identity-callback` and sign them in on this request's client.
 *
 * Never throws: every failure is answered with the error screen's address for one closed code, and only that code is logged.
 * @returns The address the browser is sent to: the Contestant App's root on success, the error screen otherwise.
 */
async function register({
  idToken,
  requestedType,
  cookies,
  fetch,
  locals,
  locale
}: {
  idToken: string;
  requestedType: string | undefined;
  cookies: Cookies;
  fetch: typeof globalThis.fetch;
  locals: App.Locals;
  locale: string | undefined;
}): Promise<string> {
  function failed(error: OidcError): string {
    console.error('[oidc/callback] Registration through identity-callback failed:', error);
    return errorScreen(error, locale);
  }

  // Building the provider resolves the project the application is scoped to, and refuses one that is unset or malformed.
  let dataProvider: ReturnType<typeof createDataProvider>;
  try {
    dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });
  } catch {
    return failed(OIDC_ERROR.configurationError);
  }
  const serverSecret = constants.IDENTITY_CALLBACK_SERVER_SECRET;
  if (!serverSecret) return failed(OIDC_ERROR.configurationError);

  let settings: ContestantAppConfigInput;
  try {
    settings = (await dataProvider.getAppSettings()) as ContestantAppConfigInput;
  } catch {
    return failed(OIDC_ERROR.registrationFailed);
  }
  const entityType = identityProviderEntityType(settings, requestedType);
  if (!entityType) return failed(OIDC_ERROR.modeNotAllowed);

  let answer: { result?: unknown; token?: unknown } | undefined;
  try {
    const { data, error } = await locals.supabase.functions.invoke('identity-callback', {
      // The function's `SERVER_CREDENTIAL_HEADER`; its conformance test reads this line.
      headers: { 'x-identity-callback-secret': serverSecret },
      body: { id_token: idToken, project_id: dataProvider.projectId, entity_type: entityType }
    });
    answer = error ? await failedAnswerOf(error) : (data ?? undefined);
  } catch {
    answer = undefined;
  }

  const result = answer?.result;
  const token = answer?.token;
  const arrival =
    typeof result === 'string' && Object.hasOwn(ARRIVAL_OF_RESULT, result) ? ARRIVAL_OF_RESULT[result] : undefined;
  if (!arrival) return failed(oidcErrorFromFunction(result));
  if (typeof token !== 'string' || token === '') return failed(OIDC_ERROR.registrationFailed);

  try {
    const { data, error } = await locals.supabase.auth.verifyOtp({ token_hash: token, type: 'magiclink' });
    if (error || !data.session) return failed(OIDC_ERROR.registrationFailed);
  } catch {
    return failed(OIDC_ERROR.registrationFailed);
  }

  cookies.set(COOKIE.identityProviderArrival, arrival, ARRIVAL_COOKIE_OPTIONS);
  return buildRoute({ route: 'ContestantAppHome', locale });
}

/**
 * The body of a failed `identity-callback` answer. `functions.invoke` keeps the function's response as the error's `context` when the function answered; when it was never reached there is none.
 * @param error - The error `functions.invoke` returned.
 * @returns The answer's body, or `undefined` when there is none that reads as an object.
 */
async function failedAnswerOf(error: unknown): Promise<{ result?: unknown } | undefined> {
  const context = (error as { context?: unknown }).context;
  if (!(context instanceof Response)) return undefined;
  const body: unknown = await context.json().catch(() => undefined);
  return body && typeof body === 'object' ? (body as { result?: unknown }) : undefined;
}

/**
 * The address of the identity provider's error screen for a code, in the request's locale. `error` is not a declared route param, so the builder puts it on the search side.
 */
function errorScreen(error: OidcError, locale: string | undefined): string {
  return buildRoute({ route: 'ContestantAppIdentityProviderError', locale, error });
}

/**
 * Clear every cookie an authorization flow leaves behind, so a rejected callback cannot be retried against the same flow state.
 */
function clearFlowCookies(cookies: Cookies): void {
  cookies.delete(COOKIE.oidcState, { path: '/' });
  cookies.delete(COOKIE.oidcNonce, { path: '/' });
  cookies.delete(COOKIE.oidcCodeVerifier, { path: '/' });
  cookies.delete(COOKIE.oidcEntityType, { path: '/' });
}
