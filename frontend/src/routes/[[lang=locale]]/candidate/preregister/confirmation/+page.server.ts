import { IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY, IDENTITY_PROVIDER_JWKS_URI } from '$env/static/private';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import type { Cookies } from '@sveltejs/kit';

// TODO: Move to CandidateContext.
export async function load({ cookies }: { cookies: Cookies }) {
  const idToken = cookies.get('id_token');

  if (!idToken) {
    return { claims: null };
  }

  try {
    const claims = await getIdTokenClaims(idToken, {
      privateEncryptionJWK: JSON.parse(IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY),
      publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI
    });

    return { claims: { firstName: claims.firstName, lastName: claims.lastName } };
  } catch {
    cookies.delete('id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
    return { claims: null };
  }
}
