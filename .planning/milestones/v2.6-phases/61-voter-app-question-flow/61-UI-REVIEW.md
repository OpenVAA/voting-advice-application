---
phase: 61
slug: voter-app-question-flow
overall_score: 23
pillar_scores:
  copywriting: 4
  visuals: 4
  color: 4
  typography: 4
  spacing: 4
  experience_design: 3
audited: 2026-04-24
baseline: 61-UI-SPEC.md (approved)
screenshots: partial — dev server at localhost:5173 active; voter /questions route gated behind constituency selection (no unauthenticated deep-link); root + constituency-redirect screens captured. Code-only audit used for question-flow internals.
registry_audit: not applicable (project is not a shadcn target; no components.json)
---

# Phase 61 — UI Review

**Audited:** 2026-04-24
**Baseline:** 61-UI-SPEC.md (approved retrofit contract)
**Screenshots:** Partial — dev server running at localhost:5173; voter `/questions` route redirects to constituency selection before rendering (guard working correctly); question-flow internals audited via code review.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All i18n keys match spec exactly; `common.answer.yes`/`no` used in all 7 locales |
| 2. Visuals | 4/4 | Boolean branch renders via existing `QuestionChoices` grid; no new visual surface; testIds preserved verbatim |
| 3. Color | 4/4 | Accent applied to exactly the 4 spec-listed elements; no `text-accent`/`bg-accent`/`text-warning` introduced |
| 4. Typography | 4/4 | Only `text-xs` and `text-xl` appear in question-flow files; both within the declared scale; 2 weights only |
| 5. Spacing | 4/4 | No new spacing utilities introduced; `gap-sm` and existing fieldset grid styles only; one `[8rem]` arbitrary in pre-existing `min-w-[8rem]` (not Phase 61) |
| 6. Experience Design | 3/4 | All four QUESTION-0x contracts satisfied; testId visibility restored; E2E gate added for QUESTION-03 but E2E was not executed in-session (deferred to next `yarn test:e2e` run) |

**Overall: 23/24**

---

## Top 3 Priority Fixes

1. **E2E gate not yet verified in-session** — voter-questions.spec.ts was written and linted but `yarn dev` + `yarn test:e2e` was not run during Plan 61-02 or 61-03 execution. The 2 pre-existing voter-questions failures reported in 61-03-SUMMARY §Decisions remain open and are deferred to Phase 63. Risk is low (code is structurally correct) but the QUESTION-03 regression gate has not been confirmed green. **Fix:** Run `yarn playwright test -c ./tests/playwright.config.ts tests/tests/specs/voter/voter-questions.spec.ts --workers=1` on the next dev session to confirm the counter defaults and toggle-reactivity cases pass. Track as Phase 63 input.

2. **Vite pre-bundle cache not permanently fixed** — Plan 61-03 cleared `.vite/deps` transiently to unblock diagnostics. The permanent fix (`optimizeDeps.exclude` for `@openvaa/data` and sibling workspace packages in `apps/frontend/vite.config.ts`) was deferred. Any subsequent workspace-package export addition (future phases) risks the same cold-start SyntaxError that masked the candidate-context bug during diagnosis. **Fix:** Add `optimizeDeps.exclude: ['@openvaa/data', '@openvaa/core', '@openvaa/app-shared', '@openvaa/filters', '@openvaa/matching']` to `apps/frontend/vite.config.ts` in a follow-up plan (Phase 63 or separate).

3. **`candidate/(protected)/questions/+page.svelte` still uses destructured context** — `+layout.svelte` was correctly fixed to use `ctx.X` pattern, but `+page.svelte` destructures the full context (`const { answersLocked, appSettings, … } = getCandidateContext()`). The page works now because the reactive properties it consumes (`opinionQuestions`, `unansweredOpinionQuestions`, etc.) come through the push-based `$state` mirrors in `candidateContext.svelte.ts` and are stable getters. However, this is an inconsistent pattern against the canonical pattern established by 61-03 and could silently break reactivity if a property is later backed by a plain `$derived` rather than a `$state` mirror. **Fix:** As a follow-on hygiene task, switch `+page.svelte` to `const ctx = getCandidateContext()` and access reactive properties via `ctx.X` to match `+layout.svelte`. Non-urgent (no current breakage), appropriate for Phase 63 or a dedicated cleanup plan.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

All copy contracts from the UI-SPEC are met:

- **Boolean Yes/No labels** (`OpinionQuestionInput.svelte:69-70`): Uses `common.answer.yes` / `common.answer.no` — the nested path specified in the Copywriting Contract, not the `common.yes`/`common.no` top-level path mentioned in CONTEXT D-02. Spec supersession applied correctly.
- **Locale parity**: All 7 detected locales (en, fi, sv, da, et, fr, lb) have `answer.yes` / `answer.no` in their `common.json` files. The 4 required locales (en/fi/sv/da) are confirmed present.
- **Counter copy** (`+page.svelte:160-162`): `questions.intro.start` is used with `numQuestions: voterCtx.selectedQuestionCategoryIds.length > 0 ? selectedQuestionBlocks.questions.length : 0`. This correctly produces 0 only when the voter has actively deselected all categories.
- **Error fallback** (`OpinionQuestionInput.svelte:109`): `error.unsupportedQuestion` remains on the `:else` branch as required.
- **Candidate CTA** (`+page.svelte:108`): Uses `common.continue` on `candidate-questions-start` testId as declared.
- **No generic labels found**: No "Submit", "Click Here", "OK", or "Save" in question-flow files.

### Pillar 2: Visuals (4/4)

Phase 61 is a bug-fix phase with no new visual surface:

- **Boolean branch renders via existing `QuestionChoices` grid**: `isBooleanQuestion` branch in `OpinionQuestionInput.svelte:96-107` passes `choices={booleanChoices}` to `QuestionChoices`. No new grid, no new layout component. Visual idiom identical to a 2-point singleChoiceOrdinal question.
- **Connecting line for boolean**: `doShowLine` in `QuestionChoices.svelte:103-109` correctly returns `true` for `OBJECT_TYPE.BooleanQuestion`, matching the spec's horizontal 2-point line idiom.
- **`showLine !== undefined` guard** (`QuestionChoices.svelte:104`): Explicit `false` overrides are preserved — a latent bug in the pre-existing `if (showLine)` guard was corrected as an auto-fix in Plan 61-01.
- **TestIds preserved verbatim**: `opinion-question-input`, `question-choices`, `question-choice` (applied to each pseudo-choice via `{#each choices ?? []}` loop), `voter-questions-category-list`, `voter-questions-category-checkbox`, `voter-questions-start`, `candidate-questions-list`, `candidate-questions-start`, `candidate-questions-continue`, `candidate-questions-home` — all confirmed at correct nesting levels.
- **`sr-only` legend preserved**: `QuestionChoices.svelte:222` has `<legend class="sr-only">{text}</legend>`. Accessibility contract intact.
- **No icon-only buttons added**: No new interactions; existing buttons are unchanged.

### Pillar 3: Color (4/4)

Accent usage matches the spec's explicit list of 4 allowed elements:

1. `radio-primary` on radio inputs (`QuestionChoices.svelte:262`) — radio checked state on boolean pseudo-choices.
2. `text-primary` on voter's own answer label in display mode (`QuestionChoices.svelte:247, 251`) — "You" label.
3. Category checkbox selected state (daisyUI `.checkbox` default primary — not changed this phase).
4. Primary CTA `Button variant="main"` — not changed this phase.

**No new color tokens introduced.** `text-accent`, `bg-accent`, `text-warning`, `bg-warning` are absent from all Phase 61 modified files. The pre-existing `text-warning` on `candidate-questions-progress` (`+page.svelte:121`) was not touched by Phase 61 — confirmed via `git diff --name-only f231a7e5e..18e87f6f1` showing `+page.svelte` is not in the Phase 61 diff.

**No hardcoded hex values introduced**: The `#[0-9a-fA-F]{3,8}` grep on question-flow files returned only the `#d9d9d9`/`#262626` `--line-color` variables from `app.css` (pre-existing design tokens, correctly declared as CSS custom properties). Phase 61 files are clean.

### Pillar 4: Typography (4/4)

Font size audit of all Phase 61 touched files returns only 2 distinct sizes:

- `text-xs` — used for `.display-label` (uppercase "You" / entity name label in display mode, `QuestionChoices.svelte:314`)
- `text-xl` — used in pre-existing question layout context (category intro heading)

Both are within the declared typography scale (`text-xs` = `~11.5px`, `text-xl` = `~20px`). No `text-md`, `text-sm`, `text-lg`, `text-2xl` or other sizes introduced by Phase 61.

Font weights: `font-normal` (400) and `font-bold` (700) — exactly the 2 declared weights. No `font-medium`, `font-semibold`, or other intermediate weights.

Boolean pseudo-choice labels render via `QuestionChoices.svelte:275` using `small-label text-center` (horizontal variant) or `text-start` (vertical). These are existing CSS classes; no new font sizing applied.

### Pillar 5: Spacing (4/4)

