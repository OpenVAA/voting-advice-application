/**
 * Shared async test fixture for RSA key pair generation.
 *
 * Generates signing (RS256) and encryption (RSA-OAEP or RSA-OAEP-256) key pairs
 * for use in JWE/JWT test token construction. All keys are generated using the
 * jose library -- the same library used in production.
 *
 * NO Deno imports. NO SvelteKit imports. Pure jose v6 only.
 */

import { generateKeyPair, exportJWK } from 'jose';

export interface TestKeySet {
  /** RS256 private key for signing JWTs */
  signingPrivateKey: CryptoKey;
  /** RS256 public key for verifying JWTs */
  signingPublicKey: CryptoKey;
  /** Exported JWK of the signing public key (for building JWKS) */
  signingPublicJWK: Record<string, unknown>;
  /** RSA public key for encrypting JWE tokens */
  encryptionPublicKey: CryptoKey;
  /** RSA private key for decrypting JWE tokens */
  encryptionPrivateKey: CryptoKey;
  /** Exported JWK of the encryption private key (with kid, for decryption JWKS) */
  encryptionPrivateJWK: Record<string, unknown>;
}

/**
 * Generate a complete set of test RSA keys for JWE/JWT operations.
 *
 * @param opts.encAlg - Encryption algorithm: 'RSA-OAEP' (Signicat) or 'RSA-OAEP-256' (Idura)
 * @param opts.kid - Key ID for the encryption key (used for kid-based lookup in decryption)
 */
export async function createTestKeySet(opts?: {
  encAlg?: 'RSA-OAEP' | 'RSA-OAEP-256';
  kid?: string;
}): Promise<TestKeySet> {
  const encAlg = opts?.encAlg ?? 'RSA-OAEP';
  const kid = opts?.kid ?? 'test-enc-key';

  // Generate RS256 signing key pair
  const { publicKey: sigPub, privateKey: sigPriv } = await generateKeyPair('RS256', {
    extractable: true
  });

  // Generate RSA encryption key pair with the specified algorithm
  const { publicKey: encPub, privateKey: encPriv } = await generateKeyPair(encAlg, {
    extractable: true
  });

  const sigPubJwk = { ...(await exportJWK(sigPub)), alg: 'RS256' };
  const encPrivJwk = { ...(await exportJWK(encPriv)), kid, alg: encAlg };

  return {
    signingPrivateKey: sigPriv,
    signingPublicKey: sigPub,
    signingPublicJWK: sigPubJwk,
    encryptionPublicKey: encPub,
    encryptionPrivateKey: encPriv,
    encryptionPrivateJWK: encPrivJwk
  };
}
