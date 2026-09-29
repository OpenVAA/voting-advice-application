---
quick_id: 260602-dud
slug: fixturise-perm-answers-locked-question-n
date: 2026-06-02
status: complete
commits:
  - 302b2d00c # test(quick-260602-dud): fixturise perm-answers-locked question nav + role locators
---

# Summary: Fixturise perm-answers-locked question navigation

## What changed

**Fixture** (`candidateQuestionsOverviewPage.fixture.ts`):
- Added `goToQuestion(textOrNth)`: expands every category-expander (idempotent —
  reads each checkbox's checked state, clicks + asserts only when collapsed),
  clicks the matching question's card action, then `waitForURL(/\/candidate\/questions\/[^/?#]+/)`
  to await navigation onto the per-question route.
- Extracted a shared private `clickEdit(textOrNth)` helper; `clickEditQuestion`
  now delegates to it (behaviour identical — verified against the existing
  `perm-localisation-positive` consumer).

**Spec** (`perm-answers-locked.spec.ts`):
- Surface 3 (opinion question) no longer does
  `page.goto('/en/candidate/questions/<external_id>')` — that URL is keyed on
  the internal question id, not the seed external_id, so it could never resolve.
  Now clicks through via `goToQuestion(/\[QU-OPIN-L5-1\]/)` (label seeded by
  `buildMinimal`).
- Radio locator: `.locator('input[type="radio"]')` → `.getByRole('radio')`.
- Profile input-union: `page.locator('input:visible, textarea:visible, select:visible')`
  → role union (`textbox`.or(`combobox`).or(`spinbutton`).or(`checkbox`).or(`radio`)),
  satisfying the repo's no-raw-locator ESLint rule.
- Removed the now-unused `PREFIX` const.

## Why goToQuestion expands ALL categories

The seeded candidate has pre-answered the opinion question, so its `[QC-OPIN]`
category renders **collapsed** (`defaultExpanded` only opens categories with
*unanswered* questions). A label-match against a card inside a collapsed
expander would not find a clickable action — hence the expand-all-first step.

## Verification

- `tsc --noEmit` (tests tsconfig) + `eslint` → clean on both files.
- `playwright --project=perm-answers-locked` → all 3 tests **pass**
  (login info / profile inputs disabled / question radios disabled).
- `playwright --project=perm-localisation-positive` → **pass** (consumer of the
  refactored fixture; proves the `clickEditQuestion` delegation is behaviour-
  preserving).

## Incidental cleanup

A stale Supabase auth user (`candidate-l10n-pos-aa@test.openvaa.local`) left by
repeated local full-suite runs caused a spurious
`inviteUserByEmail failed: A user with this email address has already been registered`
in the l10n setup. Deleted it via the admin API so the env runs green; not a
code change.
