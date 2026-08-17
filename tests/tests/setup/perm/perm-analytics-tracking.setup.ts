/**
 * perm-analytics-tracking data-setup project.
 *
 * Invokes setupFromTemplate('perm-analytics-tracking'). UNAUTHENTICATED — the
 * voter-prefs-tracking spec (Plan 06) exercises the voter flow (answer →
 * /results) to read out analytics track events via the trackingIntercept
 * fixture, and does not need a candidate session.
 *
 * The template seeds the analytics overlay (platform object + trackEvents:true,
 * dummy code) into the shared app_settings singleton. Consent is toggled at
 * runtime by the spec, NOT seeded.
 *
 * Prefix: 'e2e-perm-analytics-' (matches the template's own externalIdPrefix,
 * perm-analytics-tracking.ts).
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-analytics-tracking dataset', async () => {
  await setupFromTemplate('perm-analytics-tracking', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
