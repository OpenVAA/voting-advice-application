/**
 * @file The screens of the Contestant App's entry flow at two phone widths: none of them is wider than the viewport.
 *
 * ## What it measures
 *
 * Ten screens, each at 320 and at 390 pixels wide under the suite's phone descriptor (`isMobile` and `hasTouch`), in English: the login screen; the sign-in screen; the registration screen with the email option open and with the code option open; the screen that asks for the address of a valid code; the screen that signs in the holder of a used code; the screen that says an email was sent, for an address whose local part is as long as a local part can be; the forgot-password page; the set-password view; and the password-reset page. Each test reaches its screen in page-object steps, which assert the screen's own frame, and then asserts that the document is no wider than its viewport. On the two screens that show an address, the "email sent" screen and the set-password view, the address is also asserted to lie inside the screen's frame and to show its whole text in its box.
 *
 * ## The sessions
 *
 * The signed-out screens are opened with no session. The set-password view is opened under the stored session of the user whose account has no password (`PASSWORDLESS_STORAGE_STATE`), whose address is as long as a local part can be; nothing here saves a password or signs out, because the axe scans of the same view load the same file. The password-reset page is opened under the stored session of the base candidate's user, as it is shown after a mailed recovery link.
 *
 * ## What it writes
 *
 * Two code invitations, one on each of the two candidates the base dataset reserves for the scans of the signed-out screens, under that spec's address prefix: the project runs after that spec, whose last hook removes everything it made. One code stays open, and the other is used by a user the flow registers with it. Neither candidate has a nomination, so nothing the spec writes is read by a voter. `beforeAll` first removes everything an earlier run may have left, and `afterAll` removes the users under the prefix with their grants and invitations, the invitations on both candidates, makes both unconfirmed again, and asserts that nothing is left.
 *
 * ## How much it asks of the server
 *
 * No password sign-in, and one mailed link verified by the seeding. Each code is checked twice, inside the server's ten look-ups of one code in fifteen minutes. The two link requests for the long addresses name addresses nobody was invited with and nobody holds, which are mailed nothing.
 *
 * Rigidity contract: hard assertions only, no soft assertion, no try/catch around an expectation, no fixed wait, and no locator: every element is reached through a page object or the geometry fixture.
 */

import { expect, test } from '@playwright/test';
import { STORAGE_STATE } from '../../../playwright.config';
import { createContestantEmailSentPage } from '../../fixtures/contestant/contestantEmailSentPage.fixture';
import { createContestantForgotPasswordPage } from '../../fixtures/contestant/contestantForgotPasswordPage.fixture';
import { createContestantLoginPage } from '../../fixtures/contestant/contestantLoginPage.fixture';
import { createContestantPasswordResetPage } from '../../fixtures/contestant/contestantPasswordResetPage.fixture';
import { createContestantRegisterPage } from '../../fixtures/contestant/contestantRegisterPage.fixture';
import { createContestantSetPasswordGate } from '../../fixtures/contestant/contestantSetPasswordGate.fixture';
import { createInvitationFlow } from '../../fixtures/shared/invitationFlow.fixture';
import { createPageGeometry } from '../../fixtures/shared/pageGeometry.fixture';
import {
  ENTRY_SCAN_ADDRESS_PREFIX,
  ENTRY_SCAN_OPEN_CODE_CANDIDATE_EXTERNAL_ID,
  ENTRY_SCAN_USED_CODE_CANDIDATE_EXTERNAL_ID
} from '../../utils/invitationConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { PASSWORDLESS_STORAGE_STATE, TEST_CANDIDATE_EMAIL, TEST_PASSWORDLESS_EMAIL } from '../../utils/testCredentials';
import type { Page } from '@playwright/test';
import type { ContestantRegisterPageFixture } from '../../fixtures/contestant/contestantRegisterPage.fixture';

/** The two widths, each with the height of a phone of that width. */
const PHONE_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 }
];

/** The longest local part an email address can have, in characters. */
const LOCAL_PART_MAX_LENGTH = 64;

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

/** The codes `beforeAll` seeds, held in the memory of the worker that runs this file. */
const seeded: { open?: string; used?: string } = {};

/**
 * The code `beforeAll` seeded.
 *
 * @throws Error when the hook has not seeded it. The message names which code, never the code.
 */
function seededCode(which: 'open' | 'used'): string {
  const code = seeded[which];
  if (code === undefined) throw new Error(`contestant-entry-phone: the ${which} code was not seeded`);
  return code;
}

