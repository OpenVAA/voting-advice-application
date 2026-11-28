/**
 * perm-per-app-notifications data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-per-app-notifications` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-per-app-notifications dataset', () => runTemplateTeardownAsserted('perm-per-app-notifications'));
