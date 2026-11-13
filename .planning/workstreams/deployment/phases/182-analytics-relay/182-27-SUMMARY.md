---
phase: 182-analytics-relay
plan: 27
subsystem: e2e-contestant-consent
tags: [analytics, consent, contestant-app, terms-of-use, e2e, playwright, wcag, axe]
status: complete

requires:
  - phase: 182-18
    provides: the opt-out box terms-tracking-opt-out, the usage-data section of the terms, the consent control on the Contestant privacy page
  - phase: 182-10
    provides: createRelayCapture, readDeviceState / expectOnlyAllowedDeviceState, the stand-alone analytics projects
  - phase: 182-20
    provides: the voter-prefs-tracking project's current testMatch, relayProxy.fixture.ts
provides:
  - tests/tests/specs/contestant/contestant-terms-tracking.spec.ts (six serial tests, two users registered in beforeAll)
  - testIds.contestant.terms.trackingOptOut
  - seven opt-out steps and expectLeft on createContestantTermsOfUsePage
  - createContestantPrivacyPage (open, expectConsentControl, refuse)
  - the granting and refusing users in testCredentials.ts, unregistered and asserted gone by the perm-analytics-tracking teardown
  - the spec collected by voter-prefs-tracking (default run) and analytics-default-standalone (stand-alone run)
affects: [182-22, 182-24, 182-28, 182-29, 182-31]

estimate:
  tokens: 70000
  tasks: 2
actuals:
  tokens: 10890     # chars/4 over the two code commits' diff (43558 chars)
  tasks: 2
  commits: 3        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: d563bda173ad98cf741cdc12c2cd0048420cb80e
plan_head_after: e5969b8e638c8af42e4b035ff8b2a39f43c40a53

tech-stack:
  added: []
  patterns:
    - "A spec that needs its own terms-pending users registers them in beforeAll with registerAndStoreSession, each in a context of its own, and reads them back per describe through test.use({ storageState })"
    - "A Contestant spec runs the shared axe core on a view it reached itself by calling assertAxeScan with toScanEntry, so the reach proof and the gate are those of every other scan"
    - "A project that collects specs from two directories uses the specs root as testDir and a directory-anchored testMatch"

key-files:
  created:
    - tests/tests/specs/contestant/contestant-terms-tracking.spec.ts
    - tests/tests/fixtures/contestant/contestantPrivacyPage.fixture.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/27-gates.txt
  modified:
    - tests/tests/utils/testIds.ts
    - tests/tests/utils/testCredentials.ts
    - tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts
    - tests/tests/setup/perm/perm-analytics-tracking.teardown.ts
    - tests/tests/fixtures/shared/relayCapture.fixture.ts
    - tests/playwright.config.ts

key-decisions:
  - "The stand-alone teardown project data-teardown-analytics-standalone points at perm-analytics-tracking.teardown.ts, so the one teardown file serves both runs; analytics-standalone.teardown.ts was not created"
  - "The two users are the dataset's two member candidates (e2e-perm-analytics-ca-1-1a and -ca-2-1a) under the perm-* email convention and the suite's existing TEST_CANDIDATE_PASSWORD"
  - "voter-prefs-tracking and analytics-default-standalone now use testDir './tests/specs' with a directory-anchored testMatch, so the Contestant spec joins them without a second project"
  - "The axe scan is the light one only, through the shared core; the existing contestant-terms-gate scans keep the view's two themes"

requirements-completed: []

duration: 8min
completed: 2026-10-19
---

# Phase 182 Plan 27: The Contestant terms-gate consent spec Summary

**A six-test serial spec, `contestant-terms-tracking.spec.ts`, observes the Contestant App's bundled consent in a browser. It registers two terms-pending users of the `perm-analytics-tracking` dataset in `beforeAll` with `registerAndStoreSession` and `acceptTermsOfUse: false`. It shows the opt-out box unticked, runs the shared axe scan with the box visible, reaches the box with Tab and toggles it with Space, finds the usage-data section in the terms, holds the view to 320 px, shows that accepting stores `granted` (then a `menu_open` with a UUIDv7 id and id-free Contestant pageviews are sent) and that accepting with the box ticked stores `denied` (then only pageviews are sent), that the privacy page offers the consent control and refusing there stores `denied`, and that the device holds only allow-listed state. The dataset's teardown unregisters both users and asserts it. The spec is in the default run and the stand-alone run. Tests typecheck, tests lint and the a11y wiring guard are green on `e9e6a1bd6`. No E2E run was made.**

