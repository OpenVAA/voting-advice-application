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
  - candidate-bank-auth-journey.spec.ts — EFLOW-10b full-browser bank-auth self-registration journey (authored; single-pass green BLOCKED by a hardcoded static setting — see Blockers)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "EFLOW-10b journey spec mirrors candidate-journey.spec.ts SHAPE: one serial describe, one long test, named test.step segments, empty-storageState unauthenticated start"
    - "registrationKey extracted directly from the preregistration email link (frontend registration URL, NOT a Supabase verify link → navigated directly, no toCallbackUrl)"

key-files:
  created:
    - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
  modified:
    - tests/playwright.config.ts

key-decisions:
  - "End-state proof is candidate-home-status visibility — reaching the protected candidate home is itself the end-to-end proof (register() activated the user + login established a session). Dropped a DB-row verification because SupabaseAdminClient exposes no public findCandidateByEmail and `client` is protected."
  - "Email registrationKey link is navigated DIRECTLY (it is the frontend registration URL `${origin}${CandAppRegister}?registrationKey=…`, not a Supabase verify link), so toCallbackUrl is intentionally NOT used."
  - "webServer command path made absolute via TESTS_DIR (Rule 3 fix — the relative path doubled to tests/tests/tests/... and failed ERR_MODULE_NOT_FOUND)."

requirements-completed: []

# Metrics
duration: ~40min
completed: 2026-06-17
---

# Phase 122 Plan 05: Bank-Auth Journey Spec (EFLOW-10b) Summary

**Authored the EFLOW-10b full-browser bank-auth self-registration journey spec (`candidate-bank-auth-journey.spec.ts`): one serial unauthenticated test with 7 named `test.step` segments driving preregister-start → mock-IdP 302 → callback (server exchange + JWE decrypt + verify) → authenticated → election → constituency → email+ToU → preregister() → registration-key email → set password → log in → logged-in candidate home, via the 122-04 composition root + page-object + emailBucket. The spec compiles, lints clean, and honors the rigidity + localization contracts. Driving it to single-pass green is BLOCKED by a hardcoded production static setting (`preRegistration.enabled: false`) that makes the entire preregister flow unreachable — a precondition no prior plan resolved and which is outside the executor's no-production-edit / orchestrator-owns-servers scope. Task 3 (the 3× determinism gate + default-suite regression) is the orchestrator's to run.**

## Task Status

- **Task 1 — Author the spec: DONE.** `candidate-bank-auth-journey.spec.ts` written, imports the composition root, runs ONE serial unauthenticated test with named `test.step` segments covering the full chain through to the logged-in candidate end state, honors the rigidity contract (0 soft assertions, 0 try/catch around assertions, 0 swallowed rejections) + localization rule (testId selectors only), compiles under strict TS (`tsc -p tests/tsconfig.json` exit 0), lints clean (`eslint` exit 0). The plan's structural verify grep returns `JOURNEY_SPEC_OK`.
- **Task 2 — Single-pass green: BLOCKED (not a spec bug).** The journey cannot reach the preregister flow: `/candidate/preregister` `+layout.server.ts:7` redirects to `/candidate/login` when `!staticSettings.preRegistration.enabled`, and `packages/app-shared/src/settings/staticSettings.ts:64-66` hardcodes `preRegistration: { enabled: false }`. This is a build-time STATIC setting (not DynamicSettings / DB-seeded), so no test setup or env can toggle it. See Blockers.
- **Task 3 — 3× determinism gate + default-suite regression: ORCHESTRATOR-RUN.** Per the execution mandate, the orchestrator (which owns the long-lived servers) runs the 3× gate and the default-suite regression itself. Not run here.

## Accomplishments

- Authored the EFLOW-10b journey spec mirroring `candidate-journey.spec.ts` exactly: `test.describe.configure({ mode: 'serial' })`, `test.use({ storageState: { cookies: [], origins: [] } })` (unauthenticated start), `test.use({ recipientEmail: BANK_AUTH_JOURNEY_EMAIL })`, one long `test(...)` with `test.setTimeout(TIMEOUTS.testMax)` and 7 named `test.step` segments.
- Wired the email round-trip: `emailBucket.expectEmail(/confirm your email/i)` → `getLinksInEmail` → a module-scope `registrationUrlFromLinks` helper extracts the `registrationKey`-bearing link and the spec navigates it directly (the register page auto-validates the key on mount and redirects to set-password).
- Resolved a blocking `webServer` config bug (Rule 3): the mock-issuer spawn path `tests/tests/support/mockOidcIssuerEntry.ts` was resolved relative to the config dir (`tests/`), doubling to `tests/tests/tests/support/...` → `ERR_MODULE_NOT_FOUND`. Switched to an absolute path derived from `TESTS_DIR`. After the fix the mock issuer spawns, the data-setup/teardown run (both `2 passed` outside the journey test), and the journey reaches the browser.

## Task Commits

1. **candidate-bank-auth-journey.spec.ts (EFLOW-10b journey) + webServer path fix** — see final commit hash below.

## Files Created/Modified

