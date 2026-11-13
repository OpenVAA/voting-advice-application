---
phase: 180-edge-functions-typecheck-shared-modules
plan: 02
subsystem: backend
status: complete
tags: [deno, edge-functions, typecheck, shared-modules, supabase, e2e]

requires:
  - phase: 180-01
    provides: the spike reference and sources, 180-totals.mjs, 180-run-checks.mjs, 180-E2E-DELTAS.md
provides:
  - "`yarn typecheck` runs `@openvaa/supabase#typecheck` (`cd supabase/functions && deno check .`, Deno pinned at 2.9.6)"
  - the scoped, import-map-free `apps/supabase/supabase/functions/deno.json`, byte-identical to the spike's
  - "`identity-callback`'s three admin-client parameters typed `SupabaseClient`"
  - "`functions/_shared/` holding `envConfig.ts` and `placeholderAddress.ts` once, with their tests"
  - "`scripts/assert-edge-env-defaults.mjs` at two live checks (env-default; vitest-reachability)"
  - the editor setup (`deno.enablePaths`) documented in the supabase README and the docs page
  - 180-CONTROL-LEDGER.md (rows 180-02-1 to -7, all confirmed) and 180-function-projects.md
  - "the targeted run `tests/e2e-runs/180/180-02-targeted`, green against 179.2-final-4"
affects: [180-03]

tech-stack:
  added:
    - "deno 2.9.6 (npm, devDependency of @openvaa/supabase; platform binaries @deno/<platform>)"
  patterns:
    - "Deno config discovered from the working directory: the `cd` in the workspace script is load-bearing"
    - "A module more than one Edge Function uses lives once in `functions/_shared/`, imported by relative path with `.ts`"

key-files:
  created:
    - apps/supabase/supabase/functions/deno.json
    - apps/supabase/supabase/functions/_shared/envConfig.ts (moved from send-email/)
    - apps/supabase/supabase/functions/_shared/envConfig.test.ts (moved from send-email/)
    - apps/supabase/supabase/functions/_shared/placeholderAddress.ts (moved from identity-callback/)
    - apps/supabase/supabase/functions/_shared/placeholderAddress.test.ts (moved from identity-callback/)
    - .planning/phases/180-edge-functions-typecheck-shared-modules/180-CONTROL-LEDGER.md
    - .planning/phases/180-edge-functions-typecheck-shared-modules/180-function-projects.md
  modified:
    - apps/supabase/package.json
    - yarn.lock
    - apps/supabase/README.md
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/functions/account-access/index.ts
    - apps/supabase/supabase/functions/account-access/addressConfirmation.ts
    - apps/supabase/supabase/functions/identity-callback/serverCredential.ts
    - apps/supabase/supabase/functions/identity-callback/placeholderAccount.test.ts
    - apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts
    - apps/supabase/supabase/functions/send-email/index.ts
    - apps/supabase/supabase/functions/send-email/callerAuthority.ts
    - apps/supabase/supabase/functions/send-email/templateVars.ts
    - apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts
    - "apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md"
    - scripts/assert-edge-env-defaults.mjs
    - scripts/assert-edge-function-env.mjs
    - packages/dev-seed/tests/edgeEnvDefaultsGate.test.ts
    - .claude/skills/database/SKILL.md
  deleted:
    - apps/supabase/supabase/functions/send-email/jwtSegment.ts
    - apps/supabase/supabase/functions/send-email/jwtSegment.test.ts
    - apps/supabase/supabase/functions/account-access/envConfig.ts
    - apps/supabase/supabase/functions/identity-callback/envConfig.ts
    - apps/supabase/supabase/functions/account-access/placeholderAddress.ts

key-decisions:
  - "The function-driving record names what the literal derivation reaches: all 129 projects of 179.2-final-4, the research's 13 among them; the superset run holds the same 129, so the record changes nothing about what runs and makes 180-run-checks.mjs require every project green"
  - "The stack check's first migration count was 1 (00001 initial_schema) against the manifest's 22 after db:stop/db:start; the execution rules' branch was taken (db:reset, db:seed:default) and the second count was 22"

requirements-completed: [E2E-03]

duration: "~12 h wall clock from commit 1 (2026-11-12T20:45Z) to 2026-11-13T08:52Z, across the D-26 checkpoint wait; Task 7 25 min"
completed: 2026-11-13

