---
phase: 120-e2e-specs-settings-permutation-matrix
plan: 07
subsystem: e2e-tests
tags: [e2e, perm-chain, feedback, survey, popup-coordination, showIn, EPERM-09, settings-permutation, rename]
requires:
  - phase: 120-06
    provides: "perm tail anchor (perm-org-matching) — the A3 node sits earlier in the chain (after perm-hide-hero); this plan only renames it in place"
  - phase: 119
    provides: "show-feedback-survey dev-seed template + registry key (index.ts:43,89), popupNotice fixture (createPopupNotice: expectVisible/dismiss/dismissAndReload), feedback-popup/survey-popup test-ids, popupNotice.probe (de-risk)"
provides:
  - "EPERM-09 perm-show-feedback-survey perm-chain node — RENAMED in place from perm-header-show-feedback (git mv spec+setup+teardown + config triple) and EXTENDED with popup-coordination + showIn-surface assertions"
  - "feedback + survey popup coordination on /results (placement, once/no-double-pop, dismiss-persistence across reload) asserted SEPARATELY per popup"
  - "survey.showIn surface audit (frontpage + entityDetails: present-on-seeded / absent-on-other) via per-surface singleton re-seed"
  - "survey-banner testid on testIds.shared (SurveyBanner.svelte root)"
affects:
  - "tests/playwright.config.ts (A3 node triple renamed + A4 show-help dependency re-pointed)"
  - "tests/tests/utils/testIds.ts (surveyBanner testid added)"
tech-stack:
  added: []
  patterns:
    - "perm-singleton in-spec re-seed via client.updateAppSettings({survey:{showIn:[...]}}) + afterAll restore for the showIn surface audit (merge_jsonb_column replaces arrays wholesale — non-object patch wins)"
    - "no-double-pop asserted via toHaveCount(1) on the popup root testid"
    - "section-scoped entity-card-action click for no-subcard candidate cards (the OUTER EntityCardAction wraps the entity-card article — it is NOT a card descendant, so the shared openEntityDetailsForCard card-scoped lookup does not resolve)"
    - "dismiss the results feedback popup before clicking an entity card (modal scrim intercepts pointer events — the 120-05 dismiss-before-nav pattern)"
key-files:
  created: []
  modified:
    - "tests/tests/specs/perm/perm-show-feedback-survey.spec.ts (git mv + extend)"
    - "tests/tests/setup/perm/perm-show-feedback-survey.setup.ts (git mv + doc/prefix align)"
    - "tests/tests/setup/perm/perm-show-feedback-survey.teardown.ts (git mv + prefix align)"
    - "tests/playwright.config.ts"
    - "tests/tests/utils/testIds.ts"
key-decisions:
  - "showIn surface audit scoped to frontpage + entityDetails (both render the survey-banner testid). resultsPopup is covered by the popup-coordination tests; navigation renders a text-only NavItem with no stable test anchor — audited, documented as deferred (no production testid added, per the test-authoring + testid-only scope)."
  - "Aligned the teardown PREFIX to the template's actual externalIdPrefix 'e2e-perm-feedback-survey-' (was the never-seeded 'e2e-perm-header-feedback-'). The broad 'e2e-perm-' extraTeardownPrefix tag already swept the rows, so this is a correctness/clarity alignment, not a leak fix."
  - "Reached entityDetails via a local openCandidateDetails helper (section-scoped first entity-card-action click) instead of resultsPage.openEntityDetailsForCard — the shared helper scopes the action lookup INSIDE the card, which only resolves for subcard cards; the minimal single-candidate seed has a no-subcard card whose action is the OUTER wrapper."
patterns-established:
  - "Per-surface app-singleton re-seed (survey.showIn) for a showIn placement audit, restored to the shipped ['resultsPopup'] posture in afterAll."
requirements-completed: [EPERM-09]
duration: ~95min
completed: 2026-06-16
---

# Phase 120 Plan 07: EPERM-09 perm-show-feedback-survey rename + extend Summary

**The feedback perm was RENAMED in place (git mv spec/setup/teardown + config triple + re-pointed downstream show-help dependency) from perm-header-show-feedback → perm-show-feedback-survey and EXTENDED: the original header-feedback assertion is kept verbatim, and feedback + survey popup coordination (placement, once/no-double-pop, dismiss-persistence) plus a survey.showIn surface audit (frontpage + entityDetails) were added. Full perm chain GREEN 3× (68 passed each).**

## Performance

- **Duration:** ~95 min (incl. RED/GREEN iteration on the showIn-audit entity-card-action path + an imgproxy-502 infra-flake recovery during the 3× gate, ~4.2m/full-chain run)
- **Completed:** 2026-06-16
- **Tasks:** 3 (all `auto`, tdd=false)
- **Files modified:** 5 (3 renamed test-layer files, the config, the testIds util)

## Accomplishments

