# Phase 47: Edge Function Provider Support - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Update the identity callback Edge Function to support both Signicat and Idura providers via configuration. Rename from `signicat-callback` to `identity-callback`. Identity matching uses configurable claim props, not hardcoded provider logic.

</domain>

<decisions>
## Implementation Decisions

### Edge Function naming and structure
- **D-01:** Rename `signicat-callback` to `identity-callback` — single provider-agnostic function
- **D-02:** Old `signicat-callback` directory deleted entirely
- **D-03:** Provider type read from env var (e.g., `IDENTITY_PROVIDER_TYPE`) to select matching config

### Identity matching approach
- **D-04:** Auth config defines `identityMatchProp` — which id_token claim to use for user lookup (e.g., `sub` for Idura, `birthdate` for Signicat)
- **D-05:** Edge Function searches `app_metadata` for `identity_match_value` matching the resolved claim value
- **D-06:** No migration for existing Signicat users — clean break when switching providers
- **D-07:** Auth config defines `firstNameProp` and `lastNameProp` for extracting candidate name from claims
- **D-08:** Auth config defines `extractClaims` for additional claims to save in user metadata (e.g., `birthdate`, `hetu`)

### Metadata storage
- **D-09:** `app_metadata` stores: `identity_provider` (provider type), `identity_match_prop` (claim name used), `identity_match_value` (claim value), plus all extracted claims
- **D-10:** Provider type stored for audit trail — tells you which provider authenticated the user

### JWE/JWT verification
- **D-11:** Decryption JWKS env var name stays generic: `IDENTITY_PROVIDER_DECRYPTION_JWKS` (same key name, different keys per provider)
- **D-12:** JWKS URI and issuer also generic: `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`

### Claude's Discretion
- How to structure the provider config (inline object vs env var parsing)
- Error message format for missing/invalid claims
- Whether to log provider-specific debugging info

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Edge Function
- `apps/supabase/supabase/functions/signicat-callback/index.ts` — Current implementation with birthdate matching, JWE decryption, user creation, candidate record, role assignment, magic link session

### Implementation plan
- `.planning/idura-ftn-auth-plan.md` — Phase 5: Edge Function options, Phase 6: env vars, identity matching differences

### Idura claims
- `.planning/idura-ftn-auth-plan.md` §"Idura FTN Claims" — JSON example with `sub`, `given_name`, `family_name`, `birthdate`, `hetu`, `satu`, `country`, `identityscheme`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Edge Function structure: CORS headers, request parsing, JWE decryption, JWT verification — all reusable
- `findUserByBirthdateId()` function — needs to be generalized to `findUserByIdentityMatch()` using configurable claim
- User creation, candidate record, role assignment, magic link session — all provider-agnostic already

### Established Patterns
- Edge Function uses Deno runtime with `https://deno.land/x/jose` import
- Supabase admin client for user/candidate operations
- CORS preflight handling

### Integration Points
- Supabase secrets for env vars (set via `supabase secrets set`)
- Frontend calls Edge Function via `supabase.functions.invoke('identity-callback', ...)`
- Frontend references function name in preregister flow

</code_context>

<specifics>
## Specific Ideas

- The configurable claim approach (`identityMatchProp`, `firstNameProp`, `lastNameProp`, `extractClaims`) makes the Edge Function truly provider-agnostic — adding a third provider would only require config, no code changes
- For Idura: `identityMatchProp=sub`, `firstNameProp=given_name`, `lastNameProp=family_name`, `extractClaims=[birthdate, hetu]`
- For Signicat: `identityMatchProp=birthdate`, `firstNameProp=given_name`, `lastNameProp=family_name`, `extractClaims=[]`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 47-edge-function-provider-support*
*Context gathered: 2026-03-27*
