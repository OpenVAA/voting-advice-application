/**
 * perm-interactive-info minimal-data template (EPERM-07).
 *
 * Topology: 1 election, 1 CG with 1 CO, 2 organisations, 2 candidates, ONE
 * opinion category carrying the question-info substrate the EPERM-07 spec
 * needs to assert both `questions.interactiveInfo.enabled` modes plus the
 * advanced info content.
 *
 * Mode carriers (the `interactiveInfo.enabled` flag is an APP-LEVEL setting —
 * `questions.interactiveInfo.enabled` in app_settings — so the popup-modal vs
 * static-expander distinction is exercised by the spec re-seeding the
 * singleton per mode). This template ships `interactiveInfo.enabled = true`
 * (popup-modal) by default and provides two info-carrying questions:
 *   - `qu-popup`   — carries `info` text (the carrier the popup-modal slice
 *                    clicks to open a modal dialog).
 *   - `qu-default` — carries `info` text too (under the static-expander mode
 *                    re-seed, the SAME question reveals its body inline).
 *
 * Advanced info content (EPERM-07 NOTE, all shapes per
 * `packages/app-shared/src/data/customData.type.ts`):
 *   - `customData.infoSections` (`Array<{title, content(html)}>`) on
 *     `qu-popup` (≥1 question).
 *   - `customData.arguments` (`Array<QuestionArguments>`) on THREE separate
 *     questions, one per opinion type — Likert (`qu-likert`, LikertPros/Cons),
 *     Boolean (`qu-boolean`, BooleanPros/Cons), Categorical (`qu-categorical`,
 *     CategoricalPros with a per-`choiceId` group) — because argument
 *     rendering is type-dependent and the categorical layout groups by
 *     `choiceId`.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-iinfo-'`. Row external_ids
 * bare; nested refs prefixed. Additive — own namespaced dataset, does NOT
 * touch `e2e/base`.
 */

import {
  buildCandidate,
  buildElectionConstituencyNoms,
  buildOrganizations,
  LIKERT_5_EN,
  MINIMAL_BASE_APP_SETTINGS
} from './shared';
import { ARGUMENT_TYPE } from '@openvaa/app-shared';
import type { QuestionArguments } from '@openvaa/app-shared';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-iinfo-';

/** Categorical choices for the categorical argument carrier. */
const CATEGORICAL_EN: Array<{ id: string; label: { en: string } }> = [
  { id: 'a', label: { en: 'Option A' } },
  { id: 'b', label: { en: 'Option B' } },
  { id: 'c', label: { en: 'Option C' } }
];

/** Likert arguments (pros + cons) — type-dependent layout. */
const LIKERT_ARGUMENTS: Array<QuestionArguments> = [
  {
    type: ARGUMENT_TYPE.LikertPros,
    arguments: [
      { id: 'lk-pro-1', content: '[ARG-LIKERT-PRO-1] Supports the statement strongly.' },
      { id: 'lk-pro-2', content: '[ARG-LIKERT-PRO-2] A second pro for the Likert question.' }
    ]
  },
  {
    type: ARGUMENT_TYPE.LikertCons,
    arguments: [{ id: 'lk-con-1', content: '[ARG-LIKERT-CON-1] Opposes the statement.' }]
  }
];

/** Boolean arguments (pros + cons). */
const BOOLEAN_ARGUMENTS: Array<QuestionArguments> = [
  {
    type: ARGUMENT_TYPE.BooleanPros,
    arguments: [{ id: 'bl-pro-1', content: '[ARG-BOOLEAN-PRO-1] Reason to answer yes.' }]
  },
  {
    type: ARGUMENT_TYPE.BooleanCons,
    arguments: [{ id: 'bl-con-1', content: '[ARG-BOOLEAN-CON-1] Reason to answer no.' }]
  }
];

/**
 * Categorical arguments — grouped per `choiceId` (the categorical layout
 * renders one argument group per referenced choice).
 */
