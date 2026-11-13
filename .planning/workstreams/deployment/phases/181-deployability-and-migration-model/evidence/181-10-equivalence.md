RED_COLUMN_GRANT_EXIT=1
RED_POLICY_EXIT=1
RED_FUNCTION_BODY_EXIT=1
RED_BUCKET_ROW_EXIT=1
RED_ROLE_SETTING_EXIT=1
RED_FLOOR_EXIT=2
EQUIVALENCE_TREE_EXIT=0
BUILD_FAILURE_EXIT=2
EXISTING_INSTANCE_EXIT=2
INTERRUPT_SIGTERM_EXIT=130
INTERRUPT_SIGINT_GROUP_EXIT=130
SHARED_STACK_UNTOUCHED=yes
TWO_INSTANCES_AT_ONCE=not-tried

# Equivalence check: `apps/supabase/scripts/check-schema-equivalence.sh` on five planted differences, the floor, and the tree

The lines above are the statuses of the script itself. Each was read from `$?` of the command, with the command's output sent to a file; none was read through a pipe, and none was typed: the block was written by the shell from the status files. `EQUIVALENCE_TREE_EXIT` is the status of the last run made, after every control had been seen to fail. The seven lines the plan names come first; the lines after them are observations this plan added.

## What was run on

| Item | Value |
|------|-------|
| Date | 2026-10-12, 19:09:54Z to 19:14:12Z (every run this record quotes) |
| Tree | commit `132f0e5c4e63362cfc8d0f6fa489579ed2c67421`, with no tracked file changed: `git status --porcelain --untracked-files=no` printed nothing before each run (the driver refuses to run otherwise) and after the last |
| The script | `sha256 adb27e678c2348f212e37024ce5f214b2b8c94ce40a64e4269579f04dbc6ac34`. Commit `132f0e5c4` changes one comment line of commit `2446b0333`; every run below was made again on `132f0e5c4` |
| Node | v24.21.0 |
| Supabase CLI | 2.118.0 (the `version` of `node_modules/supabase/package.json`; the CLI itself was called only by `isolated-instance.sh`) |
| Docker server | 29.7.2 |
| Database image | `public.ecr.aws/supabase/postgres:17.6.1.171`, with its own `pg_dump` and `psql` 17.6 |
| Instances | `eq-m` on port base 55400 and `eq-s` on port base 55500, both database only, through `apps/supabase/scripts/isolated-instance.sh`. No other name or base was used |
| Scratch copies | `<scratch>` below is a directory of the session's scratch area, outside the repository. Each control has a full copy of `apps/supabase/supabase/schema/` there with one line changed. The real `schema/` was never edited |

In every quoted output the repository root is cut from the front of a path and the scratch directory is written `<scratch>`. Nothing else in a quoted line is changed, except where a line is said to be left out.

## Container lists before and after

`docker ps --format '{{.Names}} {{.ID}}'`, sorted, was written to a file at 18:56:54Z, before the first instance of the plan was started, and again after the last run.

| Comparison | Command | Status |
|------------|---------|--------|
| Name and container id of all 24 containers | `diff` of the two files | 0 (identical: none was recreated) |
| The 13 names ending `_openvaa-local`, with their ids | `cmp` | 0 (identical) |
| The 10 names ending `_next-supabase-skimle2`, with their ids | `cmp` | 0 (identical) |
| Volumes (`docker volume ls`, 5 names) | `diff` | 0 (identical) |
| Networks (`docker network ls`, 5 names) | `diff` | 0 (identical) |
| Names containing `openvaa-iso-` in `docker ps -a` at the end | `grep -c` | 0 |
| `isolated-instance.sh list` at the end | | prints nothing, status 0 |
| Working directories of the script left under `$TMPDIR` (`openvaa-equivalence.*`) | `ls`, `grep -c` | 0 |

The 13 containers of the shared stack, by name and id, the same in both files:

```
supabase_analytics_openvaa-local 62b44bd0bb7b
supabase_auth_openvaa-local 9e057ac30d5f
supabase_db_openvaa-local 97832a4baa14
supabase_edge_runtime_openvaa-local d0a551b87911
supabase_imgproxy_openvaa-local fd964d3d23d0
supabase_inbucket_openvaa-local abf7d269c686
supabase_kong_openvaa-local b72baaded69a
supabase_pg_meta_openvaa-local 24a13b49ea64
supabase_realtime_openvaa-local 423ece62267f
supabase_rest_openvaa-local 05a264f2c16e
supabase_storage_openvaa-local 016fc509e972
supabase_studio_openvaa-local 3fc7e1104a2a
supabase_vector_openvaa-local 01a22500fc26
```

