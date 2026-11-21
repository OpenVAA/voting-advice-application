/**
 * The identity provider's callback: the provider redirects the browser here after identification, with an authorization code or an error in the query string.
 *
 * 1. An error the provider reports is mapped to a code first — its cancel to `cancelled`, every other value to `provider_error` — so no value the provider chose reaches an address. The flow cookies are cleared.
 * 2. A callback with no code is `missing_code`, and the flow cookies are cleared.
 * 3. The browser-bound proof the active provider declares in `callbackBinding` is demanded: a `state` equal to the `oidc_state` cookie (Idura), or the `oidc_code_verifier` cookie (Signicat PKCE). A callback without it is `invalid_state`, before any token request, and the flow cookies are cleared.
 * 4. The code is exchanged for an id_token and the token's claims are verified. A rejected token is `invalid_token`; any other failure of the exchange is `token_exchange_failed`.
 * 5. The entity type the flow was started for is checked against the registration matrix again, over the application settings read anonymously as the authorize endpoint reads them, by the function that endpoint decides by (`identityProviderEntityType`): a named type must be served and allow the provider's mode, an absent one is taken only when exactly one served type allows it, and while answers are locked every type is refused. A refusal is `mode_not_allowed`; a failed settings read is `registration_failed`.
 * 6. The `identity-callback` Edge Function is invoked with the id_token, the project and the type, and with this server's secret in the credential header: the function answers this server alone. It decides again, finds or creates the account and its entity, and answers one closed `result` with a sign-in token. A failed answer is mapped to a code by `oidcErrorFromFunction`; an unset or malformed project, and an unset secret, are `configuration_error`, and nothing is invoked.
 * 7. The session is established on this request's own client by verifying the function's token. A failure is `registration_failed`. Once it is set, and not before, every count of the logout modal the request carries is withdrawn in this response, so that no count a closed tab left can end the session just signed in. Every earlier failure leaves the count in place, because it signs nobody in.
 * 8. The arrival marker is set as an httpOnly cookie, `created` when the function made the account's entity and `existing` when it found one, and the browser is sent to the Contestant App's root, where the protected layout shows what the account still lacks.
 *
 * The id_token never reaches the browser: it is exchanged and handed on within this request. The entity type and locale cookies the authorize endpoint set are read once and deleted on every path, the successful one included. Every address this route sends the browser to is in the recorded locale when it is a supported one, and otherwise in the request's own, so a user who started in one locale returns in it.
 *
 * Every failure redirects to the identity provider's error screen with one code of `OIDC_ERROR`, which the screen shows as one of three classes. Both Idura (JAR + private_key_jwt) and Signicat (PKCE + client_secret) flows converge here.
 */

import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { OIDC_ERROR, oidcErrorFromProvider } from '$contestant/utils/oidcError';
import { identityProviderEntityType } from '$contestant/utils/registrationOffer';
import { createDataProvider, createSupabaseAnonClient } from '$lib/api/dataProvider';
import { formatOidcFailure } from '$lib/api/utils/auth/oidcFailure';
import { getActiveProvider } from '$lib/api/utils/auth/providers';
import { COOKIE, OIDC_FLOW_COOKIE_OPTIONS } from '$lib/cookies';
import { isLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import { errorName, invokeIdentityCallback } from '$lib/server/auth/identityCallback';
import { withdrawLogoutDeadline } from '$lib/server/auth/logoutDeadline';
import { constants } from '$lib/server/constants';
import type { ContestantAppSettingsInput } from '@openvaa/app-shared';
import type { Cookies, RequestEvent } from '@sveltejs/kit';
import type { OidcError } from '$contestant/utils/oidcError';

export async function GET(event: RequestEvent): Promise<never> {
  const { url, cookies, request, fetch, locals } = event;
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  // The entity type and the locale the flow was started with select for this one return alone, so each is read once and removed on every path.
  const requestedType = cookies.get(COOKIE.oidcEntityType);
  cookies.delete(COOKIE.oidcEntityType, { path: '/' });
  const locale = flowLocale(cookies.get(COOKIE.oidcLocale), locals.currentLocale);
  cookies.delete(COOKIE.oidcLocale, { path: '/' });

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
        log.error(`[oidc/callback] Unrecognised callback binding: ${String(unhandled)}`);
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
      log.error(`[oidc/callback] ID token claims rejected; ${formatOidcFailure(claims.error.code, provider.type)}`);
      throw redirect(303, errorScreen(OIDC_ERROR.invalidToken, locale));
    }

    // The authorize endpoint stores a nonce for Idura; it is cleared here.
    const storedNonce = cookies.get(COOKIE.oidcNonce);
    if (storedNonce) {
      cookies.delete(COOKIE.oidcNonce, { path: '/' });
    }

    throw redirect(
      303,
      await signInThroughIdentityCallback({ idToken, requestedType, cookies, request, url, fetch, locals, locale })
    );
  } catch (e) {
    // A SvelteKit redirect is thrown as an exception, and is passed on.
    if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
      throw e;
    }
    log.error('[oidc/callback] Callback token exchange failed', { err: e });
    throw redirect(303, errorScreen(OIDC_ERROR.tokenExchangeFailed, locale));
  }
}

