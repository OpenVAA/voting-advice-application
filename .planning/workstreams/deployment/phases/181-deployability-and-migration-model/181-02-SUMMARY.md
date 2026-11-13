---
phase: 181-deployability-and-migration-model
plan: 02
subsystem: database
tags: [supabase-cli, docker, harness, postgres, pg_dump, storage-buckets, evidence]

# Dependency graph
requires:
  - phase: 181-01
    provides: node_modules installed under Node 24.21.0 (the Supabase CLI 2.118.0 at node_modules/.bin/supabase), and the toolchain record
provides:
  - apps/supabase/scripts/isolated-instance.sh, the harness that starts, describes and stops a Supabase CLI instance with its own project id and ports
  - evidence/181-02-harness-spike.md, the twelve verdict lines the database plans of the phase read as their precondition (HARNESS_DB_MODE=ok)
  - the measured bucket properties (file_size_limit 524288000, allowed_mime_types NULL), the dump role and scope, and the history table's column name
affects: [181-08, 181-10, 181-11, 181-12, 181-17]

# Actuals (#2632)
# tokens is chars/4 over the three files of the diff (37894 characters).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 9473
  tasks: 2
  commits: 3
plan_head_before: 7c3e8e6cef7155bfc3d801b67341a4452e87689e
plan_head_after: 5d3560c68539a5b9c2c12ac1ec1d0ebd291526fd

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A database observation runs on an instance of its own: isolated-instance.sh start, then the libpq PG* variables from its env subcommand, then stop"
    - "A harness that drives a tool which prints credentials sends the tool's output to a file and prints it only on failure, with every line that names a key or a secret removed"

key-files:
  created:
    - apps/supabase/scripts/isolated-instance.sh
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-02-harness-spike.md
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md
  modified: []

key-decisions:
  - "181-02: the harness's database-only mode is `supabase db start --workdir <dir>`. The spike showed it builds the platform's auth and storage schemas and applies the baseline with no service container, so the fallback (`supabase start` with every service excluded) was not needed and was not run."
  - "181-02: the harness writes the CLI's output to start.log in the instance's state directory and prints none of it when the start succeeds. In full mode the last line of `supabase start` holds the instance's API keys, the JWT secret and the S3 secret."
  - "181-02: the port keys of the copied config.toml take consecutive numbers from --port-base in file order (api.port is the base, db.port the base plus 1). Callers read the ports from the env subcommand and do not compute them."
  - "181-02: a relative --migrations, --seed or --tests path is resolved against the repository root, as tests/scripts/visual-container.sh resolves its paths, not against the caller's directory."

patterns-established:
  - "Before stop or env acts on a state directory, the harness reads the project id back from the copied config.toml and refuses unless it is openvaa-iso-<name> and not the source configuration's id"
  - "The services full mode leaves out are read from `supabase start --help` at run time and reduced by the four it keeps"

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan closes nothing: SUPA-10 is NOT closed and was not marked complete.
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "The harness exists, is executable, refuses unsafe input with status 4 before any CLI call, and every CLI call it makes carries --workdir"
    verification:
      - kind: other
        ref: "Task 1 <verify><automated> of 181-02-PLAN.md, run verbatim on the final script (commit f2b47175f): exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "An isolated instance was started and stopped in both modes, zero bucket rows were seen on the unchanged tree in a database-only build, the measurements later plans need are on record, and the shared stack's container list is unchanged"
    verification:
      - kind: other
        ref: "Task 2 <verify><automated> of 181-02-PLAN.md, run verbatim after the record was written: exit 0"
        status: pass
    human_judgment: false

# Metrics
duration: 17min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 02: Isolated-Instance Harness and Its Spike Summary

**`HARNESS_DB_MODE=ok`: `apps/supabase/scripts/isolated-instance.sh` starts and stops a Supabase CLI instance on its own project id and ports in both modes, the database-only build of the unchanged tree holds zero bucket rows, and the 13 containers of the shared `openvaa-local` stack are the same containers before and after.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-10-12T16:45:22Z
- **Completed:** 2026-10-12T17:02:40Z (last task commit)
- **Tasks:** 2 of 2
- **Files modified:** 3 (all new)

## Accomplishments