The 24th container is `my-redis`, which belongs to neither stack; its id is unchanged too.

## The first run on the tree, which kept the snapshot of the migrations side

`bash apps/supabase/scripts/check-schema-equivalence.sh --out tmp/181-10/out`: status 0 in 33 s. It built both sides and left `migrations.snapshot.sql`, `schema.snapshot.sql` (602840 bytes each, `cmp` status 0) and an empty `equivalence.diff`. The snapshot of the migrations side was copied and given to every control through `--reuse-m`; its `sha256` is `3bacd754c68f16c8f85478140b03a8293b711d9b1d6b718048b6403b4497915a`.

This status is not the recorded green. A check that has not been seen to fail has not been shown to compare anything, so the green of this record is the run made after the controls.

A build of the same migrations made about five minutes earlier, on commit `2446b0333`, gave a snapshot with the same `sha256`. Two builds of one input at two moments produced the same bytes.

## The five planted differences

Each control is `bash apps/supabase/scripts/check-schema-equivalence.sh --schema-dir <scratch>/<control>/schema --reuse-m tmp/181-10/m-kept.snapshot.sql`. The change in each copy was made by one substitution that fails when its pattern is not found, and `diff -r` of the real `schema/` against the copy then showed the one line of the table and nothing else.

| Key | The one line changed in the copy | Status | Elapsed | What the script named |
|-----|----------------------------------|--------|---------|------------------------|
| `RED_COLUMN_GRANT_EXIT` | `303-column-grants.sql`: the line `color,` removed from the column list of `GRANT UPDATE (...) ON public.candidates TO authenticated` | 1 | 17 s | `Name: COLUMN candidates.color; Type: ACL; Schema: public; Owner: postgres` |
| `RED_POLICY_EXIT` | `302-rls.sql`: in the `USING` expression of the policy `admin_delete_accounts`, `user_can ('global', NULL::uuid, 'account.edit_settings')` became `user_can ('account', id, 'account.edit_settings')` | 1 | 16 s | `Name: accounts admin_delete_accounts; Type: POLICY; Schema: public; Owner: postgres` |
| `RED_FUNCTION_BODY_EXIT` | `502-email-helpers.sql`: inside the body of `resolve_email_variables`, the fallback locale `'en'` of one `COALESCE` became `'fi'` | 1 | 17 s | `Name: resolve_email_variables(uuid, uuid[], text, text); Type: FUNCTION; Schema: public; Owner: postgres` |
| `RED_BUCKET_ROW_EXIT` | `400-storage.sql`: `false` became `true` in the row of `private-assets` | 1 | 17 s | `Query: rows of storage.buckets, as id\|name\|public\|file_size_limit\|allowed_mime_types`, and the row `private-assets` in the diff |
| `RED_ROLE_SETTING_EXIT` | `001-role-settings.sql`: `statement_timeout = '8s'` became `statement_timeout = '9s'` | 1 | 17 s | `Query: role settings (pg_db_role_setting), as role\|database\|setting`, and the row of the role `anon` in the diff |

Elapsed is the driver's clock around the whole command. The script's own count, in its verdict line, can be a second lower.

The last two are the controls that show the catalog queries work: a schema-only dump holds neither a row nor a role setting, and in both the only lines of the diff are lines the queries wrote.

The census each control printed is the census of the tree (below) on both sides, with one exception: the column-grant control printed `GRANT 684` for the schema side against `GRANT 685` for the migrations side.

What each control printed after its two census lines follows, whole. The output of every control was also compared with the output of the same control run on commit `2446b0333`: identical apart from the number of seconds.

### `column-grant`

```
check-schema-equivalence.sh: DIFFERENT -- the database built from the schema files in <scratch>/column-grant/schema is not the database built from the reused snapshot tmp/181-10/m-kept.snapshot.sql (16 s). The objects that differ:
  Name: COLUMN candidates.color; Type: ACL; Schema: public; Owner: postgres
The diff. A line starting `-` is in the database built from the migrations only, a line starting `+` in the one built from schema/ only:
--- the database built from migrations
+++ the database built from schema
@@ -14895,13 +14895,6 @@
 
 
 --
--- Name: COLUMN candidates.color; Type: ACL; Schema: public; Owner: postgres
---
-
-GRANT UPDATE(color) ON TABLE public.candidates TO authenticated;
-
-
---
 -- Name: COLUMN candidates.image; Type: ACL; Schema: public; Owner: postgres
 --
 
```

### `policy`

