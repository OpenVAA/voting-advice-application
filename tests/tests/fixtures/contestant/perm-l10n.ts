/**
 * @file Composition root for the localisation-perm function-fixtures.
 *
 * Sibling to `contestant-journey.ts`. SEPARATE root to avoid bloating the contestant-journey composition surface. Consumed by the localisation-perm specs (negative + positive).
 *
 * Re-exports `test` (Playwright extended) + `expect`. Specs:
 *
 *   import { test, expect } from '../../fixtures/contestant/perm-l10n';
 *
 * Includes (from contestant-journey):
 *   - contestantLoginPage
 *   - contestantProfilePage
 *   - contestantQuestionPage
 *   - contestantLogoutButton
 *   - contestantPasswordSetter
 *   - contestantSetPasswordGate
 *   - contestantTermsOfUsePage
 *   - contestantHomePage
 *   - contestantQuestionsOverviewPage
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
import { createContestantHomePage } from './contestantHomePage.fixture';
import { createContestantLoginPage } from './contestantLoginPage.fixture';
import { createContestantLogoutButton } from './contestantLogoutButton.fixture';
import { createContestantPasswordSetter } from './contestantPasswordSetter.fixture';
import { createContestantProfilePage } from './contestantProfilePage.fixture';
import { createContestantQuestionPage } from './contestantQuestionPage.fixture';
import { createContestantQuestionsOverviewPage } from './contestantQuestionsOverviewPage.fixture';
import { createContestantSetPasswordGate } from './contestantSetPasswordGate.fixture';
import { createContestantTermsOfUsePage } from './contestantTermsOfUsePage.fixture';
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
import type { ContestantHomePageFixture } from './contestantHomePage.fixture';
import type { ContestantLoginPageFixture } from './contestantLoginPage.fixture';
import type { ContestantLogoutButtonFixture } from './contestantLogoutButton.fixture';
import type { ContestantPasswordSetterFixture } from './contestantPasswordSetter.fixture';
import type { ContestantProfilePageFixture } from './contestantProfilePage.fixture';
import type { ContestantQuestionPageFixture } from './contestantQuestionPage.fixture';
import type { ContestantQuestionsOverviewPageFixture } from './contestantQuestionsOverviewPage.fixture';
import type { ContestantSetPasswordGateFixture } from './contestantSetPasswordGate.fixture';
import type { ContestantTermsOfUsePageFixture } from './contestantTermsOfUsePage.fixture';

type PermL10nFixtureOptions = {
  /**
   * Mailpit recipient address for the emailBucket fixture. Specs set this via `test.use({ recipientEmail: '...' })` at file scope. Default points at a placeholder that should be overridden per-perm — the negative spec sets `'candidate-l10n-neg-aa@test.openvaa.local'`, the positive spec sets `'candidate-l10n-pos-aa@test.openvaa.local'`.
   */
  recipientEmail: string;
};

type PermL10nFixtures = PermL10nFixtureOptions & {
  emailBucket: EmailBucketFixture;
  contestantLoginPage: ContestantLoginPageFixture;
  contestantTermsOfUsePage: ContestantTermsOfUsePageFixture;
  contestantHomePage: ContestantHomePageFixture;
  contestantPasswordSetter: ContestantPasswordSetterFixture;
  contestantSetPasswordGate: ContestantSetPasswordGateFixture;
  contestantProfilePage: ContestantProfilePageFixture;
  contestantQuestionsOverviewPage: ContestantQuestionsOverviewPageFixture;
  contestantQuestionPage: ContestantQuestionPageFixture;
  contestantLogoutButton: ContestantLogoutButtonFixture;
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
  contestantLoginPage: async ({ page }, use) => {
    await use(createContestantLoginPage(page));
  },
  contestantTermsOfUsePage: async ({ page }, use) => {
    await use(createContestantTermsOfUsePage(page));
  },
  contestantHomePage: async ({ page }, use) => {
    await use(createContestantHomePage(page));
  },
  contestantPasswordSetter: async ({ page }, use) => {
    await use(createContestantPasswordSetter(page));
  },
  contestantSetPasswordGate: async ({ page }, use) => {
    await use(createContestantSetPasswordGate(page));
  },
  contestantProfilePage: async ({ page }, use) => {
    await use(createContestantProfilePage(page));
  },
  contestantQuestionsOverviewPage: async ({ page }, use) => {
    await use(createContestantQuestionsOverviewPage(page));
  },
  contestantQuestionPage: async ({ page }, use) => {
    await use(createContestantQuestionPage(page));
  },
  contestantLogoutButton: async ({ page }, use) => {
    await use(createContestantLogoutButton(page));
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
