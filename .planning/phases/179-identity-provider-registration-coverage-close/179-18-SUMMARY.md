---
phase: 179-identity-provider-registration-coverage-close
plan: 18
subsystem: contestant-app
tags: [frontend, svelte5, identity-provider, pending-address, settings, a11y, vitest, e2e, playwright]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-10 account-access confirm-address; 179-11 BasicUserData addressState / pendingEmail and the endpoint's save / resend / acknowledge intents; 179-12 IdentityProviderGate V4 and EmailEntry.showEmailError; 179-14 the tracer, the arrival marker and the teardown; 179-17 the returning-user scenarios and the serial identity-provider spec"
provides:
  - "The entity home's reminder of a pending address (contestant-home-email-pending*): sentence, address under 'Awaiting confirmation', Send again, link to ContestantAppSettings, polite status region"
  - "Settings' pending section: the pending address in the locked field with emailPendingInfo, Send again (settings-email-pending-resend), 'Use another email address' (settings-email-pending-change) revealing EmailEntry and 'Save email address' (settings-email-save); in-use at the field; PasswordSetter given no user name unless the address is proved"
  - "$F/lib/contestant/utils/pendingAddressResend.svelte.ts: PendingAddressResend (the resend request plus ResendCountdown) and postIdentityProviderRegistration, shared by CI1, the reminder and settings"
  - "EmailSentResend resendTestId / countdownTestId props (defaults the email-sent screen's ids); CI1 now renders it instead of a copy of its markup"
  - "E2E: scenario 8 (returning pending: V4, CI1 Send again, home reminder and its Send again), the settings change of address, scans 11/13/14 in both themes, phone checks of CI1 V4 and the home with the reminder at 320 and 390 px"
  - "Fixtures: contestantHomePage expectEmailPending / pressEmailPendingResend / expectEmailPendingResendRequested / followEmailPendingChange; contestantIdentityProviderGate expectAwaitingAddress / pressResend / expectResendRequested; new contestantSettingsPage; identityProviderFlow expectConfirmationMailCount"
affects: [179-19, 179-22, 179-24]

tech-stack:
  added: []
  patterns:
    - "One Svelte-runes class owns a screen's resend request and count; the screen renders EmailSentResend with its own test ids and its own polite status region"
    - "A unit test whose fake context must follow a change points the hoisted getter at a module-level $state.raw value"

key-files:
  created:
    - apps/frontend/src/lib/contestant/utils/pendingAddressResend.svelte.ts
    - apps/frontend/src/lib/contestant/utils/pendingAddressResend.svelte.test.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/page.svelte.test.ts
    - tests/tests/fixtures/contestant/contestantSettingsPage.fixture.ts
  modified:
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte
    - apps/frontend/src/lib/contestant/gates/IdentityProviderGate.svelte
    - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.svelte
    - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentResend.type.ts
    - apps/frontend/src/lib/contestant/components/emailSentPanel/EmailSentPanel.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/README.md
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/emailSentPanel/EmailSentResend/+page.md"
    - tests/tests/utils/testIds.ts
    - tests/tests/fixtures/contestant/contestantHomePage.fixture.ts
    - tests/tests/fixtures/contestant/contestantIdentityProviderGate.fixture.ts
    - tests/tests/fixtures/shared/identityProviderFlow.fixture.ts
    - tests/tests/specs/contestant/contestant-identity-provider.spec.ts

key-decisions:
  - "Send again is shared, not copied a third time: EmailSentResend gains test-id props, and PendingAddressResend owns the request and the count for CI1, the home's reminder and settings"
  - "The reminder reads contestantCtx.user in the markup and shows only for addressState 'pending' with a pendingEmail; it lives in MainContent's note snippet after NotEditableNote"
  - "Settings keeps the locked field showing the pending address until a new one is saved and the loads rerun; the change form replaces only the 'Use another email address' button"
  - "PasswordSetter's username is the email only when addressState is 'proved' (every account that is not the provider's reads 'proved')"
  - "A save that fails for a reason other than the address shows contestantApp.identityProvider.saveFailed as an alert under the fields (settings-email-error)"

patterns-established:
  - "Pending-address surfaces carry <surface>-email-pending-{resend,countdown,status,change} test ids"

requirements-completed: [REG-05]

