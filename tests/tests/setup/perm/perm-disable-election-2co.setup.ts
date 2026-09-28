/**
 * perm-disable-election-2co data-setup project.
 *
 * Invokes setupFromTemplate('perm-disable-election-2co').
 * Prefix: 'test-perm-disable-elec-2co-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-disable-election-2co dataset', async () => {
  await setupFromTemplate('perm-disable-election-2co', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
