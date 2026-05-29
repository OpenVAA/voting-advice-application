/**
 * perm-localisation-negative data-setup project — Phase 90 Plan 03 (TIR5:28-50).
 *
 * Invokes setupFromTemplate('perm-localisation-negative').
 * Prefix: 'e2e-perm-l10n-neg-' per D-90-01.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain
 * leakage from baseV1 / candidate-mega-journey / prior perm chains still
 * mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-localisation-negative dataset', async () => {
  await setupFromTemplate('perm-localisation-negative', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
