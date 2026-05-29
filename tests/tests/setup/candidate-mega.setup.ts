/**
 * candidate-mega data-setup project — Phase 89 Plan 03 Task 1.
 *
 * Invokes the generic `setupFromTemplate('baseV1')` helper to seed the
 * baseV1 dataset (extended in Plan 89-01 with the unregistered
 * `test-ca-aa-unregistered` candidate + paired nomination, the required
 * `test-qu-info-text` flag, the 3 filtered info questions, and the
 * hero/info content on Q1/Q2/QG-Opin-Base).
 *
 * Runs under the dedicated `data-setup-candidate-mega` playwright project;
 * the paired teardown project (`data-teardown-candidate-mega`) calls
 * runTeardown + unregisterCandidate independently via
 * tests/tests/setup/candidate-mega.teardown.ts.
 *
 * Mirrors `tests/tests/setup/baseV1.setup.ts` verbatim — the
 * candidate-mega chain consumes the SAME baseV1 dataset (per D-89-01
 * lockstep). A dedicated setup wrapper exists for graph clarity (one
 * project per dataset chain in playwright.config.ts) and so the chain's
 * dependencies can be reasoned about independently of the voter-mega
 * chain that ALSO consumes baseV1.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import baseV1 dataset (candidate-mega chain)', async () => {
  // `extraTeardownPrefix: 'e2e-perm-'` defends against the race with the
  // perm-* family's final teardown — same rationale as baseV1.setup.ts:
  // a sibling chain's residual rows must not bleed into this chain's
  // seed. The candidate-mega chain is sequenced AFTER voter-mega-journey
  // (shared 'test-' prefix race per Plan 89-03 R3), so this setup runs
  // against an already-seeded baseV1 — but setupFromTemplate is
  // idempotent (it runs runTeardown('test-', ...) BEFORE seeding) so a
  // fresh seed is established here too.
  await setupFromTemplate('baseV1', { extraTeardownPrefix: 'e2e-perm-' });
});