Spacing grep on Phase 61 modified files returns:

- `gap-sm` (voter questions intro `+page.svelte:121`) — daisyUI/project utility, within scale
- Pre-existing `gap-md`, `gap-lg` utilities in `QuestionChoices.svelte` postcss blocks — unchanged by Phase 61
- `@apply gap-md min-w-[8rem]` in `QuestionChoices.svelte:303` — the `[8rem]` arbitrary value is pre-existing (in the file before Phase 61 commits). Phase 61 did not introduce it.

No new `gap-*`, `p-*`, or `m-*` classes were added on the boolean pseudo-choices or any other Phase 61 element. The boolean branch renders inside the existing `QuestionChoices.svelte` `<fieldset>` grid whose spacing is governed by the `vertical`/horizontal modifier and existing gap utilities — as specified by the UI-SPEC.

The `1.8rem` arbitrary value in `candidate/(protected)/questions/+page.svelte:211` (`before:top-[-1.8rem]`) is pre-existing and not touched by Phase 61.

### Pillar 6: Experience Design (3/4)

**What works (all four QUESTION-0x contracts):**

- **QUESTION-01 (boolean answer)**: Boolean questions now render a Yes/No radio group instead of an error message. `isBooleanQuestion` branch in `OpinionQuestionInput.svelte:96-107` handles both `answer` and `display` modes.
- **QUESTION-02 (boolean match-breakdown)**: Resolved for free via shared dispatch — `EntityOpinions.svelte` was not modified; its existing dispatch through `OpinionQuestionInput` now hits the boolean branch. Confirmed: no `EntityOpinions.svelte` in Phase 61 diff.
- **QUESTION-03 (category reactivity)**: `_selectedQuestionCategoryIds` migrated to pure `$state` with context-level seeding via guarded `$effect`. Counter should never render `"Answer 0 Questions"` on first paint. E2E gate written (`voter-questions.spec.ts`).
- **QUESTION-04 (candidate-questions testId)**: Compound fix (candidateContext `$state + $effect` push pattern + `+layout.svelte` `ctx.X` access pattern). Plan 61-03 SUMMARY reports 8/8 `candidate-questions.spec.ts` tests passing and cascade tests running to completion.

**Loading states**: `Loading` component used in question-flow pages (`[questionId]/+page.svelte` for both voter and candidate) — unchanged, appropriate coverage.

**Error states**: `ErrorMessage` fallback for unsupported question types preserved in `OpinionQuestionInput.svelte:109`. Layout-level `error.noQuestions` error state preserved in `+layout.svelte` for both voter and candidate paths.

**Disabled state**: CTA `disabled={!canSubmit}` on voter questions intro (`+page.svelte:157`) correctly gates submission when fewer than `minimumAnswers` questions are in selected categories.

**What earns the deduction (3 instead of 4):**

- **E2E gate not confirmed green in-session**: `voter-questions.spec.ts` was written and linted but `yarn test:e2e` was not executed during Plan 61-02 or 61-03. The 2 pre-existing voter-questions failures noted in the 61-03 SUMMARY (stash-verified as pre-existing on main) remain open inputs to Phase 63. While the fix is structurally sound, the behavioral regression gate is unconfirmed. Experience design score reflects that the stated acceptance criterion for QUESTION-03 (E2E passes) is partially incomplete.
- **`+page.svelte` destructures candidateContext**: See Priority Fix 3 above. Non-blocking today but inconsistent with the canonical pattern that 61-03 established.

**Registry audit**: Not applicable — project has no `components.json`; no shadcn; no third-party registry blocks.

---

## Files Audited

**Phase 61 modified files (source)**
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte`
- `apps/frontend/src/lib/components/questions/QuestionChoices.svelte`
- `apps/frontend/src/lib/components/questions/QuestionChoices.type.ts`
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts`
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts`
- `apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte`
- `apps/frontend/src/routes/candidate/(protected)/questions/+layout.svelte`
- `tests/tests/specs/voter/voter-questions.spec.ts` (created)

**Referenced for context**
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` (pre-existing, not modified by Phase 61)
- `apps/frontend/src/app.css` (design token source)
- `apps/frontend/src/lib/i18n/translations/{en,fi,sv,da,et,fr,lb}/common.json` (locale parity audit)
- `.planning/phases/61-voter-app-question-flow/61-UI-SPEC.md`
- `.planning/phases/61-voter-app-question-flow/61-01-SUMMARY.md`
- `.planning/phases/61-voter-app-question-flow/61-02-SUMMARY.md`
- `.planning/phases/61-voter-app-question-flow/61-03-SUMMARY.md`
