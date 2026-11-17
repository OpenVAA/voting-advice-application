/**
 * @file contestantIdentityProviderError fixture.
 *
 * Function-fixture for the screen an identification failure in the identity provider's flow lands on. The screen shows one of three classes — `cancelled`, `retry` and `noRetry` — chosen by the code on its address, and nothing else of that code.
 *
 * Surface:
 *  - open(code)              — open the screen by its address with a code, as the callback's redirect does, and wait for it.
 *  - expectShown(errorClass) — the screen is shown in that class, with that class's sentence read from its catalogue file.
 *  - expectCode(code)        — the screen's address carries that code.
 *  - expectTryAgain(offered) — Try again is a link to the registration page with the provider's option named, or is not rendered.
 *  - expectReturn()          — Return is a link to the login screen.
 *  - expectReturnWithoutTryAgain() — Try again is not rendered, and Return is a link to the login screen.
 *  - expectSupportInSentence() — support is offered as a link inside the support sentence, to the support section of the Help page, and by no Contact support button.
 *  - expectSupportButtonWithoutIcon() — support is offered by the Contact support button, which carries no icon, and by no support sentence.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { Page } from '@playwright/test';

/** The three classes the screen can be shown in. */
export type IdentityProviderErrorClass = 'cancelled' | 'retry' | 'noRetry';

/** The fragment of the support section on the Help page. */
const SUPPORT_SECTION = '#support';

/** An English catalogue file's messages, under its one top-level key. */
function englishCatalogue(namespace: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(TESTS_DIR, `../../apps/frontend/messages/en/${namespace}.json`), 'utf8'))[
    namespace
  ];
}

/** The screen's sentence for a class, in English, read from the catalogue file. */
function englishSentence(errorClass: IdentityProviderErrorClass): string {
  const errors = englishCatalogue('contestantApp.identityProvider').error as Record<string, { content: string }>;
  return errors[errorClass].content;
}

export function createContestantIdentityProviderErrorPage(page: Page) {
  const ids = testIds.contestant.identityProviderError;

  return {
    /**
     * Open the screen by its address with a code on it, in English, and wait for its frame.
     *
     * @param code - The value of the `error` parameter: one of the codes the callback reports, or any other text.
     */
    async open(code: string): Promise<void> {
      const address = `${buildRoute({ route: 'ContestantAppIdentityProviderError', locale: 'en' })}?${new URLSearchParams({ error: code })}`;
      await page.goto(address);
      await expect(page.getByTestId(ids.page)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the screen is shown in a class: its frame carries the class, and its sentence is that class's.
     *
     * @param errorClass - The class expected.
     */
    async expectShown(errorClass: IdentityProviderErrorClass): Promise<void> {
      const screen = page.getByTestId(ids.page);
      await expect(screen).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(screen).toHaveAttribute('data-error-class', errorClass);
      await expect(page.getByTestId(ids.message)).toHaveText(englishSentence(errorClass));
    },

    /**
     * Assert that the screen's address carries a code as its `error` parameter: the code the flow reported, which the screen itself never shows.
     *
     * @param code - The code expected.
     */
    async expectCode(code: string): Promise<void> {
      await expect.poll(() => new URL(page.url()).searchParams.get('error')).toBe(code);
    },

    /**
     * Assert whether Try again is offered: a link to the registration page with the provider's option named in its address, or no element at all.
     *
     * @param offered - Whether the provider's mode is listed.
     */
    async expectTryAgain(offered: boolean): Promise<void> {
      const tryAgain = page.getByTestId(ids.tryAgain);
      if (!offered) {
        await expect(tryAgain).toHaveCount(0);
        return;
      }
      await expect(tryAgain).toBeVisible();
      const href = await tryAgain.getAttribute('href');
      const target = new URL(href ?? '', page.url());
      expect(target.pathname).toBe(buildRoute({ route: 'ContestantAppRegister', locale: 'en' }));
      expect(target.searchParams.get('mode')).toBe('identity_provider');
    },

    /**
     * Assert that Return is a link to the login screen.
     */
    async expectReturn(): Promise<void> {
      const back = page.getByTestId(ids.return);
      await expect(back).toBeVisible();
      const href = await back.getAttribute('href');
      expect(new URL(href ?? '', page.url()).pathname).toBe(buildRoute({ route: 'ContestantAppLogin', locale: 'en' }));
    },

    /**
     * Assert that the screen offers no Try again, as where the provider's mode is no longer listed, and that Return is a link to the login screen.
     */
    async expectReturnWithoutTryAgain(): Promise<void> {
      await this.expectTryAgain(false);
      await this.expectReturn();
    },

    /**
     * Assert that support is offered inside the support sentence: its one link has the link words of the catalogue file and leads to the support section of the Help page, and the screen holds no Contact support button.
     */
    async expectSupportInSentence(): Promise<void> {
      const sentence = page.getByTestId(ids.support);
      await expect(sentence).toBeVisible();
      const link = sentence.getByRole('link');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveText(englishCatalogue('contestantApp.common').contactSupportLink as string);
      const target = new URL((await link.getAttribute('href')) ?? '', page.url());
      expect(target.pathname).toBe(buildRoute({ route: 'ContestantAppHelp', locale: 'en' }));
      expect(target.hash).toBe(SUPPORT_SECTION);
      await expect(page.getByTestId(testIds.contestant.common.contactSupport)).toHaveCount(0);
    },

    /**
     * Assert that support is offered by the Contact support button of the screen, with no icon, and that the screen holds no support sentence.
     */
    async expectSupportButtonWithoutIcon(): Promise<void> {
      const button = page.getByTestId(ids.page).getByTestId(testIds.contestant.common.contactSupport);
      await expect(button).toBeVisible();
      await expect.poll(() => button.evaluate((element) => element.querySelectorAll('svg').length)).toBe(0);
      await expect(page.getByTestId(ids.support)).toHaveCount(0);
    }
  };
}

export type ContestantIdentityProviderErrorPageFixture = ReturnType<typeof createContestantIdentityProviderErrorPage>;
