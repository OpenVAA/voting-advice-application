/**
 * @file contestantRegisterPage fixture.
 *
 * Function-fixture for the three screens of registration in the Contestant App: the registration screen, where a visitor chooses how to register and types an address or a registration code; the screen that asks for the address a valid code is registered with; and the screen that signs in the holder of a code that is already used.
 *
 * A registration code and a password are credentials. The steps type them and never assert on them: a step that needs to know a code is still in its field asserts that the field is not empty.
 *
 * Surface, the registration screen:
 *  - open(locale?)                 — navigate to the registration screen, in English or in the locale given, and wait for it.
 *  - openDirectly()                — go to the registration screen's address and wait for nothing.
 *  - expectShown()                 — the registration screen is shown.
 *  - expectListedModes(modes)      — the screen lists exactly these registration modes, in this order.
 *  - listedModes()                 — the modes the screen lists, in order, for a step that acts on them.
 *  - expectSelectedMode(mode)      — the screen has this mode chosen, or none.
 *  - chooseMode(mode)              — choose a mode with the pointer, once the screen's script has loaded.
 *  - chooseModeWithKeyboard(mode)  — choose a mode with the keyboard, and assert that focus stays on its radio.
 *  - expectPanelOpen(mode)         — the chosen mode's panel is the one panel in the document.
 *  - expectSingleMode(mode)        — the screen lists this one mode and shows its panel directly, with nothing to choose.
 *  - expectIdentityProviderPanel(types) — the identity provider's panel registers these entity types and says so, with the line on where Continue leads; it asks which, with none chosen, exactly when there are several.
 *  - entityTypesOffered()          — the entity types the identity provider's panel registers, in order, for a step that acts on them.
 *  - chooseEntityType(type)        — choose the entity type to register with the pointer, once the screen's script has loaded.
 *  - chooseEntityTypeWithKeyboard(type) — choose the entity type with the keyboard alone, and assert that focus stays on its radio.
 *  - expectEntityTypesError()      — the group of types shows its error as its description, and the first type has focus.
 *  - expectRadiosBordered()        — every radio the screen shows, of the modes and of the entity types, draws its border.
 *  - continueToIdentityProvider()  — press Continue on the identity provider's panel and wait until the browser is back in the application from the provider.
 *  - typeEmail(address)            — type an address into the email mode's field.
 *  - typeCode(code)                — type a registration code into the code mode's field.
 *  - pressContinue()               — press the screen's main button.
 *  - expectModesError()            — the group of modes shows its error and the first radio has focus.
 *  - expectFieldError(field, reason) — the email or the code field is in error, for this reason, and has focus.
 *  - expectCodeUnconfirmed()       — the code was not confirmed: its error says so, the code is still in its field, and the field has focus.
 *  - expectCodeInputAttributes()   — the code control tells a browser it holds neither a password nor a one-time code.
 *  - expectEmailInputAttributes()  — the email mode's control tells a browser it holds an address.
 *  - expectRegisteredNotice()      — the notice for a browser that has confirmed an address is shown, with its title, a link to the login screen and one to the forgot-password screen.
 *  - expectNoRegisteredNotice()    — the screen shows no such notice.
 *  - followRegisteredNoticeLogin() — press the notice's link to the login screen.
 *  - dismissRegisteredNotice()     — press the notice's Dismiss, once it is shown.
 *  - reload()                      — load the registration screen again at its own address and wait for it.
 *
 * Surface, the screen that asks for an address:
 *  - openEmailEntryDirectly()      — go to the screen's address, as a visitor who holds no registration code in this tab does. It waits for nothing.
 *  - expectEmailEntryShown()       — the screen is shown.
 *  - typeEmails(email, confirmation) — type the address and its confirmation.
 *  - leaveConfirmation()           — move focus out of the confirmation field with the keyboard.
 *  - expectMismatch()              — the confirmation shows that the two addresses differ.
 *  - expectEmailEntryInputAttributes() — the two controls tell a browser that each holds an address.
 *  - pressEmailEntryContinue()     — press the screen's main button.
 *  - followEmailEntryReturn()      — press the screen's way back.
 *
 * Surface, the screen that signs in the holder of a used code:
 *  - openCodeSignInDirectly()      — go to the screen's address, as a visitor who holds no registration code in this tab does. It waits for nothing.
 *  - expectCodeSignInShown()       — the screen is shown.
 *  - typePassword(password)        — type a password.
 *  - pressSignIn()                 — press the screen's main button.
 *  - expectRefusal()               — the screen shows that the sign-in was refused.
 *  - followNoPasswordYet()         — press the link for a user without a password, which leads to the forgot-password page, and wait for that page's address.
 *  - expectNoAddressField()        — the screen holds no field for an email address.
 *  - expectCodeSignInInputAttributes() — the password control tells a browser it holds the current password, and the code travels in a field a user does not see.
 *  - followCodeSignInReturn()      — press the screen's way back.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
// Direct import, as `contestantEntityUrl.ts` makes it: the module depends on nothing of the application.
import { escapeRegExp } from '../../../../apps/frontend/src/lib/utils/regexp';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { RegistrationMode, ServedEntityType } from '@openvaa/app-shared';
import type { Locator, Page } from '@playwright/test';

/** The two fields of the registration screen's panels. */
export type ContestantRegisterField = 'email' | 'code';

