/**
 * perm-disable-candidate-app minimal-data template — Phase 89 Plan 04;
 * ported to `buildMinimal` helper in Phase 91 Plan 91-01 Task 2.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 candidates. The under-test setting
 * is `access.candidateApp: false`, which causes the candidate-app route
 * (`/candidate`) to render the MaintenancePage while the voter-app routes
 * (`/`, `/elections`) remain available.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-4.md:44-50 (TIR4-PERM-02).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-nocand-'` per D-89-03
 * (distinct from the other 2 89-04 perm templates AND from the 88-03
 * perm-* family, enabling parallel-safe execution across the wider suite).
 *
 * Settings: spreads MINIMAL_BASE_APP_SETTINGS (helper default), then
 * overrides `access.candidateApp: false` via settingsOverlay. The helper's
 * deep-merge preserves all base access.* keys (Pitfall 9).
 *
 * Port discipline (Phase 91 D-91-PD-03): assertions preserved byte-for-byte.
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
