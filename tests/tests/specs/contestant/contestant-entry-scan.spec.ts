/**
 * @file The accessibility scans of the Contestant App's entry screens that a visitor with no session meets, and the menu such a visitor is offered.
 *
 * ## What it scans
 *
 * Fourteen states, each in the light theme and in a browser context created dark, through `declareEntryScans` and so through the one shared `assertAxeScan`: the login screen with both of its entries; the sign-in screen as it opens, after a refused sign-in and with its email field in error; the registration screen with nothing chosen, with the email option open and after a code that names nothing; the screen that asks for the address of a valid code, as it opens and with two addresses that differ; the screen that signs in the holder of a used code; the screen that says an email was sent, in its three wordings; and the forgot-password page. Each state is reached in page-object steps and proved by a marker only that state renders, together with the address of its route, before the scan runs, so no scan can pass against a loading frame or against a screen a redirect led to.
 *
 * Beside the scans, one test opens the menu on the login screen and asserts its signed-out items: Sign in, one Register item, Forgot Password? and Support, each a link to its screen, and no item that leads to the pre-registration start or to a screen a registration code leads to. The menu is not scanned.
 *
 * ## What it writes
 *
 * Two code invitations, one on each of the two candidates the base dataset reserves for these scans, seeded through the invitation flow's steps in `beforeAll`: one stays open, and the other is used by a user the flow registers with it — a link asked for with the code and an address under the spec's own prefix, the mailed link verified, the invitation claimed and a password set. Neither candidate has a nomination, so nothing the spec writes is read by a voter. `beforeAll` first removes everything an earlier run may have left, and `afterAll` removes the users under the prefix with their grants and invitations, the invitations on both candidates, makes both unconfirmed again, and asserts that nothing is left.
 *
 * ## What it spends
 *
 * Nothing. The open code is checked and never bound to an address. The used code is checked and its sign-in screen asks for a link, which mails the code's claimant; nothing reads that mail. The two "email sent" states that show an address are reached with addresses nobody was invited with and nobody holds, which are mailed nothing. The codes are held in this file's memory alone and are never the subject of an expectation.
 *
 * ## How much it asks of the server
 *
 * Two password sign-ins, both refused, for an address nobody holds, and one mailed link verified by the seeding. Each code is checked four times, inside the server's ten look-ups of one code in fifteen minutes.
 *
 * Rigidity contract: hard assertions only, no soft assertion, no try/catch around an expectation, no fixed wait. Every element is reached through a page object; the spec names test ids only as reach markers.
 */

import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createContestantEmailSentPage } from '../../fixtures/contestant/contestantEmailSentPage.fixture';
import { createContestantForgotPasswordPage } from '../../fixtures/contestant/contestantForgotPasswordPage.fixture';
import { createContestantLoginPage } from '../../fixtures/contestant/contestantLoginPage.fixture';
import { createContestantRegisterPage } from '../../fixtures/contestant/contestantRegisterPage.fixture';
import { createInvitationFlow } from '../../fixtures/shared/invitationFlow.fixture';
import { createNavMenu } from '../../fixtures/shared/navMenu.fixture';
import { buildRoute } from '../../utils/buildRoute';
import { declareEntryScans } from '../../utils/entryAxeScan';
import {
  ENTRY_SCAN_ADDRESS_PREFIX,
  ENTRY_SCAN_OPEN_CODE_CANDIDATE_EXTERNAL_ID,
  ENTRY_SCAN_USED_CODE_CANDIDATE_EXTERNAL_ID
} from '../../utils/invitationConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { Page } from '@playwright/test';
import type { ContestantRegisterPageFixture } from '../../fixtures/contestant/contestantRegisterPage.fixture';

/** The flow that holds the open code: it names the candidate that code promises. */
const openCodeFlow = createInvitationFlow(new SupabaseAdminClient(), {
  addressPrefix: ENTRY_SCAN_ADDRESS_PREFIX,
  dedicatedRows: { candidate: ENTRY_SCAN_OPEN_CODE_CANDIDATE_EXTERNAL_ID }
});

