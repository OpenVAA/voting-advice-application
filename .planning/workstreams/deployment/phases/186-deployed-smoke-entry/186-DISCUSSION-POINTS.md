# Phase 186 — Discussion points

**Phase:** Deployed Smoke Entry (workstream `deployment`)
**Written:** 2026-11-14, from a scout of the tree at `2b96ac999` and read-only requests to `https://staging.openvaa.org`
**Closes:** SUPA-09
**Builds toward:** PIPE-07 (everything except the pipeline wiring, which phase 187 does)

## How to fill this

- Each decision lists its options as checkboxes. Exactly one is marked **★ RECOMMENDED**.
- **If you leave every box in a decision unticked, the ★ option is chosen.** Tick a box only to overrule it.
- Tick one other box to overrule. A `**NOTE:**` or `**EDIT:**` line beats any box.
- **⚠ DECIDE** marks the five decisions that change the shape of the phase: **A-01, A-05, C-01, D-01, D-02**. Read those first.
- You were away when this was written. `186-CONTEXT.md` has already been written from the ★ options, so planning can start. Overrule here before execution, and CONTEXT.md is rewritten from your fill.

Not asked here, because a ruling already settles them:

- The run is read-mostly. It has no setup project and no teardown project. The project is seeded once, out of band (E1).
- Bank authentication is not part of the run (A4), and neither is a mail round trip (E2).
- There is one applied environment. The staging project `cofbsatfrdysyphajsky` is the dedicated test project of SUPA-09 (A1).
- The local gate suite and its preflight do not change. The served-checkout gate has no bypass, so the deployed run needs an entry of its own (E section of `v2.17-DISCUSSION-POINTS.md`).
- Wiring the run into the pipeline, so that a failing run fails a deploy, is phase 187's work (PIPE-07).

---

## Factual baseline (re-verified 2026-11-14 at 21:40Z)

