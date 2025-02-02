import { json } from '@sveltejs/kit';
import {
  BACKEND_API_TOKEN,
  IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY,
  IDENTITY_PROVIDER_JWKS_URI
} from '$env/static/private';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import { constants } from '$lib/utils/constants';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

export async function POST({ cookies, request }) {
  const data: { email: string; electionsId?: Array<number>; constituencyId?: number } = await request.json();

  const idToken = cookies.get('id_token');

  if (!idToken) {
    return json({ code: 401, type: 'failure' } as DataApiActionResult);
  }

  const claims = await getIdTokenClaims(idToken, {
    privateEncryptionJWK: JSON.parse(IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY),
    publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI
  });

  await fetch(`${constants.PUBLIC_SERVER_BACKEND_URL}/api/auth/candidate/preregister`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${BACKEND_API_TOKEN}`
    },
    body: JSON.stringify({
      email: data.email,
      firstName: claims.firstName,
      lastName: claims.lastName,
      identifier: claims.birthdate,
      electionsId: data.electionsId,
      constituencyId: data.constituencyId
    })
  });

  cookies.delete('id_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });

  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
