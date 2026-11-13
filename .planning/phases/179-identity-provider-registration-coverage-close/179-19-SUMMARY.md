---
phase: 179-identity-provider-registration-coverage-close
plan: 19
subsystem: contestant-app
tags: [auth-callback, email-change, identity-provider, login-notice, e2e, playwright, vitest]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-10 confirm-address and its email_change link; 179-11 pending_email_taken read as addressState none; 179-12 CI1's emailTakenNotice lead; 179-14 the tracer and the callback's allowlisting; 179-17/18 the returning and pending scenarios, the serial identity-provider spec"
provides:
  - "The mailed links' callback's email_change arm: a verification that answers no session is a failure; a failure lands a browser with a session on ContestantAppHome (CI1 with the taken notice through pending_email_taken) and a browser without one on ContestantAppLogin with emailTaken (status 500, no code) or authError"
  - "ADDRESS_TAKEN_FAILURE (status 500, code undefined) and isAddressTakenFailure in the callback"
  - "ContestantLoginError 'emailTaken' -> contestantApp.login.emailTaken"
  - "E2E: the race of two identities for one address, signed in and with no session, and the first sign-in by email of a proved identity"
  - "Fixtures: identityProviderFlow.giveBackMailSlot / signInLinkToOpen; contestantIdentityProviderGate.expectAddressTaken; contestantLoginPage notice reason emailTaken; contestantSetPasswordGate.logOut waits for the view's script"
affects: [179-20, 179-21, 179-22, 179-24]

tech-stack:
  added: []
  patterns:
    - "A failed link verification lands on the browser's own session: with one, on the app root where the gates read the account's own facts; without one, on the login page with a notice chosen by the auth client's status and code alone"

key-files:
  created: []
  modified:
    - apps/frontend/src/routes/api/auth/callback/+server.ts
    - apps/frontend/src/routes/api/auth/callback/server.test.ts
    - apps/frontend/src/lib/contestant/utils/loginError.ts
    - apps/frontend/src/lib/contestant/utils/loginError.test.ts
    - apps/frontend/src/routes/contestant/login/+page.svelte
    - tests/tests/fixtures/shared/identityProviderFlow.fixture.ts
    - tests/tests/fixtures/contestant/contestantIdentityProviderGate.fixture.ts
    - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantSetPasswordGate.fixture.ts
    - tests/tests/specs/contestant/contestant-identity-provider.spec.ts
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/bank-authentication/+page.md"

key-decisions:
  - "P4-DISTINGUISHABLE yes: the no-session race is answered with A's emailTaken, recognised by the auth client's status 500 with no code (AuthRetryableFetchError); 403 otp_expired, 500 with a code, 502 and status 0 stay authError"
  - "A verified email_change with no session goes through the same failure landing as an error (session -> app root, none -> authError), and claims nothing"
  - "A session that cannot be read after a failed email_change counts as none and is logged by error name only, so the request still ends on the login page"
  - "Any failed email_change in a browser with a session lands on the app root whatever the error; the layout's own facts (pending_email_taken, the home reminder) say what happened"

requirements-completed: [REG-04, E2E-01]

estimate:
  tokens: 70000
actuals:
  tokens: 14900
  tasks: 3
  commits: 2
plan_head_before: d5e1283370d6dc73c6b71f7f018f71655d8cd10c
plan_head_after: eb7d143404df45dade4dc7b0159580e2300af695

metrics:
  duration: "about 57 min (10:04Z to 11:02Z host clock, 2026-10-22), three full E2E runs included"
  completed: 2026-10-22
---

# Phase 179 Plan 19: Where the confirmation link lands Summary

**The mailed links' callback now gives `email_change` an arm of its own. A link that answers a session makes the typed address the account's sign-in address and lands on the app root, where F asks for a password. A verification that answers no session is a failure, never a landing as if the change were complete. When another account took the address meanwhile, a browser signed in as the loser is back on CI1's email form led by "The address you entered earlier is now used by another account…", and a browser with no session reaches the login screen with the new `emailTaken` notice; any other failure without a session is the auth error. An identity that proved its address signs in by an emailed link and meets F, then its home. Three scenarios walk all of it.**

## Task commits

