---
phase: 74-high-leverage-e2e-coverage
plan: 05
subsystem: testing
tags: [playwright, e2e, voter, voter-detail, submatch, dev-seed, fixture-extension, categorical-question, directional-metric]

# Dependency graph
requires:
  - phase: 73-determinism-baseline
    provides: deterministic suite baseline (4 PASS_LOCKED / 15 DATA_RACE / 55 CASCADE) + lint config at 'error'
  - phase: 58-templates-cli-default-dataset
    provides: e2e template + 58-E2E-AUDIT contract anchoring fixture external_ids to spec assertions
provides:
  - "E2E-05 4-case voter-vs-entity answer-state contract gated by 4 permanent Playwright tests"
  - "E2E-07 per-category SubMatch gating for BOTH Manhattan AND directional metric paths"
  - "Dev-seed e2e template extension: 1 new categorical opinion question + 1 new category + 4 marker candidates + 4 nominations"
  - "Cross-spec navigation hardening — Skip→Next fallback for the new categorical question in voter-matching.spec.ts and voter-journey.spec.ts"
affects: [phase-75-question-spec, phase-76-accessibility, phase-77-settings, phase-78-cleanup]

# Tech tracking
tech-stack:
  added:
    - singleChoiceCategorical question type in e2e seed (directional-metric anchor)
  patterns:
    - "getByRole('meter', { name: categoryName }) — semantic role-based locator for ScoreGauge SubMatch entries via aria-labelledby"
    - "Out-of-range fallback in answer loops — when answerOption.nth(N) exceeds the question's choice count (categorical with fewer choices), Skip→Next path advances to /results"
    - "Card filter uses display name (first_name + ' ' + last_name) not external_id — entity cards render the display name, not the test-* external_id"

key-files:
  created:
    - .planning/phases/74-high-leverage-e2e-coverage/74-05-SUMMARY.md
  modified:
    - packages/dev-seed/src/templates/e2e.ts
    - packages/dev-seed/tests/templates/e2e.test.ts
    - tests/tests/specs/voter/voter-detail.spec.ts
    - tests/tests/specs/voter/voter-matching.spec.ts
    - tests/tests/specs/voter/voter-journey.spec.ts

key-decisions:
  - "Card filter by display name (e.g. 'CaseA Both') not external_id — first_name + last_name space-joined is the rendered heading text"
  - "Categorical question placed at sort_order 17 (after all 16 ordinals) with required: false so voter.fixture default voterAnswerCount=16 + post-loop Skip→Next fallback advances cleanly to /results"
  - "All 4 Case candidates given ONE perfect ordinal answer (~60 Manhattan distance) — clearly between agree (~32) and oppose (~64), preserving voter-matching first/last tier assertions"
  - "Case candidate names use {first_name: 'CaseN', last_name: '<Marker>'} so card filter `hasText: 'CaseN <Marker>'` is unique across the 4 markers"
  - "Use getByRole('meter', { name }) instead of inline-style locator for SubMatch ScoreGauges — semantic anchor via aria-labelledby, more robust than `[style*=\"grid-template-columns\"]` which has multiple non-SubMatch matches per dialog"

patterns-established:
  - "Cross-spec impact handling: when extending e2e dev-seed shape, every spec walking the voter UI flow must tolerate the new question (Skip→Next fallback OR out-of-range guard)"
  - "Marker comment convention: `E2E-XX/case-(X)` + `E2E-XX/directional-metric-anchor` in dev-seed template tags spec assertions to fixture rows"
  - "Visibility test for 'neither has answered' (case d): assert i18n message text presence with regex tolerance for locale variation (Neither you nor .* has(n't)? answered)"

requirements-completed: [E2E-05, E2E-07]

# Metrics
duration: ~120min
completed: 2026-05-11
---

# Phase 74 Plan 05: voter-detail E2E-05 4-case + E2E-07 SubMatch Summary

**Extended `voter-detail.spec.ts` with 6 new tests gating the 4-case voter-vs-entity answer-state contract (E2E-05) AND per-category SubMatch breakdown for BOTH Manhattan + directional metric paths (E2E-07), backed by a single dev-seed extension adding 1 categorical question + 4 marker candidates.**

## Performance