| Claim the phase inherits | On the tree, or as served | Evidence |
|---|---|---|
| Staging is serving | **Yes.** `GET /` answered `HTTP/2 200` through CloudFront (`x-cache: Miss from cloudfront`, POP `HEL51-P7`). `GET /api/health` answered `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}` | `curl -sI` and `curl -s`, 2026-11-14 21:39Z; matches `185-VERIFICATION.md` (19:30Z read) |
| Build SHA exposure | `/api/health` returns `build` = `$app/environment` `version`, which is baked in at build time from `BUILD_SHA` | `apps/frontend/src/routes/api/health/+server.ts:11-13`, `apps/frontend/Dockerfile:51-52` |
| The applied image tag | `image_tag = "712947a1…"`. That commit is "Source tree of 25ec14e81… without .planning". `git diff 712947a1..HEAD -- apps packages tests` is empty, so the deployed frontend is today's tree | `infra/envs/staging/aws/terraform.tfvars:46`, `git log -1 712947a1` |
| Project id exposure | The served `<body>` carries `data-project-id="00000000-0000-0000-0000-000000000001"`. **This is the same id as the local stack's default project**, so it cannot tell staging apart from a local or a forker's project | `apps/frontend/src/app.html:9`, `apps/frontend/src/hooks.server.ts:97`, served HTML |
| Expected project id | `public_project_id = "00000000-0000-0000-0000-000000000001"` | `infra/envs/staging/supabase/terraform.tfvars:32` |
| Supabase ref exposure | The served HTML carries SvelteKit's dynamic public `env` block with `"PUBLIC_SUPABASE_URL":"https://cofbsatfrdysyphajsky.supabase.co"`, and every `data-sveltekit-fetched` URL is on that host | served HTML, 2026-11-14 |
| The dedicated ref | `project_ref = "cofbsatfrdysyphajsky"`. No other project exists: the throwaway `begckvkapaopoztbreqc` was deleted on 2026-11-12 | `infra/envs/staging/supabase/terraform.tfvars:17`, `infra/envs/staging/supabase/README.md` Observations (2026-11-12 row) |
| Hosted dataset | **The `smoke` dataset is already seeded on the persistent project:** 1 election, 1 constituency, 4 organizations, 6 Likert-5 questions in one category, 1001 candidates and 1001 nominations, prefix `smoke_`, English only. An anonymous read gave `Content-Range: 0-0/1001`. The project is open for voters | `packages/dev-seed/src/templates/smoke.ts:1-14`, `infra/envs/staging/supabase/README.md:1262-1266, 1563, 1566` |
| Contestant on the hosted project | **None.** The `smoke` template creates no auth user (`smoke.ts:12`). The only user is the first administrator, who holds a project-scope `admin` grant and edits no entity. The contestant app refuses a user with no entity to edit | `smoke.ts:12`, README:1564-1565, `tests/tests/setup/shared/registerAndStoreSession.ts:19-21` |
| Contestant app on staging | Served (`/contestant/login` 200). The dataset's settings turn the contestant app on and serve candidates only | `packages/dev-seed/src/templates/e2e/perm/shared.ts:100-119` |
| How the local suite signs a contestant in | It mints the auth user through the service-role `SupabaseAdminClient` (`forceRegister`), then signs in through `createContestantLoginPage(page).signInFromCold` | `registerAndStoreSession.ts:6, 82` |
| Seed check on the hosted project | Fails on any auth user in the `openvaa.test` domain or with a seed id | `infra/scripts/check-seed.sql:4, 23, 39-60` |
| Precedent for one hosted user plus one grant | `grant-project-admin.sql` (env-only inputs, no `-v`, idempotent, prints a count and no address). The admin user was created with `POST /auth/v1/admin/users` and `email_confirm: true` | `infra/scripts/grant-project-admin.sql:1-30`, `184-22-SUMMARY.md:88` |
| Who ran hosted writes before | The orchestrator, from this workstation, with credentials from the operator's keychain, under an authorisation the operator gave for named sittings. The executor held no credential | `184-15-SUMMARY.md:67`, `184-21-SUMMARY.md:55`, `184-22-SUMMARY.md:56` |
| The local gate | Global setup runs `assertServedApp` (checkout via `/@fs`) and then `assertServedProject`, then `ensureProject()`, which writes. `baseURL` is localhost only. The config calls `dotenv.config()` and so loads the root `.env` | `tests/global-setup.ts:91-99`, `tests/playwright.config.ts:11, 1622` |
| The research flag's "local-port assumption" | `SUPABASE_URL ?? 'http://localhost:54321'` at module load. The constructor already takes a URL, and `createServiceRoleClient` refuses a non-local URL unless `allowRemote` or `DEV_SEED_ALLOW_REMOTE=1` | `packages/dev-seed/src/supabaseAdminClient.ts:84, 297-304`, `packages/dev-seed/src/localSupabaseUrl.ts:12, 65`, `tests/tests/utils/supabaseAdminClient.ts:171-172` |
| The same assumption elsewhere | `authApi.ts:12` and `accountAccessClient.ts:12` also default to `localhost:54321`. The smoke run needs neither | `tests/tests/utils/` |
| Fixtures a smoke run can reuse | The voter page objects and `walkVoterStages` import no admin client. `contestantLoginPage.fixture.ts` imports only a type from it. `voter-journey.fixture.ts` is wired to the multi-election `e2e/base` dataset | `tests/tests/fixtures/voter/voter-journey.fixture.ts:22, 29-36`, `tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts:49-59` |
| Harness unit tests | Vitest collects `tests/utils/**/*.test.ts` only, and `yarn test:unit` runs it | `tests/vitest.config.ts:21`, `package.json:49-50` |
| Typecheck scope of `tests/` | `tests/tsconfig.json` includes `tests/**/*.ts` and `*.ts`, so a top-level `tests/deployed/` directory would not be typechecked | `tests/tsconfig.json` |
| `DEV_SEED_ALLOW_REMOTE` in workflows | Absent from `.github/` and `tests/` today | `grep -rn` |

---

## A — What the run proves before it runs a spec

### A-01 — What identifies "the dedicated project" ⚠ DECIDE

The served project id is `0001`, the same id the local stack and every forker's default use (baseline). So a check on the project id alone passes against a local server, and against any other hosted project that kept the default.

