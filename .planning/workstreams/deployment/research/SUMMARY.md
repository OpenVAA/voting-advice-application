# Project Research Summary

**Project:** OpenVAA v2.17 Full Deployment: AWS by Terraform, Hosted Supabase & Analytics Relay (workstream `deployment`, phases number from 181)
**Domain:** Deploying an existing SvelteKit (adapter-node) + Supabase app to AWS by IaC, with a plan/apply/smoke pipeline and a storage-less first-party analytics relay
**Researched:** 2026-10-10
**Confidence:** MEDIUM. Nothing has been applied to a real AWS account or a real hosted Supabase project. Repo facts are observed (HIGH). Vendor behaviour is MEDIUM at best. The legal reading of "no consent needed" is LOW to MEDIUM and is not a legal conclusion.

## Executive Summary

This is a deployment-engineering milestone. The application, schema, auth model and Playwright suite are validated. What is missing is every hosted-side fact. Nothing has ever been deployed, so each repo statement about a hosted Supabase project or a load-balanced Node server is unobserved.

The research converges on one shape:

- Terraform owns infrastructure and hosted Supabase settings.
- The pinned Supabase CLI owns code (migrations, Edge Functions).
- An idempotent SQL script owns per-deployment rows.
- The frontend runs the existing `production` image on ECS Fargate behind an ALB, written as explicit resources. App Runner is closed to new accounts, and ECS Express Mode keeps its load balancer outside Terraform state.
- GitHub Actions reaches AWS by OIDC with a read-only plan role and an environment-gated deploy role.
- The analytics relay is a same-origin SvelteKit route. It validates a closed event vocabulary, answers at once, and forwards server-side to PostHog Cloud EU by plain `fetch` as anonymous events, behind a provider interface.

The central risk is that the milestone's value is observation, and the pipeline is only as good as what was observed first. All four files agree that first hosted contact happens outside CI. They disagree on:

- how much can be measured before any AWS exists;
- how a visit is identified without storage;
- how the migration model survives the first `db push`;
- whether Supabase and AWS share a Terraform root.

The migration problem is the sharpest. The repo keeps one rewritten `00001` migration, and `db push` will silently skip every later edit to it.

**Recommended approach:**

1. Make the app deployable and build the relay in parallel; both need no cloud.
2. Provision and measure hosted Supabase before the AWS stack.
3. Apply the AWS stack by hand once.
4. Build the deployed smoke entry.
5. Automate in `deploy.yaml`.
6. Verify the relay on the deployed stack.
7. Document last.

Get the operator rulings (last section) before phase 181 is planned.

## Key Findings

### Recommended Stack (STACK.md, MEDIUM; versions REGISTRY-read)

No npm package is added. Everything new is a CLI, provider or Action.

- **Terraform:** 1.16.5 (`~> 1.16`), `hashicorp/aws` 6.68.0, `supabase/supabase` 1.11.0, `hashicorp/random` 3.9.1.
  - Keep the HCL OpenTofu-compatible.
- **State:** S3 backend with `use_lockfile = true` (no DynamoDB).
  - A hand-applied `bootstrap` root holds the state bucket, OIDC provider, roles and ECR.
- **Compute:** ECS Fargate + ALB + ACM + ECR as about fifteen explicit `aws_*` resources.
  - Public subnets, no NAT, circuit breaker with rollback, `wait_for_steady_state`.
  - Terraform is the sole writer of the task definition (`-var image_tag=$GITHUB_SHA`).
- **Supabase split by owner:**
  - The provider owns the project, `api`/`auth` settings, the access-token hook, Edge secrets and API-key reads.
  - CLI 2.118.0 (the existing pin) owns `db push` and `functions deploy`.
  - SQL owns buckets (a migration) and per-deployment rows (a bootstrap script).
  - `supabase config push` is not used.
  - A new `assert:*` parity guard compares security-relevant keys between `config.toml` and the HCL.
- **GitHub Actions:** `deploy.yaml` is separate from `main.yaml`.
  - Third-party actions are pinned by commit SHA; OIDC audience is `sts.amazonaws.com`.
  - A `deploy-evidence/**` push trigger lets runs be observed before the file is on `main`.
- **Relay:** a `+server.ts` POST route, `zod`, and a server-only provider interface with `posthog`, `console`/`log` and `none`.
  - It sends plain `fetch` to `https://eu.i.posthog.com/batch/` with `$process_person_profile: false` and `$geoip_disable: true`, and forwards no visitor address.
  - There is no `posthog-js` or `posthog-node`.
