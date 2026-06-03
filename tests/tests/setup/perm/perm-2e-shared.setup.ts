/**
 * perm-2e-shared data-setup project.
 *
 * Invokes setupFromTemplate('perm-2e-shared').
 * Prefix: 'test-perm-2e-shared-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-2e-shared dataset', async () => {
  await setupFromTemplate('perm-2e-shared', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
