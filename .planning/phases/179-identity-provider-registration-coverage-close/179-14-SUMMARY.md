---
phase: 179-identity-provider-registration-coverage-close
plan: 14
subsystem: contestant-app
tags: [oidc, identity-provider, gates, tracer, e2e, playwright, a11y]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-06 CI2 and the closed codes, the identity-provider template; 179-07 the authorize endpoint and oidc_entity_type; 179-10 confirm-address; 179-11 the user-level address state, COOKIE.identityProviderArrival and CI1's endpoint; 179-12 IdentityProviderGate.svelte; 179-13 identity-callback on the new contract"
provides:
  - "The creating callback: re-checks the type cookie against the matrix, invokes identity-callback with { id_token, project_id, entity_type }, verifyOtp over the answered token, sets identity_provider_arrival (created | existing), redirects 303 to ContestantAppHome; every failure is CI2 with one closed code; no id_token cookie"
  - "ContestantGateFacts { user, arrival, answersLocked }; IdentityProviderArrival; the gate order setPassword, identityProvider, termsOfUse; GATE_VIEWS.identityProvider = IdentityProviderGate"
  - "The protected layout reads the settings once before the gates and the marker with cookies.get; a gated answer is { gate, user, arrival }"
  - "E2E: the tracer scenario (@reg-idp), the scan entry identity-provider-gate-new-candidate in both themes; contestantIdentityProviderGate.fixture.ts; identityProviderFlow steps freshAddress, expectOwnEntityHome, confirmationLinkToOpen, expectAtAppRoot; testIds.contestant.identityProviderGate; SupabaseAdminClient.removeOwnEntitiesOfUsersByEmailPrefix"
  - "The bank-auth journey's spec, setup, teardown, fixture, constants and three projects are gone; data-setup-identity-provider sits at the tail of the perm chain"
affects: [179-15, 179-16, 179-17, 179-18, 179-19, 179-21, 179-22, 179-23, 179-24]

tech-stack:
  added: []
  patterns:
    - "A gate predicate receives facts, not the user alone: the user-level data plus request facts that can only add a gate"
    - "An E2E teardown removes the entities a function created by the editor grant of the users under the spec's prefixes, restricted to rows with no external id"

key-files:
  created:
    - apps/frontend/src/routes/contestant/(protected)/identityProviderLayout.svelte.test.ts
    - tests/tests/fixtures/contestant/contestantIdentityProviderGate.fixture.ts
  modified:
    - apps/frontend/src/routes/api/oidc/callback/+server.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
    - apps/frontend/src/lib/contestant/gates/gates.ts
    - apps/frontend/src/lib/contestant/gates/gates.test.ts
    - apps/frontend/src/lib/contestant/gates/gateViews.ts
    - apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
    - apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
    - apps/frontend/src/routes/contestant/(protected)/layout.tracking.test.ts
    - apps/frontend/src/routes/contestant/(protected)/setPasswordLayout.svelte.test.ts
    - apps/frontend/eslint.config.mjs
    - apps/frontend/src/routes/contestant/README.md
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/bank-authentication/+page.md"
    - tests/playwright.config.ts
    - tests/tests/specs/contestant/contestant-identity-provider.spec.ts
    - tests/tests/fixtures/shared/identityProviderFlow.fixture.ts
    - tests/tests/setup/contestant/identity-provider.setup.ts
    - tests/tests/setup/contestant/identity-provider.teardown.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/utils/privacyAllowlists.ts
    - tests/tests/utils/privacyAllowlists.test.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - scripts/assert-a11y-scan-wiring.mjs
  deleted:
    - tests/tests/specs/contestant/contestant-bank-auth-journey.spec.ts
    - tests/tests/setup/contestant/bank-auth-journey.setup.ts
    - tests/tests/setup/contestant/bank-auth-journey.teardown.ts
    - tests/tests/fixtures/contestant/contestant-bank-auth-journey.ts
    - tests/tests/utils/bankAuthJourneyConstants.ts

