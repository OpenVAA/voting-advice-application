BASELINE_APPLY_EXIT=0
BUCKET_ROWS_DB_ONLY=2
BUCKET_ROWS_MATCH_CLI=yes
DB_LINT_EXIT=0
SCHEMA_LINT_EXIT=0

# The bucket rows of the regenerated baseline, on a database-only isolated instance

Every value above was read from a command's own status or from a file the command wrote. No status was read through a pipe. The schema apply of this record is local: nothing was pushed to a hosted project.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-12, 18:19:28Z to 18:20:30Z |
| Commit | `9b4ab6d0cdba5c1c44b2f09cfcdbd84f247e434b`, the commit that inserts the rows and regenerates the baseline |
| Tracked changes in the worktree | none before the start and none after the stop (`git status --porcelain --untracked-files=no` empty both times) |
| Migrations given to the harness | `apps/supabase/supabase/migrations` (one file, `00001_initial_schema.sql`) |
| Seed | none (`--seed` not given, so seeding is off in the copied configuration) |
| Node | v24.21.0 |
| Supabase CLI | 2.118.0 |
| Database image | `public.ecr.aws/supabase/postgres:17.6.1.171` |

The connection came from `isolated-instance.sh env --name buckets-db` and was used through the libpq `PG*` variables. The output of `env` holds the local database password and is not reproduced here. `supabase status` was not run in this part.

## The start

Command: `bash apps/supabase/scripts/isolated-instance.sh start --name buckets-db --mode db --migrations apps/supabase/supabase/migrations`

| Item | Value |
|------|-------|
| Status | 0 |
| Elapsed | 15 s |
| Project id | `openvaa-iso-buckets-db` |
| Ports | 55400 to 55409; the database on 55401 |
| Containers it created | one: `supabase_db_openvaa-iso-buckets-db` |

Two lines of the CLI's output, taken from `start.log` with `grep -n`:

```
4:Seeding globals from roles.sql...
5:Applying migration 00001_initial_schema.sql...
```

The same search finds no line containing `Storage bucket`: no storage service ran, so the CLI seeded no bucket. The rows below can only have come from the migration.

## The rows

Each query ran through `psql -X -At -v ON_ERROR_STOP=1` and exited 0.

`SELECT count(*) FROM storage.buckets`:

```
2
```

`SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets ORDER BY id`:

```
private-assets|private-assets|f|524288000|
public-assets|public-assets|t|524288000|
```

`public` is `t` for `public-assets` and `f` for `private-assets`.

The spike read these two lines from an instance the CLI had seeded from the `[storage.buckets.*]` blocks (`evidence/181-02-harness-spike.md`, leg 2):

```
private-assets|private-assets|f|524288000|
public-assets|public-assets|t|524288000|
```

`cmp` of the query's output file against those two lines exits 0, which is `BUCKET_ROWS_MATCH_CLI=yes`.

The columns the insert does not name, read per row with `SELECT id, allowed_mime_types IS NULL, pg_typeof(file_size_limit), owner IS NULL, owner_id IS NULL, avif_autodetection, type FROM storage.buckets ORDER BY id`:

```
private-assets|t|bigint|t|t|f|STANDARD
public-assets|t|bigint|t|t|f|STANDARD
```

These equal the values the spike read on the CLI-seeded rows (`allowed_mime_types` null, `file_size_limit` a `bigint`, `owner` and `owner_id` null, `avif_autodetection` false, `type` `STANDARD`). `created_at` and `updated_at` were not compared.

## The red control

`evidence/181-02-harness-spike.md` records `BUCKET_ROWS_UNCHANGED_TREE=0`: the same build (`--mode db`, the same migrations directory, no seed) of the tree before the insert existed held no row in `storage.buckets`. The count is 2 on this tree.

## No seed ran

| Query | Result |
|-------|--------|
| `SELECT count(*) FROM auth.users` | `0` |
| `SELECT count(*) FROM public.accounts` | `0` |
| `SELECT count(*) FROM public.projects` | `0` |
| `SELECT count(*) FROM public.storage_config` | `0` |
| `SELECT count(*) FROM storage.objects` | `0` |
| `SELECT singleton, behind_cloudflare FROM private.deployment_settings` | `t\|f` (the row the migration inserts, with the value it ships) |
| `select version, name from supabase_migrations.schema_migrations order by version` | one row: `00001\|initial_schema` |
| `select count(*) from pg_tables where schemaname = 'public'` | `21` |
| `select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'` | `15` |
| `select current_setting('server_version')` | `17.6` |

## Lint of the applied database

