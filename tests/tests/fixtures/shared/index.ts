/**
 * @file shared fixtures barrel — Phase 91 Plan 03 (D-91-MJ-02).
 *
 * Re-exports cross-app function-fixtures whose surfaces are not bound to
 * either the voter-mega or candidate-mega composition roots. New shared
 * fixtures land here and are imported via the barrel from spec files in
 * either app (voter-mega-journey, candidate-mega-journey).
 */

export { createFeedbackDialog } from './feedbackDialog.fixture';
export type { FeedbackDialogFixture } from './feedbackDialog.fixture';
