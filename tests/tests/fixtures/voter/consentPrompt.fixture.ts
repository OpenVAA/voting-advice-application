/**
 * @file consentPrompt fixture (voter).
 *
 * The voter app's usage-data consent prompt, `DataConsentPopup.svelte`: a modal dialog the voter layout opens while the deployment tracks events and no consent choice is stored. It holds the prompt's accessible names and the reads a spec needs to tell whether the prompt is modal, what it covers and which open dialog is in front.
 *
 * Dependency-free: it imports only `@playwright/test`, so the deployed smoke can build its prompt handler from it without pulling anything else into its import closure. Timeouts and the drawer's test id are therefore passed in through `createConsentPrompt`'s options.
 *
 * Surface:
 *  - `prompt`               — the prompt's dialog, by its role and accessible name.
 *  - `expectOpen()`         — the prompt is visible.
 *  - `expectClosed()`       — the prompt is hidden.
 *  - `expectModalCount(n)`  — exactly `n` dialogs are open as modal dialogs (`dialog:modal`).
 *  - `declineWithEscape()`  — press Escape, which declines, and wait for the prompt to close.
 *  - `openInformation()`    — open the information dialog inside the prompt.
 *  - `expectCovers(choice)` — the prompt covers `choice`: it takes no focus, a pointer at its label lands in the prompt, and a click cannot reach it.
 *  - `openKinds()`          — the sorted kinds of the open modal dialogs: `prompt`, `drawer`, or `other:` and the dialog's label.
 *  - `topmostKind()`        — the kind of the modal dialog under the viewport's centre, which is the prompt or the drawer.
 *
 * **Rigidity contract**: every assertion is hard — no soft assertion, no `try/catch` around `expect(...)`, no `.catch` fallback.
 */

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/** The accessible name of the voter app's consent prompt (`common.privacy.dataCollection.title`, the title of DataConsentPopup's modal dialog), which is also the heading of the privacy page's consent control. */
export const CONSENT_PROMPT = /collecting usage data/i;

/** The accessible name of the consent control's button that grants consent (DataConsent.svelte). */
export const GRANTED_BUTTON = /agree to share my data/i;

/** The accessible name of the consent control's button that declines consent (DataConsent.svelte). */
export const DECLINED_BUTTON = /don.t want to share my data/i;

/** The accessible name of the consent prompt's information button (DataConsentInfoButton.svelte). */
export const CONSENT_INFO_BUTTON = /further information collecting usage data/i;

/** The kind of an open modal dialog, as `openKinds` and `topmostKind` name it. */
export type ModalKind = 'prompt' | 'drawer' | `other:${string}`;

export interface ConsentPromptOptions {
  /** The budget of the waits for the prompt to open or close; Playwright's expect timeout when omitted. */
  timeout?: number;
  /** The test id inside the drawer's dialog that names it as the drawer, for `openKinds` and `topmostKind`. */
  drawerTestId?: string;
}

export interface ConsentPromptFixture {
  /** The prompt's dialog. */
  readonly prompt: Locator;
  /** Assert the prompt is visible. */
  expectOpen(message?: string): Promise<void>;
  /** Assert the prompt is hidden. */
  expectClosed(): Promise<void>;
  /** Assert that exactly `count` dialogs are open as modal dialogs. */
  expectModalCount(count: number, message?: string): Promise<void>;
  /** Press Escape, which declines, and wait for the prompt to close. */
  declineWithEscape(): Promise<void>;
  /** Open the information dialog inside the prompt. */
  openInformation(): Promise<void>;
  /** Assert that the prompt covers `choice`: it cannot take focus, a pointer at its label lands in the prompt, and a click cannot reach it. */
  expectCovers(choice: Locator): Promise<void>;
  /** The sorted kinds of the open modal dialogs. */
  openKinds(): Promise<Array<ModalKind>>;
  /** The kind of the modal dialog under the viewport's centre. Throws when it is neither the prompt nor the drawer. */
  topmostKind(): Promise<'prompt' | 'drawer'>;
}

