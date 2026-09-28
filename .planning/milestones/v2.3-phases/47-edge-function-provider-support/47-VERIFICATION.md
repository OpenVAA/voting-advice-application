---
phase: 47-edge-function-provider-support
verified: 2026-03-27T12:30:00Z
status: passed
score: 6/6 must-haves verified
---

# Phase 47: Edge Function Provider Support Verification Report

**Phase Goal:** The identity callback Edge Function correctly processes identity verification for both Signicat and Idura providers
**Verified:** 2026-03-27T12:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Edge Function reads IDENTITY_PROVIDER_TYPE env var and selects provider config | VERIFIED | Line 218: `Deno.env.get('IDENTITY_PROVIDER_TYPE') ?? 'signicat'`; PROVIDER_CONFIGS lookup on line 219 |
| 2 | Idura identity matching uses sub claim (not birthdate) for user lookup | VERIFIED | `idura: { identityMatchProp: 'sub', ... }` at line 60; `extractIdentityClaims` uses `payload[config.identityMatchProp]` |
| 3 | Signicat identity matching still uses birthdate claim for user lookup | VERIFIED | `signicat: { identityMatchProp: 'birthdate', ... }` at line 54 |
| 4 | Provider type, match prop, and match value are stored in app_metadata on user creation | VERIFIED | Lines 316-319: `identity_provider: providerType`, `identity_match_prop: config.identityMatchProp`, `identity_match_value: identityMatchValue`, `...extractedClaims` |
| 5 | Frontend preregister route invokes identity-callback (not signicat-callback) | VERIFIED | `+server.ts` line 16: `invoke('identity-callback', ...)` — zero occurrences of `signicat-callback` |
| 6 | Old signicat-callback directory is fully deleted | VERIFIED | `apps/supabase/supabase/functions/signicat-callback/` does not exist; only 3 Edge Function dirs: `identity-callback/`, `invite-candidate/`, `send-email/` |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/supabase/supabase/functions/identity-callback/index.ts` | Provider-agnostic identity callback Edge Function | VERIFIED | 445 lines, substantive implementation, contains `PROVIDER_CONFIGS` with both providers |
| `apps/frontend/src/routes/api/candidate/preregister/+server.ts` | Frontend caller invoking identity-callback | VERIFIED | Contains `invoke('identity-callback'` — 3 occurrences; zero occurrences of `signicat-callback` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `preregister/+server.ts` | `identity-callback/index.ts` | `supabase.functions.invoke('identity-callback', ...)` | WIRED | Line 16 of `+server.ts` — call made, response destructured (`data`, `fnError`) and used |
| `identity-callback/index.ts` | `IDENTITY_PROVIDER_TYPE` env var | `Deno.env.get('IDENTITY_PROVIDER_TYPE')` | WIRED | Line 218 — read with `?? 'signicat'` default; used to index `PROVIDER_CONFIGS` |
| `identity-callback/index.ts` | `supabaseAdmin.auth.admin.createUser` | `app_metadata` with `identity_provider`, `identity_match_prop`, `identity_match_value` | WIRED | Lines 313-325 — all three fields present, `...extractedClaims` spread included |

### Data-Flow Trace (Level 4)

This phase produces a Deno Edge Function (not a React/Svelte component rendering dynamic UI state). Data-flow is internal to the function: provider config drives claim extraction, which feeds user lookup and creation. The flow is verified inline via the pattern checks above. Level 4 UI data-flow trace is not applicable.

### Behavioral Spot-Checks

Step 7b: SKIPPED — Edge Function requires a running Supabase instance and a valid JWE/JWT token to invoke. Cannot test end-to-end without running services. The function structure, routing, and logic are fully verifiable statically.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| EDGE-01 | 47-01-PLAN.md | Identity callback Edge Function supports both providers via configuration | SATISFIED | `PROVIDER_CONFIGS` record maps both `signicat` and `idura`; `IDENTITY_PROVIDER_TYPE` env var selects provider |
| EDGE-02 | 47-01-PLAN.md | Idura identity matching uses `sub` claim (persistent pseudonym) instead of `birthdate` | SATISFIED | `idura.identityMatchProp = 'sub'`; `findUserByIdentityMatch` searches `app_metadata.identity_match_value` |
| EDGE-03 | 47-01-PLAN.md | Provider type is stored in user `app_metadata` for audit trail | SATISFIED | `identity_provider: providerType`, `identity_match_prop`, `identity_match_value` all stored in `createUser` call |

All 3 requirements declared in plan frontmatter (`requirements: [EDGE-01, EDGE-02, EDGE-03]`) are satisfied. REQUIREMENTS.md confirms all 3 mapped to Phase 47 with status Complete. No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `identity-callback/index.ts` | 383 | `siteUrl` variable declared but never used | Info | Harmless dead code — variable is set from `SUPABASE_URL` but not referenced in the function body |
| `identity-callback/index.ts` | 387 | `@bank-auth.placeholder` email domain | Info | Intentional design — users without email are given an ID-based placeholder email for magic link generation; documented in comment on line 381 |
| `identity-callback/index.ts` | 199 | `return null` in `findUserByIdentityMatch` | Info | Not a stub — correct sentinel return after exhausting all pages of user list; caller handles `null` with user creation |
| `identity-callback/index.ts` | 105 | `verifyOptions = {}` | Info | Not a stub — populated conditionally with `audience` when `clientId` is present (line 107) |
| `identity-callback/index.ts` | 145 | `extractedClaims = {}` | Info | Not a stub — populated by loop over `config.extractClaims` (lines 146-150) before being returned |

No blocking or warning-level anti-patterns. The `siteUrl` unused variable is the only code smell — it appears to be a leftover from an earlier draft and has no functional impact since it is never passed to any call site.

### Human Verification Required

#### 1. Bank Authentication End-to-End Flow — Signicat

**Test:** Deploy `identity-callback` to a Supabase instance with Signicat secrets. Trigger a bank authentication login as a new candidate. Confirm the user is created with `app_metadata.identity_provider = 'signicat'` and `app_metadata.identity_match_prop = 'birthdate'`.
**Expected:** User created, magic link returned, session established, candidate record created.
**Why human:** Requires live Signicat OIDC environment and valid bank authentication session.

#### 2. Bank Authentication End-to-End Flow — Idura

**Test:** Deploy `identity-callback` to a Supabase instance with `IDENTITY_PROVIDER_TYPE=idura` and Idura secrets. Trigger a bank authentication login. Confirm the user is created with `app_metadata.identity_provider = 'idura'`, `app_metadata.identity_match_prop = 'sub'`, and `app_metadata.birthdate` extracted from `extractClaims`.
**Expected:** User created, magic link returned, session established, candidate record created, `sub` used as the identity key.
**Why human:** Requires live Idura OIDC environment and valid bank authentication session.

#### 3. Provider Switching Backward Compatibility

**Test:** With an existing deployment that previously used `signicat-callback` (with `birthdate_id` in app_metadata), confirm that existing users cannot be found by `findUserByIdentityMatch` (clean break per D-06), and that new users are created with the updated metadata schema.
**Expected:** Pre-phase-47 users will not match (they have `birthdate_id`, not `identity_match_value`). New users created after deployment will use the new schema. This is an intentional breaking change.
**Why human:** Requires database state inspection with users created before and after the migration.

### Gaps Summary

No gaps found. All 6 observable truths are verified, both artifacts exist and are substantive, all 3 key links are wired, and all 3 requirements (EDGE-01, EDGE-02, EDGE-03) are satisfied by the implementation. The minor `siteUrl` unused variable is informational only and does not affect functionality.

---

_Verified: 2026-03-27T12:30:00Z_
_Verifier: Claude (gsd-verifier)_
