---
phase: "179"
slug: "identity-provider-registration-coverage-close"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-21"
---

# Phase 179 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Seeded by plan-phase from
> `179-RESEARCH.md` § Validation Architecture, reproduced below; the planner fills the per-task map and
> sets `nyquist_compliant` when every task has a verify command with a stated failing direction.

---

## From the research


`workflow.nyquist_validation` is absent from `.planning/config.json`, so validation is enabled.

### Test framework

| Property | Value |
|----------|-------|
| Unit and component | vitest per workspace: `apps/frontend`, `apps/supabase` (the functions' pure modules; `index.ts` cannot be imported — keep logic in parameter-taking siblings), `packages/dev-seed`, `packages/app-shared`, `tests/vitest.config.ts` |
| Database | pgTAP, `S/tests/database/*.test.sql`, on a freshly reset database |
| End to end | Playwright through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |
| Quick run (frontend) | `yarn workspace @openvaa/frontend test:unit` |
| Quick run (functions) | `yarn workspace @openvaa/supabase test:unit` |
| Full unit | `yarn test:unit` (needs the stack running: memory `project_unit_gate_needs_running_stack`) |
| Static gates | `yarn lint:check` (carries `assert:schema-migration-parity`, `assert:cookie-names`, `assert:no-session-in-loads`, `assert:project-scoped-queries`, `assert:edge-function-env`, `assert:edge-env-defaults`, `assert:auth-signup-closed`, `assert:i18n-catalog-namespaces`, `assert:a11y-scan-wiring`, `assert:comment-hygiene`, `assert:no-candidate-app-names`, `assert:hosted-settings-parity`, …) |
| Schema equivalence (frozen mode) | `yarn check:schema-equivalence` (Docker; not in `lint:check`) |
| Driver models | `.planning/phases/178-sign-in-email-code-registration/{178-gates.sh,178-e2e.sh,178-verdict.mjs,178-bankauth.sh,178-stack-probe.sh}` |

### Wave 0: measured before anything is built

One probe script in the phase directory (model: `178-probe.mjs`), run against the local stack under
`caffeinate`, every user and row under a `rq179_` prefix, removed at the end, its output recorded:

| Row | Question | Decides |
|-----|----------|---------|
| P1 | Placeholder user (created as today): generate current + new, verify current (status, body, session?), verify new (session? `email`, `email_change`, `email_confirmed_at` before/after), Mailpit count | A1, plan 3's mechanism |
| P2 | Same with the new link alone: does the click only single-confirm; what does supabase-js `verifyOtp` return | Pitfall 5, A2 |
| P3 | A second triple: is the first new link refused (status, code) | Resend semantics, the mail's copy |
| P4 | `newEmail` held by another account → 422 `email_exists`?; two placeholders pending one address: first click ok, second click status/code | D-07, U-16 |
| P5 | Invite → `updateUserById(app_metadata, email_confirm)` → magiclink verify: `private.user_password_set` false?; `createUser` control → true | A4, J2 |
| P6 | `hashed_token` vs the `action_link` token for `email_change_new`: which verifies | Pitfall 2 |
| P7 | An access/refresh token issued before the change: still valid after it | A3 |
| P8 | `supabase functions serve identity-callback --env-file <generated>` then stop: does `yarn db:start` alone bring the edge runtime back; time of a full stop/start | D-19 wrapper design (A8) |

P8 replaces the shared stack's edge runtime; run it only in a window the operator confirms free.

### Phase requirements → test map

| Req | Behaviour | Type | Command | Exists? |
|-----|-----------|------|---------|---------|
| REG-04 | Function: new identity → invite recipe, entity + grant before the link, link for the current address | unit | `yarn workspace @openvaa/supabase test:unit` (new modules beside `identity-callback/index.ts`) | ❌ Wave 0 |
| REG-04 | Confirmation operation: auth required, placeholder refused, slot, three calls, one mail per locale, `in_use` | unit | same; `account-access/{contract,linkIssue,mailTemplates,flowConformance}.test.ts` | partly; extended |
| REG-04 | No `email` key in any admin update; the only `email_confirm: true` is the placeholder's | unit | `flowConformance.test.ts` in both functions | ❌ |
| REG-04 | New candidate end to end: C → mock → CI1 → G → home; then the mailed confirmation link via `mailedLink.ts`; then sign-in by email; F appears once proved | E2E | the IdP spec, scenario 1 (`@reg-idp`) | ❌ |
| REG-05 | Gate predicate over address states and marker (V1–V6 table) | unit | `F/lib/contestant/gates/gates.test.ts`; `(protected)/layout.server.test.ts`; `layout.tracking.test.ts` stays green | exist; extended |
| REG-05 | Returning proved / pending / none; the gate on a direct protected URL | E2E | scenarios 3, 4, 8 | ❌ |
| REG-06 | Authorize refuses a forbidden type; cookie set with flow attributes; callback re-checks; function refuses and writes nothing | unit + E2E | `F/routes/api/oidc/*` tests (new `server.test.ts`); function matrix test over the 32 rows; scenario 7 asserts no row written | ❌ |
| REG-06 | Deno matrix copy equals SQL and TS on every row | unit | new vitest reading `45-registration-mode-matrix.test.sql` | ❌ |
| REG-07 | Org created unconfirmed, nameless; names saved through `updateEntityProperties`; default-locale name required | unit + E2E | function org-branch test; CI1 component test; scenario 2 (`@org-registration`) | ❌ |
| REG-08 | Code → class table; unknown → retry; never echoed | unit + E2E + axe | CI2 `page.server.test.ts`; scenarios 5, 6; entry scans 1–3 | ❌ |
| REG-14 | No `preregist` reference outside the exemptions | gate | the new `assert:` script in `lint:check`, with `--self-test` | ❌ |
| J3 | An IdP caller claims nothing even with a confirmed matching address | pgTAP | `39-invitations.test.sql` new case | extended |
| E2E-01 | Every mode follows a real mailed link | E2E + gate | tags `@reg-idp`, `@reg-email`, `@reg-code`; coverage script | tags ❌ (only `@nomination-definition` exists: 17 tests in `contestant-nominations.spec.ts` and `perm-startfromcg.spec.ts` `[MEASURED]`) |
| E2E-02 | Org registration, entity selection, nomination definition covered | gate | coverage script over `npx playwright test -c tests/playwright.config.ts --list --grep-invert @probe` | ❌ |
| E2E-03 | Full suite, IdP specs included, green | E2E | one wrapper run through `179-e2e.sh` | — |

### Gate set for `179-gates.sh` (178's seventeen rows, plus)

| Row | Command | Why |
|-----|---------|-----|
| equivalence | `yarn check:schema-equivalence` | Frozen mode: `schema/` vs migrations (only once the freeze is merged) |
| coverage-tags | the D-21 script | E2E-01/02 |
| preregister-gone-self-test | the D-18 script's `--self-test` | the gate fires |
| test-keys-scope | a check that no non-test configuration names the committed test keys (D-19 hazard) | security |
| fn-closed | live probe: anonymous direct call to the served function is refused (J4) | D-25 addition |

Order the database rows as 178 does: reset → types on the fresh database → pgTAP → SQL lint → integration.

### Sampling rate

- **Per task commit:** the workspace's quick unit command for the files touched; `yarn lint:check` when a gate
  script, catalogue or route changes.
- **Per plan close:** `179-gates.sh <label>` then one full wrapper run through `179-e2e.sh`; until plan 6 also
  the bank-auth projects through a 179 copy of `178-bankauth.sh` (D-23), with the `db:start` output filtered.
- **Phase gate:** D-25's sequence on one head, then one full wrapper run with the IdP specs in the default suite.

### Wave 0 gaps

- [ ] `179-probe.mjs` (rows P1–P8) and its evidence file
- [ ] `179-gates.sh`, `179-e2e.sh`, `179-verdict.mjs`, `179-bankauth.sh` (until plan 6), `179-stack-probe.sh`
- [ ] Baseline runs on the unchanged tree: gates, full suite, both bank-auth projects
- [ ] `tests/tests/utils/mailedLink.ts` accepts `email_change`
- [ ] The mock issuer's selector (Pattern 9) — needed by every IdP scenario


---

## Per-task verification map

_Filled by the planner, 2026-10-21, from the 24 plans (65 tasks). Every task has an `<automated>` command
with a `<fails_when>` sibling stating its failing direction; none carries the `MISSING` sentinel, because every
test file a task's command reads is created by an earlier task of the same or an earlier plan (the red-first
cases are created and seen failing inside the task that then turns them green). The executor runs each block from
`$U/<plan>-t<N>-verify.sh` (`$U` = `tests/e2e-runs/179-unit`), as `179-EXECUTION-RULES.md` § *Searches and checks*
states; a block that holds a long gate is launched in the background and polled._