- `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts` (created) — the EFLOW-10b journey spec.
- `tests/playwright.config.ts` (modified) — `webServer.command` path made absolute via `TESTS_DIR` (Rule 3 blocking fix).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `webServer` mock-issuer command path doubled and failed to resolve**
- **Found during:** Task 2 (first journey run).
- **Issue:** `webServer.command = 'npx tsx tests/tests/support/mockOidcIssuerEntry.ts'` (from plan 122-03) is resolved by Playwright relative to the config file's dir (`tests/`), producing `tests/tests/tests/support/mockOidcIssuerEntry.ts` → `ERR_MODULE_NOT_FOUND`, so the mock issuer never started.
- **Fix:** Built the command path absolutely from `TESTS_DIR` (`path.join(TESTS_DIR, 'support/mockOidcIssuerEntry.ts')`), making the spawn cwd-independent. The entry file genuinely lives at `tests/tests/support/mockOidcIssuerEntry.ts`.
- **Files modified:** `tests/playwright.config.ts`.

**2. [Rule 3 - Blocking] Rigidity-contract doc-block reworded to satisfy the plan's own negative grep**
- **Found during:** Task 1 (verify).
- **Issue:** The plan's verify runs `! grep -q "expect.soft\|\.catch(() => null)"`. The canonical rigidity doc-block contains those literals as prose, false-tripping the grep (same false-positive 122-04 hit).
- **Fix:** Reworded the doc-block to state the contract without the forbidden literals. Zero actual usage in the code; contract fully honored.
- **Files modified:** `candidate-bank-auth-journey.spec.ts`.

**3. [Rule 1 - Adjust] Dropped a non-existent DB-row verification**
- **Found during:** Task 1.
- **Issue:** First draft called `client.findCandidateByEmail(...)` — no such method exists on `SupabaseAdminClient`, and its `client` field is `protected` (not reachable from the spec).
- **Fix:** Removed the row lookup + the `SupabaseAdminClient` import. The `candidate-home-status` visibility is itself the authenticated/logged-in end-state proof (the protected home is reachable only after `register()` + a successful login).
- **Files modified:** `candidate-bank-auth-journey.spec.ts`.

**4. [Lint] simple-import-sort autofix** — the spec tripped `simple-import-sort/imports`; resolved via `eslint --fix`, no behavior change.

**Total deviations:** 4 (3 Rule-3/Rule-1, 1 lint). The spec is exactly as specified; the config fix is a necessary precondition for the journey to spawn its mock issuer.

## Blockers

**BLOCKER (Task 2 — single-pass green): preregistration is disabled by a hardcoded static setting.**

- **Symptom:** `page.goto('/en/candidate/preregister')` lands on `/candidate/login` (DOM snapshot shows the login form, not `preregister-start`). The spec fails at step 1 (`getByTestId('preregister-start')` not found). The data-setup + teardown + mock-issuer spawn all succeed (`2 passed`); only the journey test fails, and it fails because the route redirects away before any bank-auth interaction.
- **Root cause (confirmed, not assumed):** `apps/frontend/src/routes/candidate/preregister/+layout.server.ts:7` — `if (!staticSettings.preRegistration.enabled) return redirect(303, CandAppLogin)`. `packages/app-shared/src/settings/staticSettings.ts:64-66` hardcodes `preRegistration: { enabled: false }`. This is a **build-time `staticSettings`** value (NOT `appSettings`/DynamicSettings/DB), so no Playwright setup, seed template, or env var can toggle it. There is no test-side or runtime override anywhere in `tests/`, `packages/dev-seed/`, or the frontend (grep-confirmed).
- **Why this is not a spec bug + not auto-fixable here:** Enabling it requires (a) editing `packages/app-shared/src/settings/staticSettings.ts` — a PRODUCTION-code change, explicitly out of this executor's scope (no production-code edits), AND (b) rebuilding `@openvaa/app-shared` and RESTARTING the orchestrator-owned frontend dev server so it serves the new build. Servers/DB are orchestrator-owned (do-not-touch). This is precisely the STOP-and-checkpoint case in the execution mandate.
- **What unblocks it:** the operator/orchestrator sets `preRegistration.enabled: true` in `staticSettings.ts` (test-scoped or for the duration of the bank-auth-journey run), rebuilds `@openvaa/app-shared`, and restarts the :5173 frontend server. Then `--project=bank-auth-journey` should drive the spec straight through (the rest of the chain — mock issuer, callback, decrypt, email round-trip, set-password, login — is wired and the spec is written against it). NOTE: this precondition was not surfaced by prior plans (122-01..122-04 confirmed the seed shape forces the selectors to RENDER, but did not check that the preregister ROUTE is reachable at all under the default static setting).

## Threat Flags

None new. The spec adds no new security surface — it drives the existing (unmodified) auth chain. The `webServer` path fix is a test-config-only change.

## Self-Check

- File: FOUND `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts`.
- Verify grep: `JOURNEY_SPEC_OK`. `tsc -p tests/tsconfig.json` exit 0; `eslint` exit 0 on the spec + the config.
- Journey run: mock issuer spawned, data-setup + teardown `2 passed`, journey test FAILED at step 1 (precondition blocker, root-caused above — NOT a spec defect).

---
*Phase: 122-e2e-specs-bank-auth-round-trip*
*Completed (Task 1; Task 2 blocked; Task 3 orchestrator-run): 2026-06-17*
