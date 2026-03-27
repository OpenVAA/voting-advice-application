/**
 * Provider abstraction layer for OIDC identity providers.
 *
 * This module defines the shared interface and types that all identity provider
 * implementations (Signicat, Idura) must satisfy. The abstraction enables
 * switching between providers via environment configuration without changing
 * application code.
 *
 * Each provider implements three core operations:
 * 1. Building the authorization URL (PKCE for Signicat, JAR for Idura)
 * 2. Exchanging the authorization code for an id_token
 * 3. Decrypting and verifying the id_token to extract identity claims
 */

/**
 * Supported identity provider types.
 *
 * - `'signicat'` - Signicat OIDC with PKCE + client_secret authentication
 * - `'idura'` - Idura OIDC with JAR + private_key_jwt authentication
 */
export type ProviderType = 'signicat' | 'idura';

/**
 * Configuration for identity claim extraction from the id_token.
 *
 * Each provider specifies which JWT claims map to which application concepts.
 * This allows the system to use different claims for user identity matching
 * and metadata extraction depending on the active provider.
 */
export interface AuthConfig {
  /**
   * Which id_token claim to use for user identity matching.
   *
   * For Signicat: `'birthdate'` (Finnish bank auth returns birthdate as primary identifier)
   * For Idura: `'sub'` (stable subject identifier per OIDC spec)
   */
  identityMatchProp: string;

  /**
   * Additional claims to extract from the id_token and store in user metadata.
   *
   * These claims are saved alongside the identity match value in the user's
   * `app_metadata` for later use (e.g., identity verification, audit trail).
   */
  extractClaims: string[];

  /**
   * Which id_token claim maps to the candidate's first name.
   *
   * Typically `'given_name'` for both providers (standard OIDC claim).
   */
  firstNameProp: string;

  /**
   * Which id_token claim maps to the candidate's last name.
   *
   * Typically `'family_name'` for both providers (standard OIDC claim).
   */
  lastNameProp: string;
}

/**
 * Parameters for building the authorization URL.
 */
export interface AuthorizeParams {
  /** The URI to redirect back to after authentication. */
  redirectUri: string;

  /**
   * PKCE code verifier (Signicat only).
   *
   * Idura uses JAR (JWT Authorization Request) instead of PKCE.
   */
  codeVerifier?: string;

  /**
   * PKCE code challenge derived from the code verifier (Signicat only).
   *
   * Idura uses JAR (JWT Authorization Request) instead of PKCE.
   */
  codeChallenge?: string;
}

/**
 * Result of building the authorization URL.
 */
export interface AuthorizeResult {
  /** The fully constructed authorization URL. */
  authorizeUrl: string;

  /**
   * Whether the redirect should happen client-side.
   *
   * - `true` for Signicat: the frontend redirects the browser directly
   * - `false` for Idura: the server constructs a JAR and issues the redirect
   */
  clientSideRedirect: boolean;

  /**
   * CSRF protection state parameter (Idura only).
   *
   * For Idura: included in the JAR and must be stored in a cookie for
   * verification on callback. Signicat uses client-side PKCE instead.
   */
  state?: string;

  /**
   * Replay protection nonce (Idura only).
   *
   * For Idura: included in the JAR and verified against the id_token `nonce`
   * claim after token exchange. Signicat does not use server-side nonce.
   */
  nonce?: string;
}

/**
 * Parameters for exchanging an authorization code for tokens.
 */
export interface TokenExchangeParams {
  /** The authorization code received from the identity provider callback. */
  authorizationCode: string;

  /** The redirect URI that was used in the authorization request (must match). */
  redirectUri: string;

  /**
   * PKCE code verifier (Signicat only).
   *
   * Idura uses `private_key_jwt` client assertion instead of PKCE + client_secret.
   */
  codeVerifier?: string;
}

/**
 * Result of the token exchange.
 */
export interface TokenExchangeResult {
  /** The encrypted id_token (JWE) containing the user's identity claims. */
  idToken: string;
}

/**
 * Result of decrypting and verifying the id_token to extract identity claims.
 *
 * Discriminated union: check `success` to determine whether claims were
 * successfully extracted or an error occurred.
 */
export type IdTokenClaimsResult =
  | {
      success: true;
      data: {
        /** Candidate's first name, extracted from the claim specified by `AuthConfig.firstNameProp`. */
        firstName: string;
        /** Candidate's last name, extracted from the claim specified by `AuthConfig.lastNameProp`. */
        lastName: string;
        /** Identity match value, extracted from the claim specified by `AuthConfig.identityMatchProp`. */
        identifier: string;
        /** All extracted claims as key-value pairs, as specified by `AuthConfig.extractClaims`. */
        extractedClaims: Record<string, string>;
      };
    }
  | {
      success: false;
      error: {
        /** Error code from the JOSE library, if available. */
        code?: string;
      };
    };

/**
 * Identity provider abstraction interface.
 *
 * Each provider (Signicat, Idura) implements these three operations to handle
 * the complete OIDC authentication flow. Consumer code interacts only with this
 * interface, never with provider-specific logic directly.
 */
export interface IdentityProvider {
  /** Provider type identifier. */
  readonly type: ProviderType;

  /** Claim mapping configuration for this provider. */
  readonly authConfig: AuthConfig;

  /**
   * Build the authorization URL to redirect the user to.
   *
   * - Signicat: Constructs a client-side PKCE URL with query parameters.
   * - Idura: Constructs a server-side JAR (JWT Authorization Request).
   */
  getAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult>;

  /**
   * Exchange an authorization code for an id_token.
   *
   * - Signicat: Uses `client_secret` POST to the token endpoint.
   * - Idura: Uses `private_key_jwt` client assertion (RFC 7523).
   */
  exchangeCodeForToken(params: TokenExchangeParams): Promise<TokenExchangeResult>;

  /**
   * Decrypt the JWE id_token and verify the inner JWT to extract identity claims.
   *
   * Both providers return JWE-encrypted id_tokens that contain a signed JWT.
   * The decryption key and verification algorithms differ per provider.
   */
  getIdTokenClaims(idToken: string): Promise<IdTokenClaimsResult>;
}
