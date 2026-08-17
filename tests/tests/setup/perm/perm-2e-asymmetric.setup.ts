/**
 * perm-2e-asymmetric data-setup project.
 *
 * Invokes setupFromTemplate('perm-2e-asymmetric').
 * Prefix: 'test-perm-2e-asymmetric-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-2e-asymmetric dataset', async () => {
  await setupFromTemplate('perm-2e-asymmetric', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