estimate:
  tokens: 90000
actuals:
  tokens: 30775
  tasks: 3
  commits: 1
plan_head_before: 88335296295c39673dff454180005d97801d5ebf
plan_head_after: 618d836ce0af5b9444f8dce2741f3c12082646be

metrics:
  duration: "about 44 min (09:15Z to 09:59Z host clock), two full E2E runs included"
  completed: 2026-10-22
---

# Phase 179 Plan 18: The pending address Summary

**A returning identity whose address awaits its link is shown that address once on CI1 V4 and can have the link sent again. On every home of its entities a reminder above the title shows the address under "Awaiting confirmation", with Send again and a link to settings. Settings shows the pending address as not confirmed, sends the link again, refuses another account's address at the field and saves a fresh one, which is mailed and then shown. The password form gets no user name while the address is pending. The three Send again buttons are one shared component and one shared request class.**

## Task commits

| Tasks | Commit | What |
|---|---|---|
| 1 + 2 + 3 | 618d836ce | `feat(179-18)`: the home's reminder, settings' pending section, the shared Send again, the fixtures, the two scenarios, three scan entries and four phone checks. One held set, committed after `179-18-held` was green |

## What was built

### The home's reminder (S5; U-10, U-11, U-17)

In `MainContent`'s `note` snippet, after `NotEditableNote`, for `contestantCtx.user?.addressState === 'pending'` with a `pendingEmail`: the sentence `contestantApp.home.emailPending`; a `<dl>` with `contestantApp.identityProvider.awaitingConfirmation` over the address (`text-neutral font-bold [overflow-wrap:anywhere] hyphens-none`, `translate="no"`); `EmailSentResend` under the home's ids; a `Button` to `ContestantAppSettings` labelled `contestantApp.emailSent.changeAddress`; and a polite `role="status"` region. No new spacing value (`gap-sm`). The docstring names the reminder and its accessibility.

### Settings for a pending address (S6; U-11, U-17)

- **Pending:** the locked `Input` (`settings-email`) holds `pendingEmail` with `contestantApp.settings.emailPendingInfo` as its info. Under it are `EmailSentResend` (`settings-email-pending-resend` / `-countdown`), "Use another email address" (`settings-email-pending-change`) and a polite status region. The change button gives way, in place, to a `<form method="POST" novalidate>` holding `EmailEntry` and a submit "Save email address" (`settings-email-save`, natively disabled until the script runs). Focus moves to the address field. `validate()` guards the save. `saved` runs `invalidateAll()` and closes the form, `in-use` calls `showEmailError(emailInUse)`, and anything else shows `saveFailed` as an alert.
- **Proved, or an account that is not the provider's:** as before. The `emailDescription` info is shown, and `PasswordSetter` gets the email as its `username`.
- **`PasswordSetter`'s `username`** is the email only when `addressState === 'proved'`.

### The shared Send again (carried item 2)

`EmailSentResend` gains `resendTestId` and `countdownTestId`. Their defaults are the email-sent screen's ids, so that screen is unchanged. `PendingAddressResend` (`$lib/contestant/utils/pendingAddressResend.svelte.ts`) holds the U-17 rule once. A press while the count runs or a request is in flight does nothing. Otherwise the status reads `requested` at once, the request posts `resend` to the endpoint, and the 65-second count runs from its settlement whatever the endpoint answers. `postIdentityProviderRegistration` is the one fetch of that endpoint. CI1 (`IdentityProviderGate.svelte`) now uses both: its copied button markup, its `post` and its resend state are gone, and its 34 unit cases pass unchanged.

### E2E (`contestant-identity-provider.spec.ts`, describe "an address awaiting its link")

- **Scenario 8** (`@reg-idp`):
  1. Register with a fresh address and do not open the link (1 confirmation mail). Sign out and identify again.
  2. CI1 shows `returning` / `pending` / `asks=""`, with the `pending` sentence, the address under "Awaiting confirmation" and no address field.
  3. Send again, after the slot is given back: the button is unavailable and described by its count, the status reads "requested", and mail 2 arrives.
  4. Continue leads to the candidate's home, with the view gone. The reminder shows the address. Its Send again, after the slot is given back, sends mail 3.
