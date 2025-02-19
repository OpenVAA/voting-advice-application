import { error, json } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import { constants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';
import { logDebugError } from '$lib/utils/logger';
import type { Id } from '@openvaa/core';

export async function POST({ cookies, request }) {
  const { BACKEND_API_TOKEN, IDENTITY_PROVIDER_DECRYPTION_JWKS, IDENTITY_PROVIDER_JWKS_URI, IDENTITY_PROVIDER_ISSUER } =
    constants;
  const { PUBLIC_IDENTITY_PROVIDER_CLIENT_ID } = publicConstants;

  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  const data: {
    email: string;
    nominations: Array<{ electionId: Id; constituencyId: Id }>;
    extra: {
      emailTemplate: {
        subject: string;
        text: string;
        html: string;
      };
    };
  } = await request.json();

  const idToken = cookies.get('id_token');

  if (!idToken) {
    error(401, { message: 'ID token has expired.' });
  }

  const claims = await getIdTokenClaims(idToken, {
    privateEncryptionJWKSet: JSON.parse(IDENTITY_PROVIDER_DECRYPTION_JWKS),
    publicSignatureJWKSetUri: IDENTITY_PROVIDER_JWKS_URI,
    audience: PUBLIC_IDENTITY_PROVIDER_CLIENT_ID,
    issuer: IDENTITY_PROVIDER_ISSUER
  });

  if (!claims.success) {
    error(401, { message: 'ID token has expired.' });
  }

  try {
    await dataWriter.preregisterWithApiToken({
      body: {
        ...claims.data,
        ...data
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
