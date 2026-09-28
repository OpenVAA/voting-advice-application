/**
 * Phase 84 RCA — supplemental cold-start capture for the candidate-profile
 * route (the ONLY candidate-app surface that renders Alpha's portrait, per
 * `<Input type="image">` consumption in
 * apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte:272-279).
 *
 * Differential evidence: capture-cold-start.spec.ts showed ZERO
 * /storage/v1/* requests on login → home → questions → help → privacy.
 * This spec adds /candidate/profile to the trace to confirm that:
 *   (a) the profile route IS the only surface that fetches the public-bucket
 *       portrait URL on initial paint;
 *   (b) the public-bucket URL pattern is /storage/v1/object/public/... NOT
 *       /storage/v1/render/image/... — meaning the static-bucket path is
 *       served by Supabase Storage itself, NOT by imgproxy.
 *
 * Result feeds the per-test classification table in 84-RCA-FINDINGS.md.
 */
import { expect, test } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAPTURES_DIR = join(__dirname, 'captures');
mkdirSync(CAPTURES_DIR, { recursive: true });

const FRONTEND = 'http://localhost:5173';
const TEST_CANDIDATE_EMAIL = 'mock.candidate.2@openvaa.org';
const TEST_CANDIDATE_PASSWORD = 'Password1!';

const STORAGE_RE = /\/storage\/v1\//;

test('profile cold-start: login → profile (Alpha portrait rendered here)', async ({ page }) => {
  test.setTimeout(120_000);

  const allStorage: Array<{ ts: number; url: string; method: string; resourceType: string }> = [];
  const allStorageResponses: Array<{ ts: number; url: string; status: number }> = [];

  page.on('request', (req) => {
    const url = req.url();
    if (STORAGE_RE.test(url)) {
      allStorage.push({ ts: Date.now(), url, method: req.method(), resourceType: req.resourceType() });
    }
  });
  page.on('response', (res) => {
    const url = res.url();
    if (STORAGE_RE.test(url)) {
      allStorageResponses.push({ ts: Date.now(), url, status: res.status() });
    }
  });

  // Login.
  await page.goto(`${FRONTEND}/en/candidate/login`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('login-email').fill(TEST_CANDIDATE_EMAIL);
  await page.getByTestId('password-field').fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page).not.toHaveURL(/.*login.*/);
  await expect(page.getByTestId('candidate-home-status')).toBeVisible({ timeout: 30_000 });

  // Mark the boundary between home (no storage) and profile (storage expected).
  const homeStorageCount = allStorage.length;

  // Navigate to profile.
  await page.goto(`${FRONTEND}/en/candidate/profile`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('profile-image-upload')).toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

  const profileStorage = allStorage.slice(homeStorageCount);
  const profileResponses = allStorageResponses.slice(
    allStorageResponses.findIndex((r) => allStorage.slice(0, homeStorageCount).every((s) => s.ts < r.ts))
  );

  const summary = {
    storageOnHomeRoute: homeStorageCount,
    storageOnProfileRoute: profileStorage.length,
    profileFirstStorageUrl: profileStorage[0]?.url ?? null,
    renderImagePathCount: profileStorage.filter((r) => r.url.includes('/storage/v1/render/image/')).length,
    objectPublicPathCount: profileStorage.filter((r) => r.url.includes('/storage/v1/object/public/')).length,
    profileResponseStatuses: profileResponses.map((r) => ({
      url: r.url.replace(FRONTEND, '').replace('http://127.0.0.1:54321', ''),
      status: r.status
    })),
    profileRequestUrls: profileStorage.map((r) => r.url.replace('http://127.0.0.1:54321', ''))
  };
  writeFileSync(join(CAPTURES_DIR, 'profile-capture.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log('Profile capture summary:', JSON.stringify(summary, null, 2));
});
