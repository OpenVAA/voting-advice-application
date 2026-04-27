/**
 * Idura OIDC identity provider for Finnish Trust Network bank authentication.
 *
 * Implements the full Idura OIDC flow:
 * - **Authorization:** JAR (JWT Secured Authorization Request per RFC 9101) with RS256-signed
 *   request object containing all required claims. The signing key is loaded from env vars.
 * - **Token exchange:** `private_key_jwt` client assertion (RFC 7523) with RS256-signed JWT
 *   containing `iss`, `sub`, `aud` (token endpoint), `exp` (5min), and unique `jti`.
 * - **Claims extraction:** JWE decrypt (RSA-OAEP-256) + JWT verify with Idura-specific
 *   claim mappings (`sub` for identity, plus `hetu` and `country`).
 */

import type {
  IdentityProvider,
  AuthorizeParams,
  AuthorizeResult,
  TokenExchangeParams,
  TokenExchangeResult,
  IdTokenClaimsResult
} from './types';
import { IDURA_AUTH_CONFIG } from './authConfig';
import { constants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';
import * as jose from 'jose';

/**
 * Load the Idura RS256 signing key from environment configuration.
 *
 * Parses the `IDURA_SIGNING_JWKS` env var (JSON array of JWK objects) and finds
 * the key matching `IDURA_SIGNING_KEY_KID`. This key is used for both JAR signing
 * and `private_key_jwt` client assertions.
 *
 * @throws {Error} If the signing key cannot be found for the configured KID.
 */
async function getSigningKey(): Promise<{ key: CryptoKey | Uint8Array; jwk: jose.JWK }> {
  const signingJwkSet = JSON.parse(constants.IDURA_SIGNING_JWKS || '[]') as jose.JWK[];
  const signingJwk = signingJwkSet.find((jwk) => jwk.kid === constants.IDURA_SIGNING_KEY_KID);
  if (!signingJwk) {
    throw new Error('Idura signing key not found for kid: ' + constants.IDURA_SIGNING_KEY_KID);
  }
  return { key: await jose.importJWK(signingJwk, 'RS256'), jwk: signingJwk };
}

export const iduraProvider: IdentityProvider = {
  type: 'idura',

  authConfig: IDURA_AUTH_CONFIG,

  async getAuthorizeUrl({ redirectUri }: AuthorizeParams): Promise<AuthorizeResult> {
    const clientId = publicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
    const { key: signingKey, jwk: signingJwk } = await getSigningKey();

    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    // Build signed JAR (RFC 9101) -- all authorization parameters are in the signed JWT
    const requestObject = await new jose.SignJWT({
      response_type: 'code',
      response_mode: 'query',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid profile',
      state,
      nonce,
      iss: clientId,
      aud: `https://${constants.IDURA_DOMAIN}`
    })
      .setProtectedHeader({ alg: 'RS256', kid: signingJwk.kid! })
      .sign(signingKey);

    const authorizeUrl =
      `https://${constants.IDURA_DOMAIN}/oauth2/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&request=${requestObject}`;

    return { authorizeUrl, clientSideRedirect: false, state, nonce };
  },

  async exchangeCodeForToken({
    authorizationCode,
    redirectUri
  }: TokenExchangeParams): Promise<TokenExchangeResult> {
    const clientId = publicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
    const { key: signingKey, jwk: signingJwk } = await getSigningKey();
    const tokenEndpoint = `https://${constants.IDURA_DOMAIN}/oauth2/token`;

    // Build private_key_jwt client assertion (RFC 7523)
    const clientAssertion = await new jose.SignJWT({})
      .setProtectedHeader({ alg: 'RS256', kid: signingJwk.kid! })
      .setIssuer(clientId)
      .setSubject(clientId)
      .setAudience(tokenEndpoint)
      .setExpirationTime('5m')
      .setJti(crypto.randomUUID())
      .sign(signingKey);

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: redirectUri,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion
      }).toString()
    });

    if (!response.ok) {
      throw new Error('Idura token exchange failed: ' + response.status);
    }

    const { id_token } = await response.json();
    return { idToken: id_token };
  },

  async getIdTokenClaims(idToken: string): Promise<IdTokenClaimsResult> {
    try {
      const privateEncryptionJWKSet: jose.JWK[] = JSON.parse(constants.IDENTITY_PROVIDER_DECRYPTION_JWKS || '[]');

      const { kid } = jose.decodeProtectedHeader(idToken);
      const privateEncryptionJWK = privateEncryptionJWKSet.find((jwk) => jwk.kid === kid);

      if (!privateEncryptionJWK) {
        throw new Error(`Cannot decode ID token: JWK not found: kid=${kid}.`);
      }

      const { plaintext } = await jose.compactDecrypt(idToken, await jose.importJWK(privateEncryptionJWK));
      const { payload } = await jose.jwtVerify(
        new TextDecoder().decode(plaintext),
        jose.createRemoteJWKSet(new URL(constants.IDENTITY_PROVIDER_JWKS_URI!)),
        {
          audience: publicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID,
          issuer: constants.IDENTITY_PROVIDER_ISSUER
        }
      );

      const extractedClaims: Record<string, string> = Object.fromEntries(
        IDURA_AUTH_CONFIG.extractClaims.map((claim) => [claim, String(payload[claim] ?? '')])
      );

      return {
        success: true,
        data: {
          firstName: String(payload[IDURA_AUTH_CONFIG.firstNameProp] ?? ''),
          lastName: String(payload[IDURA_AUTH_CONFIG.lastNameProp] ?? ''),
          identifier: String(payload[IDURA_AUTH_CONFIG.identityMatchProp] ?? ''),
          extractedClaims
        }
      };
    } catch (e) {
      if (e instanceof Error && 'code' in e) {
        return {
          success: false,
          error: {
            code: `${(e as Error & { code: string }).code}`
          }
        };
      }
      return {
        success: false,
        error: {}
      };
    }
  }
};
