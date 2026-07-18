---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
verified: 2026-07-18T13:40:00Z
status: gaps_found
score: 4/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "UNBLK-02: multi-choice categorical opinion questions support D-07 constraint UX end-to-end — an out-of-range (non-zero, non-empty) voter selection is never treated as a persisted/matchable answer"
    status: failed
    reason: >
      Independently confirmed in source (not just per code review 129-REVIEW.md WR-01): the voter
      layout's handleAnswer only special-cases the EMPTY array (0 selections -> deleteAnswer). Any
      non-empty selection — including an under-min (e.g. 1 of min 2) or over-max (e.g. 4 of max 3)
      selection — is unconditionally persisted via answers.setAnswer(question.id, value), which feeds
      MultipleChoiceCategoricalQuestion._normalizeValue and therefore the matching computation.
      opinionInputValid / QuestionActions.answered correctly show a "Skip"-labeled button in most
      question positions (confirmed by reading QuestionActions.svelte's handleNext/answered wiring),
      but clicking that "Skip"-appearing button calls onSkip -> handleJump(+1) only — it never deletes
      the already-persisted invalid answer. So an invalid selection silently survives into matching
      even though the UI signals "unanswered". Additionally, at whatever question the voter layout's
      `nextLabel` guard treats as the LAST question, the override
      `answers.answers[question!.id]?.value != null ? t('results.title.results') : undefined` does not
      AND in `opinionInputValid`, so if a multi-choice categorical question were ever the last question
      in a category's question list, the button would misleadingly read "Results" instead of "Skip" at
      an invalid selection count (not currently reachable in the e2e/base ordering — Base-7 multichoice
      sits at sort_order 106 with further opinion questions at 110-160, so this specific sub-case is not
      e2e-covered, but the core persistence gap is present regardless of question position).
    artifacts:
      - path: "apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte"
        issue: "handleAnswer (lines ~174-191) persists any non-empty multi-choice array unconditionally; nextLabel guard (line ~297) omits the opinionInputValid AND-term"
    missing:
      - "Gate persistence in handleAnswer: when the multi-choice value is non-empty but !opinionInputValid, either skip the setAnswer call or route to deleteAnswer, so an invalid selection is never treated as a final matchable answer."
      - "AND opinionInputValid into the nextLabel override so the last-question CTA never reads 'Results' while the selection is invalid."
    candidate_side: "Not affected — candidate canSubmit correctly ANDs answerValid (confirmed at [questionId]/+page.svelte:132-133), so the candidate app cannot Save an invalid selection."
deferred: []
human_verification: []
---

# Phase 129: New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch — Verification Report

**Phase Goal:** UNBLK-01/02/04/05/06: build MultipleText + multi-choice categorical + number-scale inputs, alliance render, /nominations fetch. Phase 129 BUILDS the new features; Phase 130 lands their dependent E2E specs.
**Verified:** 2026-07-18
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | UNBLK-01: `QuestionInput` renders and persists `MultipleTextQuestion` answers | ✓ VERIFIED | `QuestionInput.svelte` throw removed; `MultipleTextInput.svelte` exists with all 5 testids, min/max gating, order-preserving onChange; candidate-journey E2E spec (live-run, this session) passes including the restored `qu-info-multipleText` visibility + fill assertions |
| 2 | UNBLK-02: frontend supports a multi-choice categorical opinion variant — input + matching dispatch + dev-seed authoring | ✗ FAILED (partial) | Input component, matching (`_normalizeValue` binary subdimensions), dev-seed authoring, and the *candidate-side* validity gate are all present and correct. The *voter-side* persistence gate is missing — see Gaps. |
| 3 | UNBLK-04: `/nominations` route fetches question data so all-nominations entities render correctly | ✓ VERIFIED | `nominations/+layout.ts` adds `questionData` (locale-only `getQuestionData`, `.catch((e)=>e)` parity); `nominations/+layout.svelte` was ALSO wired to apply it via `provideQuestionData` (the actual prior gap, per 129-03-SUMMARY) — confirmed present in source |
| 4 | UNBLK-05: frontend supports a number-scale opinion question — input + matching dispatch + dev-seed authoring | ✓ VERIFIED | `NumberScaleInput.svelte` (native range, both testids, min/max bound to `question.min/max`, `ensureValue` on change), `isNumberQuestion && question.isMatchable` dispatch branch, `customData.min/max` -> `NumberQuestionData` bridge, seed rows at sort_order 105 — voter-journey E2E (live-run, this session) exercises the slider via keyboard Home/End |
| 5 | UNBLK-06: alliance entities render in voter results (card + member-orgs drawer) | ✓ VERIFIED | `results.sections` = `['candidate','organization','alliance']` (alliance strictly LAST) in both `e2e/base` and `default` templates; voter-journey E2E D-10 step (live-run, this session) asserts `voter-results-alliance-section` visible, Alliance A card visible, `match-score` gauge visible, and a 2nd member-org subcard visible — all passed |

**Score:** 4/5 truths verified (1 partial-fail: UNBLK-02 voter-side persistence gap)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/data/.../multipleChoiceCategoricalQuestion.ts` | matching trio implemented, TODO removed | ✓ VERIFIED | `isMatchable`, `normalizedDimensions`, `_normalizeValue` present; binary-subdimension logic correct; TODO gone |
| `packages/data/src/utils/typeGuards.ts` + `index.ts` | `isNumberQuestion` guard, exported | ✓ VERIFIED | Present, exported, `objectType`-based (no `instanceof`) |
| `packages/app-shared/.../customData.type.ts` | 6 new Question keys | ✓ VERIFIED | `min`, `max`, `minItems`, `maxItems`, `minSelections`, `maxSelections` all present with JSDoc |
| `supabaseDataProvider.ts` | number min/max bridge in `getQuestionData` | ✓ VERIFIED | `row.type === 'number'` conditional lifts typeof-guarded `customData.min/max` |
| `apps/frontend/.../nominations/+layout.ts` | `questionData` added to load return | ✓ VERIFIED | Present, locale-only, `.catch` wrapped |
| `apps/frontend/.../nominations/+layout.svelte` | consumer applies questionData into dataRoot | ✓ VERIFIED | `provideQuestionData` call added (beyond plan-03's literal file list — a real, necessary fix, correctly self-reported in 129-03-SUMMARY) |
| `NumberScaleInput.svelte` / `.type.ts` | native range slider, both testids, display mode | ✓ VERIFIED | Confirmed via grep + read; dual-marker display mode present |
| `OpinionQuestionInput.svelte` | `isNumberQuestion` + `isMultipleChoiceQuestion` branches, `$bindable valid` | ✓ VERIFIED | Both branches present, gated correctly, `valid` bindable computed from selection count |
| `MultipleTextInput.svelte` / `.type.ts` | row-list, 5 testids, min/max gating | ✓ VERIFIED | All 5 testids present; index-keyed `{#each}` (WR-03, minor — see Anti-Patterns) |
| `QuestionInput.svelte` | MultipleText throw removed | ✓ VERIFIED | Throw removed; dedicated branch renders `MultipleTextInput` |
| `QuestionChoices.svelte` | checkbox multi-select mode, locator contract preserved | ✓ VERIFIED | `type="checkbox"`, `data-testid="question-choice"`, `name="questionChoices-{id}"`, `checkbox-primary h-32 w-32` all present; no `disabled` tied to `maxSelections` |
| voter layout `+layout.svelte` | auto-advance suppression, Skip gate, empty-array delete | ⚠️ PARTIAL | Auto-advance suppression correct (single-choice/boolean only); empty-array delete correct; but the non-empty invalid-selection persistence gap (WR-01) lives here — see Gaps |
| candidate `[questionId]/+page.svelte` | Save gate ANDs validity | ✓ VERIFIED | `canSubmit` ANDs `answerValid`, confirmed at source |
| `e2e/base.ts` | alliance in sections (LAST), 2 new opinion Qs, multipleText restored | ✓ VERIFIED | All confirmed via grep + live `yarn db:seed --template e2e/base` (25 questions, 0 rejections) run this session |
| `default.ts` + `buildMinimal.ts` | D-15 parity + D-16 number/multi-choice branches | ✓ VERIFIED | `sections` alliance-inclusive; live `yarn db:seed:default` run this session (26 questions, 0 rejections) |
| `tests/tests/utils/testIds.ts` | 8 new locators | ✓ VERIFIED | `grep -c` of the 8 strings reports 8 |
| `voter-journey.fixture.ts` | slider + checkbox walk branches | ✓ VERIFIED | Present; inertness against pre-plan-08 seed was proven in 129-07; walk now live-exercises both branches (confirmed this session) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `OpinionQuestionInput.svelte` | `@openvaa/data` | `isNumberQuestion`/`isMultipleChoiceQuestion` import | ✓ WIRED | Both imported and used in dispatch chain |
| `NumberQuestion.min/max` | `getQuestionData` bridge | `customData.min/max` typeof-guarded lift | ✓ WIRED | Confirmed at `supabaseDataProvider.ts:585-590` |
| `nominations/+layout.ts` load result | `dataRoot` | `provideQuestionData` in `+layout.svelte` | ✓ WIRED | Confirmed; this was the real gap plan-03 closed (loader alone was insufficient) |
| voter `handleAnswer` | `answers.setAnswer` / `answers.deleteAnswer` | multi-choice value routing | ⚠️ PARTIAL | Empty array → `deleteAnswer` (correct); non-empty invalid array → `setAnswer` (incorrect per D-07 intent — see Gaps) |
| candidate `canSubmit` | `answerValid` (bound from `OpinionQuestionInput`) | AND-term | ✓ WIRED | Confirmed |
| `e2e/base` seed `results.sections` | `voterContext.svelte.ts` `#entityTypes` | alliance element addition | ✓ WIRED | Live E2E run (this session) confirms the alliance tab, card, gauge, and member-org subcard all render |

### Behavioral Spot-Checks (live-run this session, not from SUMMARY claims)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `packages/data` unit suite | `cd packages/data && yarn vitest run` | 244/244 passed (47 files) | ✓ PASS |
| `apps/frontend` unit suite | `cd apps/frontend && yarn test:unit --run` | 742/742 passed (53 files) | ✓ PASS |
| `packages/dev-seed` unit suite | `cd packages/dev-seed && yarn test:unit --run` | 444/444 passed (42 files), incl. integration test | ✓ PASS |
| `apps/frontend` svelte-check | `cd apps/frontend && yarn check` | 2674 files, 0 errors, 0 warnings | ✓ PASS |
| `yarn db:reset && yarn db:seed --template e2e/base` | seed import | 25 questions, 0 RPC validation errors | ✓ PASS |
| `yarn db:reset && yarn db:seed:default` | seed import | 26 questions, 327 candidates, 0 RPC validation errors | ✓ PASS |
| `voter-journey.spec.ts` (full, incl. D-10 alliance assertions + slider walk) | `npx playwright test tests/specs/voter/voter-journey.spec.ts` (fresh dev server + fresh e2e/base seed) | 3 passed (40.8s) | ✓ PASS |
| `candidate-journey.spec.ts` (full, incl. multipleText + checkbox/slider walk) | `npx playwright test tests/specs/candidate/candidate-journey.spec.ts` (same server/seed) | 5 passed (29.5s) | ✓ PASS |

Note: the full 125-spec E2E suite (`yarn test:e2e`) was NOT re-run in full during this verification (10+ minute cost); the two specs most directly exercising this phase's new surfaces (voter-journey, candidate-journey) were run live end-to-end against a freshly reset DB + fresh dev server and both passed, corroborating the 129-08-SUMMARY claim of "125 passed / 0 failed / 0 did-not-run" for the areas this phase touches. The remaining ~117 specs were not independently re-run; SUMMARY's full-suite claim is plausible given the two most-exposed specs pass cleanly and svelte-check/unit suites are independently confirmed clean.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|----------------|--------------|--------|----------|
| UNBLK-01 | 129-02, 129-05, 129-08 | MultipleText input renders + persists | ✓ SATISFIED | Component + dispatch + seed restore + live E2E pass |
| UNBLK-02 | 129-01, 129-02, 129-06, 129-07, 129-08 | Multi-choice categorical variant: input + matching + seed | ✗ PARTIALLY BLOCKED | Matching, input, seed, candidate-gate all correct; voter-side invalid-selection persistence gap (WR-01) is a real defect in the shipped D-07 divergence design |
| UNBLK-04 | 129-03 | `/nominations` fetches question data | ✓ SATISFIED | Loader + consumer both wired |
| UNBLK-05 | 129-01, 129-02, 129-04, 129-07, 129-08 | Number-scale input: input + matching + seed | ✓ SATISFIED | Component + dispatch + bridge + seed + live E2E pass |
| UNBLK-06 | 129-08 | Alliance entities render in voter results | ✓ SATISFIED | One-line seed fix + live E2E D-10 assertions pass |

No orphaned requirements: all 5 phase-mapped REQ-IDs (UNBLK-01/02/04/05/06) are declared across the 8 plans' `requirements` frontmatter and covered above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` | 174-191, 295-299 | Invalid multi-choice selections persisted unconditionally (WR-01) | 🛑 Blocker (for UNBLK-02 goal) | See Gaps — matching can be polluted by out-of-range voter selections |
| `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` | 370, 382 | Duplicate `onkeyup` on radio `<label>`+`<input>` double-dispatches keyboard events (WR-02) | ⚠️ Warning | Pre-existing (predates this phase, confirmed via `git log -S` against `c0eeb864c^`); re-indented into scope but not introduced by 129. Keyboard users can double-advance on single-choice/boolean questions. Not gating this phase's goal but flagged for awareness. |
| `apps/frontend/src/lib/components/input/MultipleTextInput.svelte` | 159 | `{#each rows as row, index (index)}` — index-keyed reorder (WR-03) | ⚠️ Warning | Reorder moves values not DOM focus; no data loss, minor UX surprise for keyboard-driven reorder |
| `packages/dev-seed/src/templates/defaults/questions-override.ts` | 15, 121-124 | Stale "24 questions" comments (IN-01) | ℹ️ Info | Cosmetic; code is correct |
| `tests/tests/fixtures/voter/voter-journey.fixture.ts` (+ candidate fixture) | ~400-415 | Hardcoded "click first 2" coupled to seed's `minSelections=2` (IN-02) | ℹ️ Info | Latent flake source if a future seed authors different min/max; not a current failure |
| `NumberScaleInput.svelte` | 154 | Display-mode thumb shows only one value (IN-03) | ℹ️ Info | Purely presentational, markers convey both values |

No `TBD`/`FIXME`/`XXX` markers found in any file touched by this phase (only one pre-existing `TODO` unrelated to this phase's scope, in the voter questions layout, predating 129 by six weeks).

### Human Verification Required

None required — all must-haves are either mechanically verifiable (and were verified) or resolved to a concrete FAIL with source-level evidence (WR-01). No item needs subjective/visual human judgment to resolve status here (the UI-SPEC visual backstops noted as "deferred to dev-server" in 129-04/06 SUMMARYs were effectively exercised by the live E2E runs in this session, which render the actual UI).

### Gaps Summary

Four of five UNBLK requirements (01, 04, 05, 06) are cleanly and verifiably achieved — components exist, are wired end-to-end, and were exercised live in this session against a fresh seed + fresh dev server (not just re-stated from SUMMARY.md).

UNBLK-02 (multi-choice categorical opinion questions) is **functionally incomplete on the voter side**: the shared `OpinionQuestionInput`/`QuestionChoices` correctly *compute* validity and *display* it (candidate Save disables correctly; voter action button reads "Skip" in the common case), but the voter layout's `handleAnswer` never actually clears or withholds an out-of-range non-empty selection from `answers.setAnswer`. This means a voter who selects, say, 1 choice on a `minSelections:2` question and then navigates away (via Skip, via header nav, or via any path that doesn't force them back to fix the selection) leaves an "invalid" answer in the store that IS consumed by `MultipleChoiceCategoricalQuestion._normalizeValue` and enters matching — silently contradicting the design intent stated in 129-06-PLAN.md's own objective ("D-07 divergence exact: candidate Save gated, voter stays Skip ... zero = unanswered"). This was independently confirmed by reading `+layout.svelte`, `QuestionActions.svelte`, and the multi-choice normalization code directly (not inferred from 129-REVIEW.md WR-01, though it corroborates that finding).

This is a real, reproducible defect discovered through direct code reading, not a speculative concern. It does not crash anything, is not currently exercised by the e2e/base seed's question ordering (Base-7 multichoice is not the walk's last question, so the compounding CTA-label bug is not currently observable in the E2E suite), and 129-REVIEW.md rated it WARNING rather than Critical. Given the phase's own stated intent for the D-07 UX contract, and that it directly affects matching-data integrity for the new multi-choice categorical variant (the substance of UNBLK-02), it is reported here as a gap rather than downgraded to an info note.

**This looks like it could be accepted as a documented, tracked deviation** if the developer judges the risk acceptable for this phase (WARNING-severity per code review, candidate side unaffected, not e2e-observable with the current seed ordering). To accept it, add to VERIFICATION.md frontmatter:

```yaml
overrides:
  - must_have: "Voter-side invalid multi-choice selections are never persisted into matching"
    reason: "Accepted as a known WARNING-severity gap (129-REVIEW.md WR-01); tracked for a follow-up fix"
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

Otherwise, the fix is small and scoped to `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte`'s `handleAnswer` (gate the `setAnswer` call on `opinionInputValid` for array values, and AND `opinionInputValid` into the `nextLabel` guard) — see 129-REVIEW.md WR-01 for the suggested diff.

---

_Verified: 2026-07-18_
_Verifier: Claude (gsd-verifier)_
