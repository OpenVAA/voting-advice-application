---
phase: 186-deployed-smoke-entry
fixed_at: 2026-11-15T00:25:00Z
review_path: .planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
deferred: 1
status: all_fixed
---

# Phase 186: Code Review Fix Report

**Fixed at:** 2026-11-15T00:25:00Z
**Source review:** `.planning/workstreams/deployment/phases/186-deployed-smoke-entry/186-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (CR-01, WR-01, WR-02, IN-01, IN-02, IN-03)
- Fixed: 6
- Skipped: 0
- Deferred out of scope: 1 (IN-04, deferred to phase 187)

**Where it ran:** `workflow.use_worktrees` is `false`, so every edit, commit and gate ran in the main checkout on `feat/deployment-terraform-supabase`. No worktree was created. The gates below can be reproduced from this tree.

Each finding has a failing-test commit (`test(186): …`) followed by its fix commit (`fix(186): …`). The exceptions are WR-02, whose guard passes against the current config and is a regression guard (both widenings were seen failing it), and IN-03, which has no behaviour to test. WR-01 and IN-02 are fixed together in one commit, because IN-02 is the parse step the origin check needs.

## Fixed Issues

### CR-01: The contestant's password and address end up in plaintext in the HTML report on every run, and in `error-context.md` on any failure

**Files modified:** `tests/playwright.deployed.config.ts`, `tests/tests/deployed/contestant.smoke.ts`, `tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts`, `tests/tests/utils/deployedSmokeGuards.test.ts`, `tests/README.md`, `infra/envs/staging/supabase/README.md`
**Commits:** `efa85d12f` (failing guard), `b9309a96d` (fix)
**Applied fix:**
- The deployed config has no `html` reporter: `list`, plus `json` only when `PLAYWRIGHT_JSON_OUTPUT_FILE` is set. It sets `process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1'` when it loads. That turns off the page snapshot taken when a failed test closes its context, and the setting reaches the workers.
- The login fixture gains `emptyFormUnlessSignedIn()`. It waits up to `TIMEOUTS.slowPage` for the URL to leave `login`, through `waitForURL`, which is not a matcher. If the URL has not left, it empties the email and password fields, skipping any field that is absent. The contestant spec calls it before its first assertion, so a refused sign-in is reported with an empty form.
- Corrected the docs:
  - the spec header comment
  - `tests/README.md` § Deployed smoke run: the inputs table loses `PLAYWRIGHT_HTML_OUTPUT_DIR`, and step 4 loses the html directory
  - § The contestant's account, rewritten: four measures, which modes they cover, and that the per-test output directory of any credentialed run is secret on a green run as on a red one and is never published, uploaded or attached
  - § In the pipeline: no HTML report is uploaded and the output directory is never uploaded
  - Step 22 of the staging Supabase README: the same secrecy rule
- Guards in `deployedSmokeGuards.test.ts`:
  - the reporters are only `list` and `json`, and `list` is present
  - `PLAYWRIGHT_NO_COPY_PROMPT` is `'1'` once the config has loaded
  - the contestant spec keeps `test.use({ trace: 'off', screenshot: 'off', video: 'off' })`

**Proof.** A scratch Playwright project under the ignored `tmp/186-review-fix/` imports the real deployed config. It spreads it, keeping its reporters, its env side effect and its project; turns the gate off; and collects scratch specs. The specs drive the real `createContestantLoginPage(page).signInFromCold(…)` against a page fulfilled by `page.route`, which has the real test ids and makes no network request. The values are fake: `fake-smoke-addr@example.invalid` and `FAKE-pw-7Qx9-not-a-real-one`. After each run, every file the run wrote was searched for both values, the HTML report's embedded zip included.

| Mode | Before (config at `9b871e793`) | After (`b9309a96d`) |
| --- | --- | --- |
| M5 passing sign-in | HTML report written; its embedded JSON has `Fill "FAKE-pw…"` (4 fill steps across the run, one per test) | No HTML report; no file holds either value |
| M1 refused sign-in, then `not.toHaveURL` fails | `error-context.md` snapshot: `textbox "Email": fake-smoke-addr…`, `textbox "Password": FAKE-pw…` | Snapshot shows `textbox "Email"` and `textbox "Password"` with no value, and the refusal sentence; neither value present |
| M2 refused sign-in, then `toBeVisible` fails | Both values in `error-context.md` | Neither value |
| M3 an action never completes with the form filled (test timeout) | Both values, in the context-close page snapshot | No page snapshot is written; neither value |
| M4 test times out inside `emptyFormUnlessSignedIn` | (not run before) | No page snapshot; neither value |
| `results.json`, `stdout.log` | Clean | Clean |

**Modes not covered, recorded honestly:**
- **M6, the control.** A matcher that fails while the form is still filled still writes both values into `error-context.md`. Measured after the fix. The spec has no such assertion: nothing asserts between the fill and `emptyFormUnlessSignedIn`. But an assertion added there later would leak, and no guard catches that. The README's rule that the output directory is always secret is the backstop.
- **Pages after sign-in.** It was not measured whether a page after sign-in, such as the home page checked by `expectTaskList`, shows the address. The home route's Svelte files do not mention `email`, but that was not checked against the hosted page.
- **CLI overrides.** A `--reporter html` given on the command line brings the HTML report back. A `--trace on` does not, because the file's `test.use` wins. The README forbids passing any reporter other than list or json to such a run, and no code enforces that.
- **`PLAYWRIGHT_LIST_PRINT_STEPS`.** This was checked and is not a leak path: the list reporter prints only `test.step` steps, never `pw:api` fill steps. A run under a pseudo-TTY with the variable forced on printed neither value. No override was added.

### WR-01: The gate follows redirects and pins no origin, so the password goes to whatever host `SMOKE_BASE_URL` names

**Files modified:** `tests/tests/utils/deployedTarget.ts`, `tests/tests/utils/deployedTarget.test.ts`, `tests/tests/utils/deployedSmokeGuards.test.ts`, `tests/tests/deployed/contestant.smoke.ts`, `tests/README.md`
**Commits:** `0884f27ad` (failing tests), `d72653774` (fix, shared with IN-02)
**Status:** fixed: requires human verification (a new security rule; please confirm the loopback allowance below)
**Applied fix:**
- **A new gate check, `origin`.** It comes second in `GATE_CHECK_ORDER`, which is now `service-role-key-absent, origin, sha, ref, project-id`. The base URL must parse, carry no user info, and be `https:`, or `http:` on exactly `localhost`, `127.0.0.1` or `[::1]`. `fetchDocument` now records `response.url`, and a response with no URL is a failed request. If `/api/health` or `/` is answered, after redirects, from another origin than the base URL's, the origin check fails, and so does every check that read that document. A redirect within the same origin is accepted.
- **The credential pin.** It is applied in the contestant spec, not in the gate. `requireCredentialOrigin(baseURL, repoRoot)` reads `public_origin` from `infra/envs/staging/supabase/terraform.tfvars`, the same `DEDICATED_SUPABASE_TFVARS` the gate already reads. It throws `SMOKE TARGET REFUSED: …` unless the base URL's origin is exactly that value. The spec calls it right after `requireSmokeInputs` and before any page action.
- **Where `public_origin` lives.** The committed staging AWS tfvars (`infra/envs/staging/aws/terraform.tfvars`) has no `public_origin` key; it has `domain = "staging.openvaa.org"` and `environment_values.ORIGIN = "https://staging.openvaa.org"`. The key and its value are in the staging Supabase tfvars, which the gate already parses with `readTfvarsValue`, so that is the one read. The same `^https://host[:port]$` rule as the Terraform variable's validation applies.
- **The voter spec** still accepts any origin the gate accepts, because it carries no secret.
- A guard in `deployedSmokeGuards.test.ts` asserts that the contestant spec calls `requireCredentialOrigin(baseURL, …)` before `signInFromCold(`.

**The local controls of plan 186-05.** All three ran their gate against `http://127.0.0.1:3186` (controls 2 and 3) or staging (control 1). Both are origins the new check accepts, and each answers from itself. So each control still fails on its own check alone. The headline is now `1 of 5 checks failed` rather than `1 of 4`, and an extra `PASS origin` line appears. The unit tests "fails only the sha / ref / project-id check" are that shape against a loopback stub, and they pass. The pin is not in the gate, so the gate still accepts a local build. Had a local build reached the contestant spec, the spec would have refused it before typing anything (`http://127.0.0.1:3186` and `http://localhost:5173` are both among its unit refusals). The evidence file `evidence/186-05-controls.md` is a record of runs made at the time and was not edited.

### WR-02: The shape check ignores top-level `testDir`/`testMatch`, so the config can be widened without any check failing

**Files modified:** `tests/tests/utils/deployedSmokeGuards.test.ts`, `tests/tests/utils/deployedTarget.ts` (TSDoc of `assertSmokeProjects`), `tests/README.md`
**Commit:** `c92eef229`
**Applied fix:** A guard asserts that `config.testDir` is `tests/tests/deployed`, that `String(config.testMatch)` is `/\.smoke\.ts$/`, and that no project sets its own `testDir` or `testMatch`. Two mutations were each seen failing exactly this test before being restored: `testMatch: /\.(smoke|setup)\.ts$/` and `testDir: TESTS_DIR`. The TSDoc of `assertSmokeProjects` now says it reads project entries only, and that the collection is pinned by the guard.

### IN-01: The privileged-key check refuses only two variable names

**Files modified:** `tests/tests/utils/deployedTarget.ts`, `tests/tests/utils/deployedTarget.test.ts`, `tests/README.md`
**Commits:** `f4de3ed7d` (failing tests), `c20540b96` (fix)
**Applied fix:** `FORBIDDEN_KEY_VARIABLES` now also lists `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `TF_VAR_database_password` and `PGPASSWORD`. The check keeps its name, `service-role-key-absent`, and each value stays withheld. In the README, the refusals list, the step 2 `unset`, the cause column of the table and the pipeline note were all updated.

### IN-02: A malformed `SMOKE_BASE_URL` throws a raw `TypeError`, not a gate failure

**Files modified:** as WR-01
**Commits:** `0884f27ad`, `d72653774`
**Applied fix:** The base URL is parsed once, in `readTarget`. If it does not parse, or if it carries user info, no request is made. The origin check fails with `(not an absolute URL: <value>)` or `(the base URL carries user info, value withheld)`. Every check that needed the target fails with `(request to … failed: not requested, the origin check refused the base URL)`. Global setup then throws the usual `DEPLOYED SMOKE GATE FAILED — 4 of 5 checks failed` message with its runbook pointer. Unit tests pass a recording `fetchImpl` and assert that no request was made; that `staging.openvaa.org`, the empty string and a URL with spaces each produce FAIL lines and no thrown error; and that the made-up user-info secret appears in no line and in no failure message.

### IN-03: `SMOKE_ELECTION_COUNT` is exported and has no consumer

**Files modified:** `tests/tests/deployed/smokeContent.ts`
**Commit:** `68c4d8045`
**Applied fix:** It is now a module-local `const electionCount`, beside `constituencyCount`, and the module's load-time assertion is unchanged. A grep across the repository found no other reference to the old name.

## Deferred

### IN-04: The identity is proven once, before the specs, and not again

**File:** `tests/deployed-global-setup.ts:24-27`
**Disposition:** deferred to phase 187, as the orchestrator directed. A deploy that lands while the specs run is a risk of the pipeline phase 187 builds, where deploy and smoke are chained. The fix belongs with that chaining: either a read-only re-check of `/api/health` after the specs, or the window documented in § Reading the gate. Nothing was changed for it here.

## Verification

All of these ran in the main checkout with `PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`. Each status was read directly, never through a pipe.

| Gate | Result |
| --- | --- |
| `node_modules/.bin/vitest run --config tests/vitest.config.ts deployed` | exit 0: 2 files, 127 tests passed. 87 before the fixes; the new cases are the reporter, spec and collection guards, the IN-01 names, the origin matrix, the unparsable base URL and `readPublicOrigin`/`requireCredentialOrigin` |
| `yarn typecheck:tests` | exit 0 |
| `node_modules/.bin/eslint` on the 7 changed test files | exit 0, no errors. The one warning is that `tests/playwright.deployed.config.ts` is ignored, which is its existing `playwright*` lint ignore |
| `node scripts/assert-comment-hygiene.mjs` | exit 0, 0 violations |
| `prettier --check` on all 9 changed files | exit 0 |
| `yarn test:e2e:deployed --list --reporter=list` | exit 0, `Total: 2 tests in 2 files` |
| Read-only voter run against staging: `SMOKE_EXPECTED_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30 yarn test:e2e:deployed tests/tests/deployed/voter.smoke.ts`, with no contestant inputs and every refused variable unset; run dir `tests/e2e-runs/186-review-fix-voter-20261115T002136Z` | `smoke_exit=0`. Gate lines `PASS service-role-key-absent`, `PASS origin`, `PASS sha`, `PASS ref`, `PASS project-id`, then `DEPLOYED SMOKE GATE OK build=712947a1… ref=cofbsatfrdysyphajsky project=00000000-0000-0000-0000-000000000001`, then `1 passed`. `VERDICT OK: 1 tests -- passed 1, failed 0, flaky 0, skipped 0, did not run 0`, `verdict_exit=0`. No HTML report was written, either in the run dir or at `tests/playwright-deployed-report` |

The full local E2E suite was not run, as instructed; the orchestrator re-runs the closing gate. Nothing was written to any hosted service: the voter run and one earlier `curl` of `/` and `/api/health` on staging were GET requests only. The `curl` showed that both answer 200 with no redirect.

---

_Fixed: 2026-11-15T00:25:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
