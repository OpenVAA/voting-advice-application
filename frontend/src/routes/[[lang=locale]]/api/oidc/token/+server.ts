import { getUserInfo } from '@openvaa/app-shared';
import { error, json, text } from '@sveltejs/kit';
import {
  SIGNICAT_CLIENT_SECRET,
  SIGNICAT_JWKS_ENDPOINT,
  SIGNICAT_PRIVATE_KEY,
  SIGNICAT_TOKEN_ENDPOINT} from '$env/static/private';
import { PUBLIC_SIGNICAT_CLIENT_ID } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ cookies, request }: RequestEvent): Promise<Response> {
  const { authorizationCode, redirectUri } = await request.json();

  const signicatResponse = await fetch(SIGNICAT_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: redirectUri,
      client_id: PUBLIC_SIGNICAT_CLIENT_ID,
      client_secret: SIGNICAT_CLIENT_SECRET
    }).toString()
  });

  if (!signicatResponse.ok) {
    return error(401, { message: 'Unauthorized' });
  }

  const { id_token: IDToken } = await signicatResponse.json();

  try {
    const userInfo = await getUserInfo(IDToken, {
      privateEncryptionJWK: JSON.parse(SIGNICAT_PRIVATE_KEY),
      publicSignatureJWKSetUri: SIGNICAT_JWKS_ENDPOINT
    });

    cookies.set('signicat:id_token', IDToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    return json({ userInfo: { ...userInfo, birthdate: undefined } });
  } catch {
    return error(401, { message: 'Unauthorized' });
  }
}

export async function DELETE({ cookies }: RequestEvent): Promise<Response> {
  cookies.delete('signicat:id_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });
  return text('OK');
}
