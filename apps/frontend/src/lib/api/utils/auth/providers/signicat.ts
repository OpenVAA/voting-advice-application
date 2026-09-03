/**
 * Signicat OIDC identity provider.
 *
 * Wraps the existing PKCE + client_secret auth flow into the `IdentityProvider` interface. Behaviour is unchanged from the original inline code in the `/api/oidc/token` route, but the `AuthConfig` claim mappings drive extraction instead of hardcoded claim names.
 *
 * This module carries NO decrypt/verify logic of its own: it delegates to the shared core `../decryptAndVerifyIdToken.ts` and keeps only the per-provider claim mapping. There is exactly one decrypt/verify path in `src`, and a second copy of it here would be a second thing to keep correct.
 *
 * - Authorization: Client-side PKCE redirect with `code_challenge` in query params
 * - Token exchange: `client_secret` POST to the token endpoint
 * - Claims extraction: JWE decrypt + JWT verify with config-driven claim mapping
 */

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
 * Signicat claim mapping configuration.
 *
 * Signicat returns standard OIDC claims in the id_token. `identityMatchProp` names the claim used to match a returning user to their existing candidate record and MUST be unique per person; `extractClaims` are additional claims stored in user metadata for audit and verification purposes.
 *
 * - Identity matching: `sub` (stable OIDC subject identifier)
 * - Name claims: Standard OIDC `given_name` and `family_name`
 * - Extra claims: `birthdate` (Finnish date of birth), captured as metadata only
 *
 * Keyed on `sub`, and it MUST NOT be keyed on `birthdate`, which is NOT an identifier: the Edge Function twin of this config (`identity-callback/claimConfig.ts`) turns `identityMatchProp`'s value into both the `app_metadata.identity_match_value` lookup key and the placeholder email local part, so keying on a birthdate collapses every candidate sharing a date of birth into a single Supabase auth account. The two configs must stay in agreement -- a mismatch keys the frontend and the backend to different claims.
 */
export const SIGNICAT_AUTH_CONFIG: AuthConfig = {
  identityMatchProp: 'sub',
  extractClaims: ['birthdate'],
  firstNameProp: 'given_name',
  lastNameProp: 'family_name'
};

export const signicatProvider: IdentityProvider = {
  type: 'signicat',

  authConfig: SIGNICAT_AUTH_CONFIG,

  async getAuthorizeUrl({ redirectUri, codeChallenge }: AuthorizeParams): Promise<AuthorizeResult> {
    const { PUBLIC_IDENTITY_PROVIDER_CLIENT_ID, PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT } = publicConstants;

    const authorizeUrl =
      `${PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT}` +
      `?client_id=${PUBLIC_IDENTITY_PROVIDER_CLIENT_ID}` +
      '&response_type=code' +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      '&scope=openid%20profile' +
      '&prompt=login' +
      `&code_challenge=${codeChallenge}` +
      '&code_challenge_method=S256';

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
      const payload = await decryptAndVerifyIdToken(idToken);

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
