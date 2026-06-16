/**
 * perm-analytics-tracking minimal-data template (EFLOW-08, D-01).
 *
 * Carries the ANALYTICS OVERLAY that arms the `trackingIntercept` fixture for
 * the `voter-prefs-tracking` spec (Plan 06). The spec requires the
 * `app_settings` singleton to expose:
 *
 *   analytics: {
 *     platform: { name: 'umami', code: <dummy>, infoUrl: <test-url> },
 *     trackEvents: true
 *   }
 *
 * so the frontend mounts its analytics integration and emits track events the
 * fixture can intercept. Consent is NOT seeded here — it is toggled at runtime
 * inside the Plan 06 spec.
 *
 * SECURITY (threat T-121-AN): `analytics.platform.code` is a DUMMY value
 * ('e2e-dummy-code'), never a real Umami / analytics key. No secrets are
 * committed — the seed only needs the platform OBJECT present + trackEvents on.
 *
 * Topology: a minimal walkable voter dataset — 1 election, 1 CG with 1 CO,
 * 2 organisations, 2 member candidates (each answering the single opinion
 * question), ONE opinion category with ONE Likert-5 question. This is the
 * smallest shape that lets a voter answer → reach /results, the surface the
 * tracking spec exercises.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-analytics-'`. Row external_ids
 * authored BARE (writer prepends prefix); nested refs use the FULL prefixed
 * external_id. Additive — own namespaced dataset, does NOT touch `e2e/base`.
 */

import { buildCandidate, buildElectionConstituencyNoms, LIKERT_5_EN, MINIMAL_BASE_APP_SETTINGS } from './shared';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-analytics-';

/** Both member candidates answer the single opinion question (neutral). */
const MEMBER_ANSWERS: Record<string, { value: unknown }> = {
  [`${P}qu-opin-1`]: { value: '3' }
};

export const permAnalyticsTrackingTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL1] Analytics-tracking election' },
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

  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'or-1',
        name: { en: '[OR1] Party One' },
        short_name: { en: 'OR1' },
        color: { normal: '#1f4ea0', dark: '#7aa3d6' },
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'or-2',
        name: { en: '[OR2] Party Two' },
        short_name: { en: 'OR2' },
        color: { normal: '#a82525', dark: '#d67070' },
        sort_order: 1,
        is_generated: false
      }
    ]
  },

  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: 'qc-opin',
        name: { en: '[QC-OPIN] Analytics-tracking opinion questions' },
        category_type: 'opinion',
        sort_order: 0,
        is_generated: false
      }
    ]
  },

  questions: {
    count: 0,
    fixed: [
      {
        external_id: 'qu-opin-1',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU1] Analytics-tracking opinion 1.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        allow_open: false,
        required: true,
        sort_order: 0,
        is_generated: false
      }
    ]
  },

  candidates: {
    count: 0,
    fixed: [
      buildCandidate({
        prefix: P,
        orgN: 1,
        candLetter: 'A',
        idSuffix: 'ca-1-1a',
        sortOrder: 0,
        answersByExternalId: MEMBER_ANSWERS
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'A',
        idSuffix: 'ca-2-1a',
        sortOrder: 1,
        answersByExternalId: MEMBER_ANSWERS
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
      })
    ]
  },

  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'app-settings',
        settings: {
          ...MINIMAL_BASE_APP_SETTINGS,
          // D-01 analytics overlay: FULL platform object (mirrors
          // staticSettings.type.ts analytics.platform) + trackEvents:true.
          // `code` is a DUMMY value (threat T-121-AN) — never a real key.
          analytics: {
            platform: {
              name: 'umami',
              code: 'e2e-dummy-code',
              infoUrl: 'https://example.test/umami'
            },
            trackEvents: true
          }
        }
      }
    ]
  }
};

export default permAnalyticsTrackingTemplate;
