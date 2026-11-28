/**
 * perm-access-disable data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-access-disable` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-access-disable dataset', () => runTemplateTeardownAsserted('perm-access-disable'));