key-decisions:
  - "The identity-provider predicate's returning disjunct reads the address state as exactly pending or proved, so an unknown state with a forged marker adds nothing"
  - "The callback resolves the project by building the anonymous data provider, whose construction refuses an unset or malformed PUBLIC_PROJECT_ID; a refusal is configuration_error"
  - "The callback reads a failed function answer's result from the FunctionsHttpError's context Response; an unreachable function, a non-JSON body and a success status without a token are registration_failed"
  - "A verifyOtp that answers no session is a failure, as an error is"
  - "The callback joins the adapter-boundary allowlist: it must invoke the function and verify the token on locals.supabase, the request's cookie-bearing client"
  - "The identity-provider teardown removes function-created entities through a new admin-client method keyed on the editor grants of users under the spec's prefixes, restricted to rows with no external id"

requirements-completed: [REG-04]

actuals:
  tokens: 47158
  tasks: 2
  commits: 3
plan_head_before: 52947a4f7dbe4cdc5ca8ff48a540055241afe5df
plan_head_after: 8afc681df79a649e0ab4f1b2a2291db221f2d858

metrics:
  duration: "about 1 h 45 min (04:22Z to about 06:05Z host clock, 2026-10-22), including a 24-minute host sleep"
  completed: 2026-10-22
---

# Phase 179 Plan 14: The tracer — a new candidate registers with the identity provider Summary

**The identity provider's callback now creates: it checks the type against the matrix again, invokes `identity-callback` with the token, the project and the type, signs the user in from the token the function answers with, leaves the `identity_provider_arrival` marker and lands the user on the app root. There the protected layout, deciding its gates on `ContestantGateFacts`, shows the identity provider's view between the set-password view and the terms of use. One E2E test walks every layer: the mock issuer, the callback, the function, the session, the view, the address confirmation and its mail, the terms, the candidate's home and the mailed link that proves the address, after which the set-password view asks for a password. The bank-auth journey and its three projects are gone.**

## Task commits

| Task | Commit | What |
|---|---|---|
| 1 | 388c76328 | `feat(179-14)`: the callback, the gates, the layout, the tracer's scenario and fixtures, the teardown, the allowlist, the journey's removal — one held set, committed after `179-14-held` was green |
| (docs) | 7356b57f5 | `docs(179-14)`: the bank-authentication guide's callback, address and function steps, and the contestant routes README's gate sentence |
| 2 | 8afc681df | `test(179-14)`: the scan entry `identity-provider-gate-new-candidate` in both themes, and check 4a of the scan-wiring guard |

## What was built

### The callback's success path (`routes/api/oidc/callback/+server.ts`)

After the binding check, the code exchange and the token check, which are unchanged:

1. The type cookie is read and deleted at entry, on every path.
2. The settings are read through `createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) })`, as the authorize endpoint reads them. Building the provider resolves the project: an unset or malformed `PUBLIC_PROJECT_ID` is `configuration_error`. A failed read is `registration_failed`.
3. The type is resolved over `getServedEntityTypes` filtered by `isRegistrationModeAllowed(…, identity_provider)`: a named type must be in that list, and an absent one is taken only when the list has exactly one. Otherwise `mode_not_allowed`, before anything is invoked.
4. `locals.supabase.functions.invoke('identity-callback', { body: { id_token, project_id, entity_type } })`. A failed answer's `result` is read from the error's `context` Response and mapped by `oidcErrorFromFunction`. A success needs `result` ∈ {`created`, `found`, `no_entity`} and a non-empty `token`; anything else is `registration_failed` (or the mapped code for a failed result).
5. `verifyOtp({ token_hash: token, type: 'magiclink' })` on the request's client. An error, a rejection or no session is `registration_failed`.
6. `identity_provider_arrival` is set to `created` for `created` and `existing` for `found` and `no_entity`, `httpOnly`, `secure`, `sameSite: 'lax'`, `path: '/'`, 600 s.
7. 303 to `ContestantAppHome`.

The `id_token` cookie is no longer written. Every failure of the registration part logs only the closed code.

