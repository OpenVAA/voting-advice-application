/**
 * perm-disable-voter-app minimal-data template — Phase 89 Plan 04; ported to
 * `buildMinimal` helper in Phase 91 Plan 91-01 Task 2.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 candidates. The under-test setting
 * is `access.voterApp: false`, which causes the voter-app routes
 * (`/`, `/elections`) to render the MaintenancePage while the candidate-app
 * route (`/candidate`) remains available.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-4.md:36-42 (TIR4-PERM-01).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-novapp-'` per D-89-03
 * (distinct from the other 2 89-04 perm templates AND from the 88-03
 * perm-* family, enabling parallel-safe execution across the wider suite).
 *
 * Settings: spreads MINIMAL_BASE_APP_SETTINGS (helper default), then
 * overrides `access.voterApp: false` via settingsOverlay while keeping every
 * other access flag default. The helper's deep-merge preserves all base
 * access.* keys (Pitfall 9 — no JSONB-undefined keys).
 *
 * Port discipline (Phase 91 D-91-PD-03): assertions preserved byte-for-byte.
 * Existing spec at tests/tests/specs/perm/perm-disable-voter-app.spec.ts
 * asserts only voter-app maintenance / candidate-app login visibility —
 * does NOT depend on candidate/question external_ids.
 */

import { buildMinimal } from '../_helpers/buildMinimal';
import type { Template } from '../../template/types';

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
