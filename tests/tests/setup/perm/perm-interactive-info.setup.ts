/**
 * perm-interactive-info data-setup project.
 *
 * Invokes setupFromTemplate('perm-interactive-info'). UNAUTHENTICATED — the spec
 * exercises the voter questions flow (popup-modal vs static-expander info modes,
 * infoSections, and per-type arguments) and does not need a candidate session.
 *
 * Prefix: 'e2e-perm-iinfo-' (matches the template's own externalIdPrefix,
 * perm-interactive-info.ts:46).
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import perm-interactive-info dataset', async () => {
  await setupFromTemplate('perm-interactive-info', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
