/**
 * perm-per-app-notifications minimal-data template — Phase 89 Plan 04.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 candidates. The under-test setting
 * is `notifications.voterApp` + `notifications.candidateApp`, each set to a
 * DISTINCT visible notification (show: true with distinct title/content
 * markers `[notif-voter]` / `[notif-cand]`). The spec asserts each app's
 * notification renders ONLY on its own route — strict cross-route absence
 * enforcement.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-4.md:51-54 (TIR4-PERM-03).
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-notif-'` per D-89-03
 * (distinct from the other 2 89-04 perm templates AND from the 88-03
 * perm-* family, enabling parallel-safe execution across the wider suite).
 *
 * Settings: spreads MINIMAL_BASE_APP_SETTINGS, then overrides
 * `notifications` with BOTH voterApp + candidateApp NotificationData payloads
 * (per packages/app-shared/src/settings/dynamicSettings.type.ts:303-312 +
 * NotificationData shape at :397-415: `show?: boolean`, `title: LocalizedString`,
 * `content: LocalizedString`).
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

const P = 'e2e-perm-notif-';

const APP_SETTINGS = {
  ...MINIMAL_BASE_APP_SETTINGS,
  notifications: {
    voterApp: {
      show: true,
      title: { en: '[notif-voter] Voter-only notification.' },
      content: { en: '[notif-voter-content] voter content body' }
    },
    candidateApp: {
      show: true,
      title: { en: '[notif-cand] Candidate-only notification.' },
      content: { en: '[notif-cand-content] candidate content body' }
    }
  }
} as const;

export const permPerAppNotificationsTemplate: Template = {
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
    fixed: [
      ...buildElectionConstituencyNoms(P, 'el-1', 'co-1a', ['ca-1-1a', 'ca-2-1a'], 1)
    ]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: APP_SETTINGS }]
  }
};

export default permPerAppNotificationsTemplate;
