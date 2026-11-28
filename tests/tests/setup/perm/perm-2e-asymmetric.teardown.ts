/**
 * perm-2e-asymmetric data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-2e-asymmetric` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-2e-asymmetric dataset', () => runTemplateTeardownAsserted('perm-2e-asymmetric'));
