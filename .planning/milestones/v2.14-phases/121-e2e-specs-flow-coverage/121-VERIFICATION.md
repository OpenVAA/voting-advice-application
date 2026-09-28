---
phase: 121-e2e-specs-flow-coverage
verified: 2026-06-17T00:00:00Z
status: passed
score: 9/9 must-haves verified
overrides_applied: 0
deferred:
  - truth: "EFLOW-02: alliance-card rendering and member-orgs drawer in voter results"
    addressed_in: "Phase 130"
    evidence: "REQUIREMENTS.md traceability table: EFLOW-02 | Phase 130 | Pending; depends on UNBLK-06 (alliance render, built Phase 129)"
  - truth: "EFLOW-10: bank-auth (Signicat/Idura OIDC) round-trip"
    addressed_in: "Phase 122"
    evidence: "REQUIREMENTS.md traceability table: EFLOW-10 | Phase 122 | Pending"
---

# Phase 121: E2E Specs — Flow Coverage Verification Report

**Phase Goal:** The voter and candidate end-to-end flow behaviours — entity filters, answer comparison, category breakdown, navigation, locale/theme/preference round-trips, nav menus, and a mobile interactive journey — are exercised and asserted (alliance and bank-auth flows are handled in their own phases). All specs must pass 3× (3× determinism standard).
**Verified:** 2026-06-17
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | EFLOW-01: voter-journey asserts categorical filter select-all/none + text×filter intersection + reset restoring full 13-card list | VERIFIED | `voter-journey.spec.ts` L1261–1306: `test.step('EFLOW-01: select-all/none control…')` — `selectAll()` → 13 cards; `selectNone()` → 0 cards; toggle ABSENT on ≤3-option filter; `setTextFilter('polar')` ∩ Party=BB → 1 card; `clearTextFilter()` + reset → 13 cards. Commits `2aa39c6df`. |
| 2 | EFLOW-03: voter-journey asserts the 4-case voter-vs-entity answer comparison matrix | VERIFIED | `voter-journey.spec.ts` L1036–1039: `// EFLOW-03: 4-case voter-vs-entity comparison` traceability comment at the `entityDetails.expectQuestionDisplay` matrix (agree/disagree/voter-missing/entity-missing). Re-confirm only; underlying assertions unchanged. Commit `72cafa498`. |
| 3 | EFLOW-04: voter-journey asserts per-category subMatch CORRECT values for one pinned candidate (only voter-answered categories appear; each gauge value equals its expected score) | VERIFIED | `voter-journey.spec.ts` L793–827: pins `test-ca-bb-1` via `TEXT_RE.polarMax`, asserts gauge count == 4, then each `aria-valuenow` by label: Base=100, Opt-A=50, Opt-B=50, Regional=100. Module-scope `gaugeMeterByLabel` helper. Values DERIVED at build by reading rendered `aria-valuenow`. Commit `a637bede7`. |
| 4 | EFLOW-05: voter-journey asserts skip/delete/back nav + answer-count→results-CTA | VERIFIED | `voter-journey.spec.ts` L637–641 and L726–727: `// EFLOW-05: skip + delete/back nav + answer-count→results-CTA` traceability comments at the skip/category-skip/min-answers-gate/delete/back sites. Re-confirm only; assertions unchanged. Commit `72cafa498`. |
| 5 | EFLOW-06: perm-localisation-positive reaches in-flight state BEFORE switching and asserts selections + answers survive fi→en→fi | VERIFIED | `perm-localisation-positive.spec.ts` L95, L456–464: `test('in-flight selections + answers survive fi→en→fi locale switch (EFLOW-06)')`. Uses `walkUntilQuestionsIntro` + capped `answerAndAdvanceToResults(page,'max',1)`, then `langSelector.switchTo('en'/'fi')`. Module-scope `expectInFlightStatePreserved` asserts resolved `electionId` in URL (selection) + byte-identical `MatchScore` (answer) after each full-reload switch. Commit `63f631fef`. |
| 6 | EFLOW-07: voter-dark-mode.spec.ts asserts dark theme applied via emulateMedia and persists across reload; a11y-smoke adds a dark-contrast axe scan — NO toggle/localStorage | VERIFIED | `voter-dark-mode.spec.ts`: `createThemeReader(page)` → `setColorScheme('dark')` → `goto('/en')` → `expectTheme('dark')` → `page.reload()` → `expectTheme('dark')` → `setColorScheme('light')` → `expectTheme('light')`. Zero localStorage/toggle/dark-class usage (5 comment-only references explicitly disclaiming those). `a11y-smoke.spec.ts` L164–176: dark-contrast loop inside unlocated-route `for…of`, `emulateMedia({colorScheme:'dark'})`, `assertAxeGates(results, testInfo, \`${route.name}-dark\`)`. Commits `eea5d2589`, `61472a2d9`. |
| 7 | EFLOW-08: voter-prefs-tracking.spec.ts asserts tracking emission under consent + suppression without consent + user-preferences round-trip; spec is hosted under the perm-analytics-tracking node (analytics-armed singleton); D-01 seed uses a dummy analytics code | VERIFIED | `voter-prefs-tracking.spec.ts` has 3 tests: (a) SUPPRESSED without consent (`getTrackCalls().toEqual([])`), (b) EMITS under consent (`getTrackCalls().length > 0`, pageview + `dataConsent_granted` startEvent), (c) prefs round-trip (consent + feedback.status + survey.status survive reload). Spec hosted under `voter-prefs-tracking` project depending on `data-setup-perm-analytics-tracking`. `perm-analytics-tracking.ts` seeds `analytics.platform = { name:'umami', code:'e2e-dummy-code', infoUrl:'https://example.test/umami' }` + `trackEvents:true`; no real key committed. `grantConsentViaPopup` scopes to `getByRole('dialog')`. `flushTrackingBuffer` forces `visibilitychange` for same-window emission capture. Commit `979217361`. |
| 8 | EFLOW-09: candidate-journey asserts candidate nav-menu differs between logged-out and logged-in; perm-1e1cg1co and perm-disable-election-1co assert voter conditional nav items omitted on not-selectable seeds (D-02) | VERIFIED | `candidate-journey.spec.ts` L344–356: step 2.5 logged-out `expectNavMenuItems([...CANDIDATE_NAV_LOGGED_OUT])`; L719–746: step 19.5 logged-in — `expectNavMenuItems([...CANDIDATE_NAV_LOGGED_IN])` + `assertCandidateAuthNavPresent` (candidate-nav-* testids) + the two sets differ asserted. `perm-1e1cg1co.spec.ts` and `perm-disable-election-1co.spec.ts`: `navMenu.openMobileNav()` then `items().filter({hasText: SELECT_ELECTION_LABEL}).toHaveCount(0)` and same for SELECT_CONSTITUENCY_LABEL. Commits `161cb50d1`, `7281385f9`. |
| 9 | EFLOW-11: voter-journey-mobile.spec.ts runs an interactive voter journey at the 390×844 mobile viewport; D-03 mobile sub-tests added to perm-question-video and perm-interactive-info | VERIFIED | `voter-journey-mobile.spec.ts`: full `answeredVoterPage` walk under `voter-journey-mobile` project (390×844, `isMobile:true`, `hasTouch:true` at project scope); exercises party-card entity-details drawer, derived text filter (narrow + clear-restore), `navMenu.openMobileNav()` + feedback dialog. `perm-question-video.spec.ts` and `perm-interactive-info.spec.ts`: scoped `test.describe('mobile viewport smoke')` with `test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true})` — descriptor never leaks to sibling desktop tests. Shared `walkUntilQuestionsIntro` consent guard (`addLocatorHandler`) added to `voter-journey.fixture.ts` (commit `315b98bba`). Commits `93e681ae1`, `1320fdc30`, `4fe10dead`, `fb23d6ada`. |

