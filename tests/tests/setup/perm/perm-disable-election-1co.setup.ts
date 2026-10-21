/**
 * perm-disable-election-1co data-setup project.
 *
 * Invokes setupFromTemplate('perm-disable-election-1co').
 * Prefix: 'test-perm-disable-elec-1co-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-disable-election-1co dataset', async () => {
  await setupFromTemplate('perm-disable-election-1co', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
