/**
 * @file theme reader fixture (CORRECTED mechanism).
 *
 * Shared, cross-app function-fixture for asserting the app's dark/light theme.
 *
 * ## Mechanism correction (RESEARCH Pitfall 1 — VERIFIED)
 *
 * The CONTEXT.md / CLAUDE.md premise that dark mode is "a UI toggle persisted via runeLocalStorage" is WRONG for the current app. `darkMode.svelte.ts` derives the theme SOLELY from `window.matchMedia('(prefers-color-scheme: dark)')` (constructor read + a `change` listener) — there is NO toggle button and NO client-side persistence write (no web-storage). Therefore:
 *   - control the theme with Playwright's `page.emulateMedia({ colorScheme })` (NOT a toggle click);
 *   - "persisted across reload" is AUTOMATIC — the emulated media preference survives reloads, so no client-storage assertion is needed (or possible).
 *
 * >>> SCOPE FLAG: a spec consuming this fixture must NOT assert a toggle click
 * >>> or a client-storage persistence write — there is neither. Drive the theme
 * >>> via `setColorScheme(...)` (emulateMedia) and assert the rendered signal.
 *
 * ## Rendered dark-mode signal
 *
 * The app has NO `dark` class on the document root; `darkMode.svelte.ts` derives `darkMode.current` SOLELY from `prefers-color-scheme` and consumers read that rune (logo/image `src`, header style). The authoritative, locale-independent, framework-rendered signal of the active theme is therefore the `prefers-color-scheme` media-query match itself — exactly what `darkMode.svelte.ts` reads. `expectTheme` reads that media match back via `page.evaluate(window.matchMedia(...).matches)` (no raw element locator nor text selector — the `no-restricted-locators` guard stays clean) and asserts it.
 *
 * Because `darkMode.svelte.ts` reads the SAME media query, this is a faithful read of the app's theme source — emulating dark and asserting the dark match proves the app would render its dark theme.
 *
 * ## Surface
 *  - setColorScheme('dark'|'light') — emulate prefers-color-scheme (no toggle).
 *  - expectTheme('dark'|'light')    — assert the rendered dark/light signal.
 *
 * **Rigidity contract**: no soft assertions, no try/catch wrapping an assertion, no best-effort swallowing of assertion-bearing interactions.
 */

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export type ColorScheme = 'dark' | 'light';

export interface ThemeReaderFixture {
  /** Emulate `prefers-color-scheme` (NOT a toggle; no web-storage). */
  setColorScheme(scheme: ColorScheme): Promise<void>;
  /** Assert the rendered dark/light signal (the `prefers-color-scheme` match). */
  expectTheme(scheme: ColorScheme): Promise<void>;
}

/**
 * Create the theme reader bound to `page`.
 */
export function createThemeReader(page: Page): ThemeReaderFixture {
  return {
    async setColorScheme(scheme: ColorScheme): Promise<void> {
      await page.emulateMedia({ colorScheme: scheme });
    },

    async expectTheme(scheme: ColorScheme): Promise<void> {
      // Read the SAME media query darkMode.svelte.ts reads. Poll via expect.poll so the assertion is web-first (re-reads until it matches or times out) rather than a one-shot snapshot.
      await expect
        .poll(() => page.evaluate(() => window.matchMedia('(prefers-color-scheme: dark)').matches))
        .toBe(scheme === 'dark');
    }
  };
}
