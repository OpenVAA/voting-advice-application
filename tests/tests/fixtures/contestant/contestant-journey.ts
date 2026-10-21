/**
 * @file Composition root for the candidate function-fixtures.
 *
 * Sibling to `tests/tests/fixtures/voter/views.ts` (the voter / results composition root) and `tests/tests/fixtures/voter/voter-journey.fixture.ts`.
 *
 * Consumed by the contestant-journey spec (`contestant-journey.spec.ts`).
 *
 * Surface:
 *   - `test`   — Playwright test extended with 13 candidate fixtures, the `invitationFlow` steps a registration through an invitation is expressed in, and a `recipientEmail` option fixture wired through `emailBucket`.
 *   - `expect` — re-exported from @playwright/test.
 *
 * Usage (illustrative):
 * ```ts
 * import { test, expect } from '../../fixtures/contestant/contestant-journey';
 *
 * test.use({ recipientEmail: 'unregistered-aa@test.openvaa.local' });
 *
 * test('candidate journey', async ({ contestantLoginPage, emailBucket, ... }) => {
 *   await contestantLoginPage.login('...', '...');
 *   await emailBucket.expectEmail(/Welcome/);
 *   // ...
 * });
 * ```
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createContestantForgotPasswordPage } from './contestantForgotPasswordPage.fixture';
import { createContestantHomePage } from './contestantHomePage.fixture';
import { createContestantLoginPage } from './contestantLoginPage.fixture';
import { createContestantLogoutButton } from './contestantLogoutButton.fixture';
import { createContestantNominationsPage } from './contestantNominationsPage.fixture';
import { createContestantPasswordResetPage } from './contestantPasswordResetPage.fixture';
import { createContestantPasswordSetter } from './contestantPasswordSetter.fixture';
import { createContestantPreviewPage } from './contestantPreviewPage.fixture';
import { createContestantProfilePage } from './contestantProfilePage.fixture';
import { createContestantQuestionPage } from './contestantQuestionPage.fixture';
import { createContestantQuestionsOverviewPage } from './contestantQuestionsOverviewPage.fixture';
import { createContestantSetPasswordGate } from './contestantSetPasswordGate.fixture';
import { createContestantTermsOfUsePage } from './contestantTermsOfUsePage.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { createEmailBucket } from '../shared/emailBucket.fixture';
import { createInvitationFlow } from '../shared/invitationFlow.fixture';
import type { EmailBucketFixture } from '../shared/emailBucket.fixture';
import type { InvitationFlowFixture } from '../shared/invitationFlow.fixture';
import type { ContestantForgotPasswordPageFixture } from './contestantForgotPasswordPage.fixture';
import type { ContestantHomePageFixture } from './contestantHomePage.fixture';
import type { ContestantLoginPageFixture } from './contestantLoginPage.fixture';
import type { ContestantLogoutButtonFixture } from './contestantLogoutButton.fixture';
import type { ContestantNominationsPageFixture } from './contestantNominationsPage.fixture';
import type { ContestantPasswordResetPageFixture } from './contestantPasswordResetPage.fixture';
import type { ContestantPasswordSetterFixture } from './contestantPasswordSetter.fixture';
import type { ContestantPreviewPageFixture } from './contestantPreviewPage.fixture';
import type { ContestantProfilePageFixture } from './contestantProfilePage.fixture';
import type { ContestantQuestionPageFixture } from './contestantQuestionPage.fixture';
import type { ContestantQuestionsOverviewPageFixture } from './contestantQuestionsOverviewPage.fixture';
import type { ContestantSetPasswordGateFixture } from './contestantSetPasswordGate.fixture';
import type { ContestantTermsOfUsePageFixture } from './contestantTermsOfUsePage.fixture';

type ContestantJourneyFixtureOptions = {
  /**
   * The Mailpit recipient address for the emailBucket fixture. Spec sets this via `test.use({ recipientEmail: '...' })` at file scope. Default: `'unregistered-aa@test.openvaa.local'` — matches the unregistered candidate present in the base dataset.
   */
  recipientEmail: string;
};

type ContestantJourneyFixtures = ContestantJourneyFixtureOptions & {
  emailBucket: EmailBucketFixture;
  invitationFlow: InvitationFlowFixture;
  contestantLoginPage: ContestantLoginPageFixture;
  contestantTermsOfUsePage: ContestantTermsOfUsePageFixture;
  contestantHomePage: ContestantHomePageFixture;
  contestantForgotPasswordPage: ContestantForgotPasswordPageFixture;
  contestantPasswordResetPage: ContestantPasswordResetPageFixture;
  contestantPasswordSetter: ContestantPasswordSetterFixture;
  contestantSetPasswordGate: ContestantSetPasswordGateFixture;
  contestantProfilePage: ContestantProfilePageFixture;
  /** The nominations view of an entity, opened by its URL. */
  contestantNominationsPage: ContestantNominationsPageFixture;
  contestantQuestionsOverviewPage: ContestantQuestionsOverviewPageFixture;
  contestantQuestionPage: ContestantQuestionPageFixture;
  contestantPreviewPage: ContestantPreviewPageFixture;
  contestantLogoutButton: ContestantLogoutButtonFixture;
};

export const test = base.extend<ContestantJourneyFixtures>({
  recipientEmail: ['unregistered-aa@test.openvaa.local', { option: true }],

  emailBucket: async ({ page, recipientEmail }, use) => {
    await use(createEmailBucket(page, recipientEmail));
  },
  invitationFlow: async ({}, use) => {
    await use(createInvitationFlow());
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
  contestantForgotPasswordPage: async ({ page }, use) => {
    await use(createContestantForgotPasswordPage(page));
  },
  contestantPasswordResetPage: async ({ page }, use) => {
    await use(createContestantPasswordResetPage(page));
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
  contestantNominationsPage: async ({ page }, use) => {
    await use(createContestantNominationsPage(page, new SupabaseAdminClient()));
  },
  contestantQuestionsOverviewPage: async ({ page }, use) => {
    await use(createContestantQuestionsOverviewPage(page));
  },
  contestantQuestionPage: async ({ page }, use) => {
    await use(createContestantQuestionPage(page));
  },
  contestantPreviewPage: async ({ page }, use) => {
    await use(createContestantPreviewPage(page));
  },
  contestantLogoutButton: async ({ page }, use) => {
    await use(createContestantLogoutButton(page));
  }
});

export { expect };
