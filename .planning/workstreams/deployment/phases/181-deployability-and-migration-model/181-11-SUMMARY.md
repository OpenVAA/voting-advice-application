---
phase: 181-deployability-and-migration-model
plan: 11
subsystem: database
tags: [supabase, postgres, psql, bootstrap, seed-check, service-role-key, isolated-instance, red-controls, evidence]

# Dependency graph
requires:
  - phase: 181-02
    provides: apps/supabase/scripts/isolated-instance.sh and HARNESS_DB_MODE=ok, the precondition of Task 1
  - phase: 181-07
    provides: .prettierignore ending in the migrations entry, with the bootstrap's entry left for this plan
  - phase: 181-08
    provides: the schema comments that name infra/scripts/bootstrap.sql as the writer of a deployment's rows, and the fact that an unseeded isolated instance holds no storage_config row
  - phase: 181-10
    provides: the port ranges and instance names of the equivalence check, which this plan stays clear of
provides:
  - infra/scripts/bootstrap.sql, the idempotent bootstrap run by psql as postgres, reading eight environment variables
  - infra/scripts/check-seed.sql, the seed check whose psql exit status is its verdict
  - evidence/181-11-bootstrap-and-seed-check.md, the bootstrap seen twice green and refused five ways, the key absent from the server log, and the seed check seen red on a seeded database and green on a bootstrapped one
  - the environment variable names BOOTSTRAP_STORAGE_URL, BOOTSTRAP_BEHIND_CLOUDFLARE, BOOTSTRAP_ACCOUNT_NAME, BOOTSTRAP_PROJECT_NAME, BOOTSTRAP_DEFAULT_LOCALE and BOOTSTRAP_OPEN_FOR_VOTERS, for phase 184
  - the measured logging settings of the local database image, and the list of settings phase 184 must read on the hosted project
affects: [181-12, 181-15, 181-17, 181-18, 184, 187, 189]

# Actuals (#2632)
# tokens is chars/4 over the diff plan_head_before..plan_head_after (65551 characters, five files).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 16388
  tasks: 3
  commits: 4
plan_head_before: 6a720f9ae44270f6678183149dbeeb885986ad4a
plan_head_after: 0ce2d464693d36d1d8a24830f97aded2e1fd25a6

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A psql script takes a secret from the environment with \\getenv and hands it to its statement with \\bind, so the secret is on no command line and in no statement's text"
    - "A psql script that binds a secret sets log_parameter_max_length_on_error = 0 for its session first: that setting is the one of the parameter-logging settings any role may change"
    - "A check written as one DO block that collects findings and raises once: psql's own status is the verdict, with no wrapper between"
    - "A count of zero in a log is recorded beside a count that shows the log did hold the event, and beside a copy of the script that puts the searched value there"

key-files:
  created:
    - infra/scripts/bootstrap.sql
    - infra/scripts/check-seed.sql
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-11-bootstrap-and-seed-check.md
  modified:
    - .prettierignore
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md

