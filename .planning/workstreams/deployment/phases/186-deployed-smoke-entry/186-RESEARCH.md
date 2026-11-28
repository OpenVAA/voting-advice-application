# Phase 186: Deployed Smoke Entry - Research

**Researched:** 2026-11-14 (late evening) to 2026-11-15, against the tree at `a7a4222a8` and read-only requests to `https://staging.openvaa.org` and its public Supabase REST endpoint
**Domain:** Playwright second entry (config + global-setup gate), hosted read-mostly smoke, one out-of-band hosted write (psql + Auth Admin API)
**Confidence:** HIGH for the harness mechanics (each probed this session); MEDIUM for the contestant half (it can only be observed after the operator-gated hosted write)

<user_constraints>
## User Constraints (from CONTEXT.md)

CONTEXT.md marks every decision as the ★ RECOMMENDED option of `186-DISCUSSION-POINTS.md`, unreviewed by the operator, who may overrule any of them before execution (CONTEXT.md is then rewritten from the fill).

### Locked Decisions

#### The target gate
- The dedicated project is identified by two checks: the host of `PUBLIC_SUPABASE_URL` in the served page's SvelteKit `env` block must be exactly `<project_ref>.supabase.co`, with `project_ref` read at run time from `infra/envs/staging/supabase/terraform.tfvars`; and `<body data-project-id>` must equal `public_project_id` from the same file. The check fails closed on a missing `env` block, an unparsable URL or a foreign host. No input can name another ref. The frontend does not change. — **Reversibility:** costly — phase 187's pipeline and the negative-control evidence build on this identity model, and the alternative (an explicit `data-supabase-ref` attribute) needs a frontend change, a new image and a redeploy.
- The admin client is not parameterised for hosted use, though the roadmap's research flag says it should be. The smoke entry holds no service-role client: the gate refuses a set `SUPABASE_SERVICE_ROLE_KEY`, and an ESLint `no-restricted-imports` rule on the smoke files forbids value imports of `tests/tests/utils/supabaseAdminClient`, `authApi`, `accountAccessClient` and dev-seed's admin client. The phase records this as its reading of the flag. — **Reversibility:** costly — if the reading is overruled, a hosted-capable service-role client enters the tests tree, and success criterion 3 and the 187 workflows have to be re-guarded.
- The expected SHA is a required input, `SMOKE_EXPECTED_SHA`, with no default: a full 40-hex id compared exactly with `/api/health` `build`. From a workstation it is taken from `image_tag` in `infra/envs/staging/aws/terraform.tfvars`. In 187 it is the commit the pipeline built.

#### The second entry
- The gate's checks are evaluated together, each printing `PASS <check>` or `FAIL <check>: observed …, expected …`, and global setup throws before any spec if one failed. The checks are, in order: service-role key absent, SHA, ref, project id. The gate reads only `/api/health` and `/`.
- `SMOKE_BASE_URL` defaults to `https://staging.openvaa.org`, with no host allowlist: safety rests on the served project.

#### What the run does
- The run reads the `smoke` dataset already seeded on the persistent project (184 D-18), plus one contestant. There is no second content seed. The specs take their expected content (the six statements, one election) from the `smokeTemplate` module. — **Reversibility:** costly — any other dataset means a hosted seed sitting and a prefix teardown against the hosted database, and replacing `smoke` would remove the dataset of more than 1000 rows that the conformance probe reads.
- The contestant's address and password are inputs, `SMOKE_CONTESTANT_EMAIL` and `SMOKE_CONTESTANT_PASSWORD`. Neither is committed, printed or put in the evidence. On a workstation they come from the operator's keychain; in 187 from GitHub Environment secrets. — **Reversibility:** costly — committing an address to a public repository cannot be undone by a later commit.

#### The one-time hosted seeding
- Written once, out of band: one auth user created with `POST /auth/v1/admin/users` (password, `email_confirm: true`, an address outside `openvaa.test`), then a new committed `infra/scripts/grant-smoke-contestant.sql`, modelled on `grant-project-admin.sql`. The SQL writes the candidate-editor grant on the `smoke_` candidate with the lowest `external_id` that has a nomination, and the terms-of-use acceptance. It uses env-only inputs and no `-v`, is idempotent, prints counts only, and refuses unless exactly one user has the address and the candidate and project exist. No dev-seed, no `--allow-remote`. The step and its removal go in Step 22 of `infra/envs/staging/supabase/README.md`. — **Reversibility:** costly — it writes an account with a password into the persistent hosted project, reachable from a public URL. Removing it is a hosted delete, and the seed check and the probe have to be re-read afterwards.
- The orchestrator runs the step from this workstation, at a checkpoint the operator approves, with the service-role key and the database password from the operator's keychain (184 sitting pattern). A prelude refuses any ref but `cofbsatfrdysyphajsky` and unsets every unnamed credential. The step reads back `grants=1`, `terms=1` and a password sign-in with status 200, and prints no address, password or token. The executor writes the code and holds no credential. — **Reversibility:** one-way — a hosted write cannot be un-run, only compensated, so it is operator-gated. The contestant half of the green run waits for this approval; the voter half and every negative control do not.
- The password is generated in the sitting (`openssl rand`, 32 bytes, base64url), passed only through the environment, and stored in the operator's keychain under `openvaa-staging-smoke-contestant`.

#### Decided autonomously
- [Second entry] Q: 'Where do the files go?' → Selected: 'tests/playwright.deployed.config.ts, tests/deployed-global-setup.ts, specs as tests/tests/deployed/*.smoke.ts, pure logic in tests/tests/utils/deployedTarget.ts with a vitest test, root script test:e2e:deployed; local --list count unchanged and no deployed/ path in it' — new files only, and they can be moved without touching any local file.
- [Second entry] Q: 'Does the deployed config load the root .env?' → Selected: 'No; it reads only its named inputs, and a missing one is named' — a single line in one new file.
- [Second entry] Q: 'Projects and run settings?' → Selected: 'one project deployed-smoke, Desktop Chrome, no dependencies, workers 1, fullyParallel false, retries 0 in CI too, trace retain-on-failure, output directory from the command line; a config-load check throws on dependencies or a setup/teardown name' — config of a new file.
- [Second entry] Q: 'A wrapper script?' → Selected: 'No; yarn test:e2e:deployed is called directly and its exit status read directly; a run interrupted by host sleep is made again under a new output directory' — a wrapper can be added later without changing the entry.
- [Run] Q: 'How is the voter walk driven?' → Selected: 'walkVoterStages / resolveVoterStage and the voter page objects, not answeredVoterPage; assert the first question text equals the template statement and that results show candidate cards' — confined to the new spec.
- [Run] Q: 'What does the contestant part do?' → Selected: 'password sign-in via createContestantLoginPage(page).signInFromCold, assert the candidate home, sign out, edit nothing' — confined to the new spec.
- [Controls] Q: 'How are the three negative controls produced?' → Selected: 'wrong SHA against staging; a local production build of the deployed tree with BUILD_SHA = deployed SHA started against the hosted URL and publishable key with another PUBLIC_PROJECT_ID (only project-id fails); the same build against the local stack (only the ref fails); each exit status read directly, the FAIL line quoted' — evidence procedure only, no code contract.
- [Controls] Q: 'How is cannot-point-at-production shown?' → Selected: 'unit test of deployedTarget.ts refusing a made-up ref, the deleted throwaway begckvkapaopoztbreqc, a local URL, a non-supabase.co host and a missing env block, and asserting no input widens the allowed ref' — a test file.
- [Controls] Q: 'How are DEV_SEED_ALLOW_REMOTE and setup projects kept out?' → Selected: 'a unit test under yarn test:unit scanning .github/workflows/**, the deployed config, its global setup and tests/tests/deployed/** for DEV_SEED_ALLOW_REMOTE, allow-remote, allowRemote, and loading the deployed config to refuse dependencies or setup/teardown names' — a test file.
- [Controls] Q: 'How is success criterion 4 shown?' → Selected: 'empty git diff over tests/playwright.config.ts, tests/global-setup.ts, tests/tests/support/preflight.ts across the phase; unchanged --list count; targeted checks in plans and one full tests/scripts/e2e-run.sh run at phase end; a void run is made again' — verification procedure.
- [Records] Q: 'Where do the how-to and observations live?' → Selected: 'contestant step in Step 22 of infra/envs/staging/supabase/README.md with a dated Observations row; a Deployed smoke run section in tests/README.md; one line in CLAUDE.md Testing; raw evidence in 186-*/evidence/' — documentation placement.
- [Records] Q: 'Fold pending todos?' → Selected: 'none' — todos stay where they are.

### Claude's Discretion

CONTEXT.md has no separate "Claude's Discretion" section. The "Decided autonomously" rows above were decided by the discuss step within its own discretion and are treated as locked here. Areas this research had to fill in (marked "Recommendation" below): the exact shape of the pure module's API, the ESLint rule's form, how the contestant spec behaves without its inputs, how the evidence keeps the credentials out, and the order of plans around the operator checkpoint.

### Deferred Ideas (OUT OF SCOPE)

