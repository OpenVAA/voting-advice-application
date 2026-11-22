---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 14
subsystem: infra
tags: [supabase, edge-functions, verify-jwt, gateway, keys, parity-guard, rulings]
status: complete

requires:
  - "184-12: D09_TRIGGER=yes (the hosted gateway refused an apikey-only call to account-access with 401 UNAUTHORIZED_NO_AUTH_HEADER) and D12_LEGACY_ANON=works"
  - "184-10: the key model, s4_legacy_enabled=true, s4_legacy_http=200, retirement 'early 2027'"
  - "184-05: the parity guard's not-compared rows, CORRECT_CONFIG and CASES"
provides:
  - "config.toml [functions.account-access] verify_jwt = false, read by the CLI's function deploy and by the probe's functions.verify-jwt"
  - "The guard row functions.account-access/verify_jwt (not compared) and two deployment-template spec cases"
  - "D12_RAISED=no, ruled by the operator on 2026-11-10: the deployment stays on the legacy keys"
affects: [184-15, 184-16, 184-22, 184-23]

actuals:
  tokens: 3100
  tasks: 2
  commits: 1
plan_head_before: c5b32c521066db02dad9f7e2efa5a33e288deacd
plan_head_after: c4802fcf5204f39e4c044c5d0b23acd2b3229e09

tech-stack:
  added: []
  patterns:
    - "A function's gateway JWT setting lives in config.toml only, classed not compared by the parity guard and held to by the probe"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-14-key-and-gateway-rulings.md
  modified:
    - apps/supabase/supabase/config.toml
    - scripts/assert-hosted-settings-parity.mjs
    - packages/dev-seed/tests/deploymentTemplates.test.ts

key-decisions:
  - "D09_APPLIED=yes: account-access declares verify_jwt = false, because the hosted gateway refuses an apikey-only call before the function runs; the function makes its own checks of every request (2026-11-10)"
  - "D12_RAISED=no, ruled by the operator: the legacy keys are enabled and work for every measured shape, and 'early 2027' is not shown to fall before the streams merge (2026-11-10)"

requirements-completed: []  # OBS-03 and SUPA-13 close on the live re-measurement and the persistent project's runs

duration: about 35 min of agent work (start 20:06:52Z, blocked at the E2E gate about 20:30Z, resumed 21:41Z)
completed: 2026-11-10
---

# Phase 184 Plan 14: The key model and account-access's JWT setting Summary

D09_APPLIED=yes

D12_RAISED=no, ruled by the operator on 2026-11-10.

**Plan 184-15 begins by redeploying `account-access` and measuring shapes (a) and (b) again.** Until then, the throwaway still serves the function with `verify_jwt` true, and the probe's `functions.verify-jwt` now expects `false`.

## Performance

- **Duration:** about 35 min of agent work.
  - Start: 2026-11-10T20:06:52Z.
  - The plan stopped at the E2E gate at about 20:30Z.
  - The orchestrator's green run started at 21:28:17Z, and the record resumed at 21:41Z.
- **Completed:** 2026-11-10
- **Tasks:** 2 of 2
- **Files modified:** 3 source files and 1 evidence file

## Accomplishments

- **D-09, `account-access`'s JWT setting.**
  - `apps/supabase/supabase/config.toml` declares `[functions.account-access]` with `verify_jwt = false`. It follows `[functions.identity-callback]` and has a comment in that table's form: the gateway verifies no JWT for this function, the function admits an anonymous caller and makes its own checks (the closed sign-up, the redirect allow list, eligibility and the throttle), and `supabase functions deploy` reads the setting.
  - The parity guard classifies `functions.account-access/verify_jwt` as not compared, with identity-callback's reason. The same table is in `CORRECT_CONFIG`.
  - `deploymentTemplates.test.ts` gained two cases: the section exists, and it assigns `verify_jwt = false`.
  - The frontend is unchanged. supabase-js already sends the anon key as `Authorization: Bearer`.
- **D-12, the key model.** Not raised. Every trigger is false: `s4_legacy_enabled=true`, `s4_legacy_http=200` and `D12_LEGACY_ANON=works`. The dashboard gives the retirement only as "early 2027", and no record puts the merge after it. The operator agreed on 2026-11-10. Plan 184-23 adds the date to the FUT-02 todo.

## Task Commits

1. **Task 1: the key model.** A decision checkpoint, not raised, because no trigger held. Its record line is in the evidence file, committed with Task 2.
2. **Task 2: `account-access`'s JWT setting (TDD).** Commit `c4802fcf5`. The spec cases were written first and failed (2 failed, 23 passed); then the table, the guard row and the `CORRECT_CONFIG` table were added.

