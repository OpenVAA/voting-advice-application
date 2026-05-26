/**
 * perm-not-located-2e2cg data-setup project — Phase 88 Plan 03.
 *
 * Invokes setupFromTemplate('perm-not-located-2e2cg').
 * Prefix: 'test-perm-notloc-' per 88-03-SCOPE.md:104-110.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-not-located-2e2cg dataset', async () => {
  await setupFromTemplate('perm-not-located-2e2cg');
});
