ATTEMPT=20261020T130136Z.78fa17897764
OBSERVED_HEAD=78fa17897764939647641f63869228348f9d2375
TREE_CLEAN_BEFORE=yes
    $ git status --porcelain --untracked-files=no   (no output, status 0)
    $ docker ps --format {{.Names}}   (no container of the shared stack openvaa-local and none named openvaa-iso-drift before the observations)
SCRATCH_HEAD=78fa17897764939647641f63869228348f9d2375
    the scratch checkout, made with git worktree add --detach at OBSERVED_HEAD, was installed with yarn install --immutable (status 0) and built with yarn build (status 0, 14 of 14 turbo tasks) before step 1: a checkout with no built packages fails the typecheck link of lint:check before the guard is reached
    $ git -C <scratch checkout> status --porcelain   (no output before step 1)
LINT_CHECK_EDITED_BASELINE_EXIT=1
    one newline byte appended to apps/supabase/supabase/migrations/00001_initial_schema.sql in the scratch checkout, then yarn lint:check in the background, status read from its status file of this attempt
    the links before the guard ran and passed: turbo run lint (Tasks:    12 successful, 12 total), eslint tests, typecheck:tests, typecheck (Tasks:    23 successful, 23 total), then these guard lines:
    I18n catalog namespace guard (phase 147: CSCAN-04) — total keys: 744; contestantApp.*: 287, adminApp.*: 121, other: 336. 0 violation(s).
    A11y-scan wiring guard (phase 147: CSCAN-02, CSCAN-03) — 0 violation(s).
    Comment hygiene guard (phase 152: REVIEW-HYG-01) — files scanned: 2162; vendored files excluded by name: 2 (apps/frontend/static/fonts/inter.css, apps/docs/src/
    No-candidate-app-names guard — 3248 tracked file(s) scanned; 0 finding(s) (symbols 0, urls 0, tests 0, prose 0).
    Edge-function environment-default guard (phase 155: REVIEW-EDGE-02) — files scanned: 36; checks live: 3 of 3 (env-default; copy-drift; vitest-reachability). 0 v
    Declared-binaries guard (phase 153: REVIEW-CFG-01) — 16 workspace(s) scanned, 20 build-script binary invocation(s). 0 violation(s).
    assert-node-engine: v24.21.0 satisfies "engines.node": ">=24.15.0" — OK
    Cross-runtime env-pair registry guard (phase 153, plan 10) — source scanned: 36 Deno file(s) under apps/supabase/supabase/functions, 1856 frontend file(s) under
    the guard's lines:
    Schema-migration parity guard — census: 1 migration(s) in the manifest; baseline 00001_initial_schema.sql -> 9557 line(s); 16 fixture(s) checked.
    EDITED FROZEN MIGRATION: 00001_initial_schema.sql has sha256 18c2b544335abea9d3f76b2ca32e90534f34d442e07bb5ee90145b522f7039ea, and the manifest records 79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8.
      Restore the file from git and write the change as a new numbered migration. `supabase db push` skips a version a database has recorded, so an edit to an applied migration never reaches that database.
    1 finding(s) in apps/supabase/supabase/migrations against apps/supabase/supabase/migrations.manifest.json. A schema change is a new numbered migration; `yarn schema:regenerate` prints the steps.
    $ git checkout -- apps/supabase/supabase/migrations/00001_initial_schema.sql; git status --porcelain   (no output: the scratch checkout is clean again)
LINT_CHECK_APPENDED_MIGRATION_EXIT=0
    apps/supabase/supabase/migrations/00002_probe.sql added in the scratch checkout, holding the two lines "-- A probe migration that adds nothing." and "SELECT 1;", and its entry {"file": "00002_probe.sql", "sha256": "ee54ea4175baae1a780ce4810678a9ce0e923cbd161f4eaebcde96b65b42debe"} appended to the scratch copy of migrations.manifest.json (sha256 from shasum -a 256); then yarn lint:check in the background
    every link ran: turbo run lint (12 of 12), typecheck (23 of 23), and every assert link through the last, the hosted-settings parity guard
    the guard's lines:
    Schema-migration parity guard — census: 2 migration(s) in the manifest; baseline 00001_initial_schema.sql -> 9556 line(s); 16 fixture(s) checked; the frozen migrations match the manifest.
    Schema-migration parity guard — frozen-mode self-test: 16 fixture(s) checked, each produced its committed findings; 15 rule(s), each with its fixture.
    the last line of the run:
    Hosted-settings parity guard — every classified key holds between apps/supabase/supabase/config.toml, infra/modules/supabase/hosted-settings.json and the Supabase roots under infra/envs.
    the three controls below each start from the state of step 2 and restore it after; the guard alone gave status 0 on the restored state after the last
GUARD_UNLISTED_EXIT=1
    the manifest entry of 00002_probe.sql removed, the file kept
    $ node scripts/assert-schema-migration-parity.mjs   (status read directly into its status file of this attempt)
    Schema-migration parity guard — census: 1 migration(s) in the manifest; baseline 00001_initial_schema.sql -> 9556 line(s); 16 fixture(s) checked.
    UNLISTED MIGRATION: 00002_probe.sql is in the migrations directory and has no entry in the manifest; a new migration needs its line there.
      Add its entry, with its sha256 (`shasum -a 256 <file>`), to the end of the manifest in the same commit as the file.
    1 finding(s) in apps/supabase/supabase/migrations against apps/supabase/supabase/migrations.manifest.json. A schema change is a new numbered migration; `yarn schema:regenerate` prints the steps.
GUARD_DUPLICATE_EXIT=1
    a second file 00002_other.sql ("-- A second probe with the same version." / "SELECT 2;") added with its entry
    $ node scripts/assert-schema-migration-parity.mjs   (status read directly into its status file of this attempt)
    Schema-migration parity guard — census: 3 migration(s) in the manifest; baseline 00001_initial_schema.sql -> 9556 line(s); 16 fixture(s) checked.
    DUPLICATE VERSION: 00002_other.sql has version 00002, which 00002_probe.sql already has.
      Give the later migration the next version after the highest one in the manifest.
    1 finding(s) in apps/supabase/supabase/migrations against apps/supabase/supabase/migrations.manifest.json. A schema change is a new numbered migration; `yarn schema:regenerate` prints the steps.
GUARD_TIMESTAMP_NAME_EXIT=1
    the probe renamed to 20261020130500_probe.sql, the timestamp form supabase migration new writes, and its entry renamed with it
    $ node scripts/assert-schema-migration-parity.mjs   (status read directly into its status file of this attempt)
    Schema-migration parity guard — census: 2 migration(s) in the manifest; baseline 00001_initial_schema.sql -> 9556 line(s); 16 fixture(s) checked.
    BAD NAME: 20261020130500_probe.sql is not five digits, an underscore, a name of lower-case letters, digits and underscores, and .sql; rename it to the next number, 00002_<name>.sql.
      Rename the file as the finding says, and its manifest entry with it.
    1 finding(s) in apps/supabase/supabase/migrations against apps/supabase/supabase/migrations.manifest.json. A schema change is a new numbered migration; `yarn schema:regenerate` prints the steps.
SCHEMA_REGENERATE_EXIT=1
    the probe file removed and the manifest restored with git checkout first, so the scratch checkout was again its commit's tree; git status --porcelain printed nothing before and after the command, and the baseline's sha256 was the same before and after
    $ yarn schema:regenerate
    Schema-migration parity guard: the baseline is frozen. `--write` (`yarn schema:regenerate`) no longer
    rewrites a migration, and a listed migration is never edited.
    A schema change is one commit, in three steps:
      1. Edit the file under apps/supabase/supabase/schema/ that holds the object.
      2. Write the same change as a new migration, apps/supabase/supabase/migrations/00002_<name>.sql,
         where <name> is yours to choose (lower-case letters, digits and underscores).
         00002 is the next version after the highest in the manifest.
      3. Add its line, with its sha256 (`shasum -a 256 <file>`), to the end of apps/supabase/supabase/migrations.manifest.json.
    Then run `yarn check:schema-equivalence`: it builds one database from apps/supabase/supabase/schema/ and one from
    apps/supabase/supabase/migrations/ and fails when they differ.
SCRATCH_CHECKOUT=/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T//openvaa-181-18-scratch.HlAue9
    $ git worktree remove --force <SCRATCH_CHECKOUT>   (status 0); git worktree list no longer shows it, and the directory does not exist
    the drift check, in this working tree: isolated-instance.sh start --name drift --mode db --migrations apps/supabase/supabase/migrations (status 0, ports 55400-55409), its PG* values exported from isolated-instance.sh env --name drift (PGHOST=127.0.0.1, PGPORT=55401), then bash infra/scripts/check-drift.sh --workdir <ISO_WORKDIR> with the default manifest, apps/supabase/supabase/migrations.manifest.json
DRIFT_REAL_MANIFEST_CLEAN_EXIT=0
    check-drift.sh: history: reading supabase_migrations.schema_migrations
    check-drift.sh: history: manifest: 00001
    check-drift.sh: history: database: 00001
    check-drift.sh: history: holds
    check-drift.sh: schema: running supabase db diff --local; this starts a shadow database and can take a minute
    check-drift.sh: schema: holds
    check-drift.sh: CLEAN -- the history equals the manifest and the diff is empty
    $ psql -X -v ON_ERROR_STOP=1 -c 'ALTER TABLE public.projects ADD COLUMN planted_drift text'   (status 0: ALTER TABLE)
DRIFT_REAL_MANIFEST_PLANTED_EXIT=1
    check-drift.sh: history: reading supabase_migrations.schema_migrations
    check-drift.sh: history: manifest: 00001
    check-drift.sh: history: database: 00001
    check-drift.sh: history: holds
    check-drift.sh: schema: running supabase db diff --local; this starts a shadow database and can take a minute
    check-drift.sh: SCHEMA DRIFT: the database differs from a database built from the migrations. The statements that would turn the migrations' schema into the database's:
    alter table "public"."projects" add column "planted_drift" text;
    check-drift.sh: DRIFT
    $ isolated-instance.sh stop --name drift   (status 0: isolated-instance.sh: stopped drift)
    afterwards no container named openvaa-iso-drift existed (docker ps -a), and isolated-instance.sh list printed nothing. The CLI had left one volume, supabase_edge_runtime_openvaa-iso-drift, created at 2026-10-20T13:04:31Z by this start; it was removed with docker volume rm
    the _openvaa-local containers: none before the observations and none after; the shared stack was not started, stopped or reset, and its volumes were not touched
TREE_CLEAN_AFTER=yes
    $ git status --porcelain --untracked-files=no   (no output, status 0)
    $ shasum -a 256 apps/supabase/supabase/migrations/00001_initial_schema.sql   (79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8, equal to the sha256 of the manifest's first entry)
HEAD_AFTER=78fa17897764939647641f63869228348f9d2375