actuals:
  tokens: 36145
  tasks: 7
  commits: 8
plan_head_before: 3365fed08c1d303862abcbd02637056431a91c5a
plan_head_after: 61149b276081a03a1476e01937a6f0b5a2174d8e
---

# Phase 180 Plan 02: Deno type-check of the Edge Functions and one `_shared/` copy of each shared module Summary

`yarn typecheck` now type-checks every non-test Edge Function module with a pinned Deno 2.9.6 (`cd supabase/functions && deno check .` under a four-key, import-map-free `deno.json`); `envConfig.ts` and `placeholderAddress.ts` exist once under `functions/_shared/`, the dead JWT decoder is gone, the guard has two live checks, every planted control turned red and was reverted, and one targeted `perm-closed-project` run on the restarted stack is green against `179.2-final-4` with no delta.

## Commits, in order

| # | SHA | Subject |
|---|---|---|
| 1 | `f94032781` | chore(180-02): pin Deno 2.9.6 and type-check the Edge Functions in yarn typecheck |
| 2 | `d27bde031` | refactor(180-02): type identity-callback's admin-client parameters as SupabaseClient |
| — | `fcfb09ad4` | docs(180-02): the controls ledger, with the tracer's red |
| 3 | `be96905d7` | refactor(180-02): delete the unused JWT segment decoder |
| 4 | `3fcd9ff36` | refactor(180-02): one copy of each shared Edge Function module under functions/_shared/ |
| 5 | `edbfaddda` | docs(180-02): editor setup for the Edge Functions |
| — | `b549dcf3e` | docs(180-02): the planted controls, each red then reverted |
| — | `61149b276` | docs(180-02): the function-driving projects of the suite, derived |
| — | (final) | docs(180-02): complete … plan (this SUMMARY, STATE, ROADMAP, REQUIREMENTS) |

The five code commits are in the execution rules' order; `yarn workspace @openvaa/supabase typecheck` and `UNIT_STACKFREE` were green before each (`$U/180-02-c{1..5}-unit-stackfree.exit` all 0; the head beside each is the commit's parent).

## Measurements

