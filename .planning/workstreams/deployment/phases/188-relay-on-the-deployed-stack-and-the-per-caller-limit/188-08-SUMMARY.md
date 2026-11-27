---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "08"
subsystem: testing
tags: [e2e, playwright, gates, prettier, terraform-test, local-half-close]

requires:
  - phase: 188 (plans 01-07, 20)
    provides: the relay flush interval and queue, the per-caller limit (migration 00023, account-access wiring), the relay rate rule and Terraform changes, the load and read scripts
provides:
  - "E2E_TREE_SHA=9789bbcf6fc51885748972b84d8631a0e9c36f2b, the reference that plans 188-10 to 188-19 check apps/, packages/ and tests/ against"
  - "The phase's one full local E2E run, green: 729 passed, 0 failed, flaky, did not run or skipped"
  - "Every repository gate green on that tree (GATES_HEAD = E2E_TREE_SHA)"
affects: [188-10, 188-11, 188-12, 188-13, 188-14, 188-15, 188-16, 188-17, 188-18, 188-19]

actuals:
  tokens: 3400
  tasks: 2
  commits: 4
plan_head_before: f4b6a83114682e4885aeca26d583d4f088a85ce3
plan_head_after: 8ba3bfceba1bed58fcb152fc85750655aafc61c2

tech-stack:
  added: []
  patterns:
    - "Hold a task's evidence commit until the full E2E run has ended, so the run's HEAD is exactly the gated head"

key-files:
  created:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-08-local-gates.md
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-08-closing-e2e.md
  modified:
    - apps/supabase/supabase/tests/database/59-invitation-caller-limit.test.sql
    - apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md

key-decisions:
  - "Phase 188 local half closed: E2E_TREE_SHA=9789bbcf6fc51885748972b84d8631a0e9c36f2b, full suite 729/729 green, no project delta against 187-28-close; plan 188-10 diffs apps/, packages/ and tests/ against it before its push"
  - "The plan's comparison against 187-13's 548 is read as the last full run, 729 (187-28-close, the current lines of 187-13-closing-e2e.md), under the 2026-11-09 ruling"

requirements-completed: []

coverage:
  - id: D1
    description: "Every repository gate exits 0 on the closing tree: lint, format, unit (stack running), build, module and example terraform test"
    verification:
      - kind: other
        ref: "evidence/188-08-local-gates.md (statuses from tmp/188-08/gates/*.status)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The phase's one full local E2E run, green and not void, on the gated tree"
    verification:
      - kind: e2e
        ref: "FRONTEND_PORT=5273 caffeinate -i tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/188-close-20261118T195528Z --no-db-reset (729 passed; VERDICT OK --no-flaky)"
        status: pass
    human_judgment: false

duration: 27min
completed: 2026-11-18
status: complete
---

# Phase 188 Plan 08: The Local Half's Gates and Full E2E Run Summary

**E2E_TREE_SHA=9789bbcf6fc51885748972b84d8631a0e9c36f2b — 729 passed.** The full local suite is green on the gated tree: 0 failed, 0 flaky, 0 did not run, 0 skipped, and the run is not void. Every repository gate also passed on that tree, after two whitespace-only Prettier fixes in the files of 188-04 and 188-05.

## Performance

- **Duration:** about 27 min, 19 min of it the E2E run
- **Started:** 2026-11-18T19:48:57Z
- **Completed:** 2026-11-18T20:15:26Z
- **Tasks:** 2
- **Files modified:** 4 (2 evidence files, 2 whitespace fixes)

## Accomplishments

- **Gates (Task 1), on GATES_HEAD=9789bbcf6:** all exit 0, each read from its own status file.
  - lint, format and build.
  - unit, with the stack running.
  - The module's terraform test, 38/0, and the example root's, 1/0. Both ran offline with a scratch `TF_DATA_DIR`.
- **Full E2E run (Task 2):** `tests/e2e-runs/188-close-20261118T195528Z`.
  - Wrapper exit 0, preflight 1 success and 0 failures, `restore: ok`.
  - The heartbeat's worst lateness was 190 ms, so the run is not void.
  - The run's HEAD was GATES_HEAD both before and after it.
- **Against the last full run** (`187-28-close-20261116T234457Z`, 729): no project's count moved across all 129 projects, and no title was added or lost. The sum of the per-plan deltas, 0, is now measured rather than just reported.

## Task Commits

