/**
 * perm-2e-asymmetric data-setup project — Phase 88 Plan 03.
 *
 * Invokes setupFromTemplate('perm-2e-asymmetric').
 * Prefix: 'test-perm-2e-asymmetric-' per 88-03-SCOPE.md:104-110.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-2e-asymmetric dataset', async () => {
  await setupFromTemplate('perm-2e-asymmetric');
});