Start sha: `d563bda173ad98cf741cdc12c2cd0048420cb80e`.

## Performance

- Duration: about 8 min (20:14Z to 20:22Z)
- Tasks: 2 of 2
- Files: 2 created, 6 modified, plus the gate record

## Accomplishments

### Task 1 (`66e555153`)

- **Test id.** `testIds.contestant.terms.trackingOptOut = 'terms-tracking-opt-out'`, beside `checkbox` and `submit`.
- **Fixture** `createContestantTermsOfUsePage`. These methods each locate the box only by that test id:
  - `expectTrackingOptOutUnticked()`;
  - `expectNoTrackingOptOut()`;
  - `tickTrackingOptOut()`;
  - `toggleTrackingOptOutByKeyboard()`, which focuses the terms checkbox, presses Tab, asserts the box has the focus, then presses Space;
  - `isTrackingOptOutTicked()`;
  - `expectTrackingOptOutInsideViewport()`;
  - `expectUsageDataInTerms()`, which opens the collapsed terms section through its "Expand or collapse this section" toggle and asserts the `h2` named by the English `privacy.usageData.title`, read from `messages/en/privacy.json`.

  The fixture also gains `expectLeft()`: Continue is hidden, which is what the rerun after an acceptance does. The rigidity contract line is kept.
- **Users.** `testCredentials.ts` declares `ANALYTICS_TERMS_GRANTING_*` and `ANALYTICS_TERMS_REFUSING_*`. Each has an external id, an email `<external id>@test.openvaa.local` and a storage-state path under `playwright/.auth/`, and both use `TEST_CANDIDATE_PASSWORD`. The module docblock has a section on them. No new password or key was added.
- **Teardown.** `perm-analytics-tracking.teardown.ts` now does the following, in order:
  1. Unregisters both emails with `unregisterCandidate`.
  2. Asserts `hasAuthUser(email) === false` for each, with a message naming the address.
  3. Runs `runTeardownAsserted` as before.
  4. Removes both stored-session files.
- **Which teardown case applied:** the stand-alone project `data-teardown-analytics-standalone` has `testMatch: /perm-analytics-tracking\.teardown\.ts/`. It points at the same file, so the stand-alone path gets the same change and `analytics-standalone.teardown.ts` was not created.

### Task 2 (`e9e6a1bd6`, gates `e5969b8e6`)

**The spec** `tests/tests/specs/contestant/contestant-terms-tracking.spec.ts` is one serial describe.

**Setup:**
- `beforeAll` registers the two users. Each gets a fresh Desktop Chrome context with the project's `baseURL` and is registered with `settledTestId: terms.submit`.
- `beforeEach` attaches `createRelayCapture(context)` before the test's first navigation.
- Nested describes pick the stored session with `test.use({ storageState })`.

**The six tests:**
1. **"the opt-out box is shown, unticked and accessible"** (granting user):
   - opens the view and settles it;
   - checks that the box is unticked;
   - runs `assertAxeScan(page, toScanEntry(OPT_OUT_SCAN, …, false), …)`, anchored on the box with the reach marker `terms.submit`;
   - Tab plus Space ticks the box, and again unticks it, each read with `expect.poll`;
   - the usage-data heading is in the terms.
2. **"the view reflows at 320 px"** (granting user, `viewport 320x568`, `isMobile`, `hasTouch`): no horizontal overflow, the box unticked, and the box inside the viewport.
3. **"accepting without ticking grants"** (granting user):
   - accepts, the view is left, and `expectLanded` confirms the user is on its candidate's home;
   - the stored `dataCollection.consent` (read through `readDeviceState`) polls to `granted`;
   - the test settles, opens and closes the menu, and flushes until a `menu_open` is captured;
   - every `menu_open` has a UUIDv7 id;
   - there is at least one pageview, all pageviews are under `CONTESTANT`, and none has an id.
4. **"accepting with the box ticked refuses"** (refusing user):
   - ticks both boxes and accepts, then lands on its home;
   - the stored choice polls to `denied`;
   - the test opens and closes the menu and flushes until the home's pageview (route under `CONTESTANT_ENTITY`) is captured;
   - every captured event is a `pageview`.