- [ ] ★ RECOMMENDED — **Two checks: the served Supabase ref and the served project id.** The ref is taken from the host of `PUBLIC_SUPABASE_URL` in the served page's SvelteKit `env` block. It must be exactly the `project_ref` in `infra/envs/staging/supabase/terraform.tfvars`, which the run reads itself, and no input can name another ref. The `data-project-id` on `<body>` must equal `public_project_id` from the same file. The check fails closed when the `env` block is missing, the URL cannot be parsed or the host is not `<ref>.supabase.co`. The frontend does not change and staging is not redeployed.
- [ ] Add an explicit `data-supabase-ref` attribute beside `data-project-id`. This is a cleaner contract than reading SvelteKit's serialised `env`, but it changes the app, needs a new image and a redeploy of staging in this phase (a new SHA), and adds a second substituted placeholder to the local preflight's contract.
- [ ] The project id alone, as the local gate does. It costs nothing more, but it refuses nothing: a local server and staging serve the same id.

### A-02 — Where the expected build SHA comes from

- [ ] ★ RECOMMENDED — **A required input, `SMOKE_EXPECTED_SHA`, with no default.** It must be a full 40-character hex id and must equal the `build` of `/api/health` exactly. From a workstation the runbook takes it from `image_tag` in `infra/envs/staging/aws/terraform.tfvars`. In 187 the pipeline passes the commit it built and deployed by digest.
- [ ] Default it to `image_tag` from the tfvars. One input fewer, but the pipeline then proves only that the stack agrees with the file. It does not prove the stack runs the image the run just deployed, unless the file is rewritten first.
- [ ] Read it from the served page and print it. This is a tautology: it can never fail, so the wrong-SHA control of success criterion 2 cannot be seen.

### A-03 — The shape of the gate

- [ ] ★ RECOMMENDED — **A global setup in the second config, with all its logic in a pure module that is unit-tested.** It makes four checks: (1) it refuses to start when `SUPABASE_SERVICE_ROLE_KEY` is set in its environment; (2) the SHA; (3) the ref; (4) the project id. **All four are evaluated and printed**, one `PASS`/`FAIL <check>: observed …, expected …` line each. The setup throws (exit 1) before any spec if one failed. It reads nothing but `/api/health` and `/`, so it writes nothing.
- [ ] Stop at the first failure, as the local gate does. Shorter output, but a negative control then shows only that something failed first, not that its own check was the one that failed.

### A-04 — The target address

- [ ] ★ RECOMMENDED — `SMOKE_BASE_URL`, defaulting to `https://staging.openvaa.org`. There is **no host allowlist**: the safety property is the project the target serves (A-01), not its address. That is also what lets the negative controls run against local builds (E-01).
- [ ] An allowlist of `staging.openvaa.org`. It refuses typos early, but it makes the "not the dedicated project" control impossible to show against a real server, and it refuses the CloudFront and origin names that serve the same stack.

### A-05 — The research flag: making the admin client's local URL a parameter ⚠ DECIDE

The roadmap's research flag says the local-port assumption in `supabaseAdminClient.ts` must be made a parameter. The scout shows the constructor already takes a URL. What actually blocks a hosted URL is the local-only guard, whose opt-out is `allowRemote` / `DEV_SEED_ALLOW_REMOTE`. A read-mostly run (E1) needs no service-role client at all, and the run's one hosted write (the contestant) is out of band (D-01).

- [ ] ★ RECOMMENDED — **Do not change the admin client. The smoke entry holds no service-role client, and this is enforced.** The gate refuses a set `SUPABASE_SERVICE_ROLE_KEY` (A-03). An ESLint `no-restricted-imports` rule on the smoke files forbids a value import of `supabaseAdminClient`, `authApi`, `accountAccessClient` and `@openvaa/dev-seed`'s client (type imports stay allowed). The phase records this as a reading of the flag, not a skipped item.
- [ ] Follow the flag literally: give the tests' `SupabaseAdminClient` a hosted URL parameter with `allowRemote`. This puts a service-role client that can bulk-delete by prefix, pointed at the hosted project, into the tests tree. It also opens a path for `allowRemote` next to the smoke entry, against the spirit of success criterion 3.

