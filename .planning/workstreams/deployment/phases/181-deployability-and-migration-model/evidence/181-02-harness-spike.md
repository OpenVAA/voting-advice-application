HARNESS_DB_MODE=ok
HARNESS_DB_COMMAND=node_modules/.bin/supabase db start --workdir <state directory>
HARNESS_FULL_MODE=ok
BUCKET_ROWS_UNCHANGED_TREE=0
BUCKET_FILE_SIZE_LIMIT=524288000
BUCKET_ALLOWED_MIME_TYPES=NULL
DUMP_ROLE=supabase_admin
DUMP_SCOPE=whole-database
DUMP_RESTRICT_KEY=supported
MIGRATION_HISTORY_VERSION_COLUMN=version
SERVICE_ROLE_CAN_INSERT_STORAGE_CONFIG=t
SHARED_STACK_UNTOUCHED=yes

# Harness spike: `apps/supabase/scripts/isolated-instance.sh` on the unchanged tree

Every value above was read from a command's own status or from a file the command wrote. No value was computed. The observations follow in the order they were made.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-12, 16:56:15Z to 16:59:55Z |
| Harness commit of legs 1 and 2 | `d25f60ef2fa1bd64b611118dde5cadf7d5807285` |
| Harness commit of the two later observations | `f2b47175f865c0ad0d86c76d5db86407a3a2e060` (changes only what the harness prints when the CLI fails) |
| Tracked changes in the worktree | none during legs 1 and 2 and during the repeat of leg 1 (`git status --porcelain --untracked-files=no` empty). The failed-start observation ran on the script as it is in `f2b47175f`, a moment before that commit was made, so the script was the one uncommitted file then |
| Migrations given to the harness | `apps/supabase/supabase/migrations` (one file, `00001_initial_schema.sql`) |
| `schema/400-storage.sql` and the baseline | no `INSERT INTO` statement at all in `400-storage.sql`; no `INSERT INTO storage...` in `00001_initial_schema.sql` (both by `grep -i`, status 1) |
| Node | v24.21.0 |
| Supabase CLI | 2.118.0 |
| Docker server | 29.7.2 |
| Host `psql` | 17.6 |
| Images | all present locally; the image list held 30 entries before and after, so nothing was pulled. The "before" count is from the session's output, not from a saved file |

The connection of each instance came from `isolated-instance.sh env --name <id>` and was used through the libpq `PG*` variables. The output of `env` holds the local database password and is not reproduced here. `supabase status` was never run.

## Container lists before and after

`docker ps --format '{{.Names}}'` was written to a file at 16:56:15Z, before the first start, and again at 16:59:55Z, after the last stop. A third sample was taken at 16:58:20Z, after leg 2.

| Comparison | Command | Status |
|------------|---------|--------|
| All 24 names, before against final | `diff` of the two sorted lists | 0 (identical) |
| The 13 names ending `_openvaa-local` | `cmp` | 0 (identical) |
| The 10 names ending `_next-supabase-skimle2` (the unrelated second stack) | `cmp` | 0 (identical) |
| Name and container id of all 24, before against final | `diff` | 0 (identical: no container was recreated) |
| Volumes, before against final | `diff` of `docker volume ls` | 0 (identical, 5 volumes) |
| Networks, before against final | `diff` of `docker network ls` | 0 (identical) |
| Names containing `openvaa-iso-` in `docker ps -a` at the end | `grep -c` | 0 |

Every comparison of the table was also made at 16:58:20Z, against the sample of that moment, with the same results.

The 13 names of the shared stack, identical in every sample: `supabase_analytics_openvaa-local`, `supabase_auth_openvaa-local`, `supabase_db_openvaa-local`, `supabase_edge_runtime_openvaa-local`, `supabase_imgproxy_openvaa-local`, `supabase_inbucket_openvaa-local`, `supabase_kong_openvaa-local`, `supabase_pg_meta_openvaa-local`, `supabase_realtime_openvaa-local`, `supabase_rest_openvaa-local`, `supabase_storage_openvaa-local`, `supabase_studio_openvaa-local`, `supabase_vector_openvaa-local`.

