RECORDED=2026-11-15
RECORDED_BY=the plan executor, which ran every stack and E2E command itself from this checkout; logs in tmp/187-gates/187-13/
HEAD_SUPERSEDED=54e79823b1fa6a3548a82bdf2d27644e4b7af317
TREE_CLEAN_SUPERSEDED=yes
    git status --porcelain listed nothing before the run and after it; the run directory's worktree-status.txt is empty
SOURCE_TREE_MATCHES_GREEN_SUPERSEDED=yes
    in a temporary index under the session scratch directory (removed afterwards): git read-tree HEAD exit 0, git rm -r --cached --quiet .planning exit 0, git write-tree exit 0 printed fa16b0c68a9d32835f811344393d2bb31a173c9b, which is GREEN_TREE of 187-12-evidence-commits.md; the real index was not touched (git diff --cached --quiet exit 0)
ENV_FILE=present
    checked with test -f .env only; no variable name or value was read
DISK=203 GiB free on /; Docker build cache 0B (pruned at the end of plan 187-12), so no prune was needed
STACK_BEFORE_RUN=yarn db:status exit 0; every supabase_*_openvaa-local container Up, supabase_edge_runtime_openvaa-local among them, mounting this checkout's apps/supabase/supabase/functions; supabase_migrations.schema_migrations held 1 row and apps/supabase/supabase/migrations holds 1 file; no restart was needed
FRONTEND_PORT=5273, the wrapper's default; no listener on it before the run (lsof exit 1)
HOST_SLEEP_GUARD=the wrapper ran under caffeinate -i
COVERS_THIS_PHASES_CHANGES=the run is on the whole tree at HEAD: phase 187's workflows, infra code and scripts, the root package.json and yarn.lock, and tests/README.md, the one file under apps/, packages/ or tests/ this phase changed

E2E_TREE_SHA_SUPERSEDED=54e79823b1fa6a3548a82bdf2d27644e4b7af317
E2E_HEAD_SUPERSEDED=54e79823b1fa6a3548a82bdf2d27644e4b7af317
E2E_TREE_CLEAN_SUPERSEDED=yes
E2E_RUN_DIR_SUPERSEDED=tests/e2e-runs/187-close-20261115T032900Z
E2E_STARTED_SUPERSEDED=2026-11-15T03:28:52Z
E2E_ENDED_SUPERSEDED=2026-11-15T03:42:33Z
E2E_COMMAND_SUPERSEDED=caffeinate -i tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/187-close-20261115T032900Z --no-db-reset
E2E_WRAPPER_EXIT_SUPERSEDED=0
    read from tmp/187-gates/187-13/e2e-1.status, written by the command on the line after the wrapper, and from the run directory's exit file (0); the run directory's head file is 54e79823b1fa6a3548a82bdf2d27644e4b7af317. Wrapper lines: "548 passed (12.8m)", "playwright exit 0", "preflight failures 0, successes 1". The run directory holds no VOID-host-suspend.txt: not a void run.
E2E_VOID_RUNS_SUPERSEDED=0
E2E_PASSED_SUPERSEDED=548
E2E_FAILED_SUPERSEDED=0
E2E_FLAKY_SUPERSEDED=0
E2E_DID_NOT_RUN_SUPERSEDED=0
E2E_SKIPPED_SUPERSEDED=0
    node tests/scripts/e2e-evidence.mjs tests/e2e-runs/187-close-20261115T032900Z, exit 0: total 548, passed 548, failed 0, flaky 0, skipped 0, didNotRun 0
E2E_VERDICT_EXIT_SUPERSEDED=0
    node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/187-close-20261115T032900Z --no-flaky: VERDICT OK: 548 tests -- passed 548, failed 0, flaky 0, skipped 0, did not run 0
E2E_HEAD_AFTER_SUPERSEDED=54e79823b1fa6a3548a82bdf2d27644e4b7af317
E2E_TREE_CLEAN_AFTER_SUPERSEDED=yes
E2E_GATE_SUPERSEDED=green
E2E_PASSED_VS_186_CLOSE_SUPERSEDED=548 against 548 (186-07-closing-e2e.md, re-run of 2026-11-15): equal
RED_RUNS_SUPERSEDED=0
    the first and only run is the run of record; no run was retried and no test was marked as flaky
GSD_SESSION_MUST_RESET=yes: the -gsd worktree shares this stack and must reset it from its own worktree before it continues; because the edge runtime mounts this worktree's functions, a reset alone is not enough there: run yarn db:stop and yarn db:start from -gsd, then yarn db:reset
STACK_LEFT=running, holding this branch's schema; not stopped

## Re-run 2026-11-15 (after review fixes)

RERUN_RECORDED=2026-11-15
RERUN_RECORDED_BY=a plan executor that the orchestrator spawned to re-run plans 187-12 and 187-13 after plan 187-15 Task 1 found PUSH_TREE_MATCHES_HEAD=no; it ran every stack and E2E command itself from this checkout; logs in tmp/187-gates/187-13-rerun/
RERUN_REASON=the review fixes 49d8ec823 (WR-08) .. 6bf28e0e1 (IN-04), 95d1d6ad5, d55a94b7a and the orchestrator's 1e10dff7f changed files under .github/workflows/ and infra/ after the run above; nothing under apps/, packages/ or tests/ changed
RERUN_STATUS=promoted: the run below is the run of record, and its values are written as the plan's lines under "Current lines (promoted)" at the end of this section, after plan 187-12 Tasks 2 and 3 were proven on the same tree (GREEN_TREE=3c82ab567d5b375c81e300e6bdb9fdbf72d7e42b, green build exit 0, red build exit 1 in the frontend build). The first run's plan lines above are renamed _SUPERSEDED=, so each line a verify reads has one value
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

