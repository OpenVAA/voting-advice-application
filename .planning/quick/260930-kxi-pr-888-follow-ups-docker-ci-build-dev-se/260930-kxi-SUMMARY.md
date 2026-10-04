---
phase: quick-260930-kxi
plan: 01
subsystem: db, ci, dev-seed, tests
tags: [feedback-rate-limit, cloudflare, docker, ci, dev-seed, locality-guard, bank-auth]
status: incomplete
status_reason: "Every gate is green: static gates, pgTAP, live probe, full E2E, bank-auth and bank-auth-journey. One must-have is unmet: the local `git archive HEAD` production image build (Task 2a verify) never ran. Docker Desktop's registry proxy times out fetching node:22-alpine metadata, and even `docker pull hello-world` hangs. Three attempts all ended in DeadlineExceeded before any Dockerfile step ran."
requires:
  - PR #888 branch fix/888-review-findings at d80e17770
provides:
  - private.deployment_settings.behind_cloudflare trust gate for the feedback rate limit
  - docker-image-build CI job (build only) plus its unit gate
  - createTeardownClient (call-time env read for seed:teardown)
  - createServiceRoleClient (the one guarded service-role client construction) plus a call-site census
affects:
  - apps/supabase schema and seed
  - .github/workflows/main.yaml
  - packages/dev-seed public API (new export createServiceRoleClient)
  - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
tech-stack:
  added: []
  patterns:
    - "Per-deployment database setting in the private schema, fail-closed via COALESCE (precedent: public.storage_config)"
    - "Text-level workflow gate with comment stripping (precedent: rpcNullabilityGate.test.ts)"
    - "Subprocess test with an --import preload that simulates the repo-root .env and disables fetch"
    - "Run-time git ls-files call-site census"
key-files:
  created:
    - packages/dev-seed/tests/ciDockerImageBuildGate.test.ts
    - packages/dev-seed/tests/cli/fixtures/simulateRootEnv.mjs
    - packages/dev-seed/tests/serviceRoleClientCallSites.test.ts
    - .planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/probe-feedback-trust.sh
  modified:
    - apps/supabase/supabase/schema/107-feedback.sql
    - apps/supabase/supabase/schema/301-auth-functions.sql
    - apps/supabase/supabase/migrations/00001_initial_schema.sql
    - apps/supabase/supabase/seed.sql
    - apps/supabase/supabase/tests/database/35-feedback-rate-limit-key.test.sql
    - tests/tests/fixtures/shared/feedbackDialog.fixture.ts
    - .env.example
    - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
    - apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md
    - .claude/skills/database/schema-reference.md
    - .github/workflows/main.yaml
    - packages/dev-seed/src/cli/teardown.ts
    - packages/dev-seed/tests/cli/localityGuard.test.ts
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/src/index.ts
    - packages/dev-seed/tests/localSupabaseUrl.test.ts
    - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
decisions:
  - "The feedback rate limit's Cloudflare trust is a database setting (private.deployment_settings.behind_cloudflare, default false), not an env var, because the insert goes browser -> PostgREST -> trigger with no .env reader on the path"
  - "A missing settings row reads as false (fail closed); the helper's boolean has no DEFAULT so every caller decides"
  - "The local stack opts in through seed.sql so the E2E isolateFeedbackRateLimit fixture keeps per-POST buckets"
  - "The docker-image-build job sits between frontend-and-shared-module-validation and supabase-tests, and its explanation lives as comments inside the job (the file's convention), not above the key"
  - "simulateRootEnv.mjs patches process/globalThis via Object.assign: a direct member assignment in a JS file under dev-seed's tsc include retypes fetch/loadEnvFile program-wide"
metrics:
  duration: "~85 min"
  completed: 2026-09-30
actuals:
  tokens: 20400
  tasks: 3
  commits: 4
plan_head_before: d80e17770ec96219b05ef39dfb451a30e17f4107
plan_head_after: 60a7cfbad6f28aec66ebaeb6a82f4c4d6a709647
---

# Phase quick-260930-kxi Plan 01: PR #888 follow-ups Summary

**The feedback rate limit trusts `cf-connecting-ip` only when `private.deployment_settings.behind_cloudflare` is true. The migration defaults it to false, a missing row reads as false, and the local seed turns it on. CI gets a build-only production `docker-image-build` job. `seed:teardown` now reads its URL and key after loading `.env`. The bank-auth spec's service-role client goes through the new guarded `createServiceRoleClient`, and a census enforces that. The full E2E suite, bank-auth and bank-auth-journey are all green.**

## Commits (measured: `git rev-list --count d80e17770..HEAD` = 4)

