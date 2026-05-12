/**
 * Hidden+Required variant template — overlay flips customData (SETTINGS-03).
 *
 * Spec contracts:
 *   - tests/tests/specs/voter/voter-visibility-required.spec.ts (SETTINGS-03 voter-hidden)
 *   - tests/tests/specs/candidate/candidate-required-info.spec.ts (SETTINGS-03 candidate-required)
 *
 * Base: BUILT_IN_TEMPLATES.e2e.
 *
 * --- LANDMINE-3 reframing (Phase 77 RESEARCH) ---
 *
 * Per RESEARCH LANDMINE-3: voter app does NOT enforce required-info-question
 * answers — only `matching.minimumAnswers` gates voter-results CTA (covered
 * by Phase 74 E2E-02). The candidate-side surface (profileComplete) at
 * candidateContext.svelte.ts:347-368 is the asserter-able required-question
 * contract. SETTINGS-03's voter-required cell is therefore PASS-WITH-DEFERRAL
 * and filed as a follow-up todo at
 * `.planning/todos/pending/2026-05-12-settings-03-voter-required-product-gap.md`.
 *
 * --- Voter-hidden assertion ---
 *
 * Pick `test-voter-q-8` (sort 16, last opinion question voter answers in the
 * `voter-*` candidate cohort answers). Set `customData.hidden: true` so
 * `voterContext.svelte.ts:215-230` filters it out of `_opinionQuestions`.
 * Spec asserts: voter walks /questions → the question's English name ("Voter
 * Test Question 8: Social") is NEVER visible in the DOM.
 *
 * Voter-matching invariants (`tests/tests/specs/voter/voter-matching.spec.ts`)
 * run under the `voter-app` project, NOT this `variant-hidden-required`
 * project, so hiding test-voter-q-8 here does not affect them (RESEARCH
 * footnote on §"variant-hidden-required.ts").
 *
 * --- Candidate-required assertion ---
 *
 * Pick `test-question-displayname` (Phase 76 P01 fixture extension — sort 19,
 * info question with `custom_data.maxlength=50`). Set `customData.required:
 * true` so `candidateContext.svelte.ts:347-368` includes it in
 * `requiredInfoQuestions` and (because Alpha's answer is deleted in this
 * variant overlay) in `unansweredRequiredInfoQuestions`, which then drives
 * `profileComplete = false`. Spec asserts: candidate logs in as Alpha →
 * navigates to `/candidate` (CandAppHome) → the questions / preview buttons
 * carry `disabled={candCtx.unansweredRequiredInfoQuestions?.length !== 0}`
 * (line 129/144 of `routes/candidate/(protected)/+page.svelte`) AND the
 * InfoBadge at line 121 shows the unanswered-required count.
 *
 * Deletion of Alpha's `test-question-displayname` answer is done in this
 * variant's `candidates.fixed[]` overlay only. The candidate-app-mutation
 * project's CAND-12 / A11Y-02 tests run against `candidate-app-mutation`
 * (which uses the base e2e seed), NOT this variant project, so they are
 * unaffected.
 *
 * --- entities.hideIfMissingAnswers overlay (RESEARCH §Dimension 4 footnote) ---
 *
 * The `LogoutButton.svelte:100` / `+page.svelte:89,100` warning boolean is
 * `unansweredRequiredInfoQuestions?.length !== 0 ||
 *  ($appSettings.entities?.hideIfMissingAnswers?.candidate && unansweredOpinionQuestions?.length !== 0)`.
 * The base e2e default has `hideIfMissingAnswers.candidate = true` AND Alpha
 * answers only 5 of the 22+ opinion questions, so the second clause would
 * always fire regardless of any required-info flag. To isolate the assertion
 * on the FIRST clause (the required-info-question path that SETTINGS-03 is
 * about), this variant disables `entities.hideIfMissingAnswers.candidate`.
 *
 * --- Overlay-row inventory ---
 *
 *   - questions: pass-through with `custom_data` mutations on
 *     `test-voter-q-8` (`hidden: true`) and `test-question-displayname`
 *     (`required: true`).
 *   - candidates: pass-through with Alpha's `test-question-displayname`
 *     answer DELETED (so the candidate-required cell asserts the unanswered
 *     case).
 *   - app_settings: 1 NEW (`test-app-settings-hidden-required`) — deep-merge
 *     overlay disables `entities.hideIfMissingAnswers.candidate` AND sets
 *     `questions.questionsIntro.show: false` (mirrors variant-allowopen).
 *   - everything else: pass-through (count: 0, fixed: baseFixed(table)).
 */
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-hidden-required: BUILT_IN_TEMPLATES.e2e is undefined.');

