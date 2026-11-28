/**
 * perm-hide-all-nominations data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-hide-all-nominations` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-hide-all-nominations dataset', () => runTemplateTeardownAsserted('perm-hide-all-nominations'));
