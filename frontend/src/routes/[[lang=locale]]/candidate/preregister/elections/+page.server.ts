import { IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY, IDENTITY_PROVIDER_JWKS_URI } from '$env/static/private';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';

// TODO: Move to CandidateContext.
export async function load({ cookies }: { cookies: Cookies }) {
  const idToken = cookies.get('id_token');

  if (!idToken) {
    return { claims: null };
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
    return { claims: null };
  }

  return { claims: { firstName: claims.data.firstName, lastName: claims.data.lastName } };
}
