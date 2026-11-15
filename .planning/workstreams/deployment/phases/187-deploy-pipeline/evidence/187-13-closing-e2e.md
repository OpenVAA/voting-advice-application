RECORDED=2026-11-15
RECORDED_BY=the plan executor, which ran every stack and E2E command itself from this checkout; logs in tmp/187-gates/187-13/
HEAD=54e79823b1fa6a3548a82bdf2d27644e4b7af317
TREE_CLEAN=yes
    git status --porcelain listed nothing before the run and after it; the run directory's worktree-status.txt is empty
SOURCE_TREE_MATCHES_GREEN=yes
    in a temporary index under the session scratch directory (removed afterwards): git read-tree HEAD exit 0, git rm -r --cached --quiet .planning exit 0, git write-tree exit 0 printed fa16b0c68a9d32835f811344393d2bb31a173c9b, which is GREEN_TREE of 187-12-evidence-commits.md; the real index was not touched (git diff --cached --quiet exit 0)
ENV_FILE=present
    checked with test -f .env only; no variable name or value was read
DISK=203 GiB free on /; Docker build cache 0B (pruned at the end of plan 187-12), so no prune was needed
STACK_BEFORE_RUN=yarn db:status exit 0; every supabase_*_openvaa-local container Up, supabase_edge_runtime_openvaa-local among them, mounting this checkout's apps/supabase/supabase/functions; supabase_migrations.schema_migrations held 1 row and apps/supabase/supabase/migrations holds 1 file; no restart was needed
FRONTEND_PORT=5273, the wrapper's default; no listener on it before the run (lsof exit 1)
HOST_SLEEP_GUARD=the wrapper ran under caffeinate -i
COVERS_THIS_PHASES_CHANGES=the run is on the whole tree at HEAD: phase 187's workflows, infra code and scripts, the root package.json and yarn.lock, and tests/README.md, the one file under apps/, packages/ or tests/ this phase changed

E2E_TREE_SHA=54e79823b1fa6a3548a82bdf2d27644e4b7af317
E2E_HEAD=54e79823b1fa6a3548a82bdf2d27644e4b7af317
E2E_TREE_CLEAN=yes
E2E_RUN_DIR=tests/e2e-runs/187-close-20261115T032900Z
E2E_STARTED=2026-11-15T03:28:52Z
E2E_ENDED=2026-11-15T03:42:33Z
E2E_COMMAND=caffeinate -i tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/187-close-20261115T032900Z --no-db-reset
E2E_WRAPPER_EXIT=0
    read from tmp/187-gates/187-13/e2e-1.status, written by the command on the line after the wrapper, and from the run directory's exit file (0); the run directory's head file is 54e79823b1fa6a3548a82bdf2d27644e4b7af317. Wrapper lines: "548 passed (12.8m)", "playwright exit 0", "preflight failures 0, successes 1". The run directory holds no VOID-host-suspend.txt: not a void run.
E2E_VOID_RUNS=0
E2E_PASSED=548
E2E_FAILED=0
E2E_FLAKY=0
E2E_DID_NOT_RUN=0
E2E_SKIPPED=0
    node tests/scripts/e2e-evidence.mjs tests/e2e-runs/187-close-20261115T032900Z, exit 0: total 548, passed 548, failed 0, flaky 0, skipped 0, didNotRun 0
E2E_VERDICT_EXIT=0
    node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/187-close-20261115T032900Z --no-flaky: VERDICT OK: 548 tests -- passed 548, failed 0, flaky 0, skipped 0, did not run 0
E2E_HEAD_AFTER=54e79823b1fa6a3548a82bdf2d27644e4b7af317
E2E_TREE_CLEAN_AFTER=yes
E2E_GATE=green
E2E_PASSED_VS_186_CLOSE=548 against 548 (186-07-closing-e2e.md, re-run of 2026-11-15): equal
RED_RUNS=0
    the first and only run is the run of record; no run was retried and no test was marked as flaky
GSD_SESSION_MUST_RESET=yes: the -gsd worktree shares this stack and must reset it from its own worktree before it continues; because the edge runtime mounts this worktree's functions, a reset alone is not enough there: run yarn db:stop and yarn db:start from -gsd, then yarn db:reset
STACK_LEFT=running, holding this branch's schema; not stopped

## Re-run 2026-11-15 (after review fixes)