- **Duration:** ~120 min (including 3 cold-start determinism runs)
- **Started:** 2026-05-11T07:25:00Z (approx)
- **Completed:** 2026-05-11T09:27:15Z
- **Tasks:** 2/2
- **Files modified:** 5 (3 spec files + 2 dev-seed files)

## Accomplishments

- **E2E-05 (4 tests):** Voter-detail drawer now permanently gates the 4 voter-vs-entity answer-state cases — both-answered (CaseA Both), voter-only (CaseB VoterOnly), entity-only (CaseC EntityOnly), neither (CaseD Neither). Each test isolates one case via a deterministic marker question (test-question-1 for cases a/b, test-question-directional-1 for cases c/d) so the contract is independent of fixture ordering.
- **E2E-07 (2 tests):** Per-category SubMatch grid now permanently gates BOTH the Manhattan (4 ordinal categories) AND directional (1 categorical category) metric paths per REQUIREMENTS.md §E2E-07 + ROADMAP.md §"Phase 74" SC #7. Uses `getByRole('meter', { name: categoryName })` — semantic role-based locator via aria-labelledby resolution.
- **Dev-seed extension:** Added `test-category-directional` question category + `test-question-directional-1` singleChoiceCategorical question + 4 marker candidates (CaseA-Both / CaseB-VoterOnly / CaseC-EntityOnly / CaseD-Neither) + 4 nominations. Comment markers `E2E-05/case-(a)..(d)` (8 total) + `E2E-07/directional-metric-anchor` (3 total) provide grep-able anchoring.
- **3-run determinism:** All 6 new tests PASS identically across 3 cold-start `--workers=1` runs (1.9m / 1.9m / 1.9m). Phase 73 baseline preserved — new tests are PASS_LOCKED.
- **Cross-spec hardening (Rule 3 auto-fixes):** voter-matching.spec.ts and voter-journey.spec.ts updated to tolerate the new categorical question (Skip→Next fallback + out-of-range guard for `nth(4)` on a 3-choice categorical).

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend e2e dev-seed for 4-case + directional anchor** — `541ea1d08` (feat)
2. **Task 2: Extend voter-detail.spec.ts with E2E-05 + E2E-07 tests** — `b8099634d` (feat)

## Files Created/Modified

### dev-seed extension (Task 1)

- `packages/dev-seed/src/templates/e2e.ts` — Added:
  - 1 new question_category `test-category-directional` (sort 5, opinion)
  - 1 new singleChoiceCategorical question `test-question-directional-1` (sort 17, required: false, 3 choices: a/b/c)
  - 1 new answer cell on `test-candidate-alpha` (`test-question-directional-1: 'a'`) so alpha's voter-detail drawer renders the directional SubMatch row
  - 4 new candidates: `test-candidate-CaseA-Both` (Q1='5'), `test-candidate-CaseB-VoterOnly` (Q2='5'), `test-candidate-CaseC-EntityOnly` (Q1='5' + directional='b'), `test-candidate-CaseD-Neither` (Q4='5')
  - 4 new nominations linking the Case candidates to test-nom-org-party-a (parent_nomination for filter visibility)

- `packages/dev-seed/tests/templates/e2e.test.ts` — Updated row-count assertions: candidates 14→18, registered 11→15, nominations 18→22, questions 17→18.

### voter-detail spec extension (Task 2)

- `tests/tests/specs/voter/voter-detail.spec.ts` — Added 2 new describe blocks (6 tests total):
  - `voter-detail answer cases (E2E-05)` — 4 tests, one per case
  - `voter-detail per-category SubMatches (E2E-07)` — 2 tests covering Manhattan + directional metric paths

### Cross-spec auto-fixes (Task 2)

- `tests/tests/specs/voter/voter-matching.spec.ts` — Added Skip→Next fallback to `navigateToResults` (lines ~159-170) for the new categorical question (sort 17, `required: false`).
- `tests/tests/specs/voter/voter-journey.spec.ts` — Added out-of-range guard in `answerRemainingUntilResults` (lines ~50-58) — when `answerOption.nth(4)` exceeds the question's choice count (categorical with only 3 choices), fall through to Skip→Next path.

## Marker Convention