- **PostHog Cloud EU**, not self-hosted (unsupported, 4 vCPU / 16 GB).

**Critical notes:**

- adapter-node 5.5.7 needs `ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH` and `KEEP_ALIVE_TIMEOUT`. Nothing sets them today. The exact mechanism is LOW confidence.
- `use_lockfile` needs `s3:DeleteObject` on the `.tflock` key.
- The API hashes secret provider fields, so drift detection covers non-secret fields only.
- Supabase legacy `anon`/`service_role` keys are retired by end of 2026.

### Expected Features (FEATURES.md, MEDIUM; legal reading LOW to MEDIUM)

There are six requirement groups: INFRA (13), SUPA (9), PIPE (9), OBS (10), RELAY (14), DOCS (8).

**Must have:**

- **AWS stack:** applyable and destroyable, with a health endpoint, proxy variables, `PUBLIC_PROJECT_ID`, immutable tags, durable logs, autoscaling with a scheduled floor, EU region and cost tags.
- **Supabase project:** reproducible from the repo, with a verification step that reads served state. Each check must be seen failing once.
- **Pipeline:**
  - Keyless OIDC.
  - Plan on PR without credentials for forks.
  - Gated, serialised apply.
  - Fixed order: migrations, functions, rollout, wait.
  - A smoke run that fails the pipeline.
  - A guarded destroy.
  - One observed red run.
- **Ten OBS measurements**, recorded and acted on.
- **Relay:**
  - Same-origin endpoint and a sender that survives unload.
  - Provider interface and PostHog provider.
  - Nothing written to or read from the device, and no fingerprint.
  - Address and user agent stop at the relay.
  - Server-side allowlist and size caps.
  - Consent mode as a deployment setting (consent-free default, gated retained).
  - Privacy tests, seven-locale privacy text, Umami removed.
- **Docs:** guide rewrite, settings reference, runbook, and a closure record for each of the seven absorbed todos.

**Should have (P2):** `log` provider, CDN for immutable assets, alarms, fork-runnable workflow design, load test, hosted/local parity guard.

**Defer:** opt-in session linkage, sampling, browser error reporting, Terraform-created Supabase project, drift job, WAF as default, preview branches.

### Architecture Approach (ARCHITECTURE.md, HIGH for repo facts, MEDIUM for external tooling)

**Three planes:**

- **Provisioning:** Terraform bootstrap plus per-environment roots plus `infra/scripts`.
- **Runtime:** browser, ALB, adapter-node container, hosted Supabase, and the new relay hop to PostHog.
- **Verification:** `deploy.yaml`, then a second Playwright entry.

`infra/` sits at the repo root. It stays outside `apps/` because the Dockerfile copies `apps/` wholesale, and outside the Yarn workspaces.

The composition root computes each shared value once and feeds every sink. For example, the project id goes to the frontend env, the Edge secret and `bootstrap.sql`. The public origin goes to Auth `site_url`, the allowlist, `SITE_URL` and `ORIGIN`.

The service-role key reaches only the bootstrap script and the smoke job (but see disagreement D8).

**Major components:**

1. `infra/terraform/bootstrap`: state bucket, OIDC provider, roles, ECR. Applied once by hand.
2. Supabase module/root: project, settings, Edge secrets, API keys as outputs.
3. Frontend-service module plus network: Fargate service behind an ALB, logs, scaling, DNS/TLS.
4. `infra/scripts`: `deploy-backend.sh` and an idempotent `bootstrap.sql`.
5. `deploy.yaml`.
6. Relay: `routes/api/analytics`, `lib/server/analytics/`, a client `relayTransport`, and a rewritten `TrackingService` with the same consumer API (about 30 call sites unchanged).
7. `tests/playwright.deployed.config.ts` plus a deployed global setup. The local gate suite and its preflight stay byte-identical.

### Critical Pitfalls (PITFALLS.md, MEDIUM; 20 total)

