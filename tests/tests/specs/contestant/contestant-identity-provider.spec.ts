/**
 * # Registration with the identity provider
 *
 * The identity provider's flow walked in a browser against the mock issuer the run serves: each test mints its own identity, chooses how the provider answers it, starts the flow and asserts the screen the flow ends on.
 *
 * ## What it covers
 *
 * - **A new candidate registers** — back from the provider signed in, with a candidate the application made, the user is asked for the address they will sign in with, gives it, and goes straight on to the terms of use and the candidate's home: no wait for the address's link and no password. The link the confirmation mail holds, opened as received, proves the address; the account has no password, so the next protected page asks for one.
 * - **The locale of the registration** — a registration started on the Finnish registration screen asks the provider for `fi` as the `ui_locales` of its authorization request, as the mock issuer reports it.
 * - **A cancel at the provider** — the error screen in its `cancelled` class, with Try again offered and Return, and no account made for the identity.
 * - **An error at the provider** — the error screen in its `retry` class, with Try again offered and Return.
 * - **Accessibility scans** — the view a new candidate arrives at, asking for an address, in a light and a dark twin. Each twin mints its own identity and reaches the view through the provider, so no scan spends a state another needs.
 * - **A returning identity**, each registered as a candidate earlier in the same test and signed out:
 *   - **with a proved address and a password**: back from the provider it is told that it has already registered and to sign in with its address next time, with that address shown and no address field, and Continue leads to its candidate's home.
 *   - **with no address**: it is told that it has already registered and asked for an address, and opening its settings page directly shows the same view there with nothing of the settings page; once an address is given and the terms accepted, the settings page follows.
 *   - **whose grant an administrator removed**, with its address pending: it is shown that address once, Continue leads to the view saying there is nothing to edit, which names no address and asks the user to tell support that they registered with Bank ID, and no candidate was made for it.
 *   - **Accessibility scans** of the view a returning identity with no address meets and of the one a returning identity with a proved address meets, each in a light and a dark twin, each twin with its own identity. The proved address is proved through the link of its confirmation mail.
 * - **An address awaiting its link**, given at registration and not opened:
 *   - **the identity comes back**: it is told that it has already registered and is shown that address under "Awaiting confirmation", with no address field; Send again mails the link a second time; Continue leads to its home, whose task list begins with the task of confirming that address.
 *   - **the identity replaces it in settings**: from the home's email task to the settings page, which shows the pending address as not confirmed, hands the change-password form no user name and mails the link again; another account's address is refused at the field; a fresh address is saved, its link is mailed, and the settings page and the home's email task show it.
 *   - **Accessibility scans** of the view a returning identity with a pending address meets, of the home with the email task and of the settings page with a pending address, each in a light and a dark twin, each twin with its own identity.
 *   - **At phone widths**: that view and the home with the email task, no wider than 320 and 390 pixels.
 * - **A link that confirms an address**:
 *   - **two identities give one address**, each in a browser of its own, and the first opens its link, so the address is its own and the view asking for a password names it. The second opens its link in its own browser, where it is signed in: the confirm page's Continue signs that browser out first, so it ends on the login page, with the notice that the address is now used by another account.
 *   - **the same, the second link opened in a browser with no session**: the login page, with the notice that the address is now used by another account.
 *   - **a proved address sets a password by email**: an identity that proved its address signs out, follows the sign-in screen's link for a user without a password to the forgot-password page with that address, asks for a link there, and the mailed recovery link, opened as received, leads to the password-reset page, and then to its home.
 * - **Both entity types registered with the provider** — in a describe whose settings let the provider's mode register candidates and organizations, so the registration screen asks which:
 *   - **A party registers**: chosen by keyboard, back from the provider the user is asked for the party's name and abbreviation before the address, gives them, and goes on to the terms of use and the party's home. The party is unconfirmed and holds the name and abbreviation typed, in the default locale.
 *   - **An identity adds the other type**: an identity that registered a candidate and gave an address signs out and comes back choosing a party; it is asked for the party's name alone, and then meets the profile-selection screen listing both.
 *   - **Accessibility scans** of the view a new party arrives at, of that view after Continue with every field empty, and of a new candidate's view after Continue with an address another account holds; each in a light and a dark twin, each twin with its own identity.
 *   - **At phone widths**: the view a new party arrives at, with every locale's field of the name and of the abbreviation shown, no wider than 320 and 390 pixels.
 * - **What the type cookie and the matrix refuse** — in a describe whose settings let the provider's mode register candidates alone:
 *   - **A forged type**: the flow is started for a candidate, and while the browser is at the provider its owner rewrites the type cookie to an organization. Back from the provider, the error screen in its `noRetry` class with `mode_not_allowed` in its address; no account exists for the identity and it edits no entity.
 *   - **A mode switched off**: the registration screen shows the provider's panel, the settings stop allowing the provider's mode for any type, and Continue leads to the error screen in its `noRetry` class with `mode_not_allowed` in its address, Return and no Try again; no account exists for the identity.
 * - **An account given a second candidate** — an identity that registered a candidate and gave an address signs out, an administrator gives its account a second candidate, and the identity comes back: it is shown its address once, no candidate is made, and the profile selection lists the two candidates, the only entities the account edits.
 * - **An address an open invitation holds** — a new identity types an address an open invitation of the project holds: the field says the address is in use, no mail goes to it, and the invitation stays unclaimed. An account the provider made claims no invitation, so the person is meant to sign in by email instead.
 *
 * ## What it writes
 *
 * What the flow itself writes: a successful identification makes an account and its candidate or organization, a typed address is recorded and proved, a password is saved, a party's names are saved, the terms acceptance is stored; a failed identification makes nothing. Beside it, the test of a removed grant removes its own account's editor grant on its candidate, a press of Send again first gives the pending address's one-mail-a-minute slot back, as do the second identity that gives an address the first gave and the link asked for on the forgot-password page just after an address was proved, the tests of a link that confirms an address open browsers of their own and close them, and the scan of an address in use and the test that replaces a pending address each make an account of their own holding a fresh address under the prefix the specs type, and the describe of both entity types writes the settings row's matrix before its tests and writes the candidates-only matrix back after them. The describe of what is refused writes the candidates-only matrix before its tests and again after each of them, since one of them switches the provider's mode off; the test of a forged type overwrites the type cookie in its own browser context; the test of a second candidate makes a candidate and its account's editor grant on it, which the project's teardown removes with the account's other entities; and the test of an invited address seeds an open invitation for a fresh address on the dataset's one candidate and removes it after itself. The project's setup seeds its own dataset with settings that offer the provider's mode, and its setup and teardown remove that dataset, the entities the application made for the users under the prefixes the specs mint and type, and those users.
 *
 * ## How much it asks of the auth service
 *
 * A registration verifies three tokens: the sign-in token of the callback, the confirmation of the account's current address that the address-confirmation operation makes, and the mailed link. Each other arrival through the provider verifies one, and each address given or mailed again one more; an address another account holds, or an open invitation, is refused before anything is verified. A failed verification is a verification too. A registration whose mailed link is not opened verifies two. The spec's tests together verify about ninety-seven: about forty-one before the describe of a pending address, thirty-three in it (five for the identity that comes back, four for the one that replaces its address, six for the scans of the view, four each for the scans of the home and of settings, and ten at the phone widths), seventeen in the describe of a link that confirms an address (seven for two identities and one address in two signed-in browsers, two registrations, two links and the second address; six for the same with the second link opened with no session; four for the sign-in by email, a registration, the confirmation link and the recovery link), none in the describe of what is refused, where no flow reaches a sign-in, three for the account given a second candidate, a registration and the identity's return, and one for the identity that types an invited address, its arrival. The local stack answers more than thirty verifications in five minutes from one address of origin without refusing any, so the spec waits for nothing but what it asserts.
 *
 * The tests run in the order they are written, in one worker: the settings row the describe of both entity types writes is the project's one.
 *
 * Rigidity contract: hard assertions only, no soft assertion, no try/catch around an expectation, no fixed wait, and no locator: every element is reached through a fixture.
 */

