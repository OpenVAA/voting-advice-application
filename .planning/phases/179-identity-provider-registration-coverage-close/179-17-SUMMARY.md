---
phase: 179-identity-provider-registration-coverage-close
plan: 17
subsystem: contestant-app
tags: [oidc, identity-provider, returning-user, nothing-to-edit, set-password, e2e, playwright, a11y]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-06 contestantApp.nothingToEdit.nextStepsNoAddress in seven locales; 179-11 the user-level address state (an unproved address reads as no email); 179-12 IdentityProviderGate.svelte with V3, V4 and V5; 179-13 identity-callback's found / gone resolution through the registration record and the live grant; 179-14 the arrival marker, the gate order and removeOwnEntitiesOfUsersByEmailPrefix; 179-16 the serial identity-provider spec"
provides:
  - "NothingToEdit: with no address shown, no 'Signed in as' and the last sentence contestantApp.nothingToEdit.nextStepsNoAddress"
  - "contestantApp.setPassword.why: 'Your account has no password yet. Choose one so that you can sign in with your email address and password.' in en, constructed in da, et, fi, fr, lb, sv"
  - "E2E: three returning scenarios (proved address and password; no address, the settings page opened directly; grant removed) and scans identity-provider-gate-returning-none and identity-provider-gate-returning-proved in both themes"
  - "Fixture steps: identityProviderFlow registerWithIdentityProvider / proveAddress / signOut / removeGrant / expectNoOwnEntity / openOwnEntitySettings / expectOwnEntitySettings; contestantIdentityProviderGate expectReturning / expectSignInAddress / expectNoAddressField / expectShownInPlaceOfSettings / logOut; contestantNothingToEditPage expectNoAddress"
  - "SupabaseAdminClient.authUserIdForIdentity and revokeEntityGrantById; removeOwnEntitiesOfUsersByEmailPrefix also removes the entities the registration record names"
affects: [179-18, 179-19, 179-22, 179-24]

tech-stack:
  added: []
  patterns:
    - "A minted identity's account is found by the identity its app_metadata names, whatever address the account holds"
    - "The teardown of function-created entities reads both the editor grants and the registration record, so an entity whose grant a test removed is still removed"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte
    - apps/frontend/src/lib/contestant/components/nothingToEdit/NothingToEdit.svelte.test.ts
    - apps/frontend/messages/da/contestantApp.setPassword.json
    - apps/frontend/messages/en/contestantApp.setPassword.json
    - apps/frontend/messages/et/contestantApp.setPassword.json
    - apps/frontend/messages/fi/contestantApp.setPassword.json
    - apps/frontend/messages/fr/contestantApp.setPassword.json
    - apps/frontend/messages/lb/contestantApp.setPassword.json
    - apps/frontend/messages/sv/contestantApp.setPassword.json
    - .planning/todos/pending/2026-10-21-179-native-speaker-review-identity-provider-strings.md
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/nothingToEdit/NothingToEdit/+page.md"
    - tests/tests/fixtures/shared/identityProviderFlow.fixture.ts
    - tests/tests/fixtures/contestant/contestantIdentityProviderGate.fixture.ts
    - tests/tests/fixtures/contestant/contestantNothingToEditPage.fixture.ts
    - tests/tests/specs/contestant/contestant-identity-provider.spec.ts
    - tests/tests/utils/supabaseAdminClient.ts

key-decisions:
  - "NothingToEdit chooses its last sentence on the same read as its address block (contestantCtx.user?.email in the markup), so the two cannot disagree"
  - "The fixture finds a minted identity's account by app_metadata.identity_match_value instead of by the placeholder address, which a proved address replaces"
  - "The removed-grant scenario's candidate, left without a grant, is removed by the project's teardown through the registration record, not by the test"
  - "registerWithIdentityProvider without an address ends on CI1 V1; with one it goes through G to the candidate's home"

requirements-completed: []

actuals:
  tokens: 14963
  tasks: 2
  commits: 1
plan_head_before: bfb1e5c3d23b63fde4fc31d1b4f9defbbf815adb
plan_head_after: 5271c072ff66176008c9f850063b2e6d1ddef6f7

metrics:
  duration: "about 41 min (08:28Z to 09:09Z host clock, 2026-10-22), two full E2E runs included"
  completed: 2026-10-22