### Sampling, as planned

- **Per task:** the workspace's unit command for the files touched (`yarn workspace @openvaa/supabase test:unit`,
  `yarn workspace @openvaa/frontend test:unit`, `yarn test:unit:tests`), `yarn lint:check` where a gate, a
  catalogue or a route changes, and a red-first run kept under `$U/<plan>-t<N>-red.{log,exit}`.
- **Per held set:** a full run of the uncommitted tree through `tests/scripts/e2e-run.sh`, judged by
  `179-verdict.mjs control --full --same-projects-as <predecessor> --except <project>=<the tests the plan adds>`.
- **Per plan close:** `bash 179-e2e.sh <plan>-close` judged by `179-verdict.mjs e2e --same-projects-as`; until
  179-05 also `179-bankauth.sh <plan>-close` for a plan touching the schema, a function or the bank-auth specs.
- **Schema (179-03):** red pgTAP, `yarn check:schema-equivalence` (`EQUAL`), reset → types → pgTAP → SQL lint →
  integration through `179-gates.sh --rows`.
- **Phase gate (179-24):** every row of `179-gates.sh` (`ALL_ROWS`, read by the verdict) on one tree after an edge
  runtime restart, then one full wrapper run compared with `179-23-close` and with the baseline.

### Wave 0 gaps → the plans that close them

