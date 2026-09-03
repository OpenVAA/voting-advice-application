/**
 * perm-question-video minimal-data template.
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 2 candidates. The opinion questions span THREE opinion categories (category intros SHOWN) so the voter visibility matrix can assert per-surface video placement:
 *
 *   q-cat 1: q1 (video), q2 (no video), q3 (video) q-cat 2: q4 (no video) q-cat 3: q5 (video)
 *
 * `customData.video` (`VideoContent`, per `packages/app-shared/src/data/customData.type.ts`) is attached to q1, q3, q5 ONLY — NEVER on the category intros (the matrix asserts that the question video and the category-intro video are distinct surfaces). The video is INFO ABOUT the question (rendered by the standalone `Video` component, not the hero `<figure>`), so the URLs are PLACEHOLDERS — the spec asserts visibility/attachment of the rendered Video instance, NOT playback.
 *
 * `questions.categoryIntros.show = true` (overriding the MINIMAL base default of `false`) so the 3-category intro walk is visible to the voter slice.
 *
 * Candidates fully answer the 5 opinion questions so the candidate-app questions overview (which the candidate `hideVideo` slice drives) is populated.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-qvid-'`. Row external_ids bare; nested refs prefixed. Additive — own namespaced dataset, does NOT touch `e2e/base`.
 */

import {
  buildCandidate,
  buildElectionConstituencyNoms,
  buildOrganizations,
  LIKERT_5_EN,
  MINIMAL_BASE_APP_SETTINGS
} from './shared';
import type { VideoContent } from '@openvaa/app-shared';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-qvid-';

/**
 * A placeholder `VideoContent`. Distinct titles per carrier so a spec can disambiguate which question's video rendered. No real network is hit — the assertions test visibility/attachment, not playback.
 */
function placeholderVideo(label: string): VideoContent {
  return {
    title: `[VIDEO-${label}] Placeholder question video ${label}`,
    sources: [`/e2e-placeholder/${label}.webm`, `/e2e-placeholder/${label}.mp4`],
    captions: `/e2e-placeholder/${label}.vtt`,
    poster: `/e2e-placeholder/${label}-poster.jpg`,
    aspectRatio: 16 / 9
  };
}

/** Candidate answers for all 5 opinion questions (neutral Likert-5 = '3'). */
const QVID_CANDIDATE_ANSWERS: Record<string, { value: unknown }> = {
  [`${P}qu-opin-1`]: { value: '3' },
  [`${P}qu-opin-2`]: { value: '3' },
  [`${P}qu-opin-3`]: { value: '3' },
  [`${P}qu-opin-4`]: { value: '3' },
  [`${P}qu-opin-5`]: { value: '3' }
};

export const permQuestionVideoTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL1] Question-video election' },
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

  // 3 opinion categories so the category-intro walk surfaces all 3 intros.
  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: 'qc-1',
        name: { en: '[QC1] Video category one' },
        category_type: 'opinion',
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'qc-2',
        name: { en: '[QC2] Video category two' },
        category_type: 'opinion',
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'qc-3',
        name: { en: '[QC3] Video category three' },
        category_type: 'opinion',
        sort_order: 2,
        is_generated: false
      }
    ]
  },

  // 5 opinion questions; video on q1 / q3 / q5 ONLY (none on category intros).
  questions: {
    count: 0,
    fixed: [
      {
        external_id: 'qu-opin-1',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU1-VIDEO] Opinion 1 — has video.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-1` },
        custom_data: { video: placeholderVideo('q1') },
        allow_open: false,
        required: true,
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'qu-opin-2',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU2-NOVIDEO] Opinion 2 — no video.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-1` },
        allow_open: false,
        required: true,
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'qu-opin-3',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU3-VIDEO] Opinion 3 — has video.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-1` },
        custom_data: { video: placeholderVideo('q3') },
        allow_open: false,
        required: true,
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'qu-opin-4',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU4-NOVIDEO] Opinion 4 — no video.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-2` },
        allow_open: false,
        required: true,
        sort_order: 3,
        is_generated: false
      },
      {
        external_id: 'qu-opin-5',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU5-VIDEO] Opinion 5 — has video.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-3` },
        custom_data: { video: placeholderVideo('q5') },
        allow_open: false,
        required: true,
        sort_order: 4,
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
        answersByExternalId: QVID_CANDIDATE_ANSWERS
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'A',
        idSuffix: 'ca-2-1a',
        sortOrder: 1,
        answersByExternalId: QVID_CANDIDATE_ANSWERS
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
          questions: {
            ...MINIMAL_BASE_APP_SETTINGS.questions,
            // Category intros SHOWN — the voter matrix walks each of the 3 category intros and asserts NONE carries the question video.
            categoryIntros: {
              allowSkip: true,
              show: true
            }
          }
        }
      }
    ]
  }
};

export default permQuestionVideoTemplate;
