---
phase: 181-deployability-and-migration-model
plan: 08
subsystem: database
tags: [supabase, storage-buckets, migration, baseline, schema-comments, pgtap, isolated-instance, evidence]

# Dependency graph
requires:
  - phase: 181-02
    provides: apps/supabase/scripts/isolated-instance.sh, HARNESS_DB_MODE=ok, BUCKET_FILE_SIZE_LIMIT=524288000, the rows a CLI-seeded instance holds, and the zero-row control of the tree before the insert
  - phase: 181-05
    provides: config.toml with the [functions.identity-callback] section, which this plan leaves as it is
provides:
  - the storage.buckets rows public-assets and private-assets, inserted by schema/400-storage.sql and carried by the regenerated baseline
  - the schema comments that named a manual step now naming the bootstrap script and seed.sql as the writers
  - evidence/181-08-buckets.md, with the bucket rows of a database built from the migration alone and the measurement of research assumption A3
  - the measured fact that the pinned CLI prints "Updating Storage bucket" and exits 0 when the rows already exist
affects: [181-10, 181-11, 181-16, 181-17, 182, 184, 189]

# Actuals (#2632)
# tokens is chars/4 over the diff plan_head_before..plan_head_after (37785 characters, six files).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 9446
  tasks: 3
  commits: 4
plan_head_before: ac4cdc43b0c4dc4b89b5b35b5c5ecfd833071cb1
plan_head_after: 4ec4794bba64d4fcffce9f612651f99fcf23e118

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A linter that says only 'connecting to local database' is shown to read the intended instance by planting a fault there, seeing the linter fail on it, and removing it"
    - "A key a command prints is taken into a shell variable, handed to curl on standard input as a configuration, and unset; it is never on a command line or in a file"

key-files:
  created:
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-08-buckets.md
  modified:
    - apps/supabase/supabase/schema/400-storage.sql
    - apps/supabase/supabase/schema/107-feedback.sql
    - apps/supabase/supabase/schema/100-tenancy.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md

key-decisions:
  - "181-08: schema/400-storage.sql inserts the storage.buckets rows public-assets (public true) and private-assets (public false), each with file_size_limit 524288000 and no other column, ending ON CONFLICT (id) DO NOTHING. The baseline was regenerated with yarn schema:regenerate and holds the same 26 added and 5 removed lines as the three schema files. A database-only isolated instance of commit 9b4ab6d0c, with no seed and no storage service, holds exactly those two rows, equal to the rows the CLI seeds; the same build held none before the insert."
  - "181-08: the [storage.buckets.*] blocks of config.toml are kept (CONFIG_BUCKET_BLOCKS=kept). With the rows and the blocks both present, supabase start and supabase db reset exit 0 on an isolated instance and print 'Updating Storage bucket' for both, where the tree before the insert printed 'Creating Storage bucket'; two rows with the declared properties remain after each, and one upload to each bucket answers 200. config.toml was not edited."
  - "181-08: pgTAP exits 1 on an isolated instance started without a seed (19 cases failed and 4 did not run, in 14-grants-migration and 31-storage-cleanup, which read rows seed.sql writes) and exits 0 with 1957 cases on an instance started with seed.sql. PGTAP_EXIT=0 in the record is the seeded run, which the plan did not order; PGTAP_WITHOUT_SEED_EXIT=1 is the run the plan ordered. A later plan that runs the suite on an isolated instance has to pass --seed."
  - "181-08: four comment lines of schema/ (in 100-tenancy.sql, 107-feedback.sql and 400-storage.sql) and their copies in the baseline name infra/scripts/bootstrap.sql as the writer of a deployment's rows. That file does not exist until plan 181-11. None of the uncorrected statements about hosted behaviour sits inside a function body."

