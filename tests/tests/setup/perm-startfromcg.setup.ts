/**
 * perm-startfromcg data-setup project — Phase 88 Plan 03.
 *
 * Invokes setupFromTemplate('perm-startfromcg'). The template OMITS
 * elections.startFromConstituencyGroup; the perm-startfromcg.spec.ts
 * beforeAll resolves the CG-2 UUID via SupabaseAdminClient and writes it
 * at runtime (HIGH-3 resolution; mirror variant-startfromcg.setup.ts:18-23
 * + startfromcg.spec.ts:158-185).
 *
 * Prefix: 'test-perm-startfromcg-' per 88-03-SCOPE.md:104-110.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from './setupFromTemplate';

setup('import perm-startfromcg dataset', async () => {
  await setupFromTemplate('perm-startfromcg', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
