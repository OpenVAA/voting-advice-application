// RCA — Phase 79 Plan 01 instrumented clone. Reverted at Plan 01 close.
//
// This is a clone of `tests/tests/specs/candidate/candidate-profile.spec.ts`
// `should register the fresh candidate via email link` (lines 87-147) with an
// inline captureState helper that records cookies/localStorage/URL/DOM at five
// named checkpoints in the post-set-password → /login → /candidate transition.
//
// The spec lives OUTSIDE `tests/tests/specs/` so Playwright auto-discovery
// (testDir: ./tests/specs/candidate per playwright.config.ts:110) does NOT
// pick it up. It is invoked via direct path only:
//
//   yarn test:e2e .planning/phases/79-.../post-fix/rca-traces/registration-rca.spec.ts \
//     --project=candidate-app-mutation --workers=1 --reporter=line
//
// Captured artifacts are written next to this file (state-*.json) for analysis
// in Plan 01 Task 3 (RCA-FINDINGS.md). Cookie/localStorage values are LATER
// redacted in Task 2 step 3 (sed s/"value":"sb-..."/"value":"<REDACTED-...>"/).

import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect, test } from '@playwright/test';
import { buildRoute } from '../../../../../tests/tests/utils/buildRoute';
import { E2E_ADDENDUM_CANDIDATES } from '../../../../../tests/tests/utils/e2eFixtureRefs';
import {
  countEmailsForRecipient,
  extractLinkFromHtml,
  getLatestEmailHtml,
  toCallbackUrl
} from '../../../../../tests/tests/utils/emailHelper';
import { SupabaseAdminClient } from '../../../../../tests/tests/utils/supabaseAdminClient';
import { testIds } from '../../../../../tests/tests/utils/testIds';
import type { Page } from '@playwright/test';

// Resolve the rca-traces directory relative to this spec file so per-checkpoint
// state-*.json artifacts land next to it regardless of Playwright's CWD.
const __filename = fileURLToPath(import.meta.url);
const RCA_TRACES_DIR = path.dirname(__filename);

// Each invocation appends to RUN_TAG; agent passes RCA_RUN=1|2|3 between runs so
// the 3 runs do not overwrite each other.
const RUN_TAG = process.env.RCA_RUN ?? 'unset';

// Run all tests in this file without pre-existing authentication (mirrors
// candidate-profile.spec.ts:30).
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Module-level helper: log in if the page redirected to login after registration.
 * Verbatim clone of candidate-profile.spec.ts:48-63.
 */
async function loginIfRedirectedToLoginPage(page: Page, email: string, password: string): Promise<void> {
  await page.waitForURL((url) => url.pathname.includes('/login') || url.pathname.includes('/candidate'), {
    timeout: 15000
  });
  if (page.url().includes('login')) {
    const emailInput = page.getByTestId(testIds.candidate.login.email);
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill(email);
    await page.getByTestId(testIds.candidate.login.password).fill(password);
    await page.getByTestId(testIds.candidate.login.submit).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  }
}

/**
 * captureState — per-checkpoint state snapshot helper.
 *
 * Writes `state-<checkpoint>-run-${RUN_TAG}.json` next to this spec file with:
 *  - ts (Date.now())
 *  - url (page.url())
 *  - cookies (page.context().cookies()) — raw; redacted by sed in Task 2 step 3
 *  - localStorage (page.evaluate(() => ({ ...window.localStorage })))
 *  - sessionStorage (page.evaluate(() => ({ ...window.sessionStorage })))
 *  - hydrationMarker — value of window.__phase79RcaHydrated if present (H2 signal)
 *  - bodyHtml (page.locator('body').innerHTML()) — truncated to 50KB
 */
async function captureState(page: Page, checkpoint: string): Promise<void> {
  mkdirSync(RCA_TRACES_DIR, { recursive: true });
  const ts = Date.now();
  const url = page.url();
  let cookies: unknown = [];
  let localStorageSnapshot: unknown = {};
  let sessionStorageSnapshot: unknown = {};
  let hydrationMarker: unknown = null;
  let bodyHtml = '';
  try {
    cookies = await page.context().cookies();
  } catch (e) {
    cookies = { error: String(e) };
  }
  try {
    localStorageSnapshot = await page.evaluate(() => {
      const out: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k !== null) out[k] = window.localStorage.getItem(k) ?? '';
      }
      return out;
    });
  } catch (e) {
    localStorageSnapshot = { error: String(e) };
  }
  try {
    sessionStorageSnapshot = await page.evaluate(() => {
      const out: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k !== null) out[k] = window.sessionStorage.getItem(k) ?? '';
      }
      return out;
    });
  } catch (e) {
    sessionStorageSnapshot = { error: String(e) };
  }
  try {
    hydrationMarker = await page.evaluate(() => (window as unknown as { __phase79RcaHydrated?: unknown }).__phase79RcaHydrated ?? null);
  } catch (e) {
    hydrationMarker = { error: String(e) };
  }
  try {
    const raw = await page.locator('body').innerHTML();
    bodyHtml = raw.length > 50_000 ? raw.slice(0, 50_000) + '\n<!-- TRUNCATED 50KB -->' : raw;
  } catch (e) {
    bodyHtml = `ERROR: ${String(e)}`;
  }
  const payload = {
    runTag: RUN_TAG,
    checkpoint,
    ts,
    url,
    cookies,
    localStorage: localStorageSnapshot,
    sessionStorage: sessionStorageSnapshot,
    hydrationMarker,
    bodyHtml
  };
  const filename = `state-${checkpoint}-run-${RUN_TAG}.json`;
  writeFileSync(path.join(RCA_TRACES_DIR, filename), JSON.stringify(payload, null, 2), 'utf8');
  // Echo to console (captured by --reporter=line stdout) so the console-run-N.log
  // file records the per-checkpoint state inline.
  // eslint-disable-next-line no-console
  console.log(`[RCA-CHECKPOINT] ${checkpoint} run=${RUN_TAG} url=${url} hydration=${JSON.stringify(hydrationMarker)}`);
}