One contact with the unrelated stack, stated for completeness. Before the spike, a refusal test of the harness was run with `--port-base 54330`. The harness's port-in-use test opened and closed one TCP connection, sending nothing, on host port 54331, which the gateway of `next-supabase-skimle2` publishes. The harness then refused with status 4 and started nothing. No connection was made to any port of `openvaa-local`: a port that equals one of the source configuration's ports is refused by comparison, before the listener test.

## Leg 1: database only (`--mode db`)

Command: `bash apps/supabase/scripts/isolated-instance.sh start --name spike-db --mode db --migrations apps/supabase/supabase/migrations`

| Item | Value |
|------|-------|
| Status | 0 |
| Elapsed | 17 s |
| CLI command the harness ran | `node_modules/.bin/supabase db start --workdir <state directory>` |
| Project id | `openvaa-iso-spike-db` |
| Ports written to the copied configuration | 55400 to 55409, in the file order of the port keys: `api.port` 55400, `db.port` 55401, `db.shadow_port` 55402, `db.pooler.port` 55403, `studio.port` 55404, `inbucket.port` 55405, `inbucket.smtp_port` 55406, `inbucket.pop3_port` 55407, `edge_runtime.inspector_port` 55408, `analytics.port` 55409 |
| Containers it created | one: `supabase_db_openvaa-iso-spike-db`, image `public.ecr.aws/supabase/postgres:17.6.1.171`, publishing 55401 |
| Volume and network it created | `supabase_db_openvaa-iso-spike-db`, `supabase_network_openvaa-iso-spike-db` |

The CLI's output, whole (it holds no key in this mode):

```
WARN: config section [inbucket] is deprecated. Please use [local_smtp] instead.
Starting database...
Initialising schema...
Seeding globals from roles.sql...
Applying migration 00001_initial_schema.sql...
{"status":"started","message":"Started local database."}
```

followed by the CLI's notice that release 2.120.0 exists.

### Queries, each through `psql -X -At -v ON_ERROR_STOP=1`, each with status 0

| Query | Result |
|-------|--------|
| `select current_setting('server_version')` | `17.6` |
| `to_regclass` of `auth.users`, `storage.objects`, `storage.buckets`, each `is not null` | `t`, `t`, `t` |
| Columns of `storage.buckets`, in order | `id:text`, `name:text`, `owner:uuid`, `created_at:timestamp with time zone`, `updated_at:timestamp with time zone`, `public:boolean`, `avif_autodetection:boolean`, `file_size_limit:bigint`, `allowed_mime_types:ARRAY`, `owner_id:text`, `type:USER-DEFINED`, `versioning_status:text`, `lifecycle_configuration:jsonb`, `lifecycle_configuration_generation:uuid` |
| `select count(*) from pg_tables where schemaname = 'public'` | `21` |
| `select to_regclass('public.projects') is not null` | `t` |
| `select count(*) from storage.buckets` | `0` |
| Columns of `supabase_migrations.schema_migrations`, in order | `version:text`, `statements:ARRAY`, `name:text` |
| `select version, name from supabase_migrations.schema_migrations order by version` | one row: `00001`, `initial_schema` |
| `select has_table_privilege('service_role', 'public.storage_config', 'INSERT')` | `t` |
| `select count(*) from public.storage_config` | `0` |
| `select count(*) from public.projects` | `0` |
| `select count(*) from storage.migrations` | `73` |

`storage.buckets` has the `public` and `file_size_limit` columns, the baseline applied, and no bucket row exists. `select count(*) from storage.buckets` returning `0` is the red control of the bucket criterion, seen on the tree before the insert is written. `storage.migrations` holding 73 rows shows that the platform's storage schema was built by the CLI with no storage container.

### `pg_dump` inside the database container

Each command was `docker exec -e PGPASSWORD=... supabase_db_openvaa-iso-spike-db pg_dump ...`, with standard output and standard error in separate files.