import { expect, test } from '@playwright/test';
import { createAuthConfirmPage } from '../../fixtures/contestant/authConfirmPage.fixture';
import { createContestantEmailSentPage } from '../../fixtures/contestant/contestantEmailSentPage.fixture';
import { createContestantEntitySelectionPage } from '../../fixtures/contestant/contestantEntitySelectionPage.fixture';
import { createContestantForgotPasswordPage } from '../../fixtures/contestant/contestantForgotPasswordPage.fixture';
import { createContestantHomePage } from '../../fixtures/contestant/contestantHomePage.fixture';
import { createContestantIdentityProviderErrorPage } from '../../fixtures/contestant/contestantIdentityProviderError.fixture';
import { createContestantIdentityProviderGate } from '../../fixtures/contestant/contestantIdentityProviderGate.fixture';
import { createContestantLoginPage } from '../../fixtures/contestant/contestantLoginPage.fixture';
import { createContestantLogoutButton } from '../../fixtures/contestant/contestantLogoutButton.fixture';
import { createContestantNothingToEditPage } from '../../fixtures/contestant/contestantNothingToEditPage.fixture';
import { createContestantPasswordResetPage } from '../../fixtures/contestant/contestantPasswordResetPage.fixture';
import { createContestantRegisterPage } from '../../fixtures/contestant/contestantRegisterPage.fixture';
import { createContestantSetPasswordGate } from '../../fixtures/contestant/contestantSetPasswordGate.fixture';
import { createContestantSettingsPage } from '../../fixtures/contestant/contestantSettingsPage.fixture';
import { createContestantTermsOfUsePage } from '../../fixtures/contestant/contestantTermsOfUsePage.fixture';
import { createIdentityProviderFlow } from '../../fixtures/shared/identityProviderFlow.fixture';
import { createPageGeometry } from '../../fixtures/shared/pageGeometry.fixture';
import { declareScans } from '../../utils/contestantAxeScan';
import { openMailedLink } from '../../utils/mailedLink';
import { PHONE_VIEWPORTS, phoneUse } from '../../utils/phoneViewports';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Browser, BrowserContext, Page } from '@playwright/test';

const identityProviderFlow = createIdentityProviderFlow();

// The describe of both entity types writes the project's one settings row before its tests and writes it back after them, so the file's tests run in order in one worker and no other test of the file sees that matrix.
test.describe.configure({ mode: 'default' });

/** What a party registered in these tests is called. */
const PARTY_NAMES = { name: 'Bank ID Test Party', shortName: 'BITP' };

/** The password a returning identity chose after proving its address. */
const CHOSEN_PASSWORD = 'Returning!Path-Kv7m';

