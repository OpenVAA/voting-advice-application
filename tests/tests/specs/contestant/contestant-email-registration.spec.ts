import { createRegistrationTest, expect } from '../../fixtures/contestant/contestant-registration';
import { EMAIL_REGISTRATION_ADDRESS_PREFIX, REGISTRATION_CANDIDATE_EXTERNAL_ID } from '../../utils/invitationConstants';
import { openMailedLink } from '../../utils/mailedLink';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

/**
 * # Registering through a mailed link
 *
 * An invited candidate who has no account, followed through the browser to the candidate's home twice: once from the sign-in screen, through the forgot-password page, and once from the registration screen. Each time the link is asked for, the screen that says an email was sent is shown, the mailed link is opened as received, the password is chosen before anything else is shown, the terms of use are accepted, and the home is reached.
 *
 * ## What it covers
 *
 * - The sign-in screen offers the link for a user without a password, which leads to the forgot-password page with the typed address in its field. That page's one request hands one mail over: an address with an open invitation and no account is sent the sign-in mail. The screen that follows shows the typed address and keeps it nowhere outside the page's memory.
 * - The mailed link signs the user in and claims the invitation. A user whose account has no password is shown the set-password view in place of the page: where the link lands, and at the address of a protected page of their own entity entered directly.
 * - Saving a password replaces that view with the terms of use without the user going anywhere, and accepting them leads to the candidate's home, where the user is still signed in after a reload.
 * - The registration screen lists the email and the code mode, which the dataset's `contestantApp.registrationModes` allows candidates and organizations, with none chosen. The email mode is chosen with the keyboard, and Continue makes the one link request.
 * - A signed-in user who opens the login screen, the sign-in screen, the registration screen or the "email sent" screen by its address ends on their home.
 * - On the registration screen, Continue with no mode chosen, with an empty address and with an unusable address makes no request, says what is missing where it is missing, and puts focus there.
 * - The screen that says an email was sent is the same for an invited address, for an address nobody invited and for an address asked again inside the minute from another tab: the same states, text, count and controls. Only the first is mailed and has an account, which is read once each request's work is over.
 * - The sign-in screen refuses an address nobody holds, a wrong password and an account that has no password with one status and one sentence, on a screen that is otherwise the same, and keeps the address typed.
 * - The sign-in screen's Forgot password link carries the typed address to the forgot-password page too, and following it asks for nothing.
 * - "Send again" is unavailable while the wait is counted on the page's clock, which the test moves past the wait. A press then repeats the request, which sends, and the wait starts again.
 * - The same address asked again from the same tab inside the wait adds one sentence to the screen, and the server sends nothing for it.
 * - The screen that says an email was sent names the typed address in bold in its first sentence, and in no list apart. Below its sentences it holds the sentence whose words lead to support, then "Send again".
 * - A reload of the screen that says an email was sent, and a visit to its address, end on the login screen, where nothing typed before is shown or kept.
 * - What each input of the registration and the sign-in screen tells a browser about what it holds.
 * - A visitor with no session who opens the address of a protected page ends on the login screen, which offers both entries. "Sign in with email" leads to the sign-in screen, and a sign-in there ends on the page first asked for.
 * - A mailed link opened a second time ends on the login screen, which says that the link can no longer be used.
 * - The sign-in screen's link for a user without a password leads to the forgot-password page, whose field holds the address typed on the sign-in screen, and is empty when none was typed.
 * - A browser that has confirmed an address with a mailed link and signed out is told on the registration screen that it looks as if the user is already registered, and the notice leads to the login screen. Dismissed, the notice is gone, and it is not shown again after a reload.
 *
 * ## What it writes
 *
 * Invitations on the candidate the base dataset reserves for registration tests, the users the link requests and the mailed links create, with the password and the terms acceptance a test gives one, the grant a claim writes, one user made with a password who edits nothing, and one made with a password as the reserved candidate's editor. Every address begins with the spec's own prefix. `beforeAll` and `afterEach` remove every user under the prefix, with their grants and invitations, and every invitation on the reserved candidate, and make the candidate unconfirmed again; `afterAll` asserts that nothing is left. The candidate has no nomination, so nothing the spec writes is read by a voter.
 *
 * ## How much it asks of the auth service
 *
 * Five mailed links are opened, and one of them a second time, which is refused. Three password sign-ins are refused and one is accepted. The auth service admits thirty link verifications and thirty password sign-ins in five minutes from one address of origin.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch around an expectation). No expectation takes a link, a token or a password as its subject.
 */

