# 186-08 evidence: readiness, read-only, before the hosted write

- **Date (UTC):** 2026-11-14, readings from 23:47:45Z to 23:48:30Z
- **Recorded by:** the plan executor, from this checkout at HEAD `440aa026eb8ba1cffc6cc8d6134688c0b410ac16` (`git rev-parse HEAD`)
- **Hosted requests:** GETs only: `https://staging.openvaa.org/api/health`, `https://staging.openvaa.org/`, and one anonymous REST read of `https://cofbsatfrdysyphajsky.supabase.co/rest/v1/candidates`. No write to any hosted service, no keychain read or write, no service-role key and no database password in any shell.
- **Root `.env`:** never read.

Every status below was read from `$?` on the next statement, never through a pipe.

## The served build

DEPLOYED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30
SERVED_BUILD=712947a1bd44a735f66ee8f51610f4748d76cd30

`DEPLOYED_SHA` is `image_tag` of `infra/envs/staging/aws/terraform.tfvars`; `SERVED_BUILD` is the `build` field of `curl -sS https://staging.openvaa.org/api/health` (curl exit 0, body `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`), read at 23:47:45Z. Equal.

## The tree since the closing local run

`E2E_TREE_SHA=ac3d8d42bc20060f4c46825d51d2bcce3826dfc1` (from `evidence/186-07-closing-e2e.md`). `git diff --quiet ac3d8d42bc20060f4c46825d51d2bcce3826dfc1..HEAD -- apps packages tests` exited 0.

TREE_SINCE_CLOSING_RUN=unchanged

## The candidate the sitting will grant

The public anon key was read from the `PUBLIC_SUPABASE_ANON_KEY` field of the SvelteKit env block of `https://staging.openvaa.org/` (HTTP 200; the block's `PUBLIC_SUPABASE_URL` is `https://cofbsatfrdysyphajsky.supabase.co`, and the document's `data-project-id` is `00000000-0000-0000-0000-000000000001`). It went into a header file in the session's scratch directory, never onto a command line or into this file. The read, with `P` the `public_project_id` of `infra/envs/staging/supabase/terraform.tfvars`:

```
GET /rest/v1/candidates?select=external_id,answers,nominations!inner(id)&project_id=eq.$P&external_id=like.smoke_*&order=external_id.asc&limit=3
```

HTTP 200. The `!inner` embed keeps only candidates that have a nomination. The three rows it returned, in order: `smoke_cand_0000` (6 answers, 1 nomination), `smoke_cand_0001` (6, 1), `smoke_cand_0002` (6, 1). The first is the candidate `infra/scripts/grant-smoke-contestant.sql` picks (lowest `external_id` under `COLLATE "C"` among the project's nominated `smoke_` candidates; the ids differ only in their digits, so the REST order and the C order agree).

READY_CANDIDATE=smoke_cand_0000
READY_CANDIDATE_ANSWERS=6

## The voter half against staging

Run form of plan 186-02: `env -u SUPABASE_SERVICE_ROLE_KEY -u SUPABASE_SECRET_KEY SMOKE_EXPECTED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30 PLAYWRIGHT_JSON_OUTPUT_FILE=<dir>/results.json PLAYWRIGHT_HTML_OUTPUT_DIR=<dir>/html yarn test:e2e:deployed tests/tests/deployed/voter.smoke.ts --output <dir>/results > <dir>/smoke.log 2>&1`, in the background, its status read from `$?` on the next statement. Run window 2026-11-14T23:48:23Z to 23:48:30Z. The run directory holds no `VOID-host-suspend.txt`.

READY_VOTER_RUN_DIR=tests/e2e-runs/186-08-ready-voter-20261114T234823Z
READY_VOTER_EXIT=0

The gate's lines and the result line, quoted from `smoke.log`:

```
DEPLOYED SMOKE GATE https://staging.openvaa.org
PASS service-role-key-absent
PASS sha
PASS ref
PASS project-id
DEPLOYED SMOKE GATE OK build=712947a1bd44a735f66ee8f51610f4748d76cd30 ref=cofbsatfrdysyphajsky project=00000000-0000-0000-0000-000000000001
  1 passed (6.5s)
```

`node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/186-08-ready-voter-20261114T234823Z --passed voter.smoke.ts --no-flaky`:

```
VERDICT OK: 1 tests -- passed 1, failed 0, flaky 0, skipped 0, did not run 0
```

READY_VOTER_VERDICT_EXIT=0

## Result

Staging serves the deployed SHA, the local tree under `apps/`, `packages/` and `tests/` is the one the closing local run covered, the sitting's candidate is `smoke_cand_0000` with six answers and a nomination, and the voter half is green against staging. Everything the sitting relies on is shown true by reads alone; nothing hosted was written.
