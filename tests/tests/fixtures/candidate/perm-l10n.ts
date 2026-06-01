/**
 * @file Composition root for Phase 90 localisation-perm function-fixtures.
 *
 * Sibling to `candidate-mega.ts`. SEPARATE root (researcher 90-RESEARCH
 * §Pattern 4 + 90-PATTERNS §"perm-l10n.ts") to avoid bloating the
 * candidate-mega composition surface. Plans 90-03 + 90-04 both consume this
 * root.
 *
 * Re-exports `test` (Playwright extended) + `expect`. Specs:
 *
 *   import { test, expect } from '../../fixtures/candidate/perm-l10n';
 *
 * Includes (from candidate-mega):
 *   - candidateLoginPage
 *   - candidateProfilePage
 *   - candidateQuestionPage
 *   - candidateLogoutButton
 *   - candidatePasswordSetter
 *   - candidateTermsOfUsePage
 *   - candidateHomePage
 *   - candidateQuestionsOverviewPage
 *   - emailBucket  (for the Inbucket registration flow — see Pitfall 3)
 *
 * Plus 2 NEW fixtures (Plan 90-03 Task 2):
 *   - langSelector             — function-fixture for LanguageSelection NavGroup
 *   - multilingualTextField    — function-fixture for Input.svelte
 *                                 multilingual surface (scoped by Locator)
 *
 * Plus the `recipientEmail` option fixture (Open Question 4 RESOLVED +
 * `candidate-mega.ts:87` recipient-filter contract). Specs override per-perm
 * via `test.use({ recipientEmail: 'candidate-l10n-neg-aa@test.openvaa.local' })`
 * to prevent cross-perm Inbucket pollution.
 *
 * **Rigidity contract** (TIR5:5-13 + Phase 88 lineage):
 *  - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *    `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createCandidateHomePage } from './candidateHomePage.fixture';
import { createCandidateLoginPage } from './candidateLoginPage.fixture';
import { createCandidateLogoutButton } from './candidateLogoutButton.fixture';
import { createCandidatePasswordSetter } from './candidatePasswordSetter.fixture';
import { createCandidateProfilePage } from './candidateProfilePage.fixture';
import { createCandidateQuestionPage } from './candidateQuestionPage.fixture';
import { createCandidateQuestionsOverviewPage } from './candidateQuestionsOverviewPage.fixture';
import { createCandidateTermsOfUsePage } from './candidateTermsOfUsePage.fixture';
import { createEmailBucket } from './emailBucket.fixture';
import { createLangSelector } from './langSelectorFixture.fixture';
import { createMultilingualTextField } from './multilingualTextFieldFixture.fixture';
import { createVoterNav } from './voterNavFixture.fixture';
import type { CandidateHomePageFixture } from './candidateHomePage.fixture';
import type { CandidateLoginPageFixture } from './candidateLoginPage.fixture';
import type { CandidateLogoutButtonFixture } from './candidateLogoutButton.fixture';
import type { CandidatePasswordSetterFixture } from './candidatePasswordSetter.fixture';
import type { CandidateProfilePageFixture } from './candidateProfilePage.fixture';
import type { CandidateQuestionPageFixture } from './candidateQuestionPage.fixture';
import type { CandidateQuestionsOverviewPageFixture } from './candidateQuestionsOverviewPage.fixture';
import type { CandidateTermsOfUsePageFixture } from './candidateTermsOfUsePage.fixture';
import type { EmailBucketFixture } from './emailBucket.fixture';
import type { LangSelectorFixture } from './langSelectorFixture.fixture';
import type { MultilingualTextFieldFixture } from './multilingualTextFieldFixture.fixture';
import type { VoterNavFixture } from './voterNavFixture.fixture';

type PermL10nFixtureOptions = {
  /**
   * Mailpit recipient address for the emailBucket fixture. Specs set this
   * via `test.use({ recipientEmail: '...' })` at file scope. Default points
   * at a placeholder that should be overridden per-perm — Plan 90-03 sets
   * `'candidate-l10n-neg-aa@test.openvaa.local'`, Plan 90-04 sets
   * `'candidate-l10n-pos-aa@test.openvaa.local'`.
   */
  recipientEmail: string;
};

type PermL10nFixtures = PermL10nFixtureOptions & {
  emailBucket: EmailBucketFixture;
  candidateLoginPage: CandidateLoginPageFixture;
  candidateTermsOfUsePage: CandidateTermsOfUsePageFixture;
  candidateHomePage: CandidateHomePageFixture;
  candidatePasswordSetter: CandidatePasswordSetterFixture;
  candidateProfilePage: CandidateProfilePageFixture;
  candidateQuestionsOverviewPage: CandidateQuestionsOverviewPageFixture;
  candidateQuestionPage: CandidateQuestionPageFixture;
  candidateLogoutButton: CandidateLogoutButtonFixture;
  langSelector: LangSelectorFixture;
  multilingualTextField: MultilingualTextFieldFixture;
  voterNav: VoterNavFixture;
};

export const test = base.extend<PermL10nFixtures>({
  recipientEmail: ['candidate-l10n-aa@test.openvaa.local', { option: true }],

  emailBucket: async ({ page, recipientEmail }, use) => {
    await use(createEmailBucket(page, recipientEmail));
  },
  candidateLoginPage: async ({ page }, use) => {
    await use(createCandidateLoginPage(page));
  },
  candidateTermsOfUsePage: async ({ page }, use) => {
    await use(createCandidateTermsOfUsePage(page));
  },
  candidateHomePage: async ({ page }, use) => {
    await use(createCandidateHomePage(page));
  },
  candidatePasswordSetter: async ({ page }, use) => {
    await use(createCandidatePasswordSetter(page));
  },
  candidateProfilePage: async ({ page }, use) => {
    await use(createCandidateProfilePage(page));
  },
  candidateQuestionsOverviewPage: async ({ page }, use) => {
    await use(createCandidateQuestionsOverviewPage(page));
  },
  candidateQuestionPage: async ({ page }, use) => {
    await use(createCandidateQuestionPage(page));
  },
  candidateLogoutButton: async ({ page }, use) => {
    await use(createCandidateLogoutButton(page));
  },
  langSelector: async ({ page }, use) => {
    await use(createLangSelector(page));
  },
  multilingualTextField: async ({ page }, use) => {
    await use(createMultilingualTextField(page));
  },
  voterNav: async ({ page }, use) => {
    await use(createVoterNav(page));
  }
});

export { expect };
