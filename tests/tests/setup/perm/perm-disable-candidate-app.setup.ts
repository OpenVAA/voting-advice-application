/**
 * perm-disable-candidate-app data-setup project.
 *
 * Invokes setupFromTemplate('perm-disable-candidate-app').
 * Prefix: 'e2e-perm-nocand-'.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain leakage from base / candidate-journey / prior perm chains still mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-disable-candidate-app dataset', async () => {
  await setupFromTemplate('perm-disable-candidate-app', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
