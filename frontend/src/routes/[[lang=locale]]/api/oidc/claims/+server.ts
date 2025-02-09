import { json } from '@sveltejs/kit';
import { IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY, IDENTITY_PROVIDER_JWKS_URI } from '$env/static/private';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ cookies }: RequestEvent): Promise<Response> {
  const idToken = cookies.get('id_token');

  if (!idToken) {
    return json({ claims: null });
  }

  const claims = await getIdTokenClaims(idToken, {
    privateEncryptionJWK: JSON.parse(IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY),
    publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI
  });

  if (!claims.success) {
    cookies.delete('id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
    return json({ claims: null });
  }

  return json({ claims: { firstName: claims.data.firstName, lastName: claims.data.lastName } });
}