/**
 * Mint an identity and bring it through the provider, choosing a party, to the view a new party arrives at.
 *
 * @param page - The test's page.
 * @returns The minted `sub`.
 */
async function arriveAsNewParty(page: Page): Promise<string> {
  const sub = await identityProviderFlow.mintIdentity(page.context(), { outcome: 'success' });
  await identityProviderFlow.startIdentityProviderFlow(page, { entityType: 'organization' });
  await createContestantIdentityProviderGate(page).expectShown({
    variant: 'new',
    addressState: 'none',
    asks: 'name email'
  });
  return sub;
}

/**
 * Register a fresh identity as a candidate without giving an address, log out from the view that asks for one, and come back through the provider.
 *
 * @param page - The test's page.
 * @returns The minted `sub`.
 */
async function returnWithNoAddress(page: Page): Promise<string> {
  const sub = await identityProviderFlow.registerWithIdentityProvider(page);
  await createContestantIdentityProviderGate(page).logOut();
  await identityProviderFlow.startIdentityProviderFlow(page);
  return sub;
}

/**
 * Register a fresh identity as a candidate with an address, prove the address through its mail's link, choose a password on the view that then asks for one, log out from the candidate's home, and come back through the provider.
 *
 * @param page - The test's page.
 * @returns The minted `sub` and the proved address.
 */
async function returnWithProvedAddress(page: Page): Promise<{ sub: string; address: string }> {
  const setPasswordGate = createContestantSetPasswordGate(page);
  const address = identityProviderFlow.freshAddress();
  const sub = await identityProviderFlow.registerWithIdentityProvider(page, { address });
  await identityProviderFlow.proveAddress(page, address);
  await setPasswordGate.expectShown();
  await setPasswordGate.setPassword(CHOSEN_PASSWORD);
  await setPasswordGate.expectGone();
  await identityProviderFlow.expectOwnEntityHome(page, sub);
  await identityProviderFlow.signOut(page);
  await identityProviderFlow.startIdentityProviderFlow(page);
  return { sub, address };
}

test.describe('registration', () => {
  test('a new candidate identifies at the provider, gives the address they will sign in with and goes straight to editing; the mailed link proves the address @reg-idp', async ({
    page,
    context
  }) => {
    const gate = createContestantIdentityProviderGate(page);
    const termsOfUse = createContestantTermsOfUsePage(page);
    const setPasswordGate = createContestantSetPasswordGate(page);

    const sub = await identityProviderFlow.mintIdentity(context, { outcome: 'success' });
    await identityProviderFlow.startIdentityProviderFlow(page);

    // Back signed in, with a candidate the application made: the view asks for the address to sign in with, and its heading holds focus.
    await gate.expectShown({ variant: 'new', addressState: 'none', asks: 'email' });
    await gate.expectHeadingFocused();

    // The address is given; the terms of use follow at once, with no wait for its link and no password.
    const address = identityProviderFlow.freshAddress();
    await gate.giveAddress(address);
    await gate.pressContinue();
    await termsOfUse.expectShown();
    await gate.expectGone();
    await setPasswordGate.expectGone();
    await termsOfUse.acceptAndAdvance();
    await identityProviderFlow.expectOwnEntityHome(page, sub);

    // The confirmation mail's link, opened as received and confirmed on the confirm page, proves the address. Continue signed the browser out first, and the link signs it in again; the account has no password, so the app root asks for one, naming the proved address.
    await openMailedLink(page, await identityProviderFlow.confirmationLinkToOpen(address));
    await setPasswordGate.expectShown();
    await identityProviderFlow.expectAtAppRoot(page);
    await setPasswordGate.expectAddress(address);
  });

  test('the identity provider receives the locale of the registration @reg-idp', async ({ page, context }) => {
    await identityProviderFlow.mintIdentity(context, { outcome: 'success' });
    await identityProviderFlow.startIdentityProviderFlow(page, { locale: 'fi' });
    await createContestantIdentityProviderGate(page).expectShown({
      variant: 'new',
      addressState: 'none',
      asks: 'email'
    });
    await identityProviderFlow.expectProviderAskedForLocale(context, 'fi');
  });
});

test.describe('identification failures', () => {
  test('a cancel at the provider shows the cancel, offers Try again and makes no account @reg-idp', async ({
    page,
    context
  }) => {
    const sub = await identityProviderFlow.mintIdentity(context, { outcome: 'cancel' });
    await identityProviderFlow.startIdentityProviderFlow(page);
    const errorPage = createContestantIdentityProviderErrorPage(page);
    await errorPage.expectShown('cancelled');
    await errorPage.expectTryAgain(true);
    await errorPage.expectSupportInSentence();
    await errorPage.expectReturn();
    await identityProviderFlow.expectNoAccountFor(sub);
  });

  test('an error at the provider shows a failure that trying again may cure @reg-idp', async ({ page, context }) => {
    const sub = await identityProviderFlow.mintIdentity(context, { outcome: 'provider-error' });
    await identityProviderFlow.startIdentityProviderFlow(page);
    const errorPage = createContestantIdentityProviderErrorPage(page);
    await errorPage.expectShown('retry');
    await errorPage.expectTryAgain(true);
    await errorPage.expectSupportInSentence();
    await errorPage.expectReturn();
    await identityProviderFlow.expectNoAccountFor(sub);
  });
});

