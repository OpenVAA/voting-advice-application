/**
 * @file langSelectorFixture — Phase 90 Plan 03 (TIR5:28-50 + D-90-04).
 *
 * Function-fixture for the LanguageSelection NavGroup at
 * `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte`.
 *
 * The NavGroup is gated on `locales.length > 1` (line 32). When the runtime
 * `supportedLocales` override (Plan 90-01) collapses the user-facing locale
 * list to a single entry, the NavGroup does NOT render and the
 * `lang-selector` testid is absent from the DOM. When the override list
 * contains ≥2 entries, the NavGroup renders with one `NavItem` per locale.
 *
 * Surface (D-90-04):
 *  - expectVisible(locales)  — assert selector visible AND every locale name
 *                              appears as a `nav-menu-item` inside the
 *                              selector scope.
 *  - expectHidden()          — assert selector NOT rendered (the
 *                              `lang-selector` testid has count 0).
 *  - switchTo(locale)        — click the locale's NavItem AND wait for the
 *                              full-reload navigation triggered by Paraglide's
 *                              `data-sveltekit-reload` attribute (Pitfall 6).
 *
 * **Rigidity contract** (TIR5:5-13 + Phase 88 lineage):
 *  - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *    `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/**
 * Locale-code → display-name map. The LanguageSelection NavGroup renders
 * each NavItem with text `t('lang.<locale>')` — which resolves to the
 * native-language name. Fixture uses this map to match NavItems robustly
 * across UI locale switches (the language NAMES are constant — each
 * language always self-identifies in its own tongue).
 */
const LOCALE_DISPLAY_NAMES: Readonly<Record<string, string>> = Object.freeze({
  en: 'English',
  fi: 'Suomi',
  sv: 'Svenska',
  et: 'Eesti'
});

function displayNameFor(locale: string): string {
  const name = LOCALE_DISPLAY_NAMES[locale];
  if (name === undefined) {
    throw new Error(
      `langSelectorFixture: no display-name mapping for locale '${locale}' — extend LOCALE_DISPLAY_NAMES`
    );
  }
  return name;
}

export function createLangSelector(page: Page) {
  return {
    /**
     * Assert the language selector NavGroup is visible AND every locale in
     * `locales` has a NavItem inside it with the locale's native display
     * name.
     */
    async expectVisible(locales: Array<string>): Promise<void> {
      const selector = page.getByTestId(testIds.shared.langSelector);
      await expect(selector).toBeVisible();
      for (const loc of locales) {
        const name = displayNameFor(loc);
        const item = selector
          .getByTestId(testIds.shared.navigation.menuItem)
          .filter({ hasText: new RegExp(`^${name}$`, 'i') });
        await expect(item).toBeVisible();
      }
    },

    /**
     * Assert the language selector NavGroup is NOT rendered. The NavGroup
     * carries `data-testid="lang-selector"` (Plan 90-03 Task 1) — when
     * `locales.length === 1` the `{#if locales.length > 1}` branch at
     * LanguageSelection.svelte:32 evaluates false and the NavGroup
     * does not render.
     */
    async expectHidden(): Promise<void> {
      await expect(page.getByTestId(testIds.shared.langSelector)).toHaveCount(0);
    },

    /**
     * Click the NavItem for `locale` and wait for the full-reload navigation
     * triggered by Paraglide's `data-sveltekit-reload` attribute on the
     * NavItem anchor (LanguageSelection.svelte:36). The post-reload URL is
     * `localizeHref(currentPath, { locale })` which prepends the new locale
     * code as the first path segment.
     *
     * Pitfall 6: the locale switch is a full page reload, NOT a SPA
     * navigation. Use `Promise.all([waitForURL, click])` to race the click
     * against the navigation event.
     */
    async switchTo(locale: string): Promise<void> {
      displayNameFor(locale); // validate
      const name = displayNameFor(locale);
      const selector = page.getByTestId(testIds.shared.langSelector);
      const item = selector
        .getByTestId(testIds.shared.navigation.menuItem)
        .filter({ hasText: new RegExp(`^${name}$`, 'i') });
      await Promise.all([
        page.waitForURL(new RegExp(`^https?://[^/]+/${locale}/`)),
        item.click()
      ]);
    }
  };
}

export type LangSelectorFixture = ReturnType<typeof createLangSelector>;
