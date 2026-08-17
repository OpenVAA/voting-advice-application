/**
 * perm-startfromcg data-setup project.
 *
 * Invokes setupFromTemplate('perm-startfromcg'). The template OMITS elections.startFromConstituencyGroup; the perm-startfromcg.spec.ts beforeAll resolves the CG-2 UUID via SupabaseAdminClient and writes it at runtime.
 *
 * Prefix: 'test-perm-startfromcg-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-startfromcg dataset', async () => {
  await setupFromTemplate('perm-startfromcg', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });
});