**Score:** 9/9 truths verified

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | EFLOW-02: alliance-card rendering and member-orgs drawer | Phase 130 | REQUIREMENTS.md traceability: "EFLOW-02 | Phase 130 | Pending"; depends on UNBLK-06 (Phase 129) |
| 2 | EFLOW-10: bank-auth OIDC round-trip | Phase 122 | REQUIREMENTS.md traceability: "EFLOW-10 | Phase 122 | Pending" |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `tests/tests/specs/voter/voter-journey.spec.ts` | EFLOW-01/04 extensions + EFLOW-03/05 traceability | VERIFIED | selectAll/selectNone (2 calls), EFLOW-03/EFLOW-05 comments (8 occurrences), aria-valuenow assertions (9 occurrences) |
| `tests/tests/specs/perm/perm-localisation-positive.spec.ts` | EFLOW-06 in-flight state-preserved slice | VERIFIED | `expectInFlightStatePreserved` helper + second test at L471 |
| `tests/tests/specs/candidate/candidate-journey.spec.ts` | EFLOW-09 candidate auth-state nav | VERIFIED | Steps 2.5 + 19.5 with CANDIDATE_NAV_LOGGED_OUT/IN + assertCandidateAuthNavPresent |
| `tests/tests/specs/perm/perm-1e1cg1co.spec.ts` | EFLOW-09 D-02 voter conditional nav omission | VERIFIED | navMenu.openMobileNav() + SELECT_ELECTION_LABEL/SELECT_CONSTITUENCY_LABEL count-0 assertions |
| `tests/tests/specs/perm/perm-disable-election-1co.spec.ts` | EFLOW-09 D-02 voter conditional nav omission | VERIFIED | Same pattern as perm-1e1cg1co.spec.ts |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | EFLOW-07 dark-contrast extension | VERIFIED | Dark variant in unlocated-route loop at L164–176 |
| `tests/tests/specs/voter/voter-dark-mode.spec.ts` | EFLOW-07 NEW leaf spec | VERIFIED | Exists; emulateMedia mechanism; no toggle/localStorage/dark-class; HARD assertions |
| `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` | EFLOW-08 NEW spec (under perm project) | VERIFIED | Exists; 3 tests; trackingIntercept + consent popup + prefs round-trip |
| `tests/tests/specs/voter/voter-journey-mobile.spec.ts` | EFLOW-11 NEW mobile leaf spec | VERIFIED | Exists; mobile walk + drawer + filter + mobile nav + feedback |
| `tests/tests/specs/perm/perm-question-video.spec.ts` | EFLOW-11 D-03 mobile sub-test | VERIFIED | Scoped `test.describe('mobile viewport smoke')` at L106–148 |
| `tests/tests/specs/perm/perm-interactive-info.spec.ts` | EFLOW-11 D-03 mobile sub-test | VERIFIED | Scoped `test.describe('mobile viewport smoke')` at L148–157 |
| `packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts` | D-01 analytics overlay seed (dummy code, trackEvents:true) | VERIFIED | Exists; platform `{name:'umami',code:'e2e-dummy-code',…}` + `trackEvents:true`; no real key |
| `packages/dev-seed/src/templates/index.ts` | registry import/map/re-export | VERIFIED | import L22, map entry L119, re-export L145 |
| `tests/tests/setup/perm/perm-analytics-tracking.setup.ts` | D-01 seed setup | VERIFIED | Exists |
| `tests/tests/setup/perm/perm-analytics-tracking.teardown.ts` | D-01 prefix-scoped teardown | VERIFIED | Exists |
| `tests/playwright.config.ts` | 3 new leaf projects + perm-analytics-tracking triad | VERIFIED | voter-dark-mode (L240), voter-journey-mobile (L253), data-setup-perm-analytics-tracking (L952), data-teardown-perm-analytics-tracking (L958), voter-prefs-tracking (L962) |
| `tests/tests/fixtures/voter/voter-journey.fixture.ts` | Shared DataConsentPopup guard (EFLOW-11 fix) | VERIFIED | `addLocatorHandler` at L143–145 of walkUntilQuestionsIntro |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `voter-journey.spec.ts` | `entityFilters.fixture.ts` | `selectAll()`, `selectNone()`, `setTextFilter`, `clearTextFilter` | WIRED | Called at L1267, L1275, L1290, L1302 |
| `voter-journey.spec.ts` | subMatch score gauges | `gaugeMeterByLabel` + `aria-valuenow` | WIRED | Per-category assertions at L816–827 |
| `perm-localisation-positive.spec.ts` | `voter-journey.fixture` walk helpers | `walkUntilQuestionsIntro`, `answerAndAdvanceToResults` | WIRED | Imported L64; used in EFLOW-06 test at L478 |
| `voter-dark-mode.spec.ts` | `theme.fixture` | `createThemeReader`, `setColorScheme`, `expectTheme` | WIRED | Imported L30; used in the sole test |
| `a11y-smoke.spec.ts` | `page.emulateMedia` | dark-mode contrast loop | WIRED | `emulateMedia({colorScheme:'dark'})` at L171 |
| `voter-prefs-tracking.spec.ts` | `trackingIntercept.fixture` | `createTrackingIntercept`, `getTrackCalls`, `clear` | WIRED | Imported L57; used in EMITS + SUPPRESSION tests |
| `voter-prefs-tracking.spec.ts` | `data-setup-perm-analytics-tracking` project | analytics-armed app_settings singleton | WIRED | `dependencies: ['data-setup-perm-analytics-tracking']` in playwright.config.ts L967 |
| `candidate-journey.spec.ts` | `navMenu.fixture` | `createNavMenu`, `openMobileNav`, `expectNavMenuItems` | WIRED | Imported L68; used in steps 2.5 and 19.5 |
| `perm-1e1cg1co.spec.ts` | `navMenu.fixture` | nav-item count-0 assertion | WIRED | Imported L9; used at L31–38 |
| `voter-journey-mobile.spec.ts` | `voter-journey.fixture` (mobile project descriptor) | `answeredVoterPage` walk + `openMobileNav` | WIRED | Project-level 390×844 descriptor; walk at project scope |
| `perm-question-video.spec.ts` | describe-scoped mobile viewport | `test.use({viewport,isMobile,hasTouch})` inside `mobile viewport smoke` | WIRED | L116 scoped test.use |
| `perm-interactive-info.spec.ts` | describe-scoped mobile viewport | `test.use({viewport,isMobile,hasTouch})` inside `mobile viewport smoke` | WIRED | L157 scoped test.use |

