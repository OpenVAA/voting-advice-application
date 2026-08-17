---
quick_id: 260602-dud
slug: fixturise-perm-answers-locked-question-n
date: 2026-06-02
---

# Quick Task: Fixturise perm-answers-locked question navigation

## Problem

`tests/tests/specs/perm/perm-answers-locked.spec.ts` (surface 3, opinion
question) navigated via:

```ts
await page.goto(`/en/candidate/questions/${PREFIX}qu-opin-l5-1`);
```

This fails: the per-question URL is keyed on the **internal** question id, not
the seed `external_id`, so a `goto()` built from the prefix + external_id never
resolves to a real question page.

Two further issues: raw CSS locators (`input[type="radio"]`,
`input:visible, textarea:visible, select:visible`) violate the repo's
no-raw-locator ESLint rule.

## Plan

1. **Fixture** — `tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts`:
   add `goToQuestion(textOrNth)` that (a) expands every category-expander
   (idempotent — skips already-open ones), (b) clicks the matching question's
   edit/answer action (number → nth, string|RegExp → label), (c) awaits
   navigation onto the per-question route. Extract a shared `clickEdit` helper
   so `clickEditQuestion` and `goToQuestion` share one click path.

2. **Spec** — replace the `page.goto(...external_id...)` with
   `goToQuestion(/\[QU-OPIN-L5-1\]/)` (label seeded by `buildMinimal`). Convert
   the radio locator to `getByRole('radio')` and the profile input-union to a
   `getByRole` union (textbox/combobox/spinbutton/checkbox/radio). Remove the
   now-unused `PREFIX` const.

## Verification

- `tsc --noEmit` + `eslint` clean on both files.
- `playwright --project=perm-answers-locked` → all 3 spec tests pass.
- `playwright --project=perm-localisation-positive` → still passes (consumer of
  the refactored fixture).
