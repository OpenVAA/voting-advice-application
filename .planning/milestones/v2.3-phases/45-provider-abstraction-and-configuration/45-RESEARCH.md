# Phase 45: Provider Abstraction and Configuration - Research

**Researched:** 2026-03-27
**Domain:** OIDC identity provider abstraction (Signicat + Idura), TypeScript interface design, SvelteKit env config
**Confidence:** HIGH

## Summary

Phase 45 creates the foundation layer for multi-provider identity authentication. The existing codebase has a single, Signicat-hardcoded OIDC flow with client-side PKCE and `client_secret` token exchange. This phase extracts that flow into a provider interface with three operations (`getAuthorizeUrl`, `exchangeCodeForToken`, `getIdTokenClaims`), implements both Signicat and Idura provider modules, and updates all env var plumbing.

The scope is deliberately narrow: define the interface, wrap existing Signicat code, create the Idura provider skeleton with correct config, update env vars and constants, and document key generation. The actual Idura-specific logic (JAR construction, `private_key_jwt` token exchange) is implemented in Phase 46; this phase creates the structure they plug into.

**Primary recommendation:** Use a functional module pattern (not classes) with a single `getActiveProvider()` factory that reads `PUBLIC_IDENTITY_PROVIDER_TYPE` and returns the correct provider object. Each provider module exports functions that satisfy the shared interface. This matches the existing codebase's functional style (no classes in the auth utils).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Provider interface defines 3 operations: `getAuthorizeUrl()`, `exchangeCodeForToken()`, `getIdTokenClaims()`
- **D-02:** Provider selection via `PUBLIC_IDENTITY_PROVIDER_TYPE` env var (`signicat` | `idura`)
- **D-03:** Provider modules at `apps/frontend/src/lib/api/utils/auth/providers/signicat.ts` and `idura.ts` with `index.ts` exporting the active provider
- **D-04:** Auth config defines `identityMatchProp` -- which id_token claim to use for user matching (e.g., `sub` for Idura, `birthdate` for Signicat)
- **D-05:** Auth config defines `extractClaims` -- which other claims to save in user metadata (e.g., `birthdate`, `hetu` for Idura)
- **D-06:** Auth config defines `firstNameProp` and `lastNameProp` -- which claims map to the candidate's first/last name (e.g., `given_name` and `family_name` for both providers)
- **D-07:** The Edge Function stores in app_metadata: the matching prop name, its value, and all extracted claims. Uses firstNameProp/lastNameProp to populate the candidate record.
- **D-08:** Idura-specific env vars: `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`, `IDURA_DOMAIN` (or reuse generic names with provider-specific values)
- **D-09:** Shared env vars that work for both providers: `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`, `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`
- **D-10:** Idura credentials collected: domain=`openvaa.test.idura.broker`, client_id=`urn:my:application:identifier:498295`, RSA key pairs generated (signing kid=`openvaa-signing-1`, encryption kid=`openvaa-encryption-1`)

### Claude's Discretion
- Exact TypeScript interface shape and generics
- Whether to use a class or functional approach for providers
- How to structure the auth config (inline in provider module vs separate config file)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROV-01 | Codebase supports switching between Signicat and Idura identity providers via environment variable | Provider factory pattern in `providers/index.ts` reads `PUBLIC_IDENTITY_PROVIDER_TYPE`; env var added to public constants |
| PROV-02 | Provider interface defines `getAuthorizeUrl()`, `exchangeCodeForToken()`, and `getIdTokenClaims()` operations | TypeScript interface `IdentityProvider` with 3 methods + `AuthConfig` type for claim mapping |
| CONF-01 | All Idura-specific environment variables documented in `.env.example` | New env vars section with descriptions for signing JWKS, signing KID, domain, and shared vars with Idura example values |
| CONF-02 | Key generation process documented (signing + encryption RSA key pairs) | RSA 2048-bit key generation via `jose` CLI or openssl, JWKS format documented |
| CONF-03 | Server constants updated with new Idura env vars | `$lib/server/constants.ts` extended with `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`, `IDURA_DOMAIN` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jose | ^6.2.1 (installed: 6.2.x, latest: 6.2.2) | JWE decrypt, JWT verify/sign, JWK import | Already used in project; universal JS/TS JOSE library |
| SvelteKit | 2.x | Server routes, env handling, cookies | Project framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sveltejs/kit `$env/dynamic/private` | built-in | Server-side env vars | All secret env vars (JWKS, signing keys) |
| @sveltejs/kit `$env/dynamic/public` | built-in | Public env vars | `PUBLIC_IDENTITY_PROVIDER_TYPE`, `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Functional providers | Class-based providers | Classes add unnecessary ceremony for 3 functions; functional matches existing auth util style |
| Separate auth config file | Inline config in provider modules | Separate file is cleaner -- provider-specific claim mapping in one place, providers stay focused on OIDC mechanics |
| Runtime provider switching | Build-time switching | Runtime is required (same build, different env config per deployment) |

**Installation:**
```bash
# No new packages needed -- jose ^6.2.1 already installed
```

**Version verification:** jose 6.2.2 is current on npm (verified 2026-03-27). Project uses `^6.2.1` which will resolve to latest 6.2.x.

## Architecture Patterns

### Recommended Project Structure
```
apps/frontend/src/lib/api/utils/auth/
  generateChallenge.ts          # Existing -- Signicat PKCE (unchanged)
  getIdTokenClaims.ts           # Existing -- refactored to be provider-aware
  providers/
    types.ts                    # IdentityProvider interface + AuthConfig type
    authConfig.ts               # Per-provider claim mapping config
    signicat.ts                 # Signicat provider implementation
    idura.ts                    # Idura provider implementation
    index.ts                    # Factory: getActiveProvider()