---

# Phase 179 Plan 17: The returning identity-provider user Summary

**A returning identity is now walked end to end in three states. With a proved address and a password it is told that it has already registered and to sign in with its address next time, sees that address, is asked for nothing and goes on to its home. With no address it is told it has registered and asked for one before any protected page, also on its settings page opened directly, where the view stands in place of the page. With its grant removed by an administrator it sees its pending address once, gets no new candidate, and lands on "nothing to edit", which names no address and ends with "Contact support and tell them that you registered with Bank ID." F's first sentence now reads "Your account has no password yet. …" in all seven locales.**

## Task commits

| Task | Commit | What |
|---|---|---|
| 1 + 2 | 5271c072f | `feat(179-17)`: `NothingToEdit`'s no-address sentence, `setPassword.why` in seven locales with the review todo and the regenerated component page, the fixture steps, the three scenarios and the two scan entries. One held set, committed after `179-17-held` was green |

## What was built

### `NothingToEdit` (U-12)

The last paragraph reads `contestantCtx.user?.email` in the markup, as the address block does: with an address, `contestantApp.nothingToEdit.nextSteps`; with none (no user, no email or an empty one), `contestantApp.nothingToEdit.nextStepsNoAddress`, and no `<dl>`. The `@component` docstring says so; `generate:docs` rewrote the component's generated page. Unit cases: the address sentence with an address and not the other; the no-address sentence for three no-address shapes and not the other; the order title, explanation, next steps, support, logout without an address; the sentence following the context when the address comes and goes.

### F's first sentence (U-14)

`contestantApp.setPassword.why` in `en` is the contract's sentence. The six others were built from each catalogue's own words for password, email address and sign in, `et` informal as its namespace. The review todo lists all seven, before and after, in a new section, adds the catalogue to its `files`, and asks the reviewer to judge the sentence on the set-password view. `generate:translation-key-type` produced no diff. No spec reads this sentence (`git grep` over `tests/`), so no E2E assertion changed with it.

### The E2E (`contestant-identity-provider.spec.ts`, describe "a returning identity")

- **Proved address and password** (`@reg-idp`): register with a fresh address → G → home → the mailed link opened as received → F → a password → home → sign out → identify again → CI1 `returning` / `proved` / `asks=""`, the title and the `proved` sentence from the catalogue, the address under "Your sign-in email address", no address or confirmation field → Continue → the candidate's home, the view gone.
- **No address** (`@reg-idp`): register → CI1 V1 → Log Out from the view → identify again → CI1 `returning` / `none` / `email` with its sentence → the candidate's settings page opened by its address → the view at the settings address, the settings page's password button absent → an address → Continue → G (not accepted yet) → the settings page of the identity's candidate.
- **Removed grant** (`@reg-idp`): register with a fresh address, left pending → sign out → the editor grant removed through the admin client (exactly one row) → identify again → CI1 `returning` / `pending` / `asks=""` with the `pending` sentence → Continue → `NothingToEdit` at the app root, no address, no label, the no-address sentence → the identity edits no candidate → the app root asked for again shows `NothingToEdit` and no gate.
- **Scans** 10 `identity-provider-gate-returning-none` and 12 `identity-provider-gate-returning-proved` through `declareScans`, light and dark; each twin mints its own identity, and entry 12's reach proves the address through the mail's real link and sets a password before identifying again.

## Runs

| Run | Tree | Result | Verdict |
|---|---|---|---|
| `179-unit/179-17-t1-red` (`.log`, `.exit`, `.junit.xml`, `.head`) | the new cases against HEAD bfb1e5c3d's component | exit 1: 5 failed, 12 passed; each failure an expectation on the paragraph texts | red as required |
| `179-unit/179-17-t1-green` | the branch in place | exit 0, 17 passed | — |
| `179-unit/179-17-t2-frontend-unit` | the held set | exit 0: 265 files passed, 1 skipped; 6421 tests passed, 32 skipped | — |
| `179-unit/179-17-t2-lint` | the held set | exit 1: `func-style` on an arrow helper in the new unit case (Deviation 1) | — |
| `179-unit/179-17-t2-lint-r2` | after the fix | `yarn lint:check` exit 0 (comment hygiene, a11y scan wiring and every other stage included) | — |
| `179-e2e/179-17-held` | the held set at bfb1e5c3d | **595/595**, wrapper exit 0, `restore: ok`, not void, AC | **PASS** as the plan writes it (`--same-projects-as 179-16-close`) and against the orchestrator's reference `harness-keys-close`: 128 projects, `contestant-identity-provider` 15 → 22, all others equal (`_drivers/179-17-held.verdict-{plan,harness}.log`) |
| `179-e2e/179-17-close` | committed 5271c072f | **595/595**, driver and wrapper exit 0, `restore: ok`, `sleep_entries_in_window: 0`, AC | `179-verdict e2e 179-17-close --same-projects-as 179-17-held`: **PASS**, 128 projects, 0 not as expected |

