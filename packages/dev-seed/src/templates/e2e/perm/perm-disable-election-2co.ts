/**
 * perm-disable-election-2co minimal-data template.
 *
 * Topology: 2 elections share 1 CG with 2 COs; `elections.disallowSelection:
 * true`. No election selector shown, but constituency selector IS shown (2
 * CO options for the implied combined election scope).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-disable-elec-2co-'`. Row
 * external_ids bare; refs prefixed.
 *
 * Settings: MINIMAL_BASE_APP_SETTINGS spread with elections.disallowSelection:
 * true override.
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

const P = 'e2e-perm-disable-elec-2co-';

const APP_SETTINGS = {
  ...MINIMAL_BASE_APP_SETTINGS,
  elections: {
    ...MINIMAL_BASE_APP_SETTINGS.elections,
    disallowSelection: true
  }
} as const;

export const permDisableElection2coTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL1] First election' },
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
        name: { en: '[EL2] Second election' },
        short_name: { en: 'EL2' },
        election_type: 'local',
        election_date: '2026-06-15',
        sort_order: 1,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-1` }]
      }
    ]
  },

  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'cg-1',
        name: { en: '[CG1] Shared group' },
        sort_order: 0,
        is_generated: false,
        constituencies: [{ external_id: `${P}co-1a` }, { external_id: `${P}co-1b` }]
      }
    ]
  },

  constituencies: {
    count: 0,
    fixed: [
      { external_id: 'co-1a', name: { en: '[CO1A] North' }, sort_order: 0, is_generated: false },
      { external_id: 'co-1b', name: { en: '[CO1B] South' }, sort_order: 1, is_generated: false }
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
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'B', idSuffix: 'ca-2-1b', sortOrder: 3, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) })
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-1', constituencyIdSuffix: 'co-1a', candidateIdSuffixes: ['ca-1-1a', 'ca-2-1a'], electionSymbolStart: 1 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-1', constituencyIdSuffix: 'co-1b', candidateIdSuffixes: ['ca-1-1b', 'ca-2-1b'], electionSymbolStart: 10 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-2', constituencyIdSuffix: 'co-1a', candidateIdSuffixes: ['ca-1-1a', 'ca-2-1a'], electionSymbolStart: 20 }),
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-2', constituencyIdSuffix: 'co-1b', candidateIdSuffixes: ['ca-1-1b', 'ca-2-1b'], electionSymbolStart: 30 })
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: APP_SETTINGS }]
  }
};

export default permDisableElection2coTemplate;