```

### Pattern 1: Provider Interface
**What:** A TypeScript interface that both provider modules implement, with an auth config type for claim mapping.
**When to use:** Provider selection at startup based on env var.
**Example:**
```typescript
// providers/types.ts

/**
 * Configuration for identity claim extraction from id_token.
 * Each provider specifies which JWT claims map to which application concepts.
 */
export interface AuthConfig {
  /** Which id_token claim to use for user identity matching (e.g., 'sub' for Idura, 'birthdate' for Signicat) */
  identityMatchProp: string;
  /** Additional claims to extract and store in user metadata */
  extractClaims: string[];
  /** Which claim maps to candidate first name */
  firstNameProp: string;
  /** Which claim maps to candidate last name */
  lastNameProp: string;
}

/**
 * Identity provider abstraction. Each provider implements these 3 operations.
 */
export interface IdentityProvider {
  /** Provider type identifier */
  readonly type: 'signicat' | 'idura';
  /** Claim mapping configuration */
  readonly authConfig: AuthConfig;
  /**
   * Build the authorization URL to redirect the user to.
   * For Signicat: client-side PKCE URL with query params.
   * For Idura: server-side JAR construction (Phase 46).
   */
  getAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult>;
  /**
   * Exchange authorization code for id_token.
   * For Signicat: client_secret POST.
   * For Idura: private_key_jwt client assertion (Phase 46).
   */
  exchangeCodeForToken(params: TokenExchangeParams): Promise<TokenExchangeResult>;
  /**
   * Decrypt JWE and verify JWT to extract identity claims.
   * Both providers: JWE decrypt + JWT verify, different algorithms.
   */
  getIdTokenClaims(idToken: string): Promise<IdTokenClaimsResult>;
}

export interface AuthorizeParams {
  redirectUri: string;
  /** PKCE code verifier (Signicat only; Idura uses JAR instead) */
  codeVerifier?: string;
  /** PKCE code challenge (Signicat only) */
  codeChallenge?: string;
}

export interface AuthorizeResult {
  authorizeUrl: string;
  /** If the provider uses client-side redirect (Signicat: true, Idura: false -- uses server endpoint) */
  clientSideRedirect: boolean;
}

export interface TokenExchangeParams {
  authorizationCode: string;
  redirectUri: string;
  /** PKCE code verifier (Signicat only) */
  codeVerifier?: string;
}

export interface TokenExchangeResult {
  idToken: string;
}

export interface IdTokenClaimsResult {
  success: true;
  data: {
    firstName: string;
    lastName: string;
    identifier: string;
    /** All extracted claims as key-value pairs */
    extractedClaims: Record<string, string>;
  };
} | {
  success: false;
  error: { code?: string };
}
```

### Pattern 2: Auth Config Per Provider
**What:** Centralized claim mapping configuration that tells the system which JWT claims to use for each purpose.
**When to use:** When extracting identity from id_token and when the Edge Function stores user metadata.
**Example:**
```typescript
// providers/authConfig.ts
import type { AuthConfig } from './types';

