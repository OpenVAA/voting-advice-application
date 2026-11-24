# @openvaa/supabase

The OpenVAA backend: a PostgreSQL schema managed by Supabase, its row-level security
policies, its database functions and RPCs, three Edge Functions, and a pgTAP test suite.

Run every command below from the repository root unless stated otherwise.

## Two SQL directories: the current schema and the migrations

`supabase/schema/` is the schema as it is now, edited by hand. `supabase/migrations/` is what a
database is built from, and its files are never edited. Read this before changing either.

| Directory              | Applied by the CLI? | What it is                                                                                                                                                                                                                                                                                                            |
| ---------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/schema/`     | **No**              | **The current view of the schema.** Hand-edited, organised by concern. `config.toml` sets `[db.migrations] schema_paths = []`, so the CLI never reads it.                                                                                                                                                             |
| `supabase/migrations/` | **Yes**             | **What a database is built from.** The frozen baseline `00001_initial_schema.sql`, then one appended migration per schema change, named by the next five-digit version, an underscore and a name, for example `00002_add_example.sql`. `supabase db reset` and `supabase db push` apply these files in version order. |

`supabase/migrations.manifest.json` lists every migration in version order with the sha256 of its
bytes; the baseline's entry is the first. Its `baseline.commit` names the commit whose `schema/` the
baseline was generated from, and that commit carries the tag `schema-baseline-00001`, so the source
of the baseline stays reachable whatever branch it was made on. The baseline is the only migration:
the next schema change is `00002`. A listed migration is never edited: `supabase db push`
skips every version a database has already recorded, so an edit made after a migration was applied
never reaches that database, and nothing says so.

**A schema change is one commit with three parts.**

1. Edit the `schema/` file that owns the concern.
2. Write the same change as a new migration, `supabase/migrations/<version>_<name>.sql`. The version
   is the next five-digit number after the highest in the manifest; the name is lower-case letters,
   digits and underscores. A file that `supabase migration new` names with a timestamp is renamed to
   the next number. The migration opens with a `WHAT IT ADDS.` or `WHAT IT CHANGES.` paragraph and a
   `WHAT IT LEAVES.` paragraph, which state its delta against the previous migration; the full
   description of a function it re-issues stays in `schema/`.
3. Add the migration's line, with its sha256 from `shasum -a 256 <file>`, to the end of
   `supabase/migrations.manifest.json`.

Then run `yarn check:schema-equivalence`. It builds one database from `schema/` and one from
`migrations/`, each in an isolated instance, and fails when the two differ. It needs Docker, and
runs in CI in the `sql-lint` job.

**A gate keeps the migrations frozen.** `yarn assert:migrations-frozen`, a link of
`yarn lint:check`, fails when a listed migration's bytes change, when a migration has no manifest
line, and when versions repeat, go down or leave a gap.

**Two obligations that no tool can enforce for you.**

- **Read the migration you wrote, in the same commit as the `schema/` edit.** The equivalence check
  proves that the two directories build the same database, not that it is the database you meant. A
  policy or grant that changed unintentionally shows up nowhere else.
- **Run `yarn db:types` after any schema change**, so `packages/supabase-types/` matches the
  applied schema. Commit its output with the same change.

The gate proves that the listed migrations are unchanged and that the sequence is whole. It does not
compare `schema/` with the migrations, it does not prove either is **correct**, and it does not prove
that a database has **applied** them — a database not reset since the change still carries the old
schema. See the script header, `scripts/assert-migrations-frozen.mjs`, for the full limits.

The two storage buckets, `public-assets` and `private-assets`, are created by the migration. A
deployment's own rows — its account, its project and that project's settings, the storage
configuration and the deployment settings — are written by `infra/scripts/bootstrap.sql`, not by a
migration.

`schema/` files are numbered by concern, not by date:

| Range       | Contents                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `000`–`011` | enum types, utility functions, validation functions                                                                |
| `100`–`108` | content tables — tenancy, elections, entities, questions, nominations, answers, app settings, feedback, admin jobs |
| `200`       | indexes                                                                                                            |
| `300`–`305` | auth tables, auth functions, RLS policies, column grants, terms-of-use acceptances, invitations                    |
| `400`       | storage buckets, storage RLS, storage cleanup triggers                                                             |
| `500`–`506` | external-id handling, bulk operations, email helpers, entity RPCs, admin RPCs, question RPCs, invitation RPCs      |
| `900`       | pgTAP test helpers                                                                                                 |

## What the database holds true of an entity and a question

Three rules live in trigger functions in `schema/011-validation-functions.sql`, because neither a
column grant nor a policy can state them:

- **A confirmed entity's names are frozen for its own editor.** `enforce_entity_immutability()` is
  registered on all four entity tables with the columns it protects: `first_name`, `last_name` and
  `short_name` on `candidates`, and `name` and `short_name` on `organizations`, `factions` and
  `alliances`. Once the row is confirmed, a change to any of them by the `authenticated` role needs
  `entity.edit_immutable`; a change to `confirmed` itself needs `entity.confirm`. Held by
  `19-entity-immutability.test.sql`.
- **A question's entity types are a list of entity types.** `validate_entity_type_list()` binds
  `entity_type` on `questions` and `question_categories` to null or a JSON array whose members name
  values of the `entity_type` enum, for every writer. `bulk_import` carries the key on those two
  tables and skips it on `nominations`, where the column is generated. Held by
  `40-entity-type-list.test.sql`.
- **An entity's colour is a colour.** `validate_entity_color()` binds `color` on the four entity
  tables to null or an object whose only members are `normal` and `dark`, each absent, null or `#`
  followed by three or six hexadecimal digits, for every writer. The frontend writes the stored value
  into a `style` attribute. Held by `41-entity-color.test.sql`.

