/**
 * perm-hide-category-tags data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-hide-category-tags` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-hide-category-tags dataset', () => runTemplateTeardownAsserted('perm-hide-category-tags'));
