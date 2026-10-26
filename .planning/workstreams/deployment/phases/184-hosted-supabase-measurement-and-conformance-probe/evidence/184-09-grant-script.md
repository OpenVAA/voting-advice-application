# 184-09 evidence: the first administrator's grant script, proven on an isolated instance

- **Date (UTC):** 2026-10-26, runs between 15:06 and 15:07Z
- **Script:** `infra/scripts/grant-project-admin.sql` (as committed by 184-09 Task 1)
- **Instance:** `apps/supabase/scripts/isolated-instance.sh start --name grant184 --mode db --migrations apps/supabase/supabase/migrations --port-base 56400` — database only, project id `openvaa-iso-grant184`, ports 56400 to 56409, Postgres on **56401**. Separate from the shared local stack (`openvaa-local`), which was not touched.
- **Client:** psql 17.6 (Homebrew), libpq variables from `isolated-instance.sh env --name grant184`.
- **Driver:** a scratchpad shell script with `trap '… stop --name grant184' EXIT`, so the instance is stopped on every way out. After the run, `isolated-instance.sh list` printed nothing (exit 0) and no `grant184` container was running.

Every status below was read directly from `$?` right after the command, never through a pipe. `grants_rows` is `select count(*) from public.grants` on the whole table after the run.

## Setup

| Step | Command | Result |
|---|---|---|
| Bootstrap | `psql -X -q -f infra/scripts/bootstrap.sql` with `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001`, `BOOTSTRAP_STORAGE_URL=https://example.invalid`, `SUPABASE_SERVICE_ROLE_KEY=not-a-real-value`, `BOOTSTRAP_BEHIND_CLOUDFLARE=false` | `bootstrap_exit=0` |
| One user | `insert into auth.users (…, email, email_confirmed_at, …) values (…, 'grant-test@example.invalid', now(), …)` | `user_insert_exit=0` |

## The five required results

All runs with `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001` and `psql -X -f infra/scripts/grant-project-admin.sql`.

| Run | `ADMIN_EMAIL` | Exit | Standard output | Standard error | `grants_rows` after |
|---|---|---|---|---|---|
| first | `grant-test@example.invalid` | `first_run_exit=0` | `grants_on_project=1` | (none) | 1 |
| second | `grant-test@example.invalid` | `second_run_exit=0` | `grants_on_project=1` | (none) | 1 |
| other case | `GRANT-TEST@example.invalid` | `upper_case_run_exit=0` | `grants_on_project=1` | (none) | 1 |
| no such user | `nobody@example.invalid` | `unknown_address_exit=3` | (none) | `ERROR:  grant-project-admin: no user has the address ADMIN_EMAIL names, and nothing was written` | 1 |
| unset | (unset, `env -u ADMIN_EMAIL`) | `unset_variable_exit=3` | (none) | `grant-project-admin: ADMIN_EMAIL is not set` then `ERROR:  grant-project-admin: required environment variables are not set, and nothing was written` | 1 |

The second and the other-case runs added nothing: the row count stayed 1. No error line holds the address.

## Further refusals (beyond the plan's five)

| Run | Exit | Standard error (first line of the error) | `grants_rows` after |
|---|---|---|---|
| `ADMIN_EMAIL='   '` (whitespace only) | `whitespace_variable_exit=3` | `grant-project-admin: ADMIN_EMAIL is not set` | 1 |
| both variables unset | `both_unset_exit=3` | `grant-project-admin: ADMIN_EMAIL is not set`, `grant-project-admin: PUBLIC_PROJECT_ID is not set` | — |
| `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000ff` (no such project) | `unknown_project_exit=3` | `ERROR:  grant-project-admin: no project has the id PUBLIC_PROJECT_ID names, and nothing was written` | 1 |
| `PUBLIC_PROJECT_ID=not-a-uuid` | `malformed_project_exit=3` | `ERROR:  invalid input syntax for type uuid: "not-a-uuid"` | 1 |
| two users `Twin@example.invalid` and `twin@example.invalid` (the local `auth.users` admitted both), `ADMIN_EMAIL=twin@example.invalid` | `two_users_exit=3` | `ERROR:  grant-project-admin: more than one user has the address ADMIN_EMAIL names, and nothing was written` | 1 |

## The row written

`select user_id is not null, scope, target_type is null, target_id, role from public.grants`:

```
t|project|t|00000000-0000-0000-0000-000000000001|admin
```

## Teardown

`stop_exit=0` (from the driver's EXIT trap); `isolated-instance.sh list` → empty, exit 0.