/**
 * An address nobody was invited with and nobody holds, under the prefix, with a local part of exactly {@link LOCAL_PART_MAX_LENGTH} characters. Unique per call. After the prefix the local part has no hyphen or dot, so nothing in it offers a line break.
 */
function longFreshAddress(): string {
  const unique = crypto.randomUUID().replaceAll('-', '');
  return `${`${ENTRY_SCAN_ADDRESS_PREFIX}${unique}`.padEnd(LOCAL_PART_MAX_LENGTH, 'x')}@test.openvaa.local`;
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

for (const viewport of PHONE_VIEWPORTS) {
  const width = viewport.width;

  test.describe(`signed out, ${width}px wide`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true });

    test(`phone ${width}: the login screen does not overflow`, async ({ page }) => {
      const loginPage = createContestantLoginPage(page);
      await loginPage.openEntryDirectly();
      await loginPage.expectEntryShown();
      await createPageGeometry(page).expectNoHorizontalOverflow();
    });

    test(`phone ${width}: the sign-in screen does not overflow`, async ({ page }) => {
      const loginPage = createContestantLoginPage(page);
      await loginPage.openSignIn();
      await loginPage.signInScriptLoaded();
      await createPageGeometry(page).expectNoHorizontalOverflow();
    });

    test(`phone ${width}: the registration screen with the email option open does not overflow`, async ({ page }) => {
      const registerPage = createContestantRegisterPage(page);
      await registerPage.open();
      await registerPage.chooseMode('email');
      await registerPage.expectPanelOpen('email');
      await createPageGeometry(page).expectNoHorizontalOverflow();
    });

    test(`phone ${width}: the registration screen with the code option open does not overflow`, async ({ page }) => {
      const registerPage = createContestantRegisterPage(page);
      await registerPage.open();
      await registerPage.chooseMode('code');
      await registerPage.expectPanelOpen('code');
      await createPageGeometry(page).expectNoHorizontalOverflow();
    });

    test(`phone ${width}: the screen that asks for the address of a valid code does not overflow`, async ({ page }) => {
      const registerPage = await continueWithCode(page, seededCode('open'));
      await registerPage.expectEmailEntryShown();
      await createPageGeometry(page).expectNoHorizontalOverflow();
    });

    test(`phone ${width}: the screen that signs in the holder of a used code does not overflow`, async ({ page }) => {
      const registerPage = await continueWithCode(page, seededCode('used'));
      await registerPage.expectCodeSignInShown();
      await createPageGeometry(page).expectNoHorizontalOverflow();
    });

    test(`phone ${width}: the "email sent" screen with the longest address does not overflow, and the address stays inside it`, async ({
      page
    }) => {
      const address = longFreshAddress();
      const loginPage = createContestantLoginPage(page);
      await loginPage.openSignIn();
      await loginPage.signInScriptLoaded();
      await loginPage.typeEmail(address);
      await loginPage.pressRequestLink();
      const emailSentPage = createContestantEmailSentPage(page, new SupabaseAdminClient());
      await emailSentPage.expectShown({ wording: 'signIn', address });
      await createPageGeometry(page).expectNoHorizontalOverflow();
      await emailSentPage.expectAddressInsideScreen();
    });

    test(`phone ${width}: the forgot-password page does not overflow`, async ({ page }) => {
      const forgotPasswordPage = createContestantForgotPasswordPage(page);
      await forgotPasswordPage.open();
      await forgotPasswordPage.expectShown();
      await createPageGeometry(page).expectNoHorizontalOverflow();
    });
  });

  test.describe(`with no password, ${width}px wide`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true, storageState: PASSWORDLESS_STORAGE_STATE });

    test(`phone ${width}: the set-password view does not overflow, and the address stays inside it`, async ({
      page
    }) => {
      const setPasswordGate = createContestantSetPasswordGate(page);
      await setPasswordGate.open();
      await setPasswordGate.expectAddress(TEST_PASSWORDLESS_EMAIL);
      await createPageGeometry(page).expectNoHorizontalOverflow();
      await setPasswordGate.expectAddressInsideView();
    });
  });

  test.describe(`signed in, ${width}px wide`, () => {
    test.use({ viewport, isMobile: true, hasTouch: true, storageState: STORAGE_STATE });

    test(`phone ${width}: the password-reset page does not overflow`, async ({ page }) => {
      const passwordResetPage = createContestantPasswordResetPage(page);
      await passwordResetPage.openDirectly();
      await passwordResetPage.expectShown();
      await passwordResetPage.expectAddress(TEST_CANDIDATE_EMAIL);
      await createPageGeometry(page).expectNoHorizontalOverflow();
    });
  });
}
