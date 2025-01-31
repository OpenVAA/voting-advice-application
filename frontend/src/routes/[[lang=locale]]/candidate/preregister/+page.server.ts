import { fail } from '@sveltejs/kit';
import { IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY, IDENTITY_PROVIDER_JWKS_URI } from '$env/static/private';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import { constants } from '$lib/utils/constants';
import type { Actions, Cookies } from '@sveltejs/kit';

export async function load({ cookies }: { cookies: Cookies }) {
  const idToken = cookies.get('id_token');

  if (!idToken) {
    return { userInfo: null };
  }

  try {
    const claims = await getIdTokenClaims(idToken, {
      privateEncryptionJWK: JSON.parse(IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY),
      publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI
    });
    return { userInfo: { ...claims, birthdate: undefined } };
  } catch {
    cookies.delete('id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
    return { userInfo: null };
  }
}

export const actions: Actions = {
  register: async ({ cookies, request }) => {
    const formData = await request.formData();

    const data = {
      email1: formData.get('email1'),
      email2: formData.get('email2')
    };

    const idToken = cookies.get('id_token');

    if (!idToken) {
      return fail(401);
    }

    const claims = await getIdTokenClaims(idToken, {
      privateEncryptionJWK: JSON.parse(IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY),
      publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI
    });

    await fetch(`${constants.PUBLIC_DOCKER_BACKEND_URL}/api/auth/candidate/preregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer API_KEY'
      },
      body: JSON.stringify({
        firstName: claims.firstName,
        lastName: claims.lastName,
        identifier: claims.birthdate,
        email: data.email1
      })
    });

    /*
    cookies.delete('id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
    */
  },
  cancel: async ({ cookies }) => {
    cookies.delete('id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
  }
};
