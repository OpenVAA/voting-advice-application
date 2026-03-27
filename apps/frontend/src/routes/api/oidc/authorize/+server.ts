/**
 * Server-side OIDC authorization endpoint.
 *
 * Constructs the authorization URL using the active identity provider and returns
 * it to the client. For Idura, this builds a signed JAR (JWT Authorization Request)
 * server-side so that signing keys never reach the browser. For Signicat, this
 * constructs a PKCE authorize URL.
 *
 * If the provider returns `state` and `nonce` values (Idura), they are stored in
 * httpOnly cookies for CSRF and replay protection on callback.
 */

import { json, error } from '@sveltejs/kit';
import { getActiveProvider } from '$lib/api/utils/auth/providers';
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
      cookies.set('oidc_state', result.state, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax', // 'lax' required for cross-origin IdP redirects
        path: '/',
        maxAge: 600 // 10 minutes
      });
    }
    if (result.nonce) {
      cookies.set('oidc_nonce', result.nonce, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 600
      });
    }

    return json({ authorizeUrl: result.authorizeUrl });
  } catch (e) {
    console.error('Failed to construct authorization request:', e);
    return error(500, { message: 'Failed to construct authorization request' });
  }
}
