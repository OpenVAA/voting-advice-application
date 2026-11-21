---
phase: 181-deployability-and-migration-model
plan: 10
subsystem: database
tags: [supabase, postgres, pg_dump, schema-equivalence, migrations, isolated-instance, red-controls, evidence]

# Dependency graph
requires:
  - phase: 181-02
    provides: apps/supabase/scripts/isolated-instance.sh, HARNESS_DB_MODE=ok, DUMP_ROLE=supabase_admin, DUMP_SCOPE=whole-database, DUMP_RESTRICT_KEY=supported
  - phase: 181-08
    provides: the baseline that inserts the two storage.buckets rows, which the bucket-row control changes in a copy
provides:
  - apps/supabase/scripts/check-schema-equivalence.sh, which builds one database from migrations/ and one from schema/ and exits 0 when they are equal, 1 when they differ, 2 when it could not run, 130 when interrupted
  - evidence/181-10-equivalence.md, with the check seen red on a column grant, a policy, a function body, a bucket row and a role setting, refused at the floor, and green on the tree
  - two measured facts about a whole-database dump of a local instance (day-named partitions of realtime.messages; the JWT secret in pg_db_role_setting)
affects: [181-12, 181-15, 181-17, 181-18, 184, 187]

# Actuals (#2632)
# tokens is chars/4 over the diff plan_head_before..plan_head_after (53419 characters, three files).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 13355
  tasks: 2
  commits: 4
plan_head_before: 750a2efc8077ded864531a7eb7b157b21854bcc9
plan_head_after: 9ec96b83965517d1cd9199a86104dd3951f3853a

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A comparison of two built databases is a diff of two snapshot files: a schema-only pg_dump taken inside the database container, then labelled rows of the catalog queries the dump leaves out"
    - "A script that starts instances claims each one before the start, stops it in an EXIT trap that every way out passes through, and never stops an instance it found already there"
    - "A diff is made to name its object by walking both inputs for the nearest object header above each changed line, not by trusting three lines of context"

key-files:
  created:
    - apps/supabase/scripts/check-schema-equivalence.sh
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-10-equivalence.md
  modified:
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md

key-decisions:
  - "181-10: the equivalence check builds its two sides one after the other and stops each instance as soon as its snapshot is written, so eq-m (port base 55400) and eq-s (55500) never run at the same moment. Two isolated instances at once remain untried."
  - "181-10: the check leaves the daily partitions of realtime.messages out of its dump (pg_dump --exclude-table with a pattern for realtime.messages_YYYY_MM_DD) and exits 2 if a dump still names one. A local instance created on 2026-10-12 held five of them, dated 2026-10-11 to 2026-10-15, in 85 lines of the dump. A false difference across midnight was not observed; it is inferred from the names."
  - "181-10: a role setting whose name holds secret, password, token or key is written to a snapshot as a SHA-256 digest. pg_db_role_setting returns the database setting app.settings.jwt_secret with its value, and the first trial snapshot held it."
  - "181-10: the floor keeps the plan's four tests (a CREATE TABLE public. line, 20 tables, 50 policies, 50 functions) counted over the whole database. A database with no migration of this repository applied holds 46 tables, 0 policies and 47 functions, so the public-table test and the policy threshold are what refuse it; the table threshold does not."
  - "181-10: on this tree the green run can only be equal, because 00001_initial_schema.sql is still the concatenation of schema/. What the green shows is that two builds of one input give byte-identical snapshots. No hand-written migration exists to compare."