### Lines promoted on 2026-11-15 (superseded by the re-run of 2026-11-16)

SOURCE_TREE_MATCHES_GREEN_SUPERSEDED=yes
    the tree of E2E_TREE_SHA without .planning/ is 3c82ab567d5b375c81e300e6bdb9fdbf72d7e42b (RERUN_SOURCE_TREE above, written in a temporary index), which is GREEN_TREE of 187-12-evidence-commits.md (re-run); also git diff --quiet 3c7be6128 refs/evidence/187/green -- . ':!.planning' exit 0, and the green tree holds no .planning entry
E2E_TREE_SHA_SUPERSEDED=3c7be6128515981160de0e3e5a89dafae73c4a29
E2E_HEAD_SUPERSEDED=3c7be6128515981160de0e3e5a89dafae73c4a29
E2E_TREE_CLEAN_SUPERSEDED=yes
E2E_RUN_DIR_SUPERSEDED=tests/e2e-runs/187-13-rerun-20261115T202406Z
E2E_STARTED_SUPERSEDED=2026-11-15T20:24:12Z
E2E_ENDED_SUPERSEDED=2026-11-15T20:37:51Z
E2E_WRAPPER_EXIT_SUPERSEDED=0
E2E_VOID_RUNS_SUPERSEDED=0
E2E_PASSED_SUPERSEDED=548
E2E_FAILED_SUPERSEDED=0
E2E_FLAKY_SUPERSEDED=0
E2E_DID_NOT_RUN_SUPERSEDED=0
E2E_SKIPPED_SUPERSEDED=0
E2E_VERDICT_EXIT_SUPERSEDED=0
E2E_GATE_SUPERSEDED=green
RED_RUNS_SUPERSEDED=0

## Re-run 2026-11-16 (plan 187-26)

Recorded 2026-11-16 by the plan executor of plan 187-26, which ran every stack and E2E command itself from this checkout, in one background window; logs in `tmp/187-26/window/`. The run is made on CI's functions environment: the developer's untracked `apps/supabase/supabase/functions/.env` was moved aside for the window and the tracked template hard-linked in its place (G-05 and the operator's decision of 2026-11-16; details in `187-26-ci-closure.md` § Task 5). The lines promoted on 2026-11-15 are renamed `*_SUPERSEDED=` above, so each line a verify reads has one value.

SOURCE_TREE_MATCHES_GREEN=yes
    the tree of E2E_TREE_SHA without .planning/, written in a temporary index under the session scratch directory (read-tree, rm -r --cached .planning, write-tree, each exit 0; the real index untouched), is 81bc87981fce519fe86efdc7fade95df939213cf, GREEN_TREE of 187-12-evidence-commits.md (re-run 2026-11-16); git diff --quiet a21f94b99 refs/evidence/187/green -- . ':!.planning' exit 0
E2E_TREE_SHA=a21f94b99f1a8f6e18655c3dcb3fad0583455fd0
E2E_HEAD=a21f94b99f1a8f6e18655c3dcb3fad0583455fd0
E2E_TREE_CLEAN=yes
    git status --porcelain listed only the untracked .planning/workstreams/deployment/.verification-ledger.json before and after the run; the run directory's worktree-status.txt holds that one line. The functions env path is ignored, so neither the move nor the link shows in it
E2E_RUN_DIR=tests/e2e-runs/187-26-close-20261116T083717Z
E2E_STARTED=2026-11-16T08:37:17Z
E2E_ENDED=2026-11-16T08:52:44Z
E2E_COMMAND=caffeinate -i tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/187-26-close-20261116T083717Z --no-db-reset
E2E_WRAPPER_EXIT=0
    read from tmp/187-26/window/close-run.status, written by the command after the wrapper, and from the run directory's exit file (0); its head file is a21f94b99f1a8f6e18655c3dcb3fad0583455fd0. Wrapper lines: "548 passed (15.3m)", "playwright exit 0", "preflight failures 0, successes 1"
E2E_VOID_RUNS=0
    no VOID-host-suspend.txt in the run directory, and the wrapper did not exit 8
E2E_PASSED=548
E2E_FAILED=0
E2E_FLAKY=0
E2E_DID_NOT_RUN=0
E2E_SKIPPED=0
    node tests/scripts/e2e-evidence.mjs tests/e2e-runs/187-26-close-20261116T083717Z, exit 0: total 548, passed 548, failed 0, flaky 0, skipped 0, didNotRun 0
E2E_VERDICT_EXIT=0
    node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/187-26-close-20261116T083717Z --no-flaky: VERDICT OK: 548 tests -- passed 548, failed 0, flaky 0, skipped 0, did not run 0
E2E_GATE=green
E2E_PASSED_VS_2026_11_15=548 against 548 (the re-run above): equal
RED_RUNS=0
    the closing run is the first and only full run of the window; no run was retried and no test was marked as flaky. The window's other run, tests/e2e-runs/187-26-nofile-20261116T083511Z, is the deliberate reproduction with no functions env file, evidence of CI's cause and not a gate of the tree
HANDOFF_STATUS=closed
    plan 186-08 is complete; its handoff (187-13-186-08-handoff.md) keeps the earlier tree
E2E_FUNCTIONS_ENV=template
GSD_SESSION_MUST_RESET=yes: the -gsd worktree shares this stack and resets it from its own worktree before it continues (yarn db:stop and yarn db:start from -gsd, then yarn db:reset)
