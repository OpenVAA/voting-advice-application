/**
 * perm-disable-candidate-app minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 candidates. The under-test setting
 * is `access.candidateApp: false`, which causes the candidate-app route
 * (`/candidate`) to render the MaintenancePage while the voter-app routes
 * (`/`, `/elections`) remain available.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-nocand-'` (distinct from
 * every other perm template, enabling parallel-safe execution across the
 * wider suite).
 *
 * Settings: spreads MINIMAL_BASE_APP_SETTINGS (helper default), then
 * overrides `access.candidateApp: false` via settingsOverlay. The helper's
 * deep-merge preserves all base access.* keys.
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-nocand-';

export const permDisableCandidateAppTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 2,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    access: { candidateApp: false }
  }
});

export default permDisableCandidateAppTemplate;
