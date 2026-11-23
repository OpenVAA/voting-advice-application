# Roadmap: OpenVAA

This file is the roadmap of the `deployment` workstream (branch `feat/deployment-terraform-supabase`). It holds one milestone. The roadmap at the top of `.planning/` belongs to another milestone, which runs in parallel on another branch, and this file does not repeat it. Phase numbers are shared between the two: 1 to 180 are taken there, so this milestone starts at 181.

## v2.17 Full Deployment — AWS by Terraform, Hosted Supabase & Analytics Relay

**Phases 181 to 189, planned.**

**Milestone goal:** A deployer can stand up a tested OpenVAA instance on AWS and Supabase Cloud from the repository, and every statement the project makes about a hosted deployment has been observed on one. The milestone has 86 requirements (INFRA 19, SUPA 14, PIPE 11, OBS 13, RELAY 21, DOCS 8) in 9 phases.

**Sources.** `REQUIREMENTS.md` in this directory is the source of truth. It follows the operator's 28 rulings, recorded in `v2.17-DISCUSSION-POINTS.md` under "Rulings as read, 2026-10-11". The phase structure is ruling E4: phases 181 to 189 as `research/SUMMARY.md` proposes. That file's phase sketches were written before the rulings, so where a sketch and a requirement differ, the requirement wins. The largest difference is in phase 182: the sketch removes the consent components, and RELAY-11 keeps them, with consent asked by default.

**Fixed inputs (F1).** AWS account `471112560111`, region `eu-north-1`. Staging origin `https://staging.openvaa.org`, served from a Route 53 hosted zone.

**Standing rules, inherited by every phase below.**

- An observation counts when it was made on a real hosted project or on the applied stack, and it is recorded with its date. A statement that has not been observed is not written as fact.
- A guard, a probe check or an alert counts once it has been seen failing or firing. SUPA-07, RELAY-12, INFRA-16, PIPE-01 and PIPE-09 ask for this by name, and it applies to every check this milestone adds.
- A gate's exit status is read directly, never through a pipe (SUPA-10).
- The project's cardinal rule holds: no failing E2E test, and a test that did not run counts as failed. Phases 181 and 182 change the application, so each closes on a green local suite. The deployed smoke entry leaves the local gate suite and its preflight unchanged (PIPE-07).
- Every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`).
- No phase runs `supabase config push`, sends `seed.sql` to a hosted database, lets Terraform create or destroy the Supabase project, or puts `DEV_SEED_ALLOW_REMOTE` in a workflow (`REQUIREMENTS.md`, Out of Scope).
- IAM permissions come from AWS-managed or customer-managed policies, never from an inline user policy (INFRA-17). The rule is built and guarded in phase 183 and binds phases 185, 187 and 188.

**How requirements are mapped.** Each requirement is mapped to one phase: the phase in which its last clause is first observed. When that phase ends, everything mapped to it is true as written. Many requirements are started earlier than they are proven. Most often they are built without a cloud account in phase 181 or 182 and proven on the hosted stack later. Each phase therefore has two lines. **Requirements** lists what the phase closes. **Builds toward** lists requirements the phase starts and a later phase closes. Those ids are not counted in the phase's coverage and are not marked complete when it ends. Two requirements are placed by judgement, and the notes of their phases say why: SUPA-10 in phase 181 and INFRA-17 in phase 183.

**Sequencing logic.**

- Phases 181, 182 and 183 do not depend on each other. 181 and 182 need no cloud account and no operator input, so they start first and can run in parallel. 183 can start as soon as its operator inputs are given.
- 181 holds the one mistake that is silent and hard to reverse. `db push` skips a migration version it has already recorded, so an edit to the single migration after the first push never lands. The migration model is settled before anything is pushed to the persistent project in 184.
- Measurement (184) comes before the AWS apply (185) and before the pipeline (187). The Supabase-side unknowns need no AWS, and several of them change a design. 184 is not merged into 185.
- The first apply by hand (185) and the smoke entry (186) both come before the pipeline (187). The pipeline automates only what has been seen to work, and its last stage is the smoke run.
- 188 needs the relay (182), the deployed stack (185) and the pipeline that rolls configuration out (187). The per-caller limit (OBS-09) is decided there because it waits for the header record of OBS-04.
- 189 is last. It writes down what 184, 185, 187 and 188 observed.
- The image that 185 applies by hand should already hold the relay, so 182 is expected to have landed by then. Nothing in 185 is blocked if it has not.

**Operator preconditions.** The first three rows come from the "Not yet given" paragraph and the fixed inputs of `REQUIREMENTS.md`. The rest are actions the requirements imply.

| Phase | What the operator gives or does | When |
|-------|---------------------------------|------|
| 181 | Nothing. The cutover commit is agreed with the v2.16 session, which is a matter between the two sessions (SUPA-10, C1). | Before the baseline is frozen |
| 182 | Nothing. | |
| 183 | The Supabase organisation, the region and the holder of the access token. | Before the Supabase root is applied |
| 183 | SES production access is requested. The sandbox is accepted for staging (C6), so no phase waits for the grant. | At the start of the phase |
| 183 | The persistent Pro project is created in the dedicated organisation, so that Terraform can import it (C2). | Before the Supabase root is applied |
| 183 | The delegation records for `staging.openvaa.org` are entered at the current DNS host (INFRA-18). | During the phase, once the hosted zone exists |
| 185 | One invitation mail is read and its link is followed (OBS-06, a manual observation by E2). | During the phase |
| 187 | The GitHub Environment's gate is approved for each apply (PIPE-04). | During the phase |
| 188 | A PostHog Cloud EU project, its token and a billing limit. | Before the relay is verified on the stack |

**Contact with the v2.16 stream.**

- The baseline cutover (SUPA-10, C1). The single migration is frozen at a commit agreed with the v2.16 session. From that commit on, a schema change in either stream is an appended, numbered migration. The v2.16 rule that the schema changes in place because nothing is deployed ends at that commit.
- RELAY-19 puts tracking calls and a terms-of-use paragraph into the Contestant app, which the v2.16 stream is changing. The phase 182 discussion settles how the two meet at merge.
- FUT-02, the move to publishable keys, is queued for right after both streams merge (C5). It is not in this roadmap.

**Research flags.** Carried from `research/SUMMARY.md`, with the items the rulings added after the research. Each phase's detail section names its topics.

| Phase | Flag |
|-------|------|
| 181 | Needs `/gsd-plan-phase --research-phase` |
| 182 | Needs `/gsd-plan-phase --research-phase` |
| 183 | Needs `/gsd-plan-phase --research-phase` |
| 184 | Needs `/gsd-plan-phase --research-phase`, planned as measurement tasks with recorded outputs |
| 185 | Needs `/gsd-plan-phase --research-phase` |
| 186 | Standard pattern, no research phase |
| 187 | Standard pattern, no research phase |
| 188 | Needs `/gsd-plan-phase --research-phase` |
| 189 | Standard pattern, no research phase |

**UI hint.** No phase carries it. Phases 183 to 189 have no visible surface of their own, and phase 181 adds none. Phase 182 changes text on surfaces that already exist (the consent prompt, the privacy text, the terms of use) and hides the prompt in consent-free mode. It adds no screen and reshapes none. If the phase 182 discussion decides to redesign the consent prompt, the hint is added then.

## Phases

- [x] **Phase 181: Deployability and Migration Model** - Without any cloud account, the server reports its health and build, refuses to start half-configured, works behind a proxy, and the migration is frozen as a baseline with append-only changes (SUPA-10) (completed 2026-10-21)
- [x] **Phase 182: Analytics Relay** - Events go through a same-origin relay to a provider chosen by configuration, with no analytics identifier on the device, consent asked by default, and Umami removed (RELAY-01, RELAY-02, RELAY-03, RELAY-05, RELAY-06, RELAY-07, RELAY-08, RELAY-10 to RELAY-21)
- [x] **Phase 183: Terraform Foundation and Supabase as Code** - Remote state, access roles, a budget alarm, the staging zone and the mail identity exist in AWS, and the hosted Supabase project is imported into a root of its own with a settings parity guard (INFRA-15, INFRA-17, INFRA-18, SUPA-11) (completed 2026-10-26)
- [x] **Phase 184: Hosted Supabase Measurement and Conformance Probe** - The schema, functions and bootstrap rows are on the hosted project, what it serves is measured and dated, and a probe fails by name when it drifts (SUPA-01 to SUPA-07, SUPA-13, SUPA-14, OBS-01, OBS-02, OBS-03, OBS-05, OBS-07) (completed 2026-11-12)
- [x] **Phase 185: AWS Frontend Stack, First Apply by Hand** - The frontend runs at `https://staging.openvaa.org` from a stack applied by hand, with a failed rollout, a teardown and the frontend-side observations each seen once (INFRA-01 to INFRA-14, SUPA-12, OBS-04, OBS-06, OBS-08, OBS-10) (completed 2026-11-14)
- [x] **Phase 186: Deployed Smoke Entry** - A read-mostly smoke run proves from a workstation that the deployed URL serves the intended build on the dedicated project, and refuses anything else (SUPA-09) (completed 2026-11-15)
- [x] **Phase 187: Deploy Pipeline** - GitHub Actions deploys staging without stored keys, behind a gate and in a fixed order, and the run goes red when the build, the rollout or the smoke run fails (PIPE-01 to PIPE-10, INFRA-16, INFRA-19, SUPA-08) (completed 2026-11-18)
- [x] **Phase 188: Relay on the Deployed Stack, and the Per-Caller Limit** - Events from staging arrive in PostHog EU as anonymous events, the stack's capacity is measured, and the per-caller limit is built or deferred on the evidence (RELAY-04, RELAY-09, OBS-09, OBS-11) (completed 2026-11-20)
- [x] **Phase 189: Documentation and Closure** - The documentation follows the Terraform path, every statement about a hosted project is a dated observation, and the absorbed todos are closed on the record (DOCS-01 to DOCS-08) (completed 2026-11-21)
- [x] **Phase 189.1: Address tech debt: invitation-limit guard and trackEvents smoke** (completed 2026-11-22)

## Phase Details

### Phase 181: Deployability and Migration Model