1. **Gate fix, format (188-04's pgTAP file)** - `ea2d660f3` (style)
2. **Gate fix, format (188-05's docs page)** - `9789bbcf6` (style)
3. **Task 1: the repository's gates on the closing tree** - `40cac26f1` (docs)
4. **Task 2: the phase's one full local E2E run** - `8ba3bfceb` (docs)

## Files Created/Modified

- `evidence/188-08-local-gates.md`: GATES_HEAD, TREE_CLEAN and the seven exit lines, plus the two red runs that came before.
- `evidence/188-08-closing-e2e.md`: E2E_TREE_SHA, the run directory, the counts, the verdict and the deltas.
- `apps/supabase/supabase/tests/database/59-invitation-caller-limit.test.sql`: one call wrapped to Prettier's print width.
- `apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md`: two table rows padded to the column width.

## Decisions Made

- The record's line `E2E_PASSED_VS_187_CLOSE` compares against **729**, not the plan's 548. 729 is the last full run (the current lines of 187-13-closing-e2e.md), and 548 is superseded there.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `yarn format:check` was red on 188-04's pgTAP file**
- **Found during:** Task 1, first gate run (HEAD f4b6a8311)
- **Issue:** One `invitation_caller_take` call in `59-invitation-caller-limit.test.sql` ran past Prettier's print width.
- **Fix:** Ran `prettier --write`. The change is whitespace only; the SQL statement is unchanged.
- **Commit:** ea2d660f3

**2. [Rule 1 - Bug] The docs workspace's format check was red on 188-05's docs page**
- **Found during:** Task 1, second gate run. The script chains the docs check after the root check with `&&`, so run 1 never reached it.
- **Issue:** Two rows of the operations table in `edge-functions/+page.md` were not padded to the column width.
- **Fix:** Ran `prettier --write`. The change is whitespace only.
- **Commit:** 9789bbcf6

After each fix every gate was run again on the fixed tree; the third run is the run of record.

**3. [Process] The tree was not literally clean**
- The precondition asks that `git status --porcelain` list nothing. It listed the two planning files the orchestrator owns, which the dispatch leaves uncommitted: `config.json` (`_auto_chain_active`) and `.verification-ledger.json`.
- Nothing outside `.planning/` differed from HEAD. The evidence records this next to `TREE_CLEAN=yes`, as 187-13's record did for the ledger.

**4. [Process] Task 1's evidence was committed after the E2E run**
- Task 2 requires HEAD to equal GATES_HEAD during the run, so Task 1's evidence file was written during the run and committed after it.
- As a result, `E2E_HEAD = E2E_TREE_SHA = GATES_HEAD`.

**Total deviations:** 2 auto-fixed (whitespace only, in earlier plans' files) and 2 process notes. **Impact:** none on scope; no gate was weakened.

## Issues Encountered

None beyond the two format reds.

## Next Phase Readiness

- Plans 188-10 to 188-19 check against `E2E_TREE_SHA=9789bbcf6fc51885748972b84d8631a0e9c36f2b`. `git diff --quiet 9789bbcf6..HEAD -- apps packages tests` exits 0 at the end of this plan.
- The shared stack is running and holds this branch's 23 migrations. The -gsd worktree must reset it from its own checkout before it continues.
- Requirements stay open: the dispatch says the deployed plans and the phase verifier close them.

## Self-Check: PASSED

- FOUND evidence/188-08-local-gates.md and evidence/188-08-closing-e2e.md
- FOUND commits ea2d660f3, 9789bbcf6, 40cac26f1, 8ba3bfceb on HEAD
- Task 1 verify exit 0; Task 2 verify exit 0 (VERDICT OK: 729 tests); acceptance `git diff --quiet "$S"..HEAD -- apps packages tests` exit 0

## Deviation: code-sign-in outside the caller take (operator, 2026-11-19)

**Decision:** 188-CONTEXT.md E-03 as amended in commit 6e0aafd67, option (a) of deferred item 188-05 #2. `code-sign-in` takes no caller slot. The take covers `check-code`, `request-link` and `request-recovery`. The frontend server calls `code-sign-in`, so behind Cloudflare every code sign-in would share the server's address and one bucket. This change was recorded after the plan; it is not a numbered plan.

**Commits**

| Commit | Message |
| --- | --- |
| 2ee346c83 | fix(188): account-access takes a caller slot for three operations, not code-sign-in |
| c7dc1f32b | docs(188): the per-caller limit covers three operations; code-sign-in takes no slot |

**Files**

- `apps/supabase/supabase/functions/account-access/callerLimit.ts`: `CALLER_LIMITED_OPERATIONS` (frozen: `check-code`, `request-link`, `request-recovery`) and `takesCallerSlot(operation)`. The TSDoc gives the present-tense reason for each operation it leaves out.
- `apps/supabase/supabase/functions/account-access/index.ts`: the guard is `if (takesCallerSlot(request.operation))` instead of `!== 'confirm-address'`. The header doc names the three operations, and says that `code-sign-in` and `confirm-address` take no slot and why.
- `apps/supabase/supabase/functions/account-access/contract.ts`: the TSDoc of `TOO_MANY_REQUESTS_BODY` no longer says "four".
- `apps/supabase/supabase/functions/account-access/callerLimit.test.ts`: 8 new tests covering the set, its freeze, true for the three operations, and false for `code-sign-in`, `confirm-address` and unknown names.
- `apps/supabase/supabase/functions/account-access/flowConformance.test.ts`: the take block is found by `takesCallerSlot(request.operation)`. The predicate is imported and called once, no `request.operation !==` is left, and `codeSignIn` never names `invitation_caller_take`.
- Docs: `backend/authentication/+page.md` (the caller-limit item, and the Known residuals item, whose pre-launch risk of a shared code-sign-in bucket becomes "The code sign-in is not limited per caller", bounded by the per-code budget and the auth sign-in budget), `backend/edge-functions/+page.md` and `deployment/+page.md` (three operations; the code sign-in is not counted, with the reason).
- Not changed: `506-invitation-rpcs.sql` and `59-invitation-caller-limit.test.sql` speak only of "invitation operations" and name none, so pgTAP was not re-run. The frozen migration `00023` was not touched. No frontend comment and no E2E spec or fixture asserts a 429 on code sign-in. The frontend's `[429, 'contestantApp.login.unknownError']` rows test the form action's status mapping, not the take.

**Gates**, each run in the background with its exit status read from the command itself:

| Gate | Result |
| --- | --- |
| `vitest run supabase/functions/account-access` | exit 0; 8 files, 795 passed (787 at 188-05, +8) |
| `yarn workspace @openvaa/supabase typecheck` (`deno check .`) | exit 0 |
| `yarn test:unit` | exit 0; 26/26 turbo tasks; `@openvaa/supabase` 1187 passed, frontend 8435 passed / 33 skipped |
| `yarn lint:check` | exit 0 |
| `yarn format:check` | exit 0 |
| pgTAP | not run: no SQL file changed |

**E2E** (`FRONTEND_PORT=5273`, `--no-db-reset`, at HEAD c7dc1f32b, which serves the changed `account-access` from the working tree; judged against `tests/e2e-runs/188-close-20261118T195528Z`):

| Run dir | Result | Deltas |
| --- | --- | --- |
| `tests/e2e-runs/188-dev-codesignin-invitation-contract-20261119T065633Z` | wrapper exit 0; 18 passed, 0 failed, 0 flaky, 0 did not run (invitation-contract 16) | every project 0; titles identical |
| `tests/e2e-runs/188-dev-codesignin-contestant-identity-provider-20261119T065756Z` | wrapper exit 0; 614 passed, 0 failed, 0 flaky, 0 did not run; restore ok | all 109 projects of the closure 0; titles identical. Projects that drive `account-access`: contestant-code-registration 6, contestant-entry-scan 38, contestant-email-registration 16, contestant-password-recovery 6, admin-account-flows 22, contestant-a11y-scan 34, contestant-entry-phone 24, contestant-identity-provider 42 |

`invitation-contract` calls `code-sign-in` directly, and `contestant-code-registration` submits it through the screen. No VOID marker, no red run and no re-run.

**Plans 188-10 to 188-20:** none states that `code-sign-in` takes a caller slot or that the take covers four operations. 188-16's prohibition "MUST NOT call request-link, request-recovery or code-sign-in in the observation" limits the observation's calls and is still true, so it was not changed. No plan text was changed.

**Consequence for 188-10 to 188-19:** this deviation changes `apps/`, so `git diff --quiet 9789bbcf6..HEAD -- apps packages tests` no longer exits 0. 188-10 Task 1 stops on that check ("the closing run no longer stands for the tree"). The two targeted runs above cover the change under the targeted-run rule, but they are not a full-suite run. Before 188-10, the orchestrator or operator must either make a new full run and record a new `E2E_TREE_SHA`, or record that the closing run plus these targeted runs stand for c7dc1f32b.

**Resolved (2026-11-19):** a new full run, `tests/e2e-runs/188-close2-20261119T071844Z`, is green on d523abcd5: 729 passed, 0 failed, 0 did not run, and no change in any project's count. `evidence/188-08-closing-e2e.md` now records `E2E_TREE_SHA=d523abcd51e725b99bd2b277dd9e0781d8ed4834`, and the earlier `E2E_TREE_SHA=9789bbcf6…` figures above are superseded.
