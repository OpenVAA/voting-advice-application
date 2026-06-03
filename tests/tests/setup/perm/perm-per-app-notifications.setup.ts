/**
 * perm-per-app-notifications data-setup project.
 *
 * Invokes setupFromTemplate('perm-per-app-notifications').
 * Prefix: 'e2e-perm-notif-'.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain leakage from base / candidate-journey / prior perm chains still mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-per-app-notifications dataset', async () => {
  await setupFromTemplate('perm-per-app-notifications', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
