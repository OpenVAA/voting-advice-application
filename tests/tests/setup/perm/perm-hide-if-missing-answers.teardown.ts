/**
 * perm-hide-if-missing-answers data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-hide-if-missing-answers` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete perm-hide-if-missing-answers dataset', () =>
  runTemplateTeardownAsserted('perm-hide-if-missing-answers')
);
