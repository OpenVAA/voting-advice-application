# Phase 48: Backward Compatibility and Testing - Research

**Researched:** 2026-03-27
**Domain:** Unit testing for OIDC provider abstraction, JWE/JWT crypto, Edge Function logic; E2E regression for candidate registration
**Confidence:** HIGH

## Summary

Phase 48 is the testing and validation phase for the Idura FTN auth integration (Phases 45-47). The goal is to write unit tests covering both Signicat and Idura code paths through the provider abstraction layer, and to ensure existing E2E candidate registration tests (email-based) continue passing with the updated provider-agnostic callback route.

The testing domain is well-understood. The project already uses vitest for unit tests and Playwright for E2E, with established patterns for mocking SvelteKit env modules (`$env/dynamic/public`, `$env/dynamic/private`) and Supabase clients. The `jose` library (v6.2.1, already installed) provides all the APIs needed to generate synthetic JWE/JWT tokens as test fixtures -- `generateKeyPair`, `SignJWT`, `CompactEncrypt`, `exportJWK`, and `createLocalJWKSet` are all available and verified working.

Edge Function unit testing is constrained by the absence of Deno on the development machine. The Edge Function (`identity-callback`) runs in Deno with `Deno.env.get()` and `Deno.serve()`. Since Deno is not installed, Edge Function logic must be tested either by extracting pure functions into testable modules importable by vitest, or by testing the function's behavior indirectly through E2E-style invocations via `supabase.functions.invoke()`. The extracted pure function approach is recommended.

**Primary recommendation:** Write co-located vitest unit tests for provider modules, `getIdTokenClaims`, JAR construction, and `private_key_jwt` assertion. For Edge Function logic, extract pure functions (claim extraction, identity matching config) into a shared module testable by vitest. Verify E2E candidate-registration tests pass unchanged.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Unit tests only for provider-specific logic -- no E2E tests for the OIDC redirect flow (requires real identity provider)
- **D-02:** No mock OIDC server -- keep test infrastructure simple
- **D-03:** Existing E2E registration tests (email-based) must continue passing -- regression guard
- **D-04:** Test provider abstraction: both Signicat and Idura modules implement the interface correctly
- **D-05:** Test JAR construction: signed JWT has correct headers, payload, and signature
- **D-06:** Test private_key_jwt client assertion: correct format, audience, expiry
- **D-07:** Test Edge Function identity matching: configurable claim lookup, metadata storage, candidate creation
- **D-08:** Test JWE decryption with both RSA-OAEP and RSA-OAEP-256 algorithms
- **D-09:** When `PUBLIC_IDENTITY_PROVIDER_TYPE=signicat`, the entire auth flow works identically to pre-v2.3 behavior
- **D-10:** Signicat provider module wraps the existing client-side PKCE + client_secret flow unchanged

### Claude's Discretion
- Test file organization (co-located vs central test directory)
- Test fixture design for JWE/JWT tokens
- Whether to use vitest mocks or manual test doubles

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROV-03 | Existing Signicat flow continues to work unchanged when selected as provider | Signicat provider unit tests verify interface compliance; E2E registration tests validate no behavioral regression |
| TEST-01 | Unit tests cover provider abstraction layer (both Signicat and Idura paths) | vitest with jose v6 test fixtures for JWE/JWT generation; mock patterns established in codebase |
| TEST-02 | E2E preregistration tests work with provider-agnostic callback route | Existing candidate-registration.spec.ts is email-based (not OIDC) -- must pass with route map update from Phase 46 |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 3.2.4 (catalog) | Unit test framework | Already configured project-wide via Turborepo; every package uses it |
| jose | 6.2.1 | Test fixture generation (JWE/JWT tokens) | Same library used in production -- ensures test tokens match real token format exactly |
| @playwright/test | (project-configured) | E2E regression tests | Already configured with project dependency graph in playwright.config.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest (vi.mock) | 3.2.4 | Module mocking for SvelteKit env vars | Mocking `$env/dynamic/public`, `$env/dynamic/private`, `$lib/server/constants` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jose for test fixtures | jsonwebtoken + node-jose | jose is already the production dependency; using it avoids format mismatches |
| Deno test for Edge Function | Extract pure functions to vitest | Deno not installed; extraction creates better separation of concerns anyway |

