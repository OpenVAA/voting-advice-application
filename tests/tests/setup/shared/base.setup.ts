/**
 * base data-setup project — Phase 88 Plan 01 Task 5; renamed baseV1→base in
 * Phase 93 Plan 04 (D-10) and decoupled from the perm anchor (FLAG-6).
 *
 * Invokes the generic `setupFromTemplate('e2e/base')` helper to seed the
 * canonical base dataset. Runs under the dedicated `data-setup-base`
 * playwright project; the paired teardown project (`data-teardown-base`)
 * calls runTeardown independently via tests/tests/setup/shared/base.teardown.ts.
 *
 * The helper's returned `cleanup` function is intentionally not invoked
 * here — Playwright's setup/teardown project semantics handle cleanup
 * separately, and runTeardown is idempotent so multiple invocations
 * across project boundaries are safe.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import base dataset', async () => {
  // `extraTeardownPrefix: 'e2e-perm-'` defensively wipes any residual perm-*
  // family rows before seeding the base dataset. Phase 93 Plan 04 (FLAG-6)
  // DECOUPLED `data-setup-base` from the perm anchor, so the base chain no
  // longer waits on the perm family. This pre-clear is retained as a
  // belt-and-braces guard: it is an idempotent wipe of a DIFFERENT prefix
  // namespace (`e2e-perm-`, never the base `test-` rows), so it is safe and
  // keeps the base dataset deterministic even if a perm chain ran earlier in
  // the same DB session and left rows (same `[EL1] Region election` /
  // `[EL2] Municipal election` names as perm-not-located-2e2cg).
  await setupFromTemplate('e2e/base', { extraTeardownPrefix: 'e2e-perm-' });
});
