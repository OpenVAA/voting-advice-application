/**
 * perm-header-show-feedback minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 1 candidate, 1
 * opinion Likert-5 question. The under-test setting is
 * `header.showFeedback: true` which surfaces the feedback Button in the
 * Banner.svelte top bar (gated on
 * `topBarSettings.current.actions.feedback === 'show'`).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-header-feedback-'`.
 *
 * UNAUTHENTICATED — the spec walks to /en (voter intro) and asserts on the
 * `header-feedback` testid in the Banner; no candidate session needed.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-header-feedback-';

export const permHeaderShowFeedbackTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    header: { showFeedback: true }
  }
});

export default permHeaderShowFeedbackTemplate;
