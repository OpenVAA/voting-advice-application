import * as jose from 'jose';

export async function getUserInfo(
  IDToken: string,
  options: { privateEncryptionJWK: jose.JWK; publicSignatureJWKSetUri: string }
) {
  const { plaintext } = await jose.compactDecrypt(IDToken, await jose.importJWK(options.privateEncryptionJWK));
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
