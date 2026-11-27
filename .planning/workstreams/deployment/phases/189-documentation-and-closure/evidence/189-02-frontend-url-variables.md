# 189-02 — the two frontend-URL variables (B-03, F-03, H-02)

Measured 2026-11-20 on `feat/deployment-terraform-supabase`, HEAD `a8ffa1455` before this plan.

## Task 1 — the re-grep, the reader and its four mocks

Command: `git grep -n FRONTEND_URL -- ':!.planning'`

B03_HITS_BEFORE=15
B03_HITS_AT_PLAN_01_BASE=18

The plan pinned 18, the research count. That count was taken before plan 189-01, at
`22e6d0939`. Plan 189-01 removed three of those lines: `render.example.yaml:47` and `:49`, with
the file, and the deployment guide's line 45, with its Render section. The 15 lines left at
execution:

| File | Lines | Kind |
|------|-------|------|
| `apps/frontend/src/lib/utils/constants.ts` | 4, 5 | the only reader |
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` | 41, 42 | test mock |
| `apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts` | 44, 45 | test mock |
| `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts` | 43, 44 | test mock |
| `apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts` | 36, 37 | test mock |
| `.env.example` | 114, 115 | template (Task 2) |
| `docker-compose.dev.yml` | 17, 18 | root compose (Task 2) |
| `apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md` | 97 | docs, rewritten by plan 189-09 |

`git grep -n FRONTEND_URL -- apps/docs packages infra .github tests` finds only the env page line
above. No hit in `packages/`, `infra/`, `.github` or `tests/`. Because `git grep` covers every
tracked file, `.svelte` files are included.

Dynamic reads of the constants object:
`git grep -nE "(publicConstants|constants)\[|\.\.\.(publicConstants|constants)\b|Object\.(keys|entries|values)\((publicConstants|constants)\)" -- apps/frontend/src`
exits 1 with no output. The same pattern under `git grep -nP` also exits 1, so the `\b` blind spot
found by plan 189-01 hides nothing here.

B03_DYNAMIC_READS=0
B03_NON_TEST_READERS=0

Edits: the two entries were deleted from the exported `constants` object in `constants.ts`,
leaving its other entries and comments as they were. The two mock entries were deleted from each
of the four test files. Afterwards `git grep -l FRONTEND_URL -- apps/frontend/src` lists no file.

- `yarn workspace @openvaa/frontend test:unit src/lib/api/utils/auth`: 9 files, 255 tests passed
- `yarn workspace @openvaa/frontend typecheck`: 2427 files, 0 errors, 0 warnings

B03_UNIT_EXIT=0
B03_TYPECHECK_EXIT=0

## Task 2 — the env template and the root compose

Deleted: the two lines from the `# Frontend configuration` block of `.env.example`, together with the
blank line that followed them, so the banner is followed by one blank line and then
`FRONTEND_PORT=5173`. Also deleted: the two lines from the frontend service's `environment:` map in
`docker-compose.dev.yml`. Every other line of both files is unchanged, and the root compose is kept
(F-03).

- `grep -c '^FRONTEND_PORT=' .env.example` prints 1; `grep -c PUBLIC_PROJECT_ID docker-compose.dev.yml` prints 1
- `docker compose -f docker-compose.dev.yml config --quiet` exits 0
- `yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts tests/analyticsEnvTemplates.test.ts tests/localSupabaseUrl.test.ts`: 3 files, 100 tests passed

B03_COMPOSE_CONFIG_EXIT=0

`yarn lint:check` exits 0.

B03_LINT_EXIT=0

