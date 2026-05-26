/**
 * perm-1e1cg1co minimal-data template — Phase 88 Plan 03.
 *
 * Topology: 1 election → 1 constituency group → 1 constituency. No election
 * or constituency selector should be shown (1E/1CG/1CO is auto-implied).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:139-144
 *
 * Prefix discipline: ROW PREFIX is `test-perm-1e1cg1co-` per
 * 88-03-SCOPE.md:104-110. The template uses `externalIdPrefix: ''` and
 * pre-prefixes all row external_ids AND nested-ref external_ids with PREFIX
 * (mirrors baseV1's empty-prefix + pre-prefixed pattern; see Risk #6 in
 * 88-03-PLAN.md for the rationale — the writer prefixes top-level external_ids
 * but passes nested-ref external_ids through verbatim). Each chain teardowns
 * ITS OWN prefix only via runTeardown(PREFIX, client); the prefix is unique
 * within the test-perm-* family.
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

const P = 'test-perm-1e1cg1co-';

export const perm1e1cg1coTemplate: Template = {
  seed: 42,
  externalIdPrefix: '',
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: `${P}el-1`,
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
        external_id: `${P}cg-1`,
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
        external_id: `${P}co-1a`,
        name: { en: '[CO1A] Only constituency' },
        sort_order: 0,
        is_generated: false
      }
    ]
  },

  organizations: { count: 0, fixed: buildOrganizations(P) },
  question_categories: { count: 0, fixed: buildQuestionCategories(P) },
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
    fixed: [{ external_id: `${P}app-settings`, settings: MINIMAL_BASE_APP_SETTINGS }]
  }
};

export default perm1e1cg1coTemplate;