- **Settings** (`@reg-idp`):
  1. Register with a pending address. The reminder's link leads to settings.
  2. Settings shows the pending address, described as not confirmed, and the password form has no user-name field.
  3. Send again sends mail 2.
  4. "Use another email address", then another account's address: refused at the field (`data-reason="in-use"`, focus there, no failure alert).
  5. A fresh address is saved: the field shows it, one confirmation mail arrives for it, and Return leads to the home, whose reminder shows it.
- **Scans** 11 `identity-provider-gate-returning-pending` (marker `identity-provider-gate-resend`), 13 `identity-provider-home-email-pending` (marker `contestant-home-email-pending`) and 14 `identity-provider-settings-email-pending` (marker `settings-email-pending-resend`). Each runs light and dark, and each twin mints its own identity.
- **Phone:** CI1 V4 (with its address asserted) and the home with the reminder, at 320 and 390 px (`isMobile`, `hasTouch`), with no horizontal overflow.
- **Twelve tests added:** 2 scenarios, 6 scans and 4 phone checks. `contestant-identity-provider` goes from 22 to 34, and the suite from 595 to 607.

## Verifications this plan adds (carried item 3)

These counts are from the spec's docblock. A registration with an address verifies 2 tokens (the callback's sign-in and the confirmation operation's check of the current address). A further arrival verifies 1, and each Send again or new address verifies 1. An in-use address is refused before any verification (`addressConfirmation.ts`, steps d/e before f).

| Tests | Verifications |
|---|---|
| Scenario 8 | 5 |
| Settings scenario | 4 |
| The two CI1 V4 scans | 6 |
| The two home scans | 4 |
| The two settings scans | 4 |
| The phone checks | 10 |
| **Total added** | **33** |

The spec now verifies about 75 tokens per serial run, against about 40 before. No pacing was built, as the dispatch directed: 179-17 measured that the local stack does not enforce the 30-per-5-minutes `/auth/v1/verify` limit. The spec's docblock states the count.

## Runs

| Run | Tree | Result | Verdict |
|---|---|---|---|
| `179-unit/179-18-t1-red` (`.log`, `.exit`, `.junit.xml`, `.head`) | home cases against HEAD 883352962's page | exit 1: 4 failed, 62 passed; each failure is `… should be rendered` (an expectation). The 3 "no reminder" cases are controls, which an unchanged page passes | red as required |
| `179-unit/179-18-t2-red` (same set) | settings cases against HEAD's page | exit 1: 7 failed, 4 passed; each failure is an expectation. The proved cases and the "no user name" cases are controls the current page passes, because `email` is already empty for a pending address | red as required |
| `179-unit/179-18-frontend-unit` | held set | exit 0: 267 files passed, 1 skipped; 6448 passed, 32 skipped | — |
| `179-unit/179-18-lint`, `-lint-r2`, `-lint-r3`, `-lint-r4` | held set | r1 exit 1 (import sort and a raw locator in fixtures), r2 exit 1 (three svelte-check type errors in the new tests), r3 exit 1 (`settings` member missing), **r4 exit 0** | — |
| `179-e2e/179-18-held` | held set at 883352962 | **607/607**, wrapper exit 0, `restore: ok`, not void, AC | **PASS** restated (`_drivers/179-18-held.verdict.log`): 128 projects, `contestant-identity-provider` +12, all others equal. As written, FAIL (12) only on the slash-less `--dirty-only apps/frontend/src` (`_drivers/179-18-held.verdict-plan.log`) |
| `179-e2e/179-18-close` | committed 618d836ce | **607/607**, driver and wrapper exit 0, `restore: ok`, `sleep_entries_in_window: 0`, AC (09:42:55Z to 09:58:14Z) | `179-verdict e2e 179-18-close --same-projects-as 179-18-held`: **PASS**, 128 projects, 0 not as expected (`_drivers/179-18-close.verdict.log`) |

The 18 held files are kept as `tests/e2e-runs/179-e2e/179-18-held.<path with / as __>.kept`. Each is byte-identical (`cmp`) to what 618d836ce committed.

## Verify blocks (`tests/e2e-runs/179-unit/179-18-t{1,2,3}-verify*.{sh,log,exit}`)

