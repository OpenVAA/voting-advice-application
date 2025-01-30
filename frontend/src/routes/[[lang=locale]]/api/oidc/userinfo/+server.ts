import { getUserInfo } from '@openvaa/app-shared';
import { error, json } from '@sveltejs/kit';
import { SIGNICAT_JWKS_ENDPOINT, SIGNICAT_PRIVATE_KEY } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ cookies }: RequestEvent): Promise<Response> {
  const IDToken = cookies.get('signicat:id_token');

  if (!IDToken) {
    return error(404, { message: 'Not found' });
  }

  try {
    const userInfo = await getUserInfo(IDToken, {
      privateEncryptionJWK: JSON.parse(SIGNICAT_PRIVATE_KEY),
      publicSignatureJWKSetUri: SIGNICAT_JWKS_ENDPOINT
    });
    return json({ userInfo: { ...userInfo, birthdate: undefined } });
  } catch {
    return error(404, { message: 'Not found' });
  }
}
