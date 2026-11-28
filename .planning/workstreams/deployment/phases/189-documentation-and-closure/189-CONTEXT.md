# Phase 189: Documentation and Closure - Context

**Gathered:** 2026-11-20
**Status:** Ready for planning (the operator's 2026-11-20 fill overruled F-01 only; every other decision is its ★ option)

<domain>
## Phase Boundary

A deployer can follow the documentation from an empty AWS account and a new Supabase project to a tested instance (DOCS-01), with a hosted-settings reference (DOCS-02) and an environment-variable reference covering the proxy variables, the analytics variables and `PUBLIC_PROJECT_ID` (DOCS-04). Every statement about a deployed system that is marked unverified becomes a dated observation or is removed (DOCS-03). The analytics documentation gives the event catalogue, how to add a provider, the privacy mechanism and the deployer's jurisdiction checklist, says the consent determination is the deployer's, and never says no consent is required (DOCS-05). An operations runbook covers election-day scaling, rollback, teardown and restore, secret rotation, SES and the Admin job limit (DOCS-06). The Render deployment example is removed with everything only it needs, and the orphan compose file is retired (DOCS-07, as amended by F-01). The seven absorbed todos each have a closure record (DOCS-08).

Out of scope: a restore drill (new todo); rehearsing any rotation but the origin header secret; ALB stickiness for `/admin`; the identity-callback drift guard (new todo); the dependency audit, the local port change and 187's after-merge dispatch read (re-targeted after the stream merges); a second environment (A1); any push to `deploy/staging`; any destroy.

</domain>

<decisions>
## Implementation Decisions

Every answer below is the ★ RECOMMENDED option of `189-DISCUSSION-POINTS.md`, except F-01, which the operator overruled in the 2026-11-20 fill. Decisions marked **provisional — research** take the research step's measurement where it contradicts them, and the plan says so.

### Already settled by earlier rulings (not re-asked)
- Terraform 1.16 with HCL kept OpenTofu-compatible, and the docs say so (A6).
- The docs describe the analytics mechanism; the consent determination is the deployer's: consent is asked by default, `trackEvents` is respected, server pageviews are recorded in any case (B7).
- Admin job progress is a documented limit; moving the job store is a future requirement (D1, worded per E-04 below).
- Raw evidence goes in `189-*/evidence/`; each fact is a dated `| Date (UTC) | Observation |` row (184 D-20).
- **Superseded:** ruling A5 / 181-12's "`render.example.yaml` fixed and kept as an untested alternative" is replaced by F-01 below.

### Where the documentation lives (A)
- **A-01** The docs site (`apps/docs`) carries the fork-facing guide, the reference pages and the runbook summaries. The staging runbooks (`infra/README.md`, `infra/bootstrap/README.md`, `infra/envs/staging/{aws,dns-mail,supabase}/README.md`) stay as the measured record. Each guide step states the step and the command and links to the runbook step where it was measured; the runbooks gain "← guide" back-links. No procedure is copied whole. — **Reversibility:** costly — the docs structure and every cross-link.
- **A-02** A `developers-guide/deployment/` subtree, regenerated in the nav (`apps/docs/scripts/generate-navigation-config.ts` → `apps/docs/src/lib/navigation.config.ts`): `deployment/` (overview and the path from an empty AWS account and a new Supabase project), `deployment/hosted-settings` (DOCS-02), `deployment/operations` (DOCS-06). **No `deployment/render` page** (F-01). Variables stay on `configuration/environmental-variables` (DOCS-04); analytics gets a new `configuration/analytics` page (DOCS-05). `deployment/` keeps its path, so no redirects.
- **A-03** The guide is written against `infra/envs/example/{aws,dns-mail,supabase}` with placeholders (`<your-domain>`, `<account-id>`), staging cited as the worked, measured instance ("observed on staging, 2026-11-xx"). The example roots gain no READMEs; the guide is their README.

### Reference pages (B)
- **B-01** `deployment/hosted-settings`: a hand-written table, one row per setting — group / setting / value / where the repository sets it (`infra/modules/supabase/hosted-settings.json` key, `settings.tf` or `function-secrets.tf`) / parity class / how to verify (probe check name from `infra/scripts/probe/checks.mjs`, or the dashboard read where the probe does not reach). A new unit test asserts every key of `hosted-settings.json` and each `settings.tf` and function-secret name appears on the page, modelled on `startup/taskEnvironment.test.ts`.
- **B-02** `configuration/environmental-variables` rewritten, grouped by role: required at start, proxy (`ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`, and how the depth is measured), timeouts, analytics, diagnostics (`DEPLOYMENT_DIAGNOSTICS`), identity provider, `BOOTSTRAP_*`, local only. Fix l.62 (`send-email`, not `identity-callback`, reads `PUBLIC_PROJECT_ID`). Extend `taskEnvironment.test.ts` or add a sibling so every name in `task-environment.json`, `REQUIRED_ENV` and `ANALYTICS_ENV` must appear on the page.
- **B-03 (provisional — research)** Remove `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL` everywhere: `apps/frontend/src/lib/utils/constants.ts:4-5`, `.env.example`, the root `docker-compose.dev.yml`, the five auth test mocks, the env page and the guide (the `render.example.yaml` copies go with the file, F-01). Re-grep first, including `apps/docs` and `packages/`; if a non-test reader is found, the plan keeps it and says so. — **Reversibility:** reversible — an env read removed.

### "Unverified" statements (C)
- **C-01** Every deployed system counts: Supabase, AWS and SES (Render's statement leaves with the file, F-01). For each of the remaining statements (2 on the Supabase guide, 8 in `infra/bootstrap/README.md` "Not yet observed", 3 in `aws/README.md`, 5 in `dns-mail/README.md` plus l.310): (1) observe it now when a read-only check or an existing record settles it, as a dated row; otherwise (2) remove it from the docs and the runbook and carry it into one new pending todo, "Unobserved statements about the deployed stack (189)", listing each with its check. The emptied "Not yet observed" sections are deleted, the empty one in the supabase README included.
- **C-02** A recorded search, no permanent guard: the exact `git grep -niE` pattern (`unverified|not yet observed|untested`) over docs, READMEs and comments goes into the verification, every remaining hit classified as unrelated (`UNVERIFIED_ANSWERS`, "unverified user", the probe check name `functions.identity-callback-unverified`).

### Analytics documentation (D)
- **D-01** One page, `developers-guide/configuration/analytics`: the mechanism (relay, modes, consent default, server pageview, visit id), the event catalogue, adding a provider (`PROVIDERS` in `apps/frontend/src/lib/server/analytics/config.ts`, the switch in `providers/index.ts`, one file per provider), the privacy mechanism, and the deployer's checklist. `publishers-guide/.../what-data-should-be-collected` gets a pointer to the checklist. The page never says no consent is required.
- **D-02** The event catalogue is a hand-written table (event / when sent / fields / sent before consent?), with a unit test that the table names exactly the `name` literals of `EventSchema` (`apps/frontend/src/lib/analytics/events.schema.ts`).
- **D-03** The checklist, each item phrased as the deployer's own determination, never a conclusion: consent mode; `trackEvents`; visit-id mode; the server pageview recorded in any case; the provider's region and data-processing terms; PostHog's IP-capture setting and `$geoip_disable`; the billing limit (staging: 20 USD); retention, including the 90-day log group; the terms-of-use paragraph on tracking (B5); the address `account-access` stores as its per-caller limit key and Cloudflare's `cf-connecting-ip` (188 E-04); the feedback limit's stored address (`107-feedback.sql`).

### Operations runbook (E)
- **E-01** `deployment/operations`: a summary per procedure (when to use it, the commands, the expected result, a link to the measured runbook step): election-day scaling (floor raise, the capacity lower bound of at least 40 voter journeys a minute and its `trackEvents=false` condition); rollback (circuit breaker, roll-forward on `deploy/staging`, FUT-10 deferred); teardown (`destroy.yml`, the hand destroy, `prevent_destroy`); restore; secret rotation; SES sandbox and production access; the Admin job limit. Cost (INFRA-13: 50.78 USD/month priced, 36.96 measured, 44.26 with untagged IPv4) carried from `185-*/evidence/185-22-cost.md`.
- **E-02 (provisional — research)** Supabase backup and restore: one read-only Management API read of the staging project's backups (`GET /v1/projects/{ref}/database/backups`, PITR included) recorded as a dated row; the restore procedure described from Supabase's documentation, read on a date and cited. No restore drill; a pending todo "Restore drill into the throwaway project" is filed. — **Reversibility:** reversible — a read.
- **E-03 (provisional — research)** Secret rotation: one procedure per secret, written from its mechanism with `file:line` (SSM `PUBLIC_SUPABASE_ANON_KEY` and `ANALYTICS_POSTHOG_KEY` reach a task only on a new deployment; `random_password.origin_verify`; the SES SMTP key; the seven Supabase function secrets plus `IDENTITY_CALLBACK_SERVER_SECRET`; the database password, service-role key and access token; seven GitHub secrets). The legacy anon/service keys are noted as rotatable only with the JWT secret, which signs out every user. **One rehearsal on staging:** `terraform apply -replace=random_password.origin_verify` with `/api/health` polled through the apply and any window of 403s recorded. — **Reversibility:** costly — an outward staging apply; a bad apply leaves CloudFront and the ALB out of step until re-applied.
- **E-04** Document the Admin job limit as the tree is: `jobStore.ts` is in-memory, so progress polling is unreliable whenever more than one task runs — on staging, under load (`task_ceiling = 2`, `infra/envs/staging/aws/terraform.tfvars:22`). Workaround: run Admin jobs when one task is serving, or pin `task_ceiling = 1` for the job's duration. The ceiling stays at 2; D1's "staging runs one task" is recorded as superseded by 185's scaling.

### Render and the compose files (F)
- **F-01 (operator overrule, 2026-11-20 fill)** **Remove the whole Render deployment example and its mentions from the guides, and everything needed only for it. The instructions are no longer maintained.** This removes `render.example.yaml`, the Render parts of `deploymentTemplates.test.ts` and `analyticsEnvTemplates.test.ts` (whole tests where they only guard Render), the Render text of the deployment guide and env page, the `deployment/render` page of A-02, and the Render references in `CLAUDE.md` § Deployment and anywhere else a grep finds them. Anything Render shares with another consumer (the root compose, the task environment) stays. **DOCS-07 and ROADMAP § 189 criterion 5 are amended** to read "the Render deployment example and its mentions are removed, the orphan compose file is retired if nothing references it" — the plan edits both, citing this fill. — **Reversibility:** reversible — git history keeps the file.
- **F-02 (provisional — research)** Delete `apps/frontend/docker-compose.dev.yml` and the Dockerfile's `development` target (`apps/frontend/Dockerfile:38`), its only user. Re-grep first, including `.github`, `infra/` and `apps/docs`; afterwards build the `production` target to show the multi-stage file still works.
- **F-03** Keep the root `docker-compose.dev.yml` and its three tests (`deploymentTemplates.test.ts:87-106`, `analyticsEnvTemplates.test.ts:109-118`, `localSupabaseUrl.test.ts:233`) — the tests' compose halves survive F-01. It loses the two frontend-URL lines (B-03). `infra/local/docker-compose.proxy.yml` serves a different purpose.

### Closure and items aimed at this phase (G)
- **G-01** The 188 convention: move each of the six pending todos to `.planning/todos/completed/`, add `completed: 2026-11-xx` and `status: completed`, and a `## Closed (phase 189), <date>` section with "What was built", evidence paths, "What remains" and "Moved". The caller-limit todo (closed in 188) gets one line in the phase summary pointing to its record.
- **G-02** The self-hosted PostHog log-sink todo closes with a short comparison written from what is measured: container logs (90-day log group) as the durable server sink; PostHog Cloud EU for analytics, proven in 188; self-hosting not provisioned (`REQUIREMENTS.md` anti-feature); browser errors (RELAY-D4) moved to future work. No new research.
- **G-03** The hosted-auth todo closes; the three unobserved asks (`identity-callback` secret checks, the shared per-IP sign-in budget, the OTP-length label) move into one new pending todo "Pre-launch auth checks on the production project", each with its check. The OTP label and the `identity-callback` secret checks are observed now if a read-only probe row settles them.
- **G-04** The identity-callback closing check: record (a) fixed opaque replies, (b) `identityMatchProp: 'sub'` on both providers with the frontend copies agreeing, (c) `verify_jwt = false` with its hosted half from the latest `functions.identity-callback-unverified` probe row (or one fresh read-only probe run), each with `file:line` and today's date; record (d) drift guard as "none" and file a pending todo for one.
- **G-05** Fold in: the buckets-by-hand text in the guide (181 deferred-items:24); `BOOTSTRAP_*` (B-02); the `seed.sql` comment and guide steps (181-08-SUMMARY:297); the dangling conflict-1 reference in `.claude/skills/recommended-skills/SKILL.md` (181-18); the stale redirect path `/api/auth/callback` → `/auth/confirm` in the redirect-allowlist todo; REQUIREMENTS INFRA-13 → Complete with a dated note on 185-VERIFICATION. Re-target to "after the stream merges", with a dated note in each: `2026-11-15-dependency-audit-third-party-advisories`, `2026-11-17-local-supabase-ports-in-ephemeral-range`, 187's `DISPATCH_OBSERVABLE=after-merge` read.

### Outward actions and gates (H)
- **H-01** Operator checkpoints, each its own sitting: (1) read-only probe run and reads against the staging Supabase project and `https://staging.openvaa.org` (C-01, G-03, G-04); (2) the Management API backups read (E-02); (3) one staging apply `-replace=random_password.origin_verify` with health polled (E-03). No push to `deploy/staging`, no destroy.
- **H-02** E2E: the phase changes code (B-03, F-01, F-02, the new guards), so plans make targeted runs of affected projects; the final plan makes one full-suite run judged against the last full run with summed deltas (CLAUDE.md ruling 2026-11-09). The production-target Docker build after F-02 is part of that plan's proof. `yarn lint:check`, `yarn format:check` and the docs build (`yarn workspace @openvaa/docs build`) gate the docs changes.

### Claude's Discretion
- File names of the new guard tests and the exact sections of each docs page.
- Which runbook steps get "← guide" back-links beyond those the guide cites.
- The wording of each closure record, within G-01's convention.

</decisions>

<code_context>
## Existing Code Insights

- Guide: `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md` (159 lines; Supabase dashboard/CLI by hand plus Render; stale at l.34, l.30-33, l.42-46). Env page: `apps/docs/src/routes/(content)/developers-guide/configuration/environmental-variables/+page.md` (l.58-62, l.97). Nav generated by `apps/docs/scripts/generate-navigation-config.ts` → `apps/docs/src/lib/navigation.config.ts` (`deployment` at l.246).
- Runbooks: `infra/README.md` (fork path l.359-376, destroy workflow l.239-316, example env l.352-357), `infra/bootstrap/README.md` ("Not yet observed" l.1174), `infra/envs/staging/aws/README.md` (rollback Step 10 l.1777, `ORIGIN` restore Step 11 l.2070, floor raise l.2235, destroy/re-apply Steps 15-17 l.2823-3437, cost l.3439, "Election day" l.3654, "Not yet observed" l.3698, capacity l.3778-3793), `infra/envs/staging/dns-mail/README.md` (l.310, l.425), `infra/envs/staging/supabase/README.md` ("Settings and their guard" l.1712-1748, Observations l.1789-, empty "Not yet observed" l.1783).
- Settings sources: `infra/modules/supabase/hosted-settings.json`, `settings.tf`, `function-secrets.tf`; probe checks `infra/scripts/probe/checks.mjs`.
- Task environment: `infra/modules/frontend-service/task-environment.json` (17 variables); guard precedent `startup/taskEnvironment.test.ts`; `REQUIRED_ENV`, `ANALYTICS_ENV`.
- Analytics: `apps/frontend/src/lib/analytics/events.schema.ts` (`EventSchema`, `z.discriminatedUnion`); `apps/frontend/src/lib/server/analytics/config.ts` (`PROVIDERS`), `providers/index.ts`.
- Render-only: `render.example.yaml` (69 lines), guarded by `deploymentTemplates.test.ts` and `analyticsEnvTemplates.test.ts` (which also read the root compose).
- Compose: root `docker-compose.dev.yml` (referenced by the guide l.141-147, CLAUDE.md, `.env.example:127`, `main.yaml:182`); orphan `apps/frontend/docker-compose.dev.yml`, only user of `apps/frontend/Dockerfile:38` `development` target.
- Admin jobs: `jobStore.ts` in-memory; staging `task_ceiling = 2`.
- identity-callback: `apps/supabase/supabase/functions/identity-callback/index.ts:77-82,194-363`, `requestContract.ts:30-40,123-130`, `claimConfig.ts:41-52`; frontend copies `providers/signicat.ts:37-44`, `idura.ts:39-40`; `config.toml:431-436`.
- Closure convention example: `.planning/todos/completed/2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations.md:36-44`.

</code_context>

<specifics>
## Specific Ideas

- The guide is the README of `infra/envs/example`; staging is cited as the observed instance, not as the instructions.
- The C-01 todo and the G-03 todo are the places open questions go, so the criterion-2 search can come back clean without losing any.
- The origin-secret rehearsal is the one rotation most likely to break serving and touches only Terraform-owned resources.

</specifics>

<deferred>
## Deferred Ideas

- Restore drill into the throwaway project (new todo, E-02).
- Unobserved statements about the deployed stack (new todo, C-01).
- Pre-launch auth checks on the production project (new todo, G-03).
- identity-callback frontend/Deno claim-config drift guard (new todo, G-04).
- Rehearsing the other secret rotations.
- Moving the Admin job store out of memory; ALB stickiness for `/admin`.
- Dependency audit, local port range, 187 after-merge dispatch read (after the stream merges).

</deferred>

<canonical_refs>
## Canonical References

- `.planning/workstreams/deployment/phases/189-documentation-and-closure/189-DISCUSSION-POINTS.md` — the decisions, the factual baseline and the rejected options
- `.planning/workstreams/deployment/ROADMAP.md` § Phase 189; `REQUIREMENTS.md` DOCS-01 to DOCS-08, INFRA-13
- `.planning/workstreams/deployment/v2.17-DISCUSSION-POINTS.md` rulings A5, A6, B5, B7, D1
- `.planning/workstreams/deployment/research/FEATURES.md` § Todo absorption map
- `.planning/workstreams/deployment/phases/181-*/deferred-items.md`, `181-08-SUMMARY.md`, `181-12-*`, `181-18-*`
- `.planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-VERIFICATION.md`, `evidence/185-22-cost.md`
- `.planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/188-CONTEXT.md`, `188-VERIFICATION.md`
- Todos: `.planning/todos/pending/2026-08-31-evaluate-self-hosted-posthog-log-sink.md`, `2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e.md`, `2026-09-02-deployment-guide-production-redirect-allowlist.md`, `2026-09-18-document-supabase-api-limits-for-deployments.md`, `2026-10-02-deployment-config-gaps-found-by-docs-rewrite.md`, `2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`; `.planning/todos/completed/2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations.md`

</canonical_refs>