- Wiring the smoke run into the pipeline as its last stage, and observing it fail a deploy: phase 187 (PIPE-07, PIPE-09).
- An explicit `data-supabase-ref` attribute on the HTML root, if reading the SvelteKit `env` block proves fragile across a SvelteKit upgrade.
- The contestant sign-in through bank authentication (A4), and an automated mail round trip (E2).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SUPA-09 | Tests run against a dedicated hosted project and never against a production one. [VERIFIED: .planning/workstreams/deployment/REQUIREMENTS.md:86 — "- [ ] **SUPA-09**: Tests run against a dedicated hosted project and never against a production one."] | The served `env` block carries `"PUBLIC_SUPABASE_URL":"https://cofbsatfrdysyphajsky.supabase.co"` and `data-project-id="00000000-0000-0000-0000-000000000001"` (observed, § Summary). The gate compares both with the committed tfvars, which no input can override; `deployedTarget.test.ts` proves every other ref, host and shape is refused (§ Pattern 2, § Validation Architecture). |
| PIPE-07 (builds toward; wiring is 187's) | "A smoke run against the deployed URL fails the pipeline when it fails. It proves the build SHA and the project id, renders a voter page from hosted data, goes from questions to results, and signs one contestant in. It is read-mostly: no setup or teardown project, and `DEV_SEED_ALLOW_REMOTE` appears in no workflow (E1). The local gate suite and its preflight are unchanged." [VERIFIED: REQUIREMENTS.md:113-116] | `yarn test:e2e:deployed` exits non-zero on a gate failure (probe: `smoke_exit=1`, § Pattern 1) and on a spec failure; the guard test keeps `DEV_SEED_ALLOW_REMOTE` out of `.github/workflows/**` and the smoke entry; the local-suite baseline is `Total: 548 tests in 127 files` (§ Validation Architecture). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Directives in `./CLAUDE.md` (and the user's global CLAUDE.md) that bind this phase:

- **E2E hard rule:** a failing, flaky or "did not run" E2E test is a cardinal failure; no retries-until-green. A void run (`e2e-run.sh` exit 8 with `VOID-host-suspend.txt`) is no evidence and is made again under a new `--run-dir`. Applies to the closing full local run; the deployed smoke has `retries: 0` for the same reason.
- **Preflight unchanged:** the local served-application gate has no bypass, no flag and no env var that skips it. This phase must not touch `tests/global-setup.ts`, `tests/tests/support/preflight.ts`, `tests/playwright.config.ts` (success criterion 4).
- **Full local run through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`** for the phase-end gate.
- **Comment hygiene** (gated by `yarn assert:comment-hygiene`, which scans `apps/`, `packages/` and `tests/`): no historical narrative, no `.planning/` paths, no `D-NN` ids, no plan numbers, nothing addressed to the reviewer; only bare `see phase N`. Every new comment in `tests/` and `infra/` code obeys this. [VERIFIED: scripts/assert-comment-hygiene.mjs:195 — `const SCAN_ROOTS = ['apps', 'packages', 'tests'];`]
- **TypeScript strictly, avoid `any`**; exported symbols carry TSDoc (code review checklist).
- **Never commit sensitive data** (keys, tokens, `.env`). Extends here to the contestant address and password.
- **Exit statuses are read directly, never through a pipe** (memory: "Never read a gate's status through a pipe").
- **Shell commands handed to the user** wrap at 60 (max 80) characters with `\` continuations, one block per step, expected output stated after it (global CLAUDE.md). Applies to the runbook items and to any checkpoint instructions.
- **Code review checklist** (`.agents/code-review-checklist.md`): no repeated code, documented entities, docs updated, OWASP review.

## Summary

Everything the gate needs is already served, and its shape was confirmed this session. `GET https://staging.openvaa.org/api/health` answered `200 {"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`, equal to `image_tag` in the AWS tfvars. `GET /` answered `200` through CloudFront with `<html lang="en"`, `data-project-id="00000000-0000-0000-0000-000000000001"`, and one inline script holding `__sveltekit_x8y83y = { base: …, env: {"PUBLIC_PROJECT_ID":"00000000-0000-0000-0000-000000000001","PUBLIC_SUPABASE_ANON_KEY":"eyJ…","PUBLIC_LOG_LEVEL":"warn","PUBLIC_SUPABASE_URL":"https://cofbsatfrdysyphajsky.supabase.co"} }`. SvelteKit 2.70.3 writes that object with `JSON.stringify` on a single line, so it is parsed with `JSON.parse` rather than a regex over the URL. [VERIFIED: node_modules/@sveltejs/kit/src/runtime/server/page/render.js:422-424 and src/utils/misc.js:1 `export const s = JSON.stringify;`]

The hosted data the specs read was checked with the public anon key: one election `smoke_election_00`, six questions `smoke_q_opinion_1..6` in `sort_order` 0-5 with the template's English statements, and settings with `questionsIntro.show: false`, `categoryIntros.show: false`, notifications and popups off, `access.contestantApp: true`, `contestantApp.entityTypes: ["candidate"]`. The candidate the grant SQL would pick, `smoke_cand_0000`, has a name, a nomination (`smoke_nom_cand_0000`) and six answers, so on its Contestant App home every task is complete and its logout button signs out at once, with no confirm dialog (§ Pitfall 6). The voter half can therefore run green against staging tonight, without any credential.

The Playwright mechanics the plan relies on were each probed in a scratch project against the repository's Playwright 1.63.0: a global setup that throws ends the run with `smoke_exit=1` after printing its `PASS`/`FAIL` lines; `--list` does not run the global setup; the JSON reporter still writes `results.json` when the global setup fails; and a Playwright config can be imported by a vitest 5.0.2 test (so the config-shape guard can be a unit test). The baseline for success criterion 4 is `Total: 548 tests in 127 files` from `playwright test --list -c tests/playwright.config.ts ./tests --grep-invert @probe`.

**Primary recommendation:** Build the gate as a pure `tests/tests/utils/deployedTarget.ts` with a vitest test, and keep `tests/deployed-global-setup.ts` as a thin adapter over it, copying the shape of the local gate without importing from it. Lock the smoke files with `@typescript-eslint/no-restricted-imports` (`allowTypeImports: true`). Run the voter half, the three controls and the closing local gates tonight. Leave one final plan, `autonomous: false`, for the operator-approved hosted contestant sitting and the full green run.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Build identity (`/api/health` `build`) | Frontend Server (SSR, ECS task) | CDN (CloudFront passes it through, `cache-control: no-store`) | `version` is baked at build time from `BUILD_SHA`; the harness only reads it |
| Project identity (`data-project-id`, `env.PUBLIC_SUPABASE_URL`) | Frontend Server (hooks `transformPageChunk`, SvelteKit render) | — | Read off the served HTML; the frontend is not changed |
| Expected identity (ref, project id) | Repository (committed tfvars) | — | Read by the harness at run time from `infra/envs/staging/supabase/terraform.tfvars`; never from an input |
| Gate evaluation and refusal | Test harness (Playwright global setup, Node) | — | Runs before any spec; pure module testable without Playwright |
| Voter walk questions → results | Browser / Client | Database (hosted, anonymous reads through RLS) | The specs drive the page; hosted data is read-only |
| Contestant sign-in / sign-out | Browser / Client → Frontend Server → Supabase Auth | Database (grants, terms) | The only writes are the auth service's own (session, its revocation) |
| Contestant account + grant (once) | Database / Auth (hosted) | Operator workstation (psql, curl) | Out of band, operator-gated; never from the smoke entry |
| Negative controls 2 and 3 | Local production server (`node apps/frontend/build/index.js`) | Hosted Supabase (control 2, anon reads) / local stack (control 3) | Real targets that each fail one check alone |

## Standard Stack

No package is installed in this phase. Everything below is already in the root `package.json` / lockfile.

