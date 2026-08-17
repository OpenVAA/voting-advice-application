---
phase: 122-e2e-specs-bank-auth-round-trip
plan: 05
subsystem: testing
tags: [playwright, bank-auth, idura, e2e, journey, oidc, preregister]

# Dependency graph
requires:
  - phase: 122-02
    provides: testIds.candidate.preregister block driven by the spec
  - phase: 122-03
    provides: bank-auth-journey Playwright project + webServer (mock OIDC issuer) + mock issuer
  - phase: 122-04
    provides: candidate-bank-auth-journey composition root + candidatePreregisterPage page-object + setup/teardown + BANK_AUTH_JOURNEY_EMAIL
provides:
  - candidate-bank-auth-journey.spec.ts — EFLOW-10b full-browser bank-auth self-registration journey (single-pass GREEN)
  - setupFromTemplate appSettingsOverride param — scenario-scoped app_settings overlay (preregistration enablement) reusing a shared template
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "EFLOW-10b journey spec mirrors candidate-journey.spec.ts SHAPE: one serial describe, one long test, named test.step segments, empty-storageState unauthenticated start"
    - "Scenario-scoped app_settings enablement via setupFromTemplate({ appSettingsOverride }) — additive merge_jsonb_column AFTER the template's post-seed subset-match, restored by the paired teardown; reuses a SHARED template without perturbing its other consumer"
    - "Supabase bank-auth flow establishes the session INLINE (Edge Function create + route verifyOtp) — no confirmation-email / registration-key / set-password leg; authenticated end state proven by the success status page + a DB assertion of the created auth.users(idura claims)+candidates+user_roles cascade"
    - "Bank-auth user lives under the identity-derived placeholder email (${sub}@bank-auth.placeholder), not the typed address — setup/teardown clean by the placeholder + delete the orphan candidate row"

key-files:
  created: []
  modified:
    - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
    - tests/playwright.config.ts
    - tests/tests/setup/shared/setupFromTemplate.ts
    - tests/tests/setup/candidate/bank-auth-journey.setup.ts
    - tests/tests/setup/candidate/bank-auth-journey.teardown.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/utils/bankAuthJourneyConstants.ts
    - tests/tests/utils/testIds.ts

key-decisions:
  - "Preregistration enabled SCOPED to the bank-auth-journey run via a new setupFromTemplate `appSettingsOverride` param (additive merge_jsonb_column applied AFTER the post-seed subset-match), NOT in the shared perm-not-located-2e2cg template nor MINIMAL_BASE_APP_SETTINGS. Teardown resets {enabled:false} so the other template consumer + the default suite stay unperturbed. Honors the no-updateAppSettings-in-setup-for-BASELINE policy (this is a per-run scenario mutation)."
  - "Rewrote journey steps 5-6 to the ACTUAL Supabase bank-auth architecture: preregister() invokes the identity-callback Edge Function (decrypt→verify→claims→create user+candidate+role→magic link), and the /api/candidate/preregister route verifyOtp's the magic link to ESTABLISH THE SESSION INLINE, landing on /candidate/preregister/status?code=success. There is NO confirmation-email/registration-key/set-password leg (that is the legacy adapter's flow). The authenticated end state is proven by the success status page (`preregister-status-return`) + a DB assertion that the auth.users (idura/identity_match_value claims) + linked candidates + candidate user_roles cascade was created — the only way those exist is if the unmodified authorize→callback→exchange→decrypt→claims→create chain ran end to end (D-01)."
  - "Added `ignoreHTTPSErrors: true` to the bank-auth-journey project BROWSER context (the webServer-level ignoreHTTPSErrors only covered Playwright's JWKS readiness probe, not the browser). Without it Chrome rejected the mock issuer's self-signed cert and the authorize-leg 302 back to /api/oidc/callback never reached the browser."
  - "Bank-auth user is created under the identity-derived placeholder email (${sub}@bank-auth.placeholder), not BANK_AUTH_JOURNEY_EMAIL — added BANK_AUTH_JOURNEY_SUB/_PLACEHOLDER_EMAIL constants and clean by the placeholder in setup+teardown, plus an explicit orphan-candidate delete (deleteBankAuthCandidateBySub) so rows do not accumulate across the 3× gate."

requirements-completed: [EFLOW-10]

# Metrics
duration: ~55min
completed: 2026-06-17
---

# Phase 122 Plan 05: Bank-Auth Journey Spec (EFLOW-10b) Summary

