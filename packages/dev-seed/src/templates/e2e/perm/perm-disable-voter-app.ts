/**
 * perm-disable-voter-app minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 candidates. The under-test setting is `access.voterApp: false`, which causes the voter-app routes (`/`, `/elections`) to render the MaintenancePage while the candidate-app route (`/candidate`) remains available.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-novapp-'` (distinct from every other perm template, enabling parallel-safe execution across the wider suite).
 *
 * Settings: spreads MINIMAL_BASE_APP_SETTINGS (helper default), then overrides `access.voterApp: false` via settingsOverlay while keeping every other access flag default. The helper's deep-merge preserves all base access.* keys (no JSONB-undefined keys).
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-novapp-';

export const permDisableVoterAppTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 2,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    access: { voterApp: false }
  }
});

export default permDisableVoterAppTemplate;