A fourth rule is a stored setting. What an entity's own users may still edit is the app setting
`access.contestantEditing` in the project's row of `app_settings`: `'open'` (the default),
`'nominationsLocked'` or `'locked'`. `private.project_contestant_editing(project_id)` in
`schema/301-auth-functions.sql` reads it, answering `'open'` for a project without a settings row,
without the key or with any other value, and `'locked'` for an id that names no project. The four
`entity_*` nomination policies (the two inserts, the update and the delete) admit a write only
while it answers `'open'`; the four entity self-update policies, `upsert_answers` and the
entity-scope storage write refuse under `'locked'`; and `set_entity_nominations` refuses an
entity's editor without `project.edit_nominations` under anything but `'open'`. A project editor and
a project admin are not bound by it. Whoever holds `project.edit_app_settings` sets it, project
editors included.

A nomination is also held to the nomination shape of its election, by two more trigger functions of that file.
`elections.nomination_shape` is one of four values of the enum `nomination_shape`, and
`nomination_shape_rule(shape, entity_type)` is the one statement in SQL of which entity types each
admits. `validate_nomination()` refuses, for every writer, a row its election's nomination shape does not admit.
`validate_nomination_parent_required()`, the function of the constraint trigger of the same name,
refuses at the end of the transaction a candidate's nomination in a
closed-list election (`organization_list`) that has neither a parent nomination nor a requested
party name. Held by `08-triggers.test.sql`. An entity's editor writes its nominations through
`set_entity_nominations` and reads the entities it may stand under through
`get_nomination_parent_options`, both in `schema/503-entity-rpcs.sql` and held by
`43-set-entity-nominations.test.sql` and `44-nomination-parent-options.test.sql`.

## Why answers are a JSONB column

`public.candidates` and `public.organizations` each carry an `answers jsonb` column — declared in
their `CREATE TABLE` bodies in `schema/102-entities.sql`, with `schema/105-answers.sql` owning the
behaviour that keeps the contents valid — rather than answers having a table of their own. That is
the outcome of a measured comparison, and the numbers below are why.

**What was compared.** Two storage designs for the same data: answers as a JSONB column on the
entity row, versus a separate relational answers table holding one row per entity-question pair.
Both were loaded with the same generated dataset — 5 projects, 50 questions each, ~85% answer
completion — at three scales, and both were exercised through the same four query patterns. Load was
driven by pgbench against PostgreSQL directly, with k6 available for HTTP-level runs through
PostgREST. Validation triggers were left enabled throughout, so the figures describe the real
configuration rather than a stripped-down one.

**What was measured.** p95 latency, single connection, by candidate count:

| Pattern                                        | 1K JSONB | 1K rel. | 5K JSONB |  5K rel. | 10K JSONB |  10K rel. |
| ---------------------------------------------- | -------: | ------: | -------: | -------: | --------: | --------: |
| Voter bulk-read (a constituency, with answers) |  2.88 ms | 8.26 ms | 11.66 ms | 35.57 ms |  28.30 ms | 120.08 ms |
| Candidate full-save (all 50 answers)           |  1.64 ms | 2.52 ms |  1.55 ms |  2.87 ms |   1.61 ms |   2.76 ms |
| Candidate single-answer write                  |  1.39 ms | 0.56 ms |  1.38 ms |  0.70 ms |   1.37 ms |   3.90 ms |
| Aggregation (stats per question)               | 14.06 ms | 7.51 ms | 36.30 ms | 22.32 ms |  48.67 ms |  39.03 ms |