const test = createRegistrationTest({
  addressPrefix: EMAIL_REGISTRATION_ADDRESS_PREFIX,
  dedicatedRows: { candidate: REGISTRATION_CANDIDATE_EXTERNAL_ID }
});

/** The candidate the invitation names, as the dataset names it. */
const INVITED_CANDIDATE: EntityGrantTarget = {
  entityType: 'candidate',
  externalId: REGISTRATION_CANDIDATE_EXTERNAL_ID
};

/** The password the user chooses. It meets every rule the set-password view lists. */
const CHOSEN_PASSWORD = 'Tr4cer!Path-Lmq9';

/** A password no user of the spec has. */
const WRONG_PASSWORD = 'N0t-This-One!Zx7q';

// The user signs in from scratch.
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

test.describe('registering through a mailed link', () => {
  test.describe.configure({ mode: 'serial' });

  test(
    "tracer: an invited candidate follows the sign-in screen's link for a user without a password, asks for a link on the forgot-password page, opens the mailed link, sets a password and reaches the candidate's home",
    { tag: '@reg-email' },
    async ({
      page,
      invitationFlow,
      contestantLoginPage,
      contestantForgotPasswordPage,
      contestantEmailSentPage,
      contestantSetPasswordGate,
      contestantTermsOfUsePage,
      contestantEntityHomePage,
      flowState
    }) => {
      // An email invitation for the reserved candidate, for an address nobody has used.
      const address = invitationFlow.freshAddress();
      await invitationFlow.seedEmailInvitation('candidate', address, { confirmEntity: true });
      const candidate = await invitationFlow.readDedicatedRow('candidate');

      // The sign-in screen, opened by its address, offers the link for a user without a password.
      await contestantLoginPage.openSignIn();
      await contestantLoginPage.expectNoPasswordYetLink(true);

      // The address is typed and the link followed: the forgot-password page holds the address.
      await contestantLoginPage.signInScriptLoaded();
      await contestantLoginPage.typeEmail(address);
      await contestantLoginPage.followNoPasswordYet();
      await contestantForgotPasswordPage.expectEmail(address);

      // The link is asked for there. The page's one request carries a completion witness, which says what its background work did: the address has an open invitation and no account, so it is sent the sign-in mail.
      const outcome = await invitationFlow.witnessPageRequest(page, async () => {
        await contestantForgotPasswordPage.pressSubmit();
        await contestantForgotPasswordPage.expectLedToEmailSent(address);
      });
      await contestantEmailSentPage.expectShown({ wording: 'recovery', address });
      expect(outcome, 'the link request handed a mail over').toBe('sent');
      await flowState.expectNothingOutsideMemory([address]);

      // The mailed link is opened as received, on the run's origin, and confirmed on the confirm page.
      await openMailedLink(page, await invitationFlow.signInLinkToOpen(address, { locale: 'en' }));

      // A user with no password is asked to choose one before anything else, and is told which account it is for.
      await contestantSetPasswordGate.expectShown();
      await contestantSetPasswordGate.expectAddress(address);
      await contestantSetPasswordGate.expectUsernameField(address);

      // The address of a protected page of the user's own entity shows the same view, and nothing of that page.
      await contestantSetPasswordGate.openProtectedPageDirectly(INVITED_CANDIDATE.entityType, candidate.id);
      await contestantSetPasswordGate.expectShownInPlaceOfPage();
      await contestantSetPasswordGate.expectAddress(address);

      // A saved password is followed by the terms of use, with no navigation by the user.
      await contestantSetPasswordGate.setPassword(CHOSEN_PASSWORD);
      await contestantTermsOfUsePage.expectShown();
      await contestantTermsOfUsePage.acceptAndAdvance();

      // The candidate's home, with the grant the claim wrote; the user is still signed in after a reload.
      await contestantEntityHomePage.expectLanded(INVITED_CANDIDATE);
      expect(await invitationFlow.grantRowsOf(address)).toEqual([invitationFlow.promisedGrant('candidate', candidate)]);
      await contestantEntityHomePage.reload();
      await contestantEntityHomePage.expectLanded(INVITED_CANDIDATE);
    }
  );

  test(
    'register: an invited candidate registers by email through the mode selector',
    { tag: '@reg-email' },
    async ({
      page,
      invitationFlow,
      contestantLoginPage,
      contestantRegisterPage,
      contestantEmailSentPage,
      contestantSetPasswordGate,
      contestantTermsOfUsePage,
      contestantEntityHomePage,
      flowState
    }) => {
      // An email invitation for the reserved candidate, for an address nobody has used.
      const address = invitationFlow.freshAddress();
      await invitationFlow.seedEmailInvitation('candidate', address, { confirmEntity: true });
      const candidate = await invitationFlow.readDedicatedRow('candidate');

      // The registration screen, opened by its address, lists the two modes the project allows and has none chosen.
      await contestantRegisterPage.open();
      await contestantRegisterPage.expectListedModes(['email', 'code']);
      await contestantRegisterPage.expectSelectedMode(null);

      // The email mode is chosen with the keyboard, which leaves focus on its radio and opens its panel alone.
      await contestantRegisterPage.chooseModeWithKeyboard('email');
      await contestantRegisterPage.expectSelectedMode('email');
      await contestantRegisterPage.expectPanelOpen('email');

      // The address is typed and Continue pressed. The page's one request carries a completion witness, which says what its background work did.
      await contestantRegisterPage.typeEmail(address);
      const outcome = await invitationFlow.witnessPageRequest(page, async () => {
        await contestantRegisterPage.pressContinue();
      });
      await contestantEmailSentPage.expectShown({ wording: 'signIn', address });
      expect(outcome, 'the link request handed a mail over').toBe('sent');
      await flowState.expectNothingOutsideMemory([address]);

      // The mailed link is opened as received, on the run's origin, and confirmed on the confirm page. A password is chosen and the terms accepted.
      await openMailedLink(page, await invitationFlow.signInLinkToOpen(address, { locale: 'en' }));
      await contestantSetPasswordGate.expectShown();
      await contestantSetPasswordGate.expectAddress(address);
      await contestantSetPasswordGate.setPassword(CHOSEN_PASSWORD);
      await contestantTermsOfUsePage.expectShown();
      await contestantTermsOfUsePage.acceptAndAdvance();

      // The candidate's home, with the grant the claim wrote.
      await contestantEntityHomePage.expectLanded(INVITED_CANDIDATE);
      expect(await invitationFlow.grantRowsOf(address)).toEqual([invitationFlow.promisedGrant('candidate', candidate)]);

      // Signed in, each screen of the entry flow that is opened by its address leads to the home.
      await contestantLoginPage.openEntryDirectly();
      await contestantEntityHomePage.expectLanded(INVITED_CANDIDATE);
      await contestantLoginPage.openSignInDirectly();
      await contestantEntityHomePage.expectLanded(INVITED_CANDIDATE);
      await contestantRegisterPage.openDirectly();
      await contestantEntityHomePage.expectLanded(INVITED_CANDIDATE);
      await contestantEmailSentPage.openDirectly();
      await contestantEntityHomePage.expectLanded(INVITED_CANDIDATE);
    }
  );

  test('oracle: an invited and an uninvited address meet the same "email sent" screen, and only the invited one is mailed', async ({
    invitationFlow,
    freshVisitor
  }) => {
    const invited = invitationFlow.freshAddress();
    const uninvited = invitationFlow.freshAddress();
    await invitationFlow.seedEmailInvitation('candidate', invited, { confirmEntity: true });

    // One visitor in a browser context of their own registers by email with an address. Each is followed by the same steps: the screen that says an email was sent, with the address, the control that asks again waiting behind its count, and no sentence about asking again. The clock stands still, so the count read is the one the screen opened with.
    const registerByEmail = async (address: string) => {
      const visitor = await freshVisitor();
      await visitor.contestantEmailSentPage.holdClockStill();
      await visitor.contestantRegisterPage.open();
      await visitor.contestantRegisterPage.chooseMode('email');
      await visitor.contestantRegisterPage.typeEmail(address);
      const outcome = await invitationFlow.witnessPageRequest(visitor.page, async () => {
        await visitor.contestantRegisterPage.pressContinue();
      });
      await visitor.contestantEmailSentPage.expectShown({ wording: 'signIn', address });
      await visitor.contestantEmailSentPage.expectResendWaiting();
      await visitor.contestantEmailSentPage.expectAskedAgain(false);
      await visitor.flowState.expectNothingOutsideMemory([address]);
      return { outcome, shown: await visitor.contestantEmailSentPage.shape(address) };
    };

    // The invited address, an address nobody invited, and the invited address again inside the minute, each from a tab that has asked for nothing before.
    const forInvited = await registerByEmail(invited);
    const forUninvited = await registerByEmail(uninvited);
    const forInvitedAgain = await registerByEmail(invited);

    // What each request's work did, read from its own witness. Only then the mail catcher and the accounts: the first request alone handed a mail over and made an account.
    expect(forInvited.outcome, 'the request for the invited address handed a mail over').toBe('sent');
    await invitationFlow.expectMailCount(invited, 1);
    await invitationFlow.expectNoMailAfter(forUninvited.outcome, { address: uninvited, noAccount: true });
    await invitationFlow.expectNoMailAfter(forInvitedAgain.outcome, { address: invited, mails: 1 });
    expect(await invitationFlow.hasAccount(invited), 'an account exists for the invited address').toBe(true);

    // The three visitors were shown the same screen: its states, its text with the count, and its controls.
    expect(forUninvited.shown, 'the screen for an address nobody invited, beside the invited one').toEqual(
      forInvited.shown
    );
    expect(forInvitedAgain.shown, 'the screen for a request made again inside the minute, beside the first').toEqual(
      forInvited.shown
    );
  });

  test('oracle on sign-in: an unknown address, a wrong password and an account with no password get one sentence and one status', async ({
    invitationFlow,
    contestantLoginPage
  }) => {
    // Three addresses: one nobody holds, one of a user who has a password, and one whose account a link request made and which has no password.
    const unknown = invitationFlow.freshAddress();
    const withPassword = await invitationFlow.createUserWithPassword();
    const withoutPassword = invitationFlow.freshAddress();
    await invitationFlow.seedEmailInvitation('candidate', withoutPassword, { confirmEntity: true });
    const request = await invitationFlow.askForLink({ email: withoutPassword });
    expect(request.outcome, 'the link request handed a mail over, and so made the account').toBe('sent');
    expect(await invitationFlow.hasAccount(withoutPassword), 'an account exists for the invited address').toBe(true);

    // Each signs in with a password that is not theirs, on a screen whose script has loaded. Each is refused with the status and the sentence of wrong credentials, and the address stays in its field.
    const refusals = [];
    for (const address of [unknown, withPassword.email, withoutPassword]) {
      await contestantLoginPage.openSignIn();
      await contestantLoginPage.signInScriptLoaded();
      await contestantLoginPage.expectInputAttributes();
      await contestantLoginPage.typeEmail(address);
      await contestantLoginPage.enterPassword(WRONG_PASSWORD);
      await contestantLoginPage.submit();
      await contestantLoginPage.expectWrongCredentials();
      await contestantLoginPage.expectEmailKept(address);
      refusals.push(await contestantLoginPage.refusalShape(address));
    }

    // The three were shown the same screen: its state, its text and its controls.
    const [forUnknown, forWrongPassword, forNoPassword] = refusals;
    expect(forWrongPassword, 'the screen for a wrong password, beside the one for an unknown address').toEqual(
      forUnknown
    );
    expect(forNoPassword, 'the screen for an account with no password, beside the one for an unknown address').toEqual(
      forUnknown
    );
  });

  test('resend: "Send again" is unavailable for the count, then repeats the request', async ({
    page,
    invitationFlow,
    contestantRegisterPage,
    contestantEmailSentPage
  }) => {
    const address = invitationFlow.freshAddress();
    await invitationFlow.seedEmailInvitation('candidate', address, { confirmEntity: true });

    // The page's clock is the test's from before the first navigation, so the count runs on a clock the test can move.
    await contestantEmailSentPage.installClock();
    await contestantRegisterPage.open();
    await contestantRegisterPage.chooseMode('email');
    await contestantRegisterPage.expectEmailInputAttributes();
    await contestantRegisterPage.typeEmail(address);
    const first = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantRegisterPage.pressContinue();
    });
    await contestantEmailSentPage.expectShown({ wording: 'signIn', address });
    expect(first, 'the first request handed a mail over').toBe('sent');

    // While the count runs the control is unavailable, still takes focus, and is described by the count in its label.
    await contestantEmailSentPage.expectResendWaiting();

    // Past the wait the control is available, its count is gone, and the status region says so.
    await contestantEmailSentPage.advancePastTheWait();
    await contestantEmailSentPage.expectResendReady();
    await contestantEmailSentPage.expectStatus('ready');

    // A press repeats the request. The server's own minute has not passed, so the address's slot is given back first; the request then sends.
    const second = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantEmailSentPage.pressResend(address);
    });
    expect(second, 'the repeated request handed a mail over').toBe('sent');
    await invitationFlow.expectMailCount(address, 2);

    // The screen says only that a new email was requested, and the wait has started again with focus still on the control.
    await contestantEmailSentPage.expectStatus('requested');
    await contestantEmailSentPage.expectResendWaiting();
    await contestantEmailSentPage.expectShown({ wording: 'signIn', address });
  });

  test('asked again: the same address asked a second time inside the count adds one sentence', async ({
    page,
    invitationFlow,
    contestantRegisterPage,
    contestantEmailSentPage,
    flowState
  }) => {
    const address = invitationFlow.freshAddress();
    await invitationFlow.seedEmailInvitation('candidate', address, { confirmEntity: true });

    // The first request: the screen that says an email was sent, without the sentence about asking again.
    await contestantRegisterPage.open();
    await contestantRegisterPage.chooseMode('email');
    await contestantRegisterPage.typeEmail(address);
    const first = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantRegisterPage.pressContinue();
    });
    await contestantEmailSentPage.expectShown({ wording: 'signIn', address });
    await contestantEmailSentPage.expectAskedAgain(false);
    expect(first, 'the first request handed a mail over').toBe('sent');
    await invitationFlow.expectMailCount(address, 1);

    // "Use another email address" leads back to the registration screen, where the same address is asked again.
    await contestantEmailSentPage.followChangeAddress();
    await contestantRegisterPage.expectShown();
    await contestantRegisterPage.chooseMode('email');
    await contestantRegisterPage.typeEmail(address);
    const second = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantRegisterPage.pressContinue();
    });

    // The same screen with the one sentence more. The server's own minute refused the second request: the address still holds the one mail.
    await contestantEmailSentPage.expectShown({ wording: 'signIn', address });
    await contestantEmailSentPage.expectAskedAgain(true);
    await invitationFlow.expectNoMailAfter(second, { address, mails: 1 });
    await flowState.expectNothingOutsideMemory([address]);
  });

  test('reload: the "email sent" screen names the address in its first sentence, and reloaded ends on the login screen holding nothing of what was typed', async ({
    page,
    invitationFlow,
    contestantLoginPage,
    contestantRegisterPage,
    contestantEmailSentPage,
    flowState
  }) => {
    // An address nobody invited: the screen is the same for it, and its request sends nothing.
    const address = invitationFlow.freshAddress();
    await contestantRegisterPage.open();
    await contestantRegisterPage.chooseMode('email');
    await contestantRegisterPage.typeEmail(address);
    const outcome = await invitationFlow.witnessPageRequest(page, async () => {
      await contestantRegisterPage.pressContinue();
    });
    await contestantEmailSentPage.expectShown({ wording: 'signIn', address });
    await contestantEmailSentPage.expectAddressInFirstSentence(address);
    await contestantEmailSentPage.expectSupportThenResendInBody();
    await invitationFlow.expectNoMailAfter(outcome, { address, noAccount: true });
    await flowState.expectNothingOutsideMemory([address]);

    // A reload empties the page's memory: the visitor ends on the login screen, with no notice, and the address is nowhere.
    await contestantEmailSentPage.reload();
    await contestantLoginPage.expectEndedOnEntry();
    await flowState.expectNothingShown([address]);
    await flowState.expectNothingOutsideMemory([address]);

    // The screen's own address, opened by a visitor who has asked for nothing, ends there too.
    await contestantEmailSentPage.openDirectly();
    await contestantLoginPage.expectEndedOnEntry();
    await flowState.expectNothingShown([address]);
  });
});

