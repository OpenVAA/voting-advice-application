/**
 * perm-header-show-feedback data-setup project.
 *
 * Invokes setupFromTemplate('show-feedback-survey'). UNAUTHENTICATED — the spec asserts on the voter intro (Banner.svelte header-feedback testid) and does not need a candidate session.
 *
 * Prefix: 'e2e-perm-header-feedback-'.
 *
 * NOTE (Phase 120, temporary): the dev-seed registry key was renamed
 * perm-header-show-feedback → show-feedback-survey in Phase 119 (index.ts:89),
 * but this test node was not. This one-line re-point unblocks the perm chain so
 * the suite is green. Plan 120-07 (EPERM-09) does the proper rename — git mv this
 * setup/teardown/spec + project entries to perm-show-feedback-survey and adds the
 * survey-popup-coordination assertions — superseding this stopgap.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-header-show-feedback dataset', async () => {
  await setupFromTemplate('show-feedback-survey', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
