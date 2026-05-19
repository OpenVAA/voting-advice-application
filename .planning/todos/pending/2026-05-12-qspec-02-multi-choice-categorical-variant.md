# QSPEC-02 multi-choice categorical opinion-question variant

**Date:** 2026-05-12
**Source phase:** 75-question-rendering-specs (Plan 02b Task 3 close)
**Scope:** Add multi-choice categorical opinion-question render path + matching dispatch verification + dev-seed answer-emitter wiring + E2E spec authoring.
**Effort:** ~3-5 plans (medium scope; single new component capability + spec authoring + dedup audit + verification gate). Resembles Phase 74 P05 + Phase 75 shape but smaller (single feature path, no new variant template required).
**Source references:**
- Phase 75 CONTEXT D-03 (`.planning/phases/75-question-rendering-specs/75-CONTEXT.md` §"Multi-choice categorical handling")
- Phase 75 VERIFICATION.md SC #2 PASS-WITH-DEFERRAL (`.planning/phases/75-question-rendering-specs/75-VERIFICATION.md`)
- Phase 75 RESEARCH §"Deferred Ideas" (`.planning/phases/75-question-rendering-specs/75-RESEARCH.md`)
- Phase 74 D-04 PASS-WITH-DEFERRAL precedent (E2E-01 single-locale) — shape analog

## Why deferred