**Installation:**
No new packages needed. All dependencies are already in the project.

## Architecture Patterns

### Recommended Test File Structure
```
apps/frontend/src/lib/api/utils/auth/
  getIdTokenClaims.test.ts          # JWE decryption tests (RSA-OAEP + RSA-OAEP-256)
  providers/
    signicat.test.ts                # Signicat provider interface compliance
    idura.test.ts                   # Idura provider interface compliance
    __fixtures__/
      keys.ts                       # Shared RSA key pair generation helpers
      tokens.ts                     # JWE/JWT token builders
apps/frontend/src/routes/api/oidc/
  authorize/
    +server.test.ts                 # JAR construction tests (if unit-testable)
  token/
    +server.test.ts                 # Token exchange with private_key_jwt

# Edge Function extracted logic (created by Phase 47 or this phase):
apps/supabase/supabase/functions/identity-callback/
  claimExtraction.ts                # Pure functions extracted from index.ts
  claimExtraction.test.ts           # Vitest tests (or a separate test file)
```

### Pattern 1: Test Fixture Factory for JWE/JWT Tokens
**What:** A reusable factory that generates properly formatted JWE and JWT tokens for tests using the same `jose` library as production code.
**When to use:** Every unit test that needs to verify JWE decryption or JWT verification.
**Example:**
```typescript
// Source: Verified with jose v6.2.1 API (installed in project)
import { generateKeyPair, exportJWK, SignJWT, CompactEncrypt } from 'jose';

interface TestKeySet {
  signingPrivateKey: CryptoKey;
  signingPublicJWK: jose.JWK;
  encryptionPublicKey: CryptoKey;
  encryptionPrivateJWK: jose.JWK;  // with kid
}

export async function createTestKeySet(opts?: {
  encAlg?: 'RSA-OAEP' | 'RSA-OAEP-256';
  kid?: string;
}): Promise<TestKeySet> {
  const encAlg = opts?.encAlg ?? 'RSA-OAEP';
  const kid = opts?.kid ?? 'test-enc-key';

  const { publicKey: sigPub, privateKey: sigPriv } = await generateKeyPair('RS256', { extractable: true });
  const { publicKey: encPub, privateKey: encPriv } = await generateKeyPair(encAlg, { extractable: true });

  const sigPubJwk = await exportJWK(sigPub);
  const encPrivJwk = { ...(await exportJWK(encPriv)), kid };

  return {
    signingPrivateKey: sigPriv,
    signingPublicJWK: sigPubJwk,
    encryptionPublicKey: encPub,
    encryptionPrivateJWK: encPrivJwk
  };
}

export async function createTestJwe(
  claims: Record<string, unknown>,
  keys: TestKeySet,
  opts?: { encAlg?: 'RSA-OAEP' | 'RSA-OAEP-256'; issuer?: string; audience?: string }
): Promise<string> {
  const jwt = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(opts?.issuer ?? 'test-issuer')
    .setAudience(opts?.audience ?? 'test-audience')
    .setExpirationTime('5m')
    .sign(keys.signingPrivateKey);

  return new CompactEncrypt(new TextEncoder().encode(jwt))
    .setProtectedHeader({
      alg: opts?.encAlg ?? 'RSA-OAEP',
      enc: 'A256GCM',
      kid: keys.encryptionPrivateJWK.kid!
    })
    .encrypt(keys.encryptionPublicKey);
}
```

### Pattern 2: SvelteKit Env Mocking for Server-Side Code
**What:** Mock both `$env/dynamic/public` and `$env/dynamic/private` to test server-side code that imports from `$lib/server/constants`.
**When to use:** Testing provider modules and route handlers that depend on env vars.
**Example:**
```typescript
// Source: Established pattern in supabaseDataWriter.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock BOTH env modules before any imports
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'test-client-id',
    PUBLIC_IDENTITY_PROVIDER_TYPE: 'idura',
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    IDENTITY_PROVIDER_DECRYPTION_JWKS: '[]',
    IDENTITY_PROVIDER_JWKS_URI: 'https://test.example/.well-known/jwks',
    IDENTITY_PROVIDER_ISSUER: 'https://test.example',
    IDENTITY_PROVIDER_TOKEN_ENDPOINT: 'https://test.example/token',
    IDENTITY_PROVIDER_CLIENT_SECRET: 'test-secret',
    IDURA_SIGNING_JWKS: '[]',
    IDURA_SIGNING_KEY_KID: 'test-signing-kid'
  }
}));
```

