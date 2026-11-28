# 186-08 evidence: readiness, read-only, before the hosted write

- **Date (UTC):** 2026-11-15, readings from 11:28:18Z to 11:29:02Z
- **Recorded by:** the plan executor, from this checkout at HEAD `54a96cbea2965ff7244e315c79061161d8cc3634` (`git rev-parse HEAD`)
- **Inputs:** per the note "Superseded inputs (phase 187, 2026-11-15)" of `186-08-PLAN.md`, the tree reference and the expected SHA come from `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-13-186-08-handoff.md`: `HANDOFF_TREE_REFERENCE=54e79823b1fa6a3548a82bdf2d27644e4b7af317` and `HANDOFF_SMOKE_EXPECTED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30`. This record replaces the one of 2026-11-14, which was made with the old inputs; every reading below is new.
- **Hosted requests:** GETs only: `https://staging.openvaa.org/api/health` (twice), `https://staging.openvaa.org/`, one anonymous REST read of `https://cofbsatfrdysyphajsky.supabase.co/rest/v1/candidates`, and the voter-half smoke run. No write to any hosted service, no keychain read or write, no service-role key and no database password in any shell.
- **Root `.env`:** never read.

Every status below was read from `$?` on the next statement, never through a pipe.

## The served build

DEPLOYED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30
SERVED_BUILD=712947a1bd44a735f66ee8f51610f4748d76cd30

`DEPLOYED_SHA` is `HANDOFF_SMOKE_EXPECTED_SHA` of the handoff. `SERVED_BUILD` is the `build` field of `curl -sS https://staging.openvaa.org/api/health` (curl exit 0, body `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`), read at 11:28:18Z and again at 11:28:46Z, just before the voter run, with the same body. Equal. `git diff --quiet 712947a1bd44a735f66ee8f51610f4748d76cd30 -- apps packages` exited 0, so this checkout's application tree is the deployed one.

## The tree since the closing local run

`git diff --quiet 54e79823b1fa6a3548a82bdf2d27644e4b7af317..HEAD -- apps packages tests` exited 0 (the reference is `HANDOFF_TREE_REFERENCE`, the tree of phase 187's green closing run).

TREE_SINCE_CLOSING_RUN=unchanged

## The candidate the sitting will grant

The public anon key was read from the `PUBLIC_SUPABASE_ANON_KEY` field of the SvelteKit env block of `https://staging.openvaa.org/` (HTTP 200, curl exit 0; the block's `PUBLIC_SUPABASE_URL` is `https://cofbsatfrdysyphajsky.supabase.co`, and the document's `data-project-id` is `00000000-0000-0000-0000-000000000001`). It went into a header file in the session's scratch directory, never onto a command line or into this file, and that file was removed after the read. The read, at 11:28:37Z, with `P` the `public_project_id` of `infra/envs/staging/supabase/terraform.tfvars` (`00000000-0000-0000-0000-000000000001`):

```
GET /rest/v1/candidates?select=external_id,answers,nominations!inner(id)&project_id=eq.$P&external_id=like.smoke_*&order=external_id.asc&limit=3
```

HTTP 200, curl exit 0. The `!inner` embed keeps only candidates that have a nomination. The three rows it returned, in order (external id, answer count, nomination count): `smoke_cand_0000` 6 1, `smoke_cand_0001` 6 1, `smoke_cand_0002` 6 1. The first is the candidate `infra/scripts/grant-smoke-contestant.sql` picks (lowest `external_id` under `COLLATE "C"` among the project's nominated `smoke_` candidates; the ids differ only in their digits, so the REST order and the C order agree).

READY_CANDIDATE=smoke_cand_0000
READY_CANDIDATE_ANSWERS=6

## The voter half against staging

Run form of plan 186-02: `env -u SUPABASE_SERVICE_ROLE_KEY -u SUPABASE_SECRET_KEY SMOKE_EXPECTED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30 PLAYWRIGHT_JSON_OUTPUT_FILE=<dir>/results.json PLAYWRIGHT_HTML_OUTPUT_DIR=<dir>/html yarn test:e2e:deployed tests/tests/deployed/voter.smoke.ts --output <dir>/results > <dir>/smoke.log 2>&1`, Node 24.21.0, in the background, its status read from `$?` on the next statement. The deployed config has no HTML reporter, so the HTML variable has no effect and the run directory holds no `html/`. Run window 2026-11-15T11:28:54Z to 11:29:02Z. The entry has no host-sleep heartbeat; the run is green, so no sleep check was needed.

READY_VOTER_RUN_DIR=tests/e2e-runs/186-08-ready-voter-20261115T112846Z
READY_VOTER_EXIT=0

The gate's lines and the result line, quoted from `smoke.log`:

```
DEPLOYED SMOKE GATE https://staging.openvaa.org
PASS service-role-key-absent
PASS origin
PASS sha
PASS ref
PASS project-id
DEPLOYED SMOKE GATE OK build=712947a1bd44a735f66ee8f51610f4748d76cd30 ref=cofbsatfrdysyphajsky project=00000000-0000-0000-0000-000000000001
  1 passed (7.5s)
```

`node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/186-08-ready-voter-20261115T112846Z --passed voter.smoke.ts --no-flaky`:

```
VERDICT OK: 1 tests -- passed 1, failed 0, flaky 0, skipped 0, did not run 0
```

READY_VOTER_VERDICT_EXIT=0

## Result

Staging serves the expected SHA, the local tree under `apps/`, `packages/` and `tests/` is the one phase 187's closing local run covered, the sitting's candidate is `smoke_cand_0000` with six answers and a nomination, and the voter half is green against staging. Everything the sitting relies on is shown true by reads alone; nothing hosted was written.
