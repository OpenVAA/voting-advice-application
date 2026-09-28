/**
 * perm-header-show-help data-setup project.
 *
 * UNAUTHENTICATED — the spec asserts on the voter intro Banner help-button + Help URL.
 *
 * Prefix: 'e2e-perm-header-help-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-header-show-help dataset', async () => {
  await setupFromTemplate('perm-header-show-help', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
