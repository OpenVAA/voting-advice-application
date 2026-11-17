/**
 * perm-hide-election-tags data-setup project.
 *
 * UNAUTHENTICATED — voter walk to /questions asserts absence of the election-tag testid.
 *
 * Prefix: 'e2e-perm-hide-eltags-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-hide-election-tags dataset', async () => {
  await setupFromTemplate('perm-hide-election-tags', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
