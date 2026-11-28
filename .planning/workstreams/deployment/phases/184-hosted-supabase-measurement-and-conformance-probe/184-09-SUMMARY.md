---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 09
subsystem: infra
tags: [infra, runbook, supabase, hosted, psql, grants, gates]
status: complete

requires:
  - "184-03: the conformance probe `infra/scripts/probe-hosted.mjs` and its environment"
  - "184-04: the push wrapper `infra/scripts/push-migrations.sh`, its flags, named lines and exit codes"
  - "184-05: the scratch root and its `fault_set` variable"
  - "184-07: PUBLIC_PROJECT_ID canonical (00000000-0000-0000-0000-000000000001) on both projects"
  - "184-08: BOOTSTRAP_OPEN_FOR_VOTERS=true at each hosted bootstrap; the `smoke` dev-seed template"
provides:
  - "`infra/scripts/grant-project-admin.sql`: the first administrator's project-scope `admin` grant, idempotent, env `ADMIN_EMAIL` + `PUBLIC_PROJECT_ID`, prints `grants_on_project=<n>`, exits 0/2/3"
  - "Staging runbook `## Deploying to a project`: Steps 14 to 23 with named lines `s14_` to `s23_`, run with `R=scratch` then unchanged with `R=staging`"
  - "Runbook `### Fault steps on the throwaway project`: the fault-step rule, and the matching exception in the second rule of \"Rules of this root\""
  - "Twelve new \"Not yet observed\" rows, each naming its checking step"
  - "A probe row in the `infra/README.md` Guards table"
  - "The three repository gates green at 8319f4540254a73ae8bf81a9703b2e5ec1ce2e59 (attempt 2)"
affects: [184-10, 184-11, 184-12, 184-13, 184-14, 184-15, 184-16, 184-17, 184-18, 184-19, 184-20, 184-21, 184-22, 184-23, 184-24]

actuals:
  tokens: 14400
  tasks: 3
  commits: 4
plan_head_before: c4ee675c70e2ec89f1b32e226c3d764fc5818359
plan_head_after: 57cafb0b888be56417a4464cf58b7b6f3501f500

tech-stack:
  added: []
  patterns:
    - "A psql script reads each value with `\\unset` then `\\getenv`, treats empty or whitespace-only as unset, carries any personal value only as a bound parameter, and ends with status 3 and nothing written on any refusal"
    - "Each runbook step sends raw output to `$L`, prints only named `s<N>_<field>=` lines, and ends by removing `$L`"

key-files:
  created:
    - infra/scripts/grant-project-admin.sql
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-09-grant-script.md
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-09-code-gates.md
  modified:
    - .prettierignore
    - infra/envs/staging/supabase/README.md
    - infra/README.md

key-decisions:
  - "The linked work directory is `tmp/supabase-linked/<ref>`, made of symbolic links to the repository's config.toml, migrations and functions; `apps/supabase` is never linked, because a link there changes the images the shared local stack starts"
  - "psql connects direct first and falls back to the session pooler on port 5432; port 6543 (transaction pooler) is never used because it loses the session settings the bootstrap sets"
  - "A fault or trial plan in the scratch root is applied in the same step only when its named lines equal the step's lines exactly; a plan that creates, destroys or replaces a supabase_project is never applied"
  - "The first administrator is created in the dashboard with auto-confirm, never by an invitation mail, since the send-email hook sends no auth mail"

requirements-completed: []  # SUPA-01, SUPA-02, SUPA-05, SUPA-06 close only on the live hosted runs of the sitting plans (184-10 to 184-24); nothing here touches a hosted project

duration: about 25 min of work, in two sittings (2026-10-26 Tasks 1 to 3 attempt 1; 2026-11-08 Task 3 attempt 2)
completed: 2026-11-08
---

# Phase 184 Plan 09: The deploy runbook, the first administrator's grant script, and the three gates Summary

**Steps 14 to 23 of the staging runbook take a hosted project from its linked work directory through push, functions, settings, logging check, bootstrap, first-administrator grant, smoke seed and conformance probe. Each step prints named `s<N>_` lines. Alongside the runbook: an idempotent `grant-project-admin.sql`, proven on an isolated instance, and lint, format and unit gates all green at 8319f454.**

## Performance

