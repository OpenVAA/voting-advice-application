/**
 * perm-header-show-help data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-header-show-help` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-header-show-help dataset', () => runTemplateTeardownAsserted('perm-header-show-help'));
