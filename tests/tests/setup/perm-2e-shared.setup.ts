/**
 * perm-2e-shared data-setup project — Phase 88 Plan 03.
 *
 * Invokes setupFromTemplate('perm-2e-shared').
 * Prefix: 'test-perm-2e-shared-' per 88-03-SCOPE.md:104-110.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-2e-shared dataset', async () => {
  await setupFromTemplate('perm-2e-shared', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
