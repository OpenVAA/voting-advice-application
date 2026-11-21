import {
  createAdminForgotPasswordPage,
  createAdminPasswordResetPage,
  expect,
  recoverPasswordInTheAdminApp,
  test
} from '../../fixtures/admin/admin-account-flows';
import { createAdminLoginPage } from '../../fixtures/admin/adminLoginPage.fixture';
import { createAdminSetPasswordGate } from '../../fixtures/admin/adminSetPasswordGate.fixture';
import { createInvitationFlow } from '../../fixtures/shared/invitationFlow.fixture';
import { buildRoute } from '../../utils/buildRoute';
import { declareEntryScans } from '../../utils/entryAxeScan';
import { ADMIN_ENTRY_SCAN_ADDRESS_PREFIX, ADMIN_FLOWS_CANDIDATE_EXTERNAL_ID } from '../../utils/invitationConstants';
import { openMailedLink } from '../../utils/mailedLink';
import { E2E_PROJECT_ID, SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

/**
 * # The Admin App's account flows
 *
 * An invited admin followed through the Admin App's own account screens, from the mailed link to the Admin home.
 *
 * ## The cases
 *
 * - An admin invited to the project, with no account and so no password, asks for a sign-in link and opens it. On the Admin home the Admin App shows its own set-password view in place of the page, naming the account by its address; once a password is saved the Admin home renders, and the admin holds the project's admin grant the claim wrote. Where the link first lands is not asserted: the Admin App's protected pages are what ask for the password.
 * - An admin invited to the project, with no account, for whom a recovery mail is asked as the Admin App asks for one. The address has only an invitation, so the sign-in mail is sent, and its link names the Admin App; opened, it lands in the Admin App, which shows its set-password view at once, with no navigation of the test's own. Once a password is saved the Admin home renders.
 *
 * - An admin invited to the project, with no account, starts from the Admin App's login: "I have not set a password yet" leads to the forgot-password page, the address is typed there and the request is sent. The "email sent" page shows the recovery wording and the address; the mailed link names the Admin App, and opened it shows the Admin App's set-password view, after which the Admin home renders.
 * - A project admin with an account and a password who forgot it presses "Forgot Password?" on the Admin App's login and sends the request; the recovery link names the Admin App and lands on its password-reset page, where a new password is set and the Admin home renders. Signed out again, the old password is refused at the Admin login and the new one admitted.
 * - An admin of the suite project's account, who holds no grant on the project itself, recovers a password the same way: an account grant on the project's account earns the recovery mail. So does a global admin, whose one grant is at global scope.
 * - An admin invited to the project, with no account, starts from the Contestant App's forgot-password page. The mailed link names no app and lands in the Contestant App, which sends a session whose grants open only the Admin App on to the Admin home: the Admin App's set-password view is shown there and the Contestant App's never is.
 * - A project admin with a password who is also the editor of the spec's reserved candidate signs in to the Admin App and reaches its home, and, signed out, signs in to the Contestant App with the same password and reaches the candidate's home there.
 * - A candidate invited by email, with no account, starts from the Admin App's login: "I have not set a password yet" leads to its forgot-password page and the request is sent. The mailed link names the Admin App, but the claim gives the user only the candidate's editor grant, so the link lands in the Contestant App, which asks for a password; once one is saved the Contestant App's set-password view is gone, and the password signs the user in to the Contestant App.
 * - An admin of another project only, whose one grant is on the stack's default project, is refused at the Admin App's login with the message that the user is not authorized, and holds no session: a grant counts in this project only when it is on the project, on its account or at global scope.
 * - A candidate signed in to the Contestant App who opens the Admin App's home by its address, a full page load, is signed out there and lands on the Admin App's login, which says the user is not authorized; the Contestant App then asks for a sign-in.
 * - A mailed link the Admin App asked for that cannot be used, with a token nobody issued and then with none, lands on the Admin App's login, which says the link could not be used.
 *
 * ## What it scans
 *
 * Five states, each in the light theme and in a browser context created dark, through `declareEntryScans`: the login page with both of its links to the forgot-password page, the forgot-password page as it opens, the "email sent" page after a request for an address nobody holds (which is mailed nothing), the set-password view an invited admin is shown on the Admin home, and the password-reset page a signed-in admin opens.
 *
 * ## What it writes
 *
 * Users whose address begins with the spec's own prefix, or with the scans' prefix, project-scope invitations for such addresses, the grants their claims write, an account grant on the suite project's account, which reaches every project of that account, a global grant, which reaches every project of the stack, and an editor grant on the spec's reserved candidate, which is unconfirmed and has no nomination. Each test removes what it created and puts the reserved candidate back as the dataset seeds it; `beforeAll` removes what an interrupted run left and `afterAll` asserts that nothing is left. It writes on no entity a voter reads and seeds no entity invitation, so it changes nothing a voter reads.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch around an expectation). No expectation takes a link, a token or a password as its subject.
 */

/** The flow the scans' reaches use: a reach is handed a page and no fixture. The scans run beside the journeys, in a worker of their own, so they invent addresses under a prefix of their own and their hooks remove nothing of the journeys'. */
const scanFlow = createInvitationFlow(new SupabaseAdminClient(), { addressPrefix: ADMIN_ENTRY_SCAN_ADDRESS_PREFIX });

/** The password the admin chooses. A credential: it is typed and never asserted on. */
const CHOSEN_PASSWORD = 'Adm1n!Path-Qx7v';

/** The password an admin with an account holds before a recovery. A credential: it is typed and never asserted on. */
const OLD_PASSWORD = 'Old-Adm1n!Path-Rk4m';

/** The project `seed.sql` creates on every stack, which is not the suite's project. */
const OTHER_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

/** The candidate reserved for the spec, which an admin who uses both apps edits. */
const ADMIN_FLOWS_CANDIDATE: EntityGrantTarget = {
  entityType: 'candidate',
  externalId: ADMIN_FLOWS_CANDIDATE_EXTERNAL_ID
};

// Every test signs in from scratch.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("the Admin App's account flows", () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ invitationFlow }) => {
    await invitationFlow.removeEverythingUnderPrefix();
    await invitationFlow.resetDedicatedRows();
  });

  test.afterEach(async ({ invitationFlow }) => {
    await invitationFlow.removeEverythingUnderPrefix();
    await invitationFlow.resetDedicatedRows();
  });

  test.afterAll(async ({ invitationFlow }) => {
    expect(await invitationFlow.leftoversUnderPrefix()).toEqual({ invitations: 0, users: 0 });
    expect(await invitationFlow.leftovers()).toEqual({ invitations: 0, users: 0 });
  });

  test('an invited admin with no password who opens the Admin App is asked to choose one there and reaches the Admin home', async ({
    page,
    invitationFlow,
    adminLoginPage,
    adminSetPasswordGate
  }) => {
    const email = invitationFlow.freshAddress();
    await invitationFlow.seedProjectInvitation('admin', email, { confirmEntity: true });

    const request = await invitationFlow.askForLink({ email, locale: 'en' });
    expect(request.outcome, 'the link request handed a mail over').toBe('sent');
    await openMailedLink(page, await invitationFlow.signInLinkToOpen(email, { locale: 'en' }));

    await adminLoginPage.goToHome();
    await adminSetPasswordGate.expectShown();
    await adminSetPasswordGate.expectEmail(email);

    await adminSetPasswordGate.setPassword(CHOSEN_PASSWORD);

    await adminLoginPage.expectAdminHome();
    expect(await invitationFlow.grantRowsOf(email)).toEqual([invitationFlow.projectGrant('admin')]);
  });

  test('a recovery request made for the Admin App mails an invited admin a link that lands in the Admin App', async ({
    page,
    invitationFlow,
    adminLoginPage,
    adminSetPasswordGate
  }) => {
    const email = invitationFlow.freshAddress();
    await invitationFlow.seedProjectInvitation('admin', email, { confirmEntity: true });

    const request = await invitationFlow.askForRecovery({ email, locale: 'en', app: 'admin' });
    expect(request.outcome, 'the recovery request handed a mail over').toBe('sent');
    await openMailedLink(page, await invitationFlow.signInLinkToOpen(email, { locale: 'en', next: '/admin' }));

    await adminSetPasswordGate.expectShown();
    await adminSetPasswordGate.expectEmail(email);
    await adminSetPasswordGate.setPassword(CHOSEN_PASSWORD);

    await adminLoginPage.expectAdminHome();
    expect(await invitationFlow.grantRowsOf(email)).toEqual([invitationFlow.projectGrant('admin')]);
  });

  test("an invited project admin who asks for a link from the Admin App's login sets a password in the Admin App and reaches the Admin home", async ({
    page,
    invitationFlow,
    adminLoginPage,
    adminForgotPasswordPage,
    adminSetPasswordGate
  }) => {
    const email = invitationFlow.freshAddress();
    await invitationFlow.seedProjectInvitation('admin', email, { confirmEntity: true });

    await adminLoginPage.goToPage();
    await adminLoginPage.openNoPasswordYet();
    const outcome = await invitationFlow.witnessPageRequest(page, () => adminForgotPasswordPage.submit(email));
    expect(outcome, 'the page’s request handed a mail over').toBe('sent');
    await adminForgotPasswordPage.expectLedToEmailSent(email);

    await openMailedLink(page, await invitationFlow.signInLinkToOpen(email, { locale: 'en', next: '/admin' }));

    await adminSetPasswordGate.expectShown();
    await adminSetPasswordGate.setPassword(CHOSEN_PASSWORD);
    await adminLoginPage.expectAdminHome();
    expect(await invitationFlow.grantRowsOf(email)).toEqual([invitationFlow.projectGrant('admin')]);
  });

  test('a project admin who forgot the password resets it in the Admin App and signs in with the new one', async ({
    page,
    invitationFlow,
    adminLoginPage,
    adminForgotPasswordPage,
    adminPasswordResetPage
  }) => {
    const email = invitationFlow.freshAddress();
    await new SupabaseAdminClient().forceRegisterAdmin(email, OLD_PASSWORD);

    await adminLoginPage.goToPage();
    await adminLoginPage.openForgotPassword();
    const outcome = await invitationFlow.witnessPageRequest(page, () => adminForgotPasswordPage.submit(email));
    expect(outcome, 'the page’s request handed a mail over').toBe('sent');
    await adminForgotPasswordPage.expectLedToEmailSent(email);

    await openMailedLink(page, await invitationFlow.recoveryLinkToOpen(email, { locale: 'en', next: '/admin' }));

    await adminPasswordResetPage.expectShown();
    await adminPasswordResetPage.expectAddress(email);
    await adminPasswordResetPage.setPassword(CHOSEN_PASSWORD);
    await adminLoginPage.expectAdminHome();

    await page.context().clearCookies();
    await adminLoginPage.goToPage();
    await adminLoginPage.login(email, OLD_PASSWORD);
    await adminLoginPage.expectSignInRefused();
    await adminLoginPage.goToPage();
    await adminLoginPage.login(email, CHOSEN_PASSWORD);
    await adminLoginPage.expectAdminHome();
  });

  test("an account admin who forgot the password gets a recovery mail on the Admin App's login and resets it there", async ({
    page,
    invitationFlow,
    adminLoginPage,
    adminForgotPasswordPage,
    adminPasswordResetPage
  }) => {
    const admin = new SupabaseAdminClient();
    const { email, password } = await invitationFlow.createUserWithPassword();
    const accountId = await admin.accountIdOfProject(E2E_PROJECT_ID);
    await admin.grantAccount(email, accountId, 'admin');
    expect(await invitationFlow.grantRowsOf(email)).toEqual([
      { scope: 'account', target_type: null, target_id: accountId, role: 'admin' }
    ]);

    await recoverPasswordInTheAdminApp(
      { page, invitationFlow, adminLoginPage, adminForgotPasswordPage, adminPasswordResetPage },
      email,
      password
    );
  });

  test("a global admin who forgot the password gets a recovery mail on the Admin App's login and resets it there", async ({
    page,
    invitationFlow,
    adminLoginPage,
    adminForgotPasswordPage,
    adminPasswordResetPage
  }) => {
    const { email, password } = await invitationFlow.createUserWithPassword();
    await new SupabaseAdminClient().grantGlobal(email, 'admin');
    expect(await invitationFlow.grantRowsOf(email)).toEqual([
      { scope: 'global', target_type: null, target_id: null, role: 'admin' }
    ]);

    await recoverPasswordInTheAdminApp(
      { page, invitationFlow, adminLoginPage, adminForgotPasswordPage, adminPasswordResetPage },
      email,
      password
    );
  });

  test("an invited project admin who asks for a link on the Contestant App's forgot-password page is sent to the Admin App and sets a password there", async ({
    page,
    invitationFlow,
    adminLoginPage,
    adminSetPasswordGate,
    contestantForgotPasswordPage,
    contestantSetPasswordGate
  }) => {
    const email = invitationFlow.freshAddress();
    await invitationFlow.seedProjectInvitation('admin', email, { confirmEntity: true });

    await contestantForgotPasswordPage.open();
    const outcome = await invitationFlow.witnessPageRequest(page, () => contestantForgotPasswordPage.submit(email));
    expect(outcome, 'the page’s request handed a mail over').toBe('sent');
    await contestantForgotPasswordPage.expectLedToEmailSent(email);

    await openMailedLink(page, await invitationFlow.signInLinkToOpen(email, { locale: 'en' }));

    await adminSetPasswordGate.expectShown();
    await contestantSetPasswordGate.expectGone();
    await adminSetPasswordGate.expectEmail(email);
    await adminSetPasswordGate.setPassword(CHOSEN_PASSWORD);

    await adminLoginPage.expectAdminHome();
    expect(await invitationFlow.grantRowsOf(email)).toEqual([invitationFlow.projectGrant('admin')]);
  });

  test("a user who holds an admin grant and a candidate's editor grant signs in to both apps and reaches each home", async ({
    page,
    invitationFlow,
    adminLoginPage,
    contestantLoginPage,
    contestantEntityHomePage
  }) => {
    const admin = new SupabaseAdminClient();
    const email = invitationFlow.freshAddress();
    await admin.forceRegisterAdmin(email, CHOSEN_PASSWORD);
    await admin.grantEntity(email, ADMIN_FLOWS_CANDIDATE);
    await admin.acceptTermsOfUse(email);
    const grants = await invitationFlow.grantRowsOf(email);
    expect(grants).toHaveLength(2);
    expect(grants).toEqual(
      expect.arrayContaining([
        invitationFlow.projectGrant('admin'),
        await invitationFlow.editorGrantOn(ADMIN_FLOWS_CANDIDATE)
      ])
    );

    await adminLoginPage.goToPage();
    await adminLoginPage.login(email, CHOSEN_PASSWORD);
    await adminLoginPage.expectAdminHome();

    await page.context().clearCookies();
    await contestantLoginPage.goToPage();
    await contestantLoginPage.login(email, CHOSEN_PASSWORD);
    await contestantEntityHomePage.expectLanded(ADMIN_FLOWS_CANDIDATE);
  });

  test("a candidate invited by email who asks for a link from the Admin App's login lands in the Contestant App and sets a password there", async ({
    page,
    invitationFlow,
    adminLoginPage,
    adminForgotPasswordPage,
    contestantLoginPage,
    contestantSetPasswordGate
  }) => {
    const email = invitationFlow.freshAddress();
    await invitationFlow.seedEmailInvitation('candidate', email, { confirmEntity: true });

    await adminLoginPage.goToPage();
    await adminLoginPage.openNoPasswordYet();
    const outcome = await invitationFlow.witnessPageRequest(page, () => adminForgotPasswordPage.submit(email));
    expect(outcome, 'the page’s request handed a mail over').toBe('sent');
    await adminForgotPasswordPage.expectLedToEmailSent(email);

    await openMailedLink(page, await invitationFlow.signInLinkToOpen(email, { locale: 'en', next: '/admin' }));

    await contestantSetPasswordGate.expectShown();
    await contestantSetPasswordGate.expectAddress(email);
    await contestantSetPasswordGate.setPassword(CHOSEN_PASSWORD);
    await contestantSetPasswordGate.expectGone();
    expect(await invitationFlow.grantRowsOf(email)).toEqual([
      await invitationFlow.editorGrantOn(ADMIN_FLOWS_CANDIDATE)
    ]);

    await page.context().clearCookies();
    await contestantLoginPage.goToPage();
    await contestantLoginPage.login(email, CHOSEN_PASSWORD);
    await contestantLoginPage.expectSignInNotShown();
    await contestantSetPasswordGate.expectGone();
  });

  test("an admin of another project only is refused at the Admin App's login, which says why", async ({
    invitationFlow,
    adminLoginPage
  }) => {
    const email = invitationFlow.freshAddress();
    await new SupabaseAdminClient(undefined, undefined, OTHER_PROJECT_ID).forceRegisterAdmin(email, CHOSEN_PASSWORD);
    expect(await invitationFlow.grantRowsOf(email)).toEqual([
      { scope: 'project', target_type: null, target_id: OTHER_PROJECT_ID, role: 'admin' }
    ]);

    await adminLoginPage.goToPage();
    await adminLoginPage.login(email, CHOSEN_PASSWORD);
    await adminLoginPage.expectSaysNotAuthorized();

    await adminLoginPage.goToHome();
    await adminLoginPage.expectLoginAddressSaysLoginFailed();
  });

  test("a candidate signed in to the Contestant App who opens the Admin App by its address is signed out on the Admin App's login, which says why", async ({
    invitationFlow,
    adminLoginPage,
    contestantLoginPage,
    contestantEntityHomePage
  }) => {
    const email = invitationFlow.freshAddress();
    await new SupabaseAdminClient().forceRegisterUser(email, CHOSEN_PASSWORD, {
      entityGrants: [ADMIN_FLOWS_CANDIDATE]
    });
    expect(await invitationFlow.grantRowsOf(email)).toEqual([
      await invitationFlow.editorGrantOn(ADMIN_FLOWS_CANDIDATE)
    ]);

    await contestantLoginPage.goToPage();
    await contestantLoginPage.login(email, CHOSEN_PASSWORD);
    await contestantEntityHomePage.expectLanded(ADMIN_FLOWS_CANDIDATE);

    await adminLoginPage.goToHome();
    await adminLoginPage.expectLoginAddressSaysNotAuthorized();
    await adminLoginPage.expectSaysNotAuthorized();

    await contestantEntityHomePage.open();
    await contestantLoginPage.expectOnEntry();
  });
});

