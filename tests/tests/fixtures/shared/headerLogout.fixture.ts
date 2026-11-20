/**
 * @file headerLogout fixture (shared).
 *
 * Function-fixture for the Log out button in the app header, which a signed-in user of the Contestant App or of the Admin App has on every page of the app. A spec of the Admin App builds it directly with `createHeaderLogout(page)`; a composition root may compose it.
 *
 * Surface:
 *  - expectShown()   — the header's Log out is visible and enabled.
 *  - expectAbsent()  — the header has no Log out. The caller has shown that the page's script has loaded.
 *  - press()         — press it, once it is enabled. The caller asserts what follows.
 *  - installClock()  — put the page's clock under the test's control. Call it before the press that starts the logout modal's count.
 *  - installClockBehindTheServer() — put the page's clock five minutes behind the server's, as a device whose clock is off has it, leaving the browser's cookie store on its own clock.
 *  - pressExpectingDialog() — press it, and the logout modal opens.
 *  - goBack()        — go back in the browser's history.
 *  - goBackAndSettle() — go back in the browser's history, and wait for the page it leads to.
 *  - goBackFromThePage() — go back in the history from the page's own script, and wait for the event that tells the page, not for a navigation.
 *  - historyLength() — the length of the tab's history.
 *  - expectLeftTheApp() — the tab's address is the blank page that came before the test's first page.
 *  - expectDialogClosed() — no dialog is open.
 *  - expectDialogOpen() — a dialog is open and shown.
 *  - advancePastModalCount() — move the page's clock past the logout modal's count.
 *  - moveWallClockPastTheCount() — move the page's wall clock past the logout modal's count with no timer fired, as a frozen or sleeping tab finds it on its return.
 *  - showTabAgain()  — tell the page that its tab is shown again.
 *  - reloadTab()     — reload the tab. The caller asserts what is shown.
 *  - stay()          — press the logout modal's Continue, and the modal closes.
 *  - closeAsThePlatformDoes() — close the open dialog with no key pressed, as a phone's back gesture does, and the dialog closes.
 *  - logOutInModal() — press the logout modal's Log out. The caller asserts where the user ends.
 *  - pressModalClose() — press the open dialog's close button, the ✕. The caller asserts what follows.
 *  - pressEscape()   — press Escape. The caller asserts what follows.
 *  - expectModalSaysUnsavedAlone() — the modal says that unsaved changes will be lost, and nothing more than its count.
 *  - expectModalSaysUnsavedAndWhatIsLeft() — the modal says that unsaved changes will be lost, and at least one more thing above its count.
 *  - expectModalNamesUnsavedAndDescribesCount() — the browser names the dialog by the sentence on unsaved changes, which the body shows, and computes a description for it that holds the sentence with the count's full length and not the one on unsaved changes.
 *  - expectModalDescribesCount() — that description holds the sentence with the count's full length, and not the one on unsaved changes.
 *  - expectModalDescriptionHoldsWhileCounting() — five seconds on, the visible number has moved and the description still says the full length. Needs installClock().
 *  - expectNoSignOutRequest() — no sign-out request has been sent since the fixture was created.
 *  - expectSignOutRequested() — a sign-out request is sent, within a slow page's time.
 *  - expectStillSignedIn() — the server answers a signed-in user's page, as its first response.
 *  - expectSignedOut() — the server answers that page with a redirect to the login page, as its first response.
 *  - endSessionWithNoSignal() — end the session on the server and clear the context's cookies, with no tab told of it, as a sign-out made by a server load in another tab does.
 *  - dropSessionCookies() — remove the session's cookies from the context and keep every other cookie, as a browser that no longer holds the session does, with the two cookies of the logout modal's count still stored.
 *  - failSignOut()   — from now on the sign-out request is answered with a failure and never reaches the server, so the cookies stay.
 *  - failSignOutAfterClearingCookies() — from now on the sign-out request reaches the server, whose answer clears the cookies, and the page is told it failed.
 *  - restoreSignOut() — the sign-out request works again.
 *  - holdSignOut()   — from now on the sign-out request is kept from the server until releaseSignOut().
 *  - releaseSignOut() — let the held sign-out request reach the server, and the sign-out request works as before.
 *  - releaseSignOutAsFailure() — answer the held sign-out request with a failure that never reaches the server, so the cookies stay, and the sign-out request works as before.
 *  - expectInProgress() — the header's Log out shows that a sign-out is under way: disabled, holding the loading indicator and named by the loading text.
 *  - expectFailureMessage() — the message that a sign-out could not be confirmed is shown.
 *  - expectNoFailureMessage() — that message is not shown.
 *  - expectFailureMessagePressable() — every button of that message is the topmost element at its own centre.
 *  - expectFailureMessageNamedOnce() — that message is named by a title of its own, not Log out, and holds one button for assistive technology, named Close.
 *  - closeFailureMessage() — press that message's first Close.
 *  - expectFailureMessageInsideThePhoneViewport() — at a phone's size, that message's box lies inside the viewport.
 *  - seedContestantDraft() — store one draft of the Contestant App in the page's `localStorage`, as an unsaved answer leaves it.
 *  - expectNoContestantDraft() — the page's `localStorage` holds no draft of the Contestant App.
 *  - expectLogoutDeadlineSet() — the context holds the two cookies of the logout modal's count, one id in both, and the deadline's expires at the count's end plus its grace.
 *  - passLogoutDeadline() — remove the deadline's cookie from the context and keep the pending one, as the browser does at the deadline's expiry while the tab is closed.
 *  - dropLogoutDeadline() — remove the deadline's cookie from the context if it holds one, as the browser does at the deadline's expiry, whether or not a count is still stored.
 *  - expectNoLogoutDeadline() — the context holds neither cookie of the logout modal's count, of any value.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { COOKIE } from '../../../../apps/frontend/src/lib/cookies/index';
import { ROUTE } from '../../../../apps/frontend/src/lib/routes/route';
import { escapeRegExp } from '../../../../apps/frontend/src/lib/utils/regexp';
import { TIMEOUTS, waitForNavigationFocusReset } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { DRAFT_KEY_STEM } from '../../utils/contestantDrafts';
import { routeUntilEnded } from '../../utils/endableRoute';
import { messagesOf } from '../../utils/messages';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';
import type { EndRoute } from '../../utils/endableRoute';

/** The length of the logout modal's count in seconds, by the button's default. */
const MODAL_COUNT_SECONDS = 30;