| Command | Status | Output |
|---------|--------|--------|
| `node_modules/.bin/supabase db lint --workdir <ISO_WORKDIR> --schema public --fail-on warning` | 0 | standard output `{"results":[],"message":"db lint"}`; standard error `Connecting to local database...`, `Linting schema: public`, `No schema errors found` |
| `node apps/supabase/scripts/lint-schema.mjs`, with `DATABASE_URL` built in the shell from the instance's `PG*` values | 0 | `Summary: 0 error(s), 3 warning(s)`; census line `policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)` |

The three warnings are of the check "Foreign keys without indexes": `constituency_group_constituencies.constituency_id`, `election_constituency_groups.constituency_group_id` and `nominations.created_by`. The script exits 0 on warnings unless `--strict` is given, and the repository's `lint:schema` script does not give it. This plan changed none of those tables. Whether the same three warnings appear on the tree before this plan was not run.

### That both linters read this instance and not the shared stack

`supabase db lint` prints only "Connecting to local database...", which does not say which one. So a fault was planted in the isolated database and removed again:

| Step | Status | Observation |
|------|--------|-------------|
| `CREATE FUNCTION public.iso_lint_probe()` (a plpgsql body that selects a column `public.projects` does not have) and `CREATE TABLE public.iso_lint_probe_table (id integer PRIMARY KEY)` | 0 | |
| `supabase db lint --workdir <ISO_WORKDIR> --schema public --fail-on warning` | 1 | the output names `iso_lint_probe` |
| `node apps/supabase/scripts/lint-schema.mjs` with the same `DATABASE_URL` | 1 | `public.iso_lint_probe_table` under the row-level-security check; `Summary: 1 error(s), 3 warning(s)` |
| `DROP FUNCTION` and `DROP TABLE` | 0 | |
| `supabase db lint`, again | 0 | `{"results":[],"message":"db lint"}` |
| `node apps/supabase/scripts/lint-schema.mjs`, again | 0 | `Summary: 0 error(s), 3 warning(s)` |

The two objects never existed in any other database. `SELECT count(*) FROM storage.buckets` was still `2` after the control. `DB_LINT_EXIT` and `SCHEMA_LINT_EXIT` at the top of this record are the statuses of the first runs, made before the fault was planted.

## The stop

`bash apps/supabase/scripts/isolated-instance.sh stop --name buckets-db`: status 0. Afterwards `list` printed nothing; no container, volume or network with `openvaa-iso-` in its name was left; and `cmp` of the sorted `docker ps --format '{{.Names}}'` list against the list taken before the plan's first start exits 0 (24 names, 13 of them ending `_openvaa-local`).

## One earlier start, before the commit

Before commit `9b4ab6d0c` was made, the same build was started once on the working tree that became that commit (`--name buckets-pre`): status 0, count `2`, the same two rows, stop 0. It was made so that a baseline that does not apply would not be committed. The record above is of the committed tree.

## What was not measured

- A hosted project. Whether the role that applies migrations on Supabase Cloud may insert into `storage.buckets` is not observed here, and which role the local CLI applies the migration as was not read. Phase 184 makes the first push.
- `created_at` and `updated_at` of the rows.
- pgTAP on this database-only instance.

# The CLI beside rows that already exist

CLI_START_WITH_ROWS_EXIT=0
CLI_RESET_WITH_ROWS_EXIT=0
BUCKET_ROWS_AFTER_RESET=2
UPLOAD_PUBLIC_HTTP=200
UPLOAD_PRIVATE_HTTP=200
PGTAP_EXIT=0
PGTAP_WITHOUT_SEED_EXIT=1
CONFIG_BUCKET_BLOCKS=kept

`PGTAP_EXIT` and `PGTAP_WITHOUT_SEED_EXIT` are two runs of the same suite on two instances and must be read together. The command the plan orders, on the instance started without a seed, exited 1. The same suite on an instance started with `seed.sql` exited 0. Both are described under "pgTAP" below.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-12, 18:22:07Z to 18:25:43Z |
| Commit | `6f756797c`, whose `schema/`, baseline and `config.toml` are those of `9b4ab6d0c` (the commit between them adds only this record) |
| Tracked changes in the worktree | none before the first start and none after the last stop |
| `config.toml` | both `[storage.buckets.*]` blocks present (`grep -c '^\[storage\.buckets\.'` prints 2) |
| Storage image | `public.ecr.aws/supabase/storage-api:v1.77.0` |
| Supabase CLI | 2.118.0 |

## Start with the rows and the blocks both present

