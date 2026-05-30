/**
 * perm-disable-allow-open data-setup project — Phase 91 Plan 02
 * (TIR6:121-142, A9). Mints a per-perm Playwright storage state via
 * candidateSessionMinter (D-91-PD-06) consumed by the candidate-side
 * describe block in perm-disable-allow-open.spec.ts. The voter-side
 * describe block does not use storage state.
 *
 * Prefix: 'e2e-perm-no-allowopen-' per D-91-PD-05.
 */

import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TESTS_DIR } from '../utils/testsDir';
import { mintCandidateSession } from '../utils/candidateSessionMinter';
import { setupFromTemplate } from './setupFromTemplate';

const PREFIX = 'e2e-perm-no-allowopen-';
export const STORAGE_STATE_PATH = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-disable-allow-open.json'
);

setup('import perm-disable-allow-open dataset + mint candidate session', async () => {
  await setupFromTemplate('perm-disable-allow-open', {
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
