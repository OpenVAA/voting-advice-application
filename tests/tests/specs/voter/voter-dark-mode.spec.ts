/**
 * Dark-mode applied + persists across reload.
 *
 * Read-only LEAF spec on `data-setup-base` (`e2e/base`). Voter routes are public
 * (no auth, no own setup/teardown). Mirrors the leaf shape of
 * `cold-entry-dataroot.spec.ts`: imports `{ expect, test }` directly from
 * `@playwright/test` and asserts with HARD assertions only.
 *
 * ## Mechanism (RESEARCH Pitfall 1 — VERIFIED, binding correction)
 *
 * Dark mode derives SOLELY from `window.matchMedia('(prefers-color-scheme:
 * dark)')` (`darkMode.svelte.ts`). There is NO dark-mode TOGGLE button and NO
 * localStorage/web-storage write. Therefore the theme is driven via
 * `page.emulateMedia({ colorScheme })` (the `theme` fixture's `setColorScheme`),
 * NOT a toggle click, and the rendered theme signal is the
 * `prefers-color-scheme` media match itself (the same query the app reads). The
 * emulated media preference survives `page.reload()` automatically, so
 * "persists across reload" is asserted by re-reading the dark signal after a
 * reload — there is NO storage assertion (and none is possible).
 *
 * ## Rigidity contract (project E2E Hard Rule)
 *
 * Every assertion is HARD — no `expect.soft`, no try/catch around `expect()`,
 * no `.catch` fallback, no `dark`-root-class assertion, no localStorage
 * assertion, no toggle-click. The assertions live inside the `theme` fixture's
 * `expectTheme` (a web-first `expect.poll`), so `expect` is not imported here.
 */

import { test } from '@playwright/test';
import { createThemeReader } from '../../fixtures/shared/theme.fixture';

test.describe('voter-dark-mode', () => {
  test('dark theme is applied and persists across reload; light is restored', async ({ page }) => {
    const theme = createThemeReader(page);

    // Dark: emulate prefers-color-scheme:dark, load the voter landing, assert
    // the rendered dark signal (the matchMedia match darkMode.svelte.ts reads).
    await theme.setColorScheme('dark');
    await page.goto('/en');
    await theme.expectTheme('dark');

    // Persistence: the emulated media preference survives reload automatically
    // (no toggle, no client storage). Assert the dark signal STILL holds — this
    // is the "persists across reload" property this spec is named for.
    await page.reload();
    await theme.expectTheme('dark');

    // Light: flip the emulation and assert the light signal (also across reload).
    await theme.setColorScheme('light');
    await page.reload();
    await theme.expectTheme('light');
  });
});