key-decisions:
  - "181-11: infra/scripts/bootstrap.sql is run as psql -X -f infra/scripts/bootstrap.sql over a direct connection as postgres given in the PG* variables. It reads PUBLIC_PROJECT_ID, BOOTSTRAP_STORAGE_URL, SUPABASE_SERVICE_ROLE_KEY and BOOTSTRAP_BEHIND_CLOUDFLARE (required) and BOOTSTRAP_ACCOUNT_NAME, BOOTSTRAP_PROJECT_NAME, BOOTSTRAP_DEFAULT_LOCALE and BOOTSTRAP_OPEN_FOR_VOTERS (defaults Default Account, Default Project, en, false). In one transaction it inserts the account 00000000-0000-0000-0000-000000000001, the project and its app_settings row with ON CONFLICT DO NOTHING, and upserts the two storage_config rows and the deployment_settings row. Statuses: 0 done, 3 refused with nothing written, 2 no connection."
  - "181-11: a required variable that is empty or holds only whitespace counts as not set, and an empty optional variable takes its default. The plan orders a test of whether the variable is defined; a blank line in an environment file defines it, and the script would have stored an empty key and exited 0. The script also unsets each psql variable before it reads the environment, so a value given with -v or by an including script is never used."
  - "181-11: the service-role key reaches its two statements as a bound parameter, and the script sets log_parameter_max_length_on_error = 0 for its session as its first statement. Measured on the local image: with the key statement made to fail, the key is in neither the server log nor psql's output; a copy with the key in the statement's text logs it; and on a connection that sets the parameter to -1, a copy without the SET line puts the key in the server log and in psql's output, while the committed script does not."
  - "181-11: infra/scripts/check-seed.sql raises one error that lists every finding: a row of auth.users in the openvaa.test domain or with one of the seed's two ids; a supabase_url row that is absent, does not begin with https://, or names kong, localhost, 127.0.0.1 or host.docker.internal as a whole word; a service_role_key that is a JWT whose issuer is supabase-demo. It prints no key, and of a seed user found by id only it prints the id and not the address. Statuses: 0 clean, 3 a finding (message begins check-seed:), 2 no connection."
  - "181-11: the local-host names are matched as whole words, where the plan says the address 'contains kong'. https://hongkong-vaa.example.test passes and https://supabase_kong_openvaa-local:8000 is refused."
  - "181-11: both scripts are named in .prettierignore. The SQL plugin stops at the first psql meta-command of each with a parse error and exit status 2."
  - "181-11: the instances ran on port bases 55700 and 55800, by the dispatch, not on 55400 and 55500 as the plan's frontmatter says."