| Tasks | Commit | What |
|---|---|---|
| 1 + 2 | 84c3e1f28 | `feat(179-19)`: the callback's `email_change` arm, the `emailTaken` notice, the fixtures and the three scenarios. One held set, committed after `179-19-held-r2` was green |
| (docs) | eb7d14340 | `docs(179-19)`: the auth callback's guide, the registration guide's notice sentence and the bank-authentication guide's confirmation step |
| 3 | — | the close run of the committed tree and `lint:check` (no file) |

## P4's branch as built

`179-PROBE-FINDINGS.md` reads `P4-DISTINGUISHABLE: yes` (`P4-RACE: 500 none`, `P4-INVALID: 403 otp_expired`), so the no-session case shows A's `emailTaken`.

- The callback recognises the race by `ADDRESS_TAKEN_FAILURE = { status: 500, code: undefined }`, one named constant with its TSDoc.
- supabase-js (auth-js 2.117.2, read from `node_modules/@supabase/auth-js/dist/module/lib/fetch.js`) turns any 5xx in its network-error list into `AuthRetryableFetchError(message, status)` with no code. So the race reaches the callback as status 500 with `code` undefined. P4 left this unobserved, because the probe sent a raw `POST /verify`. **It is now observed in a browser:** the no-session scenario landed on the login screen with `data-reason="emailTaken"` in `179-19-held-r2` and `179-19-close`.
- **Flagged assumption, carried to verification:** a 500 with no code from an `email_change` verification is read as "the address was taken". Any other server failure of that endpoint with the same shape would show the same notice. P4 recorded this as inferred, and this plan does not change it. The notice speaks only of "that email address" to whoever holds the link, which is the mailbox's own address (T-179-192, PROH-179-28).

## What was built

### The callback (`routes/api/auth/callback/+server.ts`)

