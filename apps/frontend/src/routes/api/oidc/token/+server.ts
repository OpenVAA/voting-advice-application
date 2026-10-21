/**
 * OIDC token exchange endpoint.
 *
 * Exchanges an authorization code for an id_token using the active identity provider. For Signicat, this uses client_secret authentication. For Idura, this uses private_key_jwt client assertion (RFC 7523).
 *
 * The provider abstraction handles all provider-specific token exchange logic.
 * This endpoint validates the resulting id_token, sets it as an httpOnly cookie, and returns a success response.
 */

import { error, isHttpError, json } from '@sveltejs/kit';
import { formatOidcFailure } from '$lib/api/utils/auth/oidcFailure';
import { getActiveProvider } from '$lib/api/utils/auth/providers';
import { COOKIE } from '$lib/cookies';
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
      // The OPAQUE failure-class code only. Do not pass the caught error, and do not pass `error.message`: that message carries the incoming kid, and the leak-safety rule on `decryptAndVerifyIdToken` forbids anything more than the code crossing this boundary. (Note the outer catch below deliberately does the opposite -- it logs the whole error, because that path has no coded failure to name.)
      //
      // The code set is OPEN. The comment that used to stand here named a closed set of five, which its own dependency's `@throws` tag contradicted -- jose's coded errors flow through these providers unchanged -- and a live callback proved it by logging jose's `ERR_JOSE_GENERIC`. `formatOidcFailure` resolves any code, ours or jose's, to its stage and a fixed operator hint naming the environment variable behind it. See `oidcFailure.ts`, and the twin call site in `../callback/+server.ts` which carries the full account.
      // 'none' remains the placeholder for a failure carrying no code at all. It is the absence of a class, not a class.
      // The HTTP surface below is unchanged, and nothing from this log line reaches it.
      console.error('[oidc/token] ID token claims rejected;', formatOidcFailure(claims.error.code, provider.type));
      return error(401, { message: 'Unauthorized' });
    }

    cookies.set(COOKIE.idToken, idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    return json({ type: 'success' } as DataApiActionResult);
  } catch (e) {
    // Same class as `authorize/+server.ts`: the in-`try` 401 at the claims check is thrown by `error()` and would otherwise be re-labelled here as a token-exchange failure. The HTTP outcome is identical either way; the log label is not.
    // Do not simplify this back into the `console.error` below.
    if (isHttpError(e)) throw e;
    console.error('Token exchange failed:', e);
    return error(401, { message: 'Unauthorized' });
  }
}

export async function DELETE({ cookies }: RequestEvent): Promise<Response> {
  cookies.delete(COOKIE.idToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });
  return json({ type: 'success' } as DataApiActionResult);
}
