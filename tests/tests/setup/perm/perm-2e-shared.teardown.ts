/**
 * perm-2e-shared data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-2e-shared` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-2e-shared dataset', () => runTemplateTeardownAsserted('perm-2e-shared'));
