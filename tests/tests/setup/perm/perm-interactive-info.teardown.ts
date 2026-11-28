/**
 * perm-interactive-info data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-interactive-info` template declares. No candidate auth user to unregister (the voter slice is unauthenticated).
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-interactive-info dataset', () => runTemplateTeardownAsserted('perm-interactive-info'));
