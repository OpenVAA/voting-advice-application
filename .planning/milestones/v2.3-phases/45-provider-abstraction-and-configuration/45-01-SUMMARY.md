---
phase: 45-provider-abstraction-and-configuration
plan: 01
subsystem: frontend-auth
tags: [oidc, provider-abstraction, types, env-config, documentation]
dependency_graph:
  requires: []
  provides: [IdentityProvider-interface, AuthConfig-type, IDURA-constants, provider-type-env]
  affects: [45-02, 46, 47, 48]
tech_stack:
  added: []
  patterns: [provider-interface, discriminated-union, claim-config]
key_files:
  created:
    - apps/frontend/src/lib/api/utils/auth/providers/types.ts
    - apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts
    - docs/key-generation.md
  modified:
    - apps/frontend/src/lib/server/constants.ts
    - apps/frontend/src/lib/utils/constants.ts
    - .env.example
decisions:
  - "ProviderType as literal union ('signicat' | 'idura') not enum -- matches existing codebase patterns"
  - "IdTokenClaimsResult as discriminated type alias not interface -- cleaner for success/failure union"
  - "PUBLIC_IDENTITY_PROVIDER_TYPE defaults to 'signicat' for backward compatibility"
  - "Idura env vars use IDURA_ prefix (not generic) for clarity per D-08"
metrics:
  duration: 271s
  completed: "2026-03-27T10:50:16Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 3
---

# Phase 45 Plan 01: Provider Abstraction Types and Configuration Summary

IdentityProvider interface with 3 operations (getAuthorizeUrl, exchangeCodeForToken, getIdTokenClaims), AuthConfig claim mapping for Signicat (birthdate) and Idura (sub), server/public constants extended with Idura env vars, .env.example restructured with provider sections, RSA key generation documented.

## Changes Made

### Task 1: Create provider interface types and auth config
**Commit:** a1811c5c6

Created the `providers/` directory under `apps/frontend/src/lib/api/utils/auth/` with two files:

- **types.ts** -- Defines the core abstractions:
  - `ProviderType` literal union (`'signicat' | 'idura'`)
  - `AuthConfig` interface with `identityMatchProp`, `extractClaims`, `firstNameProp`, `lastNameProp`
  - `AuthorizeParams/Result`, `TokenExchangeParams/Result`, `IdTokenClaimsResult` types
  - `IdentityProvider` interface with `type`, `authConfig`, and 3 async operations
  - `IdTokenClaimsResult` extends the existing return type with `extractedClaims: Record<string, string>`

- **authConfig.ts** -- Defines per-provider claim mapping:
  - `SIGNICAT_AUTH_CONFIG`: identity matching via `birthdate`, extracts `['birthdate']`
  - `IDURA_AUTH_CONFIG`: identity matching via `sub`, extracts `['birthdate', 'hetu', 'country']`
  - Both use `given_name`/`family_name` for name claims

### Task 2: Update constants and env var documentation
**Commit:** 072300db7

- **Server constants** (`apps/frontend/src/lib/server/constants.ts`): Added `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`, `IDURA_DOMAIN` -- all existing constants preserved
- **Public constants** (`apps/frontend/src/lib/utils/constants.ts`): Added `PUBLIC_IDENTITY_PROVIDER_TYPE` with default `'signicat'` for backward compatibility -- all existing constants preserved
- **.env.example**: Restructured identity provider section with clear subsections (shared, Signicat-specific, Idura-specific); all existing non-auth sections unchanged
- **docs/key-generation.md**: RSA 2048-bit key generation with openssl + jose PEM-to-JWK conversion for both signing (RS256) and encryption (RSA-OAEP-256) key pairs; includes JWKS format, provider registration, and security notes

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all files contain complete implementations for their scope. The IdentityProvider interface is intentionally a contract definition (not a stub); actual provider implementations are in Plan 02.

## Verification Results

- TypeScript compilation: no errors in providers/ files (pre-existing errors in other files are unrelated)
- All acceptance criteria verified for both tasks
- All 6 created/modified files confirmed on disk
- Both commits verified in git log

## Self-Check: PASSED

All 6 files found on disk. Both commits (a1811c5c6, 072300db7) verified in git log.
