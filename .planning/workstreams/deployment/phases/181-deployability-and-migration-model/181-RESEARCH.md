# Phase 181: Deployability and Migration Model - Research

**Researched:** 2026-10-11
**Domain:** SvelteKit adapter-node behind a proxy; Supabase CLI migration model; psql bootstrap; guard scripts
**Confidence:** HIGH for repository facts and for the installed dependency sources. MEDIUM for Supabase CLI behaviour that was read from the pinned source but not run. LOW where a claim is tagged `[ASSUMED]`.

**How this was made.** Nothing was started, stopped or reset. No stack was contacted. The tree was read at `03d3c2c40` on `feat/deployment-terraform-supabase`. Dependency sources were read from `../voting-advice-application-gsd/node_modules`; the versions there (`@sveltejs/adapter-node` 5.5.7, `@sveltejs/kit` 2.70.3, `supabase` 2.118.0, `zod` 4.6.5) equal this worktree's `yarn.lock`. The pinned Supabase CLI was run for `--help` text only. Public Supabase CLI source was read from GitHub at tag `v2.118.0`. Line numbers are given beside quotes for convenience; the quote is the anchor, and a plan must find the text again at run time.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Baseline freeze and migration model (SUPA-10)

- **D-01 (181-1):** The freeze is a committed hash manifest: each frozen migration with its sha256, the
  baseline's name and the commit it came from. The guard recomputes the hashes and accepts added entries only.
  Known and accepted: an edit to a file and its manifest line in one commit passes the guard and shows in
  review. — **Reversibility:** one-way — after the first hosted push (phase 184) the recorded baseline version
  cannot be re-pushed; `db push` skips a version it has recorded.
- **D-02 (181-1):** With the freeze, `yarn schema:regenerate` is removed or made to refuse. Frozen files leave
  prettier and `assert:comment-hygiene`, so a later rule change cannot redden a file nobody may edit. The guard
  gets injectable paths and a fixture, so it is seen failing without editing the real file.
- **D-03 (181-2):** `schema/` stays the hand-edited current view of the schema. After the freeze each schema
  change is a `schema/` edit plus a numbered migration in one commit. Byte parity is replaced by an equivalence
  check between two built databases (one from `schema/`, one from the migrations). That check needs a running
  stack, so it sits outside the Node-only `lint:check` chain. The method that covers grants and policies is a
  research question. The guards that read `schema/` as the current schema
  (`assert-rpc-return-nullability.mjs`, `assert-grant-permission-enum.mjs`) keep working unchanged.
- **D-04 (181-3):** The cutover commit is after the v2.16 stream's phase 177.1 lands in place. v2.16's phases
  177 and 177.1 keep their planned in-place mechanics; 178 and 179 append. Criterion 4 of this phase and the
  first persistent push (184) wait for 177 and 177.1; the rest of this phase does not wait. The freeze is one
  commit both branches contain, carrying the bucket insert and the rewritten guard. Until v2.16 has the new
  guard, its `schema:regenerate` still rewrites `00001`. — **Reversibility:** one-way — binds the v2.16 stream
  from that commit on.
- **D-05 (181-4):** Appended migrations use a five-digit sequence continuing the baseline
  (`00002_<name>.sql`). The guard rejects duplicate or non-increasing versions. A stream that has not pushed
  renumbers at merge. — **Reversibility:** costly — a rename after a hosted push changes recorded versions.
- **D-06 (pre-freeze list):** These land in `schema/` and the single migration before the freeze: the bucket
  insert (D-07); the comment corrections (D-08); and the schema change of phase 182 that gives a signed-out
  reader of a project not open for voters the `analytics` member (ruling 182-12, owned and written by phase
  182). The plan that freezes depends on all three.
- **D-07 (181-5):** Both buckets (`public-assets`, `private-assets`) are inserted in `schema/400-storage.sql`
  with the properties the `[storage.buckets.*]` blocks of `config.toml` declare, and the blocks are kept.
  Whether the CLI tolerates the existing rows is measured before the freeze. If it does not, the blocks are
  deleted.
- **D-08 (things the freeze makes permanent):** Comments that describe manual steps the bootstrap replaces
  (for example `107-feedback.sql`: "sets it once in the SQL editor") are corrected before the freeze.
  `schema/900-test-helpers.sql` stays in the baseline; its removal is recorded as a future appended migration.

#### Bootstrap script, seed check, drift check (SUPA-06, SUPA-10)

- **D-09 (181-6):** The bootstrap is one SQL file run by `psql` as `postgres` over a direct connection, with
  values taken from the operator's environment at run time. The key is never passed with `-v`, because it would
  sit on the command line. The script holds no secret and is idempotent (criterion 5: run twice, one account,
  one project, the `storage_config` row and `behind_cloudflare`).
- **D-10 (181-6 sub-rulings):** The account id is fixed at `00000000-0000-0000-0000-000000000001`, because
  dev-seed's `ensureProject` hard-codes it. The bootstrap also creates the `app_settings` row (with
  `open_for_voters`), though SUPA-06 does not list it. The first admin is not created by the bootstrap; it is a
  documented one-off step.
- **D-11 (181-7):** The drift check and the seed check are committed scripts that set their own exit status.
  Each is shown once locally and recorded: reset without seed, bootstrap twice, count rows, seed check green;
  the seeded stack as the seed check's red control; planted DDL as the drift check's red. Exit status is read
  directly, never through a pipe. No CI job is added here; pipeline wiring stays in phase 187.

#### Server deployability (INFRA-04, INFRA-05, INFRA-06, INFRA-09)

- **D-12 (181-8):** Health is `routes/api/health/+server.ts`, returning a status and the build id. It answers
  200 with Supabase unreachable. `kit.version.name` is set from a Docker build argument, so the SHA is also at
  `/_app/version.json`; with no argument the name stays time-based as today.