| Gap (from the research) | Closed by |
|---|---|
| `179-probe.mjs` (rows P1–P8, plus P9) and its evidence file | 179-02 |
| `179-gates.sh`, `179-e2e.sh`, `179-verdict.mjs`, `179-bankauth.sh`, `179-stack-probe.sh` | 179-01 |
| Baseline runs on the unchanged tree: gates, full suite, both bank-auth projects | 179-01 Task 1 |
| `tests/tests/utils/mailedLink.ts` accepts `email_change` | 179-04 Task 2 |
| The mock issuer's selector (Pattern 9) | 179-04 Task 1 |

### Per-task map

| Task ID | Plan | Wave | Type | What it proves | Requirements | Threat Ref | Test type | Command | Fails when | Status |
|---------|------|------|------|----------------|--------------|------------|-----------|---------|------------|--------|
| 179-01-T1 | 01 | 1 | auto | The precondition, the freeze check, the six drivers, and the base, the baseline run, the b… | E2E-03 | T-179-011, T-179-012… | gates, static gate | `$U/179-01-t1-verify.sh` (the task's `<automated>`) | Phase 178's summary or report not on the tree, a status other than `passed` or `human_needed`, or no tracked `178-UAT.md` beside `human_need… | ✅ green |
| 179-01-T2 | 01 | 1 | auto | The operator's rounds read by one command, and every name the plans build on checked again… | E2E-03 | T-179-011, T-179-012… | static check | `$U/179-01-t2-verify.sh` (the task's `<automated>`) | the reading script with a syntax error or untracked; the known document's sections C and D not read as recommended, or its section F not hal… | ✅ green |
| 179-02-T1 | 02 | 2 | auto | The probe, rows p1 to p7 and p9, run on the local stack | REG-04, REG-05 | T-179-021, T-179-022… | probe | `$U/179-02-t1-verify.sh` (the task's `<automated>`) | a syntax error; the script untracked; a call without a row or with an unknown one not exiting 2; a link type, the prefix, the password read … | ✅ green |
| 179-02-T2 | 02 | 2 | auto | Row p8 — the serve-and-restore cycle — and the findings with what follows from each row | REG-04, REG-05 | T-179-021, T-179-022… | probe | `$U/179-02-t2-verify.sh` (the task's `<automated>`) | the findings untracked or uncommitted; the p8 status other than 0; the heading or the p8 row missing; the stack probe not exiting 0 after th… | ✅ green |
| 179-03-T1 | 03 | 3 | auto | An identity-provider account claims nothing — red case, then the schema edit, its migratio… | REG-04, REG-05 | T-179-031, T-179-032… | pgTAP red/green, static gate | `$U/179-03-t1-verify.sh` (the task's `<automated>`) | no migration of that name, or one outside the five-digit rule; the section's title prefix missing; no red log, an empty one, a red status of… | ✅ green |
| 179-03-T2 | 03 | 3 | auto | The confirmation mail's slot — per address and per caller — red file, then the function, i… | REG-04, REG-05 | T-179-031, T-179-032… | pgTAP red/green, static gate | `$U/179-03-t2-verify.sh` (the task's `<automated>`) | the pgTAP file or the migration missing or misnamed; a title prefix, the privilege check or one of the two link functions missing from the f… | ✅ green |
| 179-03-T3 | 03 | 3 | auto | The caller-only fact `pending_email_taken` on the user-level read — red cases, then the fu… | REG-04, REG-05 | T-179-031, T-179-032… | E2E (close), gates, pgTAP red/green, static gate | `$U/179-03-t3-verify.sh` (the task's `<automated>`) | the migration missing or misnamed; the cases' title prefix missing; a red status of 0; a schema commit not descending from the red head; the… | ✅ green |
| 179-04-T1 | 04 | 4 | auto (tdd) | The mock issuer's per-test selector of identity and outcome, and the fixture over it | E2E-01, E2E-03 | T-179-041, T-179-042… | unit, harness unit, static gate | `$U/179-04-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0 (the cases tested nothing); an export or the loopback bind missing; a phase, threat or planning id in the header;… | ✅ green |
| 179-04-T2 | 04 | 4 | auto (tdd) | The shared link helper opens a mailed `email_change` link as received | E2E-01, E2E-03 | T-179-041, T-179-042… | unit, harness unit | `$U/179-04-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0; the type missing from the union or the list; the test file not naming the type; a failing case; or an uncommitte… | ✅ green |
| 179-04-T3 | 04 | 4 | auto | One issuer for both opt-in projects — the direct-call spec re-pointed at the mock's issuer… | E2E-01, E2E-03 | T-179-041, T-179-042… | E2E (close) | `$U/179-04-t3-verify.sh` (the task's `<automated>`) | the token builder not reading the mock's issuer; the synthetic second issuer still named; the driver without its held mode; a held run missi… | ✅ green |
| 179-05-T1 | 05 | 5 | auto | The wrapper prepares, serves and restores the identity provider's environment for every ru… | E2E-03, E2E-01 | T-179-051, T-179-052… | static check | `$U/179-05-t1-verify.sh` (the task's `<automated>`) | a syntax error; a named piece of the step missing from the wrapper; no row for status 9 in its table; a certificate-verification bypass name… | ✅ green |
| 179-05-T2 | 05 | 5 | auto | The opt-in conditionals leave the configuration; the test-keys check joins `lint:check`; t… | E2E-03, E2E-01 | T-179-051, T-179-052… | static gate | `$U/179-05-t2-verify.sh` (the task's `<automated>`) | the opt-in flag or a verification bypass still named; the journey without `ignoreHTTPSErrors`; the check script finding a needle or its self… | ✅ green |
| 179-05-T3 | 05 | 5 | auto | The runbook, the README and the driver's retirement; the close on the committed tree | E2E-03, E2E-01 | T-179-051, T-179-052… | E2E (close), lint | `$U/179-05-t3-verify.sh` (the task's `<automated>`) | the opt-in flag or a verification bypass named in the docs; the README not naming the certificate variable; the driver not marked retired; a… | ✅ green |
| 179-06-T1 | 06 | 6 | auto | Every new string of the phase in seven catalogues, the new namespace, the Swedish sign-in … | REG-08 | T-179-061, T-179-062… | static gate, catalogue check | `$U/179-06-t1-verify.sh` (the task's `<automated>`) | the key list or the writer untracked, or its `--check` finding a listed key missing or different in a locale; a locale without the new file;… | ✅ green |
| 179-06-T2 | 06 | 6 | auto (tdd) | The closed code set, the class table and the CI2 page — a route nothing links to yet — and… | REG-08 | T-179-061, T-179-062… | unit, E2E (held) | `$U/179-06-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0; a code spelling or an export missing; a CI2 route file missing, its load not using the class table or calling th… | ✅ green |
| 179-06-T3 | 06 | 6 | auto | The callback's failures land on CI2; the scenarios of a cancel and of a provider error; th… | REG-08 | T-179-061, T-179-062… | E2E (held), E2E (close) | `$U/179-06-t3-verify.sh` (the task's `<automated>`) | the callback without CI2 or the provider mapping, or still redirecting a failure to the legacy page; the deleted widening function still nam… | ✅ green |
| 179-07-T1 | 07 | 7 | auto (tdd) | The authorize endpoint refuses a type the matrix forbids, sets the type cookie, builds the… | REG-06 | T-179-071, T-179-072… | unit, E2E (held) | `$U/179-07-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0; a named piece missing from the endpoint; the endpoint still reading the client's redirect or challenge; the call… | ✅ green |
| 179-07-T2 | 07 | 7 | auto (tdd) | C's provider panel is a form that posts the type and leaves for the provider; its loading,… | REG-06 | T-179-071, T-179-072… | E2E (held), E2E (close) | `$U/179-07-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0; the form, its state attribute, the type, or the page-cache handler missing from C; C still navigating to the leg… | ✅ green |
| 179-08-T1 | 08 | 8 | auto (tdd) | The function's request and its closed results — `requestContract.ts` | REG-06, REG-04 | T-179-081, T-179-082… | unit | `$U/179-08-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0; an export or a result spelling missing; a Deno global or a remote import in the module; a failing test of the fu… | ✅ green |
| 179-08-T2 | 08 | 8 | auto (tdd) | The function's copy of the registration-mode rule, held to the 32-row table, and the entit… | REG-06, REG-04 | T-179-081, T-179-082… | unit | `$U/179-08-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0; the test not reading the table file; an export missing; a Deno global or remote import; a failing row or case; o… | ✅ green |
| 179-08-T3 | 08 | 8 | auto (tdd) | The placeholder domain in each runtime, held equal, and the frontend's address state | REG-06, REG-04 | T-179-081, T-179-082… | unit | `$U/179-08-t3-verify.sh` (the task's `<automated>`) | the red run's status was 0; a module without the constant; the conformance test not naming both other copies; the address-state exports miss… | ✅ green |
| 179-09-T1 | 09 | 9 | auto (tdd) | The self-registered organization's row — unconfirmed, nameless, removable | REG-04, REG-05, REG-07 | T-179-091, T-179-092… | unit | `$U/179-09-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0; an export, the unconfirmed row or the error code missing; a Deno global or remote import; a failing test; or an … | ✅ green |
| 179-09-T2 | 09 | 9 | auto (tdd) | The identity's own entity — a per-project, per-type record confirmed by a live grant | REG-04, REG-05, REG-07 | T-179-091, T-179-092… | unit | `$U/179-09-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0; an export or the error code missing; the two-candidate-grant case or the organization half of the invariant miss… | ✅ green |
| 179-09-T3 | 09 | 9 | auto (tdd) | The account's metadata without the identity claims, and the server's credential compared i… | REG-04, REG-05, REG-07 | T-179-091, T-179-092… | unit | `$U/179-09-t3-verify.sh` (the task's `<automated>`) | the red run's status was 0; an export missing; a claims object spread into the metadata; a Deno global or remote import; a failing test; or … | ✅ green |
| 179-10-T1 | 10 | 10 | auto (tdd) | The confirm-address request, its four answers, and the recipe over injected effects | REG-04 | T-179-101, T-179-102… | unit | `$U/179-10-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0; the arm, a body or an export missing; the placeholder check missing; a Deno global or remote import; a failing t… | ✅ green |
| 179-10-T2 | 10 | 10 | auto (tdd) | The address-confirmation mail in seven locales and the `email_change` link type | REG-04 | T-179-101, T-179-102… | unit | `$U/179-10-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0; the template set, its renderer or the link type missing; the review todo not naming the mail; a failing complete… | ✅ green |
| 179-10-T3 | 10 | 10 | auto | The handler wires the operation to the caller's token, the slot, the auth service and the … | REG-04 | T-179-101, T-179-102… | unit, E2E (held), E2E (close) | `$U/179-10-t3-verify.sh` (the task's `<automated>`) | a piece of the wiring missing from the handler; the conformance test not asserting the admin-update rule; the probe row missing or the probe… | ✅ green |
| 179-11-T1 | 11 | 11 | auto (tdd) | The user-level facts — address state, pending address, unnamed own organization, taken pen… | REG-04, REG-05 | T-179-111, T-179-112… | unit, E2E (held), static gate | `$U/179-11-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0; a member missing from the type; the adapter not deriving the state or not parsing the taken fact; F's predicate … | ✅ green |
| 179-11-T2 | 11 | 11 | auto (tdd) | The arrival marker's cookie name, and the writer's confirmation request | REG-04, REG-05 | T-179-111, T-179-112… | unit, static gate | `$U/179-11-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0; the cookie name missing from the map or the pin; the writer method missing from the type, the base or the adapte… | ✅ green |
| 179-11-T3 | 11 | 11 | auto (tdd) | CI1's one server endpoint — save, resend, acknowledge — over the server-side writer | REG-04, REG-05 | T-179-111, T-179-112… | unit, E2E (close), lint | `$U/179-11-t3-verify.sh` (the task's `<automated>`) | the red run's status was 0; the handler or an intent or answer missing; the route untracked or not named in the universal routes; a failing … | ✅ green |
| 179-12-T1 | 12 | 12 | auto (tdd) | `EmailEntry` shows a server's answer at its address field | REG-04, REG-05, REG-07 | T-179-121, T-179-122… | unit | `$U/179-12-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0; the export or the reason attribute missing; the test not calling it; a failing unit test; or an uncommitted chan… | ✅ green |
| 179-12-T2 | 12 | 12 | auto (tdd) | CI1's view in every variant, with its events | REG-04, REG-05, REG-07 | T-179-121, T-179-122… | unit, lint | `$U/179-12-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0; a state attribute, a test id, the endpoint, the rerun, the field error or the resend constant missing; a reactiv… | ✅ green |
| 179-13-T1 | 13 | 13 | auto | The entry point wired to the contract, the matrix authority, the passwordless recipe, the … | REG-04, REG-06, REG-07 | T-179-131, T-179-132… | static check | `$U/179-13-t1-verify.sh` (the task's `<automated>`) | a module the entry point must call not named in it; the invite recipe missing; an admin user creation or a site-URL read still present; or t… | ✅ green |
| 179-13-T2 | 13 | 13 | auto (tdd) | No identity claims in `app_metadata`: the claim configuration loses its extraction and the… | REG-04, REG-06, REG-07 | T-179-131, T-179-132… | static check | `$U/179-13-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0; the extraction still named in the claim configuration; the test not naming the claim it asserts absent; or a fro… | ✅ green |
| 179-13-T3 | 13 | 13 | auto | The conformance assertions, the direct-call spec's new expectations, the held run and the … | REG-04, REG-06, REG-07 | T-179-131, T-179-132… | unit, E2E (close), lint | `$U/179-13-t3-verify.sh` (the task's `<automated>`) | a conformance assertion missing; the spec not asserting both claims undefined, or not asserting the two results or the refused mode; a faili… | ✅ green |
| 179-14-T1 | 14 | 14 | tracer | End-to-end "a new candidate registers with the identity provider" — the creating callback,… | REG-04, REG-05, E2E-01 | T-179-141, T-179-142… | unit, E2E (held) | `$U/179-14-t1-verify.sh` (the task's `<automated>`) | the callback missing a piece of the creating path or still writing the ID-token cookie; the gate facts type or the order missing; the view n… | ✅ green |
| 179-14-T2 | 14 | 14 | auto | CI1's first scan entry in both themes, the scan-wiring list, and the close | REG-04, REG-05, E2E-01 | T-179-141, T-179-142… | E2E (close), lint | `$U/179-14-t2-verify.sh` (the task's `<automated>`) | the entry or the declarer missing; the wiring list not naming the spec; `lint:check` red; a close run red, void, stale or not exactly two te… | ✅ green |
| 179-15-T1 | 15 | 15 | auto (tdd) | The function requires the server's credential first, takes its project from the request on… | REG-04, REG-06 | T-179-151, T-179-152… | static check | `$U/179-15-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0; the credential not checked before the body, the secret not read, the environment project still read or the legac… | ✅ green |
| 179-15-T2 | 15 | 15 | auto (tdd) | The callback sends the credential, the wrapper generates it per run, the direct-call spec … | REG-04, REG-06 | T-179-151, T-179-152… | unit, E2E (held), lint | `$U/179-15-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0; the header or the variable missing from the callback, the constants, the template, the wrapper or the spec; the … | ✅ green |
| 179-15-T3 | 15 | 15 | auto | The live probe of the closed function, the docs and todos, and the close | REG-04, REG-06 | T-179-151, T-179-152… | E2E (close), gates | `$U/179-15-t3-verify.sh` (the task's `<automated>`) | the row or the probe check missing; the docs not naming the variable; a gate row not 0 or a stale gate run; a close run red, void, stale or … | ✅ green |
| 179-16-T1 | 16 | 16 | auto (tdd) | The one list widened, the types named, and C's type group | REG-06, REG-07, E2E-02 | T-179-161, T-179-162… | static check | `$U/179-16-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0; the types function missing; the candidates-only condition still in the list; a test id or the types function mis… | ✅ green |
| 179-16-T2 | 16 | 16 | auto | The organization scenario, the other-type scenario, the closed-project spec's new expectat… | REG-06, REG-07, E2E-02 | T-179-161, T-179-162… | unit, E2E (held) | `$U/179-16-t2-verify.sh` (the task's `<automated>`) | a scenario, its tag or a scan entry missing; the closed-project spec without the new entry; a held run not green or not grown by exactly the… | ✅ green |
| 179-16-T3 | 16 | 16 | auto | The close | REG-06, REG-07, E2E-02 | T-179-161, T-179-162… | E2E (close), lint | `$U/179-16-t3-verify.sh` (the task's `<automated>`) | the close run red, void, stale or with other totals than the held run; or `lint:check` red. | ✅ green |
| 179-17-T1 | 17 | 17 | auto (tdd) | `NothingToEdit`'s sentence for an account with no address shown, and F's first sentence re… | REG-05 | T-179-171, T-179-172… | static check | `$U/179-17-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0; the component without the new sentence; the English sentence not reworded; or the review todo not naming it. | ✅ green |
| 179-17-T2 | 17 | 17 | auto | Scenarios 3 and 4 and the removed-grant scenario, scan entries 10 and 12; the held run, th… | REG-05 | T-179-171, T-179-172… | unit, E2E (held), E2E (close) | `$U/179-17-t2-verify.sh` (the task's `<automated>`) | a scan entry or the removed-grant scenario missing; a held run not green or not exactly seven tests larger in the identity-provider project;… | ✅ green |
| 179-18-T1 | 18 | 18 | auto (tdd) | The pending reminder in the home's note | REG-05, REG-04 | T-179-181, T-179-182… | static check | `$U/179-18-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0, or a test id, the settings link or the state read missing from the home page. | ✅ green |
| 179-18-T2 | 18 | 18 | auto (tdd) | Settings for a pending address — the address as pending, Send again, another address | REG-05, REG-04 | T-179-181, T-179-182… | static check | `$U/179-18-t2-verify.sh` (the task's `<automated>`) | the red run's status was 0, or an id, the info key, the field-error call or the state read missing from the settings page. | ✅ green |
| 179-18-T3 | 18 | 18 | auto | Scenario 8, the settings change of address, scans 11, 13 and 14, phone checks; the held ru… | REG-05, REG-04 | T-179-181, T-179-182… | unit, E2E (held), E2E (close) | `$U/179-18-t3-verify.sh` (the task's `<automated>`) | a scan entry or the slot release missing; a held run not green or not exactly twelve tests larger; a close run red, void, stale or with othe… | ✅ green |
| 179-19-T1 | 19 | 19 | auto (tdd) | The mailed links' callback for `email_change` — the guard, the failure with a session, the… | REG-04, E2E-01 | T-179-191, T-179-192… | static check | `$U/179-19-t1-verify.sh` (the task's `<automated>`) | the red run's status was 0; the callback without its `email_change` arm or the session check; or a login notice that does not match P4's bra… | ✅ green |
| 179-19-T2 | 19 | 19 | auto | The race of two accounts for one address, its no-session variant, and the first sign-in by… | REG-04, E2E-01 | T-179-191, T-179-192… | E2E (held) | `$U/179-19-t2-verify.sh` (the task's `<automated>`) | the tagged tests fewer than the plans so far have added; the race or the sign-in scenario missing; a held run not green or not exactly three… | ✅ green |
| 179-19-T3 | 19 | 19 | auto | The close | REG-04, E2E-01 | T-179-191, T-179-192… | E2E (close), lint | `$U/179-19-t3-verify.sh` (the task's `<automated>`) | the close run red, void, stale or with other totals; or `lint:check` red. | ✅ green |
| 179-20-T1 | 20 | 20 | auto | Scenario 7, the switched-off mode, the two-candidate-grant case — with what was written as… | REG-06, REG-08 | T-179-201, T-179-202 | E2E (held) | `$U/179-20-t1-verify.sh` (the task's `<automated>`) | a step or the refusal's code missing; a held run not green or not exactly three tests larger; or an uncommitted change after the commit. | ✅ green |
| 179-20-T2 | 20 | 20 | auto | The close | REG-06, REG-08 | T-179-201, T-179-202 | E2E (close) | `$U/179-20-t2-verify.sh` (the task's `<automated>`) | the close run red, void, stale or with other totals than the held run. | ✅ green |
| 179-21-T1 | 21 | 21 | auto | The legacy routes, API routes, writer methods, context members, cookie, route keys, pagevi… | REG-14 | T-179-211, T-179-212 | static check | `$U/179-21-t1-verify.sh` (the task's `<automated>`) | the deletion set empty or missing, or a file it names still tracked; a deleted path still present; or a removed key, cookie, member, route o… | ✅ green |
| 179-21-T2 | 21 | 21 | auto | The catalogue namespace and the one legacy error key removed in seven locales; the comment… | REG-14 | T-179-211, T-179-212 | static gate, catalogue check | `$U/179-21-t2-verify.sh` (the task's `<automated>`) | the removal list untracked or the writer's check finding a removed key or namespace; a legacy catalogue file still present; the error key in… | ✅ green |
| 179-21-T3 | 21 | 21 | auto | The suite's references removed; the held run, the commit and the close | REG-14 | T-179-211, T-179-212 | unit, E2E (close), harness unit, lint | `$U/179-21-t3-verify.sh` (the task's `<automated>`) | the legacy fixture present; the stem still named under `tests/tests`; a unit suite or `lint:check` red; no held run; a close run red, void, … | ✅ green |
| 179-22-T1 | 22 | 22 | auto | The docs pages rewritten and regenerated; the tests' README and runbook; the database skil… | REG-14 | T-179-221, T-179-222 | static check | `$U/179-22-t1-verify.sh` (the task's `<automated>`) | the bank-authentication page not describing the function, the address states or the codes; the notification's generated page present; the st… | ✅ green |
| 179-22-T2 | 22 | 22 | auto (tdd) | The REG-14 check in `lint:check`, self-tested, its rule decided | REG-14 | T-179-221, T-179-222 | lint, static gate | `$U/179-22-t2-verify.sh` (the task's `<automated>`) | the script or a fixture untracked; the self-test failing (the rule fires wrongly or not at all); a finding on the tree; an unknown flag not … | ✅ green |
| 179-22-T3 | 22 | 22 | auto | The gate rows and the close | REG-14 | T-179-221, T-179-222 | gates | `$U/179-22-t3-verify.sh` (the task's `<automated>`) | a row not 0, a subset that is not exactly the three rows, or a stale gate run. | ✅ green |
| 179-23-T1 | 23 | 23 | auto (tdd) | The tag census of the default run, self-tested, as a gate row | E2E-01, E2E-02 | T-179-231, T-179-232 | static gate | `$U/179-23-t1-verify.sh` (the task's `<automated>`) | a tag or the JSON reporter missing from the script; the self-test failing; an unknown flag not exiting 2; the script not in `package.json`; … | ✅ green |
| 179-23-T2 | 23 | 23 | auto | The tags on the covering tests; the held run and the commit | E2E-01, E2E-02 | T-179-231, T-179-232 | E2E (held) | `$U/179-23-t2-verify.sh` (the task's `<automated>`) | a tag missing from its spec; the census naming a tag with no test; a held run not green or with other totals; or an uncommitted change. | ✅ green |
| 179-23-T3 | 23 | 23 | auto | The todos closed, re-anchored and filed; the close | E2E-01, E2E-02 | T-179-231, T-179-232 | E2E (close), gates | `$U/179-23-t3-verify.sh` (the task's `<automated>`) | a todo not moved, still in `pending/` or without a line naming the phase's work; the nonce todo not re-anchored; a new todo untracked; the c… | ✅ green |
| 179-24-T1 | 24 | 24 | auto | The whole difference read against the code review checklist; findings committed before any… | E2E-03, E2E-01, E2E-02, REG-04, REG-05, REG-06, REG-07, REG-08, REG-14 | T-179-241, T-179-242… | static gate | `$U/179-24-t1-verify.sh` (the task's `<automated>`) | no summary or no checklist section in it; a comment-hygiene finding; a `scope` refusal (a path the phase must leave alone was changed); or a… | ✅ green (scope refusal is `CLAUDE.md` only, operator-requested orchestrator edits 6de18b9c6, f99182682) |
| 179-24-T2 | 24 | 24 | auto | Every gate row on one tree, the edge runtime restarted, one full run compared with its pre… | E2E-03, E2E-01, E2E-02, REG-04, REG-05, REG-06, REG-07, REG-08, REG-14 | T-179-241, T-179-242… | E2E (close), gates | `$U/179-24-t2-verify.sh` (the task's `<automated>`) | a gate row not 0 or a stale or partial gate run; the final run red, void, stale, without either identity-provider project fully passed, or d… | ✅ green |
| 179-24-T3 | 24 | 24 | auto | The closing summary — the requirement-to-test map, the checks for a person, the flagged as… | E2E-03, E2E-01, E2E-02, REG-04, REG-05, REG-06, REG-07, REG-08, REG-14 | T-179-241, T-179-242… | static check | `$U/179-24-t3-verify.sh` (the task's `<automated>`) | the summary untracked or uncommitted, or without the final run, a requirement ID, the backstop list, the flagged assumptions or the user-set… | ✅ green |

### Manual-only verifications (backstop — a person, carried to verification as `human_needed` when unconfirmed)

| Behaviour | Requirement / UI row | Why not automated | Instruction |
|---|---|---|---|
| The new strings in six locales at 320 px, the type answers and CI2's titles | UI long-text | readability and grammar need a native reader | the native-review todo `2026-10-21-179-native-speaker-review-identity-provider-strings.md` |
| A long address on CI1, the reminder, settings wraps inside the column | UI long-text | visual judgement | open each at 320 px with a 60-character local part |
| CI1's and settings' address fields offer the user's saved addresses | UI autofill | password managers are outside the browser automation | two browsers, one manager |
| C → provider → CI1 → G by keyboard and with a screen reader, `en` | UI keyboard | assistive-technology output | walk it with the mock issuer |
| CI1 V2 at 320 px with three locales of name fields | UI ui | the length of a form is a judgement | the phone check measures overflow only |

### Flagged assumptions carried to verification

- The Signicat leg (research A5): no mock exists; unit tests of the authorize endpoint and the callback only.
- The page-cache restore after Back from the provider (UI-SPEC N-5): the `pageshow` handler is unit-tested.
- U-16 without a session: decided by probe row P4; with `P4-DISTINGUISHABLE: no` the generic notice is shown.
- CI's run of the default-on identity-provider specs (item PL-16): not observed; filed as a todo by 179-23.

### Validation sign-off

- [x] All tasks have an `<automated>` verify with a `<fails_when>` failing direction
- [x] Sampling continuity: no three consecutive tasks without an automated verify
- [x] Wave 0 covers every gap the research names (table above)
- [x] No watch-mode flags; long gates in the background
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** planned 2026-10-21; `wave_0_complete` is set by execution after 179-05.

## Validation Audit 2026-10-22

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