The read path is where the two diverge, and it diverges further as the dataset grows: JSONB is 2.9×
ahead at 1K candidates and 4.2× ahead at 10K. Full-form saves are consistently ~1.7× faster as a
single `UPDATE` than as a multi-row upsert. Relational wins the two patterns JSONB is worst at —
single-answer writes and aggregation — but by a shrinking margin, and its single-answer advantage
inverts at 10K (3.90 ms against 1.39 ms).

Two honest limits on the above. Under 50 concurrent connections the bulk-read gap closes entirely,
and at 10K candidates **neither** design meets the 1000 ms p95 target the comparison set for that
pattern (JSONB 1538.71 ms, relational 1549.43 ms) — so concurrency, not storage shape, is the
binding constraint at that scale. And the comparison deliberately favoured relational on close
calls: it was to win anything inside 20%, with JSONB needing a clear margin to be preferred.

**What was chosen.** JSONB, on the strength of the bulk read and the full-form save — the two
patterns the voter and contestant apps actually run on every page. The two columns are declared in
`schema/102-entities.sql`; everything that keeps them honest lives in `schema/105-answers.sql`: the
smart validation trigger that re-validates only changed keys, the question-delete cascade that
removes orphaned keys, and the type-change guard.

**Where the apparatus went.** The suite that produced these numbers — the pgbench and k6 drivers,
the data generators, the helper scripts, the runbook and the 36 parsed result files, 62 files in
all — has been removed from the tree. Only this conclusion is kept. Nothing was destroyed: the tree
is intact at commit `714d1e1885b091af95b86d2b497b3e2bff76f031`, the last commit before the removal.

```bash
# Read one file back:
git show 714d1e1885b091af95b86d2b497b3e2bff76f031:apps/supabase/benchmarks/README.md

# Restore the whole tree into the working directory:
git checkout 714d1e1885b091af95b86d2b497b3e2bff76f031 -- apps/supabase/benchmarks

# Find the removal commit again without knowing either SHA:
git log --diff-filter=D -- apps/supabase/benchmarks
```

The removal itself is commit `0c1b876f6721d18457dccdff44941284b7c51e5e`, whose message repeats these
commands. Both SHAs are given in full because abbreviations collide as history grows.

## Commands

```bash
yarn db:start                 # start the local stack
yarn db:reset                 # drop and recreate from migrations/, then seed.sql
yarn db:reset-with-data       # the above, then the default dev-seed template
yarn db:types                 # regenerate packages/supabase-types from the live schema
yarn check:schema-equivalence # build a database from schema/ and one from migrations/, and compare them (Docker)
yarn db:lint:sql              # supabase db lint + scripts/lint-schema.mjs (see below)
yarn db:status                # service status and local URLs
```

## Local ports

`supabase/config.toml` pins **ten** ports as literal numbers. All ten:

| Port    | `config.toml` key             | Serves                                                                            |
| ------- | ----------------------------- | --------------------------------------------------------------------------------- |
| `54320` | `db.shadow_port`              | the throwaway shadow database `supabase db diff` builds to compute a schema diff  |
| `54321` | `api.port`                    | the API gateway — PostgREST, Auth, Storage and Edge Functions all sit behind it   |
| `54322` | `db.port`                     | PostgreSQL itself; what `psql` and every direct connection string points at       |
| `54323` | `studio.port`                 | Supabase Studio, the local admin UI                                               |
| `54324` | `inbucket.port`               | the Mailpit web interface, where locally "sent" email is read                     |
| `54325` | `inbucket.smtp_port`          | Mailpit's SMTP listener, where the stack delivers that mail                       |
| `54326` | `inbucket.pop3_port`          | Mailpit's POP3 listener                                                           |
| `54327` | `analytics.port`              | the analytics/log service                                                         |
| `54329` | `db.pooler.port`              | the connection pooler. `[db.pooler] enabled = false`, so nothing binds this today |
| `8083`  | `edge_runtime.inspector_port` | the Chrome DevTools inspector for debugging Edge Functions                        |

Note that `8083` is the one outside the `543xx` block, and so the one most likely to collide with
something unrelated already running on your machine.

