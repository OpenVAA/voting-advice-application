# 186-04 evidence: the smoke contestant's grant script, proven on an isolated instance

- **Date (UTC):** 2026-11-14, runs between 22:53:33 and 22:53:52Z
- **Commit:** `f943b2a56` (the tree under test adds `infra/scripts/grant-smoke-contestant.sql` as committed by 186-04 Task 1)
- **Script:** `infra/scripts/grant-smoke-contestant.sql`
- **Instance:** `apps/supabase/scripts/isolated-instance.sh start --name grant186 --mode db --migrations apps/supabase/supabase/migrations --port-base 56500` — database only, project id `openvaa-iso-grant186`, Postgres on **56501**. Separate from the shared local stack (`openvaa-local`), which was not touched.
- **Client:** psql 17.6 (Homebrew), libpq variables from `isolated-instance.sh env --name grant186`.
- **Driver:** `tmp/186-04/driver.sh` (ignored), with `trap '… stop --name grant186' EXIT`. The test addresses are `@example.invalid` and appear in the driver only; below, the users are named by letter.

Every status below was read directly from `$?` right after the command, never through a pipe. "Rows after" is `(entity-scope grants on the whole table, terms_of_use_acceptances on the whole table)` read after each run.

## Setup

| Step | Result |
|---|---|
| `isolated-instance.sh start …` | `ISO_START_EXIT=0` |
| `psql -X -q -f infra/scripts/bootstrap.sql` with `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001`, `BOOTSTRAP_STORAGE_URL=https://example.invalid`, `SUPABASE_SERVICE_ROLE_KEY=not-a-real-value`, `BOOTSTRAP_BEHIND_CLOUDFLARE=false` (as 184-09) | `BOOTSTRAP_EXIT=0` |
| In project `…0001`: one election `smoke_elec_0000`, one constituency `smoke_cons_0000`; candidates `smoke_cand_0000` (no nomination), `smoke_cand_0001` and `smoke_cand_0002` (each with a nomination, `smoke_nom_cand_0001`, `smoke_nom_cand_0002`). A second project `…0002` whose only candidate, `smoke_cand_0000`, has no nomination. Five confirmed `auth.users` rows: contestant A, contestant B, administrator C (holding the project-scope `admin` grant on `…0001`), and twins D and E whose addresses differ only in case. | `SETUP_EXIT=0` |

## The record

```
GRANT_UNSET_EXIT=3
GRANT_UNKNOWN_EXIT=3
GRANT_FIRST_EXIT=0
GRANT_FIRST_CANDIDATE=smoke_cand_0001
GRANT_FIRST_GRANTS=1
GRANT_FIRST_TERMS=1
GRANT_SECOND_EXIT=0
GRANT_CASE_EXIT=0
GRANT_OTHER_EDITOR_EXIT=3
GRANT_OTHER_GRANT_EXIT=3
GRANT_NO_PROJECT_EXIT=3
GRANT_BAD_ID_EXIT=3
GRANT_CASCADE_GRANTS=0
GRANT_CASCADE_TERMS=0
ISO_LIST_AFTER=empty
```

Beyond the plan's list, the remaining refusals of the script's header, each also seen once:

```
GRANT_BLANK_EXIT=3
GRANT_PROJECT_UNSET_EXIT=3
GRANT_TWIN_EXIT=3
GRANT_NO_CANDIDATE_EXIT=3
GRANT_OTHER_EDITOR_TERMS_B=0
```

## The runs

All runs are `psql -X -f infra/scripts/grant-smoke-contestant.sql`, with `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001` unless the row says otherwise, in this order.

| Run | Input | Exit | Standard output | Standard error (the `grant-smoke-contestant:` or error line) | Rows after |
|---|---|---|---|---|---|
| unset | `SMOKE_CONTESTANT_EMAIL` unset (`env -u`) | 3 | (none) | `grant-smoke-contestant: SMOKE_CONTESTANT_EMAIL is not set`, then `ERROR:  grant-smoke-contestant: required environment variables are not set, and nothing was written` | 0, 0 |
| blank | `SMOKE_CONTESTANT_EMAIL='   '` | 3 | (none) | `grant-smoke-contestant: SMOKE_CONTESTANT_EMAIL is not set`, then the same `ERROR:` line | 0, 0 |
| project unset | A's address, `PUBLIC_PROJECT_ID` unset | 3 | (none) | `grant-smoke-contestant: PUBLIC_PROJECT_ID is not set`, then the same `ERROR:` line | 0, 0 |
| unknown | an address no user has | 3 | (none) | `ERROR:  grant-smoke-contestant: no user has the address SMOKE_CONTESTANT_EMAIL names, and nothing was written` | 0, 0 |
| twin | the twins' address in lower case | 3 | (none) | `ERROR:  grant-smoke-contestant: more than one user has the address SMOKE_CONTESTANT_EMAIL names, and nothing was written` | 0, 0 |
| no candidate | A's address, `PUBLIC_PROJECT_ID=…0002` | 3 | (none) | `ERROR:  grant-smoke-contestant: no smoke_ candidate of the project has a nomination, and nothing was written` | 0, 0 |
| first | A's address | 0 | `candidate=smoke_cand_0001`, `grants=1`, `terms=1` | (none) | 1, 1 |
| second | A's address | 0 | `candidate=smoke_cand_0001`, `grants=1`, `terms=1` | (none) | 1, 1 |
| other case | A's address in upper case | 0 | `candidate=smoke_cand_0001`, `grants=1`, `terms=1` | (none) | 1, 1 |
| other editor | B's address | 3 | (none) | `ERROR:  grant-smoke-contestant: another user already edits the chosen candidate, and nothing was written` | 1, 1 |
| other grant | C's address | 3 | (none) | `ERROR:  grant-smoke-contestant: the user holds another grant, and nothing was written` | 1, 1 |
| no project | A's address, `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000ff` | 3 | (none) | `ERROR:  grant-smoke-contestant: no project has the id PUBLIC_PROJECT_ID names, and nothing was written` | 1, 1 |
| bad id | A's address, `PUBLIC_PROJECT_ID=not-a-uuid` | 3 | (none) | `ERROR:  invalid input syntax for type uuid: "not-a-uuid"` | 1, 1 |

The second and the other-case runs added nothing. B holds no acceptance after the other-editor run (`GRANT_OTHER_EDITOR_TERMS_B=0`), so the refusal wrote neither row. `grep -l '@' tmp/186-04/out/*.err` matched no file (exit 1): no standard error line holds an address.

The lowest nominated candidate was chosen: `smoke_cand_0000` sorts first but has no nomination in project `…0001`, and `smoke_cand_0001` was granted.

## The rows written

`select user, scope, target_type, candidate external_id, role from public.grants` after the runs:

```
A|entity|candidate|smoke_cand_0001|editor
C|project|||admin
```

`select user_id, project_id from public.terms_of_use_acceptances`:

```
A|00000000-0000-0000-0000-000000000001
```

## The cascade

`delete from auth.users where id = <A>` (exit 0), then A's grants and acceptances counted: `GRANT_CASCADE_GRANTS=0`, `GRANT_CASCADE_TERMS=0`. Both rows went with the user by `ON DELETE CASCADE`.

## Teardown

`STOP_EXIT=0` (from the driver's EXIT trap); `isolated-instance.sh list` printed nothing, exit 0 (`ISO_LIST_AFTER=empty`); no `grant186` container was running.
