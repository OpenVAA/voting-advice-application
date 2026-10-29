/**
 * @file authConfirmPage fixture.
 *
 * Function-fixture for the confirm page that stands between a mailed link and its verification: the page a link opens, which verifies nothing until its Continue button is pressed, and which tells a browser that is already signed in that continuing signs that account out.
 *
 * Surface:
 *  - open(url)                 — go to a confirm page's address, such as a mailed link. It waits for nothing.
 *  - waitUntilShown()          — wait until the page is shown, for a link of any type.
 *  - fetchWithoutOpening(url)  — fetch a mailed link with the browser context's request client, following its redirect, as a mail scanner or a prefetcher does, and assert that the fetch ended on the page.
 *  - expectAtConfirmAddress(type) — the browser is on the page's address, whose query holds a token and that type and nothing else.
 *  - expectShown(type)         — the page is shown for a link of that type, with its Continue button.
 *  - expectSignedInNotice(shown) — the notice that the browser is signed in, and the Cancel link beside it, are both shown or both absent.
 *  - pressContinue()           — press Continue, and wait until the browser has left the page.
 *  - pressCancel()             — follow Cancel, and wait until the browser has left the page.
 *
 * The address `open` and `fetchWithoutOpening` are given holds a token. It goes to `page.goto` or `page.request.get` and nowhere else: not into an expectation, a step title or a log. `expectAtConfirmAddress` reads the browser's address and asserts only the names of its parameters, the type and whether a token is present.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';
import type { MailedLinkType } from '../../utils/mailedLink';

/** The confirm page's path, after the locale segment, matched against the browser's URL without its query. */
const CONFIRM_PATH_RE = /\/auth\/confirm$/;

/**
 * Create the steps of the confirm page.
 *
 * @param page - The page that opens the confirm page.
 */
export function createAuthConfirmPage(page: Page) {
  const ids = testIds.auth.confirm;
  const root = page.getByTestId(ids.page);

  /** Wait until the browser's URL is no longer the confirm page's. */
  async function expectLeft(): Promise<void> {
    await expect
      .poll(() => CONFIRM_PATH_RE.test(new URL(page.url()).pathname), { timeout: TIMEOUTS.slowPage })
      .toBe(false);
  }

  return {
    /**
     * Go to a confirm page's address, or to a mailed link as received, as a browser that follows the link does.
     *
     * @param url - The confirm page's address or the mailed link, holding the link's query.
     */
    async open(url: string): Promise<void> {
      await page.goto(url);
    },

    /**
     * Fetch a mailed link without opening it in the browser, as a mail scanner or a prefetcher that follows links does: the fetch follows any redirect, and must end on the confirm page itself.
     *
     * @param url - The mailed link as received, or a confirm page's address, holding the link's query.
     */
    async fetchWithoutOpening(url: string): Promise<void> {
      const response = await page.request.get(url);
      expect(response.status(), 'the fetch ended on a page').toBe(200);
      expect(CONFIRM_PATH_RE.test(new URL(response.url()).pathname), 'the fetch ended on the confirm page').toBe(true);
    },

    /**
     * Assert that the browser is on the confirm page's address, whose query holds exactly a `token_hash` and a `type`, with a token and the given type.
     *
     * @param type - The type of the link the browser followed.
     */
    async expectAtConfirmAddress(type: MailedLinkType): Promise<void> {
      await expect
        .poll(() => CONFIRM_PATH_RE.test(new URL(page.url()).pathname), {
          message: 'the browser is on the confirm page',
          timeout: TIMEOUTS.slowPage
        })
        .toBe(true);
      const query = new URL(page.url()).searchParams;
      expect([...query.keys()].sort(), 'the parameters of the confirm page address').toEqual(['token_hash', 'type']);
      expect(query.get('type'), 'the type in the confirm page address').toBe(type);
      expect(query.get('token_hash') ? 'present' : 'absent', 'the token in the confirm page address').toBe('present');
    },

    /**
     * Wait until the page is shown, for a link of any type. A browser that did not reach the page fails here.
     */
    async waitUntilShown(): Promise<void> {
      await root.waitFor({ state: 'visible', timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the page is shown for a link of a type, and holds its Continue button.
     *
     * @param type - The type of the link the page was opened for.
     */
    async expectShown(type: MailedLinkType): Promise<void> {
      await expect(root).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(root).toHaveAttribute('data-type', type);
      await expect(root.getByTestId(ids.continue)).toBeVisible();
    },

    /**
     * Assert that the notice of a signed-in browser and its Cancel link are shown, or that neither is.
     *
     * @param shown - Whether the browser is expected to be signed in.
     */
    async expectSignedInNotice(shown: boolean): Promise<void> {
      if (shown) {
        await expect(root.getByTestId(ids.signedIn)).toBeVisible();
        await expect(root.getByTestId(ids.cancel)).toBeVisible();
      } else {
        await expect(root.getByTestId(ids.signedIn)).toHaveCount(0);
        await expect(root.getByTestId(ids.cancel)).toHaveCount(0);
      }
    },

    /**
     * Press Continue, which posts the page's form, and wait until the browser has left the page for wherever the verification lands it.
     */
    async pressContinue(): Promise<void> {
      await root.getByTestId(ids.continue).click();
      await expectLeft();
    },

    /**
     * Follow Cancel, and wait until the browser has left the page.
     */
    async pressCancel(): Promise<void> {
      await root.getByTestId(ids.cancel).click();
      await expectLeft();
    }
  };
}

export type AuthConfirmPageFixture = ReturnType<typeof createAuthConfirmPage>;