test.describe('candidate profile RCA (Phase 79 Plan 01)', { tag: ['@candidate', '@rca'] }, () => {
  test.describe.configure({ mode: 'serial' });

  const client = new SupabaseAdminClient();
  const candidateEmail = E2E_ADDENDUM_CANDIDATES[1].email!;
  const candidateExternalId = E2E_ADDENDUM_CANDIDATES[1].external_id;
  const candidatePassword = 'ProfileTestPass1!';

  test('RCA — should register the fresh candidate via email link', async ({ page }) => {
    test.setTimeout(120000);
    const emailsBefore = await countEmailsForRecipient(candidateEmail);

    await client.sendEmail({
      candidateExternalId,
      email: candidateEmail,
      subject: 'Registration',
      content: 'Click here to register: {LINK}'
    });

    await expect
      .poll(async () => await getLatestEmailHtml(candidateEmail, emailsBefore), {
        message: 'Waiting for registration email',
        timeout: 15000,
        intervals: [1000, 2000, 3000]
      })
      .toBeTruthy();

    const emailHtml = await getLatestEmailHtml(candidateEmail, emailsBefore);
    const rawLink = extractLinkFromHtml(emailHtml!);
    expect(rawLink).toBeTruthy();
    await page.goto(toCallbackUrl(rawLink!));

    // CHECKPOINT 1: immediately after navigating to the auth callback URL.
    // H1 signal: are session cookies set yet? H2 signal: is the hydration marker present?
    await captureState(page, 'after-callback-goto');

    const passwordWrapper = page.getByTestId(testIds.candidate.register.password);
    const confirmWrapper = page.getByTestId(testIds.candidate.register.confirmPassword);
    const submitButton = page.getByTestId(testIds.candidate.register.passwordSubmit);

    await passwordWrapper.getByTestId(testIds.candidate.login.password).fill(candidatePassword);
    await confirmWrapper.getByTestId(testIds.candidate.login.password).fill(candidatePassword);
    await submitButton.click();

    // CHECKPOINT 2: immediately after the password-submit click. The browser is
    // mid-redirect (either to /candidate via session-persistence path OR to /login
    // via clean-auth path). H1 signal: cookies + localStorage state at this exact
    // moment.
    await captureState(page, 'after-set-password-submit');

    // Defensive admin setPassword (matches candidate-profile.spec.ts:129).
    await client.setPassword(candidateEmail, candidatePassword);

    // Race-tolerant URL settle.
    await page.waitForURL((url) => url.pathname.includes('/login') || url.pathname.includes('/candidate'), {
      timeout: 15000
    });
    // CHECKPOINT 3: URL has settled at /login OR /candidate. H1 verdict point —
    // which one did we land on?
    await captureState(page, 'after-redirect-settled');

    // Manual login if /login. H1: does this branch run? If yes, H1 is in play.
    const landedOnLogin = page.url().includes('/login');
    if (landedOnLogin) {
      const emailInput = page.getByTestId(testIds.candidate.login.email);
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      await emailInput.fill(candidateEmail);
      await page.getByTestId(testIds.candidate.login.password).fill(candidatePassword);
      await page.getByTestId(testIds.candidate.login.submit).click();
      // CHECKPOINT 4 (conditional): immediately after the manual-login submit click.
      await captureState(page, 'after-login-form-submit');
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    } else {
      // Still emit a checkpoint-4 file so the H1 disproven case (no manual login
      // needed) is empirically recorded for Plan 02.
      await captureState(page, 'after-login-form-submit');
    }

    // CHECKPOINT 5: manual login settled (or never ran). H2 signal: is the ToU
    // checkbox in the DOM yet? Is window.__phase79RcaHydrated populated?
    await captureState(page, 'after-login-settled');

    // Step 7: Accept Terms of Use (shown on first login after registration).
    // H2 verdict point — does the checkbox surface within the 10s budget?
    const touCheckbox = page.getByTestId(testIds.candidate.terms.checkbox);
    await expect(touCheckbox).toBeVisible({ timeout: 10000 });
    await touCheckbox.check();
    const continueButton = page.getByRole('button', { name: /continue/i });
    await expect(continueButton).toBeEnabled({ timeout: 10000 });
    await continueButton.click();

    // Step 8: Verify we reach the candidate home (save may take a moment)
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible({ timeout: 15000 });
  });
});
