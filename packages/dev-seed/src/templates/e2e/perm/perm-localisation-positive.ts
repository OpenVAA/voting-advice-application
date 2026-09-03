/**
 * perm-localisation-positive minimal-data template.
 *
 * Operates against the 3-locale `staticSettings.supportedLocales` base (`[en, fi, sv]`) directly — NO runtime override. The single-locale variant (perm-localisation-negative) is not seeded here.
 *
 * Topology: 1 election, 1 CG with 1 CO, 1 organisation, 1 candidate, 1 nomination. 2 question categories (qc-info + qc-opin), each carrying 2 questions:
 *   - q1 (text)                          — multilingual surface (no opt-out)
 *   - q2 (text + disableMultilingual)    — per-question multilingual OFF
 *   - q3 (singleChoiceOrdinal + allow_open=true)  — open-answer comment is the multilingual surface
 *   - q4 (singleChoiceOrdinal + allow_open=true + disableMultilingual)
 *
 * The candidate has terms_of_use_accepted set + ENGLISH-ONLY seeded answers to all 4 questions. Finnish answers are AUTHORED BY THE SPEC at runtime via the multilingualTextField fixture's setLocaleValue('fi', ...) calls.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-l10n-pos-'` (distinct from every other perm template).
 *
 * Settings: APP_SETTINGS spreads MINIMAL_BASE_APP_SETTINGS verbatim (helper default) — no i18n override. The runtime `locales` export from `$lib/i18n` resolves to the staticSettings list (en/fi/sv), the LanguageSelection NavGroup (`locales.length > 1` gate at LanguageSelection.svelte:32) renders with three locales, and the translation-options toggle stays visible on every multilingual Input (`multilingual && locales.length > 1` gate at Input.svelte:646,653) for q1 (text) and q3-comment (open-answer textarea).
 *
 * q2 + q4 carry `customData.disableMultilingual = true` as a per-question opt-out: even with locales.length > 1, the multilingual toggle is suppressed on those two questions (QuestionInput.svelte:72-77).
 *
 * q3 + q4 require `allow_open: true` because the multilingual surface on the opinion editor is the OPEN-ANSWER COMMENT textarea (`<Input type="textarea-multilingual">` at `routes/candidate/(protected)/questions/[questionId]/+page.svelte:294-304`).
 * Without `allow_open=true` the comment block does not render and the assertions on q3/q4 would target a missing element.
 *
 * The L10N spec depends on:
 *   - The candidate's BARE external_id = `ca-1-1a` (hardcoded in the spec at perm-localisation-positive.spec.ts:88 as `CANDIDATE_EXTERNAL_ID = 'e2e-perm-l10n-pos-ca-1-1a'`).
 *   - 4 specific questions with bespoke `[Q1]`/`[Q2]`/`[Q3]`/`[Q4]` name markers (asserted by the spec's `getQuestion(/\[Q1\]/)` calls).
 *   - 2 questions carrying `customData.disableMultilingual = true`.
 *   - 2 opinion questions carrying `allow_open: true`.
 *   - Specific seeded English answer markers (`[en-answer-q1]` / `[en-answer-q3]`).
 *
 * Build strategy: use `buildMinimal` for the topology bits the helper supports cleanly (1 election / 1 CG / 1 CO / 1 organisation / app_settings deep-merged with the empty overlay → MINIMAL_BASE_APP_SETTINGS verbatim).
 * Override `question_categories`, `questions`, `candidates`, and `nominations` with the hand-authored bespoke shapes the spec depends on.
 * The composed Template is structurally identical to the pre-port hand-authored template (parity for the spec's selectors and assertions).
 */

import { LIKERT_5_EN } from './shared';
import { buildMinimal } from '../../_helpers/buildMinimal';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-l10n-pos-';

// Compose the topology + app_settings + organisations via the helper.
const base = buildMinimal({
  externalIdPrefix: P,
  candidates: 0,
  opinionQuestions: 0,
  infoQuestions: 0,
  organizations: 1
});

