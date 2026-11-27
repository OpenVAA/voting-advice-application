---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 05
subsystem: infra
tags: [supabase, edge-functions, verify_jwt, parity-guard, lint, vitest]
status: complete

requires: []
provides:
  - "scripts/assert-hosted-settings-parity.mjs: inFamily takes every [functions.*] table; row functions.identity-callback/verify_jwt (class 'not compared', reason const DEPLOYED_FROM_THIS_FILE)"
  - "Two self-test cases: 'an unclassified [functions.*] table added' and 'a classified [functions.*] table removed'"
  - "packages/dev-seed/tests/hostedSettingsParityGate.test.ts: two spec cases (added functions table exits 1 naming the key; unchanged config copy exits 0), copyOfConfig helper, runGuard offline"
affects: [184-06, 184-14]

actuals:
  tokens: 1800
  tasks: 2
  commits: 2
plan_head_before: e923b4eb581381f165918fee74e65667d66f4294
plan_head_after: 9603a84bc2731c5c1c08364a5d5e4e6f30d3bdeb

tech-stack:
  added: []
  patterns:
    - "A config.toml table family is widened in inFamily, with a row for each live key and self-test cases for both stale directions"
    - "Guard specs spawn the guard with proxies on a closed local port, SUPABASE_ACCESS_TOKEN removed and a 15 s timeout"

key-files:
  created: []
  modified:
    - scripts/assert-hosted-settings-parity.mjs
    - packages/dev-seed/tests/hostedSettingsParityGate.test.ts

key-decisions:
  - "functions.identity-callback/verify_jwt is 'not compared': the CLI's function deploy reads it from config.toml, so the deployed value cannot drift from the file; the conformance probe compares the served value"
  - "The row's reason is a named const (DEPLOYED_FROM_THIS_FILE) so the row stays on one line under Prettier"

patterns-established:
  - "Every [functions.<name>] key must be classified with a reason, or yarn lint:check fails"

requirements-completed: []  # SUPA-05 is shared by nine plans of this phase and covers the deployment itself; this plan contributes the guard row

duration: about 10 min
completed: 2026-10-26
---

# Phase 184 Plan 05: Parity guard covers `[functions.*]` Summary

**The hosted-settings parity guard now classifies every key of every `[functions.*]` table of config.toml; `identity-callback`'s `verify_jwt` is a "not compared" row, and an unclassified function key fails the guard.**

## Performance

- **Duration:** about 10 min
- **Completed:** 2026-10-26
- **Tasks:** 2
- **Files:** 0 created, 2 modified

## Accomplishments

- `inFamily` takes `table.startsWith('functions.')`, so the guard reads `[functions.identity-callback]` and any future `[functions.<name>]` table (such as a `[functions.account-access]` that plan 184-14 may add).
- The row `...none('functions.identity-callback', ['verify_jwt'], DEPLOYED_FROM_THIS_FILE)` at the end of `ROWS`. The reason says the CLI's function deploy reads the setting from this file, so the deployed value cannot drift from it, and that the conformance probe compares what the project serves.
- `CORRECT_CONFIG` holds `[functions.identity-callback]` with `verify_jwt = false`, so the correct inputs stay clean.
- Self-test cases, written first and seen RED (exit 1, these two the only failures out of 98 cases) before the family was widened:
  - `an unclassified [functions.*] table added`: expected `['functions.new-function/verify_jwt']`. RED reported `[]`.
  - `a classified [functions.*] table removed`: expected `['functions.identity-callback/verify_jwt']`, the id the guard uses for a classified key that is no longer live. RED reported `[]`.
- The header sentence and the census line name `[functions.*]` with the other tables. Census on the repository: 67 live keys, not compared 36 (previously 66 and 35).
- Spec: `fails on a [functions.*] key that no row classifies, and names it` and `passes on an unedited copy of config.toml, so the test above fails on its added table alone`. A `copyOfConfig(appended)` helper replaces the inline copy in the quoted-header case. `runGuard` now runs the guard with `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` at `http://127.0.0.1:9`, `SUPABASE_ACCESS_TOKEN` removed and a 15 s timeout. The guard makes no network call and reads no credential.