### Pattern 3: Direct Function Import for Edge Function Testing
**What:** Extract pure functions from the Edge Function into a separate module, import them directly into vitest tests.
**When to use:** Testing Edge Function identity matching and claim extraction without Deno runtime.
**Example:**
```typescript
// In identity-callback/claimConfig.ts (extractable pure logic):
export interface ProviderClaimConfig {
  identityMatchProp: string;
  firstNameProp: string;
  lastNameProp: string;
  extractClaims: string[];
}

export const PROVIDER_CONFIGS: Record<string, ProviderClaimConfig> = {
  signicat: {
    identityMatchProp: 'birthdate',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: []
  },
  idura: {
    identityMatchProp: 'sub',
    firstNameProp: 'given_name',
    lastNameProp: 'family_name',
    extractClaims: ['birthdate', 'hetu']
  }
};

export function extractIdentityClaims(
  payload: Record<string, unknown>,
  config: ProviderClaimConfig
): { matchValue: string; firstName: string; lastName: string; extraClaims: Record<string, unknown> } {
  const matchValue = payload[config.identityMatchProp];
  if (!matchValue || typeof matchValue !== 'string') {
    throw new Error(`Missing identity match claim: ${config.identityMatchProp}`);
  }
  // ... extraction logic
}
```

### Anti-Patterns to Avoid
- **Starting a mock OIDC server:** Decision D-02 explicitly forbids this. Keep test infrastructure simple -- use jose to generate tokens directly.
- **Testing the full OIDC redirect flow in E2E:** Decision D-01 forbids this -- it requires a real identity provider. Unit tests cover the individual components.
- **Hardcoding test keys inline:** Use a shared fixture factory (`createTestKeySet`) so all tests use properly generated RSA key pairs.
- **Using `createRemoteJWKSet` in tests:** This fetches from a URL. Use `createLocalJWKSet` instead for test isolation.
- **Importing Deno APIs in vitest:** The Edge Function uses `Deno.env.get()` and `Deno.serve()`. Extract testable pure functions that don't depend on Deno globals.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWE test tokens | Manual string concatenation of 5-part tokens | `jose.CompactEncrypt` | JWE format is complex (base64url encoding, key wrapping, GCM encryption); hand-rolled tokens will not decrypt correctly |
| JWT test tokens | Manual base64-encoded JSON + fake signature | `jose.SignJWT` | Signature verification requires real RSA signing; fake signatures fail `jwtVerify` |
| RSA key pairs | Hardcoded PEM strings | `jose.generateKeyPair` | Generated per-test keys avoid stale key material and ensure proper format |
| JWKS endpoint mock | HTTP server for `/.well-known/jwks` | `jose.createLocalJWKSet` | In-memory JWKS set avoids network calls and flaky tests |

**Key insight:** The `jose` library that runs in production can also generate all test fixtures. This eliminates format mismatches between test inputs and what the production code expects.

## Common Pitfalls

### Pitfall 1: vi.mock Hoisting Order
**What goes wrong:** `vi.mock('$env/dynamic/public', ...)` must be called before importing any module that transitively imports the env module. If the import is above the mock call, vitest's hoisting may not catch it.
**Why it happens:** Vitest hoists `vi.mock` calls to the top of the file, but static imports in the same file are also hoisted. The mock must be declared in the same top-level scope, before any `import` of the module under test.
**How to avoid:** Always place `vi.mock` calls at the very top of the test file, before all other imports except `vitest` itself. The established pattern in the codebase (see `supabaseDataWriter.test.ts`) does this correctly.
**Warning signs:** "Cannot read properties of undefined" errors on env vars during test setup.

