---
phase: 121-e2e-specs-flow-coverage
plan: 08
subsystem: testing
tags: [playwright, e2e, mobile, viewport, consent, video, interactive-info, drawer, filter, nav-menu, feedback]

# Dependency graph
requires:
  - phase: 121-05
    provides: voter-journey-mobile Playwright project (390×844 isMobile/hasTouch leaf on data-setup-base)
  - phase: 119
    provides: navMenu fixture (openMobileNav/expectNavMenuItems), feedbackDialog fixture, video + questionInfo fixtures, viewport-agnostic answeredVoterPage walk
provides:
  - EFLOW-11 — interactive voter journey at mobile viewport (walk + party drawer + filter + mobile nav + feedback)
  - EFLOW-11 D-03 — scoped mobile-viewport sub-tests on perm-question-video + perm-interactive-info (no sibling leak)
  - Shared-walk DataConsentPopup auto-dismiss handler (unblocks full-suite green for ALL voter-walk consumers)
affects: [e2e-coverage, phase-130]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Scoped mobile-viewport sub-test: describe-local test.use({viewport,isMobile,hasTouch}) inside its own test.describe so the descriptor never leaks to sibling tests (file-scope test.use would flip the whole spec to mobile)"
    - "addLocatorHandler in the shared walk grants the auto-opened DataConsentPopup the moment it obstructs an actionability check; fires only when present (no-op otherwise) — safe for every consumer"
    - "Seed-/constituency-agnostic filter assertion: derive the filter term from a real card heading on the current list, assert a non-empty narrowing subset (≥1, ≤fullCount) that clears back to fullCount"

key-files:
  created:
    - tests/tests/specs/voter/voter-journey-mobile.spec.ts
  modified:
    - tests/tests/specs/perm/perm-question-video.spec.ts
    - tests/tests/specs/perm/perm-interactive-info.spec.ts
    - tests/tests/fixtures/voter/voter-journey.fixture.ts

key-decisions:
  - "Exercise the entity-details DRAWER via a party (orgs) card, not a candidate card — candidate cards on /results navigate to a detail PAGE (a <link> wrapping <article>, no entity-card-action), while org/party cards open the in-place entity-details drawer (mirrors voter-journey.spec.ts)."
  - "Derive the results filter term from a real card heading rather than hard-coding `polar`/toHaveCount(2): the walk lands on whichever election/constituency is first in the accordion and the candidate roster differs per constituency (Regional=13 incl. 2 polar vs Municipality North-East=6 incl. 0 polar), so a hard-coded term/count is non-deterministic."
  - "Fix the DataConsentPopup race in the SHARED walkUntilQuestionsIntro (not per-spec): the popup auto-opens on indetermined consent and intermittently overlays the elections/constituencies Continue button — always at mobile (full-width bottom alert), intermittently at desktop under full-suite load — a latent flake across voter-journey/a11y-smoke/performance/voter-journey-mobile. One shared addLocatorHandler unblocks the wave gate for all consumers and removes per-spec consent workarounds."
  - "D-03 sub-tests are describe-scoped (test.use inside their own describe) so the 390×844 descriptor never leaks to the EPERM-06/07 desktop slices."

patterns-established:
  - "Shared walk consent guard: walkUntilQuestionsIntro installs page.addLocatorHandler(consentGrant) before navigation — the canonical fix for the DataConsentPopup-intercepts-Continue stall."
  - "Mobile sub-test on an existing perm spec: top-level test.describe('mobile viewport smoke') with describe.configure({mode:'serial'}) + describe-local test.use, reusing the existing desktop assertion adapted to mobile."

requirements-completed: [EFLOW-11]

# Metrics
duration: ~150min
completed: 2026-06-17
---

# Phase 121 Plan 08: voter-journey-mobile + D-03 mobile sub-tests (EFLOW-11) Summary

**Interactive mobile voter journey (intro→select→answer→/results→party drawer + text filter + mobile nav menu + feedback) at the 390×844 voter-journey-mobile project, plus describe-scoped mobile-viewport sub-tests on perm-question-video and perm-interactive-info — with a shared-walk DataConsentPopup auto-dismiss that also closed a latent full-suite flake across voter-journey/a11y-smoke/performance.**