Totals: 179-16-close and harness-keys-close 588 → held 595 (`contestant-identity-provider` +7: three scenarios, two scans in two themes) → close 595.

Held copies: the 16 held files are kept as `tests/e2e-runs/179-e2e/179-17-held.<path with / as __>.kept`, each byte-identical (`cmp`) to what 5271c072f committed.

## Verify blocks (`tests/e2e-runs/179-unit/179-17-t{1,2}-verify*.{sh,log,exit,head}`)

- **Task 1** as written: exit **0**.
- **Task 2** as written: exit 1 at `yarn -s workspace @openvaa/frontend test:unit` (Yarn 4.18.1: `Unsupported option name ("-s")`, `179-17-yarn-s.log`); every stage before it passed. Restated with `yarn workspace … test:unit > /dev/null`: exit **0** at 5271c072f. The plan's `--dirty-only` paths already carry the trailing slash.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] A lint finding in the new unit case.** An arrow helper (`const texts = () => …`) tripped the frontend's `func-style` rule in the first `lint:check`; it became a function declaration. Unit and lint green after.

**2. [Rule 2 - Missing cleanup] The removed-grant scenario would leak its candidate.** The project's teardown found function-created entities through the users' editor grants alone, and the scenario removes that grant, so the candidate (no external id) would have stayed in the suite's project after every run. `removeOwnEntitiesOfUsersByEmailPrefix` now also takes the entity ids the user's `registered_entities` record names for the project; the docblock says so. Inferred from the code, not observed as a leak (the run that would leak was not made).

**3. [Rule 3 - Blocking] The account lookup.** The fixture found a minted identity's account by its placeholder address, which a proved address replaces, so `expectOwnEntityHome` could not follow the proved-address scenario. `accountIdOf` now asks `SupabaseAdminClient.authUserIdForIdentity(sub)` (the user whose `app_metadata.identity_match_value` is the identity); the two "call it while the address is not proved" docblock sentences were dropped. `removeGrant` needed `revokeEntityGrantById`, because `revokeEntityGrant` names an entity by an external id the function's entity lacks.

**4. [Rule 3 - Recurring] `yarn -s`** refused by Yarn 4.18.1; both forms kept.

**No spec body change beyond the plan:** the three scenarios and two scans are the plan's; no existing test changed.

**Files touched that the plan did not list:** `tests/tests/utils/supabaseAdminClient.ts` (Deviations 2, 3); `tests/tests/fixtures/contestant/contestantNothingToEditPage.fixture.ts` (the `expectNoAddress` step the removed-grant scenario needs); the generated page is `…/generated/contestant/components/nothingToEdit/NothingToEdit/+page.md`, not the listing `…/generated/+page.md` the plan names (the listing did not change). Prettier also reformatted two pre-existing over-long lines of `identityProviderFlow.fixture.ts`, which was not Prettier-clean at HEAD.

## Statements observed and inferred