### Core
| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@playwright/test` | 1.63.0 [VERIFIED: `node_modules/.bin/playwright --version` → `Version 1.63.0`] | Second config, global setup, specs | The local suite's runner; fixtures are written for it |
| `vitest` | 5.0.2 [VERIFIED: vitest run banner `RUN  v5.0.2`] | Unit tests of `deployedTarget.ts` and the guards | `tests/vitest.config.ts` already collects `tests/utils/**/*.test.ts` and `yarn test:unit` chains it |
| `@typescript-eslint/eslint-plugin` | 8.70.1 [VERIFIED: node_modules/@typescript-eslint/eslint-plugin/package.json] | `@typescript-eslint/no-restricted-imports` with `allowTypeImports` | Registered by the shared config; supports `regex` patterns and `allowTypeImports` [VERIFIED: dist/rules/no-restricted-imports.js:23-24,181,189] |
| `@sveltejs/kit` (read only) | 2.70.3 | The served `env` block format | Its render code was read to confirm `JSON.stringify` |

### Supporting
| Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| psql | 17.6 (Homebrew) | `grant-smoke-contestant.sql` on the isolated instance and at the hosted sitting | Plan for the SQL and the checkpoint plan |
| jq | 1.7.1 | Build the Auth Admin API body from the environment, decode token claims | Hosted sitting, as in Step 21 |
| openssl | 3.1.0 | Password generation (`openssl rand`) | Hosted sitting |
| curl | 8.7.1 | Admin API user creation, sign-in readback, wrong-SHA control reads | Hosted sitting, evidence |
| `security` (macOS) | system | Keychain store/read of the contestant credentials | Hosted sitting, workstation runs |
| `apps/supabase/scripts/isolated-instance.sh` | in repo | A second Supabase instance for the grant SQL proof | Plan for the SQL (184-09 precedent) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@typescript-eslint/no-restricted-imports` | core `no-restricted-imports` on the smoke files | The shared config already sets core `no-restricted-imports` (the `$lib` pattern); a second flat-config block for the same rule **replaces** its options for those files, and the core rule cannot exempt `import type`. The TS rule is a different rule name, so both apply. |
| Importing the deployed config in vitest | Spawning `playwright test --list` from vitest | `--list` JSON does not expose `dependencies` (the probe's JSON project entries carried no `dependencies` key), so it cannot prove the "no dependencies" half; importing works (probe) and is faster. |

**Installation:** none.

## Package Legitimacy Audit

This phase installs no external package. Every library it uses is already in the lockfile and in use by the local suite.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none installed) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 workstation shell (or, in 187, the pipeline)
   env: SMOKE_EXPECTED_SHA (required), SMOKE_BASE_URL (default https://staging.openvaa.org),
        SMOKE_CONTESTANT_EMAIL / SMOKE_CONTESTANT_PASSWORD (contestant spec only)
        -- no root .env is loaded --
             |
             v
 yarn test:e2e:deployed  ->  playwright test -c tests/playwright.deployed.config.ts
             |
             |  config load: assert one project, no dependencies, no setup/teardown name  --(throws)--> exit 1
             v
 tests/deployed-global-setup.ts  (thin adapter)
             |  reads baseURL from the resolved config, repo root from TESTS_DIR
             v
 deployedTarget.ts  runDeployedGate()
   read infra/envs/staging/supabase/terraform.tfvars -> { project_ref, public_project_id }
   GET <base>/api/health -> build
   GET <base>/           -> html -> env block JSON -> PUBLIC_SUPABASE_URL host ; data-project-id
   evaluate ALL four checks:
     1 service-role key absent   2 sha   3 ref   4 project id
   print PASS/FAIL line for each
             |
     any FAIL? --yes--> throw "DEPLOYED SMOKE GATE FAILED ..."  --> Playwright exit 1, no spec runs
             | no
             v
 project deployed-smoke (Desktop Chrome, workers 1, retries 0)
   voter.smoke.ts:      / -> walk stages -> first question text == smokeTemplate statement
                        -> answerAndAdvanceToResults -> /results shows candidate section + cards
   contestant.smoke.ts: require email/password inputs -> signInFromCold -> candidate home
                        (task list complete) -> logout (no dialog) -> /contestant/login
             |
             v
 exit status (0 green / non-zero red), read directly: echo "smoke_exit=$?"
 artifacts: --output <run>/results, PLAYWRIGHT_JSON_OUTPUT_FILE=<run>/results.json,
            PLAYWRIGHT_HTML_OUTPUT_DIR=<run>/html  (html reporter open: 'never')
```

### Recommended Project Structure
```
tests/
├── playwright.deployed.config.ts      # second entry; no dotenv; one project; load-time shape check
├── deployed-global-setup.ts           # thin adapter -> runDeployedGate()
└── tests/
    ├── deployed/
    │   ├── voter.smoke.ts             # questions -> results on the hosted smoke dataset
    │   ├── contestant.smoke.ts        # password sign-in, home, sign-out
    │   └── smokeContent.ts            # (recommended) narrows smokeTemplate rows to strings
    └── utils/
        ├── deployedTarget.ts          # pure gate logic, tfvars parse, env-block parse, config-shape check
        ├── deployedTarget.test.ts     # E-02: refusals, "no input widens the ref"
        └── deployedSmokeGuards.test.ts # E-03: forbidden tokens scan + config shape via import
infra/scripts/grant-smoke-contestant.sql   # the one hosted write's SQL half
```

### Pattern 1: The gate as a pure module plus a thin global setup
**What:** All logic in `deployedTarget.ts`, taking its inputs as arguments (`env`, `baseURL`, `repoRoot`, an injectable `fetch`), returning the evaluated checks; global setup only wires Playwright to it. This mirrors `tests/tests/support/preflight.ts` + `tests/tests/utils/preflight.test.ts`, which tests the local gate against a stub `http.createServer`. [VERIFIED: tests/tests/utils/preflight.test.ts:1-60]

**When to use:** Always here; the negative controls of E-02 are unit cases against a stub server or plain strings.

**Probed behaviour (scratch project, repository Playwright 1.63.0):**
```
smoke_exit=1
PASS sha: observed a, expected a
FAIL ref: observed x, expected y
Error: DEPLOYED SMOKE GATE FAILED — 1 of 2 checks failed
```
…and the run directory then held `html`, `results`, `results.json`. `playwright test -c pw.config.ts --list` printed `Total: 1 test in 1 file`, `list_exit=0`, and none of the global setup's lines, so `--list` does not run it. [VERIFIED: probe output pasted above]

**Example skeleton (names are recommendations, not existing symbols):**
```typescript
// tests/tests/utils/deployedTarget.ts — sketch
export const DEDICATED_SUPABASE_TFVARS = 'infra/envs/staging/supabase/terraform.tfvars';

export type GateCheckName = 'service-role-key-absent' | 'sha' | 'ref' | 'project-id';
export type GateCheck = { name: GateCheckName; pass: boolean; observed: string; expected: string };

/** Parse project_ref and public_project_id; throw when either is missing, repeated or malformed. */
export function readDedicatedTarget(tfvarsText: string): { projectRef: string; publicProjectId: string } { /* … */ }

/** The served SvelteKit public env object, or null when the document carries none or it does not parse. */
export function extractServedEnv(html: string): Record<string, unknown> | null {
  // One line: `env: {...}` written by JSON.stringify; take the rest of that line and JSON.parse it.
  const match = /^\s*env: (\{.*\}),?\s*$/m.exec(html);
  if (!match) return null;
  try { return JSON.parse(match[1]) as Record<string, unknown>; } catch { return null; }
}

/** The Supabase ref the served URL names, or null unless it is exactly https://<ref>.supabase.co. */
export function servedSupabaseRef(env: Record<string, unknown> | null): string | null { /* URL parse, protocol https:, port '', hostname ends '.supabase.co', one label before it */ }

export function evaluateGate(input: {
  env: Readonly<Record<string, string | undefined>>; // process.env, passed in
  health: { status: number; body: string } | null;
  html: string | null;
  dedicated: { projectRef: string; publicProjectId: string };
}): Array<GateCheck> { /* all four, in order, never short-circuit */ }
```
The expected ref and project id come only from `readDedicatedTarget(fs.readFileSync(path.join(repoRoot, DEDICATED_SUPABASE_TFVARS)))`. `evaluateGate` receives `env` only for `SMOKE_EXPECTED_SHA` and `SUPABASE_SERVICE_ROLE_KEY`, so no variable can name a ref.

The values quoted from the tfvars:
- [VERIFIED: infra/envs/staging/supabase/terraform.tfvars:17] `project_ref     = "cofbsatfrdysyphajsky"`
- [VERIFIED: infra/envs/staging/supabase/terraform.tfvars:32] `public_project_id = "00000000-0000-0000-0000-000000000001"`
- [VERIFIED: infra/envs/staging/aws/terraform.tfvars:46] `image_tag = "712947a1bd44a735f66ee8f51610f4748d76cd30"`

Note the alignment: `project_ref` is followed by **five** spaces, `public_project_id` by one. The parser regex must use `\s*=\s*` (as the runbook's `sed 's/^project_ref *= *"…'` does). [VERIFIED: infra/envs/staging/supabase/README.md:638-639]

### Pattern 2: Ref check that fails closed
**What:** `servedSupabaseRef` returns a ref only when `new URL(env.PUBLIC_SUPABASE_URL)` has `protocol === 'https:'`, `port === ''`, `username === '' && password === ''`, and `hostname === <one DNS label> + '.supabase.co'`. The check then requires equality with the tfvars ref. Every other case is `FAIL ref: observed <what was read or why nothing was>`.

Unit cases (E-02), each refused: a made-up ref `aaaaaaaaaaaaaaaaaaaa`; the deleted throwaway `begckvkapaopoztbreqc`; `http://127.0.0.1:54321`; `http://localhost:54321`; `https://cofbsatfrdysyphajsky.supabase.co.evil.example`; `https://cofbsatfrdysyphajsky.supabase.co@evil.example`; `https://cofbsatfrdysyphajsky.supabase.co:8443`; `http://cofbsatfrdysyphajsky.supabase.co` (not https); `https://evil.example`; a document with no `env:` line; an `env` line that is not JSON; an `env` without `PUBLIC_SUPABASE_URL`; a non-string value. "No input widens": run `evaluateGate` with an `env` in which **every** key (including made-up ones like `SMOKE_PROJECT_REF`, `PROJECT_REF`, `SUPABASE_PROJECT_REF`) holds the foreign ref, and assert the ref check still fails, and that the function's result does not depend on any key but the two it names.

### Pattern 3: Project-id check copied, not imported
Copy the shape of `extractServedProjectId` / `assertServedProject` from `tests/global-setup.ts`, without importing it. That file is the local gate and must stay byte-identical. [VERIFIED: tests/global-setup.ts:23-30]
```typescript
const SERVED_PROJECT_ATTRIBUTE = 'data-project-id';
const SERVED_PROJECT_PLACEHOLDER = '%projectId%';
function extractServedProjectId(html: string): string | null {
  const match = new RegExp(`${SERVED_PROJECT_ATTRIBUTE}="([^"]*)"`).exec(html);
  return match ? match[1].trim().toLowerCase() : null;
}
```
An absent attribute and the literal placeholder are both failures, as in the local gate. The source of the attribute: [VERIFIED: apps/frontend/src/app.html:9] `<body data-project-id="%projectId%">`, substituted in [VERIFIED: apps/frontend/src/hooks.server.ts:97] `transformPageChunk: ({ html }) => html.replace('%lang%', locale).replace('%projectId%', SERVED_PROJECT_ID)`.

### Pattern 4: SHA check
[VERIFIED: apps/frontend/src/routes/api/health/+server.ts:11-13] `return json({ status: 'ok', build: version }, { headers: { 'cache-control': 'no-store' } });`. `SMOKE_EXPECTED_SHA` must match `/^[0-9a-f]{40}$/` (unset, empty, short, upper-case → `FAIL sha: … SMOKE_EXPECTED_SHA is not a full 40-hex commit id`), the health answer must be status 200 with JSON whose `build` is a string, and the two must be equal byte for byte. The workstation value comes from the tfvars:
```bash
SMOKE_EXPECTED_SHA=$(sed -n \
  's/^image_tag *= *"\([0-9a-f]*\)".*/\1/p' \
  infra/envs/staging/aws/terraform.tfvars)
