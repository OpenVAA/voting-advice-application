/**
 * Server-side OIDC authorization endpoint: starts the identity provider's flow for the entity type the user registers as.
 *
 * The body is `{ entityType?: string }`; every other key is ignored.
 *
 * 1. The application settings are read anonymously at request time. A read that fails answers 503 `{ error: 'unavailable' }`.
 * 2. The type is checked against the registration matrix before anyone is sent to the provider, through `identityProviderEntityType` over `identityProviderEntityTypes`, the function the registration screen reads the types it offers from. A named type must be in that list; an absent one is taken only when the list holds exactly one. Anything else, and every type while answers are locked, answers 403 `{ error: 'mode_not_allowed' }`.
 * 3. The redirect the provider is given is this endpoint's own origin and the callback's path. For a provider bound by PKCE (Signicat), the verifier and its challenge are generated here and the verifier is kept in an httpOnly cookie, so the browser sends no challenge. Idura's signed request (JAR) is built here too, so its signing keys never reach the browser.
 * 4. The provider is asked to show its screens in the request's locale, `locals.currentLocale`, as `ui_locales`. The registration screen posts under its own locale's prefix, so that locale is the one the page was shown in.
 * 5. The provider's `state` and `nonce`, when it returns them (Idura), and the chosen type are set as httpOnly cookies with the flow's attributes, and the answer is `{ authorizeUrl }`.
 *
 * The type cookie returns with the provider's redirect and is bound to the flow only by the cookie jar and its lifetime. It selects which type the callback asks for and never authorises: every reader checks the matrix again, and the `identity-callback` function's check is the authority.
 */

import { error, isHttpError, json } from '@sveltejs/kit';
import { getActiveProvider } from '$lib/api/utils/auth/providers';
import { COOKIE } from '$lib/cookies';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ cookies, request }: RequestEvent): Promise<Response> {
  try {
    const { redirectUri, codeChallenge } = await request.json();

    if (!redirectUri) {
      return error(400, { message: 'redirectUri is required' });
    }

    const provider = getActiveProvider();
    const result = await provider.getAuthorizeUrl({ redirectUri, codeChallenge });

    // Store state and nonce in httpOnly cookies for verification on callback.
    // Idura returns these from JAR construction; Signicat uses client-side PKCE instead.
    if (result.state) {
      cookies.set(COOKIE.oidcState, result.state, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax', // 'lax' required for cross-origin IdP redirects
        path: '/',
        maxAge: 600 // 10 minutes
      });
    }
    if (result.nonce) {
      cookies.set(COOKIE.oidcNonce, result.nonce, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 600
      });
    }

    return json({ authorizeUrl: result.authorizeUrl });
  } catch (e) {
    // The endpoint's own 4xx contract must survive its own catch: `error()` THROWS, so an in-`try` `error(400, ...)` would otherwise be swallowed and re-reported as a 500. Do not simplify this back into the `console.error` below.
    if (isHttpError(e)) throw e;
    console.error('Failed to construct authorization request:', e);
    return error(500, { message: 'Failed to construct authorization request' });
  }
}
