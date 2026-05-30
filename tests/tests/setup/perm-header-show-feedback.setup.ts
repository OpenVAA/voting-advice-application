/**
 * perm-header-show-feedback data-setup project — Phase 91 Plan 02
 * (TIR6:68-77, A3).
 *
 * Invokes setupFromTemplate('perm-header-show-feedback'). UNAUTHENTICATED —
 * the A3 spec asserts on the voter intro (Banner.svelte header-feedback
 * testid) and does not need a candidate session.
 *
 * Prefix: 'e2e-perm-header-feedback-' per D-91-PD-05.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-header-show-feedback dataset', async () => {
  await setupFromTemplate('perm-header-show-feedback', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
