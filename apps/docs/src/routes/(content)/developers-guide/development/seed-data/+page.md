# Seed data (dev-seed)

A local database gets its data in two layers:

1. **The baseline**, [`apps/supabase/supabase/seed.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/seed.sql): a default project, two test users and the local settings. The Supabase CLI applies it when it creates the database.
2. **Generated content** from the [`@openvaa/dev-seed`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/dev-seed) package: elections, constituencies, organizations, candidates, questions, nominations and answers, written on demand from a template.

Both are for local development and testing only. Do not apply either to a production database.

## The baseline: `seed.sql`

`config.toml` enables `[db.seed]` with `sql_paths = ["./seed.sql"]`, so the CLI runs `seed.sql` after the migration whenever it recreates the database: on every `yarn db:reset`, which drops all existing data. The file's own header says it also runs on the first `supabase start`, when the database is created.

It creates:

- the default account and the default project, id `00000000-0000-0000-0000-000000000001`, open for voters, with an empty app settings row (this is the project `PUBLIC_PROJECT_ID` names in `.env.example`; see [Backend overview](/developers-guide/backend/intro#project-scoping));
- two test users with the password `password123`, and the grants that give them their authority:

  | Email                    | Grant                                                               | Use                             |
  | ------------------------ | ------------------------------------------------------------------- | ------------------------------- |
  | `admin@openvaa.test`     | project `admin` on the default project                              | signing in to the Admin App     |
  | `candidate@openvaa.test` | entity `editor` on the seeded, confirmed candidate "Test Candidate" | signing in to the Candidate App |

- local settings: the Storage API address and the local stack's demo service-role key for the storage cleanup triggers (the same for every local Supabase stack), and `behind_cloudflare = true` in `private.deployment_settings`, so that the E2E suite can give each feedback request its own rate-limit bucket.

The baseline holds no elections or questions; those come from dev-seed.

## Generated content: `@openvaa/dev-seed`

| Command                       | What it does                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `yarn db:seed`                | runs the `seed` script of `@openvaa/dev-seed`; without `--template` it applies `default` |
| `yarn db:seed:default`        | `yarn db:seed --template default`                                                        |
| `yarn db:reset-with-data`     | `yarn db:reset`, then `yarn db:seed:default`                                             |
| `yarn db:reset-with-e2e-data` | resets the database and seeds the `e2e/base` template                                    |
| `yarn dev:reset-with-data`    | `yarn db:reset-with-data`, then `yarn dev`                                               |
| `yarn db:seed:teardown`       | runs the `seed:teardown` script, which removes seeded rows (see [Teardown](#teardown))   |

For example, to reset the database and load the end-to-end test dataset instead of the demo one:

```bash
yarn db:reset
yarn db:seed --template e2e/base
```

The `seed` command takes these options:

| Option                            | Meaning                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `-t`, `--template <name-or-path>` | a built-in template name, or a path ending in `.ts`, `.js` or `.json` to a custom template; default `default`                                    |
| `--seed <integer>`                | overrides the template's random seed                                                                                                             |
| `--external-id-prefix <str>`      | overrides the prefix of the generated records' `external_id`s                                                                                    |
| `--allow-remote`                  | permits a Supabase URL that is not local; without it the command refuses any host but `localhost`, `127.0.0.0/8` and the local stack's own names |
| `-h`, `--help`                    | prints the usage, including the built-in templates                                                                                               |

The command loads the repo-root `.env` itself. It needs `SUPABASE_URL`, or `PUBLIC_SUPABASE_URL` when that is unset, and `SUPABASE_SERVICE_ROLE_KEY`, and it writes with a service-role client through the [`bulk_import`](/developers-guide/backend/data-import-and-deletion) database function into the default project.

### Built-in templates

The built-in templates are the keys of `BUILT_IN_TEMPLATES` in [`packages/dev-seed/src/templates/index.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/dev-seed/src/templates/index.ts):

- **`default`**: a demo election for people working on the app: constituencies, organizations, candidates with portraits, and questions with answers clustered by organization, translated into every supported locale. Its records' `external_id`s start with `seed_`.
- **`e2e/base`**: the dataset the Playwright specs depend on, in one locale.
- **`perm-*`** and **`show-feedback-survey`**: small datasets for individual E2E specs, each covering one permutation of the app settings or of the election and constituency layout (for example `perm-1e1cg1co`, `perm-disable-voter-app` and `perm-closed-project`).

### Custom templates

Pass a path to `--template` to use a template of your own. The package README explains how to write one: [Authoring custom templates](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/dev-seed/README.md#authoring-custom-templates).

### Teardown

`yarn db:seed:teardown` deletes every record whose `external_id` starts with a prefix, `seed_` by default, from the content tables, and removes the seeded candidates' portraits from the `public-assets` bucket. It keeps the accounts, projects, app settings and storage settings, and it reopens the default project to voters. Pass `--prefix <str>` (at least two characters) to remove the records of a template that uses another prefix. The prefix is the only check: anything else that shares it is deleted too.

### Test users

dev-seed creates no users. Sign in with the two `seed.sql` users above; the E2E suite creates the users it needs through its own test harness.
