import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '../../fixtures/contestant/invitation-landing';
import { openMailedLink } from '../../utils/mailedLink';
import { TESTS_DIR } from '../../utils/testsDir';

/**
 * # Where a claim lands
 *
 * An invitation that promises a role on the project itself, followed through the browser. The server contract of invitations is observed with no screen by `invitation-contract.spec.ts`; this spec shows what the application does with a claim: who is signed in, where they land, and that the grant the landing depends on is the one the claim wrote in that same request.
 *
 * ## The cases
 *
 * - A user who has a password is promised the project's editor role, asks for a sign-in link, opens it and confirms it on the confirm page, which verifies it, claims and lands them in the Contestant App, which tells them there is nothing to edit: a project role names no entity.
 * - A user who has a password is promised the project's admin role and signs in at the Admin App's login. The login action claims and refreshes before its gate reads the session, so a user who held no grant when they submitted the form is let in.
 * - A user nobody invited signs in at the Contestant App's login while an invitation is open for another address. They are refused as any user with no grant is, hold no grant afterwards, and the invitation stays open.
 * - A returning user's sign-in link, as in the first case, opened as received: it opens the confirm page, which verifies and claims nothing until Continue is pressed; then it verifies, claims and lands the user.
 *
 * ## The confirm page
 *
 * The cases of its own describe, which is not serial, so that one of them failing leaves the others to run.
 *
 * - A link fetched twice without a browser, as a mail scanner or a prefetcher does, before the user opens it: the link still signs the user in.
 * - A link opened in a browser signed in to another account: the page says that continuing signs that account out. Cancel leads back to that account's app, still signed in, and spends nothing; the link opened again and confirmed signs the first account out and the link's account in.
 * - A mailed link, followed by the browser, ends on the confirm page's address with the link's token and type, and Continue there signs the user in.
 *
 * ## What it writes
 *
 * Users whose address begins with the spec's own prefix, project-scope invitations for such addresses, and the grants their claims write. Each test removes what it created; `beforeAll` removes what an interrupted run left and `afterAll` asserts that nothing is left. It writes on no entity and seeds no entity invitation, so it changes nothing a voter reads.
 *
 * ## Grants
 *
 * No step writes a grant for a user this spec creates. Every grant asserted here is read with the service role after the application's own request claimed it, and each test first asserts that the user holds none.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch around an expectation). No expectation takes a link, a token or a password as its subject.
 */

/**
 * What the sign-in screen tells a user whose session carries none of the grants the app admits. Read from the English message source rather than copied.
 */
const NO_PROFILE_MESSAGE: string = JSON.parse(
  fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/contestantApp.login.json'), 'utf8')
)['contestantApp.login'].noProfile;