### Data-Flow Trace (Level 4)

Not applicable. This is a pure E2E test-coverage phase: specs + dev-seed template. No production components or data providers were modified. The spec assertions verify rendered browser state, not production data flow.

### Behavioral Spot-Checks

| Behavior | Evidence | Status |
|----------|----------|--------|
| Full suite 125/125, 0 failed, 0 did-not-run (final wave-merge gate) | Plan 08-SUMMARY: "full `yarn test:e2e` is GREEN: 125 passed / 0 failed / 0 did-not-run". Orchestrator confirms 125 passed, exit 0. | PASS |
| voter-journey project passes 3× with EFLOW-01/04 extensions | Plan 01-SUMMARY: "5/5 consecutive green after the L570 fix". All EFLOW-01/04 assertions passed in every run (~18 total). | PASS |
| voter-dark-mode project passes 3× | Plan 06-SUMMARY: "3× `--no-deps` reruns: 1 passed each (cardinal gate)" | PASS |
| voter-prefs-tracking project passes 3× (3 tests) | Plan 07-SUMMARY: "3/3 tests pass, 3× determinism gate green (re-seeding the analytics overlay before each `--no-deps` rerun)" | PASS |
| voter-journey-mobile project passes 3× | Plan 08-SUMMARY: "each of the three projects passes 3× (`--no-deps` after its setup)" | PASS |
| perm-localisation-positive passes 3× | Plan 02-SUMMARY: "verified the spec passes 3× via `--no-deps`" | PASS |
| candidate-journey passes 3× (with deps, stateful journey) | Plan 03-SUMMARY: "3x green WITH its setup deps (stateful registration journey)" | PASS |