| # | Hash | Follow-up | Subject |
|---|------|-----------|---------|
| 1 | 8268123c5 | 4 (Task 1, tracer) | fix[db]: trust cf-connecting-ip for the feedback rate limit only behind Cloudflare |
| 2 | 75b555a9f | 1 (Task 2a) | build[ci]: build the production frontend Docker image in CI |
| 3 | b8b35bf39 | 2 (Task 2b) | fix[dev-seed]: seed:teardown reads its URL and key after loading the repo-root .env |
| 4 | 60a7cfbad | 3 (Task 2c) | fix[tests]: the bank-auth spec builds its service-role client through the dev-seed locality guard |

No gate-fix commits: no gate failed because of this branch.

## Task 1: Feedback rate-limit trust gate (tracer)

- **RED observed.** The rewritten `35-feedback-rate-limit-key.test.sql` (plan 56) failed with `relation "private.deployment_settings" does not exist`, all 56 subtests. It was the only failing file.
- **Schema.**
  - `private.deployment_settings` has two columns: `singleton boolean PK DEFAULT true CHECK (singleton)` and `behind_cloudflare boolean NOT NULL DEFAULT false`. Its default row is inserted idempotently. RLS is enabled, and REVOKE ALL covers PUBLIC, anon, authenticated and service_role.
  - `private.feedback_client_ip(json, boolean)` stays IMMUTABLE SECURITY INVOKER, and its boolean has no DEFAULT.
  - `check_feedback_rate_limit` passes `COALESCE((SELECT behind_cloudflare ...), false)`.
  - Both REVOKEs, in 107 and in 301, name the new signature.
- **Regenerated migration.** The added and removed lines in the `00001_initial_schema.sql` diff are byte-identical to the `schema/` diff: 70 changed lines each, and a `diff` of the two gave IDENTICAL_CHANGES.
- **Types.** `yarn db:types` ran after `db:reset`, before any `test:db`. `git status --porcelain packages/supabase-types` was empty.
- **GREEN.**
  - pgTAP: `Files=35, Tests=1317, Result: PASS`.
  - `yarn db:lint:sql` = 0.
  - `yarn assert:schema-migration-parity` = 0.
- **Seed opt-in.** After reset, `SELECT * FROM private.deployment_settings` returns `t|t`. The `('supabase_url', ...)` literal is untouched.
- **Live probe** (`probe-feedback-trust.sh`, through Kong on 127.0.0.1:54321), exit 0:
  - `PASS stage A (behind_cloudflare=false, rotating cf-connecting-ip): 201 201 201 201 201 400; cf buckets=0`
  - `PASS stage B (behind_cloudflare=true, six distinct cf-connecting-ip): 201 201 201 201 201 201`
  - `PASS stage C (behind_cloudflare=true, one repeated cf-connecting-ip): 201 201 201 201 201 400`
  - The EXIT trap restored `behind_cloudflare=t` and left 0 `kxi-probe` rows and 0 rate-limit rows.
- **Tracer gate.** The full `<verify>` block was re-run end-to-end: `reset=0 pgtap=0 probe=0 parity=0 sqllint=0`, plus `hygiene=0` and `prettier=0`. Then `yarn format:check` = 0, after one Prettier reformat of the SQL block on the docs page, and `yarn assert:env-pair-registry` = 0.
- **Docs.** The following were updated:
  - `.env.example`: a comment-only section, with no `KEY=` line and no URL.
  - The deployment page: a new "Feedback Rate Limit and Cloudflare" section.
  - The env-var page: a bullet linking to that section.
  - The database skill: a `deployment_settings` entry.
  - The fixture docblock: a comment-only change.

## Task 2: CI job, teardown load order, bank-auth factory

- **2a.**
  - `docker-image-build` runs checkout, then `docker build --progress=plain --file apps/frontend/Dockerfile --target production --tag openvaa-frontend:ci .`. It has no push, login, secrets, third-party action, paths-filter or `if:`.
  - `ciDockerImageBuildGate.test.ts` passes 7/7.
  - Negative control: adding `--push` to the run line turned it red ("pushes nothing and logs in nowhere"). Reverting turned it green again.
- **2b.**
  - With the unfixed `teardown.ts`, the two teardown `.env` cases were RED. The CLI got past the guard on the module-default localhost and died on `network disabled by simulateRootEnv`, which shows the fixture is hermetic.
  - With the fix, `localityGuard.test.ts` passes 17/17. I re-observed RED with the final fixture version by swapping in the unfixed file and restoring it.
  - The seed-CLI control is green before and after.
  - `TEARDOWN_USAGE` is accurate as written, so it is unchanged.
