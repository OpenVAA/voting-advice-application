import { expect, test } from '@playwright/test';
import { buildRoute } from './utils/buildRoute';
import { TRANSLATIONS as T } from './utils/translations';

/**
 * RTL / bidi QA gate.
 *
 * Asserts that the document direction is driven by the active locale: it is set RTL for the Arabic locale server-side (so there is no LTR→RTL flash) and flips back to LTR reactively when the locale changes in-app. Without this gate, logical-CSS drift can silently reintroduce physical directionality.
 *
 * Do-not-mirror exemption set (must stay LTR-oriented even under RTL): logos (`OpenVAALogo`), user photos / portraits (`Avatar`), the video / media-player chrome (`Video`), data charts (results statistics), and the political compass / map. These are deliberately excluded from the logical-CSS migration and keep physical directionality.
 */

const LOCALE_EN = 'en';
const LOCALE_AR = 'ar';
/** The Arabic locale's name as declared in `staticSettings.supportedLocales` (used for the nav link). */
const AR_NAME = 'العربية';

test.describe('RTL direction', () => {
  test('serves dir="rtl" lang="ar" for the Arabic locale (SSR, no flash)', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: LOCALE_AR })}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('serves dir="ltr" lang="en" for an LTR locale (SSR)', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: LOCALE_EN })}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('flips dir reactively when switching to Arabic in-app', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: LOCALE_EN })}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    await page.getByLabel(T.en['common.openMenu'], { exact: true }).click();
    await page.getByRole('link', { name: AR_NAME, exact: true }).click();

    await expect(page).toHaveURL(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: LOCALE_AR })}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});