test.describe('accessibility scans', () => {
  declareScans({
    name: 'identity-provider-gate-new-candidate',
    fixture: 'raw',
    routeId: 'ContestantAppHome',
    contentTestId: testIds.contestant.identityProviderGate.container,
    postLoginTestId: testIds.contestant.identityProviderGate.container,
    reach: async (page) => {
      await identityProviderFlow.mintIdentity(page.context(), { outcome: 'success' });
      await identityProviderFlow.startIdentityProviderFlow(page);
      await createContestantIdentityProviderGate(page).expectShown({
        variant: 'new',
        addressState: 'none',
        asks: 'email'
      });
    }
  });
});

test.describe('a returning identity', () => {
  test('an identity with a proved address and a password is told that it has registered and to sign in with its address next time, and goes on to its home without being asked for an address @reg-idp', async ({
    page
  }) => {
    const gate = createContestantIdentityProviderGate(page);

    const { sub, address } = await returnWithProvedAddress(page);

    await gate.expectShown({ variant: 'returning', addressState: 'proved', asks: '' });
    await gate.expectReturning('proved');
    await gate.expectSignInAddress(address);
    await gate.expectNoAddressField();
    await gate.pressContinue();
    await identityProviderFlow.expectOwnEntityHome(page, sub);
    await gate.expectGone();
  });

  test('an identity that gave no address is told that it has registered and asked for an address before any protected page, its settings page opened directly included @reg-idp', async ({
    page
  }) => {
    const gate = createContestantIdentityProviderGate(page);
    const termsOfUse = createContestantTermsOfUsePage(page);

    await returnWithNoAddress(page);
    await gate.expectShown({ variant: 'returning', addressState: 'none', asks: 'email' });
    await gate.expectReturning('none');

    // Before answering, the user opens the settings page by its address: the view is shown there, in place of the page.
    await identityProviderFlow.openSettings(page);
    await gate.expectShownInPlaceOfSettings();
    await gate.expectShown({ variant: 'returning', addressState: 'none', asks: 'email' });
    await gate.expectReturning('none');

    // The address is given there; the terms of use, not yet accepted, follow, and then the settings page itself.
    await gate.giveAddress(identityProviderFlow.freshAddress());
    await gate.pressContinue();
    await termsOfUse.expectShown();
    await gate.expectGone();
    await termsOfUse.acceptAndAdvance();
    await identityProviderFlow.expectSettings(page);
  });

  test('an identity whose grant an administrator removed is shown its pending address once, gets no new candidate and is told there is nothing to edit, with no address shown @reg-idp', async ({
    page
  }) => {
    const gate = createContestantIdentityProviderGate(page);
    const nothingToEdit = createContestantNothingToEditPage(page);

    const sub = await identityProviderFlow.registerWithIdentityProvider(page, {
      address: identityProviderFlow.freshAddress()
    });
    await identityProviderFlow.signOut(page);
    await identityProviderFlow.removeGrant(sub, 'candidate');

    await identityProviderFlow.startIdentityProviderFlow(page);
    await gate.expectShown({ variant: 'returning', addressState: 'pending', asks: '' });
    await gate.expectReturning('pending');
    await gate.pressContinue();

    // The terms were accepted at registration, so the app root decides: the account edits nothing.
    await nothingToEdit.expectShown();
    await gate.expectGone();
    await nothingToEdit.expectNoAddress();
    await identityProviderFlow.expectNoOwnEntity(sub, 'candidate');

    // The view was shown once: the app root asked for again goes straight to the same decision.
    await nothingToEdit.open();
    await gate.expectGone();
  });

  test.describe('accessibility scans', () => {
    declareScans({
      name: 'identity-provider-gate-returning-none',
      fixture: 'raw',
      routeId: 'ContestantAppHome',
      contentTestId: testIds.contestant.identityProviderGate.container,
      postLoginTestId: testIds.contestant.identityProviderGate.container,
      reach: async (page) => {
        await returnWithNoAddress(page);
        await createContestantIdentityProviderGate(page).expectShown({
          variant: 'returning',
          addressState: 'none',
          asks: 'email'
        });
      }
    });

    declareScans({
      name: 'identity-provider-gate-returning-proved',
      fixture: 'raw',
      routeId: 'ContestantAppHome',
      contentTestId: testIds.contestant.identityProviderGate.container,
      postLoginTestId: testIds.contestant.identityProviderGate.container,
      reach: async (page) => {
        await returnWithProvedAddress(page);
        await createContestantIdentityProviderGate(page).expectShown({
          variant: 'returning',
          addressState: 'proved',
          asks: ''
        });
      }
    });
  });
});

/**
 * Register a fresh identity as a candidate with a fresh address it does not open the link of, so the address is pending on the candidate's home.
 *
 * @param page - The test's page.
 * @returns The minted `sub` and the pending address.
 */
async function registerWithPendingAddress(page: Page): Promise<{ sub: string; address: string }> {
  const address = identityProviderFlow.freshAddress();
  const sub = await identityProviderFlow.registerWithIdentityProvider(page, { address });
  return { sub, address };
}

/**
 * Register a fresh identity with a pending address, sign out from its home, and come back through the provider to the view a returning identity with a pending address meets.
 *
 * @param page - The test's page.
 * @returns The minted `sub` and the pending address.
 */
async function returnWithPendingAddress(page: Page): Promise<{ sub: string; address: string }> {
  const registered = await registerWithPendingAddress(page);
  await identityProviderFlow.signOut(page);
  await identityProviderFlow.startIdentityProviderFlow(page);
  await createContestantIdentityProviderGate(page).expectShown({
    variant: 'returning',
    addressState: 'pending',
    asks: ''
  });
  return registered;
}