---

## B — The second Playwright entry

### B-01 — Where the files go

- [ ] ★ RECOMMENDED — `tests/playwright.deployed.config.ts` and `tests/deployed-global-setup.ts` beside the local ones. The specs go in `tests/tests/deployed/*.smoke.ts`, a file suffix that the default `*.spec.ts` / `*.test.ts` match does not collect, and that no local project's `testMatch` names. The pure gate logic goes in `tests/tests/utils/deployedTarget.ts` with `deployedTarget.test.ts`, where vitest already looks. A root script `test:e2e:deployed` runs `playwright test -c ./tests/playwright.deployed.config.ts`. **Proof that the local suite is unchanged:** `playwright test --list -c tests/playwright.config.ts` gives the same count before and after, and lists no `deployed/` path.
- [ ] A separate top-level directory (`tests-deployed/`). This is cleanly apart, but it is outside `tests/tsconfig.json`, the tests ESLint config and vitest, so each needs widening, and every fixture import crosses trees.

### B-02 — The root `.env`

- [ ] ★ RECOMMENDED — **The deployed config does not call `dotenv`.** The root `.env` holds the local stack's URL and its service-role key. The run reads only its named inputs from the process environment, and a missing input is named in the failure.
- [ ] Load `.env` as the local config does. The local keys then reach a hosted run, and the service-role refusal of A-03 trips on every workstation run.

### B-03 — Projects and run settings

- [ ] ★ RECOMMENDED — One project, `deployed-smoke`: Desktop Chrome, no `dependencies`, workers 1, `fullyParallel: false`, **`retries: 0` in CI too**, trace `retain-on-failure`, and the report and results written under a directory given on the command line. A config-load check throws if any project has `dependencies` or a name or `testMatch` containing `setup` or `teardown`.
- [ ] Retries in CI, as the local config has (`retries: 3`). A smoke run that passes on its third try is the "retried until green" the E2E hard rule forbids.

### B-04 — A wrapper script

- [ ] ★ RECOMMENDED — No wrapper. `yarn test:e2e:deployed` is called directly and its exit status is read directly (`echo "smoke_exit=$?"`), in the evidence and in 187. A run interrupted by a host sleep is made again under a new output directory and recorded as such.
- [ ] A wrapper like `e2e-run.sh` with the heartbeat and the void marker. This is consistent with the local gate, but it is a second wrapper to maintain, for a run of about a minute.

---

## C — What the run does

### C-01 — The dataset the run reads ⚠ DECIDE

- [ ] ★ RECOMMENDED — **The `smoke` dataset already on the project (184 D-18), plus one contestant (D-01).** No second content seed. The specs read their expected content from the `smokeTemplate` module (the six question texts, the single election), so the template and the assertions cannot drift apart. The dataset's 1001 candidates also give the results page a realistic size.
- [ ] Seed `e2e/base` on the hosted project once. The local fixtures fit it as they are, but it lands in the same project `0001` beside `smoke`, so the voter sees two elections and the probe's row counts change. Removing it later is a prefix teardown run with `--allow-remote` against the hosted database.
- [ ] A new purpose-built template. It fits the run exactly, but needs a second hosted seed sitting. Replacing `smoke` would also remove the dataset of more than 1000 rows that the conformance probe reads.

### C-02 — The voter walk

- [ ] ★ RECOMMENDED — Home, intro, questions, all six answered, then results. With one election and one constituency the selection steps are skipped, so the walk is driven by `walkVoterStages` / `resolveVoterStage` and the voter page objects, not by the `answeredVoterPage` fixture, which is written for `e2e/base`. Assertions: the first question's text equals the template's first statement, and the results page shows candidate cards. The SSR reads come from the dedicated host, which A-01 already established.
- [ ] Reuse `answeredVoterPage` and generalise it. Less new code, but it changes a fixture that the local gate depends on, against success criterion 4.

### C-03 — The contestant sign-in

