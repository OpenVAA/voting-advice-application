/**
 * perm-not-located-2e2cg data-setup project.
 *
 * Invokes setupFromTemplate('perm-not-located-2e2cg').
 * Prefix: 'test-perm-notloc-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-not-located-2e2cg dataset', async () => {
  await setupFromTemplate('perm-not-located-2e2cg', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
