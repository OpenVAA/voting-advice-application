import { error, json, text } from '@sveltejs/kit';
import {
  IDENTITY_PROVIDER_CLIENT_SECRET,
  IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY,
  IDENTITY_PROVIDER_JWKS_URI,
  IDENTITY_PROVIDER_TOKEN_ENDPOINT
} from '$env/static/private';
import { PUBLIC_IDENTITY_PROVIDER_CLIENT_ID } from '$env/static/public';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ cookies, request }: RequestEvent): Promise<Response> {
  const { authorizationCode, redirectUri } = await request.json();

  const signicatResponse = await fetch(IDENTITY_PROVIDER_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: redirectUri,
      client_id: PUBLIC_IDENTITY_PROVIDER_CLIENT_ID,
      client_secret: IDENTITY_PROVIDER_CLIENT_SECRET
    }).toString()
  });

  if (!signicatResponse.ok) {
    return error(401, { message: 'Unauthorized' });
  }

  const { id_token: idToken } = await signicatResponse.json();

  try {
    const claims = await getIdTokenClaims(idToken, {
      privateEncryptionJWK: JSON.parse(IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY),
      publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI
    });

    cookies.set('id_token', idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    return json({ userInfo: { ...claims, birthdate: undefined } });
  } catch {
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
  return text('OK');
}