1. **The single rewritten migration stops being deployable once a hosted project exists.** `db push` skips already-recorded versions, so later edits to `00001` never land and the parity guard stays green.
2. **`seed.sql` reaching the hosted project.** It carries `password123` users, kong URLs and the demo service-role key. Never use `--include-seed` or a bare `db reset --linked`. Assert no `@openvaa.test` user and no `kong` URL after deploy.
3. **`config push` writing local dev auth settings.** Use one owner per setting, and assert the served `/auth/v1/settings`, not the file.
4. **Hosted state that no migration or config carries.** That means buckets, `storage_config`, `behind_cloudflare`, `max_rows` (silent truncation at 1000 with HTTP 200), the hook and project rows. Add one conformance probe.
5. **Three mail paths, each with a hosted-only blocker.**
   - Auth's built-in mail goes to organisation members only, 2 per hour.
   - Edge Functions cannot reach ports 25/587.
   - SES starts in the sandbox.
   - SES production access is the only human lead-time item, so request it first.
6. **Per-IP Auth limits collapse onto the frontend's egress address.** `Sb-Forwarded-For` needs a secret key, which the SSR client does not use. Measure before designing.
7. **Privacy and consent integrity.** The current code stores `appContext-sessionId` in `sessionStorage`, stamps it on answer events and puts it in the survey link. A hash of address and user agent does not escape the question. Answers are political-opinion data.
8. **Also:**
   - Secrets in state, plans and artifacts. No Terraform ignore entries exist yet.
   - A shared Supabase/AWS lifecycle.
   - OIDC subject shape and fork behaviour.
   - adapter-node behind a proxy.
   - Retiring API keys.
   - PostHog silent failures: identified by default, empty `distinct_id` dropped with 200, queue lost at `SIGTERM`.
   - An open ingest endpoint.

## Where the four files disagree, and what to do

**D1. Build order, and whether hosted measurements precede the pipeline.**

- ARCHITECTURE: app readiness and the relay come first, in parallel. Then the Terraform skeleton, the bootstrap apply, one manual first apply that does all the measuring, the deployed E2E from a workstation, the pipeline, and relay verification.
- PITFALLS: FOUND, then SUPA+MEASURE (Supabase only), then RUNTIME, then APPLY, then PIPE. RELAY runs parallel after RUNTIME.
- FEATURES: every OBS item depends on INFRA, SUPA and PIPE, so it comes after the pipeline.
- STACK: gives pipeline order only, and says to measure on staging.
- **Recommendation:**
  - Reject FEATURES' "after PIPE" for any observation that changes a design.
  - Split the measurements. Supabase-only ones run right after the Supabase project exists, before any AWS resource: OBS-01/02/03/05/07, the key model, gateway headers, the Postgres major version and IPv4 `db push`. Frontend-dependent ones run in the first manual AWS apply: OBS-04 frontend side, 06, 08 and 10.
  - Build the pipeline after both.
  - Start RELAY at once, not after RUNTIME. Once no visitor hash is used (D2), the client-address question no longer gates it.

**D2. Session/visit identifier mechanism.**

- STACK: an in-memory UUIDv7 with selectable `memory` / `none` modes. `daily-hash` is not built.
- FEATURES: no identifier at all, a random `distinct_id` per event, and no `{sessionId}` in the survey link.
- ARCHITECTURE: an in-memory `pageSessionId` plus a server `visitorHash` (a daily HMAC of address, user agent, host and project) used as `distinct_id`.
- PITFALLS: in-memory only, no fingerprint.
- **Recommendation:**
  - Reject ARCHITECTURE's `visitorHash`. FEATURES and PITFALLS both identify it as the highest-exposure option, and it contradicts the operator's "events without sessions" fallback.
  - Adopt STACK's two modes with `memory` as default.
  - Events carrying an answer value (`answer`, `answer_delete`, `question_skip`) get a fresh random id per event, or their values are stripped, unless the operator rules otherwise (PITFALLS 15, FEATURES).
  - `none` stays available as a setting.
  - Sub-disagreement: PostHog `$session_id` must be UUIDv7 (STACK, docs read) versus "unclear, send as a custom property" (ARCHITECTURE F7, LOW). Use UUIDv7, verify in phase 188, and fall back to a custom property.
  - Do not build PostHog's cookieless hash mode.

**D3. How the migration model survives the first `db push`.**