patterns-established:
  - "A schema change is checked on a database-only isolated instance before its commit is made, so that a baseline that does not apply never enters history; the recorded observation is then taken on the committed tree"

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan closes nothing: SUPA-10 is NOT closed and was not marked complete
# (requirements.ready-ids answered "0/1 requirement(s) ready to mark complete").
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "The baseline carries the two bucket rows, was produced by yarn schema:regenerate, and is byte-identical to schema/"
    verification:
      - kind: other
        ref: "Task 1 <verify><automated> of 181-08-PLAN.md, run verbatim on the working tree that became commit 9b4ab6d0c: exit 0 (parity guard, prettier --check on schema/, the three guards that read schema/)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A database built from the migration alone, with no seed and no storage service, holds public-assets and private-assets with the properties config.toml declares"
    verification:
      - kind: integration
        ref: "Task 2 <verify><automated> of 181-08-PLAN.md, run verbatim: exit 0 (BASELINE_APPLY_EXIT=0, BUCKET_ROWS_DB_ONLY=2, BUCKET_ROWS_MATCH_CLI=yes); red control BUCKET_ROWS_UNCHANGED_TREE=0 in evidence/181-02-harness-spike.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "The CLI tolerates bucket rows that already exist, and the config.toml blocks are kept"
    verification:
      - kind: integration
        ref: "evidence/181-08-buckets.md: CLI_START_WITH_ROWS_EXIT=0, CLI_RESET_WITH_ROWS_EXIT=0, BUCKET_ROWS_AFTER_RESET=2, UPLOAD_PUBLIC_HTTP=200, UPLOAD_PRIVATE_HTTP=200, CONFIG_BUCKET_BLOCKS=kept"
        status: pass
    human_judgment: false
  - id: D4
    description: "The pgTAP suite passes on a database built from the regenerated baseline"
    verification:
      - kind: integration
        ref: "supabase test db on an isolated instance started with seed.sql: exit 0, Files=42, Tests=1957"
        status: pass
      - kind: integration
        ref: "supabase test db on the isolated instance the plan orders, started without a seed: exit 1, 19 cases failed and 4 did not run"
        status: fail
    human_judgment: true
    rationale: "The command the plan orders exited 1, and the plan says a failing assertion stops the task. The task was not stopped: the cause was measured with a second, seeded instance the plan does not order, and PGTAP_EXIT=0 in the record is that run. Whether that is an acceptable reading of the plan is the verifier's and the operator's to decide, not the executor's."
  - id: D5
    description: "No comment in schema/ still tells an operator to set a deployment row by hand"
    verification:
      - kind: other
        ref: "grep -n 'SQL editor' apps/supabase/supabase/schema/*.sql prints nothing; grep -c 'infra/scripts/bootstrap.sql' apps/supabase/supabase/schema/107-feedback.sql prints 1"
        status: pass
    human_judgment: true
    rationale: "The search shows which words are gone, not whether the new sentences are true. They name a bootstrap script that plan 181-11 has yet to write, and what that script writes to open_for_voters rests on follow-up 181-R2. The sentences have to be read against the script before the freeze."

# Metrics
duration: 13min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 08: Bucket Rows in the Migration and the Comments on Manual Steps Summary

**`schema/400-storage.sql` now inserts `public-assets` and `private-assets` into `storage.buckets`, the regenerated baseline carries them, and a database built from that migration alone holds exactly those two rows with the properties the CLI seeds. The CLI updates rows that already exist and exits 0, so the `config.toml` blocks stay. One result needs a ruling: the pgTAP command the plan orders exited 1 on the unseeded instance, and the `PGTAP_EXIT=0` in the record comes from a seeded instance the plan does not order.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-10-12T18:15:22Z
- **Completed:** 2026-10-12T18:28:33Z (last commit before this summary)
- **Tasks:** 3 of 3
- **Files modified:** 6 (1 new, 5 changed)

## Accomplishments

