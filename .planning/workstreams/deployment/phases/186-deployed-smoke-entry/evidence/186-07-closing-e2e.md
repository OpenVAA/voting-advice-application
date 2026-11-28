RECORDED=2026-11-14
RECORDED_BY=the plan executor, which ran every stack and E2E command itself from this checkout; logs in tmp/186-gates/186-07/
HEAD=ac3d8d42bc20060f4c46825d51d2bcce3826dfc1
TREE_CLEAN=yes
    git status --porcelain listed nothing outside .planning/ before the run and after it; the only entries were the orchestrator's uncommitted .planning/workstreams/deployment/config.json and state.json edits
CODE_TREE_EQUALS_GATES_TREE=yes
    ac3d8d42b is 0ac8151e4, the tree of 186-07-final-gates.md, plus that evidence file under .planning/ only
ENV_FILE=present
    checked with test -f .env only; no variable name or value was read
DOCKER_BUILDER_PRUNE=run before the run (tmp/186-gates/186-07/prune.log: Total: 0B)
STACK_BEFORE_RUN=this checkout's: yarn db:status exit 0; schema_migrations held only 00001; supabase_edge_runtime_openvaa-local was Up and mounted this checkout's apps/supabase/supabase/functions; no restart was needed
FRONTEND_PORT=5273, the wrapper's default; no listener on it before the run
HOST_SLEEP_GUARD=the wrapper ran under caffeinate -i (prevents idle sleep only; no effect on the suite)
COVERS_THIS_PHASES_CHANGES=the phase changed nothing under apps/ or packages/ (DEPLOYED_TREE_DIFF=empty) and none of the local gate files (SC4_LOCAL_GATE_DIFF=empty); the run shows the deployed smoke entry, its config and its helpers leave the local suite as it was

E2E_TREE_SHA_SUPERSEDED=ac3d8d42bc20060f4c46825d51d2bcce3826dfc1
    superseded on 2026-11-15 by the re-run after the code-review fixes below; the live E2E_TREE_SHA= line is in that section, and it is the only line of this file that begins E2E_TREE_SHA=
E2E_HEAD=ac3d8d42bc20060f4c46825d51d2bcce3826dfc1
E2E_TREE_CLEAN=yes
E2E_RUN_DIR_SUPERSEDED=tests/e2e-runs/186-close-20261114T233139Z
E2E_STARTED=2026-11-14T23:31:43Z
E2E_ENDED=2026-11-14T23:45:16Z
E2E_COMMAND=tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/186-close-20261114T233139Z --no-db-reset
E2E_WRAPPER_EXIT=0
    read from tmp/186-gates/186-07/e2e-1.status, written by the command right after the wrapper, and from the run directory's exit file (0). Wrapper lines: "548 passed (12.7m)", "playwright exit 0", "preflight failures 0, successes 1". The run directory holds no VOID-host-suspend.txt: not a void run.
E2E_VOID_RUNS=0
E2E_PASSED=548
E2E_FAILED=0
E2E_FLAKY=0
E2E_DID_NOT_RUN=0
E2E_SKIPPED=0
    node tests/scripts/e2e-evidence.mjs tests/e2e-runs/186-close-20261114T233139Z, exit 0: total 548, passed 548, failed 0, flaky 0, skipped 0, didNotRun 0
E2E_VERDICT_EXIT=0
    node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/186-close-20261114T233139Z --no-flaky: VERDICT OK: 548 tests -- passed 548, failed 0, flaky 0, skipped 0, did not run 0
E2E_RUN_HEAD=ac3d8d42bc20060f4c46825d51d2bcce3826dfc1
E2E_RUN_TREE_CLEAN=yes
    the run directory's worktree-status.txt lists only the two .planning/workstreams/deployment/ files named above
E2E_HEAD_AFTER=ac3d8d42bc20060f4c46825d51d2bcce3826dfc1
E2E_TREE_CLEAN_AFTER=yes
E2E_GATE=green
E2E_PASSED_VS_185_21=548 against 548: equal
RED_RUNS=0
    the first and only run is the run of record; no run was retried and no test was marked as flaky
GSD_SESSION_MUST_RESET=yes: the -gsd worktree shares this stack and must reset it from its own worktree before it continues; because the edge runtime mounts this worktree's functions, a reset alone is not enough there: run yarn db:stop and yarn db:start from -gsd, then yarn db:reset
STACK_LEFT=running, holding this branch's schema; not stopped

## Re-run after the code-review fixes (2026-11-15)

