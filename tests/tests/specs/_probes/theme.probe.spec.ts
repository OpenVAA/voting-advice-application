/**
 * @file theme.probe.spec.ts — smoke/probe for the `theme` reader fixture
 * (EFLOW-07, CORRECTED mechanism).
 *
 * SC2 (A8 fixtures-first): exercises the `createThemeReader` fixture
 * (`tests/tests/fixtures/shared/theme.fixture.ts`) — driving the theme via
 * `page.emulateMedia({ colorScheme })` (NOT a toggle; there is NO toggle in the
 * app) and asserting the rendered `prefers-color-scheme` signal, including
 * automatic persistence across reload.
 *
 * ## Mechanism note (RESEARCH Pitfall 1 — VERIFIED)
 *
 * Dark mode derives SOLELY from `window.matchMedia('(prefers-color-scheme:
 * dark)')` (`darkMode.svelte.ts`). There is NO toggle and NO localStorage write.
 * The emulated media preference persists across reload automatically, so the
 * probe asserts the dark signal still holds after `page.reload()` WITHOUT any
 * toggle/localStorage step.
 *
 * ## SEED (out-of-band pre-step)
 *
 *   yarn db:seed --template e2e/base
 *
 * ## RUN (single-file, isolated)
 *
 *   npx playwright test tests/tests/specs/_probes/theme.probe.spec.ts \
 *     -c tests/playwright.config.ts
 */

import { createThemeReader } from '../../fixtures/shared/theme.fixture';
import { test } from '../../fixtures/voter/views';

test.describe('@probe theme reader (EFLOW-07)', () => {
  test('emulateMedia dark/light + automatic persistence across reload', async ({ page, voterHomePage }) => {
    const theme = createThemeReader(page);

    // Dark: emulate prefers-color-scheme:dark, load, assert the dark signal.
    await theme.setColorScheme('dark');
    await voterHomePage.goToPage('en');
    await theme.expectTheme('dark');

    // Persistence: the emulated media preference survives reload automatically
    // (no toggle, no client storage). Assert it still reads dark.
    await page.reload();
    await theme.expectTheme('dark');

    // Light: flip the emulation and assert the light signal.
    await theme.setColorScheme('light');
    await theme.expectTheme('light');
  });
});