- `git mv` of the spec + setup + teardown to `perm-show-feedback-survey.*`; the dev-seed registry key was already `show-feedback-survey` (Phase 119) so only the test layer moved.
- Renamed the A3 Playwright project triple in place (keeps its position after `perm-hide-hero`, keeps `dependencies: ['perm-hide-hero']`) and re-pointed the downstream `data-setup-perm-header-show-help` dependency to `perm-show-feedback-survey`.
- Kept the original header-feedback-button assertion verbatim and ADDED: feedback popup coordination (test 2), survey popup coordination (test 3), and the survey.showIn surface audit (tests 4–5).
- Added a `surveyBanner` testid (`survey-banner`, already on SurveyBanner.svelte:39) to `testIds.shared`.
- 3× clean-DB determinism gate (SC5): full `perm-show-feedback-survey` chain → **68 passed** all three runs, zero flakes, zero "did not run".

## Task Commits

1. **Task 1: git mv rename + re-point config edges** — `d349115b3` (test)
2. **Task 2: extend with popup-coordination + showIn audit** — `50d614320` (test)
3. **Task 3: 3× determinism gate** — verification only (no code change beyond the Task 2 commit).

## Files Created/Modified

- `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` (git mv + extend) — 5 tests: kept header-feedback assertion + feedback popup coordination + survey popup coordination + showIn[frontpage] + showIn[entityDetails].
- `tests/tests/setup/perm/perm-show-feedback-survey.setup.ts` (git mv) — `setupFromTemplate('show-feedback-survey', { extraTeardownPrefix })`; doc updated.
- `tests/tests/setup/perm/perm-show-feedback-survey.teardown.ts` (git mv) — PREFIX aligned to `e2e-perm-feedback-survey-`.
- `tests/playwright.config.ts` (modified) — A3 node triple renamed in place + downstream show-help dependency re-pointed + chain-order comment updated. No remaining `perm-header-show-feedback` reference.
- `tests/tests/utils/testIds.ts` (modified) — added `surveyBanner: 'survey-banner'`.

## Decisions Made

- **showIn surface audit scoped to frontpage + entityDetails.** The four `survey.showIn` enum members (`dynamicSettings.type.ts:20`) are frontpage / entityDetails / navigation / resultsPopup. `resultsPopup` is the seeded posture and is asserted by the feedback/survey popup-coordination tests (2–3). `frontpage` and `entityDetails` both render `SurveyBanner.svelte` (the `survey-banner` testid), so each is asserted present-on-seeded-surface / absent-on-the-other via a per-surface singleton re-seed. `navigation` renders a text-only `NavItem` (VoterNav.svelte:101) with no stable test anchor — it is audited and documented as deferred rather than adding a production testid (out of the test-authoring + testid-only scope).
- **merge_jsonb_column replaces arrays wholesale.** The re-seed `updateAppSettings({ survey: { showIn: ['frontpage'] } })` REPLACES `survey.showIn` (not concatenates) — confirmed in `900-test-helpers.sql:37` (`ELSE p_patch`: when either side is a non-object, the patch wins). The sibling `survey.linkTemplate` is preserved by the recursive object merge, so `appSettings.survey` stays truthy and SurveyBanner's gate holds.
- **Teardown PREFIX aligned to the template's actual `e2e-perm-feedback-survey-`** (Rule 1 — correctness/clarity). The pre-rename teardown scoped to a never-seeded prefix; the broad `e2e-perm-` `extraTeardownPrefix` tag already swept the rows so this was not a live leak, but the specific prefix now matches what the template seeds.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Modal scrim of the results feedback popup intercepted the entity-card click in the showIn audit**
- **Found during:** Task 2 (GREEN — the showIn surface tests).
- **Issue:** Tests 4–5 walk to /results to reach the entityDetails surface. The seed still carries `results.showFeedbackPopup: 1`, so the feedback popup surfaces on /results and its Drawer/Alert scrim intercepts pointer events — the `entity-card-action` click timed out (trace + error-context confirmed an open `dialog "Privacy"` overlaying the card).
- **Fix:** Dismiss the leading feedback popup (`createPopupNotice(page).dismiss('feedback')`) before opening the entity card — the same dismiss-before-nav pattern landed in 120-05.
- **Files modified:** `perm-show-feedback-survey.spec.ts`.
- **Verification:** tests 4–5 GREEN; full chain 68 passed 3×.
- **Committed in:** `50d614320`.

