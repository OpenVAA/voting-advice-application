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
