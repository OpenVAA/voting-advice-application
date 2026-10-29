/**
 * @file contestantIdentityProviderGate fixture.
 *
 * Function-fixture for the identity provider's view of the Contestant App: the view a signed-in account the identity provider made is shown in place of every protected page while it lacks an address to sign in with or a name for its own party, and once after the provider found an existing account.
 *
 * The view's address fields are those of the email-entry component, so they are reached by its ids. An address is typed and never asserted on.
 *
 * Surface:
 *  - expectShown(state)        — the view is shown with this variant, address state and set of asked-for parts.
 *  - expectHeadingFocused()    — the view's first-level heading holds focus.
 *  - giveAddress(address)      — once the view's script runs, type an address and the same confirmation.
 *  - giveNames(names)          — once the view's script runs, type the party's name and abbreviation in the project's default locale.
 *  - expandNameTranslations()  — show every locale's field of the party's name and of its abbreviation.
 *  - pressContinue()           — press the view's main button. The caller asserts what follows.
 *  - expectNameError()         — the party's name is in error for its default locale: the sentence naming the language under it, and focus on that locale's field.
 *  - expectEmailInUse()        — the address field says the address belongs to another account, and has focus.
 *  - expectGone()              — the view is not rendered.
 *  - expectReturning(addressState) — the view tells a returning user that they have already registered, in its title and in the sentence for the address's state.
 *  - expectAddressTaken()      — the view's lead says that the address the user gave earlier is now used by another account.
 *  - expectSignInAddress(address) — the view shows the address the user signs in with, under its label.
 *  - expectAwaitingAddress(address) — the view shows the address awaiting its link, under "Awaiting confirmation".
 *  - pressResend(address)      — give the address confirmation's one-mail-a-minute slot on the server back, then press "Send again"; focus stays on it.
 *  - expectResendRequested()   — "Send again" is unavailable, still focusable and described by its count, and the status region says a new email was requested.
 *  - expectNoAddressField()    — the view renders no address field.
 *  - expectShownInPlaceOfSettings() — the view is shown at the address of the settings page, and nothing of that page is rendered.
 *  - logOut()                  — once the view's script runs, press the view's Log Out, and assert that the login page follows.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
// Direct import, as `contestantEntityUrl.ts` makes it: the module depends on nothing of the application.
import { escapeRegExp } from '../../../../apps/frontend/src/lib/utils/regexp';
import { TIMEOUTS } from '../../helpers';
import { contestantSettingsUrlRe } from '../../utils/contestantEntityUrl';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import { createMultilingualTextField } from '../shared/multilingualTextFieldFixture.fixture';
import type { Page } from '@playwright/test';

/** The locale the party's name is required in: the project's default locale, in which the specs open every screen. */
const NAME_LOCALE = 'en';

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

/** The view's sentences that a step asserts, read from the message source rather than copied. */
const MESSAGES = readEnglishMessages('contestantApp.identityProvider') as Record<
  'nameRequired' | 'emailInUse' | 'emailTakenNotice' | 'signInEmail' | 'awaitingConfirmation',
  string
> & {
  alreadyRegistered: Record<'none' | 'pending' | 'proved', string>;
  title: Record<'alreadyRegistered' | 'complete', string>;
};

/** The sentence the status region holds once a new email has been asked for. */
const RESEND_REQUESTED = String(readEnglishMessages('contestantApp.emailSent').resendRequested);

/** The name of the default locale as the name's error names it. */
const NAME_LOCALE_NAME = String(readEnglishMessages('lang')[NAME_LOCALE]);

/** What the party is called: its name and abbreviation in the default locale. */
export interface IdentityProviderGateNames {
  name: string;
  shortName: string;
}

/** What the view says about itself through its state attributes. */
export interface IdentityProviderGateState {
  /** `new` for an account the provider made or one with no marker, `returning` for one the provider found. */
  variant: 'new' | 'returning';
  /** The state of the account's address. */
  addressState: 'none' | 'pending' | 'proved';
  /** The parts the view's form asks for, space-separated in the view's order; empty when there is no form. */
  asks: '' | 'email' | 'name' | 'name email';
}