- Only PITFALLS raises it.
- STACK and ARCHITECTURE treat `db push` as repeatable. ARCHITECTURE plans to edit `schema/400-storage.sql` and regenerate `00001`, which is exactly the edit-after-push hazard.
- **Recommendation:** treat it as a blocker for the first push.
  - Land every pre-deployment schema change, including the bucket insert, in `00001` first, then freeze it as a named baseline.
  - Change `assert-schema-migration-parity` to "byte-equal to the baseline, then append-only numbered migrations".
  - A reset-based disposable project is acceptable only for a throwaway measurement project, not persistent staging.
  - Add a post-deploy drift check (`db diff --linked` / `migration list`) with its exit status read directly.

**D4. Who owns hosted auth settings, and how `seed.sql` is replaced.**

- STACK and ARCHITECTURE: Terraform `supabase_settings` as sole writer, and an idempotent `bootstrap.sql` via `psql`.
- PITFALLS: prefers `[remotes.<name>]` via the CLI and a split seed, but accepts Terraform as the single owner.
- FEATURES: undecided.
- **Recommendation:**
  - Terraform for settings and `bootstrap.sql` for rows.
  - No `config push` and no remote seed blocks.
  - Confirm the exact JSON keys by importing from a scratch project (ARCHITECTURE F1) before requirements name the tool.

**D5. Edge Function `verify_jwt`.**

- STACK and PITFALLS: declare `[functions.identity-callback] verify_jwt = false` in `config.toml`. ARCHITECTURE uses `--no-verify-jwt`.
- **Recommendation:** the `config.toml` declaration.

**D6. One Terraform root or two for Supabase and AWS.**

- ARCHITECTURE composes both in one `envs/<env>` root.
- PITFALLS 10 says never, because teardown deletes the database and a recreated project changes ref, keys and allowlist.
- **Recommendation:**
  - Two roots and state files per environment: a long-lived Supabase root (`prevent_destroy`, importable) and an AWS root that reads its outputs.
  - CI teardown targets the AWS root only.
  - Make the public origin a domain-variable local, which removes the cross-reference (ARCHITECTURE itself notes this).
  - Whether Terraform creates or imports the project is operator question 8.

**D7. SMTP port for Edge Functions.**

- STACK: SES on 587 with STARTTLS matches `secure: false`.
- PITFALLS: hosted Edge Functions block 25 and 587. 465 needs implicit TLS. SES STARTTLS on **2587** is the only port that works with the code as written.
- **Recommendation:**
  - This is a direct contradiction. Adopt 2587 for the function secrets, since PITFALLS cites the Supabase limits page it read, and measure on hosted.
  - Auth's own SMTP is not an Edge Function and may use 587.
  - Consider deriving `secure`/`requireTLS` from the port.

**D8. Does the frontend task need the service-role key?**

- STACK and ARCHITECTURE: never.
- PITFALLS' security table says "the frontend server needs the key (`.env.example` documents the construction-time throw)".
- **Recommendation:** this is a factual conflict about the repo. Resolve it by grep in phase 181 planning. Provisionally follow ARCHITECTURE: the key stays off the task.
- **Resolved 2026-10-10 by the orchestrator (grep at `471f01e8e`):** STACK and ARCHITECTURE are right. `.env.example` says "Nothing under `apps/frontend/src` reads it; only local tooling and the test harness do", and the only match for `SERVICE_ROLE` under `apps/frontend/src` is `supabaseDataWriter.integration.test.ts`. The construction-time throw PITFALLS cites belongs to `@openvaa/dev-seed`'s `Writer`. The key stays off the frontend task.

**D9. Deployed E2E contract.**

- All four agree on a separate entry, an untouched preflight and an identity check.
- ARCHITECTURE includes `data-setup-base`, `auth-setup` and teardown with `DEV_SEED_ALLOW_REMOTE=1`, plus a `/_app/version.json` SHA check.
- PITFALLS wants read-mostly: seed once out of band, no setup or teardown projects, at most one namespaced write path. Its reason is that `DEV_SEED_ALLOW_REMOTE` arms prefix-scoped bulk deletes.
- Mail: ARCHITECTURE and FEATURES exclude mail-dependent specs; PITFALLS wants one real inbox round trip.
- **Recommendation:**
  - Seed a dedicated project once out of band.
  - No teardown project.
  - One contestant sign-in, which proves the hook.
  - Keep the build-SHA check.
  - `DEV_SEED_ALLOW_REMOTE` never goes in a workflow.
  - Mail is a manual OBS-06 observation, not a v1 gate.

**D10. Plan artifacts and OIDC roles.**