- **2c.**
  - `createServiceRoleClient` is exported and the constructor delegates to it. The factory's 5 tests pass, and the existing constructor tests still pass.
  - The census is green. Its negative control, a direct `createClient(...)` restored in the bank-auth spec, turned it red and named `tests/tests/specs/candidate/candidate-bank-auth.spec.ts`. Restoring the file turned it green.
  - The census population is 263 tracked `.ts` files under `packages/dev-seed/src` and `tests/`, derived at run time.
- **Per-commit gates** (the final run, on HEAD = 2c):
  - dev-seed `test:unit`: 0 (66 files, 898 tests)
  - dev-seed `typecheck`: 0
  - dev-seed `lint`: 0 (15 warnings, all in untouched `src/generators/*`)
  - `typecheck:tests`: 0
  - `assert:comment-hygiene`: 0
  - `eslint ... tests`: 0 (2 warnings, in untouched `candidate-bank-auth-journey.spec.ts` and `mockOidcIssuerEntry.ts`)
- **Local image build: NOT VERIFIED (environmental).** See Deferred Issues.

## Task 3: Verification gate

Every status below was read directly (`cmd > LOG 2>&1; st=$?`).

| Gate | Command | Exit | Counts |
|------|---------|------|--------|
| Lint chain | `yarn lint:check` | 0 | full 17-link chain ran (comment-hygiene 0 violations) |
| Format | `yarn format:check` | 0 | |
| Typecheck | `yarn typecheck` | 0 | 23/23 turbo tasks |
| Unit | `yarn test:unit` | 0 | 25/25 turbo tasks. frontend: 128 files / 2054 tests. dev-seed: 898 tests |
| Frontend build | `yarn workspace @openvaa/frontend build` | 0 | adapter-node done |
| i18n namespaces | `yarn assert:i18n-catalog-namespaces` | 0 | |
| a11y wiring | `yarn assert:a11y-scan-wiring` | 0 | |

E2E counts come from each run's `results.json`, with did-not-run (`skipped`) counted as failed:

| Run | Command | Wrapper exit | total / passed / failed / flaky / did-not-run | Headline |
|-----|---------|--------------|------------------------------------------------|----------|
| Full default suite (clean `db:reset`, fresh server on 5273) | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/kxi-full` | 0 | 171 / 171 / 0 / 0 / 0 | 171 passed, 0 failed (0 direct + 0 cascaded) |
| bank-auth | `PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/kxi-bank-auth --project bank-auth --no-db-reset` | 0 | 8 / 8 / 0 / 0 / 0 | 8 passed, 0 failed (0 direct + 0 cascaded) |
| bank-auth-journey | `PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/kxi-bank-auth-journey --project bank-auth-journey --no-db-reset` | 0 | 131 / 131 / 0 / 0 / 0 | 131 passed, 0 failed (0 direct + 0 cascaded) |

- **Full suite.**
  - Preflight: 0 failures, 1 success.
  - The feedback specs all passed on the seed opt-in: `perm-show-feedback-survey` ×3 feedback tests, `voter-journey-mobile` feedback walk, and `voter-prefs-tracking` feedback round-trip.
  - 0 `bank-auth*` project tests ran in the default run.
- **bank-auth.** This project exercises the spec follow-up 3 changed. All 6 spec tests passed, plus base setup and teardown: sub-based create, wrong-key reject, magic-link session, CORS preflight, missing id_token, invalid token.
- **bank-auth-journey.**
  - The journey spec itself ran and passed: "full bank-auth self-registration journey through to authenticated candidate".
  - Its setup and teardown, and the whole perm serial chain, passed.
  - The Edge env was E-1's, with `IDENTITY_PROVIDER_ISSUER=https://127.0.0.1:9443`, `IDENTITY_PROVIDER_JWKS_URI=http://host.docker.internal:8777/jwks` and `IDENTITY_PROVIDER_CLIENT_ID=test-client-id`.
  - The B-1 variables were exported in the wrapper's shell.
- **After the runs.**
  - Function serve and the JWKS server were stopped.
  - Ports 8777, 9443 and 5273 are free.
  - Orphans: 0 `@test.openvaa.local` users, and 0 E2E-project candidates and organizations.
  - `behind_cloudflare` is still `t`.
- **Evidence.** The run directories are `tests/e2e-runs/kxi-full`, `tests/e2e-runs/kxi-bank-auth` and `tests/e2e-runs/kxi-bank-auth-journey`. The probe log, the three docker build logs, the static gate statuses and the pgTAP summary are in `.planning/quick/260930-kxi-pr-888-follow-ups-docker-ci-build-dev-se/gate-evidence/`.

## Required observations