export SMOKE_EXPECTED_SHA
```
Expected: no output; `echo "${#SMOKE_EXPECTED_SHA}"` prints `40`.

### Pattern 5: The deployed config
```typescript
// tests/playwright.deployed.config.ts — sketch; no dotenv import
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { TIMEOUTS } from './tests/helpers/timeouts';
import { assertSmokeProjects } from './tests/utils/deployedTarget';
import { TESTS_DIR } from './tests/utils/testsDir';

const config = defineConfig({
  testDir: path.join(TESTS_DIR, 'deployed'),
  testMatch: /\.smoke\.ts$/,
  globalSetup: './deployed-global-setup.ts',
  timeout: TIMEOUTS.testMax,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI || process.env.GITHUB_ACTIONS === 'true',
  reporter: [['list'], ['json'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.SMOKE_BASE_URL || 'https://staging.openvaa.org',
    trace: 'retain-on-failure'
  },
  projects: [{ name: 'deployed-smoke', use: { ...devices['Desktop Chrome'] } }]
});
assertSmokeProjects(config.projects ?? []);
export default config;
```
- Output directories come from the command line: `--output <run>/results`, with `PLAYWRIGHT_JSON_OUTPUT_FILE=<run>/results.json` and `PLAYWRIGHT_HTML_OUTPUT_DIR=<run>/html` in the environment. This is the same mechanism `e2e-run.sh` uses. [VERIFIED: tests/scripts/e2e-run.sh:748-770] [CITED: playwright.dev/docs/test-reporters, "override that location using the `PLAYWRIGHT_HTML_OUTPUT_DIR` environment variable"]
- `open: 'never'` is load-bearing. The HTML reporter's default is `on-failure`, which serves the report and blocks a failing local run, so a negative control would never return its exit status. [CITED: playwright.dev/docs/test-reporters — "`always`, `never` and `on-failure` (default)"]
- The global setup reads `config.projects[0].use.baseURL` and never recomputes it (the local gate's rule). [VERIFIED: tests/global-setup.ts:79-82]
- Config load must not require any input, so `--list` and the vitest import work with an empty environment.
- Root script beside the local one. [VERIFIED: package.json:53] `"test:e2e": "yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring && playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe",`. The new one is `"test:e2e:deployed": "playwright test -c ./tests/playwright.deployed.config.ts"`. Arguments appended by yarn (a spec file, `--output`) pass through.

### Pattern 6: The voter spec
Reuse the existing helpers, all free of any admin import:
- `navigateToFirstQuestion(page)` (Home → whichever stages render → first question; it opens `/` through `createVoterHomePage(page).goToPage('en')`). [VERIFIED: tests/tests/utils/voterNavigation.ts:286-295]
- `answerAndAdvanceToResults` is exported. [VERIFIED: tests/tests/fixtures/voter/voter-journey.fixture.ts:292 `export { answerAndAdvanceToResults, answerNumberScale, walkUntilQuestionsIntro };`] Its signature is `answerAndAdvanceToResults(page: Page, answerMode: AnswerMode, answerCount?: number)` with `export type AnswerMode = 'min' | 'max';`. [VERIFIED: voter-journey.fixture.ts:38,117]
- Test ids. [VERIFIED: tests/tests/utils/testIds.ts:425-436] `list: 'voter-results-list'`, `card: 'entity-card'`, `candidateSection: 'voter-results-candidate-section'`. The question heading id is `testIds.voter.questions.heading`, used by `voterQuestionsPage.fixture.ts` and the answer loop. [VERIFIED: voter-journey.fixture.ts `const heading = page.getByTestId(testIds.voter.questions.heading);`]

This is the same composition as the existing `minimalVoterResultsPage` fixture, which serves single-election, single-constituency datasets. That fixture calls `navigateToFirstQuestion` and then `answerAndAdvanceToResults`. [VERIFIED: tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts:36-41] The spec calls the two functions directly, so that it can assert the first question between them:
```typescript
// tests/tests/deployed/voter.smoke.ts — sketch
test('a voter answers the hosted questions and sees candidate results', async ({ page }) => {
  await navigateToFirstQuestion(page);
  await expect(page.getByTestId(testIds.voter.questions.heading)).toContainText(SMOKE_STATEMENTS[0]);
  await answerAndAdvanceToResults(page, 'max');
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByTestId(testIds.voter.results.candidateSection)).toBeVisible();
  await expect(page.getByTestId(testIds.voter.results.card).first()).toBeVisible();
});
```
`SMOKE_STATEMENTS` comes from `smokeTemplate`, through a relative import of `packages/dev-seed/src/templates/smoke`. The barrel `@openvaa/dev-seed` does not export `smokeTemplate`, and it re-exports `SupabaseAdminClient` and `createServiceRoleClient`. [VERIFIED: packages/dev-seed/src/index.ts:81-87 and the templates block 101-108, which lists `BASE_APP_SETTINGS, baseTemplate, BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES, defaultOverrides, defaultTemplate`] `smoke.ts` imports only `./e2e/perm/shared`, whose value imports are none (types only). [VERIFIED: packages/dev-seed/src/templates/e2e/perm/shared.ts:21-28] The rows' `name` is typed `Json`, so a small `smokeContent.ts` narrows `smokeTemplate.questions?.fixed?.map(q => q.name)` to `{ en: string }` and throws on anything else. The order must be by `sort_order`. Served order, read anonymously this session: `smoke_q_opinion_1 0 {"en":"Public transport should be free of charge in cities."}` … `smoke_q_opinion_6 5 {"en":"Immigration for work should be made easier."}`. [VERIFIED: anonymous REST read of `questions` on cofbsatfrdysyphajsky, 2026-11-14; template text VERIFIED: packages/dev-seed/src/templates/smoke.ts:25-32]

### Pattern 7: The contestant spec
- `createContestantLoginPage(page).signInFromCold(email, password)` opens `buildRoute({ route: 'ContestantAppSignIn', locale: 'en' })`, retries until the form appears, then `login(email, password)`. [VERIFIED: tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts:123-143] It imports only a **type** from `supabaseAdminClient` (`import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';`, line 59). It also reads `apps/frontend/messages/en/contestantApp.login.json` from disk at module load, which is one reason the checkout must equal the deployed tree.
- After sign-in: `await expect(page).not.toHaveURL(/.*login.*/)` (the pattern `registerAndStoreSession` uses), then the home. Recommended assertion: `createContestantHomePage(page).expectTaskList({ nomination: 'complete', profile: 'complete', questions: 'complete' })`, from the deterministic state of `smoke_cand_0000` (§ Pitfall 6).
- Sign-out: `createContestantLogoutButton(page).clickWithoutDialog()`, which clicks `contestant-home-logout`, asserts no dialog, then `toHaveURL(/\/contestant\/login/)` and the login page anchor. [VERIFIED: tests/tests/fixtures/contestant/contestantLogoutButton.fixture.ts:42-49]
- Inputs: a tiny helper (`requireSmokeInput(name)` in `deployedTarget.ts` or `smokeContent.ts`) throws `SMOKE_CONTESTANT_EMAIL is not set …` inside the test. **Recommendation:** these two inputs are *not* gate checks. The gate's four checks are locked, and making the gate require them would block the voter half and every control tonight. A missing input therefore fails only the contestant test, by name. `playwright/no-skipped-test` forbids a skip, and a skip would be a "did not run" anyway.
- **Recommendation:** `test.use({ trace: 'off', screenshot: 'off', video: 'off' })` in `contestant.smoke.ts` (§ Pitfall 4).