## Gate results (exit statuses read directly)

| Command | Exit |
|---|---|
| `node scripts/assert-hosted-settings-parity.mjs --self-test` before the widening (RED) | 1 (2 FAIL lines, the two new cases) |
| `node scripts/assert-hosted-settings-parity.mjs --self-test` | 0 (98 cases pass) |
| `node scripts/assert-hosted-settings-parity.mjs` (repository files) | 0, no finding line |
| `yarn workspace @openvaa/dev-seed test:unit tests/hostedSettingsParityGate.test.ts` | 0 (18 of 18 tests) |
| Red control: config copy with `[functions.new-function] verify_jwt = false`, `--config <copy>` | **1**, stdout names `functions.new-function/verify_jwt` (unclassified) |
| The same with an unchanged copy | **0** |
| `yarn prettier --check` on both files | 0 |
| `yarn eslint packages/dev-seed/tests/hostedSettingsParityGate.test.ts` | 0 |
| `yarn assert:comment-hygiene` | 0 |

`yarn eslint scripts/assert-hosted-settings-parity.mjs` reports 28 problems both before and after this plan. `scripts/` is not in the `lint:check` ESLint scope, and the count did not change.

## Task Commits

1. **Task 1: The `[functions.*]` family, its row and its self-test cases.** `f9c8f18b1` (feat)
2. **Task 2: See the widened family fail through the spec and the gate's command.** `9603a84bc` (test)

## Files Created/Modified

- `scripts/assert-hosted-settings-parity.mjs`: `inFamily`, the row and its reason const, `CORRECT_CONFIG`, two `CASES`, the header sentence and the census line.
- `packages/dev-seed/tests/hostedSettingsParityGate.test.ts`: two cases, `copyOfConfig`, and the offline `runGuard`.

## Decisions Made

- The reason is the const `DEPLOYED_FROM_THIS_FILE`, declared just above `ROWS`, so the row is a single line. Prettier would otherwise break the call across lines, and the plan's acceptance grep `none('functions.identity-callback'` would not match it.
- The census line names `[functions.*]` too. The plan names only the header sentence, but the census would otherwise count functions keys under a list of tables that leaves them out.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Safety] The guard spec runs the guard offline with no access token**
- **Found during:** Task 2
- **Issue:** this phase's standing rule is that any spec spawning a script runs it with `SUPABASE_ACCESS_TOKEN` removed, proxies on a closed local port and a short timeout. `runGuard` passed the full environment and had no timeout.
- **Fix:** `runGuard` sets `UNREACHABLE_NETWORK` (the shape `pushMigrationsGate.test.ts` uses), deletes `SUPABASE_ACCESS_TOKEN`, and sets `timeout: 15_000`. Every existing case still passes.
- **Files modified:** `packages/dev-seed/tests/hostedSettingsParityGate.test.ts`
- **Commit:** `9603a84bc`

## Issues Encountered / Deferred

- `yarn workspace @openvaa/dev-seed typecheck` exits 2 with one TS2345 error in `tests/checkDriftLinkedGuard.test.ts`, which plan 184-04 added. That file is out of this plan's scope; the entry is in `deferred-items.md`. The file this plan changed has no type error.
- SUPA-05 is not marked complete: `requirements.mark-complete` was run and then reverted, because eight other plans of this phase carry SUPA-05 and the requirement is the deployment itself.
- **Deferred to orchestrator (stack busy):** the plan requires no full `yarn test:unit` or `yarn lint:check`, so neither was run. The guard link of `lint:check` (`yarn assert:hosted-settings-parity`) was run on its own and exits 0.

## Threat Flags

None. The change narrows what can pass unreviewed (T-184-16) and installs no package (T-184-SC).

## Self-Check: PASSED

- FOUND: scripts/assert-hosted-settings-parity.mjs (`startsWith('functions.')` 1, `none('functions.identity-callback'` 1, `functions.new-function/verify_jwt` 1)
- FOUND: packages/dev-seed/tests/hostedSettingsParityGate.test.ts (`functions.new-function` 2)
- FOUND: f9c8f18b1, 9603a84bc (ancestors of HEAD)