**What their being literals costs.** Each of these is a number written into a tracked file, so the
local topology is a property of the repository rather than of your machine. The consequence is
concrete: **two checkouts of this repository cannot run their local stacks at the same time.** The
second `yarn db:start` fails on the ports the first one holds, and the only way to run both
simultaneously is to edit `supabase/config.toml` in one of them — a tracked-file change you then
have to keep out of every commit you make from that checkout.

Contrast the frontend, which has a real escape hatch: `FRONTEND_PORT` in the root `.env` moves the
dev server and the E2E suite together, with no tracked file touched. Nothing equivalent is wired up
for the Supabase ports.

**This is a choice, not a CLI limitation.** The pinned CLI does support `env()` interpolation on
port fields — a quoted `port = "env(SUPABASE_API_PORT)"` is expanded and the resolved number is
used, and it fails config parsing if the variable is unset or is not a valid port. The fields here
are literals because nobody has wired the variables up, so if the two-checkouts problem starts to
bite, the fix is available and does not need a CLI upgrade.

**If you hit a port conflict**, work out which side should move. Something unrelated on the port
(most often `8083`) means change the literal. Another checkout of this repository means stop its
stack with `yarn db:stop` — that is much cheaper than maintaining a divergent config file. Note
that the root project documentation names `54321`, `54322`, `54323` and `54324` as the ones to keep
free; the other six matter only once you use the feature behind them.

## Local auth and Edge runtime configuration

These keys of `supabase/config.toml` decide who can create an account on the local stack, what the
auth service requires and sends, and how the Edge Functions are run:

| Table                    | Key                       | Value                                                    | Effect                                                                                   |
| ------------------------ | ------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `[auth]`                 | `enable_signup`           | `false`                                                  | no unauthenticated caller can create a user; users are created by the service role only  |
| `[auth]`                 | `minimum_password_length` | `8`                                                      | a password shorter than the Contestant App's rule asks for cannot be set                 |
| `[auth.email]`           | `enable_confirmations`    | `true`                                                   | an address is confirmed only by a mailed link, or by the service role vouching for it    |
| `[auth.email]`           | `otp_expiry`              | `3600`                                                   | a mailed sign-in or recovery link can be used for an hour                                |
| `[auth.hook.send_email]` | `enabled`, `uri`          | `true`, `pg-functions://postgres/public/send_email_hook` | the auth service sends no mail of its own; `account-access` sends the application's      |
| `[edge_runtime]`         | `policy`                  | `"per_worker"`                                           | a worker serves more than one request, and a function may answer before its work is done |

`[auth.email] enable_signup` stays `true`: it switches on the email provider itself, which password
sign-in needs. `yarn assert:auth-signup-closed` (a link of `yarn lint:check`) fails when any of the
seven auth keys above holds another value.

**The auth container and the Edge runtime read `config.toml` and the functions' environment file
only when the stack starts.** A stack started before a pull that changes any of them keeps running
with the values it started with, so after such a pull run `yarn db:stop` and then `yarn db:start`
once. `yarn db:reset` does not serve a changed `[auth]` key or hook: only the restart does. The E2E
project `auth-service-contract` is red on a stack that still allows public sign-up.

The functions' environment file is `supabase/functions/.env`, created from the tracked template
`supabase/functions/.env.example`. Its `SITE_URL` is `http://localhost:5173`, as the template has
it: the origin of the links the functions mail and redirect to.

**Judge a change to a function's source after a restart.** Under `policy = "per_worker"` the Edge
runtime keeps serving the code a worker loaded, and does not reliably reload an edited file. After
editing anything under `supabase/functions/`, or `config.toml`, or the functions' environment file,
run `yarn db:stop` and then `yarn db:start` before judging the change. A function directory that is
added or deleted is served, or stops being served, at the same restart.

## Tests

```bash
cd apps/supabase && npx supabase test db     # pgTAP, every file under supabase/tests/database/
yarn workspace @openvaa/supabase test:unit   # vitest, Edge Function pure helpers
yarn workspace @openvaa/supabase typecheck   # deno check over every non-test Edge Function module; part of `yarn typecheck`
```

