/**
 * @file Composition root for the Admin App's account-flow spec.
 *
 * Consumed by `specs/admin/admin-account-flows.spec.ts`: an invited admin followed through the Admin App's own account screens.
 *
 * Surface:
 *   - `test`   — Playwright test extended with the invitation flow, bound to the spec's own address prefix and to the candidate reserved for the spec, the Admin App's login page, its forgot-password, "email sent" and password-reset pages, and its set-password view; and the Contestant App's forgot-password page and set-password view, where an admin who starts from the Contestant App begins and which such an admin must never be shown, and its login page and entity home, which an admin who also edits a candidate reaches; and the header's Log out, whose sign-out request a test can make fail and whose steps seed and read the Contestant App's drafts.
 *   - `createAdminForgotPasswordPage(page)`, `createAdminEmailSentPage(page)`, `createAdminPasswordResetPage(page)` — the Admin App's three pages, built over the shared screens' fixtures with the Admin App's routes and root test ids, for a scan's reach, which is handed a page and no fixture.
 *   - `recoverPasswordInTheAdminApp(fixtures, email, oldPassword)` — the recovery of an admin with an account and a password, from the Admin App's login to the Admin home, and the sign-ins with the old and the new password after it.
 *   - `signInThenLoseEveryGrant(fixtures, target, password)` — a user who edits one entity signs in to the Contestant App, a draft of the Contestant App is stored in the browser, and the user's one grant is then removed, so the session's grants open neither app.
 *   - `expect` — re-exported from @playwright/test.
 *
 * The invitation flow is worker-scoped, so `beforeAll`, `afterEach` and `afterAll` speak in its steps too. The page fixtures are test-scoped.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createAdminLoginPage } from './adminLoginPage.fixture';
import { createAdminSetPasswordGate } from './adminSetPasswordGate.fixture';
import { ADMIN_ACCOUNT_FLOWS_ADDRESS_PREFIX, ADMIN_FLOWS_CANDIDATE_EXTERNAL_ID } from '../../utils/invitationConstants';
import { openMailedLink } from '../../utils/mailedLink';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import { createContestantEmailSentPage } from '../contestant/contestantEmailSentPage.fixture';
import { createContestantEntityHomePage } from '../contestant/contestantEntityHomePage.fixture';
import { createContestantForgotPasswordPage } from '../contestant/contestantForgotPasswordPage.fixture';
import { createContestantLoginPage } from '../contestant/contestantLoginPage.fixture';
import { createContestantPasswordResetPage } from '../contestant/contestantPasswordResetPage.fixture';
import { createContestantSetPasswordGate } from '../contestant/contestantSetPasswordGate.fixture';
import { createHeaderLogout } from '../shared/headerLogout.fixture';
import { createInvitationFlow } from '../shared/invitationFlow.fixture';
import type { Page } from '@playwright/test';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';
import type { ContestantEmailSentPageFixture } from '../contestant/contestantEmailSentPage.fixture';
import type { ContestantEntityHomePageFixture } from '../contestant/contestantEntityHomePage.fixture';
import type { ContestantForgotPasswordPageFixture } from '../contestant/contestantForgotPasswordPage.fixture';
import type { ContestantLoginPageFixture } from '../contestant/contestantLoginPage.fixture';
import type { ContestantPasswordResetPageFixture } from '../contestant/contestantPasswordResetPage.fixture';
import type { ContestantSetPasswordGateFixture } from '../contestant/contestantSetPasswordGate.fixture';
import type { HeaderLogoutFixture } from '../shared/headerLogout.fixture';
import type { InvitationFlowFixture } from '../shared/invitationFlow.fixture';
import type { AdminLoginPageFixture } from './adminLoginPage.fixture';
import type { AdminSetPasswordGateFixture } from './adminSetPasswordGate.fixture';

type AdminAccountFlowsFixtures = {
  adminLoginPage: AdminLoginPageFixture;
  adminForgotPasswordPage: ContestantForgotPasswordPageFixture;
  adminEmailSentPage: ContestantEmailSentPageFixture;
  adminPasswordResetPage: ContestantPasswordResetPageFixture;
  adminSetPasswordGate: AdminSetPasswordGateFixture;
  contestantForgotPasswordPage: ContestantForgotPasswordPageFixture;
  contestantSetPasswordGate: ContestantSetPasswordGateFixture;
  contestantLoginPage: ContestantLoginPageFixture;
  contestantEntityHomePage: ContestantEntityHomePageFixture;
  headerLogout: HeaderLogoutFixture;
};

type AdminAccountFlowsWorkerFixtures = {
  invitationFlow: InvitationFlowFixture;
};

export const test = base.extend<AdminAccountFlowsFixtures, AdminAccountFlowsWorkerFixtures>({
  invitationFlow: [
    async ({}, use) => {
      await use(
        createInvitationFlow(new SupabaseAdminClient(), {
          addressPrefix: ADMIN_ACCOUNT_FLOWS_ADDRESS_PREFIX,
          dedicatedRows: { candidate: ADMIN_FLOWS_CANDIDATE_EXTERNAL_ID }
        })
      );
    },
    { scope: 'worker' }
  ],
  adminLoginPage: async ({ page }, use) => {
    await use(createAdminLoginPage(page));
  },
  adminForgotPasswordPage: async ({ page }, use) => {
    await use(createAdminForgotPasswordPage(page));
  },
  adminEmailSentPage: async ({ page }, use) => {
    await use(createAdminEmailSentPage(page));
  },
  adminPasswordResetPage: async ({ page }, use) => {
    await use(createAdminPasswordResetPage(page));
  },
  adminSetPasswordGate: async ({ page }, use) => {
    await use(createAdminSetPasswordGate(page));
  },
  contestantForgotPasswordPage: async ({ page }, use) => {
    await use(createContestantForgotPasswordPage(page));
  },
  contestantSetPasswordGate: async ({ page }, use) => {
    await use(createContestantSetPasswordGate(page));
  },
  contestantLoginPage: async ({ page }, use) => {
    await use(createContestantLoginPage(page));
  },
  contestantEntityHomePage: async ({ page }, use) => {
    await use(createContestantEntityHomePage(page, new SupabaseAdminClient()));
  },
  headerLogout: async ({ page }, use) => {
    await use(createHeaderLogout(page));
  }
});

/**
 * The Admin App's forgot-password page, which renders the shared screen under its own route and root test id and leads to its own "email sent" page.
 *
 * @param page - The page.
 */
