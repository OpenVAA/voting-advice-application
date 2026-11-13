/**
 * @file adminLoginPage fixture.
 *
 * Function-fixture for the Admin App's login page and for what proves that a login landed in the Admin App.
 *
 * Surface:
 *  - goToPage(locale)        — navigate to the login page of that locale, English by default, and wait for its form.
 *  - goToHome()              — open the Admin App's home by its address.
 *  - openNoPasswordYet()     — press "I have not set a password yet" and wait for the forgot-password page.
 *  - openForgotPassword()    — press "Forgot Password?" and wait for the forgot-password page.
 *  - login(email, password)  — fill the form and submit it.
 *  - fillAwaitingScript(email, password) — fill the form and wait until the page's script has enabled its submit button.
 *  - submit()                — press the submit button.
 *  - expectAdminHome()       — the address is the Admin App's home and its post-gate content is visible.
 *  - expectOnLoginPage()     — the address is the login page's and its email field is visible.
 *  - expectEmailFieldLabelled() — the email field is named by its label, whose text is visible.
 *  - expectPasswordFieldInRow() — the password's label is in the same row as its control.
 *  - pageScriptLoaded()      — wait until the login page's script has loaded.
 *  - expectFieldLabelsOnOneLine() — the email and the password labels are each drawn on one line.
 *  - expectIllustrationClearOfLogo() — no opaque pixel of the illustration the header paints lies under the header's logo.
 *  - goBackToHomeOrLoginForm() — go back in the browser's history, and wait until the page has settled on the home or on the login form.
 *  - goBackFromLoginFormToLoginForm() — go back in the browser's history from the login form, and wait until the router has drawn the login form again.
 *  - expectHomeShownAtAnyAddress() — the content behind the gate is visible and the login form is not, whatever the address reads.
 *  - expectGateSendsASessionHome() — the server's first response to the login page is a 303 to the home.
 *  - failUserDataRead()      — from now on the browser's read of the user data is answered with a failure.
 *  - restoreUserDataRead()   — that read works again.
 *  - expectErrorPageSays(key, locale) — the error page's title is that key's text in that locale, and the login form is not there.
 *  - expectNoLoginPageRequest() — no data request for the login page has been sent since the fixture was created.
 *  - expectLoginFormStandsWithNoMessage() — the login form is visible and holds no message that the login failed.
 *  - expectLoginAddressSaysLoginFailed() — the address is the login page's and carries the code of that message.
 *  - expectLoginAddressSaysNotAuthorized() — the address is the login page's and carries the code of the message that the user is not authorized.
 *  - expectSaysWhy(reason)   — the login page's alert holds the sentence of a sign-out the user did not make on the page, and its focused heading has that sentence as its description.
 *  - expectSaysLinkFailed()  — the address is the login page's, and its alert holds the sentence of a mailed link that could not be used.
 *  - expectSignInRefused()   — the login page's alert holds the sentence of a wrong address or password.
 *  - expectSaysNotAuthorized() — the browser is on the login page, and its alert holds the sentence that the user is not authorized.
 *  - writeRunOutCount()      — write a count whose deadline the browser has already dropped, as a tab closed during the Contestant App's logout modal leaves it.
 *  - reload()                — reload the page.
 *  - followLinkInsideTheApp(address) — follow a link to that address, as the application's router takes it.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import { COOKIE } from '../../../../apps/frontend/src/lib/cookies/index';
import { TIMEOUTS, waitForNavigationFocusReset } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { expectLabelInRow, expectLabelOnOneLine } from '../../utils/labelInRow';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { Locator, Page } from '@playwright/test';

/**
 * Read a locale's messages of one namespace from the message source, rather than copying their strings.
 *
 * @param locale - The locale, whose folder holds the file.
 * @param namespace - The file's name without `.json`, which is also its one top-level key.
 * @returns The messages under the file's one top-level key.
 */
function readMessages(locale: string, namespace: 'common' | 'error' | 'adminApp.login'): Record<string, string> {
  const source = JSON.parse(
    fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages', locale, `${namespace}.json`), 'utf8')
  ) as Record<string, Record<string, string>>;
  return source[namespace];
}

/** The reasons the login page states for a sign-out the user did not make on it: a logout count the browser let run out, and a sign-out made in another tab or window. */
export type AdminLoginNoticeReason = 'loggedOutAutomatically' | 'loggedOutElsewhere';

/** The number of random bytes in the id of a count, which `logout-pending` holds as 32 hexadecimal characters. */
const COUNT_ID_BYTES = 16;