### The gates (`lib/contestant/gates/gates.ts`)

- `ContestantGateFacts = { user, arrival, answersLocked }`; `IdentityProviderArrival = 'created' | 'existing' | null`.
- Order: `setPassword` (`passwordSet === false && addressState === 'proved'`), `identityProvider`, `termsOfUse`.
- `identityProvider`: `addressState === 'none' || (ownOrganizationUnnamed === true && answersLocked !== true) || (arrival === 'existing' && (addressState === 'pending' || addressState === 'proved'))`. The marker is a disjunct alone: it adds the gate and never removes it.
- The contract's point 2 now says gates are decided on the user-level data and two facts of the request, never on an entity, and a point 3 says the marker only adds.

### The layout's load (`routes/contestant/(protected)/+layout.server.ts`)

It takes `cookies` as well. After the user-level data it reads the settings once (fail-soft, as before), takes `answersLocked` from `access.answersLocked`, reads the marker with `cookies.get(COOKIE.identityProviderArrival)` (anything but `created` or `existing` is `null`), and asks `firstNeededGate`. A gated answer is `{ gate, user, arrival }`. Stage 4 uses the same settings for the served types. It reads no `url` or `route` property.

### The scenario and the scan (`contestant-identity-provider.spec.ts`)

- **Tracer** (`@reg-idp`): mint (`success`) → start from C → CI1 with `data-variant="new"`, `data-address-state="none"`, `data-asks="email"`, its `<h1>` focused → a fresh `identity-provider-` address typed twice → Continue → G shown, CI1 and F absent → G accepted → the home of the candidate the identity's account edits → the confirmation mail's one link, type `email_change`, opened as received → F shown at the app root, naming the typed address.
- **Scan** `identity-provider-gate-new-candidate` through `declareScans`, light and dark; each twin mints its own identity and waits for CI1 with `data-asks="email"`.

## Runs

| Run | Tree | Result | Verdict |
|---|---|---|---|
| `179-e2e/179-14-red` | spec, fixtures, setup, teardown and config changes held; the app at HEAD 52947a4f7 (app-side files restored after the run, byte-identical) | exit 1: 485 tests (the one project pulls the perm chain it now depends on), 484 passed, 1 failed: the tracer, `expect(locator).toBeVisible() failed` on CI1. Not void | plan's form: **FAIL** (see Deviation 1); restated `--dirty-only tests/ --red "goes straight to editing"`: **PASS** |
| `179-e2e/179-14-held` | the held set at 52947a4f7 | **570/570**, wrapper exit 0, `restore: ok`, not void | plan's form: **FAIL** at the path form only; restated (`apps/frontend/src/`, `apps/frontend/eslint.config.mjs`, `tests/`): **PASS**, 131 projects, `contestant-identity-provider` 2 → 3, `bank-auth-journey` 1 → 0, `data-setup-bank-auth-journey` 1 → 0, `data-teardown-bank-auth-journey` 1 → 0, all others equal to `179-13-close`; `--were-red-in 179-14-red`: the tracer was red and passed |
| `179-e2e/179-14-close` | committed 8afc681df | **VOID**: wrapper and driver exit 8, `VOID-host-suspend.txt` (a 125 s gap from 05:11:51Z). `pmset -g log`: `Entering Sleep state due to 'Clamshell Sleep' … Using Batt` at 08:11:49 local. Kept, not diagnosed | — |
| `179-e2e/179-14-close-r2` | committed 8afc681df | **572/572**, driver and wrapper exit 0, `restore: ok`, `sleep_entries_in_window: 0`, AC power | `179-verdict e2e 179-14-close-r2 --same-projects-as 179-14-held --except contestant-identity-provider=2`: **PASS**, 128 projects, `contestant-identity-provider` 3 → 5 |

Totals: 179-13-close 572 → held 570 (journey trio −3, tracer +1) → close 572 (scan twins +2).

Unit and lint gates:

- `yarn workspace @openvaa/frontend test:unit`: 265 files passed, 1 skipped; 6389 tests passed, 32 skipped (`179-unit/179-14-t1-frontend-unit`).
- Negative control of the callback cases: the new `callback-endpoint.test.ts` against HEAD's route exits 1 with 36 of 63 failing (`179-unit/179-14-callback-control.{log,exit}`); the route restored and checked byte-identical.
- `yarn lint:check`: exit 0 on the Task 1 tree (`179-14-t1-lint-r3`, after two fixes, Deviation 4) and on the Task 2 tree (`179-14-t2-lint-r2`, after one fix, Deviation 5). `tests/tests/utils/privacyAllowlists.test.ts` and `mailedLink.test.ts`: 63 passed.
- Held copies: 21 files kept as `tests/e2e-runs/179-e2e/179-14-held.<path>.kept`, each byte-identical (`cmp`) to what 388c76328 committed; the five deletions are in that commit.

## Verify blocks (`tests/e2e-runs/179-unit/179-14-t{1,2}-verify*.{sh,log,exit,head}`)

- **Task 1** as written: exit 1, at the red control (`--red "@reg-idp"` names the two failure-screen tests too, which passed; Deviation 1). Restated (`--red "goes straight to editing"`, `--dirty-only tests/` for the red tree, `yarn` for `yarn -s`): exit **0** at 388c76328 and again at 8afc681df (`-restated-final`).
- **Task 2** as written: exit 1 — `yarn -s` is refused, and `179-14-close` is void. Restated (`yarn lint:check`, `179-14-close-r2`): exit **0** at 8afc681df.

## What the tracer observed

Observed in `179-14-held` and `179-14-close-r2` (each passed the tracer):

- The callback's success path end to end against the served `identity-callback`: the user returned signed in, at the app root, with CI1 as V1 (`new` / `none` / `email`) and its heading focused after the full load.
- **CI1's endpoint, served for the first time** (carried item 8): Continue with an address made the view call `invalidateAll` — the view does that only on `saved` — and the rerun load returned G, not CI1 again and not F. So the address was recorded as pending (the identity-provider gate no longer applied) and the account still read as having no proved address (no F). The confirmation mail reached the typed address with exactly one link of type `email_change` and the callback path for `en`. Not observed directly: that the endpoint cleared the arrival marker (with `created` the marker adds no gate either way).
- G's acceptance led to the home of exactly the one candidate the identity's account edits (read through its editor grant).
- **The confirmation link's landing** (U-15 ★): opened as received, it landed on the app root through `/api/auth/callback`'s default arm, signed in, and F was shown naming the typed address — so the address became the sign-in address and the account had no password. The address-taken landing stays flagged for 179-19.
- The two scan twins reached CI1 V1 through the provider each with their own identity, and passed axe in both themes.

Inferred, not observed: that `verifyOtp` with no session cannot happen for a magic link (handled as a failure anyway); that the endpoint's `in-use` and `refused` arms behave as unit-tested when served.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] The red control's substring.** `--red "@reg-idp"` requires every test with the tag to fail, and the spec's two failure-screen tests carry it and pass. The control was judged on the new test's own words, `--red "goes straight to editing"`; both outputs are kept (`_drivers/179-14-red.verdict-{plan,restated}.log`). The red tree held the app at HEAD (the application files were set aside and restored byte-identical), so its `--dirty-only` is `tests/`.

