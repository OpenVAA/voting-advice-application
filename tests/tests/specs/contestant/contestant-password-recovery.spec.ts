import { createRegistrationTest, expect } from '../../fixtures/contestant/contestant-registration';
import { PASSWORD_RECOVERY_ADDRESS_PREFIX, RECOVERY_CANDIDATE_EXTERNAL_ID } from '../../utils/invitationConstants';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

/**
 * # Recovering a password through a mailed link
 *
 * A user who has forgotten their password asks for a link on the forgot-password page, opens the mailed link in a browser that never asked for it, sets a new password and is signed in.
 *
 * ## What it covers
 *
 * - The sign-in screen leads to the forgot-password page. Submitting an address there makes one request and leads to the screen that says an email was sent, in the wording of a password recovery, with the address typed. The address is kept nowhere outside the page's memory.
 * - The mailed recovery link, opened as received in a browser context of its own with no session, signs the user in and lands on the password-reset page. The page names the account by its address, as text and in a field a password manager reads.
 * - A password saved there leaves the user signed in and on the home of the candidate they edit, also after a reload. A visitor with no session is then refused the old password with the sentence of wrong credentials, and signs in with the new one.
 * - The forgot-password page tells an outsider nothing about an address: for the address of a user who edits the candidate and for an address nobody holds, the screen that follows has the same states, text, count and controls. Only the first is mailed, which is read once each request's work is over, and the second has no account afterwards.
 * - An address that has an invitation and no account meets the same screen and is mailed the sign-in link. That link signs the user in, and the user is asked to choose a password before anything else.
 * - The password-reset page opened by its address with no session ends on the login screen, which says nothing about why the visitor is there.
 *
 * ## What it writes
 *
 * Users made with a password as the editor of the candidate the base dataset reserves for password-recovery tests, the new password one of them saves, an invitation on that candidate with the user its mailed link creates and the grant that user's claim writes. Every address begins with the spec's own prefix. `beforeAll` and `afterEach` remove every user under the prefix, with their grants and invitations, and every invitation on the reserved candidate, and make the candidate unconfirmed again; `afterAll` asserts that nothing is left. The candidate has no nomination, so nothing the spec writes is read by a voter.
 *
 * ## How much it asks of the auth service
 *
 * Two mailed links are opened. One password sign-in is refused and one is accepted. The auth service admits thirty link verifications and thirty password sign-ins in five minutes from one address of origin.
 *
 * Each test makes its own users and invitations, so the tests do not depend on each other. They run in the order written, in one worker, because they write on the one reserved candidate.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch around an expectation). No expectation takes a link, a token or a password as its subject.
 */

const test = createRegistrationTest({
  addressPrefix: PASSWORD_RECOVERY_ADDRESS_PREFIX,
  dedicatedRows: { candidate: RECOVERY_CANDIDATE_EXTERNAL_ID }
});

/** The candidate the spec's users edit, as the dataset names it. */
const RECOVERED_CANDIDATE: EntityGrantTarget = {
  entityType: 'candidate',
  externalId: RECOVERY_CANDIDATE_EXTERNAL_ID
};

/** The password the user chooses on the password-reset page. It meets every rule the page lists. */
const NEW_PASSWORD = 'Fr3sh!Start-Kv8z';

// Every visitor starts signed out.
test.use({ storageState: { cookies: [], origins: [] } });

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