**Vitest, `@openvaa/supabase` (`UNIT_SUPA`):** before 27 files / 1176 tests (`180-02-supa-before`); after commit 3 26 / 1170 (`c3-supa`: the decoder's test file, −6 tests); after commit 4 26 / 1150 (`c4-supa`, `supa-after`: −20 tests, from the tests the move repointed (the parity test lost its `account-access` namespace cases and copies entry; per-file counts were not logged, so the split is not measured)). Net −1 file, −26 tests, as predicted.

**Cold `deno check` (`Check ` lines):** 26 before the move (`check-cold-1`, exit 0), 22 after it (`check-cold-2`, exit 0), each equal to the tracked non-test `.ts` count under `$FN` at that point.

**Controls ledger** (`180-CONTROL-LEDGER.md`), every row `confirmed`:

| id | control | red observed |
|---|---|---|
| 180-02-1 | tracer: `number` = string in `identity-callback/index.ts`, root `yarn typecheck` | exit 1, `TS2322` at `identity-callback/index.ts:362:7`, `Failed: @openvaa/supabase#typecheck` |
| 180-02-2 | same plant in `_shared/envConfig.ts` | exit 1, `TS2322` at `_shared/envConfig.ts:34:14` |
| 180-02-3 | same plant in `send-email/index.ts` | exit 1, `TS2322` at `send-email/index.ts:331:7` |
| 180-02-4 | same plant in excluded `send-email/callerAuthority.test.ts` | the expected green, exit 0 |
| 180-02-5 | turbo cache: clean, clean, planted, reverted | run 2 `FULL TURBO`; run 3 `cache miss` + `TS2322`, exit 1; run 4 `FULL TURBO`, exit 0 |
| 180-02-6 | `Deno.env.get(...) ?? 'planted-default'` in `_shared/envConfig.ts`, the guard | exit 1, two violations at `_shared/envConfig.ts:34:` (env-default, vitest-reachability) |
| 180-02-7 | one character of the frontend's domain literal | exit 1, `FAIL … is declared once in apps/frontend/src/lib/contestant/utils/identityProviderAccount.ts, with the same literal` |

## D-26: the operator's answer

Relayed by the orchestrator in this executor's prompt on 2026-11-13 (before 08:27:21Z, when this executor's Task 7 began), verbatim: "Task 6 (the D-26 checkpoint) is ANSWERED by the operator on 2026-11-13: -infra does not need the stack, plan 185-10 is out of the way, and -infra has been told to leave the stack alone until this plan's run ends." No stack-using command of this plan ran before it: `$U/180-02-stack.txt` did not exist when Task 7 began (the Task 6 verify block's own condition), and the first stack command is the restart below.

## The stack record (`$U/180-02-stack.txt`)

- `yarn db:stop` exit 0, `yarn db:start` exit 0 (keys withheld from the logs).
- **First count: 1 applied migration (`00001 initial_schema`) against the manifest's 22.** The stack held another tree's schema (the `-infra` worktree's, inferred: the only other user of `openvaa-local`). The rules' branch was taken: no run was in flight (the only `started` markers without `ended` are October and early-November directories of phases 179.1 and `slow-load`, and no wrapper process was running), then `yarn db:reset` exit 0 and `yarn db:seed:default` exit 0.
- Second check: `migrations_applied=22`, `migrations_manifest=22`, `functions_mount=/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/functions`, `edge_runtime_running=true`, `checked_at=2026-11-13T08:29:27Z`.
- Consequence for `-infra`: when it next uses the stack it meets this tree's 22-migration schema and needs its own reset (observed here: its schema was replaced).

## Gates

| gate | status | head |
|---|---|---|
| `yarn typecheck` (root, Task 1) | 0, names `@openvaa/supabase:typecheck` | working tree of commit 1 |
| `yarn lint:check` | 0 | `edbfaddda` |
| `yarn format:check` | 0 | `edbfaddda` |
| `UNIT_STACKFREE` (pre-gate) | 0 | `edbfaddda` |
| `yarn prettier --check apps/supabase/supabase/functions` | 0 | `3fcd9ff36` + commit 5's docs |
| `yarn workspace @openvaa/docs validate:links` | 0 | `3fcd9ff36` + commit 5's docs |
| `yarn assert:edge-env-defaults` | 0, `checks live: 2 of 2 (env-default; vitest-reachability)` | final code tree |
| `UNIT_FULL` (`yarn test:unit`, after the stack check) | 0; 26 of 26 turbo tasks; `default-template.integration.test.ts` run (3 tests, ✓); supabase 26 files / 1150, frontend 321 files + 1 skipped / 8385 + 33 skipped, dev-seed 81 / 1258, tests workspace 13 / 224 | `b549dcf3e` |

`edbfaddda` and `b549dcf3e` and `61149b276` are equal outside `.planning/`, so every gate above stands for the run's tree.

## The function-driving projects (`180-function-projects.md`)

Steps (a) to (d) of § Targeted E2E, run at `b549dcf3e`. (a) finds `invitationFlow.fixture.ts`, `contestant-bank-auth.spec.ts`, `accountAccessClient.ts`; (b)'s basename fixed point (6 rounds, 246 files) crosses the seeding client `supabaseAdminClient.ts` (its `inviteByEmail` alone calls `account-access`), the shared `testIds.ts` and plain comment mentions (`contestant-journey`, `voter-journey.spec`), and so reaches most of `tests/tests`; (c) adds the entry, registration, recovery, identity-provider, bank-auth and admin-account-flows specs, and records that `send-email` has no caller in `apps/frontend/src` outside the writer's own unit test; (d) maps every file carrying tests in `179.2-final-4/results.json` to its `projectName`.

**Derived set: all 129 projects of the baseline run** (`project: bank-auth` and `project: contestant-identity-provider` among them). **Against the research's 13:** none of the 13 is missing; each has its chain back to a step-(a) file. The other 116 share one reason, listed per project with its chain: (b) follows a basename match, not a call. The superset run holds the same 129, so the record changes nothing about what runs; it makes `180-run-checks.mjs --projects` require all 129 green. A dry check of `180-run-checks.mjs` against `179.2-final-4` with the record exits 0 (129 projects checked).

## The run of record

`tests/e2e-runs/180/180-02-targeted` (`$U/180-02-run-of-record.txt`), the only attempt of this label: `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/180/180-02-targeted --no-db-reset --project perm-closed-project`, on AC power at 100 %, after `docker builder prune -af` (2.561 GB reclaimed) and with the edge runtime running. Started 08:31:48Z, ended 08:51:25Z (18.9 min of tests). Wrapper exit 0, no `VOID-host-suspend.txt`; head `61149b276`, equal to HEAD outside `.planning/`.

**Counts: 729 total, 729 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, over 129 projects**, against `179.2-final-4`'s 729 of 729 over 129 projects, with no delta.

| judging step | result |
|---|---|
| `e2e-evidence.mjs` | exit 0, total 729, passed 729, failed 0, flaky 0, didNotRun 0 |
| 1. `180-totals.mjs --slice` | exit 0, `OK (slice, 129 projects, 729 tests)`: every project's total equals the baseline's |
| 2. `e2e-spec-verdict.mjs --no-flaky --passed contestant-bank-auth.spec.ts --passed contestant-identity-provider.spec.ts` | exit 0, `VERDICT OK: 729 tests -- passed 729, failed 0, flaky 0, skipped 0, did not run 0` |
| 3-5. `180-run-checks.mjs --projects 180-function-projects.md` | exit 0: all 129 recorded projects present and all passed; `restore.txt` `OPTIONS account-access: 200`, `OPTIONS identity-callback: 200`, `OPTIONS send-email: 200`, no `_shared` line, `restore: ok`; `idp-functions.log` serves exactly the three functions, 0 `import map`/`deno.json` lines |
| 6. head check | `git diff --quiet 61149b276 HEAD -- . ':(exclude).planning'` exit 0 |
| Task 7 `<automated>` block (`$U/180-02-t7-verify.sh`) | exit 0 |

**The wrapper's closing stack restore succeeded:** `yarn db:stop` exit 0 after 5 s, `yarn db:start` exit 0 after 25 s, the edge runtime running, all three functions `OPTIONS 200`, ports 8777 and 9443 free, `restore: ok` at 08:51:25Z. The stack is free again.

## Deltas and pins

Deltas: none. `180-E2E-DELTAS.md` keeps its header only (no `| 180-` row). Pins: `contestant-bank-auth.spec.ts` 12 of 12 passed in project `bank-auth` and `contestant-identity-provider.spec.ts` 42 of 42 passed in project `contestant-identity-provider` (12 and 42 in `179.2-final-4`).

## Deviations from Plan

**1. [Rule 3 - Blocking] The stack held another tree's schema.** The first stack check after `db:stop`/`db:start` counted 1 applied migration against 22. The execution rules prescribe this branch (`yarn db:reset`, then `yarn db:seed:default`, then compare again); it was taken, and the second count matched. Recorded in `$U/180-02-stack.txt` (`note=` line) and above.

**2. The function-project record names 129 projects, not about 13.** The derivation was run as the rules define it, and its basename fixed point reaches the whole suite; the record names what it reached rather than a hand-narrowed set, with the per-project reason the rules ask for. No effect on what ran (the superset run is fixed by the plan).

**3. STATE.md and ROADMAP.md.** The execution rules say the executor edits neither; this executor's prompt asks for the usual completed-plan state and roadmap updates. They were made through the GSD tooling (`roadmap.update-plan-progress`, `state.*`), not by hand.

## Observed and inferred

Observed: every exit status, count and log line above; the stack record; the run's counts, `restore.txt` and `idp-functions.log`. Inferred: that the 1-migration schema was `-infra`'s (the only other user of the shared stack); that `deno.enablePaths` behaves in VS Code as documented (D-12's editor half is documented, not observed; its automated proxy, no `fmt` key and Prettier green over the functions tree, is observed); that `deno.path` pointing at `node_modules/.bin/deno` works in VS Code (documented as unverified).

## Known Stubs

None.

## Threat Flags

None. No network endpoint, auth path or schema changed; `callerAuthority.ts` is not moved or edited in code (T-180-06); the ignored `functions/.env` was never read, listed or staged (T-180-07); the D-26 checkpoint preceded every stack use (T-180-08).

## Self-Check: PASSED

Every created file listed above exists (the five `_shared/` and config files, the ledger, the function-project record, this SUMMARY, the run's `summary.json`); every deleted module is absent; all eight plan commits (`f94032781` … `61149b276`) are ancestors of HEAD.
