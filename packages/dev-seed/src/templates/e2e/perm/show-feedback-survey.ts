/**
 * show-feedback-survey minimal-data template (EPERM-09).
 *
 * Renamed + extended from the former `perm-header-show-feedback` template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 1 candidate, 1
 * opinion Likert-5 question. A single Likert question suffices for this
 * settings-overlay perm, so `buildMinimal` is used.
 *
 * Under-test settings (all surfaced via the settings overlay):
 *   - `header.showFeedback: true` — KEPT (additive). Surfaces the feedback
 *     Button in the Banner.svelte top bar (gated on
 *     `topBarSettings.current.actions.feedback === 'show'`). The existing
 *     header-feedback assertion stays valid.
 *   - `results.showSurveyPopup` / `results.showFeedbackPopup` — these are
 *     popup-delay values (`number`, base = 0 in MINIMAL_BASE_APP_SETTINGS).
 *     Set to a small positive delay so the survey/feedback popups surface on
 *     the results view. (The coverage-plan note phrased these as `true`; the
 *     actual `dynamicSettings` type makes them numeric delays — the
 *     type-correct equivalent of "enabled" is a positive delay.)
 *   - `survey.showIn: ['resultsPopup']` + `survey.linkTemplate` — the survey
 *     type requires both fields; `'resultsPopup'` is the valid `showIn`
 *     member that surfaces the survey in a results popup (the coverage-plan
 *     note `['results']` maps to this enum member).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-feedback-survey-'`.
 *
 * UNAUTHENTICATED — the spec walks to /en (voter intro) and the results view
 * and asserts on the `header-feedback` testid in the Banner plus the
 * survey/feedback popup handles; no candidate session needed.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-feedback-survey-';

export const showFeedbackSurveyTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 1,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    header: { showFeedback: true },
    results: { showSurveyPopup: 500, showFeedbackPopup: 180 },
    survey: { linkTemplate: 'https://example.com/survey?session={sessionId}', showIn: ['resultsPopup'] }
  }
});

export default showFeedbackSurveyTemplate;
