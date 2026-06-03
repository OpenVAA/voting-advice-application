/**
 * @file Composition root for the candidate function-fixtures — Phase 89 Plan 02.
 *
 * Sibling to `tests/tests/fixtures/voter/views.ts` (the voter / results
 * composition root) and `tests/tests/fixtures/voter/voter-journey.fixture.ts`.
 *
 * Consumed by the candidate-journey spec (`candidate-journey.spec.ts`,
 * renamed to `candidate-journey.spec.ts` in Plan 05) in Plan 89-03.
 *
 * Surface:
 *   - `test`   — Playwright test extended with 11 candidate fixtures +
 *                a `recipientEmail` option fixture wired through
 *                `emailBucket`.
 *   - `expect` — re-exported from @playwright/test.
 *
 * Usage (89-03 spec, illustrative):
 * ```ts
 * import { test, expect } from '../../fixtures/candidate/candidate-journey';
 *
 * test.use({ recipientEmail: 'unregistered-aa@test.openvaa.local' });
 *
 * test('candidate journey', async ({ candidateLoginPage, emailBucket, ... }) => {
 *   await candidateLoginPage.login('...', '...');
 *   await emailBucket.expectEmail(/Welcome/);
 *   // ...
 * });
 * ```
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6, inherited):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createCandidateForgotPasswordPage } from './candidateForgotPasswordPage.fixture';
import { createCandidateHomePage } from './candidateHomePage.fixture';
import { createCandidateLoginPage } from './candidateLoginPage.fixture';
import { createCandidateLogoutButton } from './candidateLogoutButton.fixture';
import { createCandidatePasswordSetter } from './candidatePasswordSetter.fixture';
import { createCandidatePreviewPage } from './candidatePreviewPage.fixture';
import { createCandidateProfilePage } from './candidateProfilePage.fixture';
import { createCandidateQuestionPage } from './candidateQuestionPage.fixture';
import { createCandidateQuestionsOverviewPage } from './candidateQuestionsOverviewPage.fixture';
import { createCandidateTermsOfUsePage } from './candidateTermsOfUsePage.fixture';
import { createEmailBucket } from '../shared/emailBucket.fixture';
import type { EmailBucketFixture } from '../shared/emailBucket.fixture';
import type { CandidateForgotPasswordPageFixture } from './candidateForgotPasswordPage.fixture';
import type { CandidateHomePageFixture } from './candidateHomePage.fixture';
import type { CandidateLoginPageFixture } from './candidateLoginPage.fixture';
import type { CandidateLogoutButtonFixture } from './candidateLogoutButton.fixture';
import type { CandidatePasswordSetterFixture } from './candidatePasswordSetter.fixture';
import type { CandidatePreviewPageFixture } from './candidatePreviewPage.fixture';
import type { CandidateProfilePageFixture } from './candidateProfilePage.fixture';
import type { CandidateQuestionPageFixture } from './candidateQuestionPage.fixture';
import type { CandidateQuestionsOverviewPageFixture } from './candidateQuestionsOverviewPage.fixture';
import type { CandidateTermsOfUsePageFixture } from './candidateTermsOfUsePage.fixture';

type CandidateJourneyFixtureOptions = {
  /**
   * The Mailpit recipient address for the emailBucket fixture. Spec sets
   * this via `test.use({ recipientEmail: '...' })` at file scope. Default:
   * `'unregistered-aa@test.openvaa.local'` — matches the unregistered
   * candidate added to base in Plan 89-01 per Wave-0 R8.
   */
  recipientEmail: string;
};

type CandidateJourneyFixtures = CandidateJourneyFixtureOptions & {
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

export const test = base.extend<CandidateJourneyFixtures>({
  recipientEmail: ['unregistered-aa@test.openvaa.local', { option: true }],

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
  candidateForgotPasswordPage: async ({ page }, use) => {
    await use(createCandidateForgotPasswordPage(page));
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
  candidatePreviewPage: async ({ page }, use) => {
    await use(createCandidatePreviewPage(page));
  },
  candidateLogoutButton: async ({ page }, use) => {
    await use(createCandidateLogoutButton(page));
  }
});

export { expect };