### Pattern 8: The import lock
```js
// tests/eslint.config.mjs — appended block (sketch)
{
  files: ['tests/deployed/**/*.ts', 'tests/utils/deployedTarget.ts', 'deployed-global-setup.ts'],
  rules: {
    '@typescript-eslint/no-restricted-imports': ['error', {
      patterns: [
        { regex: '(^|/)(supabaseAdminClient|authApi|accountAccessClient|localSupabaseUrl)$', allowTypeImports: true,
          message: 'The deployed smoke entry holds no service-role client.' },
        { regex: '^@openvaa/dev-seed$', allowTypeImports: true,
          message: 'The dev-seed barrel re-exports its service-role client; import the template module by path.' },
        { regex: '^@supabase/supabase-js$', allowTypeImports: true,
          message: 'The deployed smoke entry creates no Supabase client.' }
      ]
    }]
  }
}
```
- Globs in this file are relative to `tests/`. ESLint 10.11 picks `tests/eslint.config.mjs` for files under `tests/`: `--print-config tests/tests/utils/voterNavigation.ts` carried 39 `playwright/` rules. [VERIFIED: eslint --print-config this session]
- `tests/playwright.deployed.config.ts` is **not linted**: `ignores: ['playwright*', 'debug-*', 'e2e-runs']` matches it. `--print-config tests/playwright.config.ts` printed `undefined`. [VERIFIED: tests/eslint.config.mjs:9 and probe] The guard test's token scan covers the config instead, and it imports nothing but `@playwright/test`, `path` and the two helpers.
- The rule is **direct imports only**: a fixture that value-imported the admin client would pull it in without a lint error. Today the reused modules import none (voterNavigation.ts:9-14, voter-journey.fixture.ts imports, contestantLoginPage.fixture.ts:49-59, contestantHomePage.fixture.ts:27-31, contestantLogoutButton.fixture.ts:20-22, helpers/index.ts). **Recommendation:** have the guard test also walk the relative-import closure of the smoke files: parse `import … from '<relative>'` lines that are not `import type`, resolve them, and recurse. It fails if the closure reaches `supabaseAdminClient.ts`, `authApi.ts`, `accountAccessClient.ts`, `packages/dev-seed/src/index.ts` or `packages/dev-seed/src/supabaseAdminClient.ts`. Cheap, and it closes the transitive hole.
- Seen-failing proof: plant `import { SupabaseAdminClient } from '../utils/supabaseAdminClient';` in a scratch `tests/tests/deployed/planted.smoke.ts`, run `node_modules/.bin/eslint tests/tests/deployed`, read `eslint_exit=1`, delete the file, read `eslint_exit=0`.

### Pattern 9: The grant SQL (modelled on `grant-project-admin.sql`)
Copy the anatomy exactly [VERIFIED: infra/scripts/grant-project-admin.sql:27-104]: `\set ON_ERROR_STOP on`, `\set QUIET on`, `SET log_parameter_max_length_on_error = 0;`, every value `\unset` then `\getenv`, the address tested only as a bound parameter (`\bind`), refusals raised inside one `BEGIN … COMMIT`, counts printed last. Inputs: `SMOKE_CONTESTANT_EMAIL`, `PUBLIC_PROJECT_ID`. The body:
- Exactly one `auth.users` row with `lower(email) = lower($1)`, else raise. The schema values: [VERIFIED: apps/supabase/supabase/migrations/00001_initial_schema.sql:2035-2048] `user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,` … `CONSTRAINT grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role),` and the enums [VERIFIED: 00001_initial_schema.sql:24-37] `CREATE TYPE public.grant_scope_type AS ENUM('global', 'account', 'project', 'entity');`, `CREATE TYPE public.grant_role_type AS ENUM('admin', 'editor');`, `CREATE TYPE public.entity_type AS ENUM(` `'candidate',` ….
- The candidate: the lowest `external_id LIKE 'smoke\_%'` in the project with `EXISTS (SELECT 1 FROM public.nominations n WHERE n.candidate_id = c.id)`. On staging that is `smoke_cand_0000` (anonymous read: `smoke_cand_0000 has-name 6`, nomination `smoke_nom_cand_0000`).
- Refuse when another user already edits the candidate. [VERIFIED: 00001_initial_schema.sql:2059-2063] `CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id)` `WHERE` `scope = 'entity'` `AND target_type = 'candidate'` `AND role = 'editor';`. Check this before the insert, with a message naming no address, because the index's own error names none of the context.
- `INSERT INTO public.grants (user_id, scope, target_type, target_id, role) VALUES (:'user_id'::uuid, 'entity', 'candidate', :'candidate_id'::uuid, 'editor') ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING;`
- `INSERT INTO public.terms_of_use_acceptances (user_id, project_id) VALUES (…) ON CONFLICT (user_id, project_id) DO NOTHING;`. The user is stated explicitly because the column default is `auth.uid()`, which is null for `postgres`. [VERIFIED: 00001_initial_schema.sql:4866-4871 `user_id uuid NOT NULL DEFAULT auth.uid () REFERENCES auth.users (id) ON DELETE CASCADE,` … `PRIMARY KEY (user_id, project_id)`]
- Output `grants=<n>` and `terms=<n>`, the user's entity-editor grants on the candidate and acceptances on the project.
- Removal: deleting the auth user removes both rows by `ON DELETE CASCADE` (both foreign keys quoted above).
- Add the file to `.prettierignore` under "# --- psql scripts ---", beside the three named there. [VERIFIED: .prettierignore:79-87, e.g. `infra/scripts/grant-project-admin.sql`]
- Prove it on an isolated instance, as 184-09 did (`isolated-instance.sh start --name <id> --mode db --migrations apps/supabase/supabase/migrations --port-base <n>`, a driver with an EXIT trap that stops it, `list` empty afterwards). [VERIFIED: 184-09 evidence `184-09-grant-script.md`] In `db` mode no rows exist, so the driver inserts one project (via `bootstrap.sql`, as 184-09 did), one election, one constituency, two `smoke_` candidates (one with a nomination, one without) and one `auth.users` row. Cases: first run `grants=1 terms=1` exit 0; second run unchanged exit 0; unknown address exit 3; unset variable exit 3; a candidate that already has another editor exit 3; and the lowest *nominated* candidate is the one granted.

### Anti-Patterns to Avoid
- **Importing anything from `tests/global-setup.ts`, `tests/playwright.config.ts` or `tests/tests/support/preflight.ts`.** Importing is not editing, but `playwright.config.ts` calls `dotenv.config()` at module load (line 11) and would put the local service-role key into the process. Copy the shapes instead.
- **Reading the ref or the project id from an environment variable.** That turns "cannot point at production" into a promise about an input (rejected in E-01, E-02).
- **A host allowlist.** It makes controls 2 and 3 impossible to run (A-04).
- **A `.spec.ts` or `.test.ts` suffix on the smoke specs.** The default testMatch of local projects without an explicit one would collect them. `.smoke.ts` matches no local pattern: every explicit local `testMatch` ends in `\.spec\.ts`, `\.setup\.ts` or `\.teardown\.ts`, the probes are enumerated, and `testIgnore: ['**/*.test.ts']`. [VERIFIED: grep of every `testMatch:` in tests/playwright.config.ts; config lines 1562-1563]
- **Retries.** `retries: 0` everywhere (B-03).
- **Printing the env block whole in a FAIL line.** It is public, but long. Print the field the check read.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Voter stage walk (home/intro/elections/constituencies/intros/question) | Custom clicks per page | `navigateToFirstQuestion` / `walkVoterStages` | Handles late renders, detached buttons, optional pages; proven in the local suite |
| Answer loop to results | A per-question loop | `answerAndAdvanceToResults(page, 'max')` | Handles Q→Q page reuse (stale options), category intros, `requireNavigation` fail-at-fault |
| Contestant sign-in with cold backend | `page.goto` + fill | `signInFromCold` | Retries the form opening on a slow backend |
| Logout | Clicking and guessing the dialog | `clickWithoutDialog()` | Asserts no dialog, the login URL and the login page anchor |
| Parsing the env block | A regex over the URL text | `JSON.parse` of the `env:` line | SvelteKit writes it with `JSON.stringify` on one line |
| Report and output isolation | Config edits per run | `--output`, `PLAYWRIGHT_JSON_OUTPUT_FILE`, `PLAYWRIGHT_HTML_OUTPUT_DIR` | The mechanism `e2e-run.sh` already uses |
| Verdict over a run's report | Hand-reading `results.json` | `node tests/scripts/e2e-spec-verdict.mjs <run-dir> --passed voter.smoke.ts --no-flaky` | Reads `<run-dir>/results.json`; exit 0/1/2/3. [VERIFIED: tests/scripts/e2e-spec-verdict.mjs:1-30] |
| A second Supabase for the SQL proof | Touching the shared stack's database | `apps/supabase/scripts/isolated-instance.sh` | Its own project id and ports; 184-09 precedent |

**Key insight:** every piece of this phase except the gate itself already exists and is green in the local suite. The new code is the identity gate, two short specs and guards. The risk is not in the mechanics. It is in letting a local value (the `.env`, a service-role key, a widened input) reach a hosted run.

## Common Pitfalls

### Pitfall 1: The HTML reporter blocks a failing run
**What goes wrong:** A negative control "hangs" after the gate fails, and its exit status is never read.
**Why:** The HTML reporter's default `open` is `on-failure`. [CITED: playwright.dev/docs/test-reporters]
**How to avoid:** `['html', { open: 'never' }]` in the deployed config.
**Warning signs:** "Serving HTML report at http://localhost:9323. Press Ctrl+C to quit."

### Pitfall 2: The config's JSON reporter writes to stdout under `--list`
**What goes wrong:** With `['json']` in the config and no `PLAYWRIGHT_JSON_OUTPUT_FILE`, `--list` prints the whole JSON report to stdout, as the probe showed. A `--list | tail` count then reads JSON.
**How to avoid:** Every `--list` used as evidence passes `--reporter=list`. The local-suite count is taken with the local config, which has only the html reporter, as before.

### Pitfall 3: The ESLint ignore hides the deployed config
**What goes wrong:** The no-restricted-imports rule does not reach `tests/playwright.deployed.config.ts`, because `ignores: ['playwright*']` matches it.
**How to avoid:** The guard test scans the config's text, and the config imports only `@playwright/test`, `path`, `TIMEOUTS`, `TESTS_DIR` and `deployedTarget`. Do **not** widen the ignore (it shields the local config, which must stay untouched).