// A describe of its own: the test seeds nothing and reads no reserved row, so it runs whatever became of the walks above.
test.describe('what the registration screen does not send', () => {
  test('validation: Continue with no mode chosen, and with an empty or an unusable address, sends nothing', async ({
    page,
    invitationFlow,
    contestantRegisterPage
  }) => {
    await contestantRegisterPage.open();
    await contestantRegisterPage.expectSelectedMode(null);

    // No mode chosen: the group says to choose one, and focus is on its first radio.
    await invitationFlow.expectNoPageRequest(page, async () => {
      await contestantRegisterPage.pressContinue();
      await contestantRegisterPage.expectModesError();
    });

    // The email mode with nothing typed: the field says to enter an address, and has focus.
    await contestantRegisterPage.chooseMode('email');
    await invitationFlow.expectNoPageRequest(page, async () => {
      await contestantRegisterPage.pressContinue();
      await contestantRegisterPage.expectFieldError('email', 'required');
    });

    // Something that is no address: the field says so, and has focus.
    await contestantRegisterPage.typeEmail('not-an-address');
    await invitationFlow.expectNoPageRequest(page, async () => {
      await contestantRegisterPage.pressContinue();
      await contestantRegisterPage.expectFieldError('email', 'invalid');
    });

    // The visitor is still on the registration screen, with the email mode chosen.
    await contestantRegisterPage.expectShown();
    await contestantRegisterPage.expectSelectedMode('email');
  });
});