/** What the data API answers when a read fails. */
const USER_DATA_READ_FAILURE = { status: 500, json: { message: 'The read failed.' } };

/** Where the header paints its illustration, and how many of the illustration's opaque pixels lie under the logo. */
type IllustrationOverLogo = {
  /** The address of the image the header paints, or `null` when nothing in the header paints one. */
  image: string | null;
  /** The width and height in pixels of the rectangle the image is painted in. */
  painted: { width: number; height: number };
  /** The number of the image's pixels with an alpha above 0 that are painted inside the logo's box. */
  opaqueUnderLogo: number;
};

/**
 * Count, in the page, the opaque pixels of the image the header paints that fall under the header's logo.
 *
 * The image is the background of the header or of an element inside it. It is drawn on a canvas at the size and position the computed `background-size` and `background-position` give it inside the element's padding box, clipped to that box, and the canvas is read over the logo's box. The image is served by the application's own origin, so the canvas can be read.
 *
 * @param menuToggle - The header's menu button, which holds the logo.
 * @returns What is painted, with the count.
 */
async function readIllustrationOverLogo(menuToggle: Locator): Promise<IllustrationOverLogo> {
  return menuToggle.evaluate(async (toggle) => {
    const header = toggle.closest('header');
    const logo = toggle.querySelector(':scope > div');
    if (!header || !logo) throw new Error('the header or its logo is missing');
    const painter = [header, ...header.querySelectorAll('*')].find((element) =>
      getComputedStyle(element).backgroundImage.startsWith('url(')
    );
    if (!painter) return { image: null, painted: { width: 0, height: 0 }, opaqueUnderLogo: 0 };

    const style = getComputedStyle(painter);
    const url = style.backgroundImage.slice(4, -1).replace(/^"|"$/g, '');
    const image = new Image();
    image.src = url;
    await image.decode();
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    const rect = painter.getBoundingClientRect();
    const area = {
      x: rect.x + parseFloat(style.borderLeftWidth),
      y: rect.y + parseFloat(style.borderTopWidth),
      width: painter.clientWidth,
      height: painter.clientHeight
    };
    const length = (value: string, reference: number) =>
      value.endsWith('%') ? (parseFloat(value) / 100) * reference : parseFloat(value);
    let width: number;
    let height: number;
    const size = style.backgroundSize.trim();
    if (size === 'cover' || size === 'contain') {
      const scale = (size === 'cover' ? Math.max : Math.min)(area.width / naturalWidth, area.height / naturalHeight);
      width = naturalWidth * scale;
      height = naturalHeight * scale;
    } else {
      const [sizeX, sizeY = 'auto'] = size.split(/\s+/);
      const givenWidth = sizeX === 'auto' ? null : length(sizeX, area.width);
      const givenHeight = sizeY === 'auto' ? null : length(sizeY, area.height);
      width = givenWidth ?? (givenHeight === null ? naturalWidth : (naturalWidth * givenHeight) / naturalHeight);
      height = givenHeight ?? (naturalHeight * width) / naturalWidth;
    }
    const [positionX = '50%', positionY = '50%'] = style.backgroundPosition.split(',')[0].trim().split(/\s+/);
    const left = area.x + length(positionX, area.width - width);
    const top = area.y + length(positionY, area.height - height);

    const box = logo.getBoundingClientRect();
    const x0 = Math.max(Math.floor(box.left), Math.ceil(area.x));
    const y0 = Math.max(Math.floor(box.top), Math.ceil(area.y));
    const x1 = Math.min(Math.ceil(box.right), Math.floor(area.x + area.width));
    const y1 = Math.min(Math.ceil(box.bottom), Math.floor(area.y + area.height));
    let opaqueUnderLogo = 0;
    if (x1 > x0 && y1 > y0) {
      const canvas = document.createElement('canvas');
      canvas.width = x1 - x0;
      canvas.height = y1 - y0;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('no canvas context');
      context.drawImage(image, left - x0, top - y0, width, height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let alpha = 3; alpha < pixels.length; alpha += 4) if (pixels[alpha] > 0) opaqueUnderLogo += 1;
    }
    return { image: url, painted: { width, height }, opaqueUnderLogo };
  });
}

/** Whether a request's address is the last read of the user data. */
const isUserDataRead = (url: URL): boolean => url.pathname.endsWith('/rest/v1/rpc/get_user_entities');

