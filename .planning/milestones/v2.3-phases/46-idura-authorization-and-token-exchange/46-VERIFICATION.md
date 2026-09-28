---
phase: 46-idura-authorization-and-token-exchange
verified: 2026-03-27T13:00:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 46: Idura Authorization and Token Exchange — Verification Report

**Phase Goal:** Candidates can authenticate via Idura's FTN bank authentication using server-side JAR and private_key_jwt
**Verified:** 2026-03-27
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| #  | Truth                                                                                                                                 | Status     | Evidence                                                                                                    |
|----|---------------------------------------------------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------|
| 1  | Server-side `/api/oidc/authorize` constructs a signed JWT Authorization Request and returns the Idura redirect URL                   | VERIFIED   | `apps/frontend/src/routes/api/oidc/authorize/+server.ts` calls `provider.getAuthorizeUrl()`, returns `{ authorizeUrl }` |
| 2  | Frontend preregister page calls the server-side authorize endpoint (not client-side PKCE) when provider is Idura                     | VERIFIED   | `+page.svelte` branches on `PUBLIC_IDENTITY_PROVIDER_TYPE === 'idura'`, calling `fetch('/api/oidc/authorize')` |
| 3  | Callback route works at a provider-agnostic path (not hardcoded to `signicat/oidc/callback`)                                         | VERIFIED   | `route.ts` line 42: `CandAppPreregisterIdentityProviderCallback: '/api/oidc/callback'`; old signicat dir deleted |
| 4  | Token exchange sends `private_key_jwt` client assertion (not `client_secret`) when provider is Idura                                 | VERIFIED   | `idura.ts` `exchangeCodeForToken` builds `client_assertion` JWT, POSTs `client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'` |
| 5  | JWE decryption handles both RSA-OAEP (Signicat) and RSA-OAEP-256 (Idura) without hardcoded algorithm                                | VERIFIED   | Both `signicat.ts` and `idura.ts` call `jose.compactDecrypt(idToken, key)` without algorithm constraint — `jose` reads `alg` from JWE header |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact                                                                          | Provides                                                     | Exists | Substantive | Wired  | Status     |
|-----------------------------------------------------------------------------------|--------------------------------------------------------------|--------|-------------|--------|------------|
| `apps/frontend/src/lib/api/utils/auth/providers/idura.ts`                        | Full Idura provider: JAR authorize + private_key_jwt token exchange | Yes  | Yes (166 lines, no stubs) | Yes (imported by providers/index.ts) | VERIFIED |
| `apps/frontend/src/lib/api/utils/auth/providers/types.ts`                        | AuthorizeResult with optional `state?` and `nonce?`          | Yes    | Yes (208 lines, full types) | Yes (imported by all providers) | VERIFIED |
| `apps/frontend/src/routes/api/oidc/authorize/+server.ts`                         | Server-side authorize endpoint delegating to active provider  | Yes    | Yes (54 lines, complete POST handler) | Yes (called by preregister page) | VERIFIED |
| `apps/frontend/src/routes/api/oidc/token/+server.ts`                             | Provider-abstracted token exchange (no hardcoded client_secret) | Yes | Yes (54 lines, POST + DELETE) | Yes (existing callers unchanged) | VERIFIED |
| `apps/frontend/src/routes/api/oidc/callback/+server.ts`                          | Provider-agnostic callback GET handler with CSRF state check  | Yes    | Yes (103 lines, complete GET handler) | Yes (route map points here; IdP redirects here) | VERIFIED |
| `apps/frontend/src/routes/candidate/preregister/+page.svelte`                    | Dual-provider redirectToIdentityProvider() using /api/oidc/authorize | Yes | Yes (165 lines, full implementation) | Yes (calls authorize endpoint for both providers) | VERIFIED |
| `apps/frontend/src/lib/utils/route/route.ts`                                     | Route map with provider-agnostic callback path                | Yes    | Yes (line 42 updated) | Yes (used by preregister page) | VERIFIED |

---

### Key Link Verification

**Plan 01 Key Links:**

| From                                     | To                                          | Via                                | Status  | Evidence                                                                     |
|------------------------------------------|---------------------------------------------|------------------------------------|---------|------------------------------------------------------------------------------|
| `routes/api/oidc/authorize/+server.ts`   | `providers/index.ts`                        | `getActiveProvider()` call         | WIRED   | Line 14 import, line 25 call                                                 |
| `routes/api/oidc/token/+server.ts`       | `providers/index.ts`                        | `getActiveProvider().exchangeCodeForToken()` | WIRED | Line 14 import, line 22 call                                      |
| `providers/idura.ts`                     | `lib/server/constants.ts`                   | imports `IDURA_SIGNING_JWKS`, `IDURA_SIGNING_KEY_KID`, `IDURA_DOMAIN` | WIRED | Line 22 import; constants used at lines 36, 37, 39, 66, 72, 85 |

**Plan 02 Key Links:**

| From                                         | To                                    | Via                                            | Status  | Evidence                                                                     |
|----------------------------------------------|---------------------------------------|------------------------------------------------|---------|------------------------------------------------------------------------------|
| `routes/api/oidc/callback/+server.ts`        | `providers/index.ts`                  | `getActiveProvider().exchangeCodeForToken()` + `.getIdTokenClaims()` | WIRED | Line 20 import, lines 62, 66, 73 calls |
| `routes/candidate/preregister/+page.svelte`  | `routes/api/oidc/authorize/+server.ts`| `fetch('/api/oidc/authorize')` for both providers | WIRED | Lines 71 and 90                                                    |
| `routes/candidate/preregister/+page.svelte`  | `lib/utils/route/route.ts`            | `getRoute('CandAppPreregisterIdentityProviderCallback')` | WIRED | Line 67                                                           |