- The harness has four subcommands (`start`, `env`, `stop`, `list`) and the six flags the plan names. It builds an instance from a copy of `config.toml` with the project id `openvaa-iso-<id>`, every port key moved, and seeding off unless `--seed` is given.
- It refuses with status 4 before any CLI call: a name outside lower-case letters, digits and hyphens; a project id that is the source configuration's; a work directory inside the repository; a port that equals a port of the source configuration; a port with a listener; an instance that already exists.
- The spike proved research assumption A1: `supabase db start` in an isolated work directory builds the auth and storage schemas and applies the baseline, with one container and no bucket seeding.
- The red control of the bucket criterion was seen: `select count(*) from storage.buckets` is `0` on the unchanged tree in a database-only build.
- The values the later plans copy are measured, not computed.

## Recorded statuses and verdicts

The verdict lines of `evidence/181-02-harness-spike.md`:

| Key | Value |
|-----|-------|
| `HARNESS_DB_MODE` | `ok` |
| `HARNESS_DB_COMMAND` | `node_modules/.bin/supabase db start --workdir <state directory>` |
| `HARNESS_FULL_MODE` | `ok` |
| `BUCKET_ROWS_UNCHANGED_TREE` | `0` |
| `BUCKET_FILE_SIZE_LIMIT` | `524288000` |
| `BUCKET_ALLOWED_MIME_TYPES` | `NULL` |
| `DUMP_ROLE` | `supabase_admin` |
| `DUMP_SCOPE` | `whole-database` |
| `DUMP_RESTRICT_KEY` | `supported` |
| `MIGRATION_HISTORY_VERSION_COLUMN` | `version` |
| `SERVICE_ROLE_CAN_INSERT_STORAGE_CONFIG` | `t` |
| `SHARED_STACK_UNTOUCHED` | `yes` |

Command statuses, each read from the command itself:

| Command | Status | Elapsed |
|---------|--------|---------|
| Leg 1 `start --name spike-db --mode db` | 0 | 17 s |
| Leg 1 `stop --name spike-db` | 0 | 1 s |
| Leg 2 `start --name spike-full --mode full --port-base 55600` | 0 | 28 s |
| Leg 2 `stop --name spike-full` | 0 | 2 s |
| `start --name spike-fail` with a migration that does not apply (extra) | 5 | 17 s |
| Leg 1 again on the final script: `start`, bucket count `0`, `stop` (extra) | 0, 0, 0 | 17 s |
| Task 1 verify command, verbatim, on the final script | 0 | |
| Task 2 verify command, verbatim | 0 | |
| `node scripts/assert-comment-hygiene.mjs` with the script tracked | 0 | |
| `node scripts/assert-declared-binaries.mjs` | 0 | |

No whole-repo gate (`yarn build`, `yarn test:unit`, `yarn lint:check`, `yarn format:check`) was run. The plan orders none, and the change is one shell script that no workspace builds or imports.

Container lists: `docker ps --format '{{.Names}}'` before the first start and after the last stop are identical (24 names). The 13 names ending `_openvaa-local` are identical, the 10 names of the unrelated stack `next-supabase-skimle2` are identical, and the container ids of all 24 are identical, so none was recreated. Volumes and networks are identical. No name containing `openvaa-iso-` is left in `docker ps -a`.

## Task Commits

1. **Task 1: Write the isolated-instance harness** - `d25f60ef2` (feat)
   - `f2b47175f` (fix): the failure path drops every line of the CLI's output that names a key or a secret. See deviation 1.
2. **Task 2: Spike the harness on the unchanged tree and record the measurements** - `5d3560c68` (docs)

## Files Created/Modified

- `apps/supabase/scripts/isolated-instance.sh` - the harness. Executable, 572 lines, Bash 3.2 compatible (the `bash` that `/usr/bin/env` finds on this host is 3.2.57).
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-02-harness-spike.md` - the verdict lines and the observations behind them.
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md` - one item left alone: the CLI's deprecation warning for `[inbucket]`.

## Decisions Made