patterns-established:
  - "A red control of a database check is one substitution in a scratch copy of schema/ that fails when its pattern is absent, confirmed by diff -r to be one line, and run with the kept snapshot of the unchanged side"
  - "A signal test of a shell script is driven from a process that starts the script with default signal dispositions: a background job of a non-interactive shell has SIGINT ignored and cannot trap it"

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan closes nothing: SUPA-10 is NOT closed and was not marked complete
# (requirements.ready-ids answered with an empty list).
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "The script exists with injectable directories, a census, a floor, four statuses and an interrupt trap, and calls the isolated-instance harness for every instance"
    verification:
      - kind: other
        ref: "Task 1 <verify><automated> of 181-10-PLAN.md, run verbatim on commit 9ec96b839: exit 0 (bash -n, executable, an unknown flag exits 2)"
        status: pass
      - kind: other
        ref: "node scripts/assert-comment-hygiene.mjs with the script tracked (1972 files): exit 0; node scripts/assert-declared-binaries.mjs: exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "A planted difference in a column grant, a policy expression, a function body, a bucket row and a role setting each makes the check exit 1 and name the changed object"
    verification:
      - kind: integration
        ref: "evidence/181-10-equivalence.md: RED_COLUMN_GRANT_EXIT=1, RED_POLICY_EXIT=1, RED_FUNCTION_BODY_EXIT=1, RED_BUCKET_ROW_EXIT=1, RED_ROLE_SETTING_EXIT=1, each on commit 132f0e5c4 with the output quoted"
        status: pass
    human_judgment: false
  - id: D3
    description: "The check refuses to pass on a database that holds none of this schema"
    verification:
      - kind: integration
        ref: "evidence/181-10-equivalence.md: RED_FLOOR_EXIT=2 on a schema directory holding one SELECT 1, with the floor's message quoted"
        status: pass
    human_judgment: false
  - id: D4
    description: "The check exits 0 on the tree, after the controls"
    verification:
      - kind: integration
        ref: "bash apps/supabase/scripts/check-schema-equivalence.sh with no argument on commit 132f0e5c4: exit 0, 34 s (EQUIVALENCE_TREE_EXIT=0); Task 2 <verify><automated> run verbatim on commit 9ec96b839: exit 0"
        status: pass
    human_judgment: true
    rationale: "The status is observed. What it proves is narrower than its name: the migration is still generated from schema/, so the two sides were built from the same text and could not differ. Whether the check finds a real disagreement between a hand-written migration and schema/ is shown only by the controls, which change the schema side. The first run that can fail for a real reason is the one after the freeze."
  - id: D5
    description: "Every instance the check starts is stopped on every way out, and the shared stack and the unrelated stack are untouched"
    verification:
      - kind: integration
        ref: "evidence/181-10-equivalence.md: BUILD_FAILURE_EXIT=2, EXISTING_INSTANCE_EXIT=2, INTERRUPT_SIGTERM_EXIT=130, INTERRUPT_SIGINT_GROUP_EXIT=130, each with no instance, container or volume left; SHARED_STACK_UNTOUCHED=yes by diff of name and id of all 24 containers"
        status: pass
    human_judgment: false

# Metrics
duration: 21min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 10: The Schema Equivalence Check Summary

**`apps/supabase/scripts/check-schema-equivalence.sh` builds one database from `migrations/` and one from `schema/` in two isolated instances, compares a `pg_dump` snapshot of each with four catalog queries appended, and was seen to exit 1 and name the object for a column grant, a policy, a function body, a bucket row and a role setting, 2 at the floor, and 0 on the tree in 34 s. The green is of limited meaning before the freeze: both sides are still built from the same SQL text.**

## Performance

- **Duration:** 21 min
- **Started:** 2026-10-12T18:56:54Z
- **Completed:** 2026-10-12T19:18:04Z (last commit before this summary)
- **Tasks:** 2 of 2
- **Files modified:** 3 (2 new, 1 changed)

## Accomplishments

- The script, 519 lines, Bash 3.2 compatible, in the shape of `isolated-instance.sh`: a header with purpose, usage, what the check cannot see and an exit-code table; `usage` and `fatal`; paths from its own location. Flags `--schema-dir`, `--migrations-dir`, `--out`, `--reuse-m`, `-h`.
- Side M is the instance `eq-m` on port base 55400, built from the migrations directory. Side S is `eq-s` on 55500, built from one file that is every `.sql` file of the schema directory in filename order, each ending in a newline. Both are database only with seeding off. The sides are built one after the other.
- A snapshot is `pg_dump --schema-only` of the whole database as `supabase_admin`, inside the database container through `docker exec`, with a fixed `--restrict-key` and without the schema `supabase_migrations`, followed by role settings, extensions and the rows of `storage.buckets` and `private.deployment_settings`. Every row of a query carries the name of what it belongs to.
- On a difference the script prints the objects that differ before the diff. It finds them by walking both snapshots for the nearest `pg_dump` object header or query header above each changed line, so a change deep inside a function body is named even when the diff's three lines of context do not reach the function's first line.
- The five planted differences and the floor control, each on a scratch copy of `schema/` outside the repository. Then the tree, with default arguments.
- Four more ways out were made to happen, because later plans run this script: a build that fails, an instance that already exists, `SIGTERM`, and `SIGINT` to the process group.

## Recorded statuses

