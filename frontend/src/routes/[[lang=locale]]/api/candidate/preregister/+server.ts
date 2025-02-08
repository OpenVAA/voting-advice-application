import { json } from '@sveltejs/kit';
import {
  BACKEND_API_TOKEN,
  IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY,
  IDENTITY_PROVIDER_JWKS_URI
} from '$env/static/private';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import { logDebugError } from '$lib/utils/logger';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

export async function POST({ cookies, request }) {
  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  const data: { email: string; electionIds?: Array<string>; constituencyId?: string } = await request.json();

  const idToken = cookies.get('id_token');

  if (!idToken) {
    return json({ code: 401, type: 'failure' } as DataApiActionResult);
  }

  const claims = await getIdTokenClaims(idToken, {
    privateEncryptionJWK: JSON.parse(IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY),
    publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI
  });

  await dataWriter
    .preregisterWithApiToken({
      body: {
        email: data.email,
        firstName: `${claims.firstName}`,
        lastName: `${claims.lastName}`,
        identifier: `${claims.birthdate}`,
        electionDocumentIds: data.electionIds,
        constituencyDocumentId: data.constituencyId
      },
      authToken: BACKEND_API_TOKEN
    })
    .catch((e) => {
      logDebugError(`Error creating a candidate: ${e?.message}`);
      return undefined;
    });

  /*
  // TODO: Move this to a separate step.
  cookies.delete('id_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });
  */

  return json({ ok: true, type: 'success' } as DataApiActionResult);
}