- STACK: plan to job summary, two roles.
- ARCHITECTURE: saved plan artifact then apply, one deploy role.
- PITFALLS: no plan uploads (public repo), two roles, fork guard, `cancel-in-progress: false`.
- **Recommendation:** two roles; apply in the same job as its plan, or encrypt the artifact; fork guard on every deploy job.

**D11. Event shape and volume.**

- STACK: the compound `pageview` keeps volume near one event per page.
- ARCHITECTURE: discrete events, because the packing existed for Umami's 50-property limit.
- Per-event cost is unconfirmed.
- **Recommendation:** discrete events through a closed server-side schema, needed for funnels. Add a PostHog billing limit and a fixed-size drop-when-full forwarder. Volume is operator question 13.

**D12. Abuse limiting for the relay.**

- STACK: in-app schema, size cap and per-address limiter; WAF opt-in.
- ARCHITECTURE: schema and caps; a load-balancer rule if abuse appears.
- PITFALLS: edge WAF rule in APPLY; an in-process `Map` only on a single-task stack.
- **Recommendation:**
  - Mandatory: closed schema, body cap, same-origin check, bounded queue.
  - WAF rule as an opt-in Terraform variable (cost scales with traffic).
  - No in-process address map beyond a single-task stack.

**D13. Paths.**

- ARCHITECTURE: `/api/analytics` and `/api/health`.
- FEATURES and PITFALLS: pick a path that filter lists don't match (`analytics`, `collect`, `track`, `event`). PITFALLS names `/healthz`.
- **Recommendation:** a neutral relay path, and `/api/health` because API routes already skip the session gate. Settle in planning.

**D14. Task count and the admin job store.**

- FEATURES: at least two tasks in two zones.
- STACK: start with one 0.5 vCPU task; the floor is a variable.
- PITFALLS: a floor above one; leaving `jobStore` is acceptable while admin is out of smoke scope.
- All note the in-memory job map breaks with more than one task.
- **Recommendation:** floor 1 for staging and 2 for production, and document the Admin job limit. The operator picks stickiness, a documented limit, or moving the store (question 6).

**Synthesizer's inference, not in any file:** STACK's no-NAT design gives each Fargate task its own public IP, so Auth sees a few addresses instead of one. That softens Pitfall 6 but doesn't remove it, and the addresses change on scale-out. Include it in phase 184's design.

## Implications for Roadmap

Proposed phases are 181 to 189. A cloud-free lane (181, 182) can run in parallel with the cloud lane (183 onward).

### Phase 181: Deployability and migration model (cloud-free)

- **Rationale:** every later phase depends on these small changes, and each one found during a real apply costs a cloud round trip. The migration decision (D3) must precede any push.
- **Delivers:**
  - `/api/health` that makes no Supabase call.
  - Build SHA at `/_app/version.json`.
  - Proxy variables and a startup check that names unset required variables.
  - `PUBLIC_PROJECT_ID` in the templates.
  - The bucket insert landed in `00001`, then the baseline freeze and the changed parity guard.
  - An idempotent `bootstrap.sql` tested locally.
  - `verify_jwt` in `config.toml`.
  - `.gitignore` and `.prettierignore` entries for Terraform.
  - A local reverse-proxy compose that reproduces the topology: form POST, OIDC redirect, spoofed `X-Forwarded-For`, and `SIGTERM` reaching Node under the shell-form `CMD`.
- **Addresses:** INFRA-04/05/06, SUPA-01/04/06 (local half).
- **Avoids:** Pitfalls 1, 2, 8, 9.

### Phase 182: Analytics relay (cloud-free, parallel with 181)

- **Rationale:** it needs no cloud, and the image phase 189 deploys should already contain it. The first plan is the data model, not the endpoint (Pitfalls 14, 15).
- **Delivers:**
  - Relay contract, closed schema, and a route that answers before forwarding.
  - Provider interface with `posthog`, `log` and `none`.
  - In-memory visit id and the survey-link ruling.
  - Consent gate, storage writes, Umami and the consent components removed.
  - Settings schema, 23 seed templates and `perm-analytics-tracking` moved together.
  - Privacy copy in seven locales.
  - A rewritten tracking E2E with a storage-absence assertion proven to fail.
  - PostHog adapter unit tests: anonymous flag, non-empty id, client timestamps, and a flush on `sveltekit:shutdown`.
- **Addresses:** RELAY-01..14, todo `2026-06-01`.
- **Avoids:** Pitfalls 14-19.

