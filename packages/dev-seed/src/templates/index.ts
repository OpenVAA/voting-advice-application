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

import { baseV1Template } from './baseV1';
import { defaultOverrides, defaultTemplate } from './default';
import { e2eTemplate } from './e2e';
import { perm1e1cg1coTemplate } from './permutations/perm-1e1cg1co';
import { perm2eAsymmetricTemplate } from './permutations/perm-2e-asymmetric';
import { perm2eSharedTemplate } from './permutations/perm-2e-shared';
import { permDisableCandidateAppTemplate } from './permutations/perm-disable-candidate-app';
import { permDisableElection1coTemplate } from './permutations/perm-disable-election-1co';
import { permDisableElection2coTemplate } from './permutations/perm-disable-election-2co';
import { permDisableVoterAppTemplate } from './permutations/perm-disable-voter-app';
import { permDisjoint1coTemplate } from './permutations/perm-disjoint-1co';
import { permNotLocated2e2cgTemplate } from './permutations/perm-not-located-2e2cg';
import { permPerAppNotificationsTemplate } from './permutations/perm-per-app-notifications';
import { permStartfromcgTemplate } from './permutations/perm-startfromcg';
import type { Template } from '../template/types';
import type { Overrides } from '../types';

/**
 * Built-in template name → Template. Plan 08 adds `e2e: e2eTemplate`.
 * Phase 88 Plan 01 adds `baseV1: baseV1Template` for the new mega-journey
 * (parallel landing alongside e2e per the parallel-setup principle).
 * Phase 88 Plan 03 adds 8 perm-* minimal-data templates for the new
 * election + constituency permutations test family (88-03-SCOPE.md:104-110).
 */
export const BUILT_IN_TEMPLATES: Record<string, Template> = {
  default: defaultTemplate,
  e2e: e2eTemplate,
  baseV1: baseV1Template,
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
  'perm-per-app-notifications': permPerAppNotificationsTemplate
};

/**
 * Built-in template name → D-25 Overrides. Paired 1:1 with
 * `BUILT_IN_TEMPLATES` entries. When the CLI resolves a built-in name it
 * ALSO looks up this map and passes the overrides to `runPipeline`.
 *
 * Templates with no overrides register an empty object (`{}`) or are omitted
 * (`loadBuiltIns` falls back to `{}` when the key is missing).
 *
 * The `e2e` template (Plan 08) ships with NO overrides — every row is
 * expressed as a `fixed[]` entry authored from 58-E2E-AUDIT.md. Phase 56's
 * generators handle the fixed[] passthrough; no content-shaping override is
 * needed.
 */
export const BUILT_IN_OVERRIDES: Record<string, Overrides> = {
  default: defaultOverrides
};

// Re-exports for explicit consumer imports.
export { BASE_V1_APP_SETTINGS, baseV1Template } from './baseV1';
export { defaultOverrides, defaultTemplate } from './default';
export { E2E_BASE_APP_SETTINGS, e2eTemplate } from './e2e';
export { perm1e1cg1coTemplate } from './permutations/perm-1e1cg1co';
export { perm2eAsymmetricTemplate } from './permutations/perm-2e-asymmetric';
export { perm2eSharedTemplate } from './permutations/perm-2e-shared';
export { permDisableCandidateAppTemplate } from './permutations/perm-disable-candidate-app';
export { permDisableElection1coTemplate } from './permutations/perm-disable-election-1co';
export { permDisableElection2coTemplate } from './permutations/perm-disable-election-2co';
export { permDisableVoterAppTemplate } from './permutations/perm-disable-voter-app';
export { permDisjoint1coTemplate } from './permutations/perm-disjoint-1co';
export { permNotLocated2e2cgTemplate } from './permutations/perm-not-located-2e2cg';
export { permPerAppNotificationsTemplate } from './permutations/perm-per-app-notifications';
export { permStartfromcgTemplate } from './permutations/perm-startfromcg';