test.describe('an address awaiting its link', () => {
  test('an identity that gave an address and did not open its link is shown the address once, can have the link sent again, and is reminded of it on its home @reg-idp', async ({
    page
  }) => {
    const gate = createContestantIdentityProviderGate(page);
    const home = createContestantHomePage(page);

    const { sub, address } = await returnWithPendingAddress(page);
    await identityProviderFlow.expectConfirmationMailCount(address, 1);

    // The address is shown, not asked for again.
    await gate.expectReturning('pending');
    await gate.expectAwaitingAddress(address);
    await gate.expectNoAddressField();

    // Send again mails the link a second time.
    await gate.pressResend(address);
    await gate.expectResendRequested();
    await identityProviderFlow.expectConfirmationMailCount(address, 2);

    // Continue leads to the home, whose first task names the address.
    await gate.pressContinue();
    await identityProviderFlow.expectOwnEntityHome(page, sub);
    await gate.expectGone();
    await home.expectEmailTask(address);
  });

  test('an identity whose address awaits its link opens its settings from the reminder, is refused another account’s address and saves a fresh one, which is mailed and reminded @reg-idp', async ({
    page
  }) => {
    const home = createContestantHomePage(page);
    const settings = createContestantSettingsPage(page);

    const { address } = await registerWithPendingAddress(page);
    await home.expectEmailTask(address);
    await home.followEmailTask();

    // The settings page shows the pending address as not confirmed, gives the password form no user name, and sends the link again.
    await settings.expectEmailPending(address);
    await settings.expectNoUserName();
    await settings.pressResend(address);
    await settings.expectResendRequested();
    await identityProviderFlow.expectConfirmationMailCount(address, 2);

    // Another account's address is refused at the field.
    const heldAddress = await identityProviderFlow.addressAnotherAccountHolds();
    await settings.changeEmail();
    await settings.giveEmail(heldAddress);
    await settings.saveEmail();
    await settings.expectEmailInUse();

    // A fresh address replaces the pending one: its link is mailed, and the page and the home's email task show it.
    const freshAddress = identityProviderFlow.freshAddress();
    await settings.giveEmail(freshAddress);
    await settings.saveEmail();
    await settings.expectEmailPending(freshAddress);
    await identityProviderFlow.expectConfirmationMailCount(freshAddress, 1);
    await settings.returnHome();
    await home.expectEmailTask(freshAddress);
  });

  test.describe('accessibility scans', () => {
    declareScans({
      name: 'identity-provider-gate-returning-pending',
      fixture: 'raw',
      routeId: 'ContestantAppHome',
      contentTestId: testIds.contestant.identityProviderGate.container,
      postLoginTestId: testIds.contestant.identityProviderGate.resend,
      reach: async (page) => {
        await returnWithPendingAddress(page);
      }
    });

    declareScans({
      name: 'identity-provider-home-email-pending',
      fixture: 'raw',
      routeId: 'ContestantAppHome',
      contentTestId: testIds.contestant.home.tasks,
      postLoginTestId: testIds.contestant.home.emailPending,
      reach: async (page) => {
        const { address } = await registerWithPendingAddress(page);
        await createContestantHomePage(page).expectEmailTask(address);
      }
    });

    declareScans({
      name: 'identity-provider-settings-email-pending',
      fixture: 'raw',
      routeId: 'ContestantAppHome',
      contentTestId: testIds.contestant.settings.email,
      postLoginTestId: testIds.contestant.settings.emailPendingResend,
      reach: async (page) => {
        const { address } = await registerWithPendingAddress(page);
        const home = createContestantHomePage(page);
        await home.expectEmailTask(address);
        await home.followEmailTask();
        await createContestantSettingsPage(page).expectEmailPending(address);
      }
    });
  });

  for (const viewport of PHONE_VIEWPORTS) {
    const width = viewport.width;

    test.describe(`${width}px wide`, () => {
      test.use(phoneUse(viewport));

      test(`phone ${width}: the view a returning identity with a pending address meets does not overflow`, async ({
        page
      }) => {
        const { address } = await returnWithPendingAddress(page);
        await createContestantIdentityProviderGate(page).expectAwaitingAddress(address);
        await createPageGeometry(page).expectNoHorizontalOverflow();
      });

      test(`phone ${width}: the home whose first task is a pending address does not overflow`, async ({ page }) => {
        const { address } = await registerWithPendingAddress(page);
        const home = createContestantHomePage(page);
        await home.expectEmailTask(address);
        await home.expectFitsViewport();
      });
    });
  }
});

/**
 * Two fresh identities, each in its own browser, register a candidate each and give one same fresh address, which the first gives first: each account then has that address pending, and the address has a confirmation mail from each. The second gives it after the address's one-mail-a-minute slot is given back.
 *
 * @param firstPage - The first identity's page.
 * @param secondPage - The second identity's page, in a browser context of its own.
 * @returns The address, and the link of each identity's confirmation mail, to open as received.
 */
