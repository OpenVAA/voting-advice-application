# Phase 189 — Discussion points

**Phase:** Documentation and Closure (workstream `deployment`)
**Written:** 2026-11-20, from a read-only scout of the tree at `ee3b433d7` and of the records of phases 181 to 188
**Closes:** DOCS-01 to DOCS-08
**Depends on:** 181 to 188, all complete (188 verification `passed` on the operator's resolution, 2026-11-20)

## How to fill this

- Each decision lists its options as checkboxes. Exactly one is marked **★ RECOMMENDED**.
- **If you leave every box in a decision unticked, the ★ option is chosen.** Tick a box only to overrule it.
- Tick one other box to overrule. A `**NOTE:**` or `**EDIT:**` line beats any box.
- **⚠ DECIDE** marks the eight decisions that change the shape of the phase: **A-01, A-02, C-01, E-02, E-03, E-04, F-03, G-03**. Read those first.
- **provisional — research** marks a ★ that rests on a fact the planner must re-measure. If the measurement contradicts it, the plan takes the measurement and says so.
- CONTEXT.md is **not** written yet. It is written from this file once you hand it back.

Not asked here, because a ruling already settles it:

- Terraform 1.16 with HCL kept OpenTofu-compatible, and the docs say so (A6).
- `render.example.yaml` fixed and kept as an untested alternative, and the orphan compose file retired if nothing references it (A5, 181-12 / D-16).
- The docs describe the analytics mechanism. The consent determination is the deployer's: consent is asked by default, `trackEvents` is respected, and server pageviews are recorded in any case (B7 and its note).
- Admin job progress is a documented limit and moving the job store is a future requirement (D1). But see E-04: the tree contradicts how D1 is worded.
- Raw evidence goes in `189-*/evidence/` and each fact goes in a dated `| Date (UTC) | Observation |` row (184 D-20, 186 to 188 practice).
- Research flag: there is no research phase (ROADMAP § 189).

---

## Factual baseline (re-verified 2026-11-20)

| Claim the phase inherits | On the tree | Evidence |
|---|---|---|
| The guide describes the old path | The Supabase dashboard and CLI by hand, plus Render. Terraform is named once, in passing. It never names OpenTofu, `infra/`, SES, Route 53, ECS/CloudFront or the deploy workflow | `apps/docs/src/routes/(content)/developers-guide/deployment/+page.md:5,16,38-52,74-75` (159 lines) |
| The guide is stale in four places | l.46 says the template lacks `PUBLIC_PROJECT_ID`, but it has it (`render.example.yaml:27`). l.34 says `--no-verify-jwt` is needed, but `config.toml:435` says a deploy needs no flag. The function-secret list l.30-33 lacks `IDENTITY_CALLBACK_SERVER_SECRET`. The template list l.42-45 lacks the `ANALYTICS_*` variables, `ORIGIN`, `ADDRESS_HEADER` and `XFF_DEPTH` | as cited |
| The real procedure lives in runbooks for one environment | `infra/README.md` (376 lines), `bootstrap/README.md` (1220), `envs/staging/aws/README.md` (3793), `envs/staging/dns-mail/README.md` (450), `envs/staging/supabase/README.md` (1888). They are step-by-step, but bound to `staging.openvaa.org` and written for an operator relaying to an agent. The only fork path is a 4-step list | `infra/README.md:359-376` |
| An example environment exists | `infra/envs/example/{aws,dns-mail,supabase}`: validated and planned with mock providers, never applied, no READMEs, `task_floor=2` and `task_ceiling=4` | `infra/README.md:352-357`; `infra/envs/example/aws/terraform.tfvars:34-35` |
| The env-variable reference is short of the task environment | Hand-written. It covers 4 of the 17 variables in `task-environment.json` and lacks `ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`, the three timeouts, all six `ANALYTICS_*` and `DEPLOYMENT_DIAGNOSTICS`. Its l.62 wrongly says `identity-callback` reads `PUBLIC_PROJECT_ID` (it is `send-email`). `BOOTSTRAP_*` is documented nowhere (181 deferred-items:58). Nothing guards the page | `configuration/environmental-variables/+page.md:58-62,97`; `identity-callback/envReadSites.test.ts:69-70`; `startup/taskEnvironment.test.ts:2` |
| The settings list exists, but only in the runbook | "Settings and their guard", with five groups in `infra/modules/supabase/hosted-settings.json` plus `settings.tf` (site URL, allowlist, rate limits, SMTP) and `function-secrets.tf`; four parity classes; probe check names in `infra/scripts/probe/checks.mjs`; about 96 dated Observations rows | `infra/envs/staging/supabase/README.md:1712-1748, 1789-` |
| No analytics page | Mentions only in `configuration/static-settings:14`, `app-settings:23,108`, `publishers-guide/.../what-data-should-be-collected:3-9` and `about/features:119-123`. Nothing anywhere says "no consent is required" | grep |
| Where the event catalogue and providers live | `apps/frontend/src/lib/analytics/events.schema.ts:128` (`z.discriminatedUnion`). Providers: `PROVIDERS` in `server/analytics/config.ts:5`, a switch in `server/analytics/providers/index.ts:19-29`, one file per provider | as cited |
| "Unverified" statements about a deployed system | **Supabase:** guide l.34 and l.93. **Render:** `render.example.yaml:54`. **AWS:** 8 rows under "Not yet observed" in `bootstrap/README.md:1174` and 3 in `aws/README.md:3698`. **SES:** 5 rows in `dns-mail/README.md:425` (also l.310). The supabase README's "Not yet observed" section is empty (l.1783). About 60 other hits are unrelated: the `UNVERIFIED_ANSWERS` sentinel, "unverified user" and the probe check name | grep `-i unverified\|not yet observed\|untested` |
| Runbook material | All in `aws/README.md`: rollback Step 10 (l.1777, measured with the circuit breaker), the `ORIGIN` restore Step 11 (l.2070), floor raise (l.2235), destroy and re-apply Steps 15-17 (l.2823-3437, observed), cost (l.3439), "Election day" (l.3654). Also the pipeline's destroy workflow and recovery (`infra/README.md:239-316`) and SES Steps 7-9 (dns-mail README). **There is no secret-rotation procedure** ("rotat" has no hits). **Supabase backup and restore were never measured or decided** | as cited |
| Admin jobs and the task count | `jobStore.ts:2` is an in-memory store. Staging runs **`task_ceiling = 2`** and example a floor of 2, but D1's ★ says "staging runs one task". No text anywhere ties the job store to the task count | `infra/envs/staging/aws/terraform.tfvars:22`; `v2.17-DISCUSSION-POINTS.md:256` |
| Capacity and cost to carry | Capacity: at least 40 voter journeys a minute, a lower bound on 1 task under `trackEvents=false` (2026-11-19, build `a7003b490`, predates the WR-03 retag). Cost: 50.78 USD a month priced; 36.96 measured (44.26 with untagged IPv4) over a 2-day window read 2026-11-18. REQUIREMENTS INFRA-13 still says "Pending" and 185-VERIFICATION still says PARTIAL; both predate the measurement | `aws/README.md:3778-3779,3793`; `185-*/evidence/185-22-cost.md:14,140-149`; `REQUIREMENTS.md:274` |
| `render.example.yaml` (69 lines) | Has `PUBLIC_PROJECT_ID`, `ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH=1` (unmeasured) and the analytics variables. Lacks the timeouts, `DEPLOYMENT_DIAGNOSTICS` and `IDENTITY_CALLBACK_SERVER_SECRET`. l.61 `fromGroup: IDENTITY PROVIDER - PRODUCTION CLIENT` names a group that is never defined, and its comment says "pre-registration". Guarded by `deploymentTemplates.test.ts` and `analyticsEnvTemplates.test.ts` | as cited |
| `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL` have no consumer | Read into `apps/frontend/src/lib/utils/constants.ts:4-5`, and no non-test file reads them from there. Set in `.env.example:114-115`, the root compose l.17-18, `render.example.yaml:47,49` and five auth test mocks; documented in env page l.97 and guide l.45 | `git grep FRONTEND_URL -- apps/frontend/src` |
| `apps/frontend/docker-compose.dev.yml` | Nothing references it. It is the only user of the Dockerfile's `development` target (`Dockerfile:38`) and contradicts CLAUDE.md:206 | `git grep` |
| Root `docker-compose.dev.yml` | Production target on :3000, referenced by the guide § "Testing a production build locally" (l.141-147), CLAUDE.md:206,334, `.env.example:127` and a comment in `main.yaml:182`. Three tests read it: `deploymentTemplates.test.ts:87-106`, `analyticsEnvTemplates.test.ts:109-118` and `localSupabaseUrl.test.ts:233` | as cited |
| identity-callback closing check (operator's request) | (a) Every reply is a fixed `IDENTITY_CALLBACK_RESULT`, and caught errors are only logged (`index.ts:77-82,194-363`; `requestContract.ts:30-40,123-130`). (b) Both providers use `identityMatchProp: 'sub'` (`claimConfig.ts:41-52`), and the frontend copies agree (`providers/signicat.ts:39-44`, `idura.ts:39-40`). (c) `verify_jwt = false` (`config.toml:431-436`); the hosted behaviour is the probe's `functions.identity-callback-unverified`. (d) **There is no drift guard** between the frontend and Deno copies, only a comment (`signicat.ts:37`) | as cited |
| The seven absorbed todos | Six are pending. The caller-limit todo is already in `completed/` (closed 2026-11-19 with a "## Closed (phase 188)" section). Closure convention: `completed/` plus frontmatter `completed:` and `status: completed`, plus a dated `## Closed (phase N), <date>` section with "What was built / evidence / What remains / Moved" | `.planning/todos/completed/2026-10-07-174-no-per-caller-limit-…md:36-44` |
| The docs navigation is generated | `apps/docs/src/lib/navigation.config.ts` comes from `scripts/generate-navigation-config.ts`. `deployment` is one page (nav l.246); there is no subtree and no analytics page | as cited |

---

## A — Where the documentation lives and what it is written against

### A-01 — Home of the deployer's guide ⚠ DECIDE

The docs site's guide is stale and written for a single page. The real, measured procedure is about 7,700 lines of staging runbooks.

- [ ] ★ RECOMMENDED — **The docs site carries the guide; the runbooks stay as the measured record.** `apps/docs` gets the fork-facing guide, the reference pages and the runbook summaries. Each step links to the runbook step where it was measured, and the runbooks gain "← guide" back-links. No procedure is copied whole: the guide states the step and the command, and the runbook keeps the evidence and the paste-back detail.
- [ ] The guide goes in `infra/README.md`, and the docs page shrinks to a pointer. This is closest to the code and keeps one less site in step, but forkers reading the docs site get a dead end, and the analytics and env pages still have to live in `apps/docs`.
- [ ] Copy the procedures into `apps/docs` in full. The guide stands alone, but two copies of every step will drift; the runbooks have been revised in nearly every plan of 184 to 188.

### A-02 — Shape of the docs pages ⚠ DECIDE

- [ ] ★ RECOMMENDED — **A `developers-guide/deployment/` subtree**, regenerated in the nav:
  - `deployment/` (overview and the path from an empty AWS account and a new Supabase project);
  - `deployment/hosted-settings` (DOCS-02);
  - `deployment/operations` (the runbook, DOCS-06);
  - `deployment/render` (the untested alternative, DOCS-07).

  Variables stay on `configuration/environmental-variables` (DOCS-04). Analytics gets a new `configuration/analytics` page (DOCS-05; see D-01). Old URLs need no redirects, because `deployment/` keeps its path.
- [ ] One long `deployment` page with sections. Fewer files, but the page would run past 600 lines and the settings table would bury the procedure.
- [ ] A top-level "Deploying" section beside the Developers' Guide. Easier to find, but it breaks the docs site's single-guide structure and the generated nav order.

### A-03 — What the guide is written against

- [ ] ★ RECOMMENDED — **Against `infra/envs/example`**, with placeholders (`<your-domain>`, `<account-id>`), and staging cited as the worked, measured instance ("observed on staging, 2026-11-xx"). The example roots gain no READMEs; the guide is their README.
- [ ] Against staging only, and the forker substitutes their own values. Less writing, but every command carries `staging.openvaa.org` and `R=staging`.
- [ ] Add a README to each `infra/envs/example/*` root as well. A more complete local path, but a third copy of the step list.

---

## B — Reference pages (DOCS-02, DOCS-04)

### B-01 — The hosted-settings reference and its guard

- [ ] ★ RECOMMENDED — **A hand-written table, one row per setting** (group / setting / value / where the repository sets it: `hosted-settings.json` key, `settings.tf` or `function-secrets.tf` / parity class / how to verify: the probe check name, or the dashboard read for the few the probe does not reach). Add a unit test that every key of `hosted-settings.json`, and each `settings.tf` and function-secret name, appears on the page, as `taskEnvironment.test.ts` does for the task environment.
- [ ] The same table with no guard. Cheaper, but nothing stops it drifting from the JSON the next time a setting is added.
- [ ] Generate the page from `hosted-settings.json` at docs build time. No drift is possible, but it adds a build step to `apps/docs`, and the "how to verify" column has no source in the JSON.

### B-02 — The env-variable reference and its guard

- [ ] ★ RECOMMENDED — **Rewrite the page grouped by role**: required at start, proxy (`ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`, and how the depth is measured), timeouts, analytics, diagnostics, identity provider, `BOOTSTRAP_*`, local only. Fix l.62. Extend `taskEnvironment.test.ts`, or add a sibling test, so that every name in `task-environment.json`, `REQUIRED_ENV` and `ANALYTICS_ENV` must appear on the page.
- [ ] Rewrite with no guard. This is how the page fell 13 variables behind.

### B-03 — `PUBLIC_BROWSER_FRONTEND_URL` / `PUBLIC_SERVER_FRONTEND_URL` (todo `2026-10-02-…` item 2, ruling owed) · provisional — research

- [ ] ★ RECOMMENDED — **Remove them from every place**: `constants.ts:4-5`, `.env.example`, the root compose, `render.example.yaml`, the five test mocks, the env page and the guide. 185-RESEARCH:375 found them "not needed", and today's grep finds no non-test reader. The planner re-greps first, including `apps/docs` and `packages/`.
- [ ] Wire them where an absolute frontend URL is built (for example the auth `redirectTo`). This is new behaviour in a docs phase, and `ORIGIN` already serves that role on the server.
- [ ] Keep them, documented as unused. No code change, but two variables a deployer is told to set and nothing reads.

---

## C — "Unverified" statements (DOCS-03)

### C-01 — What counts as "a statement about a hosted project" ⚠ DECIDE

There are 19 such statements: 2 on the Supabase guide, 1 on Render, 11 in the AWS runbooks and 5 in the SES runbook.

- [ ] ★ RECOMMENDED — **Every deployed system: Supabase, AWS, SES and Render.** For each statement:
  - (1) observe it now, if a read-only check or an existing record settles it, and write a dated row; otherwise
  - (2) remove it from the docs and the runbook, and carry it into one new pending todo, "Unobserved statements about the deployed stack (189)", which lists each with its check.

  Render's l.54 becomes an instruction to measure the depth, not a claim. The empty "Not yet observed" sections are deleted, so the search finds no unverified marker and no open question is lost.
- [ ] Supabase only, which is the letter of "hosted project". The AWS and SES "Not yet observed" tables stay as they are. Less work, but the criterion-2 search still finds 16 markers in the repository.
- [ ] Every system, but keep the tables, retitled "Open as of 2026-11-xx". The statements stay in place, but a dated list of unobserved things is still an "unverified" marker; it is the spirit the criterion rules out.

### C-02 — How criterion 2's search is made

- [ ] ★ RECOMMENDED — **A recorded search with no permanent guard.** The exact `git grep -niE` pattern, run over docs, READMEs and comments, goes in the verification with every remaining hit classified as unrelated. The term has about 60 legitimate uses (`UNVERIFIED_ANSWERS`, "unverified user"), so a lint would need an allowlist larger than what it guards.
- [ ] A unit test over `apps/docs` and `infra/**/*.md` only, failing on `unverified` or `not yet observed`. It catches regressions in the docs, at the cost of a guard the runbook format must then avoid.

---

## D — Analytics documentation (DOCS-05)

### D-01 — Where the page sits and who it is for

- [ ] ★ RECOMMENDED — **One page, `developers-guide/configuration/analytics`.** Sections: the mechanism (relay, modes, consent default, server pageview, visit id), the event catalogue, adding a provider, the privacy mechanism, and the deployer's checklist. `publishers-guide/.../what-data-should-be-collected` gets a pointer to the checklist.
- [ ] Two pages: the developer page, plus the checklist as its own Publishers' Guide page. The checklist is better placed for a non-technical publisher, but the mechanism and the checklist are split across two guides.

### D-02 — The event catalogue

- [ ] ★ RECOMMENDED — **A hand-written table** (event / when sent / fields / sent before consent?), with a unit test that the table names exactly the `name` literals of `EventSchema` (`events.schema.ts:128`).
- [ ] The same table with no guard.
- [ ] Prose that points to `events.schema.ts`. No drift, but a deployer has to read Zod to do their own assessment.

### D-03 — What the checklist covers

The ★ contents, each phrased as the deployer's own determination and never as a conclusion:

- consent mode;
- `trackEvents`;
- visit-id mode;
- the server pageview recorded in any case;
- the provider's region and its data-processing terms;
- PostHog's IP-capture setting and `$geoip_disable`;
- the billing limit (staging: 20 USD);
- retention, including the 90-day log group;
- the terms-of-use paragraph on tracking (B5);
- the address that `account-access` stores as its per-caller limit key, and Cloudflare's `cf-connecting-ip` (188 E-04: "the privacy docs name it");
- the feedback limit's stored address (`107-feedback.sql`).

- [ ] ★ RECOMMENDED — All of the above.
- [ ] Only the analytics items, with the two limit keys left to the hosted-settings page. A shorter checklist, but the addresses the deployment stores are exactly what a jurisdiction check needs.

---

## E — Operations runbook (DOCS-06)

### E-01 — Form of the runbook

- [ ] ★ RECOMMENDED — **`deployment/operations` as a summary per procedure**, each stating when to use it, the commands and the expected result, and linking to the measured runbook step:
  - election-day scaling: the floor raise, the capacity lower bound and its `trackEvents=false` condition;
  - rollback: the circuit breaker, roll-forward on `deploy/staging`, and FUT-10 deferred;
  - teardown: `destroy.yml`, the hand destroy and `prevent_destroy`;
  - restore;
  - secret rotation;
  - SES: sandbox and production access;
  - the Admin job limit.
- [ ] A single `infra/RUNBOOK.md`. Next to the code, but outside the docs site that A-01 makes the deployer's entry point.

### E-02 — Supabase backup and restore ⚠ DECIDE · provisional — research

Nothing was ever measured. Staging is on Pro (C2).

- [ ] ★ RECOMMENDED — **A dated read-only observation, plus the documented procedure.** Read the staging project's backup list through the Management API (`GET /v1/projects/{ref}/database/backups`) and record what exists, PITR included, as a dated row. Then describe the restore from Supabase's documentation, read on a date and cited. No restore drill. A pending todo, "Restore drill into the throwaway project", is filed.
- [ ] A restore drill: restore a staging backup into the throwaway project and probe it. This is the only real evidence a restore works, but it is an outward, billed action that can take hours, and Pro restores go to the same project unless you use the clone feature.
- [ ] Documentation reading only, with no read of the project. Cheapest, but the runbook then claims backups exist on a project nobody looked at.

### E-03 — Secret rotation ⚠ DECIDE · provisional — research

There is no procedure today. The secrets are:

- the SSM parameters `PUBLIC_SUPABASE_ANON_KEY` and `ANALYTICS_POSTHOG_KEY`, which reach a task only on a new deployment;
- the origin header secret `random_password.origin_verify`;
- the SES SMTP access key;
- the seven Supabase function secrets plus `IDENTITY_CALLBACK_SERVER_SECRET`;
- the database password, service-role key and access token;
- seven GitHub secrets.

- [ ] ★ RECOMMENDED — **One procedure per secret, written from its mechanism with `file:line`. Rehearse one on staging**: the origin header secret (`terraform apply -replace=random_password.origin_verify`), with `/api/health` polled through the apply and the window of 403s, if any, recorded. That is the rotation most likely to break serving, and it touches only resources Terraform owns. The rest are marked by how each reaches its consumer, and the legacy anon/service keys are noted as rotatable only with the JWT secret, which signs out every user.
- [ ] Write every procedure from its mechanism and rehearse none. No outward action, but the riskiest rotation is described, not observed.
- [ ] Rehearse every rotatable secret on staging. The strongest evidence, but about ten outward actions, and the Supabase JWT rotation would sign out every staging user.

### E-04 — Admin job progress versus a ceiling of 2 ⚠ DECIDE

D1's ★ reads "staging runs one task". Staging autoscales to 2 (`terraform.tfvars:22`), and 188's load check counts on that ceiling.

- [ ] ★ RECOMMENDED — **Document the limit as the tree is.** Progress polling is unreliable whenever more than one task runs, which on staging means under load. The workaround is to run Admin jobs when one task is serving, or to pin `task_ceiling = 1` for the job's duration. The ceiling stays at 2, and D1's "staging runs one task" is recorded as superseded by 185's scaling.
- [ ] Set staging's `task_ceiling = 1` to match D1's wording. The limit can then never bite on staging, but election-day scaling cannot be shown on staging, and this needs an apply.
- [ ] Load-balancer stickiness for `/admin` paths only. Correct for admins and with no visitor cookie, but it is ALB work, not documentation (D1 rejected stickiness for every visitor).

---

## F — Render and the compose files (DOCS-07)

### F-01 — What "fixed" means for `render.example.yaml`

- [ ] ★ RECOMMENDED — **Bring it in line with the task environment**:
  - add the three timeouts, `DEPLOYMENT_DIAGNOSTICS` and the identity-provider variables commented out;
  - drop the two frontend URLs (B-03);
  - replace the dangling `fromGroup` line with a correct commented `envVarGroups` example;
  - turn `XFF_DEPTH=1` into "measure it" (C-01).

  The existing template tests are extended to cover the added names. The header and the `deployment/render` page both state "untested".
- [ ] Only the broken parts (the `fromGroup` comment and the frontend URLs). Smaller, but Render deployers would still lack the timeouts that adapter-node's drain depends on.
- [x] NEW: Remove the whole Render deployment example and mentions from guides and everything needed only for it. The instructions are no longer maintained.

### F-02 — `apps/frontend/docker-compose.dev.yml` · provisional — research

- [ ] ★ RECOMMENDED — **Delete it, and with it the Dockerfile's `development` target**, its only user (A5, 181-12). The planner re-greps first, including `.github`, `infra/` and `apps/docs`, and builds the `production` target afterwards to show the multi-stage file still works.
- [ ] Delete the compose file and keep the `development` target. A smaller diff, but a dead stage left in the image build.

### F-03 — The root `docker-compose.dev.yml` (operator's note on 181-12) ⚠ DECIDE

- [ ] ★ RECOMMENDED — **Keep it, with its three tests.** It is the one-command production-build check that the guide, CLAUDE.md and `.env.example` point to, and the tests pin its defaults against the other local URL sources. `infra/local/docker-compose.proxy.yml` serves a different purpose (the proxy topology). It loses the two frontend-URL lines (B-03).
- [ ] Retire it and its tests. The guide's "Testing a production build locally" becomes `docker build --target production` plus `docker run --env-file`. One file and three tests fewer, but a longer manual step and four doc references to rewrite.
- [ ] Retire it in favour of the proxy compose as the single local production check. One local compose to maintain, but every local production check then runs behind nginx.

---

## G — Closure (DOCS-08) and items aimed at this phase

### G-01 — Closure-record format

- [ ] ★ RECOMMENDED — **The 188 convention**: move each of the six pending todos to `.planning/todos/completed/`, add `completed: 2026-11-xx` and `status: completed`, and add `## Closed (phase 189), <date>` with "What was built", evidence paths, "What remains" and "Moved". The caller-limit todo, already closed in 188, gets one line in the phase summary pointing to its record, not a second closure.
- [ ] The `done/` "## Resolution (plan N)" format. Older and shorter, but it splits the seven records across two conventions.

### G-02 — The self-hosted PostHog log-sink todo

The comparison it asks for was never written down.

- [ ] ★ RECOMMENDED — **Write the short comparison in its closure record**, from what is already measured: container logs (90-day log group) as the durable server sink; PostHog Cloud EU for analytics, proven in 188; self-hosting not provisioned (REQUIREMENTS anti-feature, `REQUIREMENTS.md:248`); browser errors (RELAY-D4) moved to future work. No new research.
- [ ] Close it as "decided by the milestone's anti-feature", with no comparison. Faster, but the todo's own ask is left unanswered.

### G-03 — What remains of the hosted-auth todo ⚠ DECIDE

Three of its asks have no observation: the `identity-callback` secret checks, the shared per-IP sign-in budget (188 H-5(b): "a pre-launch risk") and the OTP-length label.

- [ ] ★ RECOMMENDED — **Close the todo; move the three into one new pending todo**, "Pre-launch auth checks on the production project", each with its check. The OTP label and the `identity-callback` secret checks are observed now if a read-only probe row settles them.
- [ ] Observe all three in this phase. This closes the risk, but the sign-in budget test exhausts staging's shared auth budget for every user for up to an hour.
- [ ] Keep the todo open. Fails DOCS-08 for this todo.

### G-04 — The identity-callback closing check and the drift guard

Checks (a) to (c) hold on the tree (see the baseline). (d) There is no drift guard.

- [ ] ★ RECOMMENDED — **Record (a) to (c) with `file:line` and today's date**, with (c)'s hosted half from the latest `functions.identity-callback-unverified` probe row (or one fresh read-only probe run). Record (d) as "none" and file a pending todo for a guard. A test that imports the Deno module from the frontend workspace has to resolve its `npm:` specifiers, which is not a docs-phase change.
- [ ] Build the drift guard now. It closes an item open since 155-03, but its module resolution is unscoped.

### G-05 — Other items the records aim at "phase 189"

- [ ] ★ RECOMMENDED — **Fold in the documentation-accuracy items and re-target the rest.**
  - Folded:
    - the buckets-by-hand text in the guide (181 deferred-items:24);
    - `BOOTSTRAP_*` (B-02);
    - the `seed.sql` comment and guide steps (181-08-SUMMARY:297);
    - the dangling conflict-1 reference in `.claude/skills/recommended-skills/SKILL.md` (181-18);
    - the stale redirect path `/api/auth/callback` → `/auth/confirm` in the redirect-allowlist todo;
    - REQUIREMENTS INFRA-13 → Complete, with a dated note on 185-VERIFICATION.
  - Re-targeted to "after the stream merges", with a dated note in each:
    - the dependency-audit todo `2026-11-15-…`;
    - `2026-11-17-local-supabase-ports-in-ephemeral-range`;
    - 187's `DISPATCH_OBSERVABLE=after-merge` read of the first push to `main`.
- [ ] Fold everything. The phase then carries a dependency audit and a port change that are not documentation.
- [ ] Fold nothing beyond DOCS-01 to 08. A narrower phase, but known-wrong text stays in the guide it is rewriting.

---

## H — Outward actions (each an operator checkpoint)

With every ★ as written:

1. Read-only probe run and reads against the staging Supabase project and `https://staging.openvaa.org` for the C-01, G-03 and G-04 observations.
2. Management API read of the staging backups (E-02).
3. One staging apply: `-replace=random_password.origin_verify`, with health polled (E-03).

There are no pushes to `deploy/staging` and no destroys.

**E2E:** The phase changes code (B-03, F-01, F-02, the new guards), so its plans make targeted runs of the affected projects. The final plan makes one full-suite run, judged against the last full run with the summed deltas (CLAUDE.md, ruling 2026-11-09). The production-target Docker build after F-02 is part of that plan's proof.

## Fill status

| Section | Decisions | ⚠ |
|---------|-----------|---|
| A Location and shape | 3 | 2 |
| B Reference pages | 3 | 0 |
| C Unverified statements | 2 | 1 |
| D Analytics | 3 | 0 |
| E Runbook | 4 | 3 |
| F Render and compose | 3 | 1 |
| G Closure | 5 | 1 |
| **Total** | **23** | **8** |