Every status was read from `$?` of the command itself, with the output sent to a file under `tmp/181-10/` (ignored by git). None was read through a pipe. Nothing here went through turbo. The verdict lines of the record were written by the shell from the status files, not typed.

The verdict lines of `evidence/181-10-equivalence.md`:

| Key | Value | Named by the plan |
|-----|-------|-------------------|
| `RED_COLUMN_GRANT_EXIT` | `1` | yes |
| `RED_POLICY_EXIT` | `1` | yes |
| `RED_FUNCTION_BODY_EXIT` | `1` | yes |
| `RED_BUCKET_ROW_EXIT` | `1` | yes |
| `RED_ROLE_SETTING_EXIT` | `1` | yes |
| `RED_FLOOR_EXIT` | `2` | yes |
| `EQUIVALENCE_TREE_EXIT` | `0` | yes |
| `BUILD_FAILURE_EXIT` | `2` | no, added |
| `EXISTING_INSTANCE_EXIT` | `2` | no, added |
| `INTERRUPT_SIGTERM_EXIT` | `130` | no, added |
| `INTERRUPT_SIGINT_GROUP_EXIT` | `130` | no, added |
| `SHARED_STACK_UNTOUCHED` | `yes` | no, added |
| `TWO_INSTANCES_AT_ONCE` | `not-tried` | no, added |

Command statuses:

| Command | Tree | Status | Elapsed |
|---------|------|--------|---------|
| Task 1 verify, verbatim (`bash -n`, executable, `--no-such-flag` exits 2) | `2446b0333`, then `9ec96b839` | 0, 0 | |
| `--help`; `--out` with no value; `--schema-dir` on a missing directory; `--reuse-m` with `--migrations-dir` | working tree before `2446b0333` | 0; 2; 2; 2 | |
| `node scripts/assert-comment-hygiene.mjs` with the script tracked | `2446b0333`, `132f0e5c4`, `9ec96b839` | 0 each | |
| `node scripts/assert-declared-binaries.mjs` | working tree before `2446b0333`, then `9ec96b839` | 0, 0 | |
| First run, `--out tmp/181-10/out` (kept the migrations snapshot) | `132f0e5c4` | 0 | 33 s |
| Five controls, `--schema-dir <copy> --reuse-m <kept snapshot>` | `132f0e5c4` | 1 each | 16 to 17 s each |
| Floor control | `132f0e5c4` | 2 | 16 s |
| A schema file that does not apply | `132f0e5c4` | 2 | 18 s |
| An instance `eq-s` already there | `132f0e5c4` | 2 | under 1 s |
| `SIGTERM` to the script, 8 s in | `132f0e5c4` | 130 | 22.7 s |
| `SIGINT` to the process group, 8 s in | `132f0e5c4` | 130 | 9.2 s |
| **The tree, no argument, after all of the above** | `132f0e5c4` | **0** | **34 s** |
| `node scripts/assert-schema-migration-parity.mjs` | `132f0e5c4` | 0 (29 files, 7880 lines each side) | |
| Task 2 verify, verbatim | working tree before `25494649d`, then `9ec96b839` | 0, 0 | |

Where the table names a commit for a guard or a verify command that was run just before that commit was made, the files were the staged ones that the commit then recorded.

Runs made twice. The first run with `--out`, the five controls, the floor control, the failing build and the existing instance were also run on `2446b0333`, before the comment-only commit `132f0e5c4`, with the same statuses; the output of each control was compared across the two commits and is identical apart from the seconds. The two signal runs were also made once before `2446b0333` was committed, on a script with the `sha256` of the committed one, with status 130 both times. The run with no argument was made on `132f0e5c4` only. The two snapshots of the migrations side taken about five minutes apart have the same `sha256`.

The census, the same on both sides of the tree: `CREATE TABLE` 71 (21 in `public`), `CREATE POLICY` 107, `CREATE FUNCTION` 126, `GRANT` 685, `CREATE TRIGGER` 87. A snapshot is 15968 lines.

**Gates of the plan left unrun: none.** Both verify commands were run as written.

**Not run, and not ordered by the plan:** `yarn build`, `yarn test:unit`, `yarn lint:check` and `yarn format:check` as whole gates. The change is one shell script that no workspace builds or imports, and the phase record. Prettier has no parser for a `.sh` file (it says so and exits 2 when given the script by name), so `format:check` does not read it. No `yarn db:*` command, no `supabase` call outside the harness.

