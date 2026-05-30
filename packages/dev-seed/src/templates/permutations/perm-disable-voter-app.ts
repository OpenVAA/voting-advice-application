/**
 * perm-disable-voter-app minimal-data template — Phase 89 Plan 04.
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
 * Settings: spreads MINIMAL_BASE_APP_SETTINGS, then overrides
 * `access.voterApp: false` while keeping every other access flag default
 * (candidateApp: true, adminApp: true, underMaintenance: false,
 * answersLocked: false).
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

const P = 'e2e-perm-novapp-';

const APP_SETTINGS = {
  ...MINIMAL_BASE_APP_SETTINGS,
  access: {
    ...MINIMAL_BASE_APP_SETTINGS.access,
    voterApp: false
  }
} as const;

export const permDisableVoterAppTemplate: Template = {
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
      }
    ]
  },

  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'cg-1',
        name: { en: '[CG1] Only group' },
        sort_order: 0,
        is_generated: false,
        constituencies: [{ external_id: `${P}co-1a` }]
      }
    ]
  },

  constituencies: {
    count: 0,
    fixed: [
      {
        external_id: 'co-1a',
        name: { en: '[CO1A] Only constituency' },
        sort_order: 0,
        is_generated: false
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
      buildCandidate({ prefix: P, orgN: 2, candLetter: 'A', idSuffix: 'ca-2-1a', sortOrder: 1, answersByExternalId: buildStandardCandidateAnswers({ prefix: P }) })
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      ...buildElectionConstituencyNoms({ prefix: P, electionIdSuffix: 'el-1', constituencyIdSuffix: 'co-1a', candidateIdSuffixes: ['ca-1-1a', 'ca-2-1a'], electionSymbolStart: 1 })
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: APP_SETTINGS }]
  }
};

export default permDisableVoterAppTemplate;