**Drove the EFLOW-10b full-browser bank-auth self-registration journey to SINGLE-PASS GREEN (`1 passed`, no skip/did-not-run) against the orchestrator-owned live environment. Enabled `preRegistration.enabled` SCOPED to the bank-auth-journey run only (a new `setupFromTemplate({ appSettingsOverride })` param applied additively after the template's post-seed subset-match; the paired teardown restores `{enabled:false}`), so the shared `perm-not-located-2e2cg` template + the default suite stay untouched. Resolved two real defects discovered during execution: the browser context was missing `ignoreHTTPSErrors` (the OIDC authorize-leg 302 to the self-signed mock issuer failed silently), and the spec assumed a confirmation-email / registration-key / set-password flow that does not exist in the Supabase adapter — the id_token-callback path establishes the session inline. Rewrote steps 5-6 to assert the real authenticated end state (success status page + a DB proof of the created auth.users/candidates/user_roles cascade) and fixed a teardown leak (the bank-auth user is created under the identity-derived placeholder email, not the typed address). Task 3's 3× determinism gate is orchestrator-run.**

## Task Status

- **Task 1 — Author the spec: DONE (prior session).** The journey spec was authored and committed earlier (cecdb97e5).
- **Task 2 — Single-pass green: DONE.** `--project=bank-auth-journey` passes single-pass: `3 passed` (data-setup + journey + data-teardown), the journey test itself `1 passed`, no skip / did-not-run / failed. The keys-configured OIDC create path is taken (the DB assertion confirms the idura identity + candidate + role were created). `tsc -p tests/tsconfig.json --noEmit` exit 0; the project lint (`eslint --flag v10_config_lookup_from_file`) is clean on all touched files.
- **Task 3 — 3× determinism gate + default-suite regression: ORCHESTRATOR-RUN.** Per the execution mandate the orchestrator (which owns the long-lived servers + runs `yarn db:reset` between iterations) runs the 3× gate and the default-suite regression. Not run here.

## What unblocked Task 2

The prior session's blocker was a build-time `staticSettings.preRegistration.enabled: false` that made `/candidate/preregister` unreachable. The orchestrator resolved it BEFORE this session by MOVING `preRegistration.enabled` from `StaticSettings` to `DynamicSettings`: the route guard `apps/frontend/src/routes/candidate/preregister/+layout.server.ts` now reads the flag from the `app_settings` JSONB row server-side (via `locals.supabase`, RLS `anon_select_app_settings`), `@openvaa/app-shared` was rebuilt, and the :5173 dev server was restarted with the IdP env. So `/candidate/preregister` renders when DB `app_settings.settings.preRegistration.enabled` is truthy — which this plan's setup now arranges, scoped to the run.

## Accomplishments

- **Scoped preregistration enablement (no shared-template contamination).** Added an optional `appSettingsOverride` param to `setupFromTemplate(...)`. It deep-merges (additive `merge_jsonb_column` via `updateAppSettings`) onto the persisted `app_settings` AFTER the template's `app_settings.fixed[]` seed + the post-seed `toMatchObject` subset-match, so the assertion still holds and the SHARED `perm-not-located-2e2cg` template (+ `MINIMAL_BASE_APP_SETTINGS`) are never edited. `bank-auth-journey.setup.ts` passes `{ preRegistration: { enabled: true } }`; `bank-auth-journey.teardown.ts` resets `{ enabled: false }`. Verified against the DB: `settings->'preRegistration'` shows `{"enabled": true}` during the run and `{"enabled": false}` after.
- **Browser-context HTTPS fix.** Added `ignoreHTTPSErrors: true` to the `bank-auth-journey` project `use` block. Trace evidence: the browser issued `GET https://127.0.0.1:9443/oauth2/authorize` but recorded no response and no subsequent `/api/oidc/callback` — Chrome was rejecting the self-signed cert. After the fix the full authorize → 302 → callback → exchange → decrypt → claims → session chain completes.
- **Architecture-correct end state.** Confirmed from the production sources that the Supabase bank-auth flow establishes the session inline (identity-callback creates the user/candidate/role + a magic link, and `/api/candidate/preregister` verifyOtp's it), landing on `/candidate/preregister/status?code=success`. Rewrote steps 5-6 to assert the success status page (`preregister-status-return`) + a `SupabaseAdminClient` DB proof of the created `auth.users` (`identity_provider='idura'`, `identity_match_value=<sub>`) + linked `candidates` row + candidate `user_roles` assignment.
- **Teardown leak fix.** The Edge Function creates the bank-auth user under the identity-derived placeholder email (`${sub}@bank-auth.placeholder`), not the typed `BANK_AUTH_JOURNEY_EMAIL`, so the original teardown's `unregisterCandidate(BANK_AUTH_JOURNEY_EMAIL)` never matched it → leak across runs. Added `BANK_AUTH_JOURNEY_SUB` / `BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL` constants, clean by the placeholder in setup + teardown, and a new `deleteBankAuthCandidateBySub` to remove the orphan candidate row (no `external_id` prefix → `runTeardown` would miss it). Verified: zero `%bank-auth.placeholder` users remain after a run.
- **New SupabaseAdminClient helpers:** `getAuthUserByEmail` (reads `auth.users` via the GoTrue admin API — that schema is not PostgREST-exposed) and `deleteBankAuthCandidateBySub`.

## Task Commits

1. **daab88f06** — `test(122-05): drive EFLOW-10b bank-auth journey to single-pass green` (the scoped enablement + HTTPS fix + steps-5-6 rewrite + teardown leak fix + helpers/constants/testId).

## Files Created/Modified

- `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts` (modified) — steps 5-6 rewritten to the Supabase bank-auth architecture (success status page + DB cascade proof); removed the email round-trip / set-password / login steps + their helpers/imports.
- `tests/playwright.config.ts` (modified) — `ignoreHTTPSErrors: true` on the bank-auth-journey browser context.
- `tests/tests/setup/shared/setupFromTemplate.ts` (modified) — new `appSettingsOverride` option (additive overlay after post-seed assertion).
- `tests/tests/setup/candidate/bank-auth-journey.setup.ts` (modified) — pass `appSettingsOverride: { preRegistration: { enabled: true } }`; pre-clean by the placeholder email.
- `tests/tests/setup/candidate/bank-auth-journey.teardown.ts` (modified) — reset `{enabled:false}`; clean by placeholder + delete the orphan candidate.
- `tests/tests/utils/supabaseAdminClient.ts` (modified) — `getAuthUserByEmail` + `deleteBankAuthCandidateBySub`.
- `tests/tests/utils/bankAuthJourneyConstants.ts` (modified) — `BANK_AUTH_JOURNEY_SUB` + `BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL`.
- `tests/tests/utils/testIds.ts` (modified) — `candidate.preregister.statusReturn`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Browser context missing `ignoreHTTPSErrors`**
- **Found during:** Task 2 (first run — step 1 failed: `preregister-continue` never rendered).
- **Issue:** The `bank-auth-journey` project `use` block lacked `ignoreHTTPSErrors`. The mock OIDC issuer serves HTTPS with a self-signed localhost cert; the browser's `GET https://127.0.0.1:9443/oauth2/authorize` was rejected by Chrome's cert check (trace: no response recorded, no callback request). The webServer-level `ignoreHTTPSErrors` only covers Playwright's JWKS readiness probe.
- **Fix:** Added `ignoreHTTPSErrors: true` to the project's `use`.
- **Commit:** daab88f06.

**2. [Rule 1 - Bug] Spec assumed a non-existent email/registration-key/set-password flow**
- **Found during:** Task 2 (second run — step 5 failed: no "confirm your email" message arrived in Mailpit).
- **Issue:** The Supabase adapter's bank-auth flow does NOT send a confirmation email with a `registrationKey` link, nor route through a set-password page. `preregister()` → `/api/candidate/preregister` → identity-callback Edge Function (create user+candidate+role+magic link) → the route verifyOtp's the magic link to establish the session INLINE → `/candidate/preregister/status?code=success`. No email is ever emitted. The user types an email into the form but the id_token-callback path does not persist it as the auth user's address.
- **Fix:** Rewrote steps 5-6 to assert the success status page + a DB proof of the created auth.users(idura claims)+candidates+user_roles cascade. Removed the email-round-trip / set-password / login steps and their helpers, the `emailBucket`/`candidatePasswordSetter` fixture params, the `JOURNEY_PASSWORD`/`CONFIRM_EMAIL_SUBJECT_REGEX`/`registrationUrlFromLinks` constants, and added the `SupabaseAdminClient` import.
- **Commit:** daab88f06.

**3. [Rule 1 - Bug] Teardown could not clean the created bank-auth user (leak)**
- **Found during:** Task 2 (architecture trace of the Edge Function).
- **Issue:** identity-callback creates the auth user under `${identityMatchValue}@bank-auth.placeholder` (= `${sub}@bank-auth.placeholder`), but setup/teardown only cleaned `BANK_AUTH_JOURNEY_EMAIL` → the created user + its fresh candidate row (no `external_id` prefix) leaked across runs, breaking the 3× determinism gate.
- **Fix:** Added `BANK_AUTH_JOURNEY_SUB`/`_PLACEHOLDER_EMAIL` constants; clean by the placeholder in setup + teardown; `deleteBankAuthCandidateBySub` removes the orphan candidate + its role. Verified zero `%bank-auth.placeholder` users remain after a run.
- **Commit:** daab88f06.

**Total deviations:** 3 Rule-1 bug fixes (all in `tests/`; no production-code change). The scoped-enablement mechanism is the plan's own Task-1 directive (option a — the `setupFromTemplate` override param).

## Deferred Issues

- **`func-style` lint on `tests/tests/setup/shared/setupFromTemplate.ts:248`** (the pre-existing `const cleanup = async () => {...}` closure I did not author or modify). It surfaces only under a bare `npx eslint <file>` invocation; under the project's real lint command (`eslint --flag v10_config_lookup_from_file tests`, which resolves the tests-local config/overrides) the file lints CLEAN. Out of scope (pre-existing, not touched by this plan) — logged, not fixed.

## Threat Flags

None new. The journey drives the existing (unmodified) production auth chain (D-01) and adds no new security surface. The scoped TLS/preregistration enablement is test-only, opt-in (`PLAYWRIGHT_BANK_AUTH`), and restored by the teardown.

## Self-Check

- File: FOUND `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts`.
- Commit: FOUND daab88f06 (`git log --oneline | grep daab88f06`).
- Journey run: `3 passed` (setup + journey + teardown); journey test `1 passed`, no skip/did-not-run. `tsc -p tests/tsconfig.json` exit 0; project lint clean on all touched files. DB verified: `preRegistration` `{"enabled": true}` during the run, `{"enabled": false}` after; zero `%bank-auth.placeholder` users remain.

## Self-Check: PASSED

---

## Task 3 — Determinism Gate + Default-Suite Regression (orchestrator-run, 2026-06-17)

**Result: PASSED.**

- **3× determinism (both bank-auth projects):** `bank-auth` (EFLOW-10) + `bank-auth-journey` (EFLOW-10b) ran **3/3 consecutive clean — `11 passed` each run** (8 EFLOW-10 + 3 journey/setup/teardown), off a clean `db:reset` baseline (buckets created, storage healthy). No skip / did-not-run / flaky. EFLOW-10 was independently confirmed green 3× during 122-02; the journey green during Task 2.
- **Default-suite regression:** `yarn test:e2e` (no `PLAYWRIGHT_BANK_AUTH`) = **`125 passed (9.1m)`**, 0 failed/skipped, on a clean dev server (no IdP env) + clean DB. Confirms (a) the opt-in bank-auth projects + mock-issuer webServer are excluded from the default suite (isolation), and (b) the preRegistration static→dynamic refactor + the `setupFromTemplate({ appSettingsOverride })` param did not perturb existing tests.

**Environment note (learning):** local Supabase Storage 502-wedges under *repeated rapid* `db:reset` container bounces (the bucket-creation/storage service races the container restart). The determinism gate was therefore run as **one clean `db:reset` baseline + 3× consecutive** (each project's own setup/teardown provides clean per-run data) rather than reset-per-iteration — equivalent determinism evidence without re-triggering the local-stack flakiness. Does not affect the specs (deterministic whenever storage is ready) nor the normal single-reset `yarn test:e2e` flow.

**Production deviations landed this phase (both operator-approved):**
1. `8a167e9af` — fix(122-02): `identity-callback` Edge Function created the auth user with no email (GoTrue rejects) → derived a stable placeholder email from the `sub` for both `createUser` and `generateLink`. Surfaced by the EFLOW-10 deterministic gate.
2. `fca08cb52` — refactor(122): moved `preRegistration.enabled` from StaticSettings → DynamicSettings (guard reads `app_settings` via `locals.supabase`), so the bank-auth preregistration journey is testable/per-instance-controllable.

## Self-Check: PASSED

---
*Phase: 122-e2e-specs-bank-auth-round-trip*
*Completed (Task 1 prior session; Task 2 single-pass green this session; Task 3 orchestrator-run): 2026-06-17*
