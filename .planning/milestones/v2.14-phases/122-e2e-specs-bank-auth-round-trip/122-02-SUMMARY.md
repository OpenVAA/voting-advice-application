---
phase: 122-e2e-specs-bank-auth-round-trip
plan: 02
subsystem: testing
tags: [playwright, jose, jwe, oidc, bank-auth, idura, edge-function, deterministic-green]

# Dependency graph
requires:
  - phase: 122-01
    provides: shared buildTestIdToken util + fixed test key pair (testKeys.ts) + decryptionJwks array
provides:
  - EFLOW-10 spec retargeted to the Idura sub-based identity model (Signicat dropped)
  - Deterministic-green gate (D-02) — zero test.skip on the keys-configured create path; loud failure if the decryption JWK is unwired
  - Negative-path test (mismatched enc key -> structured 401) replacing the env-gated keys-NOT-configured skip
  - EFLOW-10 deterministic run command + test-JWKS env-file/JWKS-server procedure in IDURA-TEST-RUNBOOK.md
affects: [122-03, 122-04, 122-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-02 deterministic-green gate: replace test.skip on a precondition with a LOUD expect(probe.keysConfigured).toBe(true) so a 'did not run' becomes a hard failure (cardinal-rule compliant)"
    - "Negative auth path tested by encrypting under a deliberately-wrong enc key (kid the served function has no private half for) -> structured 401, instead of an env-gated skip"
    - "Test env file + static JWKS both derived from testKeys.ts at run time (single source of truth, no key drift)"

key-files:
  created: []
  modified:
    - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
    - tests/IDURA-TEST-RUNBOOK.md

key-decisions:
  - "Asserted the Idura claim flow-through as the PRODUCTION extractClaims set actually is: ['birthdate','hetu'] (claimConfig.ts). The plan/RESEARCH asked for 'country' too, but the Edge Function does NOT extract country — asserting it would fail. Deviation Rule 1 (match real behavior)."
  - "Removed all three test.skip occurrences from the create + magic-link paths; the inverse keys-NOT-configured skip became a mismatched-key negative-path test that RUNS."
  - "Did NOT modify the identity-callback Edge Function (threat T-122-03: runs UNMODIFIED). The blocker below is a production-auth defect that requires an operator/architectural decision (Rule 4)."

requirements-completed: []

# Metrics
duration: ~15min
completed: 2026-06-17
---

# Phase 122 Plan 02: EFLOW-10 Idura-only Edge-Function Round-Trip Summary

**Retargeted `candidate-bank-auth.spec.ts` to the Idura `sub`-based identity model and converted the env-gated `test.skip` into a loud D-02 deterministic-green gate; documented the exact deterministic run command. The spec and runbook are complete, BUT the keys-configured create path cannot be observed green because the production `identity-callback` Edge Function creates an emailless auth user that this local GoTrue version rejects — a production-auth defect outside this plan's modify-allowed scope.**

## Status: BLOCKED on a production-auth-code defect (verify not observed green)

All three tasks' CODE/DOCS artifacts are implemented and committed. Tasks 1 and 2's automated verifies pass. Task 3's `<verify>` (observe `--project=bank-auth` GREEN with the create path taken) **could not be satisfied** and was NOT faked — see "Blocker" below.

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-17T09:56:12Z
- **Tasks:** 3 (code/docs complete; Task 3 live-green verify blocked)
- **Files modified:** 2

## Accomplishments

- **Task 1 — Idura sub-match assertions.** Replaced the generic `toBeTruthy` `app_metadata`
  block with the Idura model: `identity_provider='idura'`, `identity_match_prop='sub'`,
  `identity_match_value=TEST_IDENTITY.sub`, plus the real extra-claim flow-through
  (`hetu`, `birthdate`). Dropped the generic/legacy-provider wording; the spec header is now
  Idura-only and carries the EFLOW-10 deterministic run command. Verify `IDURA_ASSERTIONS_OK`
  passed (sub-prop + sub-value asserted; zero `signicat` after comment-stripping).
- **Task 2 — D-02 deterministic-green gate.** Removed all `test.skip` calls. The keys-configured
  test now asserts `expect(probe!.keysConfigured).toBe(true)` with a pointed message so a missing
  decryption JWK FAILS LOUDLY instead of silently skipping (cardinal-rule compliant). The inverse
  "keys-NOT-configured" skip became a negative-path test that RUNS every run: it encrypts a token
  under a freshly-generated wrong enc key (`kid wrong-enc-1`) the served function cannot decrypt and
  asserts a structured 401. The magic-link test asserts `action_link` containing `token=`
  unconditionally. Verify `NO_SKIP_OK` passed (zero `test.skip`; `keysConfigured` + `action_link`
  present). `tsc -p tests/tsconfig.json` exit 0; `eslint` on the spec exit 0.
- **Task 3 — Runbook.** Appended a distinct "EFLOW-10 — deterministic E2E run" section to
  `tests/IDURA-TEST-RUNBOOK.md` (122-03 will append EFLOW-10b separately): derive the env file
  (`IDENTITY_PROVIDER_TYPE=idura`, `IDENTITY_PROVIDER_DECRYPTION_JWKS=<decryptionJwks>`,
  `IDENTITY_PROVIDER_JWKS_URI`, `IDENTITY_PROVIDER_CLIENT_ID=test-client-id`) and a static test
  JWKS from `testKeys.ts`; serve the JWKS, serve the Edge Function `--env-file`, run
  `PLAYWRIGHT_BANK_AUTH=1 --project=bank-auth`. Flagged the env file TEST-ONLY (never replace prod
  secret; T-122-01/04). The spec header mirrors the run command.

## Task Commits

1. **Task 1 + Task 2 (spec retarget + deterministic-green gate)** — `f4c37cded` (test)
   _Committed together because both tasks rewrite the same keys-configured test block in
   intertwined hunks; splitting would be an artificial reconstruction._
2. **Task 3 (runbook)** — `89020d7db` (docs)

## Live verification observed (honest, not faked)

I brought the determinism environment up exactly as the runbook documents:
1. `python3 -m http.server 8777` serving `{keys:[sigPubJwk]}` (kid `test-sig-1`).
2. `npx supabase functions serve identity-callback --no-verify-jwt --env-file /tmp/eflow10.env`.
3. A direct synthetic-token probe AND `PLAYWRIGHT_BANK_AUTH=1 --project=bank-auth`.

**The Edge Function decrypt -> JWT-verify -> claim-extraction all SUCCEED** (the direct probe
reached production `index.ts:239`, the `createUser` call — proving the test JWE, the fixed
decryption JWK over `host.docker.internal:8777`, and the JWKS verification all work). The create
then fails:

```
status 500
{ "error": "Internal server error",
  "details": "Failed to create auth user: Cannot create a user without either an email or phone" }
```

So `keysConfigured` (defined as `status===200 && body.success===true`) is `false`, and the new
D-02 gate FAILS LOUDLY (as designed): `1 failed, 5 did not run (serial cascade), 2 passed`. This is
the intended cardinal-rule behavior — a silent skip would have hidden the defect.

## Blocker (Rule 4 — architectural / production-auth, operator decision required)

**Root cause (production code, not test code):** `apps/supabase/supabase/functions/identity-callback/index.ts:250-262`
calls `supabaseAdmin.auth.admin.createUser({ email_confirm: true, app_metadata, user_metadata })`
with **no email**, while `generateLink` later (`:324`) uses `${userId}@bank-auth.placeholder`. The
local GoTrue (supabase-edge-runtime-1.71.0) rejects an emailless `createUser` outright
("Cannot create a user without either an email or phone"), so the keys-configured create path can
**never** succeed on this stack. Git history confirms `createUser` has never been passed an email
(`b60c22a03 feat(v2.3): Idura FTN Auth`).

**Why I did not fix it:** Phase 122 threat **T-122-03** mandates the Edge Function "runs UNMODIFIED
— no test-only branch" (Option C explicitly rejected + operator-locked). Supplying the placeholder
email at `createUser` is a real one-line production-auth fix, but it is a production behavior change
to the FTN auth path — a Rule 4 architectural decision that requires the operator, not an executor
auto-fix. I did not fake the verify green (environment_notes mandate).

**The minimal candidate fix (for the operator to approve, NOT applied here):** add
`email: ` + "`${userId}@bank-auth.placeholder`" + ` (or a per-`sub` deterministic placeholder)` to the
`createUser` call so the created user has the same placeholder email `generateLink` already assumes.
This is consistent with the function's own comment ("candidate will be prompted to add one after
login") and `generateLink`'s placeholder, and would make the create path succeed -> `keysConfigured`
true -> the D-02 gate GREEN. Because it touches production auth, it should be a deliberate decision
(and ideally land in apps/supabase with its own pgTAP/spec coverage), not an executor side-effect.

## Deviations from Plan

### Auto-fixed / adapted

**1. [Rule 1 - Match real behavior] Asserted ['birthdate','hetu'] flow-through, NOT 'country'**
- **Found during:** Task 1.
- **Issue:** The plan + RESEARCH §Code Examples assert `app_metadata.country === TEST_IDENTITY.country`
  and describe `IDURA_AUTH_CONFIG.extractClaims = ['birthdate','hetu','country']`. The ACTUAL
  production config (`identity-callback/claimConfig.ts:40-45`) extracts `['birthdate','hetu']` —
  there is no `country`. Asserting `country` would have failed against real behavior.
- **Fix:** Assert `hetu` + `birthdate` (the real extractClaims) and document the omission inline +
  here. `identity_provider`/`identity_match_prop`/`identity_match_value` asserted as specified.
- **Files modified:** `tests/tests/specs/candidate/candidate-bank-auth.spec.ts`
- **Committed in:** `f4c37cded`

**2. [Rule 3 - Blocking] Typecheck target adaptation (inherited from 122-01)**
- The `tests/` dir has no `@openvaa/tests` workspace; typechecked via `npx tsc --noEmit -p tests/tsconfig.json`.
- Verification intent unchanged (exit 0 after every task). No source change.

**3. [Task structure] Tasks 1 + 2 committed together**
- Both rewrite the same keys-configured test block in intertwined hunks; one atomic commit (`f4c37cded`)
  is the honest unit of change.

## Threat Flags

None new. The blocker concerns an existing production-auth defect (emailless `createUser`), not new
attack surface introduced by this plan. The test env file / static JWKS are TEST-ONLY and documented
as never-replace-prod (T-122-01/04, mitigated in the runbook).

## Next Step (operator)

1. Decide on the Edge-Function `createUser` placeholder-email fix (above). It is small and aligns
   with the function's existing placeholder-email assumption, but it is a production-auth change
   gated by T-122-03 — your call.
2. After the fix, re-run the documented EFLOW-10 procedure (runbook "EFLOW-10 — deterministic E2E
   run"): the D-02 gate should turn GREEN with the create path taken (no skipped/did-not-run), 3×.
3. Then EFLOW-10 (`requirements-completed: [EFLOW-10]`) can be marked complete; this plan leaves it
   UNMARKED because the deterministic-green observation is not yet achievable on the unmodified
   Edge Function.

## Self-Check: PASSED (artifacts) / BLOCKED (live-green verify)

- Files: FOUND `candidate-bank-auth.spec.ts`, `IDURA-TEST-RUNBOOK.md`, `122-02-SUMMARY.md`.
- Commits: FOUND `f4c37cded` (test), `89020d7db` (docs).
- Task 1 verify `IDURA_ASSERTIONS_OK`: PASS. Task 2 verify `NO_SKIP_OK`: PASS. tsc/eslint: PASS.
- Task 3 verify `EFLOW10_GREEN`: NOT ACHIEVED — blocked on the production emailless-`createUser`
  defect (documented above). NOT faked. EFLOW-10 left unmarked-complete.

---
*Phase: 122-e2e-specs-bank-auth-round-trip*
*Completed (code/docs): 2026-06-17 — live-green verify blocked on production-auth decision*