- **D-13 (181-9):** The start-up check is an `init` export in `hooks.server.ts`, on production start only. One
  error names every unset variable. Required: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`,
  `PUBLIC_PROJECT_ID`, `ORIGIN`. Settled by reading adapter-node 5.5.7: the mechanism is `ORIGIN` (kit 2.70.3
  has no `paths.origin`), and with `ORIGIN` set the protocol and host headers are never read. Phase 182 adds
  its own entry to this check (`posthog` with no key fails it).
- **D-14 (181-10):** A diagnostics response, off unless a deployment variable enables it, returns the resolved
  client address and the forwarded headers the container received. It gives criterion 3 its observable and
  phase 185 the frontend half of OBS-04. It must be shown to be off by default. No visitor address is written
  to a log.
- **D-15 (181-11):** `CMD` in the production image takes the exec form (a JSON array), so Node is the
  container's first process; `SIGTERM` delivery is still observed. The proxy topology check is a committed
  compose file plus a scripted check with negative controls, run on demand, outside the gate suite. Phase 185
  re-runs it when the CDN changes the proxy depth.

#### Templates

- **D-16 (181-12):** This phase changes variables only: `PUBLIC_PROJECT_ID` and the proxy variables are added
  to `render.example.yaml` and the root `docker-compose.dev.yml`, and the proxy variables to `.env.example`.
  Retiring the orphan `apps/frontend/docker-compose.dev.yml` and the wording stay with phase 189 (DOCS-07).
  Operator's note: phase 189 also checks whether the root compose file can be retired, and whether the test
  that reads it is needed. That note is recorded in the roadmap under phase 189 and is not acted on here.

### Claude's Discretion

- The file names and locations of the manifest, the guard fixture, the bootstrap SQL and the two check scripts.
- The name of the variable that enables the diagnostics response, and its route.
- The shape of the health response body beyond "a status and the build id".
- The reverse proxy used in the local topology compose file.

### Deferred Ideas (OUT OF SCOPE)

- Retiring the orphan `apps/frontend/docker-compose.dev.yml`, and the operator's question whether the root
  `docker-compose.dev.yml` and its test can go too — phase 189 (recorded in the roadmap).
- Removing `schema/900-test-helpers.sql` from the schema — a future appended migration.
- A CI job that repeats the drift and seed checks on a fresh stack — not asked for; pipeline wiring is 187.

#### Reviewed Todos (not folded)
The todo matcher returned only keyword matches unrelated to this phase's scope (UI styling, auth adapter
refactors). None was folded.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUPA-10 (closed here) | The single migration is frozen as a named baseline at a cutover commit agreed with the v2.16 session; later changes are append-only numbered migrations; the parity guard enforces both; a drift check after deploy reads its exit status directly. | Q2 (the guard today and the rewrite), Q1 (the equivalence check that replaces byte parity), Q5 (the drift check and its exit status), Q9 (the v2.16 contact points), Pattern 1, Pattern 2 |
| INFRA-04 (started) | A health endpoint answers without calling Supabase. | Q6 (hooks and the session gate, the `version` export), Pattern 5 |
| INFRA-05 (started) | A start with a required variable unset fails and names the variable; `PUBLIC_PROJECT_ID` is in the templates. | Q6 (`init` in kit 2.70.3, order against adapter-node's own `ORIGIN` parse), Q8 (which tests read the templates) |
| INFRA-06 (started) | The Node server is configured for its proxy; form posts succeed; a spoofed forwarded address is not taken as the client's. | Q6 (`ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`, the CSRF check), Pattern 6 |
| INFRA-09 (started) | `SIGTERM` is shown to reach the Node process; a stopping task drains its requests. | Q6 (graceful shutdown in adapter-node 5.5.7, the `CMD` form), Pattern 6, Pitfall 9 |
| SUPA-04 (started) | The two storage buckets are created by the migration. | Q3 (the CLI and existing bucket rows), Pitfall 3 |
| SUPA-05 (started) | `identity-callback`'s JWT setting is declared in `config.toml`. | Q7 |
| SUPA-06 (started) | An idempotent bootstrap creates the rows a project needs and commits no secret; a check fails if a seed user or a local URL is present. | Q4 (rows, tables, privileges, `\getenv`, `\bind`), Q5 (the seed check's queries), Pattern 3, Pattern 4 |
| PIPE-07 (started) | The build SHA the smoke run reads. | Q6 (`kit.version.name`, `/_app/version.json`) |
</phase_requirements>

## Summary

The decisions hold up against the code. Every mechanism they name exists in the installed versions: adapter-node 5.5.7 reads `ORIGIN`, `ADDRESS_HEADER` and `XFF_DEPTH` and drains on `SIGTERM`; kit 2.70.3 has the `init` hook and rethrows its error in production; the pinned CLI has `db reset --no-seed`, `db push --local` and `db diff`; psql has `\getenv` and `\bind`. No npm package is added.

Three findings change how the phase must be planned. First, one statement in the context file is no longer true: the v2.16 branch has changed `apps/supabase` since the branch point (19 files, 10,106 insertions), because its phase 177 has since been executed in place. This is what D-04 expects, but it means the freeze needs a merge of the two streams' `schema/` before it, and the plan must say so. Second, this worktree and the v2.16 worktree share one Supabase `project_id` and one set of literal ports, so any `supabase start` or `db reset` from here acts on the stack the other session is using. Every database observation of this phase therefore needs either an isolated CLI instance (its own `project_id` and ports, in a temporary work directory) or an agreed exclusive window. Third, a local `db reset` creates the buckets from `config.toml` whatever the migration does, so criterion 5's "built from the migrations alone … holds both storage buckets" cannot be shown by listing buckets on the normal stack. It needs a build where the bucket seeding does not run.

For D-03, `supabase db diff` is not fit for the equivalence check. Its default engine does not capture column privileges, rows, comments or role settings, and this schema has a whole file of column grants, three seeded rows and one role setting. The method to use is a `pg_dump --schema-only` text comparison of two databases built by the CLI in two isolated instances, with three catalog queries for what `pg_dump` leaves out. `supabase db diff` is the right tool for the drift check of D-11, with its blind spots written down; it exits 0 whether or not it finds a difference, so the script sets the status.

**Primary recommendation:** Build one small harness that starts an isolated, database-only Supabase CLI instance from a temporary work directory, and run every database observation of this phase on it (equivalence, buckets, bootstrap, seed check, drift check). Write the frozen-mode guard and its fixtures now, and keep the freeze itself as one small last plan behind a checkpoint with the v2.16 session.

## CONTEXT Statements Checked

The orchestrator did not re-verify `<code_context>`. Each statement a plan would rely on was checked.

| # | Statement | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | "The v2.16 stream: no schema change since the branch point `d228b52bc`" | **Wrong now.** It was true when the discussion document was written. | `git diff --stat d228b52bc..feat/entity-signup-multi-grant -- apps/supabase` prints 19 files, "10106 insertions(+), 435 deletions(-)", among them `migrations/00001_initial_schema.sql` (921 lines changed), `schema/000-enums.sql`, `011-validation-functions.sql`, `301-auth-functions.sql`, `302-rls.sql`, `303-column-grants.sql`, `503-entity-rpcs.sql`. The v2.16 `STATE.md` says: "Phase 177 executed (21 of 21 plans) and verified with no gap on 2026-10-11 … Phase 177.1 is not discussed." `git merge-base` of the two branches is still `d228b52bc`. [VERIFIED: git, 2026-10-11] |
| 2 | "`main.yaml` has `fetch-depth: 0` only in `secret-scan`" | **Wrong in detail, right in effect.** Two jobs have it: `skill-drift-check` and `secret-scan`. The job that runs `yarn lint:check` (`frontend-and-shared-module-validation`) checks out with no `fetch-depth`, so a git-comparison guard would still lack history there. | `.github/workflows/main.yaml`: under `skill-drift-check:` "uses: actions/checkout@v7 / with: / fetch-depth: 0"; the same under `secret-scan:`. [VERIFIED: file read] |
| 3 | D-10: "creates the `app_settings` row (with `open_for_voters`)" | **Imprecise.** `open_for_voters` is a column of `public.projects`, not of `app_settings`. | `schema/100-tenancy.sql:24`: `open_for_voters boolean NOT NULL DEFAULT false,` inside `CREATE TABLE public.projects (`. [VERIFIED: apps/supabase/supabase/schema/100-tenancy.sql:16-26] See Open Question 2 for the value the bootstrap writes. |
| 4 | "API routes already skip the session gate, so `routes/api/health` needs no change to the hooks" | **Right.** Only the third handler skips; the first two still run for `/api/health`. Neither makes a network call for a request without cookies (see Q6). | `hooks.server.ts:86-89`: `// Skip non-route and API requests.` / `if (route?.id == null \|\| isApiRoute(route.id)) {` / `return resolve(event);`. `universalApiRoutes.ts:5`: `export const API_ROOT = '/api';`. [VERIFIED: apps/frontend/src/hooks.server.ts:82-112; apps/frontend/src/lib/api/base/universalApiRoutes.ts:1-5] |
| 5 | "`zod` is already a dependency" | Right. | `apps/frontend/package.json`: `"zod": "catalog:"`; `yarn.lock` resolves `zod@npm:^4.3.6` to 4.6.5. [VERIFIED: grep + yarn.lock] |
| 6 | "`private.deployment_settings` is writable only by the table owner" | Right. | `schema/107-feedback.sql:50-55`: `REVOKE ALL ON TABLE private.deployment_settings / FROM / PUBLIC, / anon, / authenticated, / service_role;`. [VERIFIED: apps/supabase/supabase/schema/107-feedback.sql:28-55] |
| 6b | Discussion 181-6: "Two of the four rows are writable only by the table owner" | **Not verified for `storage_config`.** Its `REVOKE` does not name `service_role`. Whether `service_role` can insert depends on Supabase's default privileges, which only a database can answer. The decision (psql as `postgres`) does not depend on it: `private.deployment_settings` alone needs the owner. | `schema/400-storage.sql:39-47`: `REVOKE ALL ON TABLE public.storage_config / FROM / anon, / authenticated, / public;` then `GRANT / SELECT / ON TABLE public.storage_config TO service_role;`. [VERIFIED: apps/supabase/supabase/schema/400-storage.sql:29-48] Plan can verify with `SELECT has_table_privilege('service_role','public.storage_config','INSERT');` on the isolated instance. |
| 7 | "Nothing in the frontend calls `getClientAddress()` today" | Right. | `grep -rn getClientAddress apps packages tests` finds no file. [VERIFIED: grep] |
| 8 | "The baseline is about 377 KB" | Right: 376,844 bytes, 7,859 lines. | `wc -c`; the current guard prints "census: 29 schema file(s) -> 7859 line(s)". [VERIFIED: ran `node scripts/assert-schema-migration-parity.mjs`, exit 0] |
| 9 | D-13: "the mechanism is `ORIGIN` (kit 2.70.3 has no `paths.origin`), and with `ORIGIN` set the protocol and host headers are never read" | Right. | See Q6. |
| 10 | D-02: "Frozen files leave prettier" | **Half done already.** The baseline is in `.prettierignore` today. What is left is the appended files, and `assert:comment-hygiene`, which has no exclusion. | `.prettierignore` last line: `apps/supabase/supabase/migrations/00001_initial_schema.sql`. [VERIFIED: .prettierignore:72-82] |
| 11 | D-03: the guards that read `schema/` "keep working unchanged" | Right for the two guards. **Two tests read the baseline as the current schema and will not.** | `packages/dev-seed/tests/template/permittedKeys.test.ts`: `const MIGRATION_SQL = resolve(REPO_ROOT, 'apps/supabase/supabase/migrations/00001_initial_schema.sql');` with the comment "The applied migration copy of the same function" and a byte comparison against `schema/501-bulk-operations.sql`. `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts` reads `bulk_delete`'s arrays from the same file (`'apps/supabase/supabase/migrations/00001_initial_schema.sql'` in `SCHEMA_MIGRATION_PATH`). [VERIFIED: packages/dev-seed/tests/template/permittedKeys.test.ts:36-41; packages/dev-seed/tests/cli/allowedTeardownTables.test.ts:19-27] See Pitfall 6. |
| 12 | Criterion 5: "the `storage_config` row" | **Two rows.** The table holds one row per key, and the triggers need both. | `schema/400-storage.sql:32`: "One row per setting: `key` names it, `supabase_url` or `service_role_key`". [VERIFIED: as row 6b] |
| 13 | D-01 "the commit it came from" with D-04 "the freeze is one commit … carrying the bucket insert" | **Needs a reading.** A commit cannot contain its own hash. See Open Question 1. | Reasoning, not a file fact. |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Health response and build id | Frontend Server (SvelteKit `+server.ts`) | Build (Docker `ARG`, `svelte.config.js`) | The load balancer asks the Node server. The build names the commit. |
| Start-up variable check | Frontend Server (`hooks.server.ts` `init`) | — | It must run in the process that will serve, before it listens. |
| Proxy awareness (origin, client address) | Frontend Server (adapter-node environment) | Reverse proxy (sets the headers) | adapter-node resolves both from its environment; no application code is involved. |
| Diagnostics response | Frontend Server (`+server.ts`) | — | Only the container can report the headers it received. |
| `SIGTERM` delivery | Container image (`CMD` form) | Frontend Server (adapter-node's handlers) | The image decides which process is first; adapter-node already handles the signal. |
| Migration freeze guard | Repository tooling (`scripts/`, Node only) | CI (`lint:check`) | It reads files and a manifest; it needs no database. |
| Schema equivalence check | Database (two built instances) | Repository tooling (script) | Grants and policies exist only in a built database. |
| Bucket rows | Database (migration) | Supabase CLI (`[storage.buckets.*]`, local only) | A hosted project gets them only from the migration. |
| Per-deployment rows | Database (bootstrap SQL run by `psql`) | Operator environment (values) | Rows, not schema; two of them hold a URL and a key. |
| Seed check, drift check | Database (queries, shadow diff) | Repository tooling (scripts) | They read the applied state. |
| Edge Function JWT setting | Supabase CLI configuration (`config.toml`) | — | One declaration serves local serve and deploy. |

## Answers to the Research Questions

### Q1 — D-03: a method for the equivalence check

**What the schema holds, counted over `apps/supabase/supabase/schema/*.sql` on this tree** [VERIFIED: grep counts, 2026-10-11]: 107 `CREATE POLICY` (15 of them `ON storage.objects`), 79 `CREATE TRIGGER`, 79 function definitions, 75 statements beginning `GRANT` or `REVOKE`, 27 `CREATE TABLE`, 48 index definitions, 8 `CREATE TYPE`, 1 `CREATE EXTENSION` (`pg_net`), 1 `ALTER ROLE` (`anon` `statement_timeout`), and **0 `COMMENT ON`**. Three pieces of state are rows, not schema: the `private.deployment_settings` singleton (`107-feedback.sql:43-46`: `INSERT INTO / private.deployment_settings / DEFAULT VALUES / ON CONFLICT DO NOTHING;`) and, once D-07 lands, the two bucket rows.

So "comments" means two things here. `COMMENT ON` objects do not exist today. Comments inside a function body are part of the stored body and are compared byte for byte by any method that compares function source. A `--` comment outside a function body is not in a database at all, so no built-database method sees it; after the freeze such a comment can be edited in `schema/` with no migration.

| Method | What it covers | What it misses |
|--------|----------------|----------------|
| **A. `pg_dump --schema-only` of both databases, then a text diff** | Tables with column order, defaults, constraints, indexes, types and enum label order, function signature and body (with in-body comments), `SECURITY DEFINER` and `SET search_path`, triggers, row-level-security switches, policies with their roles and expressions, table, column, function and schema privileges, default privileges, `COMMENT ON`, ownership. [CITED: pg_dump 17 `--help` on this host lists `-x, --no-privileges` and `--no-comments` as opt-outs, so both are in by default] | Rows (the three above). Cluster-wide role settings (`ALTER ROLE anon SET …` is not in a database dump). [ASSUMED] Extensions when the dump is limited to named schemas. [ASSUMED] It also carries one random token per dump unless pinned: this host's `pg_dump` 17.6 has `--restrict-key=RESTRICT_KEY  use provided string as psql \restrict key`. [VERIFIED: `pg_dump --help`, this host] |
| **B. `supabase db diff`** (default engine `migra`) | Creation and removal of tables, columns, indexes, functions, triggers and policies in the diffed schemas. | Rows; **column privileges**; comments; roles; `alter policy` statements; view owner and grants; `alter publication … add table`; `create domain`. [CITED: supabase.com/docs/guides/local-development/declarative-database-schemas, "Limitations of the legacy engine" and "Known caveats"] It prints the difference and exits 0 either way (Q5). Whether it diffs policies in `storage` by default is unclear: the pinned source says "RLS policies in auth and storage schemas can be included with -s flag". [CITED: github.com/supabase/cli v2.118.0 `apps/cli-go/internal/db/diff/migra.go`] |
| **C. Hand-written catalog queries** (digests over `pg_catalog` and `information_schema`) | Exactly what is queried. Can reach what A misses: `pg_db_role_setting`, named tables' rows, `pg_extension`. | Everything nobody thought to query. It is an allow-list, so it is silent about a new kind of object. |

**Why B is ruled out for this repository.** `schema/303-column-grants.sql` is 245 lines of column-level grants, and method B does not capture column privileges. A migration that forgot a column grant would pass.

**Prescription: method A for the body, three queries of method C for A's known gaps, B not used.**

1. Build two databases in two isolated CLI instances (Pattern 2). Side M gets the repository's `migrations/`. Side S gets one migration file that is `cat schema/*.sql` in filename order, which is the concatenation the current generator makes (`scripts/assert-schema-migration-parity.mjs`, `concatenateSchema`). Seeding is off on both.
2. Dump each with the `pg_dump` inside its own database container, so the client always matches the server. A host or runner client older than the server refuses to dump. [ASSUMED] Use `--schema-only`, a fixed `--restrict-key`, and exclude the schema `supabase_migrations`, which differs by construction.
3. Add three queries, each printed in a stable order to the same file: role settings (`pg_db_role_setting` joined to role names), installed extensions (`pg_extension`), and the rows of the named data tables (`storage.buckets` with `id, name, public, file_size_limit, allowed_mime_types`; `private.deployment_settings`). Two instances are two clusters, which is what lets the role setting be compared at all: inside one cluster a role setting is shared by every database. [ASSUMED]
4. Compare the two files. Exit 0 when equal, 1 when different (print the diff), 2 when either build or dump failed. Read each status directly.
5. Print a census (object counts per kind from each dump) and refuse to pass when a count is under a floor. An empty dump compared with an empty dump is equal and proves nothing. This is the existing guard's own rule ("NON-VACUITY FLOOR").

**What the prescription still misses, to be written in the script's header:** `--` comments outside function bodies; sequence positions; anything in a schema the dump could not read. Whether a whole-database dump runs as `supabase_admin` inside the container, or must be limited to named schemas (`public`, `private`, `storage`), is not known without a stack. [ASSUMED] The first task of the plan measures it (Open Question 5).

**One property to tell developers.** Method A is strict about two things that feel like style. A column added by `ALTER TABLE … ADD COLUMN` lands last, so the `schema/` file must also put it last. A function re-created by a migration must have the same body text as `schema/`, in-body comments included. Both are real differences, and the check is right to report them.

**What already exists.** The CI job `supabase-types-drift` regenerates `packages/supabase-types/src/database.ts` from a database built from the migrations and fails on a difference. After the freeze that job compares the migrations with a committed file for tables, columns, enums and function signatures. It does not see grants, policies, triggers or function bodies. [VERIFIED: `.github/workflows/main.yaml`, job `supabase-types-drift`: "Regenerates `packages/supabase-types/src/database.ts` against a live local Supabase and fails if the committed file differs."]

### Q2 — D-01, D-02, D-05: the guard today, and what the rewrite must check

**Today.** [VERIFIED: scripts/assert-schema-migration-parity.mjs, whole file read; ran it, exit 0]

- It holds two conjuncts, in its own words: "`cat apps/supabase/supabase/schema/*.sql` (filename order …), with each file normalised to end in a newline, is BYTE-IDENTICAL to `migrations/00001_initial_schema.sql`" and "`apps/supabase/supabase/migrations/` contains EXACTLY ONE `.sql` file."
- Paths are constants: `const SCHEMA_DIR = 'apps/supabase/supabase/schema';`, `const MIGRATIONS_DIR = 'apps/supabase/supabase/migrations';`, `` const MIGRATION_FILE = `${MIGRATIONS_DIR}/00001_initial_schema.sql`; ``. Nothing is injectable.
- `yarn schema:regenerate` is `node scripts/assert-schema-migration-parity.mjs --write` (`package.json:24`). `--write` calls the same `concatenateSchema` and `writeFileSync(migrationPath, schemaText)`.
- It guards itself three ways: a census line on every run, a self-check that the comparator can report inequality, and a floor (`const MIN_SCHEMA_FILES = 20;`, `const MIN_SCHEMA_LINES = 3000;`, and a `CREATE TABLE public.` line must exist).
- It uses Node built-ins only and runs in this worktree with no `node_modules`.
- It is link 13 of `lint:check`: `… && yarn assert:env-pair-registry && yarn assert:schema-migration-parity && yarn assert:adapter-casts && …` (`package.json:53`).

**What the frozen-mode guard must check.** It has no git history where `lint:check` runs, so "accepts added entries only" is enforced as agreement between the files on disk and the manifest:

1. The manifest parses, and holds at least the baseline entry. The baseline entry is first, its file is `00001_initial_schema.sql`, and it names the commit it came from.
2. Every manifest entry's file exists, and its sha256 equals the recorded one. This is what fails when a frozen file is edited or deleted.
3. Every `.sql` file in the migrations directory has a manifest entry. This is what fails when a migration is added without its line.
4. Every file name matches five digits, an underscore, a name, `.sql`. A CLI-generated timestamp name (`supabase migration new`, `db diff -f`) fails here with a message that says to rename it to the next number.
5. Versions are unique and strictly increasing in manifest order, and each is greater than the baseline's (D-05). Two files with one version prefix (`00002_a.sql`, `00002_b.sql`) fail as a duplicate.
6. The existing self-defences stay: a census line, a floor (the baseline is not empty and still holds a `CREATE TABLE public.` line), and a self-test over committed fixtures that runs in the same invocation and withholds the verdict when it fails. `scripts/assert-grant-permission-enum.mjs` is the model: "When the self-test fails, the corpus result is WITHHELD".

Whether versions must also be contiguous (no gap) is not ruled. It would catch a file lost at a merge. It is left to the planner.

**Injectable paths and the fixture (D-02).** The house pattern is an exported function that takes its inputs, with `main()` behind an entry-point test, exercised by a spec in `packages/dev-seed/tests/`. `scripts/assert-env-pair-registry.mjs` ends with `if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();` and exports `DENO_ROOT`. Follow it: `checkFrozenMigrations({ migrationsDir, manifestPath })` returns findings; the self-test calls it over fixture directories; `lint:check` calls the script with no argument, so no argument can point the real gate at a fixture. Fixtures go under `scripts/fixtures/`, which prettier already skips ("scripts/fixtures/" in `.prettierignore`), so fixture hashes do not move.

**`schema:regenerate` (D-02): make it refuse, do not remove it.** The command is named in `apps/supabase/README.md`, in `.claude/skills/database/SKILL.md`, in the docs page `developers-guide/backend/intro/+page.md` and in the v2.16 stream's habits. A refusal that says "the baseline is frozen; write `0000N_<name>.sql` and add its manifest line" teaches; "command not found" does not.

**Where prettier and comment hygiene pick up the frozen files, and how to exclude them.**

- Prettier formats SQL: `packages/shared-config/prettier.config.mjs` has `plugins: ['prettier-plugin-sql'],` and `overrides: [{ files: '*.sql', options: { language: 'postgresql' } }]`. `yarn format:check` runs `prettier --check .` (`package.json:51`). The baseline is already excluded by the last line of `.prettierignore`. **Replace that one line with the directory** `apps/supabase/supabase/migrations/`, so appended files are excluded too, and rewrite the comment above it, which describes the generated-file model. `lint-staged` does not touch `.sql` (`.lintstagedrc.json` lists no SQL extension).
- `scripts/assert-comment-hygiene.mjs` scans every tracked file under three roots: `const SCAN_ROOTS = ['apps', 'packages', 'tests'];`. It reads the baseline today. It has no ignore file by design: "There is deliberately no `--files` glob, no ignore file, no per-path exception roster and no warn-only tier … Excusing a file requires editing this script, which is then reviewed as the decision it is." **Add a named constant** for the exact prefix `apps/supabase/supabase/migrations/`, report it in the summary line as `VENDORED_EXCLUSIONS` is reported, and fail closed when it matches no tracked file, as that list does ("An exclusion that excuses nothing is a hole nobody can see"). Do not add `migrations` to `SKIP_PATH_RE`: that pattern matches a path segment anywhere, and would silence any future directory of that name.

**Line endings.** The repository has no `.gitattributes`. A checkout with `core.autocrlf` on would change the bytes and so the hash. [ASSUMED] Add `.gitattributes` entries that pin the migrations and the guard fixtures to LF in the freeze commit.

**D-08: the comments to correct before the freeze.** A search of `schema/*.sql` for `SQL editor`, `in production`, `dashboard`, `seed.sql`, `hosted`, `by hand`, `manually` and `unverified` finds seven lines. [VERIFIED: grep, 2026-10-11; rows 1, 2, 3 and 5 below by Read (107-feedback.sql:28-55, 400-storage.sql:29-48, 100-tenancy.sql:15-26), the others by printing the line] The plan must run the search again at run time, because v2.16's merge will move them.

| File | Text | Why it changes |
|------|------|----------------|
| `107-feedback.sql` | "so a hosted deployment sets it once in the SQL editor with `UPDATE private.deployment_settings SET behind_cloudflare = true;`" and "The local stack sets it in seed.sql." | The bootstrap sets it. This is the example D-08 names. |
| `107-feedback.sql` | "Only the owner reads or writes it: the SECURITY DEFINER trigger, the seed and an operator." | The bootstrap is a third writer. |
| `400-storage.sql` | "seed.sql sets local dev defaults; in production, set the project's actual Supabase URL and service role key." | The bootstrap sets both. |
| `400-storage.sql`, last line | "Note: the cleanup triggers need supabase_url and service_role_key in storage_config. seed.sql sets the local dev values; in production, set the actual values." | Same. |
| `100-tenancy.sql` | "seed.sql and SupabaseAdminClient.ensureProject set it to true." | The bootstrap also writes the column. |
| `001-role-settings.sql` | "⚠ HOSTED DEPLOYMENTS: the value lives on the role, not in config.toml, so a project whose migrations are not applied keeps Supabase's 3 s." | True as written. No change. |
| `107-feedback.sql`, two lines | Statements about hosted behaviour, for example "On hosted Supabase the last entry can be a platform-internal address shared by many voters". | Not a manual step. But it is a statement about a hosted project that nobody has observed, and phase 184 measures exactly this. |

One consequence for phase 189. A `--` comment is not in a database, so after the freeze a comment in `schema/` can still be edited freely. The copy in the frozen baseline cannot. DOCS-02's search of "the repository's comments" for unverified statements about a hosted project will therefore keep finding the baseline's copies. Either such statements are reworded before the freeze, or that search leaves the frozen migrations out. Record it for phase 189.

**Text that becomes false at the freeze, and belongs in the freeze commit or beside it:** the header of the guard itself; the comment above the baseline's entry in `.prettierignore` ("is GENERATED by `yarn schema:regenerate`"); `apps/supabase/README.md` ("The schema is **declarative**. You edit `supabase/schema/`; `supabase/migrations/` is generated"); `.claude/skills/database/SKILL.md` ("`supabase/migrations/` holds exactly **one** file"); the docs page `developers-guide/backend/intro/+page.md` ("Run `yarn schema:regenerate` to rewrite `migrations/00001_initial_schema.sql` from `schema/`"); the header of `scripts/assert-grant-permission-enum.mjs` ("edited but never regenerated into `migrations/00001_initial_schema.sql`"). The review checklist requires documentation to follow the change. The deployment guide's rewrite stays with phase 189.

### Q3 — D-07: bucket rows inserted by a migration beside `[storage.buckets.*]`

**Not measured. A stack is needed, and none was started.** What the pinned source says:

- An existing bucket is updated, not refused. `UpsertBuckets` in `apps/cli-go/pkg/storage/batch.go` at `v2.118.0`: "`// Update bucket properties if already exists`", then `fmt.Fprintln(os.Stderr, "Updating Storage bucket:", bucketId)` and `s.UpdateBucket(ctx, body)`; otherwise "Creating Storage bucket:". [CITED: raw.githubusercontent.com/supabase/cli/v2.118.0/apps/cli-go/pkg/storage/batch.go]
- A local `db reset` seeds buckets from the configuration after the reset, when the storage container exists, and the code shows no check of `--no-seed` at that step: "`// Seed objects from supabase/buckets directory`" / `if resp, err := utils.Docker.ContainerInspect(ctx, utils.StorageId); err == nil {` / `if err := buckets.Run(ctx, "", false, fsys); err != nil {`. [CITED: …/apps/cli-go/internal/db/reset/reset.go, read through a summarising fetch]
- The Supabase documentation shows a bucket created by SQL: `insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);`. [CITED: supabase.com/docs/guides/storage/buckets/creating-buckets] It shows no size limit set by SQL.

So the expected answer is "tolerated: the CLI updates the rows to the configured properties". It stays an expectation until it is run.

**The properties to insert.** `config.toml:128-135`: `[storage.buckets.public-assets]` / `public = true` / `file_size_limit = "500MiB"` and `[storage.buckets.private-assets]` / `public = false` / `file_size_limit = "500MiB"`. [VERIFIED: apps/supabase/supabase/config.toml:119-138] The column holds a number of bytes; 500 MiB is 524,288,000. [ASSUMED] The plan must read the value back from a stack the CLI seeded (`SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets;`) and write that exact value, not compute it.

**The measurement, as a planned task** (on an isolated instance that includes the storage service, or in an agreed window on the shared stack):

1. Precheck, expected red: on the unchanged tree, a database-only isolated build (no storage container, so no bucket seeding) has zero rows in `storage.buckets`.
2. With the insert in `schema/400-storage.sql` and the migration regenerated, the same database-only build has exactly the two rows with the declared properties. This is criterion 5's first sentence.
3. With the insert and the blocks both present, start the instance with the storage service. Record the exit status of `supabase start`, the bucket lines it prints, and the two rows afterwards (count 2, properties as declared). Run `supabase db reset` on that instance and record the same. Upload one small object to each bucket.
4. If step 3 fails, delete the blocks (D-07) and repeat. `tests/scripts/e2e-run.sh` asserts the `public-assets` bucket is listed ("POLLS REST + Storage for readiness and asserts the `public-assets` bucket is listed"), and it would then rest on the migration alone. That file is not edited.

### Q4 — D-09, D-10: the bootstrap's rows, tables, privileges, and psql's environment read

**Rows.** [VERIFIED: apps/supabase/supabase/seed.sql:10-82; schema/100-tenancy.sql:1-26 (`CREATE TABLE public.accounts (` with `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),` and `name text NOT NULL,`); schema/106-app-settings.sql:1-12 (`project_id uuid NOT NULL UNIQUE REFERENCES public.projects (id) ON DELETE CASCADE,`)]

| Row | Table | Key and conflict rule | Value from |
|-----|-------|-----------------------|-----------|
| The account | `public.accounts (id, name)` | `id`; do nothing on conflict | Fixed id `00000000-0000-0000-0000-000000000001`; name from the environment or a default |
| The project | `public.projects (id, account_id, name, default_locale, open_for_voters)` | `id`; do nothing on conflict | `PUBLIC_PROJECT_ID`; the rest from the environment or defaults |
| The settings row | `public.app_settings (project_id, settings)` | `project_id` (it is `UNIQUE`); do nothing on conflict | `'{}'::jsonb` |
| Storage URL | `public.storage_config (key, value)`, key `supabase_url` | `key`; update on conflict | The URL Postgres uses to reach the Storage API |
| Storage key | `public.storage_config`, key `service_role_key` | `key`; update on conflict | The service-role key |
| Cloudflare trust | `private.deployment_settings (singleton, behind_cloudflare)` | `singleton`; update on conflict | A boolean |

"Do nothing" for the first three keeps a second run from overwriting a name, a locale or `open_for_voters` that an admin has since changed. "Update" for the last three lets a rotated key or a corrected URL be applied by running the script again. Both are idempotent.

**Privileges.** All five tables are created by the migration, so the role that runs the migration owns them; locally and on a hosted project that is `postgres`. Row-level security does not bind a table's owner unless it is forced, and no schema file forces it (`grep -i "FORCE ROW" schema/*.sql` finds nothing). [VERIFIED: grep] `private.deployment_settings` revokes every API role (row 6 above), and the `private` schema is not exposed through the API (`config.toml`: `schemas = ["public", "graphql_public"]`). A direct connection as `postgres` is therefore the one path that writes all six rows.

**What `ensureProject` does.** [VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:42-47 by Read; the method body read in full] It hard-codes the account: `const DEFAULT_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';`, with the comment "`seed.sql` inserts it unconditionally, so it is present in any database migrations have run against". It then upserts `projects` with `{ id, account_id: DEFAULT_ACCOUNT_ID, name: \`Project ${id}\`, default_locale: 'en' }` ignoring duplicates, sets `open_for_voters: true` by a separate unconditional update, and upserts `app_settings` with `{ project_id: id, settings: {} }` ignoring duplicates. It creates no account ("No `accounts` row is created"). So on a database with no seed, `ensureProject` fails on the foreign key until the bootstrap has created the account. And any later out-of-band `ensureProject` opens the project for voters whatever the bootstrap wrote.

**How psql reads the environment without `-v`.** [CITED: postgresql.org/docs/17/app-psql.html]

- `\getenv psql_var env_var` "gets the value of the environment variable *env_var* and assigns it to the psql variable *psql_var*. If *env_var* is not defined in the psql process's environment, *psql_var* is not changed."
- `:{?variable_name}` "allows testing whether a variable is defined. It is substituted by TRUE or FALSE." With `\if`, the script can refuse to run when a variable is missing.
- `\bind` "sets query parameters for the next query execution", and it uses the extended query protocol. A value passed this way is not part of the statement text. Use it for the service-role key, so that a failed statement cannot put the key in the server's log. [ASSUMED: that the server logs a failed statement's text but not its bound parameters by default]
- `\set ON_ERROR_STOP on` inside the file makes psql exit 3 on an error ("3 if a script error occurred and `ON_ERROR_STOP` was set"). It needs no `-v`.
- The connection must not sit on the command line either. A connection URL as an argument holds the database password in the process list. Give the connection through the libpq variables `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE` and `PGPASSWORD`, so the command is `psql -X -f <file>` with nothing secret in it. [CITED: the psql page names `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`; `PGPASSWORD` is ASSUMED from libpq]

`\getenv` needs psql 15 or newer, `\bind` 16 or newer. [ASSUMED for the version numbers] This host has psql 17.6. [VERIFIED: `psql --version`]

**One trap in `\bind`.** In a meta-command's arguments `:'name'` yields the value wrapped in SQL quotes, so the stored value would begin and end with a quote character. Pass `:name`. [ASSUMED] The plan checks it without printing the key: compare `length(value)` and `left(value, 3)` with the environment value's.

**The environment variable that holds the storage URL needs its own name.** The root `.env.example` sets `SUPABASE_URL=http://127.0.0.1:54321`. The value `storage_config` needs is the address as seen from inside Postgres, which locally is `http://kong:8000` (`seed.sql:14`: `('supabase_url', 'http://kong:8000'),`). A bootstrap that read `SUPABASE_URL` locally would write an address the database cannot reach. On a hosted project the two are the same URL.

### Q5 — D-11: the drift check, the seed check, and their exit statuses

**`supabase db diff`.** [VERIFIED: `supabase db diff --help`, CLI 2.118.0]

- "Compares a shadow built from supabase/migrations with a live database (--local by default, --linked, or --db-url)." Flags include `--schema, -s string  Comma separated list of schema to include.` and the engine switches (`--use-migra`, `--use-pg-delta`, `--strict-coverage`).
- There is no flag that makes it exit non-zero on a difference.
- From the pinned source: the command returns no error in both cases. With no difference it prints "No schema changes found" to standard error; with one it prints the SQL to standard output. [CITED: github.com/supabase/cli v2.118.0 `apps/cli-go/internal/db/diff/diff.go`, read through a summarising fetch] So its exit status is 0 either way, and non-zero only when it could not run. **Not measured.**
- It needs Docker: it starts a shadow database on `shadow_port` (`config.toml:42`: `shadow_port = 54320`).

**`supabase migration list`.** [VERIFIED: `--help`] "List local and remote migrations." with `--local`, `--linked`, `--db-url`. It prints a table for a person to read. It has no status for a mismatch. [ASSUMED]

**Prescription for the drift check script.** Two parts, one exit status:

1. History. The versions recorded in the database equal the versions in the manifest, in order. Read them with `psql` from `supabase_migrations.schema_migrations`. [ASSUMED: table and column names, from the milestone research: "`supabase db push` records each applied migration by its version in `supabase_migrations.schema_migrations`"] This is exact, and it is what catches "a migration was never pushed" and "the database has a version the repository does not".
2. Schema. `supabase db diff` against the target prints nothing to standard output.

Exit 0 when both hold, 1 on drift, 2 when the check could not run (the CLI or psql failed). Write the diff output to a file and test its size; do not pipe the command into a filter and read the filter's status.

**Its blind spots, to be written in its header and seen once:** rows, column privileges, comments, role settings, `alter policy` (the list in Q1, method B). The planted-DDL red control of D-11 (for example a column added to a public table) is inside what it sees. Plan one more recorded control: a planted column `REVOKE`. If the check stays green, record that as a known blind spot. That is an honest record, not a failed criterion.

**A risk to measure first.** Whether `db diff` prints nothing on a clean database built from this baseline is not known. Diff engines can report differences that are not there. If it is not empty on a clean build, the drift check cannot be green as specified. The fallback is the dump comparison of Q1, limited to the schemas this project owns, between the live database and an isolated build from the migrations. See Open Question 4.

**"After a push to a local database."** `supabase db push` has `--local  Pushes to the local database.` and `--dry-run`. [VERIFIED: `--help`] On an isolated instance: start (applies the baseline), add a fixture migration, `db push --local`, drift check green; plant DDL; drift check red. That also shows the CLI accepts a `00002_<name>.sql` name. [ASSUMED until run]

**The seed check's queries.** [VERIFIED: apps/supabase/supabase/seed.sql:10-21, 106-113, 154-160]

- A seed user: any `auth.users` row whose address ends in `@openvaa.test` (`'admin@openvaa.test'`, `'candidate@openvaa.test'`), or whose id is `00000000-0000-0000-0000-000000000010` or `…0011`.
- A local URL: the `storage_config` value for `supabase_url` names `kong`, `127.0.0.1`, `localhost` or `host.docker.internal`, or does not begin `https://`.
- Optional and cheap: the `storage_config` service-role key is the public demo key (its payload's issuer is `supabase-demo`). Compare without printing it.

Write the check as one SQL file that raises an exception listing every finding. With `ON_ERROR_STOP`, psql then exits 3 for a finding, 2 for a lost connection, 0 for clean, and the status is psql's own with no wrapper in between. The red control is a database with `seed.sql` applied: it must name both the user and `http://kong:8000`.

### Q6 — D-12 to D-15: adapter-node, kit, the Dockerfile, the hooks

**adapter-node 5.5.7.** [VERIFIED: ../voting-advice-application-gsd/node_modules/@sveltejs/adapter-node/files/handler.js:14-37 and 96-143, index.js:77-125, env.js read in full; version from that package's `package.json` and this worktree's `yarn.lock`]

- `ORIGIN`: `const origin = parse_origin(env('ORIGIN', undefined));` at module load, then `base: origin || get_origin(req.headers),` per request. With `ORIGIN` set, `get_origin` is never called, so `PROTOCOL_HEADER`, `HOST_HEADER` and `PORT_HEADER` are never read. An invalid value throws at start: `parse_origin` raises "Invalid ORIGIN: '…'. ORIGIN must be a valid URL with http:// or https:// protocol." An empty string counts as invalid.
- Without `ORIGIN`, `get_origin` takes the protocol from `PROTOCOL_HEADER` or defaults to `'https'`, and the host from `HOST_HEADER` or the request's `host` header, which the client controls.
- `ADDRESS_HEADER`, `XFF_DEPTH`: `const xff_depth = parseInt(env('XFF_DEPTH', '1'));` and `const address_header = env('ADDRESS_HEADER', '').toLowerCase();`. With no address header, `getClientAddress()` returns the socket's remote address, which is the proxy. With `x-forwarded-for`, it returns `addresses[addresses.length - xff_depth].trim()`: counted from the right. It throws when the header is absent ("Address header was specified with … but is absent from request") and when the depth exceeds the entries. These throws happen only when something calls `getClientAddress()`.
- `SHUTDOWN_TIMEOUT`: `const shutdown_timeout = parseInt(env('SHUTDOWN_TIMEOUT', '30'));`.
- `SIGTERM`: `process.on('SIGTERM', graceful_shutdown);` and the same for `SIGINT`. `graceful_shutdown` calls `httpServer.closeIdleConnections();`, then `httpServer.close(…)`, which waits for requests in flight, and sets `setTimeout(() => httpServer.closeAllConnections(), shutdown_timeout * 1000);`. When the server has closed it emits `process.emit('sveltekit:shutdown', reason);`. **It never calls `process.exit`.** The process ends when nothing else holds the event loop.
- `KEEP_ALIVE_TIMEOUT` and `HEADERS_TIMEOUT` exist (`timeout_env('KEEP_ALIVE_TIMEOUT')`), in seconds. They matter in phase 185, not here.
- `await server.init({ env: … (process.env), read: … });` runs at module load, after the `ORIGIN` parse and before the server listens.

**An upstream change to know about.** The current adapter-node documentation page describes `paths.origin` in the build configuration and no longer documents an `ORIGIN` variable. [CITED: svelte.dev/docs/kit/adapter-node, fetched 2026-10-11] The installed versions are the other way round: kit 2.70.3's `paths` object has `base`, `assets` and `relative` only. [VERIFIED: ../voting-advice-application-gsd/node_modules/@sveltejs/kit/src/core/config/options.js, `paths: object({ base: …, assets: …, relative: boolean(true) })`] A later upgrade of kit or the adapter can therefore move the mechanism. The topology check is what would catch it.

**The `init` hook in kit 2.70.3.** [VERIFIED: …/@sveltejs/kit/src/exports/public.d.ts and src/runtime/server/index.js, read by content]

- It exists: "The [`init`] will be invoked before the server responds to its first request / `@since 2.10.0`" above `export type ServerInit = () => MaybePromise<void>;`.
- `Server.init` sets the private and public environment first, then loads the hooks module and runs `if (module.init) { await module.init(); }`. So `$env/dynamic/private` and `$env/dynamic/public` are populated when `init` runs.
- A thrown error is rethrown outside development: `if (__SVELTEKIT_DEV__) { … handle: () => { throw e; } … } else { throw e; }`. In production the rejection reaches adapter-node's top-level `await server.init(…)`, before `server.listen`. In development the server keeps running and every request throws. That the process then exits non-zero is expected, and not measured. [ASSUMED]
- It does not run during this application's build. The analyse step sets `building` and does not create a server. The prerender step creates one only when something is prerendered ("only run the server after the `should_prerender` check so that we don't run the user's init hook unnecessarily"), and no route under `apps/frontend/src` declares `prerender`. [VERIFIED: grep] Guard on `building` anyway, so a prerendered route added later does not break the image build, which CI runs with no environment.
- Order against the adapter: an invalid or empty `ORIGIN` is refused by the adapter first, with its own message. An absent `ORIGIN` reaches `init`. The check must treat an empty string as unset for the three `PUBLIC_` variables, because the application's own readers turn an unset value into `''` (`constants.ts`: `PUBLIC_PROJECT_ID: env.PUBLIC_PROJECT_ID ?? ''`).

**`kit.version.name`.** [VERIFIED: apps/frontend/svelte.config.js:9-43 by Read; kit sources by content]

- Today: `version: { / pollInterval: 5 * 60 * 1000 / }`. No name, so kit's default applies: `name: string(Date.now().toString()),`.
- The file is written by the build: `fileName: \`${kit.appDir}/version.json\`,` with `source: s({ version: kit.version.name })`. The same value is the `version` export of `$app/environment` ("The value of `config.kit.version.name`.").
- `undefined` falls back to the default (`return input === undefined ? fallback : fn(input, keypath);`). An empty string does not: it is accepted as a name. An unset Docker build argument reaches the build as an empty value. [ASSUMED] So the config must turn an empty value into `undefined`. An empty name would give every build the same version, and the client's version polling would never see a new deployment.
- Nothing in `apps/frontend/src` reads `$env/static/*`; all configuration is read at run time through `$env/dynamic/public` (`lib/utils/constants.ts`) and `$env/dynamic/private` (`lib/server/constants.ts`). [VERIFIED: grep] The build argument is the only build-time input this phase adds.

**The Dockerfile.** [VERIFIED: apps/frontend/Dockerfile:36-55 by Read] The last line is `CMD node ./apps/frontend/build/index.js`, the shell form. The production stage is `FROM frontend AS production`, then `ARG NODE_ENV=production`, `ENV NODE_ENV=${NODE_ENV}`, `WORKDIR /opt`, `RUN yarn workspace @openvaa/frontend build`, `EXPOSE 3000`. The build argument must be declared in this stage, above that `RUN`. The Docker reference says of the shell form: "the executable will not be the container's `PID 1`, and will not receive Unix signals". [CITED: docs.docker.com/reference/dockerfile/#shell-and-exec-form] Whether this image's `/bin/sh` replaces itself with the last command is not known. [ASSUMED unknown] The exec form removes the question. `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` asserts only `/^FROM\s+\S+\s+AS\s+production\s*$/m` of the Dockerfile, so the `CMD` and `ARG` changes do not touch it. [VERIFIED: file read]

**The hooks and the session gate.** Covered in row 4 of the table above. Three more facts for the health route:

- `supabaseHandle` runs for every request and calls `createServerClient(constants.PUBLIC_SUPABASE_URL, constants.PUBLIC_SUPABASE_ANON_KEY, …)`. [VERIFIED: apps/frontend/src/lib/supabase/server.ts, read in full] Constructing the client opens no connection for a request with no auth cookie. [ASSUMED] Criterion 1's observation is what proves it.
- The health handler must not call `getClientAddress()`. A load balancer's health request carries no forwarded header, and with `ADDRESS_HEADER` set the call throws.
- The CSRF check is what a wrong origin breaks. [VERIFIED: …/@sveltejs/kit/src/runtime/server/respond.js, by content] It runs outside development only (`if (!__SVELTEKIT_DEV__) {`), for form content types and `POST`, `PUT`, `PATCH`, `DELETE`, and refuses when `request_origin !== url.origin` with "Cross-site ${request.method} form submissions are forbidden" and status 403. `url.origin` comes from the adapter's `base`. So a form post through the proxy is the discriminating test of `ORIGIN`, and it needs no Supabase to fail: the check runs before routing.

**"A redirect is built on the public origin": the application has almost no absolute redirect.** Every redirect in the hooks and the auth callback is built by `buildRoute` and is a path. The one server-side use of the origin is `routes/api/oidc/callback/+server.ts`: `const redirectUri = url.origin + url.pathname;`, which goes to the identity provider and cannot be seen without one. [VERIFIED: grep over apps/frontend/src] Paraglide can answer with an absolute `Location` (`Location: decision.redirectUrl.href`), but only when the request's URL differs from its localised form, which this URL pattern set does not produce in normal use. [VERIFIED: generated `src/lib/paraglide/server.js` and `runtime.js` in the `-gsd` worktree, by content] So the observable needs choosing. See Open Question 3.

### Q7 — SUPA-05: the JWT setting of `identity-callback`

**Today it is not declared.** `config.toml` has no `[functions.*]` section at all; the only function-related block is `[edge_runtime]` with `[edge_runtime.secrets]` / `PUBLIC_PROJECT_ID = "env(PUBLIC_PROJECT_ID)"`. [VERIFIED: apps/supabase/supabase/config.toml:400-419 by Read; `grep -n "^\[functions"` finds nothing] The CLI's default is to verify: "By default, Edge Functions require a valid JWT in the authorization header." [CITED: supabase.com/docs/guides/functions/function-configuration]

**The repository says two different things about it.** The function's own comment says "This endpoint is served --no-verify-jwt and is reachable with the public anon key" (`identity-callback/index.ts`). `.env.example` says "because the endpoint is served `--no-verify-jwt`". The runbook serves it alone with that flag (`npx supabase functions serve identity-callback --no-verify-jwt --env-file …`). But the normal local stack serves it with no flag and no configuration, so with verification on. The frontend calls it with the anon key (`locals.supabase.functions.invoke('identity-callback', …)` in `routes/api/contestant/preregister/+server.ts`), which is a JWT, so both modes work today.

**What to declare.** `[functions.identity-callback]` with `verify_jwt = false`. The documentation gives this form (`verify_jwt = false` under `[functions.<name>]`) and `functions deploy` otherwise needs the flag `--no-verify-jwt  Disable JWT verification for the Function.` on every deploy. [CITED: same page; VERIFIED: `supabase functions deploy --help`] The value follows the milestone research (`SUMMARY.md` D5) and the function's own documented security model. **No ruling names the value**, so it is an assumption to confirm (A7). The effect to state in the plan: the local stack's own serving of this function changes from verifying to not verifying.

The other two functions are not in SUPA-05. `account-access` is called by signed-out visitors with the anon key, and whether the hosted gateway accepts that is OBS-03 in phase 184. Leave them undeclared here.

### Q8 — which tests read the files this phase edits

| File | Read by | What is read | Effect of this phase's edit |
|------|---------|--------------|-----------------------------|
| `docker-compose.dev.yml` (root) | `packages/dev-seed/tests/localSupabaseUrl.test.ts`, "repository wiring drift gate" | The pattern `/PUBLIC_SUPABASE_URL:\s*\$\{PUBLIC_SUPABASE_URL:-([^}]+)\}/g`; at least one match; each match a local URL | Adding variables is safe. Keep the `PUBLIC_SUPABASE_URL` line's shape. |
| `.env.example` (root) | The same test: `/^(?:PUBLIC_)?SUPABASE_URL=(\S+)$/gm` | Lines that begin `SUPABASE_URL=` or `PUBLIC_SUPABASE_URL=` | Do not add a line of that shape with a non-local value. |
| `.env.example` | `scripts/assert-env-pair-registry.mjs` and `assert-env-pairs-agree.mjs` (both in `lint:check` or `check:env-local`) | The cross-runtime pair block and its header phrases | The proxy variables are not pairs. Add them outside that block. |
| `.env.example` | `apps/frontend/svelte.config.test.ts` | That the file exists beside `kit.env.dir` | None. |
| `.env.example` | CI: `cp .env.example apps/frontend/.env` and `cp .env.example .env` | The whole file becomes the environment of CI builds and E2E | A live proxy line would reach those runs. Keep the proxy variables commented (Pitfall 8). |
| `render.example.yaml` | No test parses it. It is named in the docblock of `ciDockerImageBuildGate.test.ts` and in a comment of `main.yaml`. | — | Free to edit. |
| `apps/frontend/Dockerfile` | `ciDockerImageBuildGate.test.ts` | `AS production` exists | None, if the stage name stays. |
| `apps/frontend/svelte.config.js` | `apps/frontend/svelte.config.test.ts` | `kit.env.dir` | None. Add cases there for the version name. |
| `apps/supabase/supabase/config.toml` | `localSupabaseUrl.test.ts` (the `[api]` section's `port`), `scripts/assert-auth-signup-closed.mjs` and `tests/tests/specs/auth/public-signup-closed.spec.ts` (auth keys), `packages/dev-seed/tests/ensureProject.test.ts` and others (mentions) | `[api]` and `[auth]` keys | A new `[functions.identity-callback]` section does not touch them. |
| `apps/supabase/supabase/seed.sql` | `localSupabaseUrl.test.ts`: `/\('supabase_url',\s*'([^']+)'\)/g` | The storage URL | This phase does not edit `seed.sql`. |
| `migrations/00001_initial_schema.sql` | `permittedKeys.test.ts`, `allowedTeardownTables.test.ts` | Function bodies, as the current schema | Must be re-pointed at `schema/` at the freeze (Pitfall 6). |
| `scripts/assert-schema-migration-parity.mjs`, `package.json` scripts | Gate specs in `packages/dev-seed/tests/` assert that guards are wired into `lint:check` (for example `rpcNullabilityGate.test.ts`) | Script names in `lint:check` | Add a wiring assertion for the rewritten guard, in the same style. |

[VERIFIED: packages/dev-seed/tests/localSupabaseUrl.test.ts:223-247 for the three patterns; the other rows by reading each file's content at the quoted text]

### Q9 — the contact points with the v2.16 stream

**The schema has changed there.** See row 1 of the checked statements. Phase 177 was executed in place, as D-04 expects. Phase 177.1 is "Not started" and "not discussed"; phase 178 is planned (24 plans) and held. [VERIFIED: `git show feat/entity-signup-multi-grant:.planning/STATE.md` and `ROADMAP.md`, 2026-10-11] So the freeze cannot happen soon, and the rest of this phase should not wait for it.

**Which `schema/` files each stream touches before the freeze.** v2.16 so far: `000-enums.sql`, `011-validation-functions.sql`, `101-elections.sql`, `104-nominations.sql`, `301-auth-functions.sql`, `302-rls.sql`, `303-column-grants.sql`, `503-entity-rpcs.sql`. This phase: `400-storage.sql` (the insert and two comments), `107-feedback.sql` and `100-tenancy.sql` (comments). No file is in both lists. Phase 182's change (ruling 182-12) is not written yet; if it lands in `301-auth-functions.sql` or `302-rls.sql` it meets v2.16's edits at merge. `00001_initial_schema.sql` is regenerated on both branches and always conflicts; the resolution is to merge `schema/` and regenerate, never to merge the generated file by hand.

**What both branches must share at the freeze.** One commit, in both, that contains:

- the manifest;
- the rewritten `scripts/assert-schema-migration-parity.mjs` with its fixtures and its self-test, and the `schema:regenerate` refusal (`package.json`);
- the `.prettierignore` change and the `assert-comment-hygiene.mjs` exclusion;
- the two re-pointed tests (Pitfall 6);
- a `schema/` that is byte-identical on both branches, because the baseline's hash is one value. This is the hard part: it means one branch has merged the other's schema work before the freeze commit is made.

Shared from then on, and to be merged with care: the equivalence check script; `.claude/skills/database/` (v2.16 changed `SKILL.md`, `rls-policy-map.md` and `schema-reference.md`; the skill states the regenerate model and the CI job `skill-drift-check` reports drift when `apps/supabase/` changes after the skill); `apps/supabase/README.md` (changed on v2.16, and it states the regenerate model); `packages/supabase-types/src/database.ts` (changed on v2.16; generated).

**Not changed on v2.16 since the branch point** [VERIFIED: `git diff --stat d228b52bc..feat/entity-signup-multi-grant -- <path>` printed nothing for each]: `package.json`, `.prettierignore`, `scripts/assert-comment-hygiene.mjs`, `scripts/assert-schema-migration-parity.mjs`, `.github/workflows/main.yaml`, `apps/supabase/supabase/config.toml`, `seed.sql`, `apps/frontend/src/hooks.server.ts`, `apps/frontend/Dockerfile`, `apps/frontend/svelte.config.js`, `.env.example`, `docker-compose.dev.yml`, `render.example.yaml`, `packages/dev-seed/src/supabaseAdminClient.ts`, `apps/frontend/src/routes/api`. So the server-deployability work of this phase does not collide with v2.16 today. v2.16 did change `tests/scripts/e2e-run.sh` and `tests/playwright.config.ts`, which this phase does not edit.

**One more contact, at run time.** Both worktrees declare `project_id = "openvaa-local"` and the same ten literal ports. See Pitfall 1.

## Standard Stack

No package is installed in this phase. Everything is already pinned, or is a tool on the machine.

### Core
| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| `@sveltejs/adapter-node` | 5.5.7 [VERIFIED: yarn.lock + installed `package.json`] | The production server; reads the proxy variables; handles `SIGTERM` | Already the adapter (`adapter: adapter({})`) |
| `@sveltejs/kit` | 2.70.3 [VERIFIED: same] | `init` hook, `version` export, `/_app/version.json`, CSRF origin check | Already the framework |
| Supabase CLI (`supabase`) | 2.118.0 [VERIFIED: yarn.lock; `main.yaml` pins `version: 2.118.0`; `supabase --version`] | `db start`, `db reset --no-seed`, `db push --local`, `db diff`, `stop --no-backup` | Already the pin; do not bump it in this phase |
| `psql` | 15 or newer for `\getenv`, 16 or newer for `\bind` [ASSUMED]; host has 17.6 [VERIFIED] | Runs the bootstrap and the seed check | Ruling D-09 |
| `pg_dump` | The one inside the database container (17.x) | The equivalence check | Matches the server by construction |
| Node built-ins (`node:fs`, `node:crypto`, `node:path`, `node:child_process`) | Node ≥ 24.15.0 (`engines`) | The guard, the manifest hashes, the check scripts | The house style of every `assert:*` script |
| `zod` | 4.6.5 [VERIFIED: yarn.lock] | Optional: parse the health and diagnostics response shapes in tests | Already a frontend dependency |

### Supporting
| Tool | Version | Purpose | When |
|------|---------|---------|------|
| Docker with Compose | 29.7.2 on this host [VERIFIED] | The production image, the proxy topology, the isolated CLI instances | Every observation that is not a unit test |
| `nginx` image | Pin a tag at plan time [ASSUMED: not pulled on this host] | The local reverse proxy | The topology check |
| `curl` | 8.7.1 on this host [VERIFIED] | The scripted topology check | Same |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nginx as the local proxy | Caddy | Caddy replaces a client-supplied `X-Forwarded-For` by default unless the client is a trusted proxy. [ASSUMED] The spoofed header would never reach the container, so the depth setting would not be tested. An AWS load balancer appends: "the load balancer appends the client IP address to the existing header and then passes the header to your server", and "The default is `append`." [CITED: docs.aws.amazon.com/elasticloadbalancing/latest/application/x-forwarded-headers.html] nginx with `$proxy_add_x_forwarded_for` does the same. |
| `supabase db diff` for equivalence | — | Ruled out in Q1. |
| The pg-delta engine (`--use-pg-delta`, `--strict-coverage`) for the drift check | — | It models more, and `--strict-coverage` can fail the command. It is behind `[experimental.pgdelta]` at this CLI version. [CITED: the declarative-schemas page; VERIFIED: `--help`] Not for this phase; a candidate to measure in phase 184. |

**Installation:** none.

## Package Legitimacy Audit

This phase installs no external package. No audit is needed. If the plan pins an `nginx` image, pin it by tag and digest from the official library image.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 SERVER DEPLOYABILITY (no database needed)

  docker build --build-arg BUILD_SHA ──► svelte.config.js: kit.version.name
                                             │
                                             ├─► /_app/version.json   (static file)
                                             └─► $app/environment `version`
                                                        │
  client ──► reverse proxy ──► node build/index.js     ▼
             (appends XFF,      │  1. adapter parses ORIGIN      (invalid → exit)
              keeps Host)       │  2. server.init → hooks `init` (unset var → one error, exit)
                                │  3. listen
                                │  4. per request: base = ORIGIN
                                │        ├─ form POST: Origin ≠ url.origin → 403
                                │        ├─ /api/health       → 200 {status, build}   no upstream call
                                │        └─ /api/<diagnostics> → 404 unless enabled;
                                │                                else {origin, address, forwarded headers}
  SIGTERM ──► PID 1 = node ──►  close idle, finish in-flight, emit sveltekit:shutdown, exit


 MIGRATION MODEL

  before the freeze            the freeze commit              after the freeze
  ─────────────────            ─────────────────              ────────────────
  edit schema/*.sql            manifest written               edit schema/*.sql
  yarn schema:regenerate  ──►  guard switches to       ──►    + write 0000N_<name>.sql
  (00001 rewritten in place)   frozen mode                    + add the manifest line
                               regenerate refuses                    │
                                                                     ▼
                              ┌── lint:check (Node only) ── manifest guard: hashes, names, order
                              │
                              └── on demand (needs Docker) ─ equivalence check:
                                     instance M (migrations/)  ─┐
                                     instance S (cat schema/)  ─┴─► pg_dump + 3 queries ─► diff


 PER-DEPLOYMENT STATE (shown on an isolated instance here; on the hosted project in 184)

  operator env ──► psql -X -f bootstrap.sql ──► accounts, projects, app_settings,
   (PG*, values)        (\getenv, \bind)        storage_config ×2, deployment_settings
                                                        │
                   psql -X -f seed-check.sql  ◄─────────┤  exit 3 on a seed user or a local URL
                   drift check script         ◄─────────┘  exit 1 on history mismatch or a non-empty diff
```

### Recommended Project Structure

Names and places are the planner's to choose (CONTEXT, discretion). This is one consistent choice.

```
apps/frontend/
├── Dockerfile                                  # ARG BUILD_SHA; exec-form CMD
├── svelte.config.js                            # kit.version.name from BUILD_SHA
└── src/
    ├── hooks.server.ts                         # + export const init
    ├── lib/server/startup/requiredEnv.ts       # pure check, unit-tested
    └── routes/api/
        ├── health/+server.ts
        └── diagnostics/+server.ts              # 404 unless enabled
apps/supabase/
├── scripts/
│   ├── isolated-instance.*                     # start/stop a CLI instance in a temp workdir
│   └── check-schema-equivalence.*              # the D-03 check
└── supabase/
    ├── config.toml                             # + [functions.identity-callback]
    ├── migrations.manifest.json                # beside migrations/, not inside it
    ├── migrations/00001_initial_schema.sql
    └── schema/400-storage.sql                  # + the two bucket rows
infra/
├── scripts/
│   ├── bootstrap.sql                           # psql meta-commands; prettier-ignored
│   ├── check-seed.sql
│   └── check-drift.*
└── local/
    ├── docker-compose.proxy.yml                # frontend (production target) + nginx
    ├── nginx.conf
    └── check-proxy-topology.*
scripts/
├── assert-schema-migration-parity.mjs          # rewritten; exports the checker
└── fixtures/schema-migration-freeze/…          # ok + one directory per failure
packages/dev-seed/tests/
└── schemaMigrationFreezeGate.test.ts           # wiring + the exported checker over fixtures
```

Three reasons behind the places. The manifest sits beside `migrations/`, not in it, because the CLI treats files in that directory as migrations. [ASSUMED: that it would warn on a non-matching file] `infra/scripts` is the directory ruling 183-3 names; phase 183 creates Terraform under `infra/` in parallel, in other files. Tests for scripts outside a workspace go in `packages/dev-seed/tests/`, because `assert-unit-test-coverage.mjs` requires that "a Vitest suite kept under a directory that is not a workspace MUST be run by a root script of its own", and the existing gate specs already live there.

### Pattern 1: The freeze guard is written now and switched on last

**What:** Write `checkFrozenMigrations({ migrationsDir, manifestPath })` and its fixtures as soon as the phase starts. Keep the real-path run in today's byte-parity mode, with `--write` working, until the freeze commit. The freeze commit adds the manifest, makes `main()` call the frozen checker, deletes the byte-parity path and makes `--write` refuse.

**When to use:** D-06 needs `yarn schema:regenerate` for three more in-place changes, and the freeze waits for another stream. The guard's logic does not have to wait.

**Why not switch on the manifest's presence:** then deleting the manifest would quietly bring the old mode and `--write` back.

**Example:** see Code Examples, "The frozen-mode checker".

### Pattern 2: One isolated database instance for every database observation

**What:** A script that makes a temporary work directory, copies `config.toml` into `<tmp>/supabase/` with a different `project_id`, every port moved, and seeding off, puts a `migrations/` directory beside it, and runs `supabase db start --workdir <tmp>`. It prints the connection settings. A second command stops it with `supabase stop --workdir <tmp> --no-backup`.

**Why it works, as far as the source says:** `supabase db start` on a fresh volume runs the platform's own schema jobs for storage and auth (`initSchema15` appends one job each `if utils.Config.Storage.Enabled {` and `if utils.Config.Auth.Enabled {`) and then `apply.MigrateAndSeed`. [CITED: github.com/supabase/cli v2.118.0 `apps/cli-go/internal/db/start/start.go`, read through a summarising fetch] So `auth.users`, `storage.objects` and `storage.buckets` exist in their full shape when the baseline runs, and no storage container exists afterwards to seed buckets from the configuration. **Not run. The first task of the plan is a spike that proves it** (Open Question 5).

**Why it is allowed on this host:** two CLI instances with different project ids already run here side by side. [VERIFIED: `docker ps` names on 2026-10-11 end in `_openvaa-local` (13 containers) and `_next-supabase-skimle2` (10)]

**What it serves:** the equivalence check (two instances), criterion 5's bucket observation, the bootstrap run twice, the seed check green and red (an instance with seeding on is the red), the drift check green and red, and `db push --local` with a fixture migration.

**Never:** `supabase stop --all`. Its help text is "Stop all local Supabase instances from all projects across the machine." [VERIFIED: `--help`]

### Pattern 3: The bootstrap is one transaction of upserts, reading its values itself

**What:** `\set ON_ERROR_STOP on`; one `\getenv` per value; a block that refuses when a required value is missing; `BEGIN`; six upserts; `COMMIT`. Casts (`::uuid`, `::boolean`) reject a malformed value before anything is written.

**Example:** see Code Examples, "The bootstrap's shape".

### Pattern 4: A check is a script whose status is its verdict

**What:** Each check has three outcomes with three statuses: clean (0), a finding (non-zero, named), could not run (a different non-zero). It writes tool output to a file and tests the file. It never reads a status through a pipe. The repository has been bitten by this before; the standing rule is in the roadmap ("A gate's exit status is read directly, never through a pipe").

### Pattern 5: Server checks are pure functions with thin wiring

**What:** `requiredEnv.ts` exports a function from an environment record to a list of missing names; `init` in `hooks.server.ts` calls it when `!dev && !building` and throws one error. The health and diagnostics handlers are a few lines each. Unit tests cover the pure parts; the production-start behaviour is observed on the built server.

**Why:** the frontend's Vitest setup stubs `$app/environment` (`export const dev = true; export const building = false; export const version = 'test';`) and has no stub for `$env/dynamic/private`. [VERIFIED: apps/frontend/vitest.config.ts and `src/lib/i18n/tests/__mocks__/app-environment.ts`] A function that takes its environment as an argument needs neither. Phase 182 adds a rule to the same function ("`posthog` with no key fails it"), so shape it as a list of rules, not four `if`s.

### Pattern 6: The topology check, its observables and its controls

| Observable | How | Negative control |
|-----------|-----|------------------|
| Health through the proxy; build id | `GET /api/health` returns 200 and the `BUILD_SHA` given to the build; `GET /_app/version.json` returns the same | Build with no argument: the id is a number, not the SHA |
| The origin kit resolved | The diagnostics response reports `url.origin`; it equals the public origin although the container was reached under another name | Run with a wrong `ORIGIN`: the value is wrong |
| A form post succeeds | `POST` to a form action with `Origin: <public origin>` and a form content type is not answered 403 | The same post with `Origin: http://attacker.example` is answered 403 "Cross-site POST form submissions are forbidden" |
| The spoofed address is not used | Request with `X-Forwarded-For: 203.0.113.99`; the diagnostics response's client address is not that | Run with `XFF_DEPTH=2`: the response reports `203.0.113.99`. This shows the check can see a spoof. |
| Diagnostics off by default | With the enabling variable unset the route answers 404 | With it set the route answers 200 |
| `SIGTERM` reaches Node; the request in flight finishes | PID 1 of the container is `node`; a slow request started before `docker stop` completes with a status; the container exits by itself before the stop timeout; record the exit code and the times | The same with the entry point forced to `/bin/sh -c "node …"`: record what happens, whichever way it goes |

The login form (`routes/contestant/login/+page.server.ts`) is the form action to post to. With a reachable Supabase and a known user it answers `redirect(303, …)`, which is "a form post succeeds" in full. Without one it still passes or fails the CSRF check, which is the part `ORIGIN` decides.

A slow request with no application change: upload a small form body at a limited rate (`curl --limit-rate`), with the proxy's request buffering off, so the request is open at Node for several seconds. Keep it well under `SHUTDOWN_TIMEOUT` (30 s) and under `BODY_SIZE_LIMIT` (`'512K'`). Give `docker stop` a timeout above 30 s; its default of 10 s would kill the process before adapter-node's own timeout. [ASSUMED for the technique; the script must first show that the request does take that long without a signal]

### Suggested plan slicing

| Slice | Needs | Waits for |
|-------|-------|-----------|
| A. Health, build id, exec-form `CMD`, `init` check, diagnostics route, unit tests | Node, a production build | Nothing |
| B. Template variables (`render.example.yaml`, root compose, `.env.example`) | — | A (the image now requires `ORIGIN`) |
| C. Proxy topology compose and scripted check, run once and recorded | Docker; a Supabase for the full login post | A, B; agreement on which stack it may reach |
| D. `[functions.identity-callback]` in `config.toml` | — | Nothing |
| E. Isolated-instance harness (spike first) | Docker | Nothing |
| F. Bucket insert, comment corrections, regenerate in place; the D-07 measurement | E | Nothing |
| G. Equivalence check, shown green, and red on a planted difference | E | Nothing |
| H. Bootstrap, seed check, drift check, each shown with its red control | E | F for the bucket part |
| I. Frozen-mode checker, fixtures, self-test, gate spec (not yet switched on) | Node | Nothing |
| J. **The freeze**: merge state agreed, manifest, guard switched, ignore entries, tests re-pointed, README and skill text, the two `lint:check` observations | Everything above | v2.16's 177.1; phase 182's schema change; a checkpoint with the v2.16 session |
| K. Local E2E gate on the changed tree | The shared stack, exclusively | A to D at least; coordination (Pitfall 1) |

### Anti-Patterns to Avoid

- **Listing buckets on the normal stack to prove the migration created them.** The CLI creates them from `config.toml` on every start and reset.
- **Running any `supabase` command from this worktree's `apps/supabase` against the default instance** while the other session works. It is the same instance.
- **A connection URL or a key on a command line.** Both must come from the environment.
- **Switching the guard's mode on the manifest's presence.** Deleting a file must not unfreeze the baseline.
- **Adding `migrations` to `SKIP_PATH_RE`.** Use an exact, reported prefix.
- **A health handler that touches `locals.supabase` or `getClientAddress()`.**
- **Calling a status "green" from a filter's exit code.** `supabase db diff | grep …` reports grep.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| The public origin behind a proxy | Code that reads `X-Forwarded-Proto` or `Host` | `ORIGIN` in the environment | adapter-node resolves it once and stops reading the headers |
| The client address | A header parser in application code | `ADDRESS_HEADER` and `XFF_DEPTH`, then `event.getClientAddress()` | The adapter already counts from the right and refuses an impossible depth |
| Graceful shutdown | Signal handlers in the application | adapter-node's own; at most a `sveltekit:shutdown` listener | It already closes idle connections and waits for requests |
| The build id endpoint | A generated file or a custom route for the SHA alone | `kit.version.name`, which writes `/_app/version.json` and feeds `version` | One value, two readers, no new mechanism |
| Schema comparison | A catalog-by-catalog differ | `pg_dump --schema-only` and a text diff | pg_dump already knows every object kind and prints them in a stable order |
| Reading the environment in SQL | A shell wrapper that builds SQL text with the values in it | psql `\getenv` and `\bind` | No value passes through a command line or a statement's text |
| Hashing | A checksum of your own | `node:crypto` `createHash('sha256')` over the file's bytes | Standard, and `shasum -a 256` reproduces it by hand |
| A scratch database | A bare Postgres container | The CLI in an isolated work directory | Only the CLI runs the platform's storage and auth schema jobs the baseline depends on |

**Key insight:** every mechanism this phase needs is already in the installed tools. The work is configuration, two small routes, one guard and a handful of scripts. The risk is in the observations, not in the code.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Every developer's local database has the version `00001` recorded with the content it had when that database was last reset. An in-place edit of the baseline (the bucket insert, phase 182's change) does not reach it until `yarn db:reset`. This is the hazard of SUPA-10 in miniature, and it is already how the repository works. No hosted database exists (project memory: "Nothing deployed"). | None beyond the usual reset. State it in the plan that adds the insert, because the missing rows are masked locally by the `config.toml` seeding. |
| Live service config | None. No hosted Supabase project and no AWS resource exists in this phase. Render: `render.example.yaml` is a template; no deployment reads it. | None. |
| OS-registered state | Docker images built from the old Dockerfile keep the shell-form `CMD`. Two Supabase CLI instances run on this host (`openvaa-local`, and one unrelated). | Rebuild the image for every observation (`--build`). Never `supabase stop --all`. |
| Secrets and env vars | New names read at run time: `ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`, the diagnostics switch; `BUILD_SHA` at build time; the bootstrap's value names and the libpq `PG*` variables. No existing name changes. A developer's untracked `.env` needs no change for `yarn dev`, because the start-up check runs on production start only. | Add the names to the three templates (D-16). |
| Build artifacts | `apps/frontend/turbo.json`'s build task hashes tracked files only. If a build is ever run through turbo with `BUILD_SHA` set, the cache could return an output built for another SHA. The image does not build through turbo at that step (`RUN yarn workspace @openvaa/frontend build`). [VERIFIED: Dockerfile, turbo.json] | Optional: add `BUILD_SHA` to that task's `env` list so the hash includes it. `turboBuildInputsGate.test.ts` asserts inputs, outputs and `dependsOn`, not `env`; re-run it after the edit. |

## Common Pitfalls

### Pitfall 1: This worktree and the v2.16 worktree are one Supabase instance
**What goes wrong:** `yarn db:reset`, `supabase start` or `tests/scripts/e2e-run.sh` from this worktree resets or re-migrates the database the other session is testing against.
**Why it happens:** `config.toml:8` is `project_id = "openvaa-local"` in both worktrees, and the README says of the ten literal ports: "two checkouts of this repository cannot run their local stacks at the same time."
**How to avoid:** Run database observations on an isolated instance (Pattern 2). The local E2E gate needs the real ports, so it needs an exclusive window agreed with the other session, as a checkpoint in the plan.
**Warning signs:** the other session's run turning red with missing rows; a migration from this branch appearing in its database.

### Pitfall 2: The freeze needs one `schema/` on both branches
**What goes wrong:** The freeze commit is made on this branch, cherry-picked to v2.16, and the guard is red there at once, because that branch's baseline bytes differ.
**Why it happens:** The manifest holds one hash. v2.16's `schema/` already differs by eight files.
**How to avoid:** Order the freeze as: this stream's pre-freeze changes land in place; v2.16 finishes 177.1; one branch merges the other's schema work and regenerates; the tests and the equivalence check pass on that tree; then the freeze commit; then the other branch merges through it.
**Warning signs:** a conflict in `00001_initial_schema.sql` resolved by hand instead of by regenerating.

### Pitfall 3: The local stack hides a missing bucket insert
**What goes wrong:** The insert is wrong or absent, every local check passes, and the hosted project has no buckets.
**Why it happens:** `supabase start` and `db reset` create the buckets from `[storage.buckets.*]` regardless.
**How to avoid:** Observe the rows on a database-only build, where no storage service runs. See it red first on the unchanged tree.

### Pitfall 4: The bootstrap file breaks `yarn format:check`
**What goes wrong:** Prettier's SQL plugin meets `\getenv`, `\if` and `\bind`, fails to parse, and `format:check` exits 2. `yarn format` cannot repair it.
**Why it happens:** psql meta-commands are not SQL. The repository has measured this: `.prettierignore` records "12 of 12 pgbench scripts failing to parse … their psql meta-commands are not SQL … a prettier ERROR exits 2, reddens `format:check` permanently, and cannot be repaired by `yarn format`."
**How to avoid:** Add the bootstrap and the seed-check files to `.prettierignore` in the commit that creates them, with the reason beside the entry.

### Pitfall 5: An empty value is not an unset value
**What goes wrong, three ways:** (a) `kit.version.name` gets `''` from an unset build argument and every build has the same version. (b) Compose passes `ORIGIN: ${ORIGIN}` with nothing set, the container gets an empty `ORIGIN`, and the adapter refuses it with its own message before `init` runs. (c) Compose passes an empty `XFF_DEPTH`; `parseInt('')` is `NaN`, both of the adapter's range checks pass, and `getClientAddress()` throws a type error.
**How to avoid:** `process.env.BUILD_SHA || undefined` in the config. Defaults in the compose file (`${ORIGIN:-http://localhost:3000}`, `${XFF_DEPTH:-1}`). In the start-up check, treat `''` as missing. For the test of "an unset variable is named", remove the variable; do not set it to empty.

### Pitfall 6: Two tests read the baseline as the current schema
**What goes wrong:** After the first appended migration that re-creates `_bulk_upsert_record`, `permittedKeys.test.ts` goes red on a correct change, because it compares the `schema/` copy with the baseline copy byte for byte. `allowedTeardownTables.test.ts` goes the other way: it stays green while reading a function body that is no longer the applied one.
**How to avoid:** In the freeze commit, point both at `schema/501-bulk-operations.sql` and drop the schema-against-migration comparison. The equivalence check takes that job over.

### Pitfall 7: The first proof that the baseline applies on a hosted project comes after the freeze
**What goes wrong:** Phase 184 pushes the frozen baseline and a statement fails on the hosted platform.
**Why it happens:** Phase 181 touches no cloud account, and the baseline has only ever run on the local image.
**How to avoid:** Say in the plan what happens then. A failed push records nothing, so the baseline can still be corrected by an edit to the file and its manifest line in one commit, which D-01 accepts as visible in review. It becomes one-way only after the first successful push. If the throwaway project of phase 183 exists before the freeze, apply the candidate baseline to it first.

### Pitfall 8: A live proxy variable in `.env.example`
**What goes wrong:** `ORIGIN=http://localhost:5173` in `.env` is picked up by `docker-compose.dev.yml`'s substitution and the production test image, which serves on port 3000, refuses every form post.
**Why it happens:** CI and developers copy `.env.example` to `.env`, and Compose reads `.env`.
**How to avoid:** List the proxy variables in `.env.example` as commented lines with their meaning, as the file already does for `E2E_PROJECT_ID` ("KEEP IT COMMENTED OUT").

### Pitfall 9: The process may not exit after it has drained
**What goes wrong:** `SIGTERM` arrives, requests finish, the server closes, and the process stays up until the container runtime kills it. The exit code is 137 and the stop takes the whole grace period.
**Why it happens:** adapter-node emits `sveltekit:shutdown` and does not call `process.exit`. Anything that holds the event loop keeps the process alive.
**How to avoid:** Measure it: record the exit code and the time from signal to exit. If it lingers, add one `sveltekit:shutdown` listener that ends the process. Phase 182's relay must flush its queue on the same event, so the two phases need one listener, not two.
**Warning signs:** `docker stop` returning exactly at its timeout.

### Pitfall 10: Line numbers in this document go stale
**What goes wrong:** A plan anchors on a line number from this document and edits the wrong place after v2.16's merge moves the file.
**How to avoid:** Find the quoted text again at run time. This is the project's standing rule (project memory: "Content-anchor citations, never line numbers").

### Pitfall 11: Comment rules apply to the new files
**What goes wrong:** A new file under `apps/` cites a decision id or tells the story of a change, and `assert:comment-hygiene` or review rejects it.
**How to avoid:** No `D-NN`, no `.planning/` path, no history in comments under `apps/`, `packages/` or `tests/`. Root `scripts/` and `infra/` are outside the guard's three scan roots, but the review checklist's rule still covers every comment a change adds.

## Code Examples

These are shapes, not finished code. Every in-repository value in them is quoted from a file read in this session.

### Build id from a Docker build argument

```dockerfile
# apps/frontend/Dockerfile, production stage. Today the stage reads:
#   ARG NODE_ENV=production / ENV NODE_ENV=${NODE_ENV} / WORKDIR /opt /
#   RUN yarn workspace @openvaa/frontend build / EXPOSE 3000 / CMD node ./apps/frontend/build/index.js
ARG BUILD_SHA=""
RUN yarn workspace @openvaa/frontend build
EXPOSE 3000
CMD ["node", "./apps/frontend/build/index.js"]
```

```js
// apps/frontend/svelte.config.js. Today: version: { pollInterval: 5 * 60 * 1000 }
version: {
  // An empty value must become undefined, or kit takes '' as the name.
  name: process.env.BUILD_SHA || undefined,
  pollInterval: 5 * 60 * 1000
}
```

### Health and the start-up check

```ts
// apps/frontend/src/routes/api/health/+server.ts
// Source: kit 2.70.3, `$app/environment` exports `version` ("The value of `config.kit.version.name`.")
import { json } from '@sveltejs/kit';
import { version } from '$app/environment';

export function GET() {
  return json({ status: 'ok', build: version }, { headers: { 'cache-control': 'no-store' } });
}
```

```ts
// apps/frontend/src/hooks.server.ts (addition)
// Source: kit 2.70.3 public.d.ts, `export type ServerInit = () => MaybePromise<void>;`
import { building, dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { missingRequiredEnv } from '$lib/server/startup/requiredEnv';
import type { ServerInit } from '@sveltejs/kit';

export const init: ServerInit = () => {
  if (dev || building) return;
  const missing = missingRequiredEnv({ ...privateEnv, ...publicEnv });
  if (missing.length > 0) {
    throw new Error(`Required environment variables are not set: ${missing.join(', ')}`);
  }
};
```

The required names are the four of D-13: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_PROJECT_ID`, `ORIGIN`. The error names variables and never prints a value.

### The diagnostics response

```ts
// A route under /api, so the session gate skips it:
//   hooks.server.ts: `if (route?.id == null || isApiRoute(route.id)) {`
// Reports an allow-list of forwarding headers. Never cookies, never authorization.
const FORWARDING_HEADERS = ['host', 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-port', 'x-forwarded-host', 'forwarded', 'via'];

export function GET({ request, url, getClientAddress }) {
  if (!enabled()) error(404);
  let clientAddress: string | null = null;
  let clientAddressError: string | null = null;
  try {
    clientAddress = getClientAddress();
  } catch (e) {
    // adapter-node throws when ADDRESS_HEADER is set and the header is absent.
    clientAddressError = e instanceof Error ? e.message : String(e);
  }
  // No logging here: no visitor address is written to a log.
  return json({ origin: url.origin, clientAddress, clientAddressError, headers: pick(request.headers, FORWARDING_HEADERS) },
    { headers: { 'cache-control': 'no-store' } });
}
```

Reporting `url.origin` goes one field beyond what D-14 lists. It is the configured origin, so it discloses nothing, and it gives the origin its direct observable (Open Question 3). Phase 185 will extend the header list with what the CDN adds.

### The frozen-mode checker

```js
// scripts/assert-schema-migration-parity.mjs (frozen mode). House style: Node built-ins only,
// an exported function, and `main()` behind the entry-point test, as scripts/assert-env-pair-registry.mjs does:
//   if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const NAME_RE = /^(\d{5})_[a-z0-9_]+\.sql$/;

export function checkFrozenMigrations({ migrationsDir, manifestPath }) {
  const findings = [];
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const onDisk = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const listed = new Set(manifest.migrations.map((m) => m.file));

  let previous = '';
  for (const entry of manifest.migrations) {
    const match = NAME_RE.exec(entry.file);
    if (!match) findings.push(`${entry.file}: the name is not five digits, an underscore, a name and .sql`);
    else if (match[1] <= previous) findings.push(`${entry.file}: version ${match[1]} does not follow ${previous}`);
    else previous = match[1];
    if (!onDisk.includes(entry.file)) { findings.push(`${entry.file}: listed in the manifest, missing on disk`); continue; }
    const actual = createHash('sha256').update(readFileSync(path.join(migrationsDir, entry.file))).digest('hex');
    if (actual !== entry.sha256) findings.push(`${entry.file}: a frozen migration was edited (sha256 differs)`);
  }
  for (const file of onDisk) {
    if (!listed.has(file)) findings.push(`${file}: on disk, not in the manifest; add its line`);
  }
  return findings;
}
```

Fixed-width versions make the string comparison a numeric one. The real script adds what the sketch leaves out: the baseline entry is first and is `00001_initial_schema.sql`, the census, the floor, the self-test over fixtures, and the `--write` refusal.

### The bootstrap's shape

```sql
-- infra/scripts/bootstrap.sql   Run: psql -X -f infra/scripts/bootstrap.sql   (connection from PG* variables)
-- Source: postgresql.org/docs/17/app-psql.html (\getenv, :{?name}, \if, \bind, ON_ERROR_STOP)
\set ON_ERROR_STOP on
\getenv project_id PUBLIC_PROJECT_ID
\getenv storage_url BOOTSTRAP_STORAGE_URL
\getenv service_role_key SUPABASE_SERVICE_ROLE_KEY
\getenv behind_cloudflare BOOTSTRAP_BEHIND_CLOUDFLARE

\if :{?project_id}
\else
  \warn 'bootstrap: PUBLIC_PROJECT_ID is not set'
  \set missing true
\endif
-- … the same block for each required value …
\if :{?missing}
  DO $$ BEGIN RAISE EXCEPTION 'bootstrap: required environment variables are not set'; END $$;
\endif

BEGIN;

INSERT INTO public.accounts (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Account')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, account_id, name, default_locale, open_for_voters)
VALUES (:'project_id'::uuid, '00000000-0000-0000-0000-000000000001', 'Default Project', 'en', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_settings (project_id, settings)
VALUES (:'project_id'::uuid, '{}'::jsonb)
ON CONFLICT (project_id) DO NOTHING;

INSERT INTO public.storage_config (key, value) VALUES ('supabase_url', :'storage_url')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- The key goes as a bound parameter, so it is not part of the statement's text.
INSERT INTO public.storage_config (key, value) VALUES ('service_role_key', $1)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value \bind :service_role_key \g

INSERT INTO private.deployment_settings (singleton, behind_cloudflare)
VALUES (true, :'behind_cloudflare'::boolean)
ON CONFLICT (singleton) DO UPDATE SET behind_cloudflare = EXCLUDED.behind_cloudflare;

COMMIT;
```

The table and column names, the account id, the two `storage_config` keys and the conflict targets are the ones `seed.sql` uses: `storage_config (key, value)` with `('supabase_url', 'http://kong:8000'),` and `'service_role_key',`; `private.deployment_settings (singleton, behind_cloudflare)` with `ON CONFLICT (singleton) DO UPDATE`; `accounts (id, name)` with `'00000000-0000-0000-0000-000000000001'` and `'Default Account'`; `projects (id, account_id, name, default_locale, open_for_voters)` with `'Default Project'` and `'en'`; `app_settings (project_id, settings)` with `'{}'::jsonb` and `ON CONFLICT (project_id) DO NOTHING`. [VERIFIED: apps/supabase/supabase/seed.sql:10-82] The environment variable names beginning `BOOTSTRAP_` are invented here and are the planner's to name. [ASSUMED] The `false` for `open_for_voters` is Open Question 2.

### The bucket rows

```sql
-- schema/400-storage.sql (addition). config.toml declares:
--   [storage.buckets.public-assets]  public = true   file_size_limit = "500MiB"
--   [storage.buckets.private-assets] public = false  file_size_limit = "500MiB"
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('public-assets', 'public-assets', true, 524288000),
  ('private-assets', 'private-assets', false, 524288000)
ON CONFLICT (id) DO NOTHING;
```

The number is 500 × 1024 × 1024. Replace it with the value read back from a CLI-seeded stack (Q3). [ASSUMED until read back]

### The local proxy

```nginx
# Stands in for a load balancer in append mode: it adds the peer's address to X-Forwarded-For and keeps Host.
server {
  listen 8080;
  location / {
    proxy_pass http://frontend:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_request_buffering off;   # so a slow upload is in flight at Node, for the SIGTERM check
  }
}
```

[ASSUMED: nginx directives from training knowledge; the topology check itself verifies the behaviour]

### The JWT setting

```toml
# apps/supabase/supabase/config.toml (addition; no [functions.*] section exists today)
[functions.identity-callback]
verify_jwt = false
```

[CITED: supabase.com/docs/guides/functions/function-configuration for the form; the value is assumption A7]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ORIGIN` environment variable (adapter-node 5.x, installed) | `paths.origin` in the build configuration (current upstream documentation) | After the installed versions | Use `ORIGIN` now. Re-run the topology check on any upgrade of kit or the adapter. |
| `supabase db diff` on `migra` | pg-delta engine, opt-in through `[experimental.pgdelta]` | Present as an option in CLI 2.118.0 | Default stays `migra` here. Its limits are documented and apply. |
| `pg_dump` output with no session guard | `\restrict` lines with a random key in each dump | pg_dump 17.6 on this host has `--restrict-key` | Pin the key or the comparison differs on every run. |
| One generated migration, byte-compared with `schema/` | A frozen baseline, a hash manifest, appended migrations, a built-database equivalence check | The freeze commit of this phase | `schema:regenerate` ends. Two tests and three documents that describe the old model must change with it. |

**Deprecated/outdated:**
- `--use-pg-schema` for `db diff`: the help text says "Deprecated: use the pg-delta engine … or the default migra engine instead."
- `csrf.checkOrigin` in kit: "has been deprecated in favour of `csrf.trustedOrigins`". The application sets neither; the default check is on.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `supabase db start` in an isolated work directory builds a database with the platform's storage and auth schemas and the migrations applied, and no bucket seeding | Pattern 2, Q1, Q3 | The harness needs the full `supabase start` with services excluded; more ports and more time. Spike first. |
| A2 | `supabase db diff` exits 0 with and without a difference, and prints nothing to standard output on a clean database built from this baseline | Q5 | If it is not empty on a clean build, the drift check needs the dump comparison instead. Measure before building on it. |
| A3 | The pinned CLI updates an existing bucket row and does not fail (read from source, not run) | Q3 | The `[storage.buckets.*]` blocks are deleted, as D-07 already provides. |
| A4 | `pg_dump` does not include cluster-wide role settings or (with named schemas) extensions; a whole-database dump runs as `supabase_admin` inside the container | Q1 | A query is redundant, or the dump must name schemas. Low. |
| A5 | psql: `\getenv` from 15, `\bind` from 16; `:name` in `\bind` passes the raw value; a failed statement's bound parameters are not logged by default | Q4 | The key is stored with quote characters, or it appears in a server log. The plan's length-and-prefix check and a log search catch both. |
| A6 | The process exits non-zero when `init` throws on a production start | Q6 | Criterion 2 would not hold as written. Its observation is the check. |
| A7 | The value to declare is `verify_jwt = false` | Q7 | The local stack's serving of the function changes for nothing. No ruling names the value: **confirm with the operator.** |
| A8 | 500 MiB is stored as 524288000 in `storage.buckets.file_size_limit` | Q3, Code Examples | The insert and the configuration disagree and the CLI rewrites the row on every start. Read the value back. |
| A9 | An unset Docker build argument reaches the build as an empty value | Q6, Pitfall 5 | None if the config coerces empty to undefined, which it must do anyway. |
| A10 | The CLI accepts and orders `00002_<name>.sql` after `00001_initial_schema.sql`, and warns on a non-migration file inside `migrations/` | Q5, structure | The naming of D-05 would need another look. The `db push --local` observation shows it. |
| A11 | A throttled upload keeps a request open at Node long enough to send `SIGTERM` during it | Pattern 6 | Another slow request is needed: a stub upstream, or a bounded delay on the diagnostics route, which would extend D-14. |
| A12 | Caddy drops a client's `X-Forwarded-For` by default; an AWS load balancer keeps the `Host` header | Alternatives, the proxy example | The proxy choice or its one `Host` line. Low. |
| A13 | Constructing the Supabase server client makes no network call for a request with no auth cookie | Q6 | The health route would depend on Supabase. Criterion 1's observation is the check. |
| A14 | A checkout with `core.autocrlf` changes the migration's bytes | Q2 | The `.gitattributes` entry is unneeded. Harmless. |
| A15 | `supabase_migrations.schema_migrations` holds one row per applied version in a `version` column | Q5 | The history query needs another column name. Read it on the isolated instance. |

## Open Questions

1. **What "the commit it came from" names, and what the freeze commit carries.**
   - What we know: D-01 wants the manifest to name the baseline's commit. D-04 says the freeze is one commit "carrying the bucket insert and the rewritten guard". D-06 says the insert lands before the freeze. A commit cannot hold its own hash.
   - Recommendation: the pre-freeze changes land in earlier commits. The freeze commit does not change the baseline's bytes. The manifest names the freeze commit's parent, the first commit whose tree holds exactly these bytes. That is checkable by hand: `git show <commit>:<path> | shasum -a 256` equals the manifest's hash. Read "carrying the bucket insert" as "its tree contains it". **Confirm with the operator.**

2. **The value of `open_for_voters` the bootstrap writes.**
   - What we know: the column defaults to `false` ("so a new project is not public"). `seed.sql` and `ensureProject` both write `true`. The out-of-band dataset seeding of phase 186 goes through `ensureProject` and opens the project anyway.
   - Recommendation: take it from the environment, default `false`, and never change it on a second run. **Confirm with the operator.**

3. **The observable for "a redirect is built on the public origin".**
   - What we know: the application's redirects are paths. The only server-side absolute URL goes to the identity provider.
   - Recommendation: observe it two ways. The diagnostics response reports the resolved origin while the container is reached under another name. The login form post through the proxy answers 303 and following it ends on the public origin. Say plainly in the verification that the application issues no absolute redirect of its own that could be read instead.

4. **Is `supabase db diff` empty on a clean build of this baseline?**
   - What we know: not measured. Which schemas it covers by default is also unclear.
   - Recommendation: the first task of the drift-check plan runs it on a clean isolated instance, with and without `--schema public,private,storage`, and records the output and status. The plan has a stated fallback (the dump comparison).

5. **Does the database-only isolated instance behave as the source suggests?**
   - Recommendation: a spike before anything depends on it. Record: the command, its status, that `storage.buckets` has the `public` and `file_size_limit` columns, that the baseline applied, that no bucket row exists on the unchanged tree, and that the other instance on the host was not touched (its container list before and after).

6. **When does the E2E gate run, and against which stack?**
   - What we know: the phase closes on a green local suite. The suite needs the real ports and the real instance, which the v2.16 session uses.
   - Recommendation: a checkpoint in the plan. The operator names the window.

7. **Should manifest versions be contiguous?** Not ruled. It would catch a migration lost at a merge. Planner's choice.

8. **`render.example.yaml` and the proxy depth.** The right `XFF_DEPTH` behind Render's proxies has not been measured, and the standing rule forbids writing an unobserved value as fact. Recommendation: add `ORIGIN` with the instance domain, and add the two address variables with a comment that the depth is unmeasured on Render. Phase 189 owns the wording.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker with Compose | Image build, topology check, isolated instances | ✓ | 29.7.2 | — |
| Node | Everything | ✓ with a caveat | Shell default v24.14.1, below `engines` (`>=24.15.0`); v24.21.0 is installed under nvm and is the CI version | Select 24.21.0 before `yarn install`; the `preinstall` guard refuses otherwise |
| `node_modules` in this worktree | Unit tests, the production build, the CLI | ✗ | — | `yarn install` in this worktree, as a first task |
| Supabase CLI | Isolated instances, `db diff`, `db push` | ✓ after install | 2.118.0 | — |
| `psql` | Bootstrap, seed check, history query | ✓ | 17.6 | The `psql` inside the database container |
| `pg_dump` | Equivalence check | ✓ | 17.6 on the host; use the container's | — |
| `curl` | Topology check | ✓ | 8.7.1 | — |
| `nginx` image | Topology check | ✗ locally | — | Pull at run time (needs the network) |
| Supabase Postgres image | Isolated instances | ✓ | `public.ecr.aws/supabase/postgres:17.6.1.171` is present | — |
| The shared local stack on its real ports | The E2E gate; the full login post of the topology check | In use by another session | — | An agreed window |

**Missing dependencies with no fallback:**
- None that block planning. Two need coordination, not installation: the shared stack for the E2E gate, and the v2.16 cutover for the freeze.

**Missing dependencies with fallback:**
- `node_modules` (install); the default Node version (select 24.21.0); the nginx image (pull).

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json`, so it is on.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (catalog version) for unit tests; Playwright for E2E; guard scripts with their own self-tests; scripted checks that set an exit status |
| Config file | `apps/frontend/vitest.config.ts`, `packages/dev-seed` (gate specs), `tests/playwright.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` and `node scripts/assert-schema-migration-parity.mjs` |
| Full suite command | `yarn test:unit`, then `yarn lint:check`, then `yarn format:check` |
| Phase gate | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`, green, in an agreed window; a test that did not run counts as failed; a run marked void is not evidence |

### Success Criteria → Green Observation and Red Control

| Criterion | What observes it green | The red control that shows it can fail |
|-----------|------------------------|----------------------------------------|
| 1a. Health answers 200 with Supabase unreachable | The production build started with `PUBLIC_SUPABASE_URL` pointing at a closed port; `GET /api/health` is 200. Status read from `curl -o /dev/null -w '%{http_code}'`. | A page route (`/`) on the same server does not answer 200. This shows the upstream really was unreachable, so the health 200 means something. |
| 1b. The served build names its commit | Image built with `--build-arg BUILD_SHA=<sha>`; `/api/health` and `/_app/version.json` both return it. Unit test of the config: the name equals the variable. | Built with no argument: both return a time-based number, and the comparison with the SHA fails. Unit test: an empty variable gives `undefined`, not `''`. |
| 2a. A production start with a required variable unset exits and names it | `node build/index.js` with one variable removed; status non-zero; the message contains the name. Repeat for each of the four, and once with two removed: both are named in one error. Unit tests of the pure function. | The same command with all four set starts and answers the health route. Unit test: a present value is not reported. |
| 2b. The templates list `PUBLIC_PROJECT_ID` and the proxy variables | A spec in `packages/dev-seed/tests/` that reads the three templates and asserts each name is present. | The same spec on the unchanged tree fails for `render.example.yaml` and `docker-compose.dev.yml`, which do not name `PUBLIC_PROJECT_ID` today. Run it before the edit and record the failure. |
| 3. Behind a local reverse proxy | The scripted topology check, Pattern 6: each row is one observation with one status. | Each row's own control in Pattern 6: a foreign `Origin` is refused 403; `XFF_DEPTH=2` reports the spoofed address; the diagnostics route is 404 when not enabled; the shell-form entry point's behaviour is recorded. |
| 4a. `yarn lint:check` fails when the baseline is edited | Standing: the guard's self-test over the `edited-baseline` fixture, on every run. Once: in a scratch worktree, one byte appended to the real baseline, `yarn lint:check`, status read directly, non-zero at the guard's link. | This row is the red. Its green is 4b. |
| 4b. It passes when a numbered migration is appended | In the same scratch worktree: baseline restored, `00002_probe.sql` and its manifest line added, `yarn lint:check` exits 0. | An appended file with no manifest line fails; so do a duplicate version and a version out of order. Each is a fixture in the self-test. |
| 4c. The drift check | On an isolated instance after `db push --local`: status 0. | Planted DDL: status 1 and the output names the object. A second planted control, a column `REVOKE`, is recorded whichever way it goes. |
| 5a. A database built from the migrations alone holds both buckets | A database-only isolated build, seeding off: two rows with the declared properties. | The same build of the unchanged tree: zero rows. Seen before the insert is written. |
| 5b. The bootstrap twice | Run 1 then run 2 on that instance; after each: `accounts` 1, `projects` 1, `app_settings` 1, `storage_config` 2 keys, `deployment_settings` 1 with the given value. Both runs exit 0. | A run with one required variable unset exits 3 and writes nothing (the counts stay 0 on a fresh instance). A scan of the file finds no JWT-shaped literal and no URL. |
| 5c. The seed check | On the bootstrapped instance with a non-local URL: status 0. | On an instance with `seed.sql` applied: non-zero, naming `@openvaa.test` and `http://kong:8000`. |
| 5d. `config.toml` declares the JWT setting | A spec that reads `config.toml` and finds the section and the key. | The same spec on the unchanged tree fails. |

### New Guards and Checks → Green and Red

| Guard or check | Green | Red control | Where it runs |
|----------------|-------|-------------|---------------|
| Frozen-mode manifest guard | Real tree after the freeze; the `ok` fixture | Fixtures: edited file, unlisted file, missing file, duplicate version, non-increasing version, bad name. The self-test fails the run if any fixture stops failing. | `lint:check`, every run |
| `schema:regenerate` refusal | — | The command exits non-zero with the instruction, after the freeze | By hand, once |
| Comment-hygiene exclusion | The summary line names the excluded prefix | Pointing the prefix at a path with no tracked file fails closed | `lint:check` |
| Equivalence check | The tree as it stands (both sides equal) | A scratch copy of `schema/` with one column grant removed, one policy changed, one function body changed, one bucket row changed, the role setting changed: each makes it exit 1 and name the difference. The role-setting and row controls are the ones that prove the three extra queries work. | On demand; needs Docker |
| Bootstrap | Criterion 5b | Missing variable; malformed project id (the cast refuses) | On demand |
| Seed check | Criterion 5c | The seeded instance | On demand; phase 184 runs it on the hosted project |
| Drift check | Criterion 4c | Planted DDL; a database missing a manifest version | On demand; phases 184 and 187 |
| Start-up check | Criterion 2a | Each variable removed | Every production start |
| Diagnostics switch | 404 when unset | 200 when set | Unit test and the topology check |
| Topology check | Pattern 6 | Pattern 6 | On demand; phase 185 re-runs it |

### Sampling Rate
- **Per task commit:** the unit tests of the workspace touched, and `node scripts/assert-schema-migration-parity.mjs` when `apps/supabase` or the guard changed.
- **Per wave merge:** `yarn test:unit`, `yarn lint:check`, `yarn format:check`. Read each status directly. Background a long run and poll; a foreground turbo gate can outlast an executor's watchdog (project memory).
- **Phase gate:** the full local E2E suite, green, in an agreed window, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `yarn install` in this worktree under Node 24.21.0.
- [ ] `apps/frontend/src/lib/server/startup/requiredEnv.test.ts` — INFRA-05.
- [ ] `apps/frontend/src/routes/api/health/server.test.ts` — INFRA-04.
- [ ] `apps/frontend/src/routes/api/diagnostics/server.test.ts` — INFRA-06, off by default.
- [ ] Cases in `apps/frontend/svelte.config.test.ts` for the version name — PIPE-07.
- [ ] `packages/dev-seed/tests/schemaMigrationFreezeGate.test.ts` and `scripts/fixtures/schema-migration-freeze/` — SUPA-10.
- [ ] A template spec in `packages/dev-seed/tests/` for the three templates and for the `config.toml` section — INFRA-05, SUPA-05. Written first and seen failing.
- [ ] The isolated-instance harness, with its spike record — SUPA-04, SUPA-06, SUPA-10.

## Security Domain

`security_enforcement` is not set, so it is on.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Nothing here changes how anyone signs in. The first admin stays a documented one-off step. |
| V3 Session Management | no | The health and diagnostics routes read no session. |
| V4 Access Control | yes | The diagnostics route is off unless a deployment variable enables it; the bootstrap runs as the table owner only, over a direct connection. |
| V5 Input Validation | yes | The start-up check; casts to `uuid` and `boolean` in the bootstrap; an allow-list of header names in the diagnostics response. |
| V6 Cryptography | yes, lightly | sha256 from `node:crypto` for the manifest. Nothing is hand-rolled. The manifest is an integrity record against accident, not against a committer. |
| V7 Errors and Logging | yes | The start-up error names variables and prints no value. No visitor address is logged. |
| V8 Data Protection | yes | The service-role key is never on a command line and never in a statement's text. |
| V14 Configuration | yes | `ORIGIN` is required, so the origin never comes from a header the client sets. The edge function's JWT setting is declared, not implied. |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Host-header injection: the origin taken from `Host` when `ORIGIN` is unset | Spoofing | `ORIGIN` required at start (D-13) |
| A spoofed `X-Forwarded-For` taken as the client | Spoofing | `ADDRESS_HEADER` and `XFF_DEPTH` set to the real proxy depth; shown with a control (D-14, D-15) |
| A secret in the process list (`psql -v`, a connection URL as an argument) | Information disclosure | `\getenv`, and the libpq `PG*` variables |
| A secret in a server log through a failed statement | Information disclosure | `\bind` for the key |
| Seed credentials on a hosted database (`password123`, the demo key) | Elevation of privilege | The seed check, with a red control; `seed.sql` never leaves the local stack |
| A frozen migration edited after it was pushed | Tampering | The manifest guard in `lint:check`; the drift check after deploy |
| A grant or policy lost between `schema/` and a migration | Elevation of privilege | The equivalence check, with a method that sees column grants |
| The diagnostics route left on | Information disclosure | Off by default; shown to answer 404; reports only the caller's own request |
| A health route that depends on an upstream | Denial of service | No upstream call; the load balancer keeps healthy tasks when Supabase is slow |
| An unauthenticated function endpoint (`verify_jwt = false`) | Spoofing | The function verifies the provider's token itself and binds audience and issuer; its body states that every field is attacker-supplied |

## Project Constraints (from CLAUDE.md)

Read from `CLAUDE.md` in this worktree, which describes the Supabase tree.

- **Failing E2E tests are a cardinal failure.** No task is done while one fails. No "known flaky". A test that did not run is a failure. A run the wrapper marks void (exit status 8) is not evidence and is made again.
- The E2E preflight cannot be skipped. A server must be scoped to the project the suite seeds. A plain `yarn dev` serves the default project.
- `db:*` scripts touch the database only; `dev:*` drive the full stack.
- TypeScript strictly; no `any`. The guard scripts under `scripts/` are deliberately plain `.mjs`, "a guard that must run before anything is built cannot itself require a build".
- **Comment hygiene** under `apps/`, `packages/` and `tests/`: no history, no planning references beyond `see phase N`, nothing addressed to the reviewer, concise.
- Every user-facing string in all supported locales. This phase adds none: the health and diagnostics bodies are machine-read.
- WCAG 2.1 AA. This phase adds no screen.
- Never commit sensitive data.
- After a schema change: `yarn db:types`, and `yarn db:lint:sql` against the applied database.
- From the review checklist: a commit with migrations or other database changes carries `[db]`; purely formatting changes get their own commit; repository documentation is updated when a change touches what it describes; no fixes of the PR's own commits.
- The `database` skill is the authority for `apps/supabase/`. It states the regenerate model in its overview ("The schema is declarative: you edit one copy, the other is generated") and must be corrected with the freeze. `skill-drift-check` in CI reports drift when `apps/supabase/` changes after the skill.

## Sources

### Primary (HIGH confidence)
- The repository at `03d3c2c40`: `scripts/assert-schema-migration-parity.mjs`, `scripts/assert-comment-hygiene.mjs`, `scripts/assert-grant-permission-enum.mjs`, `scripts/assert-rpc-return-nullability.mjs`, `package.json`, `.prettierignore`, `.lintstagedrc.json`, `apps/supabase/supabase/config.toml`, `seed.sql`, `schema/100-tenancy.sql`, `106-app-settings.sql`, `107-feedback.sql`, `400-storage.sql`, `001-role-settings.sql`, `apps/frontend/Dockerfile`, `svelte.config.js`, `src/hooks.server.ts`, `src/lib/supabase/server.ts`, `src/lib/utils/constants.ts`, `vitest.config.ts`, `docker-compose.dev.yml`, `render.example.yaml`, `.env.example`, `.github/workflows/main.yaml`, `packages/dev-seed/src/supabaseAdminClient.ts`, and the tests named in Q8.
- Installed dependency sources: `@sveltejs/adapter-node` 5.5.7 (`files/handler.js`, `index.js`, `env.js`, `utils.js`); `@sveltejs/kit` 2.70.3 (`src/runtime/server/index.js`, `respond.js`, `src/core/config/options.js`, `src/core/postbuild/analyse.js`, `prerender.js`, `src/exports/vite/index.js`, `src/exports/public.d.ts`).
- The pinned Supabase CLI 2.118.0, `--help` of `db diff`, `db dump`, `db push`, `db reset`, `db start`, `start`, `stop`, `seed buckets`, `migration list`, `functions deploy`, `functions serve`.
- This host: `pg_dump --help`, `psql --version`, `docker ps` names, `docker image ls`.
- Git: `git diff --stat d228b52bc..feat/entity-signup-multi-grant`, `git merge-base`, `git show feat/entity-signup-multi-grant:.planning/STATE.md`.

### Secondary (MEDIUM confidence)
- Supabase CLI source at tag `v2.118.0`, read through a fetch that summarises: `apps/cli-go/pkg/storage/batch.go`, `internal/db/reset/reset.go`, `internal/db/start/start.go`, `internal/db/diff/diff.go`, `internal/db/diff/migra.go`.
- supabase.com/docs: declarative database schemas (known caveats, limitations of the legacy engine); function configuration; creating buckets.
- postgresql.org/docs/17/app-psql.html.
- svelte.dev/docs/kit/adapter-node (current upstream page; it describes a newer mechanism than the installed one).
- docs.aws.amazon.com: X-Forwarded headers and Application Load Balancers.
- docs.docker.com: Dockerfile reference, shell and exec form.

### Tertiary (LOW confidence)
- Training knowledge, each item in the Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Nothing is added; versions were read from the lockfile and the installed packages.
- Server deployability (Q6): HIGH for mechanism, read from the installed source. MEDIUM for the process-exit and in-flight behaviour, which need a run.
- Guard rewrite (Q2): HIGH. The current guard was read whole and run.
- Equivalence method (Q1): MEDIUM. The comparison of methods rests on documentation and on tool help; the harness it needs has not been run.
- Buckets, drift check (Q3, Q5): MEDIUM. Read from the pinned source, not measured.
- Bootstrap (Q4): HIGH for rows and privileges; MEDIUM for the psql details.
- v2.16 contact points (Q9): HIGH today. They go stale quickly.

**Research date:** 2026-10-11
**Valid until:** 2026-11-10 for the dependency and repository facts, or until `yarn.lock` changes the adapter, kit or the CLI. **2026-10-18 for everything about the v2.16 branch**: re-run the two `git` commands of Q9 before the freeze is planned in detail.
