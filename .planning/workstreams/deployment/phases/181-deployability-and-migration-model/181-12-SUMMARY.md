---
phase: 181-deployability-and-migration-model
plan: 12
subsystem: database
tags: [supabase, postgres, psql, drift-check, db-diff, migration-history, isolated-instance, red-controls, evidence]

# Dependency graph
requires:
  - phase: 181-02
    provides: apps/supabase/scripts/isolated-instance.sh, HARNESS_DB_MODE=ok and MIGRATION_HISTORY_VERSION_COLUMN=version, the precondition of Task 1
  - phase: 181-06
    provides: the manifest contract (baseline.name, baseline.file, baseline.commit, migrations[].file, migrations[].sha256) and checkFrozenMigrations, which the temporary manifest was given to
  - phase: 181-10
    provides: the port ranges and instance names of the equivalence check, which this plan stays clear of, and the snapshot routine named as the fallback (not used)
  - phase: 181-11
    provides: infra/scripts/ as the place of the deployment scripts, and the rule that psql always gets explicit connection variables
provides:
  - infra/scripts/check-drift.sh, the drift check, with statuses 0 clean, 1 drift, 2 could not run, 130 interrupted
  - evidence/181-12-drift.md, the measurement of supabase db diff and db push --local on this baseline, and the check seen green after a local push and red on planted DDL and on a history mismatch in both directions
  - the measured coverage of the CLI's diff on CLI 2.118.0 (seen and not seen), which corrects one item of the research
  - four facts about the pinned CLI that any later script calling it must handle (JSON output for an agent caller, signals, what a diff leaves on the host, the push's question)
affects: [181-15, 181-17, 181-18, 184, 187, 189]

# Actuals (#2632)
# tokens is chars/4 over the diff plan_head_before..plan_head_after (60964 characters, three files).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 15241
  tasks: 3
  commits: 4
plan_head_before: 206a4f3ace888e53dd6b73949e323571508ebe31
plan_head_after: 326ba46254a85e8956ce721261748ccfca67ff73

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A script that reads the Supabase CLI's standard output passes --agent no --output-format text: the CLI answers in JSON when it detects an agent caller"
    - "A script that starts the Supabase CLI and may be interrupted signals every process below the CLI wrapper, not the wrapper alone: only the binary under the wrapper removes the containers it started"
    - "A check with two parts that ask a database through two tools refuses to run unless both are shown to name the same database"
    - "A clean verdict needs the tool's own statement that nothing differs, not only an empty output file"

key-files:
  created:
    - infra/scripts/check-drift.sh
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-12-drift.md
  modified:
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md

key-decisions:
  - "181-12: infra/scripts/check-drift.sh has two parts and one status. History: the five-digit versions of the manifest's migrations[].file, in order, against supabase_migrations.schema_migrations read with psql over the PG* variables. Schema: supabase db diff for the target, with no schema list, in text output written to a file; any byte is drift and the file is printed. Statuses 0 clean, 1 drift, 2 could not run, 130 interrupted. A part that found drift decides the status even when the other part could not run. Flags --manifest, --workdir, --target local|linked, --out."
  - "181-12: research assumption A2 is recorded as held, with a condition the plan did not foresee. On a build of the baseline the diff is empty with no schema flag, with --schema public and with --schema public,private,storage, and the CLI exits 0. But the command as the plan writes it never gives zero bytes in an agent's shell: the CLI detects its caller and answers with a JSON envelope whose diff member is a newline (114, 122 and 142 bytes). With --agent no or --output-format text standard output is zero bytes. The check passes both flags, refuses an answer that begins with a brace, and counts an empty file as clean only when the CLI also says No schema changes found."
  - "181-12: the check gives the diff no schema list. Planted on the instance, the default set reported a column in public, a column in private, a policy on storage.objects, a function and a schema created by hand; --schema public,private,storage did not report the new schema and --schema public reported neither private nor storage."
  - "181-12: the header names four blind spots, not the plan's five. A row, a column privilege, a comment and a role setting each left the diff empty. A policy whose USING expression was changed with ALTER POLICY was reported, as a drop and a create, against what the research and the plan expect; a table privilege was reported too."
  - "181-12: for --target local the check refuses to run, with status 2, unless PGHOST is a loopback address and PGPORT is the [db] port of the work directory's config.toml, and it refuses when neither PGHOST nor PGSERVICE is set. Without that, a caller who exports a connection and forgets --workdir gets a verdict made of two databases, and the diff is started on the shared stack's shadow port. The plan's control 6 (PGPORT on a closed port) is therefore answered by this refusal, and a failing psql is shown by an added control."
  - "181-12: research assumption A10 held: db push --local accepted 00002_probe.sql, applied it after the baseline and recorded version 00002."
  - "181-12: on an interrupt the check sends SIGTERM to every process below the CLI wrapper and to the wrapper, then waits. Measured on the CLI alone: a signal to the wrapper alone ends it with 130 and leaves the shadow database running on the shadow port; SIGTERM or SIGINT to the whole tree removes it; SIGHUP to the whole tree leaves a container in the state Created."

patterns-established:
  - "A red control whose first trial leaves something behind is itself a finding: the interrupt control was run before the commit, found a running shadow database, and the script was changed before it was recorded"
  - "A count taken from a helper's status is checked against what the helper printed: the first call of the frozen-mode checker exited 0 without reaching the checker"

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan builds the drift-check clause only: SUPA-10 is NOT closed and was not marked
# complete (requirements.ready-ids answered "0/1 requirement(s) ready to mark complete").
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "The drift check exists in the house shape: a header with purpose, usage, prerequisites, blind spots and an exit-code table; no flag for a database address; the diff's output never piped"
    requirement: SUPA-10
    verification:
      - kind: other
        ref: "Task 2 <verify><automated> of 181-12-PLAN.md, run verbatim on commit 326ba4625: exit 0 (bash -n, executable, a missing manifest exits 2 before anything is started)"
        status: pass
      - kind: other
        ref: "prettier --check infra: exit 0; grep counts on the script: 4 exit-code lines, 0 mentions of url, 0 address literals, 0 lines piping the diff, 0 set -x"
        status: pass
    human_judgment: false
  - id: D2
    description: "What supabase db diff prints and returns on a clean database built from this baseline, and that db push --local accepts a five-digit version, are measured before the check is written"
    requirement: SUPA-10
    verification:
      - kind: integration
        ref: "evidence/181-12-drift.md part 1 (commit 1776f8e7e, before the script's commit b051fb267): DIFF_EXIT_NO_FLAG=0, DIFF_EXIT_PUBLIC=0, DIFF_EXIT_OWNED=0, PUSH_LOCAL_EXIT=0, HISTORY_AFTER_PUSH=00001 00002, A10=held; Task 1 <verify><automated> run verbatim: exit 0"
        status: pass
    human_judgment: true
    rationale: "A2 is recorded as held on a reading the plan does not state. The plan defines held as zero bytes of standard output on the clean build. The command as the plan writes it gave 114, 122 and 142 bytes, a JSON envelope carrying an empty diff, because the CLI detected an agent caller. Zero bytes was seen with text output selected: for no schema flag on the baseline alone, and for the other two sets only after the push. Whether that may stand for the plan's words, and whether the dump-comparison fallback should have been built instead, is for the verifier."
  - id: D3
    description: "After a push to a local database the check exits 0; with a column planted it exits 1 and names it, and 0 again after the drop; with a manifest version never pushed, and with a recorded version the manifest lacks, it exits 1 and names the version"
    requirement: SUPA-10
    verification:
      - kind: integration
        ref: "evidence/181-12-drift.md part 2, on commit b051fb267: DRIFT_CLEAN_EXIT=0, DRIFT_PLANTED_DDL_EXIT=1, DRIFT_AFTER_DROP_EXIT=0, DRIFT_HISTORY_MISSING_EXIT=1, DRIFT_HISTORY_EXTRA_EXIT=1, each with its output quoted; Task 3 <verify><automated> run verbatim on commit 326ba4625: exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "The check's blind spots are written in its header, and one of them is seen and recorded"
    requirement: SUPA-10
    verification:
      - kind: integration
        ref: "same record: DRIFT_COLUMN_REVOKE_EXIT=0 with has_column_privilege answering t, f, t, and BLIND_SPOT_COLUMN_PRIVILEGE=confirmed; part 1: DIFF_SEES_ROW=no, DIFF_SEES_COLUMN_PRIVILEGE=no, DIFF_SEES_COMMENT=no, DIFF_SEES_ROLE_SETTING=no, DIFF_SEES_CHANGED_POLICY_EXPRESSION=yes"
        status: pass
    human_judgment: true
    rationale: "The header departs from the plan's wording on purpose: the plan orders five blind spots including alter policy statements, and the header names four, because a changed policy expression was reported by the diff. A reader has to accept the measurement over the plan's list. Only the USING expression was changed; a changed role list or WITH CHECK was not tried."
  - id: D5
    description: "The check exits 2, not 1 and not 0, when it could not run, and 130 on an interrupt with no shadow database left"
    requirement: SUPA-10
    verification:
      - kind: integration
        ref: "same record: DRIFT_CANNOT_RUN_EXIT=2, DRIFT_PSQL_FAILS_EXIT=2, DRIFT_CLI_FAILS_EXIT=2, DRIFT_NO_PGHOST_EXIT=2, DRIFT_OTHER_WORKDIR_EXIT=2, DRIFT_MANIFEST_NOT_JSON_EXIT=2, DRIFT_MANIFEST_BAD_NAME_EXIT=2, DRIFT_CLI_ANSWERS_JSON_EXIT=2, DRIFT_CLI_SAYS_NOTHING_EXIT=2; DRIFT_SIGTERM_EARLY_EXIT=130, DRIFT_SIGTERM_LATE_EXIT=130, DRIFT_SIGINT_GROUP_EXIT=130, SHADOW_LEFT_AFTER_INTERRUPT=no"
        status: pass
    human_judgment: false
  - id: D6
    description: "No isolated instance remains and the shared stack is unchanged"
    verification:
      - kind: integration
        ref: "same record: INSTANCE_STOPPED=yes, SHARED_STACK_UNTOUCHED=yes; all 24 containers identical by name and id before the first start and after the stop, the 13 of openvaa-local and the 10 of next-supabase-skimle2 by cmp; volumes, networks and images identical"
        status: pass
    human_judgment: false
  - id: D7
    description: "The check works against a linked hosted project (--target linked)"
    requirement: SUPA-10
    verification: []
    human_judgment: true
    rationale: "Never run. The flag is passed to the CLI as --linked and nothing else is known: nothing is linked, no hosted project was touched, and whether the diff with no schema list is empty on a clean hosted database is unobserved. Phase 184 is the first place it can be seen, and it has to see the check red there before it trusts a green."

# Metrics
duration: 31min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 12: The Drift Check Summary

**`infra/scripts/check-drift.sh` compares the manifest's versions with `supabase_migrations.schema_migrations` and runs `supabase db diff` in text output against the target; on an isolated instance it exited 0 after `supabase db push --local`, 1 naming the object for a planted column and for a history mismatch in each direction, 0 for a revoked column privilege (the blind spot its header names), 2 when it could not run and 130 on an interrupt with no shadow database left. Two results differ from what the plan expects: the diff's standard output is never empty when an agent calls the CLI, and a changed policy expression is seen by the diff. Only a local database was used; `--target linked` was never run.**

## Performance

- **Duration:** 31 min
- **Started:** 2026-10-12T20:13:25Z
- **Completed:** 2026-10-12T20:44:00Z (last commit before this summary)
- **Tasks:** 3 of 3
- **Files modified:** 3 (2 new, 1 changed)

## Accomplishments

- The measurement the plan orders first, on the instance `drift` (port base 55900): the diff three ways on the baseline alone, a second migration `00002_probe.sql` pushed with `--local`, and the diff again. Beyond the plan: the same runs with text output selected, five planted changes to see what each schema set reports, and six planted one at a time to see what the diff does not report.
- The script, 405 lines, Bash 3.2 compatible, in the shape of `isolated-instance.sh` and `check-schema-equivalence.sh`.
- The six controls the plan orders, on the committed script, and eighteen more runs for the statuses and branches the six do not reach.
- The instance stopped, and what the diff had left on the host found and, where it was Docker's, removed.

## Recorded statuses

Every status was read from `$?` of the command itself by a driver script, with standard output and standard error in files of their own under `tmp/181-12/` (ignored by git). None was read through a pipe. Nothing here went through turbo. The verdict lines of the record were written by the shell from the status files.

The lines the plan names, from `evidence/181-12-drift.md`:

| Key | Value | Where |
|-----|-------|-------|
| `DIFF_EXIT_NO_FLAG`, `DIFF_STDOUT_BYTES_NO_FLAG` | `0`, `114` | baseline alone, command as ordered |
| `DIFF_EXIT_PUBLIC`, `DIFF_STDOUT_BYTES_PUBLIC` | `0`, `122` | same |
| `DIFF_EXIT_OWNED`, `DIFF_STDOUT_BYTES_OWNED` | `0`, `142` | same |
| `A2` | `held (schema set: none given, the CLI's default; zero bytes only with text output selected)` | see "A2, as it was read" |
| `PUSH_LOCAL_EXIT` | `0` | `supabase db push --local --workdir <ISO_WORKDIR>` |
| `HISTORY_AFTER_PUSH` | `00001 00002` | |
| `A10` | `held` | |
| `DRIFT_CLEAN_EXIT` | `0` | commit `b051fb267`, after the push |
| `DRIFT_PLANTED_DDL_EXIT` | `1` | names `"planted"` on `"drift_probe"`; `DRIFT_AFTER_DROP_EXIT=0` |
| `DRIFT_HISTORY_MISSING_EXIT` | `1` | names `00003 (00003_never_pushed.sql)` |
| `DRIFT_HISTORY_EXTRA_EXIT` | `1` | names `00002` |
| `DRIFT_COLUMN_REVOKE_EXIT` | `0` | `BLIND_SPOT_COLUMN_PRIVILEGE=confirmed` |
| `DRIFT_CANNOT_RUN_EXIT` | `2` | by refusal, before either part runs |

Lines this plan added (35 in all; the ones a reader should not miss):

| Key | Value | Meaning |
|-----|-------|---------|
| `DIFF_STDOUT_AS_ORDERED` | one line of JSON whose diff member is a newline, in all three | why the byte counts above are not zero |
| `DIFF_STDOUT_BYTES_NO_FLAG_TEXT` | `0` | the baseline alone, with `--agent no`, and again with `--output-format text` |
| `DIFF_STDOUT_BYTES_PUBLIC_TEXT_AFTER_PUSH`, `DIFF_STDOUT_BYTES_OWNED_TEXT_AFTER_PUSH` | `0`, `0` | text output, after the push, not on the baseline alone |
| `SCHEMA_SET_CHOSEN` | `none` | the widest set that was empty on the clean build |
| `DIFF_SEES_ROW`, `DIFF_SEES_COLUMN_PRIVILEGE`, `DIFF_SEES_COMMENT`, `DIFF_SEES_ROLE_SETTING` | `no` each | the four blind spots of the header |
| `DIFF_SEES_CHANGED_POLICY_EXPRESSION`, `DIFF_SEES_TABLE_PRIVILEGE` | `yes`, `yes` | the first against the research and the plan |
| `DRIFT_BOTH_PARTS_IN_ONE_REPORT_EXIT` | `1` | one run names `00003` and prints `drop table "public"."never_pushed";` |
| `DRIFT_PSQL_FAILS_EXIT`, `DRIFT_CLI_FAILS_EXIT` | `2`, `2` | one part could not run, the other held |
| `DRIFT_AND_CANNOT_RUN_EXIT` | `1` | drift from one part while the other could not run |
| `DRIFT_NO_PGHOST_EXIT`, `DRIFT_OTHER_WORKDIR_EXIT` | `2`, `2` | the two refusals that keep the parts on one database |
| `DRIFT_NO_HISTORY_TABLE_EXIT` | `1` | the table renamed away: reported as no history |
| `DRIFT_CLI_ANSWERS_JSON_EXIT`, `DRIFT_CLI_SAYS_NOTHING_EXIT`, `DRIFT_STANDIN_CONTROL_EXIT` | `2`, `2`, `0` | a copy of the script beside a stand-in CLI |
| `DRIFT_SIGTERM_EARLY_EXIT`, `DRIFT_SIGTERM_LATE_EXIT`, `DRIFT_SIGINT_GROUP_EXIT` | `130` each | `SHADOW_LEFT_AFTER_INTERRUPT=no` |
| `MANIFEST_PASSES_FREEZE_CHECKER` | `yes` | with a red control; see "Issues Encountered" |
| `PUSH_TEXT_MODE_NO_TERMINAL_EXIT` | `0` | the push prints `[Y/n]` and goes on |
| `INSTANCE_STOPPED`, `SHARED_STACK_UNTOUCHED` | `yes`, `yes` | |

Command statuses:

| Command | Tree | Status |
|---------|------|--------|
| `isolated-instance.sh start --name drift --mode db --port-base 55900 --migrations apps/supabase/supabase/migrations` | `206a4f3ac` | 0 (16 s) |
| Task 1 verify, verbatim | working tree before `1776f8e7e`, and again on `326ba4625` | 0, 0 |
| Task 2 verify, verbatim | working tree before `b051fb267`, and again on `326ba4625` | 0, 0 |
| `prettier --check infra` | working tree before `b051fb267`, and `326ba4625` | 0, 0 |
| `node scripts/assert-declared-binaries.mjs` | working tree before `b051fb267` | 0 |
| `node scripts/assert-comment-hygiene.mjs` | `326ba4625` | 0 (1972 files; it does not scan `infra/`) |
| The six controls and the added ones | `b051fb267`, no tracked change | as in the tables above |
| Task 3 verify, verbatim | working tree before `318422528`, and again on `326ba4625` | 0, 0 |
| `isolated-instance.sh stop --name drift` | `b051fb267` | 0 |

**Gates of the plan left unrun: none.** The three verify commands were each run as written.

**Not run, and not ordered by the plan:** `yarn build`, `yarn test:unit`, `yarn lint:check` and `yarn format:check` as whole gates (of the last, only prettier over `infra`). The change is one shell script that no workspace builds or imports, and the phase record. Prettier has no parser for a `.sh` file. No `yarn db:*` command, no pgTAP, no `supabase status`, no `supabase link`.

**The shared stack.** `docker ps -a --format '{{.Names}} {{.ID}}'` before the first start (20:13Z) and after the stop (20:39Z): all 24 lines identical, the 13 of `openvaa-local` and the 10 of `next-supabase-skimle2` identical by `cmp`, `my-redis` identical. Volumes, networks and images identical. No container with `openvaa-iso-` in its name is left, and the harness lists no instance. Every `supabase` call carried `--workdir` of the instance and, where the command takes a target, `--local`. Before the first diff the instance's copied `config.toml` was read: project id `openvaa-iso-drift`, database port 55901, shadow port 55902; no `project-ref` file in the instance or in `apps/supabase/supabase/.temp`; no `SUPABASE_*` variable in the shell.

## A2, as it was read

The plan defines `A2=held` as "at least one schema set gives zero bytes on the clean build". The command the plan writes gave 114, 122 and 142 bytes. Each is one line of JSON with `"diff":"\n"`, and standard error of each ends with `No schema changes found`. The CLI has a flag `--agent` ("Override agent detection") and chose JSON because this session's shell marks an agent caller. With `--agent no`, and again with `--output-format text`, the run with no schema flag on the baseline alone gave zero bytes.

So the diff is empty and A2 is recorded as held. The plan's rule for the check ("a file larger than zero bytes is drift") is kept, with the output format selected by the script. The other reading, that zero bytes was not seen with the plan's command and the dump-comparison fallback should be built, was not taken. **This is the executor's reading and it has not been ruled on** (coverage D2).

## Task Commits

1. **Task 1: Measure supabase db diff and db push on a clean isolated instance** - `1776f8e7e` (docs)
2. **Task 2: Write the drift check** - `b051fb267` (feat)
3. **Task 3: See the drift check green after a local push, and red on planted drift** - `318422528` (docs)

Also: `326ba4625` (docs), seven items found and left alone, in `deferred-items.md`.

## Files Created/Modified

- `infra/scripts/check-drift.sh` - the check. Executable.
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-12-drift.md` - the record, in two parts: 52 verdict lines, then each measurement and each control with its output.
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md` - seven items under "From plan 181-12".
- `infra/local/` (plan 181-13's), `infra/scripts/bootstrap.sql`, `infra/scripts/check-seed.sql`, `apps/supabase/` - **not changed.**

## Decisions Made

- **No schema list.** All three sets were empty on the clean build, so the plan's rule ("the schema set Task 1 found empty") does not choose. The default set is the widest: it alone reported a schema created by hand. It is a constant of the call, not a flag.
- **A part that found drift decides the status.** The plan gives 1 to drift and 2 to "could not run" and does not say which wins. With drift from one part and the other unable to run, the status is 1: the drift is known, and a caller who reads only the status must not take it for a tool failure. The header says so.
- **A database without the history table is drift, not a failed query.** The script asks `to_regclass` first, as the equivalence check does for its tables.
- **The CLI's own statement is needed for a clean verdict.** An empty file alone is also what a command that did nothing leaves.
- **`psql` on the host, and a connect timeout of 15 s when `PGCONNECT_TIMEOUT` is not set.** The plan orders the `PG*` connection; a connection attempt that gets no answer must not keep the check from returning a status.
- **The manifest is read with `node`.** The CLI is a Node program, so `node` is already a prerequisite. A manifest that is not JSON, has no non-empty `migrations` array, or has an entry whose file does not begin with five digits and an underscore is "cannot be read" (2). The naming rules beyond that are the parity guard's.
- **`pgrep` is a prerequisite.** The interrupt path uses it to find the processes below the CLI wrapper.
- **The fallback was not built.** A2 was read as held.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] "A file larger than zero bytes is drift" is false for an agent caller**
- **Found during:** Task 1, the first diff
- **Issue:** the CLI detects its caller and answers in JSON, so standard output is never empty. A check built on the plan's rule would be red for an agent on a clean database and green for a person.
- **Fix:** the script passes `--agent no --output-format text`. It also exits 2 when the output begins with a brace, and when the file is empty and the CLI did not say `No schema changes found`.
- **Verification:** the clean build gave zero bytes with each flag and with both; the two refusals were seen with a stand-in CLI beside a byte-identical copy of the script (2 and 2, with a control at 0)
- **Committed in:** `b051fb267`

**2. [Rule 2 - Missing Critical] The two parts could judge two different databases**
- **Found during:** Task 2
- **Issue:** the diff asks the database the work directory's configuration names; the history query asks the one the `PG*` variables name. Nothing tied them together. With the plan's defaults, a caller who exports a connection and forgets `--workdir` would have the diff started on the shared stack, publishing a shadow database on port 54320, and a verdict made of two databases. With no `PGHOST`, `psql` tries a local socket.
- **Fix:** for `--target local`, status 2 unless `PGHOST` is a loopback address and `PGPORT` is the `[db]` port of the work directory's `config.toml`; status 2 when neither `PGHOST` nor `PGSERVICE` is set. Every refusal comes before either part runs. For `--target linked` the script cannot tell, and the header says the caller answers for it.
- **Verification:** `DRIFT_OTHER_WORKDIR_EXIT=2`, `DRIFT_NO_PGHOST_EXIT=2`, `DRIFT_CANNOT_RUN_EXIT=2`
- **Effect on the plan's control 6:** `PGPORT` on a closed port is answered by this refusal, so that run does not show a failing `psql`. `DRIFT_PSQL_FAILS_EXIT=2` does.
- **Committed in:** `b051fb267`

**3. [Rule 1 - Bug] An interrupted check left its shadow database running**
- **Found during:** Task 3, a trial of an added interrupt control before the script was committed
- **Issue:** the first version passed `SIGTERM` to the CLI process it had started. The CLI is a Node wrapper around a binary; the wrapper ended, the binary ended without cleaning up, and a Postgres container stayed published on port 55902. The next run exited 2 on the taken port and the CLI left a second container, in the state `Created`.
- **Fix:** on an interrupt the script sends `SIGTERM` to every process below the wrapper and to the wrapper, whatever signal it received, and waits. `pgrep` became a prerequisite.
- **Verification:** `SIGTERM` at two moments and `SIGINT` to the process group, each 130 with no container left, on the committed script
- **Cleanup:** the two containers of the trial and two more left by probes of the CLI alone were removed by id. Each carried the label of the instance's project id and none was in the list of before the plan.
- **Committed in:** `b051fb267`

**4. [Rule 1 - Bug] The header would have named a blind spot that is not one**
- **Found during:** Task 1
- **Issue:** the plan orders the header to say that the diff does not see `alter policy` statements. A policy whose `USING` expression was changed was reported.
- **Fix:** the header names four blind spots and says that a table privilege and a changed `USING` expression are reported.
- **Committed in:** `b051fb267`

### By instruction, not by the plan

**5. Port base 55900.** The plan's command has no `--port-base`; the harness's default is 55400, which the equivalence check uses. The dispatch orders a base outside 55400 to 55409, 55500 to 55509 and 54320 to 54340.

**6. `docker builder prune` was not needed and not run.** No lack of space occurred.

### Observations added to the plan's

Thirty-five verdict lines beside the plan's seventeen, and the probes of the CLI's signal handling. None changed a tracked file other than the record.

### Scope boundary

`deferred-items.md` has seven new items, committed in `326ba4625`. None was fixed.

---

**Total deviations:** 4 auto-fixed (3 bugs, 1 missing critical), 2 by instruction, 7 items logged
**Impact on plan:** the outputs are the plan's, and the script's flags are the four the plan lists. The script differs from the plan's text in the two flags it gives the CLI, in the refusals before it runs, in its interrupt path, and in one line of the header's blind spots.

**Not written: the broken-windows ledger.** There is no stub, skipped test or unrun verify, and `.planning/WINDOWS.md` sits beside the shared `PROJECT.md`, as in the earlier plans of this phase.

## Issues Encountered

- **One command was refused by a safety check and was not run.** It was a single line that tested the script's redaction function through `bash -c` with an `eval`, then deleted the scratch sample file it had written (`tmp/181-12/redact-sample.txt`), then started the interrupt trial. The check could not read the inline script and refused the whole line. The removal was given up: the sample file was never created, the redaction was tested from a driver file with the sample on standard input, and nothing was deleted in its place.
- **The interrupt trial left containers** (deviation 3). They were this plan's own and were removed by id. The shared stack's containers were not among them: the list by name and id is unchanged.
- **Three things the diff left on the host.** A Docker volume without a label, `supabase_edge_runtime_openvaa-iso-drift`, which the harness's `stop` does not look for; it was removed by name. A file in the home directory, `~/.supabase/cache/shadow-baseline/shadow-baseline-ee4907d4966e767c.tar`, 51 MB, created by the first diff; **it was left in place and is still there.** And `~/.supabase/telemetry.json`, which the CLI writes on its runs.
- **The first call of the frozen-mode checker did not reach the checker.** The driver gave the guard's path to `node -e` as its first argument; the guard took itself for the program that was started, printed its own verdict and ended with status 0. The assembler refused to write `yes` because the output was not empty. The check was made again after the instance was stopped, over a directory rebuilt from the same two files (the checker compares their sha256 with the manifest's): no finding, and one finding for a copy with a changed hash.
- **One shell line was cut short by zsh** (`echo ======` is not a command there), so two probes of the CLI were run again. Nothing was left by it.
- **The table of CLI signal probes in the record was read from the session's output**, not from saved status files. The record says so.
- **`.planning/PROJECT.md` was not read.** The plan lists it in no task, and its topics (`db diff`, drift, shadow database) were not searched for in it. `181-RESEARCH.md`: section Q5, Pattern 4, the open questions and row 4c. `181-CONTEXT.md`: D-05, D-11 and A-05. `checkpoints.md` was not read: the plan has no checkpoint and none was reached. `181-PATTERNS.md` and `181-VALIDATION.md` were not read. Of `181-01-SUMMARY.md` and `181-02-SUMMARY.md`, the toolchain notes and the second half. No skill file was read: no schema file was touched.
- **No git hook ran on the commits** (`core.hooksPath=/dev/null` in this worktree, as before). No commit used `--no-verify`, and none was amended.