export function createAdminForgotPasswordPage(page: Page): ContestantForgotPasswordPageFixture {
  return createContestantForgotPasswordPage(page, {
    route: 'AdminAppForgotPassword',
    container: testIds.admin.forgotPassword.page,
    emailSentContainer: testIds.admin.emailSent.page
  });
}

/**
 * The Admin App's "email sent" page, which renders the shared screen under its own route and root test id.
 *
 * @param page - The page.
 */
export function createAdminEmailSentPage(page: Page): ContestantEmailSentPageFixture {
  return createContestantEmailSentPage(page, new SupabaseAdminClient(), {
    route: 'AdminAppEmailSent',
    container: testIds.admin.emailSent.page
  });
}

/**
 * The Admin App's password-reset page, which renders the shared screen under its own route and root test id.
 *
 * @param page - The page.
 */
export function createAdminPasswordResetPage(page: Page): ContestantPasswordResetPageFixture {
  return createContestantPasswordResetPage(page, {
    route: 'AdminAppResetPassword',
    container: testIds.admin.passwordReset.page
  });
}

/** The password an admin chooses on the Admin App's password-reset page. A credential: it is typed and never asserted on. */
const RECOVERED_PASSWORD = 'Rec0vered!Adm1n-Tp8w';

/**
 * An admin with an account and a password who forgot it recovers it through the Admin App: "Forgot Password?" on the login, the request sent and witnessed, the "email sent" page, the mailed recovery link opened on the password-reset page, a new password and the Admin home. Signed out again, the old password is refused at the Admin login and the new one admitted.
 *
 * @param fixtures - The test's invitation flow and the Admin App's pages.
 * @param email - The admin's address.
 * @param oldPassword - The password the admin holds before the recovery.
 */
