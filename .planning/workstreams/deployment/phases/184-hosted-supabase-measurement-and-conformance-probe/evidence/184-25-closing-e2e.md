RECORDED=2026-11-12
RECORDED_BY=the plan executor, from the orchestrator's logs in tmp/184-gates/ and the two run directories; the orchestrator ran every stack and E2E command itself, because a subagent's stack commands are refused in auto mode
HEAD=dccdf490842d64b06be71569e97df112607e2014
TREE_CLEAN=yes
    git status --porcelain lists one entry, ?? .planning/workstreams/deployment/milestone.lock, which is inside .planning/
ENV_FILE=present
    checked with test -f .env only; no variable name or value was read
DOCKER_BUILDER_PRUNE=run before the first E2E run (tmp/184-gates/prune.log: Total: 0B)
COVERS_THIS_PHASES_LOCAL_STACK_CHANGES=yes
    apps/supabase/supabase/config.toml: the [functions.*] family and verify_jwt = false for account-access (c4802fcf5, an ancestor of HEAD); the mailed-link specs, which call account-access, all passed in run 2
    the dev-seed smoke template (4b0fb272b, an ancestor of HEAD); the unit gate's dev-seed suite (1266 of 1266) passed on the same commit, 184-25-final-gates.md

RUN_1_DIR=tests/e2e-runs/184-25-20261112T062006Z
RUN_1_STARTED=2026-11-12T06:20:12Z
RUN_1_ENDED=2026-11-12T06:25:02Z
RUN_1_HEAD=dccdf490842d64b06be71569e97df112607e2014
RUN_1_WRAPPER_EXIT=1
RUN_1_VOID=no
    the run directory holds no VOID-host-suspend.txt; the wrapper exited 1, not 8
RUN_1_COUNTS=total 548, passed 96, failed 11, flaky 0, skipped 53, didNotRun 388
    node tests/scripts/e2e-evidence.mjs on the run directory (tmp/184-gates/evidence.out); Playwright's own lines were "11 failed", "441 did not run", "96 passed (4.0m)"
RUN_1_VERDICT=FAIL (tmp/184-gates/verdict.out names every did-not-run test)
RUN_1_GATE=red
    a red run, not a void one; its directory is kept and it is not counted as a pass
RUN_1_FAILURE=all 11 failures read: awaitLinkWitness: witness <uuid> read neither sent nor not-sent within 30000 ms
    invitation-contract.spec.ts:132, invitation-landing.spec.ts:53, contestant-email-registration.spec.ts:75 and :461, contestant-code-registration.spec.ts:76, contestant-password-recovery.spec.ts:63, :112 and :149, entryAxeScan.ts:115 (entry-login), passwordless-session.setup.ts:24, contestant-journey.spec.ts:290; the 388 did-not-run tests depend on these
RUN_1_CAUSE=measured: the edge runtime container, started about 10 h earlier by the -gsd worktree, mounted the -gsd worktree's apps/supabase/supabase/functions (docker inspect, run by the orchestrator). yarn db:reset does not restart that container, so the account-access function served was -gsd's, against this branch's single-migration database, and no link witness was written
    environmental and outside this phase's files; confirmed by run 2 going green after the restart below, with no file changed
RUN_1_REMEDY=yarn db:stop (exit 0, tmp/184-gates/db-stop.log) then yarn db:start (exit 0, tmp/184-gates/db-start.log), both from this worktree; after them the edge runtime mounted this worktree's functions and the database held only migration 00001

E2E_HEAD=dccdf490842d64b06be71569e97df112607e2014
E2E_TREE_CLEAN=yes
E2E_RUN_DIR=tests/e2e-runs/184-25-20261112T062610Z
E2E_STARTED=2026-11-12T06:26:10Z
E2E_ENDED=2026-11-12T06:39:24Z
E2E_COMMAND=tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/184-25-20261112T062610Z --no-db-reset
E2E_WRAPPER_EXIT=0
    read from tmp/184-gates/e2e-2.status and the run directory's exit file. Wrapper lines: "548 passed (13.1m)", "playwright exit 0", "preflight failures 0, successes 1". The run directory holds no VOID-host-suspend.txt: not a void run.
E2E_PASSED=548
E2E_FAILED=0
E2E_FLAKY=0
E2E_DID_NOT_RUN=0
E2E_SKIPPED=0
    node tests/scripts/e2e-evidence.mjs tests/e2e-runs/184-25-20261112T062610Z, exit 0: total 548, passed 548, failed 0, flaky 0, skipped 0, didNotRun 0
E2E_VERDICT_EXIT=0
    node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/184-25-20261112T062610Z --no-flaky: VERDICT OK: 548 tests -- passed 548, failed 0, flaky 0, skipped 0, did not run 0
E2E_RUN_HEAD=dccdf490842d64b06be71569e97df112607e2014
E2E_RUN_TREE_CLEAN=yes
    the wrapper's worktree-status.txt lists only ?? .planning/workstreams/deployment/milestone.lock
E2E_HEAD_AFTER=dccdf490842d64b06be71569e97df112607e2014
E2E_TREE_CLEAN_AFTER=yes
E2E_GATE=green
E2E_PASSED_VS_181_19=548 against 548: equal
PREVIOUS_RED_RESOLVED=yes: every failure of run 1 passed in run 2 after the restart, with no change to the tree outside .planning/
V216_SESSION_MUST_RESET=yes: the v2.16 session's worktree (-gsd) shares this stack and must reset it from its own worktree before it continues; because the edge runtime now mounts this worktree's functions, a reset alone is not enough there either: run yarn db:stop and yarn db:start from -gsd
