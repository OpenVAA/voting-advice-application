/**
 * Built-in template registry. Plan 05 CLI's `loadBuiltIns` dynamically imports
 * this module (via `../templates/index.js`) and reads both `BUILT_IN_TEMPLATES`
 * and `BUILT_IN_OVERRIDES`. Plan 06 (this plan) populates the maps with the
 * `default` entry; Plan 08 extends with `e2e`.
 *
 * The map-based design means a new built-in template ships in two edits:
 *   1. Add the template declaration under `packages/dev-seed/src/templates/`.
 *   2. Register the name in both maps below (and matching overrides if any).
 *
 * The CLI resolves a `--template <name>` arg by looking up `BUILT_IN_TEMPLATES`
 * first; a miss falls through to filesystem-path resolution (D-58-09).
 * `BUILT_IN_OVERRIDES` is consulted only after a successful built-in match so
 * the pipeline receives the per-template override map at `runPipeline(tpl, ov)`.
 */

import { defaultOverrides, defaultTemplate } from './default';
import { baseTemplate } from './e2e/base';
import { perm1e1cg1coTemplate } from './e2e/perm/perm-1e1cg1co';
import { perm2eAsymmetricTemplate } from './e2e/perm/perm-2e-asymmetric';
import { perm2eSharedTemplate } from './e2e/perm/perm-2e-shared';
import { permAnswersLockedTemplate } from './e2e/perm/perm-answers-locked';
import { permDisableAllowOpenTemplate } from './e2e/perm/perm-disable-allow-open';
import { permDisableCandidateAppTemplate } from './e2e/perm/perm-disable-candidate-app';
import { permDisableElection1coTemplate } from './e2e/perm/perm-disable-election-1co';
import { permDisableElection2coTemplate } from './e2e/perm/perm-disable-election-2co';
import { permDisableVoterAppTemplate } from './e2e/perm/perm-disable-voter-app';
import { permDisjoint1coTemplate } from './e2e/perm/perm-disjoint-1co';
import { permHeaderShowFeedbackTemplate } from './e2e/perm/perm-header-show-feedback';
import { permHeaderShowHelpTemplate } from './e2e/perm/perm-header-show-help';
import { permHideAllNominationsTemplate } from './e2e/perm/perm-hide-all-nominations';
import { permHideCategoryTagsTemplate } from './e2e/perm/perm-hide-category-tags';
import { permHideElectionTagsTemplate } from './e2e/perm/perm-hide-election-tags';
import { permHideHeroTemplate } from './e2e/perm/perm-hide-hero';
import { permHideIfMissingAnswersTemplate } from './e2e/perm/perm-hide-if-missing-answers';
import { permLocalisationPositiveTemplate } from './e2e/perm/perm-localisation-positive';
import { permMissingNominationsTemplate } from './e2e/perm/perm-missing-nominations';
import { permNotLocated2e2cgTemplate } from './e2e/perm/perm-not-located-2e2cg';
import { permPerAppNotificationsTemplate } from './e2e/perm/perm-per-app-notifications';
import { permStartfromcgTemplate } from './e2e/perm/perm-startfromcg';
import type { Template } from '../template/types';
import type { Overrides } from '../types';