- **`--mode db` is `supabase db start`.** The spike confirmed it, so the fallback was not built into the harness.
- **The CLI's output goes to a file, not to the caller.** `supabase start` ends with one line holding the instance's keys and secrets. The harness writes the CLI's output to `start.log` in the state directory and prints it only when the CLI fails. A caller that needs a line of it (the bucket lines, for example) reads that line from the file.
- **Ports are assigned in file order from `--port-base`.** This moves any port key a later `config.toml` adds without an edit to the harness. The default base is 55400; the spike's second instance used 55600.
- **Relative paths are resolved against the repository root**, the rule of `tests/scripts/visual-container.sh`.
- **Exit code 5 also covers a state directory that cannot be written or removed.** The plan's table gives 5 to a CLI failure only; a failed `mkdir` or `cp` had no code, and the plan wants every non-zero exit to go through `fatal`.
- **A failed start cleans up after itself.** The harness runs `supabase stop --workdir <dir> --no-backup` and removes the state directory before it exits 5. If that stop fails too, the state directory is kept so that `stop --name` can be run again.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The failure path could print two secrets**
- **Found during:** Task 2, leg 2
- **Issue:** the first version of the harness removed JWT-shaped strings and `sb_...` keys from the CLI output it prints on failure. The status line of `supabase start` also holds the JWT secret and the S3 secret, which have no shape a pattern matches. That line is printed only by a start that succeeded, and the harness prints nothing then, so no secret was printed by the harness. The mitigation of threat T-181-04 still rested on the CLI never printing that line before a failure.
- **Fix:** `print_redacted` now replaces every line that contains `SECRET` or `_KEY` with a placeholder, before the two shape patterns run.
- **Files modified:** `apps/supabase/scripts/isolated-instance.sh`
- **Verification:** a synthetic five-line sample (a status line with a secret and a JWT, a JWT inside a log line, an `sb_secret_` value, two plain lines) came out with none of the three values; the Task 1 verify command exits 0 on the final script; leg 1 was run again on it (start 0, bucket count 0, stop 0).
- **Committed in:** `f2b47175f`

**2. [Rule 2 - Missing Critical] Two observations were added to the spike**
- **Found during:** Task 2
- **Issue:** the two legs exercise only starts that succeed. The harness's exit 5 path, which must leave no container behind on a host with two other stacks (threat T-181-03), was unobserved. And legs 1 and 2 ran on the script before deviation 1.
- **Fix:** a start with a migration that does not apply (status 5; no container, volume, network or state directory left), and leg 1 again on the final script. Both are in the record under their own heading.
- **Files modified:** none beyond the record
- **Committed in:** `5d3560c68`

**3. [Scope boundary] `deferred-items.md` was created**
- The CLI warns on every start that the `[inbucket]` section of `config.toml` is deprecated. The file is shared with the other worktree and is outside this plan, so the item was logged and not fixed.
- **Committed in:** `5d3560c68`

---

**Total deviations:** 2 auto-fixed (2 missing critical), 1 out-of-scope item logged
**Impact on plan:** none on the plan's two outputs. The harness's CLI surface is the one the plan names.

**Two rules of the plan were overruled by the dispatch and the brief, where those are stricter:** the plan allows `docker builder prune -af` on a lack of disk space, the dispatch forbids pruning; no lack of space occurred and nothing was pruned. The broken-windows ledger was not written: there is no stub, skipped test or unrun verify to record, and `.planning/WINDOWS.md` sits beside the shared `PROJECT.md`.

## Issues Encountered

- **The CLI's status line was shown once in the executor's own tool output.** While preparing the record, the first eight lines of the full-mode `start.log` were copied to a scratch file under the ignored `tmp/` and displayed. Line 8 is the CLI's status line with the local instance's keys and secrets. The scratch file was deleted in the next command, a search of the scratch directory for key-shaped strings then found none, and no tracked file ever held the line. The anon and service-role values carry the issuer `supabase-demo`, the CLI's published local defaults; the instance they belonged to no longer exists. Whether the other values of that line are also fixed defaults of the CLI was not checked. The record's verify command rejects a JWT-shaped string and exits 0.
- **One TCP connection reached the unrelated stack.** A refusal test of Task 1 with `--port-base 54330` made the harness's port-in-use test open and close one connection, sending nothing, on port 54331, which the gateway of `next-supabase-skimle2` publishes. The harness refused with status 4. No connection was made to a port of `openvaa-local`.
- **The `bash` on this host is 3.2.** The script avoids arrays, `mapfile` and case conversion for that reason.
- **No git hook ran on the commits** (`core.hooksPath=/dev/null` in this worktree, as before). No commit used `--no-verify`.

