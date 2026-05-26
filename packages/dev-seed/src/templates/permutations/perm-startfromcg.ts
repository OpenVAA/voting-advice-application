/**
 * perm-startfromcg minimal-data template — Phase 88 Plan 03.
 *
 * Topology:
 *   - EL-1 → CG-1 with 2 leaf COs: co-1a, co-1b.
 *   - EL-2 → CG-2 with 5 COs (parent refs into CG-1):
 *       - co-1a1 parent=co-1a
 *       - co-1a2 parent=co-1a
 *       - co-1b1 parent=co-1b
 *       - co-1b2 parent=co-1b
 *       - co-1c no parent (orphan)
 *
 * The CG UUID is unknown at seed time; perm-startfromcg.spec.ts's beforeAll
 * resolves it via SupabaseAdminClient and writes via client.updateAppSettings
 * — mirror variant-startfromcg.setup.ts:18-23 + startfromcg.spec.ts:158-185.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:158-167
 *
 * Prefix discipline: `externalIdPrefix: 'test-perm-startfromcg-'` per
 * 88-03-SCOPE.md:104-110. Row external_ids bare; refs prefixed.
 *
 * Settings: MINIMAL_BASE_APP_SETTINGS verbatim — `elections.
 * startFromConstituencyGroup` is OMITTED entirely (HIGH-3 resolution; the CG
 * UUID is post-seed-resolved by the spec's beforeAll).
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

const P = 'test-perm-startfromcg-';

export const permStartfromcgTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL1] CG-1 parents' },
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
        external_id: 'el-2',
        name: { en: '[EL2] CG-2 leaves' },
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
        external_id: 'cg-1',
        name: { en: '[CG1] Parent regions' },
        sort_order: 0,
        is_generated: false,
        constituencies: [{ external_id: `${P}co-1a` }, { external_id: `${P}co-1b` }]
      },
      {
        external_id: 'cg-2',
        name: { en: '[CG2] Leaf municipalities' },
        sort_order: 1,
        is_generated: false,
        constituencies: [
          { external_id: `${P}co-1a1` },
          { external_id: `${P}co-1a2` },
          { external_id: `${P}co-1b1` },
          { external_id: `${P}co-1b2` },
          { external_id: `${P}co-1c` }
        ]
      }
    ]
  },

  constituencies: {
    count: 0,
    fixed: [
      { external_id: 'co-1a', name: { en: '[CO1A] Region A' }, sort_order: 0, is_generated: false },
      { external_id: 'co-1b', name: { en: '[CO1B] Region B' }, sort_order: 1, is_generated: false },
      {
        external_id: 'co-1a1',
        name: { en: '[CO1A1] Municipality A1' },
        sort_order: 2,
        is_generated: false,
        parent: { external_id: `${P}co-1a` }
      },
      {
        external_id: 'co-1a2',
        name: { en: '[CO1A2] Municipality A2' },
        sort_order: 3,
        is_generated: false,
        parent: { external_id: `${P}co-1a` }
      },
      {
        external_id: 'co-1b1',
        name: { en: '[CO1B1] Municipality B1' },
        sort_order: 4,
        is_generated: false,
        parent: { external_id: `${P}co-1b` }
      },
      {
        external_id: 'co-1b2',
        name: { en: '[CO1B2] Municipality B2' },
        sort_order: 5,
        is_generated: false,
        parent: { external_id: `${P}co-1b` }
      },
      {
        external_id: 'co-1c',
        name: { en: '[CO1C] Orphan municipality' },
        sort_order: 6,
        is_generated: false
        // no parent — orphan
      }
    ]
  },

  organizations: { count: 0, fixed: buildOrganizations() },
  question_categories: { count: 0, fixed: buildQuestionCategories() },
  questions: { count: 0, fixed: buildQuestions(P) },

  candidates: {
    count: 0,
    fixed: [
      buildCandidate(P, 1, 'A', 'ca-1-1a', 0),
      buildCandidate(P, 2, 'A', 'ca-2-1a', 1),
      buildCandidate(P, 1, 'B', 'ca-1-1b', 2),
      buildCandidate(P, 2, 'B', 'ca-2-1b', 3),
      buildCandidate(P, 1, 'E', 'ca-1-1a1', 4),
      buildCandidate(P, 2, 'E', 'ca-2-1a1', 5),
      buildCandidate(P, 1, 'F', 'ca-1-1a2', 6),
      buildCandidate(P, 2, 'F', 'ca-2-1a2', 7),
      buildCandidate(P, 1, 'G', 'ca-1-1b1', 8),
      buildCandidate(P, 2, 'G', 'ca-2-1b1', 9),
      buildCandidate(P, 1, 'H', 'ca-1-1b2', 10),
      buildCandidate(P, 2, 'H', 'ca-2-1b2', 11),
      buildCandidate(P, 1, 'O', 'ca-1-1c', 12),
      buildCandidate(P, 2, 'O', 'ca-2-1c', 13)
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      ...buildElectionConstituencyNoms(P, 'el-1', 'co-1a', ['ca-1-1a', 'ca-2-1a'], 1),
      ...buildElectionConstituencyNoms(P, 'el-1', 'co-1b', ['ca-1-1b', 'ca-2-1b'], 10),
      ...buildElectionConstituencyNoms(P, 'el-2', 'co-1a1', ['ca-1-1a1', 'ca-2-1a1'], 20),
      ...buildElectionConstituencyNoms(P, 'el-2', 'co-1a2', ['ca-1-1a2', 'ca-2-1a2'], 30),
      ...buildElectionConstituencyNoms(P, 'el-2', 'co-1b1', ['ca-1-1b1', 'ca-2-1b1'], 40),
      ...buildElectionConstituencyNoms(P, 'el-2', 'co-1b2', ['ca-1-1b2', 'ca-2-1b2'], 50),
      ...buildElectionConstituencyNoms(P, 'el-2', 'co-1c', ['ca-1-1c', 'ca-2-1c'], 60)
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: MINIMAL_BASE_APP_SETTINGS }]
  }
};

export default permStartfromcgTemplate;
