/**
 * @file Composition root for the invitation landing spec.
 *
 * Consumed by `specs/contestant/invitation-landing.spec.ts`: where a claim lands a user in the browser.
 *
 * Surface:
 *   - `test`   — Playwright test extended with the invitation flow, bound to the landing spec's own address prefix, the confirm page a mailed link opens, and the three pages a claimed project-scope promise can land on or be refused at.
 *   - `expect` — re-exported from @playwright/test.
 *
 * The invitation flow is worker-scoped, so `beforeAll`, `afterEach` and `afterAll` speak in its steps too. The page fixtures are test-scoped.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createAuthConfirmPage } from './authConfirmPage.fixture';
import { createContestantLoginPage } from './contestantLoginPage.fixture';
import { createContestantNothingToEditPage } from './contestantNothingToEditPage.fixture';
import { INVITATION_LANDING_ADDRESS_PREFIX } from '../../utils/invitationConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { createAdminLoginPage } from '../admin/adminLoginPage.fixture';
import { createInvitationFlow } from '../shared/invitationFlow.fixture';
import type { AdminLoginPageFixture } from '../admin/adminLoginPage.fixture';
import type { InvitationFlowFixture } from '../shared/invitationFlow.fixture';
import type { AuthConfirmPageFixture } from './authConfirmPage.fixture';
import type { ContestantLoginPageFixture } from './contestantLoginPage.fixture';
import type { ContestantNothingToEditPageFixture } from './contestantNothingToEditPage.fixture';

type InvitationLandingFixtures = {
  adminLoginPage: AdminLoginPageFixture;
  authConfirmPage: AuthConfirmPageFixture;
  contestantLoginPage: ContestantLoginPageFixture;
  contestantNothingToEditPage: ContestantNothingToEditPageFixture;
};

type InvitationLandingWorkerFixtures = {
  invitationFlow: InvitationFlowFixture;
};

export const test = base.extend<InvitationLandingFixtures, InvitationLandingWorkerFixtures>({
  invitationFlow: [
    async ({}, use) => {
      await use(createInvitationFlow(new SupabaseAdminClient(), { addressPrefix: INVITATION_LANDING_ADDRESS_PREFIX }));
    },
    { scope: 'worker' }
  ],
  adminLoginPage: async ({ page }, use) => {
    await use(createAdminLoginPage(page));
  },
  authConfirmPage: async ({ page }, use) => {
    await use(createAuthConfirmPage(page));
  },
  contestantLoginPage: async ({ page }, use) => {
    await use(createContestantLoginPage(page));
  },
  contestantNothingToEditPage: async ({ page }, use) => {
    await use(createContestantNothingToEditPage(page));
  }
});

export { expect };
