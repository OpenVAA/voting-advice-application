/**
 * perm-per-app-notifications data-setup project — Phase 89 Plan 04.
 *
 * Invokes setupFromTemplate('perm-per-app-notifications').
 * Prefix: 'e2e-perm-notif-' per D-89-03 (89-04-PLAN.md).
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain
 * leakage from baseV1 / candidate-mega-journey / prior perm chains still
 * mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-per-app-notifications dataset', async () => {
  await setupFromTemplate('perm-per-app-notifications', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