/**
 * The consent prompt of the voter app on `page`.
 * @param page - The voter page.
 * @param options - The wait budget and the drawer's test id.
 */
export function createConsentPrompt(
  page: Page,
  { timeout, drawerTestId }: ConsentPromptOptions = {}
): ConsentPromptFixture {
  const prompt = page.getByRole('dialog', { name: CONSENT_PROMPT });
  // reason: `:modal` is the one selector that tells a dialog opened with showModal(), whose page is inert, from any other dialog; no role or test id carries that, and it reads no translated string.
  // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
  const modalDialogs = page.locator('dialog:modal');

  /** The kinds of the open modal dialogs, sorted, and the kind of the one under the viewport's centre (`none` when no dialog is there). */
  async function readModalDialogs(): Promise<{ open: Array<ModalKind>; topmost: ModalKind | 'none' }> {
    return page.evaluate(
      ({ promptSource, promptFlags, drawerTestId }) => {
        const promptLabel = new RegExp(promptSource, promptFlags);
        const kindOf = (dialog: HTMLDialogElement | null | undefined): string => {
          if (!dialog) return 'none';
          const label = dialog.getAttribute('aria-label') ?? '';
          if (promptLabel.test(label)) return 'prompt';
          if (drawerTestId && dialog.querySelector(`[data-testid="${drawerTestId}"]`)) return 'drawer';
          return `other:${label}`;
        };
        const open = [...document.querySelectorAll('dialog')].filter((dialog) => dialog.matches(':modal'));
        const centre = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)?.closest('dialog');
        return { open: open.map(kindOf).sort(), topmost: kindOf(centre) };
      },
      { promptSource: CONSENT_PROMPT.source, promptFlags: CONSENT_PROMPT.flags, drawerTestId }
    ) as Promise<{ open: Array<ModalKind>; topmost: ModalKind | 'none' }>;
  }

  return {
    prompt,

    async expectOpen(message?: string): Promise<void> {
      await expect(prompt, message).toBeVisible({ timeout });
    },

    async expectClosed(): Promise<void> {
      await expect(prompt).toBeHidden({ timeout });
    },

    async expectModalCount(count: number, message?: string): Promise<void> {
      await expect(modalDialogs, message).toHaveCount(count, { timeout });
    },

    async declineWithEscape(): Promise<void> {
      await page.keyboard.press('Escape');
      await expect(prompt).toBeHidden({ timeout });
    },

    async openInformation(): Promise<void> {
      await prompt.getByRole('button', { name: CONSENT_INFO_BUTTON }).click();
    },

    async expectCovers(choice: Locator): Promise<void> {
      await choice.focus();
      await expect(choice, 'the answer choice under the prompt took focus').not.toBeFocused();
      // reason: the choice's label has no role and no test id of its own; it is the parent of the choice's input, reached by the parent axis, which reads no translated string.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const label = choice.locator('xpath=..');
      const box = await label.boundingBox();
      expect(box, "the answer choice's label has no box").not.toBeNull();
      const hitDialog = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.closest('dialog')?.getAttribute('aria-label') ?? null,
        { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
      );
      expect(hitDialog, "a pointer at the answer choice's label does not land in the prompt").toMatch(CONSENT_PROMPT);
      await expect(
        choice.click({ trial: true, timeout: 2000 }),
        'the answer choice under the prompt took a click'
      ).rejects.toThrow();
    },

    async openKinds(): Promise<Array<ModalKind>> {
      return (await readModalDialogs()).open;
    },

    async topmostKind(): Promise<'prompt' | 'drawer'> {
      const { topmost } = await readModalDialogs();
      if (topmost !== 'prompt' && topmost !== 'drawer')
        throw new Error(
          `the dialog under the viewport's centre is neither the consent prompt nor the drawer: ${topmost}`
        );
      return topmost;
    }
  };
}