| Command (after `pg_dump`) | Status | Standard error | Output |
|---------------------------|--------|----------------|--------|
| `--version` | 0 | empty | `pg_dump (PostgreSQL) 17.6` |
| `-U supabase_admin -d postgres --schema-only` | 0 | empty | 612535 bytes, 16292 lines |
| `-U postgres -d postgres --schema-only` | 0 | empty | 612535 bytes, 16292 lines |
| `-U supabase_admin -d postgres --schema-only -n public -n private -n storage` | 0 | empty | 417112 bytes, 10586 lines |
| `-U postgres -d postgres --schema-only -n public -n private -n storage` | 0 | empty | 417112 bytes, 10586 lines |
| `-U supabase_admin -d postgres --schema-only -n public --restrict-key=spikeRestrictKey0123456789` | 0 | empty | 267139 bytes, 7156 lines |
| `-U postgres -d postgres --schema-only -n public --restrict-key=spikeRestrictKey0123456789` | 0 | empty | 267139 bytes, 7156 lines |
| `-U supabase_admin -d postgres --schema-only -n private`, run with no `PGPASSWORD` | 0 | empty | not counted |

What the dump files show:

- The whole-database dump completes as `supabase_admin` and as `postgres`. The plan's order is `supabase_admin` first, so `DUMP_ROLE=supabase_admin`. The dump of the three named schemas was run although the whole-database dump was not refused.
- The two whole-database dumps differ in exactly two lines, `\restrict <key>` and `\unrestrict <key>`. Without the option, `pg_dump` 17.6 writes a new random key on every run. With those two lines removed, `diff` of the two dumps exits 0 with no output. A text comparison of two dumps therefore needs either `--restrict-key` with a fixed value or those two lines removed.
- With `--restrict-key=spikeRestrictKey0123456789` the dump holds `\restrict spikeRestrictKey0123456789` and `\unrestrict spikeRestrictKey0123456789`, one line each.
- Lines starting `ALTER ROLE`: 0 in every dump, the whole-database ones included.
- Lines starting `CREATE EXTENSION`: 5 in the whole-database dump, 0 in the named-schemas dump.
- Lines starting `CREATE SCHEMA` in the whole-database dump: 12 (`_realtime`, `auth`, `extensions`, `graphql`, `graphql_public`, `pgbouncer`, `private`, `realtime`, `storage`, `supabase_functions`, `supabase_migrations`, `vault`); 3 in the named-schemas dump.
- Inside the container the dump also completes with no password in the environment.

Only the container's `pg_dump` was run. The host's `pg_dump` 17.6 was not.

### Stop

`bash apps/supabase/scripts/isolated-instance.sh stop --name spike-db`: status 0, 1 s. Afterwards `list` printed nothing, no name containing `openvaa-iso-` was in `docker ps -a`, and the volume, network and container lists equalled the lists taken before the start.

The fallback (`supabase start` with every service except the database excluded) was not needed and was not run.

## Leg 2: with services (`--mode full`)

Command: `bash apps/supabase/scripts/isolated-instance.sh start --name spike-full --mode full --port-base 55600 --migrations apps/supabase/supabase/migrations`

| Item | Value |
|------|-------|
| Status | 0 |
| Elapsed | 28 s |
| CLI command the harness ran | `node_modules/.bin/supabase start --workdir <state directory> -x realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor` |
| Where the excluded names came from | the bracketed list on the `--exclude` line of `supabase start --help`: `gotrue,realtime,storage-api,imgproxy,kong,mailpit,postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor`, less the four the harness keeps (`kong`, `gotrue`, `postgrest`, `storage-api`) |
| Project id | `openvaa-iso-spike-full` |
| Ports written to the copied configuration | 55600 to 55609 |
| Containers it created | five: `supabase_db_...` (`postgres:17.6.1.171`, publishing 55601), `supabase_kong_...` (`kong:2.8.1`, publishing 55600), `supabase_auth_...` (`gotrue:v2.197.0`), `supabase_rest_...` (`postgrest:v16.3`), `supabase_storage_...` (`storage-api:v1.77.0`); each name ends `_openvaa-iso-spike-full` |