/** The flow that holds the used code: it names the other candidate. A flow names one row of each kind, so the two candidates take two flows under the one prefix. */
const usedCodeFlow = createInvitationFlow(new SupabaseAdminClient(), {
  addressPrefix: ENTRY_SCAN_ADDRESS_PREFIX,
  dedicatedRows: { candidate: ENTRY_SCAN_USED_CODE_CANDIDATE_EXTERNAL_ID }
});

/** A password no user of the run has. */
const WRONG_PASSWORD = 'N0t-Anyone!s-Pw9';

/** The codes `beforeAll` seeds, held in the memory of the worker that runs this file. */
const seeded: { open?: string; used?: string } = {};

/**
 * The code `beforeAll` seeded.
 *
 * @throws Error when the hook has not seeded it. The message names which code, never the code.
 */
function seededCode(which: 'open' | 'used'): string {
  const code = seeded[which];
  if (code === undefined) throw new Error(`contestant-entry-scan: the ${which} code was not seeded`);
  return code;
}

/**
 * Open the registration screen, choose the code mode and continue with a code. The caller asserts the screen the code leads to.
 */
async function continueWithCode(page: Page, code: string): Promise<ContestantRegisterPageFixture> {
  const registerPage = createContestantRegisterPage(page);
  await registerPage.open();
  await registerPage.chooseMode('code');
  await registerPage.expectPanelOpen('code');
  await registerPage.typeCode(code);
  await registerPage.pressContinue();
  return registerPage;
}

/** Open the sign-in screen and wait for its script, so that what the visitor does next is handled by the page and not posted as a new document. */
async function openSignIn(page: Page) {
  const loginPage = createContestantLoginPage(page);
  await loginPage.openSignIn();
  await loginPage.signInScriptLoaded();
  return loginPage;
}

/** An English message, read from its catalogue file. */
function englishMessage(file: string, wrapper: string, key: string): string {
  const catalogue = JSON.parse(
    fs.readFileSync(path.join(TESTS_DIR, `../../apps/frontend/messages/en/${file}.json`), 'utf8')
  );
  return catalogue[wrapper][key];
}

test.beforeAll(async () => {
  await openCodeFlow.removeEverythingUnderPrefix();
  await openCodeFlow.resetDedicatedRows();
  await usedCodeFlow.resetDedicatedRows();
  seeded.open = (await openCodeFlow.seedCodeInvitation('candidate', { confirmEntity: true })).code;
  seeded.used = (await usedCodeFlow.seedUsedCode('candidate', { confirmEntity: true })).code;
});

test.afterAll(async () => {
  await openCodeFlow.resetDedicatedRows();
  await usedCodeFlow.resetDedicatedRows();
  await openCodeFlow.removeEverythingUnderPrefix();
  expect(await openCodeFlow.leftovers()).toEqual({ invitations: 0, users: 0 });
  expect(await usedCodeFlow.leftovers()).toEqual({ invitations: 0, users: 0 });
  expect(await openCodeFlow.leftoversUnderPrefix()).toEqual({ invitations: 0, users: 0 });
});

