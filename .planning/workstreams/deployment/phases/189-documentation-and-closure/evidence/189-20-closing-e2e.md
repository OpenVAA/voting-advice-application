RECORDED=2026-11-21
RECORDED_BY=the plan executor of plan 189-20, which ran the stack check and both E2E runs itself from this checkout; wrapper logs and status files in the session scratchpad (e2e/ for the void run, e2e2/ for the green one)
ENV_FILE=present
    checked with test -f .env only; no variable name or value was read
DISK=72-73 GiB free on / before each run; no prune was needed
STACK_BEFORE_RUN=every supabase_*_openvaa-local container Up (13), supabase_edge_runtime_openvaa-local among them, mounting this checkout's apps/supabase/supabase/functions (the stack was restarted from this checkout before the gates, see 189-20-closing-gates.md STACK_BEFORE_GATES); supabase_migrations.schema_migrations 24 rows against 24 files after the gates' yarn db:reset
FRONTEND_PORT=5273, prefixed on the command; no listener on 5273, 8777 or 9443 before either run (lsof exit 1 each). Port 5173 is held by another project's dev server
COVERS_THIS_PHASES_CHANGES=the run is on the whole tree at GATES_HEAD: plan 189-01 (render.example.yaml and its template tests removed), 189-02 (the frontend-URL pair removed from the constants, the auth test mocks, the env template and the root compose; bank-auth, contestant-identity-provider and voter-journey ran targeted there), 189-03 (the orphan compose retired), 189-08 to 189-10 (three new unit guards), 189-19 (one seed.sql comment line), and the docs and runbook plans, which no project drives

## The void run

E2E_VOID_RUNS=1
E2E_VOID_RUN_DIR=tests/e2e-runs/189-close-20261121T081102Z
    started 2026-11-21T08:11Z under caffeinate -i on HEAD 03469505a462670aa4c1ca1c5e95b5324da3be17; the wrapper wrote VOID-host-suspend.txt (last beat before the gap 2026-11-21T08:31:13Z, first after it 08:31:28Z, gap_ms=12890, threshold 3000), its exit file holds 130 and the wrapper exited 8; restore.txt ends "restore: ok". Void by the wrapper's marker: not diagnosed, not counted, and the directory kept. The rerun below was wrapped in caffeinate -dims, as the orchestrator directed

## The run

E2E_TREE_SHA=03469505a462670aa4c1ca1c5e95b5324da3be17
E2E_HEAD=03469505a462670aa4c1ca1c5e95b5324da3be17
    equal to GATES_HEAD of 189-20-closing-gates.md; the wrapper printed this HEAD, and HEAD was the same before and after the run (e2e2/head-before.txt, head-after.txt)
E2E_TREE_CLEAN=yes
    git status --porcelain before the run listed only the two orchestrator-owned planning files the dispatch leaves uncommitted (` M .planning/workstreams/deployment/config.json`, `?? .planning/workstreams/deployment/.verification-ledger.json`) and the untracked evidence/189-20-closing-gates.md, written before the run and committed after it so that HEAD stayed GATES_HEAD; the run directory's worktree-status.txt holds those three lines. Nothing outside .planning/ differed from HEAD at any point
E2E_RUN_DIR=tests/e2e-runs/189-close2-20261121T122229Z
E2E_STARTED=2026-11-21T12:22:29Z
E2E_ENDED=2026-11-21T12:43:19Z
E2E_COMMAND=FRONTEND_PORT=5273 caffeinate -dims tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/189-close2-20261121T122229Z --no-db-reset
E2E_WRAPPER_EXIT=0
    read from e2e2/wrapper.status, written by the command on the line after the wrapper, and from the run directory's exit file (0). Wrapper lines: "729 passed (20.1m)", "e2e-run.sh: playwright exit 0", "e2e-run.sh: preflight failures 0, successes 1"; restore.txt ends "restore: ok"; env-posture.txt: sleep_assertion=caffeinate -dimsu, heartbeat_max_late_ms=454
E2E_VOID=no
    no VOID-host-suspend.txt in the run directory, and the wrapper did not exit 8
E2E_PASSED=729
E2E_FAILED=0
E2E_FLAKY=0
E2E_DID_NOT_RUN=0
E2E_SKIPPED=0
    node tests/scripts/e2e-evidence.mjs tests/e2e-runs/189-close2-20261121T122229Z, exit 0: total 729, passed 729, failed 0, flaky 0, skipped 0, didNotRun 0
E2E_VERDICT_EXIT=0
    node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/189-close2-20261121T122229Z --no-flaky: VERDICT OK: 729 tests -- passed 729, failed 0, flaky 0, skipped 0, did not run 0
E2E_BASELINE_RUN=tests/e2e-runs/188-close3-20261119T213204Z
E2E_SUMMED_DELTA=0
    the deltas the plans report: 189-02 0 (bank-auth 12, contestant-identity-provider 42, voter-journey 2, each equal to the baseline), every other plan of the phase 0 with no project affected; 189-01's removed tests were dev-seed unit tests, not E2E
E2E_PASSED_VS_188_CLOSE=729
    729 against 729 in the baseline: equal
E2E_PROJECT_DELTAS=0
    per project from both runs' results.json (project | describe path > title): 129 projects in each, no project's test count changed
E2E_TITLE_CHANGES=0
    no test title gone and none added between the two runs' results.json; no duplicate key in either
E2E_GATE=green
RED_RUNS=0
    the one non-void run is green; no run was retried for a red result and no test was marked flaky
STACK_LEFT=running, restarted by the wrapper's restore; not stopped
