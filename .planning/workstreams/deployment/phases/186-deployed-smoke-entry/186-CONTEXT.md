# Phase 186: Deployed Smoke Entry - Context

**Gathered:** 2026-11-14
**Status:** Ready for planning (recommendations, unreviewed by the operator)

<domain>
## Phase Boundary

A second Playwright entry, run from a workstation against `https://staging.openvaa.org`, first proves that the target serves the expected build SHA, is backed by the dedicated Supabase project `cofbsatfrdysyphajsky` and serves project id `00000000-0000-0000-0000-000000000001`. It refuses to run otherwise. Then it walks a voter from questions to results on hosted data, and signs one contestant in and out. It is read-mostly: no setup or teardown project, and no `DEV_SEED_ALLOW_REMOTE`. Three negative controls (wrong SHA, wrong project id, a target that is not the dedicated project) are each seen red with a non-zero exit status read directly. The local gate suite and its preflight stay byte-identical, and the full local suite is green at the end (SUPA-09; PIPE-07 except the pipeline wiring, which is phase 187's).

Out of scope: bank authentication (A4), a mail round trip (E2), a second environment (A1), any workflow file (187).

</domain>

<decisions>
## Implementation Decisions

Every answer below is the ★ RECOMMENDED option of `186-DISCUSSION-POINTS.md`. The operator was away and has not reviewed them, and may overrule any of them there before execution; CONTEXT.md is then rewritten from the fill.

### The target gate
- The dedicated project is identified by two checks: the host of `PUBLIC_SUPABASE_URL` in the served page's SvelteKit `env` block must be exactly `<project_ref>.supabase.co`, with `project_ref` read at run time from `infra/envs/staging/supabase/terraform.tfvars`; and `<body data-project-id>` must equal `public_project_id` from the same file. The check fails closed on a missing `env` block, an unparsable URL or a foreign host. No input can name another ref. The frontend does not change. — **Reversibility:** costly — phase 187's pipeline and the negative-control evidence build on this identity model, and the alternative (an explicit `data-supabase-ref` attribute) needs a frontend change, a new image and a redeploy.
- The admin client is not parameterised for hosted use, though the roadmap's research flag says it should be. The smoke entry holds no service-role client: the gate refuses a set `SUPABASE_SERVICE_ROLE_KEY`, and an ESLint `no-restricted-imports` rule on the smoke files forbids value imports of `tests/tests/utils/supabaseAdminClient`, `authApi`, `accountAccessClient` and dev-seed's admin client. The phase records this as its reading of the flag. — **Reversibility:** costly — if the reading is overruled, a hosted-capable service-role client enters the tests tree, and success criterion 3 and the 187 workflows have to be re-guarded.
- The expected SHA is a required input, `SMOKE_EXPECTED_SHA`, with no default: a full 40-hex id compared exactly with `/api/health` `build`. From a workstation it is taken from `image_tag` in `infra/envs/staging/aws/terraform.tfvars`. In 187 it is the commit the pipeline built.

### The second entry
- The gate's checks are evaluated together, each printing `PASS <check>` or `FAIL <check>: observed …, expected …`, and global setup throws before any spec if one failed. The checks are, in order: service-role key absent, SHA, ref, project id. The gate reads only `/api/health` and `/`.
- `SMOKE_BASE_URL` defaults to `https://staging.openvaa.org`, with no host allowlist: safety rests on the served project.

### What the run does
- The run reads the `smoke` dataset already seeded on the persistent project (184 D-18), plus one contestant. There is no second content seed. The specs take their expected content (the six statements, one election) from the `smokeTemplate` module. — **Reversibility:** costly — any other dataset means a hosted seed sitting and a prefix teardown against the hosted database, and replacing `smoke` would remove the dataset of more than 1000 rows that the conformance probe reads.
- The contestant's address and password are inputs, `SMOKE_CONTESTANT_EMAIL` and `SMOKE_CONTESTANT_PASSWORD`. Neither is committed, printed or put in the evidence. On a workstation they come from the operator's keychain; in 187 from GitHub Environment secrets. — **Reversibility:** costly — committing an address to a public repository cannot be undone by a later commit.

### The one-time hosted seeding
- Written once, out of band: one auth user created with `POST /auth/v1/admin/users` (password, `email_confirm: true`, an address outside `openvaa.test`), then a new committed `infra/scripts/grant-smoke-contestant.sql`, modelled on `grant-project-admin.sql`. The SQL writes the candidate-editor grant on the `smoke_` candidate with the lowest `external_id` that has a nomination, and the terms-of-use acceptance. It uses env-only inputs and no `-v`, is idempotent, prints counts only, and refuses unless exactly one user has the address and the candidate and project exist. No dev-seed, no `--allow-remote`. The step and its removal go in Step 22 of `infra/envs/staging/supabase/README.md`. — **Reversibility:** costly — it writes an account with a password into the persistent hosted project, reachable from a public URL. Removing it is a hosted delete, and the seed check and the probe have to be re-read afterwards.
- The orchestrator runs the step from this workstation, at a checkpoint the operator approves, with the service-role key and the database password from the operator's keychain (184 sitting pattern). A prelude refuses any ref but `cofbsatfrdysyphajsky` and unsets every unnamed credential. The step reads back `grants=1`, `terms=1` and a password sign-in with status 200, and prints no address, password or token. The executor writes the code and holds no credential. — **Reversibility:** one-way — a hosted write cannot be un-run, only compensated, so it is operator-gated. The contestant half of the green run waits for this approval; the voter half and every negative control do not.
- The password is generated in the sitting (`openssl rand`, 32 bytes, base64url), passed only through the environment, and stored in the operator's keychain under `openvaa-staging-smoke-contestant`.

### Decided autonomously
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

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/tests/fixtures/voter/*` page objects and `tests/tests/utils/voterNavigation.ts` (`walkVoterStages`, `resolveVoterStage`) import no admin client.
- `tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts` (`signInFromCold`) imports only a type from `supabaseAdminClient`.
- `tests/tests/helpers` `TIMEOUTS`, `tests/tests/utils/testIds.ts`, `buildRoute.ts`.
- `packages/dev-seed/src/templates/smoke.ts` (`smokeTemplate`) is the source of the expected content.
- `infra/scripts/grant-project-admin.sql` is the model for `grant-smoke-contestant.sql`. The 184-22 `POST /auth/v1/admin/users` step is the model for the user creation.
- `tests/global-setup.ts` `extractServedProjectId` / `assertServedProject` show the attribute parse and the field-by-field failure shape. They stay untouched: copy the shape, do not import or edit the file.

### Established Patterns
- The gate logic is a pure module with a vitest test beside it (`tests/tests/support/preflight.ts`, `tests/tests/utils/preflight.test.ts`). Vitest only collects `tests/utils/**/*.test.ts`.
- Hosted scripts take values from the environment only, never `-v` or a URL argument, are idempotent, and print counts and never addresses (`grant-project-admin.sql:12-30`).
- Hosted sittings use a prelude that refuses every ref but one and unsets unnamed credentials (`184-15-SUMMARY.md:128`).
- Exit statuses are read directly, never through a pipe (memory: never read a gate's status through a pipe).

### Integration Points
- `/api/health` `build` (`apps/frontend/src/routes/api/health/+server.ts`). `<body data-project-id>` (`apps/frontend/src/app.html:9`, `hooks.server.ts:97`). The SvelteKit `env` block in served HTML carries `PUBLIC_SUPABASE_URL`.
- `infra/envs/staging/supabase/terraform.tfvars:17,32` (`project_ref`, `public_project_id`), `infra/envs/staging/aws/terraform.tfvars:46` (`image_tag`).
- Root `package.json` scripts (`test:e2e:deployed` beside `test:e2e` at line 53). Tests ESLint config `tests/eslint.config.mjs` (the `no-restricted-imports` rule for the smoke files).
- Phase 187 calls `yarn test:e2e:deployed` as the pipeline's last stage, with the SHA and the two contestant secrets.

</code_context>

<specifics>
## Specific Ideas

- Staging was serving at 2026-11-14 21:39Z: `/` 200 through CloudFront, `/api/health` build `712947a1bd44a735f66ee8f51610f4748d76cd30`, `data-project-id` `0001`, and every SSR read on `cofbsatfrdysyphajsky.supabase.co`. The deployed tree equals today's `apps/`, `packages/` and `tests/`, so no redeploy is needed for the green run.
- The served project id `0001` equals the local default. This is why the ref check exists, and the "not the dedicated project" control is built so that the project id agrees while the ref does not.
- The two local-build controls need the production server's required variables (`ORIGIN` among them, `requiredEnv.ts`). The build's `BUILD_SHA` is set at build time, because `version` is baked in.
- A run from a workstation should be made from a checkout whose `apps/` and `tests/` equal the deployed tree, because the fixtures' test ids must match the served app. In 187 both are the same commit.

</specifics>

<deferred>
## Deferred Ideas

- Wiring the smoke run into the pipeline as its last stage, and observing it fail a deploy: phase 187 (PIPE-07, PIPE-09).
- An explicit `data-supabase-ref` attribute on the HTML root, if reading the SvelteKit `env` block proves fragile across a SvelteKit upgrade.
- The contestant sign-in through bank authentication (A4), and an automated mail round trip (E2).

</deferred>
