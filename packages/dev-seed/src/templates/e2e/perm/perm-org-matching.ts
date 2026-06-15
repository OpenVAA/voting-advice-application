/**
 * perm-org-matching minimal-data template (EPERM-10).
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, member candidates,
 * ONE opinion category with FOUR Likert-5 questions. The dataset is shaped so
 * the three `matching.organizationMatching` modes — `none` / `answersOnly` /
 * `impute` — produce DISTINGUISHABLE org match scores (the spec re-seeds the
 * app_settings singleton per mode):
 *
 *   - Organisation `or-1` carries SOME of its OWN answers (`q1`, `q2`) and
 *     leaves `q3`, `q4` BLANK.
 *   - Its member candidate (`ca-1-1a`) answers ALL FOUR questions, covering
 *     the org's blanks `q3`/`q4` — so under `impute` those blanks are filled
 *     from the member, whereas under `answersOnly` they are penalised as the
 *     polar opposite of the voter (standard missing-answer rule).
 *
 * This makes the three modes diverge for an answered voter:
 *   - `none`        → the org shows NO match score.
 *   - `answersOnly` → score from `or-1`'s own answers ONLY; the blanks `q3`/`q4`
 *                     count as polar-opposite of the voter.
 *   - `impute`      → score includes the member-imputed `q3`/`q4` answers, so
 *                     it differs from `answersOnly`.
 *
 * Answer design (voter answers all polar-max = '5'):
 *   - q1: or-1 own = '5' (agrees with voter).
 *   - q2: or-1 own = '1' (disagrees with voter).
 *   - q3: or-1 BLANK; member ca-1-1a = '5' (imputes agreement).
 *   - q4: or-1 BLANK; member ca-1-1a = '5' (imputes agreement).
 * Under `answersOnly` the blanks q3/q4 are penalised (treated as '1'); under
 * `impute` they become '5'. The two scores therefore differ for the polar-max
 * voter, satisfying the EPERM-10 distinguishability requirement.
 *
 * Org own answers are stitched by the Writer's `importAnswers` pass (which —
 * as of Phase 119 — generalises over candidates AND organizations); the org
 * carries `answersByExternalId` keyed by FULL prefixed question external_ids.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-orgmatch-'`. Row external_ids
 * bare; nested refs prefixed. Additive — own namespaced dataset, does NOT
 * touch `e2e/base`.
 */

import { buildCandidate, buildElectionConstituencyNoms, LIKERT_5_EN, MINIMAL_BASE_APP_SETTINGS } from './shared';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-orgmatch-';

/** `or-1` carries SOME own answers (q1, q2) and leaves q3/q4 blank. */
const ORG1_OWN_ANSWERS: Record<string, { value: unknown }> = {
  [`${P}qu-opin-1`]: { value: '5' },
  [`${P}qu-opin-2`]: { value: '1' }
};

/** Member candidate `ca-1-1a` answers ALL four questions (covers org blanks). */
const MEMBER1_ANSWERS: Record<string, { value: unknown }> = {
  [`${P}qu-opin-1`]: { value: '5' },
  [`${P}qu-opin-2`]: { value: '1' },
  [`${P}qu-opin-3`]: { value: '5' },
  [`${P}qu-opin-4`]: { value: '5' }
};

/** Member candidate `ca-2-1a` (org 2) answers all four (neutral). */
const MEMBER2_ANSWERS: Record<string, { value: unknown }> = {
  [`${P}qu-opin-1`]: { value: '3' },
  [`${P}qu-opin-2`]: { value: '3' },
  [`${P}qu-opin-3`]: { value: '3' },
  [`${P}qu-opin-4`]: { value: '3' }
};

export const permOrgMatchingTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL1] Org-matching election' },
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

  // or-1 carries SOME own answers (q1/q2) + leaves q3/q4 blank. or-2 is a
  // plain comparison party.
  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'or-1',
        name: { en: '[OR1] Party One (own answers)' },
        short_name: { en: 'OR1' },
        color: { normal: '#1f4ea0', dark: '#7aa3d6' },
        sort_order: 0,
        is_generated: false,
        answersByExternalId: ORG1_OWN_ANSWERS
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
        name: { en: '[QC-OPIN] Org-matching opinion questions' },
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
        name: { en: '[QU1] Org-matching opinion 1.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        allow_open: false,
        required: true,
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'qu-opin-2',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU2] Org-matching opinion 2.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        allow_open: false,
        required: true,
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'qu-opin-3',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU3] Org-matching opinion 3 (org blank, member-imputed).' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        allow_open: false,
        required: true,
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'qu-opin-4',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU4] Org-matching opinion 4 (org blank, member-imputed).' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        allow_open: false,
        required: true,
        sort_order: 3,
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
        answersByExternalId: MEMBER1_ANSWERS
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'A',
        idSuffix: 'ca-2-1a',
        sortOrder: 1,
        answersByExternalId: MEMBER2_ANSWERS
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
          matching: {
            ...MINIMAL_BASE_APP_SETTINGS.matching,
            // Default mode; the EPERM-10 spec re-seeds the singleton with each
            // of {none, answersOnly, impute} to assert distinguishable scores.
            organizationMatching: 'impute'
          }
        }
      }
    ]
  }
};

export default permOrgMatchingTemplate;