### Phase 183: Terraform foundation and Supabase as code

- **Rationale:** the bootstrap layer and state design must exist first. Request SES production access on day one, because it is the only human lead time.
- **Delivers:**
  - `infra/` layout.
  - Bootstrap root applied: state bucket with versioning, encryption and public-access block; OIDC provider; two roles; ECR.
  - Budget alarm and stack tags.
  - Supabase root with project, settings, Edge secrets, key reads and `prevent_destroy`.
  - The `assert:hosted-settings-parity` guard in `lint:check`.
  - A credential-free `infra-validate` job in `main.yaml`. `docker-image-build` is left untouched.
  - SES identity with DKIM, SPF and DMARC.
- **Avoids:** Pitfalls 3, 9, 10, 11, part of 5.

### Phase 184: Hosted Supabase measurement and conformance probe

- **Rationale:** this is research by construction. Several `174-` todos change design depending on the result.
- **Delivers:**
  - `db push` from an IPv4 runner, or the pooler fallback.
  - A Postgres 17 assertion.
  - Served auth settings and switch names (OBS-01).
  - Allowlist pattern and `/auth/v1/verify` behaviour (OBS-02).
  - Anon-key-only gateway call and forwarded headers (OBS-03).
  - Both `account-access` refusals (OBS-05).
  - A read of more than 1000 rows and the `anon` 8 s timeout (OBS-07).
  - Whether the hook can be enabled before its function exists (F2).
  - Key model and the three call shapes.
  - A conformance probe, with each assertion seen failing against a deliberately broken throwaway project.
- **Addresses:** SUPA-02/03/05/07, todos `2026-09-02`, `2026-09-18`, `2026-10-07` (settings).
- **Avoids:** Pitfalls 4, 6 (partly), 7.

### Phase 185: AWS frontend stack, first apply by hand

- **Rationale:** automate only what has been seen to work.
- **Delivers:**
  - An explicit Fargate/ALB module with a staged apply: registry, image, DNS/certificate, compute.
  - Logs with retention, and autoscaling variables.
  - Image build and push.
  - `db push`, functions and bootstrap in the documented order.
  - A destroy path run once on purpose that leaves the Supabase root untouched.
  - Frontend-dependent observations: OBS-04 frontend headers, OBS-06 (one real mail with the correct origin that signs in), OBS-08, OBS-10.
  - Drain and rollout with requests in flight.
- **Addresses:** INFRA-01..03 and 05..13, SUPA-05/06, todo `2026-10-02`.
- **Avoids:** Pitfalls 5, 6, 8, 13, 20.

### Phase 186: Deployed smoke entry

- **Rationale:** the pipeline's last stage is this suite. Prove it from a workstation, with a negative control, first.
- **Delivers:**
  - A second Playwright config and deployed global setup with a build-SHA and project-id identity check (extracted `assertServedProject`).
  - Hosted probes: health, served auth settings, row cap, `check-code`, relay returning 204.
  - Voter smoke from questions to results.
  - One contestant sign-in.
  - A red negative control: wrong SHA, wrong project id.
- **Avoids:** Pitfall 12.

### Phase 187: Deploy pipeline

- **Rationale:** it is built last among the infrastructure phases because its gates are the probe and the smoke entry.
- **Delivers:**
  - `deploy.yaml` with static checks, image, plan under the plan role, gated apply under the environment role, backend deploy, wait, identity preflight and smoke.
  - Concurrency with `cancel-in-progress: false`, a fork guard, and SHA-pinned actions.
  - The `deploy-evidence/**` trigger and environment branch policy.
  - Report-only artifacts (no traces or storage state).
  - A guarded destroy.
  - An observed green run and an observed red run, plus a wrong-subject trust-policy test.
  - A guard that every credentialed job names the environment.
- **Avoids:** Pitfalls 9, 11, 13.

### Phase 188: Relay on the deployed stack, and the per-caller limit decision

- **Rationale:** real capture and the final privacy checks need the deployed stack, and OBS-09 needs OBS-04.
- **Delivers:**
  - The PostHog token via the secret store.
  - An event retrievable in PostHog with no person profile, no `$ip`, GeoIP or raw user agent, and a client timestamp.
  - Switching to `none` stops events with no rebuild.
  - Events queued at `SIGTERM` are delivered.
  - A WAF decision implemented or recorded.
  - OBS-09 decided and built, or deferred with its reason.
  - A load check of relay plus voter journey.
