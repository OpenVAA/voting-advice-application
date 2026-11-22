# Phase 186: Deployed Smoke Entry - Pattern Map

**Mapped:** 2026-11-15
**Files analyzed:** 13 (10 new, 3 modified docs/config + 1 modified script entry)
**Analogs found:** 12 / 13

Anchors below are content anchors (function names, quoted lines). Line numbers are as of 2026-11-15 and are a hint only; re-derive at run time.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `tests/tests/utils/deployedTarget.ts` (new) | utility (pure gate) | request-response | `tests/tests/support/preflight.ts` + `extractServedProjectId`/`assertServedProject` in `tests/global-setup.ts` | exact |
| `tests/tests/utils/deployedTarget.test.ts` (new) | test (vitest) | request-response (stub server) | `tests/tests/utils/preflight.test.ts` | exact |
| `tests/tests/utils/deployedSmokeGuards.test.ts` (new) | test (vitest, file scan) | file-I/O | `tests/tests/utils/preflight.test.ts` (structure); config-load guards in `tests/playwright.config.ts` | role-match |
| `tests/deployed-global-setup.ts` (new) | config / setup | request-response | `tests/global-setup.ts` (default export) | role-match (copy shape, never import) |
| `tests/playwright.deployed.config.ts` (new) | config | n/a | `tests/playwright.config.ts` | role-match |
| `tests/tests/deployed/voter.smoke.ts` (new) | test (Playwright spec) | request-response | `tests/tests/specs/voter/analytics-privacy.spec.ts` + `navigateToFirstQuestion` in `tests/tests/utils/voterNavigation.ts` | role-match |
| `tests/tests/deployed/contestant.smoke.ts` (new) | test (Playwright spec) | request-response | `tests/tests/specs/contestant/contestant-journey.spec.ts` (logout ~line 901) + `signInFromCold` fixture | role-match |
| `tests/tests/deployed/smokeContent.ts` (new) | utility (transform) | transform | `packages/dev-seed/src/templates/smoke.ts` (`STATEMENTS`) | partial |
| `infra/scripts/grant-smoke-contestant.sql` (new) | migration-like script | CRUD (one hosted write) | `infra/scripts/grant-project-admin.sql` | exact |
| `tests/eslint.config.mjs` (modify) | config | n/a | same file, `playwright/no-restricted-locators` block and per-glob override blocks | exact |
| `package.json` (modify: `test:e2e:deployed`) | config | n/a | `"test:e2e"` / `"test:e2e:probes"` scripts | exact |
| `infra/envs/staging/supabase/README.md` (modify: Step 22 + Observations) | docs | n/a | same file `### Step 22: The smoke dataset` | exact |
| `tests/README.md`, `CLAUDE.md` Testing line (modify) | docs | n/a | `tests/README.md` § Run; CLAUDE.md `yarn test:e2e` lines | exact |

Must stay byte-identical: `tests/playwright.config.ts`, `tests/global-setup.ts`, `tests/tests/support/preflight.ts`.

## Pattern Assignments

### `tests/tests/utils/deployedTarget.ts` (utility, request-response)

**Analog:** `tests/global-setup.ts` `extractServedProjectId` / `assertServedProject` (copy, do not import).

Attribute parse (global-setup.ts ~27-30):
```typescript
function extractServedProjectId(html: string): string | null {
  const match = new RegExp(`${SERVED_PROJECT_ATTRIBUTE}="([^"]*)"`).exec(html);
  return match ? match[1].trim().toLowerCase() : null;
}
```
Reason ladder that treats absent attribute and `%projectId%` placeholder as failure (~49-56):
```typescript
const reason =
  served === null
    ? `the served document carries no ${SERVED_PROJECT_ATTRIBUTE} attribute, ...`
    : served === SERVED_PROJECT_PLACEHOLDER.toLowerCase()
      ? `the served document still carries the literal ${SERVED_PROJECT_PLACEHOLDER} placeholder, ...`
      : served === expectedProjectId ? null : 'the served application queries a different project than this suite seeds';