patterns-established:
  - "A script that psql runs with ON_ERROR_STOP gives its status to the caller only when it is the file named by -f. Through \\i from a script that has not set ON_ERROR_STOP itself, psql exits 0 on a failure."
  - "A key used in an observation is a made-up value in a shell variable; it is compared by length, prefix and digest and counted with grep -F -f <(printf ...), and every kept file is searched for it before anything is quoted"

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan closes nothing: SUPA-10 is NOT closed and was not marked complete
# (requirements.ready-ids answered "0/1 requirement(s) ready to mark complete"). The plan builds toward
# SUPA-06, which phase 184 closes on the hosted project.
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "The bootstrap script and the seed check exist, hold no secret, are outside prettier, and every table the bootstrap names is schema-qualified"
    verification:
      - kind: other
        ref: "Task 1 <verify><automated> of 181-11-PLAN.md, run verbatim on the files that became commit 821cf36b7: exit 0; prettier --check infra on bbe4b3706: exit 0"
        status: pass
      - kind: other
        ref: "prettier --check on each file before its ignore entry existed: exit 2, parse error at the first \\set line (the reason the entries give)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Run twice on a database with no seed, the bootstrap exits 0 both times and leaves one account, one project, one app_settings row, the two storage_config keys and the deployment_settings row with the given value"
    verification:
      - kind: integration
        ref: "evidence/181-11-bootstrap-and-seed-check.md: RUN1_EXIT=0, RUN2_EXIT=0, ROWS_AFTER_RUN2=accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1, ROWS_SAME_AFTER_BOTH_RUNS=yes, BEHIND_CLOUDFLARE_AFTER_RUN2=t, on commit 821cf36b7"
        status: pass
    human_judgment: false
  - id: D3
    description: "A run with a required variable not given, or with a malformed value, exits 3 and writes nothing"
    verification:
      - kind: integration
        ref: "same record: MISSING_VAR_EXIT=3 and MISSING_VAR_WROTE_NOTHING_AND_NAMED_IT=yes; MALFORMED_ID_EXIT=3 and MALFORMED_ID_WROTE_NOTHING=yes; MALFORMED_BOOLEAN_ROLLED_BACK=yes; EMPTY_VAR_WROTE_NOTHING_AND_NAMED_BOTH=yes; OUTSIDE_VARIABLE_DISCARDED=yes"
        status: pass
    human_judgment: false
  - id: D4
    description: "A later run keeps what an administrator changed (open_for_voters included) and applies a rotated key, a corrected address and a changed Cloudflare value"
    verification:
      - kind: integration
        ref: "same record: SECOND_RUN_KEEPS_OPEN_FOR_VOTERS=yes, ADMIN_CHANGES_KEPT=yes, ROTATED_KEY_APPLIED=yes, KEY_STORED_UNQUOTED=yes, CORRECTED_ADDRESS_AND_FLAG_APPLIED=yes"
        status: pass
    human_judgment: false
  - id: D5
    description: "The service-role key is never on a command line, never in a statement's text, and not in the server log after its statement fails"
    verification:
      - kind: integration
        ref: "same record: KEY_OCCURRENCES_IN_SERVER_LOG=0 with FAILED_STATEMENT_TEXT_IN_SERVER_LOG=1 and KEY_OCCURRENCES_IN_PSQL_OUTPUT=0; red controls KEY_OCCURRENCES_IN_SERVER_LOG_UNBOUND_COPY=1 and KEY_OCCURRENCES_IN_SERVER_LOG_NO_SET_COPY=1; KEY_OCCURRENCES_WITH_PARAMETER_LOGGING_ASKED=0"
        status: pass
    human_judgment: true
    rationale: "The measurement is of a local database container whose settings log no parameter of a statement that succeeds. A hosted server's settings are not known, and the script cannot change those that are for superusers. Whether the key can reach a hosted project's log is decided by settings phase 184 has to read there, not by this record."
  - id: D6
    description: "The seed check exits 0 on a bootstrapped database with a non-local address and 3 on a seeded one, naming the seed users, the local address and the demo key, and printing no key"
    verification:
      - kind: integration
        ref: "same record: SEED_CHECK_BOOTSTRAPPED_EXIT=0 (821cf36b7); SEED_CHECK_SEEDED_EXIT=3, SEED_CHECK_NAMES_USER=yes, SEED_CHECK_NAMES_LOCAL_URL=yes, SEED_CHECK_NAMES_DEMO_KEY=yes, SEED_CHECK_OUTPUT_HOLDS_A_KEY=no, SEED_CHECK_URL_ONLY_EXIT=3, SEED_CHECK_AFTER_CLEANUP_EXIT=0 (5a4ec714e)"
        status: pass
      - kind: other
        ref: "Task 2 and Task 3 <verify><automated> of 181-11-PLAN.md, each run verbatim on the finished record: exit 0 and 0"
        status: pass
    human_judgment: false
  - id: D7
    description: "The schema comments of plan 181-08 that name the bootstrap script agree with what the script writes"
    verification: []
    human_judgment: true
    rationale: "Compared by reading: the path is the one the four comment lines give, and each row they say the bootstrap writes is written by it. One nuance a reader may want settled before the freeze: the comment on projects.open_for_voters says the bootstrap writes the project row 'this column included'; the script writes the column when it creates the row and never again. No file under schema/ was edited."

# Metrics
duration: 20min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 11: The Bootstrap Script and the Seed Check Summary

**`infra/scripts/bootstrap.sql` writes a deployment's six rows from eight environment variables in one transaction, with the service-role key as a bound parameter, and was seen to exit 0 twice with the same rows, 3 with nothing written in five refused runs, and to leave the key out of the server log; `infra/scripts/check-seed.sql` exits 3 on a seeded database naming both seed users, `http://kong:8000` and the demo key, and 0 once the users are gone and the bootstrap has run. Everything was measured on local isolated instances; no hosted database was touched.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-10-12T19:48:08Z
- **Completed:** 2026-10-12T20:08:03Z (last commit before this summary)
- **Tasks:** 3 of 3
- **Files modified:** 5 (3 new, 2 changed)

## Accomplishments

- The bootstrap, 169 lines. Its header gives the purpose, the command, the eight variables, the statuses and two rules for the operator: the connection comes from the `PG*` variables as `postgres`, and no value is given with `-v` or in a connection URL argument. It says that it does not create the first administrator.
- The seed check, 99 lines: one `DO` block that collects findings and raises once.
- Two `.prettierignore` entries with their reason, which was measured before the entries were added (exit 2 on both files).
- Part 1 of the record: two refused runs the plan orders and three more, two green runs with identical rows, an administrator's changes kept, a rotated key applied, the key statement made to fail and the log searched, with two red controls of that search.
- Part 2 of the record: the check red on a seeded database, the two further controls of the plan, and each of the three findings seen alone.