## What a later plan must know

- **Use.** Export the `PG*` variables of the database, then `bash infra/scripts/check-drift.sh --manifest <path> --workdir <dir>`. It needs Docker, `yarn install`, `psql`, `pgrep` and `node`. A run takes 5 to 8 s on this host once the CLI's cache exists; the first diff of a host takes about 20 s. The verdict is on standard output, progress and tool errors on standard error.
- **The defaults are not safe to use here yet.** The default `--manifest` does not exist before the freeze (status 2). The default `--workdir` is `apps/supabase`: with `--target local` the diff then publishes its shadow database on port 54320 under the project id `openvaa-local`, beside the shared stack. The script refuses unless `PGPORT` is that directory's database port, so it cannot happen by a forgotten flag, but a caller who exports the shared stack's connection gets exactly that. Plan 181-18 gives both flags.
- **Statuses.** 0 clean; 1 drift (also when the other part could not run); 2 could not run; 130 interrupted.
- **`--target linked` is unobserved.** Before phase 184 trusts a green there it has to see the check red on a planted change, and it has to find out whether the diff with no schema list is empty on a clean hosted database. If it is not, the set is narrowed in the script with that evidence; `--schema public,private,storage` was empty locally and misses a schema created by hand. Nothing ties the script's `PG*` connection to the linked project.
- **What a green does not show.** Rows, column privileges, comments and role settings. A green drift check on a deployment does not show that its column grants are the repository's. The equivalence check covers them between the two source trees; nothing yet covers them on a deployed database.
- **The history part compares versions, not file hashes.** An edited migration with the same version passes it.
- **Any script that reads the CLI's standard output** has to pass `--agent no --output-format text` or parse the JSON. An agent and a person otherwise get different output from the same command. `supabase db push` behaves the same way.
- **Any script that may be interrupted while the CLI runs** has to signal the processes below `node_modules/.bin/supabase`, not that process alone, and with `SIGTERM` or `SIGINT`, not `SIGHUP`.
- **`supabase db push` with no terminal does not stop at its question.** In text mode it prints `[Y/n]` and applies; under caller detection it asks nothing.
- **After a `supabase db diff` on an isolated instance, remove the volume `supabase_edge_runtime_openvaa-iso-<name>` by name.** The harness's `stop` exits 0 and leaves it.
- **The diff caches a baseline in `~/.supabase/cache/shadow-baseline/`.** Later diffs on this host restore it and skip the platform's initialisation. If a diff ever reports differences in platform objects on a clean database, look there first.
- **Planted and not seen, for a later record to compare with:** a changed policy role list, a changed `WITH CHECK`, a trigger, an index, an extension and a change in a platform schema other than a policy on `storage.objects` were not planted.
- **Scratch state** is in `tmp/181-12/` (ignored): the drivers, their helper, the outputs and statuses of every run, the fragments and the two assemblers of the record, and the container lists. No file there holds a key; the instance's connection was never written to a file.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: network-listener | `infra/scripts/check-drift.sh` | While the diff runs, the CLI publishes a shadow Postgres on all interfaces, on the shadow port of the work directory's configuration, with the CLI's public local password. It lasts seconds and is removed when the diff returns or is interrupted; a `SIGKILL` of the script leaves it. Not in the plan's register. |
| threat_flag: file-write-outside-repository | `infra/scripts/check-drift.sh` | The CLI's diff writes a cache file into the home directory of the user who runs the check. Not in the plan's register. |

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 181-15 can wire a script key to `bash infra/scripts/check-drift.sh`; it should not put it in a chain that runs without arguments.
- Plan 181-18 runs the check once more against the real manifest, on an isolated instance, with both flags.
- Phases 184 and 187 have the check and its statuses, and the list above of what is unobserved on a hosted project.
- Criterion 4's drift clause is observed locally. Not closed here: SUPA-10 stays open until the last plan of the phase.

