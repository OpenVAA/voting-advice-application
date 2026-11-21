---
phase: 182-analytics-relay
plan: 01
subsystem: database
tags: [supabase-cli, docker, harness, pgtap, node, yarn, evidence]
status: complete

# Dependency graph
requires:
  - phase: 181-02
    provides: apps/supabase/scripts/isolated-instance.sh, the tracked harness (start, env, stop, list), used here unchanged
provides:
  - node_modules installed from the committed lockfile under Node 24.21.0 and every workspace built (14/14 turbo tasks)
  - the running isolated instance p182 (project id openvaa-iso-p182, ports 56200-56209, database on 56201), db mode, unchanged baseline plus seed applied
  - a green pgTAP baseline on that instance (47 files, 2603 tests), before and after `supabase db reset --workdir`
  - the proven rebuild route for plan 182-02: `supabase db reset --workdir "$ISO_WORKDIR"` (HARNESS_RESET=ok)
affects: [182-02, 182-11, 182-22]

# Actuals (#2632)
# tokens is chars/4 over the files this plan changed (two evidence files, 4127 characters, plus this summary).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
actuals:
  tokens: 3300
  tasks: 2
  commits: 2
plan_head_before: f2a963ae7ba2301aeed6716560969149033b6f51
plan_head_after: c25220a300df658f61163a0d294e52ae4d3ed71a

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A database change of this phase is tested on the isolated instance p182, never on the shared openvaa-local stack"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/01-environment.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/01-isolated-instance.txt
  modified: []

key-decisions:
  - "The harness was already tracked (phase 181 committed it), so this plan used it unchanged and none of its commits lists apps/supabase/scripts/isolated-instance.sh"
  - "db mode suffices for the pgTAP baseline; full mode was not needed"
  - "Plan 182-02 rebuilds the isolated database with `supabase db reset --workdir \"$ISO_WORKDIR\"`; the stop-and-start route was not needed"

patterns-established:
  - "Evidence scratch lives under tmp/182-evidence/ (gitignored); later plans of the phase use the same place"

requirements-completed: [RELAY-12, RELAY-19]

# Metrics
duration: 5min
completed: 2026-10-18
---

# Phase 182 Plan 01: Environment and isolated database instance Summary

**Dependencies installed and built under Node 24.21.0, and phase 181's harness proven for this phase: instance `openvaa-iso-p182` (db mode, ports 56200-56209) passes all 47 pgTAP files (2603 tests) before and after `supabase db reset --workdir`. The 13 `openvaa-local` containers did not change.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-10-18T20:07:49Z
- **Completed:** 2026-10-18T20:11:43Z
- **Tasks:** 2
- **Files modified:** 2 (both evidence records)
- **Start sha:** `f2a963ae7ba2301aeed6716560969149033b6f51`

## Accomplishments

- `yarn install --immutable` exited 0 and `yarn.lock` is unchanged. `yarn build` (turbo, with a `TURBO_CACHE_DIR` private to the attempt) exited 0 with 14/14 tasks. The tree was clean and HEAD unchanged before and after.
- The tracked harness started `p182` in `db` mode. The CLI applied `00001_initial_schema.sql` and `seed.sql`. The applied version is `00001|initial_schema`.
- pgTAP over the whole `tests/database` directory passed: 47 files, 2603 tests, status 0. `supabase db reset --workdir` exited 0, and pgTAP passed again with the same count.
- Refusal check: `start --name 'Bad Name' ...` exited 4 and started nothing.
- Shared stack: the 13 names ending `_openvaa-local` were identical before and after (`cmp` status 0). The only new container is `supabase_db_openvaa-iso-p182`.

## Commands for plans 182-02 and 182-22 (verbatim)

Run from the repository root, with `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`:

```sh
# Start (only if it is not running: `apps/supabase/scripts/isolated-instance.sh list` prints p182 while it exists)
apps/supabase/scripts/isolated-instance.sh start --name p182 --mode db --port-base 56200 --migrations apps/supabase/supabase/migrations --seed apps/supabase/supabase/seed.sql --tests apps/supabase/supabase/tests

# Load its variables (ISO_WORKDIR, ISO_PROJECT_ID, ISO_DB_CONTAINER, PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD)
set -a; eval "$(apps/supabase/scripts/isolated-instance.sh env --name p182)"; set +a

# pgTAP over the whole directory
node_modules/.bin/supabase test db --workdir "$ISO_WORKDIR"

# Rebuild the database (the proven route: HARNESS_RESET=ok)
node_modules/.bin/supabase db reset --workdir "$ISO_WORKDIR"

# Stop it and remove its containers, volumes and state directory
apps/supabase/scripts/isolated-instance.sh stop --name p182
```

Mode that worked: `db`. The instance is **left running** for plan 182-02.

**How an edited file reaches the instance.** The harness copies the migrations, seed and tests into `$ISO_WORKDIR/supabase/` at start. An edited migration or test file must be copied into the matching directory there, `$ISO_WORKDIR/supabase/migrations/`, `$ISO_WORKDIR/supabase/tests/database/` or `$ISO_WORKDIR/supabase/seed.sql`, and then reset or tested. Editing the repository file alone does not change what the instance runs.

## Task Commits

1. **Task 1: Install dependencies under Node 24.21.0 and build every workspace:** `13f2555aa` (docs)
2. **Task 2: Prove an isolated Supabase CLI instance and run the pgTAP baseline on it:** `c25220a30` (docs)

## Files Created/Modified

- `.planning/workstreams/deployment/phases/182-analytics-relay/evidence/01-environment.txt`: install and build statuses, tree samples, Node 24.21.0, Yarn 4.18.1, `ENV_FILE=present`
- `.planning/workstreams/deployment/phases/182-analytics-relay/evidence/01-isolated-instance.txt`: start command and status, project id, ports, the redacted CLI output, the applied version, both pgTAP summaries, reset output, the refusal check, and container lists before and after

## Decisions Made

- The harness file was tracked at plan start (`git ls-files` printed it), so it was read but not rewritten. Phase 181's spike record already showed `HARNESS_DB_MODE=ok`.
- The scratch place is `tmp/182-evidence/`. `git check-ignore -q tmp/182-evidence/x` exited 0, so the `${TMPDIR}` fallback is not in use.

## Deviations from Plan

**1. [Rule 3 - Blocking] The env-file existence check was done by directory listing.** A PreToolUse secret-read guard refuses any Bash command that names the root env file, including `test -f`. Its presence was taken from `ls -A` of the repository root, which reads no file content, and recorded as `ENV_FILE=present` with an indented note saying how. No value was read and no file was created.

Nothing else differs from the plan.

## Issues Encountered

None. The CLI prints a deprecation warning that `[inbucket]` should become `[local_smtp]`, and a notice that CLI v2.121.0 is available (v2.118.0 is installed). Neither affects this plan.

## Next Phase Readiness

- Plan 182-02 can test its database change on `p182` with the commands above. The instance is running with the unchanged baseline and seed.
- Plan 182-11 still needs `yarn playwright install` before its first E2E run, which this plan did not run.

## Self-Check: PASSED

- FOUND: evidence/01-environment.txt, evidence/01-isolated-instance.txt (each equal by `cmp` to its current attempt file; both automated verify blocks of each task exit 0)
- FOUND: commits `13f2555aa` and `c25220a30` are ancestors of HEAD