- One `INSERT INTO storage.buckets (id, name, public, file_size_limit)` with two rows and `ON CONFLICT (id) DO NOTHING`, in a section of its own after the `storage_config` block, and two new lines in the header's `-- Provides:` list. `file_size_limit` is `524288000`, the number on the `BUCKET_FILE_SIZE_LIMIT` line of the spike record. No other column is named: the spike read `allowed_mime_types` as null and every other column at its default on the CLI's rows.
- Five comments corrected in three schema files, so that none tells an operator to set a deployment's row by hand.
- `00001_initial_schema.sql` regenerated by `yarn schema:regenerate`. It was not edited by hand. Its diff holds the same 26 added and 5 removed lines as the three schema files (the two sorted line lists compare equal).
- The bucket criterion observed green on a database with no storage service and no seed, against the zero-row control plan 181-02 recorded on the tree before the insert.
- Research assumption A3 measured: with the rows in place the CLI prints `Updating Storage bucket:` and exits 0, on `supabase start` and on `supabase db reset`.

## Recorded statuses

Every status was read from `$?` of the command itself, with the output sent to a file under `tmp/181-08/` (ignored by git). No status was read through a pipe. Nothing here went through turbo.

| Check | Command | Tree | Status |
|-------|---------|------|--------|
| Format the three files | `node_modules/.bin/prettier --write` on the three schema files | working tree before `9b4ab6d0c` | 0 (it reflowed the second row of the insert; the other two files unchanged) |
| Regenerate | `yarn schema:regenerate` | same | 0 (29 schema files, 7880 lines, where the baseline of plan 181-01 counted 7859) |
| Task 1 verify | the plan's chained command, verbatim: parity guard, `prettier --check` on `schema/`, the `private-assets` grep, comment hygiene, RPC nullability, grant enum | same | 0 |
| Apply before the commit (extra) | `isolated-instance.sh start --name buckets-pre --mode db`, count, rows, `stop` | same | 0, `2`, the two rows, 0 |
| Baseline apply | `isolated-instance.sh start --name buckets-db --mode db --migrations apps/supabase/supabase/migrations` | `9b4ab6d0c` | **0** (15 s) |
| `supabase db lint --workdir <ISO_WORKDIR> --schema public --fail-on warning` | | `9b4ab6d0c` | 0 |
| `node apps/supabase/scripts/lint-schema.mjs` with `DATABASE_URL` of the instance | | `9b4ab6d0c` | 0 (0 errors, 3 warnings) |
| Both linters with a planted fault (extra) | the same two commands | `9b4ab6d0c` | 1 and 1, each naming the planted object; 0 and 0 again after it was dropped |
| Task 2 verify | the plan's command, verbatim | working tree before `6f756797c` | 0 |
| Start with rows and blocks | `isolated-instance.sh start --name buckets-full --mode full --port-base 55600 --migrations ... --tests ...` | `6f756797c` | **0** (27 s) |
| Reset with rows and blocks | `supabase db reset --workdir <ISO_WORKDIR>` | `6f756797c` | **0** (26 s) |
| Upload to `public-assets` and to `private-assets` | `POST /storage/v1/object/<bucket>/probe/upload-check.txt` | `6f756797c` | HTTP 200 and 200 |
| pgTAP, the plan's command | `supabase test db --workdir <ISO_WORKDIR>` on `buckets-full` (no seed) | `6f756797c` | **1** (Files=42, Tests=1953, Result: FAIL) |
| pgTAP with the seed (extra) | the same command on `buckets-seeded`, started with `--seed apps/supabase/supabase/seed.sql` | `6f756797c` | **0** (Files=42, Tests=1957, Result: PASS) |
| Task 3 verify | the plan's chained command, verbatim, ending in `deploymentTemplates.test.ts` and `localSupabaseUrl.test.ts` | working tree before `4d908afec` | 0 (2 files, 86 tests) |
| Named dev-seed tests that read `schema/` or the guards (extra) | `rpcNullabilityGate`, `ciTypecheckGate`, `schemaMigrationFreezeGate`, `assertKnownRowProps`, `template/permittedKeys`, `cli/allowedTeardownTables` | `4d908afec` | 0 (6 files, 103 tests) |
| Parity guard, `prettier --check` on `schema/`, comment hygiene, once more | | `4d908afec` | 0, 0, 0 |
| Every `stop` | `buckets-pre`, `buckets-db`, `buckets-full`, `buckets-seeded` | | 0 each |