**Goal**: The application and the schema are ready to be deployed before any cloud account is touched: the server reports its health and its build, refuses to start half-configured, behaves correctly behind a proxy, and the migration model survives a first push.
**Depends on**: Nothing (first phase; needs no cloud account)
**Parallel**: Can run in parallel with Phase 182, and with Phase 183 once that phase's operator inputs are given.
**Requirements**: SUPA-10
**Builds toward**: INFRA-04 (the health endpoint), INFRA-05 (the start-up check, and `PUBLIC_PROJECT_ID` in the templates), INFRA-06 (the proxy configuration, shown behind a local reverse proxy), INFRA-09 (`SIGTERM` reaching the Node process), SUPA-04 (the bucket insert in the migration), SUPA-05 (the JWT setting of `identity-callback` in `config.toml`), SUPA-06 (the bootstrap script and the seed check, run locally), PIPE-07 (the build SHA the smoke run reads). Phases 184, 185 and 187 close them.
**Operator preconditions**: None. One agreement between the two sessions is needed before the baseline is frozen: the cutover commit (SUPA-10, C1).
**Success Criteria** (what must be TRUE):
  1. With Supabase unreachable, the health endpoint of the production build answers 200, and the served build names the commit it was built from.
  2. A production start with a required variable unset exits with an error that names the variable, and the environment templates list `PUBLIC_PROJECT_ID` and the proxy variables.
  3. Behind a local reverse proxy that stands in for the load balancer, a form post succeeds, a redirect is built on the public origin, a request with a spoofed `X-Forwarded-For` is not attributed to the spoofed address, and a `SIGTERM` sent to the container reaches the Node process, which finishes the request in flight before it exits.
  4. The single migration is frozen as a named baseline at the cutover commit agreed with the v2.16 session. `yarn lint:check` fails when the baseline is edited and passes when a numbered migration is appended, and each outcome is seen once. After a push to a local database, the drift check exits non-zero on a schema drifted on purpose and zero on a clean one, with the exit status read directly (SUPA-10).
  5. A database built from the migrations alone, with no seed, holds both storage buckets (`public-assets` and `private-assets`). Running the bootstrap script twice leaves one account, one project, the `storage_config` row and `behind_cloudflare`, and the script holds no secret. A check fails when a seed user or a local URL is present, seen once. `config.toml` declares the JWT setting of `identity-callback`.

**Research flag**: Needs `/gsd-plan-phase --research-phase`. Topics from `research/SUMMARY.md`: the baseline mechanics and the rewrite of `assert-schema-migration-parity`; `ORIGIN` against `paths.origin` in adapter-node 5.5.7 (low confidence); `SIGTERM` delivery under the shell-form `CMD` of the production image; whether the bucket insert can sit beside the `[storage.buckets.*]` entries of `config.toml` locally (F3). D8 is closed: the service-role key stays off the frontend task (orchestrator grep, 2026-10-10).
**Plans**: 19/19 plans complete in 11 waves. Waves 1 to 7 run now without the operator. Wave 8 is an E2E gate in a window the operator confirms. Wave 9 is the freeze, which waits for v2.16's phase 177.1, the merge of the two branches' schema, and plan 182-02; waves 10 and 11 follow it.

Plans:
**Wave 1**
- [x] 181-01-PLAN.md — wave 1 — Make this worktree runnable and record where it stands before the phase changes anything.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 181-02-PLAN.md — wave 2 — Build the isolated-instance harness and prove it with a recorded spike, before any plan depends on it.
- [x] 181-03-PLAN.md — wave 2 — Add the start-up variable check (D-13) and the diagnostics response (D-14), each as a pure, unit-tested piece with thin wiring.
- [x] 181-04-PLAN.md — wave 2 — Add the health route and the build id (D-12), and give the production image an exec-form `CMD` (D-15).
- [x] 181-05-PLAN.md — wave 2 — Add the variables to the three environment templates (D-16) and declare the JWT setting of `identity-callback` (A-10), behind a spec that is seen failing first.
- [x] 181-06-PLAN.md — wave 2 — Write the frozen-mode checker, its fixtures and its red controls now, without freezing anything.
- [x] 181-07-PLAN.md — wave 2 — Take the files that will be frozen out of the two gates that could redden them later, and re-point the two tests that read the baseline as the current schema.

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 181-08-PLAN.md — wave 3 — Put the two storage buckets into the migration (D-07), correct the comments the freeze would make permanent (D-08), regenerate the baseline in place, and observe the result on an isolated database.
- [x] 181-09-PLAN.md — wave 3 — Observe the built production server, outside Docker: the start-up check, the health route with Supabase unreachable, the build id, and the diagnostics switch.

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 181-10-PLAN.md — wave 4 — Build the check that will replace byte parity: an equivalence check between a database built from `schema/` and one built from the migrations (D-03, A-04), and see it fail on each kind of difference it must catch.
- [x] 181-13-PLAN.md — wave 4 — Stand the production image behind a local reverse proxy and check, by script and with negative controls, that it behaves as criterion 3 requires (D-14, D-15, A-11).

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 181-11-PLAN.md — wave 5 — Write the bootstrap script and the seed check (D-09, D-10, D-11), and show each locally with its red controls.
- [x] 181-14-PLAN.md — wave 5 — Observe `SIGTERM` reaching the Node process and the request in flight finishing (D-15), measure whether the process then exits by itself (A-13, RESEARCH Pitfall 9), and act on the measurement.

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 181-12-PLAN.md — wave 6 — Build the drift check (D-11, A-05) and show it locally: green after a push to a local database, red on planted DDL, red on a history mismatch.

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 181-15-PLAN.md — wave 7 — Give the on-demand checks their script keys, assert the wiring by a spec, and run every local gate on the tree as it stands before the freeze.

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 181-16-PLAN.md — wave 8, needs the operator — Run the full local E2E suite on the tree as this phase has changed it, in a window the operator confirms.

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 181-17-PLAN.md — wave 9, needs the operator — Freeze the baseline: one commit that adds the manifest of the real baseline and switches the guard to frozen mode (D-01, D-02, D-04, A-02).

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 181-18-PLAN.md — wave 10 — See the frozen model work on the real baseline (criterion 4), and correct the text the freeze made false.

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 181-19-PLAN.md — wave 11, needs the operator — Close the phase on a green local E2E suite, run on the tree as it stands after the freeze.

**Cross-cutting constraints:**
- The shared stack was stopped and reset only after the operator confirmed it was free
- The suite ran on a named commit with no uncommitted tracked change before, at or after the run; on a tree with another phase's uncommitted changes the task stops at a checkpoint instead of running
- The evidence record is never an uncommitted tracked change when a tree sample is taken: lines are kept in the current attempt's file, which git ignores, and the tracked record is copied from it after the task's last sample
- The local gates describe the commit the suite ran on: the two recorded shas differ in no path outside .planning/, decided by git after the operator's wait and not by a line the executor writes
- Every line a check reads comes from the current attempt: the record is a copy of the attempt file a pointer names, and the operator's confirmation carries that attempt's id and the commit it was given for, is used once, and is void when either no longer matches

Notes:

- SUPA-10 is mapped here by judgement. Every clause of it can be shown against a local database, drift check included, and the hazard it closes has to be closed before the first hosted push. The drift check's first run against the hosted project is criterion 1 of phase 184.
- The freeze waits for the cutover commit. The other four criteria do not, so the phase can start before the two sessions agree. Every schema change that must be in the baseline, the bucket insert among them, lands before the freeze.
- Phase 181 and phase 182 both add environment variables to the same templates. Whichever lands second merges them.
- By ruling 182-12, phase 182 changes the schema so that a signed-out reader of a project not open for voters gets the `analytics` member. That change goes into the baseline, so the freeze also waits for it.

### Phase 181.1: Declarative schema on pg-delta, agent-ready local stack and Supabase config as code (INSERTED)

**Goal:** Decide, before the baseline freeze (181-17), whether the schema workflow moves to Supabase's Declarative Schemas 2.0 on the pg-delta engine (`[experimental.pgdelta] enabled = true`, `declarative_schema_path`, `supabase db schema declarative sync`), whether local development uses the agent-ready stack (`[experimental] stack = true`, one instance per worktree without Docker), and whether hosted Supabase settings follow config as code (`supabase config pull` / `supabase pull`); then amend 181-17 and phase 183 to match the decisions. Also vendor Supabase's agent skills into the project skills (`.claude/skills/`): `supabase` and `supabase-postgres-best-practices` from https://github.com/supabase/agent-skills (latest release v0.1.9; upstream installs with `npx skills add supabase/agent-skills` or as a Claude Code plugin), pinned to a commit and read in full before they are committed, and reconciled with the project's own `database` skill and `BOUNDARIES.md` where they disagree with this repo's schema rules. Source: https://supabase.com/blog/select-2026-build-anything (Supabase Select 2026).
**Ruling (2026-10-18):** the Goal's request to vendor Supabase's agent skills into .claude/skills/ was superseded by 181.1 D-09: the skills are installed per user and are not committed, and the repository gets the recommended-skills pointer skill (181.1-CONTEXT.md).
**Open questions for discuss-phase:** DML in `schema/` is an error under pg-delta (`400-storage.sql` bucket insert from SUPA-04, `107-feedback.sql`, `506-invitation-rpcs.sql`); the CLI's timestamped migration names against the freeze's five-digit versions, manifest and parity guard; which of the 181-10 equivalence, 181-12 drift and parity checks pg-delta replaces; D-15 of phase 183 (Terraform `supabase_settings` is the sole writer of hosted auth settings, `supabase config push` is used nowhere) against config as code, or `config pull` as a read-only drift check; whether E2E evidence from the alpha non-Docker stack counts; the CLI bump from 2.118.0 (2.121.0 current); for the vendored skills, copy them into the repo or install the plugin per user, how they are kept up to date, and whether their advice gives way to the project's `database` skill where the two conflict.
**Requirements**: TBD
**Depends on:** Plan 181-16 (the pre-freeze tree). Plan 181-17 (the freeze) and phase 183 wait for this phase's decisions.
**Plans:** 4/4 plans complete in 2 waves. Plans 01 to 03 change text only and need no operator. Plan 04 installs the Supabase skills for the operator's user and waits for the operator's confirmation; it commits nothing.

Plans:
**Wave 1**
- [x] 181.1-01-PLAN.md — wave 1 — Write the decisions into 181-17 (an @-reference and the corrected, id-free guard-header sentence for its Task 3), 183 D-15 (a dated note), STATE.md (the 181.1 blocker removed) and this entry; text only.
- [x] 181.1-02-PLAN.md — wave 1 — Add the `recommended-skills` project skill (the pinned Supabase entry, its install procedure, the conflicts where `database` wins, manual updates) and register it in CLAUDE.md, the skills README and BOUNDARIES in one commit.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 181.1-03-PLAN.md — wave 2 — File the pg-delta todo and the native-stack and CLI-bump spike todo, list both in STATE.md, and close the stale fold-migrations todo.
- [x] 181.1-04-PLAN.md — wave 2 — Install the two Supabase skills for the operator's user at the pinned commit, after a rehearsal against a scratch target and the operator's confirmation.

### Phase 182: Analytics Relay

