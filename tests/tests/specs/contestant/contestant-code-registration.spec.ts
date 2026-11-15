import { createRegistrationTest, expect } from '../../fixtures/contestant/contestant-registration';
import {
  CODE_REGISTRATION_ADDRESS_PREFIX,
  REGISTRATION_ORGANIZATION_EXTERNAL_ID
} from '../../utils/invitationConstants';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

/**
 * # Registering with a registration code
 *
 * An organization invited with a registration code, followed through the browser: the code typed on the registration screen, an address entered and confirmed, the screen that says an email was sent, the mailed link opened as received, a password chosen, the terms of use accepted, and the organization's home. Then what the same screens do with a code that is already used, and with a code that names nothing.
 *
 * ## What it covers
 *
 * - A valid code, typed in lower case and without its separators, leads to the screen that asks for an address. Two addresses that differ are told so; the same address twice makes the one link request, which hands one mail over. The mailed link signs the user in and claims the invitation, the set-password view names the account, and after the password and the terms the organization's home is shown.
 * - A used code leads to the password sign-in every time it is entered. That screen has no field for an address. A wrong password is refused there, and the claimant's password signs in and lands on the organization's home.
 * - The link button of that screen mails the claimant. The screen that follows shows no address and no way back to one, and the claimant's address is on no screen and in no place a browser keeps. The mailed link lands on the home with no password asked for.
 * - A corrected address asked for with the same code inside the wait adds one sentence to the screen, and the server sends nothing for it.
 * - A code that names nothing is told one sentence, each time it is checked, with the code left in its field.
 * - The two screens a code leads to, opened by their addresses with no code held, end on the registration screen with no mode chosen.
 * - Neither a code nor an address is ever in the address bar, a web storage, a cookie the page can read or the history state.
 * - What each input of the screens a code leads to, and of the set-password view, tells a browser about what it holds.
 *
 * ## What it writes
 *
 * Code invitations on the organization the base dataset reserves for registration tests, the users the link requests and the mailed links create, with the passwords and the terms acceptances they are given, and the grants their claims write. Every address begins with the spec's own prefix. `beforeAll` and `afterEach` remove every user under the prefix, with their grants and invitations, and every invitation on the reserved organization, claimed ones included, and make the organization unconfirmed again; `afterAll` asserts that nothing is left. The organization has no nomination, so nothing the spec writes is read by a voter.
 *
 * ## How much it asks of the server
 *
 * Four mailed links are verified and two password sign-ins are made with a code, one of them refused. The auth service admits thirty of each in five minutes from one address of origin. A used code is looked up at most twice in a test, where the server admits ten look-ups of one code in fifteen minutes.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch around an expectation). No expectation takes a registration code, a link, a token or a password as its subject.
 */

const test = createRegistrationTest({
  addressPrefix: CODE_REGISTRATION_ADDRESS_PREFIX,
  dedicatedRows: { organization: REGISTRATION_ORGANIZATION_EXTERNAL_ID }
});

/** The organization the invitations name, as the dataset names it. */
const INVITED_ORGANIZATION: EntityGrantTarget = {
  entityType: 'organization',
  externalId: REGISTRATION_ORGANIZATION_EXTERNAL_ID
};

/** The password the user chooses. It meets every rule the set-password view lists. */
const CHOSEN_PASSWORD = 'C0de!Path-Vrk3-wy';

/** A password no user of the spec has. */
const WRONG_PASSWORD = 'N0t-This-One!Zx7q';

/** A registration code as a user types it who keeps neither its capitals nor its separators. */
function typedByHand(code: string): string {
  return code.toLowerCase().replace(/[^0-9a-z]/g, '');
}