export const permLocalizationPositiveTemplate: Template = {
  ...base,

  // Two categories inline (qc-info + qc-opin) — same shape as buildQuestionCategories() but kept literal here to keep the question/category co-location explicit for the L10N positive perm.
  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: 'qc-info',
        name: { en: '[QC-INFO] Info questions' },
        category_type: 'info',
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'qc-opin',
        name: { en: '[QC-OPIN] Opinion questions' },
        category_type: 'opinion',
        sort_order: 1,
        is_generated: false
      }
    ]
  },

  // 4 questions inline. q2 + q4 carry customData.disableMultilingual; q3 + q4 carry allow_open=true.
  questions: {
    count: 0,
    fixed: [
      {
        external_id: 'qu-info-q1',
        type: 'text',
        name: { en: '[Q1] Tell us about yourself' },
        category: { external_id: `${P}qc-info` },
        allow_open: false,
        required: false,
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'qu-info-q2',
        type: 'text',
        name: { en: '[Q2] Second info question' },
        category: { external_id: `${P}qc-info` },
        allow_open: false,
        required: false,
        sort_order: 1,
        is_generated: false,
        custom_data: { disableMultilingual: true }
      },
      {
        external_id: 'qu-opin-q3',
        type: 'singleChoiceOrdinal',
        name: { en: '[Q3] First opinion question' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        // allow_open=true gates the OPEN-ANSWER COMMENT textarea
        allow_open: true,
        required: true,
        sort_order: 100,
        is_generated: false
      },
      {
        external_id: 'qu-opin-q4',
        type: 'singleChoiceOrdinal',
        name: { en: '[Q4] Second opinion question' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        allow_open: true,
        required: false,
        sort_order: 101,
        is_generated: false,
        custom_data: { disableMultilingual: true }
      }
    ]
  },

  // 1 candidate (`ca-1-1a`) with ToU accepted and ENGLISH-ONLY answers to all 4 questions. Finnish answers are AUTHORED at runtime by the spec via multilingualTextField.setLocaleValue('fi', '[fi-answer-qN]') — NOT seeded here. The candidate has NO auth.users row — the spec drives Inbucket registration to obtain an auth identity. The seeded English answers persist to `candidate.answers` via importAnswers and are the baseline for the "English visible" assertions.
  candidates: {
    count: 0,
    fixed: [
      {
        external_id: 'ca-1-1a',
        first_name: '[CA1A]',
        last_name: 'Candidate One A',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 0,
        is_generated: false,
        organization: { external_id: `${P}or-1` },
        answersByExternalId: {
          [`${P}qu-info-q1`]: { value: { en: '[en-answer-q1]' } },
          [`${P}qu-info-q2`]: { value: { en: '[en-answer-q2]' } },
          [`${P}qu-opin-q3`]: { value: '3', info: { en: '[en-answer-q3]' } },
          [`${P}qu-opin-q4`]: { value: '3' }
        }
      }
    ]
  },

  // 1 nomination via the single-org variant inlined here (mirrors the pre-port file-local `buildElectionConstituencyNomsSingleOrg` helper).
  // Only or-1 parent + the candidate child; no or-2 row (single-org perm).
  nominations: {
    count: 0,
    fixed: [
      {
        external_id: 'nom-el-1-co-1a-or-1',
        organization: { external_id: `${P}or-1` },
        election: { external_id: `${P}el-1` },
        constituency: { external_id: `${P}co-1a` },
        election_round: 1
      },
      {
        external_id: 'nom-el-1-co-1a-ca-1-1a',
        election_symbol: '1',
        candidate: { external_id: `${P}ca-1-1a` },
        parent_nomination: { external_id: `${P}nom-el-1-co-1a-or-1` },
        election: { external_id: `${P}el-1` },
        constituency: { external_id: `${P}co-1a` },
        election_round: 1
      }
    ]
  }
};

export default permLocalizationPositiveTemplate;
