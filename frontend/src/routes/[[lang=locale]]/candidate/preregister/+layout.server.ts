import { staticSettings } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import { constants } from '$lib/server/constants';
import { buildRoute } from '$lib/utils/route';
import { constants as publicConstants } from '$lib/utils/constants';

export async function load({ cookies, locals }) {
  if (!staticSettings.preRegistration.enabled) {
    return redirect(
      303,
      buildRoute({
        route: 'CandAppLogin',
        locale: locals.currentLocale
      })
    );
  }

  const idToken = cookies.get('id_token');
  const { IDENTITY_PROVIDER_DECRYPTION_JWKS, IDENTITY_PROVIDER_JWKS_URI, IDENTITY_PROVIDER_ISSUER } = constants;
  const { PUBLIC_IDENTITY_PROVIDER_CLIENT_ID } = publicConstants;

  if (!idToken) {
    return { claims: undefined };
  }

  const claims = await getIdTokenClaims(idToken, {
    privateEncryptionJWKSet: JSON.parse(IDENTITY_PROVIDER_DECRYPTION_JWKS),
    publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI,
    audience: PUBLIC_IDENTITY_PROVIDER_CLIENT_ID,
    issuer: IDENTITY_PROVIDER_ISSUER
  });

  if (!claims.success) {
    cookies.delete('id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
    return { claims: undefined };
  }

  return { claims: { firstName: claims.data.firstName, lastName: claims.data.lastName } };
}
