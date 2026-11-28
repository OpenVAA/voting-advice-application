/**
 * perm-org-matching data-setup project.
 *
 * Invokes setupFromTemplate('perm-org-matching'). UNAUTHENTICATED — the spec exercises the voter results flow (answer at max → /results → orgs tab) to read out per-mode organization match scores, and does not need a candidate session. The results path uses in-test answering (`answerAndAdvanceToResults`), not a minted storage state.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-org-matching dataset', async () => {
  await setupFromTemplate('perm-org-matching', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
