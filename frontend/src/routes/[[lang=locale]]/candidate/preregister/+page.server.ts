import { getUserInfo } from '@openvaa/app-shared';
import { fail } from '@sveltejs/kit';
import { SIGNICAT_JWKS_ENDPOINT, SIGNICAT_PRIVATE_KEY } from '$env/static/private';
import type { Actions, Cookies } from '@sveltejs/kit';

export async function load({ cookies }: { cookies: Cookies }) {
  const IDToken = cookies.get('signicat:id_token');

  if (!IDToken) {
    return { userInfo: null };
  }

  try {
    const userInfo = await getUserInfo(IDToken, {
      privateEncryptionJWK: JSON.parse(SIGNICAT_PRIVATE_KEY),
      publicSignatureJWKSetUri: SIGNICAT_JWKS_ENDPOINT
    });
    return { userInfo: { ...userInfo, birthdate: undefined } };
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

    const IDToken = cookies.get('signicat:id_token');

    if (!IDToken) {
      return fail(401);
    }

    /*
    const userInfo = await getUserInfo(IDToken, {
      privateEncryptionJWK: JSON.parse(SIGNICAT_PRIVATE_KEY),
      publicSignatureJWKSetUri: SIGNICAT_JWKS_ENDPOINT
    });
    */

    // TODO: Call the Strapi API.
    // const response = await preregister({ IDToken, email: data.email1 });

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
