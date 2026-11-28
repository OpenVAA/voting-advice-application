/**
 * perm-hide-election-tags data-setup project.
 *
 * UNAUTHENTICATED — voter walk to /questions asserts absence of the election-tag testid.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-hide-election-tags dataset', async () => {
  await setupFromTemplate('perm-hide-election-tags', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