**Goal**: Visitor events travel through a same-origin relay to a provider chosen by configuration, with nothing analytics-related stored on the device except the consent choice, consent asked by default, and the Umami browser integration gone.
**Depends on**: Nothing (needs no cloud account)
**Parallel**: Can run in parallel with Phase 181.
**Requirements**: RELAY-01, RELAY-02, RELAY-03, RELAY-05, RELAY-06, RELAY-07, RELAY-08, RELAY-10, RELAY-11, RELAY-12, RELAY-13, RELAY-14, RELAY-15, RELAY-16, RELAY-17, RELAY-18, RELAY-19, RELAY-20, RELAY-21
**Builds toward**: RELAY-04 (the PostHog provider and its unit tests; real capture is seen in phase 188), RELAY-09 (the same-origin check, the body cap, the bounded queue and the fixed destination; the WAF variable is added in phase 188), DOCS-05 (the event vocabulary that the catalogue documents).
**Operator preconditions**: None. The PostHog project is not needed here: the provider is tested against a stand-in.
**Success Criteria** (what must be TRUE):
  1. During a journey through the voter, Contestant and Admin apps with `trackEvents` on, the browser sends analytics requests only to the app's own origin and loads no third-party script. The relay endpoint answers at once, the interface never waits for it, and a send made while the page unloads still arrives. The Umami browser integration is gone.
  2. After a full journey no analytics identifier is in any device store, and the stored consent choice is the only analytics-related state on the device. No hash of address and user agent is computed in the browser or on the server, and the request the relay sends onward carries neither the visitor's address nor the user agent. In `memory` mode the visit id is held in memory and is gone on reload, and the survey link's `{sessionId}` is filled from it. In `none` mode each event has a random id and `{sessionId}` is empty.
  3. In the default mode, before the visitor consents, the only event sent is the server-recorded pageview. It carries no identifier and is sent for every page view whenever a provider is configured. After consent the other events are sent. In consent-free mode, which is set by deployment configuration, events are sent without a prompt and each event that carries an answer value has a fresh random id. With `trackEvents` off only the server pageview is sent, and with provider `none` nothing is sent. A request that carries `Sec-GPC` is dropped at the relay, and nothing is stored to record the objection.
  4. The relay accepts only the closed vocabulary of discrete events, bounds their size, drops query strings from URLs and refuses anything else. The provider, its key and its host are server-side configuration with `none` as the default, and changing the provider needs no rebuild. The `log` provider writes each event as a structured line to the container's output. Every event maps to an OpenTelemetry log record and to the application's current logging format, with one tested mapping for each.
  5. The tests that prove the privacy properties are each seen failing once: no analytics identifier in any device store after a journey, no request to a third-party origin, nothing but the server pageview before consent in the default mode, and events without a prompt in consent-free mode. The privacy text describes the model, and the terms of use say that the three apps are tracked the same way, in all seven locales. The local E2E suite is green on the changed tree.

**Research flag**: Needs `/gsd-plan-phase --research-phase`. Topics from `research/SUMMARY.md`: the event vocabulary, reviewed with the operator; the legal position, which needs a qualified reviewer and not more searching; the `$session_id` format; PostHog's GeoIP default on the HTTP path. Added by rulings after the research, and so not researched: the server pageview sent without consent (RELAY-15), the OpenTelemetry mapping (RELAY-20), tracking in the Contestant and Admin apps (RELAY-19).
**Plans**: 31/31 plans executed in 31 waves. The phase is serial, one plan per wave, because three phases' executors share one checkout. It has seven operator stops: the one-way decision of plan 182-02, the acknowledgement of the cutover span in 182-15, and five windows on the shared local stack (182-11, 182-23, 182-24, 182-31, 182-28), each of which stops the stack and resets its database from this worktree. From the first commit of 182-15 to the closing gates of 182-26 the frontend does not typecheck, and no frontend gate of phases 181 or 183 is valid.

Plans:
**Wave 1**
- [x] 182-01-PLAN.md — wave 1 — Make the worktree runnable and prove one isolated local database instance, so that every later plan can run code, and the database change of plan 182-02 can be tested without touching the local stack that another session is using.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 182-02-PLAN.md — wave 2, needs the operator — Give a signed-out reader of a project that is not open for voters the `analytics.trackEvents` setting, so that tracking on the Contestant app's public pages follows the stored setting (D-13, amendment A-02).

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 182-03-PLAN.md — wave 3 — Create the shared, pure foundation of the analytics model: the constants and modes, the canonical event type, the UUIDv7 helper, the app-of-route function and the per-route parameter allowlist with its tree-walk test.

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 182-12-PLAN.md — wave 4 — Add the privacy and terms-of-use strings of the new model to the seven message catalogues, and correct the one sentence the new model makes false.

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 182-04-PLAN.md — wave 5 — Write the closed event vocabulary and the wire envelope as zod schemas, with a valid sample and rejected twins for every event.

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 182-05-PLAN.md — wave 6 — Resolve the analytics configuration from private environment with a pure function, and hand the three apps a three-member projection of it through the two root loads.

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 182-10-PLAN.md — wave 7 — Build the E2E groundwork for the privacy tests: request capture on the relay path, the device-store allowlist, the origin assertion, the journey spec, and a way to run them as one short single-project run.

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 182-30-PLAN.md — wave 8 — Give the phase one command that decides, by its exit status, whether a Playwright run is the evidence a plan claims it is.

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 182-06-PLAN.md — wave 9 — Put the analytics variables into the three environment templates, and report a bad analytics configuration at server start.

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 182-07-PLAN.md — wave 10 — Write the two mappers and the three providers behind one interface, each tested against stand-ins.

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 182-13-PLAN.md — wave 11 — Write the browser side of the tracking path as five small pure modules with tests: the in-memory visit id, the transport, the gates, the one-pageview-per-view tracker and the batch builder.

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 182-14-PLAN.md — wave 12 — Change the payloads at the call sites that send free text or a template name, on the tracking types as they are today.

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 182-25-PLAN.md — wave 13 — Type the tracking calls by the closed vocabulary, so the compiler enforces it where events are produced.

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 182-08-PLAN.md — wave 14 — Write the relay as a pure function over the request and the configuration, and the bounded queue behind it, with every unit-level privacy test and its control case.

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 182-09-PLAN.md — wave 15 — Expose the relay at `/api/usage`, guard the analytics source against address, user-agent and hash code, and observe the endpoint on the production build.

**Wave 16** *(blocked on Wave 15 completion)*
- [x] 182-11-PLAN.md — wave 16, needs the operator — See the two E2E privacy assertions fail on the tree before the cutover, and record the whole suite green on that same tree with its set of skipped tests.

**Wave 17** *(blocked on Wave 16 completion)*
- [x] 182-15-PLAN.md — wave 17, needs the operator — ORCHESTRATOR NOTICE.

**Wave 18** *(blocked on Wave 17 completion)*
- [x] 182-26-PLAN.md — wave 18 — ORCHESTRATOR NOTICE.

**Wave 19** *(blocked on Wave 18 completion)*
- [x] 182-16-PLAN.md — wave 19 — Delete the Umami browser integration's component and test stub, and rewrite the tracking spec on request capture at the relay path.

**Wave 20** *(blocked on Wave 19 completion)*
- [x] 182-17-PLAN.md — wave 20 — Move the voter app's consent prompt, privacy page and consent components from the provider setting to the projection and the provider-neutral strings, then delete the provider-keyed strings.

**Wave 21** *(blocked on Wave 20 completion)*
- [x] 182-23-PLAN.md — wave 21, needs the operator — Run the short stand-alone analytics project on the tree after the cutover and record it green, next to the red run of plan 182-11; and measure which form of the keepalive test proves arrival.

**Wave 22** *(blocked on Wave 21 completion)*
- [x] 182-18-PLAN.md — wave 22 — Add the opt-out checkbox to the Contestant app's terms-of-use view, write the contestant's choice to the shared consent store at acceptance, render the terms paragraph, and let the contestant change the choice on the privacy page.

**Wave 23** *(blocked on Wave 22 completion)*
- [x] 182-19-PLAN.md — wave 23 — Remove `analytics.platform` from the settings, move `analytics.trackEvents` from the static to the dynamic settings, and reduce the stored-settings schema, its tests and the one seed template that wrote the platform.

**Wave 24** *(blocked on Wave 23 completion)*
- [x] 182-20-PLAN.md — wave 24 — Complete the default-mode E2E coverage: bring the privacy journey into the gate suite, and add the specs for the three-app pageviews, the send at page leave, the non-blocking relay, Global Privacy Control and `trackEvents` off.

**Wave 25** *(blocked on Wave 24 completion)*
- [x] 182-21-PLAN.md — wave 25 — Write the E2E spec for consent-free mode and its opt-in project.

**Wave 26** *(blocked on Wave 25 completion)*
- [x] 182-27-PLAN.md — wave 26 — Write the E2E spec of the Contestant app's terms-of-use view with the opt-out checkbox, and wire it into the default and the stand-alone run.

**Wave 27** *(blocked on Wave 26 completion)*
- [x] 182-22-PLAN.md — wave 27 — Correct the five documentation sentences this phase made false, sweep the repository for the removed integration, and run the static gates on the final tree.

**Wave 28** *(blocked on Wave 27 completion)*
- [x] 182-24-PLAN.md — wave 28, needs the operator — Run the new specs alone, in both consent modes, and record each green for its own reason.

**Wave 29** *(blocked on Wave 28 completion)*
- [x] 182-31-PLAN.md — wave 29, needs the operator — Record the two red controls that depend on the consent mode: each mode's property seen failing when the server runs in the other mode.

**Wave 30** *(blocked on Wave 29 completion)*
- [x] 182-28-PLAN.md — wave 30, needs the operator — Close the phase's E2E evidence on a green local suite: run the full suite in default mode and the consent-free project once more, both on the final tree, and decide green by the verdict script.

**Wave 31** *(blocked on Wave 30 completion)*
- [x] 182-29-PLAN.md — wave 31 — Write the closing record of the phase from the evidence the earlier plans left: the red-and-green table for RELAY-12, and the list of what was not checked by a machine and not yet seen by a person.

**Cross-cutting constraints:**
- The operator's answer authorised exactly one entry into the run task: it follows its question, carries the attempt id and the commit of that question, and was marked as used before any stack command
- Both runs used a database the wrapper reset from this worktree, and each record holds the schema probe that shows the closed-project function answers the analytics member

Notes:

- This is the largest phase, with 19 requirements. The research advises that its first plan is the data model and the event vocabulary, not the endpoint.
- `research/SUMMARY.md` sketches this phase with the consent components removed. Ruling B1 was overruled by the B7 note, so they stay: consent-gated is the default and consent-free is opt-in (RELAY-11).
- Both readings were settled in the phase discussion of 2026-10-11 (`v2.17-181-183-DISCUSSION-POINTS.md`, "Rulings as read"). Reading 1 was overruled: the server pageview is recorded whenever a provider is configured, whatever `trackEvents` says, and criterion 3 and RELAY-10 and RELAY-15 were reworded. Reading 2 stands: a visitor who has consented in the default mode has answer events that carry the visit id.
- Ruling 182-12 puts one schema change of this phase into the baseline, so it must land before the freeze of phase 181. In the Contestant app, acceptance of the terms of use counts as consent, with a second checkbox to opt out.
- FUT-03 (differential privacy or order masking for answer events) and FUT-04 (an event allowlist and denylist) are filed as todos and are not built here.

### Phase 183: Terraform Foundation and Supabase as Code

