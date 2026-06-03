/**
 * perm-disjoint-1co data-setup project.
 *
 * Invokes setupFromTemplate('perm-disjoint-1co').
 * Prefix: 'test-perm-disjoint-1co-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-disjoint-1co dataset', async () => {
  await setupFromTemplate('perm-disjoint-1co', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