### Pitfall 4: Credentials in traces, error context and reports
**What goes wrong:** Playwright traces record `fill()` arguments, and on failure it writes an `error-context` page snapshot that can hold field values. A `retain-on-failure` trace of a failed contestant test would then carry the address, and possibly the password, into `tests/e2e-runs/…`, and in 187 into a CI artifact. [ASSUMED: from Playwright trace behaviour; not probed this session]
**How to avoid:** `test.use({ trace: 'off', screenshot: 'off', video: 'off' })` in `contestant.smoke.ts`. Evidence in `.planning/…/evidence/` quotes only status lines, `PASS`/`FAIL` lines and verdict lines, never a raw report. A verify step greps the evidence for `@` addresses (the 184-09 runbook verify pattern) and for the keychain service's value.
**Warning signs:** `.zip` traces or `error-context.md` under a contestant test's output directory.

### Pitfall 5: The local `.env` and service-role key reaching a hosted run
**What goes wrong:** On this workstation the root `.env` holds the local service-role key. Any import of `tests/playwright.config.ts`, or of a module that calls `dotenv`, puts it into the process, and the gate then refuses every run (or, worse, a later edit removes the refusal).
**How to avoid:** No `dotenv` in the deployed config or anything it imports. Only `tests/playwright.config.ts` and `tests/seed-test-data.ts` import it today. [VERIFIED: grep for `dotenv` across tests/tests, tests/*.ts, packages/dev-seed/src] Yarn 4 injects only `.env.yarn` by default, and this repository's `.yarnrc.yml` sets no `injectEnvironmentFiles`. [VERIFIED: .yarnrc.yml read this session] [ASSUMED: the Yarn default value]

### Pitfall 6: The contestant's logout path is data-dependent
**What goes wrong:** `LogoutButton` opens a confirm dialog when the profile or questions task is incomplete with a count. It signs out at once otherwise. A spec written for the wrong branch times out.
**Why:** The branch is decided in `triggerLogout`, on `task.id === 'profile' || task.id === 'questions'`, `task.status === 'incomplete'` and `(task.count ?? 0) > 0`. [VERIFIED: apps/frontend/src/lib/contestant/components/logoutButton/LogoutButton.svelte] The profile is incomplete only while a required info question is unanswered or the name is missing. [VERIFIED: apps/frontend/src/lib/contestant/tasks/taskState.ts:236 `const profileIncomplete = input.unansweredRequiredInfoCount > 0 || input.requiredNameMissing;`]
**Data:** `smoke_cand_0000` has a first name, six answers and a nomination, and the template has no info questions. So every task is complete and `clickWithoutDialog()` is the right step. [VERIFIED: anonymous read `smoke_cand_0000 has-name 6`; ASSUMED: that all six stored answers are valid for their questions, which the latent emitter's output implies but was not checked value by value]
**How to avoid:** Assert `expectTaskList({ nomination: 'complete', profile: 'complete', questions: 'complete' })` before the logout. If that assertion fails at the checkpoint run, the data is the cause. Do not branch.

### Pitfall 7: Rolling-deploy split (relevant from 187 on)
**What goes wrong:** `/api/health` and `/` are separate requests, and the specs make more. During a rollout (`task_ceiling = 2`) two builds serve at once, so the SHA check can pass on the new task while a spec drives the old one.
**How to avoid in 186:** No rollout happens during the workstation runs. For 187, the pipeline's "wait until stable" stage precedes the smoke. Optionally the gate can cross-check that `/` came from the same build: SvelteKit names the global `__sveltekit_${hash(version)}` [VERIFIED: node_modules/@sveltejs/kit/src/runtime/server/utils.js:45, exports/vite/index.js:247]. But `hash` is SvelteKit-internal, so this is recorded as an open question, not a recommendation.

### Pitfall 8: `navigateToFirstQuestion` has a 5 s home anchor budget
**What goes wrong:** `createVoterHomePage.expectPageVisible` waits 5 000 ms for `voter-home`. On a cold hosted task through CloudFront this is usually ample (the SSR answered at once in every read this session), but a timeout there is a target-latency signal, not a test defect.
**How to avoid:** Keep the helper unchanged (it is shared with the local suite). A run red there is diagnosed with the trace before anything else. Never retried.

### Pitfall 9: The checkout must equal the deployed tree
**What goes wrong:** The fixtures read test ids and message files from the checkout. A checkout whose `apps/` differs from the image runs specs against another UI.
**How to avoid:** The evidence of every hosted run records `git rev-parse HEAD` and `git diff --stat 712947a1bd44a735f66ee8f51610f4748d76cd30 -- apps packages`, which must be empty. Phase 186 changes `tests/`, `infra/`, docs and `package.json` scripts, never `apps/` or `packages/`.

### Pitfall 10: Stack and gate operational traps on this host (memory)
- A subagent's `yarn db:stop`, `db:reset` or `e2e-run.sh` can be refused in auto mode without explicit Bash allow rules. Plan the full local run for the orchestrator, or confirm the allow rules exist.
- Long foreground gates can trip the 600 s subagent watchdog. Background `lint:check`, `e2e-run.sh` and the frontend build, and poll.
- `yarn test:unit` is red (`fetch failed` in dev-seed integration) whenever the shared stack is stopped, because the root `.env` sets `SUPABASE_URL`. The stack is up now: every `supabase_*_openvaa-local` container showed `Up 4 hours`.
- After a host restart, the edge runtime may stay down: check `edge_runtime` is Up before the full E2E run.
- Host sleep voids a run (exit 8). `pmset -g log` explains a red run that has no marker.

## Code Examples

### Running the smoke from a workstation (voter half tonight, no credentials)
```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"
unset SUPABASE_SERVICE_ROLE_KEY
SMOKE_EXPECTED_SHA=$(sed -n \
  's/^image_tag *= *"\([0-9a-f]*\)".*/\1/p' \
  infra/envs/staging/aws/terraform.tfvars)
export SMOKE_EXPECTED_SHA
RUN=tests/e2e-runs/186-voter-$(date -u +%Y%m%dT%H%M%SZ)
PLAYWRIGHT_JSON_OUTPUT_FILE="$RUN/results.json" \
  PLAYWRIGHT_HTML_OUTPUT_DIR="$RUN/html" \
  yarn test:e2e:deployed tests/tests/deployed/voter.smoke.ts \
  --output "$RUN/results" > "$RUN.log" 2>&1
echo "smoke_exit=$?"
```
Expected: `smoke_exit=0`. `$RUN.log` holds four `PASS` lines (service-role-key-absent, sha, ref, project-id) and `1 passed`. Then:
```bash
node tests/scripts/e2e-spec-verdict.mjs "$RUN" \
  --passed voter.smoke.ts --no-flaky
echo "verdict_exit=$?"
```
Expected: `verdict_exit=0`. (`mkdir -p "$RUN"` is not needed for the report files; the `.log` sits beside the directory.)

### Control 1: wrong SHA against staging
Set `SMOKE_EXPECTED_SHA` to another valid 40-hex id, e.g. `git rev-parse HEAD` (the tree differs only outside `apps`/`packages`, and that commit is not the image's). Run as above. Expected: `smoke_exit=1`, `FAIL sha: observed 712947a1…, expected <other>`, and `PASS` for the other three.

### Controls 2 and 3: a local production build of the deployed tree
```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"
git diff --stat 712947a1bd44a735f66ee8f51610f4748d76cd30 \
  -- apps packages
yarn build
BUILD_SHA=712947a1bd44a735f66ee8f51610f4748d76cd30 \
  yarn workspace @openvaa/frontend build
```
Expected: the diff prints nothing, and both builds exit 0. Then start the server, for control 2 with the hosted URL and the hosted anon key (public; it is in the served page), and another canonical project id:
```bash
HOSTED_ANON=$(curl -s https://staging.openvaa.org/ \
  | grep -o '"PUBLIC_SUPABASE_ANON_KEY":"[^"]*"' \
  | cut -d'"' -f4)
PORT=3186 HOST=127.0.0.1 \
  ORIGIN=http://127.0.0.1:3186 \
  PUBLIC_SUPABASE_URL=https://cofbsatfrdysyphajsky.supabase.co \
  PUBLIC_SUPABASE_ANON_KEY="$HOSTED_ANON" \
  PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000ff \
  node apps/frontend/build/index.js &
```
Run the smoke with `SMOKE_BASE_URL=http://127.0.0.1:3186`. Expected: `smoke_exit=1`, only `FAIL project-id: observed 00000000-0000-0000-0000-0000000000ff, expected 00000000-0000-0000-0000-000000000001`. For control 3, restart the server with `PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, the local anon key read off `supabase status -o env` into a variable without printing it (as `tests/scripts/ci-write-local-keys.sh` reads `ANON_KEY=`), and `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001`. Expected: `smoke_exit=1`, only `FAIL ref: …`. The required server variables are [VERIFIED: apps/frontend/src/lib/server/startup/requiredEnv.ts:12-17] `'PUBLIC_SUPABASE_URL',` `'PUBLIC_SUPABASE_ANON_KEY',` `'PUBLIC_PROJECT_ID',` `'ORIGIN'`. The analytics rules default to provider `none`. Port `3186` is a recommendation, chosen to stay off 5173 and 3000. Stop the server after each control (`kill %1`), and read the smoke's exit status before stopping it.
[ASSUMED: that `/` renders with a project id that has no rows (control 2). If it answers an error page, the page still passes through `app.html` and the hooks transform, so `data-project-id` and the `env` block should still be present; the evidence will show it either way. The SHA comes from `/api/health`, which calls no upstream (its doc comment).]

### The hosted sitting (checkpoint plan; the orchestrator runs it after the operator approves)
The prelude follows "The lines that begin each sitting of this part" [VERIFIED: infra/envs/staging/supabase/README.md:631-692], with `R=staging` and a refusal of any other ref:
```bash
cd "$(git rev-parse --show-toplevel)"
export LC_ALL=C
R=staging
REF=$(sed -n 's/^project_ref *= *"\([a-z]*\)".*/\1/p' \
  "infra/envs/$R/supabase/terraform.tfvars")
test "$REF" = cofbsatfrdysyphajsky \
  || { echo "refused_ref=$REF"; exit 2; }
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-186.XXXXXX")
```
Then the credentials it names (service-role key, database password as `PGPASSWORD`, anon key), with every other one unset. The password (D-03):
```bash
SMOKE_CONTESTANT_PASSWORD=$(openssl rand -base64 32 \
  | tr '+/' '-_' | tr -d '=\n')
export SMOKE_CONTESTANT_PASSWORD
```
This is 32 random bytes, base64url, 43 characters. The hosted policy accepts it: [VERIFIED: infra/modules/supabase/hosted-settings.json:17-18] `"password_min_length": 8,` `"password_required_characters": "",`. User creation, as in 184-22, with the body built by `jq` from the environment and given on stdin:
```bash
jq -n '{email: env.SMOKE_CONTESTANT_EMAIL,
  password: env.SMOKE_CONTESTANT_PASSWORD,
  email_confirm: true}' \
  | curl -sS -o "$L/s22c-user.json" \
    -w 's22c_create_http=%{http_code}\n' \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' --data-binary @- \
    "https://$REF.supabase.co/auth/v1/admin/users"
```
Expected: `s22c_create_http=200`. Then `psql -X -f infra/scripts/grant-smoke-contestant.sql` (`grants=1`, `terms=1`), then the Step 21 item 4 password sign-in (`…_signin_http=200`) and a `POST /auth/v1/logout` with the returned access token, so the readback leaves no live session. Last, the token's `grants` claim, decoded as in Step 21 item 5, must hold one entity-scope `editor` object. The keychain store: see Open Question 2.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prerendered pages import `/_app/env.js` | SSR pages inline `env: ${JSON.stringify(public_env)}` (prerendered pages still import `env.js`) | SvelteKit 2.x (render.js:379-424) | `/` must stay SSR for the ref check. A future prerendered root would make the `env` block vanish, and the check fails closed (which is the deferred `data-supabase-ref` idea's trigger) |
| `experimental.explicitEnvironmentVariables` off | If enabled, the env block is written with `devalue.uneval`, not JSON | render.js:421-422 | Not enabled in `apps/frontend/svelte.config.js` (no `experimental` key in its kit block). If it is turned on, `JSON.parse` fails and the gate fails closed |

