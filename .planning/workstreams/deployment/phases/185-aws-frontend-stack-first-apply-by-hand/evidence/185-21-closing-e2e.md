RECORDED=2026-11-14
RECORDED_BY=the plan executor, which ran every stack and E2E command itself from this checkout; logs in tmp/185-gates/185-21/
HEAD=5df4aac85592cabe3c223fc80c92d88e98db216e
TREE_CLEAN=yes
    git status --porcelain listed nothing before the run and nothing after it
CODE_TREE_EQUALS_GATES_TREE=yes
    5df4aac85 is e7dc9b721, the tree of 185-21-final-gates.md, plus that evidence file under .planning/ only
ENV_FILE=present
    checked with test -f .env only; no variable name or value was read
DOCKER_BUILDER_PRUNE=run before the run (tmp/185-gates/185-21/prune.log: Total: 0B)
STACK_BEFORE_RUN=this checkout's: yarn db:stop, yarn db:start and yarn db:reset from this checkout, each exit 0 (185-21-final-gates.md); schema_migrations held only 00001; supabase_edge_runtime_openvaa-local was Up and mounted this checkout's apps/supabase/supabase/functions
FRONTEND_PORT=5273, the wrapper's default; no listener on it before the run
COVERS_THIS_PHASES_APPLICATION_CHANGES=hooks.server.ts handles every request the suite's dev server serves; the shutdown-log module and the diagnostics route's change are covered by their unit specs, which passed in the unit gate on the same code tree

E2E_HEAD=5df4aac85592cabe3c223fc80c92d88e98db216e
E2E_TREE_CLEAN=yes
E2E_RUN_DIR=tests/e2e-runs/185-final-20261114T182802Z
E2E_STARTED=2026-11-14T18:28:02Z
E2E_ENDED=2026-11-14T18:42:08Z
E2E_COMMAND=tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/185-final-20261114T182802Z --no-db-reset
E2E_WRAPPER_EXIT=0
    read from tmp/185-gates/185-21/e2e-1.status, written by the command right after the wrapper, and from the run directory's exit file (0). Wrapper lines: "548 passed (13.1m)", "playwright exit 0", "preflight failures 0, successes 1". The run directory holds no VOID-host-suspend.txt: not a void run.
E2E_VOID_RUNS=0
E2E_PASSED=548
E2E_FAILED=0
E2E_FLAKY=0
E2E_DID_NOT_RUN=0
E2E_SKIPPED=0
    node tests/scripts/e2e-evidence.mjs tests/e2e-runs/185-final-20261114T182802Z, exit 0: total 548, passed 548, failed 0, flaky 0, skipped 0, didNotRun 0
E2E_VERDICT_EXIT=0
    node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/185-final-20261114T182802Z --no-flaky: VERDICT OK: 548 tests -- passed 548, failed 0, flaky 0, skipped 0, did not run 0
E2E_RUN_HEAD=5df4aac85592cabe3c223fc80c92d88e98db216e
E2E_RUN_TREE_CLEAN=yes
    the run directory's worktree-status.txt is empty
E2E_HEAD_AFTER=5df4aac85592cabe3c223fc80c92d88e98db216e
E2E_TREE_CLEAN_AFTER=yes
E2E_GATE=green
E2E_PASSED_VS_184_25=548 against 548: equal
RED_RUNS=0
    the first and only run is the run of record; no run was retried and no test was marked as flaky
V216_SESSION_MUST_RESET=yes: the v2.16 session's worktree (-gsd) shares this stack and must reset it from its own worktree before it continues; because the edge runtime now mounts this worktree's functions, a reset alone is not enough there: run yarn db:stop and yarn db:start from -gsd, then yarn db:reset
STACK_LEFT=running, holding this branch's schema; not stopped