```
Field-by-field failure shape (~64-72): `observed …` / `expected …` aligned lines inside one thrown Error. Adapt to the CONTEXT format: one `PASS <check>` / `FAIL <check>: observed …, expected …` line per check, all evaluated, then one throw. Check order: service-role key absent, SHA, ref, project id.

Module shape: take `env`, `baseURL`, `repoRoot`, injectable `fetch` as arguments (as `assertServedApp({ baseURL, repoRoot, deadlineMs, pollIntervalMs })` in `preflight.ts` does) and return evaluated checks. The tfvars parse reads `infra/envs/staging/supabase/terraform.tfvars` (`project_ref`, `public_project_id`) at run time; no argument may override the ref. Ref check: host of `PUBLIC_SUPABASE_URL` in the SvelteKit `env` block must equal `${project_ref}.supabase.co`; fail closed on missing block / unparsable URL. Also house the config-shape check (no `dependencies`, no setup/teardown project name) so the config and the guard test share it.

---

### `tests/tests/utils/deployedTarget.test.ts` (vitest, stub server)

**Analog:** `tests/tests/utils/preflight.test.ts`

Imports (lines 1-9):
```typescript
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
```
Repo root: `const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');`
Stub server (`startStub`, ~41-66): `createServer` answering per `req.url`, `server.listen(0, …)` and resolving `http://localhost:${port}`; for this phase serve `/api/health` JSON `{ build }` and `/` HTML with `<body data-project-id="…">` plus a SvelteKit `env` block. Teardown in `afterEach` closing `server`. Cases required: made-up ref, `begckvkapaopoztbreqc`, local URL, non-`supabase.co` host, missing env block, wrong SHA, set `SUPABASE_SERVICE_ROLE_KEY`, and "no input widens the allowed ref". Location must be `tests/utils/**/*.test.ts` (vitest include in `tests/vitest.config.ts`), picked up by `yarn test:unit:tests`.

---

### `tests/tests/utils/deployedSmokeGuards.test.ts` (vitest, file-I/O)

**Analog:** structure of `preflight.test.ts`; guard rationale from `tests/playwright.config.ts` ORPHAN-PROBE GUARD (`fs.readdirSync(probesDir).filter(...)` then throw naming the files). Scan `.github/workflows/**`, `tests/playwright.deployed.config.ts`, `tests/deployed-global-setup.ts`, `tests/tests/deployed/**` for `DEV_SEED_ALLOW_REMOTE`, `allow-remote`, `allowRemote`; import the deployed config and assert the shape check. Use `REPO_ROOT` as above.

---

### `tests/playwright.deployed.config.ts` (config)

**Analog:** `tests/playwright.config.ts`

Import header to copy minus dotenv (lines 1-9):
```typescript
import { defineConfig, devices } from '@playwright/test';
import { TIMEOUTS } from './tests/helpers/timeouts';
```
Do NOT copy `import dotenv from 'dotenv'; dotenv.config();` (CONTEXT: no root `.env`). Config-load guard pattern (ORPHAN-PROBE / SOFT-ASSERTION guards): plain top-level code that throws at load, so `--list` fails too. Settings: one project `deployed-smoke`, `devices['Desktop Chrome']`, `workers: 1`, `fullyParallel: false`, `retries: 0`, `trace: 'retain-on-failure'`, `testDir: './tests/deployed'`, `testMatch: /\.smoke\.ts$/`, `globalSetup: './deployed-global-setup.ts'`, `baseURL` from `SMOKE_BASE_URL ?? 'https://staging.openvaa.org'`. Research Pitfalls 1-4: HTML reporter `open: 'never'`, no JSON reporter to stdout, mind ESLint ignore `playwright*` hides this file.

---

### `tests/deployed-global-setup.ts` (setup)

**Analog:** default export of `tests/global-setup.ts` (~line 94 `await assertServedProject({ baseURL, expectedProjectId: resolveE2eProjectId() });`). Thin adapter: read `config.projects[0].use.baseURL`, call the gate from `deployedTarget.ts`, print lines, throw on any FAIL. No `SupabaseAdminClient`, no `ensureProject()`.

---

### `tests/tests/deployed/voter.smoke.ts` (spec)

**Analog:** `tests/tests/utils/voterNavigation.ts` `navigateToFirstQuestion` (~286-295):
```typescript
const voterHomePage = createVoterHomePage(page);
await voterHomePage.goToPage('en');
await voterHomePage.clickStart();
await walkVoterStages(page, ['question']);
const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();
await answerOption.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
```
Import style from `analytics-privacy.spec.ts` (~37-45): `import { expect, test } from '@playwright/test';`, relative `../../fixtures/voter/...`, `../../helpers`, `../../utils/testIds`. Header comment with "Rigidity contract … every assertion is hard". Use `walkVoterStages`/`resolveVoterStage`, not `answeredVoterPage`. Assert first question text equals `SMOKE_STATEMENTS[0]`, results show candidate cards. Use `getByTestId` only (ESLint forbids `getByText`/`locator`).

---

### `tests/tests/deployed/contestant.smoke.ts` (spec)

**Analog:** `tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts` `signInFromCold(email, password)` (~123-143; retries the sign-in route until the form shows, then `this.login`). Logout: `contestant-journey.spec.ts` ~901 `await contestantLogoutButton.clickWithoutDialog();` (fixture `contestantLogoutButton.fixture.ts`). Do NOT import from `contestant-journey` fixture barrel (pulls `SupabaseAdminClient`, see journey spec line 70); instantiate `createContestantLoginPage(page)`, `createContestantHomePage(page)`, `createContestantLogoutButton(page)` directly. Credentials from `SMOKE_CONTESTANT_EMAIL`/`SMOKE_CONTESTANT_PASSWORD`; never log them.