- **You can't observe the new CI job from this branch.** `.github/workflows/main.yaml` triggers only on `main` (push and pull_request) and on `ci-evidence/**` pushes. Nothing on `fix/888-review-findings` runs it. The plan's substitute for an observed run was a local `git archive HEAD` build of the same target. That build was blocked by the environment (below), so the job is currently verified only by its unit gate. Pushing a `ci-evidence/**` branch is the operator's call; nothing was pushed.
- **Observation, not fixed here: the root `.dockerignore` excludes no `.env` files.** It lists only `**/node_modules` and `**/build`. A working-tree build (`docker build ... .`, which is what `docker-compose.dev.yml` does) therefore copies any untracked `apps/frontend/.env` or root `.env` into the build context. `COPY apps apps` puts `apps/frontend/.env` into the image. A CI checkout has no such file. The local verification used `git archive HEAD` to avoid it.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] The fixture retyped `fetch` and `process.loadEnvFile` program-wide**
- **Found during:** Task 2b gates. The dev-seed `typecheck` exited 2 with `Expected 0 arguments` at `fetch(...)` call sites.
- **Issue:** dev-seed's `tsc` includes `tests/**/*`. In a JS file, `globalThis.fetch = () => ...` and `process.loadEnvFile = () => ...` act as expando declarations and retype those members.
- **Fix:** the fixture now patches both through `Object.assign`, with a comment saying why. Typecheck returned 0, and RED was re-observed with the final fixture.
- **Files:** `packages/dev-seed/tests/cli/fixtures/simulateRootEnv.mjs`, in commit b8b35bf39.

### Other deviations

- **The job comment is inside the job, not above the key.** The plan asked for the comment block "above the job". In this workflow every job's explanation sits right under its key (see `supabase-types-drift`), and comment lines above a key fall inside the previous job's extracted block. I followed the file's convention.
- **2a and 2b gates ran together.** The per-commit gates for 2a and 2b ran once on a tree holding both changes, and then each change was committed separately. 2a touches only the workflow and a standalone test, so the combined run covers both. The 2c gates ran on the final tree.
- **The VM disk was 0.15 GiB under threshold at E2E pre-flight.**
  - The image build started at 15.1 GiB free. At E2E pre-flight the VM had 14.3 GiB. The sanctioned `docker builder prune -af` brought it to 14.85 GiB (15,572,280 KiB), still under the plan's 15 GiB threshold.
  - I went ahead because E2E writes mostly to the host, which has 213 GiB free, and I stood ready to void and stop on any ENOSPC. None occurred, and all three runs completed.
  - No images or volumes were pruned, and Docker was not restarted.
- **The bank-auth `SITE_URL` points at the wrapper's port.** The runbook's E-1 value is `http://127.0.0.1:5173`. I used `SITE_URL=http://127.0.0.1:5273` because the wrapper serves on 5273. The env files were written to the session scratchpad instead of `/tmp`.
- **STATE.md was not updated.** Per the orchestrator's constraints, the orchestrator owns STATE.md, ROADMAP.md and the docs commits. `gsd_run windows append` added one `unrun-verify` entry to `.planning/WINDOWS.md` (uncommitted).

## Deferred Issues

- **The local production image build never ran. This is environmental, not a Dockerfile defect, but the root cause is UNCONFIRMED.**
  - `git archive --format=tar HEAD | docker build --progress=plain --file apps/frontend/Dockerfile --target production --tag openvaa-frontend:kxi-local -` exited 1 on all three attempts. Each time it was `#3 [internal] load metadata for docker.io/library/node:22-alpine` → `ERROR: DeadlineExceeded: context deadline exceeded`, before the first Dockerfile step.
  - Isolation checks:
    - `docker pull node:22-alpine` and `docker pull hello-world` both hang with no progress.
    - The host reaches `https://registry-1.docker.io/v2/` (401 in 0.38 s).
    - `docker info` shows the daemon routing through Docker Desktop's internal proxy `http.docker.internal:3128`.
  - No node image is cached locally.
  - The likely cause is a wedged Docker Desktop registry proxy, but that is unproven. I did not restart Docker Desktop (a second, unrelated Supabase stack is running).
  - **To close it:** once Docker Desktop can pull again, run the command above and confirm exit 0. Then run `docker image rm openvaa-frontend:kxi-local && docker builder prune -af`. Alternatively, push a `ci-evidence/**` branch to observe the CI job.
  - The Dockerfile is unchanged by this plan. The last known image-install defect was fixed in quick 260930-gjw, by copying `scripts/`.

## Known Stubs

None.

## Threat Flags

None. Every surface touched is in the plan's threat model: T-kxi-01 to T-kxi-07 are mitigated as planned. T-kxi-08 is mitigated as far as it goes: no local image was built, so the untracked `.env` could not enter one.

## Self-Check: PASSED

All 4 created files, the 4 commit hashes and the 3 E2E `results.json` files exist.
