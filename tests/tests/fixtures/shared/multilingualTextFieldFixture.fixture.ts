/**
 * @file multilingualTextFieldFixture.
 *
 * Function-fixture for the multilingual surface of `Input.svelte`.
 *
 * Source surface:
 *  - `Input.svelte:392-450` — per-locale field rendering (one input/textarea per non-default locale when `isTranslationsVisible` is true).
 *  - `Input.svelte:646-660` — translation-options toggle Button (gated on `multilingual && locales.length > 1`).
 *
 * The toggle Button carries `data-testid="multilingual-toggle"`. The fixture scopes every assertion under a caller-supplied parent Locator (e.g., the `candidate-profile-info-item` wrapper from candidateProfilePage, or the `candidate-questions-comment` wrapper from candidateQuestionPage's open-answer block).
 *
 * Surface:
 *  - expectTranslationOptions(scope, visible)  — toggle Button visible OR absent inside the scope.
 *  - openTranslations(scope)                    — click toggle to expand; assert per-locale field appears.
 *  - setLocaleValue(scope, locale, value)       — fill per-locale field by accessible name (locale's native display name) + blur.
 *  - closeTranslations(scope)                   — click toggle to collapse.
 *  - expectLocaleHidden(scope, locale)          — assert per-locale field is not in the DOM.
 *
 * **Rigidity contract**:
 *  - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

/**
 * Locale display-name registry. Per Input.svelte:401-403 + 426-429 each per-locale field carries `id="{id}-{locale}"` with `aria-labelledby="{id}-label {id}-label-{locale}"`. The per-locale label text is `t('lang.<locale>')` which resolves to the native display name.
 * Looking up by accessible name with the display-name regex is the most robust selector (deterministic across UI-locale switches).
 */
const LOCALE_DISPLAY_NAMES: Readonly<Record<string, RegExp>> = Object.freeze({
  en: /English/i,
  fi: /Suomi/i,
  sv: /Svenska/i,
  et: /Eesti/i
});

function localeLabelRegex(locale: string): RegExp {
  const re = LOCALE_DISPLAY_NAMES[locale];
  if (re === undefined) {
    throw new Error(
      `multilingualTextFieldFixture: no display-name regex for locale '${locale}' — extend LOCALE_DISPLAY_NAMES`
    );
  }
  return re;
}

// page parameter retained for symmetry with other function-fixtures + future fixture extensions; current method bodies only need `scope`.
export function createMultilingualTextField(_page: Page) {
  return {
    /**
     * Assert the translation-options toggle Button is visible (true) or fully absent (false) inside `scope`.
     *
     * `visible=false` is the negative-perm assertion target: when `customData.disableMultilingual=true` OR `locales.length === 1`, the Button at Input.svelte:653-658 does not render at all.
     */
    async expectTranslationOptions(scope: Locator, visible: boolean): Promise<void> {
      const toggle = scope.getByTestId(testIds.shared.multilingualToggle);
      if (visible) {
        await expect(toggle).toBeVisible();
      } else {
        await expect(toggle).toHaveCount(0);
      }
    },

    /**
     * Click the toggle to expand per-locale fields. Asserts at least one additional textbox renders inside `scope` (the per-locale field(s)).
     */
    async openTranslations(scope: Locator): Promise<void> {
      await scope.getByTestId(testIds.shared.multilingualToggle).click();
      // After expansion the scope contains the original default-locale field plus N additional per-locale fields (one per non-default locale).
      // Assert at least one extra textbox is visible (`>= 2` total).
      const textboxes = scope.getByRole('textbox');
      await expect(textboxes.nth(1)).toBeVisible();
    },

    /**
     * Fill the per-locale field for `locale` with `value` and blur it to commit the onchange handler at Input.svelte:419/441.
     *
     * Lookup is by accessible name (the per-locale `t('lang.<locale>')` label) — robust against DOM rearrangement.
     */
    async setLocaleValue(scope: Locator, locale: string, value: string): Promise<void> {
      const field = scope.getByRole('textbox', { name: localeLabelRegex(locale) });
      await field.fill(value);
      await field.blur();
    },

    /**
     * Click the toggle to collapse the per-locale fields.
     */
    async closeTranslations(scope: Locator): Promise<void> {
      await scope.getByTestId(testIds.shared.multilingualToggle).click();
    },

    /**
     * Assert the per-locale field for `locale` is not in the DOM (post closeTranslations or when single-locale mode hides the surface).
     */
    async expectLocaleHidden(scope: Locator, locale: string): Promise<void> {
      await expect(scope.getByRole('textbox', { name: localeLabelRegex(locale) })).toHaveCount(0);
    }
  };
}

export type MultilingualTextFieldFixture = ReturnType<typeof createMultilingualTextField>;
