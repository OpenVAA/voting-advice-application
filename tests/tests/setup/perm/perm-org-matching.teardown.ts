/**
 * perm-org-matching data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-org-matching` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-org-matching dataset', () => runTemplateTeardownAsserted('perm-org-matching'));
