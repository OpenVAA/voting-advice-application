/**
 * perm-disable-election-2co data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-disable-election-2co` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-disable-election-2co dataset', () => runTemplateTeardownAsserted('perm-disable-election-2co'));
