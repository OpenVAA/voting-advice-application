import { error, json } from '@sveltejs/kit';
import {
  BACKEND_API_TOKEN,
  IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY,
  IDENTITY_PROVIDER_JWKS_URI
} from '$env/static/private';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import { logDebugError } from '$lib/utils/logger';
import type { Id } from '@openvaa/core';

export async function POST({ cookies, request }) {
  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  const data: { email: string; nominations: Array<{ electionId: Id; constituencyId: Id }> } = await request.json();

  const idToken = cookies.get('id_token');

  if (!idToken) {
    error(401, { message: 'ID token has expired.' });
  }

  const claims = await getIdTokenClaims(idToken, {
    privateEncryptionJWK: JSON.parse(IDENTITY_PROVIDER_ENCRYPTION_PRIVATE_KEY),
    publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI
  });

  if (!claims) {
    error(401, { message: 'ID token has expired.' });
  }

  try {
    await dataWriter.preregisterWithApiToken({
      body: {
        firstName: `${claims.firstName}`,
        lastName: `${claims.lastName}`,
        identifier: `${claims.birthdate}`,
        email: data.email,
        nominations: data.nominations
      },
      authToken: BACKEND_API_TOKEN
    });

    return json({});
  } catch (e) {
    logDebugError(`Error creating a candidate: ${e?.toString()}`);

    if (e instanceof Error && e.cause === 'CANDIDATE_CONFLICT') {
      error(409, { message: e.message });
    } else {
      error(500);
    }
  }
}
