# Phase 89: Continuing test refactoring — implement the new candidate journey - Research

**Researched:** 2026-05-29
**Domain:** Playwright E2E test refactoring (candidate app); dev-seed template mutation; settings permutations
**Confidence:** HIGH (architectural patterns), MEDIUM (specific testid-additions catalogue — some inferred from spec walkthrough; verify-as-you-implement)

## Summary

Phase 89 applies the Phase 88 mega-journey + parallel-landing + strict-fixtures pattern to the candidate app, partitioned into 5 plans:

1. **89-01** — mutate `baseV1.ts` in place (hero on Q1/Q2/QG-base; info on Q1; unregistered candidate w/ "999" symbol; required `test-qu-info-text`; 3 filtered info questions municipal/north/south) + extend `voter-mega-journey.spec.ts` with hero/info-button/narrowed-candidate-details assertions
2. **89-02** — 12 function-fixtures under `tests/tests/fixtures/candidate/` + a new `candidate-mega.ts` composition root sibling to `views.ts`/`voter-mega.fixture.ts`
3. **89-03** — `candidate-mega-journey.spec.ts` (single serial test, 19 test.step blocks mirroring TIR4:101-257), `candidate-mega.setup.ts`/`candidate-mega.teardown.ts` reusing `baseV1` template + `setupFromTemplate` helper, new playwright project chain `data-setup-candidate-mega → candidate-mega-journey → data-teardown-candidate-mega`
4. **89-04** — 3 new perm templates (`perm-disable-voter-app`, `perm-disable-candidate-app`, `perm-per-app-notifications`) + setups/teardowns/specs + 9 new playwright project entries, each with distinct `externalIdPrefix` (`'e2e-perm-novapp-'`, `'e2e-perm-nocand-'`, `'e2e-perm-notif-'`)
5. **89-LAST** — delete 5 absorbed specs + excise 7.1.2/3/4 from `candidate-settings.spec.ts` + audit & prune unused legacy PageObject classes + remove defunct `testIgnore` entries (gated by `PLAYWRIGHT_LEGACY=1` block at `tests/playwright.config.ts:97-538`)

**Primary recommendation:** Author 89-02 BEFORE 89-03 (testid-additions surface during fixture authoring; spec is a thin consumer). Land all 89-02 testid additions in a single commit per file (Phase 88-04 precedent: 12 testids across 9 frontend files in one commit `ccac7691a`). Keep `emailHelper.ts` UNTOUCHED; `emailBucket` wraps it.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-89-01: Mutate baseV1 in place; do NOT fork to baseV2.** All TIR4 dataset additions land directly on `packages/dev-seed/src/templates/baseV1.ts`. Voter mega-journey absorbs new assertions in the SAME plan (89-01). Side-effect drift on `e2e.test.ts:431` is surfaced as deferred-item, NOT fixed in 89-01.
- **D-89-02: Function-fixtures, fresh, for ALL 12 candidate page-objects.** New composition root sibling to `voter-mega.fixture.ts`. Legacy 7 PageObject classes at `tests/tests/pages/candidate/` stay UNTOUCHED through 89-01..89-04. CamelCase naming (`candidateLoginPage`).
- **D-89-03: Five plans** as proposed. 89-04 parallel-safe with 89-02/89-03 via per-template `externalIdPrefix` decoupling. Existing tests stay green throughout 89-01..89-04.
- **D-89-04: Delete fully-absorbed specs; keep deferred-only specs** in 89-LAST. Cuts:
  - `tests/tests/specs/candidate/candidate-auth.spec.ts` — full delete
  - `tests/tests/specs/candidate/candidate-password.spec.ts` — full delete
  - `tests/tests/specs/candidate/candidate-registration.spec.ts` — full delete
  - `tests/tests/specs/candidate/candidate-questions.spec.ts` — full delete
  - `tests/tests/specs/candidate/candidate-required-info.spec.ts` — full delete
  - `tests/tests/specs/candidate/candidate-settings.spec.ts` — excise 7.1.2/3/4 only; KEEP 7.1.1, 7.1.7, 7.1.8, 7.1.10-17 (TIR5-deferred)
  - `tests/tests/pages/candidate/*Page.ts` — prune ONLY classes with zero remaining consumers (planner audits per class)
  KEEPS: `candidate-profile.spec.ts`, `candidate-profile-validation.spec.ts`, `candidate-translation.spec.ts`, `candidate-bank-auth.spec.ts`, `candidate-settings.spec.ts` residual.
- **D-89-05: emailBucket as new function-fixture; emailHelper.ts coexists long-term.** Retirement of `emailHelper.ts` deferred to end-of-milestone (v2.10 close or v2.11+).

### Claude's Discretion

- Exact filenames and playwright-project names for the new candidate fixture composition root, the candidate-mega spec, the 3 perm templates/setups/teardowns/specs, the 3 perm playwright-project triples.
- Whether the candidate-mega spec is one `test()` block or one `test.describe('...', { mode: 'serial' })` with N sub-tests.
- Wiring strategy for the new function-fixtures (separate composition root file vs. extension of `views.ts`).
- Internal implementation of `emailBucket` (wrap `emailHelper.ts` or stand-alone).
- Exact testid additions to existing candidate-app Svelte components.
- Whether 88-04's v2.11+ `QuestionInCardContent` follow-up should be re-surfaced during 89-01 baseV1 mutations.

### Deferred Ideas (OUT OF SCOPE)

All TIR5 "STILL TO BE ADDED LATER" items: localisation, hero video, extended question info, a11y, visual drift, performance, 7.1.1 (read-only), 3.3.1 (candidate translation), 4.2.5-7 (A11Y-02 persistence), 5.1.1-6 (A11Y-01 validation matrix), 7.1.7/8 (hideHero), 7.1.10/11/13-17 (SETTINGS-01 wave A), 27.1.1 (variant-allowopen), 28.1.1-3 (voter-allowopen), 34.* (visual), 35.* (perf), 36.* (a11y), 37.1.1-6 (bank-auth). Plus: emailHelper.ts retirement, 88-04 `QuestionInCardContent` election-specificity TODO, `e2e.test.ts:431` row-count drift, legacy candidate PageObject classes (pruned only when their last consumer is deleted).

## Phase Requirements

Phase 89 has NO direct numbered requirement (`PHASE-XX`) entry in `.planning/REQUIREMENTS.md`. The milestone REQUIREMENTS scope is v2.10 DETERM-04/05/06/07 + A11Y-04/05/06/07 — all already closed. Phase 89 is a v2.10 catalog-audit continuation (Phase 88 → Phase 89), with its authoritative spec being `./TEST-INVENTORY-REFACTOR-4.md` (~257 lines). The phase requirement ID list, for planner-VALIDATION mapping, is effectively the TIR4 line ranges:

| ID | Description | Research Support |
|----|-------------|------------------|
| TIR4-DATA-01 | baseV1: hero emoji Q1 + hero image Q2 + hero image QG-base (TIR4:17-20) | §"Plan 89-01" — `customData.hero` shape on `questions.fixed[]` + `question_categories.fixed[]` |
| TIR4-DATA-02 | baseV1: info content on Q1 fanned across locales (TIR4:21) | §"Plan 89-01" — `info` field on `test-qu-opin-base-1-likert5` |
| TIR4-DATA-03 | baseV1: unregistered candidate w/ party AA + north-const nomination + symbol "999" (TIR4:86-90) | §"Plan 89-01" — candidate row WITHOUT `terms_of_use_accepted` + email field |
| TIR4-DATA-04 | baseV1: `test-qu-info-text` required (TIR4:92) | §"Plan 89-01" — flip `required: false → true` at baseV1.ts:645 |
| TIR4-DATA-05 | baseV1: 3 filtered info questions (mun-only, north-only, south-only) (TIR4:94-99) | §"Plan 89-01" — `_constituencies`/`_elections` sentinels on new question rows |
| TIR4-VOTER-01 | Voter-mega: hero visible Q1/Q2/category (TIR4:25-32) | §"Plan 89-01" — new test.step in voter-mega spec |
| TIR4-VOTER-02 | Voter-mega: Info button on Q1 only (TIR4:30) | §"Plan 89-01" — assert QuestionBasicInfo Expander presence |
| TIR4-VOTER-03 | Voter-mega: candidate-details narrowed to north-only info Q (TIR4:99) | §"Plan 89-01" — patch existing matrix step |
| TIR4-PERM-01 | Perm: voterApp disabled → /,/elections unavailable; /candidate available (TIR4:36-42) | §"Plan 89-04" |
| TIR4-PERM-02 | Perm: candidateApp disabled → /candidate unavailable; /,/elections available (TIR4:44-50) | §"Plan 89-04" |
| TIR4-PERM-03 | Perm: per-app notifications visible on own route only (TIR4:51-54) | §"Plan 89-04" |
| TIR4-CAND-01..16 | Candidate-mega 16 step blocks (TIR4:107-256) | §"Plan 89-03" — step-by-step breakdown |
| TIR4-RETIRE-01 | 89-LAST — delete absorbed specs + excise 7.1.2/3/4 + prune PageObjects | §"Plan 89-LAST" |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| baseV1 dataset mutations | Data layer (dev-seed) | — | All template authoring lives in `packages/dev-seed/src/templates/` |
| `customData.hero` rendering | Frontend (Svelte UI) | Data layer (dev-seed schema) | `Hero.svelte` reads `content` prop; dev-seed `custom_data` JSONB column carries the payload |
| Voter-mega journey hero assertions | E2E test layer | — | Pure Playwright; no frontend/backend changes |
| 12 candidate function-fixtures | E2E test layer (fixtures) | Frontend testid additions | Fixtures define locators; new testids land on Svelte components for strict selectors |
| Candidate-mega journey spec | E2E test layer (specs) | Backend (Supabase admin client) | Spec consumes fixtures + `SupabaseAdminClient.sendEmail` for registration trigger |
| Settings permutations | Data layer (dev-seed perm-* templates) | E2E test layer (perm-* specs) | Each perm is a minimal-data template + a tiny spec |
| Playwright project graph | E2E test layer (`playwright.config.ts`) | — | Sequential vs parallel chains; perm-* chain external_id-decoupled from candidate-mega chain |
| Legacy retirement | E2E test layer (spec/PageObject deletion) | Config (testIgnore cleanup) | Removes files + un-ignores residual testIgnore entries |