- **Observed:** every count, exit and verdict above. In a browser, twice (held and close): a proved identity with a password meets V5 with its address and no field, and Continue leads to its home; an identity with no address meets V3 at the app root and at its settings address in place of the settings page, and after an address and G reaches the settings page; an identity whose grant was removed meets V4 once, then `NothingToEdit` with no address and the no-address sentence, and edits no candidate. That the marker clears on Continue: the app root asked for again shows no gate (removed-grant scenario). That F follows the mailed link on a proved address with no password, and that the provider's sign-in after a proved address lands in the account of that address (the function's link for the current address).
- **Observed, outside the plan:** the local auth service did not refuse verifications beyond thirty from one origin: 36 `POST /auth/v1/verify` with an invalid token hash in a few seconds were all answered 403, none 429, and the auth container's environment sets `GOTRUE_RATE_LIMIT_VERIFY=30` but no `GOTRUE_RATE_LIMIT_HEADER`. The spec's docblock now says it verifies about forty tokens and that the local stack answers more than thirty in five minutes without refusing. **Inferred, unconfirmed:** that the auth service applies its per-origin limits only when a rate-limit header is configured (read from memory of its source, not from this version's code).
- **Inferred, not observed:** that the teardown change removes the orphaned candidate (the teardown ran green in both runs; its count of removed entities was not read).

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the issue:** REG-05 as J1 words it for the proved and none states, and J6's removed grant, end to end. `requirements-completed` is empty: REG-05 completes at 179-18 with the pending state.
- **OWASP / threat register:** T-179-171 (a removed grant is not undone: the scenario asserts the identity edits no candidate after identifying again, and the function's `no_entity` creates nothing); T-179-172 (the gate stands at a protected address opened directly: scenario 4 opens the settings page and asserts the view in its place with nothing of the page); T-179-173 / PROH-179-26 (V5's sentence only for `proved`: scenario 3 asserts `proved` with its sentence, the removed-grant scenario asserts `pending` with its own; no address field for the proved user); T-179-SC (no package installed).
- **`any`:** none added; the record read in the admin client narrows `unknown` step by step.
- **Repetition:** `readEnglishMessages`-style catalogue reads now in a fourth fixture (`contestantNothingToEditPage`); a shared test helper would remove them (code review).
- **Documentation:** the `@component` docstring and its generated page; TSDoc on every new step and admin method; the spec docblock's coverage, writes and verification count.
- **Tracking:** no new user-facing function.
- **Svelte guidelines / context rule:** `user` read as `contestantCtx.user` in the markup, never destructured; no new component, no `view-transition-name`, no `<dialog>`, no spacing class added.
- **Errors:** no new error path in application code.
- **Shared dependencies:** F's sentence changes for every user who meets F; the set-password specs read only its title, and the full suite is green twice at 595.
- **WCAG / keyboard:** V3 and V5 pass axe in both themes; the no-address `NothingToEdit` keeps one `<h1>` and its reading order (unit case).
- **Comment hygiene:** `lint:check` (with `assert:comment-hygiene`) exit 0 before the commit; no ids or history in touched comments or titles.
- **Commits:** one code commit, linear; no `[db]` change.

## Components skill re-check

No component added, removed or moved; `NothingToEdit`'s docstring changed and `generate:docs` was run, its diff read (one sentence). `SKILL.md` and `context-reactivity.md` make no claim this plan invalidated.

## Items to report rather than edit

- **`tests/README.md` § the auth budget** says the local auth service admits thirty link verifications in five minutes from one address and that "a 429 in a run is this budget". For `/auth/v1/verify` that was not so on this stack (see *Statements observed*): 36 in a row were answered. The password sign-in half was not probed. Settle: 179-22 or verifier.
- **The identity-provider spec now verifies about forty tokens in its serial run**; should a deployment or CI configure a rate-limit header, the spec would meet the limit. Pacing without fixed waits was not needed here and was not built.
- **`179-UI-SPEC.md`** (no-edit) § *Axe Scan Entries* says entry 12's setup proves the address through the mail's link; it also has to set a password, because F precedes CI1 for a proved account without one. True to the contract's gate order; worth a sentence there.
- **CLAUDE.md** (no-edit): no sentence made false by this plan that I found.
- **`179-CARRIED-ITEMS.md`**: not touched.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. `revokeEntityGrantById` and `authUserIdForIdentity` are test-tree service-role helpers, under the existing admin client.

## Self-Check: PASSED

- Commit 5271c072f is an ancestor of HEAD; `git rev-list --count bfb1e5c3d..HEAD` = 1 before this summary.
- `tests/e2e-runs/179-e2e/179-17-held/results.json`, `179-17-close/restore.txt` (`restore: ok`) and `_drivers/179-17-close.verdict.log` (PASS) exist.
- `git status` shows nothing outside `.planning/` but the operator's `CAND-APP-PLAN.md`.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC and CLAUDE.md were not touched.