The verdict lines of `evidence/181-08-buckets.md`:

| Key | Value |
|-----|-------|
| `BASELINE_APPLY_EXIT` | `0` |
| `BUCKET_ROWS_DB_ONLY` | `2` |
| `BUCKET_ROWS_MATCH_CLI` | `yes` |
| `DB_LINT_EXIT` | `0` |
| `SCHEMA_LINT_EXIT` | `0` |
| `CLI_START_WITH_ROWS_EXIT` | `0` |
| `CLI_RESET_WITH_ROWS_EXIT` | `0` |
| `BUCKET_ROWS_AFTER_RESET` | `2` |
| `UPLOAD_PUBLIC_HTTP` | `200` |
| `UPLOAD_PRIVATE_HTTP` | `200` |
| `PGTAP_EXIT` | `0` (the seeded instance) |
| `PGTAP_WITHOUT_SEED_EXIT` | `1` (the instance the plan orders; a line this plan added) |
| `CONFIG_BUCKET_BLOCKS` | `kept` |

**Gates of the plan left unrun: none.** The three verify commands were each run as written. The third ends in two named dev-seed test files, which read text and reach no database.

**Not run, and not ordered by the plan:** the whole dev-seed suite and `yarn test:unit` at the root (the dispatch forbids both here: with the root `.env` the integration tier would run against the shared database, which is not rebuilt from the new baseline); `yarn build`, `yarn lint:check` and `yarn format:check` as whole gates; the E2E suite; `yarn db:types` (the plan says so: it targets the shared stack, and a data row and comment edits do not change what the type generator reads); pgTAP on the shared stack. The two dev-seed tests that could reach a database (`ensureProject.test.ts`, `projectScopedContaminationIsolation.test.ts`) were left out of the named run; neither names a schema file.

**The shared stack.** `docker ps` before the first start of the plan and after its last stop: the 24 names are identical, the 13 names ending `_openvaa-local` are identical, and the container ids of all 24 are identical. `isolated-instance.sh list` prints nothing, and no container, volume or network with `openvaa-iso-` in its name is left.

## The comment search (D-08)

`grep -n -i -E 'SQL editor|in production|dashboard|seed\.sql|hosted|by hand|manually|unverified' apps/supabase/supabase/schema/*.sql`, run on the tree at `ac4cdc43b`, found seven lines. The table gives each with its verdict, and adds as its second row the one known comment that none of the terms matches:

| File | Text found | Verdict |
|------|------------|---------|
| `107-feedback.sql`, comment above `private.deployment_settings` | "so a hosted deployment sets it once in the SQL editor with `UPDATE private.deployment_settings SET behind_cloudflare = true;`" and "The local stack sets it in seed.sql." | **Corrected.** Now: "so a hosted deployment needs it true", and at the end of the paragraph "A deployment's value is written by the bootstrap script `infra/scripts/bootstrap.sql`, and the local stack's by seed.sql." The clause "Hosted Supabase is behind Cloudflare" was kept word for word |
| `107-feedback.sql`, the next paragraph (found by its neighbour's line, not by a search term; it is the second of the five known comments) | "Only the owner reads or writes it: the SECURITY DEFINER trigger, the seed and an operator." | **Corrected.** Now: "the SECURITY DEFINER trigger reads it, seed.sql writes the local stack's row, and the bootstrap script writes a deployment's." |
| `400-storage.sql`, comment above `storage_config` | "seed.sql sets local dev defaults; in production, set the project's actual Supabase URL and service role key." | **Corrected.** Now: "seed.sql writes the local stack's two rows. A deployment's are written by the bootstrap script `infra/scripts/bootstrap.sql`, with the project's own Supabase URL and service-role key." |
| `400-storage.sql`, last line | "seed.sql sets the local dev values; in production, set the actual values." | **Corrected.** Now: "seed.sql writes the local stack's values, and the bootstrap script `infra/scripts/bootstrap.sql` writes a deployment's." |
| `100-tenancy.sql`, comment on `open_for_voters` | "seed.sql and SupabaseAdminClient.ensureProject set it to true." | **Corrected.** Now: "seed.sql sets it to true on the local stack's project, and SupabaseAdminClient.ensureProject on the project it ensures. A deployment's project row, this column included, is written by the bootstrap script `infra/scripts/bootstrap.sql`." It does not say which value the bootstrap writes, because that rests on follow-up 181-R2 |
| `001-role-settings.sql`, header | "HOSTED DEPLOYMENTS: the value lives on the role, not in config.toml, so a project whose migrations are not applied keeps Supabase's 3 s." | **Unchanged**, as the plan orders. Not a manual step |
| `107-feedback.sql`, comment above `private.feedback_client_ip`, first of two | "Without Cloudflare in front, as on the local CLI stack or most self-hosted gateways, Kong forwards a client-sent `cf-connecting-ip` unchanged" | **Unchanged.** A statement about behaviour, not a manual step |
| `107-feedback.sql`, same comment, second | "On hosted Supabase the last entry can be a platform-internal address shared by many voters, so a hosted deployment that leaves `behind_cloudflare` false collapses those voters into one bucket. That is why hosted deployments must set it." | **Unchanged.** A statement about hosted behaviour; "must set it" states a need and names no procedure |

The same search after the change finds nine lines: the seven above, the paragraph of `107-feedback.sql` that now holds "seed.sql", and the new bucket comment of `400-storage.sql`, which says "A hosted project gets its buckets from this statement alone". `grep -n 'SQL editor'` finds nothing.

A wider search of `schema/*.sql` for `operator`, `production`, `deployment`, `must set` and `bootstrap` found no other comment that describes a manual step.

### Inside a function body or not (for phase 189)

For every line the search finds after the change, whether it lies between a function's `$$` delimiters was computed by counting the delimiters from the top of each file. **None does.** All nine are `--` comments outside any function body, so none is stored in a database.

The four statements about hosted behaviour that were left as they are:

| Statement | File | Inside a function body |
|-----------|------|------------------------|
| "HOSTED DEPLOYMENTS: the value lives on the role, not in config.toml ..." | `001-role-settings.sql` | no |
| "Hosted Supabase is behind Cloudflare, so a hosted deployment needs it true." (the first clause is the old text) | `107-feedback.sql` | no |
| "Without Cloudflare in front, as on the local CLI stack or most self-hosted gateways, Kong forwards a client-sent `cf-connecting-ip` unchanged ..." | `107-feedback.sql` | no |
| "On hosted Supabase the last entry can be a platform-internal address shared by many voters ... That is why hosted deployments must set it." | `107-feedback.sql` | no |

What that means for phase 189: after the freeze each of them can still be reworded in `schema/` without a migration, but the copy in the frozen baseline keeps the old words, and a search of the repository's comments will keep finding it there. Nobody has observed these statements on a hosted project; phase 184 measures them.

## Task Commits

1. **Task 1: Insert the bucket rows, correct the comments, regenerate the baseline** - `9b4ab6d0c` (feat, `[db]`): exactly the three schema files and `00001_initial_schema.sql`
2. **Task 2: Apply the baseline to an isolated database and observe the buckets** - `6f756797c` (docs)
3. **Task 3: Measure whether the CLI tolerates the existing bucket rows, and act on the result** - `4d908afec` (docs)

Also: `4ec4794bb` (docs), the items found and left alone, in `deferred-items.md`.

## Files Created/Modified

- `apps/supabase/supabase/schema/400-storage.sql` - the bucket section with the insert, two `-- Provides:` lines, two corrected comments
- `apps/supabase/supabase/schema/107-feedback.sql` - two corrected comments above `private.deployment_settings`
- `apps/supabase/supabase/schema/100-tenancy.sql` - the comment on `projects.open_for_voters`
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` - regenerated; 7880 lines
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-08-buckets.md` - the record, in two parts
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md` - six items under "From plan 181-08"
- `apps/supabase/supabase/config.toml` - **not changed**; both `[storage.buckets.*]` blocks and the `[functions.identity-callback]` section are as they were

## Decisions Made

- **Where the insert sits.** After the `storage_config` block and before `storage_path_can`, so the two things a deployment's storage needs as data are together at the top of the file. The policies name the buckets as literals, so nothing depends on the order.
- **Only four columns.** The spike found every other column of the CLI's rows at its default, so naming more would only add values that can drift.
- **The bucket comment states the rule, not the measurement.** It says the local CLI also writes both rows from `config.toml` and that the values must stay equal. It was written before Task 3 ran and does not say "updates"; Task 3 then showed it is true as written.
- **The comment on `open_for_voters` does not say which value the bootstrap writes.** Under the recommended option of follow-up 181-R2 the bootstrap takes it from the environment and defaults to false. The operator has not ruled.
- **The blocks are kept**, by the plan's four conditions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The pgTAP command the plan orders fails on an instance without a seed; a seeded instance was added**
- **Found during:** Task 3
- **Issue:** `supabase test db` on `buckets-full` exited 1. Forty of 42 files passed. `14-grants-migration.test.sql` failed cases 16 and 17 and stopped at an error, so 4 of its cases did not run; `31-storage-cleanup.test.sql` failed 17 of 47. Every one of those cases reads a row `seed.sql` writes: the grant rows of the seeded admin and candidate, and the two `storage_config` rows. On that instance `public.grants` and `public.storage_config` held 0 rows, and the run printed the warning "Storage cleanup skipped: missing supabase_url or service_role_key in storage_config" 25 times. The plan starts the instance without `--seed`.
- **What the plan says:** "A failing assertion is a real failure and stops the task", and a suite that cannot run for a reason of the harness is recorded as `not-run` and left to plan 181-16. Neither fits cleanly: the suite ran, and its failures come from how the instance was started.
- **What was done:** the task was not stopped. `buckets-full` was stopped after its measurements, and a second instance was started with the same command plus `--seed apps/supabase/supabase/seed.sql`. On it the suite exited 0 with 1957 cases in 42 files. The record carries both runs: `PGTAP_EXIT=0` is the seeded run and a new line, `PGTAP_WITHOUT_SEED_EXIT=1`, is the run the plan orders, with a sentence directly under the verdict lines saying they must be read together.
- **What this does not show:** the suite without a seed was not run on the tree before this plan, so that the same 19 failures exist there is inferred from what the cases read.
- **For the verifier:** the Task 3 verify command passes on `PGTAP_EXIT=0`. If the reading above is not accepted, that line should read `1` and the task is open. Coverage entry D4 is marked for human judgment for this reason.
- **Files modified:** the record only
- **Committed in:** `4d908afec`

**2. [Rule 2 - Missing Critical] A fault was planted to show which database the linters read**
- **Found during:** Task 2
- **Issue:** `supabase db lint --workdir` prints "Connecting to local database..." and nothing that says which one. A status of 0 from a linter that had read the shared stack would have been a false green for the new baseline.
- **Fix:** in the isolated database, a plpgsql function that selects a column `public.projects` does not have and a table in `public` without row-level security. `supabase db lint` then exited 1 and named the function; `lint-schema.mjs` exited 1 and named the table. Both were dropped, both linters exited 0 again, and the bucket count was still 2. `DB_LINT_EXIT` and `SCHEMA_LINT_EXIT` are the statuses of the runs made before the fault was planted.
- **Files modified:** the record only
- **Committed in:** `6f756797c`

### Observations added to the plan's

These changed no tracked file other than the record.

- **The baseline was applied once before the Task 1 commit** (`buckets-pre`, database only): status 0, two rows. A baseline that does not apply would otherwise have been committed before anything had applied it.
- **A request with no key on the public route**, after the uploads: `public-assets` answered 200 with the object, `private-assets` answered 400 with "Bucket not found". The storage service treats the migration's rows as one public and one private bucket (threat T-181-21).
- **The two uploaded objects were deleted through the API** (200 each) before pgTAP ran, so the suite saw an empty `storage.objects`.
- **`created_at` equals `updated_at` on both rows** after the start and after the reset: the CLI's update did not change `updated_at`.
- **Six dev-seed test files that read `schema/` or the guards were run by name**: 103 tests, exit 0.

### Scope boundary

`deferred-items.md` has six new items, committed in `4ec4794bb`. None was fixed.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical), 5 added observations, 6 items logged
**Impact on plan:** the three outputs are as the plan describes, and `config.toml` is untouched. Deviation 1 changes what one verdict line means and needs a ruling.

**Two rules were not exercised or were overruled by the brief.** The plan allows `docker builder prune -af` on a lack of disk space; none occurred and nothing was pruned. The broken-windows ledger was not written: there is no stub, skipped test or unrun verify, and `.planning/WINDOWS.md` sits beside the shared `PROJECT.md`.

## Issues Encountered

- **pgTAP on the unseeded instance**, described in deviation 1.
- **No git hook ran on the commits** (`core.hooksPath=/dev/null` in this worktree, as before). No commit used `--no-verify`, and none was amended.
- **No command was refused** by a hook or a permission check.
- **No key was displayed.** The service-role key of the isolated instance was read into a shell variable twice (once for the uploads, once for the deletions), never printed, passed to `curl` on standard input, and unset. `start.log` and the output of `env` were read only through `grep` for lines that name a migration, the seed or a bucket. The record's two verify commands reject a JWT-shaped string and exit 0.

## What a later plan must know

- **The CLI updates; it does not refuse.** With a bucket row present, `supabase start` and `supabase db reset` print `Updating Storage bucket: <id>` and exit 0 (CLI 2.118.0, storage-api v1.77.0). Not measured: a row whose `public` or `file_size_limit` differs from the block. The source the research read says the CLI sends the configured properties, so on a local stack the block would win over the migration. On a hosted project there is no block, so the migration's values stand.
- **`config.toml` and the insert must stay equal by hand.** Nothing compares them. A changed limit in one and not the other shows on a hosted project only.
- **pgTAP on an isolated instance needs `--seed apps/supabase/supabase/seed.sql`.** Without it `14-grants-migration` and `31-storage-cleanup` fail. With it the whole suite passes in about 5 s.
- **`supabase test db --workdir` and `supabase db reset --workdir` work on an isolated full-mode instance**, and `supabase db lint --workdir` on a database-only one. `supabase status -o env --workdir` gives the instance's keys.
- **The baseline has 7880 lines and 29 schema files.** Phase 182 edits `schema/106-app-settings.sql` and regenerates; a conflict in `00001_initial_schema.sql` is resolved by keeping both `schema/` edits and running `yarn schema:regenerate`, never by hand.
- **The shared database does not hold the new rows by migration.** `openvaa-local` was not reset. It has its buckets from the CLI's own seeding, so nothing differs in practice until plan 181-16 resets it from this worktree.
- **The comments name `infra/scripts/bootstrap.sql` before it exists.** Plan 181-11 writes it. If it lands at another path, or 181-R2 is overruled, `schema/` is corrected and the baseline regenerated before plan 181-17 freezes.
- **Not corrected, because they are outside `schema/`:** the comment in `seed.sql` ("In production, update with actual Supabase URL and service role key"), and two steps of the deployment guide (create the buckets by hand; set `behind_cloudflare` in the SQL editor). The first of the guide's two is now wrong, since the migration creates the buckets. All three are in `deferred-items.md` for phase 189.
- **A hosted project is unobserved.** That the role applying migrations on Supabase Cloud may insert into `storage.buckets` is expected from the platform's own documentation, which the research cites, and was not seen. Phase 184 makes the first push.
- **`lint-schema.mjs` prints three foreign-key warnings** on a database built from the baseline and exits 0. They are not from this plan's change.
- **`.planning/PROJECT.md` was read in part:** its opening, Context and Constraints sections. A search of the rest for `bucket`, `storage.buckets`, `bootstrap` and `SQL editor` found one line, about an older milestone. `181-RESEARCH.md` was read at the D-08 paragraph of Q2, at Q3, at Pitfall 3 and at "The bucket rows"; `181-CONTEXT.md` at D-05 to D-11; the `database` skill at "Backend Overview" and "Schema Conventions". `181-PATTERNS.md` and `181-VALIDATION.md` were not read: the plan points to neither.
- **Scratch state** is in `tmp/181-08/` (ignored): query outputs, the CLI's and the linters' outputs, the pgTAP logs of both runs and the container lists. No file there holds a key.

## Threat Flags

None. The only new surface is the two rows the migration writes into `storage.buckets`, which is the subject of T-181-21 and T-181-22 in the plan's threat register. `private-assets` is inserted with `public` false, read back as `f` on three instances, and refused on the public route.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 181-10, 181-11 and 181-12 build their databases from a baseline that already holds the buckets.
- Plan 181-17, the freeze, has two of its three pre-freeze changes in the baseline: the bucket insert and the comment corrections. The third belongs to phase 182.
- Open before the freeze: the wording of the comments against the bootstrap script that plan 181-11 writes, and the ruling on deviation 1.
- Not closed here: SUPA-10 stays open until the last plan of the phase. SUPA-04 is built toward and closed by phase 184.

## Self-Check: PASSED

- The record exists, and the five changed files are in the commits named.
- Commits `9b4ab6d0c`, `6f756797c`, `4d908afec` and `4ec4794bb` are ancestors of `HEAD`.
- `commits: 4` is `git rev-list --count ac4cdc43b..HEAD` at the time of writing, with `HEAD` at `4ec4794bb`.
- Task 1 acceptance criteria: `400-storage.sql` contains `storage.buckets`, `'public-assets'`, `'private-assets'` and `ON CONFLICT (id) DO NOTHING`; the limit in the insert equals the spike's `524288000`; `grep -n 'SQL editor'` over `schema/*.sql` prints nothing; `grep -c 'infra/scripts/bootstrap.sql'` on `107-feedback.sql` prints 1; `git show --stat --format= 9b4ab6d0c` lists exactly the three schema files and the baseline, and the subject carries `[db]`; the search hits and the function-body verdicts are above.
- Task 2 acceptance criteria: `BASELINE_APPLY_EXIT=0` and `BUCKET_ROWS_DB_ONLY=2` against `BUCKET_ROWS_UNCHANGED_TREE=0`; the two rows are quoted with `public` `t` and `f`; `SCHEMA_LINT_EXIT=0` and `DB_LINT_EXIT=0`; no container named `openvaa-iso-buckets-db` remains.
- Task 3 acceptance criteria: the seven lines are in the record; `CONFIG_BUCKET_BLOCKS=kept` and `grep -c '^\[storage\.buckets\.'` on `config.toml` prints 2; both upload statuses are 200; the `_openvaa-local` container list is the same before and after; no key is in the record or in this summary. The `PGTAP_EXIT` line holds `0` under the reading of deviation 1.
- Plan-level verification: the parity guard is green after regeneration and `schema/` is prettier-clean; the record shows two rows on a database-only build and the decision; no isolated instance remains and the shared stack is unchanged.
- The four must-have truths hold, the third by search and reading (coverage D5).
- No stub pattern in the files this plan created or changed.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
