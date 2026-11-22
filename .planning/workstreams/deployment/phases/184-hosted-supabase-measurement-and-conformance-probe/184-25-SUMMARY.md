---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 25
subsystem: infra
tags: [gates, e2e, lint, format, unit, local-stack, edge-runtime]
status: complete

requires:
  - "184-24: the throwaway retired; the tree is final for the phase"
  - "184-14: verify_jwt = false for account-access in config.toml"
  - "184-08: the dev-seed smoke template"
provides:
  - "E2E_GATE=green on dccdf490842d64b06be71569e97df112607e2014: 548 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run"
  - "lint:check exit=0, format:check exit=0, test:unit exit=0 on the same commit, the infra suite 96 of 96"
affects: [185, 186, 187, 189]

estimate:
  tokens: 22000
  tasks: 2
actuals:
  tokens: 2400
  tasks: 2
  commits: 1
plan_head_before: dccdf490842d64b06be71569e97df112607e2014
plan_head_after: 62896cfdaac06eec34c49c7f32cbde6b3fb622e6

tech-stack:
  added: []
  patterns:
    - "Gates run by the orchestrator, recorded by the executor: a subagent's stack and E2E commands are refused in auto mode"
    - "A red run caused by the shared stack's state is kept, recorded red with its measured cause, and followed by a whole-suite run after the stack is put right"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-25-final-gates.md
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-25-closing-e2e.md
  modified: []

key-decisions:
  - "184-25: the phase closes green on dccdf490842d: lint, format and unit exit 0 (infra 96/96) and the full E2E suite 548/548 in tests/e2e-runs/184-25-20261112T062610Z"
  - "184-25: two red first runs were environmental, both from the -gsd worktree's hold on the shared stack (its 00001-00010 schema; its functions mounted in the edge runtime), cleared by db:reset and by db:stop plus db:start from -infra, with no file changed"

requirements-completed: [SUPA-05, OBS-07]  # SUPA-07 was already complete (184-18, 184-19, 184-23); OBS-07's two probe checks passed on the persistent project in 184-23

duration: about 25 min of gate wall time (06:15Z to 06:39Z, run by the orchestrator) plus about 10 min of recording
completed: 2026-11-12
---

# Phase 184 Plan 25: The closing gates Summary

**E2E_GATE=green: 548 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run (`tests/e2e-runs/184-25-20261112T062610Z`, wrapper exit 0, verdict `--no-flaky` exit 0). `lint:check exit=0`, `format:check exit=0` and `test:unit exit=0` on `dccdf490842d64b06be71569e97df112607e2014`, the infra suite 96 of 96. Both first runs were red for environmental reasons, the shared stack still holding the `-gsd` worktree's state, and both are recorded red with their measured causes.**

## How this plan ran

The orchestrator ran every gate, stack and E2E command itself, because a subagent's stack commands are refused in auto mode. Its logs are in `tmp/184-gates/`. This executor did not run any gate again: it read the logs and run directories, wrote the two evidence files, ran the plan's two automated verifies (both exit 0, the second re-running `e2e-spec-verdict.mjs --no-flaky` on the green run directory, a read-only check) and committed them. HEAD was `dccdf490842d64b06be71569e97df112607e2014` before and after every run, and the tree was clean outside `.planning/`.

## Task 1: the repository gates

- Run 1 (06:15:32Z to 06:17:07Z): `lint:check exit=0`, `format:check exit=0`, `test:unit exit=1`. The two failures were in `packages/dev-seed/tests/integration/default-template.integration.test.ts`: `bulkImport failed: Nomination constituency <uuid> is no constituency of its election <uuid>`, then, as a consequence, `anon-visible candidate nominations: expected 0 to be greater than 0`.
- Cause, measured: the shared database held migrations `00001` to `00010` from the `-gsd` worktree, whose `nomination_write_guards` check refuses this branch's seed. This branch has only `00001`. It is outside this phase's files.
- Fix: `yarn db:reset` from `-infra` (exit 0), after which the database held only `00001`.
- Run 2 of `test:unit` (06:18:17Z to 06:19:52Z): exit 0; turbo `Tasks: 25 successful, 25 total`; dev-seed 1266 of 1266; `test:unit:tests` 189 of 189; `test:unit:infra` 96 of 96.
- D-24: no pending todo was folded into this phase.

## Task 2: the closing E2E run

- Run 1, `tests/e2e-runs/184-25-20261112T062006Z`: wrapper exit 1, not void. Total 548, passed 96, failed 11, flaky 0, skipped 53, did not run 388. All 11 failures were `awaitLinkWitness: witness <uuid> read neither sent nor not-sent within 30000 ms`. **Red, kept, not counted.**
- Cause, measured with `docker inspect`: the edge runtime container, started about 10 h earlier by the `-gsd` worktree, mounted `-gsd`'s `apps/supabase/supabase/functions`. `db:reset` does not restart that container, so the served `account-access` was `-gsd`'s, against this branch's single-migration database. Run 2 going green after the restart, with no file changed, confirms it.
- Fix: `yarn db:stop` and `yarn db:start` from `-infra` (both exit 0). The edge runtime then mounted the `-infra` functions, and the database held only `00001`.
- Run 2, `tests/e2e-runs/184-25-20261112T062610Z` (06:26:10Z to 06:39:24Z): `E2E_WRAPPER_EXIT=0`, not void, `548 passed (13.1m)`, preflight 0 failures and 1 success. `e2e-evidence.mjs` exit 0 and `e2e-spec-verdict.mjs --no-flaky` exit 0: `VERDICT OK: 548 tests -- passed 548, failed 0, flaky 0, skipped 0, did not run 0`. `E2E_GATE=green`.
- The run covers this phase's two local-stack changes: `config.toml`'s `[functions.*]` family with `verify_jwt = false` for `account-access` (the mailed-link specs that call it all passed), and the dev-seed `smoke` template (on the tree; its unit and integration tests are in the green unit gate).

## Lesson for future phases

When another worktree started the shared local stack, **reset is not enough: restart it from `-infra` with `yarn db:stop` and `yarn db:start`**. `yarn db:reset` replaces the database's migrations but leaves the edge runtime container running, and that container keeps the functions directory of the worktree that started it. The symptom is mailed-link specs timing out in `awaitLinkWitness` while everything else seems healthy. The reverse holds too: the `-gsd` session must now do the same from its own worktree before it continues (`V216_SESSION_MUST_RESET=yes` in the evidence).

## Deviations from Plan

None in what was done. The plan's Task 1 rule says a non-zero status whose cause is outside this phase's files stops the plan. Here the cause was the shared stack's state, not a file, and the standing rule that `-infra` resets the shared stack freely allowed the orchestrator to put the stack right and run the gate again with no file changed. Both red first runs are recorded, not hidden.

Prettier does not cover the evidence files: `.planning/` is in `.prettierignore` (`prettier --file-info` prints `"ignored": true` for both).

## Issues

None open. The leak scan of the two evidence files (JWT, Supabase key, access token, connection string, e-mail address and AWS key patterns) found nothing.

## Self-Check: PASSED

- FOUND: `evidence/184-25-final-gates.md` (verify 1 exit 0)
- FOUND: `evidence/184-25-closing-e2e.md` (verify 2 exit 0)
- FOUND: commit `62896cfda`, an ancestor of HEAD
- FOUND: `tests/e2e-runs/184-25-20261112T062610Z` and the kept red run `tests/e2e-runs/184-25-20261112T062006Z`, neither holding `VOID-host-suspend.txt`
