/**
 * @file contestantLoginPage fixture.
 *
 * Function-fixture for the two screens a contestant signs in through: the login screen, which offers the app's entries, and the sign-in screen, which holds the email and password form. Sibling to other candidate-fixtures; composed in `contestant-journey.ts` and `contestant-registration.ts`.
 *
 * Surface:
 *  - goToPage()                    — open the sign-in screen and wait for its form.
 *  - signInFromCold(email, password) — open the sign-in screen, again if its form does not appear, and sign in. For a setup that may be the first to ask the backend for anything.
 *  - enterEmail(email)             — fill the login-email field.
 *  - enterPassword(password)       — fill the password-field input.
 *  - submit()                      — click the login-submit button.
 *  - login(email, password)        — composed convenience.
 *  - expectErrorMessage(text?)     — assert the login-errorMessage testid is visible; optional `text` matches content.
 *
 * The login screen:
 *  - openEntryDirectly()           — go to the login screen's address and wait for nothing.
 *  - expectEntryShown()            — the login screen is shown.
 *  - expectEntryNotShown()         — the login screen is not rendered.
 *  - expectRegisterOffered(offered) — the screen says whether registration is offered, and its Register entry is there or is not.
 *  - expectAnswersLocked(locked)   — the screen says whether answers are locked, and the sentence about it is there or is not.
 *  - followSignIn()                — press the entry that leads to the sign-in screen.
 *  - followSignInInsideTheApp()    — wait until the screen's script has loaded, then press that entry, a navigation inside the application.
 *  - followRegister()              — press the entry that leads to registration.
 *  - expectNotice(reason)          — the notice under the title is shown, with the sentence of its reason: a user who was signed out, a link that could not be used, a link whose address another account took, a logout count that ran out, or a logout in another tab or window.
 *  - expectHeadingDescribedByNotice(reason) — the screen's heading has focus, and its accessible description is the sentence of the notice's reason.
 *  - expectNoNotice()              — the screen shows no notice.
 *  - expectEndedOnEntry()          — the visitor has ended on the login screen, at its bare address and with nothing said about how they got there.
 *  - expectOnEntry()               — the visitor is on the login screen, at its address with any query, as where the gate sends a request with no session.
 *  - openSettingsWithNoSession()   — go to the address of the settings page, which only a signed-in user is shown, and wait for nothing.
 *  - expectLedToSettings()         — the visitor is on the settings page, at its address.
 *
 * The sign-in screen:
 *  - openSignIn({ redirectTo, locale }) — open the sign-in screen by its address, in English or in the locale given, with the redirect target when one is given, and wait for it.
 *  - openSignInDirectly()          — go to the sign-in screen's address and wait for nothing.
 *  - expectSignInShown()           — the sign-in screen is shown.
 *  - expectSignInNotShown()        — the sign-in screen is not rendered.
 *  - expectSignInAnswersLocked()   — the sign-in screen shows the sentence that says answers are locked.
 *  - signInScriptLoaded()          — wait until the sign-in screen's script has loaded.
 *  - expectNoPasswordYetLink(offered) — the link for a user without a password is there or is not.
 *  - typeEmail(address)            — type an address into the email field.
 *  - followForgotPassword()        — press the link that leads to the forgot-password page, and wait for that page's address.
 *  - followNoPasswordYet()         — press the link for a user without a password, which leads to the forgot-password page, and wait for that page's address.
 *  - expectEmailError()            — the email field shows its error, is marked invalid and has focus.
 *  - expectFailure(status)         — the message of a refused sign-in is shown, for the status the server answered with.
 *  - expectWrongCredentials()      — the refusal shown is the one for an address and a password that do not sign in: its status and its sentence.
 *  - expectEmailKept(address)      — the email field still holds the address.
 *  - refusalShape(address)         — what the sign-in screen shows, as data to compare with another refusal.
 *  - expectInputAttributes()       — the email and password controls tell a browser what they hold.
 *  - expectPasswordFieldInRow()    — the password's label is in the same row as its control.
 *  - expectFieldLabelsOnOneLine()  — the email and the password labels are each drawn on one line.
 *  - expectTypedTextAtTheBodySize() — the email and password controls and the sign-in button set their text at the body's size.
 *  - expectPasswordServedMasked()  — the HTML the server sends holds the password control masked.
 *  - expectPasswordTogglePair()    — the toggle shows what was typed, and a second press masks it again.
 *  - expectPasswordToggleFromTheKeyboard() — the toggle, reached by Tab and pressed with Space and then Enter, shows and masks what was typed, keeps the focus, says whether it is pressed and keeps its name.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS, waitForNavigationFocusReset } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { expectLabelInRow, expectLabelOnOneLine } from '../../utils/labelInRow';
import { messageOf, messagesOf } from '../../utils/messages';
import { testIds } from '../../utils/testIds';
import { readScreenShape } from '../shared/screenShape.fixture';
import type { Page } from '@playwright/test';
import type { ScreenShape } from '../shared/screenShape.fixture';

/** Why the login screen shows a notice: a user who was signed out because their account's information could not be read, a mailed link that could not be used, a link that confirms a new address opened after another account took that address, a logout count that ran out with no one to cancel it, or a logout made in another tab or window. */
export type ContestantLoginNoticeReason =
  'loginFailed' | 'authError' | 'emailTaken' | 'loggedOutAutomatically' | 'loggedOutElsewhere';