- After `verifyOtp`, two cases go to `emailChangeFailureRoute`: an `email_change` link that answers an error, and one that answers no session. Neither runs the claim.
- `emailChangeFailureRoute` asks `locals.safeGetSession()`:
  - With a session, it lands on `ContestantAppHome`. There the protected layout reads `pending_email_taken`, the address state reads `none`, and CI1 asks for an address with the `emailTakenNotice` lead (179-11 and 179-12's caller-only fact).
  - Without a session, it lands on `ContestantAppLogin` with `errorMessage` set to `emailTaken` when `isAddressTakenFailure`, and to `authError` otherwise.
  - A `safeGetSession` that throws counts as no session and is logged by the error's name only.
- A verified `email_change` with a session goes on, as before, through the claim to the app root.
- The other arms are unchanged. A failed `magiclink` or `recovery` link never asks for the held session and is the auth error whatever its error (unit case).
- The route's docblock gains the `email_change` paragraph, and the failure sentence now says "of any type but `email_change`".

### The login notice

`ContestantLoginError` gains `emailTaken` → `contestantApp.login.emailTaken`. The key has been in the seven catalogues since 179-06. The login page's `@component` text now names three reasons.

### E2E (`contestant-identity-provider.spec.ts`, describe "a link that confirms an address")

Each scenario is tagged `@reg-idp`.

1. **Two identities give one address, signed in.**
   - A registers in `page` and gives a fresh address X. B registers in a browser context of its own and gives X after the address's slot is given back.
   - Each confirmation link is read as the newest mail once the count is 1 and then 2.
   - A opens its link and meets F naming X.
   - B opens its link in its own context and lands on the app root. CI1 shows `new` / `none` / `email` with the `emailTakenNotice` lead, and no error page.
   - B gives another address, Continue leads to its home, and the reminder shows the new address, whose confirmation mail arrived.
2. **The same race, no session.** Up to A's proof as above. B's link is then opened in a third, fresh context, and the login screen shows the `emailTaken` notice.
3. **Sign-in by email.**
   - Register with an address, prove it, and meet F. Log Out from F, and the login screen follows.
   - The sign-in screen offers the link button. The address is typed, the slot is given back, the link is asked for, and the email-sent screen shows that address.
   - The sign-in mail's link, opened as received, leads to F naming the address. After a password, the candidate's home.
- Contexts opened beside the test's own are closed in an `afterEach`. `browser.newContext()` takes the project's `use` options, including `ignoreHTTPSErrors` and an empty storage state.

### Fixture steps

- `identityProviderFlow.giveBackMailSlot(address)` calls `releaseLinkSlot`. The slot is the one `link:` slot that both `confirm-address` and the sign-in link take, 1 per 60 s.
- `identityProviderFlow.signInLinkToOpen(address)` returns the link of the newest sign-in mail, its shape asserted, on the run's origin.
- `confirmationLinkToOpen`'s docstring now says "the newest such mail".
- `contestantIdentityProviderGate.expectAddressTaken()` checks the lead against the catalogue's `emailTakenNotice`.
- `contestantLoginPage` adds the notice reason `emailTaken`, with its sentence read from the catalogue.
- `contestantSetPasswordGate.logOut()` now waits until the view's script runs before pressing (Deviation 2).

## Verifications this plan adds (carried item)

| Test | Verifications |
|---|---|
| Race, signed in | 7: two registrations (2 each: the callback's sign-in, the operation's check of the current address), A's link, B's failed link, B's second address |
| Race, no session | 6: two registrations, A's link, B's failed link |
| Sign-in by email | 4: one registration, the confirmation link, the sign-in link |
| **Total added** | **17** |

A failed verification is counted as one. The spec now verifies **about 92** tokens per serial run, up from about 75, and its docblock says so. As the dispatch directed, no fixed-wait pacing was built. 179-17 measured that the local stack does not enforce the 30-per-5-minutes `/auth/v1/verify` limit. Both full runs passed with no 429.

## Runs

| Run | Tree | Result | Verdict |
|---|---|---|---|
| `179-unit/179-19-t1-red` (`.log`, `.exit`, `.junit.xml`, `.head`) | the new cases against HEAD d5e128337's route and `loginError.ts` | exit 1: 6 failed, 44 passed. Every failure is an `AssertionError` on a landing, a call list or the key | red as required |
| `179-unit/179-19-frontend-unit` | held set | exit 0: 267 files passed, 1 skipped; 6465 passed, 32 skipped | — |
| `179-unit/179-19-lint`, `-lint-r2`, `-lint-r3` | held set | r1 exit 1 (import order in the spec), r2 exit 1 (svelte-check: a cast in the new unit case), **r3 exit 0** | — |
| `179-e2e/179-19-held` | held set (r1) at d5e128337 | **red, not void**: 610 tests, 586 passed, 1 failed, 23 did not run. The failure was the sign-in-by-email scenario at `loginPage.expectEntryShown()` after F's Log Out. The 23 did-not-run are `perm-closed-project` (22) and its setup, which run after every leaf of the suite. `restore: ok` | not judged as a pass; diagnosed (Deviation 2) |
| `179-e2e/179-19-held-r2` | held set with the fixture fix, at d5e128337 | **610/610**, wrapper exit 0, `restore: ok`, not void, AC | restated **PASS** (`_drivers/179-19-held.verdict.log`): 128 projects, `contestant-identity-provider` 34 → 37, all others equal to `179-18-close`. As written, FAIL only on the slash-less `--dirty-only apps/frontend/src` (`_drivers/179-19-held.verdict-plan.log`) |
| `179-e2e/179-19-close` | committed eb7d14340 | **610/610**, driver and wrapper exit 0, `restore: ok`, `sleep_entries_in_window: 0`, AC at 100 % at both ends | `179-verdict e2e 179-19-close --same-projects-as 179-19-held`: **PASS**, 128 projects, 0 not as expected (`_drivers/179-19-close.verdict.log`) |
| `179-unit/179-19-close-lint` | committed eb7d14340 | `yarn lint:check` exit 0 | — |

Totals: 179-18-close 607 → held-r2 610 → close 610.

The held files of r2 are kept as `tests/e2e-runs/179-e2e/179-19-held-r2.<path with / as __>.kept`; each is byte-identical (`cmp`) to what 84c3e1f28 committed. The r1 copies are kept too.

## Verify blocks (`tests/e2e-runs/179-unit/179-19-t{1,2,3}-verify*.{sh,log,exit,head}`)

- **Task 1**, as written: exit **0**. Re-run at the final head: exit 0.
- **Task 2**, as written: exit 1, at two stages:
  - `grep -q -i -F "race" $S`: the spec describes the scenario as "two identities give one address" and never uses the word "race". The wording was not changed to meet the search.
  - The slash-less `--dirty-only apps/frontend/src`.

  Restated (`179-19-t2-verify-restated.sh`: `grep -q -i -F "two identities give one address"` and `apps/frontend/src/`): exit **0** at 84c3e1f28 and at eb7d14340.
- **Task 3**, as written: exit 1 at `yarn -s` (Yarn 4.18.1). Restated with `yarn lint:check > /dev/null`: exit **0** at eb7d14340.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Test bug before the commit] One new unit case's expectation.** The case for a session that cannot be read expected `authError` together with the race's error. The route reads that session as none, as its docstring says, so the race answers `emailTaken`. The case now expects `emailTaken` and asserts that the log line carries no address. The red run stands: its 6 failures are the arm's absence. This case passed at red only because the old route answered `authError` for everything.

