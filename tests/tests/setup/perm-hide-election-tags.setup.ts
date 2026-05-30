/**
 * perm-hide-election-tags data-setup project — Phase 91 Plan 02
 * (TIR6:104-108, A7). UNAUTHENTICATED — voter walk to /questions asserts
 * absence of the election-tag testid.
 *
 * Prefix: 'e2e-perm-hide-eltags-' per D-91-PD-05.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-hide-election-tags dataset', async () => {
  await setupFromTemplate('perm-hide-election-tags', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