RERUN_RECORDED=2026-11-15
RERUN_RECORDED_BY=a plan executor that the orchestrator spawned to re-run plans 187-12 and 187-13 after plan 187-15 Task 1 found PUSH_TREE_MATCHES_HEAD=no; it ran every stack and E2E command itself from this checkout; logs in tmp/187-gates/187-13-rerun/
RERUN_REASON=the review fixes 49d8ec823 (WR-08) .. 6bf28e0e1 (IN-04), 95d1d6ad5, d55a94b7a and the orchestrator's 1e10dff7f changed files under .github/workflows/ and infra/ after the run above; nothing under apps/, packages/ or tests/ changed
RERUN_STATUS=the run below is green and complete, but it is NOT yet promoted to the plan's lines (E2E_TREE_SHA=, E2E_RUN_DIR=, SOURCE_TREE_MATCHES_GREEN=, E2E_GATE=). Plan 187-12 Task 2's archive build of the new green commit is blocked on the host (see the 187-12 re-run report), so 187-12-evidence-commits.md does not yet record the new GREEN_TREE that SOURCE_TREE_MATCHES_GREEN compares with. Once Tasks 2 and 3 of 187-12 are proven, these RERUN_ values become the plan's lines, the original ones are renamed _SUPERSEDED, and the handoff's HANDOFF_TREE_REFERENCE follows E2E_TREE_SHA
RERUN_ENV_FILE=present
    checked with test -f .env only; no variable name or value was read
RERUN_DISK=198 GiB free on /; Docker build cache 0B
RERUN_STACK_BEFORE_RUN=yarn db:status exit 0 (tmp/187-gates/187-12-rerun/db-status.log); every supabase_*_openvaa-local container Up, supabase_edge_runtime_openvaa-local among them (Up 26 hours), mounting this checkout's apps/supabase/supabase/functions; supabase_migrations.schema_migrations held 1 row and apps/supabase/supabase/migrations holds 1 file; no restart was needed
RERUN_FRONTEND_PORT=5273, the wrapper's default; no listener on it before the run (lsof exit 1)
RERUN_HOST_SLEEP_GUARD=the wrapper ran under caffeinate -i
RERUN_SOURCE_TREE=3c82ab567d5b375c81e300e6bdb9fdbf72d7e42b
    the tree of HEAD 3c7be6128 without .planning/, written in a temporary index under the session scratch directory (removed afterwards): git read-tree HEAD exit 0, git rm -r --cached --quiet .planning exit 0, git write-tree exit 0; the real index was not touched (git diff --cached --quiet exit 0)
RERUN_SOURCE_TREE_MATCHES_GREEN_REF=yes
    3c82ab567d5b375c81e300e6bdb9fdbf72d7e42b is the tree of refs/evidence/187/green = 395b71c712f9af6a80512625f2b38baf93167c1a, the new green commit, whose local archive build has not yet run to the end

RERUN_E2E_TREE_SHA=3c7be6128515981160de0e3e5a89dafae73c4a29
RERUN_E2E_HEAD=3c7be6128515981160de0e3e5a89dafae73c4a29
RERUN_E2E_TREE_CLEAN=yes
    git status --porcelain listed only the untracked .planning/workstreams/deployment/.verification-ledger.json, before and after the run; the run directory's worktree-status.txt holds that one line
RERUN_E2E_RUN_DIR=tests/e2e-runs/187-13-rerun-20261115T202406Z
RERUN_E2E_STARTED=2026-11-15T20:24:12Z
RERUN_E2E_ENDED=2026-11-15T20:37:51Z
RERUN_E2E_COMMAND=caffeinate -i tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/187-13-rerun-20261115T202406Z --no-db-reset
RERUN_E2E_WRAPPER_EXIT=0
    read from tmp/187-gates/187-13-rerun/e2e-1.status, written by the command on the line after the wrapper, and from the run directory's exit file (0); the run directory's head file is 3c7be6128515981160de0e3e5a89dafae73c4a29. Wrapper lines: "548 passed (12.8m)", "playwright exit 0", "preflight failures 0, successes 1". The run directory holds no VOID-host-suspend.txt: not a void run.
RERUN_E2E_VOID_RUNS=0
RERUN_E2E_PASSED=548
RERUN_E2E_FAILED=0
RERUN_E2E_FLAKY=0
RERUN_E2E_DID_NOT_RUN=0
RERUN_E2E_SKIPPED=0
    node tests/scripts/e2e-evidence.mjs tests/e2e-runs/187-13-rerun-20261115T202406Z, exit 0: total 548, passed 548, failed 0, flaky 0, skipped 0, didNotRun 0
RERUN_E2E_VERDICT_EXIT=0
    node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/187-13-rerun-20261115T202406Z --no-flaky: VERDICT OK: 548 tests -- passed 548, failed 0, flaky 0, skipped 0, did not run 0
RERUN_E2E_GATE=green
RERUN_E2E_PASSED_VS_FIRST_RUN=548 against 548 (the run above): equal
RERUN_RED_RUNS=0
    the first and only run of the re-run is the run of record; no run was retried and no test was marked as flaky
RERUN_GSD_SESSION_MUST_RESET=yes: the -gsd worktree shares this stack and must reset it from its own worktree before it continues: yarn db:stop and yarn db:start from -gsd, then yarn db:reset
RERUN_STACK_LEFT=running, holding this branch's schema; not stopped