- **Duration:** about 25 min of work across two sittings
- **Started:** 2026-10-26 (Tasks 1 and 2, Task 3 attempt 1)
- **Completed:** 2026-11-08T19:05Z (Task 3 attempt 2)
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- `infra/scripts/grant-project-admin.sql` gives one existing user the project-scope `admin` grant (`ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING`). It was run on the isolated instance `grant184` (port base 56400) with these results: first run 0 / `grants_on_project=1`, second run 0 / 1, upper-case address 0 / 1, unknown address 3, `ADMIN_EMAIL` unset 3. Five more refusals also gave 3 with nothing written: whitespace-only value, both variables unset, unknown project, malformed id, and two users with the same address.
- The staging runbook's `## Deploying to a project` section holds Steps 14 to 23 in the deploy order, plus the fault-step rule. Prettier, the parity guard and the no-planning-path / no-address checks all pass on it.
- The three gates exit 0 at `8319f4540254a73ae8bf81a9703b2e5ec1ce2e59` (attempt 2).

## The steps, for the sitting plans

Every step starts from the lines of "The lines that begin each sitting of this part": repository root, `export LC_ALL=C`, `R`, `REF` from `infra/envs/$R/supabase/terraform.tfvars`, `W=tmp/supabase-linked/$REF`, `L`, and the secrets read with `read -rs`. Every step ends with `s<N>_logs_removed=yes`.