- [ ] ★ RECOMMENDED — A password sign-in through `createContestantLoginPage(page).signInFromCold`, then an assertion that the candidate's home is shown, then a sign-out. Nothing is edited. The writes are the auth service's own (a session, then its revocation).
- [ ] Sign in and do not sign out. One step less, but every run leaves a live refresh token on the hosted project.
- [ ] Also save one answer. That covers more of the app, but it is a write to content a voter reads, which breaks "read-mostly".

### C-04 — The contestant's credentials

- [ ] ★ RECOMMENDED — Inputs `SMOKE_CONTESTANT_EMAIL` and `SMOKE_CONTESTANT_PASSWORD`. Neither is committed, printed or written to the evidence. On a workstation they come from the operator's keychain. In 187 they come from GitHub Environment secrets.
- [ ] Commit the address and keep only the password secret. One input fewer, but the address then sits in a public repository next to a public sign-in form. Earlier phases never wrote an address out (184-22, 185-18).

---

## D — The one-time seeding of the hosted project

The only thing missing on the hosted project is a contestant who can sign in (baseline). This is a write to a hosted service, outside any workflow.

### D-01 — What is written, and with what ⚠ DECIDE

- [ ] ★ RECOMMENDED — **One user, one grant and one terms-of-use acceptance, written with curl and a committed SQL file.** (1) `POST /auth/v1/admin/users` with the service-role key, the address, a password and `email_confirm: true` (as in 184-22). The address is not in the `openvaa.test` domain, so the seed check stays green. (2) A new `infra/scripts/grant-smoke-contestant.sql`, modelled on `grant-project-admin.sql` (env-only inputs, no `-v`, idempotent, prints counts and never the address). It writes the candidate-editor grant on one `smoke_` candidate with a nomination, picked deterministically (the lowest `external_id`), and the user's terms-of-use acceptance. It refuses unless exactly one user has the address and the candidate and the project exist. No dev-seed, and no `--allow-remote`. The runbook gets the step as an item of Step 22 ("The smoke dataset"), with its removal (delete the user; the grant and the acceptance go with it, which research confirms or the removal deletes them explicitly).
- [ ] Give the `smoke` template an auth user. One command, but dev-seed creates no auth users by design, the template's own header promises it, and the seed is then rerun against the hosted project with `--allow-remote`.
- [ ] Invite through the Admin App and follow the mailed link. This is the real path, but it is a mail round trip (excluded by E2) and needs a mailbox for every reseed.

### D-02 — Who runs the hosted write ⚠ DECIDE

- [ ] ★ RECOMMENDED — **The orchestrator runs the committed step from this workstation at a checkpoint you approve**, with the service-role key and the database password from your keychain (the 184 sitting pattern). A prelude refuses any ref but `cofbsatfrdysyphajsky`, unsets every credential the step does not name, and refuses when the address already belongs to a user that is not this contestant. The step reads its result back (`grants=1`, `terms=1`, and a password sign-in answers 200) and prints no address, password or token. The executor writes the code and holds no credential. **Until you approve, the contestant half of the green run waits. The voter half and every negative control do not.**
- [ ] You run it by hand from the runbook, in your own terminal, and paste back the status lines. Same result, with about six paste-backs and your time.
- [ ] Run it tonight under the "standing staging authorisation" recorded in 184-22, with no fresh approval. This is fastest, but it stretches an authorisation given for 184's sittings to a new kind of write: an account with a password on a public URL. If the keychain asks for a confirmation, nobody is there to give it.

### D-03 — The password

- [ ] ★ RECOMMENDED — Generated in the sitting (`openssl rand`, 32 bytes, base64url), passed through the environment and never on a command line, and stored in your keychain under the service `openvaa-staging-smoke-contestant` with the address. It is never printed.
- [ ] You choose it and type it in. This puts a human-chosen password on a public sign-in form.

---

## E — The negative controls and the proofs

### E-01 — How the three controls of success criterion 2 are produced

