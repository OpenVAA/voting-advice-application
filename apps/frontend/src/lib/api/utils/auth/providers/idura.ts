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

import * as jose from 'jose';
import { constants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';
import { decryptAndVerifyIdToken } from '../decryptAndVerifyIdToken';
import type {
  AuthConfig,
  AuthorizeParams,
  AuthorizeResult,
  IdentityProvider,
  IdTokenClaimsResult,
  TokenExchangeParams,
  TokenExchangeResult
} from './types';

/**
 * Idura claim mapping configuration.
 *
 * Idura Finnish Trust Network authentication returns a stable `sub` claim as the primary identifier. Additional Finnish-specific claims (`birthdate`, `hetu`, `country`) are extracted for metadata storage. `identityMatchProp` names the claim used to match a returning user to their existing candidate record and MUST be unique per person -- see `AuthConfig.identityMatchProp` in `types.ts` for what goes wrong when it is not.
 *
 * - Identity matching: `sub` (stable OIDC subject identifier)
 * - Name claims: Standard OIDC `given_name` and `family_name`
 * - Extra claims: `birthdate`, `hetu` (Finnish personal identity code), `country`
 */
export const IDURA_AUTH_CONFIG: AuthConfig = {
  identityMatchProp: 'sub',
  extractClaims: ['birthdate', 'hetu', 'country'],
  firstNameProp: 'given_name',
  lastNameProp: 'family_name'
};

/**
 * Load the Idura RS256 signing key from environment configuration.
 *
 * Parses the `IDURA_SIGNING_JWKS` env var (JSON array of JWK objects) and finds the key matching `IDURA_SIGNING_KEY_KID`. This key is used for both JAR signing and `private_key_jwt` client assertions.
 *
 * @throws {Error} If the signing key cannot be found for the configured KID.
 */
async function getSigningKey(): Promise<{ key: CryptoKey | Uint8Array; jwk: jose.JWK }> {
  const signingJwkSet = JSON.parse(constants.IDURA_SIGNING_JWKS || '[]') as Array<jose.JWK>;
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

  async exchangeCodeForToken({ authorizationCode, redirectUri }: TokenExchangeParams): Promise<TokenExchangeResult> {
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
      const payload = await decryptAndVerifyIdToken(idToken);

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