// Writes nothing, so it needs no cleanup and runs apart from the journeys.
test.describe('a link the Admin App asked for that cannot be used', () => {
  test("a mailed link the Admin App asked for that cannot be used lands on the Admin App's login, which says so", async ({
    page,
    adminLoginPage
  }) => {
    const confirmPage = buildRoute({ route: 'AuthConfirm', locale: 'en' });

    await openMailedLink(page, `${confirmPage}?token_hash=a-token-nobody-issued&type=magiclink&next=%2Fadmin`);
    await adminLoginPage.expectSaysLinkFailed();

    await page.goto(`${confirmPage}?type=magiclink&next=%2Fadmin`);
    await adminLoginPage.expectSaysLinkFailed();
  });
});

// Not serial: each scan stands alone, so one that fails leaves the others to run.
test.describe("the Admin App's entry screens", () => {
  test.beforeAll(async () => {
    await scanFlow.removeEverythingUnderPrefix();
  });

  test.afterEach(async () => {
    await scanFlow.removeEverythingUnderPrefix();
  });

  test.afterAll(async () => {
    expect(await scanFlow.leftoversUnderPrefix()).toEqual({ invitations: 0, users: 0 });
  });

  declareEntryScans([
    {
      // The login page, with its two links to the forgot-password page.
      name: 'admin-login',
      routeId: 'AdminAppLogin',
      reach: async (page) => {
        await createAdminLoginPage(page).goToPage();
      },
      marker: { testId: testIds.admin.login.noPasswordYet },
      alsoShown: [{ testId: testIds.admin.login.forgotPassword }]
    },
    {
      // The forgot-password page as it opens.
      name: 'admin-forgot-password',
      routeId: 'AdminAppForgotPassword',
      reach: async (page) => {
        const forgotPasswordPage = createAdminForgotPasswordPage(page);
        await forgotPasswordPage.open();
        await forgotPasswordPage.expectShown();
      },
      marker: { testId: testIds.shared.account.forgotPassword.email },
      alsoShown: [{ testId: testIds.admin.forgotPassword.page }]
    },
    {
      // The "email sent" page after a request for an address nobody holds, in its recovery wording.
      name: 'admin-email-sent',
      routeId: 'AdminAppEmailSent',
      reach: async (page) => {
        const address = scanFlow.freshAddress();
        const forgotPasswordPage = createAdminForgotPasswordPage(page);
        await forgotPasswordPage.open();
        await forgotPasswordPage.submit(address);
        await forgotPasswordPage.expectLedToEmailSent(address);
      },
      marker: { testId: testIds.admin.emailSent.page, state: { attribute: 'data-wording', value: 'recovery' } }
    },
    {
      // The set-password view an invited admin with no password is shown on the Admin home.
      name: 'admin-set-password',
      routeId: 'AdminAppHome',
      reach: async (page) => {
        const email = scanFlow.freshAddress();
        await scanFlow.seedProjectInvitation('admin', email, { confirmEntity: true });
        const request = await scanFlow.askForLink({ email, locale: 'en' });
        expect(request.outcome, 'the link request handed a mail over').toBe('sent');
        await openMailedLink(page, await scanFlow.signInLinkToOpen(email, { locale: 'en' }));
        await createAdminLoginPage(page).goToHome();
        await createAdminSetPasswordGate(page).expectShown();
      },
      marker: { testId: testIds.admin.setPasswordGate.container }
    },
    {
      // The password-reset page, opened by a signed-in admin.
      name: 'admin-password-reset',
      routeId: 'AdminAppResetPassword',
      reach: async (page) => {
        const email = scanFlow.freshAddress();
        await new SupabaseAdminClient().forceRegisterAdmin(email, OLD_PASSWORD);
        const loginPage = createAdminLoginPage(page);
        await loginPage.goToPage();
        await loginPage.login(email, OLD_PASSWORD);
        await loginPage.expectAdminHome();
        const passwordResetPage = createAdminPasswordResetPage(page);
        await passwordResetPage.openDirectly();
        await passwordResetPage.expectShown();
      },
      marker: { testId: testIds.admin.passwordReset.page }
    }
  ]);
});
