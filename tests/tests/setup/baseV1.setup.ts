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
  // `extraTeardownPrefix: 'e2e-perm-'` defends against the race with the
  // perm-* family's final teardown: `data-setup-baseV1` depends on the LAST
  // perm spec (`perm-not-located-2e2cg`) and runs in parallel with
  // `data-teardown-perm-not-located-2e2cg`. If baseV1 setup finishes BEFORE
  // the perm teardown, perm rows linger into voter-mega-journey runtime
  // (same `[EL1] Region election` / `[EL2] Municipal election` names as
  // perm-not-located-2e2cg). Wiping `e2e-perm-` defensively here makes the
  // race outcome deterministic.
  await setupFromTemplate('baseV1', { extraTeardownPrefix: 'e2e-perm-' });
});
