/**
 * perm-2e-asymmetric minimal-data template.
 *
 * Topology:
 *   - EL-1 attached to CG-1 (co-1a only).
 *   - EL-2 attached to CG-2 (co-2a + co-2b) AND ALSO to CG-1 (co-1a).
 *
 * When both elections selected, election selector shown; constituency-
 * selection step shows CG-1 prefilled (only co-1a auto-implied) and an
 * active CG-2 picker.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-2e-asymmetric-'`. Row
 * external_ids bare; refs prefixed.
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
import type { Template } from '../../../template/types';

const P = 'e2e-perm-2e-asymmetric-';

export const perm2eAsymmetricTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL1] CG-1 only' },
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
        name: { en: '[EL2] CG-1 + CG-2' },
        short_name: { en: 'EL2' },
        election_type: 'local',
        election_date: '2026-06-15',
        sort_order: 1,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-1` }, { external_id: `${P}cg-2` }]
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
        constituencies: [{ external_id: `${P}co-1a` }]
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
      { external_id: 'co-1a', name: { en: '[CO1A] North' }, sort_order: 0, is_generated: false },
      { external_id: 'co-2a', name: { en: '[CO2A] Municipal East' }, sort_order: 1, is_generated: false },
      { external_id: 'co-2b', name: { en: '[CO2B] Municipal West' }, sort_order: 2, is_generated: false }
    ]
  },

  organizations: { count: 0, fixed: buildOrganizations() },
  question_categories: { count: 0, fixed: buildQuestionCategories() },
  questions: { count: 0, fixed: buildQuestions({ prefix: P }) },

  candidates: {
    count: 0,
    fixed: [
      buildCandidate({
        prefix: P,
        orgN: 1,
        candLetter: 'A',
        idSuffix: 'ca-1-1a',
        sortOrder: 0,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'A',
        idSuffix: 'ca-2-1a',
        sortOrder: 1,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 1,
        candLetter: 'C',
        idSuffix: 'ca-1-2a',
        sortOrder: 2,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'C',
        idSuffix: 'ca-2-2a',
        sortOrder: 3,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 1,
        candLetter: 'D',
        idSuffix: 'ca-1-2b',
        sortOrder: 4,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'D',
        idSuffix: 'ca-2-2b',
        sortOrder: 5,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      })
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      ...buildElectionConstituencyNoms({
        prefix: P,
        electionIdSuffix: 'el-1',
        constituencyIdSuffix: 'co-1a',
        candidateIdSuffixes: ['ca-1-1a', 'ca-2-1a'],
        electionSymbolStart: 1
      }),
      ...buildElectionConstituencyNoms({
        prefix: P,
        electionIdSuffix: 'el-2',
        constituencyIdSuffix: 'co-1a',
        candidateIdSuffixes: ['ca-1-1a', 'ca-2-1a'],
        electionSymbolStart: 10
      }),
      ...buildElectionConstituencyNoms({
        prefix: P,
        electionIdSuffix: 'el-2',
        constituencyIdSuffix: 'co-2a',
        candidateIdSuffixes: ['ca-1-2a', 'ca-2-2a'],
        electionSymbolStart: 20
      }),
      ...buildElectionConstituencyNoms({
        prefix: P,
        electionIdSuffix: 'el-2',
        constituencyIdSuffix: 'co-2b',
        candidateIdSuffixes: ['ca-1-2b', 'ca-2-2b'],
        electionSymbolStart: 30
      })
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: MINIMAL_BASE_APP_SETTINGS }]
  }
};

export default perm2eAsymmetricTemplate;