async function twoIdentitiesGiveOneAddress(
  firstPage: Page,
  secondPage: Page
): Promise<{ address: string; firstLink: string; secondLink: string }> {
  const address = identityProviderFlow.freshAddress();
  await identityProviderFlow.registerWithIdentityProvider(firstPage, { address });
  await identityProviderFlow.expectConfirmationMailCount(address, 1);
  const firstLink = await identityProviderFlow.confirmationLinkToOpen(address);
  await identityProviderFlow.giveBackMailSlot(address);
  await identityProviderFlow.registerWithIdentityProvider(secondPage, { address });
  await identityProviderFlow.expectConfirmationMailCount(address, 2);
  const secondLink = await identityProviderFlow.confirmationLinkToOpen(address);
  return { address, firstLink, secondLink };
}

test.describe('a link that confirms an address', () => {
  /** The browser contexts a test of this describe opened beside its own, closed after it. */
  const openedContexts = new Array<BrowserContext>();

  /**
   * Open a page in a browser context of its own, with the project's options and no session.
   *
   * @param browser - The test's browser.
   * @returns The page.
   */
  async function pageInAnotherBrowser(browser: Browser): Promise<Page> {
    const context = await browser.newContext();
    openedContexts.push(context);
    return context.newPage();
  }

  test.afterEach(async () => {
    for (const context of openedContexts.splice(0)) await context.close();
  });

  test('two identities give one address and the first opens its link; the second’s link, confirmed in the browser where it is signed in, signs that browser out and ends on the login page, which says the address is now another account’s @reg-idp', async ({
    page,
    browser
  }) => {
    const firstSetPassword = createContestantSetPasswordGate(page);
    const secondPage = await pageInAnotherBrowser(browser);

    const { address, firstLink, secondLink } = await twoIdentitiesGiveOneAddress(page, secondPage);

    // The first identity opens its link: the address is its account's, and the view asking for a password names it.
    await openMailedLink(page, firstLink);
    await firstSetPassword.expectShown();
    await firstSetPassword.expectAddress(address);

    // The second opens its link where it is signed in: the confirm page says so, and Continue signs that browser out before the link is verified, so the failure lands on the login page with its notice.
    const secondConfirmPage = createAuthConfirmPage(secondPage);
    await secondConfirmPage.open(secondLink);
    await secondConfirmPage.expectShown('email_change');
    await secondConfirmPage.expectSignedInNotice(true);
    await secondConfirmPage.pressContinue();
    await createContestantLoginPage(secondPage).expectNotice('emailTaken');
  });

  test('two identities give one address and the first opens its link; the second’s link opened with no session ends on the login page, which says the address is now another account’s @reg-idp', async ({
    page,
    browser
  }) => {
    const secondPage = await pageInAnotherBrowser(browser);
    const { firstLink, secondLink } = await twoIdentitiesGiveOneAddress(page, secondPage);

    await openMailedLink(page, firstLink);
    await createContestantSetPasswordGate(page).expectShown();

    // The second link, opened and confirmed in a browser that holds no session.
    const pageWithNoSession = await pageInAnotherBrowser(browser);
    await openMailedLink(pageWithNoSession, secondLink);
    await createContestantLoginPage(pageWithNoSession).expectNotice('emailTaken');
  });

  test('an identity that proved its address signs out, follows the sign-in screen to the forgot-password page with it, and the mailed recovery link leads to the password-reset page and then to its home @reg-idp', async ({
    page
  }) => {
    const setPasswordGate = createContestantSetPasswordGate(page);
    const loginPage = createContestantLoginPage(page);
    const forgotPasswordPage = createContestantForgotPasswordPage(page);
    const passwordResetPage = createContestantPasswordResetPage(page);
    const emailSent = createContestantEmailSentPage(page, new SupabaseAdminClient());

    // Registered with an address, proved through its link, and signed out from the view asking for a password.
    const address = identityProviderFlow.freshAddress();
    const sub = await identityProviderFlow.registerWithIdentityProvider(page, { address });
    await identityProviderFlow.proveAddress(page, address);
    await setPasswordGate.expectShown();
    await setPasswordGate.logOut();
    await loginPage.expectEntryShown();

    // The sign-in screen's link for a user without a password leads to the forgot-password page with the proved address, which asks for a link to it. The account holds a grant, so it is sent the recovery mail.
    await loginPage.openSignIn();
    await loginPage.signInScriptLoaded();
    await loginPage.typeEmail(address);
    await loginPage.followNoPasswordYet();
    await forgotPasswordPage.expectEmail(address);
    await identityProviderFlow.giveBackMailSlot(address);
    await forgotPasswordPage.pressSubmit();
    await emailSent.expectShown({ wording: 'recovery', address });

    // The link, opened as received and confirmed, signs the identity in by email for the first time: the password-reset page, which names the account, then the home.
    await openMailedLink(page, await identityProviderFlow.recoveryLinkToOpen(address));
    await passwordResetPage.expectShown();
    await passwordResetPage.expectAddress(address);
    await passwordResetPage.setPassword(CHOSEN_PASSWORD);
    await identityProviderFlow.expectOwnEntityHome(page, sub);
    await setPasswordGate.expectGone();
  });
});

