/**
 * Smoke tests for test fixture factories.
 *
 * Validates that createTestKeySet, createTestJwe, and createTestJwt produce
 * well-formed keys and tokens that can be decrypted/verified with jose.
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as jose from 'jose';
import { createTestKeySet, type TestKeySet } from './keys';
import { createTestJwe, createTestJwt } from './tokens';

describe('Test fixture factories', () => {
  let rsaOaepKeys: TestKeySet;
  let rsaOaep256Keys: TestKeySet;

  beforeAll(async () => {
    rsaOaepKeys = await createTestKeySet({ encAlg: 'RSA-OAEP', kid: 'oaep-key' });
    rsaOaep256Keys = await createTestKeySet({ encAlg: 'RSA-OAEP-256', kid: 'oaep256-key' });
  });

  describe('createTestKeySet', () => {
    it('generates RSA-OAEP key set with correct kid', () => {
      expect(rsaOaepKeys.signingPrivateKey).toBeDefined();
      expect(rsaOaepKeys.signingPublicKey).toBeDefined();
      expect(rsaOaepKeys.signingPublicJWK).toBeDefined();
      expect(rsaOaepKeys.encryptionPublicKey).toBeDefined();
      expect(rsaOaepKeys.encryptionPrivateKey).toBeDefined();
      expect(rsaOaepKeys.encryptionPrivateJWK).toHaveProperty('kid', 'oaep-key');
    });

    it('generates RSA-OAEP-256 key set with correct kid', () => {
      expect(rsaOaep256Keys.encryptionPrivateJWK).toHaveProperty('kid', 'oaep256-key');
    });
  });

  describe('createTestJwe', () => {
    it('produces a 5-part JWE token with RSA-OAEP', async () => {
      const jwe = await createTestJwe({ given_name: 'Test' }, rsaOaepKeys, { encAlg: 'RSA-OAEP' });
      expect(jwe.split('.')).toHaveLength(5);
    });

    it('produces a decryptable JWE with RSA-OAEP', async () => {
      const claims = { given_name: 'Matti', family_name: 'Virtanen', birthdate: '1985-06-15' };
      const jwe = await createTestJwe(claims, rsaOaepKeys, {
        encAlg: 'RSA-OAEP',
        issuer: 'test-iss',
        audience: 'test-aud'
      });

      // Decrypt outer JWE
      const { plaintext } = await jose.compactDecrypt(
        jwe,
        await jose.importJWK(rsaOaepKeys.encryptionPrivateJWK as jose.JWK)
      );
      // Verify inner JWT
      const { payload } = await jose.jwtVerify(
        new TextDecoder().decode(plaintext),
        rsaOaepKeys.signingPublicKey,
        { issuer: 'test-iss', audience: 'test-aud' }
      );

      expect(payload.given_name).toBe('Matti');
      expect(payload.family_name).toBe('Virtanen');
      expect(payload.birthdate).toBe('1985-06-15');
    });

    it('produces a decryptable JWE with RSA-OAEP-256', async () => {
      const claims = { given_name: 'Liisa', family_name: 'Korhonen' };
      const jwe = await createTestJwe(claims, rsaOaep256Keys, {
        encAlg: 'RSA-OAEP-256',
        issuer: 'idura-iss',
        audience: 'idura-aud',
        subject: 'user-123'
      });

      const { plaintext } = await jose.compactDecrypt(
        jwe,
        await jose.importJWK(rsaOaep256Keys.encryptionPrivateJWK as jose.JWK)
      );
      const { payload } = await jose.jwtVerify(
        new TextDecoder().decode(plaintext),
        rsaOaep256Keys.signingPublicKey,
        { issuer: 'idura-iss', audience: 'idura-aud' }
      );

      expect(payload.sub).toBe('user-123');
      expect(payload.given_name).toBe('Liisa');
    });
  });

  describe('createTestJwt', () => {
    it('produces a verifiable JWT', async () => {
      const jwt = await createTestJwt(
        { custom: 'value' },
        rsaOaepKeys.signingPrivateKey,
        { issuer: 'jwt-iss', audience: 'jwt-aud' }
      );

      const { payload } = await jose.jwtVerify(jwt, rsaOaepKeys.signingPublicKey, {
        issuer: 'jwt-iss',
        audience: 'jwt-aud'
      });

      expect(payload.custom).toBe('value');
    });
  });
});