---

### Data-Flow Trace (Level 4)

The phase creates server-side API routes and a provider module, not UI components that render stored data. These are control-flow handlers (OIDC endpoints), not data-rendering artifacts. Level 4 data-flow tracing does not apply.

---

### Behavioral Spot-Checks

Server routes require a running SvelteKit server and live OIDC provider. Spot-checks skipped — cannot test without starting the server and real IdP credentials.

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                                 | Status    | Evidence                                                                    |
|-------------|-------------|-----------------------------------------------------------------------------|-----------|-----------------------------------------------------------------------------|
| AUTH-01     | 46-01       | Server-side endpoint constructs signed JWT Authorization Requests (JAR) for Idura | SATISFIED | `idura.ts` `getAuthorizeUrl` builds RS256 SignJWT with all RFC 9101 fields; `/api/oidc/authorize` exposes it |
| AUTH-02     | 46-02       | Frontend redirects via server-side authorize endpoint instead of client-side PKCE when using Idura | SATISFIED | `+page.svelte` branches on `PUBLIC_IDENTITY_PROVIDER_TYPE === 'idura'` and calls `/api/oidc/authorize` |
| AUTH-03     | 46-02       | Callback route is provider-agnostic (not hardcoded to `signicat/oidc/callback`) | SATISFIED | `/api/oidc/callback` created; `CandAppPreregisterIdentityProviderCallback` updated; old signicat dir deleted |
| TOKN-01     | 46-01       | Token exchange uses `private_key_jwt` client assertion when provider is Idura | SATISFIED | `idura.ts` `exchangeCodeForToken` POSTs `client_assertion_type` + `client_assertion`; no `client_secret` |
| TOKN-02     | 46-01       | JWE decryption supports RSA-OAEP-256 (Idura) alongside existing RSA-OAEP (Signicat) | SATISFIED | Both providers call `jose.compactDecrypt(idToken, importJWK(key))` with no algorithm constraint — `jose` reads `alg` from JWE header |

**Orphaned requirements check:** No requirements in REQUIREMENTS.md are mapped to Phase 46 beyond AUTH-01 through TOKN-02.

---

### Anti-Patterns Found

No anti-patterns found in phase 46 files:

- No TODOs, FIXMEs, XXX, HACK, or placeholder comments
- No stub throw/return patterns in `idura.ts` (original stubs replaced with full implementations)
- No hardcoded `client_secret` in token or callback routes
- No `localStorage` usage for PKCE code verifier (replaced with cookie)
- No hardcoded JWE algorithm in `compactDecrypt` calls

One code comment in `+page.svelte` line 104 mentions "localStorage" in a negative sense (explaining why a cookie is used instead) — this is informational documentation, not an anti-pattern.

**Pre-existing TypeScript errors** in `supabaseAdminWriter.ts`, `supabaseDataProvider.ts`, and `supabaseDataWriter.ts` are unrelated to phase 46 and were present before this phase (documented in 46-01-SUMMARY.md). Zero TypeScript errors in phase 46 files.

---

### Human Verification Required

#### 1. End-to-end Idura FTN login

**Test:** Configure `PUBLIC_IDENTITY_PROVIDER_TYPE=idura` with real Idura sandbox credentials. Navigate to `/candidate/preregister`. Click the identification button.
**Expected:** Browser is redirected to Idura's authorization endpoint. After bank authentication, browser is redirected to `/api/oidc/callback`, id_token cookie is set, browser lands on `/candidate/preregister` showing the authenticated state.
**Why human:** Requires live Idura sandbox environment and real bank authentication — cannot test programmatically.

#### 2. CSRF state verification in callback

**Test:** Start an Idura authentication flow so the `oidc_state` cookie is set. Manually craft a callback request with a tampered `state` query parameter. Visit `/api/oidc/callback?code=valid_code&state=tampered_value`.
**Expected:** Browser is redirected to `/candidate/preregister?error=invalid_state`. No id_token cookie is set.
**Why human:** Requires browser cookie state and a real authorization code from the IdP.

#### 3. Signicat PKCE flow still works after refactor

**Test:** Configure `PUBLIC_IDENTITY_PROVIDER_TYPE=signicat`. Navigate to `/candidate/preregister`. Click the identification button.
**Expected:** Browser is redirected to Signicat's authorization endpoint (with `code_challenge` in the URL). After authentication, browser lands on `/api/oidc/callback`, id_token cookie is set, browser shows authenticated state.
**Why human:** Requires Signicat sandbox environment to verify the full flow including the `oidc_code_verifier` cookie being read in the callback.

---

### Gaps Summary

No gaps. All five success criteria from ROADMAP.md are verified. All five requirements (AUTH-01, AUTH-02, AUTH-03, TOKN-01, TOKN-02) have implementation evidence. All artifacts exist, are substantive, and are wired. The three items above require human testing against live IdP sandboxes.

---

_Verified: 2026-03-27T13:00:00Z_
_Verifier: Claude (gsd-verifier)_
