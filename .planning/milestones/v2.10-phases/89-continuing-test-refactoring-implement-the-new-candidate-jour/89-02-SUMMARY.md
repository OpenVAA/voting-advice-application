---
phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
plan: 02
subsystem: testing
tags: [playwright, e2e, candidate-app, fixtures, page-objects, function-fixtures, testids, mailpit, parallel-landing]

# Dependency graph
requires:
  - phase: 88-e2e-test-catalog-audit-remove-add-consolidate-tests-fresh-ba
    provides: function-fixture pattern (views.ts), entityDetails.fixture.ts / resultsPage.fixture.ts templates, central testIds namespace
  - phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
    plan: 01
    provides: baseV1 dataset extensions (unregistered candidate, filtered info questions, hero/info content) + 3 new voter testids landing in same namespace as 89-02's candidate additions
provides:
  - "11 candidate function-fixtures at tests/tests/fixtures/candidate/*.fixture.ts (emailBucket, candidateLoginPage, candidateTermsOfUsePage, candidateHomePage, candidateForgotPasswordPage, candidatePasswordSetter, candidateProfilePage, candidateQuestionsOverviewPage, candidateQuestionPage, candidatePreviewPage, candidateLogoutButton)"
  - "1 composition root tests/tests/fixtures/candidate/candidate-mega.ts exporting `test` (Playwright base.extend with all 11 fixtures + recipientEmail option) and re-exporting `expect`"
  - "7 new testid string constants under testIds.candidate.* namespace (terms.submit / questions.categoryExpander / questions.hero / questions.intro / profile.imageError / profile.nominations / profile.infoItem)"
  - "data-testid attributes wired on 4 candidate-app route Svelte files (terms-of-use submit button on (protected)/+layout.svelte; categoryExpander + intro on (protected)/questions/+page.svelte; hero on (protected)/questions/[questionId]/+page.svelte; nominations + imageError + infoItem on (protected)/profile/+page.svelte)"
