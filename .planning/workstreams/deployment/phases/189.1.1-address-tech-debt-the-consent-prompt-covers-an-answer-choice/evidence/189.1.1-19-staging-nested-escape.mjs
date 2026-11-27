/**
 * The nested Escape on a served voter app: what one Escape pressed in the consent prompt's
 * information dialog closes, and what consent it stores.
 *
 * A fresh Chromium context (locale en-GB, no stored state) opens BASE_URL/en and waits for the
 * consent prompt, the one open dialog. It clicks the prompt's information button, waits for the
 * information dialog to open over the prompt, presses Escape once and reads the open dialogs and
 * the stored consent, then presses Escape a second time and reads both again. On a build where an
 * Escape closes only the topmost dialog it prints OPEN_WITH_INFO=2, OPEN_AFTER_ONE_ESCAPE=1 with
 * CONSENT_AFTER_ONE_ESCAPE=none, then OPEN_AFTER_TWO_ESCAPES=0 with CONSENT_AFTER_TWO_ESCAPES=denied.
 * On a build where one Escape leaks to the prompt it prints OPEN_AFTER_ONE_ESCAPE=0 with
 * CONSENT_AFTER_ONE_ESCAPE=denied.
 *
 * The script only declines, by Escape; it grants nothing. It prints the served build from
 * /api/health and counts, never a key, a cookie or an address.
 *
 * Run:  node 189.1.1-19-staging-nested-escape.mjs REPO_ROOT [BASE_URL]
 *       REPO_ROOT is a checkout whose tests/ workspace has @playwright/test and its Chromium
 *       installed; BASE_URL defaults to https://staging.openvaa.org.
 * Exit: 0 after printing every line; 1 with SCRIPT_ERROR= on any thrown error.
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';

const PREFERENCES_KEY = 'appContext-userPreferences';
const SETTLE_MS = 800;

let browser;
try {
  const repoRoot = process.argv[2];
  if (!repoRoot) throw new Error('usage: node 189.1.1-19-staging-nested-escape.mjs REPO_ROOT [BASE_URL]');
  const baseUrl = (process.argv[3] ?? 'https://staging.openvaa.org').replace(/\/+$/, '');
  const require = createRequire(join(repoRoot, 'tests/package.json'));
  const { chromium } = require('@playwright/test');

  const health = await fetch(`${baseUrl}/api/health`);
  const healthBody = await health.json();
  console.log(`SERVED_BUILD=${healthBody?.build ?? '(none)'}`);

  browser = await chromium.launch();
  const context = await browser.newContext({ locale: 'en-GB', storageState: undefined });
  const page = await context.newPage();

  const openDialogs = () => page.evaluate(() => document.querySelectorAll('dialog[open]').length);
  const waitForOpen = (count, timeout) =>
    page.waitForFunction((n) => document.querySelectorAll('dialog[open]').length === n, count, { timeout });
  const storedConsent = () =>
    page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      if (raw === null) return 'none';
      const consent = JSON.parse(raw)?.data?.dataCollection?.consent;
      return consent === undefined || consent === 'indetermined' ? 'none' : String(consent);
    }, PREFERENCES_KEY);

  await page.goto(`${baseUrl}/en`, { waitUntil: 'networkidle' });
  await waitForOpen(1, 30_000);
  await page.waitForTimeout(SETTLE_MS);
  console.log(`OPEN_BEFORE=${await openDialogs()}`);

  const prompt = page.getByRole('dialog', { name: /collecting usage data/i });
  await prompt.getByRole('button', { name: /further information/i }).click();
  await waitForOpen(2, 10_000);
  await page.waitForTimeout(SETTLE_MS);
  console.log(`OPEN_WITH_INFO=${await openDialogs()}`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(SETTLE_MS);
  console.log(`OPEN_AFTER_ONE_ESCAPE=${await openDialogs()}`);
  console.log(`CONSENT_AFTER_ONE_ESCAPE=${await storedConsent()}`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(SETTLE_MS);
  console.log(`OPEN_AFTER_TWO_ESCAPES=${await openDialogs()}`);
  console.log(`CONSENT_AFTER_TWO_ESCAPES=${await storedConsent()}`);

  await browser.close();
  process.exit(0);
} catch (error) {
  console.log(`SCRIPT_ERROR=${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
  if (browser) await browser.close().catch(() => undefined);
  process.exit(1);
}
