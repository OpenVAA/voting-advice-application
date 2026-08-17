---
phase: 122-e2e-specs-bank-auth-round-trip
verified: 2026-06-17T15:30:00Z
status: passed
score: 2/2
overrides_applied: 0
human_verification_resolved:
  - test: "Both bank-auth projects pass 3× consecutively + default suite stays green."
    result: "RESOLVED — operator-accepted 2026-06-17. The orchestrator ran the gates LIVE this session and observed: both bank-auth projects 3/3 consecutive clean (11 passed each, off a clean db:reset baseline); EFLOW-10 independently 8-passed ×3 during 122-02; `yarn test:e2e` default suite 125 passed / 0 failed / 0 skipped with the bank-auth projects correctly excluded (PLAYWRIGHT_BANK_AUTH-gated). keysConfigured asserted TRUE (no skip); preregister-status-return reached + DB cascade proven."
    method_note: "Determinism gate ran as one clean db:reset baseline + 3× consecutive (per-project setup/teardown owns per-run state), NOT reset-per-iteration — because repeated rapid db:reset container bounces 502-wedge local Supabase Storage (environment artifact, not a spec defect). Operator accepted this as satisfying the cardinal rule."
---

# Phase 122: E2E Specs — Bank-Auth Round-Trip — Verification Report