/** The messages of the login and sign-in screens, read from the English message source rather than copied. */
const LOGIN_MESSAGES = messagesOf('contestantApp.login');

/** The messages shared by both apps, read from the English message source rather than copied. */
const COMMON_MESSAGES = messagesOf('common');

/** The sentence the login screen's notice holds for each reason. */
const NOTICE_SENTENCE: Record<ContestantLoginNoticeReason, string> = {
  loginFailed: String(LOGIN_MESSAGES.signedOut),
  authError: String(LOGIN_MESSAGES.linkFailed),
  emailTaken: String(LOGIN_MESSAGES.emailTaken),
  loggedOutAutomatically: String(COMMON_MESSAGES.loggedOutAutomatically),
  loggedOutElsewhere: String(COMMON_MESSAGES.loggedOutElsewhere)
};

/** The name of the password control's toggle, read from the English message source rather than copied. */
const PASSWORD_TOGGLE_NAME = messageOf('components', 'passwordInput.showPassword');

/** The status a refused sign-in was answered with. */
export type ContestantSignInFailureStatus = 400 | 403 | 500;

/** The sentence of a sign-in refused for its address or its password, read from the English message source rather than copied. */
const WRONG_CREDENTIALS_MESSAGE = messageOf('error', 'wrongEmailOrPassword');

/** What is typed to try the password control's toggle: a sample text that is no one's password. */
const PASSWORD_SAMPLE_TEXT = 'sample text';

/** How many times `signInFromCold` opens the sign-in screen before it gives up. */
const COLD_SIGN_IN_ATTEMPTS = 3;

/** How long `signInFromCold` waits for the sign-in form after each opening, in milliseconds. */
const COLD_SIGN_IN_FORM_WAIT_MS = 10_000;