### Pitfall 2: Async Key Generation in Test Setup
**What goes wrong:** `jose.generateKeyPair()` is async. If used in `describe()` scope directly, the keys will be undefined when tests run.
**Why it happens:** `describe()` callbacks are synchronous; async operations must go in `beforeAll()` or `beforeEach()`.
**How to avoid:** Generate keys in a `beforeAll()` block or use a lazy initialization pattern.
**Warning signs:** "Cannot read properties of undefined (reading 'type')" when trying to sign/encrypt with a key.

### Pitfall 3: createLocalJWKSet vs createRemoteJWKSet
**What goes wrong:** Production code uses `createRemoteJWKSet(new URL(jwksUri))` to fetch the provider's public keys. Tests that import this code will attempt HTTP requests to the JWKS URI.
**Why it happens:** The JWKS URI is a real URL that doesn't exist in the test environment.
**How to avoid:** Mock the JWKS verification step or restructure the function to accept a JWKS getter as a parameter (dependency injection). For `getIdTokenClaims`, the function already accepts `options.publicSignatureJWKSetUri` -- in tests, either mock `jose.createRemoteJWKSet` or provide a local HTTP server URL. The cleanest approach: refactor to accept a `getKey` function parameter that defaults to `createRemoteJWKSet` in production.
**Warning signs:** Network timeout errors or ECONNREFUSED in tests.

### Pitfall 4: Edge Function Deno Imports in vitest
**What goes wrong:** The Edge Function imports from `https://deno.land/x/jose` and `https://esm.sh/@supabase/supabase-js@2` -- URL imports that vitest cannot resolve.
**Why it happens:** Edge Functions use Deno's URL import system, not npm.
**How to avoid:** Extract testable pure functions into a separate file that does NOT have Deno-specific imports. The pure functions (claim extraction, config lookup, identity matching) can use standard TypeScript imports.
**Warning signs:** "Cannot find module 'https://deno.land/x/...'" errors.

### Pitfall 5: E2E Tests Referencing Old Callback Route
**What goes wrong:** If the callback route path changes from `/candidate/preregister/signicat/oidc/callback` to `/api/oidc/callback` (Phase 46, D-07), any E2E test that directly navigates to or asserts on the old path will break.
**Why it happens:** Route map update in `route.ts` changes `CandAppPreregisterIdentityProviderCallback`.
**How to avoid:** Verify that existing E2E tests (candidate-registration.spec.ts, candidate-auth.spec.ts) do NOT reference the Signicat callback route. From reviewing the code: the existing E2E tests are email-based registration -- they do NOT test the OIDC callback route. They should pass unchanged.
**Warning signs:** 404 errors in E2E tests after route changes.

## Code Examples

Verified patterns from the project and jose v6 API:

### Testing getIdTokenClaims with Both Encryption Algorithms
```typescript
// Source: jose v6.2.1 API verified locally + getIdTokenClaims.ts production code
import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as jose from 'jose';

// Mock env modules
vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { getIdTokenClaims } from './getIdTokenClaims';

describe('getIdTokenClaims', () => {
  let signingPrivateKey: CryptoKey;
  let signingPublicJWK: jose.JWK;

  beforeAll(async () => {
    const sigKeyPair = await jose.generateKeyPair('RS256', { extractable: true });
    signingPrivateKey = sigKeyPair.privateKey;
    signingPublicJWK = await jose.exportJWK(sigKeyPair.publicKey);
  });

  async function buildJwe(claims: Record<string, unknown>, encAlg: 'RSA-OAEP' | 'RSA-OAEP-256') {
    const encKeyPair = await jose.generateKeyPair(encAlg, { extractable: true });
    const encPrivJwk = { ...(await jose.exportJWK(encKeyPair.privateKey)), kid: `enc-${encAlg}` };

    const jwt = await new jose.SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: 'sig-key' })
      .setIssuer('test-issuer')
      .setAudience('test-client')
      .setExpirationTime('5m')
      .sign(signingPrivateKey);

    const jwe = await new jose.CompactEncrypt(new TextEncoder().encode(jwt))
      .setProtectedHeader({ alg: encAlg, enc: 'A256GCM', kid: encPrivJwk.kid })
      .encrypt(encKeyPair.publicKey);

    return { jwe, encPrivJwk };
  }

  it('decrypts RSA-OAEP JWE (Signicat)', async () => {
    const { jwe, encPrivJwk } = await buildJwe(
      { given_name: 'Matti', family_name: 'Meikalainen', birthdate: '1990-01-15' },
      'RSA-OAEP'
    );

    // Note: createLocalJWKSet is used instead of createRemoteJWKSet
    // The function under test needs to be called with options that avoid remote JWKS fetch
    const result = await getIdTokenClaims(jwe, {
      privateEncryptionJWKSet: [encPrivJwk],
      publicSignatureJWKSetUri: 'unused-in-this-test', // will need mock/DI
      audience: 'test-client',
      issuer: 'test-issuer'
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('Matti');
      expect(result.data.lastName).toBe('Meikalainen');
      expect(result.data.identifier).toBe('1990-01-15');
    }
  });
});
```

