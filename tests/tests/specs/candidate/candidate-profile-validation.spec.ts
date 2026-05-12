/**
 * A11Y-01 candidate profile validation rejection paths.
 *
 * Decoupled from `candidate-profile.spec.ts` (CAND-03 / CAND-12 happy paths)
 * per Phase 76 Plan 01 + Phase 75 D-04 scope-marked-filename precedent. Covers
 * 3 reliably-renderable cells against the existing product surface:
 *   1. image-type rejection → `components.input.error.invalidFile` at
 *      `apps/frontend/src/lib/components/input/Input.svelte:267`. Spec uploads
 *      a 5-byte plain-text fixture; the file-input handler rejects on the
 *      `!file.type.startsWith('image/')` branch.
 *   2. image-size rejection → `components.input.error.oversizeFile` at
 *      `apps/frontend/src/lib/components/input/Input.svelte:269`. Spec
 *      generates a >20MB PNG-signature blob in `os.tmpdir()` per-run; the
 *      handler rejects on the `file.size > maxFilesize` branch (default
 *      `maxFilesize = 20 * 1024 * 1024` bytes per `Input.svelte:90`).
 *   3. name-too-long → HTML5 native `maxlength` cap at `Input.svelte:602`.
 *      Spec fills above the seeded `custom_data.maxlength=50` ceiling on the
 *      `test-question-displayname` info question (Phase 76 P01 fixture
 *      extension) and asserts the input value silently caps at 50 chars. No
 *      i18n error message renders for this branch — the value-cap assertion
 *      IS the contract.
 *
 * PRODUCT-GAP cells (email-format / url-format / name-too-short /
 * required-empty) are deferred via single follow-up todo at
 * `.planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md` per
 * Phase 76 CONTEXT D-03 PRODUCT-GAP path + RESEARCH LANDMINE-2. The
 * deferred cells require schema (`customData.format` field) +
 * component (`Input.svelte` email branch) + i18n (`input.error.invalidEmail`
 * key) additions that exceed v2.9 coverage-phase scope.
 *
 * i18n note (W-03 deferred-todo at
 * `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md`): error
 * assertions use literal English strings consistent with the Phase 75 P01
 * QSPEC-01 + Phase 74 P05 conventions; specs run in default `en` locale.
 * Phase 78 / CLEAN-04 i18n wrapper tightening is the durable home for
 * switching to `t('components.input.error.{invalidFile,oversizeFile}')`
 * lookups across all Phase 76 + 75 specs.
 *
 * IMGPROXY_TIED_TITLES safety: all 3 test titles are PREFIXED `A11Y-01 ` and
 * do NOT end with any of the 14 bound patterns at Phase 73 P06
 * `regen-constants.mjs:64-78`. Confirmed at authoring time per Phase 76
 * RESEARCH LANDMINE-3.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// Run unauthenticated; each test logs in via loginAsCandidate() below.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Module-level helper: log in as Test Candidate Alpha.
 *
 * Hoisted out of the test body so the deterministic post-await dispatch on
 * `page.url()` stays compliant with `playwright/no-conditional-in-test`
 * (mirrors `candidate-profile.spec.ts:46-61` Pattern 4 canonical 3). Alpha
 * is pre-registered by the `data-setup` project's `auth.setup.ts`; this
 * spec reuses that registration to avoid an inviteUserByEmail round-trip.
 */
async function loginAsCandidate(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'CandAppHome', locale: 'en' }));
  // Home redirects unauthenticated traffic to /login; fill credentials there.
  await page.getByTestId(testIds.candidate.login.email).fill(TEST_CANDIDATE_EMAIL);
  await page.getByTestId(testIds.candidate.login.password).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();
  await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
}

/**
 * Resolve the on-disk path for the `test-not-an-image.txt` fixture. ESM-safe
 * via `import.meta.url` (matches `candidate-profile.spec.ts:154` precedent).
 */
const NOT_AN_IMAGE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/test-not-an-image.txt'
);

/**
 * Tmp-dir path for the runtime-generated oversized PNG (image-size cell).
 * Built once per file in `beforeAll` to avoid committing a 21MB binary.
 */
const OVERSIZED_PNG_PATH = path.join(os.tmpdir(), 'a11y-01-oversized.png');

/**
 * Image rejection cells — type + size. Each cell uploads a file via the
 * `ProfilePage.uploadImage()` page object and asserts the rendered error.
 */
const IMAGE_CELLS = [
  {
    name: 'image-type rejection surfaces invalidFile error',
    filePath: NOT_AN_IMAGE_PATH,
    expectedErrorText: 'The file is invalid.'
  },
  {
    name: 'image-size rejection surfaces oversizeFile error',
    filePath: OVERSIZED_PNG_PATH,
    expectedErrorText: /The file is too large/i
  }
] as const;

/**
 * Text-input rejection cell — HTML5 maxlength cap on the seeded display-name
 * info question (`test-question-displayname`, `custom_data.maxlength=50`).
 */
const TEXT_CELLS = [
  {
    name: 'name-too-long caps input value at maxlength=50 on display-name',
    fieldLabel: /Display name \(Phase 76 anchor\)/i,
    maxlength: 50,
    overflow: 60
  }
] as const;

