# Phase 48: Backward Compatibility and Testing - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify that both Signicat and Idura auth paths work correctly. Write unit tests for the provider abstraction layer, JAR construction, private_key_jwt, and Edge Function logic. Ensure E2E preregistration tests work with the updated callback route.

</domain>

<decisions>
## Implementation Decisions

### Testing scope
- **D-01:** Unit tests only for provider-specific logic — no E2E tests for the OIDC redirect flow (requires real identity provider)
- **D-02:** No mock OIDC server — keep test infrastructure simple
- **D-03:** Existing E2E registration tests (email-based) must continue passing — regression guard

### Unit test coverage
- **D-04:** Test provider abstraction: both Signicat and Idura modules implement the interface correctly
- **D-05:** Test JAR construction: signed JWT has correct headers, payload, and signature
- **D-06:** Test private_key_jwt client assertion: correct format, audience, expiry
- **D-07:** Test Edge Function identity matching: configurable claim lookup, metadata storage, candidate creation
- **D-08:** Test JWE decryption with both RSA-OAEP and RSA-OAEP-256 algorithms

### Signicat backward compatibility
- **D-09:** When `PUBLIC_IDENTITY_PROVIDER_TYPE=signicat`, the entire auth flow works identically to pre-v2.3 behavior
- **D-10:** Signicat provider module wraps the existing client-side PKCE + client_secret flow unchanged

### Claude's Discretion
- Test file organization (co-located vs central test directory)
- Test fixture design for JWE/JWT tokens
- Whether to use vitest mocks or manual test doubles

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing test infrastructure
- `tests/tests/specs/candidate/candidate-registration.spec.ts` — Existing E2E registration tests (email-based, must keep passing)
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` — Example of existing unit test patterns

### Code to test
- Provider abstraction layer (from Phase 45)
- `/api/oidc/authorize` endpoint (from Phase 46)
- `/api/oidc/token` endpoint modifications (from Phase 46)
- `identity-callback` Edge Function (from Phase 47)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Vitest for unit tests (already configured across packages)
- Playwright for E2E (E2E tests don't test OIDC flow, but candidate-registration.spec.ts is a regression target)
- `jose` library can generate test JWE/JWT tokens for unit tests

### Established Patterns
- Unit tests use vitest with `.test.ts` extension
- E2E tests use Playwright with `.spec.ts` extension
- SupabaseAdminClient helper for E2E database operations

### Integration Points
- Provider modules need testable interfaces (injectable dependencies)
- Edge Function can be tested by importing functions directly (Deno test)

</code_context>

<specifics>
## Specific Ideas

- Use jose library to generate synthetic JWE tokens in tests — same library used in production
- Edge Function tests should verify the configurable claim matching works for both provider configs

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 48-backward-compatibility-and-testing*
*Context gathered: 2026-03-27*