### Probe Execution

Not applicable. This phase has no `scripts/*/tests/probe-*.sh` files.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| EFLOW-01 | Plan 01 | Voter-results entity filters: categorical select-all/none + text×filter intersection + reset | SATISFIED | voter-journey.spec.ts L1261–1306; 2 selectAll/selectNone calls; intersection to 1 card; reset to 13 |
| EFLOW-03 | Plan 01 | 4-case voter-vs-entity answer comparison | SATISFIED | voter-journey.spec.ts L1036–1039; re-confirm-only traceability comment at existing matrix |
| EFLOW-04 | Plan 01 | Per-category subMatch correct values for pinned candidate | SATISFIED | voter-journey.spec.ts L793–827; `aria-valuenow` assertions: Base=100, Opt-A=50, Opt-B=50, Regional=100 |
| EFLOW-05 | Plan 01 | Skip/delete/back nav + answer-count→results-CTA | SATISFIED | voter-journey.spec.ts L637–641, L726–727; re-confirm-only traceability comments at existing assertions |
| EFLOW-06 | Plan 02 | Mid-session locale switch fi→en→fi with state preserved | SATISFIED | perm-localisation-positive.spec.ts L471; `expectInFlightStatePreserved` asserts electionId + MatchScore survive each full-reload switch |
| EFLOW-07 | Plan 06 | Dark-mode applied + persists via emulateMedia; dark-contrast axe scan | SATISFIED | voter-dark-mode.spec.ts (emulateMedia, expectTheme, no toggle/storage); a11y-smoke.spec.ts L164–176 (dark axe loop) |
| EFLOW-08 | Plans 04/05/07 | User-prefs round-trip + tracking emit under consent + suppression without | SATISFIED | voter-prefs-tracking.spec.ts (3 tests: SUPPRESSED, EMITS, round-trip); perm-analytics-tracking seed (dummy code); under perm project |
| EFLOW-09 | Plan 03 | Nav-menu contents voter + candidate; candidate auth-state; voter conditional items omitted | SATISFIED | candidate-journey.spec.ts steps 2.5+19.5 (logged-out/in + auth-group + sets differ); perm-1e1cg1co + perm-disable-election-1co (count-0 assertion) |
| EFLOW-11 | Plan 08 | Interactive voter journey at mobile viewport; D-03 mobile sub-tests | SATISFIED | voter-journey-mobile.spec.ts (390×844 walk + drawer + filter + mobile nav + feedback); perm-question-video + perm-interactive-info (scoped mobile describes) |

