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
## D-20 link 5: bank-auth and bank-auth-journey, three consecutive runs each

**Setup.** Ports 8777, 9443 and 5273 were free and no `vite.js dev` process was alive before the first run.
One baseline `yarn db:reset` (exit 0, 21:38:30Z); all six runs then used `--no-db-reset` on that database.
The env files were generated from `tests/tests/utils/testKeys.ts` and `DEFAULT_TOKEN_OPTS` into the session
scratchpad only (`bank-auth-edge.env`, `bank-auth-journey-edge.env`, `bank-auth-journey.env`,
`bank-auth-jwks/jwks`). The two Edge env files differ in exactly one line, `IDENTITY_PROVIDER_ISSUER`. The JWKS
was served by `python3 -m http.server 8777` from the scratchpad (`GET /jwks` 200).

| Project | Edge Function env (read back from the running container by key) |
|---|---|
| `bank-auth` | `IDENTITY_PROVIDER_ISSUER=https://test-idp.example.com`, `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2`, `SITE_URL=http://127.0.0.1:5273` |
| `bank-auth-journey` | `IDENTITY_PROVIDER_ISSUER=https://127.0.0.1:9443`, `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2`, `SITE_URL=http://127.0.0.1:5273` |

For the journey, the wrapper's shell exported `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2` and
sourced the scratchpad `bank-auth-journey.env` (the IdP env and the TLS bypass), in that shell only.

| # | Command | Exit | Totals (report.json; results.json agrees) | Preflight | Window (UTC) | Verdict |
|---|---|---|---|---|---|---|
| 7.1 | `PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-04-bank-auth-1 --project bank-auth --no-db-reset` | 0 | `total 8, expected 8, unexpected 0, flaky 0, skipped 0` | 0 / 1 | 21:39:10 -> 21:39:26 | PASS |
| 7.2 | same, `166-04-bank-auth-2` | 0 | `total 8, expected 8, unexpected 0, flaky 0, skipped 0` | 0 / 1 | 21:39:46 -> 21:40:02 | PASS |
| 7.3 | same, `166-04-bank-auth-3` | 0 | `total 8, expected 8, unexpected 0, flaky 0, skipped 0` | 0 / 1 | 21:40:02 -> 21:40:18 | PASS |
| 8.1 | `PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-04-bank-auth-journey-1 --project bank-auth-journey --no-db-reset` | 0 | `total 131, expected 131, unexpected 0, flaky 0, skipped 0` | 0 / 1 | 21:41:15 -> 21:45:47 | PASS |
| 8.2 | same, `166-04-bank-auth-journey-2` | 0 | `total 131, expected 131, unexpected 0, flaky 0, skipped 0` | 0 / 1 | 21:45:47 -> 21:50:20 | PASS |
| 8.3 | same, `166-04-bank-auth-journey-3` | 0 | `total 131, expected 131, unexpected 0, flaky 0, skipped 0` | 0 / 1 | 21:50:21 -> 21:54:48 | PASS |

- **bank-auth, every run:** all six spec tests passed, plus base setup and teardown. "should create candidate via
  identity-callback Edge Function (Idura sub-based identity)" asserts the keys-configured create path loudly and
  passed, so the path was taken each time. "should return session with magic link when candidate is created"
  carries the second-POST assertion (`body.candidate_id` equals the first POST's) and passed each time.
- **bank-auth-journey, every run:** "full bank-auth self-registration journey through to authenticated candidate"
  passed (its step 6b requires exactly one candidate named by the user's candidate-editor grant), with
  `data-setup-bank-auth-journey`, `data-teardown-bank-auth-journey` and the whole perm serial chain.

**After the runs.**
- The function server and the JWKS server were stopped. Ports 8777, 9443 and 5273 have no listener, and no
  `vite.js dev` process is alive.
- The `supabase_edge_runtime_openvaa-local` container was restored to the default function settings by one
  `npx supabase functions serve` with no `--env-file`, then that CLI was stopped. Read back by key: issuer
  `https://openvaa.test.idura.broker`, project `00000000-0000-0000-0000-000000000001`, `SITE_URL` on 5173.
  Docker was not restarted; the other Supabase stack's edge runtime was not touched.
- Orphans, through psql on the local database: `auth.users` with an email ending `@test.openvaa.local`: **0**;
  E2E-project (`...0e2`) candidates with a null `external_id`: **0**; E2E-project organizations with a null
  `external_id`: **0**; `auth.users` with an email ending `@bank-auth.placeholder`: **0**.
- Leak check: `git status --porcelain` lists only an untracked, unrelated
  `.planning/quick/261001-n8y-.../gate-evidence/` directory (and, before this commit, this file); no env file
  and nothing under `apps/supabase/supabase/functions`. The plan's check
  `STATUS="$(git status --porcelain)" && ! printf '%s\n' "$STATUS" | grep -qE '(^|/)\.env|functions/'` exits 0.
  No command in this plan wrote to the root or the functions env file; the test keys and the TLS bypass exist
  only in the session scratchpad.
## Documentation (D-04) and population check after Task 3's doc commit (`c7a906e18`)

| Check | Command | Exit | Result |
|---|---|---|---|
| Population | `test "$(git grep -l auth_user_id -- apps packages tests .claude/skills)" = "apps/supabase/supabase/tests/database/36-entity-identity.test.sql"` | 0 | only the census file names the column |
| Docs present | the plan's `test -f ... && grep -q caller_entity_ids ... && grep -q idx_grants_one_candidate_editor ... && grep -q caller_entity_ids <saved-answers todo>` | 0 | both residue todos exist; skill names the helper and the index; todo annotated |
| Counts | `grep -c` | - | `ERR_ENTITY_IDENTITY_AMBIGUOUS` in SKILL.md: 2; `Phase 166` in SKILL.md: 1; `Phase 167` in the created_by todo: 1 |
| No source change | `git diff --exit-code -- apps packages tests` | 0 | this plan changes no source |

## D-20 link 6: full suite - NOT RUN (disk floor not met)

| Step | Command | Result |
|---|---|---|
| Measure before | `docker run --rm alpine df -k /` | 107016164 KiB size, 87078548 used, **14468692 KiB available (13.8 GiB)**, 86% |
| Sanctioned prune | `docker builder prune -af` | `Total: 0B` (no build cache to reclaim) |
| Measure after | `docker run --rm alpine df -k /` and `df -h /` | **14468692 KiB available (13.8 GiB)**, unchanged |
| Read-only inventory | `docker system df` | images 17.6 GB (6.526 GB reclaimable), containers 44.5 MB (0 reclaimable), local volumes 13.75 GB (86 MB reclaimable), build cache 0 |

The floor is 15 GiB (orchestrator ruling 4). The only remaining reclaimable space is in images and volumes,
which this plan must not prune because a second, unrelated Supabase stack runs on this host, and a Docker
restart is likewise prohibited. Per the plan ("If the VM is still below 15 GiB after the prune, stop and report
rather than run"), the full suite was **not started**. Verdict for link 6: **PENDING - blocked on VM disk**.
<!-- gsd:gates-continue -->