const CATEGORICAL_ARGUMENTS: Array<QuestionArguments> = [
  {
    type: ARGUMENT_TYPE.CategoricalPros,
    choiceId: 'a',
    arguments: [{ id: 'ct-a-1', content: '[ARG-CAT-A-1] Argument for Option A.' }]
  },
  {
    type: ARGUMENT_TYPE.CategoricalPros,
    choiceId: 'b',
    arguments: [{ id: 'ct-b-1', content: '[ARG-CAT-B-1] Argument for Option B.' }]
  }
];

/** Candidate answers (one per opinion question). */
const IINFO_CANDIDATE_ANSWERS: Record<string, { value: unknown }> = {
  [`${P}qu-popup`]: { value: '3' },
  [`${P}qu-default`]: { value: '3' },
  [`${P}qu-likert`]: { value: '3' },
  [`${P}qu-boolean`]: { value: true },
  [`${P}qu-categorical`]: { value: 'a' }
};

export const permInteractiveInfoTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL1] Interactive-info election' },
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

  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: 'qc-opin',
        name: { en: '[QC-OPIN] Interactive-info opinion questions' },
        category_type: 'opinion',
        sort_order: 0,
        is_generated: false
      }
    ]
  },

  questions: {
    count: 0,
    fixed: [
      // Popup-mode carrier — carries info text + infoSections (>=1 question).
      {
        external_id: 'qu-popup',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-POPUP] Opinion with info (popup-modal carrier).' },
        info: { en: '[QU-POPUP-INFO] Info body shown as a modal dialog when interactiveInfo is enabled.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        custom_data: {
          infoSections: [
            {
              title: '[INFOSEC-1-TITLE] Background',
              content: '<p>[INFOSEC-1-CONTENT] First info section html body.</p>'
            },
            {
              title: '[INFOSEC-2-TITLE] Details',
              content: '<p>[INFOSEC-2-CONTENT] Second info section html body.</p>'
            }
          ]
        },
        allow_open: false,
        required: true,
        sort_order: 0,
        is_generated: false
      },
      // Static-expander default carrier — carries info text (inline reveal).
      {
        external_id: 'qu-default',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-DEFAULT] Opinion with info (static-expander default).' },
        info: { en: '[QU-DEFAULT-INFO] Info body revealed inline under static-expander mode.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        allow_open: false,
        required: false,
        sort_order: 1,
        is_generated: false
      },
      // Likert argument carrier.
      {
        external_id: 'qu-likert',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU-LIKERT] Opinion Likert — carries arguments.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        custom_data: { arguments: LIKERT_ARGUMENTS },
        allow_open: false,
        required: false,
        sort_order: 2,
        is_generated: false
      },
      // Boolean argument carrier.
      {
        external_id: 'qu-boolean',
        type: 'boolean',
        name: { en: '[QU-BOOLEAN] Opinion Boolean — carries arguments.' },
        category: { external_id: `${P}qc-opin` },
        custom_data: { arguments: BOOLEAN_ARGUMENTS },
        allow_open: false,
        required: false,
        sort_order: 3,
        is_generated: false
      },
      // Categorical argument carrier (arguments grouped per choiceId).
      {
        external_id: 'qu-categorical',
        type: 'singleChoiceCategorical',
        name: { en: '[QU-CATEGORICAL] Opinion Categorical — carries per-choice arguments.' },
        choices: CATEGORICAL_EN,
        category: { external_id: `${P}qc-opin` },
        custom_data: { arguments: CATEGORICAL_ARGUMENTS },
        allow_open: false,
        required: false,
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
        answersByExternalId: IINFO_CANDIDATE_ANSWERS
      }),
      buildCandidate({
        prefix: P,
        orgN: 2,
        candLetter: 'A',
        idSuffix: 'ca-2-1a',
        sortOrder: 1,
        answersByExternalId: IINFO_CANDIDATE_ANSWERS
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
            // Popup-modal mode by default (the static-expander mode is the
            // spec's per-mode re-seed; default `false` is the absence of this
            // override). EPERM-07 asserts BOTH modes in full.
            interactiveInfo: {
              enabled: true
            }
          }
        }
      }
    ]
  }
};

export default permInteractiveInfoTemplate;
