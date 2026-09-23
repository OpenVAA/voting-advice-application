# @openvaa/supabase

The OpenVAA backend: a PostgreSQL schema managed by Supabase, its row-level security
policies, its database functions and RPCs, three Edge Functions, and a pgTAP test suite.

Run every command below from the repository root unless stated otherwise.

## Two SQL directories: one you edit, one that is generated

The schema is **declarative**. You edit `supabase/schema/`; `supabase/migrations/` is generated
from it. Read this before editing either.

| Directory              | Applied by the CLI? | What it is                                                                                                                                                                                |
| ---------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/schema/`     | **No**              | **The source.** Hand-edited, organised by concern. `config.toml` sets `[db.migrations] schema_paths = []`, so the CLI never reads it.                                                     |
| `supabase/migrations/` | **Yes**             | **Generated.** Exactly one file, `00001_initial_schema.sql`, byte-identical to `cat schema/*.sql` in filename order. `supabase db reset` applies it and nothing else. Never hand-edit it. |

**Changing the schema is two steps in one commit.** Edit the `schema/` file that owns the concern,
then run `yarn schema:regenerate` to fold the change into `migrations/00001_initial_schema.sql`.

**A gate verifies that the generated file is current.** `yarn assert:schema-migration-parity`
(link 12 of `yarn lint:check`) fails when the concatenation and the migration differ by a single
byte, and fails when a **second** `.sql` file appears under `supabase/migrations/`. The second
conjunct is what keeps the schema single-source: a numbered migration beside the generated one
would reinstate exactly the two-copy divergence this arrangement removes.

**Two obligations that no tool can enforce for you.**

- **Review the regenerated diff, in the same commit as the `schema/` edit that caused it.** The
  regeneration is a keystroke and the gate only checks that it ran — reading what it produced is
  yours. A policy or grant that changed unintentionally shows up nowhere else.
- **Run `yarn db:types` after any schema change**, so `packages/supabase-types/` matches the
  applied schema. Commit its output with the same change.

The gate proves the two files are textually **equal**. It does not prove either is **correct**, and
it does not prove the **applied** database matches — a database not reset since the edit still
carries the old schema. See the script header, `scripts/assert-schema-migration-parity.mjs`, for
the full limits.

Migrations `00002`–`00008` were folded into the generated `00001` and removed in phase 162, on the
operator's ruling that no Supabase database has been published and there is therefore no deployed
applied-history to protect; git history retains every one of them, so a `00002` reference in an old
commit resolves with `git show <sha>:<path>`.

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
patterns the voter and candidate apps actually run on every page. The two columns are declared in
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
yarn schema:regenerate        # fold schema/*.sql into migrations/00001_initial_schema.sql
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
first `auth.getUser()` against the caller's token, then an authority check against the
`grants` claim the Custom Access Token Hook adds. `identity-callback` has no such
check by design — it is the unauthenticated leg of the login flow, and its trust anchor is
the JWKS signature check, with the audience and issuer checks applied when configured.

When calling an RPC from a function, the argument names must match the SQL parameter names
exactly, `p_` prefixes included. PostgREST resolves overloads by argument name and returns
`PGRST202` when they do not match.

## Type generation

`yarn db:types` regenerates `packages/supabase-types` from the running database, not from
the migration files. Reset first if the local database is behind.
