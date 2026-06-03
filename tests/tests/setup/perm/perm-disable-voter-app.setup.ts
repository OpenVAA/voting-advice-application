/**
 * perm-disable-voter-app data-setup project — Phase 89 Plan 04.
 *
 * Invokes setupFromTemplate('perm-disable-voter-app').
 * Prefix: 'e2e-perm-novapp-' per D-89-03 (89-04-PLAN.md).
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain
 * leakage from base / candidate-journey / prior perm chains still
 * mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-disable-voter-app dataset', async () => {
  await setupFromTemplate('perm-disable-voter-app', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