**Goal**: The Terraform layout, its remote state and its access roles exist in the AWS account, the hosted Supabase project is under Terraform's management in a root of its own, and the staging domain and the mail identity are ready for the phases that need them.
**Depends on**: Nothing in the repository (see the operator preconditions)
**Parallel**: Does not depend on Phase 181 or Phase 182, so it can start as soon as its operator inputs are given.
**Requirements**: INFRA-15, INFRA-17, INFRA-18, SUPA-11
**Builds toward**: INFRA-01 (the image registry with immutable tags), INFRA-10 (remote, locked state), INFRA-13 (the cost tags set as provider defaults), PIPE-01 (the OIDC provider, the plan role and the deploy role), SUPA-02 and SUPA-03 (the hosted settings written in HCL and applied), SUPA-08 (the hardened state bucket and the Terraform ignore entries), SUPA-12 (the import, `prevent_destroy` and the separate state file), SUPA-14 (the SES domain identity and its DKIM, SPF and DMARC records). Phases 184, 185 and 187 close them.
**Operator preconditions**: The Supabase organisation, the region and the holder of the access token, and the persistent Pro project created in that organisation, all before the Supabase root is applied. SES production access requested at the start of the phase. The delegation records for `staging.openvaa.org` entered at the current DNS host once the hosted zone exists.
**Success Criteria** (what must be TRUE):
  1. A bootstrap root is applied by hand in account `471112560111`, region `eu-north-1`. Its state is in a bucket that is read back as encrypted, versioned and closed to the public, and the state is locked during an apply. The OIDC provider, a read-only plan role, a deploy role and an image registry with immutable tags exist, and a second plan shows no change. Git ignores Terraform state, plan and local variable files from the phase's first commit.
  2. Every permission the roots grant comes from an AWS-managed or a customer-managed policy. A check in the repository fails on an inline user policy, seen once, and the account holds no IAM user with an inline policy, the identity the operator applies with included (INFRA-17).
  3. A budget on the account names a threshold and notifies the operator's address, and the operator confirms that the notification reaches them (INFRA-15).
  4. `staging.openvaa.org` is answered by a Route 53 hosted zone, and the records the operator changed at the current DNS host are written down (INFRA-18). The SES domain identity is verified, with its DKIM, SPF and DMARC records published in the zone.
  5. The project the operator created is imported into a Supabase root that has its own state file and `prevent_destroy`, and a destroy of that root is refused. The root applies the hosted API and auth settings and a second plan is empty. `supabase config push` is used nowhere. `yarn lint:check` fails when a security-relevant key of `config.toml` and the HCL disagree, seen once (SUPA-11). A job in `main.yaml` that needs no credentials formats and validates the Terraform, and is seen passing in a run.

**Research flag**: Needs `/gsd-plan-phase --research-phase`. Topics from `research/SUMMARY.md`: the exact `supabase_settings` JSON keys, found by importing from a scratch project (F1); the OIDC subject for repositories created after 2026-07-15; legacy against publishable keys (F5), which C5 rules as measure and stay on legacy if they work. Create against import is closed by C2: the operator creates the project and Terraform imports it. Added by rulings after the research: a delegated subzone or the whole zone for `staging.openvaa.org` (reading 4, settled here), and the layout of the IAM policies (F1 note).
**Plans**: 28/28 plans complete in 15 waves. Waves 1 to 5 run now without the operator and touch no cloud. The first operator checkpoint that can block is plan 183-14: it needs the applying identity (follow-up 183-R1) and Terraform 1.16.5. Plans 21 to 25 (the Supabase chain) depend only on their own predecessors and on plan 16, and may be executed by plan without waiting for plans 18, 19 and 20 of the same wave.

Plans:
**Wave 1**
- [x] 183-01-PLAN.md — wave 1 — Install the toolchain, record the state of the three repository gates before this phase changes anything, write the Terraform ignore entries by hand, and create the first Terraform root with the AWS provider lock that every…

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 183-02-PLAN.md — wave 2 — Write the three bootstrap modules that hold no IAM: the Terraform state bucket, the image registry and the budget.
- [x] 183-03-PLAN.md — wave 2 — Write the module that holds the GitHub OIDC provider, the read-only plan role, the deploy role and their customer-managed policies.
- [x] 183-04-PLAN.md — wave 2 — Write the hosted zone module, the mail module and the long-lived `staging/dns-mail` root that joins them.
- [x] 183-05-PLAN.md — wave 2 — Write the Supabase module (the imported project, its hosted API and auth settings, and the JSON file that holds every compared value), a script that proves the encoded settings keep their types, and the scratch root that will…

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 183-06-PLAN.md — wave 3 — Write the bootstrap root: the one hand-applied, account-level root that calls the state bucket, registry, budget and OIDC modules.
- [x] 183-07-PLAN.md — wave 3 — Write the persistent project's root and its `example` twin.
- [x] 183-08-PLAN.md — wave 3 — Write the two AWS roots of the `example` environment, so that the wiring exists twice and CI can validate both copies.
- [x] 183-09-PLAN.md — wave 3 — Build the guard that fails `yarn lint:check` when Terraform under `infra/` attaches an inline IAM policy, wire it, cover it with a spec, and record it failing.

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 183-10-PLAN.md — wave 4 — Build the comparing core of the guard that fails `yarn lint:check` when a security-relevant key of the local `config.toml` and the hosted settings in the HCL disagree, wire it, and cover it with a spec.
- [x] 183-11-PLAN.md — wave 4 — Add the credential-free `infra-validate` job to `main.yaml` and a spec that keeps its shape.
- [x] 183-12-PLAN.md — wave 4 — Write the operator's tooling for the account-level work: the read-only account inventory script, the overview of every root, and the runbook of the bootstrap root.
- [x] 183-28-PLAN.md — wave 4 — Write the runbooks of the zone and mail root and of the Supabase roots, and the file that will hold the delegation record.

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 183-26-PLAN.md — wave 5 — Add the structural assertions to the settings parity guard, and record the guard failing once for each kind of finding.

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 183-13-PLAN.md — wave 6, needs the operator — See both new guards fail through `yarn lint:check` itself, each as its own recorded step, without a planted file ever existing in the checkout that three phases share; then see the three repository gates on the finished tree.

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 183-14-PLAN.md — wave 7, needs the operator — Have the operator name the applying identity, install Terraform 1.16.5 and run the read-only account inventory; settle any inline user policy it finds; and adapt the code to what the account already holds.
- [x] 183-15-PLAN.md — wave 7, needs the operator — Have the `infra-validate` job seen passing in a real run, and seen failing in a second run of a tree broken on purpose.

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 183-16-PLAN.md — wave 8, needs the operator — The operator applies the bootstrap root, migrates its state into the bucket it created, and reads back what criterion 1 and criterion 2 state.

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 183-17-PLAN.md — wave 9, needs the operator — The operator applies the zone and mail root and re-runs the account asserts now that the SMTP user exists.

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 183-18-PLAN.md — wave 10, needs the operator — The operator enters the delegation for `staging.openvaa.org` at Cloudflare; the executor verifies it from outside and writes down what was changed.
- [x] 183-19-PLAN.md — wave 10, needs the operator — Wait, as a checkpoint, for the mail identity to verify; have the operator file the production-access request and verify their own mailbox for the sandbox; record the published mail records.
- [x] 183-20-PLAN.md — wave 10, needs the operator — See the budget alert fire once at a test amount, confirmed by the operator from their mailbox, then raise the budget to its standing 100 USD.
- [x] 183-21-PLAN.md — wave 10, needs the operator — The operator creates the throwaway Supabase project and imports it and its settings into the scratch root.

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 183-22-PLAN.md — wave 11, needs the operator — Have the operator make and save the first plan after the throwaway project's import, and read it against the stop rules before any apply is asked for.

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 183-24-PLAN.md — wave 12, needs the operator — Have the operator apply the plan that plan 183-22 read and approved, then rehearse on the throwaway project the rest of what the persistent project will get: the second plan, the read-back and the refused destroy.

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 183-23-PLAN.md — wave 13, needs the operator — The operator creates the persistent Pro project in a region they confirm first, imports it into its own root and makes the first plan.

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 183-25-PLAN.md — wave 14, needs the operator — Have the operator apply, on the persistent project, the one plan that plan 183-23 read and approved; then see a second plan empty, a destroy refused, and the served settings equal to the declared ones.

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 183-27-PLAN.md — wave 15 — Run the lint and format chains once more, on the final tree, after everything that the operator's work changed.

Notes:

- INFRA-17 is mapped here by judgement. The first IAM is written in this phase, the operator's note is about the identity used for hand applies, and the check built here keeps the rule in force when phases 185, 187 and 188 add roles. The account read is repeated in phase 185.
- The Terraform ignore entries are placed here and not in phase 181, where `research/SUMMARY.md` sketches them. Terraform first runs in this phase, and the move leaves this phase with no dependency on phase 181.
- The throwaway Supabase project that C2 allows is used from this phase on: here for the settings import, in phase 184 for the checks that are broken on purpose.
- Whether the access-token hook can be switched on before its function exists is not known (F2, measured in phase 184). If it cannot, the hook setting is applied after the first push in phase 184, and criterion 5 covers the other settings.

### Phase 184: Hosted Supabase Measurement and Conformance Probe

**Goal**: The schema, the functions and the bootstrap rows are on the hosted project, what the project actually serves is measured and recorded with dates, and a probe fails by name when any of it drifts.
**Depends on**: Phase 181 (the frozen migration model, the bucket migration and the bootstrap script), Phase 183 (the Supabase root, the mail identity and the throwaway project)
**Requirements**: SUPA-01, SUPA-02, SUPA-03, SUPA-04, SUPA-05, SUPA-06, SUPA-07, SUPA-13, SUPA-14, OBS-01, OBS-02, OBS-03, OBS-05, OBS-07
**Builds toward**: OBS-04 (the headers that reach an Edge Function and a PostgREST trigger; the frontend container's side is recorded in phase 185), OBS-09 (the inputs a per-caller limit could use), OBS-10 (`behind_cloudflare` set as deployed), PIPE-06 (the deploy order, done by hand).
**Operator preconditions**: None beyond those of phase 183.
**Success Criteria** (what must be TRUE):
  1. One command pushes the migrations to the linked project, and a second run changes nothing. After it the two buckets exist, the three Edge Functions are served with their secrets set from the operator's environment, the bootstrap rows are the same after one run of the bootstrap and after two, and the drift check exits zero. No seed user and no local URL is on the project.
  2. The settings the project serves are read back and equal the HCL: the access-token hook on, with a signed-in token carrying its claims; the site URL; the two redirect entries; public sign-up off; email confirmation on; SMTP; and maximum rows equal to `dataAdapter.pageSize`. A read of more than 1000 rows comes back whole, and `anon` is cut off at 8 s. The dashboard's names for the two switches are recorded.
  3. Dated records exist for the redirect allowlist's behaviour (the single-segment pattern, the site URL's host on other ports, and what `/auth/v1/verify` returns when admitted and when refused), for whether the gateway accepts a call with the anon key and no user token (with `account-access` working or changed to suit), for both refusing branches of `account-access` and the release of a slot after a failed send on the served function, and for the key model the new project issues. The deployment is on legacy keys if they work for every call shape.
  4. A mail sent from a hosted Edge Function through SES arrives with DKIM, SPF and DMARC passing. The port that works from the function is measured, 2587 first, and it is the one configured.
  5. The conformance probe reads what the persistent project serves and passes. Each of its checks is seen failing once, by name, against the throwaway project broken on purpose.

