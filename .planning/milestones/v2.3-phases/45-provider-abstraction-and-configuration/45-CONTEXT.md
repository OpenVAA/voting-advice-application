# Phase 45: Provider Abstraction and Configuration - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a provider abstraction layer that lets deployments switch between Signicat and Idura identity providers via env config. Define the shared interface, implement both provider modules, update env vars and constants, and document key generation.

</domain>

<decisions>
## Implementation Decisions

### Provider interface design
- **D-01:** Provider interface defines 3 operations: `getAuthorizeUrl()`, `exchangeCodeForToken()`, `getIdTokenClaims()`
- **D-02:** Provider selection via `PUBLIC_IDENTITY_PROVIDER_TYPE` env var (`signicat` | `idura`)
- **D-03:** Provider modules at `apps/frontend/src/lib/api/utils/auth/providers/signicat.ts` and `idura.ts` with `index.ts` exporting the active provider

### Identity matching and claim extraction configuration
- **D-04:** Auth config defines `identityMatchProp` — which id_token claim to use for user matching (e.g., `sub` for Idura, `birthdate` for Signicat)
- **D-05:** Auth config defines `extractClaims` — which other claims to save in user metadata (e.g., `birthdate`, `hetu` for Idura)
- **D-06:** Auth config defines `firstNameProp` and `lastNameProp` — which claims map to the candidate's first/last name (e.g., `given_name` and `family_name` for both providers)
- **D-07:** The Edge Function stores in app_metadata: the matching prop name, its value, and all extracted claims. Uses firstNameProp/lastNameProp to populate the candidate record.

### Configuration structure
- **D-08:** Idura-specific env vars: `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`, `IDURA_DOMAIN` (or reuse generic names with provider-specific values)
- **D-09:** Shared env vars that work for both providers: `IDENTITY_PROVIDER_DECRYPTION_JWKS`, `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_ISSUER`, `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`
- **D-10:** Idura credentials collected: domain=`openvaa.test.idura.broker`, client_id=`urn:my:application:identifier:498295`, RSA key pairs generated (signing kid=`openvaa-signing-1`, encryption kid=`openvaa-encryption-1`)

### Claude's Discretion
- Exact TypeScript interface shape and generics
- Whether to use a class or functional approach for providers
- How to structure the auth config (inline in provider module vs separate config file)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing auth implementation
- `.planning/idura-ftn-auth-plan.md` — Full implementation plan with architecture, code examples, file list
- `apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts` — Current JWE decrypt + JWT verify logic (to be wrapped by provider)
- `apps/frontend/src/lib/api/utils/auth/generateChallenge.ts` — Current PKCE challenge generation (Signicat-specific)
- `apps/frontend/src/lib/server/constants.ts` — Server-side env vars (to be extended)
- `apps/frontend/src/lib/utils/constants.ts` — Public env vars (to be extended)
- `.env.example` — Env var documentation (to be updated)

### Idura documentation
- Idura OIDC intro: `https://docs.idura.app/verify/getting-started/oidc-intro/`
- Idura FTN docs: `https://docs.idura.app/verify/e-ids/finnish-trust-network/`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getIdTokenClaims.ts`: JWE decryption + JWT verification — core logic reusable by both providers, just needs algorithm flexibility (RSA-OAEP vs RSA-OAEP-256)
- `generateChallenge.ts`: PKCE generation — Signicat-specific, Idura uses JAR instead
- `jose` library: Already installed and used for JWE/JWT operations

### Established Patterns
- Server-side env vars via `$env/dynamic/private` in `$lib/server/constants.ts`
- Public env vars via `$env/dynamic/public` in `$lib/utils/constants.ts`
- API routes at `apps/frontend/src/routes/api/` for server-side operations

### Integration Points
- `apps/frontend/src/routes/api/oidc/token/+server.ts` — Token exchange endpoint (to be modified to use provider)
- `apps/frontend/src/lib/utils/route/route.ts` — Route map (callback URL to be updated)
- `apps/frontend/src/routes/candidate/preregister/+page.svelte` — Preregister page (redirectToIdentityProvider function)

</code_context>

<specifics>
## Specific Ideas

- Idura dashboard already configured: OAuth2 Code Flow enabled, signedAndEncryptedJwt for both id_token and user info, static Client JWKS registered
- Identity matching should be fully configurable — not hardcoded to any provider's claim names
- The `identityMatchProp` + `extractClaims` config pattern makes the system extensible to future identity providers without code changes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 45-provider-abstraction-and-configuration*
*Context gathered: 2026-03-27*
