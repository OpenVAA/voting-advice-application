/**
 * perm-show-feedback-survey data-setup project.
 *
 * Invokes setupFromTemplate('show-feedback-survey'). UNAUTHENTICATED — the spec asserts on the voter intro (Banner.svelte header-feedback testid) and the results-view feedback/survey popups; it does not need a candidate session.
 *
 * Renamed from perm-header-show-feedback: the dev-seed registry key was renamed perm-header-show-feedback → show-feedback-survey (index.ts:89); completes the test-layer rename (git mv of spec/setup/teardown + the project triple + re-pointed downstream show-help dependency) and extends the spec with the survey/feedback popup-coordination assertions.
 *
 * Seed prefix (from show-feedback-survey.ts): 'e2e-perm-feedback-survey-'.
 */

import { test as setup } from '@playwright/test';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('import show-feedback-survey dataset', async () => {
  await setupFromTemplate('show-feedback-survey', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
});