export function createAdminLoginPage(page: Page) {
  const adminHome = buildRoute({ route: 'AdminAppHome', locale: 'en' });
  const adminLogin = buildRoute({ route: 'AdminAppLogin', locale: 'en' });

  // reason: the admin login page declares no test id on its email input or its submit button. `#email` is the id the markup itself declares and `button[type="submit"]` is a type attribute; neither reads a translated string, so neither breaks on a locale change. The password field is addressed through the shared test id the page gives it.
  // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
  const emailInput = page.locator('#email');
  // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
  const submitButton = page.locator('form button[type="submit"]');
  // reason: the label is found by the `for` it ties to the email field's id, which reads no translated string.
  // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
  const emailLabel = page.locator('label[for="email"]');
  const notice = page.getByRole('main').getByRole('alert');
  const heading = page.getByRole('main').getByRole('heading', { level: 1 });

  let loginPageDataRequests = 0;

  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/admin/login/__data.json')) loginPageDataRequests += 1;
  });

  return {
    /**
     * Navigate to the login page and wait for its form.
     *
     * @param locale - The locale of the page.
     */
    async goToPage(locale = 'en'): Promise<void> {
      // The route holds no locale segment: the base locale `en` is served with no prefix, any other under `/<locale>`.
      await page.goto((locale === 'en' ? '' : `/${locale}`) + buildRoute({ route: 'AdminAppLogin', locale }), {
        waitUntil: 'domcontentloaded'
      });
      await expect(emailInput).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Open the Admin App's home by its address. The caller asserts where the browser ends.
     */
    async goToHome(): Promise<void> {
      await page.goto(adminHome, { waitUntil: 'domcontentloaded' });
    },

    /**
     * Press the login page's link for a user who has not set a password, and wait for the forgot-password page it leads to.
     */
    async openNoPasswordYet(): Promise<void> {
      await page.getByTestId(testIds.admin.login.noPasswordYet).click();
      await expect(page.getByTestId(testIds.admin.forgotPassword.container)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Press the login page's "Forgot Password?" link, and wait for the forgot-password page it leads to.
     */
    async openForgotPassword(): Promise<void> {
      await page.getByTestId(testIds.admin.login.forgotPassword).click();
      await expect(page.getByTestId(testIds.admin.forgotPassword.container)).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Fill the login form and submit it.
     */
    async login(email: string, password: string): Promise<void> {
      await emailInput.fill(email);
      await page.getByTestId(testIds.contestant.password.field).fill(password);
      await submitButton.click();
    },

    /**
     * Fill the login form and wait until its submit button is enabled. The button is disabled until the page's script has read both fields, so this also shows that the script has loaded.
     */
    async fillAwaitingScript(email: string, password: string): Promise<void> {
      await emailInput.fill(email);
      await page.getByTestId(testIds.contestant.password.field).fill(password);
      await expect(submitButton).toBeEnabled({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Press the login form's submit button.
     */
    async submit(): Promise<void> {
      await submitButton.click();
    },

    /**
     * Assert that the browser is in the Admin App: the address is its home, not its login page, and the content behind its gate is visible.
     *
     * A redirect is followed silently, so the address alone cannot tell a landing from a bounce that came back; the content is what a refused login never shows.
     */
    async expectAdminHome(): Promise<void> {
      await expect(page).toHaveURL(new RegExp(`${adminHome}$`), { timeout: TIMEOUTS.slowPage });
      await expect(page).not.toHaveURL(new RegExp(`${adminLogin}(\\?|$)`));
      await expect(page.getByRole('button', { name: 'Jobs Monitoring' })).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the browser is on the login page: the address is the login page's and the email field is visible.
     */
    async expectOnLoginPage(): Promise<void> {
      await expect(page).toHaveURL(new RegExp(`${adminLogin}(\\?|$)`), { timeout: TIMEOUTS.slowPage });
      await expect(emailInput).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the email field is named by its label: the control's accessible name is the English text of `common.email`, read from the message source, and the label's text is visible.
     */
    async expectEmailFieldLabelled(): Promise<void> {
      const emailText = readMessages('en', 'common').email;
      await expect(emailInput).toHaveAccessibleName(emailText);
      await expect(emailLabel).toHaveText(emailText);
      await expect(emailLabel).toBeVisible();
    },

    /**
     * Assert that the login page's password label is in the same row as its control.
     */
    async expectPasswordFieldInRow(): Promise<void> {
      await expectLabelInRow(page.getByTestId(testIds.contestant.password.field));
    },

    /**
     * Wait until the login page's script has loaded: the root layout's focus reset, which follows the page's mount, has landed on the page's heading. The step is for a page opened by its address, on which nothing has moved focus yet.
     */
    async pageScriptLoaded(): Promise<void> {
      await expect(emailInput).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await waitForNavigationFocusReset(page);
    },

    /**
     * Assert that the login page's email label and password label are each drawn on one line, the password's beside the toggle that shows what was typed.
     */
    async expectFieldLabelsOnOneLine(): Promise<void> {
      await expectLabelOnOneLine(emailInput);
      await expectLabelOnOneLine(page.getByTestId(testIds.contestant.password.field));
    },

    /**
     * Assert that the illustration the header paints on the login page leaves the header's logo clear: the header paints an image, and none of its opaque pixels lies under the logo's box.
     */
    async expectIllustrationClearOfLogo(): Promise<void> {
      const menuToggle = page.getByTestId(testIds.shared.navigation.menuToggle);
      await expect(menuToggle).toBeVisible();
      const illustration = await readIllustrationOverLogo(menuToggle);
      expect(illustration.image, 'the header paints an illustration').not.toBeNull();
      expect(
        illustration.painted.width * illustration.painted.height,
        'the illustration is painted at a size'
      ).toBeGreaterThan(0);
      expect(illustration.opaqueUnderLogo, `the opaque pixels of ${illustration.image} under the logo`).toBe(0);
    },

    /**
     * Go back in the browser's history, and wait until the page has settled on the home or on the login form. The caller reads which of the two stands.
     *
     * This is not the header fixture's `goBackAndSettle`, which waits for the focus reset alone: this step also settles on the login form when it is shown.
     */
    async goBackToHomeOrLoginForm(): Promise<void> {
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      });
      await page.goBack();
      await expect
        .poll(
          async () => {
            const focusReset = await page.evaluate(() => {
              const target = document.querySelector('[data-focus-on-nav]') ?? document.querySelector('h1');
              return target !== null && document.activeElement === target;
            });
            return focusReset || (await emailInput.isVisible());
          },
          { message: 'Back settled neither on the home nor on the login form', timeout: TIMEOUTS.slowPage }
        )
        .toBe(true);
    },

    /**
     * Go back in the browser's history from the login form, and wait until the router has drawn the page Back leads to, which is the login form again.
     *
     * The form stands before Back and after it, so its being visible says nothing about the navigation, and a field filled before the page is drawn can lose what was typed. The email field is focused first: the router takes focus from the focused element as it draws the new page, so the field losing focus is what shows the page has been drawn.
     */
    async goBackFromLoginFormToLoginForm(): Promise<void> {
      await emailInput.focus();
      await expect(emailInput).toBeFocused();
      await page.goBack();
      await expect(emailInput).not.toBeFocused({ timeout: TIMEOUTS.slowPage });
      await expect(emailInput).toBeVisible();
    },

    /**
     * Assert that the home stands: the content behind the gate is visible and the login form is not.
     *
     * The address is not read: a Back the gate redirects writes no history entry, so the address bar keeps the login page's address until the next navigation.
     */
    async expectHomeShownAtAnyAddress(): Promise<void> {
      await expect(page.getByRole('button', { name: 'Jobs Monitoring' })).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(emailInput).toHaveCount(0);
    },

    /**
     * Assert that the gate answers a live session on the login page: the server's first response is a 303 to the home. The request carries this context's cookies.
     */
    async expectGateSendsASessionHome(): Promise<void> {
      const response = await page.request.get(adminLogin, { maxRedirects: 0 });
      expect(response.status()).toBe(303);
      expect(response.headers().location).toContain(adminHome);
    },

    /**
     * From now on answer the browser's read of the user data with a failure. This is the read that `getBasicUserData` makes last, and it runs in the browser on a client-side navigation, while a document request reads on the server, out of this step's reach. {@link restoreUserDataRead} ends it.
     */
    async failUserDataRead(): Promise<void> {
      await page.route(isUserDataRead, (route) => route.fulfill(USER_DATA_READ_FAILURE));
    },

    /**
     * End what {@link failUserDataRead} started: the read works again.
     */
    async restoreUserDataRead(): Promise<void> {
      await page.unroute(isUserDataRead);
    },

    /**
     * Assert that the error page stands: its title is the text of the key, read from the message source in the given locale, and the login form is not there.
     *
     * @param key - The key under `error`.
     * @param locale - The locale of the text.
     */
    async expectErrorPageSays(key: 'default' | '403', locale = 'en'): Promise<void> {
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(readMessages(locale, 'error')[key], {
        timeout: TIMEOUTS.slowPage
      });
      await expect(emailInput).toHaveCount(0);
    },

    /**
     * Assert that no data request for the login page has been sent since the fixture was created.
     */
    async expectNoLoginPageRequest(): Promise<void> {
      expect(loginPageDataRequests).toBe(0);
    },

    /**
     * Assert that the login form is visible and holds no message that the login failed.
     *
     * The form was there before the navigation, so this reads what stands, not that a navigation has ended.
     */
    async expectLoginFormStandsWithNoMessage(): Promise<void> {
      await expect(emailInput).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page.getByRole('main')).not.toContainText(readMessages('en', 'error').loginFailed);
    },

    /**
     * Assert that the address is the login page's and carries the code of the message that the login failed.
     *
     * The address is what settles a link here, because the form does not change.
     */
    async expectLoginAddressSaysLoginFailed(): Promise<void> {
      await expect(page).toHaveURL(new RegExp(`${adminLogin}\\?.*errorMessage=loginFailed`), {
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Assert that the address is the login page's and carries the code of the message that the user is not authorized.
     */
    async expectLoginAddressSaysNotAuthorized(): Promise<void> {
      await expect(page).toHaveURL(new RegExp(`${adminLogin}\\?.*errorMessage=userNotAuthorized`), {
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Assert that the login page says why the browser was sent here: its alert holds the sentence the message source has for the reason, and its heading, which the root layout focuses after a navigation, has focus and has that sentence as its accessible description, so that a screen reader landing on the heading is given the sentence with it.
     *
     * What a screen reader says is not established here: the step reads what the browser computes. The alert shows an emoji before the sentence, so the sentence is looked for inside it.
     *
     * @param reason - `loggedOutAutomatically` for a logout count the browser let run out, `loggedOutElsewhere` for a sign-out made in another tab or window.
     */
    async expectSaysWhy(reason: AdminLoginNoticeReason): Promise<void> {
      const sentence = readMessages('en', 'common')[reason];
      await expect(notice).toContainText(sentence, { timeout: TIMEOUTS.slowPage });
      await expect(heading).toBeFocused({ timeout: TIMEOUTS.slowPage });
      await expect(heading).toHaveAccessibleDescription(sentence);
    },

    /**
     * Assert that the browser is on the login page, whose alert holds the sentence of a mailed link that could not be used, as the page's English catalogue words it.
     */
    async expectSaysLinkFailed(): Promise<void> {
      await expect(page).toHaveURL((url) => url.pathname === adminLogin, { timeout: TIMEOUTS.slowPage });
      const errors = (readMessages('en', 'adminApp.login') as unknown as { errors: Record<string, string> }).errors;
      await expect(notice).toContainText(errors.linkFailed, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the login page's alert holds the sentence of a wrong address or password, as a sign-in with a password the account no longer holds is answered.
     */
    async expectSignInRefused(): Promise<void> {
      await expect(notice).toContainText(readMessages('en', 'error').wrongEmailOrPassword, {
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Assert that the browser is on the login page and that its alert holds the sentence that the user is not authorized, as the page's English catalogue words it.
     */
    async expectSaysNotAuthorized(): Promise<void> {
      await this.expectOnLoginPage();
      await expect(notice).toContainText(readMessages('en', 'error')['403'], { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Write a count whose deadline the browser has already dropped, as a tab closed during the Contestant App's logout modal leaves it: the context holds `logout-pending` with a fresh id of 32 hexadecimal characters for this page's origin, and no `logout-deadline`. The next request the server's hook sees then meets a count that has run out. Assert that the context holds that one cookie of the count.
     */
    async writeRunOutCount(): Promise<void> {
      const context = page.context();
      await context.clearCookies({ name: COOKIE.logoutDeadline });
      await context.addCookies([
        {
          name: COOKIE.logoutPending,
          value: randomBytes(COUNT_ID_BYTES).toString('hex'),
          url: new URL(page.url()).origin,
          sameSite: 'Lax'
        }
      ]);
      const countCookies = (await context.cookies())
        .map(({ name }) => name)
        .filter((name) => name === COOKIE.logoutPending || name === COOKIE.logoutDeadline);
      expect(countCookies).toEqual([COOKIE.logoutPending]);
    },

    /**
     * Reload the page. The caller asserts where the browser ends.
     */
    async reload(): Promise<void> {
      await page.reload();
    },

    /**
     * Follow a link to the address from the page's own script, so that the application's router takes it as a client-side navigation. The anchor is added for this, because the login page and the Contestant App hold no link to the address. The caller asserts where the browser ends.
     *
     * @param address - The address the link leads to.
     */
    async followLinkInsideTheApp(address: string): Promise<void> {
      await page.evaluate((href) => {
        const link = document.createElement('a');
        link.href = href;
        document.body.append(link);
        link.click();
        link.remove();
      }, address);
    }
  };
}

export type AdminLoginPageFixture = ReturnType<typeof createAdminLoginPage>;