**Phase Goal:** The full bank-auth (Signicat/Idura OIDC) round-trip from initiate to authenticated session runs deterministically as an E2E test.
**Verified:** 2026-06-17T15:30:00Z
**Status:** passed (operator-accepted 2026-06-17 — orchestrator ran the determinism gate + default-suite regression live; observed 3/3 consecutive `11 passed` + `125 passed`/0 failed)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | An E2E test drives the bank-auth flow from initiate through the OIDC exchange to an authenticated session, asserting the authenticated state | VERIFIED | Two complementary specs exist and are substantive: `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` (EFLOW-10, Edge-Function seam — 6 tests including hard assertions on `identity_provider='idura'`, `identity_match_prop='sub'`, `identity_match_value`, `hetu`, `birthdate`, `action_link`) and `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts` (EFLOW-10b, full-browser journey — 6 test.steps driving `/candidate/preregister` → mock OIDC 302 → server exchange/decrypt → preregister-status page + DB proof of `auth.users`/`candidates`/`user_roles` cascade). Neither spec has `test.skip`. The EFLOW-10 `keysConfigured` path uses `expect(...).toBe(true)` — a hard fail, not a skip. Both specs committed at `f4c37cded`, `daab88f06`, `cecdb97e5`. |
| 2 | The test is deterministic — passes 3× without flakes, OIDC dependency stubbed/controlled (no live IdP) | VERIFIED (code) / HUMAN_NEEDED (gate confirmation) | Code determinism: EFLOW-10 uses a fixed committed test key pair (`testKeys.ts`) shared by the Edge-Function env and the spec worker — eliminates per-run key propagation (the #1 flake source). EFLOW-10b uses an Option-B local mock OIDC issuer (`mockOidcIssuer.ts`) served over HTTPS with a committed self-signed cert, spawned as a `webServer` entry in `playwright.config.ts`, scoped to `PLAYWRIGHT_BANK_AUTH=1`. No live IdP, no real network in either spec. SUMMARY Task-3 documents "3/3 consecutive clean — 11 passed each run" off a clean db:reset baseline. The methodology (one baseline reset + 3× consecutive, not reset-per-iteration) is a minor deviation from the ROADMAP's "clean DB" language, explained by Supabase Storage 502-wedging under rapid container bounces. Each project's own setup/teardown provides per-run state isolation. Human confirmation of the gate run required. |

**Score:** 2/2 truths — code-level VERIFIED; gate requires human confirmation

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` | EFLOW-10 Edge-Function seam spec, Idura-only, no test.skip | VERIFIED | Exists, substantive (319 lines). Zero `test.skip`. Hard `expect(probe!.keysConfigured).toBe(true)`. Idura sub-model assertions: `identity_provider='idura'`, `identity_match_prop='sub'`, `identity_match_value`, `hetu`, `birthdate`. Magic-link `action_link` asserted unconditionally. Imports `buildTestIdToken`/`getTestKeys` from shared utils (D-03). |
| `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts` | EFLOW-10b full-browser journey spec, Option-B mock OIDC, no test.skip | VERIFIED | Exists, substantive (229 lines). Zero `test.skip`. 6 `test.step` segments covering the full authorize→callback→exchange→decrypt→claims→preregister()→status chain. DB proof in step 6 asserts `auth.users(idura claims)` + `candidates` + `user_roles` cascade. |
| `tests/tests/utils/testKeys.ts` | Fixed committed test key pair (D-03) | VERIFIED | Exists. RSA-OAEP-256 enc pair (kid `test-enc-1`) + RS256 sig pair (kid `test-sig-1`). `decryptionJwks` array exported for Edge Function env. `getTestKeys()` returns `sigPriv` as WebCrypto `CryptoKey` (jose v6). |
| `tests/tests/utils/buildTestIdToken.ts` | Shared parameterized JWE id_token builder (D-03) | VERIFIED | Exists. RS256 inner JWT + RSA-OAEP-256 / A256GCM outer JWE. Parameterized `iss`/`aud` with back-compat defaults. Consumed by both EFLOW-10 spec and the mock issuer. |
| `tests/tests/utils/buildTestIdToken.test.ts` | Vitest round-trip test for the builder | VERIFIED | Exists. 4-case test covering claims, default iss/aud, explicit opts, kid contract. |
| `tests/tests/support/mockOidcIssuer.ts` | Option-B mock OIDC issuer (authorize/token/JWKS over HTTPS) | VERIFIED | Exists, substantive (211 lines). Three endpoints: `GET /oauth2/authorize` (decodes JAR, 302 echo), `POST /oauth2/token` (returns `buildTestIdToken(...)` with env-aligned iss/aud), `GET .../jwks` (serves `sigPubJwk`). Binds `127.0.0.1` only. Self-signed HTTPS. |
| `tests/tests/support/mockOidcIssuerEntry.ts` | Runnable webServer entry point (port 9443) | VERIFIED | Exists. Spawned by `playwright.config.ts` `webServer` entry. |
| `tests/tests/support/mock-oidc-cert.pem` / `mock-oidc-key.pem` | Committed self-signed localhost TLS cert/key | VERIFIED | Both files exist. `.gitignore` negation (`!tests/tests/support/mock-oidc-*.pem`) tracks them. |
| `tests/playwright.config.ts` | `bank-auth` + `bank-auth-journey` projects, `webServer` entry — all `PLAYWRIGHT_BANK_AUTH`-gated | VERIFIED | `bank-auth` project: `testMatch: /candidate-bank-auth\.spec\.ts/`, depends on `data-setup-base`. `bank-auth-journey` project: `testMatch: /candidate-bank-auth-journey\.spec\.ts/`, `ignoreHTTPSErrors: true`, depends on `data-setup-bank-auth-journey`. `webServer` entry: conditional spread gated on `PLAYWRIGHT_BANK_AUTH`, spawns `tsx mockOidcIssuerEntry.ts`, HTTPS readiness probe. Default suite never includes these projects. |
| `tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts` | candidate-preregister page-object (D-04 journey support) | VERIFIED | Exists. `createCandidatePreregisterPage(page)` returning `{ clickStart, submitElection, submitConstituency, fillEmailAndAcceptToU }`. Dual-shape constituency selection (native `<select>` + combobox). All testId-based. Rigidity contract honored (zero `expect.soft`, zero try/catch around assertions). |
| `tests/tests/fixtures/candidate/candidate-bank-auth-journey.ts` | Fixture composition root | VERIFIED | Exists. Extends `test` with `candidatePreregisterPage`, `emailBucket`, `candidatePasswordSetter` + `recipientEmail` option. Minimal (3 fixtures). |
| `tests/tests/setup/candidate/bank-auth-journey.setup.ts` | Seeds `perm-not-located-2e2cg` + idempotent auth pre-clean; enables `preRegistration` scoped | VERIFIED | Exists. Calls `setupFromTemplate('perm-not-located-2e2cg', { appSettingsOverride: { preRegistration: { enabled: true } } })`. Pre-cleans both placeholder and journey emails. |
| `tests/tests/setup/candidate/bank-auth-journey.teardown.ts` | Prefix wipe + auth-user cascade delete + preRegistration flag reset | VERIFIED | Exists. `runTeardown('e2e-perm-notloc-')`, `deleteBankAuthCandidateBySub`, `unregisterCandidate` (both emails), `updateAppSettings({ preRegistration: { enabled: false } })`. |
| `tests/tests/utils/bankAuthJourneyConstants.ts` | `BANK_AUTH_JOURNEY_EMAIL`, `BANK_AUTH_JOURNEY_SUB`, `BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL` | VERIFIED | Exists. All three constants exported. `BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL` = `` `${BANK_AUTH_JOURNEY_SUB}@bank-auth.placeholder` `` — correctly derived to match the Edge Function's placeholder email formula. |
| `apps/supabase/supabase/functions/identity-callback/index.ts` | Production fix: `createUser` now receives `email: placeholderEmail` (operator-approved) | VERIFIED | Commit `8a167e9af` landed. Line 259: `email: placeholderEmail`. Line 253: `const placeholderEmail = \`${identityMatchValue}@bank-auth.placeholder\``. Both `createUser` (line 259) and `generateLink` (line 332) use the same `placeholderEmail`. |
| `apps/frontend/src/routes/candidate/preregister/+layout.server.ts` | Production refactor: `preRegistration.enabled` reads from `DynamicSettings`/`app_settings` (operator-approved) | VERIFIED | Commit `fca08cb52` landed. Guard reads `app_settings.settings.preRegistration.enabled` via `locals.supabase` server-side (line 14-15). No longer a build-time `StaticSettings` constant. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `candidate-bank-auth.spec.ts` | `buildTestIdToken` + `getTestKeys` shared utils | import from `../../utils/` | WIRED | Lines 36-37 import both; `beforeAll` calls `getTestKeys()`, uses `buildTestIdToken(TEST_IDENTITY, testKeys.sigPriv, testKeys.encPubJwk)` |
| `candidate-bank-auth-journey.spec.ts` | `candidate-bank-auth-journey` fixture root | import from `../../fixtures/candidate/candidate-bank-auth-journey` | WIRED | Line 70: `import { expect, test } from '../../fixtures/candidate/candidate-bank-auth-journey'` |
| `candidate-bank-auth-journey.spec.ts` | `preregister-status-return` assertion (authenticated end state) | `testIds.candidate.preregister.statusReturn` | WIRED | Lines 173-175: `page.waitForURL(/\/candidate\/preregister\/status/)`, then `expect(page.getByTestId(testIds.candidate.preregister.statusReturn)).toBeVisible()` |
| `candidate-bank-auth-journey.spec.ts` | DB proof (SupabaseAdminClient) | `client.getAuthUserByEmail(BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL)` | WIRED | Lines 188-212: 3-step DB cascade proof (auth user + app_metadata claims, linked candidate, user_roles assignment) |
| `mockOidcIssuer.ts` | `buildTestIdToken` | import from `../utils/buildTestIdToken` | WIRED | Line 48: import; line 171: `buildTestIdToken(IDURA_CLAIMS, sigPriv, encPubJwk, tokenIssAud())` with env-aligned iss/aud |
| `mockOidcIssuer.ts` | `getTestKeys` (for enc/sig key pair) | import from `../utils/testKeys` | WIRED | Line 49: import; lines 170, 179: `await getTestKeys()` used in token and JWKS endpoints |
| `playwright.config.ts` | `mockOidcIssuerEntry.ts` webServer spawn | `command: \`npx tsx ${path.join(TESTS_DIR, 'support/mockOidcIssuerEntry.ts')}\`` | WIRED | Lines 1031-1047: conditional spread under `PLAYWRIGHT_BANK_AUTH`; absolute path resolves correctly (fixes the `tests/tests/tests/...` doubling bug from commit `cecdb97e5`). |
| `bank-auth-journey.setup.ts` | `appSettingsOverride` param enables `preRegistration.enabled` | `setupFromTemplate('perm-not-located-2e2cg', { appSettingsOverride: ... })` | WIRED | Line 49-52: confirmed in `setupFromTemplate.ts` lines 238-239: `if (options?.appSettingsOverride) { await client.updateAppSettings(...)` |
| `bank-auth-journey.teardown.ts` | `preRegistration.enabled` reset to `false` | `client.updateAppSettings({ preRegistration: { enabled: false } })` | WIRED | Line 58: teardown resets flag; guards against default-suite contamination |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `candidate-bank-auth.spec.ts` | `probe.keysConfigured` | `beforeAll` → direct `fetch` to `identity-callback` Edge Function → `status === 200 && body.success === true` | Yes — real Edge Function response with real Supabase DB writes | FLOWING |
| `candidate-bank-auth.spec.ts` | `user?.app_metadata` | `adminClient.auth.admin.getUserById(captured.body.user_id)` | Yes — reads `auth.users` via GoTrue admin API | FLOWING |
| `candidate-bank-auth-journey.spec.ts` | `preregister-status-return` (step 5) | browser navigation following the real OIDC chain through the mock issuer | Yes — server-side exchange/decrypt/create chain produces real DB row + session | FLOWING (requires running environment) |
| `candidate-bank-auth-journey.spec.ts` | `authUser.app_metadata` (step 6) | `client.getAuthUserByEmail(BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL)` | Yes — reads `auth.users` via GoTrue admin API; only exists if the full chain ran | FLOWING |

---

### Behavioral Spot-Checks

The bank-auth specs require live Supabase + Edge Function + dev server — they cannot be tested by static invocation. Both projects are `PLAYWRIGHT_BANK_AUTH=1`-gated and require manual environment setup per `tests/IDURA-TEST-RUNBOOK.md`. Spot-checks skipped; all behavioral verification is in the human-verification section below.

---

### Probe Execution

No conventional `scripts/*/tests/probe-*.sh` probes declared. The bank-auth run procedure documented in `tests/IDURA-TEST-RUNBOOK.md` is the project's equivalent. Not automatable from static analysis.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| EFLOW-10 | 122-01 through 122-05 | Bank-auth (Idura OIDC) round-trip runs deterministically as E2E | SATISFIED | Two complementary specs (EFLOW-10 Edge-Function seam + EFLOW-10b full-browser journey) both committed and substantive. EFLOW-10 asserts Idura sub-model; EFLOW-10b asserts full authorized chain + DB cascade. Both gated `PLAYWRIGHT_BANK_AUTH=1`, no live IdP. Production code fixes (`8a167e9af`, `fca08cb52`) enable the round-trip to succeed. Task-3 SUMMARY records `11 passed` × 3 consecutive runs. Human confirmation of the gate methodology remains outstanding. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | Zero `test.skip`, `TBD`, `FIXME`, `XXX` found in any phase-122 file | — | Clean |

No stub returns (`return null`, `return []`, `return {}`) in spec files. The `BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL` constant references are a production email address pattern, not stub indicators.

The `122-VALIDATION.md` task-table (lines 43-44) still shows `⬜ pending` and wave-0 checkboxes are unchecked — this is a planning artifact not updated during execution. It is informational (no source behavior depends on it) and does not affect the verdict.

---

### Human Verification Required

#### 1. Bank-Auth 3× Determinism Gate Confirmation

**Test:** With the full bank-auth environment configured per `tests/IDURA-TEST-RUNBOOK.md` (identity-callback Edge Function served with `IDENTITY_PROVIDER_DECRYPTION_JWKS=<decryptionJwks>`, SvelteKit dev server with EFLOW-10b IdP env, mock issuer auto-spawned via `webServer`):

1. Run `yarn db:reset` once (clean baseline).
2. Run `PLAYWRIGHT_BANK_AUTH=1 npx playwright test --project=bank-auth --project=bank-auth-journey -c tests/playwright.config.ts` three times consecutively.
3. After the third run, run `yarn test:e2e` (default suite, no `PLAYWRIGHT_BANK_AUTH`) on a fresh dev server started without IdP env.

**Expected:**
- Each of the 3 bank-auth runs: `11 passed`, 0 failed, 0 skipped.
- EFLOW-10 `keysConfigured` assertion (`expect(probe!.keysConfigured).toBe(true)`) must pass — not skip — confirming the Edge Function decryption JWK is wired.
- EFLOW-10b: `preregister-status-return` visible in step 5; step 6 DB proof asserts `auth.users` with `identity_provider='idura'` + `identity_match_value='test-bank-auth-journey-sub-001'` + linked `candidates` + `user_roles`.
- Default suite: `125 passed`, 0 failed, 0 skipped (the bank-auth projects must not appear without `PLAYWRIGHT_BANK_AUTH`).

**Why human:** The determinism gate was run by the orchestrator with a methodology deviation (one db:reset baseline + 3× consecutive, not reset-per-iteration) due to Supabase Storage 502-wedging under rapid container bounces. A human must confirm the gate ran as described and that the environment was correctly configured with the test JWKS, mock issuer, and IdP env pointing at 127.0.0.1:9443. Static code analysis cannot verify live Playwright run results.

---

### Gaps Summary

No blocking gaps found in the codebase. All required artifacts exist and are substantive; key links are wired; data flows are connected; no debt markers. The `human_needed` status reflects that the 3× determinism gate claim is a SUMMARY assertion not independently verifiable by static analysis — the environment setup (Edge Function JWKS, SvelteKit dev server IdP env, mock issuer TLS) is complex and requires manual confirmation.

---

_Verified: 2026-06-17T15:30:00Z_
_Verifier: Claude (gsd-verifier)_
