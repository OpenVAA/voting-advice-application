# @openvaa/supabase

The OpenVAA backend: a PostgreSQL schema managed by Supabase, its row-level security
policies, its database functions and RPCs, three Edge Functions, and a pgTAP test suite.

Run every command below from the repository root unless stated otherwise.

## Two SQL directories, and which one the database actually reads

This workspace holds the schema **twice**, deliberately. Read this before editing either,
because only one of them is applied.

| Directory              | Applied by the CLI? | What it is                                                                                                                                                        |
| ---------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/` | **Yes**             | The applied history. `supabase db reset` runs these in numeric order and nothing else. This is the source of truth for what a database contains.                  |
| `supabase/schema/`     | **No**              | A flattened, concern-ordered mirror of the _current_ schema, kept for reading. `config.toml` sets `[db.migrations] schema_paths = []`, so the CLI never reads it. |

`supabase/schema/*.sql` concatenated in filename order equals
`migrations/00001_initial_schema.sql` with the later migrations applied. Each migration
names the schema files it mirrors in its header (`-- Applies to schema files:`), and that
header is the only thing keeping the two in step.

**Nothing verifies that they agree.** A change made in one and not the other drifts
silently: an edit to `schema/` alone never reaches any database, and an edit to
`migrations/` alone leaves the readable copy wrong. When you change the schema, write the
migration **and** apply the same change to the corresponding `schema/` file in the same
commit.

`schema/` files are numbered by concern, not by date:

| Range       | Contents                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `000`–`011` | enum types, utility functions, validation functions                                                                |
| `100`–`108` | content tables — tenancy, elections, entities, questions, nominations, answers, app settings, feedback, admin jobs |
| `200`       | indexes                                                                                                            |
| `300`–`303` | auth tables, auth functions, RLS policies, column grants                                                           |
| `400`       | storage buckets, storage RLS, storage cleanup triggers                                                             |
| `500`–`504` | external-id handling, bulk operations, email helpers, entity RPCs, admin RPCs                                      |
| `900`       | pgTAP test helpers                                                                                                 |

## Commands

```bash
yarn db:start                 # start the local stack
yarn db:reset                 # drop and recreate from migrations/, then seed.sql
yarn db:reset-with-data       # the above, then the default dev-seed template
yarn db:types                 # regenerate packages/supabase-types from the live schema
yarn db:lint:sql              # supabase db lint + scripts/lint-schema.mjs (see below)
yarn db:status                # service status and local URLs
```

Local ports come from `supabase/config.toml`: API `54321`, Postgres `54322`, Studio
`54323`, Mailpit `54324`.

## Tests

```bash
cd apps/supabase && npx supabase test db     # 11 pgTAP files
yarn workspace @openvaa/supabase test:unit   # vitest, Edge Function pure helpers
```

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

- **`invite-candidate`** — admin-gated. Creates a candidate row, sends an invite email and
  assigns the `candidate` role.
- **`send-email`** — admin-gated. Resolves per-recipient template variables via the
  `resolve_email_variables` RPC and sends through SMTP.
- **`identity-callback`** — **public**. Accepts a bank-authentication `id_token` (JWE or
  JWS) from the identity provider, verifies it against the provider's JWKS, and finds or
  creates the matching auth user.

The two admin-gated functions verify the caller before creating a `service_role` client:
first `auth.getUser()` against the caller's token, then a role check against the
`user_roles` claim the Custom Access Token Hook adds. `identity-callback` has no such
check by design — it is the unauthenticated leg of the login flow, and its trust anchor is
the JWKS signature check, with the audience and issuer checks applied when configured.

When calling an RPC from a function, the argument names must match the SQL parameter names
exactly, `p_` prefixes included. PostgREST resolves overloads by argument name and returns
`PGRST202` when they do not match.

## Type generation

`yarn db:types` regenerates `packages/supabase-types` from the running database, not from
the migration files. Reset first if the local database is behind.
