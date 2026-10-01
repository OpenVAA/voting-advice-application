---
quick_id: 260930-gjx
verified: 2026-09-30T13:25:00Z
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
---

# Quick 260930-gjx Verification Report

**Goal:** forward-port main's pro/con argument fix 66d3ee33d: correct labels/sort, arguments render without info sections, info button shows for arguments-only questions, fi translations consistent.
**Branch/HEAD:** fix/888-review-findings (commits 06c25c5f0, 9ce7a0bda, f8769eb97). E2E not re-run (acknowledged by the plan).

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Pros under the "for" label, cons under "against" in every locale; CategoricalPros keeps proCategory with `{option}` | VERIFIED | `QuestionArguments.svelte` `TITLE_KEYS`: Likert/BooleanPros -> `questions.arguments.pro`, Likert/BooleanCons -> `.con`, CategoricalPros -> `.proCategory`; `option` passed from `getChoice(choiceId)?.label`. Mount tests pass (4/4). |
| 2 | Pros before cons regardless of authored order; same-side authored order kept; symmetric comparator | VERIFIED | `sortArguments` = `[...args].sort((a,b) => Number(isCon(a)) - Number(isCon(b)))`; test for [C1, P, C2] -> P, C1, C2 passes. |
| 3 | Runtime `pro` != `con`, `proCategory` contains the pro label and not the con label; type-gen catalogue equals runtime values | VERIFIED | Read all 7 locales in both catalogues: fi is now pro=Puolesta / con=Vastaan / proCategory "Puolesta: {option}" in both; the other locales are unchanged and consistent. `translations.test.ts` invariant + parity cases pass (324 tests). |
| 4 | With interactiveInfo enabled, an arguments-only question shows the info button and the popup has the arguments expander | VERIFIED | `+layout.svelte` line 245: `interactiveInfo?.enabled && hasExtendedInfo(question)`. `hasExtendedInfo` in `extendedInfo.ts` counts info, infoSections and `args?.length`, and is re-exported from `utils/questions/index.ts`. `QuestionExtendedInfo.svelte` renders the arguments Expander inside `{#if infoSections?.length \|\| args?.length}`, independent of sections. Tests pass. |
| 5 | Empty `arguments: []` renders no expander; sections plus arguments render sections followed by the expander; QuestionExtendedInfoButton unchanged | VERIFIED | The expander is guarded by `{#if args?.length}`. The 5 QuestionExtendedInfo mount tests cover these cases and pass. The button file is not in the changed list of the three commits. |
| 6 | E2E dataset/assertions unchanged; no comment claims arguments render only inside infoSections | VERIFIED | `git diff 9ce7a0bda f8769eb97 -- packages/dev-seed tests` shows only two comment rewordings (seed qu-likert note, spec parenthetical); no data or assertion change. The remaining seed comment at line 223 ("see qu-likert note") is consistent with the new note. |
| 7 | If all findings were already fixed, the item closes as dropped | VERIFIED (n/a) | `66d3ee33d` is not an ancestor of HEAD, and F1-F4 held at pre-plan HEAD, so the port was warranted. The SUMMARY records the revalidation and RED evidence. |

## Artifacts and Wiring

| Artifact | Status |
|---|---|
| `QuestionArguments.svelte` (TITLE_KEYS, isCon, sortArguments, accurate doc block) | VERIFIED, wired through `QuestionExtendedInfo` |
| `QuestionArguments.svelte.test.ts` | VERIFIED, 4 passing |
| `messages/fi/questions.json` and `src/lib/i18n/translations/fi/questions.json` | VERIFIED |
| `translations.test.ts` argument-label invariant and parity cases | VERIFIED |
| `utils/questions/extendedInfo.ts` and `.test.ts`, `index.ts` export | VERIFIED, 5 passing, imported by the layout |
| `QuestionExtendedInfo.svelte` and `.svelte.test.ts` | VERIFIED, 5 passing |
| `(voters)/(located)/questions/+layout.svelte` | VERIFIED, gate uses `hasExtendedInfo` |
| Seed and spec comments | VERIFIED |

## Behavioral Spot-Checks

`yarn workspace @openvaa/frontend test:unit` on QuestionArguments, QuestionExtendedInfo, extendedInfo and translations tests: 4 files, 338 tests passed.

## Anti-Patterns

None found in the changed files: no TODO/FIXME markers, no stubs, and the data flows from `getCustomData(question)` to the rendered output.

## Notes

- The upstream `QuestionExtendedInfoDrawer` change has no counterpart on this branch. `QuestionExtendedInfoButton` passes `question` through `drawerHost.open`, which is consistent with the plan.
- E2E was not re-run (acknowledged); the unchanged E2E assertions rely on testids that this port leaves intact.

## Gaps Summary

No gaps. The goal is achieved at HEAD.