/**
 * The locale the flow lands in: the one the authorize endpoint recorded when it is a supported locale, otherwise the request's own.
 * @param recorded - The value of the flow's locale cookie, if any.
 * @param current - The locale this request was resolved to.
 */
function flowLocale(recorded: string | undefined, current: string): string {
  return isLocale(recorded) ? recorded : current;
}

/**
 * Clear every cookie an authorization flow leaves behind, so a rejected callback cannot be retried against the same flow state.
 */
function clearFlowCookies(cookies: Cookies): void {
  cookies.delete(COOKIE.oidcState, { path: '/' });
  cookies.delete(COOKIE.oidcNonce, { path: '/' });
  cookies.delete(COOKIE.oidcCodeVerifier, { path: '/' });
  cookies.delete(COOKIE.oidcEntityType, { path: '/' });
  cookies.delete(COOKIE.oidcLocale, { path: '/' });
}

/**
 * The address of the identity provider's error screen for a code, in the request's locale. `error` is not a declared route param, so the builder puts it on the search side.
 */
function errorScreen(error: OidcError, locale: string | undefined): string {
  return buildRoute({ route: 'ContestantAppIdentityProviderError', locale, error });
}

/**
 * Register the identified user through `identity-callback` and sign them in on this request's client.
 *
 * Once `verifyOtp` has set the session, the logout count the request carries is withdrawn, through `cookies`, `request` and `url`, before the arrival marker is set. A failure before that point leaves the count in place.
 *
 * Never throws: every failure is answered with the error screen's address for one closed code. The log names that code and a fixed cause for the operator: the stage that failed, or the cause `invokeIdentityCallback` gives. No value of the tokens and no message the function or the auth service sent is logged.
 * @returns The address the browser is sent to: the Contestant App's root on success, the error screen otherwise.
 */
async function signInThroughIdentityCallback({
  idToken,
  requestedType,
  cookies,
  request,
  url,
  fetch,
  locals,
  locale
}: {
  idToken: string;
  requestedType: string | undefined;
  cookies: Cookies;
  request: Request;
  url: URL;
  fetch: typeof globalThis.fetch;
  locals: App.Locals;
  locale: string | undefined;
}): Promise<string> {
  function failed(error: OidcError, cause: string): string {
    log.error(`[oidc/callback] Registration through identity-callback failed: ${error} (${cause})`);
    return errorScreen(error, locale);
  }

  // Building the provider resolves the project the application is scoped to, and refuses one that is unset or malformed.
  let dataProvider: ReturnType<typeof createDataProvider>;
  try {
    dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });
  } catch {
    return failed(OIDC_ERROR.configurationError, 'project id unset or malformed');
  }
  const serverSecret = constants.IDENTITY_CALLBACK_SERVER_SECRET;
  if (!serverSecret)
    return failed(OIDC_ERROR.configurationError, 'IDENTITY_CALLBACK_SERVER_SECRET unset on the frontend server');

  let settings: ContestantAppSettingsInput;
  try {
    settings = (await dataProvider.getAppSettings()) as ContestantAppSettingsInput;
  } catch {
    return failed(OIDC_ERROR.registrationFailed, 'app settings read failed');
  }
  const entityType = identityProviderEntityType(settings, requestedType);
  if (!entityType) return failed(OIDC_ERROR.modeNotAllowed, 'entity type not allowed');

  const outcome = await invokeIdentityCallback({
    supabase: locals.supabase,
    serverSecret,
    idToken,
    projectId: dataProvider.projectId,
    entityType
  });
  if (!outcome.ok) return failed(outcome.error, outcome.cause);

  try {
    const { data, error } = await locals.supabase.auth.verifyOtp({ token_hash: outcome.token, type: 'magiclink' });
    if (error) return failed(OIDC_ERROR.registrationFailed, 'the sign-in token was not verified');
    if (!data.session) return failed(OIDC_ERROR.registrationFailed, 'the verified sign-in token gave no session');
  } catch (e) {
    return failed(OIDC_ERROR.registrationFailed, `the sign-in token's verification threw ${errorName(e)}`);
  }

  withdrawLogoutDeadline({ cookies, request, url });
  cookies.set(COOKIE.identityProviderArrival, outcome.arrival, OIDC_FLOW_COOKIE_OPTIONS);
  return buildRoute({ route: 'ContestantAppHome', locale });
}
