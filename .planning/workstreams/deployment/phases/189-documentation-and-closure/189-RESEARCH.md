# Phase 189: Documentation and Closure - Research

**Researched:** 2026-11-20, tree `ec531edcd` (`apps/`, `packages/`, `tests/` identical to the last full E2E run's tree `0b947a34b`; since then only `infra/envs/staging/aws/README.md` changed)
**Domain:** deployer documentation (docs site + runbooks), small code removals (Render, orphan compose, unused env vars), drift-guard unit tests, closure records, three operator-gated reads/one apply
**Confidence:** HIGH for every tree measurement (read this session with file:line); MEDIUM for the two Supabase backup facts (official docs, read 2026-11-20); LOW/ASSUMED where marked (origin-rotation plan shape, docs-nav generator behaviour on a hand-added child)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Every answer below is the ★ RECOMMENDED option of `189-DISCUSSION-POINTS.md`, except F-01, which the operator overruled in the 2026-11-20 fill. Decisions marked **provisional — research** take the research step's measurement where it contradicts them, and the plan says so.

#### Already settled by earlier rulings (not re-asked)
- Terraform 1.16 with HCL kept OpenTofu-compatible, and the docs say so (A6).
- The docs describe the analytics mechanism; the consent determination is the deployer's: consent is asked by default, `trackEvents` is respected, server pageviews are recorded in any case (B7).
- Admin job progress is a documented limit; moving the job store is a future requirement (D1, worded per E-04 below).
- Raw evidence goes in `189-*/evidence/`; each fact is a dated `| Date (UTC) | Observation |` row (184 D-20).
- **Superseded:** ruling A5 / 181-12's "`render.example.yaml` fixed and kept as an untested alternative" is replaced by F-01 below.

#### Where the documentation lives (A)
- **A-01** The docs site (`apps/docs`) carries the fork-facing guide, the reference pages and the runbook summaries. The staging runbooks (`infra/README.md`, `infra/bootstrap/README.md`, `infra/envs/staging/{aws,dns-mail,supabase}/README.md`) stay as the measured record. Each guide step states the step and the command and links to the runbook step where it was measured; the runbooks gain "← guide" back-links. No procedure is copied whole. — **Reversibility:** costly — the docs structure and every cross-link.
- **A-02** A `developers-guide/deployment/` subtree, regenerated in the nav (`apps/docs/scripts/generate-navigation-config.ts` → `apps/docs/src/lib/navigation.config.ts`): `deployment/` (overview and the path from an empty AWS account and a new Supabase project), `deployment/hosted-settings` (DOCS-02), `deployment/operations` (DOCS-06). **No `deployment/render` page** (F-01). Variables stay on `configuration/environmental-variables` (DOCS-04); analytics gets a new `configuration/analytics` page (DOCS-05). `deployment/` keeps its path, so no redirects.
- **A-03** The guide is written against `infra/envs/example/{aws,dns-mail,supabase}` with placeholders (`<your-domain>`, `<account-id>`), staging cited as the worked, measured instance ("observed on staging, 2026-11-xx"). The example roots gain no READMEs; the guide is their README.

#### Reference pages (B)
- **B-01** `deployment/hosted-settings`: a hand-written table, one row per setting — group / setting / value / where the repository sets it (`infra/modules/supabase/hosted-settings.json` key, `settings.tf` or `function-secrets.tf`) / parity class / how to verify (probe check name from `infra/scripts/probe/checks.mjs`, or the dashboard read where the probe does not reach). A new unit test asserts every key of `hosted-settings.json` and each `settings.tf` and function-secret name appears on the page, modelled on `startup/taskEnvironment.test.ts`.
- **B-02** `configuration/environmental-variables` rewritten, grouped by role: required at start, proxy (`ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`, and how the depth is measured), timeouts, analytics, diagnostics (`DEPLOYMENT_DIAGNOSTICS`), identity provider, `BOOTSTRAP_*`, local only. Fix l.62 (`send-email`, not `identity-callback`, reads `PUBLIC_PROJECT_ID`). Extend `taskEnvironment.test.ts` or add a sibling so every name in `task-environment.json`, `REQUIRED_ENV` and `ANALYTICS_ENV` must appear on the page.
- **B-03 (provisional — research)** Remove `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL` everywhere: `apps/frontend/src/lib/utils/constants.ts:4-5`, `.env.example`, the root `docker-compose.dev.yml`, the five auth test mocks, the env page and the guide (the `render.example.yaml` copies go with the file, F-01). Re-grep first, including `apps/docs` and `packages/`; if a non-test reader is found, the plan keeps it and says so. — **Reversibility:** reversible — an env read removed.

#### "Unverified" statements (C)
- **C-01** Every deployed system counts: Supabase, AWS and SES (Render's statement leaves with the file, F-01). For each of the remaining statements (2 on the Supabase guide, 8 in `infra/bootstrap/README.md` "Not yet observed", 3 in `aws/README.md`, 5 in `dns-mail/README.md` plus l.310): (1) observe it now when a read-only check or an existing record settles it, as a dated row; otherwise (2) remove it from the docs and the runbook and carry it into one new pending todo, "Unobserved statements about the deployed stack (189)", listing each with its check. The emptied "Not yet observed" sections are deleted, the empty one in the supabase README included.
- **C-02** A recorded search, no permanent guard: the exact `git grep -niE` pattern (`unverified|not yet observed|untested`) over docs, READMEs and comments goes into the verification, every remaining hit classified as unrelated (`UNVERIFIED_ANSWERS`, "unverified user", the probe check name `functions.identity-callback-unverified`).

#### Analytics documentation (D)
- **D-01** One page, `developers-guide/configuration/analytics`: the mechanism (relay, modes, consent default, server pageview, visit id), the event catalogue, adding a provider (`PROVIDERS` in `apps/frontend/src/lib/server/analytics/config.ts`, the switch in `providers/index.ts`, one file per provider), the privacy mechanism, and the deployer's checklist. `publishers-guide/.../what-data-should-be-collected` gets a pointer to the checklist. The page never says no consent is required.
- **D-02** The event catalogue is a hand-written table (event / when sent / fields / sent before consent?), with a unit test that the table names exactly the `name` literals of `EventSchema` (`apps/frontend/src/lib/analytics/events.schema.ts`).
- **D-03** The checklist, each item phrased as the deployer's own determination, never a conclusion: consent mode; `trackEvents`; visit-id mode; the server pageview recorded in any case; the provider's region and data-processing terms; PostHog's IP-capture setting and `$geoip_disable`; the billing limit (staging: 20 USD); retention, including the 90-day log group; the terms-of-use paragraph on tracking (B5); the address `account-access` stores as its per-caller limit key and Cloudflare's `cf-connecting-ip` (188 E-04); the feedback limit's stored address (`107-feedback.sql`).

#### Operations runbook (E)
- **E-01** `deployment/operations`: a summary per procedure (when to use it, the commands, the expected result, a link to the measured runbook step): election-day scaling (floor raise, the capacity lower bound of at least 40 voter journeys a minute and its `trackEvents=false` condition); rollback (circuit breaker, roll-forward on `deploy/staging`, FUT-10 deferred); teardown (`destroy.yml`, the hand destroy, `prevent_destroy`); restore; secret rotation; SES sandbox and production access; the Admin job limit. Cost (INFRA-13: 50.78 USD/month priced, 36.96 measured, 44.26 with untagged IPv4) carried from `185-*/evidence/185-22-cost.md`.
- **E-02 (provisional — research)** Supabase backup and restore: one read-only Management API read of the staging project's backups (`GET /v1/projects/{ref}/database/backups`, PITR included) recorded as a dated row; the restore procedure described from Supabase's documentation, read on a date and cited. No restore drill; a pending todo "Restore drill into the throwaway project" is filed. — **Reversibility:** reversible — a read.
- **E-03 (provisional — research)** Secret rotation: one procedure per secret, written from its mechanism with `file:line` (SSM `PUBLIC_SUPABASE_ANON_KEY` and `ANALYTICS_POSTHOG_KEY` reach a task only on a new deployment; `random_password.origin_verify`; the SES SMTP key; the seven Supabase function secrets plus `IDENTITY_CALLBACK_SERVER_SECRET`; the database password, service-role key and access token; seven GitHub secrets). The legacy anon/service keys are noted as rotatable only with the JWT secret, which signs out every user. **One rehearsal on staging:** `terraform apply -replace=random_password.origin_verify` with `/api/health` polled through the apply and any window of 403s recorded. — **Reversibility:** costly — an outward staging apply; a bad apply leaves CloudFront and the ALB out of step until re-applied.
- **E-04** Document the Admin job limit as the tree is: `jobStore.ts` is in-memory, so progress polling is unreliable whenever more than one task runs — on staging, under load (`task_ceiling = 2`, `infra/envs/staging/aws/terraform.tfvars:22`). Workaround: run Admin jobs when one task is serving, or pin `task_ceiling = 1` for the job's duration. The ceiling stays at 2; D1's "staging runs one task" is recorded as superseded by 185's scaling.

#### Render and the compose files (F)
- **F-01 (operator overrule, 2026-11-20 fill)** **Remove the whole Render deployment example and its mentions from the guides, and everything needed only for it. The instructions are no longer maintained.** This removes `render.example.yaml`, the Render parts of `deploymentTemplates.test.ts` and `analyticsEnvTemplates.test.ts` (whole tests where they only guard Render), the Render text of the deployment guide and env page, the `deployment/render` page of A-02, and the Render references in `CLAUDE.md` § Deployment and anywhere else a grep finds them. Anything Render shares with another consumer (the root compose, the task environment) stays. **DOCS-07 and ROADMAP § 189 criterion 5 are amended** to read "the Render deployment example and its mentions are removed, the orphan compose file is retired if nothing references it" — the plan edits both, citing this fill. — **Reversibility:** reversible — git history keeps the file.
- **F-02 (provisional — research)** Delete `apps/frontend/docker-compose.dev.yml` and the Dockerfile's `development` target (`apps/frontend/Dockerfile:38`), its only user. Re-grep first, including `.github`, `infra/` and `apps/docs`; afterwards build the `production` target to show the multi-stage file still works.
- **F-03** Keep the root `docker-compose.dev.yml` and its three tests (`deploymentTemplates.test.ts:87-106`, `analyticsEnvTemplates.test.ts:109-118`, `localSupabaseUrl.test.ts:233`) — the tests' compose halves survive F-01. It loses the two frontend-URL lines (B-03). `infra/local/docker-compose.proxy.yml` serves a different purpose.

#### Closure and items aimed at this phase (G)
- **G-01** The 188 convention: move each of the six pending todos to `.planning/todos/completed/`, add `completed: 2026-11-xx` and `status: completed`, and a `## Closed (phase 189), <date>` section with "What was built", evidence paths, "What remains" and "Moved". The caller-limit todo (closed in 188) gets one line in the phase summary pointing to its record.
- **G-02** The self-hosted PostHog log-sink todo closes with a short comparison written from what is measured: container logs (90-day log group) as the durable server sink; PostHog Cloud EU for analytics, proven in 188; self-hosting not provisioned (`REQUIREMENTS.md` anti-feature); browser errors (RELAY-D4) moved to future work. No new research.
- **G-03** The hosted-auth todo closes; the three unobserved asks (`identity-callback` secret checks, the shared per-IP sign-in budget, the OTP-length label) move into one new pending todo "Pre-launch auth checks on the production project", each with its check. The OTP label and the `identity-callback` secret checks are observed now if a read-only probe row settles them.
- **G-04** The identity-callback closing check: record (a) fixed opaque replies, (b) `identityMatchProp: 'sub'` on both providers with the frontend copies agreeing, (c) `verify_jwt = false` with its hosted half from the latest `functions.identity-callback-unverified` probe row (or one fresh read-only probe run), each with `file:line` and today's date; record (d) drift guard as "none" and file a pending todo for one.
- **G-05** Fold in: the buckets-by-hand text in the guide (181 deferred-items:24); `BOOTSTRAP_*` (B-02); the `seed.sql` comment and guide steps (181-08-SUMMARY:297); the dangling conflict-1 reference in `.claude/skills/recommended-skills/SKILL.md` (181-18); the stale redirect path `/api/auth/callback` → `/auth/confirm` in the redirect-allowlist todo; REQUIREMENTS INFRA-13 → Complete with a dated note on 185-VERIFICATION. Re-target to "after the stream merges", with a dated note in each: `2026-11-15-dependency-audit-third-party-advisories`, `2026-11-17-local-supabase-ports-in-ephemeral-range`, 187's `DISPATCH_OBSERVABLE=after-merge` read.

#### Outward actions and gates (H)
- **H-01** Operator checkpoints, each its own sitting: (1) read-only probe run and reads against the staging Supabase project and `https://staging.openvaa.org` (C-01, G-03, G-04); (2) the Management API backups read (E-02); (3) one staging apply `-replace=random_password.origin_verify` with health polled (E-03). No push to `deploy/staging`, no destroy.
- **H-02** E2E: the phase changes code (B-03, F-01, F-02, the new guards), so plans make targeted runs of affected projects; the final plan makes one full-suite run judged against the last full run with summed deltas (CLAUDE.md ruling 2026-11-09). The production-target Docker build after F-02 is part of that plan's proof. `yarn lint:check`, `yarn format:check` and the docs build (`yarn workspace @openvaa/docs build`) gate the docs changes.

### Claude's Discretion
- File names of the new guard tests and the exact sections of each docs page.
- Which runbook steps get "← guide" back-links beyond those the guide cites.
- The wording of each closure record, within G-01's convention.

### Deferred Ideas (OUT OF SCOPE)
- Restore drill into the throwaway project (new todo, E-02).
- Unobserved statements about the deployed stack (new todo, C-01).
- Pre-launch auth checks on the production project (new todo, G-03).
- identity-callback frontend/Deno claim-config drift guard (new todo, G-04).
- Rehearsing the other secret rotations.
- Moving the Admin job store out of memory; ALB stickiness for `/admin`.
- Dependency audit, local port range, 187 after-merge dispatch read (after the stream merges).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOCS-01 | Guide rewritten around Terraform + Supabase-as-code, states HCL is OpenTofu-compatible (A6) | § Docs site structure (nav pitfall), § Guide content sources, § OpenTofu statement (no `tofu` anywhere in the tree) |
| DOCS-02 | Settings reference: each hosted setting, where set, how to verify | § Hosted-settings inventory (29 JSON leaf keys + array, 6 `settings.tf` keys, 7 rate limits, 2 SMTP secret keys, 7 function secrets; 22 probe checks), § Guard B-01 |
| DOCS-03 | Every "unverified" statement about a hosted project replaced by a dated observation or removed | § C-01 classified table (incl. 9 hits the locked pattern misses), § C-02 hit list |
| DOCS-04 | Env reference covers proxy, analytics, `PUBLIC_PROJECT_ID` | § Env inventory (17 task vars, `REQUIRED_ENV`, `ANALYTICS_ENV`, 6 `BOOTSTRAP_*`), § Guard B-02, § B-03 re-grep |
| DOCS-05 | Analytics docs: catalogue, add a provider, privacy mechanism, jurisdiction checklist; consent is deployer's; never "no consent required" | § Analytics sources (30 event names, `EVENT_NAMES` export, `SENSITIVE_EVENTS`), § Guard D-02, § feedback-limit retention finding |
| DOCS-06 | Ops runbook: election-day scaling, rollback, teardown, restore, rotation, SES, Admin job limit | § E-02 backup API + restore doc, § E-03 rotation mechanisms per secret, § origin-secret rehearsal |
| DOCS-07 (amended by F-01) | Render example + mentions removed; orphan compose retired if unreferenced | § F-01 Render inventory (13 unit tests removed), § F-02 re-grep (no user), production build command |
| DOCS-08 | Each of the seven absorbed todos has a closure record | § G-01..G-05 todo states |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **E2E cardinal rule:** no task completes while any E2E test is red; "did not run" = failure; no flaky exemptions; a void run (exit 8, `VOID-host-suspend.txt`) is rerun under a new `--run-dir`.
- **Within a phase, targeted runs; full suite at the phase end** (ruling 2026-11-09): one `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset --project <p>` per affected project after the plan's last code commit (the wrapper keeps only its last `--project`); each plan records project test-count deltas against the last full run; the final plan makes one full run judged against it with summed deltas.
- `bank-auth` and `contestant-identity-provider` only pass under the wrapper (it prepares the IdP test environment).
- **Comment Hygiene** (applies to `apps/`, `packages/`, `tests/`; `.planning/`, `.claude/`, `CLAUDE.md` exempt): no historical narrative, planning refs only as bare `see phase N`, nothing addressed to the reviewer (`[PR review]` tag if unavoidable), concise. `yarn assert:comment-hygiene` (a link of `yarn lint:check`) additionally fails a comment line that **ends without terminal punctuation and continues on the next line** (forced line break, `scripts/assert-comment-hygiene.mjs` Rule 2) — write each comment sentence/paragraph on one line, as the existing tests do.
- TypeScript strictly, no `any`; exported symbols documented with TSDoc.
- Never commit `.env` or secrets; the docs may print no key, token, address or password.
- All user-facing strings localized — not touched here (docs are English-only Markdown; no app strings change).
- Code review checklist `.agents/code-review-checklist.md` applies to code changes.
- `yarn lint:check`, `yarn format:check`, `yarn test:unit` are the gates; never read a gate's status through a pipe (memory).
- `yarn test:unit` needs the shared local stack running (dev-seed integration tests read `SUPABASE_URL`) (memory).

## Summary

This is a documentation-and-closure phase with four small code changes (B-03, F-01, F-02, three new guard tests). Every provisional item measured clean against CONTEXT, with four corrections the planner must carry: (1) B-03 has **four** auth test mock files, not five, and no non-test reader anywhere (`apps/docs`, `packages/`, `infra/`, `.github`, `tests/` included); (2) the locked C-02 pattern misses **at least nine** statements about deployed systems marked unobserved in other words ("untried", "has not been observed", "not measured") — four in Terraform module comments, all four already settled by dated Observations rows; (3) the docs nav renders any item that has children as a non-link `<details><summary>`, so adding children under `deployment/` makes the overview page unreachable from the nav unless an explicit Overview child is added; (4) the origin-secret rotation is expected to produce a 403 window, because Terraform updates the ALB listener rule (seconds) and the CloudFront distribution (minutes to propagate) in parallel from one `random_password`, with no dependency between them.

F-01 removes `render.example.yaml` plus 13 Render-only unit tests (5 in `deploymentTemplates.test.ts`, 8 in `analyticsEnvTemplates.test.ts`) and edits four shared files' comments (`.github/workflows/main.yaml:181-184`, `ciDockerImageBuildGate.test.ts:6`, both test headers) and `CLAUDE.md:334`. F-02 has no user anywhere: `apps/frontend/docker-compose.dev.yml` is referenced by nothing and is the only `target: development`. No E2E spec changes, so the expected E2E delta is **0** against the last full run `tests/e2e-runs/188-close3-20261119T213204Z` (729 passed / 0 / 0, tree `0b947a34b`).

The docs work is large but sourced: the measured procedures live in ~7,700 runbook lines; the reference tables can be built mechanically from `hosted-settings.json`, `settings.tf`, `function-secrets.tf`, `variables.tf`, `task-environment.json`, `bootstrap.sql:18-28`, `checks.mjs` and `EVENT_NAMES`, and the three guards make those tables drift-proof. `validate:links --check` is the docs' strongest gate: it checks anchors (13 inbound links target `/developers-guide/deployment`, 9 with anchors), redirect stubs, GitHub source paths (a link to the deleted `render.example.yaml` fails it) and inbound `openvaa.org` URLs from runbooks.

**Primary recommendation:** Split into ~6 plans: (1) code removals B-03 + F-01 + F-02 with unit and targeted-E2E proof and the Docker build; (2) guards B-01/B-02/D-02 written red-first against fixture pages; (3) reference pages (hosted-settings, env, analytics) to turn the guards green; (4) guide + operations page + runbook back-links + C-01 sweep (incl. the module comments); (5) operator sittings H-01 (1)(2)(3) with evidence rows; (6) closure records, new todos, REQUIREMENTS/ROADMAP edits, C-02 recorded search, full E2E run.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Deployer guide, reference pages, ops summaries | CDN / Static (docs site `apps/docs`, prerendered SvelteKit) | Repository runbooks (`infra/**/README.md`) | A-01: docs site is the entry point; runbooks are the measured record |
| Hosted Supabase settings | Database / Storage (hosted project, written by `infra/modules/supabase`) | Terraform state | One writer: the settings resource (`infra/README.md:107-109`) |
| Frontend env (task environment) | API / Backend (ECS task, adapter-node) | SSM Parameter Store | `task-environment.json` is the contract; parameters resolved at task start |
| Origin lock secret | CDN (CloudFront custom header) | Load balancer (listener rule) | Both read `random_password.origin_verify` |
| Analytics relay / providers | API / Backend (frontend server) | Browser (sends events to `/api/usage`) | `PROVIDERS` + switch in server code |
| Backups / restore | Database / Storage (Supabase platform) | Management API | Platform-owned; repo only reads |
| Drift guards | Repository unit tests (vitest) | — | Pure file reads, no network |

## Standard Stack

No new libraries. Everything is in the tree.

| Tool | Version (measured) | Purpose |
|------|--------------------|---------|
| vitest (frontend, dev-seed, infra suites) | in lockfile | the three new guard tests |
| SvelteKit docs site (`@openvaa/docs`) | in lockfile | Markdown pages under `apps/docs/src/routes/(content)/` |
| Terraform | 1.16.5 (`terraform --version`, this host) [VERIFIED: local probe] | the origin-secret apply |
| Docker | 29.7.2, daemon up [VERIFIED: local probe] | production-target build proof |
| AWS CLI | 2.34.7 [VERIFIED: local probe] | operator sittings |
| jq 1.7.1, curl 8.7.1, gh 2.103.3, node 24.21.0, yarn 4.18.1 | [VERIFIED: local probe] | scripts, Management API read |

## Package Legitimacy Audit

No external packages are installed by this phase. **Packages removed due to [SLOP]:** none. **Flagged [SUS]:** none.

## Re-measured Baseline (the provisional items)

### B-03 — the two frontend-URL variables

Command: `git grep -n "FRONTEND_URL" -- ':!.planning'` — 18 hits, all listed [VERIFIED: grep + Read of `constants.ts`]:

| Site | Kind | Action |
|------|------|--------|
| `apps/frontend/src/lib/utils/constants.ts:4-5` — `PUBLIC_BROWSER_FRONTEND_URL: env.PUBLIC_BROWSER_FRONTEND_URL ?? '',` / `PUBLIC_SERVER_FRONTEND_URL: env.PUBLIC_SERVER_FRONTEND_URL ?? '',` | the only reader | remove both lines |
| `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts:41-42` | test mock | remove |
| `apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts:44-45` | test mock | remove |
| `apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts:43-44` | test mock | remove |
| `apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts:36-37` | test mock | remove |
| `.env.example:114-115` (under the `# Frontend configuration` banner, l.110-112; `FRONTEND_PORT=5173` at l.117 stays) | template | remove the two lines |
| `docker-compose.dev.yml:17-18` | root compose | remove the two lines |
| `render.example.yaml:47-50` | Render | goes with the file (F-01) |
| env page `.../configuration/environmental-variables/+page.md:97` | docs | remove |
| guide `.../deployment/+page.md:45` | docs | goes with the rewrite |

**Correction to CONTEXT:** four auth test files carry the mocks, not five. No dynamic read exists: `git grep -nE "(publicConstants|constants)\[|\.\.\.(publicConstants|constants)\b|Object\.(keys|entries|values)\((publicConstants|constants)\)" -- apps/frontend/src` returns nothing. No hit in `packages/`, `infra/`, `.github`, `tests/` or any `.svelte` file. **B-03 stands as decided.** No test pins the root compose's or `.env.example`'s full variable list (the three compose tests assert named variables only; `taskEnvironment.test.ts` asserts task names are listed in `.env.example`, which the two removed names are not).

### F-01 — Render inventory

Command: `git grep -n -E "render\.example|render\.com|\bRender\b|fromGroup|envVarGroups|onrender|render\.yaml|Blueprint" -- ':!.planning'` (case-sensitive `Render` avoids Svelte `{@render}`; `s7_render_exit`/`s17_render_exit` in the AWS runbook and `render_effect` in `getRoute.svelte.ts` are page rendering, unrelated).

| Site | Render-only? | Action |
|------|--------------|--------|
| `render.example.yaml` (69 lines) | yes | delete |
| `packages/dev-seed/tests/deploymentTemplates.test.ts:75-85` `describe('render.example.yaml')` — 1 + 4 (`it.each(SERVER_VARIABLES)`) = **5 tests** | yes | delete block; edit header l.1-13 (remove l.6 bullet; "templates" wording) |
| `packages/dev-seed/tests/analyticsEnvTemplates.test.ts:95-107` `describe('render.example.yaml')` — 6 + 1 = **7 tests**; `TEMPLATES` l.30 entry → `it.each(TEMPLATES)` l.121 loses **1 test**; helper `renderEntry` l.51-65 becomes unused (lint) | yes | delete block, the array entry and the helper; header l.2 "three" → "two", remove l.5 bullet |
| `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts:6` "the image `docker-compose.dev.yml` and `render.example.yaml` deploy" | shared file, Render clause | edit comment only |
| `.github/workflows/main.yaml:181-184` comment "…and the one `render.example.yaml` deploys (no target, so the final stage, which is `production`)…" | shared file, Render clause | edit comment only (no assertion reads it) |
| `CLAUDE.md:334` § Deployment (whole paragraph is Render-framed) | shared | rewrite: frontend on AWS (ECS behind CloudFront, Terraform under `infra/`), backend Supabase Cloud; point to the guide; keep "`docker-compose.dev.yml` is for production build testing only" |
| guide `+page.md:5,38-56` (template, "Deploy the frontend on Render", "Upgrading an older Render service") | yes | goes with the rewrite |
| `.planning/todos/pending/2026-09-18-…:47` "`render.example.yaml` or its surrounding docs point to that section" and `2026-10-02-…` item 1 | todo text | closure records say the file was removed (F-01) |
| `apps/docs/src/routes/+page.svelte:228` `href: 'https://voting-advice-application-qu5v.onrender.com'` | **not the example** — a live demo VAA link on the docs home | keep (see Open Question 2) |
| `scripts/fixtures/assert-test-keys-scope.input.txt:23` `# @as render.example.yaml` | a path label inside a guard's self-test fixture; the file is not read | keep (editing shifts the line numbers its `.expected.violations` pins) |

Net unit delta from F-01: **−13 tests** in `@openvaa/dev-seed`. Root-compose tests survive untouched (`deploymentTemplates.test.ts:87-108`, `analyticsEnvTemplates.test.ts:109-119`, `localSupabaseUrl.test.ts:233`).

### F-02 — orphan compose and the `development` target

Command: `git grep -n -E "frontend/docker-compose|target: *development|--target[ =]development" -- ':!.planning'` → the only hit is `apps/frontend/docker-compose.dev.yml:6` itself [VERIFIED]. Every `docker-compose.dev.yml` reference elsewhere (`.env.example:127`, `main.yaml:182`, `CLAUDE.md:206,334`, guide l.143-147, three tests) is the **root** file. `.github`, `infra/` and `apps/docs` build only `--target production` (`main.yaml:199`, `infra/scripts/build-push-image.sh:279`, `infra/local/docker-compose.proxy.yml:11`). `infra/local/check-proxy-topology.sh:474` reads the **last** `^CMD` line of the Dockerfile — still production's after the deletion. `ciDockerImageBuildGate.test.ts:122-123` asserts `AS production` exists — unaffected.

Delete `apps/frontend/Dockerfile:38-43` (`FROM frontend AS development` … `CMD yarn workspace @openvaa/frontend dev --host`). **F-02 stands.**

Production-target proof command (the CI job's own, `main.yaml:199`), from the repo root:

```bash
docker build --progress=plain --file apps/frontend/Dockerfile \
  --target production --tag openvaa-frontend:ci .
echo "docker_build_exit=$?"
```

### C-01 — every statement about a deployed system marked unobserved

**Pitfall: the locked C-02 pattern is narrower than the criterion.** It misses "untried", "has not been observed", "not measured". The planner should add the supplementary pattern in § C-02 and treat its hits the same way (the CONTEXT rule "provisional items take the measurement" does not cover C-02, so the plan should state it as an addition, not a replacement).

| # | Statement (file:line) | Settled by an existing dated record? | Disposition |
|---|-----------------------|--------------------------------------|-------------|
| S1 | Guide l.34: hosted gateway accepting `account-access` with anon key, no user token, "is unverified" | **Yes** — `infra/envs/staging/supabase/README.md:1841` (2026-11-11: `verify_jwt` false, `check-code` with anon key in `apikey` alone reached the function, 200) | rewrite as dated observation |
| S2 | Guide l.93: dashboard setting names "unverified" | Partly — l.1816 (2026-11-08/09) names "Allow new users to sign up" and "Confirm email". The other five rows describe dashboard settings the Terraform module now sets | the rewritten guide/hosted-settings page names Terraform keys, not labels; cite l.1816 for the two switches; drop the claim |
| S3 | bootstrap l.1182 budget actual alert reaches mailbox + latency | No — l.1204 (2026-10-23): triggered in console, no mail (unconfirmed address); INFRA-15 closed on the accept-console-alert ruling | todo (C-01), noting the ruling |
| S4 | l.1183 forecast alert fires (~5 weeks) | No | todo |
| S5 | l.1184 limit below 1 USD accepted | Moot — l.1203 (2026-10-22): no lower amount was needed | remove (no longer relied on); note in todo or drop |
| S6 | l.1185 quiet account's spend shows within a day or two | Yes, for the spend appearing — l.1202 (2026-10-21, 6.475 USD), l.1203 | dated observation |
| S7 | l.1186 one OIDC provider per URL (second create fails) | No (l.1195: none existed) | todo (read-only: AWS docs cite, or `aws iam list-open-id-connect-providers`) |
| S8 | l.1187 AWS-managed read-only policy lets a pipeline-root plan read all it must | **Yes** — 187-VERIFICATION truth 3: same-repository PR run 44104573552 `plan` success with the plan role | dated observation (cite run id; planner adds the run date from `187-*/evidence`) |
| S9 | l.1188 refused `env:/` list does not stop plan/apply | **Yes** — l.1219 (2026-11-18): deploy-role plans/applies/destroy all succeeded; l.1199 Step 5: the deploy role's `env:/` list is an implicit deny | dated observation |
| S10 | l.1189 a workflow can assume the plan role | **Yes** — same run 44104573552 (`plan` success) | dated observation |
| S11 | aws l.3706 `running-image-digest.sh` on a service whose task definition names a tag | Not directly; every observed run since 2026-11-18 is by digest (l.3782 row "task definition `:8` with the image by digest") so the case can no longer arise on staging | remove from runbook (no longer relied on), todo entry for a fork's first switch |
| S12 | aws l.3707 first plan after switch to digest reads `1 to add, 1 to change, 1 to destroy` and rolls out the same build | Yes for the plan shape — l.3782 (2026-11-18 run 44270824581: `Plan: 1 to add, 1 to change, 1 to destroy.`, task definition replaced by digest) | dated observation (the "same build" half is moot: the pipeline built a new image) |
| S13 | aws l.3708 ECS pulls and runs `<registry>@sha256:<digest>` | **Yes** — l.3782, l.3785 (2026-11-18/19, services ran `:8`, `:10` by digest) | dated observation |
| S14 | dns-mail l.432 production-access request accepted (sandbox) | Not applicable to staging — l.450 (2026-10-22): account already in production | runbook: remove; guide's SES section states the sandbox path is a fork's first step, unobserved here → todo |
| S15 | dns-mail l.433 `create-email-identity` verification mail (sandbox) | Same | same |
| S16 | dns-mail l.434 SES accepts SMTP send under the scoped send policy | **Yes** — supabase README l.1847 (2026-11-11: mail sent through SES on 2587 arrived) | dated observation |
| S17 | dns-mail l.435 DKIM/SPF/DMARC pass, aligned | **Yes** — supabase README l.1848 (2026-11-11: `dkim=pass` aligned `staging.openvaa.org`, `spf=pass`, `dmarc=pass`) | dated observation |
| S18 | dns-mail l.436 staging DMARC record takes the place of the org's policy | Partly — l.1848 "`dmarc=pass` under the published policy `p=QUARANTINE`"; the staging record is `p=quarantine` (dns-mail Observations l.449, 2026-10-22 Step 7 item 1). Whether the org record differs is not recorded | read-only `dig +short TXT _dmarc.openvaa.org` at sitting H-01(1) settles it if the org policy differs; else todo |
| S19 | dns-mail l.310 "What each should show is in 'Not yet observed' below until it has been seen" | **Yes** — dns-mail Observations l.448, 2026-10-22 Step 6 (referral names the four name servers; resolver answers from Route 53) | rewrite l.310 to state the expected output, citing the row |
| S20 | supabase l.1783 empty "Not yet observed" section | — | delete the section |
| **Missed by the locked pattern:** | | | |
| S21 | `infra/modules/supabase/main.tf:46-51` "Two settings resources for one project are untried … has not been observed … has not been observed either" | **Yes** — supabase README l.1867 (2026-11-11: plan created `smtp_secret[0]`), l.1882 (2026-11-11: project served SMTP host/port/sender; `smtp_user` held) | rewrite comment as present-tense fact (Comment Hygiene: no history) |
| S22 | `infra/modules/mail-ses/main.tf:31-33` default DKIM signing zone "has not been observed" | **Yes** — dns-mail Observations l.443, 2026-10-22 Step 2 item 7 (`dkim.amazonses.com`, the default) | rewrite comment |
| S23 | `infra/modules/mail-ses/main.tf:76-78` DMARC alignment "expected and has not been observed" | **Yes** — supabase README l.1848 | rewrite comment |
| S24 | `infra/modules/mail-ses/smtp.tf:13-15` SES authorising SMTP send under the condition "has not been observed" | **Yes** — supabase README l.1847 | rewrite comment |
| S25 | `apps/docs/.../backend/authentication/+page.md:175` per-server sign-in budget "is not measured … to be measured on the first hosted project" | No (188 H-5(b) "a pre-launch risk") | G-03 todo; keep the risk, drop "not measured" phrasing or point to the operations page's pre-launch list |
| S26 | same page :177 timing difference "over a network … was not measured" | No | C-01 todo, or rephrase as a local measurement only |
| S27 | same page :189 "on a hosted project that is assumed allowed and not measured" (`postgres` may update `auth.users`) | No; staging has no bank auth | read-only `SELECT has_table_privilege('postgres','auth.users','UPDATE')` through the session pooler at sitting H-01(1) settles it [ASSUMED adequate]; else C-01 todo |
| S28 | `infra/envs/staging/supabase/README.md:1744` "gains its `smtp` object in a later stage" | **Yes** — staging tfvars l.22 `smtp = {` and l.1867 | rewrite (stale) |
| S29 | `infra/envs/staging/dns-mail/README.md:41-42` "The first mail through SES is sent by the hosted function, in a later stage" | **Yes** — l.1847 | rewrite (stale) |

Dated Observations rows that contain the phrase but are dated records, not open claims: `infra/bootstrap/README.md:1215` ("…not yet observed", superseded by l.1216 and l.1218), `:1217` ("…not yet observed", superseded by the 2026-11-17 run 44088753527 row, l.1218 area), `infra/envs/staging/supabase/README.md:1865` ("likely but has not been measured"). Recommendation: **leave dated rows unedited** (they are the evidence record) and classify them in the C-02 verification as "dated observation, superseded by row N" — or append "(seen in the next row)" if the operator prefers zero raw hits. Also unrelated to a hosted system: `apps/supabase/README.md:393` (VS Code Deno extension path "has not been verified").

### C-02 — the recorded search and today's classified hit list

Locked pattern (run at the end of the phase, recorded with its output):

```bash
git grep -n -i -E 'unverified|not yet observed|untested' -- ':!.planning'
```

Today: **98 hits**. To be removed by the phase: 7 (guide l.34, l.93; bootstrap l.1174; aws l.3698; dns-mail l.310, l.425; supabase l.1783). Expected remaining **91**, all unrelated:

| Class | Files (hit count) |
|-------|-------------------|
| `UnverifiedAnswers` / `'unverified-answers'` sentinel and its "unverified write" prose | `dataWriter.type.ts` (8), `universalDataWriter.ts` (3), `supabaseDataWriter.ts` (2), `supabaseDataWriter.test.ts` (9), `contestantUserDataState.svelte.ts` (5), `contestantUserDataState.svelte.test.ts` (12), `supabaseAdminWriter.test.ts` (1) |
| Supabase auth-js "unverified user/session user" | `safeGetSession.ts`, `admin/+layout.server.ts`, `contestant/+layout.server.ts`, `admin/layout.server.test.ts`, `auth/confirm/+page.server.ts`, `requireAdminIdentity.ts`, two `password-reset/page.server.test.ts` (`unverified@example.test`) (1 each) |
| Probe check name `functions.identity-callback-unverified` and its local `unverified` header variable | `probe-hosted.test.ts` (18), `probe/sources.mjs` (3), `probe-hosted.mjs` (2), `probe/checks.mjs` (1), supabase README l.1631, l.1858, l.1861 (3) |
| trufflehog result class `unverified` | `.github/trufflehog-openvaa.yml` (3), `.github/trufflehog-exclude-paths.txt` (2), `.github/workflows/main.yaml:115` (1), `ciSecretScanFlags.test.ts` (3) |
| Guard prose about the repository's own guards | `scripts/assert-grant-permission-enum.mjs:210`, `scripts/fixtures/grant-permission-enum/expected.violations:6`, `scripts/assert-unit-test-coverage.mjs:709`, `tests/tests/specs/a11y/a11y-smoke.spec.ts:134`, `fetchJwksLeakSafe.test.ts:133` (1 each) |
| Dated Observations rows (see above) | `infra/bootstrap/README.md:1215, 1217` (2) |

Supplementary pattern (recommended addition, same treatment), scoped to the deployed-system surfaces:

```bash
git grep -n -i -E 'untried|not been (observed|seen|measured|tried)|not (yet )?(observed|measured)|unobserved|unmeasured' \
  -- infra apps/supabase/supabase/functions apps/supabase/supabase/config.toml apps/supabase/README.md \
     .github apps/docs/src/routes docker-compose.dev.yml .env.example ':!*.test.ts'
```

Today it finds S21-S27 plus the runbook section text being deleted and the dated rows. New pages must avoid all of these words when describing deployed behaviour (write "observed on staging, <date>" or nothing).

### E-02 — Supabase backups

- **Endpoint** [CITED: supabase.com/docs/reference/api/v1-list-all-backups, read 2026-11-20]: `GET /v1/projects/{ref}/database/backups`, scope `database:read` / fine-grained `backups_read`. 200 body: `region` (string), `walg_enabled` (bool), `pitr_enabled` (bool), `backups[]` of `{ id, is_physical_backup, status (COMPLETED|FAILED|PENDING|REMOVED|ARCHIVED|CANCELLED), inserted_at }`, `physical_backup_data: { earliest_physical_backup_date_unix, latest_physical_backup_date_unix }`. Restore by PITR: `POST /v1/projects/{ref}/database/backups/restore-pitr` with `recovery_time_target_unix` (scope `database:write`) [CITED: …/v1-restore-pitr-backup] — **never called in this phase**.
- **Restore procedure** [CITED: supabase.com/docs/guides/platform/backups, read 2026-11-20]: Pro keeps the last **7 days** of daily backups; projects on Postgres `15.8.1.079`+ use physical backups; PITR is a paid add-on (7/14/28 days, RPO up to 2 min) and enabling it stops daily backups; restore is in Dashboard → Database → Backups (or the API); restoring **replaces the database of the same project and the project is inaccessible during the restore**; Storage **objects are not in database backups** (metadata only); custom role passwords are not stored; physical backups are not downloadable (use `supabase db dump` / `pg_dump` for a logical copy).
- **Restore to a new project** [CITED: supabase.com/docs/guides/platform/clone-project, read 2026-11-20]: paid plans with physical backups; Database → Backups → "Restore to a New Project"; copies schema, data, roles, auth users, encryption root key; **does not copy** Storage objects/buckets, Edge Functions, auth settings and API keys, Realtime settings, extensions/settings; `pg_cron`/`pg_net` jobs start running at once. Relevant for OpenVAA: after a restore-to-new-project the Terraform module, function deploy, `bootstrap.sql` and Storage objects must be re-applied — which is exactly the repository's apply order (good material for the operations page).
- **Read pattern to reuse** [VERIFIED: `infra/envs/staging/supabase/README.md:631-650` sitting preamble, `:864-871` token-on-stdin read]:

```bash
cd "$(git rev-parse --show-toplevel)"
export LC_ALL=C
R=staging
REF=$(sed -n 's/^project_ref *= *"\([a-z]*\)".*/\1/p' \
  "infra/envs/$R/supabase/terraform.tfvars")
L=$(umask 077; mktemp -d "${TMPDIR:-/tmp}/openvaa-189.XXXXXX")
printf 'access token: '; read -rs SUPABASE_ACCESS_TOKEN; echo
export SUPABASE_ACCESS_TOKEN
printf 'header = "Authorization: Bearer %s"\n' \
    "$SUPABASE_ACCESS_TOKEN" \
  | curl -sS -K - -o "$L/backups.json" \
    -w 'e2_backups_http=%{http_code}\n' \
    "https://api.supabase.com/v1/projects/$REF/database/backups"
jq -r '"e2_region=\(.region) e2_pitr_enabled=\(.pitr_enabled)"
  + " e2_walg_enabled=\(.walg_enabled)"
  + " e2_backups=\(.backups | length)"
  + " e2_completed=\([.backups[] | select(.status == "COMPLETED")] | length)"
  + " e2_earliest=\(.physical_backup_data.earliest_physical_backup_date_unix)"
  + " e2_latest=\(.physical_backup_data.latest_physical_backup_date_unix)"' \
  "$L/backups.json"
rm -rf "$L"; unset SUPABASE_ACCESS_TOKEN
```

  The `jq` field names come from the cited schema [CITED], not from an observed response; if a field is absent the line prints `null`, which is itself the observation. Expected on Pro without the add-on [ASSUMED]: `pitr_enabled=false`, about 7 `COMPLETED` backups.

### E-03 — secret mechanisms, per secret

| Secret | Defined / stored | Reaches its consumer | Rotation requires |
|--------|------------------|----------------------|-------------------|
| `PUBLIC_SUPABASE_ANON_KEY`, `ANALYTICS_POSTHOG_KEY` | SSM SecureString `/openvaa/staging/frontend/<name>`, created by hand (`infra/envs/staging/aws/README.md:342,360`, Step 2) | task definition `secrets[].valueFrom` = unversioned parameter ARN (`infra/modules/frontend-service/main.tf:42-48`), resolved by the execution role **at task start** | `aws ssm put-parameter --overwrite` (same stdin form as Step 2), then new tasks: the next pipeline deploy, or a forced new deployment [ASSUMED: `aws ecs update-service --force-new-deployment` is outside Terraform's tracked attributes]; tasks started by scale-out between the two hold the new value, older tasks the old one |
| Origin header secret | `random_password.origin_verify` (`infra/modules/frontend-service/origin.tf:46-49`, 48 alphanumeric) | CloudFront `origin.custom_header` (`edge.tf:86-89`) and ALB `aws_lb_listener_rule.from_cloudfront` `http_header.values` (`origin.tf:101-118`); listener default action is a fixed 403 (`origin.tf:82-97`); outputs `origin_verify_header_value` | `-replace` (below); expect a 403 window |
| SES SMTP key | `aws_iam_access_key.smtp` (`infra/modules/mail-ses/smtp.tf:9-11`), outputs `smtp_username` = key id, `smtp_password` = `ses_smtp_password_v4` (`mail-ses/outputs.tf:26-35`) | the operator exports them as `TF_VAR_smtp_user`/`TF_VAR_smtp_password` from the dns-mail outputs (`supabase/README.md:668-682`) → `supabase_settings.smtp_secret` (`modules/supabase/main.tf:52-61`) and function secrets `SMTP_USER`/`SMTP_PASS` (`function-secrets.tf:33-34`) | `terraform apply -replace=module.<mail module>.aws_iam_access_key.smtp` in dns-mail, then a Supabase root apply with the new outputs; mail fails between the two (the old key is deleted on replace) [ASSUMED ordering] |
| Function secrets `PUBLIC_PROJECT_ID`, `SITE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS` | `supabase_edge_function_secrets.this` (`function-secrets.tf:20-37`; names `:14-17`) | platform env of the functions | change the input, apply the Supabase root; "this resource is the only writer" (`function-secrets.tf:1-3`) |
| `IDENTITY_CALLBACK_SERVER_SECRET` | **not Terraform-managed**; frontend reads it from private env (`apps/frontend/src/lib/server/constants.ts:4`; used `routes/api/oidc/callback/+server.ts:173`), function via `requireEnv` | must be equal on both sides; it is **not in `task-environment.json`**, so the AWS task cannot receive it today (the module passes exactly the list) | set on the function (`supabase secrets set`) and on the frontend at once; with bank auth on AWS this is a code change (add it as a `parameter` entry) — guide must say bank auth is not wired on the AWS path |
| Database password | `var.database_password`, `ignore_changes = [database_password]` (`modules/supabase/main.tf:28,32`; `variables.tf:16-17` "never sent") | GitHub `staging` secret `SUPABASE_DB_PASSWORD` (`deploy.yml:258,318-319`), operator shells | reset in the dashboard; update the GitHub secret and the operator's store; Terraform needs no change |
| Service-role key (legacy JWT) | platform | `public.storage_config` row written by `bootstrap.sql:156-161` (the file says "a rotated key … is applied by running the script again", `bootstrap.sql:5`) | legacy keys rotate only with the JWT secret (signs out every user); then rerun `bootstrap.sql`. FUT-02 (publishable/secret keys) is the future path |
| Supabase access token | operator's account | GitHub secret `SUPABASE_ACCESS_TOKEN` (`deploy.yml:257,320,347`), operator shells | create a new token, update the secret, revoke the old |
| GitHub secrets (7) | repo/environment secrets | `ALERT_EMAIL`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SMOKE_CONTESTANT_EMAIL`, `SMOKE_CONTESTANT_PASSWORD` (deploy/infra-plan), `ANTHROPIC_API_KEY`, `TURBO_TOKEN` (non-deployment workflows) [VERIFIED: `git grep -ohE "secrets\.[A-Z_]+" -- .github/workflows`] | per secret; the smoke contestant pair also lives in the keychain item `openvaa-staging-smoke-contestant` (`supabase/README.md:1324-1327`) |

**Origin-secret rehearsal — what Terraform will do.** The staging root instantiates `module "frontend"` (`infra/envs/staging/aws/main.tf:62`), so the address is `module.frontend.random_password.origin_verify` — **not** the bare `random_password.origin_verify` CONTEXT names. Both consumers depend only on the password; nothing orders the listener rule before or after the distribution (the only `depends_on` in the module is the ECS service on the listener rule, `service.tf:120`). Terraform therefore updates them in parallel: the listener rule changes in seconds, while the distribution waits for `Deployed` (`wait_for_deployment = true`, `edge.tf:70`) and edge locations pick up the new header over minutes. **Requests forwarded with the old header between those two moments get the listener's fixed 403.** A zero-403 rotation would need the listener rule to accept both values for one apply (two applies, a module change) — out of scope; document it as the known window and record its measured length. Expected plan line [ASSUMED: listener-rule `condition` changes update in place]: `Plan: 1 to add, 2 to change, 1 to destroy.` (password replaced, rule and distribution updated in place). The plan's stop rule should require exactly these addresses: `module.frontend.random_password.origin_verify` (delete-create), `module.frontend.aws_lb_listener_rule.from_cloudfront` (update), `module.frontend.aws_cloudfront_distribution.this` (update).

Apply skeleton per the runbook's conventions [VERIFIED: preamble `infra/envs/staging/aws/README.md:162-173`, digest + plan pattern `:2271-2310`, hand plan rule `infra/README.md:258-264`]:

```bash
# preamble lines of the AWS runbook with s<n> = r1, then:
terraform -chdir="$T" init -input=false -no-color \
  -lockfile=readonly > "$L/r1-init.log" 2>&1
echo "r1_init_exit=$?"
infra/scripts/running-image-digest.sh --cluster openvaa-staging \
  --service openvaa-staging-frontend \
  > "$L/r1-running.txt" 2> "$L/r1-running.err"
echo "r1_running_digest_exit=$?"
DIGEST=$(sed -n 's/^running_image_digest=//p' "$L/r1-running.txt")
terraform -chdir="$T" plan -input=false -no-color \
  -var "image_digest=$DIGEST" \
  -replace=module.frontend.random_password.origin_verify \
  -out="$L/tfplan" > "$L/r1-plan.log" 2>&1
echo "r1_plan_exit=$?"
# poller in a second terminal, before the apply, under caffeinate -i:
#   while :; do printf '%s %s\n' "$(date -u +%H:%M:%S)" \
#     "$(curl -s -o /dev/null -w '%{http_code}' \
#        https://staging.openvaa.org/api/health)"; sleep 1; done \
#     > "$L/r1-health.txt"
terraform -chdir="$T" apply -input=false -no-color "$L/tfplan" \
  > "$L/r1-apply.log" 2>&1
echo "r1_apply_exit=$?"
```

Afterwards: a plan with the running digest reads `No changes.`; Step 9's direct-origin check (`aws/README.md:1677-1684`: 403 without/with a wrong header, forward with `terraform output -raw origin_verify_header_value`) proves the new value; the 403 window is read from the poller file (first and last non-200 timestamps). Never print the header value. Keep the workstation awake (`caffeinate -i`; a host suspend voids the poll, 188-14 precedent).

### Guard tests — structure and placement

**`apps/frontend/src/lib/server/startup/taskEnvironment.test.ts`** [VERIFIED: Read, 561 lines] — the model: a pure `taskEnvironmentProblems(input)` returning one string per problem; fixture cases that each plant one fault (red-first); one repository case reading real files via `REPOSITORY_ROOT = fileURLToPath(new URL('../../../../../../', import.meta.url))` (l.22). It reads **the staging AWS runbook** (`RUNBOOK_PATH = 'infra/envs/staging/aws/README.md'`, l.43), section heading prefix `'## The task'` (l.104), names in backticks — it does **not** read a docs page. Imports `ANALYTICS_ENV` from `$lib/server/analytics/config` and `REQUIRED_ENV` from `./requiredEnv`. `@vitest-environment node`.

| Guard | Reads | Names it must find on the page | Workspace (so `yarn test:unit` runs it) |
|-------|-------|--------------------------------|------------------------------------------|
| B-02 env page | `apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md` | the 17 names of `infra/modules/frontend-service/task-environment.json` (`jq -r '.variables[].name'`), `REQUIRED_ENV` (`requiredEnv.ts:12-17`: `'PUBLIC_SUPABASE_URL'`, `'PUBLIC_SUPABASE_ANON_KEY'`, `'PUBLIC_PROJECT_ID'`, `'ORIGIN'`), `Object.values(ANALYTICS_ENV)` (`config.ts:11-18`: `'ANALYTICS_PROVIDER'`, `'ANALYTICS_CONSENT_MODE'`, `'ANALYTICS_VISIT_ID_MODE'`, `'ANALYTICS_POSTHOG_KEY'`, `'ANALYTICS_POSTHOG_HOST'`, `'ANALYTICS_FLUSH_INTERVAL_MS'`); optionally the 6 `BOOTSTRAP_*` of `bootstrap.sql:21-28` | `@openvaa/frontend` — sibling file, e.g. `apps/frontend/src/lib/server/startup/environmentReference.test.ts` (needs `$lib` imports) |
| D-02 event catalogue | `apps/docs/src/routes/(content)/developers-guide/configuration/analytics/+page.md` | **exactly** `EVENT_NAMES` (`events.schema.ts:271-273`, built from `EventSchema.options`) — 30 names; compare as sets both ways (no extra, none missing) | `@openvaa/frontend`, e.g. `apps/frontend/src/lib/analytics/eventCatalogue.test.ts` |
| B-01 hosted settings | `apps/docs/src/routes/(content)/developers-guide/deployment/hosted-settings/+page.md`, `infra/modules/supabase/hosted-settings.json`, `settings.tf`, `function-secrets.tf`, `variables.tf` | every JSON leaf key (enumerate with `Object.keys` recursively — **not** jq `paths(scalars)`, which drops `false` leaves), the `settings.tf` keys `site_url`, `uri_allow_list`, `smtp_host`, `smtp_port`, `smtp_admin_email`, `smtp_sender_name` (`settings.tf:34-46`), the 7 `rate_limit_*` of `variables.tf:49-55`, `smtp_user`/`smtp_pass` (`main.tf:58-59`), the 7 function-secret names (`function-secrets.tf:14-17`) | the `infra` suite: `infra/scripts/hosted-settings-reference.test.ts` (`infra/vitest.config.ts` includes only `scripts/**/*.test.ts`; run by `yarn test:unit:infra`, a link of `yarn test:unit`). No `$lib` needed |

Hosted-settings inventory [VERIFIED: Read `hosted-settings.json:1-40`]: groups `api` (`db_schema`, `db_extra_search_path`, `max_rows`), `auth` (22 keys: `disable_signup`, `mailer_autoconfirm`, `external_email_enabled`, `external_phone_enabled`, `external_anonymous_users_enabled`, `security_manual_linking_enabled`, `jwt_exp`, `refresh_token_rotation_enabled`, `security_refresh_token_reuse_interval`, `password_min_length`, `password_required_characters`, `mailer_secure_email_change_enabled`, `security_update_password_require_reauthentication`, `mailer_otp_length`, `mailer_otp_exp`, `smtp_max_frequency`, `mfa_totp_enroll_enabled`, `mfa_totp_verify_enabled`, `mfa_phone_enroll_enabled`, `mfa_phone_verify_enabled`, `external_apple_enabled`, `external_web3_solana_enabled`), `auth_hook` (`hook_custom_access_token_enabled`, `hook_custom_access_token_uri`), `auth_send_email_hook` (`hook_send_email_enabled`, `hook_send_email_uri`), `redirect_callback_paths` (`["/auth/confirm", "/*/auth/confirm"]`). Parity classes come from `scripts/assert-hosted-settings-parity.mjs` `ROWS` (l.176-) with labels `'must agree'`, `'hosted may be stricter'`, `'differs by design'`, `'not compared'` (l.142-145). Probe check names (22) [VERIFIED: `infra/scripts/probe/checks.mjs` `name:` lines]: `api.max-rows`, `auth.access-token-hook`, `auth.send-email-hook`, `auth.site-url`, `auth.redirects`, `auth.signup-closed`, `auth.email-confirm`, `auth.smtp`, `auth.oauth-server`, `auth.other-settings`, `api.schemas`, `functions.deployed`, `functions.verify-jwt`, `auth.public-settings`, `rows.read-whole`, `functions.served`, `functions.identity-callback-unverified`, `storage.buckets`, `db.hook-functions`, `db.anon-timeout`, `db.postgres-major`, `no-seed`. The probe reaches **no rate limit and no function-secret value**: verify those by "a plan of the Supabase root reads `No changes`" (state vs remote) and, for secret names, the Step 18 read-back by name (supabase README l.1823, 2026-11-09/10 row lists the seven) [ASSUMED: provider refresh compares remote rate limits].

Each guard: pure function + fixture red cases first (one missing name named in the failure), then the repository case. Comments single-line per paragraph (Comment Hygiene Rule 2). The page tables should put each name in backticks; match names as backticked tokens (as `runbookEnvironmentNames` does, l.112-120) so a name in prose elsewhere doesn't count by accident.

### Docs site — structure, nav, gates

- Pages are `+page.md` with **no frontmatter**; the nav title is the first `# ` heading (`apps/docs/scripts/utils/routes.ts` `extractTitle`). Moved pages leave `+page.ts` redirect stubs (`redirect(308, '<route>')` with `export const prerender = true;`, e.g. `developers-guide/development/intro/+page.ts`).
- Sections use an `intro` child titled "Overview" with `fixedTitle: true` (`navigation.config.ts:86-96`, configuration).
- **Pitfall:** `NavigationItem.svelte:19-31` renders any item with children as `<details><summary>{title}</summary>` — **no link**. `buildSubsectionChildren` (`generate-navigation-config.ts:427-452`) adds only the depth-3 children, never the parent's own page. There is no precedent in `(content)/*/*/` of a page with its own `+page.md` **and** children (scan this session found none). So `deployment/` + `deployment/hosted-settings` + `deployment/operations` makes `/developers-guide/deployment` unreachable from the nav unless an Overview child `{ title: 'Overview', route: '/developers-guide/deployment', fixedTitle: true }` is added. Whether `generate:navigation` keeps a hand-added child whose route is the section's own route, or marks it "Removed", is **not known** [ASSUMED risk] — the nav task must run the generator, read its diff, and confirm `validate:links --check --only nav-route` passes. Fallback (needs operator OK, departs from A-02's "no redirects"): move the overview to `deployment/intro`, leave a `deployment/+page.ts` stub, and update the 13 inbound links.
- Inbound links to rewrite or preserve [VERIFIED: grep]: `/developers-guide/deployment` ×4, `#auth-settings-of-a-hosted-project` ×6, `#the-per-caller-limit-of-account-access` ×2, `#feedback-rate-limit-and-cloudflare` ×1, from `backend/authentication`, `backend/edge-functions`, `backend/email`, `backend/intro`, `configuration/environmental-variables`, `contestant-app/bank-authentication`, `contestant-app/password-validation`, `publishers-guide/preparing/the-application-be-hosted`. Either keep those headings on the rewritten overview or move them to `deployment/hosted-settings` and update each link — `validate:links --check` (class `anchor`) fails any left dangling.
- Gates: `yarn workspace @openvaa/docs generate:navigation`; `yarn workspace @openvaa/docs validate:links --check` (classes `md-link`, `svelte-href`, `nav-route`, `anchor`, `stub`, `github-path` — a GitHub `blob/main/<path>` link must name a tracked file, so any leftover link to `render.example.yaml` or `apps/frontend/docker-compose.dev.yml` fails — and `inbound`, which checks `openvaa.org/developers-guide/...` URLs from tracked files outside `apps/docs`, so the runbooks' "← guide" back-links are checked if written as `https://openvaa.org/developers-guide/deployment...`); `yarn workspace @openvaa/docs build`; `yarn workspace @openvaa/docs check`; root `yarn format:check` (includes `prettier --check .` — reformats Markdown tables in docs and runbooks) and `yarn lint:check`. CI's docs workflow runs `yarn generate:docs`, which validates links (`apps/docs/package.json:19`).

### OpenTofu statement (A6)

No file outside `.planning/` mentions OpenTofu or `tofu` [VERIFIED: grep], `tofu` is not installed here, and no CI job runs it. The HCL uses features both tools document (S3 `use_lockfile = true` at `infra/envs/staging/aws/main.tf:22`, `required_version = ">= 1.10"`, `mock_provider`/`override_resource` in `*.tftest.hcl`) [ASSUMED: OpenTofu ≥1.10 supports each]. Write it as a rule of the repository ("kept to HCL that OpenTofu also accepts; the repository runs Terraform 1.16"), not as an observation, and avoid the C-02 words.

### Env page inventory (B-02)

17 task variables [VERIFIED: `jq` over `task-environment.json`]: `PUBLIC_SUPABASE_URL` (value, required), `PUBLIC_SUPABASE_ANON_KEY` (parameter, required), `PUBLIC_PROJECT_ID` (value, required), `ORIGIN` (value, required), `ADDRESS_HEADER`, `XFF_DEPTH`, `KEEP_ALIVE_TIMEOUT`, `HEADERS_TIMEOUT`, `SHUTDOWN_TIMEOUT`, `PUBLIC_LOG_LEVEL`, `ANALYTICS_PROVIDER`, `ANALYTICS_CONSENT_MODE`, `ANALYTICS_VISIT_ID_MODE`, `ANALYTICS_POSTHOG_HOST`, `ANALYTICS_FLUSH_INTERVAL_MS` (values), `ANALYTICS_POSTHOG_KEY` (parameter), `DEPLOYMENT_DIAGNOSTICS` (value). The staging runbook's table `aws/README.md:189-218` already has a description per variable — the docs page can adapt it. `BOOTSTRAP_*` [VERIFIED: `bootstrap.sql:18-28`]: required `PUBLIC_PROJECT_ID`, `BOOTSTRAP_STORAGE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BOOTSTRAP_BEHIND_CLOUDFLARE`; optional `BOOTSTRAP_ACCOUNT_NAME` (Default Account), `BOOTSTRAP_PROJECT_NAME` (Default Project), `BOOTSTRAP_DEFAULT_LOCALE` (en), `BOOTSTRAP_OPEN_FOR_VOTERS` (false). l.62 fix confirmed: `send-email/index.ts:135` reads `PUBLIC_PROJECT_ID`; `identity-callback/envReadSites.test.ts:69-71` pins that `identity-callback` does not.

### Analytics sources (D)

- `EventSchema = z.discriminatedUnion('name', [...])` at `events.schema.ts:128`, 30 `name: z.literal(...)` members; `EVENT_NAMES` exported (l.271-273); `SENSITIVE_EVENTS` (l.280-287): `'answer'`, `'answer_delete'`, `'question_skip'`, `'results_ranked_entity'`, `'results_browse_entity'`, `'filters_active'` — the "sent before consent?"/linkability column can be derived from this set plus the modes.
- `PROVIDERS = ['none', 'log', 'posthog'] as const` (`server/analytics/config.ts:5`); `createProvider` switch (`providers/index.ts:19-29`); one file per provider (`log.ts`, `none.ts`, `posthog.ts`, `provider.type.ts`).
- `trackEvents` is a **dynamic** setting now (`packages/app-shared/src/settings/dynamicSettings.ts:99` default `analytics: { trackEvents: false }`; type doc `dynamicSettings.type.ts:346-350`).
- **Checklist finding (D-03, feedback limit):** `private.feedback_rate_limits` keys rows by `ip_address` (`107-feedback.sql:18-25`) and the limit only upserts (`:152-164`); no `DELETE`/cron over it exists in `schema/` or the appended migrations [VERIFIED: grep]. So the address of every client who sent feedback stays stored with its last window, with no expiry — state it on the checklist as a retention item the deployer must decide on (contrast: the `account-access` caller key is deleted after its 10-minute window, guide l.139). Consider a todo.
- No docs page today says "no consent is required" [VERIFIED: grep of `apps/docs/src/routes` for `no consent|consent is not required|not required`].

### G — absorbed todos and fold-ins (state at `ec531edcd`)

| Todo | State | What the closure record can cite |
|------|-------|----------------------------------|
| `pending/2026-08-31-evaluate-self-hosted-posthog-log-sink.md` (13 lines, no `created:`) | pending | G-02 comparison; 90-day log group (`terraform.tfvars:23` `log_retention_days = 90`); 188 PostHog evidence; REQUIREMENTS anti-feature "Self-hosted PostHog; PostHog as the log sink" |
| `pending/2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e.md` (30 lines, no frontmatter — heading style) | pending; both asks built | `dynamicSettings.ts:99`; specs `tests/tests/specs/voter/analytics-privacy.spec.ts`, `analytics-gpc.spec.ts`, `voter-tracking-consent-free.spec.ts`, perm project `perm-analytics-tracking` (`voter-prefs-tracking`, 20 tests in the last full run) |
| `pending/2026-09-02-deployment-guide-production-redirect-allowlist.md` (50 lines) | pending; l.48 says `/api/auth/callback` | current `redirect_callback_paths` `["/auth/confirm", "/*/auth/confirm"]`; staging applied 2026-11-17 (supabase README l.1886) |
| `pending/2026-09-18-document-supabase-api-limits-for-deployments.md` (47 lines) | pending | `hosted-settings.json` `max_rows: 50000`, probe `api.max-rows`, `db.anon-timeout`; `001-role-settings.sql:11` `statement_timeout = '8s'`; its "Done when" names `render.example.yaml` → note removal |
| `pending/2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md` (65 lines) | pending | item 1 (template lacks `PUBLIC_PROJECT_ID`) → Render removed, root compose has it (`docker-compose.dev.yml:16`); item 2 → B-03; item 3 → F-02; item 4 → buckets created by `400-storage.sql:52-59` |
| `pending/2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md` (105 lines) | pending | G-03: probe rows; S1; moves three asks to the new todo |
| `completed/2026-10-07-174-no-per-caller-limit-…md` | completed 2026-11-19 | one line in the phase summary |

Closure convention [VERIFIED: Read of the completed file l.1-44]: frontmatter gains `completed: <date>` and `status: completed`; body gains `## Closed (phase 189), <date>` with bullets **What was built** (with paths and run ids), **What remains**, **Moved** (to a named pending file). Files are moved `pending/` → `completed/` (`git mv`). For the two files without YAML frontmatter, add a frontmatter block (or record the closure fields in the body) — planner's choice; state it.

Fold-ins [VERIFIED]:
- `apps/supabase/supabase/seed.sql:9` `-- In production, update with actual Supabase URL and service role key.` → replace with a pointer to `infra/scripts/bootstrap.sql` (comment hygiene: present tense).
- `.claude/skills/recommended-skills/SKILL.md:70-75` conflict 1 cites a database-skill heading "The schema is declarative: you edit one copy, the other is generated" that no longer exists; the current text is `.claude/skills/database/SKILL.md:40-57` ("The migrations are frozen: a schema change is appended, never edited in"; a timestamp-named file is renamed to the next number). Rewrite conflict 1 against it. (Also stale nearby, not asked: `.claude/skills/database/SKILL.md:1061,1317` say "1 file"/"1, the baseline"; the tree has 24 migrations.)
- INFRA-13: `REQUIREMENTS.md:50` checkbox and `:274` traceability row ("Pending (measured cost deferred to phase 189 todo)") → Complete, citing `185-22-cost.md:145-150` (`COST_MEASURED_USD_MONTH=36.96`, `COST_MEASURED_WITH_UNTAGGED_IPV4_USD_MONTH=44.26`, read `2026-11-18T11:58Z`) and the completed todo `completed/2026-11-14-measure-the-staging-aws-stack-monthly-cost.md`; dated note on `185-VERIFICATION.md:77-78`.
- DOCS-07 (`REQUIREMENTS.md:210-211`) and ROADMAP § 189 criterion 5 text edited per F-01.
- Re-targets: `pending/2026-11-15-dependency-audit-third-party-advisories.md:5` and `pending/2026-11-17-local-supabase-ports-in-ephemeral-range.md:5` both carry `target: Phase 189 …` → change to "after the stream merges" with a dated note.

### E2E — affected projects and the delta baseline

- **Last full run:** `tests/e2e-runs/188-close3-20261119T213204Z`, `head` = `0b947a34baf75f9f72dfca9664432c4738d1387e`, exit 0, 2026-11-19T21:32:10Z–21:51:05Z, **729 tests** (`188-VERIFICATION.md:146`: "passed 729, failed 0, flaky 0, skipped 0, did not run 0"). `git diff --stat 0b947a34b HEAD -- apps packages tests infra scripts .github …` shows only `infra/envs/staging/aws/README.md` changed.
- **Affected by source changes:** only B-03 touches served code (`constants.ts`, imported by `hooks.server.ts`, `hooks.client.ts`, every Supabase client and both IdP providers). Recommended targeted runs after that plan's last code commit, one wrapper run each: `bank-auth` (12), `contestant-identity-provider` (42), `voter-journey` (2) (per-project counts from the last full run's `results.json`). F-01, F-02 and the guards change no served route and no spec/fixture → no E2E project.
- **Expected deltas:** E2E 0 tests, no title changes. Unit: `@openvaa/dev-seed` −13 (F-01); frontend + infra + N new guard tests.
- Final plan: one full run (`tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/189-close-<stamp> --no-db-reset`), judged with `node tests/scripts/e2e-spec-verdict.mjs <run-dir> --no-flaky` against 729 + 0.

## Architecture Patterns

### Data flow the guide must describe (from empty account to tested instance)

```
operator workstation
   │  bootstrap root (state bucket, registry, OIDC roles, budget, execution role)   infra/bootstrap
   ▼
dns-mail root ──► Route 53 zone + delegation at parent DNS ──► SES identity, DKIM/MAIL FROM/DMARC, SMTP user
   │                                                             │ smtp_username / smtp_password outputs
   ▼                                                             ▼
supabase root (import project, settings, hooks, function secrets) ◄── TF_VAR_smtp_*  (hosted project created by hand, C2)
   │  supabase db push (migrations) → functions deploy → bootstrap.sql (account/project/storage_config/behind_cloudflare)
   ▼
SSM parameters (anon key, PostHog key) ──► aws root (VPC, ALB, ECS, CloudFront, certs, alarms)
   │                                          │ image built by build-push-image.sh, deployed by digest
   ▼                                          ▼
conformance probe (22 checks) ─── deployed smoke (yarn test:e2e:deployed) ─── deploy pipeline (deploy/staging, gated)
```

### Recommended page set

```
apps/docs/src/routes/(content)/developers-guide/
├── deployment/+page.md                  # overview + the path (A-03: written against envs/example)
├── deployment/hosted-settings/+page.md  # DOCS-02 table (guarded, B-01)
├── deployment/operations/+page.md       # DOCS-06 summaries + cost + Admin job limit
└── configuration/
    ├── environmental-variables/+page.md # rewritten (guarded, B-02)
    └── analytics/+page.md               # DOCS-05 (catalogue guarded, D-02)
```

### Anti-Patterns to Avoid
- **Copying runbook procedures whole** (A-01): state the step and the command, link the measured step.
- **Writing deployed behaviour as fact without a date**: every hosted claim either carries "observed on staging, YYYY-MM-DD" with its runbook row, or is not made.
- **Editing dated Observations rows** to remove a word: they are evidence.
- **Hard-wrapped comment sentences** in new tests (Comment Hygiene Rule 2).
- **Printing secrets in evidence**: the origin header value, tokens, SMTP credentials, addresses.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Docs link/anchor checking | a new link test | `yarn workspace @openvaa/docs validate:links --check` | already checks anchors, stubs, nav leaves, GitHub paths, inbound URLs |
| Nav config | hand-writing `navigation.config.ts` wholesale | `generate:navigation`, then read its diff | keeps titles and ordering consistent |
| Reading the running image digest | `aws ecs describe-*` pipelines | `infra/scripts/running-image-digest.sh` | the runbook's tested path (`infra/README.md:258-264`) |
| Hosted-settings verification | a new probe | `node infra/scripts/probe-hosted.mjs --root infra/envs/staging/supabase` (Step 23) | 22 checks, writes nothing |
| E2E verdicts | reading Playwright output by eye | `node tests/scripts/e2e-spec-verdict.mjs <run-dir> --no-flaky` | counts did-not-run as failure |
| Parity classes | re-deriving classes | `scripts/assert-hosted-settings-parity.mjs` `ROWS` | the guard's own classification |

## Common Pitfalls

### Pitfall 1: The overview page vanishes from the nav
**What goes wrong:** adding `deployment/hosted-settings` and `deployment/operations` turns "Deployment" into a non-link `<details>`. **Why:** `NavigationItem.svelte:19-31`; generator never lists the parent page. **Avoid:** explicit Overview child (verify generator idempotence) or the `intro` fallback with operator OK. **Detect:** click-through in `yarn workspace @openvaa/docs dev`; `validate:links --check`.

### Pitfall 2: Inbound anchors break when sections move to the reference page
9 anchored inbound links. **Avoid:** keep the headings or update every link in the same commit; `validate:links --check` (class `anchor`) is the gate.

### Pitfall 3: The 403 window during the origin rotation is read as a failure
It is expected by mechanism (parallel updates). **Avoid:** the plan states it as expected, measures its length, and stops only on non-recovery (e.g., still 403 ten minutes after `Apply complete`) or any plan line other than the expected one.

### Pitfall 4: `-replace` with the bare address
`random_password.origin_verify` does not exist at root level; the address is `module.frontend.random_password.origin_verify` (`infra/envs/staging/aws/main.tf:62`). A wrong `-replace` address errors at plan.

### Pitfall 5: jq `paths(scalars)` silently drops `false` leaves
Measured this session: it listed 20 of the JSON's leaf paths and omitted every `false` (e.g. `mailer_autoconfirm`). The B-01 guard must enumerate keys structurally.

### Pitfall 6: The narrow C-02 pattern passes while hosted claims remain
See S21-S29. Run the supplementary pattern too.

### Pitfall 7: Unused helper after deleting Render tests
`renderEntry` in `analyticsEnvTemplates.test.ts:51-65` becomes dead; ESLint `no-unused-vars` fails `yarn lint:check` if the dev-seed tests are linted by the root config [ASSUMED scope] — delete it anyway.

### Pitfall 8: `yarn test:unit` red because the stack is down
dev-seed integration tests need the shared local Supabase stack (memory). Start it (`yarn db:start`) before the unit gate; not a defect.

### Pitfall 9: Long gates and the executor watchdog
Background the full E2E run and `yarn lint:check`, and poll (memory: 600 s watchdog).

### Pitfall 10: A new staging read needs a PostHog key
188-19: the personal PostHog read key is revoked. Nothing in this phase's ★ decisions reads PostHog events; if a plan wants to (e.g., to confirm `$geoip_disable`), it needs a new key from the operator — avoid by citing 188-09's recorded settings (`ph_anonymize_ips=true`).

## Code Examples

### Guard skeleton (B-01, infra suite)

```typescript
// infra/scripts/hosted-settings-reference.test.ts — pattern from apps/frontend/src/lib/server/startup/taskEnvironment.test.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PAGE = 'apps/docs/src/routes/(content)/developers-guide/deployment/hosted-settings/+page.md';

/** Every key of a parsed JSON value at any depth, arrays' items excluded. */
function jsonKeys(value: unknown): Array<string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...jsonKeys(child)]);
}

/** The backticked tokens of a page. */
function backticked(page: string): Set<string> {
  return new Set(Array.from(page.matchAll(/`([^`\n]+)`/g), (match) => match[1]));
}

/** One problem per name the page does not list in backticks. */
function missingNames(page: string, names: ReadonlyArray<string>): Array<string> {
  const listed = backticked(page);
  return names.filter((name) => !listed.has(name)).map((name) => `${name}: is not listed on ${PAGE}`);
}

describe('missingNames', () => {
  it('names a key the page leaves out', () => {
    expect(missingNames('| `disable_signup` |', ['disable_signup', 'mailer_autoconfirm'])).toEqual([
      expect.stringContaining('mailer_autoconfirm')
    ]);
  });
});
// …then the repository case: jsonKeys(JSON.parse(hosted-settings.json)) + names read from settings.tf,
// variables.tf (rate_limit_*), main.tf (smtp_user, smtp_pass) and function-secrets.tf (the quoted names of
// function_secret_names), each read with a regex scoped to its block, each block's absence itself a problem.
```

### D-02 catalogue guard core

```typescript
import { EVENT_NAMES } from '$lib/analytics/events.schema';
// table rows: first cell is the backticked event name
const rows = new Set(Array.from(page.matchAll(/^\|\s*`([A-Za-z_]+)`\s*\|/gm), (m) => m[1]));
expect([...rows].sort()).toEqual([...EVENT_NAMES].sort());
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hosted settings set by hand in the dashboard (guide l.58-93) | Terraform `supabase_settings` as sole writer, probe verifies | phases 183-184 | guide stops listing dashboard labels |
| Buckets created by hand (guide l.19) | `400-storage.sql:52-59` inserts both | 181-08 (`9b4ab6d0c`) | remove the step |
| `behind_cloudflare` set in the SQL editor (guide l.119-125) | `bootstrap.sql` writes it from `BOOTSTRAP_BEHIND_CLOUDFLARE` | 181-11 | guide names the script |
| Render Blueprint | AWS stack by Terraform + gated pipeline | F-01 (2026-11-20) | template and its tests removed |
| `analytics` static setting | `analytics.trackEvents` dynamic setting | phase 182 | analytics todo closes |
| Redirects `/api/auth/callback` | `/auth/confirm`, `/*/auth/confirm` | applied to staging 2026-11-17 | redirect todo closes with the current path |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Listener-rule `condition` change is an in-place update, so the origin plan reads `Plan: 1 to add, 2 to change, 1 to destroy.` | E-03 | plan stop rule rejects a correct plan; planner should allow "rule replaced" as an alternative or read the plan JSON's actions per address |
| A2 | A forced new deployment (`update-service --force-new-deployment`) is the hand route to roll parameters, and Terraform does not track it as drift | E-03 | documented rotation leaves drift; alternative is the pipeline deploy |
| A3 | SES SMTP key replace deletes the old key immediately, so mail fails until the Supabase root is re-applied | E-03 | the procedure's order/warning is wrong; harmless to state as "until" |
| A4 | Staging Pro without PITR add-on returns `pitr_enabled=false` and ~7 completed backups | E-02 | none — the read is the observation |
| A5 | `generate:navigation` marks a hand-added Overview child with the section's own route as removed (or keeps it) — unknown | Docs nav | nav loses the overview link; measured in the nav task |
| A6 | OpenTofu ≥1.10 accepts `use_lockfile`, `mock_provider`, `override_resource` | OpenTofu statement | the A6 sentence would be wrong; it is written as a rule, not an observation |
| A7 | `has_table_privilege('postgres','auth.users','UPDATE')` is an adequate read-only settle for S27 | C-01 | the statement moves to the todo instead |
| A8 | A Supabase root plan reading `No changes` verifies rate limits (provider refresh reads them) | B-01 | the "how to verify" cell for rate limits needs the Management API `config/auth` read instead (Step 6 pattern, supabase README l.356) |
| A9 | Dev-seed test files are linted by a gate that flags the unused `renderEntry` | F-01 | none — delete it regardless |

## Open Questions

1. **Nav shape for `deployment/`** — What we know: children make the parent a non-link. What's unclear: generator behaviour on a hand-added Overview child. Recommendation: try the hand-added child first in the nav task, measure, fall back to `deployment/intro` + stub only with the operator's OK (it departs from A-02's "no redirects").
2. **`apps/docs/src/routes/+page.svelte:228` onrender.com demo link** — a live example VAA, not the deployment example. Recommendation: keep it and say so in the F-01 plan; operator may rule otherwise.
3. **Dated rows that contain "not yet observed"** (`infra/bootstrap/README.md:1215,1217`) — Recommendation: classify in C-02, do not edit.
4. **Supplementary C-02 pattern** — not in the locked decision. Recommendation: adopt it (the criterion is about statements marked unverified in any words) and say so in the plan.
5. **Feedback-limit address retention** (no expiry) — documentation states it; whether to file a todo for a purge is the operator's call. Recommendation: file one.
6. **Bank auth on the AWS path** — `IDENTITY_CALLBACK_SERVER_SECRET` and the IdP variables are not in `task-environment.json`; the guide should state bank auth is not wired for the AWS task and leave it to a future requirement/todo.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker daemon | F-02 production build | ✓ | 29.7.2 | — |
| Terraform | E-03 apply (operator sitting) | ✓ | 1.16.5 | — |
| AWS CLI + SSO profile `openvaa-admin` | E-03 sitting | ✓ CLI 2.34.7 (session: operator) | — | — |
| jq / curl | E-02 read | ✓ | 1.7.1 / 8.7.1 | — |
| Supabase CLI | not needed (yarn workspace `@openvaa/supabase supabase`) | via yarn | — | — |
| OpenTofu | A6 statement | ✗ | — | write as a rule, no observation |
| Local Supabase stack | `yarn test:unit`, E2E | shared stack (start with `yarn db:start`) | — | — |
| PostHog read key | not needed | ✗ (revoked, 188-19) | — | cite 188-09 records |
| Management API token, staging AWS session | H-01 sittings | operator-held | — | — |

**Missing with no fallback:** none. **Missing with fallback:** OpenTofu, PostHog key.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (per workspace via turbo; root suites `tests/vitest.config.ts`, `infra/vitest.config.ts`); Playwright for E2E |
| Config file | `apps/frontend/vitest.config.ts`, `packages/dev-seed` (vitest run), `infra/vitest.config.ts` (`include: ['scripts/**/*.test.ts']`) |
| Quick run command | `yarn workspace @openvaa/frontend vitest run src/lib/server/startup src/lib/analytics`; `yarn test:unit:infra hosted-settings-reference`; `yarn workspace @openvaa/dev-seed vitest run tests/deploymentTemplates.test.ts tests/analyticsEnvTemplates.test.ts` |
| Full suite command | `yarn test:unit` (needs the local stack), `yarn lint:check`, `yarn format:check`, docs gates, full E2E wrapper run |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOCS-01 | guide on the Terraform/Supabase path, OpenTofu sentence, links resolve | docs gates + grep | `yarn workspace @openvaa/docs validate:links --check && yarn workspace @openvaa/docs build`; `git grep -n -i opentofu -- apps/docs` non-empty | partial (gates exist) |
| DOCS-02 | every hosted setting / function secret on the page | unit | `yarn test:unit:infra hosted-settings-reference` | ❌ Wave 0 |
| DOCS-03 | no unverified hosted statement | recorded search | the two `git grep` commands in § C-02, output classified in VERIFICATION | n/a (manual classification) |
| DOCS-04 | every task/required/analytics variable on the env page | unit | `yarn workspace @openvaa/frontend vitest run src/lib/server/startup` | ❌ Wave 0 (sibling of `taskEnvironment.test.ts`) |
| DOCS-05 | catalogue equals `EVENT_NAMES`; no "no consent" statement | unit + grep | `yarn workspace @openvaa/frontend vitest run src/lib/analytics`; `! git grep -n -i -E "(no|not) consent (is )?(required|needed)\|consent is not (required\|needed)\|does not (require\|need) consent" -- apps/docs` | ❌ Wave 0 |
| DOCS-06 | ops page covers the seven procedures + cost | manual review + link gate | `validate:links --check`; H-01 sittings' evidence rows | — |
| DOCS-07 | Render gone, orphan compose gone, production image builds | grep + unit + build | `test ! -e render.example.yaml && test ! -e apps/frontend/docker-compose.dev.yml`; `! git grep -n -E "render\.example\|render\.com\|fromGroup" -- ':!.planning' ':!scripts/fixtures'`; `! grep -n "AS development" apps/frontend/Dockerfile`; dev-seed tests green; `docker build … --target production` exit 0 | existing tests edited |
| DOCS-08 | seven closure records | file checks | `for f in <six files>; do test -f .planning/todos/completed/$f && grep -q '^status: completed' … && grep -q '^## Closed (phase 189)' …; done`; `test ! -e .planning/todos/pending/<f>` | — |
| B-03 | variables gone, no reader | grep + unit + targeted E2E | `! git grep -n FRONTEND_URL -- ':!.planning'`; frontend unit; wrapper runs `--project bank-auth`, `contestant-identity-provider`, `voter-journey` | — |

### Sampling Rate
- **Per task commit:** the guard's own vitest file, red then green; `yarn workspace @openvaa/docs validate:links --check` after any docs edit.
- **Per plan:** `yarn lint:check`, `yarn format:check`, `yarn test:unit` (stack up), targeted E2E only in the B-03 plan.
- **Phase gate:** full E2E run green, judged against 729 + Δ0; both C-02 searches recorded and classified.

### Wave 0 Gaps
- [ ] `infra/scripts/hosted-settings-reference.test.ts` — DOCS-02
- [ ] `apps/frontend/src/lib/server/startup/environmentReference.test.ts` (name at discretion) — DOCS-04
- [ ] `apps/frontend/src/lib/analytics/eventCatalogue.test.ts` (name at discretion) — DOCS-05
- Each red first against the current (or absent) page, which they must fail by naming the missing items.

### Manual / operator-only
- H-01(1): fresh read-only probe run (`node infra/scripts/probe-hosted.mjs --root infra/envs/staging/supabase`, Step 23) for G-04(c) — the latest recorded probe on the persistent project is 2026-11-14 (supabase README l.1884), before the 2026-11-19 function redeploy (l.1887); optional `dig` of `_dmarc.openvaa.org` (S18) and the `has_table_privilege` read (S27).
- H-01(2): the backups read (E-02).
- H-01(3): the origin-secret apply with health polled (E-03).
- Reading the docs pages as a deployer (DOCS-01/06 completeness).

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no change | — |
| V3 Session Management | no change | — |
| V4 Access Control | doc only | origin lock (ALB 403 default, CloudFront header) documented with its rotation |
| V5 Input Validation | no change | — |
| V6 Cryptography / secrets | yes | rotation procedures; secrets only via env/stdin, never on a command line, never in evidence (`infra/README.md:96-97`) |
| V8 Data Protection / privacy | yes | analytics checklist: retention of addresses (`private.invitation_throttle` 10-min, `private.feedback_rate_limits` no expiry), PostHog IP settings, 90-day logs |
| V14 Configuration | yes | hosted-settings reference + guard; removed unused env vars |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Origin secret leaked in evidence/log | Information disclosure → Spoofing (bypass CDN) | never print `origin_verify_header_value`; rotate by `-replace` |
| Docs instruct a weaker hosted setting | Tampering | guard B-01 + parity guard + probe |
| Stale "unverified" text read as safe | Repudiation of assumptions | C-01 sweep, dated rows, todos |
| Secrets in plan files | Information disclosure | plan files in `$L` (umask 077), removed; never uploaded (`infra/README.md:105-107`) |

## Sources

### Primary (HIGH confidence) — tree reads this session
- `apps/frontend/src/lib/utils/constants.ts:1-17`; the four auth test files; `.env.example:106-132`; `docker-compose.dev.yml:1-29`; `render.example.yaml:1-69`
- `packages/dev-seed/tests/deploymentTemplates.test.ts:1-157`, `analyticsEnvTemplates.test.ts:1-124`, `ciDockerImageBuildGate.test.ts:6,122-123`; `.github/workflows/main.yaml:176-199`
- `apps/frontend/Dockerfile:1-60`, `apps/frontend/docker-compose.dev.yml:1-26`
- `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts:1-561`, `requiredEnv.ts:12-17`, `server/analytics/config.ts:5-18`, `providers/index.ts:19-29`, `analytics/events.schema.ts:128-287`
- `infra/modules/supabase/{hosted-settings.json,settings.tf,function-secrets.tf,main.tf,variables.tf,outputs.tf}`; `infra/scripts/probe/checks.mjs`; `scripts/assert-hosted-settings-parity.mjs:142-176`
- `infra/modules/frontend-service/{origin.tf,edge.tf,main.tf,service.tf}`; `infra/modules/mail-ses/{smtp.tf,outputs.tf,main.tf}`; `infra/envs/staging/aws/{main.tf,terraform.tfvars}`
- Runbooks: `infra/README.md:92-376`; `infra/bootstrap/README.md:1174-1220`; `infra/envs/staging/aws/README.md:156-218,2235-2310,3698-3793`; `dns-mail/README.md:36-44,300-316,420-450`; `supabase/README.md:631-692,860-880,1712-1888`
- `apps/docs/scripts/{generate-navigation-config.ts,utils/routes.ts,validate-links.ts}`, `apps/docs/src/lib/components/NavigationItem.svelte`, `apps/docs/src/lib/navigation.config.ts`, the current guide and env pages
- `.planning/todos/**` (the nine files named in § G); `181-08-SUMMARY.md:290-300`; `181/deferred-items.md:20-60`; `185-22-cost.md:134-150`; `187-VERIFICATION.md:98-104`; `188-VERIFICATION.md:146,199`; `tests/e2e-runs/188-close3-20261119T213204Z/{head,exit,started,ended,results.json}`

### Secondary (MEDIUM) — official docs, read 2026-11-20
- https://supabase.com/docs/reference/api/v1-list-all-backups
- https://supabase.com/docs/reference/api/v1-restore-pitr-backup
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/clone-project

### Tertiary (LOW)
- Terraform/AWS provider update semantics for the listener rule and parallel apply (A1), OpenTofu feature parity (A6) — training knowledge.

## Metadata

**Confidence breakdown:**
- Tree inventory (B-03, F-01, F-02, guards, todos, E2E baseline): HIGH — every value read this session.
- C-01 classification: HIGH for rows cited by line; MEDIUM where a run id is cited without its date (S8, S10).
- E-02: MEDIUM — official docs; the staging values are the read itself.
- E-03 origin rotation: MEDIUM on mechanism (resource graph read), LOW on exact plan line (A1).
- Docs nav: HIGH on rendering, LOW on generator behaviour for the workaround (A5).

**Research date:** 2026-11-20
**Valid until:** until the next commit touching `apps/`, `packages/`, `infra/` or `tests/` (the line numbers above are content anchors; re-derive with the commands given rather than trusting the numbers).