test.describe('both entity types registered with the provider', () => {
  test.beforeAll(async () => {
    await identityProviderFlow.setIdentityProviderMatrix(['candidate', 'organization']);
  });

  test.afterAll(async () => {
    await identityProviderFlow.setIdentityProviderMatrix(['candidate']);
  });

  test('a party is chosen, identified, named in the default locale and given an address, and waits unconfirmed for an administrator @reg-idp @org-registration', async ({
    page,
    context
  }) => {
    const gate = createContestantIdentityProviderGate(page);
    const termsOfUse = createContestantTermsOfUsePage(page);

    const sub = await identityProviderFlow.mintIdentity(context, { outcome: 'success' });
    await identityProviderFlow.startIdentityProviderFlow(page, { entityType: 'organization', byKeyboard: true });

    // Back signed in, with a party the application made: the view asks for the party's names before the address.
    await gate.expectShown({ variant: 'new', addressState: 'none', asks: 'name email' });
    await gate.expectHeadingFocused();
    await gate.giveNames(PARTY_NAMES);
    await gate.giveAddress(identityProviderFlow.freshAddress());
    await gate.pressContinue();
    await termsOfUse.expectShown();
    await gate.expectGone();
    await termsOfUse.acceptAndAdvance();
    await identityProviderFlow.expectOwnEntityHome(page, sub, 'organization');

    // The party holds what was typed, in the default locale, and waits for an administrator's confirmation.
    const organization = await identityProviderFlow.organizationOf(sub);
    expect(organization.confirmed, 'the party is confirmed').toBe(false);
    expect(organization.name?.en, 'the party’s name in the default locale').toBe(PARTY_NAMES.name);
    expect(organization.shortName?.en, 'the party’s abbreviation in the default locale').toBe(PARTY_NAMES.shortName);
  });

  test('an identity that registered a candidate and gave an address comes back choosing a party, names it, and meets the profile selection with both @reg-idp', async ({
    page,
    context
  }) => {
    const gate = createContestantIdentityProviderGate(page);
    const termsOfUse = createContestantTermsOfUsePage(page);

    // The identity registers a candidate and gives an address.
    const sub = await identityProviderFlow.mintIdentity(context, { outcome: 'success' });
    await identityProviderFlow.startIdentityProviderFlow(page, { entityType: 'candidate' });
    await gate.expectShown({ variant: 'new', addressState: 'none', asks: 'email' });
    await gate.giveAddress(identityProviderFlow.freshAddress());
    await gate.pressContinue();
    await termsOfUse.expectShown();
    await termsOfUse.acceptAndAdvance();
    await identityProviderFlow.expectOwnEntityHome(page, sub, 'candidate');
    await createContestantLogoutButton(page).clickWithoutDialog();

    // The same identity comes back choosing a party: it is asked for the party's name alone.
    await identityProviderFlow.startIdentityProviderFlow(page, { entityType: 'organization' });
    await gate.expectShown({ variant: 'new', addressState: 'pending', asks: 'name' });
    await gate.giveNames(PARTY_NAMES);
    await gate.pressContinue();

    // Then the profile selection, listing the candidate and the party.
    const selection = createContestantEntitySelectionPage(page);
    await selection.expectShown();
    await gate.expectGone();
    const view = await selection.readView();
    expect(view.groups.map((group) => group.entityType)).toEqual(['candidate', 'organization']);
    expect(view.groups.map((group) => group.cards.length)).toEqual([1, 1]);
    expect(view.groups[1].cards[0].title).toBe(PARTY_NAMES.name);
  });

  test.describe('accessibility scans', () => {
    declareScans({
      name: 'identity-provider-gate-new-organization',
      fixture: 'raw',
      routeId: 'ContestantAppHome',
      contentTestId: testIds.contestant.identityProviderGate.container,
      postLoginTestId: testIds.contestant.identityProviderGate.container,
      reach: async (page) => {
        await arriveAsNewParty(page);
      }
    });

    declareScans({
      name: 'identity-provider-gate-invalid',
      fixture: 'raw',
      routeId: 'ContestantAppHome',
      contentTestId: testIds.contestant.identityProviderGate.container,
      postLoginTestId: testIds.contestant.identityProviderGate.nameError,
      reach: async (page) => {
        await arriveAsNewParty(page);
        const gate = createContestantIdentityProviderGate(page);
        await gate.pressContinue();
        await gate.expectNameError();
      }
    });

    declareScans({
      name: 'identity-provider-gate-email-in-use',
      fixture: 'raw',
      routeId: 'ContestantAppHome',
      contentTestId: testIds.contestant.identityProviderGate.container,
      postLoginTestId: testIds.contestant.emailEntry.emailError,
      reach: async (page) => {
        const heldAddress = await identityProviderFlow.addressAnotherAccountHolds();
        await identityProviderFlow.mintIdentity(page.context(), { outcome: 'success' });
        await identityProviderFlow.startIdentityProviderFlow(page, { entityType: 'candidate' });
        const gate = createContestantIdentityProviderGate(page);
        await gate.expectShown({ variant: 'new', addressState: 'none', asks: 'email' });
        await gate.giveAddress(heldAddress);
        await gate.pressContinue();
        await gate.expectEmailInUse();
      }
    });
  });

  for (const viewport of PHONE_VIEWPORTS) {
    const width = viewport.width;

    test.describe(`${width}px wide`, () => {
      test.use(phoneUse(viewport));

      test(`phone ${width}: the view a new party arrives at, with every locale of its names shown, does not overflow`, async ({
        page
      }) => {
        await arriveAsNewParty(page);
        await createContestantIdentityProviderGate(page).expandNameTranslations();
        await createPageGeometry(page).expectNoHorizontalOverflow();
      });
    });
  }
});