## Recorded statuses

Every status was read from `$?` of the command itself, by a driver script that wrote the verdict lines; none was typed and none was read through a pipe. Nothing here went through turbo.

The lines the plan names, from `evidence/181-11-bootstrap-and-seed-check.md`:

| Key | Value | Instance, commit |
|-----|-------|------------------|
| `MISSING_VAR_EXIT` | `3` | `boot`, `821cf36b7` |
| `MALFORMED_ID_EXIT` | `3` | same |
| `RUN1_EXIT` | `0` | same |
| `RUN2_EXIT` | `0` | same |
| `ROWS_AFTER_RUN2` | `accounts:1 projects:1 app_settings:1 storage_config:2 deployment_settings:1` | same |
| `SECOND_RUN_KEEPS_OPEN_FOR_VOTERS` | `yes` | same |
| `ROTATED_KEY_APPLIED` | `yes` | same |
| `KEY_STORED_UNQUOTED` | `yes` | same |
| `KEY_OCCURRENCES_IN_SERVER_LOG` | `0` | same |
| `SEED_CHECK_BOOTSTRAPPED_EXIT` | `0` | same |
| `SEED_CHECK_SEEDED_EXIT` | `3` | `boot-seeded`, `5a4ec714e` |
| `SEED_CHECK_NAMES_USER` | `yes` | same |
| `SEED_CHECK_NAMES_LOCAL_URL` | `yes` | same |
| `SEED_CHECK_NAMES_DEMO_KEY` | `yes` | same |
| `SEED_CHECK_URL_ONLY_EXIT` | `3` | same |
| `SEED_CHECK_AFTER_CLEANUP_EXIT` | `0` | same |

The record holds 49 more lines this plan added (30 in part 1, 19 in part 2). The ones a reader should not miss:

| Key | Value | Meaning |
|-----|-------|---------|
| `MALFORMED_BOOLEAN_ROLLED_BACK` | `yes` | five inserts had run in the transaction when the sixth statement failed; none remained |
| `EMPTY_VAR_STATUS` | `3` | an empty key and a whitespace-only address are named as not set |
| `OUTSIDE_VARIABLE_DISCARDED` | `yes` | a psql variable set before the script runs is not used |
| `FAILED_STATEMENT_TEXT_IN_SERVER_LOG` | `1` | the log did record the failed key statement, with `$1` in its text |
| `KEY_OCCURRENCES_IN_SERVER_LOG_UNBOUND_COPY` | `1` | red control: a copy with the key in the statement's text |
| `KEY_OCCURRENCES_WITH_PARAMETER_LOGGING_ASKED` | `0` | the committed script on a connection that asks for failed statements' parameters |
| `KEY_OCCURRENCES_IN_SERVER_LOG_NO_SET_COPY`, `KEY_OCCURRENCES_IN_PSQL_OUTPUT_NO_SET_COPY` | `1`, `1` | red control: the same connection, a copy without the script's `SET` line |
| `BOOTSTRAP_INCLUDED_WITHOUT_ON_ERROR_STOP_STATUS`, `SEED_CHECK_INCLUDED_WITHOUT_ON_ERROR_STOP_STATUS` | `0`, `0` | a failing script run through `\i` from a one-line script |
| `SEED_CHECK_USERS_DELETED_NAMES_DEMO_KEY` | `yes` | see "One result that differs from the plan's words" |
| `SEED_CHECK_LOCAL_URL_ALONE_NAMES_ONLY_IT`, `SEED_CHECK_DEMO_KEY_ALONE_NAMES_ONLY_IT`, `SEED_CHECK_USERS_ALONE_NAMES_ONLY_THEM` | `yes` each | each finding on a database that holds only that one |
| `SEED_CHECK_REFUSED_ADDRESSES`, `SEED_CHECK_ACCEPTED_ADDRESSES` | `6 of 6`, `2 of 2` | the address rule |

