/**
 * Phase 84 RCA cold-start network instrumentation.
 *
 * Replicates the candidate-app-settings cold-start path (login → navigate
 * to candidate home → navigate to settings-relevant routes) with full
 * `page.on('request')` capture. Specifically targets the same code paths
 * exercised by:
 *   - re-auth.setup.ts (login → save storageState)
 *   - candidate-settings.spec.ts (4 representative tests after re-auth):
 *     - should show read-only warning when answers are locked
 *     - should show maintenance page when underMaintenance is true
 *     - should display notification popup when enabled
 *     - should render help page correctly
 *
 * Run via:
 *   yarn workspace @openvaa/e2e-tests playwright test \
 *     ../.planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/rca-capture/capture-cold-start.spec.ts \
 *     --workers=1 --reporter=list
 *
 * Captures land in rca-capture/captures/*.json — each test produces one
 * JSON file containing all observed network requests filtered to
 * /storage/v1/* + the request that hung (if any). The analysis is done by
 * the research agent post-capture.
 *
 * INSTRUMENTATION-ONLY: this file is NOT part of the suite, NOT part of
 * playwright.config.ts; it is invoked manually by the research agent.
 */
import { expect, test } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAPTURES_DIR = join(__dirname, 'captures');
mkdirSync(CAPTURES_DIR, { recursive: true });

type ReqEvent = {
  ts: number;
  url: string;
  method: string;
  resourceType: string;
  isNavigationRequest: boolean;
};
type ResEvent = {
  ts: number;
  url: string;
  status: number;
  fromServiceWorker: boolean;
  timing?: { responseEnd: number };
};
type FailEvent = {
  ts: number;
  url: string;
  failure: string | null;
};

const STORAGE_RE = /\/storage\/v1\//;
const SUPABASE_RE = /127\.0\.0\.1:54321/;

const TEST_CANDIDATE_EMAIL = 'mock.candidate.2@openvaa.org';
const TEST_CANDIDATE_PASSWORD = 'Password1!';
const FRONTEND = 'http://localhost:5173';

async function captureRoute(
  label: string,
  page: import('@playwright/test').Page,
  navigate: () => Promise<void>
): Promise<{
  storage: Array<ReqEvent>;
  storageResponses: Array<ResEvent>;
  storageFailures: Array<FailEvent>;
  allSupabase: Array<ReqEvent>;
}> {
  const storage: Array<ReqEvent> = [];
  const storageResponses: Array<ResEvent> = [];
  const storageFailures: Array<FailEvent> = [];
  const allSupabase: Array<ReqEvent> = [];

  const onReq = (req: import('@playwright/test').Request) => {
    const url = req.url();
    const ev: ReqEvent = {
      ts: Date.now(),
      url,
      method: req.method(),
      resourceType: req.resourceType(),
      isNavigationRequest: req.isNavigationRequest()
    };
    if (STORAGE_RE.test(url)) storage.push(ev);
    if (SUPABASE_RE.test(url)) allSupabase.push(ev);
  };
  const onRes = (res: import('@playwright/test').Response) => {
    const url = res.url();
    if (!STORAGE_RE.test(url)) return;
    storageResponses.push({
      ts: Date.now(),
      url,
      status: res.status(),
      fromServiceWorker: res.fromServiceWorker()
    });
  };
  const onFail = (req: import('@playwright/test').Request) => {
    const url = req.url();
    if (!STORAGE_RE.test(url)) return;
    storageFailures.push({ ts: Date.now(), url, failure: req.failure()?.errorText ?? null });
  };

  page.on('request', onReq);
  page.on('response', onRes);
  page.on('requestfailed', onFail);

  try {
    await navigate();
  } finally {
    page.off('request', onReq);
    page.off('response', onRes);
    page.off('requestfailed', onFail);
  }

  const out = { storage, storageResponses, storageFailures, allSupabase };
  writeFileSync(join(CAPTURES_DIR, `${label}.json`), JSON.stringify(out, null, 2), 'utf8');
  return out;
}

