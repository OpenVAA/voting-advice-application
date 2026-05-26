/**
 * perm-disjoint-1co minimal-data template — Phase 88 Plan 03.
 *
 * Topology: 2 elections with DISJOINT constituency groups.
 *   - EL-1 → CG-1 → co-1a
 *   - EL-2 → CG-2 → co-2a
 *
 * Election selector shown. When only EL-1 selected, constituency-selection
 * step shows only CG-1 picker. When both selected, both pickers shown and
 * continue is disabled until both are filled.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:171-181
 *
 * Prefix discipline: ROW PREFIX is `test-perm-disjoint-1co-` per
 * 88-03-SCOPE.md:104-110. Empty-prefix + pre-prefixed pattern (see Risk #6).
 *
 * Settings: MINIMAL_BASE_APP_SETTINGS verbatim.
 */

import {
  buildCandidate,
  buildElectionConstituencyNoms,
  buildOrganizations,
  buildQuestionCategories,
  buildQuestions,
  MINIMAL_BASE_APP_SETTINGS
} from './shared';
import type { Template } from '../../template/types';

const P = 'test-perm-disjoint-1co-';

export const permDisjoint1coTemplate: Template = {
  seed: 42,
  externalIdPrefix: '',
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: `${P}el-1`,
        name: { en: '[EL1] Region election' },
        short_name: { en: 'EL1' },
        election_type: 'general',
        election_date: '2026-06-15',
        sort_order: 0,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-1` }]
      },
      {
        external_id: `${P}el-2`,
        name: { en: '[EL2] Municipal election' },
        short_name: { en: 'EL2' },
        election_type: 'local',
        election_date: '2026-06-15',
        sort_order: 1,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-2` }]
      }
    ]
  },

  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: `${P}cg-1`,
        name: { en: '[CG1] Region' },
        sort_order: 0,
        is_generated: false,
        constituencies: [{ external_id: `${P}co-1a` }]
      },
      {
        external_id: `${P}cg-2`,
        name: { en: '[CG2] Municipal' },
        sort_order: 1,
        is_generated: false,
        constituencies: [{ external_id: `${P}co-2a` }]
      }
    ]
  },

  constituencies: {
    count: 0,
    fixed: [
      { external_id: `${P}co-1a`, name: { en: '[CO1A] Region North' }, sort_order: 0, is_generated: false },
      { external_id: `${P}co-2a`, name: { en: '[CO2A] Municipal East' }, sort_order: 1, is_generated: false }
    ]
  },

  organizations: { count: 0, fixed: buildOrganizations(P) },
  question_categories: { count: 0, fixed: buildQuestionCategories(P) },
  questions: { count: 0, fixed: buildQuestions(P) },

  candidates: {
    count: 0,
    fixed: [
      buildCandidate(P, 1, 'A', 'ca-1-1a', 0),
      buildCandidate(P, 2, 'A', 'ca-2-1a', 1),
      buildCandidate(P, 1, 'C', 'ca-1-2a', 2),
      buildCandidate(P, 2, 'C', 'ca-2-2a', 3)
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      ...buildElectionConstituencyNoms(P, 'el-1', 'co-1a', ['ca-1-1a', 'ca-2-1a'], 1),
      ...buildElectionConstituencyNoms(P, 'el-2', 'co-2a', ['ca-1-2a', 'ca-2-2a'], 10)
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: `${P}app-settings`, settings: MINIMAL_BASE_APP_SETTINGS }]
  }
};

export default permDisjoint1coTemplate;