export function createContestantIdentityProviderGate(page: Page) {
  const ids = testIds.contestant.identityProviderGate;
  const entryIds = testIds.contestant.emailEntry;
  const container = page.getByTestId(ids.container);
  const nameField = page.getByTestId(ids.name);
  const shortNameField = page.getByTestId(ids.shortName);
  const multilingual = createMultilingualTextField(page);

  return {
    /**
     * Assert that the view is shown, and what it says it is: its variant, the account's address state and the parts its form asks for.
     *
     * @param state - The expected state attributes.
     */
    async expectShown({ variant, addressState, asks }: IdentityProviderGateState): Promise<void> {
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(container).toHaveAttribute('data-variant', variant);
      await expect(container).toHaveAttribute('data-address-state', addressState);
      await expect(container).toHaveAttribute('data-asks', asks);
    },

    /**
     * Assert that the view's first-level heading holds focus, as it does after the post-navigation focus reset and after the view replaced another.
     */
    async expectHeadingFocused(): Promise<void> {
      await expect(container.getByRole('heading', { level: 1 })).toBeFocused({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Type an address into the view's address field and the same address into its confirmation, once the view's script runs: the main button is unavailable until then, and a value typed before it is not read.
     *
     * @param address - The address to sign in with next time.
     */
    async giveAddress(address: string): Promise<void> {
      await expect(page.getByTestId(ids.submit)).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await page.getByTestId(entryIds.email).fill(address);
      await page.getByTestId(entryIds.confirmation).fill(address);
    },

    /**
     * Type the party's name and abbreviation into their fields for the project's default locale, once the view's script runs. Each field is left after it is filled, which is when the view takes the value.
     *
     * @param names - The name and the abbreviation.
     */
    async giveNames({ name, shortName }: IdentityProviderGateNames): Promise<void> {
      await expect(page.getByTestId(ids.submit)).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await multilingual.setLocaleValue(nameField, NAME_LOCALE, name);
      await multilingual.setLocaleValue(shortNameField, NAME_LOCALE, shortName);
    },

    /**
     * Show every locale's field of the party's name and of its abbreviation, as a user who wants to translate them does.
     */
    async expandNameTranslations(): Promise<void> {
      await expect(page.getByTestId(ids.submit)).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await multilingual.openTranslations(nameField);
      await multilingual.openTranslations(shortNameField);
    },

    /**
     * Assert that the party's name is in error because it has no text in the default locale: the sentence naming that language is shown and describes the field, and focus is on that locale's field.
     */
    async expectNameError(): Promise<void> {
      const sentence = MESSAGES.nameRequired.replace('{language}', NAME_LOCALE_NAME);
      const error = page.getByTestId(ids.nameError);
      await expect(error).toBeVisible();
      await expect(error).toContainText(sentence);
      const field = multilingual.localeField(nameField, NAME_LOCALE);
      await expect(field).toHaveAccessibleDescription(new RegExp(escapeRegExp(sentence)));
      await expect(field).toBeFocused();
    },

    /**
     * Assert that the address field says the address typed belongs to another account: its error carries that reason and says so, and focus is on the field.
     */
    async expectEmailInUse(): Promise<void> {
      const error = page.getByTestId(entryIds.emailError);
      await expect(error).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(error).toHaveAttribute('data-reason', 'in-use');
      await expect(error).toContainText(MESSAGES.emailInUse);
      await expect(page.getByTestId(entryIds.email)).toBeFocused();
    },

    /**
     * Press the view's main button. The caller asserts the view that follows.
     */
    async pressContinue(): Promise<void> {
      await page.getByTestId(ids.submit).click();
    },

    /**
     * Assert that the view is not rendered: a rerun load read what it asked for, and another view or the page has replaced it.
     */
    async expectGone(): Promise<void> {
      await expect(container).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the view tells a returning user that they have already registered: its title says so, and its sentence is the one for the state of the account's address.
     *
     * @param addressState - The state of the account's address.
     */
    async expectReturning(addressState: IdentityProviderGateState['addressState']): Promise<void> {
      await expect(container.getByRole('heading', { level: 1 })).toHaveText(MESSAGES.title.alreadyRegistered);
      await expect(page.getByTestId(ids.lead)).toHaveText(MESSAGES.alreadyRegistered[addressState]);
    },

    /**
     * Assert that the view's lead says that the address the user gave earlier is now used by another account and asks for another. The view asks for the address with that lead after a confirmation link failed because another account took the address.
     */
    async expectAddressTaken(): Promise<void> {
      await expect(page.getByTestId(ids.lead)).toHaveText(MESSAGES.emailTakenNotice);
    },

    /**
     * Assert that the view shows an address as the one the user signs in with: the address as text, under the label that says so.
     *
     * @param address - The address the user proved.
     */
    async expectSignInAddress(address: string): Promise<void> {
      const shown = page.getByTestId(ids.address);
      await expect(shown).toHaveText(address);
      await expect(container.getByRole('term')).toHaveText(MESSAGES.signInEmail);
    },

    /**
     * Assert that the view shows an address as the one awaiting its confirmation link: the address as text, under the label that says so.
     *
     * @param address - The address the user gave.
     */
    async expectAwaitingAddress(address: string): Promise<void> {
      await expect(page.getByTestId(ids.address)).toHaveText(address);
      await expect(container.getByRole('term')).toHaveText(MESSAGES.awaitingConfirmation);
    },

    /**
     * Ask for the link again: give the address confirmation's one-mail-a-minute slot on the server back, then press "Send again", and assert that focus stays on it. Without the slot given back, a press inside the minute of the last mail sends nothing.
     *
     * @param address - The pending address.
     */
    async pressResend(address: string): Promise<void> {
      await new SupabaseAdminClient().releaseConfirmationSlot(address);
      const resend = page.getByTestId(ids.resend);
      await expect(page.getByTestId(ids.submit)).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await resend.click();
      await expect(resend).toBeFocused();
    },

    /**
     * Assert what follows a press of "Send again": the button is marked unavailable and is described by the count of the wait in its label, and the status region says that a new email was requested.
     */
    async expectResendRequested(): Promise<void> {
      const resend = page.getByTestId(ids.resend);
      await expect(resend).toHaveAttribute('aria-disabled', 'true', { timeout: TIMEOUTS.slowPage });
      const countdownId = (await page.getByTestId(ids.countdown).getAttribute('id')) ?? '';
      expect(countdownId, 'the id of the count of the wait').not.toBe('');
      await expect(resend).toHaveAttribute('aria-describedby', countdownId);
      await expect(page.getByTestId(ids.status)).toHaveText(RESEND_REQUESTED);
    },

    /**
     * Assert that the view renders no address field and no confirmation field.
     */
    async expectNoAddressField(): Promise<void> {
      await expect(page.getByTestId(entryIds.email)).toHaveCount(0);
      await expect(page.getByTestId(entryIds.confirmation)).toHaveCount(0);
    },

    /**
     * Assert that the view is shown in place of the settings page: the view is visible, the address is still the settings page's, and the page's own button that saves a new password is not rendered.
     */
    async expectShownInPlaceOfSettings(): Promise<void> {
      await expect(container).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page).toHaveURL(contestantSettingsUrlRe());
      await expect(page.getByTestId(testIds.contestant.settings.updateButton)).toHaveCount(0);
    },

    /**
     * Once the view's script runs, press the view's Log Out and assert that the login page follows. The button signs out from the script, so a press before then does nothing; the main button is unavailable until the script runs, so it is the witness. Logging out from the view asks nothing.
     */
    async logOut(): Promise<void> {
      await expect(page.getByTestId(ids.submit)).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      await page.getByTestId(ids.logout).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page).toHaveURL(/\/contestant\/login/);
      await expect(page.getByTestId(testIds.contestant.login.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    }
  };
}

export type ContestantIdentityProviderGateFixture = ReturnType<typeof createContestantIdentityProviderGate>;