---

### `tests/tests/deployed/smokeContent.ts` (transform)

**Source:** `packages/dev-seed/src/templates/smoke.ts` (`STATEMENTS`, `questions` mapped from it). Relative import of the module (barrel `@openvaa/dev-seed` re-exports the admin client and does not export `smokeTemplate`). Narrow `smokeTemplate.questions?.fixed?.map(q => q.name)` to `{ en: string }`, throw otherwise, keep `sort_order` order.

---

### `infra/scripts/grant-smoke-contestant.sql` (hosted write)

**Analog:** `infra/scripts/grant-project-admin.sql` (copy whole skeleton)

- Header block: purpose, `Run: psql -X -f …`, the two rules (libpq env vars only; never `-v` or URL), Environment list, exit statuses 0/2/3, Output line, "address is never printed".
- Prelude: `\set ON_ERROR_STOP on`, `\set QUIET on`, `SET log_parameter_max_length_on_error = 0;`
- Env read per variable: `\unset x` / `\getenv x ENV` / `\if :{?x} \else \set x '' \endif`
- Missing check with address as bound param: `SELECT btrim(coalesce($1, '')) = '' AS …_missing \bind :email \gset`, `\warn` each, then `RAISE EXCEPTION … nothing was written`.
- `BEGIN;` → project exists (`:'project_id'::uuid`) → user lookup `WHERE lower(email) = lower($1) \bind :email \gset` with `no_user` / `many_users` refusals → insert `ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING` → `COMMIT;` → count readback `\echo grants=:…`.
- Differences: `scope 'entity'`, `target_type 'candidate'`, `role 'editor'`, target = `smoke_` candidate with lowest `external_id` having a nomination; refuse if another user already edits it (`idx_grants_one_candidate_editor`); add idempotent terms-of-use acceptance; echo `grants=1`, `terms=1`.

---

### `tests/eslint.config.mjs` (modify)

**Analog:** same file. Add a new block in the per-glob override style (`{ files: ['**/utils/**/*.test.ts'], rules: {...} }`) scoped to `tests/deployed/**`, `deployed-global-setup.ts`, `utils/deployedTarget.ts` with `no-restricted-imports` `patterns` forbidding value imports of `**/supabaseAdminClient`, `**/authApi`, `**/accountAccessClient`, dev-seed admin client (`allowTypeImports: true`), message as in RESEARCH Pattern 8. Note `ignores: ['playwright*', …]` excludes `playwright.deployed.config.ts` from lint; do not change that ignore.

---

### `package.json` (modify)

Beside `"test:e2e:probes": "playwright test -c ./tests/playwright.config.ts --project=_probes",` add `"test:e2e:deployed": "playwright test -c ./tests/playwright.deployed.config.ts"`. No `yarn assert:*` prefix needed (local-only asserts).

---

### Docs

- `infra/envs/staging/supabase/README.md` `### Step 22: The smoke dataset` (~1260): follow its "Secrets:" line, numbered steps with fenced `bash` export blocks, and removal command; add a dated row under `## Observations` (~1475).
- `tests/README.md`: new "Deployed smoke run" section next to § Run.
- `CLAUDE.md` Testing block: one line `yarn test:e2e:deployed …` in the existing comment-aligned style.

## Shared Patterns

- **Fail-closed field-by-field errors:** `assertServedProject` in `tests/global-setup.ts`; apply to gate and config-shape check.
- **Config-load guards that throw (so `--list` fails):** ORPHAN-PROBE and SOFT-ASSERTION guards in `tests/playwright.config.ts`; apply to `playwright.deployed.config.ts`.
- **Pure module + vitest stub-server test:** `preflight.ts` / `preflight.test.ts`; apply to `deployedTarget.ts`.
- **No admin client in smoke tree:** only `import type` from `supabaseAdminClient` (as `contestantLoginPage.fixture.ts` line ~59); enforced by ESLint block.
- **Hosted SQL hygiene:** env-only, bound params for addresses, counts-only output (`grant-project-admin.sql`).
- **Comment hygiene:** no phase/plan/D-NN refs in code comments (CLAUDE.md).
- **Exit status read directly, never through a pipe.**

## No Analog Found

| File | Role | Reason |
|---|---|---|
| SvelteKit `env`-block parse inside `deployedTarget.ts` | utility | Nothing in the tests tree parses the served `env` block; use RESEARCH Pattern 2 |

## Metadata

**Search scope:** `tests/`, `infra/scripts/`, `infra/envs/staging/supabase/README.md`, `packages/dev-seed/src/templates/`, root `package.json`
**Files scanned:** ~14
**Date:** 2026-11-15