**2. [Rule 3 - Blocking] The adapter-boundary allowlist.** `locals.supabase.functions.invoke` and `locals.supabase.auth.verifyOtp` in the callback trip the boundary guard. The callback joins `ADAPTER_BOUNDARY_ALLOWLIST` in `apps/frontend/eslint.config.mjs` (not on the plan's list), annotated as the sign-in screens' entries are: the session must be established on the request's own client and `DataWriter` has no method for either call. 179-21 lists this file and removes the preregister entry. The held verdict therefore also names `--dirty-only apps/frontend/eslint.config.mjs`.

**3. [Rule 3 - Blocking] `layout.tracking.test.ts`'s event-reads assertion.** The test asserts which members the load takes from the event. Taking `cookies` adds one member, so the expected list became `['cookies', 'fetch', 'locals', 'params']` and the fake event got a `cookies` stub. The tracked-URL and param-read assertions, and the three negative controls, are unchanged and pass.

**4. [Rule 1 - Bug] Two lint findings before the held run.** A `Record<string, string>` widening in a new `layout.server.test.ts` case (svelte-check), and the no-candidate-app-names guard on the first name of the home step (`expectOwnCandidateHome`, renamed `expectOwnEntityHome`) and its `/candidate/` URL literal (now built from an entity-type variable, as `contestantEntityHomePage` does).

**5. [Rule 1 - Bug] The scan entry needed `fixture: 'raw'`** (`ContestantAxeRoute` requires it); found by `typecheck:tests` in Task 2's first `lint:check`.

**6. [Rule 3 - Recurring] `yarn -s`** refused by Yarn 4.18.1; both forms of each verify block kept.

**7. [Rule 2 - Documentation made false] The bank-authentication guide and the routes README.** The guide's callback step said the route stores the ID token and redirects to `/contestant/preregister`, and its function section listed `hetu`/`birthdate` in `app_metadata`, `SITE_URL`, and a project check that is gone (carried item 6). The callback, address and confirmation steps and the function section were rewritten; `apps/frontend/src/routes/contestant/README.md`'s gate sentence names the three gates. One docs commit, 7356b57f5, after Task 1.

### The void close run

`179-14-close` was voided by the wrapper (exit 8, `VOID-host-suspend.txt`): the host entered clamshell sleep on battery at 05:11:49Z for 127 s, then slept again until a lid wake at 05:35:51Z on AC. Kept and not diagnosed; made again as `179-14-close-r2`, green with no sleep in its window. The battery stayed at 100 %.

**Files touched that the plan did not list:** `apps/frontend/eslint.config.mjs` (Deviation 2), `apps/frontend/src/routes/contestant/README.md` and the bank-authentication guide (Deviation 7), `tests/tests/utils/supabaseAdminClient.ts` and `tests/tests/setup/contestant/identity-provider.teardown.ts` (carried item 2), `tests/tests/utils/privacyAllowlists.ts` and its test (carried item 1).

## Carried items

1. **(179-11) `identity_provider_arrival` in the cookie allowlist** — settled in 388c76328, the commit that first sets it (`privacyAllowlists.ts` and its test).
2. **(179-06) The teardown and function-created rows** — settled: `SupabaseAdminClient.removeOwnEntitiesOfUsersByEmailPrefix(prefix)` deletes, in the suite's project, each candidate and organization a user under the prefix edits that has no external id, with its grants; the identity-provider setup and teardown call it for both prefixes before removing the users.
3. **(179-07) The journey spec's stale start** — settled by deleting the spec with its setup, teardown, fixture, constants and projects.
4. **(179-05) `PLAYWRIGHT_BANK_AUTH` mentions** — the journey setup and teardown are deleted. `tests/tests/setup/shared/base.setup.ts` (its `e2e-bankauth-` sweep comment also names the deleted `data-setup-bank-auth-journey`) and the `179-e2e.sh` header step (e) are not this plan's files: **179-24**. `tests/tests/setup/shared/assertTeardown.ts`'s docblock names the deleted `bank-auth-journey.teardown.ts`: **179-24**.
5. **(179-08) The placeholder domain in the test tree** — `bankAuthJourneyConstants.ts` is deleted. `identityProviderFlow.fixture.ts` keeps its `PLACEHOLDER_EMAIL_DOMAIN`: the frontend copy imports through `$lib` (not resolvable from `tests/`), the Deno copy would need a `.ts`-extension import the tests' tsconfig does not allow, and bringing the fixture under the copies-equal check means editing `identity-callback/placeholderAddress.test.ts` and the "three copies" docblocks of three function and frontend files. **179-24**.
6. **(179-13 / 179-07) The preregister route's comment and the guide** — the guide is fixed (Deviation 7). The comment in `routes/api/contestant/preregister/+server.ts` is left: the route is unreachable after this plan (nothing sets the cookie it reads) and **179-21** deletes it. The guide's intro sentence on the `/contestant/preregister` guard stays true until 179-21.
7. **(179-10) Pacing the verification budget** — a registration verifies three tokens (the callback's sign-in token, the operation's confirmation of the current address, the mailed link), each scan twin one; the spec docblock records it, and the spec waits only on what it asserts.
8. **(179-11) CI1's endpoint served** — see *What the tracer observed*.

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the issue:** REG-04's path end to end for a candidate (requirements-completed: REG-04). REG-05's gate rule and E2E-01's IdP mode advance; their other variants come in 179-17..19.
- **OWASP:** T-179-141 (the callback re-checks the matrix; the cookie is deleted on read; the function decides), T-179-142 / PROH-179-22 (the marker is a disjunct only, unit-tested with forged values; no predicate reads a URL, the session object or a client value that removes a gate), T-179-143 (no `id_token` cookie; unit case), T-179-144 (no `url`/`route` read; tracking test), T-179-145 (`verifyOtp` over the function's token, no session is a failure), PROH-179-23 (the registration part logs only its closed code; a unit case plants a message in the function's answer and in the auth error and finds it in no redirect and no log line).
- **`any`:** none added; `locals` is `App.Locals`.
- **Repetition:** the type resolution over the matrix now exists in the authorize endpoint and the callback (five lines each), and the anonymous settings read in four places (`registrationGuard`, CI2's load, authorize, callback). A shared helper is a code-review item (carried since 179-06/07).
- **Documentation:** TSDoc on every new export and step; the callback's header; the guide and the README (Deviation 7).
- **Tracking:** no new user-facing function beyond the existing view; CI1 has no route of its own.
- **Svelte / context rule:** no component changed; the layout test reads `contestantCtx`-shaped fakes; no `view-transition-name`, no `<dialog>`.
- **Errors:** every failure of the callback is one closed code on CI2, logged by code; the layout's settings read stays fail-soft and logged.
- **Shared dependencies:** every gated load reads the settings now (one read, before the gates); the full suite is green at 572.
- **WCAG / keyboard:** CI1 is scanned in both themes; its `<h1>` takes focus on arrival (E2E) and when it replaces another view (component test).
- **Comment hygiene:** `assert:comment-hygiene` 0 before each commit; comments describe the code as it is.
- **Commits:** three, linear; no `[db]` change.

## Items to report rather than edit

- **`tests/README.md` and `tests/IDURA-TEST-RUNBOOK.md`** still describe the `bank-auth-journey` project (README's project table and its environment paragraph; the runbook's "Full-browser journey" section and command). 179-15 and 179-22 list both files.
- **`packages/dev-seed`'s `perm-bankauth-notloc` template** (and its registry comment and `notLocated2e2cgShape.ts`'s mention) was the journey's dataset and is now used by no project. Not on any later plan's list that I found: 179-21 or 179-24.
- **`tests/tests/fixtures/contestant/contestantPreregisterPage.fixture.ts`** is now imported by nothing (its composition root is deleted); 179-21 deletes it.
- **CLAUDE.md** (no-edit) is unaffected by this plan beyond the 179-05 items already reported.
- **A one-project run of `contestant-identity-provider` now pulls the perm chain** (485 tests in `179-14-red`), as the journey's did; the 179-15+ red controls that name this project take full-suite time.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register.

## Self-Check: PASSED

- Created files exist: `identityProviderLayout.svelte.test.ts`, `contestantIdentityProviderGate.fixture.ts`; the five journey files are absent.
- Commits 388c76328, 7356b57f5 and 8afc681df are ancestors of HEAD; `git rev-list --count 52947a4f7..HEAD` = 3 before this summary.
- `tests/e2e-runs/179-e2e/179-14-held/results.json` and `179-14-close-r2/restore.txt` (`restore: ok`) exist.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC and CLAUDE.md were not touched.