5. **"the choice can be changed on the privacy page"** (granting user): `createContestantPrivacyPage` opens `/contestant/privacy`, asserts both `DataConsent` buttons, presses the refusing one (which is then disabled), and the stored choice polls to `denied`.
6. **"the device holds only allow-listed state"** (granting user): the user lands on its home, the menu is opened and closed, and `expectOnlyAllowedDeviceState(context, page)` passes.

**Rules kept.** No `expect.soft`, no `try`/`catch`, no retry and no skip. The spec has no locator of its own; its only `page.evaluate` is the flush helper.

**Configuration** (`tests/playwright.config.ts`):
- `voter-prefs-tracking` and `analytics-default-standalone` both have `testDir: './tests/specs'` and `testMatch: /[\\/](voter[\\/](voter-prefs-tracking|analytics-privacy|analytics-gpc)|contestant[\\/]contestant-terms-tracking)\.spec\.ts$/`. The stand-alone project lists the voter files in its own order.
- Names, `fullyParallel: false`, devices and dependencies are unchanged.
- Three comments now say what the projects hold and what the new spec writes: the perm-analytics comment, the `voter-prefs-tracking` comment and the stand-alone section comment.

**Comment fix (handover).** The header of `relayCapture.fixture.ts` no longer claims that the context listener sees sends made as a document is left. A new "What it does not see" section points to `startRelayRecordingProxy()`.

## Verification

| Check | Result |
|-------|--------|
| Task 1 grep (`trackingOptOut: 'terms-tracking-opt-out'`, fixture uses it) | exit 0 |
| Task 1 `yarn eslint` on the four files | exit 0 |
| `--list --project voter-prefs-tracking` | exit 0; the 6 spec tests are listed |
| `PLAYWRIGHT_ANALYTICS_STANDALONE=1 … --list --project analytics-default-standalone` | exit 0; 22 tests in 6 files, the 6 spec tests among them |
| `--list --grep-invert @probe` (default run) | exit 0; 548 tests in 127 files (542 after 182-21, +6). The spec is collected by `voter-prefs-tracking` only |
| Task 2 spec grep (`registerAndStoreSession`, `acceptTermsOfUse: false` ×2, `expectNoHorizontalOverflow`) | exit 0 |
| Prettier and `node scripts/assert-comment-hygiene.mjs` on the changed files | clean; 0 violations |
| Closing gates: attempt `20261019T202042Z.e9e6a1bd6` on `e9e6a1bd6`, tree clean before and after, HEAD unchanged | `TYPECHECK_TESTS_EXIT=0`, `ESLINT_TESTS_EXIT=0`, `A11Y_WIRING_EXIT=0` |
| Slot `27-gates` record verify, as written in the plan, after the record commit | exit 0 |
| No `(182-27):` commit lists `tests/scripts/e2e-run.sh` | 0 |

- `yarn eslint tests` printed one warning that was already there: an unused `no-console` disable in `tests/tests/support/mockOidcIssuerEntry.ts`. The exit was 0.
- No E2E run was made, and no stack or dev server was started. The shared stack `openvaa-local` stayed stopped.

## Deviations from Plan

1. **[Plan scope] A new fixture file, `tests/tests/fixtures/contestant/contestantPrivacyPage.fixture.ts`.**
   - **Why:** the privacy-page test needs locators for the `DataConsent` buttons, and the plan's environment requires every locator to sit behind a fixture. No fixture of the Contestant privacy page existed.
   - **Where:** the file is outside `files_modified`. It is in commit `e9e6a1bd6`.
2. **[Plan intent, stricter] The keyboard step reaches the box with Tab from the terms checkbox, then presses Space.**
   - The plan said "focus it, then press Space". The step asserts that the box receives the focus after one Tab, which also holds the tab order 182-18 asked about.
3. **[Plan intent] `expectTrackingOptOutInsideViewport()` scrolls the box into view first.**
   - At 320x568 the box sits below the terms checkbox, likely under the fold, and `toBeInViewport` does not scroll.
   - What is asserted is that no part of the box lies beside the viewport (ratio 1 after scrolling).
   - The existing `expectCheckboxInsideViewport()` is unchanged.
4. **[Plan intent, stricter] Extra hard assertions in the acceptance and session tests.**
   - Tests 3, 4 and 6 assert with `expectLanded` that the user reached its own candidate's home.
   - Test 3 asserts that every `menu_open` id is a UUIDv7, not only present.
   - Test 5 also refuses through the control and asserts that `denied` is stored, so "the choice can be changed" is observed, not only the control's presence.