Command statuses:

| Command | Tree | Status |
|---------|------|--------|
| `prettier --check` on each of the two files, before the ignore entries | working tree before `821cf36b7` | 2 and 2 (parse error at `\set ON_ERROR_STOP on`) |
| Task 1 verify, verbatim | working tree that became `821cf36b7` | 0 |
| `node scripts/assert-comment-hygiene.mjs` | same | 0 (it does not scan `infra/`) |
| `isolated-instance.sh start --name boot --mode db --port-base 55700 --migrations ...` | `821cf36b7` | 0 (15 s) |
| Task 2 verify, verbatim | working tree before `5a4ec714e`, and again on the finished record | 0, 0 |
| `isolated-instance.sh start --name boot-seeded --mode db --port-base 55800 --migrations ... --seed ...` | `5a4ec714e` | 0 (16 s) |
| Task 3 verify, verbatim | working tree before `bbe4b3706` | 0 |
| `prettier --check infra` | `bbe4b3706` | 0 |
| `prettier --check .` (the second link of `yarn format:check`, run by itself) | `bbe4b3706` | 0 |
| Every `stop` (`boot` twice, `boot-seeded` once) | | 0 each |

**Gates of the plan left unrun: none.** The three verify commands were each run as written.

**Not run, and not ordered by the plan:** `yarn build`, `yarn test:unit`, `yarn lint:check` and `yarn format:check` as whole gates (of the last, only its prettier link). The change is two SQL files that no workspace builds, imports or tests, two lines of `.prettierignore`, and the phase record. No `yarn db:*` command, no `supabase` call outside the harness, no pgTAP.

**The shared stack.** `docker ps --format '{{.Names}} {{.ID}}'` before the first instance of the plan and after the last stop: all 24 lines identical, the 13 of `openvaa-local` identical by `cmp`. No container, volume or network with `openvaa-iso-` in its name is left, and the harness lists no instance.

## One result that differs from the plan's words

The plan says of the seed check's first further control: with the seed users deleted, "the status is still 3 and the message names the URL only". The status is 3. The message names the address and the demo key, because deleting the users leaves the seed's key in `public.storage_config`. `SEED_CHECK_URL_ONLY_EXIT=3` is the status of that run, as the plan defines it; the record says so beside the line. The address as the only finding was then produced in an added control (the bootstrap run with the local stack's own address and a made-up key): status 3, one finding.

## Task Commits

1. **Task 1: Write the bootstrap script and the seed check** - `821cf36b7` (feat)
2. **Task 2: Run the bootstrap twice on a database with no seed, with its red controls** - `5a4ec714e` (docs)
3. **Task 3: See the seed check fail on a seeded database** - `bbe4b3706` (docs)

Also: `0ce2d4646` (docs), six items found and left alone, in `deferred-items.md`.

## Files Created/Modified

- `infra/scripts/bootstrap.sql` - the bootstrap
- `infra/scripts/check-seed.sql` - the seed check
- `.prettierignore` - the two files named, with the reason above them
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-11-bootstrap-and-seed-check.md` - the record, in two parts, each with its verdict lines, what they mean, and the driver's transcript whole
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md` - six items under "From plan 181-11"
- `apps/supabase/supabase/schema/`, the baseline and `infra/local/` - **not changed**

## Decisions Made

- **One statement decides what is missing.** Each variable is read with `\getenv`; an undefined one becomes the empty value; one `SELECT ... \gset` then says which required values are blank and gives each optional value its default, and a second, with the key bound, does the same for the key. Both are read-only and run before `BEGIN`.
- **A value is stored exactly as given.** Nothing is trimmed. Only a blank value counts as not set.
- **Optional values are written at creation only.** They are columns of rows whose conflict rule is "do nothing".
- **The check prints an address but never a key, and not every user's address.** A row matched by the seed's domain is printed with its address; a row matched by a seed id whose address was changed is printed by id only.
- **The check does not report an absent `service_role_key` row.** The plan lists the absent row for the address only, and the bootstrap writes both rows in one transaction.
- **The `.prettierignore` entries name the two files, not `infra/scripts/`**, so plain SQL added beside them stays under prettier.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] An empty required value was a way to store an empty key and exit 0**
- **Found during:** Task 1
- **Issue:** the plan orders `\if :{?name}`, which tests whether a psql variable is defined. `\getenv` defines it when the environment variable exists and is empty, as with a blank line of an environment file. The script would then have written an empty address or key.
- **Fix:** a blank required value is named on standard error like an unset one and the run ends with status 3 before `BEGIN`; a blank optional value takes its default. The `\if :{?name}` block of each variable now gives an undefined variable the empty value, and the test that names the variable and sets the flag follows the two `SELECT`s.
- **Verification:** `EMPTY_VAR_STATUS=3`, `EMPTY_VAR_WROTE_NOTHING_AND_NAMED_BOTH=yes`; control 1 of the plan is unchanged in what it shows
- **Committed in:** `821cf36b7`