**Requirements in scope for this phase: 9/9 SATISFIED**

EFLOW-02 and EFLOW-10 are correctly out of scope for Phase 121 — both are deferred to later phases (130 and 122 respectively) per REQUIREMENTS.md traceability table and are marked `[ ]` (not `[x]`) in REQUIREMENTS.md.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `tests/playwright.config.ts` L247 | Comment says `EFLOW-08` for `voter-journey-mobile` — should say `EFLOW-11` | INFO | Comment-only; project name, testMatch, and dependencies are all correct. The spec itself is correctly labeled EFLOW-11. No functional impact. |
| `tests/playwright.config.ts` L942 | Comment says `EFLOW-11` for `perm-analytics-tracking`/`voter-prefs-tracking` — should say `EFLOW-08` | INFO | Comment-only; project wiring and dependencies are all correct. No functional impact. |

No blocker anti-patterns found. The two transposed EFLOW numbers in playwright.config.ts comments are documentation-only errors with no functional impact — both projects wire to the correct spec files, correct dependencies, and correct test matchers. The spec files themselves carry the correct EFLOW labels.

No TBD, FIXME, or XXX markers found in files modified by this phase.

### Human Verification Required

No items requiring human verification. The 3× determinism standard was applied per-spec, the full suite passed 125/125 (0 did-not-run), and all behavioral assertions are automated Playwright checks against deterministic seed data.

### Gaps Summary

No gaps. All 9 EFLOW requirements for Phase 121 have verified implementations in the codebase with substantive assertions, correct project wiring, and documented 3× determinism passes.

The two comment-labelling errors in `tests/playwright.config.ts` (EFLOW-08 ↔ EFLOW-11 transposition) are informational findings with zero functional impact — they are not blockers or gaps.

---

_Verified: 2026-06-17_
_Verifier: Claude (gsd-verifier)_
