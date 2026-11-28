RECORDED=2026-11-18
RECORDED_BY=the plan executor of plan 188-08, which ran the stack check and the E2E run itself from this checkout; logs in tmp/188-08/e2e/188-close-20261118T195528Z/
ENV_FILE=present
    checked with test -f .env only; no variable name or value was read
DISK=103 GiB free on /; Docker build cache 0B, so no prune was needed
STACK_BEFORE_RUN=every supabase_*_openvaa-local container Up (13), supabase_edge_runtime_openvaa-local among them, mounting this checkout's apps/supabase/supabase/functions; supabase_migrations.schema_migrations 23 rows against 23 files in apps/supabase/supabase/migrations; no restart was needed
FRONTEND_PORT=5273, prefixed on the command; no listener on 5273, 8777 or 9443 before the run (lsof exit 1 each). Port 5173 is held by another project's dev server
HOST_SLEEP_GUARD=the wrapper ran under caffeinate -i, and its own assertion is recorded as sleep_assertion=caffeinate -dimsu in env-posture.txt; heartbeat_max_late_ms=190
E2E_FUNCTIONS_ENV=the developer's own apps/supabase/supabase/functions/.env, left in place; the suite does not read it, and the wrapper serves identity-callback from its own generated Edge file
COVERS_THIS_PHASES_CHANGES=the run is on the whole tree at GATES_HEAD: plans 188-01 and 188-20 (the usage relay's flush interval and queue), 188-04 and 188-05 (the per-caller limit, migration 00023 and its account-access wiring, which the contestant entry, registration, recovery, identity-provider and admin account projects drive), 188-02, 188-03, 188-06 and 188-07 (Terraform and scripts, which no project drives). The opt-in analytics-default-standalone project is not part of a default run; plans 188-01 and 188-20 each ran it green on their own

E2E_TREE_SHA=0b947a34baf75f9f72dfca9664432c4738d1387e
E2E_HEAD=9789bbcf6fc51885748972b84d8631a0e9c36f2b
    equal to GATES_HEAD of 188-08-local-gates.md; the run directory's head file holds it, and HEAD was the same before and after the run (tmp/188-08/e2e/188-close-20261118T195528Z/head-before.txt, head-after.txt)
E2E_TREE_CLEAN=yes
    git status --porcelain listed before the run only the two orchestrator-owned planning files the dispatch leaves uncommitted (` M .planning/workstreams/deployment/config.json`, `?? .planning/workstreams/deployment/.verification-ledger.json`), and the run directory's worktree-status.txt holds those two lines; after the run it listed also the untracked evidence/188-08-local-gates.md, written during the run and committed after it so that HEAD stayed GATES_HEAD. Nothing outside .planning/ differed from HEAD at any point
E2E_RUN_DIR=tests/e2e-runs/188-close-20261118T195528Z
E2E_STARTED=2026-11-18T19:55:32Z
E2E_ENDED=2026-11-18T20:14:32Z
E2E_COMMAND=FRONTEND_PORT=5273 caffeinate -i tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/188-close-20261118T195528Z --no-db-reset
E2E_WRAPPER_EXIT=0
    read from tmp/188-08/e2e/188-close-20261118T195528Z/wrapper.status, written by the command on the line after the wrapper, and from the run directory's exit file (0). Wrapper lines: "729 passed (18.2m)", "e2e-run.sh: playwright exit 0", "e2e-run.sh: preflight failures 0, successes 1"; restore.txt ends "restore: ok"
E2E_VOID_RUNS=0
    no VOID-host-suspend.txt in the run directory, and the wrapper did not exit 8
E2E_PASSED=729
E2E_FAILED=0
E2E_FLAKY=0
E2E_DID_NOT_RUN=0
E2E_SKIPPED=0
    node tests/scripts/e2e-evidence.mjs tests/e2e-runs/188-close-20261118T195528Z, exit 0: total 729, passed 729, failed 0, flaky 0, skipped 0, didNotRun 0
E2E_VERDICT_EXIT=0
    node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/188-close-20261118T195528Z --no-flaky: VERDICT OK: 729 tests -- passed 729, failed 0, flaky 0, skipped 0, did not run 0
E2E_PASSED_VS_187_CLOSE=729 against 729, the last full run (tests/e2e-runs/187-28-close-20261116T234457Z, the current lines of 187-13-closing-e2e.md; the 548 of the first 187-13 run is superseded there): equal
E2E_PROJECT_DELTAS=0
    per project from both runs' results.json: 129 projects, no project's test count changed, no test title gone and none added; the deltas the plans 188-01 to 188-07 and 188-20 reported sum to 0, as measured
E2E_GATE=green
RED_RUNS=0
    the closing run is the first and only full run of this plan; no run was retried and no test was marked as flaky
GSD_SESSION_MUST_RESET=yes: the -gsd worktree shares this stack and resets it from its own worktree before it continues (yarn db:stop and yarn db:start from -gsd, then yarn db:reset); the stack now holds this branch's 23 migrations
STACK_LEFT=running, restarted by the wrapper's restore; not stopped

## Re-run after the code-sign-in deviation (2026-11-19)

E2E_TREE_SHA moved from 9789bbcf6fc51885748972b84d8631a0e9c36f2b to the tree that carries the operator's code-sign-in ruling (commits 2ee346c83, c7dc1f32b, d523abcd5). E2E_HEAD above is the first run's head; the second run's is below.
E2E_TREE_SHA_PREVIOUS=9789bbcf6fc51885748972b84d8631a0e9c36f2b
E2E_RERUN_HEAD=d523abcd51e725b99bd2b277dd9e0781d8ed4834
E2E_RERUN_DIR=tests/e2e-runs/188-close2-20261119T071844Z
E2E_RERUN_RESULT=wrapper exit 0; 729 expected, 0 unexpected, 0 flaky, 0 skipped, 0 did not run; 129 projects, every per-project count equal to 188-close-20261118T195528Z; no VOID marker; worktree clean apart from config.json and .verification-ledger.json; stack restored
E2E_RERUN_BY=the orchestrator, FRONTEND_PORT=5273, --no-db-reset

## Re-run after the code review fixes (2026-11-19)

E2E_TREE_SHA moved from d523abcd51e725b99bd2b277dd9e0781d8ed4834 to the tree carrying the fixes of 188-REVIEW.md (42113274e to f1c131f43: migration 00024, the account-access CORS expose header, the WAF match, the load-check tooling), operator ruling "fix everything".
E2E_TREE_SHA_PREVIOUS_2=d523abcd51e725b99bd2b277dd9e0781d8ed4834
E2E_RERUN2_HEAD=0b947a34baf75f9f72dfca9664432c4738d1387e
E2E_RERUN2_DIR=tests/e2e-runs/188-close3-20261119T213204Z
E2E_RERUN2_RESULT=wrapper exit 0; 729 expected, 0 unexpected, 0 flaky, 0 skipped, 0 did not run; 129 projects, every per-project count equal to 188-close2-20261119T071844Z; no VOID marker; stack restored
E2E_RERUN2_BY=the orchestrator, FRONTEND_PORT=5273, --no-db-reset, under caffeinate -i