**2. [Rule 1 - Bug] resultsPage.openEntityDetailsForCard does not resolve for a no-subcard candidate card**
- **Found during:** Task 2 (GREEN — the entityDetails surface assertion).
- **Issue:** The shared `openEntityDetailsForCard` clicks `card.getByTestId('entity-card-action')` — scoped INSIDE the matched `entity-card`. For org/subcard cards the action wraps the inner header (a descendant), but for a no-subcard candidate card the `EntityCardAction` is the OUTER link WRAPPING the `entity-card` article (`EntityCard.svelte:220`) — so the action is a PARENT, not a descendant, and the card-scoped lookup never resolves. The minimal seed has a single no-subcard candidate, so the click timed out.
- **Fix:** Added a local `openCandidateDetails(page)` helper that clicks the FIRST `entity-card-action` in the active candidate SECTION (the parent link) and hard-asserts the `entity-details` container — robust for the no-subcard case. The shared fixture was left untouched (its card-scoped behaviour is correct for the subcard cards its other callers use; broadening it is out of this plan's scope).
- **Files modified:** `perm-show-feedback-survey.spec.ts`.
- **Verification:** tests 4–5 GREEN; full chain 68 passed 3×.
- **Committed in:** `50d614320`.

---

**Total deviations:** 2 auto-fixed bugs (both in the new test code; no production code touched). No scope creep — the showIn audit surfaces were scoped to those with stable test anchors and `navigation` documented as deferred.
**Impact on plan:** No production-code change. The single `survey-banner` testid was already present on the component; only the testIds mapping was added.

## survey.showIn build-time audit (per the EPERM-09 NOTE)

| Surface | Renderer | Test anchor | Disposition |
|---------|----------|-------------|-------------|
| `resultsPopup` | results layout (`results/[[electionTab]]/+layout.svelte:213`) → SurveyPopup | `survey-popup` testid | Covered by the survey popup-coordination test (test 3) — this is the SEEDED posture. |
| `frontpage` | `(voters)/+page.svelte:60` → SurveyBanner | `survey-banner` testid | ASSERTED (test 4): present on frontpage / absent on entityDetails under `showIn=[frontpage]`. |
| `entityDetails` | `entityDetails/EntityInfo.svelte:127` → SurveyBanner | `survey-banner` testid | ASSERTED (test 5): present on entityDetails / absent on frontpage under `showIn=[entityDetails]`. |
| `navigation` | `VoterNav.svelte:101` → NavItem link | none (text-only `t('dynamic.survey.button')`) | Audited, DEFERRED — no stable testid; would require a production change to assert testid-only. |

## Seed-change status

**None.** No dev-seed template was touched — the `show-feedback-survey` template was already renamed + configured in Phase 119. This plan re-seeds the `app_settings` singleton in-spec per showIn surface (perm-singleton pattern) and restores the shipped `survey.showIn: ['resultsPopup']` posture in `afterAll`, leaving the singleton clean for the downstream `perm-header-show-help` node.

## Issues Encountered

- **imgproxy-502 infra flake during the 3× gate (known non-defect).** Two early gate runs cascade-failed in the upstream `voter-journey` dependency (browser-back roundtrip `toBeChecked`/heading-text timing). Root cause was NOT a spec defect — `yarn db:reset` intermittently 502s on its container-restart phase (imgproxy), leaving the stack degraded and corrupting the seed for the whole chain. Resolved per the documented remedy (`supabase stop && supabase start`) and a resilient gate loop that retries db:reset with a stack restart on 502. After recovery the full chain ran **68 passed × 3** with clean db:reset each time. (Matches the v2.10 carried-forward infra item + the environment note's imgproxy-502 caveat.)

## TDD Gate Compliance

Not applicable — all three tasks are `tdd="false"` (a rename + assertion extension against an already-built fixture/template, plus a verification gate). The plan frontmatter `type: execute` (not `tdd`).

## Verification

- `yarn typecheck:tests` — exit 0.
- `eslint --flag v10_config_lookup_from_file` on the spec + testIds — clean (`no-restricted-locators` + `consistent-type-imports` guards pass; the inline `import()` type was hoisted to a top-level `import type { Page }`).
- Rename clean: `perm-header-show-feedback.spec.ts` gone; `perm-show-feedback-survey.spec.ts` present; no `perm-header-show-feedback` reference remains in `tests/playwright.config.ts`; downstream `data-setup-perm-header-show-help` depends on `perm-show-feedback-survey`.
- **3× determinism gate (SC5):** full `perm-show-feedback-survey` chain, each preceded by a clean `yarn db:reset` (with 502-recovery) → **68 passed** × 3, zero flakes, zero "did not run".

## Next Phase Readiness

- The A3 chain position is now `perm-show-feedback-survey` (after `perm-hide-hero`, before `perm-header-show-help`); the downstream edge is re-pointed and the chain is unbroken. Plan 120-08 (perm-access-disable) remains the outstanding EPERM-11 consolidation.
- No blockers. The `survey-banner` testid is now available for any future spec needing the SurveyBanner placement readout.

## Self-Check: PASSED

- `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` — FOUND.
- `tests/tests/setup/perm/perm-show-feedback-survey.setup.ts` — FOUND.
- `tests/tests/setup/perm/perm-show-feedback-survey.teardown.ts` — FOUND.
- `tests/tests/specs/perm/perm-header-show-feedback.spec.ts` — ABSENT (renamed, as expected).
- Commit `d349115b3` — FOUND.
- Commit `50d614320` — FOUND.

---
*Phase: 120-e2e-specs-settings-permutation-matrix*
*Completed: 2026-06-16*