**The shared stack.** `docker ps --format '{{.Names}} {{.ID}}'` before the first instance (18:56:54Z) and after the last run: all 24 lines identical, so no container was recreated; the 13 of `openvaa-local` and the 10 of `next-supabase-skimle2` identical by `cmp`. Volumes and networks identical. `isolated-instance.sh list` prints nothing, and no container, volume or network with `openvaa-iso-` in its name is left.

## Task Commits

1. **Task 1: Write the equivalence check** - `2446b0333` (feat)
   - `132f0e5c4` (docs): one comment on the floor constants, written after the floor control showed which tests carry the floor. No statement changed.
2. **Task 2: See the check fail on five planted differences, then pass on the tree** - `25494649d` (docs)

Also: `9ec96b839` (docs), three items found and left alone, in `deferred-items.md`.

## Files Created/Modified

- `apps/supabase/scripts/check-schema-equivalence.sh` - the check. Executable.
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-10-equivalence.md` - the record: thirteen verdict lines, the container lists, each control's output, the floor, the tree, four more ways out, three findings, and what was not measured.
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md` - three items under "From plan 181-10".
- `apps/supabase/supabase/schema/` and `apps/supabase/supabase/migrations/` - **not changed.**

## Decisions Made

- **One instance at a time.** The plan says the two sides are built one after the other and each is stopped before the script exits. The script stops each as soon as its snapshot exists. That halves what the check asks of the Docker disk and means the untried case of two isolated instances at once is not needed.
- **`psql` inside the container, not on the host.** The catalog queries go through `docker exec -i ... psql -f -`, as `pg_dump` does. The check then needs nothing on the host but Docker.
- **A table missing on one side is a difference, not a failed query.** The two row queries test `to_regclass` first and print `<no such table>`. Without that, the floor control would have failed in the query on `private.deployment_settings` before it reached the floor, and a migration that forgot the table would have been reported as "could not run".
- **A warning from `pg_dump` is a failure.** A status of 0 with anything on standard error exits 2: a dump that could not read something must not be compared.
- **The default `--out` is removed on exit.** The diff is printed in full on a difference, so nothing is lost; `--out` keeps the three files.
- **`--reuse-m` and `--migrations-dir` together are a usage error.** A reused snapshot is not built from a directory, and silently ignoring one of the two would hide a mistake.
- **A leftover instance turns the status into 2.** If the teardown fails, the comparison's own status is replaced (unless it is 130), because the next run would be refused and the caller has to know.
- **The floor's numbers are the plan's.** They were not moved to counts of `public` objects, although the table threshold is inert on a whole-database dump. The script's comment and the record say which tests do the work.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] A whole-database dump holds the day it was taken**
- **Found during:** Task 1, on the first trial run that completed
- **Issue:** the dump held 85 lines naming five tables `realtime.messages_2026_10_11` to `realtime.messages_2026_10_15`, on an instance created on 2026-10-12 UTC with no realtime service. The names follow the day the instance is created. Two sides built on either side of midnight UTC, or a `--reuse-m` snapshot from an earlier day, would differ in these lines and nothing else, and the check would exit 1 on an unchanged tree.
- **Fix:** `--exclude-table='realtime.messages_[0-9][0-9][0-9][0-9]_[0-9][0-9]_[0-9][0-9]'` on the dump, and a test after it that exits 2 if any line still names such a table. The header lists the partitions among the things the check cannot see.
- **Verification:** the snapshot went from 16293 to 15968 lines (76 to 71 tables, 695 to 685 grants) and holds no line with a date; both sides still compare equal.
- **What this does not show:** the false difference itself was not produced. No run crossed midnight and no snapshot from another day existed. The cause is read from the names bracketing the build day. The plan's rule for a difference on the unchanged tree ("fix the script's normalisation for a pg_dump artefact only") was applied before such a difference was seen.
- **Committed in:** `2446b0333`

**2. [Rule 2 - Missing Critical] The role-settings query wrote the local JWT secret into the snapshot**
- **Found during:** Task 1, same trial run
- **Issue:** `pg_db_role_setting` holds the database setting `app.settings.jwt_secret`, value included. The snapshot is a file the caller places with `--out`, and a difference in a neighbouring row would print that line.
- **Fix:** a setting whose name holds `secret`, `password`, `token` or `key` is written as `name=<sha256 ...>`, a digest of the setting. Equality is still compared.
- **Verification:** the snapshots of the recorded runs hold one line with `jwt_secret=<sha256 ` and none with another value.
- **Committed in:** `2446b0333`

