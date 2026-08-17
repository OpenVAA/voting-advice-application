/**
 * perm-hide-category-tags data-setup project.
 *
 * UNAUTHENTICATED — voter walk to /questions asserts absence of the category-tag testid.
 *
 * Prefix: 'e2e-perm-hide-cattags-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-hide-category-tags dataset', async () => {
  await setupFromTemplate('perm-hide-category-tags', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