test.describe('Phase 84 RCA — cold-start imgproxy fetch detection', () => {
  test('full sequence: login → home → questions → help → privacy', async ({ page }) => {
    test.setTimeout(120_000);

    // STAGE 1: navigate to login (simulates re-auth.setup.ts entry)
    const loginCap = await captureRoute('01-login-page', page, async () => {
      await page.goto(`${FRONTEND}/en/candidate/login`, { waitUntil: 'networkidle' });
    });

    // STAGE 2: login submit → redirect to candidate home (simulates auth-setup.ts + re-auth.setup.ts post-login)
    const homeCap = await captureRoute('02-login-submit-home', page, async () => {
      await page.getByTestId('login-email').fill(TEST_CANDIDATE_EMAIL);
      await page.getByTestId('password-field').fill(TEST_CANDIDATE_PASSWORD);
      await page.getByTestId('login-submit').click();
      // re-auth.setup.ts asserts: not on login URL anymore.
      await expect(page).not.toHaveURL(/.*login.*/);
      // Wait for status-message anchor (also asserted by 'should show read-only warning' test).
      await expect(page.getByTestId('candidate-home-status')).toBeVisible({ timeout: 30_000 });
      // Idle to let any background prefetch settle so we capture it.
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    });

    // STAGE 3: navigate to questions (CAND-09 read-only test path)
    const questionsCap = await captureRoute('03-questions', page, async () => {
      await page.goto(`${FRONTEND}/en/candidate/questions`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    });

    // STAGE 4: navigate to home (CAND-10 / CAND-11 / CAND-13 path)
    const homeAgainCap = await captureRoute('04-home-again', page, async () => {
      await page.goto(`${FRONTEND}/en/candidate`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    });

    // STAGE 5: help page (CAND-14a)
    const helpCap = await captureRoute('05-help', page, async () => {
      await page.goto(`${FRONTEND}/en/candidate/help`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    });

    // STAGE 6: privacy page (CAND-14b)
    const privacyCap = await captureRoute('06-privacy', page, async () => {
      await page.goto(`${FRONTEND}/en/candidate/privacy`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    });

    // SUMMARY: condense findings.
    const summary = {
      stages: {
        '01-login-page': {
          storageRequests: loginCap.storage.length,
          storageFailures: loginCap.storageFailures.length,
          firstStorage: loginCap.storage[0]?.url ?? null
        },
        '02-login-submit-home': {
          storageRequests: homeCap.storage.length,
          storageFailures: homeCap.storageFailures.length,
          firstStorage: homeCap.storage[0]?.url ?? null
        },
        '03-questions': {
          storageRequests: questionsCap.storage.length,
          storageFailures: questionsCap.storageFailures.length,
          firstStorage: questionsCap.storage[0]?.url ?? null
        },
        '04-home-again': {
          storageRequests: homeAgainCap.storage.length,
          storageFailures: homeAgainCap.storageFailures.length,
          firstStorage: homeAgainCap.storage[0]?.url ?? null
        },
        '05-help': {
          storageRequests: helpCap.storage.length,
          storageFailures: helpCap.storageFailures.length,
          firstStorage: helpCap.storage[0]?.url ?? null
        },
        '06-privacy': {
          storageRequests: privacyCap.storage.length,
          storageFailures: privacyCap.storageFailures.length,
          firstStorage: privacyCap.storage[0]?.url ?? null
        }
      },
      verdict: {
        totalStorageRequests:
          loginCap.storage.length +
          homeCap.storage.length +
          questionsCap.storage.length +
          homeAgainCap.storage.length +
          helpCap.storage.length +
          privacyCap.storage.length,
        renderImageRequests: [
          ...loginCap.storage,
          ...homeCap.storage,
          ...questionsCap.storage,
          ...homeAgainCap.storage,
          ...helpCap.storage,
          ...privacyCap.storage
        ].filter((r) => r.url.includes('/storage/v1/render/image/')).length,
        objectPublicRequests: [
          ...loginCap.storage,
          ...homeCap.storage,
          ...questionsCap.storage,
          ...homeAgainCap.storage,
          ...helpCap.storage,
          ...privacyCap.storage
        ].filter((r) => r.url.includes('/storage/v1/object/public/')).length
      }
    };
    writeFileSync(join(CAPTURES_DIR, '99-summary.json'), JSON.stringify(summary, null, 2), 'utf8');
    console.log('Phase 84 RCA summary:', JSON.stringify(summary, null, 2));
  });
});