The SUMMARY, the operator's ruling and the E2E record went in with the plan's docs commit.

## Verification

| Gate | Exit |
| ---- | ---- |
| `node scripts/assert-hosted-settings-parity.mjs --self-test` (98 cases) | 0 |
| `node scripts/assert-hosted-settings-parity.mjs` | 0 |
| dev-seed `tests/deploymentTemplates.test.ts` + `tests/hostedSettingsParityGate.test.ts` (43 tests) | 0 |
| `yarn assert:comment-hygiene` | 0 |
| `yarn test:unit:infra`, offline (96 tests) | 0 |
| `assert-auth-signup-closed.mjs`, `assert-schema-migration-parity.mjs` | 0, 0 |
| The plan's outcome check (`D09_APPLIED=yes` and exactly one `[functions.account-access]`) | 0 |
| Full E2E, `tests/e2e-runs/184-14-account-access-verify-jwt-3`, at HEAD `c4802fcf5` with a database reset: 548 expected, 0 skipped, 0 unexpected, 0 flaky, no VOID marker, preflight 1/0 | 0 |

## Decisions Made

- **D09_APPLIED=yes (2026-11-10).** On the throwaway, the gateway refused an apikey-only call to `account-access` before the function ran. The function admits unauthenticated callers by design, and the key the gateway demanded is public. So the gateway's check adds nothing, and it refuses a shape a client may send. The threat T-184-41 is accepted as planned.
- **D12_RAISED=no, ruled by the operator (2026-11-10).** The deployment stays on the legacy keys under C5. The service-role shapes are judged in 184-15 and 184-16.

## Deviations from Plan

### E2E and the shared local stack

**1. The executor's stack restart disrupted another worktree's E2E run.**
- **Found during:** the E2E check after Task 2. The plan does not name this gate; CLAUDE.md's E2E rule requires it.
- **What happened:** at about 20:08Z the executor ran `yarn db:stop && yarn db:start`, so the local edge runtime would load the new `config.toml`. The -gsd session's run `179.1-85-final-r2`, started 19:57Z, was using the shared stack at that moment. That run is red, and this restart is its known external cause.
- **Ruling:** the operator ruled on 2026-11-10 that -infra takes the stack for this plan's run and tells -gsd. The -gsd session acknowledged and held off.

**2. Two E2E attempts before the green run.**
- **Run 1, `184-14-account-access-verify-jwt`:** exit 5. Port 5273 was held by the -gsd session's dev server, and the wrapper refused to adopt it. No test ran.
- **Run 2, `184-14-account-access-verify-jwt-2`** (`FRONTEND_PORT=5373`, `--no-db-reset`): exit 1, with 39 passed, 1 failed and 508 did not run. Base setup's import failed with `bulkImport failed: Nomination constituency … is no constituency of its election …`, and setup reported foreign rows in the E2E project. Cause UNCONFIRMED: the stack was in concurrent use by the -gsd session.
- **Run 3, `184-14-account-access-verify-jwt-3`:** exit 0, all 548 expected. The orchestrator ran it with the operator's approval, after `yarn db:stop` and with a database reset, so the stack started from this tree's `config.toml`.

### Out of scope

- `eslint` run directly on `scripts/assert-hosted-settings-parity.mjs` reports 27 errors and 1 warning, none on lines this plan changed. `yarn lint:check` does not lint `scripts/`, so these are not a gate, and they were left alone.

## Issues Encountered

None in the plan's own work, beyond the shared-stack incident above.

## Next Phase Readiness

- 184-15 starts with the redeploy of `account-access` from the linked work directory, then measures shapes (a) apikey-only and (b) Bearer again. Shape (a) is expected to reach the function now.
- The probe's `functions.verify-jwt` stays red on the throwaway until that redeploy, because it now expects `false`.

## Self-Check: PASSED

- FOUND: apps/supabase/supabase/config.toml (`[functions.account-access]` count 1)
- FOUND: scripts/assert-hosted-settings-parity.mjs (row `functions.account-access`)
- FOUND: packages/dev-seed/tests/deploymentTemplates.test.ts (two account-access cases)
- FOUND: evidence/184-14-key-and-gateway-rulings.md (`D09_APPLIED=yes`, `D12_RAISED=no`)
- FOUND: commit c4802fcf5 (ancestor of HEAD)