test.describe('A11Y-01 candidate profile validation', { tag: ['@candidate'] }, () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    // Generate the oversized PNG once per file. The handler at Input.svelte:
    // 265-285 checks `file.type.startsWith('image/')` first (passes when the
    // browser maps the `.png` extension to `image/png`), then checks
    // `file.size > maxFilesize` (trips because 21MB > 20MB ceiling). A real
    // image decode is NOT required — the rejection branch fires on
    // size alone.
    const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const TARGET_BYTES = 21 * 1024 * 1024;
    const buf = Buffer.concat([
      PNG_SIGNATURE,
      Buffer.alloc(TARGET_BYTES - PNG_SIGNATURE.length, 0)
    ]);
    fs.writeFileSync(OVERSIZED_PNG_PATH, buf);
  });

  test.afterAll(async () => {
    // Best-effort cleanup; ignore ENOENT if a parallel worker raced.
    fs.rmSync(OVERSIZED_PNG_PATH, { force: true });
  });

  for (const cell of IMAGE_CELLS) {
    test(`A11Y-01 ${cell.name}`, async ({ page }) => {
      await loginAsCandidate(page);
      await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

      // Anchor on the profile heading before interacting — settle gate to
      // avoid racing the candidate context's $derived chain initialization.
      await expect(page.getByRole('heading', { name: /your profile/i })).toBeVisible({
        timeout: 10000
      });

      const imageArea = page.getByTestId(testIds.candidate.profile.imageUpload);
      await expect(imageArea).toBeVisible();

      // Bypass `ProfilePage.uploadImage()` — that page-object navigates via a
      // legacy `label[tabindex="0"]` selector that no longer exists post-70-03
      // (apps/frontend/src/lib/components/input/Input.svelte:514-545 was
      // refactored to render the click target as a <button> with an
      // onclick={() => fileInput?.click()} that programmatically opens the
      // native file chooser).
      //
      // PLAYWRIGHT FILECHOOSER FLAKE (Phase 76 P01 Task 4 smoke discovery):
      // Driving the upload via portraitButton.click() + waitForEvent('filechooser')
      // is non-deterministic across iterations of IMAGE_CELLS — the second
      // iteration intermittently times out at 90s waiting for the
      // 'filechooser' page event to fire even though the button click is
      // recorded. The `setInputFiles()`-direct path also fails because the
      // hidden <input class="hidden"> does not always fire change events on
      // programmatic file delivery in headless Chromium.
      //
      // RESOLUTION: explicitly `expect(portraitButton).toBeEnabled()` then
      // sleep 500ms before opening the filechooser — gives the OS-level
      // filechooser actor on macOS Chromium time to recover from the
      // previous test's invocation and reliably surface the dialog. The
      // settle delay is the smallest reproducible buffer that takes the
      // image-size cell from intermittent-timeout to deterministic-pass
      // across 3+ rapid serial-mode iterations.
      const portraitButton = imageArea.getByRole('button').first();
      await expect(portraitButton).toBeEnabled();
      // reason: 500ms sleep + waitForEvent ordering is the only reliable
      // mitigation discovered for the macOS Chromium filechooser actor
      // flake noted above. Each individual test still completes in <2s
      // total — the sleep is amortized by Playwright's per-test timeout
      // budget. Documented inline so a future maintainer doesn't excise it.
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(500);
      const fileChooserPromise = page.waitForEvent('filechooser');
      await portraitButton.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(cell.filePath);

      // (a) Validation error UI surfaces.
      await expect(page.getByText(cell.expectedErrorText)).toBeVisible({ timeout: 5000 });

      // (b) Unsaved state preserved — the rejection branch returns early in
      // `handleChange` at Input.svelte:267/269, so `value` is never re-assigned.
      // For the unauthenticated-first / mutating Alpha persona, a previously
      // saved portrait may already render in `imageArea` (the dev DB seed
      // does NOT seed an Alpha portrait but the upstream CAND-03 mutation
      // test stores one if it ran in the same project-session). The
      // preservation contract is therefore: the portrait button STAYS
      // enabled (i.e., not stuck in `isLoading`); a re-attempted save would
      // commit whatever was on the page BEFORE this rejection, not the
      // rejected file.
      await expect(portraitButton).toBeEnabled();
    });
  }

  for (const cell of TEXT_CELLS) {
    test(`A11Y-01 ${cell.name}`, async ({ page }) => {
      await loginAsCandidate(page);
      await page.goto(buildRoute({ route: 'CandAppProfile', locale: 'en' }));

      await expect(page.getByRole('heading', { name: /your profile/i })).toBeVisible({
        timeout: 10000
      });

      // The display-name question renders as a multilingual text input
      // (QuestionInput.svelte:65-75 dispatches to `text-multilingual` when
      // `disableMultilingual` is unset on the consumer — profile/+page.svelte:
      // 279 does NOT set it). The visible input(s) share the question's
      // accessible name via `aria-labelledby`. Scope by getByLabel so the
      // assertion targets the displayed input regardless of single- vs
      // multi-locale render shape.
      const input = page.getByLabel(cell.fieldLabel).first();
      await expect(input).toBeVisible({ timeout: 5000 });

      // Fill above the maxlength ceiling; HTML5 silently caps at maxlength.
      // Playwright's locator.fill() respects the HTML5 `maxlength` attr
      // (verified upstream: microsoft/playwright#16858). The cap is the
      // assertion contract — no i18n error message renders for this branch.
      const overflowValue = 'x'.repeat(cell.maxlength + cell.overflow);
      await input.fill(overflowValue);

      // (a) HTML5 cap took effect — value truncates to exactly maxlength.
      await expect(input).toHaveValue('x'.repeat(cell.maxlength));

      // (b) Unsaved state preserved — the displayed value is the user's
      // typed content (clipped to the cap), NOT silently cleared.
      const observedValue = await input.inputValue();
      expect(observedValue).toHaveLength(cell.maxlength);
      expect(observedValue.startsWith('x')).toBe(true);
    });
  }
});