/** Why each field of the registration screen can be in error. */
export interface ContestantRegisterFieldReason {
  /** The email field: left empty, or holding something the control does not take for an address. */
  email: 'required' | 'invalid';
  /** The code field: left empty, or holding a code the server did not confirm. */
  code: 'required' | 'unconfirmed';
}

/**
 * Read one namespace of the English message source.
 * @param file - The file's name under `apps/frontend/messages/en`, without its extension; the namespace is the file's single top-level key.
 */
function readEnglishMessages(file: string): Record<string, unknown> {
  const source = JSON.parse(
    fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en', `${file}.json`), 'utf8')
  ) as Record<string, Record<string, unknown>>;
  return source[file];
}

/** The identity provider's panel's sentences, read from the message source rather than copied. */
const IDENTITY_PROVIDER_MESSAGES = (
  readEnglishMessages('contestantApp.register') as {
    identityProvider: {
      intro: Record<'candidate' | 'organization' | 'both', string>;
      redirectInfo: string;
      types: Record<'candidate' | 'organization' | 'legend' | 'required', string>;
    };
  }
).identityProvider;

/** The sentence the code field shows for a code that was not confirmed, read from the message source rather than copied. */
const CODE_UNCONFIRMED_MESSAGE = String(readEnglishMessages('contestantApp.register').codeUnconfirmed);

/**
 * The title of the notice for a browser that has confirmed an address, read from the message source rather than copied. Read when a step asks for it, so that a source without the notice fails that step's assertion and not the loading of this file.
 */
function registeredNoticeTitle(): string {
  const notice = (readEnglishMessages('contestantApp.register') as { registeredNotice?: { title?: unknown } })
    .registeredNotice;
  return String(notice?.title);
}

/** The sentence under the email field for each reason it can be in error, read from the message source rather than copied. */
const EMAIL_ERROR_MESSAGES: Readonly<Record<ContestantRegisterFieldReason['email'], string>> = Object.freeze({
  required: (readEnglishMessages('contestantApp.login') as Record<string, string>).emailRequired,
  invalid: (readEnglishMessages('components') as { input: { error: Record<string, string> } }).input.error.invalidEmail
});