**2. [Rule 1 - Fixture bug] F's Log Out was pressed before the view's script ran.**
- **Found during:** `179-19-held` (red, not void).
- **Observed in the trace:** the click landed about 100 ms after F became visible, while Vite was still connecting. No `/auth/v1/logout` request followed, and F stayed on screen (error context).
- **Inferred:** the button signs out from an `onclick` handler, so a press before hydration does nothing.
- **Fix:** `contestantSetPasswordGate.logOut()` now waits for the view's main button to be enabled (`disabled={!mounted}`, its hydration witness) before pressing.
- **Not on the plan's list:** `contestantSetPasswordGate.fixture.ts`. No other spec called this step.
- **Re-run:** the changed tree was run again as `179-19-held-r2`, which was green. The red run was not repeated on an unchanged tree.

**3. [Rule 3 - Blocking] Login fixture.** The login screen's notice step lives in `contestantLoginPage.fixture.ts`, which is not on the plan's list. It gained the reason `emailTaken`.

**4. [Rule 2 - Documentation made false] Three docs pages and the login page's `@component` text**, all outside the plan's list:
- The auth callback's table in `login-and-password-reset` had no `email_change` row and no failure landing.
- The registration guide said the login screen knows "two reasons".
- The bank-authentication guide's confirmation step said nothing of a failure.

These changes went into one docs commit, eb7d14340, before the close run. `validate:links` exit 0.

**5. [Rule 3 - Recurring] Verify blocks.** `yarn -s` and the slash-less `--dirty-only` are as in earlier plans. The `"race"` search is covered under Task 2 above.

**Spec body:** the new describe and its three tests are what the plan foresees, and no existing test changed. The describe's `afterEach`, which closes the extra browser contexts, is part of that describe.

**Files touched that the plan did not list:**
- `apps/frontend/src/routes/contestant/login/+page.svelte` (docstring only)
- `tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts`
- `tests/tests/fixtures/contestant/contestantSetPasswordGate.fixture.ts`
- the three docs pages

## Statements observed and inferred

- **Observed in a browser, twice** (held-r2 and close):
  - The winner of the race meets F naming the address.
  - The loser, signed in, lands at the app root on CI1 (`none`, `email`) with the taken lead and no error page, gives another address and reaches its home with the reminder.
  - The loser's link opened with no session lands on the login screen with `emailTaken`.
  - A proved identity's first sign-in by an emailed link meets F naming its address, then its home.
- **Observed by unit cases:**
  - A verified `email_change` with no session claims nothing and is a failure.
  - 403 `otp_expired`, a 500 with a code, 502 and status 0 are the auth error without a session.
  - Nothing of the failure, the token or an address reaches the landing.
- **Inferred:**
  - That supabase-js gives the race status 500 and no code. This was read from auth-js source; its browser landing is observed.
  - That a 500 with no code means "taken" (the flagged assumption above).
  - That P2's lone single-confirmation reaches the no-session guard in a browser. No path of the application issues a lone new-address link, so no E2E reaches it; it is unit-tested only.

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the issue:** REG-04's last clause ("it becomes the sign-in identifier once that link is opened") and every failure of that link. E2E-01's identity-provider half follows the real email verify redirect, both `email_change` and the sign-in `magiclink`. `requirements-completed: [REG-04, E2E-01]`.
- **OWASP / threat register:**
  - T-179-191: an `email_change` with no session is a failure (unit cases).
  - T-179-192 / PROH-179-28: without a session, the notice comes only from the status and code, names no address and tells only the link's holder about the link's own address. With a session, only the caller's own pending address is spoken of, through `pending_email_taken`.
  - T-179-193: the claim runs only on a verified `email_change` with a session. J3 makes it write nothing for an identity-provider account.
  - T-179-SC: no package installed.
  - The auth-service email-existence oracle is not touched. It stays accepted as a residual per the operator's decision of 2026-10-22, recorded in `179-CARRIED-ITEMS.md`.