```
check-schema-equivalence.sh: DIFFERENT -- the database built from the schema files in <scratch>/policy/schema is not the database built from the reused snapshot tmp/181-10/m-kept.snapshot.sql (16 s). The objects that differ:
  Name: accounts admin_delete_accounts; Type: POLICY; Schema: public; Owner: postgres
The diff. A line starting `-` is in the database built from the migrations only, a line starting `+` in the one built from schema/ only:
--- the database built from migrations
+++ the database built from schema
@@ -12084,7 +12084,7 @@
 -- Name: accounts admin_delete_accounts; Type: POLICY; Schema: public; Owner: postgres
 --
 
-CREATE POLICY admin_delete_accounts ON public.accounts FOR DELETE TO authenticated USING (( SELECT public.user_can('global'::public.grant_scope_type, NULL::uuid, 'account.edit_settings'::public.grant_permission) AS user_can));
+CREATE POLICY admin_delete_accounts ON public.accounts FOR DELETE TO authenticated USING (( SELECT public.user_can('account'::public.grant_scope_type, accounts.id, 'account.edit_settings'::public.grant_permission) AS user_can));
 
 
 --
```

### `function-body`

```
check-schema-equivalence.sh: DIFFERENT -- the database built from the schema files in <scratch>/function-body/schema is not the database built from the reused snapshot tmp/181-10/m-kept.snapshot.sql (17 s). The objects that differ:
  Name: resolve_email_variables(uuid, uuid[], text, text); Type: FUNCTION; Schema: public; Owner: postgres
The diff. A line starting `-` is in the database built from the migrations only, a line starting `+` in the one built from schema/ only:
--- the database built from migrations
+++ the database built from schema
@@ -3439,7 +3439,7 @@
     -- The user's email and preferred locale. auth.users has no project column; the grant test below bounds recipients to the project.
     SELECT
       au.email,
-      COALESCE(au.raw_user_meta_data->>'preferred_locale', 'en')
+      COALESCE(au.raw_user_meta_data->>'preferred_locale', 'fi')
     INTO u_email, u_locale
     FROM auth.users au
     WHERE au.id = uid;
```

### `bucket-row`

```
check-schema-equivalence.sh: DIFFERENT -- the database built from the schema files in <scratch>/bucket-row/schema is not the database built from the reused snapshot tmp/181-10/m-kept.snapshot.sql (17 s). The objects that differ:
  Query: rows of storage.buckets, as id|name|public|file_size_limit|allowed_mime_types
The diff. A line starting `-` is in the database built from the migrations only, a line starting `+` in the one built from schema/ only:
--- the database built from migrations
+++ the database built from schema
@@ -15962,7 +15962,7 @@
 extension|supabase_vault|0.3.1|vault
 extension|uuid-ossp|1.1|extensions
 -- Query: rows of storage.buckets, as id|name|public|file_size_limit|allowed_mime_types
-storage.buckets|private-assets|private-assets|f|524288000|<null>
+storage.buckets|private-assets|private-assets|t|524288000|<null>
 storage.buckets|public-assets|public-assets|t|524288000|<null>
 -- Query: rows of private.deployment_settings, one JSON object for each row
 private.deployment_settings|{"singleton": true, "behind_cloudflare": false}
```

### `role-setting`

One context line of the hunk is left out here: the row of the setting `app.settings.jwt_secret`, which the script prints as a digest (finding 2). It is the same on both sides.

```
check-schema-equivalence.sh: DIFFERENT -- the database built from the schema files in <scratch>/role-setting/schema is not the database built from the reused snapshot tmp/181-10/m-kept.snapshot.sql (17 s). The objects that differ:
  Query: role settings (pg_db_role_setting), as role|database|setting
The diff. A line starting `-` is in the database built from the migrations only, a line starting `+` in the one built from schema/ only:
--- the database built from migrations
+++ the database built from schema
@@ -15938,7 +15938,7 @@
 -- Query: role settings (pg_db_role_setting), as role|database|setting
 role setting|<every role>|postgres|app.settings.jwt_exp=3600
-role setting|anon|<every database>|statement_timeout=8s
+role setting|anon|<every database>|statement_timeout=9s
 role setting|authenticated|<every database>|statement_timeout=8s
 role setting|authenticator|<every database>|lock_timeout=8s
 role setting|authenticator|<every database>|session_preload_libraries=supautils, safeupdate
```

## The floor control (`RED_FLOOR_EXIT`)

`--schema-dir <scratch>/floor/schema --reuse-m tmp/181-10/m-kept.snapshot.sql`, where the directory holds one file, `000-only.sql`, with the single statement `SELECT 1;`. Status 2 in 16 s. The instance was built, dumped and stopped, and the script then refused the snapshot. Its standard output, then the last line of its standard error:

```
check-schema-equivalence.sh: census of the reused snapshot tmp/181-10/m-kept.snapshot.sql: CREATE TABLE 71 (in public: 21), CREATE POLICY 107, CREATE FUNCTION 126, GRANT 685, CREATE TRIGGER 87
check-schema-equivalence.sh: census of the schema files in <scratch>/floor/schema: CREATE TABLE 46 (in public: 0), CREATE POLICY 0, CREATE FUNCTION 47, GRANT 347, CREATE TRIGGER 8
check-schema-equivalence.sh: FATAL -- FLOOR: the snapshot of the schema files in <scratch>/floor/schema holds no line beginning `CREATE TABLE public.`. The database is empty or is not this schema, and comparing it proves nothing.
```

The census line of the schema side is the census of a database with no migration of this repository applied: 46 tables, 0 policies and 47 functions, all the platform's own. So of the floor's four tests, the one for a `CREATE TABLE public.` line and the 50-policy threshold are what refuse such a database. The 20-table threshold does not (46 is above it), and the 50-function threshold does by three. The script's comment on the constants says so.

## The tree with default arguments (`EQUIVALENCE_TREE_EXIT`)

`bash apps/supabase/scripts/check-schema-equivalence.sh`, no argument, run after every control above and after the four runs of the next section. Status 0. Elapsed for the whole run, both sides built, dumped and stopped: 34 s by the clock of the driver, 33 s by the script's own count. The first run of this record took 33 s, and two trial runs before the script was committed took 34 s each.

Its standard output, whole:

```
check-schema-equivalence.sh: census of the migrations in apps/supabase/supabase/migrations: CREATE TABLE 71 (in public: 21), CREATE POLICY 107, CREATE FUNCTION 126, GRANT 685, CREATE TRIGGER 87
check-schema-equivalence.sh: census of the schema files in apps/supabase/supabase/schema: CREATE TABLE 71 (in public: 21), CREATE POLICY 107, CREATE FUNCTION 126, GRANT 685, CREATE TRIGGER 87
check-schema-equivalence.sh: EQUAL -- the database built from the schema files in apps/supabase/supabase/schema is the database built from the migrations in apps/supabase/supabase/migrations (33 s)
```

The census of both sides, as the script printed it:

| Side | `CREATE TABLE` | of which in `public` | `CREATE POLICY` | `CREATE FUNCTION` | `GRANT` | `CREATE TRIGGER` |
|------|----------------|----------------------|-----------------|-------------------|---------|------------------|
| Built from `migrations/` | 71 | 21 | 107 | 126 | 685 | 87 |
| Built from `schema/` | 71 | 21 | 107 | 126 | 685 | 87 |

The counts are over the whole database, the platform's schemas included, less the five daily partitions of `realtime.messages` (see the findings). A snapshot is 15968 lines.

What a green run shows and does not show on this tree: `00001_initial_schema.sql` is still generated from `schema/` by concatenation and is the only migration. `node scripts/assert-schema-migration-parity.mjs` exits 0 on this commit (29 schema files, 7880 lines on each side), and `cat apps/supabase/supabase/schema/*.sql` compares equal to the baseline with `cmp`. So both sides were built from the same SQL text. Equal is the only result the method could give here. The run shows that two separate builds of one input give the same snapshot, which is what makes a difference after the freeze mean something; it does not show that a hand-written migration agrees with `schema/`, because none exists yet.

## Four ways out beyond the plan's

The script is to be run by later plans, so each way it can end was made to happen once. None is among the plan's seven keys.

| Key | What was done | Status | What was left |
|-----|---------------|--------|---------------|
| `BUILD_FAILURE_EXIT` | `--schema-dir` on a copy of `schema/` with an added file `999-broken.sql` holding `SELECT this_function_does_not_exist();` | 2, in 18 s | no instance listed, no container or volume named `openvaa-iso-`, no working directory. The harness printed the CLI's `MigrationApplyError` and exited 5; the script's last line: `FATAL -- the database of the schema files in <scratch>/broken/schema could not be built: the harness exited 5 and its output is above. A statement that does not apply is the usual cause.` |
| `EXISTING_INSTANCE_EXIT` | an instance `eq-s` was started by hand through the harness, then the script was run with `--reuse-m` | 2, in under 1 s | the instance the script did not start was still listed, and `cmp` of its container name and id before and after the script exits 0. It was then stopped by hand (status 0). The script's last line: `FATAL -- an instance named 'eq-s' already exists. Another run of this check may be in progress; if none is, run: bash apps/supabase/scripts/isolated-instance.sh stop --name eq-s` |
| `INTERRUPT_SIGTERM_EXIT` | `SIGTERM` sent to the script's process alone, 8 s into a run with default arguments, while the harness was starting `eq-m` | 130, 22.7 s after the start | the shell ran the trap when the start had finished; the script then stopped `eq-m` (`isolated-instance.sh: stopped eq-m`). No instance listed, no container or volume named `openvaa-iso-` |
| `INTERRUPT_SIGINT_GROUP_EXIT` | `SIGINT` sent to the script's whole process group, as Ctrl-C does, 8 s into a run | 130, 9.2 s after the start | the harness abandoned its start (`isolated-instance.sh: FATAL -- interrupted`) and the script found nothing left to stop. No instance listed, no container, volume or working directory |