## Performance

- **Duration:** ~150 min
- **Started:** 2026-06-16
- **Completed:** 2026-06-17
- **Tasks:** 3
- **Files:** 1 created, 3 modified

## Accomplishments
- **EFLOW-11 mobile journey leaf** (`voter-journey-mobile.spec.ts`): reuses the viewport-agnostic `answeredVoterPage` walk (Home→Intro→elections→constituencies→answer all→/results), then exercises the mobile-relevant affordances — party entity-details drawer (open + close), a results text filter (derived term, narrow + clear-restore), the mobile nav drawer via `openMobileNav()` (assert Close-menu leading item + a Feedback nav item), and the feedback dialog reached through that drawer (open + rating + comment + submit + success). All HARD assertions.
- **EFLOW-11 D-03 (perm-question-video):** scoped `mobile viewport smoke` describe asserting the q1 question Video renders at 390×844 (reuses the EPERM-06 voter video assertion); descriptor scoped to the describe — no leak to the desktop voter/candidate slices.
- **EFLOW-11 D-03 (perm-interactive-info):** scoped `mobile viewport smoke` describe asserting the popup-modal info disclosure opens at 390×844 (reuses the EPERM-07 popup assertion); descriptor scoped — no leak to the EPERM-07 slices.
- **Shared-walk consent guard** (`voter-journey.fixture.ts`): one `addLocatorHandler` in `walkUntilQuestionsIntro` grants the auto-opened DataConsentPopup the instant it obstructs an actionability check — fixing the mobile journey AND a pre-existing intermittent full-suite flake.
- **Cardinal gates:** each of the three projects passes 3× (`--no-deps` after its setup), and the **full `yarn test:e2e` is GREEN: 125 passed / 0 failed / 0 did-not-run**.

## Task Commits

1. **Task 1: EFLOW-11 voter-journey-mobile interactive walk** — `93e681ae1` (test)
   - Follow-up fix: seed-agnostic filter assertion — `1320fdc30` (fix)
2. **Task 2: EFLOW-11 D-03 perm-question-video mobile sub-test** — `4fe10dead` (test)
3. **Task 3: EFLOW-11 D-03 perm-interactive-info mobile sub-test** — `fb23d6ada` (test)
4. **Cross-cutting fix: shared-walk DataConsentPopup dismissal + per-spec consent cleanup** — `315b98bba` (fix)

**Plan metadata:** (this docs commit)

## Files Created/Modified
- `tests/tests/specs/voter/voter-journey-mobile.spec.ts` — NEW. EFLOW-11 interactive mobile journey leaf.
- `tests/tests/specs/perm/perm-question-video.spec.ts` — MODIFIED. Added describe-scoped mobile video sub-test (D-03).
- `tests/tests/specs/perm/perm-interactive-info.spec.ts` — MODIFIED. Added describe-scoped mobile popup-info sub-test (D-03).
- `tests/tests/fixtures/voter/voter-journey.fixture.ts` — MODIFIED. Added the shared DataConsentPopup auto-grant handler at the top of `walkUntilQuestionsIntro`.

## Decisions Made
See `key-decisions` frontmatter (party-card drawer, derived filter term, shared-walk consent fix, describe-scoped descriptors).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DataConsentPopup intercepts the elections/constituencies Continue button**
- **Found during:** Task 1 (initial mobile walk) — then re-surfaced as a full-suite flake hitting voter-journey/a11y-smoke/performance.
- **Issue:** On `indetermined` consent the voter layout auto-opens the DataConsentPopup modal a beat after navigation. At 390×844 it is full-width bottom-anchored and ALWAYS overlays the bottom-of-viewport "Continue" button; at desktop it intermittently overlays it under full-suite load. The shared walk's `electionsContinue.click()` then retries against the overlay until the 90s ceiling → stall at /elections.
- **Fix:** Installed `page.addLocatorHandler(consentGrant, …)` at the start of the shared `walkUntilQuestionsIntro` to grant consent through the real in-app control on interception (Playwright retries the original action afterward). Fires only when the popup is present — no-op otherwise, safe for every walk consumer.
- **Files modified:** tests/tests/fixtures/voter/voter-journey.fixture.ts (+ removed redundant per-spec consent workarounds from the three specs).
- **Verification:** Each project 3× green; full `yarn test:e2e` 125/125.
- **Committed in:** 315b98bba