### Testing Provider Interface Compliance
```typescript
// Source: Provider interface from Phase 45 CONTEXT.md D-01
import { describe, it, expect, vi } from 'vitest';

// Mock env modules
vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_IDENTITY_PROVIDER_TYPE: 'signicat', PUBLIC_IDENTITY_PROVIDER_CLIENT_ID: 'test' }
}));
vi.mock('$env/dynamic/private', () => ({
  env: { IDENTITY_PROVIDER_CLIENT_SECRET: 'secret', IDENTITY_PROVIDER_TOKEN_ENDPOINT: 'https://test/token' }
}));

import { signicatProvider } from './signicat';

describe('Signicat provider', () => {
  it('implements getAuthorizeUrl', () => {
    expect(typeof signicatProvider.getAuthorizeUrl).toBe('function');
  });

  it('implements exchangeCodeForToken', () => {
    expect(typeof signicatProvider.exchangeCodeForToken).toBe('function');
  });

  it('implements getIdTokenClaims', () => {
    expect(typeof signicatProvider.getIdTokenClaims).toBe('function');
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jose v4 `new jose.JWE.Encrypt()` | jose v6 `new CompactEncrypt()` | jose v5+ | API surface changed; v6 is ESM-only |
| Deno test for Edge Functions | Extract pure functions, test with vitest | Project convention | Avoids Deno runtime dependency for testing |

**Deprecated/outdated:**
- jose v4 API (`jose.JWE`, `jose.JWS` namespaces) -- replaced by flat exports in v5+

## Open Questions

1. **getIdTokenClaims dependency on createRemoteJWKSet**
   - What we know: The function calls `jose.createRemoteJWKSet(new URL(options.publicSignatureJWKSetUri))` which requires a network-accessible JWKS endpoint.
   - What's unclear: Whether Phase 45/46 will refactor this to accept an injectable key getter, or if tests need to mock the jose module.
   - Recommendation: Tests should mock `jose.createRemoteJWKSet` to return a `createLocalJWKSet` with the test signing public key. Alternatively, if the provider abstraction layer wraps this function, test at the provider level where the JWKS fetch is mockable.

2. **Edge Function pure function extraction scope**
   - What we know: The Edge Function has several pure functions (`isJweToken`, `extractIdentityClaims`, `decryptJweToken`, `verifyJwt`) that are testable in isolation.
   - What's unclear: Whether Phase 47 will extract these into a separate importable module or keep them inline in `index.ts`.
   - Recommendation: If Phase 47 does not extract them, Phase 48 should extract the claim configuration and extraction logic into a separate `.ts` file that both the Edge Function and vitest can import. The Deno-specific parts (`Deno.env.get`, `Deno.serve`, `createClient` from esm.sh URL) stay in `index.ts`.

3. **Scope of "Signicat backward compatibility" testing**
   - What we know: D-09 says "entire auth flow works identically" but D-01 says "no E2E tests for OIDC redirect flow."
   - What's unclear: How to verify "identically" without an actual Signicat instance.
   - Recommendation: Unit-test that the Signicat provider module produces the same outputs as the pre-abstraction code: same URL format for `getAuthorizeUrl`, same POST body for `exchangeCodeForToken`, same JWE decryption for `getIdTokenClaims`. This validates interface compliance without needing a real provider.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| vitest | Unit tests | Yes | 3.2.4 (catalog) | -- |
| jose | Test fixtures | Yes | 6.2.1 | -- |
| Playwright | E2E regression | Yes | (project-configured) | -- |
| Deno | Edge Function unit tests | No | -- | Extract pure functions, test with vitest |
| Supabase local | E2E tests | Yes (via `supabase start`) | -- | -- |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- Deno: Not installed. Fallback: extract pure functions from Edge Function into testable modules, run via vitest instead of `deno test`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 + Playwright |
| Config file | `apps/frontend/vitest.config.ts` (unit), `tests/playwright.config.ts` (E2E) |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit && yarn test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROV-03 | Signicat flow unchanged when selected | unit | `yarn workspace @openvaa/frontend test:unit -- --testPathPattern providers/signicat` | No -- Wave 0 |
| TEST-01 | Unit tests cover both provider paths | unit | `yarn workspace @openvaa/frontend test:unit -- --testPathPattern providers/` | No -- Wave 0 |
| TEST-01 | JWE decryption with RSA-OAEP + RSA-OAEP-256 | unit | `yarn workspace @openvaa/frontend test:unit -- --testPathPattern getIdTokenClaims` | No -- Wave 0 |
| TEST-01 | JAR construction (Idura) | unit | `yarn workspace @openvaa/frontend test:unit -- --testPathPattern authorize` | No -- Wave 0 |
| TEST-01 | private_key_jwt client assertion | unit | `yarn workspace @openvaa/frontend test:unit -- --testPathPattern token` | No -- Wave 0 |
| TEST-01 | Edge Function claim extraction | unit | `yarn workspace @openvaa/frontend test:unit -- --testPathPattern claimExtraction` | No -- Wave 0 |
| TEST-02 | E2E preregistration tests pass | E2E | `yarn test:e2e -- --project candidate-app-mutation` | Yes -- `tests/tests/specs/candidate/candidate-registration.spec.ts` |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend test:unit`
- **Per wave merge:** `yarn test:unit && yarn test:e2e -- --project candidate-app-mutation`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/keys.ts` -- shared test key generation
- [ ] `apps/frontend/src/lib/api/utils/auth/providers/__fixtures__/tokens.ts` -- JWE/JWT token builders
- [ ] `apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts` -- Signicat provider tests
- [ ] `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts` -- Idura provider tests
- [ ] `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts` -- JWE decryption tests
- [ ] Edge Function extracted claim logic test file (location TBD based on Phase 47 output)

## Sources

### Primary (HIGH confidence)
- **jose v6.2.1 API** -- Verified locally via `node --input-type=module` that `generateKeyPair`, `SignJWT`, `CompactEncrypt`, `exportJWK`, `createLocalJWKSet`, `compactDecrypt`, `importJWK`, `jwtVerify`, `decodeProtectedHeader` all exist and work for both RSA-OAEP and RSA-OAEP-256
- **Existing test patterns** -- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` (vi.mock pattern), `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.test.ts` (chainable mock pattern)
- **vitest config** -- `apps/frontend/vitest.config.ts` (jsdom environment, SvelteKit alias resolution, env module stubs)
- **Playwright config** -- `tests/playwright.config.ts` (candidate-app-mutation project runs registration tests)

### Secondary (MEDIUM confidence)
- **Phase 45-47 CONTEXT.md files** -- Describe what code will be created/modified; Phase 48 tests against these outputs
- **getIdTokenClaims.ts** -- Current production code for JWE decryption + JWT verification
- **signicat-callback/index.ts** -- Current Edge Function with pure functions to extract

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- vitest and jose are already in the project; APIs verified locally
- Architecture: HIGH -- test patterns are well-established in the codebase; 22 existing test files follow consistent conventions
- Pitfalls: HIGH -- identified from actual codebase inspection (env mocking, Deno limitations, JWKS fetch in tests)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable domain -- testing patterns don't change frequently)
