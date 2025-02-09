import * as jose from 'jose';

export async function getIdTokenClaims(
  idToken: string,
  options: { privateEncryptionJWK: jose.JWK; publicSignatureJWKSetUri: string }
): Promise<
  | { success: true; data: { firstName: string; lastName: string; identifier: string } }
  | { success: false; error: { code?: string } }
> {
  try {
    const { plaintext } = await jose.compactDecrypt(idToken, await jose.importJWK(options.privateEncryptionJWK));
    const { payload } = await jose.jwtVerify(
      new TextDecoder().decode(plaintext),
      jose.createRemoteJWKSet(new URL(options.publicSignatureJWKSetUri))
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