// Every test signs in from scratch.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('where a claimed invitation lands its user', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ invitationFlow }) => {
    await invitationFlow.removeEverythingUnderPrefix();
  });

  test.afterEach(async ({ invitationFlow }) => {
    await invitationFlow.removeEverythingUnderPrefix();
  });

  test.afterAll(async ({ invitationFlow }) => {
    expect(await invitationFlow.leftoversUnderPrefix()).toEqual({ invitations: 0, users: 0 });
  });

  test('a returning user promised a project role is signed in by the mailed link with the grant claimed, and is told there is nothing to edit', async ({
    page,
    invitationFlow,
    contestantNothingToEditPage
  }) => {
    const user = await invitationFlow.createUserWithPassword({ acceptTermsOfUse: true });
    await invitationFlow.seedProjectInvitation('editor', user.email, { confirmEntity: true });
    expect(await invitationFlow.grantRowsOf(user.email), 'grants before the link is opened').toEqual([]);

    const request = await invitationFlow.askForLink({ email: user.email, locale: 'en' });
    expect(request.outcome, 'the link request handed a mail over').toBe('sent');

    // The link is opened as received, on the run's origin, and confirmed on the confirm page, which verifies it, claims, refreshes and lands a user who has a password on the Contestant App's root.
    await openMailedLink(page, await invitationFlow.signInLinkToOpen(user.email, { locale: 'en' }));

    await contestantNothingToEditPage.expectShown();
    await contestantNothingToEditPage.expectSignedInEmail(user.email);

    expect(await invitationFlow.grantRowsOf(user.email)).toEqual([invitationFlow.projectGrant('editor')]);
    const invitations = await invitationFlow.invitationsAddressedTo(user.email);
    expect(invitations).toHaveLength(1);
    expect(invitations[0].claimed_at, 'the invitation is claimed').not.toBeNull();
  });

  test('an invited project admin enters the Admin App through its login, with the grant claimed in the same request', async ({
    invitationFlow,
    adminLoginPage
  }) => {
    const user = await invitationFlow.createUserWithPassword();
    await invitationFlow.seedProjectInvitation('admin', user.email, { confirmEntity: true });
    // The user holds no grant when the form is submitted: only a claim and a refresh ahead of the login's gate can let them in.
    expect(await invitationFlow.grantRowsOf(user.email), 'grants before the login').toEqual([]);

    await adminLoginPage.goToPage();
    await adminLoginPage.login(user.email, user.password);

    await adminLoginPage.expectAdminHome();

    expect(await invitationFlow.grantRowsOf(user.email)).toEqual([invitationFlow.projectGrant('admin')]);
    const invitations = await invitationFlow.invitationsAddressedTo(user.email);
    expect(invitations).toHaveLength(1);
    expect(invitations[0].claimed_at, 'the invitation is claimed').not.toBeNull();
  });

  test("a signed-in stranger gains nothing from another person's invitation", async ({
    page,
    invitationFlow,
    contestantLoginPage
  }) => {
    // An invitation is open for an address that is not the stranger's.
    const invitedAddress = invitationFlow.freshAddress();
    await invitationFlow.seedProjectInvitation('editor', invitedAddress, { confirmEntity: true });
    const stranger = await invitationFlow.createUserWithPassword();

    await contestantLoginPage.goToPage();
    await contestantLoginPage.login(stranger.email, stranger.password);

    // The password is right, so the stranger is signed in and the claim runs as them. It claims nothing, and the login refuses them as it refuses any user with no grant.
    await contestantLoginPage.expectErrorMessage(NO_PROFILE_MESSAGE);
    await expect(page).toHaveURL(/\/contestant\/login/);

    expect(await invitationFlow.grantRowsOf(stranger.email)).toEqual([]);
    const invitations = await invitationFlow.invitationsAddressedTo(invitedAddress);
    expect(invitations).toHaveLength(1);
    expect(invitations[0].claimed_at, 'the invitation is still open').toBeNull();
  });

  test('a mailed sign-in link confirmed on the confirm page signs the user in with the grant claimed', async ({
    invitationFlow,
    authConfirmPage,
    contestantNothingToEditPage
  }) => {
    const user = await invitationFlow.createUserWithPassword({ acceptTermsOfUse: true });
    await invitationFlow.seedProjectInvitation('editor', user.email, { confirmEntity: true });

    const request = await invitationFlow.askForLink({ email: user.email, locale: 'en' });
    expect(request.outcome, 'the link request handed a mail over').toBe('sent');

    // The link is opened as received, on the run's origin: it opens the confirm page.
    await authConfirmPage.open(await invitationFlow.signInLinkToOpen(user.email, { locale: 'en' }));
    await authConfirmPage.expectShown('magiclink');
    await authConfirmPage.expectSignedInNotice(false);
    expect(await invitationFlow.grantRowsOf(user.email), 'grants while the page is shown').toEqual([]);

    await authConfirmPage.pressContinue();

    await contestantNothingToEditPage.expectShown();
    await contestantNothingToEditPage.expectSignedInEmail(user.email);
    expect(await invitationFlow.grantRowsOf(user.email)).toEqual([invitationFlow.projectGrant('editor')]);
    const invitations = await invitationFlow.invitationsAddressedTo(user.email);
    expect(invitations).toHaveLength(1);
    expect(invitations[0].claimed_at, 'the invitation is claimed').not.toBeNull();
  });
});