declareEntryScans([
  {
    // The login screen with both entries: the base dataset lists two registration modes.
    name: 'entry-login',
    routeId: 'ContestantAppLogin',
    reach: async (page) => {
      const loginPage = createContestantLoginPage(page);
      await loginPage.openEntryDirectly();
      await loginPage.expectEntryShown();
      await loginPage.expectRegisterOffered(true);
    },
    marker: { testId: testIds.contestant.login.registerLink },
    alsoShown: [{ testId: testIds.contestant.login.page, attribute: 'data-register-offered', value: 'true' }]
  },
  {
    // The sign-in screen as it opens, with the button that asks for a link.
    name: 'entry-sign-in',
    routeId: 'ContestantAppSignIn',
    reach: async (page) => {
      const loginPage = await openSignIn(page);
      await loginPage.expectLinkButton(true);
    },
    marker: { testId: testIds.contestant.login.requestLink }
  },
  {
    // The sign-in screen after a wrong password for an address nobody holds.
    name: 'entry-sign-in-failed',
    routeId: 'ContestantAppSignIn',
    reach: async (page) => {
      const loginPage = await openSignIn(page);
      await loginPage.typeEmail(openCodeFlow.freshAddress());
      await loginPage.enterPassword(WRONG_PASSWORD);
      await loginPage.submit();
      await loginPage.expectWrongCredentials();
    },
    marker: { testId: testIds.contestant.login.errorMessage },
    alsoShown: [{ testId: testIds.contestant.login.signInPage, attribute: 'data-sign-in-state', value: 'failed' }]
  },
  {
    // The sign-in screen after its link button was pressed with no address: the field in error, with focus on it.
    name: 'entry-sign-in-email-required',
    routeId: 'ContestantAppSignIn',
    reach: async (page) => {
      const loginPage = await openSignIn(page);
      await loginPage.pressRequestLink();
      await loginPage.expectEmailError();
    },
    marker: { testId: testIds.contestant.login.emailError }
  },
  {
    // The registration screen with its two options and none chosen.
    name: 'entry-register',
    routeId: 'ContestantAppRegister',
    reach: async (page) => {
      const registerPage = createContestantRegisterPage(page);
      await registerPage.open();
      await registerPage.expectListedModes(['email', 'code']);
      await registerPage.expectSelectedMode(null);
    },
    marker: { testId: testIds.contestant.register.modeOption },
    alsoShown: [{ testId: testIds.contestant.register.page, attribute: 'data-mode-selected', value: '' }]
  },
  {
    // The registration screen with the email option open.
    name: 'entry-register-email',
    routeId: 'ContestantAppRegister',
    reach: async (page) => {
      const registerPage = createContestantRegisterPage(page);
      await registerPage.open();
      await registerPage.chooseMode('email');
      await registerPage.expectPanelOpen('email');
    },
    marker: { testId: testIds.contestant.register.modePanel, attribute: 'data-mode', value: 'email' }
  },
  {
    // The registration screen's code option after a code that no project holds.
    name: 'entry-register-code-unconfirmed',
    routeId: 'ContestantAppRegister',
    reach: async (page) => {
      const registerPage = await continueWithCode(page, openCodeFlow.unknownCode());
      await registerPage.expectCodeUnconfirmed();
    },
    marker: { testId: testIds.contestant.register.codeError, attribute: 'data-reason', value: 'unconfirmed' }
  },
  {
    // The screen that asks for the address of the open code, as it opens. Nothing is typed into it.
    name: 'entry-email-entry',
    routeId: 'ContestantAppRegisterEmail',
    reach: async (page) => {
      const registerPage = await continueWithCode(page, seededCode('open'));
      await registerPage.expectEmailEntryShown();
    },
    marker: { testId: testIds.contestant.register.emailEntryPage }
  },
  {
    // The same screen with two different addresses, after the second lost focus. Nothing is sent.
    name: 'entry-email-entry-mismatch',
    routeId: 'ContestantAppRegisterEmail',
    reach: async (page) => {
      const registerPage = await continueWithCode(page, seededCode('open'));
      await registerPage.expectEmailEntryShown();
      await registerPage.typeEmails(openCodeFlow.freshAddress(), openCodeFlow.freshAddress());
      await registerPage.leaveConfirmation();
      await registerPage.expectMismatch();
    },
    marker: { testId: testIds.contestant.emailEntry.confirmationError }
  },
  {
    // The screen that signs in the holder of the used code, as it opens.
    name: 'entry-code-sign-in',
    routeId: 'ContestantAppRegisterSignIn',
    reach: async (page) => {
      const registerPage = await continueWithCode(page, seededCode('used'));
      await registerPage.expectCodeSignInShown();
    },
    marker: { testId: testIds.contestant.register.signInPage }
  },
  {
    // The "email sent" screen after the sign-in screen's link button, for an address nobody was invited with: the sign-in wording, the address, and the count running.
    name: 'entry-email-sent',
    routeId: 'ContestantAppEmailSent',
    reach: async (page) => {
      const address = openCodeFlow.freshAddress();
      const loginPage = await openSignIn(page);
      await loginPage.typeEmail(address);
      await loginPage.pressRequestLink();
      await createContestantEmailSentPage(page, new SupabaseAdminClient()).expectShown({ wording: 'signIn', address });
    },
    marker: { testId: testIds.contestant.emailSent.countdown },
    alsoShown: [
      { testId: testIds.contestant.emailSent.page, attribute: 'data-wording', value: 'signIn' },
      { testId: testIds.contestant.emailSent.page, attribute: 'data-address', value: 'shown' }
    ]
  },
  {
    // The "email sent" screen after the used code's sign-in screen asked for a link: the link goes to the code's claimant, and no address is shown.
    name: 'entry-email-sent-code',
    routeId: 'ContestantAppEmailSent',
    reach: async (page) => {
      const registerPage = await continueWithCode(page, seededCode('used'));
      await registerPage.expectCodeSignInShown();
      await registerPage.pressRequestLink();
      await createContestantEmailSentPage(page, new SupabaseAdminClient()).expectShown({ wording: 'code' });
    },
    marker: { testId: testIds.contestant.emailSent.page, attribute: 'data-address', value: 'none' },
    alsoShown: [{ testId: testIds.contestant.emailSent.page, attribute: 'data-wording', value: 'code' }]
  },
  {
    // The "email sent" screen after the forgot-password page, for an address nobody holds.
    name: 'entry-email-sent-recovery',
    routeId: 'ContestantAppEmailSent',
    reach: async (page) => {
      const address = openCodeFlow.freshAddress();
      const forgotPasswordPage = createContestantForgotPasswordPage(page);
      await forgotPasswordPage.open();
      await forgotPasswordPage.submit(address);
      await forgotPasswordPage.expectLedToEmailSent(address);
    },
    marker: { testId: testIds.contestant.emailSent.page, attribute: 'data-wording', value: 'recovery' }
  },
  {
    // The forgot-password page as it opens.
    name: 'entry-forgot-password',
    routeId: 'ContestantAppForgotPassword',
    reach: async (page) => {
      const forgotPasswordPage = createContestantForgotPasswordPage(page);
      await forgotPasswordPage.open();
      await forgotPasswordPage.expectShown();
    },
    marker: { testId: testIds.contestant.forgotPassword.email }
  }
]);

