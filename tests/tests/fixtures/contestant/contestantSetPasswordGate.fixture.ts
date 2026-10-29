/**
 * @file contestantSetPasswordGate fixture.
 *
 * Function-fixture for the set-password view of the Contestant App: the view a signed-in user whose account has no password is shown in place of every protected page, until a password is saved or the user signs out.
 *
 * The view's form is the password setter every page that sets a password renders, so its two fields and its main button are reached by the setter's ids. A password is a credential: the steps type it and never assert on it.
 *
 * Surface:
 *  - open()                        — go to the Contestant App's home, where the view replaces the page, and wait for the view.
 *  - expectShown()                 — the view is shown.
 *  - openProtectedPageDirectly(entityType, entityId) — go to the address of an entity's profile page. It waits for nothing.
 *  - expectShownInPlaceOfPage()    — the view is shown at the profile page's address, and nothing of that page is rendered.
 *  - expectTitle(locale)           — the view's first-level heading is its title in this locale.
 *  - expectGone()                  — the view is not rendered.
 *  - expectAddress(address)        — the view names the account by this address.
 *  - setPassword(password)         — type the password and the same confirmation, then press the main button.
 *  - submit(password, confirmation) — type a password and a confirmation that may differ, then press the main button.
 *  - expectSaving()                — the view states that it is saving.
 *  - expectSaveFailure()           — the view states that the save failed, and shows its message.
 *  - expectUsernameField(address)  — the form holds the account's address in a field a password manager reads and a user does not see.
 *  - expectInputAttributes()       — the form's three controls tell a browser what they hold.
 *  - logOut()                      — once the view's script runs, press the view's Log Out button.
 *  - expectNoHorizontalOverflow()  — the document is no wider than its viewport.
 *  - expectAddressInsideView()     — the account's address lies inside the view and shows its whole text.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { contestantUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import { createPageGeometry } from '../shared/pageGeometry.fixture';
import type { Page } from '@playwright/test';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

/**
 * The view's title in a locale, read from that locale's message source rather than copied.
 *
 * @param locale - A locale the application has a catalogue for.
 */
function titleIn(locale: string): string {
  const file = path.join(TESTS_DIR, '../../apps/frontend/messages', locale, 'contestantApp.setPassword.json');
  const messages = (JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, Record<string, unknown>>)[
    'contestantApp.setPassword'
  ];
  return String(messages.title);
}