Command: `bash apps/supabase/scripts/isolated-instance.sh start --name buckets-full --mode full --port-base 55600 --migrations apps/supabase/supabase/migrations --tests apps/supabase/supabase/tests`

Status 0 after 27 s. Five containers, each name ending `_openvaa-iso-buckets-full`: database, gateway, auth, PostgREST and storage. No seed.

The lines of the CLI's output that name a migration or a bucket, taken from `start.log` with `grep -n` into a file:

```
5:Applying migration 00001_initial_schema.sql...
6:Updating Storage bucket: public-assets
7:Updating Storage bucket: private-assets
```

On the tree before the insert the CLI printed `Creating Storage bucket:` for both (`evidence/181-02-harness-spike.md`, leg 2). With the rows in place it prints `Updating Storage bucket:` and exits 0. The rest of `start.log` is not reproduced: its last line holds the instance's keys.

Rows afterwards, each query with status 0:

| Query | Result |
|-------|--------|
| `SELECT count(*) FROM storage.buckets` | `2` |
| `SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets ORDER BY id` | `private-assets\|private-assets\|f\|524288000\|` and `public-assets\|public-assets\|t\|524288000\|` |
| `allowed_mime_types IS NULL`, `pg_typeof(file_size_limit)`, `owner IS NULL`, `owner_id IS NULL`, `avif_autodetection`, `type`, `created_at = updated_at`, per row | `t`, `bigint`, `t`, `t`, `f`, `STANDARD`, `t` on both rows |
| counts of `auth.users`, `public.accounts`, `storage.objects` | `0`, `0`, `0` |

`cmp` of the second query's output against the two lines the spike read exits 0. `created_at` equals `updated_at` on both rows, so the CLI's update did not change `updated_at`.

## `supabase db reset` on the same instance

Command: `node_modules/.bin/supabase db reset --workdir <ISO_WORKDIR>`

Status 0 after 26 s. Standard error, whole (it holds no key; a search for key-shaped text found none), less the CLI's two-line notice that a newer release exists:

```
Resetting local database...
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Recreating database...
Initialising schema...
Seeding globals from roles.sql...
Applying migration 00001_initial_schema.sql...
Restarting containers...
Updating Storage bucket: public-assets
Updating Storage bucket: private-assets
Finished supabase db reset on branch main.
```

Standard output: `{"target":"local","version":"","message":"Reset local database."}`.

Rows afterwards, each query with status 0:

| Query | Result |
|-------|--------|
| `SELECT count(*) FROM storage.buckets` | `2` |
| `SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets ORDER BY id` | `private-assets\|private-assets\|f\|524288000\|` and `public-assets\|public-assets\|t\|524288000\|` |
| the per-row properties as above | `t`, `bigint`, `t`, `t`, `f`, `STANDARD`, `t` on both rows |
| counts of `auth.users`, `public.accounts`, `storage.objects` | `0`, `0`, `0` |
| `select version, name from supabase_migrations.schema_migrations order by version` | one row: `00001\|initial_schema` |

`cmp` against the spike's two lines exits 0 again. `GET /storage/v1/status` through the instance's gateway answered 200 at the first try after the reset.

## One upload to each bucket

The service-role key was read from `supabase status -o env --workdir <ISO_WORKDIR>` into a shell variable, given to `curl` on standard input as a configuration (`-K -`), and unset afterwards. It was not printed, not written to a file and not put on a command line.

Request: `POST <ISO_API_URL>/storage/v1/object/<bucket>/probe/upload-check.txt`, `Content-Type: text/plain`, a 19-byte body.

| Bucket | HTTP status | Response body |
|--------|-------------|---------------|
| `public-assets` | 200 | `{"Key":"public-assets/probe/upload-check.txt","Id":"<a uuid>"}` |
| `private-assets` | 200 | `{"Key":"private-assets/probe/upload-check.txt","Id":"<a uuid>"}` |

`SELECT bucket_id, name, (metadata->>'size')::int, metadata->>'mimetype' FROM storage.objects ORDER BY bucket_id` afterwards:

```
private-assets|probe/upload-check.txt|19|text/plain
public-assets|probe/upload-check.txt|19|text/plain
```

One request beyond the plan, sent with no key, on the route that serves public buckets (`GET /storage/v1/object/public/<bucket>/probe/upload-check.txt`): `public-assets` answered 200 with the 19 bytes; `private-assets` answered 400 with the body `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found","code":"NoSuchBucket"}`. So the storage service serves the first bucket as public and refuses the second on that route, from rows the migration inserted.