- **Avoids:** Pitfalls 16-19, 6.

### Phase 189: Documentation and closure

- **Delivers:**
  - Deployment guide around the Terraform path, and a settings reference with verification queries.
  - Every "unverified" replaced by a dated observation.
  - Runbook: election-day scaling, rollback, teardown, rotation, SES, freeze window.
  - Analytics catalogue, privacy model and deployer checklist.
  - The fate of `render.example.yaml` and the orphan compose file.
  - A closure record for each of the seven absorbed todos.
- **Addresses:** DOCS-01..08.

### Phase Ordering Rationale

- 181 and 182 come first and in parallel. Both are cloud-free and both feed the image. 181 contains the one silent, hard-to-reverse mistake: the migration model.
- Measurement (184) comes before the AWS apply (185) and before the pipeline (187). Supabase-side unknowns don't need AWS, and measuring late means rework.
- The manual first apply (185) and the deployed smoke entry (186) both precede the pipeline, because debugging first contact through gated CI logs is the slow way.
- Phases can be merged if fewer are wanted, for example 186 into 187. Do not merge 184 into 185; the separation is the point.

### Research Flags

**Needs `/gsd-plan-phase --research-phase`:**

- **181:** migration baseline mechanics and guard rewrite; `ORIGIN` vs `paths.origin` in adapter-node 5.5.7 (LOW); `SIGTERM` delivery under the shell-form `CMD`; bucket-insert coexistence with `[storage.buckets.*]` locally (F3); resolve D8 by grep.
- **182:** event vocabulary review with the operator; the legal position needs a qualified reviewer, not more searching; `$session_id` format; PostHog GeoIP default on the HTTP path.
- **183:** exact `supabase_settings` JSON keys by scratch-project import (F1); create vs import of the project; OIDC subject for repos created after 2026-07-15; legacy vs publishable keys (F5).
- **184:** plan as measurement tasks with recorded outputs.
- **185:** SES port from Edge Functions (D7); IPv4 `db push`; ACM/DNS staging for a non-Route-53 zone.
- **188:** PostHog anonymous-event pricing and billing limit; WAF cost.

**Standard patterns (skip research-phase):**

- **186:** a second Playwright config reusing existing fixtures. The local-port assumption in `supabaseAdminClient.ts` must be parametrised.
- **187:** OIDC, plan/apply and environment gating are well documented. The repo-specific items carry the risk, not the technique.
- **189:** documentation, once 184, 185 and 188 have produced the observations.

## Confidence Assessment

Labels are carried over from the source files and not upgraded.

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Versions are REGISTRY (read 2026-10-10). Capabilities are MEDIUM. The bucket migration on hosted, the SQL bootstrap and the Postgres major version are LOW. |
| Features | MEDIUM | Repo facts OBSERVED, practice MEDIUM, the legal section LOW to MEDIUM and explicitly not legal advice. No web claim is HIGH. |
| Architecture | HIGH for repo facts, MEDIUM for external tooling | LOW items are marked in its flags table; F2 through F7 are mostly LOW. |
| Pitfalls | MEDIUM | `[REPO]` is HIGH, `[DOCS]` is MEDIUM, `[UNVERIFIED]` is LOW. The EDPB text could not be parsed in that run. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Settings mechanism:** the exact `supabase_settings` JSON keys, and whether `config push` resets omitted keys (LOW, single source). Import from a scratch project in 183, and never push to a real project untested.
- **Postgres 17, key model, hook ordering:** measure in 184 and assert in the pipeline.
- **adapter-node origin and `SIGTERM`:** verify against the installed version in 181.
- **Gateway behaviour:** anon-key-only calls, forwarded headers, Auth 429 thresholds including whether `GET /user` counts. Unobserved by definition; 184 and 185.
- **PostHog:** GeoIP defaults, `$session_id` acceptance, and anonymous-event price at peak (182, 188).
- **Legal:**
  - The pitfalls run could not parse the EDPB 2/2023 text (the features run read the PDF).
  - The CNIL 2025 revision and the Digital Omnibus status are unread.
  - Get a qualified review before stating "no consent needed" in docs, and record it as the operator's position.