test.describe('the login screen', () => {
  test('entry: the login screen offers both entries, and "Sign in with email" carries a deep link\'s target', async ({
    invitationFlow,
    contestantLoginPage
  }) => {
    // A user who has a password, edits the reserved candidate and has accepted the terms of use, so that a sign-in is followed by no other view.
    const user = await invitationFlow.createUserWithPassword({ editorOf: 'candidate', acceptTermsOfUse: true });

    // The address of the settings page, opened with no session, ends on the login screen, which offers both entries and says nothing about why the visitor is there.
    await contestantLoginPage.openSettingsWithNoSession();
    await contestantLoginPage.expectEntryShown();
    await contestantLoginPage.expectRegisterOffered(true);
    await contestantLoginPage.expectNoNotice();

    // "Sign in with email" leads to the sign-in screen, and a sign-in there ends on the page first asked for.
    await contestantLoginPage.followSignIn();
    await contestantLoginPage.expectSignInShown();
    await contestantLoginPage.login(user.email, user.password);
    await contestantLoginPage.expectLedToSettings();
  });

  test('the sign-in screen leads a user without a password to the forgot-password page with the typed address', async ({
    invitationFlow,
    contestantLoginPage,
    contestantForgotPasswordPage
  }) => {
    // With nothing typed, the link leads to the forgot-password page, whose field is empty.
    await contestantLoginPage.openSignIn();
    await contestantLoginPage.followNoPasswordYet();
    await contestantForgotPasswordPage.expectEmail('');

    // With an address typed, once the screen's script has loaded, the page's field holds that address.
    const address = invitationFlow.freshAddress();
    await contestantLoginPage.openSignIn();
    await contestantLoginPage.signInScriptLoaded();
    await contestantLoginPage.typeEmail(address);
    await contestantLoginPage.followNoPasswordYet();
    await contestantForgotPasswordPage.expectEmail(address);
  });

  test("forgot password: the sign-in screen's Forgot password link carries the typed address too, and asks for nothing", async ({
    page,
    invitationFlow,
    contestantLoginPage,
    contestantForgotPasswordPage
  }) => {
    const address = invitationFlow.freshAddress();
    await contestantLoginPage.openSignIn();
    await contestantLoginPage.signInScriptLoaded();
    await contestantLoginPage.typeEmail(address);

    // Following the link makes no request, and the forgot-password page's field holds the address.
    await invitationFlow.expectNoPageRequest(page, async () => {
      await contestantLoginPage.followForgotPassword();
      await contestantForgotPasswordPage.expectEmail(address);
    });
  });

  test('notice: a mailed link opened a second time lands on the login screen with its sentence', async ({
    page,
    invitationFlow,
    contestantSetPasswordGate,
    freshVisitor
  }) => {
    // An invited address asks for a link, and the mailed link is opened as received and confirmed: it signs the user in.
    const address = invitationFlow.freshAddress();
    await invitationFlow.seedEmailInvitation('candidate', address, { confirmEntity: true });
    const request = await invitationFlow.askForLink({ email: address, locale: 'en' });
    expect(request.outcome, 'the link request handed a mail over').toBe('sent');
    const link = await invitationFlow.signInLinkToOpen(address, { locale: 'en' });
    await openMailedLink(page, link);
    await contestantSetPasswordGate.expectShown();

    // The same link opened again and confirmed by a visitor with no session: a link works once, so the visitor ends on the login screen, which says that the link can no longer be used and still offers both entries.
    const visitor = await freshVisitor();
    await openMailedLink(visitor.page, link);
    await visitor.contestantLoginPage.expectEntryShown();
    await visitor.contestantLoginPage.expectNotice('authError');
    await visitor.contestantLoginPage.expectRegisterOffered(true);
  });
});

