/**
 * perm-answers-locked data-setup project — Phase 91 Plan 02 (TIR6:3-14, A1).
 *
 * Invokes setupFromTemplate('perm-answers-locked') then mints a per-perm
 * Playwright storage-state JSON (D-91-PD-06) via the candidateSessionMinter
 * helper from Plan 91-01 Task 3. The storage-state file is consumed by the
 * AUTHENTICATED sub-tests in perm-answers-locked.spec.ts (surfaces 2 + 3:
 * /candidate/profile + /candidate/questions/[questionId]); the UNAUTH sub-
 * test (surface 1, /candidate login) does not use storage state.
 *
 * Prefix: 'e2e-perm-answers-locked-' per D-91-PD-05.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain
 * leakage from prior perm chains still mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TESTS_DIR } from '../utils/testsDir';
import { mintCandidateSession } from '../utils/candidateSessionMinter';
import { setupFromTemplate } from './setupFromTemplate';

const PREFIX = 'e2e-perm-answers-locked-';
export const STORAGE_STATE_PATH = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-answers-locked.json'
);

setup('import perm-answers-locked dataset + mint candidate session', async () => {
  await setupFromTemplate('perm-answers-locked', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });

  const state = await mintCandidateSession({
    externalId: 'cand-1',
    prefix: PREFIX,
    locale: 'en'
  });
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(state, null, 2));
});
