/**
 * perm-disable-election-2co minimal-data template — Phase 88 Plan 03.
 *
 * Topology: 2 elections share 1 CG with 2 COs; `elections.disallowSelection:
 * true`. No election selector shown, but constituency selector IS shown (2
 * CO options for the implied combined election scope).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:189-192
 *
 * Prefix discipline: `externalIdPrefix: 'test-perm-disable-elec-2co-'` per
 * 88-03-SCOPE.md:104-110. Row external_ids bare; refs prefixed.
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
  MINIMAL_BASE_APP_SETTINGS
} from './shared';
import type { Template } from '../../template/types';

const P = 'test-perm-disable-elec-2co-';

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
  questions: { count: 0, fixed: buildQuestions(P) },

  candidates: {
    count: 0,
    fixed: [
      buildCandidate(P, 1, 'A', 'ca-1-1a', 0),
      buildCandidate(P, 2, 'A', 'ca-2-1a', 1),
      buildCandidate(P, 1, 'B', 'ca-1-1b', 2),
      buildCandidate(P, 2, 'B', 'ca-2-1b', 3)
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      ...buildElectionConstituencyNoms(P, 'el-1', 'co-1a', ['ca-1-1a', 'ca-2-1a'], 1),
      ...buildElectionConstituencyNoms(P, 'el-1', 'co-1b', ['ca-1-1b', 'ca-2-1b'], 10),
      ...buildElectionConstituencyNoms(P, 'el-2', 'co-1a', ['ca-1-1a', 'ca-2-1a'], 20),
      ...buildElectionConstituencyNoms(P, 'el-2', 'co-1b', ['ca-1-1b', 'ca-2-1b'], 30)
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: APP_SETTINGS }]
  }
};

export default permDisableElection2coTemplate;