The invitation model is held by five files: `39a-invitations-seeding.test.sql` (the table, its
policies, the code and seeding), `39b-invitations-claim.test.sql` (the claim),
`39c-invitations-service-helpers.test.sql` (the service-role helpers, the limits and what each
function exposes), `39d-invitations-registration-mode.test.sql` (the registration-mode condition)
and `39e-invitations-recovery-identity-provider.test.sql` (recovery and identity-provider accounts).
The link-request witness the E2E suite reads is no part of the schema: the test-only file
`supabase/tests/fixtures/invitation-link-witness.psql` installs it, applied by
`00z-invitation-link-witness.test.sql` for pgTAP and by the E2E setup after the stack is up. Its schema is in
`supabase/schema/305-invitations.sql` (the table, its policies and the code functions) and
`supabase/schema/506-invitation-rpcs.sql` (seeding, the claim and the service-role functions behind
`account-access`).

The pgTAP files under `supabase/tests/database/` follow one pattern, and new files must
keep to it: wrap the file in `BEGIN;` / `ROLLBACK;`, declare `SELECT plan(n)` (or
`no_plan()`), build fixtures with `create_test_data()` from `00-helpers.test.sql`, and end
with `SELECT * FROM finish();`. Use `ok()` for a positive assertion, `lives_ok()` plus
`is()` for a silent RLS denial — a blocked read returns zero rows rather than raising — and
`throws_ok()` where an error is the expected outcome.

**`now()` is frozen inside a transaction.** Because every file runs in one transaction,
`now()` is `transaction_timestamp()` and does not advance: a row inserted with
`ts = now()` fails a policy asking `ts < now()`. Use an explicit offset
(`now() - interval '1 day'`) or `clock_timestamp()`. This has already caused one
deterministic failure; see the comment in `00-helpers.test.sql`.

## What `yarn db:lint:sql` does, and does not, cover

It is **not** sqlfluff. It is two things, run in sequence, and it needs the local stack up:

1. `supabase db lint --schema public --fail-on warning` — `plpgsql_check` over PL/pgSQL
   function **bodies** only. It reads no policy, no index, no trigger name and no column set.
2. `node scripts/lint-schema.mjs` — two Supabase Splinter-derived advisors: **0013** (RLS
   disabled on a `public` table, ERROR) and **0001** (foreign key with no covering index,
   WARNING). The script exits non-zero on errors only.

Between them they check whether RLS is _enabled_, and whether foreign keys are indexed.
Everything else in the Supabase section of `.agents/code-review-checklist.md` — the
five-policy pattern, `(SELECT auth.uid())` scalar subqueries, explicit `TO` role targets,
`SECURITY DEFINER` with `search_path = ''`, trigger naming, pgTAP conventions — has **no
automated gate** and is checked by review.

## Edge Functions

Three functions under `supabase/functions/`:

- **`account-access`** — **anonymous** for four operations. The endpoint of the invitation model:
  it answers whether an invitation code can be used (`check-code`), mails a sign-in link to an
  address the database returns for the request (`request-link`), mails a recovery link to an
  account that holds any global grant, an account grant on the project's account, or a grant on
  the project or one of its entities, or the sign-in mail to an address that has only an
  invitation (`request-recovery`, decided by `recovery_link_request`), and signs in the user who
  claimed a code (`code-sign-in`). The two mail requests answer before any work and share one mail
  slot per address. `confirm-address`, with the caller's own access token, proves an address for
  an account an identity provider created: it takes the account's and the address's slot, answers
  `sent`, `in-use` or `refused`, and mails a `type=email_change` link. It serves the
  project `PUBLIC_PROJECT_ID` names and refuses a request for another; `email_confirmation_request`
  refuses a project the account registered no entity in, and neither slot is per project. Reads
  `PUBLIC_PROJECT_ID`, `SITE_URL`, `SMTP_HOST`, `SMTP_PORT` and `SMTP_FROM`.
- **`identity-callback`** — **server-only**. Refuses every caller without the frontend server's
  `x-identity-callback-secret`; accepts a bank-authentication `id_token` with the request's
  `project_id` and entity type, verifies it against the provider's JWKS, chooses the type among those
  `identity_provider_entity_types` answers for the project, and finds or creates the matching auth user (by invite, no
  password), its candidate or party and the editor grant between them. Reads the
  `IDENTITY_PROVIDER_*` variables and `IDENTITY_CALLBACK_SERVER_SECRET`.
- **`send-email`** — admin-gated. Resolves per-recipient template variables via the
  `resolve_email_variables` RPC and sends through SMTP. Reads `PUBLIC_PROJECT_ID`, `SMTP_HOST`,
  `SMTP_PORT` and `SMTP_FROM`.