/** How far the page's clock is moved, in milliseconds: past the logout modal's count. */
const PAST_THE_MODAL_COUNT_MS = (MODAL_COUNT_SECONDS + 1) * 1000;

/** The grace the page adds to the count in the deadline cookie's max age, in seconds. */
const LOGOUT_DEADLINE_GRACE_SECONDS = 10;

/** The shape of the id both cookies of the logout modal's count hold. */
const COUNT_ID = /^[0-9a-f]{32}$/;

/** How far behind the server's clock {@link createHeaderLogout}'s `installClockBehindTheServer` puts the page's, in milliseconds: five minutes, far more than the count and its grace. */
const CLOCK_BEHIND_THE_SERVER_MS = 5 * 60_000;

/** The English messages the steps assert, read from the message source rather than copied. */
const COMMON_MESSAGES = messagesOf('common') as Record<string, string>;
const ERROR_MESSAGES = messagesOf('error') as Record<string, string>;
const LOGOUT_MODAL_MESSAGES = messagesOf('contestantApp.logoutModal') as Record<string, string>;

/**
 * The logout modal's sentence with its count.
 *
 * @param seconds - The seconds the sentence says are left.
 * @returns The sentence.
 */
function ingressAt(seconds: number): string {
  return LOGOUT_MODAL_MESSAGES.ingress.replace('{timeLeft}', String(seconds));
}

/** How a held sign-out request ends: it reaches the server, or it is answered with a failure and never does. */
type HeldSignOutOutcome = 'reachServer' | 'fail';

/** What the sign-out endpoint answers when the sign-out failed. */
const SIGN_OUT_FAILURE = { status: 502, json: { ok: false, type: 'failure' } };

/** The session cookies `@supabase/ssr` writes: `sb-<first label of the project host>-auth-token` and its `.0`, `.1`, … chunks. */
const SESSION_COOKIE = /^sb-[A-Za-z0-9-]+-auth-token(?:\.\d+)?$/;

/** The size of a phone's viewport. */
const PHONE_VIEWPORT = { width: 390, height: 600 };

