/**
 * perm-missing-nominations data-setup project.
 *
 * Invokes setupFromTemplate('perm-missing-nominations').
 * Prefix: 'e2e-perm-missnoms-'.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain leakage from base / candidate-journey / prior perm chains still mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-missing-nominations dataset', async () => {
  await setupFromTemplate('perm-missing-nominations', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
