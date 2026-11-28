/**
 * perm-show-feedback-survey data-setup project.
 *
 * Invokes setupFromTemplate('perm-show-feedback-survey'). UNAUTHENTICATED — the spec asserts on the voter intro (Banner.svelte header-feedback testid) and the results-view feedback/survey popups; it does not need a candidate session.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import show-feedback-survey dataset', async () => {
  await setupFromTemplate('perm-show-feedback-survey', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
