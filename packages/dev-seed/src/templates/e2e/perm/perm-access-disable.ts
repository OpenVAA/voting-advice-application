/**
 * perm-access-disable consolidated minimal-data template.
 *
 * Consolidates the former `perm-disable-voter-app` + `perm-disable-candidate-app` templates into a single access-gating perm. The consolidated spec re-seeds this app_settings singleton per sub-test to exercise each of the three access modes:
 *   - `access.voterApp: false`        — voter-app routes (`/`, `/elections`) render the MaintenancePage.
 *   - `access.candidateApp: false`    — candidate-app route (`/candidate`) renders the MaintenancePage.
 *   - `access.underMaintenance: true` — the whole app renders the MaintenancePage.
 *
 * The template ships a single base posture (`access.voterApp: false`); the spec re-seeds the singleton per mode via `settingsOverlay` at setup time, matching the perm-singleton re-seed pattern. All three `access.*` flags are plain app-availability toggles seeded into the local test DB's app_settings — they gate maintenance-page display, NOT authentication or authorization.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 candidates, 1 opinion Likert-5 question. A single Likert question suffices, so `buildMinimal` is used.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-access-disable-'` (distinct from every other perm template, enabling parallel-safe execution across the wider suite).
 *
 * Settings: spreads MINIMAL_BASE_APP_SETTINGS (helper default), then overrides the access flags via settingsOverlay. The helper's deep-merge preserves every other access.* key (no JSONB-undefined keys).
 */

import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-access-disable-';

export const permAccessDisableTemplate: Template = buildMinimal({
  externalIdPrefix: P,
  candidates: 2,
  opinionQuestions: 1,
  infoQuestions: 0,
  settingsOverlay: {
    access: { voterApp: false, candidateApp: true, underMaintenance: false }
  }
});

export default permAccessDisableTemplate;