5. **[Plan intent] The usage-data step opens the terms section.** `TermsOfUseForm` renders the terms in a collapsed `Expander`, whose content is mounted only when expanded. The step therefore opens the section before it asserts the heading.
6. **[Handover, not plan] `relayCapture.fixture.ts` header corrected**, comment only, in `e9e6a1bd6`. `deferred-items.md` marks the item resolved.
7. **[Plan intent] An eighth fixture method, `expectLeft()`.** The acceptance tests need a step that waits until the rerun has removed the view.
8. **[Shared checkout] The worktree allow-list was not applied.** The checkout is a linked worktree on the operator's integration branch `feat/deployment-terraform-supabase`. The protected-branch check returned `false`.
9. **[Orchestrator instruction] State was not advanced and no requirement was ticked.** `state.advance-plan` and `state.record-session` were not run, and STATE.md was not edited.

## Known Stubs

None.

## Threat Flags

None. No product file changed.

- **T-182-86:** mitigated. The teardown unregisters both emails and asserts `hasAuthUser` is false. The stand-alone teardown runs the same file. `registerAndStoreSession` removes an earlier holder before it registers.
- **T-182-88:** mitigated. The spec covers the axe scan with the box visible, Tab and Space, and the 320 px reflow. The focus ring's visibility is still not observed by a person; plan 182-29 carries that line.
- **T-182-110:** mitigated. The users use the existing `TEST_CANDIDATE_PASSWORD` and the existing `test.openvaa.local` email form.

## Notes for later plans

- **182-24 (the runs).** These first-run risks are all **UNCONFIRMED** in a real app run:
  1. **`beforeAll` time.** Two registrations, each with a sign-in, run under the default 90 s hook budget (`TIMEOUTS.testMax`).
  2. **The section toggle.** `expectUsageDataInTerms()` calls `check()` on the DaisyUI collapse input. `entityFilters.fixture.ts` clicks the same toggle.
  3. **Scrolling at phone width.** `scrollIntoViewIfNeeded`, then `toBeInViewport({ ratio: 1 })`, at 320x568 with `isMobile`.
  4. **The menu on the Contestant entity home.** `openMobileNav()` on that page under Desktop Chrome, as the voter specs use it on the voter pages.
  5. **The refusing test's wait.** It waits for a pageview whose route id is under `CONTESTANT_ENTITY`, and assumes the entity home is not left by a client navigation before the hand flush.
  6. **Device state in a Contestant session.** Whether `expectOnlyAllowedDeviceState` accepts every localStorage key the Contestant app writes.
  7. **The axe scan of the view with the box visible.** This is its first scan.
  - Every test needs `ANALYTICS_PROVIDER=log` and the default consent mode, or the box is absent and test 1 fails at `expectTrackingOptOutUnticked`.
  - The project's default listing is now 20 tests in 4 files. The stand-alone listing is 22 tests in 6 files, setup and teardown included.
- **182-31 (free-mode run of `analytics-default-standalone`).**
  - In consent-free mode the box is not shown, by design. Test 1 fails at `expectTrackingOptOutUnticked`, and tests 2 to 6 do not run because the describe is serial.
  - That failure is expected, but count tests 2 to 6 as not run, not as passed.
  - A free-mode control for this spec would assert `expectNoTrackingOptOut()`, which the fixture provides.
- **182-22 (sweep).**
  - `scripts/assert-a11y-scan-wiring.mjs` does not list the new spec in Check 4a. The spec complies, because it uses the shared `assertAxeScan`. This is logged in `deferred-items.md`.
  - The stale "runs two spec files" comment that 182-21 noted on the stand-alone section is fixed here.
  - `perm-analytics-tracking.setup.ts`'s docblock still says the slice is "UNAUTHENTICATED" and that the template seeds a "platform object". Both are now stale: the spec signs users in, and the template no longer seeds `platform`. That file was not this plan's; the fix is comment only.
- **182-28 (full suite):** the default run lists 548 tests. This plan declares no skip.

## Self-Check: PASSED

- FOUND: `tests/tests/specs/contestant/contestant-terms-tracking.spec.ts`, `tests/tests/fixtures/contestant/contestantPrivacyPage.fixture.ts` and `evidence/27-gates.txt`. The record is `cmp`-equal to the current attempt file.
- FOUND: commits `66e555153`, `e9e6a1bd6` and `e5969b8e6`, each an ancestor of HEAD.
