# Backend overview

The OpenVAA backend is a [Supabase](https://supabase.com/docs) project: a PostgreSQL database with its schema, row-level security (RLS) policies and database functions, together with Supabase Auth, Storage and three Edge Functions. All of it lives in the [`apps/supabase`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase) workspace, `@openvaa/supabase`.

In local development the Supabase CLI runs the whole stack on your machine. `yarn db:start` starts it, and `yarn dev` starts it before it starts the frontend dev server. In production the same schema runs on a hosted Supabase project; see [Deployment](/developers-guide/deployment).

## Pages in this section

- [Authentication and authorisation](/developers-guide/backend/authentication): sessions, grants, the access-token hook, row-level security and column grants.
- [Edge Functions](/developers-guide/backend/edge-functions): `identity-callback`, `invite-candidate` and `send-email`.
- [Email](/developers-guide/backend/email): how the application and Supabase Auth send email, and where to read it locally.
- [Data import and deletion](/developers-guide/backend/data-import-and-deletion): the bulk import and delete functions.
- [Generated types](/developers-guide/backend/generated-types): the `@openvaa/supabase-types` package and `yarn db:types`.
- [Seed data (dev-seed)](/developers-guide/development/seed-data): the baseline `seed.sql` and the `@openvaa/dev-seed` templates.

## Schema and migrations

The SQL lives in two directories under `apps/supabase/supabase/`. You edit one of them, and the other is generated from it.

| Directory     | What it is                                                                                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema/`     | The source. Hand-edited SQL files, numbered by concern. The Supabase CLI never reads this directory, because `config.toml` sets `schema_paths = []`.                                                             |
| `migrations/` | Generated. It holds exactly one file, `00001_initial_schema.sql`, which is the files of `schema/` concatenated in filename order. `supabase db reset` applies this file and nothing else. Never edit it by hand. |

The [`schema/`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase/supabase/schema) files are grouped by their number:

| Files       | Contents                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `000`–`011` | enum types, role settings, utility functions and validation functions                                                |
| `100`–`108` | content tables: tenancy, elections, entities, questions, nominations, answers, app settings, feedback and admin jobs |
| `200`       | indexes                                                                                                              |
| `300`–`303` | auth tables, auth functions, RLS policies and column grants                                                          |
| `400`       | storage buckets, storage policies and storage cleanup                                                                |
| `500`–`505` | external ids, bulk operations, email helpers, entity functions, admin functions and question functions               |
| `900`       | helper functions for the pgTAP tests                                                                                 |

To change the schema:

1. Edit the `schema/` file that owns the concern.
2. Run `yarn schema:regenerate` to rewrite `migrations/00001_initial_schema.sql` from `schema/`.
3. Run `yarn db:reset` to recreate the local database from the regenerated migration.
4. Run `yarn db:types` to regenerate the TypeScript types (see [Generated types](/developers-guide/backend/generated-types)).

Commit the `schema/` edit, the regenerated migration and the regenerated types together, and read the regenerated migration diff before you commit: nothing else shows a policy or grant that changed by accident.

`yarn assert:schema-migration-parity`, which `yarn lint:check` runs, fails when the migration differs from the concatenated `schema/` files by a single byte, and also when a second `.sql` file appears in `migrations/`. It proves that the two are equal, not that either is correct.

## Project scoping

[`100-tenancy.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/100-tenancy.sql) defines two tables, `public.accounts` and `public.projects`. Every content table references a project through its `project_id` column. A project is hidden from voters until its `open_for_voters` column is `true`; the column defaults to `false`.

A frontend deployment serves exactly one project, named by `PUBLIC_PROJECT_ID` in the repo-root `.env`. The baseline [`seed.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/seed.sql) creates a default account and a default project, open for voters, whose id is the value `.env.example` gives:

```bash
PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001
```

The Supabase adapter in the frontend has no fallback for this variable. If it is unset, or is not a canonical uuid, the adapter throws when it is constructed instead of reading some other project's rows. The `identity-callback` Edge Function reads the same variable to decide which project a candidate who registers through bank authentication joins.

## Tests and SQL lint

The pgTAP tests are in [`apps/supabase/supabase/tests/database/`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/supabase/supabase/tests/database). Each file runs inside one transaction that it rolls back at the end, and builds its fixtures with `create_test_data()` from `00-helpers.test.sql`. Run them against the local stack:

```bash
yarn workspace @openvaa/supabase test:db
```

The pure helpers of the Edge Functions have Vitest unit tests, which `yarn workspace @openvaa/supabase test:unit` runs and the root `yarn test:unit` includes.

`yarn db:lint:sql` needs the local stack running. It runs `supabase db lint` over the function bodies of the `public` schema, and then `apps/supabase/scripts/lint-schema.mjs`, which fails on a `public` table without RLS or on a policy whose read and write permissions are not kept separate, and warns about a foreign key without a covering index.

## Local services

`apps/supabase/supabase/config.toml` sets the local ports. The ones you use most:

| Port    | `config.toml` key | Service                                                                                                                 |
| ------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `54321` | `[api] port`      | the API URL (`PUBLIC_SUPABASE_URL`), through which clients reach the database API, Auth, Storage and the Edge Functions |
| `54322` | `[db] port`       | PostgreSQL                                                                                                              |
| `54323` | `[studio] port`   | Supabase Studio, the local admin UI                                                                                     |
| `54324` | `[inbucket] port` | the email testing server's web interface (see [Email](/developers-guide/backend/email))                                 |

`yarn db:status` prints the local URLs and keys of the running stack, and `yarn db:stop` stops it.