- [ ] ★ RECOMMENDED — **Each control is a real target, and each fails at its own check alone.** (1) **Wrong SHA:** `SMOKE_EXPECTED_SHA` set to another valid 40-hex id, against staging. (2) **Wrong project id:** a local production build of the deployed tree, built with `BUILD_SHA` equal to the deployed SHA, started with the hosted project's URL and its publishable key (both public) and `PUBLIC_PROJECT_ID` set to another uuid. Only the project-id check fails. (3) **Not the dedicated project:** the same build started against the local stack (`http://127.0.0.1:54321`, project `0001`). Only the ref check fails, although the project id agrees. Each exit status is read directly and must be non-zero, and the evidence quotes the one `FAIL` line.
- [ ] Make the expected project id and ref inputs too, and set them wrong. Each control is then one variable, but the dedicated identity becomes a variable, and "cannot be pointed at a production project" becomes a promise about an input.
- [ ] Show (2) and (3) in the unit tests only. Cheaper, but success criterion 2 asks for a run seen red with its exit status.

### E-02 — "Cannot be pointed at a production project"

- [ ] ★ RECOMMENDED — A unit test of `deployedTarget.ts`. Every ref but the dedicated one is refused: a made-up ref, the deleted throwaway `begckvkapaopoztbreqc`, a local URL, a non-`supabase.co` host, and a missing `env` block. The test also asserts that no environment variable or argument changes the allowed ref. Since no production project exists (A1), "production" means any ref but the one in the tfvars.
- [ ] A refusal list naming production refs. There are none to name, and a list of refused refs lets every unlisted one through.

### E-03 — Keeping `DEV_SEED_ALLOW_REMOTE` and setup projects out

- [ ] ★ RECOMMENDED — A unit test, run by `yarn test:unit`, that reads `.github/workflows/**`, the deployed config, its global setup and `tests/tests/deployed/**`, and fails on `DEV_SEED_ALLOW_REMOTE`, `allow-remote` or `allowRemote`. It also loads the deployed config and fails on a project with `dependencies` or a setup or teardown name. Phase 187 then inherits the guard on the workflows it adds.
- [ ] One `grep` recorded in the evidence. Cheaper now, but it says nothing about the workflows 187 writes.

### E-04 — Success criterion 4: the local suite is unchanged and green

- [ ] ★ RECOMMENDED — `git diff --stat` over `tests/playwright.config.ts`, `tests/global-setup.ts` and `tests/tests/support/preflight.ts` is empty from the phase's first commit to its last, and the `--list` count is unchanged (B-01). Plans run targeted checks only, and one full local run through `tests/scripts/e2e-run.sh` at the end of the phase is the gate (standing rule of 2026-11-09). A void run is made again.
- [ ] A full local run after every plan that touches `tests/`. Stronger, but it costs about 10 minutes a run, and the standing rule asks for one at the end.

---

## F — Records

### F-01 — Where the how-to and the observations live

- [ ] ★ RECOMMENDED — The contestant step goes in `infra/envs/staging/supabase/README.md` Step 22, with a dated row in its "Observations" table (184 D-20). How to run the smoke entry, its inputs and how to read a gate failure go in a new § "Deployed smoke run" of `tests/README.md`, and one line goes under § Testing in `CLAUDE.md`. Raw evidence goes in `186-*/evidence/`. Phase 189 writes the user docs from these.
- [ ] Phase evidence only. Then 187 and 189 have to dig the inputs out of plan evidence.

### F-02 — Pending todos

- [ ] ★ RECOMMENDED — Fold none. A search of `.planning/todos/pending/` for smoke, deploy and e2e finds only local-suite items. `2026-08-11-e2e-port-identity-check-insufficient` concerns the local preflight, which this phase does not touch.
- [ ] Fold `2026-08-11-e2e-port-identity-check-insufficient`. It touches the local gate, against success criterion 4.

---

## Fill status

| Section | Decisions | ⚠ |
|---|---|---|
| A What the run proves first | 5 | 2 |
| B The second entry | 4 | 0 |
| C What the run does | 4 | 1 |
| D One-time hosted seeding | 3 | 2 |
| E Negative controls and proofs | 4 | 0 |
| F Records | 2 | 0 |
| **Total** | **22** | **5** |