### E2E-05 4-case markers (deterministic locator anchoring)

| Case | External ID                          | Display Name      | Marker Question                | Voter | Entity |
| ---- | ------------------------------------ | ----------------- | ------------------------------ | ----- | ------ |
| (a)  | `test-candidate-CaseA-Both`          | CaseA Both        | `test-question-1` (sort 0)     | '5'   | '5'    |
| (b)  | `test-candidate-CaseB-VoterOnly`     | CaseB VoterOnly   | `test-question-1` (sort 0)     | '5'   | —      |
| (c)  | `test-candidate-CaseC-EntityOnly`    | CaseC EntityOnly  | `test-question-directional-1`  | —     | 'b'    |
| (d)  | `test-candidate-CaseD-Neither`       | CaseD Neither     | `test-question-directional-1`  | —     | —      |

Cards are located by `getByTestId('voter-results-card').filter({ hasText: '<display name>' })`.

### E2E-07 directional-metric anchor

- **Category:** `test-category-directional` — name: `'Test Category: Directional (E2E-07)'`
- **Question:** `test-question-directional-1` — type: `singleChoiceCategorical`, name: `'Test Opinion Question Directional 1 (E2E-07)'`, 3 choices: `a`/`b`/`c`
- **Voter-side:** voter does NOT answer (voter.fixture default `voterAnswerCount=16` < the question's sort_order 17). The matching algorithm still creates a SubMatch entry for the directional category (per `packages/matching/src/algorithms/matchingAlgorithm.ts:105-110` — SubMatches map per `questionGroup` regardless of voter overlap), and the directional row renders in the SubMatch grid with the appropriate imputed score.
- **Entity-side:** alpha answers `test-question-directional-1 = 'a'` so its directional SubMatch row renders non-empty.

### E2E-07 category names asserted

Per-category SubMatch grid assertions enumerate exactly 5 categories on alpha's voter-detail drawer:
- `Test Category: Economy` (ordinal — Manhattan)
- `Test Category: Social` (ordinal — Manhattan)
- `Test Voter Category: Economy` (ordinal — Manhattan)
- `Test Voter Category: Social` (ordinal — Manhattan)
- `Test Category: Directional (E2E-07)` (categorical — directional metric)

All 5 names are visible via `dialog.getByRole('meter', { name: <name> })`.

## Decisions Made

- **Card filter by display name** (`CaseA Both` not `CaseA-Both`) — entity cards render `{first_name} {last_name}` space-joined per `EntityCard.svelte`; external_ids with dashes are NOT in the visible card text. Verified by inspecting trace error-context.md.
- **getByRole('meter', { name }) over inline-style locator** — original plan suggested `dialog.locator('[style*="grid-template-columns"]').first()` per RESEARCH §"E2E-07 SubMatch rendering". Empirical observation: the dialog contains MULTIPLE `grid-template-columns` declarations (page layout, drawer header, EntityCard outer); `.first()` picks the wrong container. ScoreGauge.svelte renders `<div role="meter" aria-labelledby="...">` with a sibling `<label>` carrying the category name — `getByRole('meter', { name: categoryName })` resolves the accessible name via aria-labelledby and is the canonical role-based locator. Lint-clean; no inline `// reason:` needed.
- **Categorical at sort 17 with `required: false`** — the e2e template has 16 ordinal opinion questions; placing the categorical AFTER (sort 17) keeps the existing voter fixture path intact. `required: false` enables the Skip→Next fallback at the end of the voter loop. Net impact: voter answers all 16 ordinals like before; the new categorical adds 1 extra "Skip" click at the end.
- **All 4 Case candidates have ONE perfect ordinal answer (`5`)** — ranking design preserves voter-matching first/last tier assertions. Each candidate sits at distance ~60 (1 perfect + 15 missing imputed to max). Clearly between agree (~32) and oppose (~64). lastCard = oppose stays unique.
- **No 58-E2E-AUDIT-style addendum authored** — captured as a follow-up todo per CONTEXT D-07 Claude's Discretion ("RECOMMENDED but not blocking").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Card filter pattern used external_id format ('CaseA-Both') instead of display name ('CaseA Both')**
- **Found during:** Task 2 (initial Playwright run)
- **Issue:** The plan's spec example used `filter({ hasText: 'CaseA-Both' })` but entity cards render the candidate's display name (`first_name` + space + `last_name`), not the external_id with dashes. Filter found 0 matches, all 4 case tests timed out clicking the card.
- **Fix:** Changed all 4 filters to use the display name format (`'CaseA Both'`, `'CaseB VoterOnly'`, `'CaseC EntityOnly'`, `'CaseD Neither'`).
- **Files modified:** `tests/tests/specs/voter/voter-detail.spec.ts`
- **Verification:** All 4 case tests now PASS — card click opens the right candidate's drawer.
- **Committed in:** `b8099634d`

**2. [Rule 1 - Bug] SubMatch locator `[style*="grid-template-columns"]` picked wrong container**
- **Found during:** Task 2 (initial Playwright run)
- **Issue:** Plan's spec example located the SubMatch grid via `dialog.locator('[style*="grid-template-columns"]').first()`. Empirically the dialog contains MULTIPLE elements with `grid-template-columns` inline style (page layout containers, drawer header, EntityCard wrapper). `.first()` picked a non-SubMatch element, so `subMatchGrid.getByText('Test Category: Economy')` failed to find the text.
- **Fix:** Replaced with `dialog.getByRole('meter', { name: categoryName })` — ScoreGauge.svelte:73-83 renders each SubMatch as `<div role="meter" aria-labelledby="..."` with the category name in the labelled `<label>`. The role-based locator resolves the accessible name via aria-labelledby and is the canonical semantic locator per Phase 73 lint convention.
- **Files modified:** `tests/tests/specs/voter/voter-detail.spec.ts`
- **Verification:** Both E2E-07 tests now PASS — all 5 category meters located.
- **Committed in:** `b8099634d`

**3. [Rule 3 - Blocking] voter-matching.spec.ts navigateToResults stuck on new categorical question**
- **Found during:** Task 2 (full voter-detail spec run post-Task-1 dev-seed extension)
- **Issue:** The new categorical question at sort_order 17 added an opinion question that the matching test's loop doesn't answer (filter at lines 40-43 only includes singleChoiceOrdinal). Voter answers 16 ordinals via the loop, lands on the 17th (categorical), and `await page.getByTestId(testIds.voter.results.list).waitFor({...})` times out because voter is on /questions/<categorical> not /results.
- **Fix:** Added Skip→Next fallback (mirroring `voter.fixture.ts:81-86`) after the answer loop: if URL not on /results, click nextButton (renders as "Skip" since categorical is unanswered) and wait for /results.
- **Files modified:** `tests/tests/specs/voter/voter-matching.spec.ts`
- **Verification:** All 7 voter-matching tests PASS after fix.
- **Committed in:** `b8099634d`

**4. [Rule 3 - Blocking] voter-journey.spec.ts answerRemainingUntilResults clicked nth(4) on 3-choice categorical**
- **Found during:** Task 2 (full voter-detail spec run)
- **Issue:** `answerRemainingUntilResults(page, 4, ...)` clicks `answerOption.nth(4)` for each remaining question. For the new categorical question with only 3 choices (a/b/c), `.nth(4)` is out of range — Playwright fails or hangs.
- **Fix:** Added out-of-range guard at the start of each iteration: `if (answerOptionIndex >= choiceCount) { skip→/results }`. Falls through to the same Skip path the try/catch already uses for the last question.
- **Files modified:** `tests/tests/specs/voter/voter-journey.spec.ts`
- **Verification:** Lint-clean; voter-journey serial describe runs to completion when the full spec is loaded (failure only when run via `--grep` filter that skips earlier serial tests — that's a pre-existing test-isolation issue, NOT a regression).
- **Committed in:** `b8099634d`

**5. [Rule 3 - Blocking] dev-seed unit tests asserted obsolete row counts**
- **Found during:** Task 1 (yarn test:unit after e2e.ts edit)
- **Issue:** Adding 4 candidates + 4 nominations + 1 question to e2e.ts broke the dev-seed unit tests at `packages/dev-seed/tests/templates/e2e.test.ts` which asserted exact counts: candidates 14, registered 11, nominations 18, questions 17.
- **Fix:** Updated assertions to reflect new totals: candidates 18, registered 15, nominations 22, questions 18. Inline comments document the +4 / +1 deltas from Phase 74 Plan 05.
- **Files modified:** `packages/dev-seed/tests/templates/e2e.test.ts`
- **Verification:** All 484 dev-seed unit tests PASS.
- **Committed in:** `541ea1d08`

---

**Total deviations:** 5 auto-fixed (2 bugs in original plan spec examples, 3 blocking cross-spec impacts).
**Impact on plan:** All auto-fixes essential for plan completion. The 2 bugs in plan's spec examples (Rules 1) were uncovered empirically when tests ran — they reflect the gap between the planner's spec dry-write and the actual rendered DOM. The 3 cross-spec impacts (Rule 3) were the unavoidable consequence of adding a 17th opinion question to a UI flow that other specs hardcoded for 16 questions; the fixes preserve those specs' contracts without behavior changes. **No scope creep** — all fixes are correctness-required for the plan's E2E-05 / E2E-07 success criteria.

## Issues Encountered

**Docker / Supabase environment instability during initial reset:** The first `yarn dev:reset-with-data` runs encountered exit-143 / 500 errors that required a full `yarn dev:down` + `yarn supabase:start` cycle to recover. Investigation: stale containers from a prior partial run. Resolved by full cycle. NOT a code issue.

**Cross-template state contamination:** The initial Playwright run picked up data from BOTH the default template (loaded via prior `dev:reset-with-data`) AND the e2e template (data-setup project). The voter encountered 41 questions (24 default + 17 e2e) instead of the expected 17. Resolution: `yarn dev:seed:teardown` cleared the default-template seed_-prefixed rows before re-running Playwright. NOT a code issue, but a workflow gotcha worth noting for future executors.

## Validation summary

- **6/6 new tests PASS** under 3 consecutive cold-start `--workers=1` runs (1.9m / 1.9m / 1.9m identical).
- **7/7 voter-matching tests PASS** after Skip→Next fallback fix (verified post-Task-2).
- **All 484 dev-seed unit tests PASS** after row-count assertion updates.
- **All 43 matching unit tests PASS** (categorical-question addition is transparent to @openvaa/matching — dispatch handled per question type at matchingAlgorithm.ts).
- **`yarn lint:check`** — exits 0; 0 errors. Pre-existing dev-seed warnings (15) untouched.
- **IMGPROXY collision check:** All 6 new test titles verified NOT to end with any of the 14 IMGPROXY_TIED_TITLES patterns at `regen-constants.mjs:55-70`.
- **DATA_RACE/PASS_LOCKED classification recommendation for Plan 07:** All 6 new tests are **PASS_LOCKED** — pass identically across 3 cold runs, no environment dependencies, no race conditions detected. Add them to the PASS_LOCKED pool; do NOT add to DATA_RACE or CASCADE.

## Next Phase Readiness

- **E2E-05 + E2E-07:** Closed. Future regressions on the voter-vs-entity answer-state contract OR per-category SubMatch breakdown contract will be caught by these gates.
- **Cross-spec compatibility:** voter-matching, voter-journey now tolerate the new categorical question. Future specs that walk the voter UI flow (E2E-03, E2E-06 in Plan 03; potentially E2E-08 in Plan 06) should similarly handle questions with <5 choices via out-of-range guards.
- **Dev-seed extension:** The directional anchor is now part of the canonical e2e template. Future plans that want a categorical-question test fixture can reference `test-question-directional-1` directly.
- **No blockers for Plan 06 / Plan 07.**

## Follow-up todos

- **E2E-AUDIT addendum (optional, Claude's Discretion per CONTEXT D-07):** Author `.planning/phases/74-high-leverage-e2e-coverage/74-E2E-AUDIT-addendum.md` documenting the 4 Case markers + directional anchor. NOT BLOCKING — captured here as a phase-close follow-up.

## Self-Check: PASSED

- All 5 modified files verified present on disk.
- Both task commits (`541ea1d08`, `b8099634d`) verified present in `git log`.
- All claims in this SUMMARY are backed by either commit content or empirical Playwright run output.

---
*Phase: 74-high-leverage-e2e-coverage*
*Completed: 2026-05-11*