**2. [Rule 2 - Missing Critical] A psql variable set from outside would have been used**
- **Found during:** Task 1
- **Issue:** `\getenv` leaves a psql variable unchanged when the environment variable is not defined. With `-v service_role_key=...` and no environment variable the script would have run, with the key in the process list, which is the threat T-181-30 names. The header forbade it; nothing stopped it.
- **Fix:** `\unset` before each `\getenv`, and for the `missing` flag.
- **Verification:** `OUTSIDE_VARIABLE_DISCARDED=yes`. The variables were set by an including script, not with `-v`, because the plan allows nothing but `psql -X -f <file>` on a command line.
- **Committed in:** `821cf36b7`

**3. [Rule 2 - Missing Critical] Bound parameters are logged when the server is asked to log them**
- **Found during:** Task 1, in a trial of control 7
- **Issue:** research assumption A5 says a failed statement's bound parameters are not logged by default. That holds on the local image (`log_parameter_max_length_on_error = 0`). With the setting at -1 the key is written to the server log and is also in psql's output.
- **Fix:** `SET log_parameter_max_length_on_error = 0;` as the script's first statement. Any role may set it. The header states what the script cannot change.
- **Verification:** three runs under the same trigger: the committed script on a connection with the setting at -1 (0 lines), a copy without the `SET` line (1 line in the log, 1 in psql's output), a copy with the key in the statement's text (1 line in the log)
- **Committed in:** `821cf36b7`

**4. [Rule 1 - Bug] "Contains `kong`" would refuse a real host**
- **Found during:** Task 1
- **Issue:** the plan's rule for a local address is that the value contains `kong`, `127.0.0.1`, `localhost` or `host.docker.internal`. A deployment's own address with those four letters inside a longer word would fail the check with no way to pass it.
- **Fix:** each name is matched as a whole word (bounded by a character that is not a letter or digit).
- **Verification:** `https://hongkong-vaa.example.test` passes; `https://kong:8443` and `https://supabase_kong_openvaa-local:8000` are refused
- **Committed in:** `821cf36b7`

**5. [Rule 1 - Bug] Two controls could not show what the plan wants as written**
- **Found during:** Task 2
- **Issue:** (a) control 7 plants a trigger that raises on any insert or update of `public.storage_config`; the `supabase_url` statement comes first and would have been the one to fail, with the key statement never run. (b) control 5 compares `length(value)` and `left(value, 19)`; two made-up keys of the plan's form have the same length and the same first 19 characters.
- **Fix:** (a) the trigger has `WHEN (new.key = 'service_role_key')`. (b) the second key has another prefix and another length, and a digest comparison was added; no value and no digest is printed.
- **Files modified:** the record only
- **Committed in:** `5a4ec714e`

### By instruction, not by the plan

**6. Port bases 55700 and 55800.** The plan's frontmatter names 55400 and 55500. The dispatch orders bases outside the equivalence check's ranges.

**7. A first instance named `boot` was started before the Task 1 commit**, for trials of the two scripts, and stopped. The recorded runs are on a second instance of that name, started on the committed tree. Nothing of the first is in the record.

### Observations added to the plan's

Forty-nine verdict lines beside the plan's sixteen; the table above gives the ones that matter. None changed a tracked file other than the record.

### Scope boundary

`deferred-items.md` has six new items, committed in `0ce2d4646`. None was fixed.

---

**Total deviations:** 5 auto-fixed (3 missing critical, 2 bugs), 2 by instruction, 6 items logged
**Impact on plan:** the outputs are the plan's. The bootstrap differs from the plan's text in how it finds a missing value and in two added statements (`\unset`, `SET`); the check differs in the whole-word match.

**Not written: the broken-windows ledger.** There is no stub, skipped test or unrun verify, and `.planning/WINDOWS.md` sits beside the shared `PROJECT.md`, as in the earlier plans of this phase.

## The schema comments of plan 181-08, read against the script

The four comment lines in `schema/100-tenancy.sql`, `107-feedback.sql` and `400-storage.sql` (twice) name `infra/scripts/bootstrap.sql`. The script is at that path, and it writes each row the comments say it writes: the project row, the two `storage_config` rows "with the project's own Supabase URL and service-role key", and the `private.deployment_settings` value. **No disagreement was found, and no file under `schema/` and no baseline was touched.**

One nuance, reported and not acted on: the comment on `projects.open_for_voters` says "A deployment's project row, this column included, is written by the bootstrap script". The script writes the column when it creates the row (from `BOOTSTRAP_OPEN_FOR_VOTERS`, default false) and leaves an existing row alone. The sentence is true of creation and silent about later runs. Follow-up 181-R2 is still unruled; the script is built on its recommended option.

## Issues Encountered

- **One command of the session shell ran psql with no connection settings.** A helper file written for bash was sourced in the session's zsh, where it failed, and the two `psql` calls after it tried the default local socket (`/tmp/.s.PGSQL.5432`). No server listens there; both ended with "No such file or directory" and status 2. Nothing was sent to a database, and the shared stack (port 54322) was not addressed. The helper was run through `bash` from then on.
- **The demo key of `seed.sql` was shown once in the executor's tool output**, when the file was read whole, as Task 1's `read_first` orders. It is the published local demo key and is in a tracked file. It is in no file this plan wrote.
- **No made-up key was shown or kept.** Each driver searched every file it kept for every key it had used: 0. The container log and the output of the two red-control copies held a key and were removed by the driver.
- **`.planning/PROJECT.md` was read in part:** its opening, Context and Constraints sections, and a search of the whole file for `bootstrap.sql`, `check-seed`, `seed check`, `storage_config`, `deployment_settings` and `open_for_voters`, which found nothing.
- **No git hook ran on the commits** (`core.hooksPath=/dev/null` in this worktree, as before). No commit used `--no-verify`, and none was amended.
- **No command was refused** by a hook or a permission check.

## What a later plan must know

- **Use of the bootstrap.** Export the `PG*` variables for a direct connection as `postgres` and the four required variables, then `psql -X -f infra/scripts/bootstrap.sql`. Read psql's status. A green run prints `SET`, `BEGIN`, six `INSERT 0 n` lines and `COMMIT`; `INSERT 0 0` on the first three means the rows were already there.
- **Use of the seed check.** `psql -X -f infra/scripts/check-seed.sql` with the same connection. Status 3 with a message beginning `check-seed:` is a finding; status 3 with any other message means the check could not run (a missing table, a permission).
- **Never run either through `\i` without `ON_ERROR_STOP` set first.** psql then exits 0 on a failure. A pipeline step calls the file with `-f`.
- **Before the first hosted run of the bootstrap (phase 184), read these settings on the hosted project with `SHOW`:** `log_statement`, `log_parameter_max_length`, `log_min_duration_statement`, `pgaudit.log`, `pgaudit.log_parameter`, `auto_explain.log_min_duration`, `auto_explain.log_parameter_max_length`. If the server logs the parameters of statements that succeed, the key will be in its log whatever the script does. Locally they are `ddl`, `-1`, `-1`, `none`, `off`, `10000`, `-1`.
- **Also unobserved on a hosted project:** that `postgres` owns the five tables there (locally it does, and it is not a superuser), that it may read `auth.users` for the check, and that `\getenv` and `\bind` are available in the psql of whoever runs the scripts (psql 15 and 16; this host has 17.6).
- **`BOOTSTRAP_STORAGE_URL` on a hosted project is the project's own `https://` URL.** The seed check refuses anything else. On a local stack the address is the gateway's inside the Docker network, and the seed check is then red by design.
- **`ensureProject` of dev-seed opens a project for voters unconditionally.** Seeding a bootstrapped deployment with dev-seed sets `open_for_voters` true whatever `BOOTSTRAP_OPEN_FOR_VOTERS` was (read from the code, in `deferred-items.md`).
- **The seed check is not a proof that the seed was never applied.** It reads the seed users and the two `storage_config` rows. The seed's project, candidate and grants are not looked at.
- **Before the migration's default row is overwritten, `private.deployment_settings` holds one row with `behind_cloudflare` false.** So its count is 1 on a database that has never been bootstrapped; the value, not the count, shows a bootstrap.
- **The variable names are in no template and no document** (`deferred-items.md`).
- **Scratch state** is in `tmp/181-11/` (ignored): the three drivers and their helper, the transcripts, the status files and the container lists. No file there holds a key.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information-disclosure | `infra/scripts/bootstrap.sql` | A server set to log the parameters of statements that succeed, or of slow ones, logs the bound service-role key. The plan's register covers the failed statement only (T-181-31). The script cannot change those settings; they are listed above for phase 184. |

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 184 has the bootstrap, the seed check and the variable names it uses.
- Plan 181-17, the freeze, can keep the four schema comments as they are: the script is at the path they name.
- Criterion 5 of the phase is observed locally in its bootstrap clause and its seed-check clause. Its drift-check clause is plan 181-12.
- Not closed here: SUPA-10 stays open until the last plan of the phase, and SUPA-06 until phase 184.

## Self-Check: PASSED

- The three created files exist.
- Commits `821cf36b7`, `5a4ec714e`, `bbe4b3706` and `0ce2d4646` are ancestors of `HEAD`.
- `commits: 4` is `git rev-list --count 6a720f9ae..HEAD` at the time of writing, with `HEAD` at `0ce2d4646`.
- Task 1 acceptance criteria: the bootstrap holds `\set ON_ERROR_STOP on`, one `\getenv` line for each of the eight variables, one `BEGIN;` and one `COMMIT;`; no JWT prefix and no `http://` or `https://`; its six statements name `public.accounts`, `public.projects`, `public.app_settings`, `public.storage_config` (twice) and `private.deployment_settings`; the check holds `openvaa.test`, `kong`, `supabase-demo` and `RAISE EXCEPTION`; both `.prettierignore` entries are there with their reason and `prettier --check infra` exits 0; `ls infra` shows `local` (plan 181-13's) and `scripts`.
- Task 2 acceptance criteria: both red controls show status 3 and four zero counts; the counts after run 1 and run 2 are identical and equal `ROWS_AFTER_RUN2`; the four yes lines and `KEY_OCCURRENCES_IN_SERVER_LOG=0` are in the record; the record holds no made-up key and no JWT-shaped string; no container named `openvaa-iso-boot` remains.
- Task 3 acceptance criteria: `SEED_CHECK_SEEDED_EXIT=3` with the message quoted, naming an `@openvaa.test` address and `http://kong:8000`; `SEED_CHECK_URL_ONLY_EXIT=3` and `SEED_CHECK_AFTER_CLEANUP_EXIT=0`; the quoted text holds no key; the `_openvaa-local` containers are the same before and after the plan.
- Plan-level verification: the record holds every verdict line of Tasks 2 and 3; `prettier --check infra` exits 0 and the bootstrap holds no secret; no isolated instance remains and the shared stack is unchanged.
- The four must-have truths hold, the fourth with the reservation above on the words "URL only".
- No stub pattern in the files this plan created or changed.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