// Every visitor starts signed out.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('registering with a registration code', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ invitationFlow }) => {
    await invitationFlow.resetDedicatedRows();
  });

  test.afterEach(async ({ invitationFlow }) => {
    await invitationFlow.resetDedicatedRows();
  });

  test.afterAll(async ({ invitationFlow }) => {
    expect(await invitationFlow.leftovers()).toEqual({ invitations: 0, users: 0 });
    expect(await invitationFlow.leftoversUnderPrefix()).toEqual({ invitations: 0, users: 0 });
  });

  test('register: an invited organization registers with a code', async ({
    page,
    invitationFlow,
    contestantRegisterPage,
    contestantEmailSentPage,
    contestantSetPasswordGate,
    contestantTermsOfUsePage,
    contestantEntityHomePage,
    flowState
  }) => {
    // A code invitation for the reserved organization, and an address nobody has used.
    const { code } = await invitationFlow.seedCodeInvitation('organization', { confirmEntity: true });
    const organization = await invitationFlow.readDedicatedRow('organization');
    const address = invitationFlow.freshAddress();
    const typed = typedByHand(code);

    // The registration screen lists the two modes the project allows. The code mode is chosen with the pointer and opens its panel alone.
    await contestantRegisterPage.open();
    await contestantRegisterPage.expectListedModes(['email', 'code']);
    await contestantRegisterPage.chooseMode('code');
    await contestantRegisterPage.expectSelectedMode('code');
    await contestantRegisterPage.expectPanelOpen('code');

    // The code goes in as a user types it, without its capitals and its separators, and leads to the screen that asks for an address.
    await contestantRegisterPage.expectCodeInputAttributes();
    await contestantRegisterPage.typeCode(typed);
    await contestantRegisterPage.pressContinue();
    await contestantRegisterPage.expectEmailEntryShown();
    await flowState.expectNothingOutsideMemory([code, typed]);

    // Two addresses that differ are told so when the confirmation is left.
    await contestantRegisterPage.expectEmailEntryInputAttributes();
    await contestantRegisterPage.typeEmails(address, invitationFlow.freshAddress());
    await contestantRegisterPage.leaveConfirmation();
    await contestantRegisterPage.expectMismatch();

    // The same address twice, and Continue. The page's one request carries a completion witness, which says what its background work did.
    await contestantRegisterPage.typeEmails(address, address);
    const outcome = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantRegisterPage.pressEmailEntryContinue();
    });
    await contestantEmailSentPage.expectShown({ wording: 'signIn', address });
    expect(outcome, 'the link request handed a mail over').toBe('sent');
    await flowState.expectNothingOutsideMemory([address, code, typed]);

    // The mailed link is opened as received, on the run's origin. A user with no password is asked to choose one first, in a form that tells a browser which account the password is for.
    await page.goto(await invitationFlow.signInLinkToOpen(address, { locale: 'en' }));
    await contestantSetPasswordGate.expectShown();
    await contestantSetPasswordGate.expectAddress(address);
    await contestantSetPasswordGate.expectUsernameField(address);
    await contestantSetPasswordGate.expectInputAttributes();
    await contestantSetPasswordGate.setPassword(CHOSEN_PASSWORD);
    await contestantTermsOfUsePage.expectShown();
    await contestantTermsOfUsePage.acceptAndAdvance();

    // The organization's home, with the grant the claim wrote.
    await contestantEntityHomePage.expectLanded(INVITED_ORGANIZATION);
    expect(await invitationFlow.grantRowsOf(address)).toEqual([
      invitationFlow.promisedGrant('organization', organization)
    ]);
  });

  test('used code: the same code leads to the password sign-in, and signs in', async ({
    invitationFlow,
    contestantRegisterPage,
    contestantEntityHomePage,
    flowState
  }) => {
    // A code a user has registered with, and that user's password.
    const { code, claimant } = await invitationFlow.seedUsedCode('organization', {
      confirmEntity: true,
      acceptTermsOfUse: true
    });

    // The used code leads to the password sign-in, which asks for no address.
    await contestantRegisterPage.open();
    await contestantRegisterPage.chooseMode('code');
    await contestantRegisterPage.typeCode(code);
    await contestantRegisterPage.pressContinue();
    await contestantRegisterPage.expectCodeSignInShown();
    await contestantRegisterPage.expectNoAddressField();
    await contestantRegisterPage.expectCodeSignInInputAttributes();
    await flowState.expectNothingOutsideMemory([code, claimant.email]);
    await flowState.expectNothingShown([claimant.email]);

    // Back on the registration screen, the same code entered again leads there again.
    await contestantRegisterPage.followCodeSignInReturn();
    await contestantRegisterPage.expectShown();
    await contestantRegisterPage.chooseMode('code');
    await contestantRegisterPage.typeCode(code);
    await contestantRegisterPage.pressContinue();
    await contestantRegisterPage.expectCodeSignInShown();

    // A password that is not the claimant's is refused, on the same screen.
    await contestantRegisterPage.typePassword(WRONG_PASSWORD);
    await contestantRegisterPage.pressSignIn();
    await contestantRegisterPage.expectRefusal();
    await contestantRegisterPage.expectNoAddressField();

    // The claimant's password signs in and lands on the organization's home.
    await contestantRegisterPage.typePassword(claimant.password);
    await contestantRegisterPage.pressSignIn();
    await contestantEntityHomePage.expectLanded(INVITED_ORGANIZATION);
  });

  test('used code, link: "I have not set a password yet" mails the claimant, and the screen shows no address', async ({
    page,
    invitationFlow,
    contestantRegisterPage,
    contestantEmailSentPage,
    contestantSetPasswordGate,
    contestantEntityHomePage,
    flowState
  }) => {
    // A code a user has registered with. The claimant's address is typed on no screen of this test.
    const { code, claimant } = await invitationFlow.seedUsedCode('organization', {
      confirmEntity: true,
      acceptTermsOfUse: true
    });

    await contestantRegisterPage.open();
    await contestantRegisterPage.chooseMode('code');
    await contestantRegisterPage.typeCode(code);
    await contestantRegisterPage.pressContinue();
    await contestantRegisterPage.expectCodeSignInShown();

    // The link button makes one request, which carries the code and no address. Its work mails the claimant.
    const outcome = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantRegisterPage.pressRequestLink();
    });
    expect(outcome, 'the link request handed a mail over').toBe('sent');

    // The screen that follows shows no address and no way back to one, and the claimant's address is nowhere a visitor could read it.
    await contestantEmailSentPage.expectShown({ wording: 'code' });
    await contestantEmailSentPage.expectResendWaiting();
    await flowState.expectNothingShown([claimant.email]);
    await flowState.expectNothingOutsideMemory([code, claimant.email]);

    // The mail went to the claimant's address: the registration's mail and this one. Its link, opened as received, lands on the home with no password asked for.
    await invitationFlow.expectMailCount(claimant.email, 2);
    await page.goto(await invitationFlow.signInLinkToOpen(claimant.email, { locale: 'en' }));
    await contestantEntityHomePage.expectLanded(INVITED_ORGANIZATION);
    await contestantSetPasswordGate.expectGone();
  });

  test('asked again on the code path: a corrected address inside the count adds one sentence', async ({
    page,
    invitationFlow,
    contestantRegisterPage,
    contestantEmailSentPage,
    flowState
  }) => {
    const { code } = await invitationFlow.seedCodeInvitation('organization', { confirmEntity: true });
    const mistyped = invitationFlow.freshAddress();
    const corrected = invitationFlow.freshAddress();

    // The code and a first address: the screen that says an email was sent, without the sentence about asking again.
    await contestantRegisterPage.open();
    await contestantRegisterPage.chooseMode('code');
    await contestantRegisterPage.typeCode(code);
    await contestantRegisterPage.pressContinue();
    await contestantRegisterPage.expectEmailEntryShown();
    await contestantRegisterPage.typeEmails(mistyped, mistyped);
    const first = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantRegisterPage.pressEmailEntryContinue();
    });
    await contestantEmailSentPage.expectShown({ wording: 'signIn', address: mistyped });
    await contestantEmailSentPage.expectAskedAgain(false);
    expect(first, 'the first request handed a mail over').toBe('sent');

    // "Use another email address" leads back to the screen that asks for an address, which still holds the code.
    await contestantEmailSentPage.followChangeAddress();
    await contestantRegisterPage.expectEmailEntryShown();
    await contestantRegisterPage.typeEmails(corrected, corrected);
    const second = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantRegisterPage.pressEmailEntryContinue();
    });

    // The same screen for the corrected address, with the one sentence more. The code was bound to an address a moment ago, so the server sent nothing for the second request.
    await contestantEmailSentPage.expectShown({ wording: 'signIn', address: corrected });
    await contestantEmailSentPage.expectAskedAgain(true);
    await invitationFlow.expectNoMailAfter(second, { address: corrected, noAccount: true });
    await flowState.expectNothingOutsideMemory([code, mistyped, corrected]);
  });

  test('unconfirmed: a code no project holds is told one sentence, twice', async ({
    invitationFlow,
    contestantRegisterPage,
    flowState
  }) => {
    const code = invitationFlow.unknownCode();

    await contestantRegisterPage.open();
    await contestantRegisterPage.chooseMode('code');
    await contestantRegisterPage.typeCode(code);

    // Checked: the one sentence, the code still in its field, and focus on the field.
    await contestantRegisterPage.pressContinue();
    await contestantRegisterPage.expectCodeUnconfirmed();

    // Checked again: the press takes focus from the field, and the same sentence gives it back.
    await contestantRegisterPage.pressContinue();
    await contestantRegisterPage.expectCodeUnconfirmed();

    // The visitor is still on the registration screen, with the code mode chosen, and the code is in no place a browser keeps.
    await contestantRegisterPage.expectShown();
    await contestantRegisterPage.expectSelectedMode('code');
    await flowState.expectNothingOutsideMemory([code]);
  });

  test('reload: the two screens a code leads to, opened with nothing held, end on the registration page', async ({
    contestantRegisterPage
  }) => {
    // The screen that asks for an address, opened by its address in a tab that holds no code.
    await contestantRegisterPage.openEmailEntryDirectly();
    await contestantRegisterPage.expectShown();
    await contestantRegisterPage.expectSelectedMode(null);

    // The password sign-in of a used code, opened the same way.
    await contestantRegisterPage.openCodeSignInDirectly();
    await contestantRegisterPage.expectShown();
    await contestantRegisterPage.expectSelectedMode(null);
  });
});
