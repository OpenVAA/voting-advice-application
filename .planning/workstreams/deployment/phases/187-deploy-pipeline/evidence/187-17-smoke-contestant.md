# 187-17 evidence: plan 186-08 and the two contestant secrets

## Task 1: where plan 186-08 stands, read-only (read 2026-11-15T20:03:25Z, tree at `1b2af2af9`)

Recorded by the plan executor from this checkout at HEAD `1b2af2af9052fb8030ed5a961b1392d9d3f26916`. Requests: one GET of `https://staging.openvaa.org/api/health` and two `gh api` GETs of `repos/OpenVAA/voting-advice-application/environments/staging/secrets`, filtered by `--jq` to names and to the count. No write to any hosted service or GitHub setting, no keychain call, no secret value read. Every status was read from `$?` on the next statement, never through a pipe.

READ_AT=2026-11-15T20:03:25Z
PLAN_186_08=complete
HANDOFF_PRESENT=yes
HANDOFF_SERVED_BUILD_NOW=712947a1bd44a735f66ee8f51610f4748d76cd30
HANDOFF_STILL_VALID=yes
ENV_STAGING_SECRET_NAMES=ALERT_EMAIL,SUPABASE_ACCESS_TOKEN,SUPABASE_DB_PASSWORD

Readings:

- **`PLAN_186_08=complete`.** `.planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-08-SUMMARY.md` exists (`status: complete`, commit `062a11c1b`). `evidence/186-08-green-run.md` holds `GREEN_SMOKE_EXIT=0`, `GREEN_VERDICT_EXIT=0` and `CREDENTIAL_LEAK_CHECK=clean` as whole lines, with `GREEN_RUN_DIR=tests/e2e-runs/186-08-green-20261115T120003Z`. The run was made on 2026-11-15 between 12:00:03Z and 12:00:15Z. It ran under attempt `20261115T113054Z.6f59bc0c6` of `186-08-2`, used `SMOKE_EXPECTED_SHA` equal to `HANDOFF_SMOKE_EXPECTED_SHA`, and recorded `TREE_SINCE_CLOSING_RUN=unchanged` against `HANDOFF_TREE_REFERENCE`.
- **`HANDOFF_PRESENT=yes`.** `evidence/187-13-186-08-handoff.md` exists. `186-08-PLAN.md` holds the heading `## Superseded inputs (phase 187, 2026-11-15)`, and that note names `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-13-186-08-handoff.md`.
- **`HANDOFF_SERVED_BUILD_NOW`.** This is the `build` field of `curl -sS --max-time 20 https://staging.openvaa.org/api/health`. Curl exited 0, and the body was `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`.
- **`HANDOFF_STILL_VALID=yes`.** `git diff --quiet 54e79823b1fa6a3548a82bdf2d27644e4b7af317..HEAD -- apps packages tests` exited 0, where `54e79823b…` is `HANDOFF_TREE_REFERENCE`. `HANDOFF_SERVED_BUILD_NOW` equals `HANDOFF_SMOKE_EXPECTED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30`. Plan 186-08 is already complete, so it needs no resumption on the handoff. The check still shows that the tree and the served build behind its green run are unchanged.
- **`ENV_STAGING_SECRET_NAMES`.** The GET exited 0. The count GET also exited 0 and returned `total_count` 3, which is the state 187-14 Task 3 read back. Neither `SMOKE_CONTESTANT_EMAIL` nor `SMOKE_CONTESTANT_PASSWORD` is set yet. Setting them is what Task 2 asks the operator to do.
- `.github/workflows/deploy.yml` passes `secrets.SMOKE_CONTESTANT_EMAIL` and `secrets.SMOKE_CONTESTANT_PASSWORD` to its smoke step. `tests/tests/deployed/contestant.smoke.ts` fails by name when either input is missing (`requireSmokeInputs`).

What the green run still waits for is the two contestant secrets in the `staging` environment. Plan 186-08 is not among them.