- **Task 1** as written: exit **0**.
- **Task 2** as written: exit **0**.
- **Task 3**: as written exit **1** at the held verdict (slash-less `--dirty-only apps/frontend/src` reads the new files under `apps/frontend/src/` as outside; it would also have stopped at `yarn -s`). Restated (`179-18-t3-verify-restated.sh`: `apps/frontend/src/`, the regenerated docs page added as a `--dirty-only` path, `yarn` for `yarn -s`): exit **0** at 618d836ce. The frontend unit suite was also run on its own at that head: 6448 passed, 32 skipped (`179-18-close-frontend-unit`).

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 2 - Repetition, carried item 2] Shared Send again instead of a third copy.** `EmailSentResend` gained two test-id props, and a new `PendingAddressResend` class with `postIdentityProviderRegistration` holds the request, the count and the endpoint call. CI1 was moved onto both. Files outside the plan's list:
- `EmailSentResend.svelte` and `.type.ts`
- `EmailSentPanel.svelte.test.ts` (one new case)
- the two `pendingAddressResend.svelte*` files
- `IdentityProviderGate.svelte`
- the generated `EmailSentResend` docs page
- the components `README.md` (one sentence; Prettier realigned the table)

**2. [Rule 3 - Blocking] No settings fixture existed.** The settings steps went into a new `tests/tests/fixtures/contestant/contestantSettingsPage.fixture.ts` instead of `identityProviderFlow`, because a page's locators belong in that page's fixture. This file is not on the plan's list.

**3. Extra test ids beyond the Locator Contract:**
- `contestant-home-email-pending-countdown`, `settings-email-pending-countdown` and `settings-email-pending-status`, which the shared button and the status steps need.
- `settings-email-error`, the alert for a failed save.
- `testIds.contestant.settings.email` / `.return`, the existing `settings-email` and `settings-return`, now declared.

**4. The CI1 "change" fixture step was not added.** No scenario uses it, and 179-12's unit case covers CI1's address switch. A step no spec calls would be dead code.

**5. The home reminder and settings scenarios press Send again on all three surfaces** (CI1, the home and settings). The plan named Send again only on CI1 in scenario 8. This adds two verifications and observes U-17 on every surface.

**6. [Rule 1 - Test bugs before the commit]:**
- The home's countdown text is rendered by the component context's `t`, which in that test renders keys alone.
- `settings-email` is on the `<input>` itself, not on a container.
- The fake `user` had to be reactive to follow a rerun load.
- Three type errors (`settings` member, a tuple cast).

The red runs were re-made where the test changed before implementation (t2), and t1's red stands, because its failures were the reminder's absence.

**7. [Rule 3 - Recurring] Verify blocks.** `yarn -s` is refused by Yarn 4.18.1, and the slash-less `--dirty-only apps/frontend/src` makes the verdict fail. The held tree also holds the regenerated docs page, so the restated block adds its path.

**No spec body change beyond the plan:** the new describe is the plan's. No existing test changed.

## Carried items

| Item | Outcome |
|---|---|
| (179-11) Settings had no unit spec and renders `contestantCtx.user.email` | **Settled.** The new `settings/page.svelte.test.ts` has 11 cases: proved (address, description, user name), pending (address, info, Send again, no user name, count), another address (reveal and focus, invalid pair, save and rerun, in-use, failure) and none |
| (179-12) CI1's resend markup copies `EmailSentResend` | **Settled** by test-id props on `EmailSentResend` and the shared `PendingAddressResend`, used by CI1, the reminder and settings (Deviation 1) |
| (179-10 / 179-17) Pacing | No fixed-wait pacing was built. **33 verifications** were added, and the spec now verifies about 75; see the table above and the spec docblock |

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the issue:** REG-05's pending half end to end (V4 once, the reminder, resend, replace); REG-04's "recorded as pending and its link mailed again" is observed through the mail counts. `requirements-completed: [REG-05]`.
- **OWASP / threat register:**
  - T-179-181 / PROH-179-27: the pending address renders only from the signed-in user's own `contestantCtx.user.pendingEmail`, on protected pages, under "Awaiting confirmation", never under "Signed in as". Unit cases check that it is absent for proved, none and no user.
  - T-179-182: every Send again goes through the endpoint's per-address and per-caller slot and the 65-second count.
  - T-179-183: `PasswordSetter` gets no `username` unless the address is proved. A unit case and an E2E step check this.
  - T-179-SC: no package was installed.