RERUN_RECORDED=2026-11-15
RERUN_RECORDED_BY=an executor spawned by the orchestrator as an ad-hoc follow-up to plan 186-07; it ran every stack and E2E command itself from this checkout; logs in tmp/186-gates/rerun/
RERUN_REASON=the code-review fixes (CR-01, WR-01, WR-02, IN-01, IN-02, IN-03; commits efa85d12f..d72653774) and the follow-up a2fa17061 (the deployed setup's first line withholds user info) changed files under tests/ after the run above, so that run no longer stands for the tree
SUPERSEDES=E2E_TREE_SHA_SUPERSEDED=ac3d8d42bc20060f4c46825d51d2bcce3826dfc1 and E2E_RUN_DIR_SUPERSEDED=tests/e2e-runs/186-close-20261114T233139Z above
ENV_FILE=present
    checked with test -f .env only; no variable name or value was read
DOCKER_BUILDER_PRUNE=run before the run (tmp/186-gates/rerun/prune.log: Total: 0B)
STACK_BEFORE_RUN=yarn db:status exit 0; every supabase_*_openvaa-local container Up, supabase_edge_runtime_openvaa-local among them, mounting this checkout's apps/supabase/supabase/functions; no restart was needed
FRONTEND_PORT=5273, the wrapper's default; no listener on it before the run
HOST_SLEEP_GUARD=the wrapper ran under caffeinate -i
CODE_TREE_EQUALS_GATES_TREE=yes
    the repository gates in 186-07-final-gates.md ran at a2fa170619315dfa6078c7f9f32cb05fb4604efc; four phase-187 docs commits (0d6864d8b..ee85b83a3) landed meanwhile, touching .planning/ only; git diff --quiet a2fa17061 ee85b83a3 -- . ':!.planning' exited 0

E2E_TREE_SHA=ee85b83a38488f052edc7a00c7a80facd6602871
E2E_HEAD=ee85b83a38488f052edc7a00c7a80facd6602871
E2E_TREE_CLEAN=yes
    git status --porcelain listed nothing before the run, and the run directory's worktree-status.txt is empty
E2E_RUN_DIR=tests/e2e-runs/186-close-rerun-20261115T002900Z
E2E_STARTED=2026-11-15T00:29:04Z
E2E_ENDED=2026-11-15T00:42:36Z
E2E_COMMAND=caffeinate -i tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/186-close-rerun-20261115T002900Z --no-db-reset
E2E_WRAPPER_EXIT=0
    read from tmp/186-gates/rerun/e2e-1.status, written by the command right after the wrapper, and from the run directory's exit file (0). Wrapper lines: "548 passed (12.7m)", "playwright exit 0", "preflight failures 0, successes 1". The run directory holds no VOID-host-suspend.txt: not a void run.
E2E_VOID_RUNS=0
E2E_PASSED=548
E2E_FAILED=0
E2E_FLAKY=0
E2E_DID_NOT_RUN=0
E2E_SKIPPED=0
    node tests/scripts/e2e-evidence.mjs tests/e2e-runs/186-close-rerun-20261115T002900Z, exit 0: total 548, passed 548, failed 0, flaky 0, skipped 0, didNotRun 0
E2E_VERDICT_EXIT=0
    node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/186-close-rerun-20261115T002900Z --no-flaky: VERDICT OK: 548 tests -- passed 548, failed 0, flaky 0, skipped 0, did not run 0
E2E_HEAD_AFTER=ee85b83a38488f052edc7a00c7a80facd6602871
E2E_TREE_CLEAN_AFTER=yes
E2E_GATE=green
E2E_PASSED_VS_SUPERSEDED_RUN=548 against 548: equal
RED_RUNS=0
    the first and only re-run is the run of record; no run was retried and no test was marked as flaky
HOW_186_08_READS_IT=plan 186-08 reads S=$(sed -n 's/^E2E_TREE_SHA=//p' <this file>), which prints every matching line, so this file holds exactly one line beginning E2E_TREE_SHA=, the one in this section (ee85b83a38488f052edc7a00c7a80facd6602871); the earlier value is kept as E2E_TREE_SHA_SUPERSEDED=, which that read does not match. E2E_RUN_DIR= is kept single the same way for plan 186-07's own verify
READINESS_RECORD_NOTE=evidence/186-08-readiness.md recorded TREE_SINCE_CLOSING_RUN=unchanged against the superseded ac3d8d42b; tests/ changed after that SHA (the review fixes), so that line no longer holds against ac3d8d42b and holds only against this section's E2E_TREE_SHA; 186-08's later reads use this file and so take the new value
GSD_SESSION_MUST_RESET=yes: the -gsd worktree shares this stack and must reset it from its own worktree before it continues (yarn db:stop and yarn db:start from -gsd, then yarn db:reset)
STACK_LEFT=running, holding this branch's schema; not stopped