**Research flag**: Needs `/gsd-plan-phase --research-phase`, planned as measurement tasks with recorded outputs. Two topics that `research/SUMMARY.md` lists under 185 are measured here, because this roadmap makes the first push and sends the first Edge Function mail in this phase: `db push` from an IPv4 network, with the pooler as the fallback, and the SES port from an Edge Function (D7; 2587 first by C6). Also measured here: whether the hook can be switched on before its function exists (F2), and the Postgres major version.
**Plans**: 25/25 plans complete in 19 waves. Waves 1 to 4 write the code without the operator (the probe, the push wrapper, the drift check's linked guard, the parity guard's `[functions.*]` family, the function secrets in Terraform, the scratch root's fault file, the smoke template, the runbook and the grant script); three of them stop for a ruling first. Waves 5 to 13 are the throwaway's sittings, in order; waves 14 to 17 the persistent project's, the first push behind a one-way gate (plan 184-21); wave 18 deletes the throwaway; wave 19 closes on the repository gates and a full E2E run.

Plans:
**Wave 1**
- [x] 184-01-PLAN.md — wave 1 — The probe end to end for one check (the tracer), and its Vitest suite in `yarn test:unit`.
- [x] 184-04-PLAN.md — wave 1 — The push wrapper and the drift check's linked-target guard, each with its offline refusals.
- [x] 184-05-PLAN.md — wave 1 — Widen the parity guard to `[functions.*]` and classify `identity-callback`'s JWT setting.
- [x] 184-06-PLAN.md — wave 1 — The Edge Function secrets in the Supabase module, wired into the staging and example roots.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 184-02-PLAN.md — wave 2 — The probe's Management API checks: the auth settings, the API settings and the deployed functions.
- [x] 184-07-PLAN.md — wave 2, needs the operator — Rule the project id; make the scratch root rehearse staging, with an import block and the batched-break fault file.

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 184-03-PLAN.md — wave 3, needs the operator — Rule the bucket source; the probe's public-API and catalog checks and the seed check, twenty-two in all.
- [x] 184-08-PLAN.md — wave 3, needs the operator — Rule how staging is opened for voters; the dev-seed `smoke` template with more than 1000 rows and no user.

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 184-09-PLAN.md — wave 4 — The first administrator's grant script, the deploy runbook (Steps 14 to 23) and the repository gates after the code.

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 184-10-PLAN.md — wave 5, needs the operator — Throwaway: restore the scratch state, read it before change, make and review its first plan.

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 184-11-PLAN.md — wave 6, needs the operator — Throwaway: apply SMTP and the function secrets, link, push, and read the pushed database.

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 184-12-PLAN.md — wave 7, needs the operator — Throwaway: deploy the functions and measure the gateway's call shapes and the keys.

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 184-13-PLAN.md — wave 8, needs the operator — Throwaway: the header record, the anon timeout, the drift check red and green, the second push.
- [x] 184-14-PLAN.md — wave 8, needs the operator — Rule the key model if the legacy keys fail; apply `account-access`'s JWT setting if the gateway requires it.

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 184-15-PLAN.md — wave 9, needs the operator — Throwaway: the logging gate, two bootstraps, the administrator's claims and the smoke dataset.

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 184-16-PLAN.md — wave 10, needs the operator — Throwaway: one mail on 2587 with its authentication results, the redirect cases, a failed send on 587.

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 184-17-PLAN.md — wave 11, needs the operator — Rule the probe's catalog role; the probe green on the throwaway before any fault.

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 184-18-PLAN.md — wave 12, needs the operator — The batched break: every check of the probe seen failing by its own cause, and both refusals.

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 184-19-PLAN.md — wave 13, needs the operator — Revert the break and see the probe green again.

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 184-20-PLAN.md — wave 14, needs the operator — Persistent: the measured port and project id in its root, its reads before change, its plan reviewed.

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 184-21-PLAN.md — wave 15, needs the operator — Persistent: the one-way gate, then apply, link, push twice and deploy the functions.

**Wave 16** *(blocked on Wave 15 completion)*
- [x] 184-22-PLAN.md — wave 16, needs the operator — Persistent: the logging gate, two bootstraps, the first administrator and the smoke dataset.

**Wave 17** *(blocked on Wave 16 completion)*
- [x] 184-23-PLAN.md — wave 17, needs the operator — Persistent: the probe green and the settings read back; the FUT-02 todo and the security re-transfer.

**Wave 18** *(blocked on Wave 17 completion)*
- [x] 184-24-PLAN.md — wave 18, needs the operator — Delete the throwaway and its local state, and make every text naming the scratch root true.

**Wave 19** *(blocked on Wave 18 completion)*
- [x] 184-25-PLAN.md — wave 19 — The repository gates and a full E2E run on the final tree.

Notes:

- Nothing is pushed to the persistent project until the baseline of phase 181 is frozen. Measurements that do not need the frozen baseline can be made on the throwaway project first.
- SUPA-14 is closed here and not in phase 185. Setting the functions' SMTP secrets already means choosing a port, and a mail's headers can be read without a frontend. The invitation mail whose link signs in is OBS-06 in phase 185.
- SUPA-13 records the key model and files nothing new: the move to publishable keys is already filed as FUT-02.
- No AWS frontend resource exists in this phase. That separation is the reason 184 is not merged into 185.

### Phase 185: AWS Frontend Stack, First Apply by Hand

**Goal**: The frontend runs on AWS at `https://staging.openvaa.org`, applied by hand from the repository in stages, and everything the pipeline will later automate has been seen working once, a failed rollout and a teardown included.
**Depends on**: Phase 181 (the health endpoint, the start-up check and the proxy configuration), Phase 183 (the bootstrap root, the registry and the zone), Phase 184 (the measured project, its keys and its served settings)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, INFRA-09, INFRA-10, INFRA-11, INFRA-12, INFRA-13, INFRA-14, SUPA-12, OBS-04, OBS-06, OBS-08, OBS-10
**Builds toward**: INFRA-16 (the alert for a failed or rolled-back deployment, seen firing during this phase's failed rollout), INFRA-19 (the `example` environment's variables, written beside staging's), PIPE-05 and PIPE-06 (the image and the deploy order, done by hand), PIPE-08 (the destroy, run once by hand), OBS-09 (the frontend side of the header record).
**Operator preconditions**: None new. One manual observation: an invitation mail is read and its link followed (OBS-06).
**Success Criteria** (what must be TRUE):
  1. `https://staging.openvaa.org` serves the app from an image pushed to the registry under a tag that names its commit, and a second push of the same tag is refused. HTTP redirects to HTTPS and the certificate is DNS-validated. The service is a Fargate service behind a load balancer in two availability zones, written as explicit Terraform resources with the task floor as a variable. The tasks are in public subnets with no NAT gateway and accept traffic only from the load balancer. The stack is in `eu-north-1`, and the Supabase project's region is stated beside it.
  2. The task gets its configuration as environment, with secrets from a secret store, `PUBLIC_PROJECT_ID` among them and the service-role key absent. A frontend started from the template's variables alone reads from Supabase. The load balancer's health check uses the health endpoint with a start-up grace period. A form post through the public URL succeeds, and a spoofed forwarded address is not taken as the client's, with the header depth set from the recorded headers that reach the container. The feedback rate limit buckets by client with `behind_cloudflare` set as deployed.
  3. A rollout made unhealthy on purpose rolls back by itself while requests in flight complete, and `SIGTERM` is seen reaching the Node process in a stopping task. The task count stays between the floor and the ceiling, and a scheduled action raises the floor. Container output is in a log store with a set retention period. The CDN serves the immutable build assets from its cache, and a rendered page is never served from it.
  4. One invitation mail sent through real SMTP arrives with the staging origin in its link, and the link signs the recipient in. The observation is recorded with its date.
  5. State is remote and locked, and staging has its own variables and outputs. A destroy of the AWS root, run once on purpose, removes the stack cleanly and leaves the hosted project, its data and its settings untouched, and the stack is then applied again. Every resource carries the cost tags, and a monthly estimate measured on the applied stack is recorded.

**Research flag**: Needs `/gsd-plan-phase --research-phase`. Topic from `research/SUMMARY.md`: ACM and DNS staging. It was written for a zone outside Route 53, and F1 moves the zone to Route 53 in phase 183, so what remains is the order of the staged apply (registry, image, DNS and certificate, compute). Added by ruling A2 after the research, and so not researched: the CDN (INFRA-14). Where it sits can change the proxy depth of INFRA-06, the region of the certificate against the default of INFRA-12, the header record of OBS-04 and the scope of the WAF variable of RELAY-09. The header observations are made with the CDN in place.
**Plans**: 22/22 plans complete in 18 waves. Waves 1 to 7 write and gate the code without AWS (the first stops once for the operator's rulings on the execution role's home, the push and the alert address); waves 8 to 17 are the hosted sittings in order, the agent applying `envs/staging/aws` under D-01; wave 18 closes on the repository gates and a full E2E run beside the cost read.

Plans:
**Wave 1**
- [x] 185-01-PLAN.md — wave 1, needs the operator — Rule the execution role's home, the push and the alert address; the role module called from bootstrap, with its runbook step.
- [x] 185-02-PLAN.md — wave 1 — The task's environment list and its guard against `REQUIRED_ENV`, the analytics names and `.env.example`.
- [x] 185-03-PLAN.md — wave 1 — The stop line and the diagnostics allow-list, seen on the production build, and the voter-journey E2E project.
- [x] 185-05-PLAN.md — wave 1 — The build-and-push script and the request loop, each with a self-test in the infra suite.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 185-04-PLAN.md — wave 2 — The module's origin half (network, load balancer, service) with offline tests, called from the staging root.

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 185-06-PLAN.md — wave 3 — The CDN, scaling and the deployment alert in the module and the staging root.

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 185-07-PLAN.md — wave 4 — The example root with stand-ins, and the CI job running the module tests.

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 185-08-PLAN.md — wave 5 — The AWS runbook's frame and Steps 1 to 6, `infra/README.md` corrected, the guard widened.

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 185-09-PLAN.md — wave 6 — The runbook's Steps 7 to 18 and the election-day section.

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 185-10-PLAN.md — wave 7 — The repository gates and the CI validation commands on the finished code.

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 185-11-PLAN.md — wave 8, needs the operator — The two parameters and the execution role on AWS, read back.

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 185-12-PLAN.md — wave 9 — The image from a pushed source-only commit, and the refused second push.

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 185-13-PLAN.md — wave 10, needs the operator — One plan and one apply; the subscription confirmed and the cost tags activated.

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 185-14-PLAN.md — wave 11 — What the stack serves: certificates, redirects, OBS-08, form post, caching, network, tags, logs, state.

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 185-15-PLAN.md — wave 12 — The header record and the depth, both origin locks refusing, diagnostics off again.

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 185-16-PLAN.md — wave 13, needs the operator — The failed rollout and its rollback, the alert mail, the restore and SIGTERM.

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 185-17-PLAN.md — wave 14 — The scheduled floor raised and lowered, and removed.

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 185-18-PLAN.md — wave 15, needs the operator — The feedback limit from two networks and the invitation mail (OBS-10, OBS-06).

**Wave 16** *(blocked on Wave 15 completion)*
- [x] 185-19-PLAN.md — wave 16, needs the operator — Cleanup, the plans before, the log copy, the destroy and the sweep in both regions.

**Wave 17** *(blocked on Wave 16 completion)*
- [x] 185-20-PLAN.md — wave 17, needs the operator — The Supabase plan and probe after the destroy, and the re-apply.

**Wave 18** *(blocked on Wave 17 completion)*
- [x] 185-21-PLAN.md — wave 18 — The repository gates and a full E2E run on the final tree.
- [x] 185-22-PLAN.md — wave 18, needs the operator — The priced inventory and the measured monthly cost, or its dated follow-up.

Notes:

- SUPA-12 is closed here because its last clause, a teardown of the AWS root leaving the database untouched, can only be seen once an AWS root exists. Phase 183 builds the rest of it.
- The task and execution roles go in under the IAM check of phase 183, and the account read for inline user policies is repeated (INFRA-17).
- Staging runs one task (D1). The limit that Admin job progress is unreliable above one task is documented in phase 189 (DOCS-06).
- If the deployment alert is not built here, phase 187 stages its own failed rollout to see it fire.
- The dataset the smoke run reads is seeded once out of band (E1). If this phase seeds it for its own observations, phase 186 reuses it.

### Phase 186: Deployed Smoke Entry

**Goal**: A read-mostly smoke run proves from a workstation that the deployed URL serves the intended build on the intended project and that a voter and a contestant can use it, and it refuses to run against anything else.
**Depends on**: Phase 185
**Requirements**: SUPA-09
**Builds toward**: PIPE-07 (everything in it except the pipeline wiring: a failing smoke run failing the pipeline is seen in phase 187).
**Operator preconditions**: None. The dedicated project is seeded once by hand, outside any workflow.
**Success Criteria** (what must be TRUE):
  1. Run from a workstation against `https://staging.openvaa.org`, the smoke run passes: it confirms the build SHA and the project id, renders a voter page from hosted data, goes from questions to results, and signs one contestant in.
  2. The negative controls are each seen red, with a non-zero exit status read directly: a wrong expected SHA, a wrong project id, and a target that is not the dedicated project. The run cannot be pointed at a production project (SUPA-09).
  3. The run is read-mostly. It has no setup project and no teardown project, the dataset it reads was seeded once out of band, and `DEV_SEED_ALLOW_REMOTE` appears in no workflow and nowhere in the smoke entry.
  4. The local gate suite and its preflight are unchanged, and the full local suite is green on the tree that adds the smoke entry.

**Research flag**: Standard pattern, no research phase. A second Playwright config reuses the existing fixtures. The local-port assumption in `supabaseAdminClient.ts` must be made a parameter.
**Plans**: 8/8 plans complete in 6 waves. Waves 1 to 5 run without the operator: the gate, the entry and its specs, the lock, the grant SQL and its runbook item, the three negative controls, the docs and the closing local gates with the one full local E2E run. Wave 6 is the one hosted write, at a checkpoint the operator approves, followed by the full green deployed smoke run. The research flag is read as "the smoke entry holds no service-role client, enforced" (A-05), not as a parameterised admin client.

Plans:
**Wave 1**
- [x] 186-01-PLAN.md — wave 1 — The deployed-target gate as a pure module with its unit refusals: tfvars identity, served ref and project id, SHA, service-role refusal.
- [x] 186-04-PLAN.md — wave 1 — The contestant grant SQL proven on an isolated database, and its creation and removal in Step 22 of the staging runbook; nothing hosted written.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 186-02-PLAN.md — wave 2 — The second Playwright entry and its two specs; the voter half run green against staging; the contestant spec failing by name without its inputs.

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 186-03-PLAN.md — wave 3 — The root script, the ESLint import lock seen red and green, and the unit guard over workflows, config shape and import closure.

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 186-05-PLAN.md — wave 4 — The three negative controls, each seen red on a real target at its own check alone.
- [x] 186-06-PLAN.md — wave 4 — § Deployed smoke run in tests/README.md and one CLAUDE.md Testing line.

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 186-07-PLAN.md — wave 5 — Lint, format and unit gates, the unchanged-local-gate proofs, and the phase's one full local E2E run.

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 186-08-PLAN.md — wave 6, needs the operator — Readiness, the operator-approved contestant sitting, and the full deployed smoke run green.

Notes:

- Bank authentication is not in the smoke run (A4), and neither is a mail round trip (E2).
- The staging project is the dedicated test project of SUPA-09. No second environment is applied (A1).

### Phase 187: Deploy Pipeline

**Goal**: A push to the staging branch, a manual dispatch or an evidence push deploys the stack from GitHub Actions without stored keys, behind a gate and in a fixed order, and the run goes red when the build, the rollout or the smoke run fails.
**Depends on**: Phase 185 (the stack and the steps done by hand), Phase 186 (the smoke entry)
**Requirements**: PIPE-01, PIPE-02, PIPE-03, PIPE-04, PIPE-05, PIPE-06, PIPE-07, PIPE-08, PIPE-09, PIPE-10, INFRA-16, INFRA-19, SUPA-08
**Operator preconditions**: None new. The operator approves the GitHub Environment's gate for each apply.
**Success Criteria** (what must be TRUE):
  1. Workflows reach AWS through OIDC with no stored keys, by a read-only plan role and a deploy role bound to this repository and one GitHub Environment. A token with the wrong subject is seen refused. A pull request from a fork gets no cloud credentials and its credentialed jobs show as skipped. The access token, the database password and the service-role key are found only in the pipeline's environment and in Terraform state, and no plan is uploaded as an artifact.
  2. On a pull request the Terraform is formatted, validated and planned, and the plan can be read in the run. The `example` environment, which carries the production-shaped settings as variables, is validated and planned in the same run, and no workflow can apply it.
  3. A push to the staging environment's branch deploys staging, and so do a manual dispatch and a `deploy-evidence/**` push. A push to `main` deploys nothing. The apply runs only behind the GitHub Environment gate, applies are serialised and never cancelled mid-run, the image is built once and deployed by digest, and the run's steps are in order: migrations, functions, frontend rollout, wait until stable.
  4. The smoke run is the last stage, and a failing smoke run fails the pipeline. One green run and one red run are observed and recorded, the red one from a build broken on purpose. The operator is notified when a build fails and when a deployment fails or rolls back, and each alert has been seen firing once.
  5. A guarded destroy path removes the AWS stack, and it is seen unable to reach the Supabase root.

**Research flag**: Standard pattern, no research phase. OIDC, plan and apply, and environment gating are well documented, and the repository-specific items carry the risk. Added by rulings after the research: the named-branch trigger (PIPE-10) and the failure alerts (INFRA-16).
**Plans**: 31/31 plans complete in 20 waves. Waves 1 to 7 (plans 01 to 13) run without the operator: the deploy-role policies, the trust and lock changes, the image by digest, the archive build context, `--confirmed-ref`, the running-digest helper, the example mock plans, the three workflows with their guard tests and actionlint, the documentation, the gates, the locally proven green and red evidence commits and the one closing local E2E run. Waves 8 to 20 (plans 14 to 29) are the outward actions, each behind an operator checkpoint. Plans 26 (wave 10), 27 (wave 11), 28 (wave 12), 29 (wave 13), 30 (wave 14) and 31 (wave 15) are gap closures: plan 26 of plan 15's CI run; plan 27 of plan 26's run, after the branch was rebased onto the -gsd stream on 2026-11-16; plan 28 of plan 27's run, after the CI measurement and the rebase onto `fix/v2.16-ci-e2e` on 2026-11-17; plan 29 of plan 18's red run 44042442257, whose build line and wrong-subject refusal the runner's `bash -e` hid (operator ruling `RULING_BASH_E=fix-now-and-re-observe`, 2026-11-17); and plan 30 (wave 14) of plan 21's green run 44165083175, whose deploy job's ARM runner found no linux_arm64 hash in the staging AWS root's lock. Plan 18 closed after plan 29, on the operator's alert-mail lines. Plans 24 and 25 run on or after 2026-11-23.

Plans:

**Wave 1**
- [x] 187-01-PLAN.md — wave 1 — The deploy role's nine customer-managed policies and `ecr:DescribeImages` in the github-oidc module, with the module's first offline test; nothing applied.
- [x] 187-02-PLAN.md — wave 1 — The task's image by a required `image_digest` in the module and both AWS roots; no image value in any tfvars.
- [x] 187-03-PLAN.md — wave 1 — CR-01: the image built from the commit's `git archive`, with a self-test that plants an ignored file.
- [x] 187-04-PLAN.md — wave 1 — `push-migrations.sh --confirmed-ref`, accepted only in a staging Actions job, tested against stubs.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 187-05-PLAN.md — wave 2 — The numeric id conditions, the `staging-destroy` subject, the plan role's lock write removed, and bootstrap runbook Step 9.
- [x] 187-06-PLAN.md — wave 2 — The running-image digest script and the staging AWS runbook's plans by digest.
- [x] 187-07-PLAN.md — wave 2 — The three example roots planned with mock providers, production shape asserted.

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 187-08-PLAN.md — wave 3 — `infra-plan.yml` (checks, same-repository plan, wrong-subject proof) and the shared workflow guard library.

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 187-09-PLAN.md — wave 4 — `deploy.yml`: one gated job, build, plan, migrations, functions, apply, stable, smoke, re-read, alert.
- [x] 187-10-PLAN.md — wave 4 — `destroy.yml`: two approved jobs, the Supabase-root refusal, the destroy-plan guard.

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 187-11-PLAN.md — wave 5 — Cross-workflow guards, `yarn lint:workflows`, `infra/README.md` § The deploy pipeline, the smoke entry's notes, the secret scan's two exclusions.

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 187-12-PLAN.md — wave 6 — The repository gates, and the green and red evidence commits proven by local builds; nothing pushed.

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 187-13-PLAN.md — wave 7 — The phase's one full local E2E run and the handoff to plan 186-08.

**Wave 8** *(blocked on Wave 7 completion; needs the operator)*
- [x] 187-14-PLAN.md — wave 8 — H2, H3: the `staging` and `staging-destroy` environments, secrets and variables, read back.

**Wave 9** *(needs the operator)*
- [x] 187-15-PLAN.md — wave 9 — The `ci-evidence/187-final` push: secret-scan, infra-validate, dependency-audit. (stopped at Task 3; G-03 closed by 187-28)
- [x] 187-16-PLAN.md — wave 9 — H1: the bootstrap hand apply after the simulator and CloudTrail checks.
- [x] 187-17-PLAN.md — wave 9 — H9: plan 186-08 completed, and the two contestant secrets set.

**Wave 10** *(needs the operator; gap closure)*
- [x] 187-26-PLAN.md — wave 10 — Gap closure of run 43817899191: the URI fixtures, `run_child` on Linux, the functions env in CI's E2E job, the drift-guard timeout; the evidence chain again, and the `ci-evidence/187-final-2` push. (stopped at Task 7; closed by 187-28)

**Wave 11** *(needs the operator; gap closure)*
- [x] 187-27-PLAN.md — wave 11 — Gap closure after the rebase onto the -gsd stream: every gate on the rebased tree, what it carries to staging (read-only), the two CI-only contestant readiness fixes proven under CPU throttling, the drift-guard link; the evidence chain again, and the `ci-evidence/187-final-3` push. (stopped at Task 8; closed by 187-28)

**Wave 12** *(needs the operator; gap closure)*
- [x] 187-28-PLAN.md — wave 12 — Gap closure after the CI measurement and the rebase onto `fix/v2.16-ci-e2e`: every gate on the rebased tree, the evidence chain again, the closing full E2E run on the functions env template, the `ci-evidence/187-final-4` push, and the run read job by job; on green, 187-15, 187-26 and 187-27 closed.

**Wave 13** *(needs the operator; gap closure)*
- [x] 187-29-PLAN.md — wave 13 — Gap closure of plan 18's red run: every status read of the three workflows is captured as `cmd || name=$?`, so the runner's `bash -e` lets each step reach its diagnosis and still ends a step at any other failing command, proven under `bash -e` with stub commands and locked by a shared rule; the evidence commits rebuilt and the red build re-proven locally; a new red push as `deploy-evidence/187-red-2` showing `failed=build`, both roles refusing the branch subject, and nothing hosted written.

**Wave 14** *(needs the operator)*
- [x] 187-18-PLAN.md — wave 14 — H8: the red run from a broken build, its alert, and the wrong-subject refusal. (stopped at Task 3; its run 44042442257 executed; the five lines the runner's `bash -e` hid closed by 187-29; the alert mail arrived)
- [x] 187-30-PLAN.md — wave 14 — Gap closure of plan 21's green run 44165083175, red at its plan step: every root lock written for linux_amd64, linux_arm64, darwin_arm64 and darwin_amd64, guarded by the `arm-lock` and `lock-platforms` rules, proven on linux/arm64 in a container; attempt 1 recorded; the evidence commits rebuilt.

**Wave 15** *(needs the operator)*
- [x] 187-19-PLAN.md — wave 15 — H5: a draft pull request's plan, readable in its run.
- [x] 187-31-PLAN.md — wave 15 — Gap closure of plan 21's attempt 3 (run 44258126898), red at the stable step: one describe-services read raced the rollout's IN_PROGRESS to COMPLETED by 25 to 32 s; the step now reads at most 60 times 15 s apart, proven by stub cases under bash -e and the `rollout-poll` rule; the evidence commits rebuilt.

**Wave 16** *(needs the operator)*
- [x] 187-20-PLAN.md — wave 16 — H6: a fork pull request's credentialed job skipped.
- [x] 187-21-PLAN.md — wave 16 — H4, H7: the first green pipeline deploy, every stage in order.

**Wave 17** *(needs the operator)*
- [x] 187-22-PLAN.md — wave 17 — The first deploy from `deploy/staging`, reusing the built image.

**Wave 18** *(needs the operator)*
- [x] 187-23-PLAN.md — wave 18 — The destroy path up to its apply: the Supabase root refused, the apply job rejected.

**Wave 19** *(needs the operator; on or after 2026-11-23)*
- [x] 187-24-PLAN.md — wave 19 — H10: the real destroy through the pipeline.

**Wave 20** *(needs the operator)*
- [x] 187-25-PLAN.md — wave 20 — H10: the redeploy from nothing and the confirmed alert subscription.

Notes:

- The named branch is read as a per-environment branch such as `deploy/staging`, deployed by GitHub Actions and not by AWS CodePipeline (reading 3 of the rulings).
- PIPE-01's provider and roles come from phase 183. SUPA-08's state bucket comes from phase 183.
- Runs are observed before the workflow file is on `main` through the `deploy-evidence/**` trigger.
- FUT-10, a rollback to the previous task definition when the smoke run fails, is not built here.

### Phase 188: Relay on the Deployed Stack, and the Per-Caller Limit

**Goal**: Events from the deployed stack arrive in PostHog EU as anonymous events, the stack's capacity is measured, and the per-caller limit on the anonymous invitation operations is built or deferred on the evidence.
**Depends on**: Phase 182 (the relay), Phase 185 (the stack and the header record), Phase 187 (the pipeline that rolls configuration out)
**Requirements**: RELAY-04, RELAY-09, OBS-09, OBS-11
**Operator preconditions**: A PostHog Cloud EU project, its token and a billing limit, before the relay is verified on the stack.
**Success Criteria** (what must be TRUE):
  1. An event sent from the staging site is retrievable in the PostHog EU project with no person profile, no visitor address, no GeoIP properties and no raw user agent. Events arrive in batches, events queued when a task receives `SIGTERM` are delivered, and the site keeps working when PostHog cannot be reached. The token reaches the task from the secret store, and switching the provider to `none` stops events with no rebuild of the image.
  2. Against the deployed relay, a cross-origin post, an oversized body and a request that names its own destination are each refused, and a full queue drops events instead of growing. A WAF rate rule exists as a Terraform variable that is off by default, a plan with it switched on shows the rule, and its cost is recorded.
  3. A load check of the voter journey and the relay against the deployed stack yields a capacity figure, recorded with its date and its method.
  4. The per-caller limit on the anonymous invitation operations is decided from the header record of OBS-04. It is either built and seen limiting one caller without limiting another, or deferred with the measurement and a date.

**Research flag**: Needs `/gsd-plan-phase --research-phase`. Topics from `research/SUMMARY.md`: PostHog's price for anonymous events and the billing limit, and the cost of a WAF rule. Added by ruling A2 after the research, and so not researched: the tool and the method of the load check (OBS-11).
**Plans**: 20/20 plans complete in 14 waves. Every plan first checks that 187-21, 187-22 and 186-08 are complete (a literal `test -f` of their SUMMARY.md files), because those plans need `apps/`, `packages/` and `tests/` unchanged and 187's first green deploy would carry this phase's migration. Waves 1 to 4 (plans 01 to 08 and 20) run without the operator: the flush interval and the overlap fix, the stop timeout, the WAF variable, the per-caller limit's migration and function, the refusal and read scripts, the load-check method, and the closing gates with the phase's one full local E2E run. Waves 5 to 14 (plans 09 to 19) are the outward actions, each behind an operator checkpoint; 187's destroy-path plans 187-23 to 187-25 must not run between plans 188-10 and 188-19.

Plans:
**Wave 1**
- [x] 188-01-PLAN.md — wave 1 — `ANALYTICS_FLUSH_INTERVAL_MS` through the analytics configuration and the task-environment contract.
- [x] 188-04-PLAN.md — wave 1 — The per-caller limit's RPC as the first appended migration, its pgTAP file and census pins, and the [BLOCKING] local schema push.

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 188-02-PLAN.md — wave 2 — `stop_timeout_seconds = 40` passed through both AWS roots.
- [x] 188-05-PLAN.md — wave 2 — `account-access` takes a slot before every operation and answers 429; the conformance pins moved; local proof; the docs corrected.
- [x] 188-06-PLAN.md — wave 2 — The deployed refusal script, proven against the local relay, and the named-line PostHog read.
- [x] 188-07-PLAN.md — wave 2 — The k6 load method: wrapper, script, figure, journey extractor, method; a local dry run.
- [x] 188-20-PLAN.md — wave 2 — A timer tick skipped while a flush is in flight, and the Render and Compose templates naming the flush interval.

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 188-03-PLAN.md — wave 3 — The opt-in WAF rate rule as a nullable module variable, off by default, tested both ways.

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 188-08-PLAN.md — wave 4 — The repository gates and the phase's one full local E2E run.

**Wave 5** *(needs the operator)*
- [x] 188-09-PLAN.md — wave 5 — G1 to G5: the PostHog project, its settings, the billing limit and the read key; the Supabase plan; the read-back proven.

**Wave 6** *(needs the operator)*
- [x] 188-10-PLAN.md — wave 6 — PostHog on, through the pipeline, with the first hosted append migration and the new function (one-way, gated).

**Wave 7** *(needs the operator)*
- [x] 188-11-PLAN.md — wave 7 — The first capture with no visitor data, batching, and the nine refusals on the deployed relay.
- [x] 188-16-PLAN.md — wave 7 — The trust flag read first; the hosted per-caller limit seen refusing one caller and not another; the todo closed.

**Wave 8** *(needs the operator)*
- [x] 188-12-PLAN.md — wave 8 — Queued events delivered at SIGTERM, with a ten-minute flush interval by hand apply; restored.

**Wave 9** *(needs the operator)*
- [x] 188-13-PLAN.md — wave 9 — A full queue dropping on the deployed relay, memory flat; restored.

**Wave 10** *(needs the operator)*
- [x] 188-14-PLAN.md — wave 10 — The site green while PostHog is unreachable; restored.

**Wave 11** *(needs the operator)*
- [x] 188-15-PLAN.md — wave 11 — Provider `none` by hand apply of the same digest, zero events; restored.

**Wave 12** *(needs the operator)*
- [x] 188-17-PLAN.md — wave 12 — The WAF rule planned on and costed; off reads no change.

**Wave 13** *(needs the operator)*
- [x] 188-18-PLAN.md — wave 13 — One journey recorded and the stepped load check to a dated capacity figure.

**Wave 14** *(needs the operator)*
- [x] 188-19-PLAN.md — wave 14 — The end state, the requirement trace and the read key settled.

Notes:

- A project-wide cap on the anonymous invitation operations is out of scope: any visitor could exhaust it for everyone.
- The todo `2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations` closes only if the limit is built. Otherwise it stays open with the measurement.

### Phase 189: Documentation and Closure

**Goal**: A deployer can follow the documentation from an empty AWS account and a new Supabase project to a tested instance, every statement about a hosted project is a dated observation, and the absorbed todos are closed on the record.
**Depends on**: Phases 181, 182, 183, 184, 185, 186, 187 and 188
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06, DOCS-07, DOCS-08
**Operator preconditions**: None.
**Success Criteria** (what must be TRUE):
  1. The deployment guide follows the Terraform and Supabase-as-code path and states that the HCL is kept OpenTofu-compatible. A settings reference lists each hosted setting, where the repository sets it and how to verify it. The environment-variable reference covers the proxy variables, the analytics variables and `PUBLIC_PROJECT_ID`.
  2. A search of the documentation and of the repository's comments finds no statement about a hosted project that is marked unverified. Each one is replaced by a dated observation or removed.
  3. The analytics documentation gives the event catalogue, how to add a provider, the privacy mechanism and a checklist the deployer completes for their own jurisdiction. It says that the consent determination is the deployer's, and nowhere says that no consent is required.
  4. An operations runbook covers election-day scaling, rollback, teardown and restore, secret rotation, SES, and the limit that Admin job progress is unreliable above one task.
  5. The Render deployment example and its mentions are removed, the orphan compose file is retired if nothing references it, and each of the seven absorbed todos has a closure record (amended by the operator's 2026-11-20 fill, 189-CONTEXT F-01; supersedes ruling A5).

**Research flag**: Standard pattern, no research phase, once phases 184, 185 and 188 have produced the observations.
**Plans**: 20/20 plans complete

Plans:
**Wave 1**
- [x] 189-01-PLAN.md — Render example and its mentions removed; DOCS-07 and criterion 5 amended (F-01)
- [x] 189-02-PLAN.md — the two frontend-URL variables removed, targeted E2E of the projects they serve (B-03)
- [x] 189-03-PLAN.md — orphan frontend compose file and its stage retired, production image built (F-02, F-03)
- [x] 189-04-PLAN.md — docs subtree pages and nav, the deployment overview kept reachable (A-02)
- [x] 189-05-PLAN.md — operator sitting 1: read-only probe, privilege and DMARC reads (H-01)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 189-06-PLAN.md — operator sitting 2: the backups read, as runbook Step 24 (E-02)
- [x] 189-08-PLAN.md — hosted-settings reference and its guard (B-01, DOCS-02)
- [x] 189-09-PLAN.md — environment-variable reference by role and its guard (B-02, DOCS-04)
- [x] 189-10-PLAN.md — analytics page: catalogue guard, mechanism, provider, checklist (D-01 to D-03, DOCS-05)
- [x] 189-13-PLAN.md — operations: scaling, rollback, teardown, SES, Admin job limit, cost (E-01, E-04)
- [x] 189-19-PLAN.md — fold-ins: seed comment, skill citation, INFRA-13, re-targets (G-05)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 189-07-PLAN.md — operator sitting 3: origin header secret rotated by runbook Step 19 (E-03)
- [x] 189-11-PLAN.md — the guide's path from an empty account to a tested instance, OpenTofu rule (DOCS-01)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 189-12-PLAN.md — the guide's hosted-project sections on the Terraform path (DOCS-01, C-01)
- [x] 189-14-PLAN.md — operations: restore and secret rotation (E-02, E-03)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 189-15-PLAN.md — unobserved statements swept from the bootstrap and AWS runbooks, back-links (C-01, A-01)
- [x] 189-17-PLAN.md — identity-callback closing check; hosted-auth todo closed (G-03, G-04)
- [x] 189-18-PLAN.md — five absorbed todos closed on the record (G-01, G-02)

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 189-16-PLAN.md — unobserved statements swept from mail, Supabase, modules and the auth page (C-01)

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 189-20-PLAN.md — recorded searches, closing gates and the full E2E run (C-02, H-02)

Notes:

- The seven absorbed todos are listed in `research/FEATURES.md` under "Todo absorption map": `2026-08-31-evaluate-self-hosted-posthog-log-sink`, `2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e`, `2026-09-02-deployment-guide-production-redirect-allowlist`, `2026-09-18-document-supabase-api-limits-for-deployments`, `2026-10-02-deployment-config-gaps-found-by-docs-rewrite`, `2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables` and `2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations`.
- The cost estimate of INFRA-13 and the capacity figure of OBS-11 are carried into the guide and the runbook from the records of phases 185 and 188.
- Operator's request (2026-10-20), a closing check on the `identity-callback` function, re-measured against the tree, not taken from earlier records:
  - every error reply is a fixed opaque string, never the verifier's error text;
  - each provider in `claimConfig.ts` keys accounts on `sub`, the provider's hashed persistent id derived from the identity code, never on `birthdate` or `ftn_sub`, and the frontend copy agrees;
  - the function behaves the same with `verify_jwt = false` (181-05) on the hosted project.

  These were closed in phase 155, and the check guards against a regression. A drift guard between the frontend and Deno copies of the claim configuration is still open from 155-03; record whether it exists.
- Operator's note on ruling 181-12 (2026-10-11): when the orphan `apps/frontend/docker-compose.dev.yml` is retired, also check whether the root `docker-compose.dev.yml` can be retired, and whether the test that reads it is needed.

## Coverage

Every requirement of `REQUIREMENTS.md` is mapped to exactly one phase. The file holds 83 requirement ids. Its coverage line said 81 before this roadmap was written; the six group counts it gives sum to 83, and a count of the ids confirms 83.

| Phase | Requirements closed | Count |
|-------|---------------------|-------|
| 181 | SUPA-10 | 1 |
| 182 | RELAY-01, RELAY-02, RELAY-03, RELAY-05 to RELAY-08, RELAY-10 to RELAY-21 | 19 |
| 183 | INFRA-15, INFRA-17, INFRA-18, SUPA-11 | 4 |
| 184 | SUPA-01 to SUPA-07, SUPA-13, SUPA-14, OBS-01, OBS-02, OBS-03, OBS-05, OBS-07 | 14 |
| 185 | INFRA-01 to INFRA-14, SUPA-12, OBS-04, OBS-06, OBS-08, OBS-10 | 19 |
| 186 | SUPA-09 | 1 |
| 187 | PIPE-01 to PIPE-10, INFRA-16, INFRA-19, SUPA-08 | 13 |
| 188 | RELAY-04, RELAY-09, OBS-09, OBS-11 | 4 |
| 189 | DOCS-01 to DOCS-08 | 8 |
| 189.1 | OBS-12, OBS-13, PIPE-11 | 3 |
| Total | | 86 |

Phase 189.1 adds three ids, OBS-12, OBS-13 and PIPE-11, from the tech debt of `v2.17-MILESTONE-AUDIT.md`, which brings the file to 86.

Phases 181 and 186 each close one requirement because most of what they build is proven later, on the hosted stack or in the pipeline. Their success criteria and their **Builds toward** lines carry that work.

## Progress

Phases 181, 182 and 183 can start in any order. From 184 on, the numeric order is the dependency order.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 181. Deployability and Migration Model | 19/19 | Complete    | 2026-10-21 |
| 182. Analytics Relay | 31/31 | Complete | 2026-10-20 |
| 183. Terraform Foundation and Supabase as Code | 28/28 | Complete    | 2026-10-26 |
| 184. Hosted Supabase Measurement and Conformance Probe | 25/25 | Complete    | 2026-11-12 |
| 185. AWS Frontend Stack, First Apply by Hand | 22/22 | Complete    | 2026-11-14 |
| 186. Deployed Smoke Entry | 8/8 | Complete    | 2026-11-15 |
| 187. Deploy Pipeline | 31/31 | Complete    | 2026-11-18 |
| 188. Relay on the Deployed Stack, and the Per-Caller Limit | 20/20 | Complete    | 2026-11-20 |
| 189. Documentation and Closure | 20/20 | Complete    | 2026-11-21 |

### Phase 189.1: Address tech debt: invitation-limit guard and trackEvents smoke (INSERTED)

**Goal:** Close the two tech-debt items of `v2.17-MILESTONE-AUDIT.md`: (1) the per-caller invitation limit (OBS-09, SUPA-08) can no longer be silently inert — `private.deployment_settings.behind_cloudflare` is asserted (or established) by the pipeline rather than living only in the operator's manual `bootstrap.sql` step, and a smoke asserts the 429 + `Retry-After` path; (2) the deployed voter smoke passes with `trackEvents` on — the consent prompt no longer blocks an answer control (todo `2026-11-19-deployed-voter-smoke-fails-when-track-events-is-on`).
**Requirements**: OBS-12, OBS-13, PIPE-11 (follow-ups of OBS-09, OBS-10 and SUPA-08)
**Depends on:** Phase 189
**Success Criteria** (what must be TRUE):
  1. A deploy run refuses to roll out when the hosted project's `behind_cloudflare` is not true: the check runs after the migration push and before the functions and the apply, exits 3 with a message naming the cause on a database where it is false (seen on the local stack), reads 0 on staging in an observed green run, and a failure is alerted as stage `settings`.
  2. The deployed smoke asserts the per-caller limit on every deploy: a 429 with the fixed body and an integer `Retry-After` from 1 to 600 within 31 calls, observed in the pipeline's run, while a stand-in that admits every call fails it by name.
  3. The deployed voter smoke passes on staging with `analytics.trackEvents` on and with it off. With it on, the unchanged spec is seen red at the prompt and the changed one green; the prompt's overlap with an answer control is measured and its WCAG disposition decided by the operator; and staging ends in the state the operator chose.
  4. The full local E2E suite is green at the phase's end, with a summed delta of 0 against the last full run (729 passed).
**Plans:** 10/10 plans complete

Plans:
- [x] 189.1-01-PLAN.md
- [x] 189.1-02-PLAN.md
- [x] 189.1-03-PLAN.md
- [x] 189.1-04-PLAN.md
- [x] 189.1-05-PLAN.md
- [x] 189.1-06-PLAN.md
- [x] 189.1-07-PLAN.md
- [x] 189.1-08-PLAN.md
- [x] 189.1-09-PLAN.md
- [x] 189.1-10-PLAN.md

### Phase 190: Multi-deployment bootstrap

**Goal:** `infra/bootstrap` takes a map of deployments, so a second OpenVAA instance can deploy from its own repository into the same AWS account (`471112560111`) without colliding with staging. The first consumer is the private downstream repository `OpenVAA/deploy-nuorten-vaalikone-2027` (Nuorten vaalikone 2027, `nuortenvaalikone.openvaa.org`, its own Supabase project).
**Requirements**: TBD
**Depends on:** Phase 189 (the deployment stack on `main`; the phase may be planned before then, and is executed after)

**Shape:**

- Shared, once per account: the GitHub OIDC provider (IAM allows one per issuer URL), the state bucket, the image registry (per-deployment repository or tag prefix, to be decided in discussion) and the budget.
- Per deployment entry: the repository's numeric id and owner id, the plan and deploy subjects, the deploy environment, the pipeline state key `pipeline/<env>/aws/terraform.tfstate`, the hosted zone and domain, and that deployment's plan, deploy and frontend execution roles, the last scoped to `/openvaa/<env>/frontend/`.
- Staging moves into the map by `moved` blocks; a plan against the live account shows no destroy and no replace.
- The deploy, destroy and infra-plan workflows read the deployment (environment name, domain, state key, role ARNs, trigger branch) from one per-repository configuration instead of naming `staging` inline (`deploy.yml` names it 39 times), so a downstream repository runs them unedited.
- `infra/envs/example` and `infra/README.md` document adding a deployment from a downstream repository: a new entry in the bootstrap map upstream, the env roots copied from `example` downstream.

**Context (exploration, 2026-11-23):** same AWS account, confirmed by the operator; the downstream repository is a private non-fork mirror with an `upstream` remote and diverges only by added files; it follows the deployment stack by `git rebase --onto` while the stack is restacked, and by merge from `main` once the stack lands. This is upstream PR 1 of 2; the second, an instance overlay over `staticSettings`, static assets and translations, is not yet on the roadmap. Not urgent: planned ahead so testing can start as soon as the infrastructure is on `main`.
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 190 to break down)