**3. [Rule 1 - Bug] `ORDER BY 1 COLLATE "C"` is refused by Postgres**
- **Found during:** Task 1, the very first trial run
- **Issue:** the first version ordered the query rows by output position with a collation; Postgres reads `1` there as an integer constant and fails. The script exited 2 and removed its instance, which is the first time its failure path ran.
- **Fix:** each query selects from a subquery and orders by the named column.
- **Committed in:** `2446b0333` (the first version was never committed)

**4. [Rule 2 - Missing Critical] Four exit paths were exercised beyond the plan's controls**
- **Found during:** Task 2
- **Issue:** the plan's controls reach statuses 0, 1 and 2 through the floor only. The dispatch requires the script to tear down on every way out, an error and an interrupt included, and the header promises 130.
- **Fix:** no change to the script was needed. A schema file that does not apply (2), an instance already there (2, and that instance left alone), `SIGTERM` (130) and `SIGINT` to the group (130) were each run; each left no instance, container, volume or working directory of the script's.
- **Committed in:** `25494649d` (the record)

### Scope boundary

`deferred-items.md` has three new items, committed in `9ec96b839`. None was fixed.

---

**Total deviations:** 4 auto-fixed (2 bugs, 2 missing critical), 3 items logged
**Impact on plan:** the two outputs are as the plan describes. The script excludes five platform tables from the comparison and digests one setting, neither of which the plan foresaw; both are stated in its header.

**Rules overruled or not exercised.** The plan allows `docker builder prune -af` on a lack of disk space; the dispatch forbids pruning. No lack of space occurred and nothing was pruned. The broken-windows ledger was not written: there is no stub, skipped test or unrun verify, and `.planning/WINDOWS.md` sits beside the shared `PROJECT.md`.

## Issues Encountered

- **One character of the local JWT secret was shown in the executor's tool output.** While looking for secret-like lines in the first trial snapshot, the matching lines were printed cut to 60 characters, and the line of `app.settings.jwt_secret` showed the first character of its value. The trial snapshots were deleted in the next command, before the fix; a search of `tmp/181-10/` for the setting's name then found no file. No tracked file ever held the value. The instance it belonged to no longer exists. Whether that value is the CLI's published default was not checked.
- **A criterion is met by the script's object line, not by a diff line, in one control.** The plan asks that the record quote, for each control, "a diff line that names the changed ... function". In the function-body control the diff's lines are lines of the body and none holds the function's name. The name is in the line the script prints above the diff (`Name: resolve_email_variables(uuid, uuid[], text, text); Type: FUNCTION; Schema: public`). The other four controls have the name in a diff line as well.
- **A container not of this plan was listed once.** One `docker ps` taken while this summary was being prepared, at about 19:18:30Z, showed a 25th container with a generated name (`xenodochial_satoshi`). It was gone seconds later, before it could be inspected, and the list then equalled the list taken before the plan. The script starts containers only through the harness, under names beginning `supabase_db_openvaa-iso-`, so it was not this plan's. What started it was not found.
- **No git hook ran on the commits** (`core.hooksPath=/dev/null` in this worktree, as before). No commit used `--no-verify`, and none was amended.
- **No command was refused** by a hook or a permission check.

## What a later plan must know