export function createContestantLoginPage(page: Page) {
  const ids = testIds.contestant.login;

  return {
    /**
     * Open the sign-in screen and wait for its form.
     */
    async goToPage(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppSignIn', locale: 'en' }));
      await expect(page.getByTestId(ids.signInPage)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(ids.email)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Open the sign-in screen and sign in, for a caller that may be the first to ask the backend for anything.
     *
     * The app shows its loading screen until its data has arrived, and a backend that is still starting can keep it there. The screen is therefore opened up to three times, each with a bounded wait for the email control. The screen is opened again only after such a wait has already timed out, so the branch decides on a settled result and hides no race.
     *
     * The step asserts nothing about where the sign-in leads: the caller does.
     *
     * @param email - The address to sign in with.
     * @param password - The password to sign in with.
     * @throws Error if the form has not appeared after the third opening.
     */
    async signInFromCold(email: string, password: string): Promise<void> {
      const signIn = buildRoute({ route: 'ContestantAppSignIn', locale: 'en' });
      let formShown = false;
      for (let attempt = 1; attempt <= COLD_SIGN_IN_ATTEMPTS && !formShown; attempt++) {
        await page.goto(signIn, { waitUntil: 'domcontentloaded' });
        formShown = await page
          .getByTestId(ids.email)
          .waitFor({ state: 'visible', timeout: COLD_SIGN_IN_FORM_WAIT_MS })
          .then(
            () => true,
            () => false
          );
      }
      if (!formShown) {
        throw new Error(
          `The sign-in form did not appear in ${COLD_SIGN_IN_ATTEMPTS} openings of ${signIn}. ` +
            'The contestant app may be held on its loading screen by a backend that does not answer.'
        );
      }
      await this.login(email, password);
    },

    async enterEmail(email: string): Promise<void> {
      await page.getByTestId(ids.email).fill(email);
    },

    async enterPassword(password: string): Promise<void> {
      await page.getByTestId(testIds.shared.account.password.field).fill(password);
    },

    async submit(): Promise<void> {
      await page.getByTestId(ids.submit).click();
    },

    async login(email: string, password: string): Promise<void> {
      await this.enterEmail(email);
      await this.enterPassword(password);
      await this.submit();
    },

    /**
     * Assert the login-errorMessage testid is visible. When `text` is supplied, additionally assert the rendered content matches.
     */
    async expectErrorMessage(text?: string | RegExp): Promise<void> {
      const err = page.getByTestId(ids.errorMessage);
      await expect(err).toBeVisible();
      if (text !== undefined) {
        await expect(err).toContainText(text);
      }
    },

    // -----------------------------------------------------------------------
    // The login screen
    // -----------------------------------------------------------------------

    /**
     * Go to the login screen's address, as a visitor does by a link kept from before or a typed address.
     *
     * The step waits for nothing: a signed-in user is not shown the screen, so the caller asserts where they end.
     */
    async openEntryDirectly(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppLogin', locale: 'en' }));
    },

    /**
     * Assert that the login screen is shown. The step opens nothing: it is for the screen a navigation, a redirect or a sign-out has led to.
     */
    async expectEntryShown(): Promise<void> {
      await expect(page.getByTestId(ids.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the login screen is not rendered, as where another page is shown at its address.
     */
    async expectEntryNotShown(): Promise<void> {
      await expect(page.getByTestId(ids.page)).toHaveCount(0);
    },

    /**
     * Assert whether the login screen offers registration: what the screen states about itself, and its Register entry, which is shown when registration is offered and is not rendered when it is not.
     *
     * @param offered - Whether registration is expected to be offered.
     */
    async expectRegisterOffered(offered: boolean): Promise<void> {
      await expect(page.getByTestId(ids.page)).toHaveAttribute('data-register-offered', String(offered));
      const register = page.getByTestId(ids.registerLink);
      if (offered) await expect(register).toBeVisible();
      else await expect(register).toHaveCount(0);
    },

    /**
     * Assert whether the login screen treats answers as locked: what the screen states about itself, and the sentence about the lock, which is shown while answers are locked and is not rendered otherwise.
     *
     * @param locked - Whether answers are expected to be locked.
     */
    async expectAnswersLocked(locked: boolean): Promise<void> {
      await expect(page.getByTestId(ids.page)).toHaveAttribute('data-answers-locked', String(locked));
      const sentence = page.getByTestId(ids.answersLockedInfo);
      if (locked) await expect(sentence).toBeVisible();
      else await expect(sentence).toHaveCount(0);
    },

    /**
     * Press the login screen's entry that leads to the sign-in screen. The caller asserts the screen it leads to.
     */
    async followSignIn(): Promise<void> {
      await page.getByTestId(ids.signInLink).click();
    },

    /**
     * Wait for the root layout's focus reset, then press the login screen's entry that leads to the sign-in screen. The entry is a link the server renders, which the browser follows itself until the page has hydrated, so this is the form of {@link followSignIn} that keeps the sign-in inside one document. The caller asserts the screen it leads to.
     */
    async followSignInInsideTheApp(): Promise<void> {
      await waitForNavigationFocusReset(page);
      await this.followSignIn();
    },

    /**
     * Press the login screen's entry that leads to registration. The caller asserts the screen it leads to.
     */
    async followRegister(): Promise<void> {
      await page.getByTestId(ids.registerLink).click();
    },

    /**
     * Assert that the login screen shows its notice, why, and in which words: the notice states its reason and holds the sentence the message source has for it.
     *
     * The notice shows an emoji before the sentence, so the sentence is looked for inside it.
     *
     * @param reason - `loginFailed` for a user who was signed out because their account's information could not be read, `authError` for a mailed link that could not be used, `emailTaken` for a link that confirms a new address opened after another account took that address, `loggedOutAutomatically` for a logout count that ran out, `loggedOutElsewhere` for a logout made in another tab or window.
     */
    async expectNotice(reason: ContestantLoginNoticeReason): Promise<void> {
      const notice = page.getByTestId(ids.notice);
      await expect(notice).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(notice).toHaveAttribute('data-reason', reason);
      await expect(notice).toContainText(NOTICE_SENTENCE[reason]);
    },

    /**
     * Assert that the login screen's heading, which the root layout focuses after a navigation, has focus and has the notice's sentence as its accessible description, so that a screen reader landing on the heading is given the sentence with it.
     *
     * What a screen reader says is not established here: the step reads the description the browser computes.
     *
     * @param reason - The reason whose sentence the description holds, as for {@link expectNotice}.
     */
    async expectHeadingDescribedByNotice(reason: ContestantLoginNoticeReason): Promise<void> {
      const heading = page.getByTestId(ids.page).getByRole('heading', { level: 1 });
      await expect(heading).toBeFocused({ timeout: TIMEOUTS.slowPage });
      await expect(heading).toHaveAccessibleDescription(NOTICE_SENTENCE[reason]);
    },

    /**
     * Assert that the login screen is shown without a notice.
     */
    async expectNoNotice(): Promise<void> {
      await expect(page.getByTestId(ids.page)).toBeVisible();
      await expect(page.getByTestId(ids.notice)).toHaveCount(0);
    },

    /**
     * Assert that the visitor has ended on the login screen with nothing said about how they got there: the address is the login screen's own with no search parameter, the screen and its entry that leads to the sign-in screen are shown, and neither a notice nor a refused sign-in's message is rendered.
     *
     * For a visitor a screen of the entry flow turned away, as after a reload, and for a user who has logged out. The step opens nothing.
     */
    async expectEndedOnEntry(): Promise<void> {
      const entryPath = buildRoute({ route: 'ContestantAppLogin', locale: 'en' });
      await expect(page).toHaveURL((url) => url.pathname === entryPath && url.search === '', {
        timeout: TIMEOUTS.slowPage
      });
      await expect(page.getByTestId(ids.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(ids.signInLink)).toBeVisible();
      await expect(page.getByTestId(ids.notice)).toHaveCount(0);
      await expect(page.getByTestId(ids.errorMessage)).toHaveCount(0);
    },

    /**
     * Assert that the visitor is on the login screen, whatever its address's query says: the path is the login screen's own, and the screen is shown.
     *
     * For a visitor the gate sent here from a page that needs a session, whose address carries the page asked for as its redirect target. The step opens nothing.
     */
    async expectOnEntry(): Promise<void> {
      const entryPath = buildRoute({ route: 'ContestantAppLogin', locale: 'en' });
      await expect(page).toHaveURL((url) => url.pathname === entryPath, { timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(ids.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Go to the address of the settings page, as a visitor does by a link kept from before.
     *
     * The page is shown to a signed-in user alone, so the step waits for nothing: the caller asserts where a visitor with no session ends.
     */
    async openSettingsWithNoSession(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppSettings', locale: 'en' }));
    },

    /**
     * Assert that the visitor is on the settings page: the address is that page's own, at the app's root, and the page's button that saves a new password is shown.
     *
     * For the page a sign-in has led to. A visitor led to the app's home instead fails the address. The sign-in's redirect names the locale in the path, which the route builder leaves out for the base locale, so the path is compared with that prefix removed.
     */
    async expectLedToSettings(): Promise<void> {
      const settings = buildRoute({ route: 'ContestantAppSettings', locale: 'en' });
      await expect(page).toHaveURL((url) => url.pathname.replace(/^\/en(?=\/)/, '') === settings, {
        timeout: TIMEOUTS.slowPage
      });
      await expect(page.getByTestId(testIds.contestant.settings.updateButton)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    },

    // -----------------------------------------------------------------------
    // The sign-in screen
    // -----------------------------------------------------------------------

    /**
     * Open the sign-in screen by its address and wait for it to be shown.
     *
     * @param options.redirectTo - The path the screen is asked to lead to after a sign-in, passed on as the `redirectTo` search parameter. Leave it out to open the bare address.
     * @param options.locale - The locale of the screen, English by default.
     */
    async openSignIn({ redirectTo, locale = 'en' }: { redirectTo?: string; locale?: string } = {}): Promise<void> {
      // The route holds no locale segment: the base locale `en` is served with no prefix, any other under `/<locale>`.
      const address = (locale === 'en' ? '' : `/${locale}`) + buildRoute({ route: 'ContestantAppSignIn', locale });
      const search = redirectTo === undefined ? '' : `?${new URLSearchParams({ redirectTo })}`;
      await page.goto(`${address}${search}`);
      await expect(page.getByTestId(ids.signInPage)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Go to the sign-in screen's address, as a visitor does by a link kept from before or a typed address.
     *
     * The step waits for nothing: a signed-in user is not shown the screen, so the caller asserts where they end.
     */
    async openSignInDirectly(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppSignIn', locale: 'en' }));
    },

    /**
     * Assert that the sign-in screen is shown. The step opens nothing: it is for the screen a navigation has led to.
     */
    async expectSignInShown(): Promise<void> {
      await expect(page.getByTestId(ids.signInPage)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the sign-in screen is not rendered, as where another page is shown at its address.
     */
    async expectSignInNotShown(): Promise<void> {
      await expect(page.getByTestId(ids.signInPage)).toHaveCount(0);
    },

    /**
     * Assert that the sign-in screen shows the sentence that says answers are locked, which it shows above its form while they are.
     */
    async expectSignInAnswersLocked(): Promise<void> {
      await expect(page.getByTestId(ids.signInPage)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(ids.answersLockedInfo)).toBeVisible();
    },

    /**
     * Wait until the sign-in screen's script has loaded: the root layout's focus reset, which follows the page's mount, has landed on the screen's heading. The step is for a screen opened by its address, on which nothing has moved focus yet.
     *
     * A sign-in posted before the script has loaded is answered with a new page, which does not keep the address typed, and an address typed before then is not yet in the links to the forgot-password page. A test that reads the screen after a refusal, or follows a link with an address typed, waits here first.
     */
    async signInScriptLoaded(): Promise<void> {
      await expect(page.getByTestId(ids.signInPage)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await waitForNavigationFocusReset(page);
    },

    /**
     * Assert whether the sign-in screen offers the link for a user without a password: shown when offered, not rendered when not.
     *
     * @param offered - Whether the link is expected.
     */
    async expectNoPasswordYetLink(offered: boolean): Promise<void> {
      await expect(page.getByTestId(ids.signInPage)).toBeVisible();
      const link = page.getByTestId(ids.noPasswordYetLink);
      if (offered) await expect(link).toBeVisible();
      else await expect(link).toHaveCount(0);
    },

    /**
     * Type an address into the sign-in screen's email field, once the field takes input.
     */
    async typeEmail(address: string): Promise<void> {
      const email = page.getByTestId(ids.email);
      await expect(email).toBeEditable();
      await email.fill(address);
    },

    /**
     * Press the sign-in screen's link to the forgot-password page, and wait until the visitor is at that page's address.
     */
    async followForgotPassword(): Promise<void> {
      await page.getByTestId(ids.forgotPasswordLink).click();
      const forgotPasswordPath = buildRoute({ route: 'ContestantAppForgotPassword', locale: 'en' });
      await expect(page).toHaveURL((url) => url.pathname === forgotPasswordPath, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Press the sign-in screen's link for a user without a password, once it is shown, and wait until the visitor is at the forgot-password page's address.
     */
    async followNoPasswordYet(): Promise<void> {
      const link = page.getByTestId(ids.noPasswordYetLink);
      await expect(link).toBeVisible();
      await link.click();
      const forgotPasswordPath = buildRoute({ route: 'ContestantAppForgotPassword', locale: 'en' });
      await expect(page).toHaveURL((url) => url.pathname === forgotPasswordPath, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the sign-in screen's email field is in error: its error is shown, the control is marked invalid, and focus is on the control.
     */
    async expectEmailError(): Promise<void> {
      await expect(page.getByTestId(ids.emailError)).toBeVisible();
      const email = page.getByTestId(ids.email);
      await expect(email).toHaveAttribute('aria-invalid', 'true');
      await expect(email).toBeFocused();
    },

    /**
     * Assert that the sign-in screen shows the message of a refused sign-in, and which answer of the server it is for.
     *
     * @param status - The status the sign-in was answered with.
     */
    async expectFailure(status: ContestantSignInFailureStatus): Promise<void> {
      const message = page.getByTestId(ids.errorMessage);
      await expect(message).toBeVisible();
      await expect(message).toHaveAttribute('data-status', String(status));
    },

    /**
     * Assert that the sign-in screen shows the refusal of an address and a password that do not sign in: the screen states that the sign-in failed, the message is the one for the status 400, and it holds the sentence the message source has for it.
     *
     * The message shows an emoji before the sentence, so the sentence is looked for inside it.
     */
    async expectWrongCredentials(): Promise<void> {
      await expect(page.getByTestId(ids.signInPage)).toHaveAttribute('data-sign-in-state', 'failed');
      const message = page.getByTestId(ids.errorMessage);
      await expect(message).toBeVisible();
      await expect(message).toHaveAttribute('data-status', '400');
      await expect(message).toContainText(WRONG_CREDENTIALS_MESSAGE);
    },

    /**
     * Assert that the sign-in screen's email field still holds an address, as after a refused sign-in.
     *
     * @param address - The address that was typed.
     */
    async expectEmailKept(address: string): Promise<void> {
      await expect(page.getByTestId(ids.email)).toHaveValue(address);
    },

    /**
     * Read what the sign-in screen shows, as data: its state, every line of its text, and its controls with what each of them tells a user.
     *
     * For comparing refusals with each other: an address nobody holds and an address with an account are refused alike when their readings are equal. The address is replaced in the reading. Assert the refusal first, so that a sign-in still running is not read.
     *
     * @param address - The address that was typed.
     * @returns The screen's shape.
     */
    async refusalShape(address: string): Promise<ScreenShape> {
      const screen = page.getByTestId(ids.signInPage);
      await expect(screen).toBeVisible();
      return readScreenShape(screen, [address]);
    },

    /**
     * Assert what the sign-in form's two controls tell a browser and a password manager: the email control is an email field named `email` that holds a user name, and the password control is named `password` and holds the current password.
     *
     * The password control's `type` is not asserted: its show and hide toggle changes it.
     */
    async expectInputAttributes(): Promise<void> {
      const email = page.getByTestId(ids.email);
      await expect(email).toHaveAttribute('type', 'email');
      await expect(email).toHaveAttribute('name', 'email');
      await expect(email).toHaveAttribute('autocomplete', 'username');
      const password = page.getByTestId(testIds.shared.account.password.field);
      await expect(password).toHaveAttribute('name', 'password');
      await expect(password).toHaveAttribute('autocomplete', 'current-password');
    },

    /**
     * Assert that the sign-in screen's password label is in the same row as its control.
     */
    async expectPasswordFieldInRow(): Promise<void> {
      await expectLabelInRow(page.getByTestId(testIds.shared.account.password.field));
    },

    /**
     * Assert that the sign-in screen's email label and password label are each drawn on one line, the password's beside the toggle that shows what was typed.
     */
    async expectFieldLabelsOnOneLine(): Promise<void> {
      await expectLabelOnOneLine(page.getByTestId(ids.email));
      await expectLabelOnOneLine(page.getByTestId(testIds.shared.account.password.field));
    },

    /**
     * Assert that the sign-in screen sets what is typed, and the label of its sign-in button, at the body's text size: the computed font size of the email control, the password control and the sign-in button each equals the body's.
     *
     * The step is for a screen whose script has loaded.
     */
    async expectTypedTextAtTheBodySize(): Promise<void> {
      const bodySize = await page.evaluate(() => getComputedStyle(document.body).fontSize);
      await expect(page.getByTestId(ids.email)).toHaveCSS('font-size', bodySize);
      await expect(page.getByTestId(testIds.shared.account.password.field)).toHaveCSS('font-size', bodySize);
      await expect(page.getByTestId(ids.submit)).toHaveCSS('font-size', bodySize);
    },

    /**
     * Assert that the HTML the server sends for the sign-in screen holds the password control masked, whatever a script does afterwards.
     */
    async expectPasswordServedMasked(): Promise<void> {
      const response = await page.request.get(buildRoute({ route: 'ContestantAppSignIn', locale: 'en' }));
      expect(response.ok()).toBe(true);
      const tags = (await response.text()).match(/<input\b[^>]*>/g) ?? [];
      const control = tags.filter((tag) => tag.includes(`data-testid="${testIds.shared.account.password.field}"`));
      expect(control).toHaveLength(1);
      expect(control[0]).toContain('type="password"');
    },

    /**
     * Assert that the sign-in screen's toggle shows what was typed in the password control, and that a second press masks it again. The control is only ever read for its type and for not being empty.
     *
     * The step is for a screen whose script has loaded, and leaves a sample text in the control.
     */
    async expectPasswordTogglePair(): Promise<void> {
      const control = page.getByTestId(testIds.shared.account.password.field);
      const toggle = page.getByTestId(testIds.shared.account.password.toggle);
      await control.fill(PASSWORD_SAMPLE_TEXT);
      await expect(control).toHaveAttribute('type', 'password');

      await toggle.click();
      await expect(control).toHaveAttribute('type', 'text');
      await expect(control).not.toHaveValue('');

      await toggle.click();
      await expect(control).toHaveAttribute('type', 'password');
      await expect(control).not.toHaveValue('');
    },

    /**
     * Assert that the sign-in screen's toggle works from the keyboard: reached by Tab from the password control and pressed with Space, it shows what was typed, keeps the focus and is pressed; pressed again with Enter, it masks it, still focused, and is not pressed. Its name is the same sentence in both states. The control is only ever read for its type and for not being empty.
     *
     * The step is for a screen whose script has loaded, and leaves a sample text in the control.
     */
    async expectPasswordToggleFromTheKeyboard(): Promise<void> {
      const control = page.getByTestId(testIds.shared.account.password.field);
      const toggle = page.getByTestId(testIds.shared.account.password.toggle);
      await control.fill(PASSWORD_SAMPLE_TEXT);
      await expect(control).toHaveAttribute('type', 'password');

      await control.focus();
      await page.keyboard.press('Tab');
      await expect(toggle).toBeFocused();

      await page.keyboard.press('Space');
      await expect(control).toHaveAttribute('type', 'text');
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(toggle).toHaveAccessibleName(PASSWORD_TOGGLE_NAME);
      await expect(control).not.toHaveValue('');

      await page.keyboard.press('Enter');
      await expect(control).toHaveAttribute('type', 'password');
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(toggle).toHaveAccessibleName(PASSWORD_TOGGLE_NAME);
      await expect(control).not.toHaveValue('');
    }
  };
}

export type ContestantLoginPageFixture = ReturnType<typeof createContestantLoginPage>;
