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
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-startfromcg-'` per
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
  buildStandardCandidateAnswers,
  MINIMAL_BASE_APP_SETTINGS
} from './shared';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-startfromcg-';

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
  questions: { count: 0, fixed: buildQuestions({ prefix: P }) },

  candidates: {
    count: 0,
    fixed: [
      buildCandidate({ prefix: P, orgN: 1, candLetter: 'A', idSuffix: 'ca-1-1a', sortOrder: 0, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'A', idSuffix: 'ca-2-1a', sortOrder: 1, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 1, candLetter: 'B', idSuffix: 'ca-1-1b', sortOrder: 2, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'B', idSuffix: 'ca-2-1b', sortOrder: 3, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 1, candLetter: 'E', idSuffix: 'ca-1-1a1', sortOrder: 4, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'E', idSuffix: 'ca-2-1a1', sortOrder: 5, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 1, candLetter: 'F', idSuffix: 'ca-1-1a2', sortOrder: 6, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'F', idSuffix: 'ca-2-1a2', sortOrder: 7, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 1, candLetter: 'G', idSuffix: 'ca-1-1b1', sortOrder: 8, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'G', idSuffix: 'ca-2-1b1', sortOrder: 9, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 1, candLetter: 'H', idSuffix: 'ca-1-1b2', sortOrder: 10, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'H', idSuffix: 'ca-2-1b2', sortOrder: 11, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 1, candLetter: 'O', idSuffix: 'ca-1-1c', sortOrder: 12, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'O', idSuffix: 'ca-2-1c', sortOrder: 13, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) })
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-1', constituencyIdSuffix: 'co-1a', candidateIdSuffixes: ['ca-1-1a', 'ca-2-1a'], electionSymbolStart: 1 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-1', constituencyIdSuffix: 'co-1b', candidateIdSuffixes: ['ca-1-1b', 'ca-2-1b'], electionSymbolStart: 10 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-2', constituencyIdSuffix: 'co-1a1', candidateIdSuffixes: ['ca-1-1a1', 'ca-2-1a1'], electionSymbolStart: 20 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-2', constituencyIdSuffix: 'co-1a2', candidateIdSuffixes: ['ca-1-1a2', 'ca-2-1a2'], electionSymbolStart: 30 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-2', constituencyIdSuffix: 'co-1b1', candidateIdSuffixes: ['ca-1-1b1', 'ca-2-1b1'], electionSymbolStart: 40 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-2', constituencyIdSuffix: 'co-1b2', candidateIdSuffixes: ['ca-1-1b2', 'ca-2-1b2'], electionSymbolStart: 50 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-2', constituencyIdSuffix: 'co-1c', candidateIdSuffixes: ['ca-1-1c', 'ca-2-1c'], electionSymbolStart: 60 })
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: MINIMAL_BASE_APP_SETTINGS }]
  }
};

export default permStartfromcgTemplate;
