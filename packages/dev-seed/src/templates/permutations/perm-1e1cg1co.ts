/**
 * perm-1e1cg1co minimal-data template — Phase 88 Plan 03.
 *
 * Topology: 1 election → 1 constituency group → 1 constituency. No election
 * or constituency selector should be shown (1E/1CG/1CO is auto-implied).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:139-144
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-1e1cg1co-'` — UNIQUE per
 * 88-03-SCOPE.md:104-110. Row external_ids in fixed[] are BARE (writer
 * prepends prefix); nested refs use FULL prefixed external_ids (writer
 * passes refs verbatim). Each chain teardowns ITS OWN prefix via
 * setupFromTemplate's derived `teardownPrefix = template.externalIdPrefix`.
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

const P = 'e2e-perm-1e1cg1co-';

export const perm1e1cg1coTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL1] Single election' },
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
        name: { en: '[CG1] Single group' },
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
  questions: { count: 0, fixed: buildQuestions(P) },

  candidates: {
    count: 0,
    fixed: [
      buildCandidate(P, 1, 'A', 'ca-1-1a', 0),
      buildCandidate(P, 2, 'A', 'ca-2-1a', 1)
    ]
  },

  nominations: {
    count: 0,
    fixed: buildElectionConstituencyNoms(P, 'el-1', 'co-1a', ['ca-1-1a', 'ca-2-1a'], 1)
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: MINIMAL_BASE_APP_SETTINGS }]
  }
};

export default perm1e1cg1coTemplate;