/** The key {@link createHeaderLogout}'s `seedContestantDraft` stores a draft under: the drafts' stem, then a user, an entity type and an entity of no dataset. */
const SEEDED_DRAFT_KEY = `${DRAFT_KEY_STEM}seeded-user-candidate-seeded-entity`;

/**
 * Create the fixture for the header's Log out.
 *
 * @param page - The page the fixture drives.
 * @returns The fixture's steps: `expectShown`, `expectAbsent`, `press`, `installClock`, `installClockBehindTheServer`, `pressExpectingDialog`, `goBack`, `goBackAndSettle`, `goBackFromThePage`, `historyLength`, `expectLeftTheApp`, `expectDialogClosed`, `expectDialogOpen`, `advancePastModalCount`, `moveWallClockPastTheCount`, `showTabAgain`, `reloadTab`, `stay`, `closeAsThePlatformDoes`, `logOutInModal`, `pressModalClose`, `pressEscape`, `expectModalSaysUnsavedAlone`, `expectModalSaysUnsavedAndWhatIsLeft`, `expectModalNamesUnsavedAndDescribesCount`, `expectModalDescribesCount`, `expectModalDescriptionHoldsWhileCounting`, `expectNoSignOutRequest`, `expectSignOutRequested`, `expectStillSignedIn`, `expectSignedOut`, `endSessionWithNoSignal`, `dropSessionCookies`, `failSignOut`, `failSignOutAfterClearingCookies`, `restoreSignOut`, `holdSignOut`, `releaseSignOut`, `releaseSignOutAsFailure`, `expectInProgress`, `expectFailureMessage`, `expectNoFailureMessage`, `expectFailureMessagePressable`, `expectFailureMessageNamedOnce`, `closeFailureMessage`, `expectFailureMessageInsideThePhoneViewport`, `seedContestantDraft`, `expectNoContestantDraft`, `expectLogoutDeadlineSet`, `passLogoutDeadline`, `dropLogoutDeadline` and `expectNoLogoutDeadline`.
 */
