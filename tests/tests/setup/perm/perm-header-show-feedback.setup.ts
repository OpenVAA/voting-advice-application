/**
 * perm-header-show-feedback data-setup project.
 *
 * Invokes setupFromTemplate('perm-header-show-feedback'). UNAUTHENTICATED — the spec asserts on the voter intro (Banner.svelte header-feedback testid) and does not need a candidate session.
 *
 * Prefix: 'e2e-perm-header-feedback-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-header-show-feedback dataset', async () => {
  await setupFromTemplate('perm-header-show-feedback', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