/**
 * Phase 77 SETTINGS-03: settings overlay. Deep merge (`mergeSettings` from
 * `@openvaa/app-shared`) preserves base `results.cardContents` +
 * `results.sections` + `header.*` + every other base key; a shallow merge
 * would clobber them (per LANDMINE-5 / Pitfall 4).
 */
const HIDDEN_REQUIRED_APP_SETTINGS_OVERLAY = {
  // Bypass the questions intro so the voter lands directly on questions and
  // can walk through the question flow without an intro page (mirrors
  // variant-allowopen + variant-low-minimum-answers).
  questions: {
    questionsIntro: { allowCategorySelection: false, show: false }
  },
  // Disable the secondary clause in
  // `+page.svelte:89,100` / `LogoutButton.svelte:100` so the
  // required-info-question warning surfaces in isolation. Per RESEARCH §Dim 4
  // edge cases — without this, Alpha (who has only 5/22+ opinion answers)
  // would trigger the warning via the `hideIfMissingAnswers.candidate &&
  // unansweredOpinionQuestions?.length !== 0` branch regardless of any
  // required-info flag, defeating the SETTINGS-03 cell's isolation.
  entities: {
    hideIfMissingAnswers: { candidate: false }
  }
} as const;

type FixedRow = Record<string, unknown>;

function baseFixed(
  table:
    | 'elections'
    | 'constituency_groups'
    | 'constituencies'
    | 'organizations'
    | 'question_categories'
    | 'questions'
    | 'candidates'
    | 'nominations'
): Array<FixedRow> {
  const fragment = base[table] as { fixed?: Array<FixedRow> } | undefined;
  return fragment?.fixed ?? [];
}

export const variantHiddenRequiredTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,

  // Pass-through tables — no per-row mutation needed.
  organizations: { count: 0, fixed: baseFixed('organizations') },
  elections: { count: 0, fixed: baseFixed('elections') },
  constituencies: { count: 0, fixed: baseFixed('constituencies') },
  constituency_groups: { count: 0, fixed: baseFixed('constituency_groups') },
  question_categories: { count: 0, fixed: baseFixed('question_categories') },

  // Mutate `test-voter-q-8.custom_data.hidden` → true (was undefined in base)
  // AND `test-question-displayname.custom_data.required` → true (was
  // undefined in base; the question row already carries
  // `custom_data.maxlength: 50` from Phase 76 P01, which the spread
  // preserves).
  questions: {
    count: 0,
    fixed: baseFixed('questions').map((row) => {
      if (row.external_id === 'test-voter-q-8') {
        return {
          ...row,
          custom_data: { ...((row.custom_data ?? {}) as object), hidden: true }
        };
      }
      if (row.external_id === 'test-question-displayname') {
        return {
          ...row,
          custom_data: { ...((row.custom_data ?? {}) as object), required: true }
        };
      }
      return row;
    })
  },

  // Delete Alpha's answer on `test-question-displayname` so the
  // candidate-required cell can assert the unanswered-required-info case.
  // The seed (e2e.ts:763) authors this as
  // `'test-question-displayname': { value: { en: 'Display Name Sentinel 76' } }`.
  // Removing the key entirely yields `savedData.answers['<id>']` undefined →
  // `isEmptyValue(undefined?.value)` true (candidateContext.svelte.ts:357) →
  // the question appears in `unansweredRequiredInfoQuestions` →
  // `profileComplete = false` → CandAppHome buttons disabled.
  candidates: {
    count: 0,
    fixed: baseFixed('candidates').map((row) => {
      if (row.external_id === 'test-candidate-alpha') {
        const answers = { ...((row.answersByExternalId ?? {}) as Record<string, unknown>) };
        delete answers['test-question-displayname'];
        return { ...row, answersByExternalId: answers };
      }
      return row;
    })
  },

  nominations: { count: 0, fixed: baseFixed('nominations') },

  // Phase 77 SETTINGS-03: compose variant-scoped app_settings from the base +
  // hidden/required overlay. Writer Pass-5 reads `row.settings`;
  // variant-scoped external_id survives the `runTeardown('test-', ...)`
  // filter.
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-hidden-required',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, HIDDEN_REQUIRED_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantHiddenRequiredTemplate;
