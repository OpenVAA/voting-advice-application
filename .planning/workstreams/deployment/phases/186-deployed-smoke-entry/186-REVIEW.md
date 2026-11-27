---
phase: 186-deployed-smoke-entry
reviewed: 2026-11-15T00:01:18Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - infra/scripts/grant-smoke-contestant.sql
  - package.json
  - tests/deployed-global-setup.ts
  - tests/eslint.config.mjs
  - tests/playwright.deployed.config.ts
  - tests/tests/deployed/contestant.smoke.ts
  - tests/tests/deployed/smokeContent.ts
  - tests/tests/deployed/voter.smoke.ts
  - tests/tests/utils/deployedSmokeGuards.test.ts
  - tests/tests/utils/deployedTarget.test.ts
  - tests/tests/utils/deployedTarget.ts
  - tests/README.md
  - CLAUDE.md
  - infra/envs/staging/supabase/README.md
  - .prettierignore
findings:
  critical: 1
  warning: 2
  info: 4
  total: 7
  necessity: 0
status: issues_found
---

# Phase 186: Code Review Report

**Reviewed:** 2026-11-15T00:01:18Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

I reviewed `git diff 89d9873a8..HEAD` for the deployed smoke entry: the gate module, global setup, the second Playwright config, the two smoke specs and their content module, the two guard test files, the ESLint lock, the grant SQL, and the matching docs. None of these files changed between the review snapshot (`1bf1c6400`) and HEAD (`f9e711014`, a phase-187 docs commit).

What I verified, and how:
- Both unit files pass (87 tests). ESLint on the smoke files exits 0.
- `yarn test:e2e:deployed --list` works with an empty environment and prints `Total: 2 tests in 2 files`.
- I rebuilt the value-import walk by hand. It reaches 27 files. None is a service-role client, a Supabase client package, `dotenv` or the dev-seed barrel. None reads `DEV_SEED_ALLOW_REMOTE`.
- I ran the grant SQL's three refusal paths against the local Postgres, none of which writes: missing env, malformed uuid, and unknown address. Each exits 3. No error names the address.
- psql's `\bind` passes an empty value and a value with a space as one parameter.
- The SQL's objects exist in the schema: the `grants_user_scope_target_role_key` constraint, the `idx_grants_one_candidate_editor` index, the `(user_id, project_id)` primary key, and `ON DELETE CASCADE` on both `user_id` columns.

The gate is fail-closed on every input I traced. That covers an unset or short SHA, a non-200 health response, a missing env line, `env: null`, a non-https URL, a URL with a port, credentials, query or path, a foreign label, an absent attribute and the placeholder. No environment variable can widen the ref or the project id, because both come only from the committed tfvars.

The one blocker is credential leakage, and I confirmed it with Playwright 1.63 (the installed version) in a scratch experiment:
- **On every run, green or red,** the HTML reporter writes the contestant's password and address into the report as step titles (`Fill "<password>"`).
- **On a failed test,** Playwright writes `error-context.md`, whose accessibility snapshot holds the value of every filled input, the password field included.

The spec's comment and `tests/README.md` both say otherwise.

The `necessity-review.md` reference was read. No finding meets its evidence rule.

## Critical Issues

### CR-01: The contestant's password and address end up in plaintext in the HTML report on every run, and in `error-context.md` on any failure

**File:** `tests/playwright.deployed.config.ts:26`, `tests/tests/deployed/contestant.smoke.ts:8,20`, `tests/README.md` (§ The contestant's account; § Running it from a workstation, step 4)

**Issue:** `test.use({ trace: 'off', screenshot: 'off', video: 'off' })` does not keep the typed credentials out of the run's artifacts. I measured this with `@playwright/test` 1.63.0: a spec that fills an email and a password field from the environment, with trace, screenshot and video all off.

1. **HTML report, passing run.** The report's embedded data holds `{"title":"Fill \"someone@example.com\"" …}` and `{"title":"Fill \"Hunter2-SECRET\"" …}`. Playwright titles each `locator.fill` step with the value it typed. The deployed config always adds the `html` reporter (line 26), and step 4 of the README runbook writes that report to `$RUN/html`. So every contestant run, green ones included, leaves the hosted password in plaintext in `tests/playwright-deployed-report/` or `$RUN/html/`. The README only forbids publishing directories of failed runs. Phase 187 is about to run this command in CI, where uploading the HTML report is the usual default.
2. **`error-context.md`, failing run.** When a test fails while the sign-in form is still filled, the accessibility snapshot in `error-context.md` holds `- textbox "Email": <address>` and `- textbox "Password": <password>`. A refused sign-in is the most likely way for this spec to fail, and the form stays filled. Playwright's `toAriaNode` sets `children = [element.value]` for every input that is not a checkbox, radio or file, which includes `type="password"`. `PLAYWRIGHT_NO_COPY_PROMPT=1` suppresses only the context-close snapshot: when a matcher fails (`toBeVisible`, `toHaveURL`), the matcher's own aria snapshot is still written. I measured this too.
3. The docs say the opposite. The spec comment says "the typed credentials reach no artifact of the run". The README says the snapshot "can include the address typed into it", which leaves out the password, and its rule that a directory is never published covers only failed runs. The JSON report and stdout were clean in both experiments.

**Fix:**
```ts
// tests/playwright.deployed.config.ts
// The html reporter titles each fill step with the value typed, so a smoke run writes none.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';
...
reporter: [
  ['list'],
  ...(process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ? [['json'] as const] : [])
],
```
Add these as well:
- A guard in `deployedSmokeGuards.test.ts` that the deployed config has no `html` reporter.
- Treat the per-test output directory (`--output`, default `tests/playwright-deployed-results`) as secret on every run: keep it out of the run directory that gets quoted or uploaded, and delete it when the run ends. Or have the sign-in form clear its password field when a sign-in is refused, so a failure snapshot taken on the form holds no password.
- Correct the comment in `contestant.smoke.ts` and both README paragraphs. In Phase 187, never upload the output directory or any HTML report from the smoke step.

## Warnings

### WR-01: The gate follows redirects and pins no origin, so the password goes to whatever host `SMOKE_BASE_URL` names

**File:** `tests/tests/utils/deployedTarget.ts:283`, `tests/playwright.deployed.config.ts:30`, `tests/tests/deployed/contestant.smoke.ts:27`

**Issue:** `fetchDocument` uses `redirect: 'follow'`, so the gate checks the document at the end of the redirect chain, not the origin the specs then drive. A host that redirects only `/api/health` and `/` to staging, or a reverse proxy in front of staging, passes all four checks. The contestant spec then types the real password into that host's sign-in page. Nothing requires `https:` either: `SMOKE_BASE_URL=http://…` is accepted, and the password then crosses the network in cleartext. The README says "a target is accepted by the project it serves". That proves which Supabase project is behind the target, not who controls the origin receiving the credentials. The committed tfvars the gate already reads also declares `public_origin = "https://staging.openvaa.org"`, which could be used as the pin.

**Fix:** Fetch with `redirect: 'manual'`, or compare `new URL(response.url).origin` with `new URL(baseURL).origin` and fail the check when they differ. Then either fail the gate, or refuse in `contestant.smoke.ts` through a check shaped like `requireSmokeInputs`, unless `new URL(baseURL).origin` equals `public_origin` read from `DEDICATED_SUPABASE_TFVARS` with the same `readTfvarsValue`. The voter spec carries no secret and can keep accepting any origin.

### WR-02: The shape check ignores top-level `testDir`/`testMatch`, so the config can be widened without any check failing

**File:** `tests/tests/utils/deployedTarget.ts:349-378`, `tests/tests/utils/deployedSmokeGuards.test.ts:211-224`, `tests/playwright.deployed.config.ts:15-16`

**Issue:** `assertSmokeProjects` says it refuses "a deployed smoke configuration that could run anything but the read-mostly smoke specs". It only reads `projects[]`. The guard test checks the projects plus `retries`, `workers`, `fullyParallel`, `globalTeardown`, `webServer` and `globalSetup`, but not `testDir`, `testMatch` or `testIgnore`. If someone changes the top-level `testDir` to `TESTS_DIR`, or `testMatch` to `/\.(smoke|setup)\.ts$/`, the deployed entry collects the local suite's `*.setup.ts` files, the ones that use the service-role client. Every check stays green: neither the lint lock nor the import walk looks at files collected by glob.

**Fix:** In `deployedSmokeGuards.test.ts`, assert `config.testDir === path.join(TESTS_ROOT, 'tests', 'deployed')`, `String(config.testMatch) === String(/\.smoke\.ts$/)`, and that no project sets its own `testDir`. Or pass the top-level `testDir`/`testMatch` to `assertSmokeProjects` and refuse any other value at config load.

## Info

### IN-01: The privileged-key check refuses only two variable names

**File:** `tests/tests/utils/deployedTarget.ts:23`
**Issue:** `FORBIDDEN_KEY_VARIABLES` covers `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_SECRET_KEY`. A smoke step that inherits `SUPABASE_ACCESS_TOKEN` (the Management API token, which is broader than a service-role key), `SUPABASE_DB_PASSWORD`, `TF_VAR_database_password` or `PGPASSWORD` passes `service-role-key-absent`. The Step 22 sitting of the staging README unsets every one of these by hand. No smoke code path reads them, so this is a tripwire gap, not a reachable client.
**Fix:** Add those names to the list, which the README's refusal list mirrors. Or rename the check to say exactly what it covers.

### IN-02: A malformed `SMOKE_BASE_URL` throws a raw `TypeError`, not a gate failure

**File:** `tests/tests/utils/deployedTarget.ts:313-316`
**Issue:** `new URL('/api/health', baseURL)` is evaluated outside `fetchDocument`'s `try`. A value such as `staging.openvaa.org` (no scheme) aborts global setup with `TypeError: Invalid URL`, with no `DEPLOYED SMOKE GATE FAILED` headline and no runbook pointer. It still fails closed.
**Fix:** Parse `baseURL` once at the top of `runDeployedGate`, then throw `` `${DEPLOYED_GATE_HEADLINE} — SMOKE_BASE_URL is not an absolute URL` `` or return FAIL lines.

### IN-03: `SMOKE_ELECTION_COUNT` is exported and has no consumer

**File:** `tests/tests/deployed/smokeContent.ts:33`
**Issue:** Nothing outside the module imports it. Only the module's own load-time assertion reads it.
**Fix:** Make it a module-local `const`, like `constituencyCount`.

### IN-04: The identity is proven once, before the specs, and not again

**File:** `tests/deployed-global-setup.ts:24-27`
**Issue:** The SHA, ref and project id are read once in global setup. A deploy that lands while the specs run, which is plausible when Phase 187 chains deploy and smoke, means the specs drive a build the gate never saw. The `PASS sha` line then speaks for a build the specs never drove.
**Fix:** Re-read `/api/health` in a final step, for example a global teardown that only reads, and fail when `build` no longer equals `SMOKE_EXPECTED_SHA`. Or document the window in § Reading the gate.

---

_Reviewed: 2026-11-15T00:01:18Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
