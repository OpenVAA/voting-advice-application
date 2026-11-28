/**
 * perm-disjoint-1co data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-disjoint-1co` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-disjoint-1co dataset', () => runTemplateTeardownAsserted('perm-disjoint-1co'));