| Step | Title | Named lines it prints |
| --- | --- | --- |
| 14 | The linked work directory | `s14_links=` (must be 3), `s14_link_exit=`, `s14_linked_ref=` (must be the root's ref), `s14_shared_dir_linked=no` |
| 15 | The connection psql uses | `s15_direct_exit=`, `s15_pooler_exit=` (only if direct failed), `s15_connection=direct\|pooler`; port 6543 never |
| 16 | The migrations | `s16_push_exit=`, then the wrapper's lines prefixed: `s16_push_connection=direct\|pooler\|unknown`, one `s16_push_pending=<version>` per missing migration, `s16_push_up_to_date=yes\|no`, `s16_push_status=<n>`, `s16_drift_status=<n>` + drift report; second run must print `s16_push_up_to_date=yes` and `s16_push_exit=0` |
| 17 | The functions | `s17_deploy_exit=`, `s17_list_http=`, one `s17_function=<slug> status=<status> verify_jwt=<bool>` per function |
| 18 | The settings and the function secrets | `s18_init_exit=`, `s18_plan_exit=`, `s18_plan_line=`, `s18_plan_sha256=`, `s18_apply_exit=`, `s18_apply_line=`, `s18_plan_file_removed=`, `s18_second_plan_exit=`, `s18_plan2_line=`, `s18_account=`, `s18_error=`, `s18_smtp.host=`, `s18_smtp.port=`, `s18_smtp.admin_email=`, `s18_smtp.sender_name=`, `s18_smtp_user_set=yes\|no`, one `s18_secret_name=` per function secret (names only) |
| 19 | The server's logging settings | `s19_psql_exit=`, one `s19_setting.<name>=` per setting (seven); the table of values that would log a statement's parameters; the bootstrap waits for a decision when one would |
| 20 | The bootstrap | `s20_boot1_exit=`, `s20_boot2_exit=`, after each run `s20_counts<k>=accounts,projects,app_settings,storage_config,deployment_settings`, `s20_behind_cloudflare<k>=`, `s20_open_for_voters<k>=`; then `s20_check_seed_exit=` |
| 21 | The first administrator | `s21_grant_exit=`, `s21_grants_on_project=<n>`, `s21_grant_error=` (on refusal, names no address), `s21_signin_http=`, `s21_claim_names=`, `s21_claim_grants=` (must hold one object with `"scope":"project"`, the project id and `admin`) |
| 22 | The smoke dataset | `s22_seed_exit=` (`yarn db:seed --template smoke --allow-remote` with `SUPABASE_URL` and the service-role key exported in the shell), `s22_read_http=`, `s22_rows_range=` from `Content-Range`; seeded once per project, removed with `yarn db:seed:teardown --prefix smoke_` |
| 23 | The conformance probe | `s23_probe_exit=`, each probe line prefixed `s23_probe=`; command `node infra/scripts/probe-hosted.mjs --root infra/envs/$R/supabase` |
| — | Fault steps on the throwaway project | Faults only via `-var fault_set=<redirect\|all>` or `-var-file` in `$L`, scratch root only; applied in the same step only when the plan's named lines equal the step's; never a project create/destroy/replace; revert `-var fault_set=none -replace=module.supabase.supabase_settings.this` |

### The grant script's contract

- **Run:** `psql -X -f infra/scripts/grant-project-admin.sql`, by itself, after `bootstrap.sql`, as `postgres` over a direct or session-pooler connection taken from PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD. Never `-v`, never a connection URL argument.
- **Environment (both required):** `ADMIN_EMAIL`, matched case-insensitively, exactly one user; `PUBLIC_PROJECT_ID`, a uuid whose project row must exist. An empty or whitespace-only value counts as unset.
- **Exit:** `0` = the user holds the grant (a re-run adds nothing). `2` = connection refused or lost. `3` = a variable is unset (each named on stderr), no user or more than one, no project, or a malformed id. Nothing is written on 3.
- **Output:** one line, `grants_on_project=<n>`. The address is never printed and never part of a statement's text.

## Task Commits

1. **Task 1: The first administrator's grant, as a script, proven on an isolated instance**: `ded9e4aed` (feat)
2. **Task 2: The deploy runbook, Steps 14 to 23, and the fault-step rule**: `f64a13350` (docs)
3. **Task 3: The three repository gates.** Attempt 1, `8319f4540` (docs): `test:unit` red. Attempt 2, `57cafb0b8` (docs): all three green.

## Files Created/Modified

- `infra/scripts/grant-project-admin.sql`: the first administrator's grant
- `.prettierignore`: the script added under "psql scripts"
- `infra/envs/staging/supabase/README.md`: `## Deploying to a project` with Steps 14 to 23, fault-step rule, amended rule 2, extended Flow overview, twelve "Not yet observed" rows
- `infra/README.md`: probe row in the Guards table
- `evidence/184-09-grant-script.md`: the isolated-instance proof
- `evidence/184-09-code-gates.md`: gate attempts 1 and 2

## Decisions Made

See `key-decisions` in the frontmatter. No checkpoint decision in this plan; the operator rulings of 2026-10-26 from 184-07 and 184-08 (canonical project id; `BOOTSTRAP_OPEN_FOR_VOTERS=true`) are written into Step 20.

## Deviations from Plan

### Gate finding resolved without a file change

**1. Task 3 attempt 1: `test:unit` exited 1 because the shared stack held another branch's schema**
- **Found during:** Task 3, attempt 1 (2026-10-26)
- **Issue:** `@openvaa/dev-seed#test:unit` failed in `default-template.integration.test.ts` with `bulkImport failed: Nomination constituency … is no constituency of its election …`. The shared database held 18 migrations from another worktree, while this branch has one (`00001_initial_schema.sql`). The orchestrator confirmed the diagnosis.
- **Fix:** the operator chose to reset. The orchestrator ran `yarn db:reset` from this worktree (exit 0), leaving `schema_migrations` with exactly `00001`. In attempt 2 all three gates exit 0 with no file changed. `default-template.integration.test.ts` passed its 3 tests.
- **Files modified:** the evidence file only
- **Commits:** `8319f4540` (attempt 1 record), `57cafb0b8` (attempt 2 record)

Otherwise the plan ran as written.

## Issues Encountered

- With a fresh `TURBO_CACHE_DIR`, turbo still reports `Cached: 11 cached, 25 total`. The per-task lines show all 11 hits are `build` tasks; every `test:unit` task ran as `cache bypass, force executing`. Where turbo found those build entries was not checked (UNCONFIRMED). No test result was replayed.

## User Setup Required

None from this plan. The hosted steps are run by the operator in the sitting plans.

## Next Phase Readiness

- The sitting plans 184-10 to 184-24 can send the operator to Steps 14 to 23 by number and read back the named lines listed above.
- The code is green on the three gates before the first hosted sitting.
- Running a gate or E2E from this worktree still needs the shared stack to hold this branch's one migration. Another worktree's E2E run would replace that schema again.

## Self-Check: PASSED

- FOUND: infra/scripts/grant-project-admin.sql
- FOUND: infra/envs/staging/supabase/README.md (Steps 14 to 23, fault-step section)
- FOUND: evidence/184-09-grant-script.md, evidence/184-09-code-gates.md
- FOUND commits: ded9e4aed, f64a13350, 8319f4540, 57cafb0b8
- Task 3 verify (`lint:check exit=0`, `format:check exit=0`, `test:unit exit=0`, full commit id): exit 0