**2. [Rule 1 - Bug] Drawer opened via a candidate card (candidate cards navigate to a page, not a drawer)**
- **Found during:** Task 1.
- **Issue:** `openEntityDetailsForCard` on a CANDIDATE card timed out — candidate result cards are `<link>`-wrapped `<article>` elements that navigate to a detail PAGE and have no `entity-card-action`; only ORG/party cards open the in-place entity-details drawer.
- **Fix:** Switched the drawer step to the `orgs` tab + a party card (mirrors voter-journey.spec.ts), asserting `entity-details` visible then Escape-hidden.
- **Files modified:** tests/tests/specs/voter/voter-journey-mobile.spec.ts
- **Verification:** Project 3× green; full suite green.
- **Committed in:** 93e681ae1

**3. [Rule 1 - Bug] Hard-coded `polar`/toHaveCount(2) filter assertion is constituency-dependent**
- **Found during:** Task 1 full-suite + repeated isolated runs.
- **Issue:** The walk lands on whichever election/constituency is first in the accordion; rosters differ (Regional=13 incl. 2 polar vs Municipality North-East=6 incl. 0 polar), so a fixed `polar`/`toHaveCount(2)` filtered to 0 on the non-Regional landing.
- **Fix:** Derive the filter term from a real card heading on the CURRENT list and assert a non-empty narrowing subset (≥1, ≤fullCount) that clears back to fullCount — seed-/constituency-agnostic, no weakened assertion.
- **Files modified:** tests/tests/specs/voter/voter-journey-mobile.spec.ts
- **Verification:** 5× isolated + full suite green.
- **Committed in:** 1320fdc30

---

**Total deviations:** 3 auto-fixed (all Rule 1 — test-mechanism / environment-coupling bugs). No app code touched; all assertions remain HARD. The shared-walk consent fix is the substantive cross-cutting one — it also resolves the full-suite blocker that Plan 07's summary flagged for wave merge (voter-journey end-to-end failure was the same consent race).

## Issues Encountered
- **Feedback per-IP rate-limit accumulation (deferred-infra).** The mobile journey submits one feedback per run; repeated `--no-deps` reruns accumulate `feedback` rows against the per-IP insert limit (5), which intermittently fails the feedback step in voter-journey and the mobile leaf. Cleared `feedback` rows between determinism reruns (as sibling plans did) so the 3× signal is trustworthy. Logged to `deferred-items.md`. The assertion was NOT weakened.
- **`yarn db:seed --template e2e/base` (CLI) uses a non-deterministic RNG seed** producing different candidate names than the `data-setup-base` setup project — reseed via the `data-setup-base` project (deterministic) when verifying name-dependent assertions in isolation.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- EFLOW-11 complete; all three projects green 3× and the full `yarn test:e2e` is **125/125 (0 did-not-run)** — the cardinal wave-merge gate is satisfied.
- The shared-walk consent guard closed the previously-flagged voter-journey full-suite blocker (Plan 07 summary §Next Phase Readiness).

## Self-Check: PASSED

- FOUND: `tests/tests/specs/voter/voter-journey-mobile.spec.ts`
- FOUND: `tests/tests/specs/perm/perm-question-video.spec.ts`
- FOUND: `tests/tests/specs/perm/perm-interactive-info.spec.ts`
- FOUND: `tests/tests/fixtures/voter/voter-journey.fixture.ts`
- FOUND: commit `93e681ae1`, `4fe10dead`, `fb23d6ada`, `1320fdc30`, `315b98bba`

---
*Phase: 121-e2e-specs-flow-coverage*
*Completed: 2026-06-17*
