import { error, json } from '@sveltejs/kit';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import { constants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ cookies, request }: RequestEvent): Promise<Response> {
  const { authorizationCode, codeVerifier, redirectUri } = await request.json();
  const {
    IDENTITY_PROVIDER_CLIENT_SECRET,
    IDENTITY_PROVIDER_DECRYPTION_JWKS,
    IDENTITY_PROVIDER_JWKS_URI,
    IDENTITY_PROVIDER_TOKEN_ENDPOINT,
    IDENTITY_PROVIDER_ISSUER
  } = constants;
  const { PUBLIC_IDENTITY_PROVIDER_CLIENT_ID } = publicConstants;

  const idpResponse = await fetch(IDENTITY_PROVIDER_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      client_id: PUBLIC_IDENTITY_PROVIDER_CLIENT_ID,
      client_secret: IDENTITY_PROVIDER_CLIENT_SECRET
    }).toString()
  });

  if (!idpResponse.ok) {
    return error(401, { message: 'Unauthorized' });
  }

  const { id_token: idToken } = await idpResponse.json();

  const claims = await getIdTokenClaims(idToken, {
    privateEncryptionJWKSet: JSON.parse(IDENTITY_PROVIDER_DECRYPTION_JWKS),
    publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI,
    audience: PUBLIC_IDENTITY_PROVIDER_CLIENT_ID,
    issuer: IDENTITY_PROVIDER_ISSUER
  });

  if (!claims.success) {
    return error(401, { message: 'Unauthorized' });
  }

  cookies.set('id_token', idToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });

  return json({});
}

export async function DELETE({ cookies }: RequestEvent): Promise<Response> {
  cookies.delete('id_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });
  return json({});
}
