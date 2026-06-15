/**
 * Built-in template registry. The CLI's `loadBuiltIns` dynamically imports
 * this module (via `../templates/index.js`) and reads both `BUILT_IN_TEMPLATES`
 * and `BUILT_IN_OVERRIDES`.
 *
 * The map-based design means a new built-in template ships in two edits:
 *   1. Add the template declaration under `packages/dev-seed/src/templates/`.
 *   2. Register the name in both maps below (and matching overrides if any).
 *
 * The CLI resolves a `--template <name>` arg by looking up `BUILT_IN_TEMPLATES`
 * first; a miss falls through to filesystem-path resolution.
 * `BUILT_IN_OVERRIDES` is consulted only after a successful built-in match so
 * the pipeline receives the per-template override map at `runPipeline(tpl, ov)`.
 */

import { defaultOverrides, defaultTemplate } from './default';
import { baseTemplate } from './e2e/base';
import { perm1e1cg1coTemplate } from './e2e/perm/perm-1e1cg1co';
import { perm2eAsymmetricTemplate } from './e2e/perm/perm-2e-asymmetric';
import { perm2eSharedTemplate } from './e2e/perm/perm-2e-shared';
import { permAccessDisableTemplate } from './e2e/perm/perm-access-disable';
import { permAnswersLockedTemplate } from './e2e/perm/perm-answers-locked';
import { permDisableAllowOpenTemplate } from './e2e/perm/perm-disable-allow-open';
import { permDisableCandidateAppTemplate } from './e2e/perm/perm-disable-candidate-app';
import { permDisableElection1coTemplate } from './e2e/perm/perm-disable-election-1co';
import { permDisableElection2coTemplate } from './e2e/perm/perm-disable-election-2co';
import { permDisableVoterAppTemplate } from './e2e/perm/perm-disable-voter-app';
import { permDisjoint1coTemplate } from './e2e/perm/perm-disjoint-1co';
import { permHeaderShowHelpTemplate } from './e2e/perm/perm-header-show-help';
import { permHideAllNominationsTemplate } from './e2e/perm/perm-hide-all-nominations';
import { permHideCategoryTagsTemplate } from './e2e/perm/perm-hide-category-tags';
import { permHideElectionTagsTemplate } from './e2e/perm/perm-hide-election-tags';
import { permHideHeroTemplate } from './e2e/perm/perm-hide-hero';
import { permHideIfMissingAnswersTemplate } from './e2e/perm/perm-hide-if-missing-answers';
import { permInteractiveInfoTemplate } from './e2e/perm/perm-interactive-info';
import { permLocalisationPositiveTemplate } from './e2e/perm/perm-localisation-positive';
import { permMissingNominationsTemplate } from './e2e/perm/perm-missing-nominations';
import { permNotLocated2e2cgTemplate } from './e2e/perm/perm-not-located-2e2cg';
import { permOrgMatchingTemplate } from './e2e/perm/perm-org-matching';
import { permPerAppNotificationsTemplate } from './e2e/perm/perm-per-app-notifications';
import { permQuestionVideoTemplate } from './e2e/perm/perm-question-video';
import { permStartfromcgTemplate } from './e2e/perm/perm-startfromcg';
import { showFeedbackSurveyTemplate } from './e2e/perm/show-feedback-survey';
import type { Template } from '../template/types';
import type { Overrides } from '../types';

/**
 * Built-in template name → Template. The canonical e2e base dataset is
 * registered under the `e2e/base` invocation name. The perm-* minimal-data
 * templates cover the election + constituency permutations test family. The
 * `perm-*` invocation KEYS stay FLAT even though the perm template files live
 * under `e2e/perm/*`.
 */