## Self-Check: PASSED

- The two created files exist, and `deferred-items.md` has its new section.
- Commits `1776f8e7e`, `b051fb267`, `318422528` and `326ba4625` are ancestors of `HEAD`.
- `commits: 4` is `git rev-list --count 206a4f3ac..HEAD` at the time of writing, with `HEAD` at `326ba4625`.
- Task 1 acceptance criteria: the record holds the status and the standard-output size of all three diff runs; `A2=` has a verdict and names the schema set; `PUSH_LOCAL_EXIT=0` and `HISTORY_AFTER_PUSH=00001 00002`; the push command line in the record carries `--local` and `--workdir`.
- Task 2 acceptance criteria: the header holds `Exit codes` with lines for 0, 1, 2 and 130 and a paragraph naming column privileges and role settings as not seen; the script contains `schema_migrations` and `--manifest`; it has no flag whose name contains `url` and no address literal; no line pipes the diff's output; `prettier --check infra` exits 0. One criterion is met in a narrower form than the plan's task text: the header's paragraph does not name `alter policy` as unseen (deviation 4).
- Task 3 acceptance criteria: `DRIFT_CLEAN_EXIT=0` after a `supabase db push --local`; `DRIFT_PLANTED_DDL_EXIT=1` with the line quoted and 0 after the drop; both history controls `=1` with the version quoted; `DRIFT_COLUMN_REVOKE_EXIT=0` with `BLIND_SPOT_COLUMN_PRIVILEGE=confirmed`; `DRIFT_CANNOT_RUN_EXIT=2`; the `_openvaa-local` containers are the same before and after.
- Plan-level verification: A2 and A10 are recorded in a commit before the script's; statuses 0, 1 (three ways and more) and 2 were each seen; no isolated instance remains and the shared stack is unchanged.
- The four must-have truths hold, the first with the reservation on A2 above.
- No stub pattern in the files this plan created or changed.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