test('menu: a signed-out visitor is offered Sign in, Register and Forgot Password?', async ({ page }) => {
  const loginPage = createContestantLoginPage(page);
  const navMenu = createNavMenu(page);
  await loginPage.openEntryDirectly();
  await loginPage.expectEntryShown();
  await navMenu.openMobileNav();

  // The four items, each the one item of its name and each a link to its screen.
  await navMenu.expectItemLeadsTo(
    englishMessage('common', 'common', 'login'),
    buildRoute({ route: 'ContestantAppLogin', locale: 'en' })
  );
  await navMenu.expectItemLeadsTo(
    englishMessage('contestantApp.register', 'contestantApp.register', 'register'),
    buildRoute({ route: 'ContestantAppRegister', locale: 'en' })
  );
  await navMenu.expectItemLeadsTo(
    englishMessage('contestantApp.login', 'contestantApp.login', 'forgotPassword'),
    buildRoute({ route: 'ContestantAppForgotPassword', locale: 'en' })
  );
  await navMenu.expectItemLeadsTo(
    englishMessage('contestantApp.help', 'contestantApp.help', 'title'),
    buildRoute({ route: 'ContestantAppHelp', locale: 'en' })
  );

  // No item leads to the pre-registration start or to either screen a registration code leads to.
  await navMenu.expectNoItemLeadsTo(buildRoute({ route: 'ContestantAppPreregister', locale: 'en' }));
  await navMenu.expectNoItemLeadsTo(buildRoute({ route: 'ContestantAppRegisterEmail', locale: 'en' }));
  await navMenu.expectNoItemLeadsTo(buildRoute({ route: 'ContestantAppRegisterSignIn', locale: 'en' }));
});
