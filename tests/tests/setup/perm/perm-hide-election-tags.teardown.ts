/**
 * perm-hide-election-tags data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-hide-election-tags` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-hide-election-tags dataset', () => runTemplateTeardownAsserted('perm-hide-election-tags'));
