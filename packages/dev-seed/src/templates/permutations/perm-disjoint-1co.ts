/**
 * perm-disjoint-1co minimal-data template — Phase 88 Plan 03.
 *
 * Topology: 2 elections with DISJOINT constituency groups.
 *   - EL-1 → CG-1 → co-1a, co-1b
 *   - EL-2 → CG-2 → co-2a, co-2b
 *
 * Note on the `-1co` suffix: the original spec (refactor-doc:171-181) said
 * "1 CO per CG", but the app auto-implies a single-CO CG (no picker rendered),
 * which makes the spec's "show constituency picker for CG-1" contract
 * unobservable. To exercise the picker contract while still minimal, each CG
 * has TWO COs. The slug stays `perm-disjoint-1co` to preserve external_id
 * prefix continuity with the rest of Plan 88-03; the doc-comment is
 * authoritative on the actual shape.
 *
 * Election selector shown. When only EL-1 selected, constituency-selection
 * step shows only CG-1 picker (2 options). When both selected, both pickers
 * shown and continue is disabled until both are filled.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:171-181 (interpretive —
 * picker contract requires ≥2 COs per CG, see note above).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-disjoint-1co-'` per
 * 88-03-SCOPE.md:104-110. Row external_ids bare; refs prefixed.
 *
 * Settings: MINIMAL_BASE_APP_SETTINGS verbatim.
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
import type { Template } from '../../template/types';

const P = 'e2e-perm-disjoint-1co-';

export const permDisjoint1coTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
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
        external_id: 'el-2',
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
        external_id: 'cg-1',
        name: { en: '[CG1] Region' },
        sort_order: 0,
        is_generated: false,
        constituencies: [{ external_id: `${P}co-1a` }, { external_id: `${P}co-1b` }]
      },
      {
        external_id: 'cg-2',
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
      { external_id: 'co-1a', name: { en: '[CO1A] Region North' }, sort_order: 0, is_generated: false },
      { external_id: 'co-1b', name: { en: '[CO1B] Region South' }, sort_order: 1, is_generated: false },
      { external_id: 'co-2a', name: { en: '[CO2A] Municipal East' }, sort_order: 2, is_generated: false },
      { external_id: 'co-2b', name: { en: '[CO2B] Municipal West' }, sort_order: 3, is_generated: false }
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
      buildCandidate({ prefix: P, orgN: 1, candLetter: 'C', idSuffix: 'ca-1-2a', sortOrder: 4, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'C', idSuffix: 'ca-2-2a', sortOrder: 5, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 1, candLetter: 'D', idSuffix: 'ca-1-2b', sortOrder: 6, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) }),
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'D', idSuffix: 'ca-2-2b', sortOrder: 7, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) })
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-1', constituencyIdSuffix: 'co-1a', candidateIdSuffixes: ['ca-1-1a', 'ca-2-1a'], electionSymbolStart: 1 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-1', constituencyIdSuffix: 'co-1b', candidateIdSuffixes: ['ca-1-1b', 'ca-2-1b'], electionSymbolStart: 5 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-2', constituencyIdSuffix: 'co-2a', candidateIdSuffixes: ['ca-1-2a', 'ca-2-2a'], electionSymbolStart: 10 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-2', constituencyIdSuffix: 'co-2b', candidateIdSuffixes: ['ca-1-2b', 'ca-2-2b'], electionSymbolStart: 15 })
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: MINIMAL_BASE_APP_SETTINGS }]
  }
};

export default permDisjoint1coTemplate;
