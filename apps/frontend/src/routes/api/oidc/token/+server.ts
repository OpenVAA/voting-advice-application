/**
 * OIDC token exchange endpoint.
 *
 * Exchanges an authorization code for an id_token using the active identity
 * provider. For Signicat, this uses client_secret authentication. For Idura,
 * this uses private_key_jwt client assertion (RFC 7523).
 *
 * The provider abstraction handles all provider-specific token exchange logic.
 * This endpoint validates the resulting id_token, sets it as an httpOnly cookie,
 * and returns a success response.
 */

import { error, json } from '@sveltejs/kit';
import { getActiveProvider } from '$lib/api/utils/auth/providers';
import type { RequestEvent } from '@sveltejs/kit';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

export async function POST({ cookies, request }: RequestEvent): Promise<Response> {
  try {
    const { authorizationCode, codeVerifier, redirectUri } = await request.json();

    const provider = getActiveProvider();
    const { idToken } = await provider.exchangeCodeForToken({ authorizationCode, redirectUri, codeVerifier });

    // Verify the token is valid by extracting claims
    const claims = await provider.getIdTokenClaims(idToken);

    if (!claims.success) {
      return error(401, { message: 'Unauthorized' });
    }

    cookies.set('id_token', idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    return json({ type: 'success' } as DataApiActionResult);
  } catch (e) {
    console.error('Token exchange failed:', e);
    return error(401, { message: 'Unauthorized' });
  }
}

export async function DELETE({ cookies }: RequestEvent): Promise<Response> {
  cookies.delete('id_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });
  return json({ type: 'success' } as DataApiActionResult);
}
