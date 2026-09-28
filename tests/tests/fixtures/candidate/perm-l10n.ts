/**
 * @file Composition root for the localisation-perm function-fixtures.
 *
 * Sibling to `candidate-journey.ts`. SEPARATE root to avoid bloating the candidate-journey composition surface. Consumed by the localisation-perm specs (negative + positive).
 *
 * Re-exports `test` (Playwright extended) + `expect`. Specs:
 *
 *   import { test, expect } from '../../fixtures/candidate/perm-l10n';
 *
 * Includes (from candidate-journey):
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
 * Plus 2 extra fixtures:
 *   - langSelector             — function-fixture for LanguageSelection NavGroup
 *   - multilingualTextField    — function-fixture for Input.svelte multilingual surface (scoped by Locator)
 *
 * Plus the `recipientEmail` option fixture. Specs override per-perm via `test.use({ recipientEmail: 'candidate-l10n-neg-aa@test.openvaa.local' })` to prevent cross-perm Inbucket pollution.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
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
import { createEmailBucket } from '../shared/emailBucket.fixture';
import { createLangSelector } from '../shared/langSelectorFixture.fixture';
import { createMultilingualTextField } from '../shared/multilingualTextFieldFixture.fixture';
import { createResultsPage } from '../voter/resultsPage.fixture';
import { createVoterHomePage } from '../voter/voterHomePage.fixture';
import { createVoterNav } from '../voter/voterNavFixture.fixture';
import type { EmailBucketFixture } from '../shared/emailBucket.fixture';
import type { LangSelectorFixture } from '../shared/langSelectorFixture.fixture';
import type { MultilingualTextFieldFixture } from '../shared/multilingualTextFieldFixture.fixture';
import type { ResultsPageFixture } from '../voter/resultsPage.fixture';
import type { VoterHomePageFixture } from '../voter/voterHomePage.fixture';
import type { VoterNavFixture } from '../voter/voterNavFixture.fixture';
import type { CandidateHomePageFixture } from './candidateHomePage.fixture';
import type { CandidateLoginPageFixture } from './candidateLoginPage.fixture';
import type { CandidateLogoutButtonFixture } from './candidateLogoutButton.fixture';
import type { CandidatePasswordSetterFixture } from './candidatePasswordSetter.fixture';
import type { CandidateProfilePageFixture } from './candidateProfilePage.fixture';
import type { CandidateQuestionPageFixture } from './candidateQuestionPage.fixture';
import type { CandidateQuestionsOverviewPageFixture } from './candidateQuestionsOverviewPage.fixture';
import type { CandidateTermsOfUsePageFixture } from './candidateTermsOfUsePage.fixture';

type PermL10nFixtureOptions = {
  /**
   * Mailpit recipient address for the emailBucket fixture. Specs set this via `test.use({ recipientEmail: '...' })` at file scope. Default points at a placeholder that should be overridden per-perm — the negative spec sets `'candidate-l10n-neg-aa@test.openvaa.local'`, the positive spec sets `'candidate-l10n-pos-aa@test.openvaa.local'`.
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
  // voter page fixtures carrying the goToPage/expectPageVisible paradigm, registered here so perm-localisation-positive can destructure them.
  voterHomePage: VoterHomePageFixture;
  resultsPage: ResultsPageFixture;
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
  },
  voterHomePage: async ({ page }, use) => {
    await use(createVoterHomePage(page));
  },
  resultsPage: async ({ page }, use) => {
    await use(createResultsPage(page));
  }
});

export { expect };
