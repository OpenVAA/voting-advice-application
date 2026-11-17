/**
 * base data-setup project, decoupled from the perm anchor.
 *
 * Invokes the generic `setupFromTemplate('e2e/base')` helper to seed the canonical base dataset. Runs under the dedicated `data-setup-base` playwright project; the paired teardown project (`data-teardown-base`) calls runTeardown independently via tests/tests/setup/shared/base.teardown.ts.
 *
 * The helper's returned `cleanup` function is intentionally not invoked here — Playwright's setup/teardown project semantics handle cleanup separately, and runTeardown is idempotent so multiple invocations across project boundaries are safe.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import base dataset', async () => {
  // `extraTeardownPrefix` defensively wipes residual rows from namespaces this project does not own, before seeding the base dataset. `data-setup-base` is decoupled from the perm anchor, so the base chain no longer waits on the perm family. Both prefixes below are idempotent wipes of DIFFERENT namespaces (never the base `test-` rows), so they are safe even when nothing is present:
  //  - 'e2e-perm-' — a perm chain that ran earlier in the same DB session and left rows (same `[EL1] Region election` / `[EL2] Municipal election` names as perm-not-located-2e2cg).
  //  - 'e2e-bankauth-' — the namespace of the identity-provider dataset (`e2e-bankauth-idp-`). A dataset an aborted run left behind there is swept here, so it cannot wedge voter-journey's exact-count assertions until an out-of-band `yarn db:reset`. `data-setup-identity-provider` is ordered after `data-setup-base` (`playwright.config.ts`), so this sweep runs before that project seeds.
  await setupFromTemplate('e2e/base', { extraTeardownPrefix: ['e2e-perm-', 'e2e-bankauth-'] });
});