export const SIGNICAT_AUTH_CONFIG: AuthConfig = {
  identityMatchProp: 'birthdate',
  extractClaims: ['birthdate'],
  firstNameProp: 'given_name',
  lastNameProp: 'family_name'
};

export const IDURA_AUTH_CONFIG: AuthConfig = {
  identityMatchProp: 'sub',
  extractClaims: ['birthdate', 'hetu', 'country'],
  firstNameProp: 'given_name',
  lastNameProp: 'family_name'
};
```

### Pattern 3: Provider Factory
**What:** A function that reads the env var and returns the correct provider.
**When to use:** At every call site that needs to interact with the identity provider.
**Example:**
```typescript
// providers/index.ts
import { constants } from '$lib/utils/constants';
import type { IdentityProvider } from './types';
import { signicatProvider } from './signicat';
import { iduraProvider } from './idura';

export type ProviderType = 'signicat' | 'idura';

/**
 * Returns the active identity provider based on PUBLIC_IDENTITY_PROVIDER_TYPE env var.
 * Defaults to 'signicat' for backward compatibility.
 */
export function getActiveProvider(): IdentityProvider {
  const providerType = (constants.PUBLIC_IDENTITY_PROVIDER_TYPE || 'signicat') as ProviderType;
  switch (providerType) {
    case 'idura':
      return iduraProvider;
    case 'signicat':
      return signicatProvider;
    default:
      throw new Error(`Unknown identity provider type: ${providerType}`);
  }
}

export { type IdentityProvider, type AuthConfig } from './types';
```

### Pattern 4: Signicat Provider (wrapping existing code)
**What:** Wrap existing `getIdTokenClaims` and the inline PKCE flow into the provider interface.
**When to use:** When `PUBLIC_IDENTITY_PROVIDER_TYPE=signicat`.
**Example:**
```typescript
// providers/signicat.ts
import type { IdentityProvider } from './types';
import { SIGNICAT_AUTH_CONFIG } from './authConfig';
import { constants } from '$lib/server/constants';
import { constants as publicConstants } from '$lib/utils/constants';
import * as jose from 'jose';

