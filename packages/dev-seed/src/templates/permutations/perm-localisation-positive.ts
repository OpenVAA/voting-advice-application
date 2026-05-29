/**
 * perm-localisation-positive minimal-data template — Phase 90 Plan 04.
 *
 * Sibling of perm-localisation-negative.ts (Plan 90-03): identical dataset
 * shape and structural decisions, differing ONLY in the
 * `i18n.supportedLocales` runtime override:
 *
 *   - Plan 90-03 (NEGATIVE) → supportedLocales = [en]      (1 entry)
 *   - Plan 90-04 (POSITIVE) → supportedLocales = [en, fi]  (2 entries) ← THIS
 *
 * Topology: 1 election, 1 CG with 1 CO, 1 organisation, 1 candidate, 1
 * nomination. 2 question categories (qc-info + qc-opin), each carrying 2
 * questions:
 *   - q1 (text)                          — multilingual surface (no opt-out)
 *   - q2 (text + disableMultilingual)    — per-question multilingual OFF
 *   - q3 (singleChoiceOrdinal + allow_open=true)  — open-answer comment is the
 *                                                    multilingual surface
 *   - q4 (singleChoiceOrdinal + allow_open=true + disableMultilingual)
 *
 * The candidate has terms_of_use_accepted set + ENGLISH-ONLY seeded answers
 * to all 4 questions. Finnish answers are AUTHORED BY THE SPEC at runtime via
 * the multilingualTextField fixture's setLocaleValue('fi', ...) calls
 * (Plan 90-04 Task 2 walks PERM-L10N-POS-04 and PERM-L10N-POS-06).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-5.md:52-95.
 *
 * Prefix discipline: `externalIdPrefix: 'e2e-perm-l10n-pos-'` per D-90-01
 * (distinct from the other 89-04 + 90 perm templates — in particular
 * distinct from Plan 90-03's `'e2e-perm-l10n-neg-'`).
 *
 * Settings (STAGE A DEPENDENCY — Plan 90-01): the `i18n.supportedLocales`
 * override key was added to DynamicSettings by Plan 90-01 and threaded through
 * the i18n init module via `applyDynamicOverride()`. With a 2-entry array
 * here, the runtime `locales` export filters Paraglide's compile-time
 * superset down to `[en, fi]`, showing the LanguageSelection NavGroup
 * (`locales.length > 1` gate at LanguageSelection.svelte:32) with exactly
 * two locales AND keeping the translation-options toggle visible on every
 * multilingual Input (`multilingual && locales.length > 1` gate at
 * Input.svelte:646,653) for q1 (text) and q3-comment (open-answer textarea).
 *
 * q2 + q4 carry `customData.disableMultilingual = true` as a per-question
 * opt-out: even with locales.length > 1, the multilingual toggle is
 * suppressed on those two questions (QuestionInput.svelte:72-77). This
 * exercises PERM-L10N-POS-05 (q2 no toggle) and the q4 negative branch
 * inside PERM-L10N-POS-06.
 *
 * q3 + q4 require `allow_open: true` because the multilingual surface on the
 * opinion editor is the OPEN-ANSWER COMMENT textarea
 * (`<Input type="textarea-multilingual">` at
 * `routes/candidate/(protected)/questions/[questionId]/+page.svelte:294-304`)
 * — RESEARCH §"Pitfall 5". Without `allow_open=true` the comment block does
 * not render and the assertions on q3/q4 would target a missing element.
 */

import { buildOrganizations, LIKERT_5_EN, MINIMAL_BASE_APP_SETTINGS } from './shared';
import type { Template } from '../../template/types';

const P = 'e2e-perm-l10n-pos-';

const APP_SETTINGS = {
  ...MINIMAL_BASE_APP_SETTINGS,
  // STAGE A DEPENDENCY (Plan 90-01): the i18n.supportedLocales override key
  // exists on the runtime DynamicSettings surface ONLY AFTER Plan 90-01 lands.
  // The shape mirrors staticSettings.supportedLocales (code/name/isDefault).
  // Two-entry array drops the user-facing locale list to [en, fi] at runtime,
  // showing the language selector and translation toggles per TIR5:52-95.
  i18n: {
    supportedLocales: [
      { code: 'en', name: 'English', isDefault: true },
      { code: 'fi', name: 'Suomi' }
    ]
  }
} as const;

