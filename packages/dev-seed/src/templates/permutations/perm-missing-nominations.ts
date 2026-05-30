/**
 * perm-missing-nominations minimal-data template — Phase 90 Plan 02.
 *
 * Topology: 2 elections sharing 1 CG with 1 CO. 1 organisation, 1 candidate.
 * 1 nomination in el-1 only — el-2 has ZERO nominations. The voter selects
 * both elections and the missing-nominations modal surfaces the 'some'
 * variant with a per-election check/close icon list (el-2 = close).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-5.md:15-26.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-missnoms-'` per D-90-01
 * (distinct from the other 89-04 + 90 perm templates).
 *
 * Settings: spreads MINIMAL_BASE_APP_SETTINGS verbatim — this perm does NOT
 * require 90-01's Stage A runtime supportedLocales override (locale-count
 * irrelevant to the missing-nominations modal surface).
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

const P = 'e2e-perm-missnoms-';

const APP_SETTINGS = MINIMAL_BASE_APP_SETTINGS;

export const permMissingNominationsTemplate: Template = {
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
      buildCandidate({
        prefix: P,
        orgN: 1,
        candLetter: 'A',
        idSuffix: 'ca-1-1a',
        sortOrder: 0,
        answersByExternalId: buildStandardCandidateAnswers({ prefix: P })
      })
    ]
  },

  nominations: {
    count: 0,
    fixed: [
      // INTENTIONAL: el-2 has zero nominations to trigger the missing-nominations modal
      // 'some' variant per TIR5:15-26. Only el-1 carries a nomination.
      ...buildElectionConstituencyNoms({
        prefix: P,
        electionIdSuffix: 'el-1',
        constituencyIdSuffix: 'co-1a',
        candidateIdSuffixes: ['ca-1-1a'],
        electionSymbolStart: 1
      })
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: APP_SETTINGS }]
  }
};

export default permMissingNominationsTemplate;