export function createContestantSetPasswordGate(page: Page) {
  const ids = testIds.contestant.setPasswordGate;
  const setterIds = testIds.contestant.passwordSetter;

  /** Type into both fields of the password setter, then press the view's main button. */
  async function fillAndPress(password: string, confirmation: string): Promise<void> {
    const field = testIds.contestant.password.field;
    await page.getByTestId(setterIds.password).getByTestId(field).fill(password);
    await page.getByTestId(setterIds.confirm).getByTestId(field).fill(confirmation);
    await page.getByTestId(testIds.contestant.password.submit).click();
  }

  return {
    /**
     * Go to the Contestant App's home and wait for the set-password view, which replaces the page there for a user whose account has no password.
     */
    async open(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
      await expect(page.getByTestId(ids.container)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the set-password view is shown. The step opens nothing: the view replaces whichever protected page the user asked for.
     */
    async expectShown(): Promise<void> {
      await expect(page.getByTestId(ids.container)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Go to the address of the profile page of an entity, as a user who types it or follows a link kept from before does. The profile is a protected page that names its entity in its address.
     *
     * The step waits for nothing: the caller asserts what is shown there.
     *
     * @param entityType - The entity's type, as the address names it.
     * @param entityId - The entity's id.
     */
    async openProtectedPageDirectly(entityType: EntityGrantTarget['entityType'], entityId: string): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppProfile', locale: 'en', params: { entityType, entityId } }));
    },

    /**
     * Assert that the view is shown in place of an entity's profile page: the view is visible, the address is still the profile page's, and the profile's own identity section is not rendered.
     *
     * For the page {@link openProtectedPageDirectly} entered. A user sent on to another page fails the address, and a profile rendered beside the view fails the last assertion.
     */
    async expectShownInPlaceOfPage(): Promise<void> {
      await expect(page.getByTestId(ids.container)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page).toHaveURL(contestantUrlRe('/profile'));
      await expect(page.getByTestId(testIds.contestant.profile.identity)).toHaveCount(0);
    },

    /**
     * Assert that the view's first-level heading is its title in a locale.
     *
     * @param locale - The locale the page was asked for in.
     */
    async expectTitle(locale: string): Promise<void> {
      await expect(page.getByTestId(ids.container).getByRole('heading', { level: 1 })).toHaveText(titleIn(locale));
    },

    /**
     * Assert that the view is not rendered: a saved password was read by the rerun load, and another view or the page has replaced it.
     */
    async expectGone(): Promise<void> {
      await expect(page.getByTestId(ids.container)).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the view names the account by an address, shown as text.
     */
    async expectAddress(address: string): Promise<void> {
      await expect(page.getByTestId(ids.email)).toHaveText(address);
    },

    /**
     * Type a password and the same password as its confirmation, then press the main button. The caller asserts what follows.
     */
    async setPassword(password: string): Promise<void> {
      await fillAndPress(password, password);
    },

    /**
     * Type a password and a confirmation, then press the main button. For a password the form does not accept or a confirmation that differs; the caller asserts the field's error through the password setter's steps.
     */
    async submit(password: string, confirmation: string): Promise<void> {
      await fillAndPress(password, confirmation);
    },

    /**
     * Assert that the view states that it is saving the password.
     */
    async expectSaving(): Promise<void> {
      await expect(page.getByTestId(ids.container)).toHaveAttribute('data-set-password-state', 'saving');
    },

    /**
     * Assert that the save failed: the view states so, and shows the message of a failed save.
     */
    async expectSaveFailure(): Promise<void> {
      await expect(page.getByTestId(ids.container)).toHaveAttribute('data-set-password-state', 'failed');
      await expect(page.getByTestId(ids.error)).toBeVisible();
    },

    /**
     * Assert that the form holds the account's address for a password manager: exactly one control named `username` inside a form, holding the address, read-only, and not shown.
     */
    async expectUsernameField(address: string): Promise<void> {
      // reason: the field is not rendered, so no role reaches it, and it carries no test id: a password manager finds it by its name, and so does this step. The name is not a translated string.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const username = page.locator('form input[name="username"]');
      await expect(username).toHaveCount(1);
      await expect(username).toHaveValue(address);
      await expect(username).toHaveAttribute('readonly', '');
      await expect(username).toBeHidden();
    },

    /**
     * Assert what the form's three controls tell a browser and a password manager: the field with the account's address is an email field that holds a user name, and the password and its confirmation are named `new-password` and `new-password-confirmation` and each holds a new password.
     *
     * The `type` of the two password controls is not asserted: their show and hide toggles change it.
     */
    async expectInputAttributes(): Promise<void> {
      // reason: the field is not rendered, so no role reaches it, and it carries no test id: a password manager finds it by its name, and so does this step. The name is not a translated string.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const username = page.locator('form input[name="username"]');
      await expect(username).toHaveAttribute('type', 'email');
      await expect(username).toHaveAttribute('autocomplete', 'username');
      const field = testIds.contestant.password.field;
      const password = page.getByTestId(setterIds.password).getByTestId(field);
      await expect(password).toHaveAttribute('name', 'new-password');
      await expect(password).toHaveAttribute('autocomplete', 'new-password');
      const confirmation = page.getByTestId(setterIds.confirm).getByTestId(field);
      await expect(confirmation).toHaveAttribute('name', 'new-password-confirmation');
      await expect(confirmation).toHaveAttribute('autocomplete', 'new-password');
    },

    /**
     * Press the view's Log Out button once the view's script runs: the button signs out from the script, so a press before then does nothing. The main button is unavailable until the script runs, so it is the witness. The caller asserts the screen it leads to.
     */
    async logOut(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.password.submit)).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await page.getByTestId(ids.logout).click();
    },

    /**
     * Assert the document is no wider than its viewport. A failure names the elements that do not fit.
     */
    async expectNoHorizontalOverflow(): Promise<void> {
      await createPageGeometry(page).expectNoHorizontalOverflow();
    },

    /**
     * Assert that the account's address lies wholly inside the view's frame and that its text does not reach beyond its own box: a long address wraps inside the content column instead of running out of it.
     */
    async expectAddressInsideView(): Promise<void> {
      const geometry = createPageGeometry(page);
      const address = page.getByTestId(ids.email);
      await geometry.expectInside(address, page.getByTestId(ids.container), 'the address in the set-password view');
      await geometry.expectShowsWholeText(address, 'the address in the set-password view');
    }
  };
}

export type ContestantSetPasswordGateFixture = ReturnType<typeof createContestantSetPasswordGate>;
