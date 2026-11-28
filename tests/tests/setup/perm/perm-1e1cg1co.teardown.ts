/**
 * perm-1e1cg1co data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-1e1cg1co` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-1e1cg1co dataset', () => runTemplateTeardownAsserted('perm-1e1cg1co'));
