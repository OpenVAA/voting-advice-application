import { error, json } from '@sveltejs/kit';
import { IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY,IDENTITY_PROVIDER_JWKS_URI } from '$env/static/private';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ cookies }: RequestEvent): Promise<Response> {
  const idToken = cookies.get('signicat:id_token');

  if (!idToken) {
    return error(404, { message: 'Not found' });
  }

  try {
    const claims = await getIdTokenClaims(idToken, {
      privateEncryptionJWK: JSON.parse(IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY),
      publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI
    });
    return json({ userInfo: { ...claims, birthdate: undefined } });
  } catch {
    return error(404, { message: 'Not found' });
  }
}
