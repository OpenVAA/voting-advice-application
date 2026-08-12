---
phase: 129-new-feature-build-question-inputs-alliance-render-nomination
plan: 05
subsystem: frontend
tags: [question-input, multipleText, svelte5, i18n, a11y, candidate-profile]

# Dependency graph
requires:
  - phase: 129-02
    provides: "customData.minItems/maxItems typed keys (D-02 row-count gating)"
provides:
  - "MultipleTextInput row-list component (add/remove/reorder, minItems/maxItems gating, Array<string> value)"
  - "QuestionInput MultipleText dispatch branch (throw removed) — candidate profile renders seeded multipleText questions"
  - "components.multipleTextInput.{add,remove,moveUp,moveDown} i18n keys x7 locales"
  - "data-testids: multiple-text-row/-add/-remove/-move-up/-move-down"
affects: [129-07, 129-08, candidate-profile, question-inputs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Row-list input as a local $state array emitting a filtered/order-preserving snapshot via onChange (empty rows dropped, duplicates kept, opaque strings)"
    - "Lazy $derived branch dispatch in QuestionInput: MultipleText renders a dedicated component while the Exclude-cast Input path stays unevaluated for that type"

key-files:
  created:
    - apps/frontend/src/lib/components/input/MultipleTextInput.svelte
    - apps/frontend/src/lib/components/input/MultipleTextInput.type.ts
  modified:
    - apps/frontend/src/lib/components/input/QuestionInput.svelte
    - apps/frontend/src/lib/components/input/index.ts
    - apps/frontend/src/lib/i18n/translations/{en,fi,sv,da,et,fr,lb}/components.json
    - apps/frontend/src/lib/types/generated/translationKey.ts

key-decisions:
  - "i18n namespace divergence from UI-SPEC: used components.multipleTextInput.* (established component-strings namespace) — no `input` i18n namespace FILE exists (UI-SPEC proposed input.multipleText.*)"
  - "Reorder icons: collapse (expand_less, up) / expand (expand_more, down) — the only vertical chevrons; previous/next are horizontal back/forward arrows and wrong for a vertical stack"
  - "Resolved the Exclude casts via lazy-derived early branching (option 1): INPUT_TYPES Exclude kept; MultipleText never reaches the cast because the type/inputProps/allProps deriveds are only read in the non-MultipleText template branch"

requirements-completed: [UNBLK-01]

# Metrics
duration: 5min
completed: 2026-07-18
status: complete
---

# Phase 129 Plan 05: MultipleText info-question input Summary

**A new `MultipleTextInput` row-list component (one text input per value, add/remove/reorder icon buttons, minItems/maxItems gating) dispatched from `QuestionInput.svelte` in place of the MultipleText throw — the candidate profile can now render a seeded `multipleText` question (UNBLK-01 input half; seed/round-trip exercise lands in plan 08).**

## Performance
- **Duration:** ~5 min
- **Started:** 2026-07-18T07:48:16Z
- **Completed:** 2026-07-18T07:53:41Z
- **Tasks:** 2
- **Files created:** 2 · **Files modified:** 10

## Accomplishments
- **Task 1 — MultipleTextInput component.** New `MultipleTextInput.svelte` + `.type.ts`: a vertical row list (`gap-4`) where each row is a plain text `<input data-testid="multiple-text-row">` plus a trailing control cluster (`gap-2`) of three `Button variant="icon"` controls — move-up (`multiple-text-move-up`, disabled on first row), move-down (`multiple-text-move-down`, disabled on last row), and remove (`multiple-text-remove`, icon `removeFromList`, `color="warning"`, disabled below the `max(minItems ?? 1, 1)` floor). An add `Button variant="normal" icon="addToList"` (`multiple-text-add`) appends an empty row and is disabled once `rowCount === maxItems`. Value is `Array<string>` (D-01); `onChange` emits `rows.filter(r => r.trim() !== '')` — empty rows dropped, duplicates preserved (no dedup/Set), on-screen order preserved, opaque strings (no numeric coercion). Exported from the input barrel.
- **i18n.** Added a `multipleTextInput` group (`add`/`remove`/`moveUp`/`moveDown`) to `components.json` in all 7 locale dirs (en, fi, sv, da, et, fr, lb) and regenerated the `TranslationKey` type via `yarn generate:translation-key-type`.
- **Task 2 — QuestionInput dispatch.** Removed the `MultipleTextQuestions are not yet supported` throw from the validation `$effect`. Added an `isMultipleText` derived and a dedicated template branch rendering `<MultipleTextInput>` with `label`/`info`(`fillingInfo ?? info`)/`locked` from the same question+customData sources the Input path uses, `value = question.ensureValue(answer.value)` (Array<string>), and `minItems`/`maxItems` from the plan-02 customData keys. `onChange` routes through the same `{ value, question }` event shape as the Input path.

## Deviations from Plan

### 1. [Planned deviation] i18n namespace: `components.multipleTextInput.*` not `input.multipleText.*`
- **Why:** The UI-SPEC Copywriting Contract proposed an `input.multipleText.*` group, but there is **no `input` i18n namespace file** — `components.*` is the established component-strings namespace (siblings: `components.input.*`, `components.select.*`). The plan action explicitly instructed recording this divergence.
- **Result:** Keys live at `components.multipleTextInput.{add,remove,moveUp,moveDown}`.

### 2. [Rule 3 - implementation choice] Reorder icons `collapse`/`expand`
- **Why:** UI-SPEC listed `previous`/`next` among available icons, but those are horizontal back/forward arrows (`arrow_back_ios`/`arrow_forward_ios`) — wrong for a vertical row stack. `collapse` (`expand_less`, up chevron) / `expand` (`expand_more`, down chevron) are the correct vertical affordances.
- **Files:** MultipleTextInput.svelte. Documented inline.

## Known Stubs
None. The component is fully wired: value flows in from `answer.value` via `question.ensureValue`, out via `onChange` into the existing `QuestionInput` event shape.

## Deferred Issues (out of scope — sibling plans)
`yarn check` (svelte-check) reports 6 errors / 3 warnings, **all in files owned by sibling plans 129-02 / 129-04** (`supabaseDataProvider.ts`, `NumberScaleInput.svelte`, `OpinionQuestionInput.svelte`) — confirmed via `git log`. Plan 05's own files produce **zero** svelte-check errors/warnings. Logged to `deferred-items.md` per the SCOPE BOUNDARY rule; these belong to plans 02/04 or the phase's svelte-check-zero milestone gate, not here.

## Verification
- `yarn build --filter=@openvaa/frontend` — exit 0 (both tasks).
- Frontend unit suite — **742 passed (53 files)** (`cd apps/frontend && yarn test:unit --run`). Auth-test stderr ("Token exchange failed / Unauthorized") is expected error-path output.
- i18n key-presence CLI check across all 7 locales — exit 0.
- svelte-check on plan-05 files — clean (0 errors/warnings); the 6 residual errors are sibling-plan pre-existing (see Deferred Issues).
- **Visual smoke (add/remove/reorder, min floor, max ceiling, narrow-viewport overflow backstop):** NOT exercised in this session — deferred to plan 08, which seeds a `multipleText` question and drives the end-to-end round-trip on the candidate profile (per this plan's objective: "seed restore + round-trip exercise land in plan 08"). No dev server / seed was stood up here.

## Threat Mitigations
- **T-129-06 (Tampering, medium):** value routes through `question.ensureValue` (`ensureArray(ensureString)`) client-side before emit; backend `validate_answer_value` 'multipleText' branch independently enforces array-of-string. No numeric coercion; opaque strings end-to-end.
- **T-129-07 (Tampering/XSS, medium):** rows are plain `<input>` values; no `{@html}` introduced. Voter-side render on the entity-detail info tab uses the existing Svelte auto-escaping path (unchanged).

## Task Commits
1. **Task 1: MultipleTextInput component (D-01, D-02)** — `56590809c` (feat)
2. **Task 2: Dispatch MultipleText from QuestionInput, remove throw** — `9c55f9d7a` (feat)

## Next Phase Readiness
- Plan 07 registers the five `multiple-text-*` data-testids in `tests/tests/utils/testIds.ts`.
- Plan 08 seeds a `multipleText` info question + drives the candidate-profile round-trip (save/reload, duplicates, min/max, reorder order) and the multi-byte/backstop visual checks.

## Self-Check: PASSED
- FOUND: apps/frontend/src/lib/components/input/MultipleTextInput.svelte
- FOUND: apps/frontend/src/lib/components/input/MultipleTextInput.type.ts
- FOUND commits: 56590809c, 9c55f9d7a

---
*Phase: 129-new-feature-build-question-inputs-alliance-render-nomination*
*Completed: 2026-07-18*
