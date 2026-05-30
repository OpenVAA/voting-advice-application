/**
 * perm-header-show-help data-setup project — Phase 91 Plan 02
 * (TIR6:79-88, A4). UNAUTHENTICATED — the A4 spec asserts on the voter
 * intro Banner help-button + Help URL.
 *
 * Prefix: 'e2e-perm-header-help-' per D-91-PD-05.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-header-show-help dataset', async () => {
  await setupFromTemplate('perm-header-show-help', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