export const permLocalisationPositiveTemplate: Template = {
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

  // Single org per TIR5:30 (mirrors 90-03) — truncate the standard 2-org
  // helper to its first entry (or-1 → '[OR1] Party One').
  organizations: { count: 0, fixed: buildOrganizations().slice(0, 1) },

  // Two categories inline (qc-info + qc-opin) — same shape as
  // buildQuestionCategories() but kept literal here to keep the question/
  // category co-location explicit for the L10N positive perm.
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

  // 4 questions inline — mirrors 90-03 verbatim. q2 + q4 carry
  // customData.disableMultilingual; q3 + q4 carry allow_open=true (Pitfall 5).
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
        // allow_open=true gates the OPEN-ANSWER COMMENT textarea per Pitfall 5
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

  // 1 candidate (`ca-1-1a`) with ToU accepted and ENGLISH-ONLY answers to
  // all 4 questions. Finnish answers are AUTHORED at runtime by the spec
  // via multilingualTextField.setLocaleValue('fi', '[fi-answer-qN]') —
  // NOT seeded here (D-90-07 / TIR5:69-81). Per Pitfall 3: the candidate
  // has NO auth.users row — the spec drives Inbucket registration to
  // obtain an auth identity. The seeded English answers persist to
  // `candidate.answers` via importAnswers and are the baseline for the
  // PERM-L10N-POS-03 / PERM-L10N-POS-06 "English visible" assertions.
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

  // 1 nomination via the single-org variant helper. Mirrors 90-03's helper
  // call shape exactly — only the prefix P differs at runtime.
  nominations: {
    count: 0,
    fixed: [...buildElectionConstituencyNomsSingleOrg(P, 'el-1', 'co-1a', ['ca-1-1a'], 1)]
  },

  app_settings: {
    count: 0,
    fixed: [{ external_id: 'app-settings', settings: APP_SETTINGS }]
  }
};

/**
 * Single-org variant of buildElectionConstituencyNoms — emits ONLY the or-1
 * parent nomination + candidate child nomination(s). Mirror of the helper
 * in perm-localisation-negative.ts (kept file-local; this is the only OTHER
 * perm with the same 1-org topology — both Plan 90-03 + 90-04 keep their
 * own copies to avoid premature promotion to shared.ts).
 *
 * Schema-equivalent to `shared.ts:buildElectionConstituencyNoms` but with the
 * or-2 parent row omitted and the org-toggle on candidate refs collapsed to
 * or-1 only.
 */
function buildElectionConstituencyNomsSingleOrg(
  P: string,
  electionIdSuffix: string,
  constituencyIdSuffix: string,
  candidateIdSuffixes: Array<string>,
  electionSymbolStart: number
): Array<Record<string, unknown>> {
  const electionExtId = `${P}${electionIdSuffix}`;
  const constituencyExtId = `${P}${constituencyIdSuffix}`;
  const key = `${electionIdSuffix}-${constituencyIdSuffix}`;
  const noms: Array<Record<string, unknown>> = [
    {
      external_id: `nom-${key}-or-1`,
      organization: { external_id: `${P}or-1` },
      election: { external_id: electionExtId },
      constituency: { external_id: constituencyExtId },
      election_round: 1
    }
  ];
  for (let i = 0; i < candidateIdSuffixes.length; i++) {
    const candIdSuffix = candidateIdSuffixes[i];
    noms.push({
      external_id: `nom-${key}-${candIdSuffix}`,
      election_symbol: String(electionSymbolStart + i),
      candidate: { external_id: `${P}${candIdSuffix}` },
      parent_nomination: { external_id: `${P}nom-${key}-or-1` },
      election: { external_id: electionExtId },
      constituency: { external_id: constituencyExtId },
      election_round: 1
    });
  }
  return noms;
}

export default permLocalisationPositiveTemplate;
