/**
 * perm-hide-hero data-setup project — Phase 91 Plan 02 (TIR6:24-32, A2).
 *
 * Invokes setupFromTemplate('perm-hide-hero') then mints a per-perm
 * Playwright storage-state JSON (D-91-PD-06) via the candidateSessionMinter
 * helper from Plan 91-01 Task 3. The spec consumes the storage state to
 * navigate to /en/candidate/questions/[questionId] as an authenticated
 * candidate and assert hideHero=true suppresses hero rendering.
 *
 * Prefix: 'e2e-perm-hide-hero-' per D-91-PD-05.
 */

import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TESTS_DIR } from '../utils/testsDir';
import { mintCandidateSession } from '../utils/candidateSessionMinter';
import { setupFromTemplate } from './setupFromTemplate';

const PREFIX = 'e2e-perm-hide-hero-';
export const STORAGE_STATE_PATH = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-hide-hero.json'
);

setup('import perm-hide-hero dataset + mint candidate session', async () => {
  await setupFromTemplate('perm-hide-hero', {
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
