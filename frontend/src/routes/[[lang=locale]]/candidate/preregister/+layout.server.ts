import { staticSettings } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import { constants } from '$lib/server/constants';
import { buildRoute } from '$lib/utils/route';

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
  const { IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY, IDENTITY_PROVIDER_JWKS_URI } = constants;

  if (!idToken) {
    return { claims: undefined };
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
    return { claims: undefined };
  }

  return { claims: { firstName: claims.data.firstName, lastName: claims.data.lastName } };
}
