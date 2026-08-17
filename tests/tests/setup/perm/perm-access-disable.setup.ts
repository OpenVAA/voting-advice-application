/**
 * perm-access-disable data-setup project (consolidated).
 *
 * Invokes setupFromTemplate('perm-access-disable').
 * Prefix: 'e2e-perm-access-disable-'.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain
 * leakage from base / candidate-journey / prior perm chains still mid-teardown
 * when this setup starts. The consolidated spec re-seeds the app_settings
 * singleton per access mode (voterApp / candidateApp / underMaintenance).
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-access-disable dataset', async () => {
  await setupFromTemplate('perm-access-disable', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
