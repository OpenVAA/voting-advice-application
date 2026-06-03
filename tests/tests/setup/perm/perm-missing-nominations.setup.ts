/**
 * perm-missing-nominations data-setup project — Phase 90 Plan 02 (TIR5:15-26).
 *
 * Invokes setupFromTemplate('perm-missing-nominations').
 * Prefix: 'e2e-perm-missnoms-' per D-90-01.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain
 * leakage from baseV1 / candidate-mega-journey / prior perm chains still
 * mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-missing-nominations dataset', async () => {
  await setupFromTemplate('perm-missing-nominations', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