export function createContestantRegisterPage(page: Page) {
  const ids = testIds.contestant.register;
  const entryIds = testIds.contestant.emailEntry;

  /** The radio of one mode, reached through the mode's option block. */
  function modeRadio(mode: RegistrationMode): Locator {
    // reason: a mode is the value of a state attribute of its option block, and neither getByTestId nor getByRole selects by an attribute's value. The selector reads a test id and that attribute, neither of which is a translated string.
    // eslint-disable-next-line playwright/no-restricted-locators
    return page.locator(`[data-testid="${ids.modeOption}"][data-mode="${mode}"]`).getByTestId(ids.modeInput);
  }

  /** The radio of one entity type in the identity provider's panel. */
  function entityTypeRadio(type: ServedEntityType): Locator {
    // reason: a type is the value of a state attribute of its radio, and neither getByTestId nor getByRole selects by an attribute's value. The selector reads a test id and that attribute, neither of which is a translated string.
    // eslint-disable-next-line playwright/no-restricted-locators
    return page.locator(`[data-testid="${ids.entityTypeInput}"][data-entity-type="${type}"]`);
  }

  /** The control and the error of one field of the registration screen's panels. */
  function fieldOf(field: ContestantRegisterField): { control: Locator; error: Locator } {
    return field === 'email'
      ? { control: page.getByTestId(ids.email), error: page.getByTestId(ids.emailError) }
      : { control: page.getByTestId(ids.code), error: page.getByTestId(ids.codeError) };
  }

  /**
   * Wait until the registration screen's script has loaded. The screen's main button is disabled in the server's markup and enabled once the script runs, and a mode chosen before that is not read by the screen.
   */
  async function scriptLoaded(): Promise<void> {
    await expect(page.getByTestId(ids.submit)).toBeEnabled({ timeout: TIMEOUTS.slowPage });
  }

  /** Fill a control once it takes input, without asserting on what was typed. */
  async function type(control: Locator, text: string): Promise<void> {
    await expect(control).toBeEditable();
    await control.fill(text);
  }

  return {
    // -----------------------------------------------------------------------
    // The registration screen
    // -----------------------------------------------------------------------

    /**
     * Navigate to the registration screen and wait until it is shown.
     *
     * @param locale - The locale to open it in. The base locale, English, is served without a prefix and every other under `/<locale>`.
     */
    async open(locale = 'en'): Promise<void> {
      await page.goto((locale === 'en' ? '' : `/${locale}`) + buildRoute({ route: 'ContestantAppRegister', locale }));
      await expect(page.getByTestId(ids.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Go to the registration screen's address, as a visitor does by a link kept from before or a typed address.
     *
     * The step waits for nothing: where registration is not offered, and for a signed-in user, the screen is not shown, so the caller asserts where the visitor ends.
     */
    async openDirectly(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppRegister', locale: 'en' }));
    },

    /**
     * Assert that the registration screen is shown. The step opens nothing: it is for the screen a navigation has led to.
     */
    async expectShown(): Promise<void> {
      await expect(page.getByTestId(ids.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert which registration modes the screen lists, and in which order.
     *
     * @param modes - The modes expected, in the order they are shown.
     */
    async expectListedModes(modes: ReadonlyArray<RegistrationMode>): Promise<void> {
      await expect(page.getByTestId(ids.page)).toHaveAttribute('data-modes', modes.join(' '));
    },

    /**
     * Read which registration modes the screen lists, in the order they are shown. For a step that acts on what is listed; a test asserts the list with {@link expectListedModes}.
     *
     * @returns The listed modes.
     */
    async listedModes(): Promise<Array<RegistrationMode>> {
      const listed = (await page.getByTestId(ids.page).getAttribute('data-modes')) ?? '';
      return listed.split(' ').filter(Boolean) as Array<RegistrationMode>;
    },

    /**
     * Assert which mode the screen has chosen.
     *
     * @param mode - The mode expected, or `null` when none is chosen.
     */
    async expectSelectedMode(mode: RegistrationMode | null): Promise<void> {
      await expect(page.getByTestId(ids.page)).toHaveAttribute('data-mode-selected', mode ?? '');
    },

    /**
     * Choose a registration mode with the pointer, and assert that its radio is checked.
     */
    async chooseMode(mode: RegistrationMode): Promise<void> {
      await scriptLoaded();
      await modeRadio(mode).check();
    },

    /**
     * Choose a registration mode with the keyboard alone: focus the group's first radio, then move to the mode with the arrow keys, or choose the first with the space bar. Asserts that the mode's radio is checked and that focus is still on it, so choosing did not move focus into the panel that opened.
     *
     * @throws Error when the screen does not list the mode.
     */
    async chooseModeWithKeyboard(mode: RegistrationMode): Promise<void> {
      const listed = ((await page.getByTestId(ids.page).getAttribute('data-modes')) ?? '').split(' ');
      const steps = listed.indexOf(mode);
      if (steps < 0) throw new Error(`contestantRegisterPage: the screen does not list the mode ${mode}`);

      await scriptLoaded();
      const first = page.getByTestId(ids.modeInput).first();
      await first.focus();
      if (steps === 0) await page.keyboard.press('Space');
      for (let step = 0; step < steps; step++) await page.keyboard.press('ArrowDown');

      const chosen = modeRadio(mode);
      await expect(chosen).toBeChecked();
      await expect(chosen).toBeFocused();
    },

    /**
     * Assert that a mode's panel is open, and that it is the only panel in the document. For a screen that lists several modes.
     */
    async expectPanelOpen(mode: RegistrationMode): Promise<void> {
      const panels = page.getByTestId(ids.modePanel);
      await expect(panels).toHaveCount(1);
      await expect(panels).toHaveAttribute('data-mode', mode);
      await expect(panels).toBeVisible();
    },

    /**
     * Assert that the screen lists one mode alone and shows that mode's panel directly: the mode is the one in play, its field is shown where it has one, and there is no option to choose and no panel block.
     *
     * @param mode - The one mode expected.
     */
    async expectSingleMode(mode: RegistrationMode): Promise<void> {
      const root = page.getByTestId(ids.page);
      await expect(root).toHaveAttribute('data-modes', mode);
      await expect(root).toHaveAttribute('data-mode-selected', mode);
      await expect(page.getByTestId(ids.modeInput)).toHaveCount(0);
      await expect(page.getByTestId(ids.modePanel)).toHaveCount(0);
      if (mode === 'email') await expect(page.getByTestId(ids.email)).toBeVisible();
      if (mode === 'code') await expect(page.getByTestId(ids.code)).toBeVisible();
    },

    /**
     * Assert that the identity provider's panel is shown and registers exactly these entity types, in this order: its sentence names them and its line says that Continue leads to the provider.
     *
     * @param types - The entity types expected.
     */
    async expectIdentityProviderPanel(types: ReadonlyArray<ServedEntityType>): Promise<void> {
      const form = page.getByTestId(ids.identityProviderForm);
      await expect(form).toBeVisible();
      await expect(form).toHaveAttribute('data-entity-types', types.join(' '));
      const intro = types.length > 1 ? 'both' : types[0];
      await expect(form).toContainText(IDENTITY_PROVIDER_MESSAGES.intro[intro]);
      await expect(form).toContainText(IDENTITY_PROVIDER_MESSAGES.redirectInfo);
      const group = form.getByTestId(ids.entityTypes);
      if (types.length < 2) {
        await expect(group).toHaveCount(0);
        return;
      }
      await expect(group).toBeVisible();
      await expect(form.getByRole('group', { name: IDENTITY_PROVIDER_MESSAGES.types.legend })).toBeVisible();
      const radios = group.getByTestId(ids.entityTypeInput);
      await expect(radios).toHaveCount(types.length);
      for (const [index, type] of types.entries()) {
        await expect(radios.nth(index)).toHaveAttribute('data-entity-type', type);
        await expect(radios.nth(index)).not.toBeChecked();
        await expect(
          group.getByRole('radio', { name: IDENTITY_PROVIDER_MESSAGES.types[type], exact: true })
        ).toHaveAttribute('data-entity-type', type);
      }
    },

    /**
     * Read which entity types the identity provider's panel registers, in order. For a step that acts on them; a test asserts them with {@link expectIdentityProviderPanel}.
     *
     * @returns The types.
     */
    async entityTypesOffered(): Promise<Array<ServedEntityType>> {
      const form = page.getByTestId(ids.identityProviderForm);
      await expect(form).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const offered = (await form.getAttribute('data-entity-types')) ?? '';
      return offered.split(' ').filter(Boolean) as Array<ServedEntityType>;
    },

    /**
     * Choose the entity type to register with the pointer, and assert that its radio is checked.
     */
    async chooseEntityType(type: ServedEntityType): Promise<void> {
      await scriptLoaded();
      await entityTypeRadio(type).check();
    },

    /**
     * Choose the entity type to register with the keyboard alone: focus the group's first radio, then move to the type with the arrow keys, or choose the first with the space bar. Asserts that the type's radio is checked and that focus is still on it.
     *
     * @throws Error when the panel does not offer the type.
     */
    async chooseEntityTypeWithKeyboard(type: ServedEntityType): Promise<void> {
      const offered = await this.entityTypesOffered();
      const steps = offered.indexOf(type);
      if (steps < 0) throw new Error(`contestantRegisterPage: the panel does not offer the entity type ${type}`);

      await scriptLoaded();
      await page.getByTestId(ids.entityTypeInput).first().focus();
      if (steps === 0) await page.keyboard.press('Space');
      for (let step = 0; step < steps; step++) await page.keyboard.press('ArrowDown');

      const chosen = entityTypeRadio(type);
      await expect(chosen).toBeChecked();
      await expect(chosen).toBeFocused();
    },

    /**
     * Assert that the group of entity types is in error because none was chosen: its error says so, describes the group, and focus is on the first type, which is not checked.
     */
    async expectEntityTypesError(): Promise<void> {
      const error = page.getByTestId(ids.entityTypesError);
      await expect(error).toBeVisible();
      await expect(error).toContainText(IDENTITY_PROVIDER_MESSAGES.types.required);
      await expect(page.getByTestId(ids.entityTypes)).toHaveAccessibleDescription(
        new RegExp(escapeRegExp(IDENTITY_PROVIDER_MESSAGES.types.required))
      );
      const first = page.getByTestId(ids.entityTypeInput).first();
      await expect(first).toBeFocused();
      await expect(first).not.toBeChecked();
    },

    /**
     * Assert that every radio the registration screen shows draws its border, so that a radio nobody has chosen is still seen: the radios of the modes and those of the identity provider's entity types. The screen must show one radio or more.
     */
    async expectRadiosBordered(): Promise<void> {
      const groups = [page.getByTestId(ids.modeInput), page.getByTestId(ids.entityTypeInput)];
      let shown = 0;
      for (const radios of groups) {
        const count = await radios.count();
        shown += count;
        for (let index = 0; index < count; index++) {
          await expect(radios.nth(index), 'the radio draws its border').not.toHaveCSS('border-top-width', '0px');
        }
      }
      expect(shown, 'the screen shows radios').toBeGreaterThan(0);
    },

    /**
     * Press Continue on the identity provider's panel, once the screen's script has loaded, and wait until the browser has left for the provider and come back to the application: on the provider's answer the callback leads to the next screen, and a refused or failed start leads to the error screen. The caller asserts which screen it is.
     */
    async continueToIdentityProvider(): Promise<void> {
      await expect(page.getByTestId(ids.identityProviderForm)).toBeVisible();
      await scriptLoaded();
      const registerPage = new URL(page.url());
      await page.getByTestId(ids.submit).click();
      await page.waitForURL((url) => url.origin === registerPage.origin && url.pathname !== registerPage.pathname, {
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Type an address into the email mode's field.
     */
    async typeEmail(address: string): Promise<void> {
      await type(page.getByTestId(ids.email), address);
    },

    /**
     * Type a registration code into the code mode's field.
     */
    async typeCode(code: string): Promise<void> {
      await type(page.getByTestId(ids.code), code);
    },

    /**
     * Press the registration screen's main button. The caller asserts what follows.
     */
    async pressContinue(): Promise<void> {
      await page.getByTestId(ids.submit).click();
    },

    /**
     * Assert that the group of modes is in error because none was chosen: its error is shown and focus is on the first radio.
     */
    async expectModesError(): Promise<void> {
      await expect(page.getByTestId(ids.modesError)).toBeVisible();
      await expect(page.getByTestId(ids.modeInput).first()).toBeFocused();
    },

    /**
     * Assert that a field of the open panel is in error for a reason: its error is shown and says so, the control is marked invalid, and focus is on the control.
     *
     * The email field's reason is read from the sentence its error holds, compared with the message source: the error shows an emoji before the sentence, so the sentence is looked for inside it. The code field's reason is read from what its error states about itself.
     *
     * @param field - The field expected to be in error.
     * @param reason - Why: for the email field `required` or `invalid`, for the code field `required` or `unconfirmed`.
     */
    async expectFieldError<TField extends ContestantRegisterField>(
      field: TField,
      reason: ContestantRegisterFieldReason[TField]
    ): Promise<void> {
      const { control, error } = fieldOf(field);
      await expect(error).toBeVisible();
      if (field === 'email') {
        await expect(error).toContainText(EMAIL_ERROR_MESSAGES[reason as ContestantRegisterFieldReason['email']]);
      } else {
        await expect(error).toHaveAttribute('data-reason', reason);
      }
      await expect(control).toHaveAttribute('aria-invalid', 'true');
      await expect(control).toBeFocused();
    },

    /**
     * Assert that the code typed was not confirmed: the code field's error says so in the one sentence the message source has for it, the field still holds what was typed, and focus is on the field.
     *
     * The error shows an emoji before the sentence, so the sentence is looked for inside it. The code itself is never compared: the field is asserted not to be empty.
     */
    async expectCodeUnconfirmed(): Promise<void> {
      const { control, error } = fieldOf('code');
      await expect(error).toBeVisible();
      await expect(error).toHaveAttribute('data-reason', 'unconfirmed');
      await expect(error).toContainText(CODE_UNCONFIRMED_MESSAGE);
      await expect(control).not.toHaveValue('');
      await expect(control).toBeFocused();
    },

    /**
     * Assert what the code control tells a browser and a password manager: it is a text field named `code` for which nothing is to be offered.
     */
    async expectCodeInputAttributes(): Promise<void> {
      const code = page.getByTestId(ids.code);
      await expect(code).toHaveAttribute('type', 'text');
      await expect(code).toHaveAttribute('name', 'code');
      await expect(code).toHaveAttribute('autocomplete', 'off');
    },

    /**
     * Assert what the email mode's control tells a browser and a password manager: it is an email field named `email` that holds an address, and no user name.
     */
    async expectEmailInputAttributes(): Promise<void> {
      const email = page.getByTestId(ids.email);
      await expect(email).toHaveAttribute('type', 'email');
      await expect(email).toHaveAttribute('name', 'email');
      await expect(email).toHaveAttribute('autocomplete', 'email');
    },

    /**
     * Assert that the registration screen shows the notice for a browser that has confirmed an address: it is visible, it names its title, and it links to the login screen and to the forgot-password screen.
     */
    async expectRegisteredNotice(): Promise<void> {
      const notice = page.getByTestId(ids.registeredNotice);
      await expect(notice).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(notice.getByRole('heading', { name: registeredNoticeTitle(), exact: true })).toBeVisible();
      await expect(notice.getByTestId(ids.registeredNoticeLogin)).toBeVisible();
      await expect(notice.getByTestId(ids.registeredNoticeForgotPassword)).toBeVisible();
    },

    /**
     * Assert that the registration screen is shown with no notice for a browser that has confirmed an address.
     */
    async expectNoRegisteredNotice(): Promise<void> {
      await expect(page.getByTestId(ids.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(ids.registeredNotice)).toHaveCount(0);
    },

    /**
     * Press the notice's link to the login screen. The caller asserts the screen it leads to.
     */
    async followRegisteredNoticeLogin(): Promise<void> {
      await page.getByTestId(ids.registeredNoticeLogin).click();
    },

    /**
     * Press the notice's Dismiss, once it is shown. The caller asserts what follows.
     */
    async dismissRegisteredNotice(): Promise<void> {
      const dismiss = page.getByTestId(ids.registeredNotice).getByTestId(ids.registeredNoticeDismiss);
      await expect(dismiss).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await dismiss.click();
    },

    /**
     * Load the registration screen again at its own address, and wait until it is shown.
     */
    async reload(): Promise<void> {
      await page.reload();
      await expect(page.getByTestId(ids.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    // -----------------------------------------------------------------------
    // The screen that asks for the address a valid code is registered with
    // -----------------------------------------------------------------------

    /**
     * Go to the address of the screen that asks for an address, as a visitor who holds no registration code in this tab does: by a link kept from before, a reload or a typed address.
     *
     * The step waits for nothing. The screen is not shown to such a visitor, so the caller asserts where they end.
     */
    async openEmailEntryDirectly(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppRegisterEmail', locale: 'en' }));
    },

    /**
     * Assert that the screen that asks for an address is shown. The step opens nothing: the screen is reached from the registration screen with a valid code.
     */
    async expectEmailEntryShown(): Promise<void> {
      await expect(page.getByTestId(ids.emailEntryPage)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Type an address and its confirmation.
     *
     * @param email - What goes into the first field.
     * @param confirmation - What goes into the second; the same address unless the test is about a mismatch.
     */
    async typeEmails(email: string, confirmation: string): Promise<void> {
      await type(page.getByTestId(entryIds.email), email);
      await type(page.getByTestId(entryIds.confirmation), confirmation);
    },

    /**
     * Move focus out of the confirmation field with the Tab key, as a user does who goes on to the next control.
     */
    async leaveConfirmation(): Promise<void> {
      await page.getByTestId(entryIds.confirmation).press('Tab');
    },

    /**
     * Assert that the confirmation field shows that the two addresses differ, and is marked invalid.
     */
    async expectMismatch(): Promise<void> {
      await expect(page.getByTestId(entryIds.confirmationError)).toBeVisible();
      await expect(page.getByTestId(entryIds.confirmation)).toHaveAttribute('aria-invalid', 'true');
    },

    /**
     * Assert what the two controls of the screen that asks for an address tell a browser and a password manager: each is an email field that holds an address, the first named `email` and the second `email-confirmation`.
     */
    async expectEmailEntryInputAttributes(): Promise<void> {
      const email = page.getByTestId(entryIds.email);
      await expect(email).toHaveAttribute('type', 'email');
      await expect(email).toHaveAttribute('name', 'email');
      await expect(email).toHaveAttribute('autocomplete', 'email');
      const confirmation = page.getByTestId(entryIds.confirmation);
      await expect(confirmation).toHaveAttribute('type', 'email');
      await expect(confirmation).toHaveAttribute('name', 'email-confirmation');
      await expect(confirmation).toHaveAttribute('autocomplete', 'email');
    },

    /**
     * Press the main button of the screen that asks for an address. The caller asserts what follows.
     */
    async pressEmailEntryContinue(): Promise<void> {
      await page.getByTestId(ids.emailEntrySubmit).click();
    },

    /**
     * Press the way back of the screen that asks for an address. The caller asserts the screen it leads to.
     */
    async followEmailEntryReturn(): Promise<void> {
      await page.getByTestId(ids.emailEntryReturn).click();
    },

    // -----------------------------------------------------------------------
    // The screen that signs in the holder of a used code
    // -----------------------------------------------------------------------

    /**
     * Go to the address of the screen that signs in the holder of a used code, as a visitor who holds no registration code in this tab does: by a link kept from before, a reload or a typed address.
     *
     * The step waits for nothing. The screen is not shown to such a visitor, so the caller asserts where they end.
     */
    async openCodeSignInDirectly(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppRegisterSignIn', locale: 'en' }));
    },

    /**
     * Assert that the screen that signs in the holder of a used code is shown. The step opens nothing: the screen is reached from the registration screen with a used code.
     */
    async expectCodeSignInShown(): Promise<void> {
      await expect(page.getByTestId(ids.signInPage)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Type a password into the screen's one password field.
     */
    async typePassword(password: string): Promise<void> {
      await type(page.getByTestId(testIds.contestant.password.field), password);
    },

    /**
     * Press the main button of the screen that signs in the holder of a used code. The caller asserts what follows.
     */
    async pressSignIn(): Promise<void> {
      await page.getByTestId(ids.signInSubmit).click();
    },

    /**
     * Assert that the sign-in was refused: the screen states that it failed, and shows the refusal's sentence.
     */
    async expectRefusal(): Promise<void> {
      await expect(page.getByTestId(ids.signInPage)).toHaveAttribute('data-sign-in-state', 'failed');
      await expect(page.getByTestId(ids.signInError)).toBeVisible();
    },

    /**
     * Press the link of the screen that signs in the holder of a used code for a user without a password, once it is shown, and wait until the visitor is at the forgot-password page's address.
     */
    async followNoPasswordYet(): Promise<void> {
      const link = page.getByTestId(ids.signInNoPasswordYetLink);
      await expect(link).toBeVisible();
      await link.click();
      const forgotPasswordPath = buildRoute({ route: 'ContestantAppForgotPassword', locale: 'en' });
      await expect(page).toHaveURL((url) => url.pathname === forgotPasswordPath, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the screen that signs in the holder of a used code asks for no address: it is shown, and the document holds no control that is an email field, is named `email`, or tells a browser it holds an address or a user name.
     */
    async expectNoAddressField(): Promise<void> {
      await expect(page.getByTestId(ids.signInPage)).toBeVisible();
      // reason: the step asserts that no control of a kind exists, whatever its test id or its label, and a kind of control is told by its attributes. None of them is a translated string.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const addressFields = page.locator(
        'input[type="email"], input[name="email"], input[autocomplete="email"], input[autocomplete="username"]'
      );
      await expect(addressFields).toHaveCount(0);
    },

    /**
     * Assert what the controls of the screen that signs in the holder of a used code tell a browser and a password manager: the password control is named `password` and holds the current password, and the form holds exactly one field named `code`, which is hidden.
     *
     * The password control's `type` is not asserted: its show and hide toggle changes it. The value of the hidden field is a credential and is never read.
     */
    async expectCodeSignInInputAttributes(): Promise<void> {
      const password = page.getByTestId(testIds.contestant.password.field);
      await expect(password).toHaveAttribute('name', 'password');
      await expect(password).toHaveAttribute('autocomplete', 'current-password');
      // reason: the field is hidden, so no role reaches it, and it carries no test id: the form posts it by its name, and so does this step find it. The name is not a translated string.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const code = page.getByTestId(ids.signInPage).locator('form input[name="code"]');
      await expect(code).toHaveCount(1);
      await expect(code).toHaveAttribute('type', 'hidden');
    },

    /**
     * Press the way back of the screen that signs in the holder of a used code. The caller asserts the screen it leads to.
     */
    async followCodeSignInReturn(): Promise<void> {
      await page.getByTestId(ids.signInReturn).click();
    }
  };
}

export type ContestantRegisterPageFixture = ReturnType<typeof createContestantRegisterPage>;