The bucket lines the CLI printed, with their line numbers in its output:

```
6:Creating Storage bucket: public-assets
7:Creating Storage bucket: private-assets
```

The five lines before them are the five lines of leg 1 up to `Applying migration 00001_initial_schema.sql...`. The line after them is the CLI's status line. It holds the instance's API keys and secrets and is not reproduced; this is the reason the harness never prints the CLI's output of a start that succeeded.

### Queries, each with status 0

`SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets ORDER BY id`:

```
private-assets|private-assets|f|524288000|
public-assets|public-assets|t|524288000|
```

| Query | Result |
|-------|--------|
| `allowed_mime_types IS NULL`, per row | `t`, `t` |
| `pg_typeof(file_size_limit)`, per row | `bigint`, `bigint` |
| `owner IS NULL`, `owner_id IS NULL`, `avif_autodetection`, `type`, per row | `t`, `t`, `f`, `STANDARD` on both rows |
| `select count(*) from storage.buckets` | `2` |
| `select count(*) from pg_tables where schemaname = 'public'` | `21` |
| `select version, name from supabase_migrations.schema_migrations order by version` | one row: `00001`, `initial_schema` |

The property values an insert has to carry to equal what the CLI writes from the two `[storage.buckets.*]` blocks: `id` and `name` equal to the bucket's name, `public` `true` for `public-assets` and `false` for `private-assets`, `file_size_limit` `524288000` on both, `allowed_mime_types` `NULL` on both.

Two requests through the instance's own gateway, with no key sent, only the status code kept: `GET /storage/v1/status` answered 200 and `GET /auth/v1/health` answered 200.

### Stop

`bash apps/supabase/scripts/isolated-instance.sh stop --name spike-full`: status 0, 2 s. Afterwards `list` printed nothing and the container, volume and network lists equalled the lists taken before the first start.

## Two observations beyond the plan's two legs

Both were made with the harness script as it is at commit `f2b47175f`.

**A start that fails leaves nothing behind.** `start --name spike-fail --mode db --port-base 55700 --migrations <a scratch directory>` with one migration holding `CREATE TABLE public.spike_probe (id int PRIMARY KEY);` and `SELECT this_function_does_not_exist();`. Status 5 after 17 s. The harness printed the CLI's output, ending:

```
Applying migration 00001_broken.sql...
Stopping containers...
{"_tag":"Error","error":{"code":"MigrationApplyError","message":"ERROR: function this_function_does_not_exist() does not exist (SQLSTATE 42883)\nAt statement: 1\nSELECT this_function_does_not_exist()\n       ^"}}
isolated-instance.sh: FATAL -- the CLI exited 1 while starting openvaa-iso-spike-fail
```

Afterwards `list` printed nothing, no `openvaa-iso-` name was in `docker ps -a`, and the volume, network and container lists equalled the lists taken before the spike. So a migration that does not apply makes `supabase db start` exit 1, and the harness reports that as 5.

**The database-only leg again, on the final script.** `start --name spike-db --mode db`: status 0, 17 s. `select count(*) from storage.buckets`: `0`. Tables in `public`: `21`. `stop`: status 0.

## What was not measured

- **Whether the CLI updates a bucket row that a migration already inserted.** On the unchanged tree no migration inserts one, so the CLI printed `Creating Storage bucket:` for both. Its behaviour when the row exists is still read from source only. The plan that writes the insert has to observe it.
- **`supabase db reset` on an isolated instance.** Not run.
- **An upload to either bucket, and image transformation.** Not run. The storage container reported healthy with `imgproxy` excluded although the configuration enables image transformation; no transformation request was made.
- **`--seed` and `--tests`.** Neither flag was used with a started instance. Both are checked only as far as a missing path is a usage error.
- **Two instances at the same moment.** The legs ran one after the other.
- **An interrupt during a start** (status 130). Not exercised.
- **Free disk space in the Docker VM.** Not read. No start reported a lack of space, and nothing was pruned.
