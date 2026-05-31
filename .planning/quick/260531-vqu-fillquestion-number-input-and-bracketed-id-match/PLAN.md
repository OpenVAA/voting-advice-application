---
quick_id: 260531-vqu
slug: fillquestion-number-input-and-bracketed-id-match
date: 2026-05-31
---

# Quick Task: fillQuestion number-input fix + fail-fast + bracketed id matching

## Problem

`candidate-mega-journey.spec.ts:250` hit a 180s test-timeout at
`candidateProfilePage.fillQuestion(/qu-info-number/, …)`:

```
locator.fill: Test timeout of 180000ms exceeded.
  - waiting for getByTestId('candidate-profile-info-item')
      .filter({ hasText: /qu-info-number/ }).first().getByRole('textbox').first()
```

**Root cause (the user's hypothesis was correct):** the `[qu-info-number]`
question is `<input type="number">`, whose ARIA role is **`spinbutton`**, NOT
`textbox` (confirmed in the page snapshot: `spinbutton "[qu-info-number] …"`).
`fillQuestion` descended via `getByRole('textbox')`, which never resolved for a
number input, so `.fill()` auto-waited out the entire per-test timeout.

Two secondary issues requested for all sites:
1. **Fail fast** — a never-resolving editable locator should fail in seconds
   with a clear message, not burn the full 180s test timeout.
2. **Bracketed id matching** — `hasText` regexes matched bare id substrings
   (e.g. `/qu-info-text/` also matches `[qu-info-text-longText]` and
   `[qu-info-text-link]`). Match the full `[id]` token instead, e.g.
   `/\[qu-info-text\]/`.

## Fix

### `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts`
- `fillQuestion`: descend to `getByRole('textbox').or(getByRole('spinbutton'))`
  so number questions are fillable.
- Add `await expect(editable).toBeVisible()` before `.fill()` — bounded by the
  expect timeout (no global override → 5s default), so a missing control fails
  fast with "expected visible" instead of a 180s `.fill()` hang.

### `tests/tests/specs/candidate/candidate-mega-journey.spec.ts`
- Wrap every id-based `hasText` regex in the full bracketed `[id]` token:
  - `expectQuestionsVisible` / `expectQuestionsAbsent` / `expectRequiredBadge`
    info-question list (step 12).
  - Step-13 fill loop: `new RegExp(\`\\[${id}\\]\`)`.
  - `fillQuestion` link (13.5) + required text (14).
  - `getQuestionCard` / `clickEditQuestion` / `getCategoryExpander` opinion +
    category sites (steps 17–18).
  - `expectInfoAnswer` preview sites (step 19).
- All rendered labels are bracketed in baseV1 (verified: `[qu-info-…]`,
  `[qu-opin-…]`, `[qg-opin-…]`), and all consumers filter via `hasText`, so
  bracketing is strictly more precise and behavior-preserving.

## Out of scope

- `submit()` fail-fast gating was NOT added: the page snapshot shows a disabled
  "Save and Return" control, and gating the submit click on `toBeEnabled()`
  risks a regression in step 13 (which submits with the required field empty).

## Verification

- `npx eslint` on both changed files → clean.
- No bare `/qu-` or `/qg-` regex literals remain in spec code.
