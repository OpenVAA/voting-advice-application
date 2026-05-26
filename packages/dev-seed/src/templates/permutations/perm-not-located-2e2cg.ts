/**
 * perm-not-located-2e2cg minimal-data template — Phase 88 Plan 03.
 *
 * Topology: 2 elections with 2 disjoint CGs × 2 COs each.
 *   - EL-1 → CG-1 → co-1a, co-1b
 *   - EL-2 → CG-2 → co-2a, co-2b
 *
 * Dataset for the 5-test voter-not-located-redirect rebuild
 * (perm-not-located-2e2cg.spec.ts). The shape forces both selector pages to
 * render — getImpliedElectionIds cannot auto-imply with 2 elections having
 * disjoint constituency groups (mirrors the existing Ne-Nc variant's role
 * in voter-not-located-redirect.spec.ts).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:198-209
 *
 * Prefix discipline: ROW PREFIX is `test-perm-notloc-` per
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

const P = 'test-perm-notloc-';

export const permNotLocated2e2cgTemplate: Template = {
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
        constituencies: [{ external_id: `${P}co-1a` }, { external_id: `${P}co-1b` }]
      },
      {
        external_id: `${P}cg-2`,
        name: { en: '[CG2] Municipal' },
        sort_order: 1,
        is_generated: false,
        constituencies: [{ external_id: `${P}co-2a` }, { external_id: `${P}co-2b` }]
      }
    ]
  },

  constituencies: {
    count: 0,
    fixed: [
      { external_id: `${P}co-1a`, name: { en: '[CO1A] Region North' }, sort_order: 0, is_generated: false },
      { external_id: `${P}co-1b`, name: { en: '[CO1B] Region South' }, sort_order: 1, is_generated: false },
      { external_id: `${P}co-2a`, name: { en: '[CO2A] Municipal East' }, sort_order: 2, is_generated: false },
      { external_id: `${P}co-2b`, name: { en: '[CO2B] Municipal West' }, sort_order: 3, is_generated: false }
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
      buildCandidate(P, 1, 'B', 'ca-1-1b', 2),
      buildCandidate(P, 2, 'B', 'ca-2-1b', 3),
      buildCandidate(P, 1, 'C', 'ca-1-2a', 4),
      buildCandidate(P, 2, 'C', 'ca-2-2a', 5),
      buildCandidate(P, 1, 'D', 'ca-1-2b', 6),
      buildCandidate(P, 2, 'D', 'ca-2-2b', 7)
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      ...buildElectionConstituencyNoms(P, 'el-1', 'co-1a', ['ca-1-1a', 'ca-2-1a'], 1),
      ...buildElectionConstituencyNoms(P, 'el-1', 'co-1b', ['ca-1-1b', 'ca-2-1b'], 10),
      ...buildElectionConstituencyNoms(P, 'el-2', 'co-2a', ['ca-1-2a', 'ca-2-2a'], 20),
      ...buildElectionConstituencyNoms(P, 'el-2', 'co-2b', ['ca-1-2b', 'ca-2-2b'], 30)
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: `${P}app-settings`, settings: MINIMAL_BASE_APP_SETTINGS }]
  }
};

export default permNotLocated2e2cgTemplate;