test.describe('a mailed link on the confirm page', () => {
  test.beforeAll(async ({ invitationFlow }) => {
    await invitationFlow.removeEverythingUnderPrefix();
  });

  test.afterEach(async ({ invitationFlow }) => {
    await invitationFlow.removeEverythingUnderPrefix();
  });

  test.afterAll(async ({ invitationFlow }) => {
    expect(await invitationFlow.leftoversUnderPrefix()).toEqual({ invitations: 0, users: 0 });
  });

  test('fetching the confirm page spends nothing: the link still signs in after two fetches', async ({
    invitationFlow,
    authConfirmPage,
    contestantNothingToEditPage
  }) => {
    const user = await invitationFlow.createUserWithPassword({ acceptTermsOfUse: true });
    await invitationFlow.seedProjectInvitation('editor', user.email, { confirmEntity: true });
    const request = await invitationFlow.askForLink({ email: user.email, locale: 'en' });
    expect(request.outcome, 'the link request handed a mail over').toBe('sent');
    const link = await invitationFlow.signInLinkToOpen(user.email, { locale: 'en' });

    await authConfirmPage.fetchWithoutOpening(link);
    await authConfirmPage.fetchWithoutOpening(link);
    expect(await invitationFlow.grantRowsOf(user.email), 'grants after the two fetches').toEqual([]);

    await authConfirmPage.open(link);
    await authConfirmPage.expectShown('magiclink');
    await authConfirmPage.pressContinue();

    await contestantNothingToEditPage.expectShown();
    await contestantNothingToEditPage.expectSignedInEmail(user.email);
    expect(await invitationFlow.grantRowsOf(user.email)).toEqual([invitationFlow.projectGrant('editor')]);
  });

  test('a link opened in a browser signed in to another account is confirmed only after a notice, and Cancel keeps that account', async ({
    page,
    invitationFlow,
    authConfirmPage,
    contestantNothingToEditPage
  }) => {
    // The browser is signed in as the first user, through that user's own mailed link.
    const signedIn = await invitationFlow.createUserWithPassword({ acceptTermsOfUse: true });
    await invitationFlow.seedProjectInvitation('editor', signedIn.email, { confirmEntity: true });
    const firstRequest = await invitationFlow.askForLink({ email: signedIn.email, locale: 'en' });
    expect(firstRequest.outcome, "the first user's link request handed a mail over").toBe('sent');
    await openMailedLink(page, await invitationFlow.signInLinkToOpen(signedIn.email, { locale: 'en' }));
    await contestantNothingToEditPage.expectShown();
    await contestantNothingToEditPage.expectSignedInEmail(signedIn.email);

    // The second user's link is opened in that browser.
    const linked = await invitationFlow.createUserWithPassword({ acceptTermsOfUse: true });
    await invitationFlow.seedProjectInvitation('editor', linked.email, { confirmEntity: true });
    const secondRequest = await invitationFlow.askForLink({ email: linked.email, locale: 'en' });
    expect(secondRequest.outcome, "the second user's link request handed a mail over").toBe('sent');
    const link = await invitationFlow.signInLinkToOpen(linked.email, { locale: 'en' });

    await authConfirmPage.open(link);
    await authConfirmPage.expectShown('magiclink');
    await authConfirmPage.expectSignedInNotice(true);
    await authConfirmPage.pressCancel();

    // Cancel led back to the first user's app, still signed in as that user, and spent nothing.
    await contestantNothingToEditPage.expectShown();
    await contestantNothingToEditPage.expectSignedInEmail(signedIn.email);
    expect(await invitationFlow.grantRowsOf(linked.email), "the second user's grants after Cancel").toEqual([]);

    // The link still works: confirmed, it signs the first user out and the second in.
    await authConfirmPage.open(link);
    await authConfirmPage.expectShown('magiclink');
    await authConfirmPage.expectSignedInNotice(true);
    await authConfirmPage.pressContinue();

    await contestantNothingToEditPage.expectShown();
    await contestantNothingToEditPage.expectSignedInEmail(linked.email);
    expect(await invitationFlow.grantRowsOf(linked.email)).toEqual([invitationFlow.projectGrant('editor')]);
  });

  test('a mailed link lands on the confirm page with its parameters, and Continue signs in', async ({
    invitationFlow,
    authConfirmPage,
    contestantNothingToEditPage
  }) => {
    const user = await invitationFlow.createUserWithPassword({ acceptTermsOfUse: true });
    await invitationFlow.seedProjectInvitation('editor', user.email, { confirmEntity: true });
    const request = await invitationFlow.askForLink({ email: user.email, locale: 'en' });
    expect(request.outcome, 'the link request handed a mail over').toBe('sent');

    // The browser that follows the link as received ends on the confirm page, whose address carries the link's token and type.
    await authConfirmPage.open(await invitationFlow.signInLinkToOpen(user.email, { locale: 'en' }));
    await authConfirmPage.expectAtConfirmAddress('magiclink');
    await authConfirmPage.expectShown('magiclink');
    expect(await invitationFlow.grantRowsOf(user.email), 'grants while the page is shown').toEqual([]);

    await authConfirmPage.pressContinue();

    await contestantNothingToEditPage.expectShown();
    await contestantNothingToEditPage.expectSignedInEmail(user.email);
    expect(await invitationFlow.grantRowsOf(user.email)).toEqual([invitationFlow.projectGrant('editor')]);
  });
});
