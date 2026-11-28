# 186-08 green run: the full deployed smoke against staging

Date: 2026-11-15 (UTC). Run window 2026-11-15T12:00:03Z to 2026-11-15T12:00:15Z. Run by the orchestrator, after the sitting of `186-08-sitting.md`.

Run form of plan 186-02 with no spec argument: `env -u SUPABASE_SERVICE_ROLE_KEY -u SUPABASE_SECRET_KEY -u PGPASSWORD SMOKE_EXPECTED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30 PLAYWRIGHT_JSON_OUTPUT_FILE=<dir>/results.json PLAYWRIGHT_HTML_OUTPUT_DIR=<dir>/html yarn test:e2e:deployed --output <dir>/results > <dir>/smoke.log 2>&1`, Node 24.21.0, in the background, its status read from `$?` on the next statement. `SMOKE_EXPECTED_SHA` is `HANDOFF_SMOKE_EXPECTED_SHA=` of `187-13-186-08-handoff.md`. `SMOKE_CONTESTANT_EMAIL` (from the item's `acct`) and `SMOKE_CONTESTANT_PASSWORD` (with `-w`) were read from the keychain item `openvaa-staging-smoke-contestant` and given to that command only; no service-role key, secret key or database password was in its environment. The deployed config has no HTML reporter, so the HTML variable has no effect.

GREEN_RUN_DIR=tests/e2e-runs/186-08-green-20261115T120003Z
GREEN_SMOKE_EXIT=0

The gate lines and the test lines, quoted from `smoke.log` (the gate now checks `origin` too, five lines where the plan named four):

```
DEPLOYED SMOKE GATE https://staging.openvaa.org
PASS service-role-key-absent
PASS origin
PASS sha
PASS ref
PASS project-id
DEPLOYED SMOKE GATE OK build=712947a1bd44a735f66ee8f51610f4748d76cd30 ref=cofbsatfrdysyphajsky project=00000000-0000-0000-0000-000000000001
  ✓  1 [deployed-smoke] › tests/tests/deployed/contestant.smoke.ts:24:1 › a contestant signs in with a password, sees a complete home and signs out (3.1s)
  ✓  2 [deployed-smoke] › tests/tests/deployed/voter.smoke.ts:17:1 › a voter answers the hosted questions and reaches candidate results (6.1s)
  2 passed (10.4s)
```

The verdict, `node tests/scripts/e2e-spec-verdict.mjs tests/e2e-runs/186-08-green-20261115T120003Z --passed voter.smoke.ts --passed contestant.smoke.ts --no-flaky`:

```
VERDICT OK: 2 tests -- passed 2, failed 0, flaky 0, skipped 0, did not run 0
```

GREEN_VERDICT_EXIT=0

The run's per-test output directory is treated as secret (Step 22) and is not published, uploaded or attached.

The tree, `git diff --quiet <HANDOFF_TREE_REFERENCE>..HEAD -- apps packages tests` with `HANDOFF_TREE_REFERENCE=54e79823b1fa6a3548a82bdf2d27644e4b7af317` (the superseded-inputs note of the plan):

TREE_SINCE_CLOSING_RUN=unchanged

The leak check: the two contestant values, read from the keychain, searched with `grep -qF` in the three evidence files of this plan and `infra/envs/staging/supabase/README.md`; neither was found.

CREDENTIAL_LEAK_CHECK=clean