**Deprecated/outdated:** none relevant.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Playwright traces and failure error-context can carry the typed address/password | Pitfall 4 | If wrong, the `trace: 'off'` override is merely unneeded; if right and omitted, a credential lands in run artifacts (and 187 CI artifacts) |
| A2 | All six answers of `smoke_cand_0000` are valid, so its questions task is complete and logout has no dialog | Pitfall 6, Pattern 7 | Contestant spec fails at `expectTaskList`/logout at the checkpoint run; fix is a spec or candidate-choice change, not a gate change |
| A3 | `/` of a local production server with a project id that has no rows still serves `data-project-id` and the `env` block | Controls 2 and 3 | Control 2 might fail more than one check; the procedure then needs a project id with rows on a non-dedicated target |
| A4 | Yarn 4's default `injectEnvironmentFiles` loads only `.env.yarn` | Pitfall 5 | If yarn injected `.env`, the gate would refuse every workstation run (fails safe, visible at once) |
| A5 | `security -i` (commands on stdin) stores a keychain item without the password in the process list | Open Question 2 | The password is visible in `ps` for the moment of the call |
| A6 | Hosted Auth rate limits do not affect a handful of password sign-ins per run | Pattern 7 | A red contestant run with a 429; diagnose before rerun |

## Open Questions

1. **Does the gate also accept a SvelteKit-internal same-build cross-check?**
   - What we know: the global name carries a hash of the version (Pitfall 7).
   - What's unclear: whether a SvelteKit-internal hash belongs in a long-lived gate.
   - Recommendation: no, not in 186. Record it for 187, whose rollout makes the split real.

2. **How is the password stored in the keychain without a command-line argument?**
   - What we know: `security add-generic-password … -w <password>` puts the value in the process arguments. With `-w` as the last option and no value, it prompts.
   - What's unclear: whether the orchestrator's sitting has a TTY for the prompt, and whether `security -i` reading `add-generic-password -U -s openvaa-staging-smoke-contestant -a … -w …` from stdin works non-interactively (A5).
   - Recommendation: the checkpoint plan's first item is a dry check of the method against a throwaway service name. Then `security delete-generic-password` removes it, and `security find-generic-password -s <throwaway>` exiting 44 confirms the removal. Only then is the real item written. Reading back: `SMOKE_CONTESTANT_PASSWORD=$(security find-generic-password -s openvaa-staging-smoke-contestant -w)`, with the address taken from the item's `acct` attribute into a variable, never echoed.

3. **Should the gate refuse other secret-shaped variables (`SUPABASE_SECRET_KEY`, `SUPABASE_ACCESS_TOKEN`, `PGPASSWORD`)?**
   - What we know: the locked check names `SUPABASE_SERVICE_ROLE_KEY`. FUT-02 will bring `sb_secret_` keys in early 2027.
   - Recommendation: keep the locked check's name and value. Optionally widen it to also refuse `SUPABASE_SECRET_KEY` under the same check name, since it costs one array entry. The planner decides, and records it.

4. **Is the deployed config's `trace: 'retain-on-failure'` (locked) compatible with Pitfall 4?**
   - Recommendation: yes. Keep it in the config, as locked, and override it in `contestant.smoke.ts` only.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | ✓ | v24.21.0 (via `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`) | — |
| Playwright + Chromium | smoke runs | ✓ | 1.63.0 (local suite runs on it) | — |
| `https://staging.openvaa.org` | voter half, control 1, final run | ✓ | build `712947a1…` (read 2026-11-14 ~21:50Z) | — |
| Hosted REST (anonymous) | dataset reads | ✓ | 1 election, 6 questions, 1001 candidates | — |
| Local Supabase stack | control 3, unit gate, full local E2E | ✓ | all `supabase_*_openvaa-local` Up | `yarn db:start` |
| psql | grant SQL proof, sitting | ✓ | 17.6 | — |
| jq / curl / openssl / security | sitting | ✓ | 1.7.1 / 8.7.1 / 3.1.0 / system | — |
| docker | isolated instance, local stack | ✓ | 29.7.2 | — |
| `supabase` CLI | isolated instance, `status -o env` | ✓ (repo-local) | `node_modules/.bin/supabase` (not on PATH) | call by path / `yarn workspace @openvaa/supabase …` |
| Operator keychain credentials (service-role key, DB password) | hosted sitting | ✗ tonight (operator away) | — | none: the checkpoint plan waits |
| Contestant credentials | contestant spec | ✗ until the sitting | — | contestant test fails by name; voter half and controls proceed |

**Missing dependencies with no fallback:** the operator's approval and keychain credentials for the hosted sitting. This blocks only the contestant half of success criterion 1.

**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 5.0.2 (harness unit tests); Playwright 1.63.0 (smoke and local E2E) |
| Config file | `tests/vitest.config.ts` (`include: ['tests/utils/**/*.test.ts']`, root `tests/`) [VERIFIED: tests/vitest.config.ts:15-22]; `tests/playwright.deployed.config.ts` (new) |
| Quick run command | `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"; node_modules/.bin/vitest run --config tests/vitest.config.ts deployed` |
| Full suite command | `yarn test:unit` (chains `test:unit:tests` and `test:unit:infra`); `yarn lint:check`; `yarn format:check`; `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/186-close-<ts> --no-db-reset` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SUPA-09 | ref check refuses every ref but the tfvars one; no input widens it; missing/unparsable env block fails closed | unit | `node_modules/.bin/vitest run --config tests/vitest.config.ts deployedTarget` | ❌ Wave 0 |
| SUPA-09 | project-id check: absent attribute, placeholder, other id all fail | unit | same | ❌ Wave 0 |
| SUPA-09 / PIPE-07 | SHA check: unset, short, upper-case, mismatched, non-200 health all fail; exact match passes | unit | same | ❌ Wave 0 |
| SUPA-09 | gate refuses a set `SUPABASE_SERVICE_ROLE_KEY`; all four checks are evaluated and printed even when the first fails | unit | same | ❌ Wave 0 |
| PIPE-07 (SC3) | no `DEV_SEED_ALLOW_REMOTE` / `allow-remote` / `allowRemote` in `.github/workflows/**`, the deployed config, its global setup, `tests/tests/deployed/**`, `deployedTarget.ts`; the deployed config imports cleanly with one project, no `dependencies`, no setup/teardown name; (recommended) value-import closure reaches no admin client | unit | `node_modules/.bin/vitest run --config tests/vitest.config.ts deployedSmokeGuards` | ❌ Wave 0 |
| SC3 | ESLint rule fires on a planted value import, not on a type import | lint (seen-failing) | `node_modules/.bin/eslint tests/tests/deployed; echo "eslint_exit=$?"` | ❌ (procedure) |
| SC1 voter | gate PASS ×4 against staging, voter walk to results | e2e (hosted) | `yarn test:e2e:deployed tests/tests/deployed/voter.smoke.ts …; echo "smoke_exit=$?"` then `e2e-spec-verdict.mjs <run> --passed voter.smoke.ts --no-flaky` | ❌ Wave 0 |
| SC1 contestant | sign-in, home tasks complete, sign-out | e2e (hosted) | full `yarn test:e2e:deployed`, then `e2e-spec-verdict.mjs <run> --passed voter.smoke.ts --passed contestant.smoke.ts --no-flaky` | ❌ — runs only after the checkpoint |
| SC2 | wrong SHA / wrong project id / not the dedicated project → non-zero, each with its one FAIL line | e2e (controls) | three runs, `echo "smoke_exit=$?"` each, FAIL line quoted | procedure |
| SC4 | local gate files byte-identical; `--list` unchanged; full local suite green | git + list + e2e | `git diff --exit-code <phase-base> -- tests/playwright.config.ts tests/global-setup.ts tests/tests/support/preflight.ts; echo "diff_exit=$?"`; `node_modules/.bin/playwright test --list -c tests/playwright.config.ts ./tests --grep-invert @probe \| tail -1` must print `Total: 548 tests in 127 files` and no `deployed/`; `tests/scripts/e2e-run.sh …` exit 0 | existing |
| grant SQL | exit 0 first and second run with `grants=1 terms=1`; exit 3 on unknown address, unset variable, candidate with another editor | integration (isolated instance) | driver script in the plan's scratch, statuses read directly | ❌ Wave 0 |

