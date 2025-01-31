import * as jose from 'jose';

export async function getIdTokenClaims(
  idToken: string,
  options: { privateEncryptionJWK: jose.JWK; publicSignatureJWKSetUri: string }
) {
  const { plaintext } = await jose.compactDecrypt(idToken, await jose.importJWK(options.privateEncryptionJWK));
  const { payload } = await jose.jwtVerify(
    new TextDecoder().decode(plaintext),
    jose.createRemoteJWKSet(new URL(options.publicSignatureJWKSetUri))
  );
  return {
    firstName: payload.given_name,
    lastName: payload.family_name,
    birthdate: payload.birthdate
  };
}