The two signals were sent by a small Python driver that starts the script in a session of its own. A background job of a non-interactive shell has `SIGINT` ignored, and a shell cannot trap a signal that was ignored when it started, so `kill -INT` on a background job would have tested nothing.

Not exercised: `SIGHUP`, a signal that arrives during `pg_dump` or during the teardown, and an instance that the harness cannot stop (the script's status 2 with "could not be stopped").

## Two instances at the same moment

`TWO_INSTANCES_AT_ONCE=not-tried`. The script does not need them: it builds the migrations side, writes its snapshot and stops it before it starts the schema side, so at most one of its instances exists at any moment. That is also what keeps its use of the Docker disk to one database. The port bases 55400 and 55500 are 100 apart, but nothing in this record shows two instances running together.

## Findings about the method

Three things were found while the script was first run on the tree, before its commit. The first two changed the script; none changes `schema/` or the migration.

**1. A whole-database dump holds the day it was taken.** The first trial snapshot (16293 lines, with 76 `CREATE TABLE` and 695 `GRANT` lines) held 85 lines naming five tables `realtime.messages_2026_10_11` to `realtime.messages_2026_10_15`, with their constraints, indexes and `ATTACH PARTITION ... FOR VALUES FROM ('2026-10-11 00:00:00') TO ('2026-10-12 00:00:00')` lines. The instance had been created on 2026-10-12 UTC, in database-only mode with no realtime service running. So the platform's initial schema creates daily partitions of `realtime.messages` from the day before the build to three days after it. This is an artefact of the dump, not a difference between `schema/` and the migration, and the script now leaves these tables out (`--exclude-table` with a pattern for that name and date shape) and exits 2 if a dump still names one. After the change a snapshot is 15968 lines, with 71 `CREATE TABLE` and 685 `GRANT` lines and no line that holds a date.

What was observed is the names and that they bracket the build day. What was not observed is a false difference: no run was made across midnight UTC, and no snapshot from another day was at hand. That two sides built on either side of midnight, or a `--reuse-m` snapshot from an earlier day, would have differed in these lines is inferred from the names.

**2. `pg_db_role_setting` holds the local instance's JWT secret.** The role-settings query returns the database setting `app.settings.jwt_secret` with its value, so the first trial snapshot held that value in a file under the ignored `tmp/`. The script now writes any setting whose name holds `secret`, `password`, `token` or `key` as a SHA-256 digest of the setting, which keeps the comparison and drops the value. The trial snapshots were deleted before the fix was made, and a search of the scratch directory for the setting's name then found no file. The snapshots this record quotes hold the digest only (one line with `jwt_secret=<sha256 ...>`, none with another value).

**3. The floor's table threshold is carried by other tests**, as described under the floor control.

## What was not measured

- **A real disagreement between `schema/` and a numbered migration.** None exists before the freeze. The controls change `schema/` copies only, so every difference here has the migrations side as the unchanged one. A change on the migrations side (a second migration file) was not planted.
- **`--migrations-dir` with a directory other than the default**, and `--out` together with `--reuse-m`.
- **A column in another position, and a function re-created with another comment in its body.** The script's header tells developers about both; neither was planted. The function-body control changes a statement, not a comment.
- **A run across midnight UTC** (finding 1).
- **A difference in an extension.** The extension query's rows are in every snapshot (six extensions) and no control changes one.
- **A difference in `private.deployment_settings`.** Its row is in every snapshot and no control changes it.
- **A hosted project.** The script builds local instances only.
- **Disk space.** No command reported a lack of space, and nothing was pruned. `docker system df` after the last run: images 15.61 GB, volumes 13.97 GB. It was not read before the plan; the dispatch gave 15.6 GB and 13.9 GB.
- **CI.** The script was run on this host only. It is not a link of `lint:check` and no job runs it.
