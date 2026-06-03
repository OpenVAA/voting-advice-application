/**
 * perm-disable-candidate-app data-setup project — Phase 89 Plan 04.
 *
 * Invokes setupFromTemplate('perm-disable-candidate-app').
 * Prefix: 'e2e-perm-nocand-' per D-89-03 (89-04-PLAN.md).
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain
 * leakage from baseV1 / candidate-mega-journey / prior perm chains still
 * mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-disable-candidate-app dataset', async () => {
  await setupFromTemplate('perm-disable-candidate-app', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
