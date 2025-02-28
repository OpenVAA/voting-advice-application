import * as jose from 'jose';
import { constants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';

export const defaultOptions = {
  privateEncryptionJWKSet: JSON.parse(constants.IDENTITY_PROVIDER_DECRYPTION_JWKS),
  publicSignatureJWKSetUri: constants.IDENTITY_PROVIDER_JWKS_URI,
  audience: publicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID,
  issuer: constants.IDENTITY_PROVIDER_ISSUER
} as const;

export async function getIdTokenClaims(
  idToken: string,
  options: {
    privateEncryptionJWKSet: Array<jose.JWK>;
    publicSignatureJWKSetUri: string;
    audience?: string;
    issuer?: string;
  } = defaultOptions
): Promise<
  | { success: true; data: { firstName: string; lastName: string; identifier: string } }
  | { success: false; error: { code?: string } }
> {
  try {
    const { kid } = jose.decodeProtectedHeader(idToken);
    const privateEncryptionJWK = options.privateEncryptionJWKSet.find((jwk) => jwk.kid === kid);

    if (!privateEncryptionJWK) {
      throw new Error(`Cannot decode ID token: JWK not found: kid=${kid}.`);
    }

    const { plaintext } = await jose.compactDecrypt(idToken, await jose.importJWK(privateEncryptionJWK));
    const { payload } = await jose.jwtVerify(
      new TextDecoder().decode(plaintext),
      jose.createRemoteJWKSet(new URL(options.publicSignatureJWKSetUri)),
      { audience: options.audience, issuer: options?.issuer }
    );

    return {
      success: true,
      data: {
        firstName: `${payload.given_name}`,
        lastName: `${payload.family_name}`,
        identifier: `${payload.birthdate}`
      }
    };
  } catch (e) {
    if (e instanceof jose.errors.JWTExpired) {
      return {
        success: false,
        error: {
          code: e.code
        }
      };
    }
    return {
      success: false,
      error: {}
    };
  }
}
