# Phase 89 Plan LAST — Legacy PageObject Class Consumer Audit

**Date:** 2026-05-29
**Source of truth for Task 3 prune action.**

## Audit method

For each `*Page.ts` file under `tests/tests/pages/candidate/`, two greps were
run against the test tree to identify consumers:

1. `grep -rln "pages/candidate/<ClassName>" tests/tests/specs/ tests/tests/fixtures/` — direct module import path.
2. `grep -nE "<fixtureName>" tests/tests/specs/...` — fixture-destructure usage via the
   `tests/tests/fixtures/index.ts` legacy PageObject root.

The fixture-destructure form is the **dominant consumption shape**: legacy specs
import `{ test, expect } from '../../fixtures'` and destructure named fixtures
like `loginPage`, `homePage`, `profilePage`, `candidateQuestionsPage`,
`questionPage`, `settingsPage`, `previewPage`. The PageObject class itself is
only ever directly imported by `tests/tests/fixtures/index.ts`. Therefore the
audit projects which CLASSES still have any SURVIVING FIXTURE-DESTRUCTURE
consumer post-deletion of the 5 retiring specs.

The new candidate function-fixtures at `tests/tests/fixtures/candidate/*.fixture.ts`
mention `pages/candidate/<ClassName>.ts` only in their docstring header
("SIBLING (not replacement) to the legacy tests/tests/pages/candidate/...")
— no real imports. The function-fixtures are standalone Playwright fixtures
that do not depend on the legacy PageObject classes.

## Post-deletion projection

The following 5 spec files are removed by Task 2 of Plan 89-LAST per D-89-04:

- `tests/tests/specs/candidate/candidate-auth.spec.ts`
- `tests/tests/specs/candidate/candidate-password.spec.ts`
- `tests/tests/specs/candidate/candidate-registration.spec.ts`
- `tests/tests/specs/candidate/candidate-questions.spec.ts`
- `tests/tests/specs/candidate/candidate-required-info.spec.ts`

Consumer counts below project the world AFTER these deletions: only the
SURVIVING legacy candidate specs (and any non-candidate specs) are scanned.

Surviving candidate specs:

- `candidate-profile.spec.ts`
- `candidate-profile-validation.spec.ts`
- `candidate-translation.spec.ts`
- `candidate-bank-auth.spec.ts`
- `candidate-settings.spec.ts` (residual after 7.1.2/7.1.3/7.1.4 excision)
- `candidate-mega-journey.spec.ts` (89-03 new spec, does NOT consume legacy PageObjects)

## Verdict table

| Class             | Fixture name             | Surviving consumers                                                                                          | Verdict |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ | ------- |
| `HomePage`        | `homePage`               | NONE (only `candidate-auth`, `candidate-password` consumed it — both deleted)                                | DELETE  |
| `LoginPage`       | `loginPage`              | NONE (only `candidate-auth` consumed it — deleted)                                                            | DELETE  |
| `PreviewPage`     | `previewPage`            | NONE (only `candidate-questions`, `candidate-required-info` consumed it — both deleted)                       | DELETE  |
| `ProfilePage`     | `profilePage`            | `candidate-profile.spec.ts:210` (`uploadImage` etc.); docstring refs from `candidate-profile-validation.spec.ts` | KEEP    |
| `QuestionPage`    | `questionPage`           | `candidate-translation.spec.ts:30,35,64,75` (answerInput, saveAnswer)                                         | KEEP    |
| `QuestionsPage`   | `candidateQuestionsPage` | `candidate-translation.spec.ts:20,29,34,73,74`; `candidate-settings.spec.ts:312,319,343,350` (hideHero 7.1.7/8) | KEEP    |
| `SettingsPage`    | `settingsPage`           | NONE                                                                                                          | DELETE  |

**Totals:** 7 verdicts (4 KEEP, 3 DELETE).

## Notes on edge cases

- **`candidate-profile-validation.spec.ts`** mentions `ProfilePage.uploadImage()`
  twice in docstring blocks (lines 123, 216) but does NOT destructure the
  `profilePage` fixture in its test bodies — it bypasses it (line 216: "Bypass
  `ProfilePage.uploadImage()` — that page-object navigates via a..."). However
  `candidate-profile.spec.ts` actually consumes the fixture at line 210
  (`profilePage.uploadImage(imagePath)`) and line 251 (`profilePage.submit()`),
  which alone is sufficient to KEEP the class.

- **`candidate-bank-auth.spec.ts`** consumes NO legacy PageObject fixtures
  (the grep returns zero matches). This is consistent with the spec being a
  fixture-free bank-auth flow that drives the page directly via `page.goto`
  + `page.getByTestId(...)`. It does not influence any class verdict.

- **`SettingsPage`** never had any consumer in any surviving spec. The legacy
  `candidate-settings.spec.ts` itself does NOT destructure the `settingsPage`
  fixture in any of its test bodies — it drives `SupabaseAdminClient` +
  `page.goto` directly throughout (verified via grep). The fixture registration
  in `tests/tests/fixtures/index.ts` is a dead one.

## Task 3 prune list

Per the verdict table, Task 3 deletes:

1. `tests/tests/pages/candidate/HomePage.ts`
2. `tests/tests/pages/candidate/LoginPage.ts`
3. `tests/tests/pages/candidate/PreviewPage.ts`
4. `tests/tests/pages/candidate/SettingsPage.ts`

And removes the corresponding import + fixture-extend registration + named
re-export lines in `tests/tests/fixtures/index.ts` for: `HomePage`, `LoginPage`,
`PreviewPage`, `SettingsPage`. The remaining import + fixture-extend +
re-export lines for `ProfilePage`, `QuestionPage`, `QuestionsPage` (as
`CandidateQuestionsPage`) are PRESERVED verbatim.
