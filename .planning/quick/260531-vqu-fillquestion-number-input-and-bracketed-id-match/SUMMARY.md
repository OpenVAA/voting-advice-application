---
quick_id: 260531-vqu
slug: fillquestion-number-input-and-bracketed-id-match
date: 2026-05-31
status: complete
---

# Summary

Fixed the 180s `fillQuestion(/qu-info-number/, …)` hang and applied the two
requested broad hardenings (fail-fast + bracketed id matching).

## Root cause

`[qu-info-number]` is `<input type="number">` → ARIA role `spinbutton`, not
`textbox`. `fillQuestion`'s `getByRole('textbox')` never resolved, so `.fill()`
waited out the full per-test timeout. (User's numeric-input hypothesis: correct.)

## Changed

- `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts`
  - `fillQuestion` now descends to `getByRole('textbox').or(getByRole('spinbutton'))`.
  - Added `await expect(editable).toBeVisible()` before `.fill()` → fails fast
    (~5s expect timeout) instead of 180s.
- `tests/tests/specs/candidate/candidate-mega-journey.spec.ts`
  - All id-based `hasText` regexes wrapped in full bracketed `[id]` tokens
    (info-question visible/absent/required lists, step-13 fill loop, link +
    required fill calls, opinion `getQuestionCard`/`clickEditQuestion`/
    `getCategoryExpander`, preview `expectInfoAnswer`).

## Verification

- `npx eslint` (TS parser) on both files → exit 0, clean.
- grep confirms zero bare `/qu-` or `/qg-` regex literals remain in spec code.
- E2E not run (per standing directive).

## Notes

- `submit()` fail-fast gating deliberately NOT added — the snapshot shows a
  disabled "Save and Return" control and step 13 submits with the required
  field empty, so a `toBeEnabled()` gate there risks a regression.
- Same fail-fast pattern as the prior ToU quick task ([[260531-vdn]]).