export function createHeaderLogout(page: Page) {
  const button = page.getByTestId(testIds.shared.header.logout);
  const dialog = page.getByRole('dialog');
  const failureMessage = page.getByRole('alert').filter({ hasText: COMMON_MESSAGES.logoutFailed });

  /** A page only a signed-in user is shown, read from the server to tell whether the session is alive. */
  const signedInPage = buildRoute({ route: 'ContestantAppSettings', locale: 'en' });

  /** Whether a request's address is the sign-out endpoint's. */
  const isSignOutRequest = (url: URL): boolean => url.pathname === ROUTE.AuthLogout;

  /** The keys of the Contestant App's drafts the page's `localStorage` holds. */
  const contestantDraftKeys = (): Promise<Array<string>> =>
    page.evaluate((stem) => Object.keys(window.localStorage).filter((key) => key.startsWith(stem)), DRAFT_KEY_STEM);

  /** The context's cookies of one name. */
  const contextCookiesNamed = async (name: string) =>
    (await page.context().cookies()).filter((cookie) => cookie.name === name);

  /** The names of the context's cookies of the logout modal's count, one entry per copy. */
  const countCookieNames = async (): Promise<Array<string>> =>
    (await page.context().cookies())
      .map(({ name }) => name)
      .filter((name) => name === COOKIE.logoutPending || name === COOKIE.logoutDeadline)
      .sort();

  let signOutRequests = 0;

  /** Ends each route of the sign-out request that `failSignOut()`, `failSignOutAfterClearingCookies()` or `holdSignOut()` set and nothing has ended yet. */
  const signOutRouteEnds: Array<EndRoute> = [];

  /** Let every later sign-out request through as it is. */
  const endSignOutRoutes = (): void => {
    for (const end of signOutRouteEnds.splice(0)) end();
  };

  /** The sign-out request {@link holdSignOut} keeps: the release that ends it, by letting it reach the server or by answering it with a failure, and its arrival and the end of its handling. */
  let heldSignOut:
    { release: (outcome: HeldSignOutOutcome) => void; arrived: Promise<void>; passedOn: Promise<void> } | undefined;

  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === ROUTE.AuthLogout) signOutRequests += 1;
  });

  return {
    /**
     * Assert that the header shows Log out and that it can be pressed. The Contestant App's button is disabled until the page's script has bound its modal, so this also waits for that script.
     */
    async expectShown(): Promise<void> {
      await expect(button).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(button).toBeEnabled({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the header has no Log out.
     *
     * The count is read at once, so the caller first shows that the page's script has loaded and a button it would render is already there: by a navigation inside the application, or by a control only that script enables. No wait for the root layout's focus reset serves here, because the Admin App's login page has a first-level heading that cannot take focus.
     */
    async expectAbsent(): Promise<void> {
      await expect(button).toHaveCount(0);
    },

    /**
     * Press the header's Log out, once it is enabled. The caller asserts where the user ends.
     */
    async press(): Promise<void> {
      await expect(button).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await button.click();
    },

    /**
     * Put the page's clock under the test's control, so that {@link advancePastModalCount} can move it. The clock keeps running at its own pace until it is moved.
     *
     * Call it before the press that opens the modal: a clock installed after the count has started does not reach the timer the count runs on.
     */
    async installClock(): Promise<void> {
      await page.clock.install();
    },

    /**
     * Put the page's clock five minutes behind the server's, as a device whose clock is off has it. Only the page's JavaScript time moves: the browser's cookie store keeps its own clock, as it does on such a device. The clock keeps running at its own pace from there.
     *
     * Call it before the press that opens the modal, as {@link installClock}.
     */
    async installClockBehindTheServer(): Promise<void> {
      await page.clock.install({ time: Date.now() - CLOCK_BEHIND_THE_SERVER_MS });
    },

    /**
     * Press the header's Log out and assert that the logout modal opens.
     */
    async pressExpectingDialog(): Promise<void> {
      await this.press();
      await expect(dialog).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Go back in the browser's history. The caller asserts where the user ends.
     */
    async goBack(): Promise<void> {
      await page.goBack();
    },

    /**
     * Go back in the browser's history and wait for the root layout's focus reset, which follows the page Back led to. The caller asserts what is shown.
     *
     * Going back returns when the address has changed, while the page being left is still in the DOM, so a step that reads the screen at once can pass on that page. Focus is taken off first, because focus already on the heading would satisfy the wait.
     */
    async goBackAndSettle(): Promise<void> {
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      });
      await page.goBack();
      await waitForNavigationFocusReset(page);
    },

    /**
     * Go back in the history from the page's own script, `history.back()`, and wait for the `popstate` event it fires. Unlike {@link goBack}, it does not wait for a navigation, which a navigation the application cancels never makes. The caller asserts where the page ends.
     */
    async goBackFromThePage(): Promise<void> {
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            addEventListener('popstate', () => resolve(), { once: true });
            history.back();
          })
      );
    },

    /**
     * Read the length of the tab's history.
     *
     * @returns The number of entries it holds.
     */
    async historyLength(): Promise<number> {
      return page.evaluate(() => history.length);
    },

    /**
     * Assert that the tab's address is the blank page, the entry before the test's first page, so Back has led out of the application.
     */
    async expectLeftTheApp(): Promise<void> {
      await expect(page).toHaveURL('about:blank');
    },

    /**
     * Assert that no dialog is open. A closed dialog is not in the accessibility tree, so the role counts open ones alone.
     */
    async expectDialogClosed(): Promise<void> {
      await expect(dialog).toHaveCount(0);
    },

    /**
     * Assert that a dialog is open and shown. A dialog the modal closes loses its `open` attribute at once, while it may still be fading out, so the attribute is what tells the two apart.
     */
    async expectDialogOpen(): Promise<void> {
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('open', '');
    },

    /**
     * Move the page's clock past the logout modal's count. Needs {@link installClock} to have been called before the modal opened.
     */
    async advancePastModalCount(): Promise<void> {
      await page.clock.fastForward(PAST_THE_MODAL_COUNT_MS);
    },

    /**
     * Move the page's wall clock past the logout modal's count without firing a timer, as a tab that was frozen or asleep finds it on its return. Needs {@link installClock} to have been called before the modal opened.
     */
    async moveWallClockPastTheCount(): Promise<void> {
      const pageNow = await page.evaluate(() => Date.now());
      await page.clock.setSystemTime(pageNow + PAST_THE_MODAL_COUNT_MS);
    },

    /**
     * Tell the page that its tab is shown again, by the event a browser sends when a hidden tab comes back.
     */
    async showTabAgain(): Promise<void> {
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    },

    /**
     * Reload the tab, as a user does with the browser's reload, and wait for the new document's load. The caller asserts what is shown.
     */
    async reloadTab(): Promise<void> {
      await page.reload();
    },

    /**
     * Press the logout modal's Continue and assert that the modal has closed. The caller asserts what stayed.
     */
    async stay(): Promise<void> {
      await dialog.getByRole('button', { name: LOGOUT_MODAL_MESSAGES.continue, exact: true }).click();
      await expect(dialog).toHaveCount(0);
    },

    /**
     * Close the open dialog through `requestClose()`, which reaches it with no `keydown`, as a close the platform makes does, and assert that no dialog is open. The caller asserts what stayed.
     */
    async closeAsThePlatformDoes(): Promise<void> {
      await dialog.evaluate((element: HTMLDialogElement) => element.requestClose());
      await expect(dialog).toHaveCount(0);
    },

    /**
     * Press the logout modal's Log out. The caller asserts where the user ends.
     */
    async logOutInModal(): Promise<void> {
      await dialog.getByRole('button', { name: COMMON_MESSAGES.logout, exact: true }).click();
    },

    /**
     * Press the open dialog's close button, the ✕, found by its accessible name. The caller asserts what follows.
     */
    async pressModalClose(): Promise<void> {
      await dialog.getByRole('button', { name: COMMON_MESSAGES.closeDialog, exact: true }).click();
    },

    /**
     * Press Escape, with focus where it is. The caller asserts what follows.
     */
    async pressEscape(): Promise<void> {
      await page.keyboard.press('Escape');
    },

    /**
     * Assert that the open modal says that the unsaved changes will be lost, and holds no other paragraph than that sentence and the one with its count.
     */
    async expectModalSaysUnsavedAlone(): Promise<void> {
      await expect(dialog).toContainText(COMMON_MESSAGES.logoutUnsavedChanges);
      await expect(dialog.getByRole('paragraph')).toHaveCount(2);
    },

    /**
     * Assert that the open modal says that the unsaved changes will be lost, and holds at least one more paragraph besides that sentence and the one with its count.
     */
    async expectModalSaysUnsavedAndWhatIsLeft(): Promise<void> {
      await expect(dialog).toContainText(COMMON_MESSAGES.logoutUnsavedChanges);
      await expect.poll(() => dialog.getByRole('paragraph').count()).toBeGreaterThanOrEqual(3);
    },

    /**
     * Assert what the browser computes for the dialog: its accessible name is the sentence on unsaved changes, which the modal's body shows in one visible paragraph; its accessible description holds the sentence with the count's full length, and not the sentence on unsaved changes, so a reader that speaks both does not say it twice.
     */
    async expectModalNamesUnsavedAndDescribesCount(): Promise<void> {
      await expect(dialog).toHaveAccessibleName(COMMON_MESSAGES.logoutUnsavedChanges);
      await expect(dialog).toHaveAccessibleDescription(new RegExp(escapeRegExp(ingressAt(MODAL_COUNT_SECONDS))));
      await expect(dialog).not.toHaveAccessibleDescription(
        new RegExp(escapeRegExp(COMMON_MESSAGES.logoutUnsavedChanges))
      );
      const unsavedParagraphs = dialog.getByRole('paragraph').filter({ hasText: COMMON_MESSAGES.logoutUnsavedChanges });
      await expect(unsavedParagraphs).toHaveCount(1);
      await expect(unsavedParagraphs).toBeVisible();
    },

    /**
     * Assert what the browser computes as the dialog's accessible description: it holds the sentence with the count's full length, and not the sentence on unsaved changes.
     */
    async expectModalDescribesCount(): Promise<void> {
      await expect(dialog).toHaveAccessibleDescription(new RegExp(escapeRegExp(ingressAt(MODAL_COUNT_SECONDS))));
      await expect(dialog).not.toHaveAccessibleDescription(
        new RegExp(escapeRegExp(COMMON_MESSAGES.logoutUnsavedChanges))
      );
    },

    /**
     * Run the page's clock for five seconds and assert that the visible sentence with the count no longer says the full length, while the dialog's accessible description still does. Needs {@link installClock} to have been called before the modal opened.
     */
    async expectModalDescriptionHoldsWhileCounting(): Promise<void> {
      await page.clock.runFor(5_000);
      await expect(dialog.getByRole('paragraph').last()).not.toHaveText(ingressAt(MODAL_COUNT_SECONDS));
      await expect(dialog).toHaveAccessibleDescription(new RegExp(escapeRegExp(ingressAt(MODAL_COUNT_SECONDS))));
    },

    /**
     * Assert that no sign-out request has been sent since the fixture was created.
     */
    async expectNoSignOutRequest(): Promise<void> {
      expect(signOutRequests).toBe(0);
    },

    /**
     * Assert that at least one sign-out request is sent, within a slow page's time.
     */
    async expectSignOutRequested(): Promise<void> {
      await expect
        .poll(() => signOutRequests, { message: 'the sign-out requests sent', timeout: TIMEOUTS.slowPage })
        .toBeGreaterThanOrEqual(1);
    },

    /**
     * Assert that the session is alive on the server: its first response to a page only a signed-in user is shown is that page.
     */
    async expectStillSignedIn(): Promise<void> {
      const response = await page.request.get(signedInPage, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
    },

    /**
     * Assert that the session is over on the server: its first response to a page only a signed-in user is shown is a redirect to the login page.
     */
    async expectSignedOut(): Promise<void> {
      const response = await page.request.get(signedInPage, { maxRedirects: 0 });
      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      expect(response.headers().location).toContain(buildRoute({ route: 'ContestantAppLogin', locale: 'en' }));
    },

    /**
     * End the session on the server and clear this context's cookies, with no tab told of it, as a sign-out made by a server load in another tab does. The sign-out endpoint is called by a request of the context rather than of a page, so no page's script runs and the browser broadcasts nothing; the request shares the context's cookies and takes the cleared ones from the answer. Assert that the answer is ok and that the context holds no session cookie afterwards. The caller asserts what the tab meets next.
     */
    async endSessionWithNoSignal(): Promise<void> {
      const response = await page.request.post(ROUTE.AuthLogout);
      expect(response.ok()).toBe(true);
      const sessionCookies = (await page.context().cookies()).filter(({ name }) => SESSION_COOKIE.test(name));
      expect(sessionCookies.map(({ name }) => name)).toEqual([]);
    },

    /**
     * Remove the session's cookies from the context and keep every other cookie, as a browser that no longer holds the session does: no request reaches the server and no tab is told of it. Assert that the context holds no session cookie afterwards and still holds the two cookies of the logout modal's count, one copy of each. The caller asserts what the tab meets next.
     */
    async dropSessionCookies(): Promise<void> {
      await page.context().clearCookies({ name: SESSION_COOKIE });
      const sessionCookies = (await page.context().cookies()).filter(({ name }) => SESSION_COOKIE.test(name));
      expect(sessionCookies.map(({ name }) => name)).toEqual([]);
      expect(await countCookieNames(), "the cookies of the logout modal's count").toEqual(
        [COOKIE.logoutDeadline, COOKIE.logoutPending].sort()
      );
    },

    /**
     * From now on answer the sign-out request with a failure, without letting it reach the server, so the cookies stay as they are. {@link restoreSignOut} ends it.
     */
    async failSignOut(): Promise<void> {
      signOutRouteEnds.push(await routeUntilEnded(page, isSignOutRequest, (route) => route.fulfill(SIGN_OUT_FAILURE)));
    },

    /**
     * From now on let the sign-out request reach the server and tell the page that it failed. The real sign-out runs and the cookies its response clears are cleared in the browser's context, while the page sees the failure the endpoint answers when the auth service fails with a valid access token. {@link restoreSignOut} ends it.
     */
    async failSignOutAfterClearingCookies(): Promise<void> {
      signOutRouteEnds.push(
        await routeUntilEnded(page, isSignOutRequest, async (route) => {
          const response = await route.fetch();
          await route.fulfill({ response, status: SIGN_OUT_FAILURE.status });
        })
      );
    },

    /**
     * End what {@link failSignOut} or {@link failSignOutAfterClearingCookies} started: the sign-out request works again.
     */
    async restoreSignOut(): Promise<void> {
      endSignOutRoutes();
    },

    /**
     * From now on keep the sign-out request from the server until {@link releaseSignOut} or {@link releaseSignOutAsFailure}, so the sign-out stays under way for as long as the test needs.
     */
    async holdSignOut(): Promise<void> {
      let release!: (outcome: HeldSignOutOutcome) => void;
      let markArrived!: () => void;
      let markPassedOn!: () => void;
      const released = new Promise<HeldSignOutOutcome>((resolve) => (release = resolve));
      const arrived = new Promise<void>((resolve) => (markArrived = resolve));
      const passedOn = new Promise<void>((resolve) => (markPassedOn = resolve));
      heldSignOut = { release, arrived, passedOn };
      signOutRouteEnds.push(
        await routeUntilEnded(page, isSignOutRequest, async (route) => {
          markArrived();
          if ((await released) === 'fail') await route.fulfill(SIGN_OUT_FAILURE);
          else await route.continue();
          markPassedOn();
        })
      );
    },

    /**
     * End what {@link holdSignOut} started: wait until the sign-out request has been held, let it reach the server, and let later ones through as before. The caller asserts where the user ends.
     */
    async releaseSignOut(): Promise<void> {
      expect(heldSignOut, 'holdSignOut() was not called').toBeDefined();
      const held = heldSignOut!;
      await held.arrived;
      held.release('reachServer');
      await held.passedOn;
      heldSignOut = undefined;
      endSignOutRoutes();
    },

    /**
     * End what {@link holdSignOut} started with a failure: wait until the sign-out request has been held, answer it as {@link failSignOut} answers, without letting it reach the server, so the cookies stay as they are, and let later ones through as before. The caller asserts what the page shows.
     */
    async releaseSignOutAsFailure(): Promise<void> {
      expect(heldSignOut, 'holdSignOut() was not called').toBeDefined();
      const held = heldSignOut!;
      await held.arrived;
      held.release('fail');
      await held.passedOn;
      heldSignOut = undefined;
      endSignOutRoutes();
    },

    /**
     * Assert that the header's Log out shows a sign-out under way: it is disabled, it holds the loading indicator, and its accessible name is the loading text.
     */
    async expectInProgress(): Promise<void> {
      await expect(button).toBeDisabled({ timeout: TIMEOUTS.slowPage });
      await expect(button.getByTestId(testIds.shared.loading)).toHaveCount(1);
      await expect(button).toHaveAccessibleName(COMMON_MESSAGES.loading);
    },

    /**
     * Assert that the message saying a sign-out could not be confirmed is shown.
     */
    async expectFailureMessage(): Promise<void> {
      await expect(failureMessage).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the message saying a sign-out could not be confirmed is not shown.
     */
    async expectNoFailureMessage(): Promise<void> {
      await expect(failureMessage).toHaveCount(0);
    },

    /**
     * Assert that the message's buttons can be pressed: it has at least one, and each of them, or something inside it, is the topmost element at the button's own centre.
     */
    async expectFailureMessagePressable(): Promise<void> {
      const buttons = failureMessage.getByRole('button');
      await expect(buttons.first()).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect
        .poll(
          () =>
            buttons.evaluateAll((elements) =>
              elements
                .filter((element) => {
                  const box = element.getBoundingClientRect();
                  const topmost = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
                  return !topmost || !element.contains(topmost);
                })
                .map((element) => element.textContent?.trim())
            ),
          { message: 'the buttons of the message with something else on top of them', timeout: TIMEOUTS.slowPage }
        )
        .toEqual([]);
    },

    /**
     * Assert what the browser computes for the message: its accessible name is the general error title, which is not the name of Log out, and it holds one button in the accessibility tree, named Close.
     */
    async expectFailureMessageNamedOnce(): Promise<void> {
      await expect(failureMessage).toHaveAccessibleName(ERROR_MESSAGES.general);
      expect(ERROR_MESSAGES.general).not.toBe(COMMON_MESSAGES.logout);
      await expect(failureMessage.getByRole('button')).toHaveCount(1);
      await expect(failureMessage.getByRole('button')).toHaveAccessibleName(COMMON_MESSAGES.close);
    },

    /**
     * Press the first of the message's buttons named Close. The caller asserts that the message has gone.
     */
    async closeFailureMessage(): Promise<void> {
      await failureMessage.getByRole('button', { name: COMMON_MESSAGES.close, exact: true }).first().click();
    },

    /**
     * Set the viewport to a phone's size and assert that the message's box lies inside it.
     */
    async expectFailureMessageInsideThePhoneViewport(): Promise<void> {
      await page.setViewportSize(PHONE_VIEWPORT);
      await expect
        .poll(
          () =>
            failureMessage.evaluate((element, viewport) => {
              const box = element.getBoundingClientRect();
              return {
                left: box.left >= 0,
                top: box.top >= 0,
                right: box.right <= viewport.width,
                bottom: box.bottom <= viewport.height
              };
            }, PHONE_VIEWPORT),
          { message: 'which sides of the message lie inside the viewport', timeout: TIMEOUTS.slowPage }
        )
        .toEqual({ left: true, top: true, right: true, bottom: true });
    },

    /**
     * Store one draft of the Contestant App in the page's `localStorage`, under the drafts' stem and in the shape an unsaved answer is stored in, and assert that it is the one draft there. The page must be on the application's origin.
     */
    async seedContestantDraft(): Promise<void> {
      await page.evaluate(
        (key) =>
          window.localStorage.setItem(key, JSON.stringify({ version: 1, data: { 'seeded-question': { value: 1 } } })),
        SEEDED_DRAFT_KEY
      );
      expect(await contestantDraftKeys()).toEqual([SEEDED_DRAFT_KEY]);
    },

    /**
     * Assert that the page's `localStorage` holds no key under the drafts' stem, of any user or entity.
     */
    async expectNoContestantDraft(): Promise<void> {
      expect(await contestantDraftKeys()).toEqual([]);
    },

    /**
     * Assert that the context holds the two cookies of the logout modal's count, one copy of each: `logout-pending` and `logout-deadline`, holding the same id of 32 hexadecimal characters. The deadline's cookie expires after now and no later than the count, its grace and one second from now, so the browser drops it at the count's end by its own clock.
     */
    async expectLogoutDeadlineSet(): Promise<void> {
      await expect
        .poll(countCookieNames, {
          message: "the cookies of the logout modal's count",
          timeout: TIMEOUTS.slowPage
        })
        .toEqual([COOKIE.logoutDeadline, COOKIE.logoutPending].sort());
      const [pending] = await contextCookiesNamed(COOKIE.logoutPending);
      const [deadline] = await contextCookiesNamed(COOKIE.logoutDeadline);
      expect(pending.value).toMatch(COUNT_ID);
      expect(deadline.value).toBe(pending.value);
      const nowSeconds = Date.now() / 1000;
      expect(deadline.expires).toBeGreaterThan(nowSeconds);
      expect(deadline.expires).toBeLessThanOrEqual(
        nowSeconds + MODAL_COUNT_SECONDS + LOGOUT_DEADLINE_GRACE_SECONDS + 1
      );
    },

    /**
     * Remove the deadline's cookie from the context and keep the pending one, as the browser does when the deadline's max age runs out while the tab is closed. Assert that the deadline was set before and is gone after, and that the pending id stays. The page may be closed already: the cookies are the context's.
     */
    async passLogoutDeadline(): Promise<void> {
      expect(await contextCookiesNamed(COOKIE.logoutDeadline), 'the logout deadline is not set').toHaveLength(1);
      await page.context().clearCookies({ name: COOKIE.logoutDeadline });
      expect(await contextCookiesNamed(COOKIE.logoutDeadline)).toEqual([]);
      expect(
        await contextCookiesNamed(COOKIE.logoutPending),
        "the pending id of the logout modal's count"
      ).toHaveLength(1);
    },

    /**
     * Remove the deadline's cookie from the context, if it holds one, as the browser does when the deadline's max age runs out. Unlike {@link passLogoutDeadline} it asserts nothing of what was stored before, so it stands for the deadline's passing also where the count was withdrawn first. Assert that no copy of the deadline's cookie is left.
     */
    async dropLogoutDeadline(): Promise<void> {
      await page.context().clearCookies({ name: COOKIE.logoutDeadline });
      expect(await contextCookiesNamed(COOKIE.logoutDeadline)).toEqual([]);
    },

    /**
     * Assert that the context comes to hold neither cookie of the logout modal's count, `logout-pending` nor `logout-deadline`, whatever their values, within a slow page's time.
     */
    async expectNoLogoutDeadline(): Promise<void> {
      await expect
        .poll(countCookieNames, {
          message: "the cookies of the logout modal's count",
          timeout: TIMEOUTS.slowPage
        })
        .toEqual([]);
    }
  };
}

export type HeaderLogoutFixture = ReturnType<typeof createHeaderLogout>;
