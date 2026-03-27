# Phase 46: Idura Authorization and Token Exchange - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the Idura-specific authorization flow (server-side JAR construction, private_key_jwt token exchange) and create a provider-agnostic callback route. Frontend preregister page uses the provider abstraction from Phase 45.

</domain>

<decisions>
## Implementation Decisions

### Authorization endpoint
- **D-01:** New server-side endpoint at `apps/frontend/src/routes/api/oidc/authorize/+server.ts`
- **D-02:** Constructs signed JWT Authorization Request (JAR) with RS256 using the signing private key
- **D-03:** JAR payload: `response_type`, `response_mode`, `client_id`, `redirect_uri`, `state`, `scope`, `nonce`, `iss` (=client_id), `aud` (=Idura domain)
- **D-04:** Returns `{ authorizeUrl }` — the Idura authorization URL with `client_id` and `request` (signed JWT) params

### Callback route
- **D-05:** New provider-agnostic callback at `apps/frontend/src/routes/api/oidc/callback/+server.ts` (API-style, alongside `/api/oidc/token` and `/api/oidc/authorize`)
- **D-06:** Old `signicat/oidc/callback` route deleted entirely — no redirect, no backward compat
- **D-07:** Route map updated: `CandAppPreregisterIdentityProviderCallback` points to `/api/oidc/callback`

### Token exchange
- **D-08:** Idura token exchange uses `private_key_jwt` client assertion JWT (RS256, signed with signing key, aud=Idura token endpoint, exp=5min, jti=random UUID)
- **D-09:** Token exchange POST body: `grant_type=authorization_code`, `code`, `redirect_uri`, `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer`, `client_assertion`
- **D-10:** JWE decryption supports both RSA-OAEP (Signicat) and RSA-OAEP-256 (Idura) — algorithm read from JWE header, not hardcoded

### Frontend changes
- **D-11:** Preregister page's `redirectToIdentityProvider()` calls the provider abstraction's `getAuthorizeUrl()` instead of building URL client-side
- **D-12:** For Idura: calls server-side `/api/oidc/authorize` endpoint. For Signicat: retains client-side PKCE redirect.

### Claude's Discretion
- State/nonce generation and verification approach
- Error handling for JAR construction failures
- Exact callback route handling (SvelteKit page vs server route)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Implementation plan
- `.planning/idura-ftn-auth-plan.md` — Phases 2-4: authorize route, token exchange, frontend changes with code examples

### Existing code to modify
- `apps/frontend/src/routes/api/oidc/token/+server.ts` — Current token exchange with client_secret (to use provider abstraction)
- `apps/frontend/src/routes/candidate/preregister/+page.svelte` — Current client-side PKCE redirect (to use provider getAuthorizeUrl)
- `apps/frontend/src/routes/candidate/preregister/signicat/oidc/callback/+page.svelte` — To be deleted
- `apps/frontend/src/lib/utils/route/route.ts:42` — Route map with TODO about shorter URL

### Idura OIDC
- Idura OIDC intro: `https://docs.idura.app/verify/getting-started/oidc-intro/`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `jose` library: Already used for JWE/JWT — same library for JAR signing and client assertion JWT
- Token exchange endpoint structure: POST handler with URLSearchParams body, cookie setting
- `getIdTokenClaims.ts`: JWE decryption logic reusable — just needs algorithm flexibility

### Established Patterns
- API routes return JSON with DataApiActionResult type
- Server-side routes use `$lib/server/constants` for private env vars
- Cookie-based id_token storage with httpOnly, secure, strict sameSite

### Integration Points
- Provider abstraction from Phase 45 (`getAuthorizeUrl()`, `exchangeCodeForToken()`)
- Route map in `route.ts` — callback path change
- Candidate context's `exchangeCodeForIdToken` function used by callback page

</code_context>

<specifics>
## Specific Ideas

- The `/api/oidc/` prefix groups all OIDC operations: `authorize`, `token`, `callback`
- Callback is now a server route (+server.ts), not a page (+page.svelte) — handles the code exchange server-side and redirects

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 46-idura-authorization-and-token-exchange*
*Context gathered: 2026-03-27*