- **Costs:** Fargate/ALB monthly cost (about 45-60 USD for a small task, LOW), NAT and ALB pricing, and Supabase plan. Measure on the first stack.
- **Other unknowns:**
  - Supabase regions near the chosen AWS region.
  - Free-project pause behaviour.
  - `supabase seed buckets --linked` on hosted.
  - Image-transformation usage and plan-gated features in `config.toml`.

## Questions for the operator (single list)

Questions 1-12 are needed before phases 181-182 are planned. The rest can follow during phase planning.

1. **Consent mode:** keep consent-gated as a deployment setting (recommended), or remove the consent interface outright?
2. **Answer events:** in consent-free mode, are answer values forwarded? Recommended: a fresh random id per answer event, or values stripped.
3. **Session linkage:** `memory` default with `none` available (recommended), or `none` only? Is opt-in linkage deferred?
4. **Survey link:** what replaces or keeps `{sessionId}` when the id is in-memory or absent?
5. **Contestant and Admin apps:** excluded from consent-free tracking (recommended)?
6. **Admin jobs and task count:** sticky sessions (a cookie, which complicates the storage claim), a documented single-task limit, or moving the job store to the database?
7. **`render.example.yaml` and the orphan compose file:** fix and keep as an alternative, or retire?
8. **Test project:**
   - Persistent hosted Supabase project for the pipeline: Free (pauses after about a week idle; a scheduled smoke keeps it awake) or Pro (about 25 USD/month)?
   - Does Terraform create the project, or import one the operator makes?
   - Which dedicated organisation and machine account hold the access token?
9. **Migration model:** baseline-and-append-only (recommended) with a named cutover commit, or a disposable reset-based target? This also confirms that the "nothing deployed, no back-compat" ruling ends here.
10. **Legal review:** who reviews "no consent needed"? Is an in-memory script-generated id acceptable under your reading (STACK flags the EDPB scope question)? Is the conclusion recorded as your position?
11. **Cloud inputs:** AWS account and region, domain name, whether DNS is in Route 53 (otherwise a documented two-phase apply), and Supabase region pairing.
12. **Mail:** request SES production access now? SES or another SMTP provider? Accept the sandbox for staging?
13. **PostHog:** does an EU project and token exist? Billing limit? Discrete events (recommended) vs the folded compound `pageview` if volume is a worry?
14. **WAF rate rule:** off by default as an opt-in variable (recommended), or on?
15. **Per-caller limit (OBS-09):** build it in this milestone after measuring, or measure and record a deferral?
16. **Environments:** is a production-shaped root applied in this milestone, or only a tested staging stack plus a copy-me example?
17. **Key model:** adopt Supabase publishable keys now if the new project offers them, or stay on legacy and file a dated follow-up?
18. **Bank authentication:** included in the deployed test (needs an identity-provider sandbox client with the deployed origin registered), or excluded?
19. **Throwaway Supabase project:** permission to create one for the settings import and the deliberate-failure probes?
20. **Edge Function secrets in Terraform state:** accept them in plaintext (provider design) behind a hardened bucket, or move them out of Terraform?
21. **Terraform vs OpenTofu:** does the BUSL licence matter to forkers? The HCL stays compatible either way.

## Sources

**Primary (HIGH):**

- The repository at commit `0f97645a7`: frontend, Supabase `config.toml`, `seed.sql`, schema and functions, `packages/dev-seed`, `tests/` Playwright config and preflight, `main.yaml`, `.env.example`, `render.example.yaml`, the deployment docs page, and the pending `174-` and related todos.
- GitHub Releases API and the npm registry, read 2026-10-10: all version pins.

**Secondary (MEDIUM):**

- Supabase docs: Terraform provider, Management API, CLI, Auth rate limits, SMTP, Edge limits, API keys, pausing, IPv4/IPv6.
- HashiCorp S3 backend, GitHub OIDC in AWS, AWS App Runner availability change, AWS SES SMTP and sandbox.
- PostHog capture API, anonymous events, Node SDK, data collection, sessions.
- SvelteKit adapter-node, EDPB 2/2023 v2.0 and Traficom (features run), CNIL sheet 16.

**Tertiary (LOW):**

- One third-party report on `config push` resetting omitted keys.
- PostHog cookieless documentation (search extracts only) and the self-hosting README.
- Pricing summaries, community IPv4 `db push` reports, `sendBeacon`/`keepalive` caps, and content-blocker path rules.
- Digital Omnibus commentary.

*Research completed: 2026-10-10. Ready for roadmap: yes, after operator answers 1-12.*
