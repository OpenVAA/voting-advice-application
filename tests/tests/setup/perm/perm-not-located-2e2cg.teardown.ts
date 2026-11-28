/**
 * perm-not-located-2e2cg data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-not-located-2e2cg` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-not-located-2e2cg dataset', () => runTemplateTeardownAsserted('perm-not-located-2e2cg'));