export async function recoverPasswordInTheAdminApp(
  {
    page,
    invitationFlow,
    adminLoginPage,
    adminForgotPasswordPage,
    adminPasswordResetPage
  }: {
    page: Page;
    invitationFlow: InvitationFlowFixture;
    adminLoginPage: AdminLoginPageFixture;
    adminForgotPasswordPage: ContestantForgotPasswordPageFixture;
    adminPasswordResetPage: ContestantPasswordResetPageFixture;
  },
  email: string,
  oldPassword: string
): Promise<void> {
  await adminLoginPage.goToPage();
  await adminLoginPage.openForgotPassword();
  const outcome = await invitationFlow.witnessPageRequest(page, () => adminForgotPasswordPage.submit(email));
  expect(outcome, 'the page’s request handed a mail over').toBe('sent');
  await adminForgotPasswordPage.expectLedToEmailSent(email);

  await openMailedLink(page, await invitationFlow.recoveryLinkToOpen(email, { locale: 'en', next: '/admin' }));

  await adminPasswordResetPage.expectShown();
  await adminPasswordResetPage.expectAddress(email);
  await adminPasswordResetPage.setPassword(RECOVERED_PASSWORD);
  await adminLoginPage.expectAdminHome();

  await page.context().clearCookies();
  await adminLoginPage.goToPage();
  await adminLoginPage.login(email, oldPassword);
  await adminLoginPage.expectSignInRefused();
  await adminLoginPage.goToPage();
  await adminLoginPage.login(email, RECOVERED_PASSWORD);
  await adminLoginPage.expectAdminHome();
}

/**
 * A user who edits one entity signs in to the Contestant App and lands on the entity's home, which is awaited until it has hydrated; a draft of the Contestant App is stored in the browser; and the user's one grant is then removed, so that the session's grants open neither app. The session's token still carries the removed grant, which the application reads from the grants table and not from the token.
 *
 * @param fixtures - The test's invitation flow, the Contestant App's login page and entity home, and the header's Log out, whose steps store the draft.
 * @param target - The entity the user edits until the grant is removed.
 * @param password - The password the user signs in with. A credential: it is typed and never asserted on.
 * @returns The user's address.
 */
export async function signInThenLoseEveryGrant(
  {
    invitationFlow,
    contestantLoginPage,
    contestantEntityHomePage,
    headerLogout
  }: {
    invitationFlow: InvitationFlowFixture;
    contestantLoginPage: ContestantLoginPageFixture;
    contestantEntityHomePage: ContestantEntityHomePageFixture;
    headerLogout: HeaderLogoutFixture;
  },
  target: EntityGrantTarget,
  password: string
): Promise<string> {
  const admin = new SupabaseAdminClient();
  const email = invitationFlow.freshAddress();
  await admin.forceRegisterUser(email, password, { entityGrants: [target] });
  expect(await invitationFlow.grantRowsOf(email)).toEqual([await invitationFlow.editorGrantOn(target)]);

  await contestantLoginPage.goToPage();
  await contestantLoginPage.login(email, password);
  await contestantEntityHomePage.expectLanded(target);
  // The caller follows a link inside the application from this home, which the application's router takes only once the home has hydrated.
  await contestantEntityHomePage.expectHydrated();
  await headerLogout.seedContestantDraft();

  expect(await admin.revokeEntityGrant(email, target)).toBe(1);
  expect(await invitationFlow.grantRowsOf(email)).toEqual([]);
  return email;
}

export { expect };