`OpinionQuestionInput.svelte:113` renders `<ErrorMessage>{t('error.unsupportedQuestion')}</ErrorMessage>` for `MultipleChoiceCategoricalQuestion` — there is NO existing render path for multi-choice opinion questions in production today. Adding the render branch is a NEW component capability addition (vs Phase 75's coverage-phase scope of asserting existing render paths). Per CONTEXT D-03 + ROADMAP SC #2 LOCKED: the LESSER-risk case (absence of render path → no production breakage) is deferred; the HIGHER-risk case (existing single-choice categorical render path is post-v2.6 code with no E2E gate today) is covered by QSPEC-02 single-choice. Mirrors the Phase 74 D-04 PASS-WITH-DEFERRAL precedent for E2E-01.

## Scope when picked up

1. **Component capability addition.** Add a `MultipleChoiceCategoricalQuestion` render branch to `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:88-114`. Likely shape: `{:else if isMultipleChoiceQuestion(question)}` branch using `QuestionChoices` with checkbox-style multi-select semantics OR a new component if checkbox accessibility surface differs from radio. The `isMultipleChoiceQuestion` type guard already exists at `packages/data/src/utils/typeGuards.ts:53-55` — no new type-guard work needed.

2. **Matching algorithm dispatch verification.** Verify `packages/matching/src/algorithms/matchingAlgorithm.ts` handles `MultipleChoiceCategoricalQuestion` distance correctly. `packages/matching/tests/` has `CategoricalQuestion` test cases — verify dispatch + add multi-choice tests if absent.

3. **Dev-seed answer-emitter wiring.** `pickMultipleChoiceIds` in `packages/dev-seed/src/emitters/answers.ts:115` already exists for the latent / synthetic path. Verify it correctly emits multi-choice answers for new opinion-question types. Add unit test if absent.

4. **Dev-seed e2e template extension.** Add a `test-question-multichoice-1` (type `multipleChoiceCategorical`, sort_order 19 — next available after Phase 75 boolean@18) + new category `test-category-multichoice` (sort 7) + Alpha multi-choice answer cell to `packages/dev-seed/src/templates/e2e.ts`. Same pattern as Phase 75 P01 boolean addition + Phase 74 P05 directional addition.

5. **Spec authoring.** Author `tests/tests/specs/voter/voter-question-rendering-multichoice.spec.ts` per the same 4-step contract used in QSPEC-01 + QSPEC-02:
   - Step 1: Input renders correctly (N checkbox-style choices visible via role/aria locators).
   - Step 2: Voter checks N choices (e.g., selects 2 of 3 options).
   - Step 3: **B-02 mandatory `page.goBack()` browser-back persistence** — both selected options retain their checked state after navigation back.
   - Step 4: Entity-detail mirror — voter sees their selections + Alpha's selections on entity-detail (asymmetric voter≠Alpha shape like QSPEC-02 single-choice).
   
   Use `walkToQuestion(page, 18)` helper from `tests/tests/utils/voterNavigation.ts` (Phase 75 P01 — adjust sort_order to new multi-choice position).

6. **Dedup audit step.** Grep-walk `packages/matching/tests/*.test.ts` + `voter-matching.spec.ts` + `voter-detail.spec.ts` for `MultipleChoiceCategorical` / `multi-choice` references. Classify per the B-03 unified-artifact pattern. Document at `.planning/phases/NN-*/NN-NN-DEDUP-AUDIT.md`.

7. **Verification gate.** Full 3-run cold-start `--workers=1` smoke + parity-script regen (if multi-choice spec adds new test ID to baseline — yes, it will) + IMGPROXY_TIED_TITLES safety re-audit + VERIFICATION.md per Phase 75 shape.

## Dependencies

- `@openvaa/data` `MultipleChoiceCategoricalQuestion` type definition (already exists; `isMultipleChoiceQuestion` type guard at `packages/data/src/utils/typeGuards.ts:53-55`).
- Phase 78 CLEAN-05 (Path B `--likert-only` seed modifier) — if Phase 75's voter-fixture race carry-forward resolves before this todo is picked up, the multi-choice spec lands cleanly in full-suite cold-start; otherwise it inherits the same failure-class as QSPEC-01 + QSPEC-02 (per-plan smoke verified in isolation; full-suite cold-start awaits CLEAN-05).
- No new variant Playwright project required (single-question addition lands in base e2e template per Phase 75 CONTEXT D-02).

## Why now (NOT v2.9)

Preserves the higher-risk single-choice categorical render path (covered by Phase 75 P02a against the post-v2.6 / Phase 74 P05 surface that had no prior E2E gate). The lower-risk multi-choice absence is a KNOWN COMPONENT LIMITATION today — `OpinionQuestionInput.svelte:113` deliberately renders `error.unsupportedQuestion` for unsupported types, surfacing the absence to UI. No production user can hit a multi-choice opinion question because no `MultipleChoiceCategoricalQuestion` exists in production seeds today (only `default` template Finnish demo + `e2e` template have opinion questions; neither contains multi-choice).

Phase 75 is a coverage phase (small + focused per ROADMAP — 2 plans, narrow scope); adding a feature path (component capability addition + matching dispatch verification + dev-seed wiring + spec) exceeds the coverage-phase guardrail. A dedicated feature phase in v2.10 (or later v2.9 if scope expands) is the appropriate home.

## Acceptance Criteria

- [ ] `OpinionQuestionInput.svelte` renders `MultipleChoiceCategoricalQuestion` via a new branch (no longer hits the `error.unsupportedQuestion` fallthrough at line 113).
- [ ] Matching algorithm dispatches `MultipleChoiceCategoricalQuestion` to a correct distance metric (existing or new); unit tests at `packages/matching/tests/` verify.
- [ ] `packages/dev-seed/src/emitters/answers.ts pickMultipleChoiceIds` emits correctly for opinion answers (unit test in `packages/dev-seed/tests/` verifies).
- [ ] `packages/dev-seed/src/templates/e2e.ts` extended with `test-question-multichoice-1` + `test-category-multichoice` + Alpha multi-choice answer cell.
- [ ] `tests/tests/specs/voter/voter-question-rendering-multichoice.spec.ts` authored per 4-step contract.
- [ ] Per-plan smoke PASS × 3 in isolation.
- [ ] Full-suite cold-start: deterministic outcome (PASS_LOCKED if Phase 78 CLEAN-05 has landed; failure-class with documented rationale otherwise).
- [ ] Dedup audit artifact + VERIFICATION.md authored per Phase 75 shape.

## Cross-Links

- Phase 75 CONTEXT D-03 — multi-choice deferral rationale.
- Phase 75 VERIFICATION.md SC #2 PASS-WITH-DEFERRAL.
- Phase 74 D-04 PASS-WITH-DEFERRAL precedent (E2E-01 single-locale).
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:113` (the fallthrough that this todo replaces).
- `packages/data/src/utils/typeGuards.ts:53-55` (`isMultipleChoiceQuestion`).
- `packages/dev-seed/src/emitters/answers.ts:115` (`pickMultipleChoiceIds`).
- ROADMAP.md §"Phase 75" SC #2 (multi-choice deferral acceptance).