test.describe('recovering a password through a mailed link', () => {
  test('recovery: a reset link asked for inside the app, opened in a browser that never asked for it, signs the user in and sets a new password', async ({
    page,
    invitationFlow,
    contestantLoginPage,
    contestantForgotPasswordPage,
    flowState,
    freshVisitor
  }) => {
    // A user who has a password, edits the reserved candidate and has accepted the terms of use, so that a sign-in is followed by no other view.
    const user = await invitationFlow.createUserWithPassword({ editorOf: 'candidate', acceptTermsOfUse: true });

    // The sign-in screen leads to the forgot-password page.
    await contestantLoginPage.openSignIn();
    await contestantLoginPage.followForgotPassword();

    // The address is submitted. The page's one request carries a completion witness, which says what its background work did. The screen that follows says an email was sent, in the wording of a recovery.
    const outcome = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantForgotPasswordPage.submit(user.email);
      await contestantForgotPasswordPage.expectLedToEmailSent(user.email);
    });
    expect(outcome, 'the recovery request handed a mail over').toBe('sent');
    await flowState.expectNothingOutsideMemory([user.email]);

    // The mailed link is opened as received, on the run's origin, in a browser context that has asked for nothing and holds no session.
    const elsewhere = await freshVisitor();
    await elsewhere.page.goto(await invitationFlow.recoveryLinkToOpen(user.email, { locale: 'en' }));

    // The link signs the user in and lands on the password-reset page, which says which account the password is for.
    await elsewhere.contestantPasswordResetPage.expectShown();
    await elsewhere.contestantPasswordResetPage.expectAddress(user.email);
    await elsewhere.contestantPasswordResetPage.expectUsernameField(user.email);

    // A saved password leads to the home of the candidate the user edits, and the user is still signed in after a reload.
    await elsewhere.contestantPasswordResetPage.setPassword(NEW_PASSWORD);
    await elsewhere.contestantEntityHomePage.expectLanded(RECOVERED_CANDIDATE);
    await elsewhere.contestantEntityHomePage.reload();
    await elsewhere.contestantEntityHomePage.expectLanded(RECOVERED_CANDIDATE);

    // A visitor with no session is refused the old password, and signs in with the new one.
    const returning = await freshVisitor();
    await returning.contestantLoginPage.openSignIn();
    await returning.contestantLoginPage.signInScriptLoaded();
    await returning.contestantLoginPage.login(user.email, user.password);
    await returning.contestantLoginPage.expectWrongCredentials();
    await returning.contestantLoginPage.enterPassword(NEW_PASSWORD);
    await returning.contestantLoginPage.submit();
    await returning.contestantEntityHomePage.expectLanded(RECOVERED_CANDIDATE);
  });

  test('oracle: forgot-password for an address nobody holds meets the same screen and sends nothing', async ({
    invitationFlow,
    freshVisitor
  }) => {
    // The address of a user who edits the reserved candidate, and an address nobody holds and nobody invited.
    const user = await invitationFlow.createUserWithPassword({ editorOf: 'candidate' });
    const unheld = invitationFlow.freshAddress();

    // One visitor in a browser context of their own asks for a recovery of an address. Each is followed by the same steps: the screen that says an email was sent, in the wording of a recovery and with the address, the control that asks again waiting behind its count, and no sentence about asking again. The clock stands still, so the count read is the one the screen opened with.
    const askForRecovery = async (address: string) => {
      const visitor = await freshVisitor();
      await visitor.contestantEmailSentPage.holdClockStill();
      await visitor.contestantForgotPasswordPage.open();
      const outcome = await invitationFlow.witnessPageRequest(visitor.page, async () => {
        await visitor.contestantForgotPasswordPage.submit(address);
        await visitor.contestantForgotPasswordPage.expectLedToEmailSent(address);
      });
      await visitor.contestantEmailSentPage.expectResendWaiting();
      await visitor.contestantEmailSentPage.expectAskedAgain(false);
      await visitor.flowState.expectNothingOutsideMemory([address]);
      return { outcome, shown: await visitor.contestantEmailSentPage.shape(address) };
    };

    const forHeld = await askForRecovery(user.email);
    const forUnheld = await askForRecovery(unheld);

    // What each request's work did, read from its own witness. Only then the mail catcher and the accounts: the user's address alone was mailed, and the other address has no account.
    expect(forHeld.outcome, 'the request for the address of a user handed a mail over').toBe('sent');
    await invitationFlow.expectMailCount(user.email, 1);
    await invitationFlow.expectNoMailAfter(forUnheld.outcome, { address: unheld, noAccount: true });

    // The two visitors were shown the same screen: its states, its text with the count, and its controls.
    expect(forUnheld.shown, 'the screen for an address nobody holds, beside the one for the address of a user').toEqual(
      forHeld.shown
    );
  });

  test('first-time user: an address with an invitation only is mailed the sign-in link, and is asked to choose a password', async ({
    page,
    invitationFlow,
    contestantForgotPasswordPage,
    contestantSetPasswordGate
  }) => {
    // An email invitation for the reserved candidate, for an address that has no account.
    const address = invitationFlow.freshAddress();
    await invitationFlow.seedEmailInvitation('candidate', address, { confirmEntity: true });

    // The forgot-password page, opened by its address, leads to the same screen for this address.
    await contestantForgotPasswordPage.open();
    const outcome = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantForgotPasswordPage.submit(address);
      await contestantForgotPasswordPage.expectLedToEmailSent(address);
    });
    expect(outcome, 'the recovery request handed a mail over').toBe('sent');

    // The mail is the sign-in mail. Its link, opened as received, signs the user in, and a user with no password is asked to choose one before anything else.
    await page.goto(await invitationFlow.signInLinkToOpen(address, { locale: 'en' }));
    await contestantSetPasswordGate.expectShown();
    await contestantSetPasswordGate.expectAddress(address);
  });

  test('no session: the reset page opened without a session ends on the login screen', async ({
    contestantLoginPage,
    contestantPasswordResetPage
  }) => {
    // The page's own address, opened by a visitor with no session: the login screen, with no notice.
    await contestantPasswordResetPage.openDirectly();
    await contestantLoginPage.expectEndedOnEntry();
  });
});