`send-email` verifies the caller before creating a `service_role` client: first
`auth.getUser()` against the caller's token, then `public.user_can` asked through the caller's
own token (`callerAuthority.ts`). `identity-callback` checks the server's credential;
`account-access` has no caller check by design except for `confirm-address`.
`identity-callback` is reached only through the frontend server, and its trust anchor is the
server's credential together with the JWKS signature check with the audience and the issuer
bound. `account-access` decides no authority itself: service-role database functions in
`supabase/schema/506-invitation-rpcs.sql` decide whom a mail may go to and what a code answers,
and it issues a link only when the served auth settings refuse public sign-up and the redirect
allowlist admits the callback URL.

An invitation is a row of `public.invitations` that promises one grant
(`supabase/schema/305-invitations.sql`). `create_invitations` creates invitations and sends
nothing; its required `p_confirm_entity` states whether the invited entities are confirmed, and an
entity-scope item for a candidate or an organization may state the entity's nominations, written as
the caller through the private functions `set_entity_nominations` asks
(`supabase/schema/503-entity-rpcs.sql`). No account and no grant exists until the invited person
asks `account-access` for a link and signs in, and `claim_invitations` then writes the promised
grants for the caller's own confirmed address. An open invitation for a candidate or an
organization is honoured only under a registration mode the project's settings allow for that
type: `private.invitation_mode_allowed` asks `private.registration_mode_allowed`
(`301-auth-functions.sql`), which allows no mode while the project's contestant editing is
`'locked'`, and the functions that read an open invitation treat a refused row as absent.

The functions this schema adds for the sign-in flow, by file:

- `301-auth-functions.sql`: `public.send_email_hook`, the no-op mail hook, executable by
  `supabase_auth_admin` alone; `private.caller_password_set`, whether the caller's account holds a
  password, read by `get_caller_account_state` as its `password_set`; `private.user_password_set`,
  the same for any account, executable by no API role; `private.registration_mode_allowed_in` and
  `private.registration_mode_allowed`, the registration-mode rule, which refuses every mode while
  `access.contestantEditing` is `'locked'`; `private.project_contestant_app_closed`, which closes
  every entry path while `access.contestantApp` is off; and `public.identity_provider_entity_types`,
  the service role's, the entity types an identity provider may register in a project.
- `503-entity-rpcs.sql`: `public.get_caller_account_state`, the caller's `password_set` and
  `pending_email_taken`; and `private.caller_registered_organization`, the organization the caller
  registered through an identity provider, answered as `get_user_entities`' `organization`.
- `506-invitation-rpcs.sql`: `public.recovery_link_request`, `public.email_confirmation_request`,
  `public.email_confirmation_release`, `public.email_invitation_hold` and
  `public.identity_account_find`, the service role's; and `private.invitation_mode_allowed`,
  `private.email_holds_grant_in_project` and the table `private.identity_registrations` (which
  entity each identity registered in each project), which no API role can reach.

When calling an RPC from a function, the argument names must match the SQL parameter names
exactly, `p_` prefixes included. PostgREST resolves overloads by argument name and returns
`PGRST202` when they do not match.

### Editor setup

To get Deno's diagnostics in VS Code for the Edge Functions, and only there, add these settings to
your own `.vscode/settings.json`. That file is not tracked: `.vscode/*` is ignored, and nothing
under `.vscode/` is committed.

```json
{
  "deno.enablePaths": ["apps/supabase/supabase/functions"],
  "deno.path": "node_modules/.bin/deno",
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }
}
```

- `deno.enablePaths` turns the Deno extension on for the functions tree alone. Every other file of
  the repository stays with the TypeScript language server.
- `deno.path` is optional. It points the extension at the repository's pinned Deno, which
  `yarn install` links at `node_modules/.bin/deno`. The extension resolves a relative path against
  the root of the workspace folder, so this one works when the repository root is the folder you
  open. Because the setting is a workspace setting, the extension asks once whether to allow that
  executable.
- Never set `deno.enable`, and never add a `deno.json` at the repository root. Either one turns Deno
  on for the rest of the repository's TypeScript, and Deno then flags those files.
- Prettier formats this tree, as it formats the rest of the repository. Keep Prettier the default
  formatter for TypeScript (`editor.defaultFormatter`): `deno fmt` disagrees with Prettier on nearly
  every file of the tree and is not used.

`apps/supabase/supabase/functions/deno.json` configures both `deno check`
(`yarn workspace @openvaa/supabase typecheck`) and the extension. It holds no import map and no
formatter settings.

## Type generation

`yarn db:types` regenerates `packages/supabase-types` from the running database, not from
the migration files. Reset first if the local database is behind.