---

## Implementation Plan Mapping

### Plan 89-01: baseV1 extensions + voter-mega assertions

**Files to MODIFY:**
- `packages/dev-seed/src/templates/baseV1.ts` (~1750 lines) — mutate in place per D-89-01:
  - **Hero emoji on Q1** at `:716-726` (`test-qu-opin-base-1-likert5`): add `custom_data: { hero: { emoji: '🗳️' } }`. (`HeroContent` is a discriminated union from `@openvaa/app-shared`: `{ emoji: string }` or `{ url: string; type: 'image' }` — see `Hero.svelte:18` `isEmoji`/`isImage` discriminator.)
  - **Hero image on Q2** at `:727-737` (`test-qu-opin-base-2-likert4`): add `custom_data: { hero: { url: '/images/test-hero-q2.svg', type: 'image' } }`. (Use a static asset shipped in the test data; OR a simple data URL. Researcher recommends an actual asset under `apps/frontend/static/images/` for test legibility — but a data URL is simpler and doesn't require new asset files. **Pick during planning.**)
  - **Hero image on QG-Opin-Base** at `:548-554` (`test-qg-opin-base`): add `custom_data: { hero: { url: '/images/test-hero-qg-base.svg', type: 'image' } }`.
  - **Info content on Q1** at `:716-726`: add `info: { en: '[qu-opin-base-1-info] Hero info content for Likert-5 question 1.' }`. (Field name confirmed in `(voters)/(located)/questions/[questionId]/+page.svelte:165` destructure `const { info, text } = question`. `info` is `LocalizedString` per i18n convention — `generateTranslationsForAllLocales: false` means single-locale `{en: ...}` is correct.)
  - **Required test-qu-info-text** at `:640-648`: flip `required: false → true`.
  - **Unregistered candidate** — new row in `candidates.fixed[]` at end of CO-Reg-N block (~`:1037`): `{ external_id: 'test-ca-aa-unregistered', first_name: 'Unregistered', last_name: 'Candidate AA', /* NO terms_of_use_accepted */ /* NO answersByExternalId */ organization: { external_id: 'test-or-aa' }, sort_order: 14, is_generated: false, email: 'unregistered-aa@test.openvaa.local' }`. **Schema note:** `candidates` table likely accepts an `email` field for invite flow seeding; verify against `packages/supabase-types/src/database.ts` at planning time. Without `auth_user_id` set, `SupabaseAdminClient.sendEmail({ candidateExternalId, email })` falls into the `inviteUserByEmail` branch (`supabaseAdminClient.ts:450-486`) which is exactly what registration tests need. NO `terms_of_use_accepted` → ToU gate fires post-registration.
  - **New nomination** for unregistered candidate at end of EL-Reg/CO-Reg-N nominations block (~`:1300s`): `{ external_id: 'test-nom-reg-n-ca-aa-unregistered', election_symbol: '999', candidate: { external_id: 'test-ca-aa-unregistered' }, parent_nomination: { external_id: 'test-nom-reg-n-or-aa' }, election: { external_id: 'test-el-reg' }, constituency: { external_id: 'test-co-reg-n' }, election_round: 1 }`.
  - **3 NEW filtered info questions** in `questions.fixed[]` at end of QG-Info block (~`:712`):
    - `test-qu-info-filt-mun-only` — `type: 'text'`, `_elections: { external_id: ['test-el-mun'] }`, category `test-qg-info`
    - `test-qu-info-filt-co-reg-n` — `type: 'text'`, `_constituencies: { external_id: ['test-co-reg-n'] }`, category `test-qg-info`
    - `test-qu-info-filt-co-reg-s` — `type: 'text'`, `_constituencies: { external_id: ['test-co-reg-s'] }`, category `test-qg-info`
    Each carries `sort_order: 9/10/11`. Per TIR4:94 these are "all of the test type" — interpret as `type: 'text'` (the "Text" line in TIR1 question-type catalogue is the simplest). **Confirm during planning** with operator if uncertain.

- `tests/tests/specs/voter/voter-mega-journey.spec.ts` (~991 lines) — add 3 new test.step blocks per TIR4:25-32 + 99:
  - Step: "hero: Q1 emoji visible" — at the first opinion question (Base-1 Likert5), assert `page.locator('[data-testid="voter-questions-hero"]')` contains the emoji `🗳️`. **NEW testid required** (see Testid Additions Catalog).
  - Step: "hero: Q2 image visible" — at second question, assert image hero renders.
  - Step: "hero: category Base intro image" — at the QG-Opin-Base category intro, assert hero image.
  - Step: "info: Q1 has Info button + content visible" — assert `page.getByTestId('voter-questions-info-button')` visible on Q1; click; assert info text rendered.
  - Step: "info: Q2 has NO Info button" — assert `page.getByTestId('voter-questions-info-button')` hidden on Q2.
  - Existing candidate-details matrix step at line ~923 — patch the info-tab assertion to expect ONLY `test-qu-info-filt-co-reg-n` (north-const-scoped) visible (TIR4:99); existing 13-info-items count assertion will need updating to reflect the 3 new info questions filtered to only the north-const one.

**Files to CREATE:** none (89-01 is pure mutation).

**testid additions in 89-01:**
- `voter-questions-hero` on `(voters)/(located)/questions/[questionId]/+page.svelte:170-176` snippet wrapper (the `<figure role="presentation">` element)
- `voter-questions-category-hero` on `(voters)/(located)/questions/category/[categoryId]/+page.svelte:89-90` snippet wrapper
- `voter-questions-info-button` on `QuestionBasicInfo.svelte:30` — the Expander (and/or the QuestionExtendedInfoButton at the `interactiveInfo.enabled` true branch)

**Playwright projects:** no changes to project graph (89-01 is data + spec edits only).

**Acceptance signals:**
- `yarn workspace @openvaa/dev-seed test:unit` — passes (modulo the deferred `:431` count assertion; surface as deferred-item per D-89-01)
- `cd tests && PLAYWRIGHT_LEGACY=1 npx playwright test --project=voter-mega-journey` — 34 of 34 sub-tasks pass cold-start (preserving 88-04 Gate B baseline)
- New voter-mega step assertions are HARD (no expect.soft, no fallbacks) per TIR4:8-12 rigidity
- baseV1 unit-test row-counts: surface BUT do not fix any pre-existing `:431` count drift (`questions.fixed.length` will increase from 25 → 28; 3 new info questions)

---

### Plan 89-02: Candidate fixture library

**Files to CREATE:** (recommended composition root naming follows `voter-mega.fixture.ts` lineage)

- `tests/tests/fixtures/candidate/emailBucket.fixture.ts` — wraps `emailHelper.ts`. Surface (verbatim from TIR4:60-63):
  - `expectEmail(subject: string | RegExp): Promise<void>` — polls Mailpit until ≥1 email with matching subject arrives (timeout 15s, intervals [1000, 2000, 3000] per `candidate-registration.spec.ts:97-103`); hard-fails on timeout.
  - `getEmail(subject: string | RegExp, nth?: number): Promise<MailpitMessage>` — returns the nth matching email (default 0 = newest).
  - `getLinksInEmail(subject: string | RegExp, nth?: number): Promise<Array<string>>` — extracts all `<a href>` via cheerio; multi-link returned.
  - **Implementation:** WRAP `emailHelper.ts` per D-89-05 — call `fetchEmails(email)` + filter by subject, OR add a `fetchEmailsBySubject(email, subjectRegex)` helper. Pattern: each method takes the recipient email at fixture-construction (passed via test parameter; researcher confirms during plan authoring).
- `tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts` — surface per TIR4:64-68: `enterEmail(email)`, `enterPassword(password)`, `submit()`, `login(email, password)`, plus convenience helpers: `expectSubmitDisabled()`, `expectErrorMessage(text?: string | RegExp)`. Locators: `login-email`, `password-field` (PasswordField nested), `login-submit`, `login-errorMessage` (existing testids per `apps/frontend/src/routes/candidate/login/+page.svelte:165/173/184/176`).
- `tests/tests/fixtures/candidate/candidateTermsOfUsePage.fixture.ts` — surface per TIR4:69-70: `acceptAndAdvance()`. Toggles `terms-checkbox` (existing testid per `TermsOfUseForm.svelte:58`) then clicks submit. **NEW testid required** on ToU acceptance/advance button (researcher must locate the actual submit element — currently `terms-checkbox` is the checkbox but the post-acceptance navigation button has no testid).
- `tests/tests/fixtures/candidate/candidateHomePage.fixture.ts` — surface (TIR4:71): inferred from `(protected)/+page.svelte:84-159`: `expectThreeTasks(state: 'profile-active' | 'opinions-enabled' | 'preview-enabled')`, `expectStatusMessage(text?: RegExp)`, `expectCompletedMessage()`, `clickProfile()`, `clickQuestions()`, `clickPreview()`, `clickContinue()`. Locators: `candidate-home-status`, `candidate-home-profile`, `candidate-home-questions`, `candidate-home-preview`, `candidate-home-continue`, `candidate-home-logout`, `candidate-home-tip` (all existing).
- `tests/tests/fixtures/candidate/candidateForgotPasswordPage.fixture.ts` — surface per TIR4:72-73: `fillEmailAndAdvance(email)`. Locators: `forgot-password-email`, `forgot-password-submit`, `forgot-password-success` (existing per `forgot-password/+page.svelte:79/109/93`).
- `tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts` — surface (TIR4:74): `setPassword(password)`. Operates against `register-password` / `register-confirm-password` testids (existing per `register/password/+page.svelte:124-125` via the `PasswordSetter` component's `passwordTestId` prop) + `register-password-submit` (existing).
- `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts` — surface (TIR4:75-76, expanded per TIR4:166-188): `uploadPortrait(file: { path: string; expectError?: 'invalidFile' | 'oversizeFile' })`, `expectStaticInfo(props: { name?: string; nomination?: {...} })` (locked rows at `profile/+page.svelte:206-218/241-259`), `getQuestion(externalIdOrLabel)`, `expectQuestionsVisible(externalIds: Array<string>)`, `expectQuestionsAbsent(externalIds: Array<string>)`, `expectRequiredBadge(externalId)`, `fillQuestion(externalIdOrLabel, value)`, `submit()`, `expectSubmitMessage()` (success/error inline). Locators: `profile-image-upload`, `profile-first-name`, `profile-last-name`, `profile-submit`, `profile-cancel`, `profile-return` (all existing).
- `tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts` — surface (TIR4:77, expanded per TIR4:189-244): `clickStart()` (start button — testid `candidate-questions-start` existing), `expectIntroMessage()`, `expectContinuePrompt()`, `clickContinuePrompt()`, `expectCompletionMessage()`, `getCategoryExpander(name: string | RegExp)` + `clickExpander()` + `expectExpanded(state: boolean)`, `getQuestionCard(externalId)`, `clickEditFirstQuestion()`. Locators: `candidate-questions-list`, `candidate-questions-start`, `candidate-questions-continue`, `candidate-questions-card`, `candidate-questions-home`, `candidate-questions-progress` (all existing).
- `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts` — surface (TIR4:78, per TIR4:196-226): `expectHeroVisible(content: 'emoji' | 'image')`, `expectContinueDisabled()`, `expectContinueEnabled()`, `selectChoice(value: string | number)`, `enterInfo(text: string)`, `clickContinue()`, `expectQuestionText(textOrRegex)`. Locators: `candidate-questions-answer`, `candidate-questions-comment`, `candidate-questions-save`, `candidate-questions-cancel`, `candidate-questions-return` (all existing).
- `tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts` — surface (TIR4:79, expanded per TIR4:245-252): `expectAllInfoAnswersVisible(externalIds: Array<string>)`, `expectPortraitVisible()`, `expectAllOpinionAnswersVisible(externalIds: Array<string>)`, `expectNoVoterComparison()` (assert absence of "You and X disagree"-type strings). Locators: `candidate-preview-container` (existing per `(protected)/preview/+page.svelte:93`); reuses `entityDetails` fixture from `views.ts` internally.
- `tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts` — surface per TIR4:80: `clickWithDialog()` (clicks logout, expects TimedModal dialog, clicks confirm logout in dialog), `clickWithoutDialog()` (clicks logout, expects DIRECT logout — no modal — for the final logout per TIR4:253-256: the modal only appears when there are unanswered questions; when profile is complete the `triggerLogout` function at `LogoutButton.svelte:58-64` calls `logout()` directly without opening the modal).
- `tests/tests/fixtures/candidate/candidate-mega.ts` — composition root sibling to `views.ts`. Pattern (from `views.ts:25-49`):
  ```ts
  import { test as base, expect } from '@playwright/test';
  import { createCandidateLoginPage, ... } from './...';
  type CandidateMegaFixtures = {
    emailBucket: EmailBucketFixture;
    candidateLoginPage: CandidateLoginPageFixture;
    candidateTermsOfUsePage: CandidateTermsOfUsePageFixture;
    candidateHomePage: CandidateHomePageFixture;
    candidateForgotPasswordPage: CandidateForgotPasswordPageFixture;
    candidatePasswordSetter: CandidatePasswordSetterFixture;
    candidateProfilePage: CandidateProfilePageFixture;
    candidateQuestionsOverviewPage: CandidateQuestionsOverviewPageFixture;
    candidateQuestionPage: CandidateQuestionPageFixture;
    candidatePreviewPage: CandidatePreviewPageFixture;
    candidateLogoutButton: CandidateLogoutButtonFixture;
  };
  export const test = base.extend<CandidateMegaFixtures>({ ... });
  export { expect };
  ```
  emailBucket takes `recipientEmail` as an option fixture (Playwright `[default, { option: true }]` pattern per `voter-mega.fixture.ts:43-47`); the candidate-mega-journey spec sets it once at the top.

**Files to MODIFY:** none. Legacy `tests/tests/pages/candidate/*Page.ts` UNTOUCHED. Legacy `tests/tests/fixtures/index.ts` UNTOUCHED. The 12 fixtures + composition root are net-new.

**testid additions in 89-02:** see §"Testid Additions Catalog" below — primarily for surfaces the legacy PageObjects accessed via roles/CSS selectors. Likely targets:
- ToU "accept and advance" button — currently has no testid
- Login form `voter-app-link` testid exists (`login-voter-app-link`) but no parent `<form>` testid
- Profile portrait error message (`invalidFile` / `oversizeFile`) — testid on the `ErrorMessage` rendered by `Input.svelte`
- Disabled-submit state on login — already discoverable via `:disabled` attribute on `login-submit`
- 3 candidate-home task tiles — `candidate-home-profile`/`-questions`/`-preview` exist; researcher confirms disabled-state assertion via `:disabled` attribute
- Questions-overview category Expander testids — currently no per-category testid; the Expander is iterated via `{#each candCtx.questionBlocks.blocks.filter((b) => b.length) as questions}` at `(protected)/questions/+page.svelte:129`. **Add `data-testid="candidate-questions-category-expander"` (un-keyed) so the fixture filters by `hasText: <category-name>` via the `[<id>] desc` heading pattern.**
- Preview-page sub-sections (info, portrait, opinions) — the `<EntityDetails>` component reuses voter testids; researcher confirms `entity-details` testid lands inside the preview-page container.

**Playwright projects:** no changes in 89-02 (fixture library is unwired until 89-03 consumes it).

**Acceptance signals:**
- TypeScript type-check passes: `yarn build` (Turborepo will rebuild affected packages)
- `cd tests && npx playwright test --project=voter-mega-journey` — still passes (proves no regression on the existing fixture surface)
- Smoke-import of `candidate-mega.ts` from a throwaway spec compiles cleanly
- ESLint passes on all new fixture files
- Frontend test ids added in 89-02 follow `testIds.ts` central-namespace convention — add all new testid string constants under `testIds.candidate.*` at `tests/tests/utils/testIds.ts`

---

### Plan 89-03: Candidate mega-journey spec

**Files to CREATE:**
- `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` — single serial spec. **Recommended shape per Claude's Discretion + 88-04 voter-mega precedent:** one `test.describe('candidate mega-journey', { tag: ['@candidate'] }, () => { test.describe.configure({ mode: 'serial' }); test('full candidate journey end-to-end', async ({ ... }) => { ... 19 test.step blocks ... }); });`. The single-test-with-many-steps pattern was used in 88-01/88-04 for `voter-mega-journey.spec.ts:42-47` and survived Gate B 3-run; the per-step rendering in Playwright reporters is just as readable as per-`test`.
- `tests/tests/specs/candidate/candidate-mega-journey.README.md` — pattern documentation per CONTEXT.md canonical-refs §"voter-mega-journey.README.md" (write to match).
- `tests/tests/setup/candidate-mega.setup.ts` — invokes `setupFromTemplate('baseV1', { extraTeardownPrefix: 'e2e-perm-' })` (mirrors `baseV1.setup.ts:19-29`). Per D-89-01 baseV1 is mutated in-place; the candidate-mega chain consumes the SAME template as the voter-mega chain. **Alternative**: reuse `baseV1.setup.ts` directly by adding the new project `candidate-mega-journey` with `dependencies: ['data-setup-baseV1']`. **Recommended:** create a NEW setup file `candidate-mega.setup.ts` (1-line wrapper) because (a) the candidate-mega spec MAY need a candidate auth-state-clearing pre-step that voter-mega doesn't, and (b) project-graph clarity — one setup per project chain. The plan-checker can pick either approach.
- `tests/tests/setup/candidate-mega.teardown.ts` — mirrors `baseV1.teardown.ts:1-29`. Calls `runTeardown('test-', client)`. **CRITICAL:** also calls `await client.unregisterCandidate('unregistered-aa@test.openvaa.local')` to wipe the auth.users entry created during the test's registration step (otherwise re-runs hit "User already exists" — see `forceRegister` rollback rationale at `supabaseAdminClient.ts:316-360`).

**Files to MODIFY:**
- `tests/playwright.config.ts` — append 3 new project entries at the end of the projects array (after `perm-not-located-2e2cg`):
  ```ts
  {
    name: 'data-setup-candidate-mega',
    testMatch: /candidate-mega\.setup\.ts/,
    teardown: 'data-teardown-candidate-mega',
    dependencies: ['voter-mega-journey']  // SEQUENTIAL after voter-mega so the shared 'test-' prefix doesn't collide
  },
  {
    name: 'data-teardown-candidate-mega',
    testMatch: /candidate-mega\.teardown\.ts/
  },
  {
    name: 'candidate-mega-journey',
    testDir: './tests/specs/candidate',
    testMatch: /candidate-mega-journey\.spec\.ts/,
    fullyParallel: false,
    use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },  // start UNAUTHENTICATED — TIR4:107 the spec walks static pages → registration → login
    dependencies: ['data-setup-candidate-mega']
  }
  ```
  **Sequencing rationale:** baseV1 chain (voter-mega) and candidate-mega chain both use `'test-'` prefix; sequential ordering avoids data collisions (88-01 Risk #4 precedent). 88-03 perm-* chain sequenced FIRST → baseV1 → candidate-mega.

**Spec step-by-step shape (mirrors TIR4:101-257):**

| # | Step | Reference |
|---|------|-----------|
| 1 | `static pages: help renders` | TIR4:108 — assert `/candidate/help` reachable when unauthenticated |
| 2 | `static pages: privacy renders` | TIR4:110 — assert `/candidate/privacy` reachable |
| 3 | `registration email sent + link extracted` | TIR4:112-115 — `await client.sendEmail({ candidateExternalId: 'test-ca-aa-unregistered', email, subject: 'Registration', content: '...' })` + `await emailBucket.expectEmail(/Registration/)` + `getLinksInEmail` → `toCallbackUrl(rawLink)` |
| 4 | `complete registration: set password` | TIR4:116-119 — navigate to callback URL; `candidatePasswordSetter.setPassword(PASS_1)` |
| 5 | `complete registration: accept ToU` | TIR4:119-121 — `candidateTermsOfUsePage.acceptAndAdvance()` |
| 6 | `expect candidate home` | TIR4:121 — `candidateHomePage.expectThreeTasks('profile-active')` |
| 7 | `logout from home (with dialog)` | TIR4:123-127 — `candidateLogoutButton.clickWithDialog()` then assert at `/candidate/login`; navigate to `/candidate/profile` → asserts re-redirected to login |
| 8 | `forgot-password + reset via Inbucket` | TIR4:132-141 — `candidateForgotPasswordPage.fillEmailAndAdvance(email)` + `emailBucket.expectEmail(/Reset/)` + follow link → `candidatePasswordSetter.setPassword(PASS_2)` + `candidateTermsOfUsePage.acceptAndAdvance()` (ToU acceptance re-fires after password reset? researcher confirms by running the test) |
| 9 | `login: submit-disabled + wrong-password + new-password` | TIR4:144-152 — `candidateLoginPage.expectSubmitDisabled()` (empty fields); enter email + PASS_1 → `submit()` → `expectErrorMessage(/wrong/i)`; enter PASS_2 → `submit()` → asserts `candidateHomePage` (NOT ToU again) |
| 10 | `return from static pages` | TIR4:154-158 — navigate `/candidate/help`; click return button; asserts `candidateHomePage` |
| 11 | `home: three tasks; profile active` | TIR4:160-164 — re-assert three-task state |
| 12 | `profile: static info visible; filtered info qs absent; required badge` | TIR4:166-171 — `candidateProfilePage.expectStaticInfo({...})` + `expectQuestionsVisible([...info_qs_minus_filtered_municipal_south])` + `expectQuestionsAbsent(['test-qu-info-filt-mun-only', 'test-qu-info-filt-co-reg-s'])` + `expectRequiredBadge('test-qu-info-text')` |
| 13 | `profile: portrait validation + partial fill keeps home` | TIR4:174-181 — `uploadPortrait({path: WRONG_FORMAT, expectError: 'invalidFile'})`; `uploadPortrait({path: OVERSIZE, expectError: 'oversizeFile'})`; `uploadPortrait({path: VALID})`; fill all non-required-non-first info qs; `submit()`; asserts `candidateHomePage.expectThreeTasks('profile-active')` (opinions still disabled) |
| 14 | `profile: full fill advances to questions overview` | TIR4:183-187 — navigate back to profile; fill required `test-qu-info-text`; `submit()`; asserts `candidateQuestionsOverviewPage` |
| 15 | `questions overview: intro + start` | TIR4:189-194 — `candidateQuestionsOverviewPage.expectIntroMessage()`; `clickStart()`; asserts `candidateQuestionPage` w/ first opinion question (Likert-5 Base-1) |
| 16 | `first question: hero + answer + info` | TIR4:196-204 — `candidateQuestionPage.expectHeroVisible('emoji')`; `expectContinueDisabled()`; `selectChoice('1')`; `expectContinueEnabled()`; `enterInfo(OPEN_ANSWER_1)`; `clickContinue()` |
| 17 | `questions overview: progress + expanders` | TIR4:206-215 — `expectContinuePrompt()`; assert Q1 answered + info shown; assert Q2 has answer button; assert category expanders visible; `getCategoryExpander('Base').clickExpander()` (collapse + re-expand) |
| 18 | `edit answered question` | TIR4:216-225 — `clickEditFirstQuestion()`; in question page change choice + info; `clickContinue()`; assert overview shows updated values |
| 19 | `walk remaining opinion questions (max value)` | TIR4:227-237 — for each remaining opinion q applicable to north/regional, select max-value answer, expect after-last `candidateHomePage.expectCompletedMessage()` + preview enabled |
| 20 | `completed questions overview` | TIR4:239-243 |
| 21 | `preview: info answers + portrait + opinion answers; NO voter-comparison` | TIR4:245-252 — `candidatePreviewPage.expectAllInfoAnswersVisible([...])`; `expectPortraitVisible()`; `expectAllOpinionAnswersVisible([...])`; `expectNoVoterComparison()` |
| 22 | `final logout (no dialog)` | TIR4:253-256 — `candidateLogoutButton.clickWithoutDialog()`; asserts at `candidateLoginPage` |

**Acceptance signals:**
- `cd tests && npx playwright test --project=candidate-mega-journey` — passes cold-start (≤ 180s)
- 3 consecutive cold-start runs SHA-identical pass-set (Gate B 88-04 precedent)
- Spec deterministic on retry (no waitForURL races, no email-poll races — `emailBucket.expectEmail` uses the same retry pattern as `getLatestEmailHtml` `expect.poll` at registration-spec:97)
- No `expect.soft` / no try/catch around expect / no `[*-followup]` markers (88-04 rigidity contract)

---

### Plan 89-04: 3 settings permutations

**Files to CREATE:**
- `packages/dev-seed/src/templates/permutations/perm-disable-voter-app.ts` — minimal-data template per 88-03 lineage (`perm-disable-election-1co.ts` shape). 1 election, 1 CG, 1 CO, 1-2 candidates, BARE settings overlay:
  ```ts
  const P = 'e2e-perm-novapp-';
  const APP_SETTINGS = {
    ...MINIMAL_BASE_APP_SETTINGS,
    access: { ...MINIMAL_BASE_APP_SETTINGS.access, voterApp: false }
  };
  ```
- `packages/dev-seed/src/templates/permutations/perm-disable-candidate-app.ts` — same shape, `access.candidateApp: false`. Prefix `e2e-perm-nocand-`.
- `packages/dev-seed/src/templates/permutations/perm-per-app-notifications.ts` — same shape, `notifications: { voterApp: { show: true, title: { en: '[notif-voter] Voter-only notification.' }, content: { en: 'voter content' } }, candidateApp: { show: true, title: { en: '[notif-cand] Candidate-only notification.' }, content: { en: 'candidate content' } } }`. Prefix `e2e-perm-notif-`.
- `packages/dev-seed/src/templates/index.ts` — register the 3 new templates in `BUILT_IN_TEMPLATES` and `BUILT_IN_OVERRIDES` (researcher confirms exact registration path by reading current `index.ts`).
- `tests/tests/setup/perm-disable-voter-app.setup.ts` / `.teardown.ts` — 1-line wrapper mirrors `perm-disable-election-1co.setup.ts:11-13`. Pass `extraTeardownPrefix: ['test-', 'e2e-perm-']`.
- `tests/tests/setup/perm-disable-candidate-app.setup.ts` / `.teardown.ts` — same shape.
- `tests/tests/setup/perm-per-app-notifications.setup.ts` / `.teardown.ts` — same shape.
- `tests/tests/specs/perm/perm-disable-voter-app.spec.ts` — single test asserting:
  - GET `/` (with locale `/en/`) — asserts maintenance page (per `7.1.2/3` precedent at `candidate-settings.spec.ts:166-187`: `expect(page.getByRole('main')).toBeVisible()` + `expect(page.getByRole('heading', { level: 1 })).toBeVisible()` + `expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden()`)
  - GET `/en/elections` — same maintenance assertion
  - GET `/en/candidate` — asserts candidate home/login page renders (NOT maintenance)
- `tests/tests/specs/perm/perm-disable-candidate-app.spec.ts` — mirror, swap routes.
- `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` — assert:
  - GET `/en` — `page.getByRole('dialog')` shows voter notification (text from `[notif-voter]`); does NOT show `[notif-cand]`
  - GET `/en/candidate` — `page.getByRole('dialog')` shows candidate notification (text from `[notif-cand]`); does NOT show `[notif-voter]`

**Files to MODIFY:**
- `tests/playwright.config.ts` — append 9 new project entries (3 setup + 3 spec + 3 teardown) at the very end (after `candidate-mega-journey`). Pattern (mirrors 88-03 perm-* sequence at lines 671-847):
  ```ts
  { name: 'data-setup-perm-disable-voter-app', testMatch: /perm-disable-voter-app\.setup\.ts/, teardown: 'data-teardown-perm-disable-voter-app', dependencies: ['candidate-mega-journey'] },
  { name: 'data-teardown-perm-disable-voter-app', testMatch: /perm-disable-voter-app\.teardown\.ts/ },
  { name: 'perm-disable-voter-app', testDir: './tests/specs/perm', testMatch: /perm-disable-voter-app\.spec\.ts/, fullyParallel: false, use: { ...devices['Desktop Chrome'] }, dependencies: ['data-setup-perm-disable-voter-app'] },
  // ... same pattern for perm-disable-candidate-app (depends on perm-disable-voter-app)
  // ... same pattern for perm-per-app-notifications (depends on perm-disable-candidate-app)
  ```
- `packages/dev-seed/src/templates/permutations/shared.ts` — likely no changes; researcher confirms `MINIMAL_BASE_APP_SETTINGS` already provides the spread baseline. If not, add `notifications` default (probably already at `null` baseline per 88-01 settings shape).

**testid additions in 89-04:** likely zero — perm specs assert via roles (`<main>`, `<heading>`, `<dialog>`) per 7.1.2/7.1.4 precedent.

**Parallel-safety:** each perm template uses distinct `externalIdPrefix`. `setupFromTemplate({ extraTeardownPrefix: ['test-', 'e2e-perm-'] })` wipes ALL test-prefixed rows before seeding (defends against the race with the candidate-mega chain still being mid-teardown). 88-03 sanctioned this pattern.

**Acceptance signals:**
- Each perm spec passes cold-start
- Sequential chain runs perm-disable-voter-app → perm-disable-candidate-app → perm-per-app-notifications without rows leaking between them (verified via post-test `external_id LIKE 'e2e-perm-<this-prefix>-%'` row counts in DB if planner adds a probe)
- Full e2e suite (perm-* family + voter-mega + candidate-mega) passes after 89-04 lands

---

### Plan 89-LAST: Legacy retirement

**Files to DELETE:**
- `tests/tests/specs/candidate/candidate-auth.spec.ts`
- `tests/tests/specs/candidate/candidate-password.spec.ts`
- `tests/tests/specs/candidate/candidate-registration.spec.ts`
- `tests/tests/specs/candidate/candidate-questions.spec.ts`
- `tests/tests/specs/candidate/candidate-required-info.spec.ts`
- Per-class PageObject deletion at `tests/tests/pages/candidate/*Page.ts` — audit each class for surviving consumers (after the 5 spec deletions):
  - `HomePage.ts` — surviving consumers: `candidate-profile.spec.ts`, `candidate-profile-validation.spec.ts`, `candidate-settings.spec.ts` residual — likely KEEP
  - `LoginPage.ts` — surviving consumers: same — likely KEEP
  - `PreviewPage.ts` — surviving consumers: `candidate-profile.spec.ts` (4.2.1 uses preview?) — researcher audits with grep
  - `ProfilePage.ts` — surviving consumers: `candidate-profile.spec.ts`, `candidate-profile-validation.spec.ts` — KEEP
  - `QuestionPage.ts` — surviving consumers: `candidate-translation.spec.ts` uses? — researcher audits
  - `QuestionsPage.ts` — surviving consumers: same as QuestionPage — researcher audits
  - `SettingsPage.ts` — surviving consumers: `candidate-settings.spec.ts` — KEEP
  **Audit method:** `grep -rln "from.*pages/candidate/<Class>" tests/tests/specs/` post-deletion of the 5 specs; classes with zero hits are deletable.

**Files to MODIFY:**
- `tests/tests/specs/candidate/candidate-settings.spec.ts` — excise the 3 test blocks for 7.1.2 (lines 166-187, `should show maintenance page when candidateApp is disabled`), 7.1.3 (lines 200-220, `should show maintenance page when underMaintenance is true` — TIR4 only covers candidateApp/voterApp, NOT underMaintenance; researcher confirms with operator whether 7.1.3 stays OR also moves to perm), 7.1.4 (lines 242-271, `should display notification popup when enabled` — superseded by perm-per-app-notifications).
  **Operator clarification needed:** TIR4:36-42 only adds `voterApp disabled` perm; the EXISTING 7.1.3 `underMaintenance` case is NOT cited in TIR4 as moving to perm. Verify whether 7.1.3 stays in legacy candidate-settings residual OR also retires. Per CONTEXT.md D-89-04, the excisions are explicitly "7.1.2/3/4 only" → 7.1.3 DOES retire.
- `tests/playwright.config.ts` — at lines 122-247 (the `PLAYWRIGHT_LEGACY=1` block):
  - `candidate-app` `testMatch: /candidate-(auth|questions|translation)\.spec\.ts/` → `testMatch: /candidate-translation\.spec\.ts/` (auth + questions deleted)
  - `candidate-app-mutation` `testMatch: /candidate-(registration|profile)\.spec\.ts/` → `testMatch: /candidate-profile\.spec\.ts/` (registration deleted)
  - `candidate-app-password` testMatch references `candidate-password\.spec\.ts` (deleted) → DELETE the entire project entry (lines 238-247)
  - `variant-hidden-required-candidate` testMatch references `candidate-required-info\.spec\.ts` (deleted) → DELETE the entire project + its setup `data-setup-hidden-required` if NO other consumer.
- `tests/tests/setup/re-auth.setup.ts` — researcher audits whether this is still needed by surviving specs; likely YES (`candidate-app-settings` depends on it).
- `tests/tests/fixtures/index.ts` — UNCHANGED. The legacy PageObject root persists for the kept legacy specs (`candidate-profile.spec.ts`, `candidate-profile-validation.spec.ts`, `candidate-translation.spec.ts`, `candidate-bank-auth.spec.ts`, `candidate-settings.spec.ts` residual).
- `tests/tests/utils/testIds.ts` — UNTOUCHED in 89-LAST (testid removal is risky; defer to a future cleanup).

**Files to KEEP intact (CONTEXT.md D-89-04):**
- `candidate-settings.spec.ts` residual (after excision)
- `candidate-profile.spec.ts`
- `candidate-profile-validation.spec.ts`
- `candidate-translation.spec.ts`
- `candidate-bank-auth.spec.ts`
- `tests/tests/utils/emailHelper.ts` — D-89-05 explicit
- `tests/tests/utils/supabaseAdminClient.ts` — used by registration + sendEmail in candidate-mega
- `tests/tests/utils/testCredentials.ts` — used by surviving legacy specs

**Acceptance signals:**
- Full e2e suite green: `yarn test:e2e` passes (no broken imports; no orphan testIgnore entries; no missing-spec project errors)
- `cd tests && PLAYWRIGHT_LEGACY=1 yarn test:e2e` — surviving legacy projects still pass
- `yarn lint:check` passes (no unused imports after deletions)
- TypeScript compiles cleanly

---

## Codebase Inventory

| Anchor | Lines | Convention to mirror |
|--------|-------|----------------------|
| `tests/tests/fixtures/voter-mega.fixture.ts` | :1-185 | Docstring header (Phase + Plan + Task ID, SIBLING vs replacement disclaimer, TIR1 source quote). `test.extend<>` from `@playwright/test`. Option fixtures via `[default, { option: true }]`. Single composition fixture (`answeredVoterPage`) that runs the journey. |
| `tests/tests/fixtures/views.ts` | :1-51 | Sibling composition root pattern. Imports each fixture's `createXxx(page)` factory, registers into `base.extend<>`, re-exports `expect`. |
| `tests/tests/fixtures/resultsPage.fixture.ts` | (not read; see 88-04-SUMMARY :103) | Each fixture file exports a `createXxx(page: Page) → XxxFixture` factory + a type. |
| `tests/tests/utils/emailHelper.ts` | :1-186 | `fetchEmails`/`getLatestEmailHtml`/`extractLinkFromHtml`/`getRegistrationLink`/`toCallbackUrl`/`countEmailsForRecipient`/`purgeMailbox`/`clearMailboxForRecipient`. Mailpit REST API on port 54324. **emailBucket wraps these primitives.** |
| `tests/tests/utils/supabaseAdminClient.ts` | :280-487 | `setPassword(email, pw)`, `forceRegister(externalId, email, pw)`, `unregisterCandidate(email)`, `sendEmail({candidateExternalId, subject, content, email?})`. `sendEmail` is the canonical trigger for the candidate-mega registration step (TIR4:112-115). Auto-routes to `inviteUserByEmail` when `auth_user_id` is null (our unregistered candidate case). |
| `tests/tests/setup/setupFromTemplate.ts` | :1-229 | Generic helper. `setupFromTemplate(templateName, { extraTeardownPrefix, postSeedAssertions })`. Returns `{ cleanup }`. Resolves Option B externalId refs before post-seed comparison. **89-04 perm setups MUST use this; do NOT re-author.** |
| `tests/tests/setup/baseV1.setup.ts` | :1-29 | 1-line wrapper. Pass `extraTeardownPrefix: 'e2e-perm-'` to defend against race with perm-* family's last teardown. |
| `tests/tests/setup/baseV1.teardown.ts` | :1-29 | `runTeardown('test-', client)`. 89-03's `candidate-mega.teardown.ts` ALSO calls `unregisterCandidate` to clear the auth.users entry. |
| `tests/tests/setup/perm-disable-election-1co.setup.ts` | :1-13 | Mirrors `baseV1.setup.ts`. Pass `extraTeardownPrefix: ['test-', 'e2e-perm-']`. |
| `packages/dev-seed/src/templates/baseV1.ts` | :1-1748 | externalIdPrefix `''`, generateTranslationsForAllLocales `false`, seed `42`. fixed[]-only; no generators. Verbatim TIR1:13-200 with documented divergences. **Mutate in-place per D-89-01.** |
| `packages/dev-seed/src/templates/permutations/perm-disable-election-1co.ts` | :1-123 | Mirrors. `MINIMAL_BASE_APP_SETTINGS` spread + targeted override. Use shared builders `buildCandidate`/`buildOrganizations`/`buildQuestionCategories`/`buildQuestions`/`buildElectionConstituencyNoms`. |
| `packages/dev-seed/src/templates/permutations/shared.ts` | (not read fully) | Provides `MINIMAL_BASE_APP_SETTINGS` + the build* helpers. 89-04 perms consume these. |
| `tests/tests/specs/voter/voter-mega-journey.spec.ts` | :1-991 | `test.describe.configure({ mode: 'serial' })` inside `test.describe()`. Single `test('full voter journey end-to-end', ...)` with many `test.step()` blocks. File-scope `TIMEOUT` + `TEXT_RE` constants + module-scope helpers (`clickAllTolerantly`, `ensureAllChecked`, `getOnlyConstituencyListbox`, `toggleCategoryListItem`, `expectUrlChange`). |
| `tests/tests/specs/perm/perm-disable-election-1co.spec.ts` | :1-21 | Single `test.describe('perm-...')` with 1+ `test()` block. HARD assertions only. Uses `bypassIntroAndExpectQuestion` voter-helper utility. |
| `tests/tests/specs/candidate/candidate-registration.spec.ts` | :1-120 (read) | Uses unauthenticated context via `test.use({ storageState: { cookies: [], origins: [] } })`. **Canonical registration flow** for 89-03 to model on, but 89-03's spec consumes fixtures rather than direct utility calls. |
| `tests/playwright.config.ts` | :42-849 | `PLAYWRIGHT_LEGACY=1` gates the legacy chain (lines 97-538). Default-mode runs perm-* → baseV1 mega-journey. **89-03 + 89-04 appends NEW project entries at the end.** Sequential perm-* chain via `dependencies: [<prev perm spec>]` (lines 671-847). |
| `apps/frontend/src/routes/candidate/login/+page.svelte` | :1-223 | Testids: `login-email`, `password-field` (in PasswordField), `login-submit`, `login-errorMessage`, `login-register-link`, `login-forgot-password-link`. `<Button disabled={!canSubmit}>` at :180 — submit-disabled via `:disabled` attribute. ErrorMessage with testid `login-errorMessage` at :176. |
| `apps/frontend/src/routes/candidate/forgot-password/+page.svelte` | :1-113 | Testids: `forgot-password-email`, `forgot-password-submit`, `forgot-password-success`, `forgot-password-error`, `forgot-password-home`, `forgot-password-return`. |
| `apps/frontend/src/routes/candidate/register/password/+page.svelte` | :1-147 | Testids: `register-password` + `register-confirm-password` (passed to `PasswordSetter` via `passwordTestId`/`confirmPasswordTestId` props), `register-password-submit`, `register-password-error`. |
| `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` | :1-62 | Testid: `terms-checkbox` only. **MISSING:** advance-button testid (the form is just a checkbox — the surrounding page provides the advance button; verify with planner). |
| `apps/frontend/src/routes/candidate/(protected)/+page.svelte` | :1-160 | Candidate home. Testids: `candidate-home-status`, `candidate-home-tip`, `candidate-home-profile`, `candidate-home-questions`, `candidate-home-preview`, `candidate-home-continue`, `candidate-home-logout`. Three-task discovery via these three button testids; disabled-state via `disabled={candCtx.unansweredRequiredInfoQuestions?.length !== 0}` at :129+144. |
| `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` | :1-337 | Testids: `profile-first-name`, `profile-last-name`, `profile-image-upload`, `profile-submit`, `profile-cancel`, `profile-return`. **NO testid on the immutable info section nor on the nominations section.** Editable info questions iterate via `{#each candCtx.infoQuestions.filter(...)}`; each `QuestionInput` lacks per-question testid — fixture must select by label text. Image error states render via `ErrorMessage` inside `Input.svelte` — researcher locates the exact testid pattern during 89-02. |
| `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` | :1-203 | Testids: `candidate-questions-progress`, `candidate-questions-continue`, `candidate-questions-list`, `candidate-questions-card` (UNKEYED per-card — all expand buttons share this testid). **Category expanders have NO per-category testid** — researcher MUST add `data-testid="candidate-questions-category-expander"` on the `<Expander>` at :131 for 89-02 fixture filter-by-text. |
| `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` | :1-348 | Testids: `candidate-questions-answer`, `candidate-questions-comment`, `candidate-questions-save`, `candidate-questions-cancel`, `candidate-questions-return`. Hero rendered via `<Hero content={customData.hero} />` at :267, gated by `!$appSettings.candidateApp.questions.hideHero`. **NO testid on the hero figure** — researcher adds. |
| `apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte` | :1-103 | Testid: `candidate-preview-container`. Renders `<EntityDetails {entity} />` which carries all the voter-side info-item / opinion-question testids from 88-04. **Preview-page reuses voter testids** — fixture leverages this. |
| `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte` | :1-122 | NO outer testid — testid `candidate-home-logout` is set on `<LogoutButton>` consumer at `(protected)/+page.svelte:157` via `...restProps`. Modal is a `TimedModal` (visible via `role="dialog"` when triggered). Modal opens ONLY when `!answersLocked && (unansweredOpinionQuestions.length !== 0 \|\| unansweredRequiredInfoQuestions.length !== 0)` at :59 — when profile is complete + all opinions answered, `triggerLogout()` calls `logout()` directly. **TIR4:253-256 final logout (no dialog)** = post-completion case; **TIR4:124-126 early logout (with dialog)** = pre-completion case. The fixture `clickWithDialog()` / `clickWithoutDialog()` distinction maps cleanly. |
| `apps/frontend/src/lib/components/hero/Hero.svelte` | :1-37 | `content` prop accepts `HeroContent` (emoji or image). NO outer testid. Researcher adds `data-testid` to the outer `<div>` via `restProps` (the component already spreads via `concatClass`). |
| `apps/frontend/src/lib/components/questions/QuestionBasicInfo.svelte` | :1-32 | Renders `<Expander title={t('common.readMore')} {...restProps}>`. Restprops-forwarded — `data-testid` can be added at the call-site. **89-01 testid:** `voter-questions-info-button` added at the call-site in `(voters)/.../questions/[questionId]/+page.svelte:195`. |
| `tests/tests/utils/testIds.ts` | :1-195 | Central namespace. New constants land under `testIds.candidate.*` for 89-02 fixture surface. Naming: kebab-case values. |

---

## Testid Additions Catalog

The following NEW testids must be added during 89-01 (voter assertions) + 89-02 (fixture authoring) + 89-03 (spec). Each testid is registered as a constant in `tests/tests/utils/testIds.ts` per 88-04 Wave 1.5 convention (12 testids in one commit `ccac7691a`).

### For Plan 89-01 (voter-mega hero/info assertions)

| Testid | Component file | Rationale |
|--------|----------------|-----------|
| `voter-questions-hero` | `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:170-176` (the `<figure>` inside `{#snippet hero()}`) | Voter-mega asserts hero visible on Q1 (emoji) and Q2 (image). Pass via prop to `<figure>` or wrap. |
| `voter-questions-category-hero` | `apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte:89-90` | Voter-mega asserts hero visible on QG-Opin-Base category intro. |
| `voter-questions-info-button` | `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:195-199` (on `<QuestionBasicInfo>` via restProps OR on the wrapping `<div>`) | Voter-mega asserts Info button visible on Q1, absent on Q2. |

### For Plan 89-02 (candidate fixture surface — list inferred from spec walkthrough)

| Testid | Component file | Rationale (which fixture method needs it) |
|--------|----------------|-------------------------------------------|
| `terms-of-use-submit` | `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` OR its consumer page | `candidateTermsOfUsePage.acceptAndAdvance()` clicks this AFTER checking `terms-checkbox`. Need to locate the actual submit button — likely in the post-register/login flow's wrapping page. |
| `candidate-questions-category-expander` | `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:131` (on `<Expander>`) | `candidateQuestionsOverviewPage.getCategoryExpander(name)` filters by `hasText: <category-name>`. |
| `candidate-questions-hero` | `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte:264-270` (the `<figure>` inside `{#snippet hero()}`) | `candidateQuestionPage.expectHeroVisible(content)`. |
| `candidate-questions-intro` | `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:88-99` (the intro snippet `<div>` shown when `completion === 'empty'`) | `candidateQuestionsOverviewPage.expectIntroMessage()`. |
| `profile-image-error` (or extends existing `ErrorMessage` testid namespace) | `apps/frontend/src/lib/components/input/Input.svelte` (the image input error branch) | `candidateProfilePage.uploadPortrait({ expectError: 'invalidFile' \| 'oversizeFile' })`. Researcher must read `Input.svelte` during 89-02 to find the exact landing site. |
| `candidate-profile-nominations` | `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:237-262` (the `<section>` for nominations) | `candidateProfilePage.expectStaticInfo({ nomination: {...} })`. |
| `candidate-profile-info-item` (un-keyed per question) | `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:284-287` (the `{#each candCtx.infoQuestions...}` block) | `candidateProfilePage.getQuestion(externalIdOrLabel)`. |
| `candidate-questions-completed` (banner or message after final opinion) | `apps/frontend/src/routes/candidate/(protected)/+page.svelte:75-82` (the `profileComplete` branch's status message) | `candidateHomePage.expectCompletedMessage()`. The existing `candidate-home-status` may suffice; researcher confirms. |

### For Plan 89-03 (spec-only — usually no new testids, but flag any discovered)

(none anticipated; flag during execution)

---

## Validation Architecture

Phase 89 uses Vitest (dev-seed unit tests) + Playwright (e2e specs). All commands runnable from repo root.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright 1.x (via `yarn workspace tests`) + Vitest (via `yarn workspace @openvaa/dev-seed test:unit`) |
| Config file | `tests/playwright.config.ts` + per-workspace `vitest.config.ts` |
| Quick run command | `cd tests && npx playwright test --project=<project-name>` |
| Full suite command | `yarn test:e2e` (runs all default-gated projects) + `yarn test:unit` (Vitest across workspaces) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TIR4-DATA-01..05 | baseV1 dataset extensions | Vitest unit | `yarn workspace @openvaa/dev-seed test:unit` | ✅ (existing test file at `packages/dev-seed/tests/templates/`; new assertions added in 89-01 OR existing :431 drift accepted as deferred) |
| TIR4-VOTER-01..03 | Voter-mega assertions | Playwright e2e | `cd tests && npx playwright test --project=voter-mega-journey` | ✅ (`voter-mega-journey.spec.ts`) |
| TIR4-CAND-01..22 | Candidate-mega journey | Playwright e2e | `cd tests && npx playwright test --project=candidate-mega-journey` | ❌ Wave 0 — created in 89-03 |
| TIR4-PERM-01 | voterApp disabled perm | Playwright e2e | `cd tests && npx playwright test --project=perm-disable-voter-app` | ❌ Wave 0 — created in 89-04 |
| TIR4-PERM-02 | candidateApp disabled perm | Playwright e2e | `cd tests && npx playwright test --project=perm-disable-candidate-app` | ❌ Wave 0 — created in 89-04 |
| TIR4-PERM-03 | per-app notifications perm | Playwright e2e | `cd tests && npx playwright test --project=perm-per-app-notifications` | ❌ Wave 0 — created in 89-04 |
| TIR4-RETIRE-01 | Legacy retirement (full-suite green) | Playwright e2e | `yarn test:e2e` (full default suite) + `PLAYWRIGHT_LEGACY=1 yarn test:e2e` | ✅ |

### Sampling Rate

| Plan | Per-task commit | Per-wave merge | Plan gate |
|------|----------------|----------------|-----------|
| **89-01** | `yarn workspace @openvaa/dev-seed test:unit` (skip the deferred :431 count assertion) + `cd tests && npx playwright test --project=voter-mega-journey` | `yarn build && yarn test:e2e` (verifies whole suite still green) | 3 consecutive cold-start runs of voter-mega-journey green |
| **89-02** | `yarn build && yarn lint:check` (type-check + lint on new fixture files) | `cd tests && npx playwright test --project=voter-mega-journey` (no regression on existing fixture consumers) | Smoke-import test from a throwaway spec compiles & runs |
| **89-03** | `cd tests && npx playwright test --project=candidate-mega-journey --reporter=list` | Full chain: `cd tests && npx playwright test --project=voter-mega-journey --project=candidate-mega-journey` | 3 consecutive cold-start runs green |
| **89-04** | `cd tests && npx playwright test --project=perm-disable-voter-app` (and other 2 perms individually) | `cd tests && npx playwright test --project=perm-disable-voter-app --project=perm-disable-candidate-app --project=perm-per-app-notifications --project=candidate-mega-journey` (proves cross-chain isolation) | Sequential 3-perm-spec chain green |
| **89-LAST** | `yarn lint:check && yarn build` after each deletion | `yarn test:e2e` (full default suite) + `PLAYWRIGHT_LEGACY=1 yarn test:e2e` | Full suite green; no testIgnore orphans; no broken imports |

**Phase gate (Nyquist):** Full e2e suite green at 89-LAST completion, with 3 consecutive cold-start runs SHA-identical pass-set per 88-04 Gate B precedent. Each plan's per-task green is the inner Nyquist sample; per-wave merge is the outer.

### Wave 0 Gaps

For 89-03/89-04 (Wave 0 needs to confirm file scaffolding):

- [ ] `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` — covers TIR4-CAND-01..22
- [ ] `tests/tests/specs/candidate/candidate-mega-journey.README.md` — pattern documentation
- [ ] `tests/tests/setup/candidate-mega.setup.ts` + `.teardown.ts` — covers candidate-mega chain
- [ ] `tests/tests/specs/perm/perm-disable-voter-app.spec.ts` — covers TIR4-PERM-01
- [ ] `tests/tests/specs/perm/perm-disable-candidate-app.spec.ts` — covers TIR4-PERM-02
- [ ] `tests/tests/specs/perm/perm-per-app-notifications.spec.ts` — covers TIR4-PERM-03
- [ ] 3 perm setup/teardown pairs under `tests/tests/setup/`
- [ ] 3 perm template files under `packages/dev-seed/src/templates/permutations/`
- [ ] Composition root `tests/tests/fixtures/candidate/candidate-mega.ts` + 11 fixture files

For 89-01 (no new test infra; only assertions added to existing spec).

For 89-LAST (only deletions; no new infra).

---

## Risk Register

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | **baseV1 in-place mutation breaks voter-mega-journey** (D-89-01 lockstep contract) — adding hero, info, 3 new info questions changes infoTab counts at the matrix step (currently 13) and may break the existing assertion. | BLOCKING | Plan 89-01 MUST patch the candidate-details matrix step's `expectInfoItems` count assertion in the SAME commit as the data mutation. The post-mutation expected count: ~14 (existing 13 + 1 north-only filtered). |
| R2 | **`questions.fixed.length === 18` drift at `packages/dev-seed/tests/templates/e2e.test.ts:431`** — 88-04 already has 25 actual; 89-01 adds 3 more (→ 28). The unit-test failure is pre-existing. | INFO | Surface in deferred-items.md per CONTEXT.md D-89-01. Do NOT fix in 89-01. Likely fixed in 88-LAST (or a future v2.11 hygiene plan). Acceptable per operator. |
| R3 | **Shared `'test-'` prefix race between voter-mega chain and candidate-mega chain** — both consume baseV1 template. | BLOCKING | Sequence the chains: `voter-mega-journey → data-setup-candidate-mega` via Playwright `dependencies: ['voter-mega-journey']`. Don't run in parallel. Same precedent as 88-01 Risk #4 (voter-mega + legacy e2e race). |
| R4 | **`candidate-mega.teardown.ts` leaves orphan auth.users** — registration test creates an auth user via `inviteUserByEmail`; if teardown doesn't `unregisterCandidate`, subsequent runs hit "User already exists". | BLOCKING | Teardown MUST call `await client.unregisterCandidate('unregistered-aa@test.openvaa.local')` BEFORE `runTeardown('test-', client)`. Pattern: data.teardown.ts already does this for the legacy auth setup; mirror that. |
| R5 | **TIR4:99 voter-mega candidate-details info question narrowing** — TIR4 says "edit the voter mega journey candidate details info test to check that only the 2nd of these is visible" (i.e., the north-only one). The existing matrix step uses CA-AA-Special which is nominated in CO-Reg-N (north). The 3 new info questions are filtered to mun-only/north-only/south-only — CA-AA-Special's voter sees only the north-only one in the detail drawer. Voter-mega's voter selects North-East municipal + Region North regional (per `voter-mega.fixture.ts:106-109` — picks first option in each combobox, sort_order 0). Researcher confirms: in baseV1's nomination structure, the voter's selected constituencies are CO-Reg-N + CO-Mun-NE. So the north-only filtered info question (`test-qu-info-filt-co-reg-n`) is in scope; the south-only and mun-only are out. ✓ matches TIR4. | WARNING | Plan 89-01 task should add a step-specific assertion: `await expect(infoTab).toContainText(/test-qu-info-filt-co-reg-n/i)` AND `await expect(infoTab).not.toContainText(/test-qu-info-filt-mun-only|test-qu-info-filt-co-reg-s/i)`. Counts assertion adjusted. |
| R6 | **88-04 `QuestionInCardContent` election-specificity TODO** — the 3 new filtered info questions may expose the same gap (election-specific render of cardContents). | INFO | Per D-89-01 / CONTEXT.md, researcher flags but does NOT block 89-01. Surface in deferred-items.md. The 89-03 candidate-preview-page rendering uses `<EntityDetails>` which already has the workaround from 88-04 Option B (seed-time resolver). |
| R7 | **Hero rendering test stability** — `customData.hero` JSONB field plumbing through dev-seed Writer + Supabase + frontend. Verify dev-seed writes `custom_data.hero` correctly. | WARNING | Plan 89-01 Wave 0 probe: run baseV1 seed + `psql` `SELECT custom_data FROM questions WHERE external_id = 'test-qu-opin-base-1-likert5'` to verify the `hero` field round-trips. Mirrors 88-04's Wave 0 probe pattern (`88-04-WAVE0-PROBES.txt`). |
| R8 | **Unregistered candidate row schema** — does the `candidates` table accept an `email` field for invite-flow seeding? Or does the spec construct the email externally? | WARNING | Probe: check `packages/supabase-types/src/database.ts` for the candidates table columns. If `email` is not a column, the spec must hold the email string in a const and pass it to `sendEmail({email})`. Researcher recommends storing the candidate's email in a sibling test-constant file (`tests/tests/utils/candidateMegaConstants.ts`) — pattern matches `E2E_ADDENDUM_CANDIDATES` at `tests/tests/utils/e2eFixtureRefs.ts`. |
| R9 | **Likert-only flag interaction (CLAUDE.md note)** — the legacy `--likert-only` flag exists to filter out non-ordinal opinion questions from the voter answer flow. Adding non-ordinal INFO questions (the 3 new `test-qu-info-filt-*` are `type: 'text'`) does NOT affect this — info questions are NOT iterated by `walkVoterMegaJourney` (it only iterates `voter-questions-categoryStart` / `voter-questions-answerOption` which are OPINION question UI). | INFO | No action; documented for planner awareness. |
| R10 | **TIR4:36-54 perm test patterning vs 7.1.3 underMaintenance** — TIR4 cites 7.1.3 (`underMaintenance`) as the model for the new voterApp/candidateApp disabled perms, but does NOT mandate retiring 7.1.3 itself. CONTEXT.md D-89-04 explicitly says 7.1.3 retires. Verify operator confirms 7.1.3 retirement. | WARNING | Surface to operator during plan-checker if uncertain. Per CONTEXT.md the planner proceeds with 7.1.3 retirement. |
| R11 | **Final logout dialog discrimination (TIR4:124-126 vs 253-256)** — early logout fires the TimedModal; final logout (after profile complete + opinions complete) does NOT. The fixture distinguishes via `clickWithDialog()` / `clickWithoutDialog()` per 89-02. Risk: the LogoutButton trigger logic at `LogoutButton.svelte:58-64` depends on `answersLocked` AND `unansweredOpinionQuestions` AND `unansweredRequiredInfoQuestions` — if `answersLocked` is true (e.g., post-flow), modal is skipped. Verify the test flow doesn't unintentionally flip `answersLocked`. | WARNING | Add explicit pre-assertion in step 22: `await expect(candCtx.unansweredOpinionQuestions).toHaveLength(0)` is not directly accessible from Playwright; instead assert the home-page state is "completed" via `candidate-home-status` text BEFORE clicking logout. |
| R12 | **Frontend test data: hero image asset** — Plan 89-01 needs an actual image file for `test-qu-opin-base-2-likert4`'s hero. | INFO | Use a tiny SVG or data URL; ship under `apps/frontend/static/images/` or inline as data URL in baseV1. Operator preference: planner picks the simpler path. |
| R13 | **`test.use({ storageState: ... })` interaction with the auth flow** — `candidate-mega-journey.spec.ts` MUST start unauthenticated (TIR4:107 walks static pages → registration). Use `test.use({ storageState: { cookies: [], origins: [] } })` at the file top (precedent: `candidate-registration.spec.ts:22`). | WARNING | Add to spec scaffolding template. |
| R14 | **emailBucket subject-filter against Supabase invite/recovery email subjects** — the `inviteUserByEmail` and `resetPasswordForEmail` Supabase methods produce emails with default subjects from GoTrue templates (likely `"Confirm Your Signup"` and `"Reset Your Password"` — exact strings vary by Supabase version). Hard-coded subject regex in `expectEmail(subject)` may break across Supabase upgrades. | WARNING | Use loose regexes (`/registration|invite|confirm|signup/i` and `/reset|recovery/i`) OR call without subject filter and rely on recency (newest email). Both patterns appear in the existing `candidate-registration.spec.ts` code paths. |

---

## Deferred Items Surfaced

Following the 88-04 deferred-items.md convention, these items must be recorded in the phase's `deferred-items.md` (not committed to a fix in 89; surface for future phases):

1. **`packages/dev-seed/tests/templates/e2e.test.ts:431` row-count drift** — 88-04 already at 25 actual vs 18 expected; 89-01 adds 3 more (→ 28). Per CONTEXT.md D-89-01 explicit deferral.

2. **88-04 `QuestionInCardContent` election-specificity TODO** (Gate A.4) — v2.11+ candidate. Whether 89-01's 3 filtered info questions re-expose the same gap. Researcher flags but does not block.

3. **`emailHelper.ts` retirement** — D-89-05 explicit end-of-milestone deferral.

4. **Legacy PageObject classes** at `tests/tests/pages/candidate/*Page.ts` — those still consumed by surviving legacy specs stay. Full retirement is end-of-milestone.

5. **TIR5 deferred items** — all explicitly out of scope: 7.1.1 read-only warning, 3.3.1 candidate translation, 4.2.5-7 A11Y-02 persistence, 5.1.1-6 A11Y-01 validation matrix, 7.1.7/8 hideHero, 7.1.10/11/13-17 SETTINGS-01 wave A, 27.1.1 variant-allowopen setup, 28.1.1-3 voter-allowopen, 34.* visual regression, 35.* perf budget, 36.* a11y smoke, 37.1.1-6 bank-auth.

6. **`expectQuestionDisplayToHave` legacy helper at `voter-mega-journey.spec.ts:298-326`** — Phase 88-04 deferred-items.md item #2; still in place. Not in 89 scope.

7. **Test-INVENTORY.md refresh** — out-of-scope per 88-CONTEXT.md §"gating constraints"; future phase.

---

## Sources

### Primary (HIGH confidence)
- `./TEST-INVENTORY-REFACTOR-4.md` — verbatim TIR4 spec (READ in full, 257 lines)
- `./TEST-INVENTORY-REFACTOR-5.md` — verbatim TIR5 deferral list (READ in full, 100 lines)
- `./TEST-INVENTORY-REFACTOR-1.md` — verbatim TIR1 baseV1 dataset + settings (READ key sections)
- `.planning/phases/89-…/89-CONTEXT.md` — locked decisions (READ in full)
- `.planning/phases/89-…/89-DISCUSSION-LOG.md` — discuss-phase audit trail (READ in full)
- `.planning/phases/88-…/88-CONTEXT.md` — parallel-landing principle (READ in full)
- `.planning/phases/88-…/88-04-SUMMARY.md` — function-fixture pattern + 12-testid commit precedent (READ in full)
- `.planning/phases/88-…/88-04-ADR-cardContents-resolver.md` — seed-time resolver convention (READ in full)
- `.planning/phases/88-…/deferred-items.md` — `:431` drift + matrix-helper drift (READ in full)
- `tests/tests/fixtures/voter-mega.fixture.ts` — fixture authoring template (READ in full)
- `tests/tests/fixtures/views.ts` — composition root template (READ in full)
- `tests/tests/utils/emailHelper.ts` — Mailpit helpers (READ in full)
- `tests/tests/setup/setupFromTemplate.ts` — generic setup helper (READ in full)
- `tests/tests/setup/baseV1.setup.ts` + `.teardown.ts` — chain pattern (READ in full)
- `tests/tests/setup/perm-disable-election-1co.setup.ts` — perm setup template (READ in full)
- `packages/dev-seed/src/templates/permutations/perm-disable-election-1co.ts` — perm template shape (READ in full)
- `tests/playwright.config.ts` — project graph (READ in full)
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` — spec shape template (READ first 200 lines + spot-checks)
- `tests/tests/specs/perm/perm-disable-election-1co.spec.ts` — perm spec template (READ in full)
- `tests/tests/specs/candidate/candidate-registration.spec.ts` — registration utility usage (READ first 120 lines)
- `tests/tests/utils/supabaseAdminClient.ts` — sendEmail / forceRegister / unregisterCandidate (READ key methods)
- `tests/tests/utils/testIds.ts` — central testid namespace (READ in full)
- `apps/frontend/src/routes/candidate/login/+page.svelte` — login testids + canSubmit gate (READ in full)
- `apps/frontend/src/routes/candidate/forgot-password/+page.svelte` — forgot-password testids (READ in full)
- `apps/frontend/src/routes/candidate/register/password/+page.svelte` — password-setter testid passthrough (READ in full)
- `apps/frontend/src/routes/candidate/(protected)/+page.svelte` — candidate home three-task state (READ in full)
- `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` — profile testids + nominations + required gating (READ in full)
- `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` — questions-overview + Expander shape (READ in full)
- `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` — question page + Hero snippet (READ in full)
- `apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte` — preview via EntityDetails (READ in full)
- `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte` — modal vs direct logout discrimination (READ in full)
- `apps/frontend/src/lib/components/hero/Hero.svelte` + `Hero.type.ts` — content shape discrimination (READ in full)
- `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` — ToU checkbox testid (READ in full)
- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte` — testid passthrough props (READ in full)
- `packages/dev-seed/src/templates/baseV1.ts` — full structure (READ first 300 + sections 540-1000 + nominations 1450-1750)
- `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` — voter question hero + info snippets (READ relevant section)
- `.planning/REQUIREMENTS.md` — v2.10 milestone requirements (READ in full — confirmed Phase 89 has no direct REQ entry)
- `.planning/STATE.md` — current milestone status (READ header)

### Secondary (MEDIUM confidence)
- Inferred testid additions for surfaces not yet read in full (e.g., `Input.svelte` image-error testid landing site, `EntityDetails.svelte` reuse inside preview) — verify during 89-02 fixture authoring; testids may already exist or need adding.

### Tertiary (LOW confidence)
- Exact wording of Supabase invite/recovery email subjects (depends on GoTrue version) — handle via loose regex in `emailBucket.expectEmail`.

---

## Metadata

**Confidence breakdown:**
- Plan partition + architecture: HIGH — fully locked by CONTEXT.md
- baseV1 mutations: HIGH — schema + field shapes verified in dev-seed types + existing rows
- Voter-mega assertions: HIGH — spec shape + helper patterns established at 88-04
- 12 candidate fixtures inventory: MEDIUM — surface enumerated from TIR4 + spec walkthrough; some methods (`uploadPortrait` error states) need final verification against `Input.svelte` during 89-02 implementation
- Candidate-mega spec shape: HIGH — 22 step structure derives directly from TIR4:107-256
- Perm templates + specs: HIGH — 88-03 perm-* lineage well-established
- Legacy retirement scope: HIGH — D-89-04 explicit cuts; only the per-PageObject audit needs grep-confirmation at 89-LAST execution time
- testid additions catalog: MEDIUM — primary additions confirmed; secondary surfaces require fixture-authoring-time verification (89-02)

**Research date:** 2026-05-29
**Valid until:** 2026-06-28 (30 days, stable test-refactor domain — no fast-moving dependencies)

## RESEARCH COMPLETE
