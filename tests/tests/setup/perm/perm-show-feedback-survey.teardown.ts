/**
 * perm-show-feedback-survey data-teardown project.
 *
 * Clears only this scenario's prefix, the `externalIdPrefix` the `perm-show-feedback-survey` template declares.
 */

import { test as teardown } from '@playwright/test';
import { runTemplateTeardownAsserted } from '../shared/assertTeardown';

teardown('delete show-feedback-survey dataset', () => runTemplateTeardownAsserted('perm-show-feedback-survey'));