test.describe('a browser that has confirmed an address', () => {
  /**
   * An invited address asks for a link, the mailed link is opened as received and confirmed, which signs the user in and asks for a password, and the user signs out through the app.
   */
  async function confirmAddressAndSignOut({
    page,
    invitationFlow,
    contestantSetPasswordGate,
    contestantLoginPage
  }: Pick<
    Parameters<Parameters<typeof test>[2]>[0],
    'page' | 'invitationFlow' | 'contestantSetPasswordGate' | 'contestantLoginPage'
  >): Promise<void> {
    const address = invitationFlow.freshAddress();
    await invitationFlow.seedEmailInvitation('candidate', address, { confirmEntity: true });
    const request = await invitationFlow.askForLink({ email: address, locale: 'en' });
    expect(request.outcome, 'the link request handed a mail over').toBe('sent');
    await openMailedLink(page, await invitationFlow.signInLinkToOpen(address, { locale: 'en' }));
    await contestantSetPasswordGate.expectShown();
    await contestantSetPasswordGate.logOut();
    await contestantLoginPage.expectEntryShown();
  }

  test('a browser that confirmed its address is told on the registration screen that it is already registered', async ({
    page,
    invitationFlow,
    contestantSetPasswordGate,
    contestantLoginPage,
    contestantRegisterPage
  }) => {
    await confirmAddressAndSignOut({ page, invitationFlow, contestantSetPasswordGate, contestantLoginPage });

    // The registration screen says that the user looks to be registered already, and its link leads to the login screen.
    await contestantRegisterPage.open();
    await contestantRegisterPage.expectRegisteredNotice();
    await contestantRegisterPage.followRegisteredNoticeLogin();
    await contestantLoginPage.expectEntryShown();
  });

  test('the already-registered notice stays dismissed', async ({
    page,
    invitationFlow,
    contestantSetPasswordGate,
    contestantLoginPage,
    contestantRegisterPage
  }) => {
    await confirmAddressAndSignOut({ page, invitationFlow, contestantSetPasswordGate, contestantLoginPage });
    await contestantRegisterPage.open();
    await contestantRegisterPage.expectRegisteredNotice();

    // Dismiss hides the notice, and a reload does not bring it back.
    await contestantRegisterPage.dismissRegisteredNotice();
    await contestantRegisterPage.expectNoRegisteredNotice();
    await contestantRegisterPage.reload();
    await contestantRegisterPage.expectNoRegisteredNotice();
  });
});
