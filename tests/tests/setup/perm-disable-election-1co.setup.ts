/**
 * perm-disable-election-1co data-setup project — Phase 88 Plan 03.
 *
 * Invokes setupFromTemplate('perm-disable-election-1co').
 * Prefix: 'test-perm-disable-elec-1co-' per 88-03-SCOPE.md:104-110.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-disable-election-1co dataset', async () => {
  await setupFromTemplate('perm-disable-election-1co');
});