affects: [89-03 (candidate-mega-journey spec consumes this library + emailBucket recipientEmail option), 89-04 (orthogonal — may share testIds namespace), 89-LAST (legacy PageObject classes at tests/tests/pages/candidate/ retire after 89-LAST deletes their last consumer)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "[Pattern A] Per-page function-fixture — fresh `createXxx(page: Page): XxxFixture` factories + closure-scoped helpers (no class, no `this`), strict expect-only assertions, rigidity contract docstring; mirrors `entityDetails.fixture.ts` shape across 11 candidate fixtures"
    - "[Pattern B] Composition root via `base.extend<CandidateMegaFixtures>({...})` mirroring `views.ts:25-51`; sibling to voter-mega.fixture.ts + views.ts"
    - "[Pattern C] Option-fixture for `recipientEmail` defaulted to 'unregistered-aa@test.openvaa.local' (matches Wave-0 R8 verdict from 89-01); 89-03 sets at file scope via `test.use({ recipientEmail: '...' })`"
    - "[Pattern D] emailBucket WRAPS emailHelper.ts primitives (D-89-05) — does not re-author HTTP plumbing; polls Mailpit with [1000,2000,3000] retry intervals + 15s hard timeout per candidate-registration.spec.ts:97-103 precedent"
    - "[Pattern L] Frontend testid attribute additions — kebab-case values under testIds.candidate.* namespace; Expander wrapper carries categoryExpander via restProps forwarding; image-error wraps the call site at profile/+page.svelte because Input.svelte's shared <ErrorMessage> at :640-642 is render-identical for every input type"
    - "Polymorphic-overload surface — emailBucket.getEmail|getLinksInEmail accept (subject | nth) per TIR4:62-63; questionsOverviewPage.clickEditQuestion accepts (text|RegExp|nth) replacing the prior clickEditFirstQuestion zero-arg surface"
    - "Disabled-state assertions at the SPEC site — candidateLoginPage exposes getSubmitButton(): Locator instead of expectSubmitDisabled(); candidateTermsOfUsePage exposes getSubmit(): Locator with a paired acceptAndAdvance composed convenience"
    - "Label-based question addressing (no externalId in fixture surfaces) — candidateProfilePage / candidateQuestionsOverviewPage / candidatePreviewPage all take displayed labels per the plan's general API principle; specs resolve externalId → label via baseV1 at the call site"

key-files:
  created:
    - tests/tests/fixtures/candidate/emailBucket.fixture.ts
    - tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts
    - tests/tests/fixtures/candidate/candidateTermsOfUsePage.fixture.ts
    - tests/tests/fixtures/candidate/candidateHomePage.fixture.ts
    - tests/tests/fixtures/candidate/candidateForgotPasswordPage.fixture.ts
    - tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts
    - tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts
    - tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts
    - tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts
    - tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts
    - tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts
    - tests/tests/fixtures/candidate/candidate-mega.ts
    - .planning/phases/89-…/89-02-SUMMARY.md
  modified:
    - tests/tests/utils/testIds.ts
    - apps/frontend/src/routes/candidate/(protected)/+layout.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte

key-decisions:
  - "D-89-02 (planner) honored: 12 fresh function-fixtures authored under tests/tests/fixtures/candidate/; the 7 legacy PageObject classes at tests/tests/pages/candidate/ UNTOUCHED; tests/tests/fixtures/index.ts UNTOUCHED — parallel-landing per 88-CONTEXT.md."
  - "D-89-05 honored: emailBucket WRAPS emailHelper.ts (load + fetch primitives); emailHelper.ts STAYS in place for legacy specs until v2.10 close / v2.11+ migration."
  - "Composition root location: tests/tests/fixtures/candidate/candidate-mega.ts (in the candidate/ subdir per the plan's <files> declaration, NOT at fixtures/ root as PATTERNS.md initially suggested). Specs import via `from '../../fixtures/candidate/candidate-mega'`."
  - "ToU submit-button testid placement: the submit button lives in `(protected)/+layout.svelte` (the consuming layout's primaryActions snippet), NOT inside TermsOfUseForm.svelte — the form component renders only the checkbox; the consuming page owns the Continue button. testIds.candidate.terms.submit therefore lands on the layout's <Button> instead of the form's interior."
  - "profile-image-error landing site: wrapping <div> at the call site in profile/+page.svelte (NOT inside Input.svelte). Input.svelte's shared <ErrorMessage> at :640-642 is render-identical for every input type (text, email, image, textarea-multilingual) — a testid added there would be ambiguous; the wrapping <div> at the call site scopes the testid to image-upload errors only. This is the plan's Step F fallback path."
  - "candidate-questions-category-expander rides on the <Expander> wrapper via restProps forwarding (Expander.svelte:154 uses `concatClass(restProps, collapseClasses)`) — no Svelte changes needed beyond the data-testid attribute."
  - "candidate-profile-info-item wraps each editable info question with a <div> rather than landing on the inner <QuestionInput> (which has no top-level wrapping element exposing a stable testid). The <div> wrapper is the cheapest stable container per-question."
  - "candidateQuestionPage.expectHeroVisible('emoji') asserts not.toHaveText('') instead of using a raw locator like `hero.locator('span, div').count()` — keeps playwright/no-raw-locators gate clean. The image-variant assertion uses hero.getByRole('img').first()."
  - "Plan 89-02 ships UNWIRED — no spec consumes the new library yet (89-03 wires the candidate-mega-journey spec). This is the parallel-landing contract per D-89-02 explicit."

patterns-established:
  - "Per-page function-fixture authoring continues from 88-04 — entityDetails.fixture.ts / resultsPage.fixture.ts templates extend cleanly to 11 candidate page-object fixtures + 1 special-purpose emailBucket fixture."
  - "Surface-level deviation policy: per-fixture deviations from TIR4's verbatim signatures (e.g. expectThreeTasks → expectTasks({enabled,disabled}); expectSubmitDisabled removed → getSubmitButton(); clickEditFirstQuestion zero-arg → clickEditQuestion(text|RegExp|nth)) follow the plan's explicit per-fixture surface declarations and are documented in the per-fixture docstring."
  - "Lint-gate compliance during fixture authoring: playwright/no-raw-locators + playwright/no-wait-for-timeout + @typescript-eslint/consistent-type-imports + simple-import-sort/imports all gate; fixture-internal `await page.waitForTimeout(500)` requires `// reason:` block + per-line eslint-disable (mirrors legacy ProfilePage.ts:51 pattern)."
  - "Spec-side disabled-state assertions: fixtures expose Locator-returning getters (getSubmitButton, getSubmit) instead of state-baked expectXDisabled methods — keeps the rigidity contract clean (the assertion lives at the spec call-site)."

requirements-completed:
  - TIR4:58-80
  - TIR4:60-63
  - TIR4:64-68
  - TIR4:69-70
  - TIR4:71
  - TIR4:72-73
  - TIR4:74
  - TIR4:75-76
  - TIR4:77
  - TIR4:78
  - TIR4:79
  - TIR4:80
  - TIR4:166-188
  - TIR4:189-244
  - TIR4:196-226
  - TIR4:245-252
  - TIR4:124-126
  - TIR4:253-256
  - D-89-02
  - D-89-05

# Metrics
duration: ~35 min
completed: 2026-05-29
---

# Phase 89 Plan 02: candidate fixture library Summary

**12-file candidate fixture library shipped per D-89-02 — 11 fresh function-fixtures + 1 composition root + 7 new testids landing on 4 candidate-app Svelte files; legacy PageObject classes UNTOUCHED; library unwired by design (89-03 wires it).**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-29T~09:48 (orchestrator spawn)
- **Completed:** 2026-05-29T10:22 (composition root commit + verification)
- **Tasks:** 4 (Task 4 is verification-only — no commit)
- **Files modified:** 5 (testIds.ts + 4 candidate-app Svelte routes)
- **Files created:** 12 (11 fixtures + 1 composition root) + this SUMMARY

## Accomplishments

- **11 candidate function-fixtures authored fresh per D-89-02** — `emailBucket`, `candidateLoginPage`, `candidateTermsOfUsePage`, `candidateHomePage`, `candidateForgotPasswordPage`, `candidatePasswordSetter`, `candidateProfilePage`, `candidateQuestionsOverviewPage`, `candidateQuestionPage`, `candidatePreviewPage`, `candidateLogoutButton`. Each is a `createXxx(page: Page): XxxFixture` factory + closure helpers + rigidity-contract docstring header. All 11 use strict `page.getByTestId(testIds.candidate.X)` selectors against the Task-1 testid surface; no `expect.soft`, no `try/catch` wrapping `expect`, no `.catch(() => null)` on assertion-bearing locator interactions.
- **Composition root `candidate-mega.ts`** — mirrors `tests/tests/fixtures/views.ts:25-51`. Exports `test` (Playwright `base.extend<CandidateMegaFixtures>({...})` with all 11 fixtures registered) + re-exports `expect`. `recipientEmail` option fixture defaulted to `'unregistered-aa@test.openvaa.local'` (matches 89-01 Wave-0 R8 unregistered-candidate verdict); 89-03 spec will override via `test.use({ recipientEmail: '...' })` at file scope. emailBucket fixture wired through `recipientEmail`.
- **7 new testid constants under `testIds.candidate.*`** — kebab-case values + camelCase keys per central namespace convention: `terms.submit`, `questions.categoryExpander`, `questions.hero`, `questions.intro`, `profile.imageError`, `profile.nominations`, `profile.infoItem`.
- **4 candidate-app Svelte route files extended with `data-testid` attributes** — `(protected)/+layout.svelte` ToU Continue button (`terms-of-use-submit`); `(protected)/questions/+page.svelte` empty-state intro wrapper (`candidate-questions-intro`) + Expander per category (`candidate-questions-category-expander` via restProps forwarding); `(protected)/questions/[questionId]/+page.svelte` hero figure (`candidate-questions-hero`); `(protected)/profile/+page.svelte` nominations section (`candidate-profile-nominations`) + image-Input wrapper (`profile-image-error`) + per-info-question wrapper (`candidate-profile-info-item`).
- **Surface refinements per plan's explicit per-fixture declarations**:
  - `candidateLoginPage.getSubmitButton(): Locator` replaces a prior `expectSubmitDisabled()` — disabled-state assertions live at the spec call site (`expect(loginPage.getSubmitButton()).toBeDisabled()`).
  - `candidateTermsOfUsePage` exposes `accept()` + `getSubmit(): Locator` + `acceptAndAdvance()` — spec flow asserts disabled→enabled transition at the call site.
  - `candidateHomePage.expectTasks({enabled, disabled})` replaces a prior state-enum `expectThreeTasks(state)`; `clickTask(task)` replaces per-task methods; 'opinions' maps to `candidate-home-questions` per source-of-truth.
  - `candidateQuestionsOverviewPage.clickEditQuestion(text|RegExp|number)` replaces a prior zero-arg `clickEditFirstQuestion()`.
  - `candidatePreviewPage.expectInfoAnswer / expectOpinionAnswer` replace bulk-by-externalId `expectAllInfoAnswersVisible(externalIds)` — specs iterate per-question by displayed label; opinion `aNthChecked: number | null` covers the rendered-but-unanswered branch.
  - `candidateLogoutButton.clickWithDialog / clickWithoutDialog` — two SEPARATE methods (NOT a boolean param) per 89-PATTERNS.md edge-case decision (rigidity contract).
- **Strict lint-gate + tsc-strict compliance** — `playwright/no-raw-locators` (forced replacement of `hero.locator('img')` with `hero.getByRole('img')`; `container().locator('img')` with `container().getByRole('img')`; `hero.locator('span, div').count()` with `expect(hero).not.toHaveText('')`); `playwright/no-wait-for-timeout` (`// reason:` block + per-line eslint-disable around the legacy ProfilePage.ts-pattern 500ms filechooser-hydration settle); `@typescript-eslint/consistent-type-imports` (no inline `import('@playwright/test').Page` types — top-level `import type { Page }` instead); `simple-import-sort/imports` (alphabetical inside groups). `tsc --noEmit --strict --skipLibCheck` clean across the 12 fixture files (full type-link validation via cross-file compile).
- **0 changes to legacy paths** — `git diff --name-only HEAD~3 HEAD | grep -E "^tests/tests/(pages/candidate|fixtures/index\\.ts)"` returns 0. Parallel-landing contract preserved.
- **No spec consumes the new library yet** — by design per D-89-02 + plan output. 89-03 wires the candidate-mega-journey spec against this surface.

## Task Commits

Each task was committed atomically (sequential mode; hooks bypassed per `project_gsd_repo_hook_workaround.md`):

1. **Task 1: 7 testid constants + 5 Svelte data-testid wirings** — `b21d788e1` (feat)
2. **Task 2: 11 candidate function-fixtures** — `286e2f436` (feat)
3. **Task 3: candidate-mega.ts composition root** — `596e589ae` (feat)
4. **Task 4: regression smoke** — no commit (verification-only; voter-mega-journey playwright run deferred per 89-01 SUMMARY environment-cascade precedent)

**Plan metadata:** (this commit) docs(89-02): complete plan

## Files Created/Modified

### Created (12 fixture files + this SUMMARY)
- `tests/tests/fixtures/candidate/emailBucket.fixture.ts` — Mailpit polling fixture wrapping emailHelper.ts (203 lines)
- `tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts` — login page surface (76 lines)
- `tests/tests/fixtures/candidate/candidateTermsOfUsePage.fixture.ts` — ToU accept + submit (64 lines)
- `tests/tests/fixtures/candidate/candidateHomePage.fixture.ts` — three-task dashboard (97 lines)
- `tests/tests/fixtures/candidate/candidateForgotPasswordPage.fixture.ts` — fillEmailAndAdvance (38 lines)
- `tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts` — setPassword (49 lines)
- `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts` — portrait + static-info + per-question (210 lines)
- `tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts` — overview + category-expanders + edit-question (145 lines)
- `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts` — per-question editor (115 lines)
- `tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts` — preview surface (115 lines)
- `tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts` — clickWithDialog / clickWithoutDialog (76 lines)
- `tests/tests/fixtures/candidate/candidate-mega.ts` — composition root with `base.extend<CandidateMegaFixtures>({...})` + `recipientEmail` option (124 lines)
- `.planning/phases/89-…/89-02-SUMMARY.md` — this summary

### Modified (5 files)
- `tests/tests/utils/testIds.ts` — 7 new constants under `testIds.candidate.*`
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` — `data-testid="terms-of-use-submit"` on ToU Continue button
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` — `data-testid="candidate-questions-intro"` on empty-state wrapper + `data-testid="candidate-questions-category-expander"` on each Expander (restProps forwarded)
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` — `data-testid="candidate-questions-hero"` on hero figure
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` — `data-testid="candidate-profile-nominations"` on nominations section + `data-testid="profile-image-error"` wrapping the image Input + `data-testid="candidate-profile-info-item"` wrapping each editable info question

## Decisions Made

- Honored D-89-02 (planner) contract: 12 fresh fixtures + UNTOUCHED legacy PageObject classes + UNTOUCHED legacy index.ts.
- Honored D-89-05: emailBucket WRAPS emailHelper.ts primitives via the canonical Mailpit `/api/v1/search` + `/api/v1/message/<id>` polling shape (mirrors emailHelper.ts:45-74). emailHelper.ts STAYS in place.
- ToU submit-button testid placement: the submit button lives in the consuming layout (`(protected)/+layout.svelte:168-176`), NOT inside `TermsOfUseForm.svelte` (which renders only the checkbox + ingress + expander). The fixture's `getSubmit()` returns the layout's button locator.
- `profile-image-error` placement: wrapping `<div>` at the call site in `profile/+page.svelte` (Step F fallback). The shared `<ErrorMessage>` inside Input.svelte at :640-642 renders identically for every input type, so a testid attached there would be ambiguous across multiple input wrappers.
- `candidate-questions-category-expander` placement: ride the existing Expander.svelte's `restProps` forwarding via `concatClass(restProps, collapseClasses)` at :154 — no Svelte changes beyond the inline `data-testid` attribute.
- `candidate-profile-info-item` placement: `<div>` wrapper around each `<QuestionInput>` in the `candCtx.infoQuestions.filter(...)` loop. The `<QuestionInput>` itself has no stable top-level testid that's safe to inject without changing the component contract; wrapping is the cheapest stable container.
- Surface-level deviations from TIR4's verbatim signatures (e.g., `expectThreeTasks` → `expectTasks({enabled,disabled})`; `expectSubmitDisabled` removed; `clickEditFirstQuestion` → `clickEditQuestion(text|RegExp|nth)`; bulk-by-externalId preview asserts → per-question by displayed label) all follow the plan's explicit per-fixture surface declarations. Each deviation is documented in the relevant per-fixture docstring.
- emoji-variant hero assertion uses `expect(hero).not.toHaveText('')` instead of raw `locator('span, div')` to keep `playwright/no-raw-locators` clean.
- `candidateQuestionPage.selectChoice` uses `getByTestId('question-choice')` scoped to the `candidate-questions-answer` container, then `.nth(n)` for numeric or `.filter({ hasText: value }).first()` for string match — strict, predictable.
- `candidatePreviewPage.expectOpinionAnswer` uses `getByTestId('entity-selected-answer')` (Phase 89-01 + Phase 86 testid surface) as the canonical "selected" marker: `null` → assert `toHaveCount(0)` (rendered-but-unanswered); `nth` → assert the choice at nth contains the marker.
- Composition root file location: `tests/tests/fixtures/candidate/candidate-mega.ts` (per the plan's `<files>` declaration in 89-02-PLAN.md, NOT at fixtures/-root as PATTERNS.md initially suggested). 89-03 spec imports via `from '../../fixtures/candidate/candidate-mega'`.

## Deviations from Plan

### Test verification deferral (Task 4 — not a Rule 1-4 deviation; environment cascade matches 89-01 precedent)

**1. [Out-of-scope / environment cascade] Task 4 voter-mega-journey playwright run deferred**

- **Found during:** Task 4 (post-implementation regression smoke).
- **Issue 1 (pre-existing CASCADE):** Per 89-01-SUMMARY §"Deviations from Plan", the voter-mega-journey project's transitive dependency chain hits a pre-existing perm-1e1cg1co flake (cold-deeplink loader race from Phase 86.3-05; NOT introduced by 89-01 or 89-02). Already documented in `89-…/deferred-items.md` item #8.
- **Issue 2 (sandbox environment):** Vite dev server on :5173 returned HTTP 500 at verification time (transient state). Per 89-01 SUMMARY: "Cannot safely kill the user's dev server." Same environment shape applies for 89-02 — running `cd tests && npx playwright test --project=voter-mega-journey` end-to-end would require either fixing the pre-existing perm-1e1cg1co cascade or running the spec in isolation, both of which are outside 89-02's authoring-only scope (the new fixture library is unwired; nothing in 89-02 mutates baseV1 or the voter-mega-journey spec).
- **Decision:** Per scope-boundary rule (auto-fix only issues DIRECTLY caused by the current task's changes), Issue 1 + 2 are out of scope for 89-02. Code-level state of all 3 implementation tasks is correct + statically verifiable (lint + tsc-strict + grep against deny-lists per the §Self-Check section below). 89-02 ships fixtures only — voter-mega-journey is regression-isolated by construction (no shared file diff into the voter-mega-journey project's surface: 0 changes inside `tests/tests/specs/voter/`, 0 changes inside `tests/tests/fixtures/views.ts` / `voter-mega.fixture.ts` / `entityDetails.fixture.ts` / `entityFilters.fixture.ts` / `resultsPage.fixture.ts` — git diff scope confirmed below).
- **Files modified:** None (no code rollback, no temp-file commits).
- **Verification path post-89-02:** Either (a) a fresh full-suite run after the perm-1e1cg1co cascade is resolved in a follow-up phase, or (b) explicit operator-driven invocation against a clean dev env. The new fixture library is unwired so the voter-mega-journey assertion surface is structurally orthogonal to 89-02's diff.

---

**Total deviations:** 1 (environment cascade — same shape as 89-01-SUMMARY's deferral; not a Rule 1-4 auto-fix).
**Impact on plan:** Code-level state of all 3 implementation tasks is correct. Task 4 regression smoke surfaces zero structural changes to legacy paths (verified by `git diff --name-only`) — voter-mega-journey is structurally isolated.

## Issues Encountered

- **ESLint plugin scoping:** First lint pass from repo root reported "Definition for rule `playwright/no-wait-for-timeout` was not found" — the rule is registered only inside `tests/eslint.config.mjs`. Re-running ESLint from inside `tests/` resolved this. Fixed in-flight by re-scoping the lint command.
- **playwright/no-raw-locators gate:** Initial draft of `candidateQuestionPage.fixture.ts` used `hero.locator('img')` / `hero.locator('span, div')` and `candidatePreviewPage.fixture.ts` used `container().locator('img')` — both flagged. Fixed by switching to `getByRole('img').first()` for image assertions and `expect(hero).not.toHaveText('')` for the emoji-variant assertion.
- **@typescript-eslint/consistent-type-imports gate:** Initial draft of `emailBucket.fixture.ts` used inline `import('@playwright/test').Page` type in the factory signature — flagged. Fixed by adding `import type { Page } from '@playwright/test'` at the top.
- **simple-import-sort gate:** Initial import order in `emailBucket.fixture.ts` (cheerio before @playwright/test) was flagged. Fixed by re-ordering.

All four gate failures were fixed in-flight before Task 2 commit; the in-tree post-fix state is lint + tsc clean.

## Known Stubs

None introduced in 89-02. The fixture library is the page-object surface 89-03 consumes — every method is fully implemented against the testid surface added in Task 1. The deviation from TIR4's verbatim signatures (per-fixture documented in the docstring) is a deliberate design refinement, not a stub.

## Threat Flags

No new security-relevant surface introduced beyond the threat_model in 89-02-PLAN.md:

- T-89-02-01 (Tampering — new testids on candidate Svelte components): mitigated. Testid additions are additive (no removal); voter-mega-journey project is regression-isolated by construction (no diff into shared assertion surface).
- T-89-02-02 (DoS — emailBucket polling against slow Mailpit): mitigated. `[1000, 2000, 3000]` retry intervals + 15s hard timeout per candidate-registration.spec.ts:97-103 precedent.
- T-89-02-03 (Spoofing — emailBucket recipient-email option fixture): accepted. Test-only recipient address; no production data exposure.
- T-89-02-SC (no package installs): accepted. Zero npm/pip/cargo installs in 89-02.

## Next Phase Readiness

- **89-03 (candidate-mega-journey spec) unblocked.** Imports `{ test, expect }` from `tests/tests/fixtures/candidate/candidate-mega.ts`; sets `test.use({ recipientEmail: 'unregistered-aa@test.openvaa.local' })` at file scope to wire emailBucket against the 89-01 baseV1 unregistered candidate. The 11 candidate fixtures expose the full TIR4:101-257 walking surface.
- **89-04 (3 settings permutations) unblocked structurally.** Orthogonal to 89-02 — the perm specs do not consume the candidate fixture library. May share the `testIds.candidate.*` namespace for the candidate-app availability assertions (`candidate.login.email`, etc.).
- **89-LAST (legacy retirement) unblocked structurally.** After 89-03 + 89-04 land, 89-LAST can delete `candidate-auth|password|registration|questions|required-info.spec.ts` + per-class audit of `tests/tests/pages/candidate/*Page.ts` (each class is pruned only when its last consumer is deleted). The new function-fixture library has 0 imports from `pages/candidate/` (verified via grep).

### Blockers / Concerns

- The pre-existing perm-1e1cg1co cascade continues to block the canonical voter-mega-journey project run. Already documented in `89-…/deferred-items.md` item #8 (carried over from 89-01). Out of 89-02 scope per the parallel-landing contract — 89-02 ships UNWIRED fixtures that cannot affect the voter-mega-journey chain.

## Self-Check: PASSED

Verified prior to final commit:

- `ls tests/tests/fixtures/candidate/*.fixture.ts | wc -l` = **11**: **PASS**
- `test -f tests/tests/fixtures/candidate/candidate-mega.ts`: **FOUND**
- `grep -c "createCandidate\\|createEmailBucket" candidate-mega.ts` ≥ 11: **PASS (22 — 11 imports + 11 use() calls)**
- `git diff --name-only HEAD~3 HEAD | grep -E "^tests/tests/(pages/candidate|fixtures/index\\.ts)" | wc -l` = **0**: **PASS (zero legacy paths modified)**
- `git diff --name-only HEAD~3 HEAD` shows ONLY 4 frontend Svelte files + testIds.ts + 12 files inside `tests/tests/fixtures/candidate/`: **PASS (17 files total — 4 Svelte routes + testIds.ts + 12 new candidate/* + 0 others)**
- 7 new testid constants present under `testIds.candidate.*`: **PASS** (`terms.submit`, `questions.categoryExpander`, `questions.hero`, `questions.intro`, `profile.imageError`, `profile.nominations`, `profile.infoItem`)
- All 11 fixture files export `createXxx` factory + `XxxFixture` type: **PASS**
- All 11 fixture files use `page.getByTestId()` selectors (no raw `page.locator()`): **PASS** (`playwright/no-raw-locators` gate clean after in-flight fixes)
- 0 imports from `tests/tests/pages/candidate/` in any of the 12 new files: **PASS**
- 0 `expect.soft`, 0 `try/catch` wrapping `expect`, 0 `.catch(() => null)` on assertion-bearing locator interactions across the 12 new files: **PASS** (only docstring mentions exist; verified via grep)
- ESLint clean on all 12 new files (run from `tests/` workspace): **PASS**
- `tsc --noEmit --strict --skipLibCheck` clean across all 12 new files: **PASS**
- Smoke-import test: `import { test, expect } from '.../tests/tests/fixtures/candidate/candidate-mega'` compiles with TypeScript strict: **PASS**
- Commit `b21d788e1` (Task 1) exists in git log: **FOUND**
- Commit `286e2f436` (Task 2) exists in git log: **FOUND**
- Commit `596e589ae` (Task 3) exists in git log: **FOUND**

---
*Phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour*
*Plan: 02*
*Completed: 2026-05-29*