test.describe('what the type cookie and the matrix refuse', () => {
  test.beforeAll(async () => {
    await identityProviderFlow.setIdentityProviderMatrix(['candidate']);
  });

  // A test that switches the provider's mode off leaves it off when it fails, so the matrix is written back after each test.
  test.afterEach(async () => {
    await identityProviderFlow.setIdentityProviderMatrix(['candidate']);
  });

  test('a type forged in the type cookie while the browser is at the provider is refused, and nothing is written for the identity @reg-idp', async ({
    page,
    context
  }) => {
    const errorPage = createContestantIdentityProviderErrorPage(page);

    // Candidates alone register with the provider. The flow is started for a candidate, and at the provider the browser's owner rewrites the type to an organization.
    const sub = await identityProviderFlow.mintIdentity(context, { outcome: 'success' });
    await identityProviderFlow.startIdentityProviderFlow(page, {
      entityType: 'candidate',
      atProvider: () => identityProviderFlow.forgeEntityType(context, 'organization')
    });

    // Back from the provider: the refusal of the type, in the class trying again cannot cure.
    await errorPage.expectShown('noRetry');
    await errorPage.expectCode('mode_not_allowed');
    await errorPage.expectTryAgain(true);
    await errorPage.expectReturn();

    // Nothing was written for the identity: no account, and no candidate or organization it edits.
    await identityProviderFlow.expectNoAccountFor(sub);
    expect(await identityProviderFlow.entitiesOf(sub)).toEqual({ candidate: [], organization: [] });
  });

  test('a mode switched off while the registration screen shows it is refused on Continue, in the class trying again cannot cure, with Return and no Try again @reg-idp', async ({
    page,
    context
  }) => {
    const registerPage = createContestantRegisterPage(page);
    const errorPage = createContestantIdentityProviderErrorPage(page);

    // The registration screen shows the provider's panel; before Continue is pressed, the provider's mode stops being allowed for any type.
    const sub = await identityProviderFlow.mintIdentity(context, { outcome: 'success' });
    await identityProviderFlow.startIdentityProviderFlow(page, {
      beforeContinue: async () => {
        await registerPage.expectIdentityProviderPanel(['candidate']);
        await identityProviderFlow.setIdentityProviderMatrix([]);
      }
    });

    // The refusal, with no Try again, since the mode is no longer listed, and with Return.
    await errorPage.expectShown('noRetry');
    await errorPage.expectCode('mode_not_allowed');
    await errorPage.expectReturnWithoutTryAgain();
    await errorPage.expectSupportButtonWithoutIcon();

    // Nothing was written for the identity.
    await identityProviderFlow.expectNoAccountFor(sub);
    expect(await identityProviderFlow.entitiesOf(sub)).toEqual({ candidate: [], organization: [] });
  });
});

test.describe('an account given a second candidate', () => {
  test('an identity whose account an administrator gave a second candidate comes back to its own, gets no third, and meets the profile selection listing both @reg-idp', async ({
    page
  }) => {
    const gate = createContestantIdentityProviderGate(page);
    const selection = createContestantEntitySelectionPage(page);

    // The identity registers a candidate and gives an address, and signs out; an administrator then gives its account a second candidate.
    const sub = await identityProviderFlow.registerWithIdentityProvider(page, {
      address: identityProviderFlow.freshAddress()
    });
    const registered = await identityProviderFlow.entitiesOf(sub);
    expect(registered.candidate, 'candidates the account edits after registering').toHaveLength(1);
    await identityProviderFlow.signOut(page);
    const grantedCandidate = await identityProviderFlow.grantSecondCandidate(sub);

    // The identity comes back: its own candidate is found, and the address it gave is shown once.
    await identityProviderFlow.startIdentityProviderFlow(page);
    await gate.expectShown({ variant: 'returning', addressState: 'pending', asks: '' });
    await gate.pressContinue();

    // The profile selection lists the two candidates, and the account edits those two and nothing else.
    await selection.expectShown();
    await gate.expectGone();
    const view = await selection.readView();
    expect(view.groups.map((group) => group.entityType)).toEqual(['candidate']);
    expect(view.groups.map((group) => group.cards.length)).toEqual([2]);
    expect(await identityProviderFlow.entitiesOf(sub)).toEqual({
      candidate: [registered.candidate[0], grantedCandidate].sort(),
      organization: []
    });
  });
});

test.describe('an address an open invitation holds', () => {
  /** The addresses a test of this describe invited, whose invitations are removed after it. */
  const invitedAddresses = new Array<string>();

  test.afterEach(async () => {
    await identityProviderFlow.removeInvitationsOf(invitedAddresses.splice(0));
  });

  test('an identity that types an address an open invitation holds is told the address is in use, and the invitation stays open @reg-idp', async ({
    page
  }) => {
    const gate = createContestantIdentityProviderGate(page);

    const address = await identityProviderFlow.addressAnOpenInvitationHolds();
    invitedAddresses.push(address);
    await identityProviderFlow.mintIdentity(page.context(), { outcome: 'success' });
    await identityProviderFlow.startIdentityProviderFlow(page, { entityType: 'candidate' });
    await gate.expectShown({ variant: 'new', addressState: 'none', asks: 'email' });

    // The invited address is refused at the field, as another account's is.
    await gate.giveAddress(address);
    await gate.pressContinue();
    await gate.expectEmailInUse();

    // The refusal is the answer of a request that answers once its work is done: no mail went to the address, and the invitation waits for its own holder.
    await identityProviderFlow.expectNoMailFor(address);
    await identityProviderFlow.expectInvitationOpen(address);
  });
});