- **Use.** `bash apps/supabase/scripts/check-schema-equivalence.sh` from any directory. It needs Docker, `yarn install`, no instance named `eq-m` or `eq-s`, and the ports 55400 to 55409 and 55500 to 55509 free. A full run takes about 34 s on this host with the image present. It writes its verdict to standard output and the harness's progress to standard error.
- **Statuses.** 0 equal, 1 different, 2 could not run, 130 interrupted. A harness failure of any kind (its 3, 4 or 5) becomes 2.
- **It is not safe to run twice at once.** The instance names are fixed. A second run exits 2 at once with "already exists" and leaves the first run's instance alone.
- **`--reuse-m` trusts the caller.** The script checks that the file passes the floor, not that it is a snapshot of the migrations as they are now. After any change to `migrations/`, build the snapshot again.
- **In the diff, `-` is the migrations side and `+` is the schema side.** The "objects that differ" lines above it are `pg_dump`'s own headers (`Name: ...; Type: ...; Schema: ...`) or `Query: ...` for a row or a setting.
- **The snapshot routine is a function inside the script** (`write_snapshot`), not a command. Plan 181-12 names it as the fallback of the drift check: it has to be copied or the script restructured, and it runs `pg_dump` and `psql` through `docker exec` in a local container, which a hosted project does not have.
- **A whole-database dump of a local instance names the day it was made** (five `realtime.messages_YYYY_MM_DD` partitions), and `pg_db_role_setting` returns `app.settings.jwt_secret` in clear. Any other script that dumps or lists these has to handle both. On a hosted project the partitions are whatever the realtime service has made, and the setting, if present, is a real secret.
- **The counts a later record can compare with:** 71 tables (21 in `public`), 107 policies, 126 functions, 685 grants, 87 triggers, over the whole database less the partitions. A database with no migration applied: 46 tables, 0 policies, 47 functions, 347 grants, 8 triggers.
- **Six extensions are in a built database:** `pg_net` 0.20.4, `pg_stat_statements` 1.11, `pgcrypto` 1.3, `plpgsql` 1.0, `supabase_vault` 0.3.1, `uuid-ossp` 1.1.
- **The first run that can fail for a real reason is after the freeze** (plan 181-17). Until then both sides are one text. If that run exits 1, the difference is either a real disagreement or another artefact of the dump that this plan did not meet; the two known artefacts are handled.
- **Not planted, so not shown:** a difference on the migrations side (a second migration file), a column in another position, a function body that differs only in a comment, a difference in an extension, and a difference in `private.deployment_settings`.
- **Two instances at the same moment are still untried.** This plan did not need them.
- **What was read in part.** `.planning/PROJECT.md`: its opening, Context and Constraints sections, and a search of the rest for `equivalence`, `pg_dump`, `parity guard`, `schema:regenerate` and `isolated`, which found nothing on this plan's topics. `181-RESEARCH.md`: section Q1 and the "Equivalence check" row of the guards table. `181-CONTEXT.md`: D-03 and A-04. `execute-plan.md`: the execute, verification, summary and state steps. `checkpoints.md` was not read: the plan has no checkpoint and none was reached. `181-PATTERNS.md` and `181-VALIDATION.md` were not read: the plan points to neither. Of the `database` skill only the section list was read; no schema file was edited.
- **Scratch state** is in `tmp/181-10/` (ignored): the outputs and statuses of every run, the kept snapshot of the migrations side, the container lists, the fragments the record was assembled from, and the two drivers. No file there holds a key or the secret's value. The scratch copies of `schema/` were outside the repository and have been removed.

## Threat Flags

None. The script opens no listener of its own: while it runs, the harness publishes one Postgres port for each instance, which is the surface plan 181-02 flagged. It reads the database through `docker exec` on the local socket and sends nothing over the network.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 181-15 can wire `check:schema-equivalence` to `bash apps/supabase/scripts/check-schema-equivalence.sh`; the script takes no required argument.
- Plan 181-17, the freeze, has the check it runs after the freeze, and its statuses.
- Plan 181-12 should read the note on the snapshot routine before it plans its fallback.
- Not closed here: SUPA-10 stays open until the last plan of the phase.

## Self-Check: PASSED

- The two created files exist, and `deferred-items.md` has its new section.
- Commits `2446b0333`, `132f0e5c4`, `25494649d` and `9ec96b839` are ancestors of `HEAD`.
- `commits: 4` is `git rev-list --count 750a2efc8..HEAD` at the time of writing, with `HEAD` at `9ec96b839`.
- Task 1 acceptance criteria: the header holds `Exit codes` followed by lines for 0, 1, 2 and 130; the script contains `pg_db_role_setting` (3 times), `pg_extension` (3), `storage.buckets` (5) and `private.deployment_settings` (5); `grep -c -F 'supabase db diff'` prints 0; the four lines that start, stop, list or describe an instance call `isolated-instance.sh`, and the only other Docker calls are two `docker exec` into the container the harness names; `MIN_TABLES`, `MIN_POLICIES` and `MIN_FUNCTIONS` are constants at the top.
- Task 2 acceptance criteria: the five control lines read `=1` and the record quotes each control's output (with the reservation on the function-body control above); `RED_FLOOR_EXIT=2`; `EQUIVALENCE_TREE_EXIT=0`, from the run made after the controls; the census of each side is in the record; `git status --porcelain -- apps/supabase/supabase/schema` prints nothing; the `_openvaa-local` containers are the same before and after, by name and id.
- Plan-level verification: statuses 0, 1 and 2 were each seen; the real `schema/` is unmodified and no instance remains.
- The three must-have truths hold. The second ("names the difference") holds for the function-body control through the script's object line.
- No stub pattern in the files this plan created or changed.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