- **`any`:** none.
- **Repetition:**
  - Send again is shared, as described above.
  - The English-catalogue reader is now also in two more fixtures (`contestantHomePage`, `contestantSettingsPage`); 179-17 had already flagged it. A shared test helper would remove these copies (code review).
- **Documentation:**
  - The home's and the settings page's `@component` docstrings, the `EmailSentResend` docstring and its generated page, and the components README row.
  - TSDoc on the new class, function, fixture steps and test ids.
- **Tracking:** no events, as on the email-sent screen and CI1.
- **Svelte guidelines / context rule:**
  - `user` is read as `contestantCtx.user` in markup and `$derived`, never destructured. Only `t`, `getRoute` and `setPassword` are destructured.
  - No `view-transition-name`, no `<dialog>`, and no numeric spacing class beyond the allowed `[overflow-wrap:anywhere]`.
- **Errors:** a failed request is logged by `postIdentityProviderRegistration` without its content. A failed `invalidateAll` in settings is logged. A failed save is told as an alert.
- **Shared dependencies:** the email-sent screen keeps its default ids, and its unit cases and the full suite are green. CI1's unit cases pass unchanged.
- **WCAG / keyboard:**
  - Send again stays a tab stop while unavailable and keeps focus when pressed.
  - The count line describes it.
  - Each surface has a polite status region with two announcements per cycle.
  - "Use another email address" in settings moves focus to the address field.
  - Scans 11, 13 and 14 pass in both themes, and the phone checks pass.
- **Comment hygiene:** `assert:comment-hygiene` exit 0 before the commit (and inside `lint:check` r4). There are no ids or history in comments or titles.
- **Commits:** one code commit, linear, with no `[db]` change.

## Components skill re-check

- No component was added, removed or moved. `EmailSentResend` gained two props, which are documented in its type file and docstring.
- `generate:docs` was re-run, and its diff (two lines on `EmailSentResend`'s page) was read.
- `audit-skill-links.sh components` exit 0.
- `SKILL.md` and `context-reactivity.md` make no claim this plan invalidated; the counts in convention 1 are unchanged.

## U-13 residual (as recorded)

The sentences say "sign in with Bank ID" and nothing more. A user in state *none* cannot sign in while answers are locked; that residual is recorded, not addressed.

## Statements observed and inferred

- **Observed** twice in a browser, in the held and the close run:
  - V4 for a returning pending identity, with no address field.
  - CI1's, the home's and settings' Send again each producing one more confirmation mail after the slot was given back.
  - The reminder above the title, and its link to settings.
  - Settings showing the pending address, with no user-name field.
  - An in-use refusal at the field.
  - A fresh address saved, mailed and shown on settings and on the home.
  - Axe clean in both themes, and no overflow at 320 and 390 px.
- **Inferred:** the verification count of the in-use save (zero). This was read from `addressConfirmation.ts`'s order, not measured.

## Items to report rather than edit

- **`179-UI-SPEC.md`** (no-edit) § *Locator Contract* lists neither the countdown and status ids of the home's and settings' Send again nor `settings-email-error`. § *Existing components changed* does not name `EmailSentResend` (now with two test-id props) or `IdentityProviderGate` (now on the shared class).
- **`tests/README.md` § the auth budget:** 179-17's item stands, and the spec now verifies about 75 tokens per run.
- **CLAUDE.md:** I found no sentence made false.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. No new endpoint, auth path or schema; the surfaces call the 179-11 endpoint.

## Self-Check: PASSED

- Created files exist and are tracked: `pendingAddressResend.svelte.ts` and its test, `settings/page.svelte.test.ts`, `contestantSettingsPage.fixture.ts`.
- Commit 618d836ce is an ancestor of HEAD; `git rev-list --count 883352962..HEAD` = 1 before this summary.
- `tests/e2e-runs/179-e2e/179-18-held` and `179-18-close` hold `results.json` and `restore.txt` ending `restore: ok`; `_drivers/179-18-held.verdict.log` and `_drivers/179-18-close.verdict.log` end in PASS.
- `git status` shows nothing outside `.planning/` but the operator's `CAND-APP-PLAN.md`.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC and CLAUDE.md were not touched.
