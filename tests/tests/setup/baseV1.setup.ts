/**
 * baseV1 data-setup project — Phase 88 Plan 01 Task 5.
 *
 * Invokes the generic `setupFromTemplate('baseV1')` helper to seed the
 * new Phase 88 mega-journey dataset (TEST-INVENTORY-REFACTOR-1.md:13-200).
 * Runs under the dedicated `data-setup-baseV1` playwright project; the
 * paired teardown project (`data-teardown-baseV1`) calls runTeardown
 * independently via tests/tests/setup/baseV1.teardown.ts.
 *
 * The helper's returned `cleanup` function is intentionally not invoked
 * here — Playwright's setup/teardown project semantics handle cleanup
 * separately, and runTeardown is idempotent so multiple invocations
 * across project boundaries are safe.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import baseV1 dataset', async () => {
  await setupFromTemplate('baseV1');
});
