import { fail } from '@sveltejs/kit';
import { IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY,IDENTITY_PROVIDER_JWKS_URI } from '$env/static/private';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import type { Actions, Cookies } from '@sveltejs/kit';

export async function load({ cookies }: { cookies: Cookies }) {
  const idToken = cookies.get('signicat:id_token');

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
    cookies.delete('signicat:id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
    return { userInfo: null };
  }
}

export const actions: Actions = {
  register: async ({ cookies }) => {
    /*
    const formData = await request.formData();

    const data = {
      email1: formData.get('email1'),
      email2: formData.get('email2')
    };
    */

    const idToken = cookies.get('signicat:id_token');

    if (!idToken) {
      return fail(401);
    }

    /*
    const userInfo = await getUserInfo(idToken, {
      privateEncryptionJWK: JSON.parse(IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY),
      publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI
    });
    */

    // TODO: Call the Strapi API.
    // const response = await preregister({ idToken, email: data.email1 });

    cookies.delete('signicat:id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
  },
  cancel: async ({ cookies }) => {
    cookies.delete('signicat:id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
  }
};