/**
 * Built-in template name → Template. The canonical e2e base dataset is
 * registered under the `e2e/base` invocation name (Phase 93 Plan 02 / D-01;
 * formerly `base`). The old bare `e2e` template name is RETIRED — its
 * dataset was discarded and replaced by the base dataset.
 * Phase 88 Plan 03 adds 8 perm-* minimal-data templates for the new
 * election + constituency permutations test family (88-03-SCOPE.md:104-110).
 * Per FLAG-4, the `perm-*` invocation KEYS stay FLAT even though the perm
 * template files now live under `e2e/perm/*`.
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
  // Phase 89 Plan 04 — 3 settings-permutation templates per TIR4:34-54.
  // Each carries its own distinct externalIdPrefix ('e2e-perm-novapp-',
  // 'e2e-perm-nocand-', 'e2e-perm-notif-') per D-89-03 for parallel safety
  // across the wider suite.
  'perm-disable-voter-app': permDisableVoterAppTemplate,
  'perm-disable-candidate-app': permDisableCandidateAppTemplate,
  'perm-per-app-notifications': permPerAppNotificationsTemplate,
  // Phase 90 Plan 02 — missing-nominations TIR5:15-26 perm template.
  // Distinct externalIdPrefix 'e2e-perm-missnoms-' per D-90-01 (parallel-safe
  // across the 89-04 + future 90-03/04 perm chains).
  'perm-missing-nominations': permMissingNominationsTemplate,
  // Phase 90 Plan 04 — localisation-positive TIR5:52-95 perm template.
  // Distinct externalIdPrefix 'e2e-perm-l10n-pos-' per D-90-01. Uses the
  // 3-locale staticSettings base (en/fi/sv) directly — no runtime override.
  // Spec exercises the langSelector visible-and-switching surface +
  // Finnish-translation authoring on q1/q3.
  'perm-localisation-positive': permLocalisationPositiveTemplate,

  // Phase 91 Plan 02 — 9 new TIR6 Group A settings-permutation templates.
  // Each carries its own distinct externalIdPrefix per D-91-PD-05 +
  // RESEARCH §"Playwright Project Chain". A1/A2/A9 specs additionally
  // consume the candidateSessionMinter helper (Plan 91-01 Task 3) per
  // D-91-PD-06 to author per-perm Playwright storage-state JSON files.
  'perm-answers-locked': permAnswersLockedTemplate,
  'perm-hide-hero': permHideHeroTemplate,
  'perm-header-show-feedback': permHeaderShowFeedbackTemplate,
  'perm-header-show-help': permHeaderShowHelpTemplate,
  'perm-hide-all-nominations': permHideAllNominationsTemplate,
  'perm-hide-if-missing-answers': permHideIfMissingAnswersTemplate,
  'perm-hide-election-tags': permHideElectionTagsTemplate,
  'perm-hide-category-tags': permHideCategoryTagsTemplate,
  'perm-disable-allow-open': permDisableAllowOpenTemplate
};

/**
 * Built-in template name → D-25 Overrides. Paired 1:1 with
 * `BUILT_IN_TEMPLATES` entries. When the CLI resolves a built-in name it
 * ALSO looks up this map and passes the overrides to `runPipeline`.
 *
 * Templates with no overrides register an empty object (`{}`) or are omitted
 * (`loadBuiltIns` falls back to `{}` when the key is missing).
 *
 * The `e2e/base` template ships with NO overrides — every row is expressed as
 * a `fixed[]` entry. Phase 56's generators handle the fixed[] passthrough; no
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
export { permAnswersLockedTemplate } from './e2e/perm/perm-answers-locked';
export { permDisableAllowOpenTemplate } from './e2e/perm/perm-disable-allow-open';
export { permDisableCandidateAppTemplate } from './e2e/perm/perm-disable-candidate-app';
export { permDisableElection1coTemplate } from './e2e/perm/perm-disable-election-1co';
export { permDisableElection2coTemplate } from './e2e/perm/perm-disable-election-2co';
export { permDisableVoterAppTemplate } from './e2e/perm/perm-disable-voter-app';
export { permDisjoint1coTemplate } from './e2e/perm/perm-disjoint-1co';
export { permHeaderShowFeedbackTemplate } from './e2e/perm/perm-header-show-feedback';
export { permHeaderShowHelpTemplate } from './e2e/perm/perm-header-show-help';
export { permHideAllNominationsTemplate } from './e2e/perm/perm-hide-all-nominations';
export { permHideCategoryTagsTemplate } from './e2e/perm/perm-hide-category-tags';
export { permHideElectionTagsTemplate } from './e2e/perm/perm-hide-election-tags';
export { permHideHeroTemplate } from './e2e/perm/perm-hide-hero';
export { permHideIfMissingAnswersTemplate } from './e2e/perm/perm-hide-if-missing-answers';
export { permLocalisationPositiveTemplate } from './e2e/perm/perm-localisation-positive';
export { permMissingNominationsTemplate } from './e2e/perm/perm-missing-nominations';
export { permNotLocated2e2cgTemplate } from './e2e/perm/perm-not-located-2e2cg';
export { permPerAppNotificationsTemplate } from './e2e/perm/perm-per-app-notifications';
export { permStartfromcgTemplate } from './e2e/perm/perm-startfromcg';
