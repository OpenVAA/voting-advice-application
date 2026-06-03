/**
 * perm-hide-if-missing-answers data-setup project — Phase 91 Plan 02
 * (TIR6:95-102, A6). UNAUTHENTICATED — voter walk to /results asserting on
 * candidate-card filtering.
 *
 * Prefix: 'e2e-perm-hide-missing-' per D-91-PD-05.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-hide-if-missing-answers dataset', async () => {
  await setupFromTemplate('perm-hide-if-missing-answers', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
