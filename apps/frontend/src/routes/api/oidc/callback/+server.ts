/**
 * Provider-agnostic OIDC callback endpoint.
 *
 * The identity provider redirects the browser here after authentication with an authorization code in the query string. This handler:
 *
 * 1. Validates the authorization code is present
 * 2. Verifies the `state` parameter against the `oidc_state` cookie (CSRF protection)
 * 3. Reads the `oidc_code_verifier` cookie (for Signicat PKCE flow)
 * 4. Exchanges the code for an id_token via the active provider
 * 5. Verifies the id_token by extracting claims
 * 6. Sets the `id_token` as an httpOnly cookie
 * 7. Redirects the browser to the preregister page
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
import type { RequestEvent } from '@sveltejs/kit';

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

  // Verify state parameter (CSRF protection).
  // The state cookie is set by the /api/oidc/authorize endpoint for providers that return a state value (Idura). If no stored state exists, skip verification (backward compat with Signicat PKCE which may not store state server-side).
  const storedState = cookies.get(COOKIE.oidcState);
  if (storedState) {
    if (!returnedState || returnedState !== storedState) {
      cookies.delete(COOKIE.oidcState, { path: '/' });
      cookies.delete(COOKIE.oidcNonce, { path: '/' });
      throw redirect(303, buildRoute({ route: 'CandAppPreregister', locale, error: OIDC_ERROR.invalidState }));
    }
    // Clean up state cookie after successful verification
    cookies.delete(COOKIE.oidcState, { path: '/' });
  }

  // Read the code_verifier from cookie (for Signicat PKCE flow).
  // The preregister page stores this in a cookie so the server-side callback can access it (localStorage is client-only and not accessible from server routes).
  const codeVerifier = cookies.get(COOKIE.oidcCodeVerifier);
  if (codeVerifier) {
    cookies.delete(COOKIE.oidcCodeVerifier, { path: '/' });
  }

  try {
    const provider = getActiveProvider();
    const redirectUri = url.origin + url.pathname;

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