export const signicatProvider: IdentityProvider = {
  type: 'signicat',
  authConfig: SIGNICAT_AUTH_CONFIG,

  async getAuthorizeUrl({ redirectUri, codeChallenge }) {
    const clientId = publicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
    const authEndpoint = publicConstants.PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT;
    const authorizeUrl = `${authEndpoint}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile&prompt=login&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    return { authorizeUrl, clientSideRedirect: true };
  },

  async exchangeCodeForToken({ authorizationCode, redirectUri, codeVerifier }) {
    // Existing client_secret flow
    const response = await fetch(constants.IDENTITY_PROVIDER_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        code_verifier: codeVerifier!,
        redirect_uri: redirectUri,
        client_id: publicConstants.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID,
        client_secret: constants.IDENTITY_PROVIDER_CLIENT_SECRET
      }).toString()
    });
    if (!response.ok) throw new Error('Token exchange failed');
    const { id_token } = await response.json();
    return { idToken: id_token };
  },

  async getIdTokenClaims(idToken) {
    // Wrap existing getIdTokenClaims logic with config-driven claim extraction
    // ... (uses RSA-OAEP, existing JWKS/issuer config)
  }
};
```

### Anti-Patterns to Avoid
- **Provider-specific logic outside provider modules:** All Signicat-specific and Idura-specific code must live within their respective provider files. The consumer code (routes, Edge Function) should only use the interface.
- **Hardcoding claim names:** Never hardcode `birthdate` or `sub` in consumer code. Always read from `authConfig.identityMatchProp`.
- **Importing server constants in client code:** `$env/dynamic/private` can only be used server-side. The `providers/` directory contains server-only code accessed from API routes.
- **Leaking provider type into multiple files:** The `PUBLIC_IDENTITY_PROVIDER_TYPE` check should happen in exactly one place (`providers/index.ts`), not scattered across the codebase.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWE decryption | Custom RSA decrypt | `jose.compactDecrypt()` | Handles RSA-OAEP and RSA-OAEP-256 with correct padding |
| JWT verification | Manual signature check | `jose.jwtVerify()` with `createRemoteJWKSet()` | Handles key rotation, algorithm negotiation |
| JWT signing | Manual RS256 implementation | `jose.SignJWT` | Correct header/payload serialization |
| JWK import | PEM parsing | `jose.importJWK()` | Handles all key types and algorithms |
| PKCE challenge | Custom hash | Existing `generateChallenge.ts` | Already correct and tested |

**Key insight:** The `jose` library (already installed) handles every cryptographic operation needed for both providers. The provider abstraction is purely about configuration and control flow, not cryptography.

## Common Pitfalls

### Pitfall 1: Server-only imports in shared provider code
**What goes wrong:** Importing `$env/dynamic/private` in a file that gets included in client bundles causes SvelteKit build errors.
**Why it happens:** Provider modules use server secrets but might be imported from client-side Svelte components.
**How to avoid:** Provider modules must only be imported from `+server.ts` routes, `+layout.server.ts`, or other server-only code. The preregister page should call the `/api/oidc/token` endpoint, not import providers directly.
**Warning signs:** Build error mentioning "Cannot import $env/dynamic/private in client-side code."

### Pitfall 2: Breaking existing Signicat flow during refactor
**What goes wrong:** The provider abstraction introduces a regression in the working Signicat preregistration flow.
**Why it happens:** Wrapping existing inline code into a provider module changes import paths, execution context, or error handling.
**How to avoid:** The Signicat provider's `exchangeCodeForToken` and `getIdTokenClaims` must produce byte-identical HTTP requests and responses as the existing code. Test by running the existing Signicat flow after refactoring.
**Warning signs:** Token exchange returns 401, JWE decryption fails with "algorithm not supported."

### Pitfall 3: Default env var value masking misconfiguration
**What goes wrong:** `constants.PUBLIC_IDENTITY_PROVIDER_TYPE || 'signicat'` silently defaults to Signicat when the env var is missing, hiding deployment misconfiguration.
**Why it happens:** Defensive defaults hide errors.
**How to avoid:** Default to `'signicat'` for backward compatibility (existing deployments don't have this env var), but log a warning when the env var is not explicitly set. In development, consider requiring it.
**Warning signs:** Deployment intended for Idura silently uses Signicat.

### Pitfall 4: Mixed env var naming between generic and provider-specific
**What goes wrong:** Confusion about which env vars are shared (same name, different values per provider) vs provider-specific (only used by one provider).
**Why it happens:** D-08 and D-09 define two categories but the boundary is subtle.
**How to avoid:** Shared vars: `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`, `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`. Idura-only vars: `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`, `IDURA_DOMAIN`. Clear documentation in `.env.example` separating these categories.
**Warning signs:** Deployer sets Idura-specific vars but forgets to update shared vars with Idura values.

### Pitfall 5: `getIdTokenClaims` return type change breaks consumers
**What goes wrong:** The current return type is `{ firstName, lastName, identifier }`. Adding `extractedClaims` or changing the shape breaks `+layout.server.ts` and the Edge Function.
**Why it happens:** Multiple consumers depend on the exact return shape.
**How to avoid:** Extend the return type additively (add `extractedClaims` alongside existing fields). Keep `firstName`, `lastName`, `identifier` for backward compatibility; the Edge Function and layout server continue to work unchanged.
**Warning signs:** TypeScript compilation errors in preregister layout or candidate context.

## Code Examples

Verified patterns from the existing codebase and official sources:

### Existing JWE Decrypt + JWT Verify (current `getIdTokenClaims.ts`)
```typescript
// Source: apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts
// This is the current implementation. Provider abstraction wraps this logic.
const { kid } = jose.decodeProtectedHeader(idToken);
const privateEncryptionJWK = options.privateEncryptionJWKSet.find((jwk) => jwk.kid === kid);
const { plaintext } = await jose.compactDecrypt(idToken, await jose.importJWK(privateEncryptionJWK));
const { payload } = await jose.jwtVerify(
  new TextDecoder().decode(plaintext),
  jose.createRemoteJWKSet(new URL(options.publicSignatureJWKSetUri)),
  { audience: options.audience, issuer: options?.issuer }
);
```

### private_key_jwt Client Assertion (for Idura Phase 46, shown here for interface context)
```typescript
// Source: Signicat docs + Idura blog, RFC 7523
// Used by idura.ts exchangeCodeForToken() in Phase 46
const clientAssertion = await new jose.SignJWT({})
  .setProtectedHeader({ alg: 'RS256', kid: IDURA_SIGNING_KEY_KID })
  .setIssuer(CLIENT_ID)
  .setSubject(CLIENT_ID)
  .setAudience(`https://${IDURA_DOMAIN}`)  // token endpoint URL
  .setExpirationTime('5m')
  .setJti(crypto.randomUUID())
  .sign(signingKey);

// Token endpoint body:
new URLSearchParams({
  grant_type: 'authorization_code',
  code: authorizationCode,
  redirect_uri: redirectUri,
  client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
  client_assertion: clientAssertion
})
```

### JAR (JWT Authorization Request) Format (for Idura Phase 46)
```typescript
// Source: RFC 9101, Idura blog on signed authorization requests
// URL format: https://{domain}/oauth2/authorize?client_id={id}&request={signedJWT}
const requestJwt = await new jose.SignJWT({
  response_type: 'code',
  response_mode: 'query',
  client_id: CLIENT_ID,
  redirect_uri: redirectUri,
  scope: 'openid profile',
  nonce: crypto.randomUUID(),
  state: crypto.randomUUID()
})
  .setProtectedHeader({ alg: 'RS256', kid: SIGNING_KEY_KID })
  .setIssuer(CLIENT_ID)
  .setAudience(`https://${IDURA_DOMAIN}`)
  .setExpirationTime('5m')
  .sign(signingKey);
```

### RSA Key Generation for JWKS
```bash
# Source: OIDC best practices, FTN Traficom 213/2023 (2048-bit minimum)
# Generate signing key pair
openssl genrsa -out signing-private.pem 2048
openssl rsa -in signing-private.pem -pubout -out signing-public.pem

# Generate encryption key pair
openssl genrsa -out encryption-private.pem 2048
openssl rsa -in encryption-private.pem -pubout -out encryption-public.pem

# Convert to JWK format using jose-util or node script:
# node -e "
#   const jose = require('jose');
#   const fs = require('fs');
#   const key = await jose.importPKCS8(fs.readFileSync('signing-private.pem', 'utf8'), 'RS256');
#   const jwk = await jose.exportJWK(key);
#   jwk.kid = 'openvaa-signing-1';
#   jwk.use = 'sig';
#   jwk.alg = 'RS256';
#   console.log(JSON.stringify(jwk, null, 2));
# "
```

### Env Var Documentation Pattern (for .env.example)
```bash
################################################################
# Identity Provider Configuration
################################################################

# Provider type: 'signicat' or 'idura'
PUBLIC_IDENTITY_PROVIDER_TYPE=signicat

# Shared vars (set to the active provider's values)
PUBLIC_IDENTITY_PROVIDER_CLIENT_ID=client_id
IDENTITY_PROVIDER_DECRYPTION_JWKS='[{"kty":"RSA","kid":"{key_id}","use":"enc",...}]'
IDENTITY_PROVIDER_JWKS_URI=https://provider-domain/.well-known/openid-configuration/jwks
IDENTITY_PROVIDER_ISSUER=https://provider-domain

################################################################
# Signicat-specific (only when PUBLIC_IDENTITY_PROVIDER_TYPE=signicat)
################################################################

PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT=https://your-domain.signicat.com/auth/open/connect/authorize
IDENTITY_PROVIDER_TOKEN_ENDPOINT=https://your-domain.signicat.com/auth/open/connect/token
IDENTITY_PROVIDER_CLIENT_SECRET=client_secret

################################################################
# Idura-specific (only when PUBLIC_IDENTITY_PROVIDER_TYPE=idura)
################################################################

# Domain for Idura broker
IDURA_DOMAIN=your-subdomain.idura.broker

# Private signing JWKS (JSON array with private key for JAR + private_key_jwt)
IDURA_SIGNING_JWKS='[{"kty":"RSA","kid":"openvaa-signing-1","use":"sig","alg":"RS256",...}]'

# KID of the signing key to use
IDURA_SIGNING_KEY_KID=openvaa-signing-1
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `client_secret` token auth | `private_key_jwt` (FTN mandate) | Aug 31, 2025 | Idura requires JWT client assertion |
| Client-side PKCE only | JAR (JWT Authorization Request, RFC 9101) | Aug 31, 2025 | FTN requires signed authorization requests |
| RSA-OAEP JWE | RSA-OAEP-256 JWE (Idura) | Provider-specific | `jose` handles both transparently via `compactDecrypt` |
| Hardcoded `birthdate` identity matching | Configurable `identityMatchProp` | This phase | `sub` claim is more robust unique identifier |

**Deprecated/outdated:**
- `response_type=id_token` in authorize requests: Not allowed by FTN compliance rules
- PKCE-only authorization: Insufficient for FTN; JAR required alongside (or instead of) PKCE

## Open Questions

1. **Should `getIdTokenClaims` return provider-specific extra claims?**
   - What we know: Current return type is `{ firstName, lastName, identifier }`. Idura provides `hetu`, `country`, `satu` etc.
   - What's unclear: Whether `extractedClaims` should be returned from the SvelteKit route or only passed to the Edge Function.
   - Recommendation: Add `extractedClaims: Record<string, string>` to the return type. The Edge Function (Phase 47) will use it; the frontend layout ignores it.

2. **Should providers validate their own required env vars at startup?**
   - What we know: Current code uses `?? ''` defaults which silently fail.
   - What's unclear: Whether to throw at startup or fail at first use.
   - Recommendation: Each provider should validate its required env vars when `getActiveProvider()` is first called, throwing a descriptive error. This catches misconfiguration early.

3. **Should the Idura provider's `exchangeCodeForToken` and `getAuthorizeUrl` be stub/throw in Phase 45?**
   - What we know: Phase 46 implements the actual JAR and private_key_jwt logic.
   - What's unclear: Whether Phase 45 should include working implementations or `throw new Error('Not implemented')`.
   - Recommendation: Phase 45 should include the method signatures returning `throw new Error('Idura authorize flow not yet implemented -- see Phase 46')`. This makes it clear the interface is complete but the Idura-specific logic comes later.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (workspace config) |
| Config file | `apps/frontend/vitest.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROV-01 | `getActiveProvider()` returns correct provider for each env var value | unit | `yarn workspace @openvaa/frontend test:unit -- --run providers` | No -- Wave 0 |
| PROV-02 | Provider interface satisfied by both signicat and idura modules | unit (type check) | `yarn workspace @openvaa/frontend test:unit -- --run providers` | No -- Wave 0 |
| CONF-01 | Env vars documented in .env.example | manual (review) | N/A | N/A |
| CONF-02 | Key generation documented | manual (review) | N/A | N/A |
| CONF-03 | Server constants include Idura vars | unit | `yarn workspace @openvaa/frontend test:unit -- --run constants` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend test:unit`
- **Per wave merge:** `yarn test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/frontend/src/lib/api/utils/auth/providers/providers.test.ts` -- covers PROV-01, PROV-02 (provider factory, type conformance)
- [ ] Mock env var setup in test file (vitest `vi.mock` for `$lib/utils/constants`)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `getIdTokenClaims.ts`, `generateChallenge.ts`, `constants.ts`, `route.ts`, `+server.ts` (token route), `signicat-callback/index.ts` -- direct code analysis
- `.planning/idura-ftn-auth-plan.md` -- project-specific architecture plan
- `.planning/phases/45-provider-abstraction-and-configuration/45-CONTEXT.md` -- user decisions

### Secondary (MEDIUM confidence)
- [Signicat private_key_jwt docs](https://developer.signicat.com/docs/eid-hub/oidc/advanced-security/client-authentication-with-private-key-jwt/) -- client_assertion JWT format, claims, token endpoint body
- [Idura signed authorization requests blog](https://idura.eu/blog/signed-authorization-requests) -- JAR format, RFC 9101 usage
- [Idura FTN compliance checker guide](https://idura.eu/blog/how-to-use-the-ftn-compliance-checker) -- 4 mandatory FTN requirements
- [Traficom 213/2023 OIDC Profile](https://www.kyberturvallisuuskeskus.fi/sites/default/files/media/file/Traficom_S213_2023_OIDC_Profile_v2_2_for_the_Finnish_Trust_Network_EN.pdf) -- FTN specification (RSA 2048+ bit, 224+ bit digest)
- jose npm package v6.2.2 -- verified current on npm registry

### Tertiary (LOW confidence)
- Idura docs site (docs.idura.app) -- could not scrape JS-rendered SPA content; details inferred from blog posts and old Criipto docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- jose already installed, SvelteKit env patterns well-established in codebase
- Architecture: HIGH -- provider pattern directly specified in user decisions (D-01 through D-10), code structure follows existing conventions
- Pitfalls: HIGH -- derived from direct analysis of existing code dependencies and SvelteKit constraints
- FTN requirements: MEDIUM -- Traficom spec confirmed via search but PDF not directly scraped; algorithms verified through Idura blog + Signicat docs

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable domain -- OIDC specs and jose library are mature)