The `--list` line above is evidence, not a gate status, so its pipe is fine. The `--list` exit status itself is read separately, as `list_exit=$?` before the `tail`.

Phase base for the diff: `a7a4222a8` (HEAD at research time, `docs(186): discussion points and context`).

### Sampling Rate
- **Per task commit:** `node_modules/.bin/vitest run --config tests/vitest.config.ts deployed` (both new test files) plus `node_modules/.bin/eslint tests/deployed-global-setup.ts tests/tests/deployed tests/tests/utils/deployedTarget.ts` and `yarn typecheck:tests`
- **Per wave merge:** `yarn test:unit` (stack up) and the hosted voter run
- **Phase gate:** `yarn lint:check`, `yarn format:check`, `yarn test:unit` all exit 0; the SC4 diff empty and the `--list` count unchanged; one full `tests/scripts/e2e-run.sh` run green (a void run is made again); and, after the checkpoint, the full deployed smoke green

### Wave 0 Gaps
- [ ] `tests/tests/utils/deployedTarget.ts` + `tests/tests/utils/deployedTarget.test.ts`: SUPA-09 refusals, SHA, project id, service-role refusal, all-checks-printed
- [ ] `tests/tests/utils/deployedSmokeGuards.test.ts`: token scan, config import, import closure
- [ ] `tests/playwright.deployed.config.ts`, `tests/deployed-global-setup.ts`, root script `test:e2e:deployed`
- [ ] `tests/tests/deployed/voter.smoke.ts`, `contestant.smoke.ts`, (recommended) `smokeContent.ts`
- [ ] `infra/scripts/grant-smoke-contestant.sql` + `.prettierignore` entry + isolated-instance driver
- No framework install: vitest and Playwright are present, and `scripts/assert-unit-test-coverage.mjs` already sees `test:unit:tests` chained.

### Recommended plan order (for the planner)
1. Pure module and its unit tests (TDD), no network.
2. Config, global setup, root script, ESLint block, guard test. Proofs: `--list` of the deployed config (with `--reporter=list`), the local `--list` count unchanged, the planted lint violation seen red.
3. Specs. The voter half is run green against staging and recorded. The contestant spec is shown failing by name without its inputs (evidence that a missing input is named).
4. Grant SQL with its isolated-instance proof, and the runbook item in Step 22 (prelude, creation, SQL, readback, keychain, removal). No hosted write.
5. The three negative controls, each status read directly.
6. Docs: a `tests/README.md` § "Deployed smoke run" and one line in CLAUDE.md § Testing.
7. Closing local gates and the one full local E2E run (orchestrator-run if subagent stack commands are refused).
8. **`autonomous: false`, last.** The operator-approved hosted sitting (contestant user, grant, terms, readback, keychain), then the full deployed smoke green, then the dated Observations row in the staging README. Nothing in plans 1-7 depends on it. It changes no file under `apps/`, `packages/` or `tests/`, so the full local run of plan 7 still stands for success criterion 4: record that run's tree SHA, and check `git diff <run-sha>..HEAD -- apps packages tests` empty at close. The phase cannot be verified complete until plan 8 is done. Plans 1-7 can finish tonight.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Contestant password: 32 random bytes from `openssl rand`; never typed, printed, committed or put in evidence; stored only in the keychain and, in 187, GitHub Environment secrets |
| V3 Session Management | yes | The spec signs out (refresh token revoked); the sitting's readback sign-in is followed by `/auth/v1/logout` |
| V4 Access Control | yes | One candidate-editor grant only; no project-scope grant; the smoke entry holds no service-role client (gate refusal plus ESLint lock); the hosted write is operator-gated |
| V5 Input Validation | yes | Inputs validated in the pure module (40-hex SHA, URL shape); SQL inputs via `\getenv` and bound parameters, never `-v` or a URL |
| V6 Cryptography | yes (password generation only) | `openssl rand`, never hand-rolled |
| V7 Errors and Logging | yes | `SET log_parameter_max_length_on_error = 0;`; refusal messages name no address; FAIL lines print observed identity values (all public) and never credentials |
| V14 Configuration | yes | No `dotenv` in the deployed entry; expected identity from committed tfvars; no host allowlist by design (identity is the control) |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Smoke run pointed at a production or foreign project | Tampering / Elevation | Ref and project-id equality with the committed tfvars; no input names a ref; unit-tested refusals |
| Local service-role key reaching a hosted run | Elevation | Gate refusal of `SUPABASE_SERVICE_ROLE_KEY`; no dotenv; ESLint lock and import-closure guard |
| Credential leakage via traces, reports, evidence, process list | Information disclosure | `trace/screenshot/video: 'off'` on the contestant spec; evidence quotes status lines only; bodies via `jq` on stdin; keychain method checked first (Open Question 2) |
| Address committed to a public repo | Information disclosure | Inputs only; runbook verify greps for addresses (184-09 pattern) |
| Hosted write re-run or run against the wrong ref | Tampering | Prelude refuses any ref but `cofbsatfrdysyphajsky`; SQL idempotent (`ON CONFLICT … DO NOTHING`); refuses a second editor on the candidate |
| Seed check broken by the new user | Tampering (integrity of checks) | Address outside `openvaa.test`; `check-seed.sql` keys only on that domain and two fixed ids [VERIFIED: infra/scripts/check-seed.sql seed_domain `'@openvaa.test'`] |
| Stale build served (CDN) | Spoofing | `/api/health` sends `cache-control: no-store`; `/` answered `x-cache: Miss from cloudfront` |

## Sources

### Primary (HIGH confidence)
- This session's tool reads: `tests/global-setup.ts`, `tests/playwright.config.ts` (head, project matchers, defineConfig block), `tests/tests/support/preflight.ts`, `tests/tests/utils/preflight.test.ts`, `tests/vitest.config.ts`, `tests/eslint.config.mjs`, `tests/tsconfig.json`, root `package.json`, `.yarnrc.yml`, `tests/tests/utils/voterNavigation.ts`, voter and contestant fixtures, `testIds.ts`, `packages/dev-seed/src/templates/smoke.ts`, `templates/e2e/perm/shared.ts`, `packages/dev-seed/src/index.ts`, `apps/frontend/src/routes/api/health/+server.ts`, `app.html`, `hooks.server.ts`, `svelte.config.js`, `requiredEnv.ts`, `LogoutButton.svelte`, `taskState.ts`, `infra/scripts/grant-project-admin.sql`, `check-seed.sql`, both staging tfvars, staging Supabase README (prelude, Steps 21-22), migration `00001_initial_schema.sql` (grants, terms), `.prettierignore`, `tests/scripts/e2e-run.sh` (reporter block), `e2e-spec-verdict.mjs` header, 184-09 evidence
- SvelteKit 2.70.3 source: `runtime/server/page/render.js`, `utils/misc.js`, `runtime/server/utils.js`, `exports/vite/index.js`
- Probes: Playwright global-setup failure exit, `--list` behaviour, JSON on failure; vitest import of a Playwright config; ESLint config resolution; local `--list` baseline; live reads of staging `/`, `/api/health`, `/contestant/login` and anonymous REST reads

### Secondary (MEDIUM confidence)
- playwright.dev/docs/test-cli (`--output`, `--list`)
- playwright.dev/docs/test-reporters (`PLAYWRIGHT_HTML_OUTPUT_DIR`, `open` default `on-failure`)

### Tertiary (LOW confidence)
- Trace and error-context content of typed values (A1); `security -i` stdin behaviour (A5); Yarn default env-file injection (A4)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Nothing is new, and the versions were read from the installed tree.
- Architecture: HIGH. Every mechanism the gate relies on was probed or read at source.
- Pitfalls: HIGH for 1-3, 5, 9, 10; MEDIUM for 4, 6, 7, 8 (data-dependent or not probed).

**Research date:** 2026-11-14/15
**Valid until:** 2026-12-15 for the harness. The served-staging facts hold until the next deploy changes the image tag.
