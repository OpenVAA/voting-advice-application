/**
 * Provider-agnostic OIDC callback endpoint.
 *
 * The identity provider redirects the browser here after authentication with an
 * authorization code in the query string. This handler:
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
import { getActiveProvider } from '$lib/api/utils/auth/providers';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ url, cookies }: RequestEvent): Promise<never> {
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  // Handle IdP errors (user canceled, access denied, etc.)
  if (errorParam) {
    throw redirect(303, '/candidate/preregister?error=' + encodeURIComponent(errorParam));
  }

  // Validate authorization code is present
  if (!code) {
    throw redirect(303, '/candidate/preregister?error=missing_code');
  }

  // Verify state parameter (CSRF protection).
  // The state cookie is set by the /api/oidc/authorize endpoint for providers that
  // return a state value (Idura). If no stored state exists, skip verification
  // (backward compat with Signicat PKCE which may not store state server-side).
  const storedState = cookies.get('oidc_state');
  if (storedState) {
    if (!returnedState || returnedState !== storedState) {
      cookies.delete('oidc_state', { path: '/' });
      cookies.delete('oidc_nonce', { path: '/' });
      throw redirect(303, '/candidate/preregister?error=invalid_state');
    }
    // Clean up state cookie after successful verification
    cookies.delete('oidc_state', { path: '/' });
  }

  // Read the code_verifier from cookie (for Signicat PKCE flow).
  // The preregister page stores this in a cookie so the server-side callback can access it
  // (localStorage is client-only and not accessible from server routes).
  const codeVerifier = cookies.get('oidc_code_verifier');
  if (codeVerifier) {
    cookies.delete('oidc_code_verifier', { path: '/' });
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
      throw redirect(303, '/candidate/preregister?error=invalid_token');
    }

    // Clean up nonce cookie (stored by the authorize endpoint for Idura).
    // Nonce verification against the id_token nonce claim is a future enhancement.
    const storedNonce = cookies.get('oidc_nonce');
    if (storedNonce) {
      cookies.delete('oidc_nonce', { path: '/' });
    }

    // Set the id_token cookie (same pattern as the /api/oidc/token endpoint)
    cookies.set('id_token', idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    // Redirect to the preregister page
    throw redirect(303, '/candidate/preregister');
  } catch (e) {
    // Re-throw SvelteKit redirects (they are thrown as exceptions)
    if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
      throw e;
    }
    console.error('Callback token exchange failed:', e);
    throw redirect(303, '/candidate/preregister?error=token_exchange_failed');
  }
}
