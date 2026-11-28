/**
 * perm-missing-nominations data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-missing-nominations` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-missing-nominations dataset', () => runTemplateTeardownAsserted('perm-missing-nominations'));
