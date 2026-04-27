/**
 * Signicat OIDC identity provider.
 *
 * Wraps the existing PKCE + client_secret auth flow into the `IdentityProvider`
 * interface. This module produces identical behavior to the original inline code
 * in `getIdTokenClaims.ts` and the `/api/oidc/token` route, but uses the
 * `AuthConfig` claim mappings for extraction instead of hardcoded claim names.
 *
 * - Authorization: Client-side PKCE redirect with `code_challenge` in query params
 * - Token exchange: `client_secret` POST to the token endpoint
 * - Claims extraction: JWE decrypt + JWT verify with config-driven claim mapping
 */

import type {
  IdentityProvider,
  AuthorizeParams,
  AuthorizeResult,
  TokenExchangeParams,
  TokenExchangeResult,
  IdTokenClaimsResult
} from './types';
import { SIGNICAT_AUTH_CONFIG } from './authConfig';
import { constants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';
import * as jose from 'jose';

export const signicatProvider: IdentityProvider = {
  type: 'signicat',

  authConfig: SIGNICAT_AUTH_CONFIG,

  async getAuthorizeUrl({ redirectUri, codeChallenge }: AuthorizeParams): Promise<AuthorizeResult> {
    const { PUBLIC_IDENTITY_PROVIDER_CLIENT_ID, PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT } = publicConstants;

    const authorizeUrl =
      `${PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT}` +
      `?client_id=${PUBLIC_IDENTITY_PROVIDER_CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=openid%20profile` +
      `&prompt=login` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;

    return { authorizeUrl, clientSideRedirect: true };
  },

  async exchangeCodeForToken({
    authorizationCode,
    redirectUri,
    codeVerifier
  }: TokenExchangeParams): Promise<TokenExchangeResult> {
    const { IDENTITY_PROVIDER_TOKEN_ENDPOINT, IDENTITY_PROVIDER_CLIENT_SECRET } = constants;
    const { PUBLIC_IDENTITY_PROVIDER_CLIENT_ID } = publicConstants;

    const response = await fetch(IDENTITY_PROVIDER_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        code_verifier: codeVerifier!,
        redirect_uri: redirectUri,
        client_id: PUBLIC_IDENTITY_PROVIDER_CLIENT_ID,
        client_secret: IDENTITY_PROVIDER_CLIENT_SECRET
      }).toString()
    });

    if (!response.ok) {
      throw new Error('Token exchange failed');
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
        SIGNICAT_AUTH_CONFIG.extractClaims.map((claim) => [claim, String(payload[claim] ?? '')])
      );

      return {
        success: true,
        data: {
          firstName: String(payload[SIGNICAT_AUTH_CONFIG.firstNameProp] ?? ''),
          lastName: String(payload[SIGNICAT_AUTH_CONFIG.lastNameProp] ?? ''),
          identifier: String(payload[SIGNICAT_AUTH_CONFIG.identityMatchProp] ?? ''),
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