export const BUILT_IN_TEMPLATES: Record<string, Template> = {
  default: defaultTemplate,
  'e2e/base': baseTemplate,
  'perm-1e1cg1co': perm1e1cg1coTemplate,
  'perm-2e-shared': perm2eSharedTemplate,
  'perm-2e-asymmetric': perm2eAsymmetricTemplate,
  'perm-startfromcg': permStartfromcgTemplate,
  'perm-disjoint-1co': permDisjoint1coTemplate,
  'perm-disable-election-1co': permDisableElection1coTemplate,
  'perm-disable-election-2co': permDisableElection2coTemplate,
  'perm-not-located-2e2cg': permNotLocated2e2cgTemplate,
  // 3 settings-permutation templates. Each carries its own distinct
  // externalIdPrefix ('e2e-perm-novapp-', 'e2e-perm-nocand-',
  // 'e2e-perm-notif-') for parallel safety across the wider suite.
  'perm-disable-voter-app': permDisableVoterAppTemplate,
  'perm-disable-candidate-app': permDisableCandidateAppTemplate,
  'perm-per-app-notifications': permPerAppNotificationsTemplate,
  // missing-nominations perm template. Distinct externalIdPrefix
  // 'e2e-perm-missnoms-' (parallel-safe across the perm chains).
  'perm-missing-nominations': permMissingNominationsTemplate,
  // localisation-positive perm template. Distinct externalIdPrefix
  // 'e2e-perm-l10n-pos-'. Uses the 3-locale staticSettings base (en/fi/sv)
  // directly — no runtime override. Spec exercises the langSelector
  // visible-and-switching surface + Finnish-translation authoring on q1/q3.
  'perm-localisation-positive': permLocalisationPositiveTemplate,

  // 9 settings-permutation templates. Each carries its own distinct
  // externalIdPrefix. Some specs additionally consume the
  // candidateSessionMinter helper to author per-perm Playwright storage-state
  // JSON files.
  'perm-answers-locked': permAnswersLockedTemplate,
  'perm-hide-hero': permHideHeroTemplate,
  // EPERM-09: renamed from the former perm-header-show-feedback key. Keeps
  // header.showFeedback and extends with the survey/feedback-popup result-view
  // surfaces.
  'show-feedback-survey': showFeedbackSurveyTemplate,
  'perm-header-show-help': permHeaderShowHelpTemplate,
  'perm-hide-all-nominations': permHideAllNominationsTemplate,
  'perm-hide-if-missing-answers': permHideIfMissingAnswersTemplate,
  'perm-hide-election-tags': permHideElectionTagsTemplate,
  'perm-hide-category-tags': permHideCategoryTagsTemplate,
  'perm-disable-allow-open': permDisableAllowOpenTemplate,

  // Phase 119 Plan 03 — 3 hand-authored perm templates whose layouts
  // buildMinimal cannot express (multi-category video / multi-type opinion /
  // org-own-answers). Each carries its own distinct externalIdPrefix
  // ('e2e-perm-qvid-', 'e2e-perm-iinfo-', 'e2e-perm-orgmatch-') for parallel
  // safety. Keys stay FLAT even though files live under e2e/perm/.
  'perm-question-video': permQuestionVideoTemplate,
  'perm-interactive-info': permInteractiveInfoTemplate,
  'perm-org-matching': permOrgMatchingTemplate,

  // Phase 119 Plan 04 — EPERM-11 consolidated access-gating perm. Covers
  // access.voterApp/candidateApp/underMaintenance via per-mode singleton
  // re-seed. Distinct externalIdPrefix 'e2e-perm-access-disable-'. The old
  // perm-disable-voter-app/candidate-app keys are RETAINED above because their
  // Phase-120-owned setup consumers still resolve them (Pitfall 3).
  'perm-access-disable': permAccessDisableTemplate
};

/**
 * Built-in template name → Overrides. Paired 1:1 with `BUILT_IN_TEMPLATES`
 * entries. When the CLI resolves a built-in name it ALSO looks up this map and
 * passes the overrides to `runPipeline`.
 *
 * Templates with no overrides register an empty object (`{}`) or are omitted
 * (`loadBuiltIns` falls back to `{}` when the key is missing).
 *
 * The `e2e/base` template ships with NO overrides — every row is expressed as
 * a `fixed[]` entry. The generators handle the fixed[] passthrough; no
 * content-shaping override is needed.
 */
export const BUILT_IN_OVERRIDES: Record<string, Overrides> = {
  default: defaultOverrides
};

// Re-exports for explicit consumer imports.
export { defaultOverrides, defaultTemplate } from './default';
export { BASE_APP_SETTINGS, baseTemplate } from './e2e/base';
export { perm1e1cg1coTemplate } from './e2e/perm/perm-1e1cg1co';
export { perm2eAsymmetricTemplate } from './e2e/perm/perm-2e-asymmetric';
export { perm2eSharedTemplate } from './e2e/perm/perm-2e-shared';
export { permAccessDisableTemplate } from './e2e/perm/perm-access-disable';
export { permAnswersLockedTemplate } from './e2e/perm/perm-answers-locked';
export { permDisableAllowOpenTemplate } from './e2e/perm/perm-disable-allow-open';
export { permDisableCandidateAppTemplate } from './e2e/perm/perm-disable-candidate-app';
export { permDisableElection1coTemplate } from './e2e/perm/perm-disable-election-1co';
export { permDisableElection2coTemplate } from './e2e/perm/perm-disable-election-2co';
export { permDisableVoterAppTemplate } from './e2e/perm/perm-disable-voter-app';
export { permDisjoint1coTemplate } from './e2e/perm/perm-disjoint-1co';
export { permHeaderShowHelpTemplate } from './e2e/perm/perm-header-show-help';
export { permHideAllNominationsTemplate } from './e2e/perm/perm-hide-all-nominations';
export { permHideCategoryTagsTemplate } from './e2e/perm/perm-hide-category-tags';
export { permHideElectionTagsTemplate } from './e2e/perm/perm-hide-election-tags';
export { permHideHeroTemplate } from './e2e/perm/perm-hide-hero';
export { permHideIfMissingAnswersTemplate } from './e2e/perm/perm-hide-if-missing-answers';
export { permInteractiveInfoTemplate } from './e2e/perm/perm-interactive-info';
export { permLocalisationPositiveTemplate } from './e2e/perm/perm-localisation-positive';
export { permMissingNominationsTemplate } from './e2e/perm/perm-missing-nominations';
export { permNotLocated2e2cgTemplate } from './e2e/perm/perm-not-located-2e2cg';
export { permOrgMatchingTemplate } from './e2e/perm/perm-org-matching';
export { permPerAppNotificationsTemplate } from './e2e/perm/perm-per-app-notifications';
export { permQuestionVideoTemplate } from './e2e/perm/perm-question-video';
export { permStartfromcgTemplate } from './e2e/perm/perm-startfromcg';
export { showFeedbackSurveyTemplate } from './e2e/perm/show-feedback-survey';