The first `yarn test:unit` exited 1. Two tests failed, both in `@openvaa/dev-seed`
`tests/integration/default-template.integration.test.ts`, with
`bulkImport failed: column "election_type" of relation "elections" does not exist`. The cause was
the stack, not this tree. The shared `openvaa-local` stack had been started at 08:15Z from the
`voting-advice-application-reviewfix` checkout. Its applied migration 00023 is
`elections_nomination_shape_column` (this tree's 00023 is `invitation_caller_limit`), and its edge
runtime mounted that checkout's `functions`. No E2E run and no dev server on 5273 was live, so under
the standing stack authorisation the stack was put back from this checkout with `yarn db:stop`,
`yarn db:start` and then `yarn db:reset`. Afterwards the applied migrations end
`00023 invitation_caller_limit` and `00024 invitation_caller_take_without_waits`, and the edge
runtime mounts this checkout's `apps/supabase/supabase/functions`. Run again, `yarn test:unit`
exits 0: 26 of 26 turbo tasks; dev-seed 1308 passed; frontend 8435 passed and 33 skipped (1 file
skipped whole). This plan adds and removes no test.

B03_TEST_UNIT_EXIT=0

## Task 3 — targeted E2E runs after the last code commit

The runs were made one after another on HEAD `4f6ab8f8e`, the commit of Task 2 and this plan's last
code commit. The tree was clean outside `.planning/`, and every run's `head` file holds
`4f6ab8f8e21924842cb6200acf2e872ac68d7890`. Each run was
`caffeinate -i tests/scripts/e2e-run.sh --run-dir <dir> --no-db-reset --project <p>` and served
port 5273. None was void: there is no `VOID-host-suspend.txt`, and `heartbeat_max_late_ms` was
25, 121 and 38. Each `restore.txt` ends `restore: ok`. The totals include each project's setup
chain. The target project's own count is the number of `expected` tests with that `projectName` in
the run's `results.json`, counted the same way as in the baseline's `results.json`. Titles were
compared per project against the baseline (`suite > … > spec` paths): 0 only in the baseline and 0
only in the run, for each of the three projects.

E2E_TREE_SHA=4f6ab8f8e21924842cb6200acf2e872ac68d7890
E2E_BASELINE_RUN=tests/e2e-runs/188-close3-20261119T213204Z
E2E_BASELINE_BANK_AUTH=12
E2E_BASELINE_CIP=42
E2E_BASELINE_VOTER_JOURNEY=2

### bank-auth

E2E_BANK_AUTH_RUN_DIR=tests/e2e-runs/189-02-bank-auth-20261120T100056Z
E2E_BANK_AUTH_EXIT=0
E2E_BANK_AUTH_TOTAL_PASSED=14
E2E_BANK_AUTH_FAILED=0
E2E_BANK_AUTH_FLAKY=0
E2E_BANK_AUTH_DID_NOT_RUN=0
E2E_BANK_AUTH_PASSED=12
E2E_BANK_AUTH_VERDICT_EXIT=0

Setup chain: `data-setup-base` 1 and `data-teardown-base` 1.

### contestant-identity-provider

E2E_CIP_RUN_DIR=tests/e2e-runs/189-02-contestant-identity-provider-20261120T100212Z
E2E_CIP_EXIT=0
E2E_CIP_TOTAL_PASSED=614
E2E_CIP_FAILED=0
E2E_CIP_FLAKY=0
E2E_CIP_DID_NOT_RUN=0
E2E_CIP_PASSED=42
E2E_CIP_VERDICT_EXIT=0

`--project=contestant-identity-provider` pulls in the whole serial chain through
`data-setup-identity-provider` (1 passed), so the run has 614 tests.

### voter-journey

E2E_VOTER_JOURNEY_RUN_DIR=tests/e2e-runs/189-02-voter-journey-20261120T102018Z
E2E_VOTER_JOURNEY_EXIT=0
E2E_VOTER_JOURNEY_TOTAL_PASSED=4
E2E_VOTER_JOURNEY_FAILED=0
E2E_VOTER_JOURNEY_FLAKY=0
E2E_VOTER_JOURNEY_DID_NOT_RUN=0
E2E_VOTER_JOURNEY_PASSED=2
E2E_VOTER_JOURNEY_VERDICT_EXIT=0

Setup chain: `data-setup-base` 1 and `data-teardown-base` 1.

### Deltas against the last full run

| Project | Baseline | This plan | Delta |
|---------|----------|-----------|-------|
| bank-auth | 12 | 12 | 0 |
| contestant-identity-provider | 42 | 42 | 0 |
| voter-journey | 2 | 2 | 0 |

E2E_TITLE_CHANGES=0
E2E_TARGETED_DELTA=0
