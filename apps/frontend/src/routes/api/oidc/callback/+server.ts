/**
 * Provider-agnostic OIDC callback endpoint.
 *
 * The identity provider redirects the browser here after authentication with an authorization code in the query string. This handler:
 *
 * 1. Validates the authorization code is present
 * 2. Demands the browser-bound proof the active provider declares in `callbackBinding`: a `state` equal to the `oidc_state` cookie (Idura), or the `oidc_code_verifier` cookie (Signicat PKCE). A callback without that proof is rejected with `invalid_state` before any token request (login CSRF protection)
 * 3. Exchanges the code for an id_token via the active provider
 * 4. Verifies the id_token by extracting claims
 * 5. Sets the `id_token` as an httpOnly cookie
 * 6. Redirects the browser to the preregister page
 *
 * This is an API-style server route (GET handler) -- no client-side JavaScript involved.
 * Both Idura (JAR + private_key_jwt) and Signicat (PKCE + client_secret) flows converge here.
 */

import { redirect } from '@sveltejs/kit';
import { OIDC_ERROR, upstreamOidcError } from '$candidate/utils/oidcError';
import { formatOidcFailure } from '$lib/api/utils/auth/oidcFailure';
import { getActiveProvider } from '$lib/api/utils/auth/providers';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

export async function GET({ url, cookies, locals }: RequestEvent): Promise<never> {
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');
  // Every redirect below names its target by route key and lets the builder assemble the URL, so a route that moves stays reachable from here without a second edit. `error` is not a declared route param, so the builder puts it on the search side and percent-encodes it; no caller here may encode a value first, or it would arrive encoded twice. The builder also hands the result to Paraglide, which prefixes every non-base locale and omits the prefix for the base one, so a visitor who arrived in a non-base locale is now returned to that locale's URL instead of the unprefixed one. The preregistration layout has always built its own redirect this way.
  const locale = locals.currentLocale;

  // Handle IdP errors (user canceled, access denied, etc.)
  if (errorParam) {
    // The value is the provider's, not ours, which is why it goes through the one named widening site rather than through the closed union. It is passed RAW: the builder does the encoding.
    throw redirect(303, buildRoute({ route: 'CandAppPreregister', locale, error: upstreamOidcError(errorParam) }));
  }

  // Validate authorization code is present
  if (!code) {
    throw redirect(303, buildRoute({ route: 'CandAppPreregister', locale, error: OIDC_ERROR.missingCode }));
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
          throw redirect(303, buildRoute({ route: 'CandAppPreregister', locale, error: OIDC_ERROR.invalidState }));
        }
        cookies.delete(COOKIE.oidcState, { path: '/' });
        break;
      }
      case 'pkce': {
        // The preregister page stores the verifier in a cookie so this server route can read it (localStorage is client-only). The provider issues no `state`, so none is required here.
        codeVerifier = cookies.get(COOKIE.oidcCodeVerifier);
        if (!codeVerifier) {
          clearFlowCookies(cookies);
          throw redirect(303, buildRoute({ route: 'CandAppPreregister', locale, error: OIDC_ERROR.invalidState }));
        }
        cookies.delete(COOKIE.oidcCodeVerifier, { path: '/' });
        break;
      }
      default: {
        // Unreachable while every `CallbackBinding` has a case above: the `never` assignment stops compiling when a binding is added without one. A provider whose binding this route cannot check is refused rather than trusted.
        const unhandled: never = provider.callbackBinding;
        console.error('[oidc/callback] Unrecognised callback binding:', unhandled);
        clearFlowCookies(cookies);
        throw redirect(303, buildRoute({ route: 'CandAppPreregister', locale, error: OIDC_ERROR.invalidState }));
      }
    }

    // Exchange the authorization code for an id_token
    const { idToken } = await provider.exchangeCodeForToken({
      authorizationCode: code,
      redirectUri,
      codeVerifier
    });

    // Verify the token is valid by extracting claims
    const claims = await provider.getIdTokenClaims(idToken);
    if (!claims.success) {
      // The OPAQUE failure-class code only. Do not pass the caught error, and do not pass `error.message`: that message carries the incoming kid, and the leak-safety rule on `decryptAndVerifyIdToken` forbids anything more than the code crossing this boundary. (Note the outer catch below deliberately does the opposite -- it logs the whole error, because that path has no coded failure to name.)
      //
      // The code set is OPEN, and the comment that used to stand here said the opposite. It asserted "the set is exactly ERR_JWKS_MALFORMED, ERR_JWKS_EMPTY, ERR_JWK_KID_MISMATCH, ERR_AUDIENCE_UNCONFIGURED and ERR_ISSUER_UNCONFIGURED", while its own dependency's `@throws` tag said "jose's own coded errors flow through unchanged" -- and the provider catch arms, which forward `e.code` for any `Error` carrying one, made the dependency the truthful one. A live Idura callback then logged `ERR_JOSE_GENERIC`, a member of neither that list nor the 'none' placeholder, and the line carried nothing else; the failing stage had to be recovered by reading jose's source. See `.planning/debug/resolved/idura-bank-auth-empty-client.md`, finding 2.
      //
      // `formatOidcFailure` is the repair: it resolves the code -- ours or jose's -- to the STAGE it failed at and a FIXED operator hint naming the environment variable behind it, and it is total over unrecognised codes rather than silently mis-attributing them. It interpolates no value, so it stays safe to log; the provider type is included because selecting the WRONG provider was finding 1 of that same session.
      // 'none' remains the placeholder for a failure carrying no code at all -- a thrown non-`Error`, or an `Error` with its code on `.cause` (Node's `TypeError: fetch failed`). It is the absence of a class, not a class.
      // The redirect below is unchanged and still carries only the opaque `invalid_token`: the server console and the browser URL are different audiences, and nothing from this log line reaches the second.
      console.error('[oidc/callback] ID token claims rejected;', formatOidcFailure(claims.error.code, provider.type));
      throw redirect(303, buildRoute({ route: 'CandAppPreregister', locale, error: OIDC_ERROR.invalidToken }));
    }

    // Clean up nonce cookie (stored by the authorize endpoint for Idura).
    // Nonce verification against the id_token nonce claim is a future enhancement.
    const storedNonce = cookies.get(COOKIE.oidcNonce);
    if (storedNonce) {
      cookies.delete(COOKIE.oidcNonce, { path: '/' });
    }

    // Set the id_token cookie (same pattern as the /api/oidc/token endpoint)
    cookies.set(COOKIE.idToken, idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    // Redirect to the preregister page. This is the one redirect that carries no error value.
    throw redirect(303, buildRoute({ route: 'CandAppPreregister', locale }));
  } catch (e) {
    // Re-throw SvelteKit redirects (they are thrown as exceptions)
    if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
      throw e;
    }
    console.error('Callback token exchange failed:', e);
    throw redirect(303, buildRoute({ route: 'CandAppPreregister', locale, error: OIDC_ERROR.tokenExchangeFailed }));
  }
}

/**
 * Clear every cookie an authorization flow leaves behind, so a rejected callback cannot be retried against the same flow state.
 */
function clearFlowCookies(cookies: Cookies): void {
  cookies.delete(COOKIE.oidcState, { path: '/' });
  cookies.delete(COOKIE.oidcNonce, { path: '/' });
  cookies.delete(COOKIE.oidcCodeVerifier, { path: '/' });
}
