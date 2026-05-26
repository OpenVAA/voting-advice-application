/**
 * perm-1e1cg1co data-setup project — Phase 88 Plan 03.
 *
 * Invokes the generic setupFromTemplate('perm-1e1cg1co') helper. The paired
 * teardown project (data-teardown-perm-1e1cg1co) calls runTeardown
 * independently via tests/tests/setup/perm-1e1cg1co.teardown.ts.
 *
 * Prefix: 'test-perm-1e1cg1co-' — UNIQUE within the test-perm-* family per
 * 88-03-SCOPE.md:104-110.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-1e1cg1co dataset', async () => {
  await setupFromTemplate('perm-1e1cg1co', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