## What a later plan must know

- **Use.** `bash apps/supabase/scripts/isolated-instance.sh start --name <id> --mode db|full --migrations <dir>`, then `set -a; eval "$(... env --name <id>)"; set +a` and plain `psql`/`docker exec "$ISO_DB_CONTAINER" ...`, then `stop --name <id>`. A start takes about 17 s in `db` mode and 28 s in `full` mode on this host, with every image present.
- **Never paste the output of `env`, and never copy `start.log` whole.** `env` prints the local database password. In `full` mode `start.log` in the state directory ends with the keys and secrets. Take single lines from it with `grep`.
- **Two instances at once need bases at least 10 apart.** Each takes ten consecutive numbers from `--port-base` (default 55400). Two instances running at the same moment were not tried.
- **The state directory depends on `TMPDIR`.** It is `${TMPDIR:-/tmp}/openvaa-isolated/<id>/`; here `TMPDIR` is the per-user directory under `/var/folders`. `list` and `stop` find only instances started under the same `TMPDIR`.
- **`pg_dump` 17.6 writes a random `\restrict` and `\unrestrict` line into every dump.** Two dumps of the same database differ in those two lines. A text comparison needs `--restrict-key=<fixed value>` (accepted by the container's `pg_dump`) or those lines removed. Without them the whole-database dumps taken as `supabase_admin` and as `postgres` were identical.
- **The whole-database dump covers twelve schemas**, the platform's among them (`auth`, `storage`, `realtime`, `_realtime`, `vault` and others), and five `CREATE EXTENSION` lines; it holds no `ALTER ROLE` line. The dump of `public`, `private` and `storage` holds no `CREATE EXTENSION` line.
- **The bucket insert's values:** `file_size_limit` `524288000` (a `bigint`) and `allowed_mime_types` `NULL` on both rows; `public` `true` for `public-assets`, `false` for `private-assets`; `id` equals `name`.
- **Not measured: what the CLI does when a bucket row already exists** (research assumption A3). No migration inserts one on this tree, so the CLI printed `Creating Storage bucket:` twice. The plan that writes the insert has to observe the update path.
- **A migration that does not apply makes `supabase db start` exit 1**; the harness reports 5 and removes what was started. That is usable as a red control.
- **In `db` mode only the database port is published**, on all interfaces, as the CLI does for the shared stack.
- **Scratch state** is in `tmp/181-evidence/181-02/` (ignored): the query outputs, the dump files and the container lists.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: network-listener | `apps/supabase/scripts/isolated-instance.sh` | While an instance runs, the CLI publishes its Postgres port (and in `full` mode its gateway port) on `0.0.0.0`, with the CLI's public local password and keys. The shared stack is published the same way; this adds listeners for the lifetime of an instance. Not in the plan's threat register. |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 181-08, 181-10, 181-11, 181-12 and 181-17 can read `HARNESS_DB_MODE=ok` and the value lines they name as preconditions.
- Follow-up X-2 needs no other option: the isolated instance works.
- Not closed here: SUPA-10 stays open until the last plan of the phase.

## Self-Check: PASSED

- The three created files exist.
- Commits `d25f60ef2`, `f2b47175f` and `5d3560c68` are ancestors of `HEAD`.
- `commits: 3` is `git rev-list --count 7c3e8e6ce..HEAD` with `HEAD` at `5d3560c68`.
- Task 1 acceptance criteria: no argument exits 2 and prints the usage block; the header holds `Exit codes` followed by lines for 0, 2, 3, 4, 5 and 130; the four lines that invoke the CLI to start or stop carry `--workdir`, and the one other invocation is `start --help`; the machine-wide stop flag does not occur in the script (`grep -c` prints 0); `apps/supabase/scripts/lint-schema.mjs` is still tracked.
- Task 2 acceptance criteria: twelve verdict lines; `BUCKET_ROWS_UNCHANGED_TREE=0`; `BUCKET_FILE_SIZE_LIMIT` equals the fourth column of the query output file; no `openvaa-iso-` name in `docker ps`; no JWT-shaped string in the record.
- Plan-level verification: the three points hold (status 4 and status 2; the verdict lines with `SHARED_STACK_UNTOUCHED=yes`; no `openvaa-iso-` container).

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