Both objects were then deleted through the API (`DELETE`, status 200 each), and `SELECT count(*) FROM storage.objects` was `0` before the test suite ran.

## pgTAP

### On the instance without a seed (the plan's command)

`node_modules/.bin/supabase test db --workdir <ISO_WORKDIR>` on `buckets-full`: **status 1**. Summary lines:

```
Files=42, Tests=1953,  4 wallclock secs ( 0.10 usr  0.05 sys +  0.19 cusr  0.12 csys =  0.46 CPU)
Result: FAIL
```

Forty files passed. Two did not:

| File | Result | What the failing cases read |
|------|--------|-----------------------------|
| `14-grants-migration.test.sql` | cases 16 and 17 failed with `have: NULL`; the script then stopped at an error raised by `set_test_user` for the identity `00000000-0000-0000-0000-000000000010`, so 17 of its 21 planned cases ran | the grant rows of "the seeded admin" and "the seeded candidate", which `seed.sql` writes. `public.grants` held 0 rows on this instance |
| `31-storage-cleanup.test.sql` | 17 of 47 cases failed (1, 3, 22, 23, 27 to 29, 32, 33, 36 to 41, 45, 46), all of them cases about the DELETE requests the cleanup triggers enqueue | the two `public.storage_config` rows, which `seed.sql` writes. The table held 0 rows on this instance, and the run printed 25 times the warning `Storage cleanup skipped: missing supabase_url or service_role_key in storage_config` |

In all, 19 cases failed and 4 did not run. Every one of them reads a row that `seed.sql` writes, and the instance was started without `--seed`, as the plan orders.

### On an instance with the seed

Because the cause had to be measured and not judged, a second instance was started with the repository's seed file and nothing else changed: `start --name buckets-seeded --mode full --port-base 55600 --migrations apps/supabase/supabase/migrations --seed apps/supabase/supabase/seed.sql --tests apps/supabase/supabase/tests`, after `buckets-full` had been stopped.

Start: status 0. The lines of `start.log` that name a migration, the seed or a bucket:

```
5:Applying migration 00001_initial_schema.sql...
6:Seeding data from supabase/seed.sql...
7:Updating Storage bucket: public-assets
8:Updating Storage bucket: private-assets
```

The two bucket rows equal the two lines above. `public.storage_config` held 2 rows, `public.grants` 2, `public.accounts` 1 and `auth.users` 2.

`node_modules/.bin/supabase test db --workdir <ISO_WORKDIR>`: **status 0**. Summary lines:

```
All tests successful.
Files=42, Tests=1957,  4 wallclock secs ( 0.09 usr  0.04 sys +  0.18 cusr  0.12 csys =  0.43 CPU)
Result: PASS
```

All 42 files end `ok`. Afterwards `storage.buckets` held 2 rows and `storage.objects` 0.

`PGTAP_EXIT=0` at the top of this part is this run. It is the suite on a database built from the regenerated baseline and the repository's seed, which is how `yarn db:reset` builds the stack the suite is normally run on. `PGTAP_WITHOUT_SEED_EXIT=1` is the run before it.

Not run: the suite without a seed on the tree before this plan. That the 19 failures and 4 unrun cases exist there too is inferred from what they read, not observed.

## The decision

Tolerated, by the four conditions the plan sets: the start and the reset both exited 0, `storage.buckets` held exactly two rows with the declared properties after each, and both uploads were accepted. The two `[storage.buckets.*]` blocks stay. `apps/supabase/supabase/config.toml` was not edited, and `grep -c '^\[storage\.buckets\.'` over it prints 2.

## Stops and the shared stack

`stop --name buckets-full`: status 0. `stop --name buckets-seeded`: status 0. After the last stop `list` printed nothing, and no container, volume or network with `openvaa-iso-` in its name was left.

`docker ps` before the plan's first start against after its last stop:

| Comparison | Command | Status |
|------------|---------|--------|
| All 24 names | `cmp` of the two sorted lists | 0 |
| The 13 names ending `_openvaa-local` | `cmp` | 0 |
| Container id and name of all 24 | `cmp` | 0 (no container was recreated) |

## What was not measured in this part

- **A row whose properties differ from the configuration.** The inserted values equal the declared ones, so whether the CLI's update would overwrite a different `public` or `file_size_limit` was not seen. The source read by the research says it sends the configured properties.
- **A start in which the storage service finds one bucket row and not the other.**
- **Image transformation and an object near the size limit.** One 19-byte text object per bucket was uploaded.
- **The suite on the shared stack.** Nothing in this record touched `openvaa-local`.
- **A hosted project.**
