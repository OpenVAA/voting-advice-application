# Phase 166 gate evidence (plan 166-04)

- **Tree under test:** HEAD `6e0e2d96845900c9642bdc019c0ecf2fff3de10f` on `fix/888-review-findings`
  (the 166-03 close-out). `git status --porcelain -- apps packages tests` printed nothing before the first gate.
- **Date:** 2026-10-02 local (2026-10-01 UTC evening).
- **Host load at start:** load averages 8.24 / 9.40 / 8.52.
- **How each status was read:** every command ran as `cmd > LOG 2>&1; st=$?`, and `$st` was written to its own
  exit file before the next command started. No status was read through a pipe.
- **How E2E counts were read:** `tests/scripts/e2e-run.sh` exit code is the verdict. Counts come from the
  `report.json` inside the `playwrightReportBase64` zip embedded in `<run-dir>/html/index.html`, cross-checked
  against `<run-dir>/results.json`. A run is clean only when `total == expected` and `unexpected`, `flaky` and
  `skipped` are all 0, so a test that did not run counts as a failure.

## D-20 links 1-4: static, unit, pgTAP, candidate E2E

| # | Gate | Command | Exit | Totals | Verdict |
|---|---|---|---|---|---|
| 1 | Lint chain | `yarn lint:check` | 0 | all 19 links ran through `assert:edge-function-env`; schema-migration parity: 26 schema files -> 6372 lines, 1 migration file, generated copy current; comment hygiene 0 violations | PASS |
| 2 | Format | `yarn format:check` | 0 | `All matched files use Prettier code style!`; 0 `[warn]` lines | PASS |
| 3 | Unit | `yarn test:unit` | 0 | `Tasks: 25 successful, 25 total` (14 cached); supabase 15 files / 205 tests (Edge Function vitest suites), frontend 128 / 2041, dev-seed 66 / 897, data 47 / 244, app-shared 9 / 92, matching 5 / 43, llm 2 / 39, argument-condensation 6 / 30, filters 1 / 22, question-info 2 / 22, core 3 / 8; no failed test in any workspace | PASS |
| 4a | Database reset | `yarn db:reset` | 0 | `Finished supabase db reset` | PASS |
| 4b | SQL lint | `yarn db:lint:sql` | 0 | `Summary: 0 error(s), 3 warning(s)` (the standing baseline) | PASS |
| 4c | pgTAP | `yarn workspace @openvaa/supabase test:db` | 0 | `Files=36, Tests=1335`, `Result: PASS`; 0 `not ok` lines; 0 `# TODO`; `36-entity-identity.test.sql ... ok` | PASS |
| 5 | Population check | `git grep -l auth_user_id -- apps packages tests .claude/skills` | 0 (matches found) | `.claude/skills/database/SKILL.md`, `extension-patterns.md`, `rls-policy-map.md`, `schema-reference.md`, `apps/supabase/supabase/tests/database/36-entity-identity.test.sql`. Under apps, packages and tests the census file is the only path; the four skill files are Task 3's to fix. | AS EXPECTED |
| 6a | Candidate journey E2E (fresh `db:reset`) | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-04-candidate-journey --project candidate-journey` | 0 | report.json `total 5, expected 5, unexpected 0, flaky 0, skipped 0`; results.json agrees; preflight 0 failures / 1 success; projects data-setup-base, data-setup-candidate-journey, candidate-journey, both teardowns; 21:35:30Z -> 21:36:45Z | PASS |
| 6b | Candidate a11y E2E | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-04-candidate-a11y --project candidate-a11y-scan --no-db-reset` | 0 | report.json `total 17, expected 17, unexpected 0, flaky 0, skipped 0`; results.json agrees; preflight 0 failures / 1 success; 21:36:56Z -> 21:37:21Z | PASS |

Tracer gate (Task 1): every link exited 0 on the committed tree, so the chain is proven and expansion to the
bank-auth runs proceeds.
<!-- gsd:gates-continue -->