- **`any`:** none. The unit case casts its fake `locals` through `Promise<unknown>`.
- **Repetition:** `signInLinkToOpen` repeats five lines of `invitationFlow.signInLinkToOpen`. The identity-provider spec does not use the invitation flow's worker fixture, which carries reserved-row state. A shared mail-link helper would remove the copy (code review).
- **Documentation:** TSDoc on the constant, both helpers and every new fixture step; the route's docblock; the three docs pages; the spec docblock (coverage, writes, the verification count).
- **Tracking:** no new user-facing function.
- **Svelte / context rule:** no component logic changed. The login page's docstring changed only. No `view-transition-name`, no `<dialog>`.
- **Errors:** a session read that fails is logged by error name only. Every failure ends in a redirect, never an error page.
- **Shared dependencies:** the other arms are unchanged and their 36 earlier cases pass. The notice map is wider, and the existing `contestant-entry-*` specs pass in both full runs.
- **WCAG / keyboard:** the notice is the existing notice region (axe-scanned through its `authError` pairing), and CI1's lead is the existing lead. No new markup.
- **Comment hygiene:** `assert:comment-hygiene` 0 before each commit and inside `lint:check`. No ids or history in comments or titles.
- **Commits:** one code commit and one docs commit, linear; no `[db]` change.

## Carried item

| Item | Outcome |
|---|---|
| (179-10 / 179-17 / 179-18) Pacing of `/auth/v1/verify` | No fixed-wait pacing was built. This plan adds **17** verifications, and the spec now makes **about 92** per run. Both are recorded in the spec docblock and above. |

## Items to report rather than edit

- **`contestantIdentityProviderGate.logOut()`** (CI1's Log Out, used by `returnWithNoAddress` and its scan) also clicks without waiting for the view's script. Its button may have the same pre-hydration window as F's had. It passed in every run so far, so this is unmeasured, but it is a latent flake of the same shape. Settle in 179-24 or code review.
- **`179-UI-SPEC.md`** (no-edit) § *Interaction truths*, the research row "The confirmation link's landing ⚠ unresolved": now resolved by observation (the tracer and this plan's race tests). T-15's description of the callback ("every other verified type to the app root; a failure goes to A with `authError`") no longer holds for `email_change`.
- **`179-RESEARCH.md`** (no-edit) § RQ-1 and Open Question 6 ("a 500 … that the callback cannot tell from any other failure"): the callback tells it from an invalid token by status and code (P4), with the flagged assumption above.
- **`apps/docs/.../backend/authentication/+page.md`** says mailed links are "the recovery link, and the sign-in link of an invitation or of a returning user". It does not mention the confirmation link, and no later plan lists the page. Settle in 179-22 or 179-24.
- **`tests/README.md` § the auth budget:** the 179-17/18 item stands. The spec now verifies about 92 tokens per run.
- **CLAUDE.md:** I found no sentence made false.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. No new endpoint; the callback's existing route gains one arm.

## Self-Check: PASSED

- Commits 84c3e1f28 and eb7d14340 are ancestors of HEAD; `git rev-list --count d5e128337..HEAD` = 2 before this summary.
- `tests/e2e-runs/179-e2e/179-19-held-r2/results.json` and `179-19-close/restore.txt` (`restore: ok`) exist. `_drivers/179-19-held.verdict.log` and `_drivers/179-19-close.verdict.log` end in PASS.
- `tests/e2e-runs/179-unit/179-19-t1-red.exit` is 1, and `179-19-close-lint.exit` is 0.
- `git status` shows nothing outside `.planning/` but the operator's `CAND-APP-PLAN.md`.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC and CLAUDE.md were not touched.
