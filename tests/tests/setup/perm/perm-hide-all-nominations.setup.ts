/**
 * perm-hide-all-nominations data-setup project.
 *
 * UNAUTHENTICATED — the spec asserts on a 307 redirect from /en/nominations to /en.
 *
 * Prefix: 'e2e-perm-hide-all-noms-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-hide-all-nominations dataset', async () => {
  await setupFromTemplate('perm-hide-all-nominations', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
