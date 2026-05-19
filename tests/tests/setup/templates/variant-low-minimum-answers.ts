/**
 * Low-minimum-answers variant template — settings-only overlay (E2E-02).
 *
 * Spec contract:
 *   - tests/tests/specs/voter/voter-browse-without-match.spec.ts (E2E-02).
 *
 * Base: BUILT_IN_TEMPLATES.e2e (single-election baseline). This variant adds
 * NO new rows — every table passes through the base unchanged. Only the
 * `app_settings.fixed[0].settings` block carries an overlay that lowers
 * `matching.minimumAnswers` from the default 5 (per
 * `packages/app-shared/src/settings/dynamicSettings.ts:42`) down to 1.
 *
 * Phase 74 E2E-02 (browse-without-match) contract: a voter who completes
 * location selection but skips opinion questions must still be able to reach
 * `/results` and browse the entity list — without seeing any match-score
 * percentages (no opinions answered → match.score undefined → SubMatches /
 * score-gauges do not render). The page intro/ingress copy switches to the
 * "browse" form (`dynamic.results.ingress.browse`) when
 * `voterCtx.resultsAvailable` is false.
 *
 * The verified knob path is `dynamicSettings.matching.minimumAnswers` per
 * `packages/app-shared/src/settings/dynamicSettings.type.ts:127-136`.
 *
 * The overlay also keeps `questions.questionsIntro.show: false` (matching the
 * canonical multi-election overlay shape) so the voter journey doesn't stop on
 * an intro page before reaching the questions / results flow.
 *
 * Overlay-row inventory:
 *   - app_settings: 1 NEW (test-app-settings-low-minimum-answers)
 *   - everything else: pass-through (count: 0, fixed: baseFixed(table))
 */
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-low-minimum-answers: BUILT_IN_TEMPLATES.e2e is undefined.');

/**
 * Phase 74 E2E-02 (browse-without-match): settings-only overlay. Deep merge
 * (mergeSettings) preserves base `results.cardContents` + `results.sections` +
 * `header.*` + every other base key; a shallow merge would clobber them
 * (which is why `@openvaa/app-shared#mergeSettings` is used here, NOT
 * `mergeAppSettings` from the frontend — the latter is a SHALLOW merge per
 * PATTERNS Pitfall 4).
 */
const LOW_MIN_ANSWERS_APP_SETTINGS_OVERLAY = {
  // Bypass the now-default questions intro so the voter lands directly on
  // questions (and then can skip to /results) without an intro page.
  questions: {
    questionsIntro: { allowCategorySelection: false, show: false }
  },
  // E2E-02 contract: voter completes location, skips opinions, stays under
  // minimumAnswers. Verified knob path: dynamicSettings.matching.minimumAnswers
  // (dynamicSettings.ts:42 — default 5; dynamicSettings.type.ts:127-136 typed
  // shape).
  matching: {
    minimumAnswers: 1
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

export const variantLowMinimumAnswersTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,

  // Pass-through: every table inherits the base e2e dataset unchanged. This
  // is a settings-only variant; no new elections / constituencies /
  // candidates / nominations / questions / categories.
  organizations: { count: 0, fixed: baseFixed('organizations') },
  elections: { count: 0, fixed: baseFixed('elections') },
  constituencies: { count: 0, fixed: baseFixed('constituencies') },
  constituency_groups: { count: 0, fixed: baseFixed('constituency_groups') },
  question_categories: { count: 0, fixed: baseFixed('question_categories') },
  questions: { count: 0, fixed: baseFixed('questions') },
  candidates: { count: 0, fixed: baseFixed('candidates') },
  nominations: { count: 0, fixed: baseFixed('nominations') },

  // Phase 74 E2E-02: compose variant-scoped app_settings from the base +
  // low-minimumAnswers overlay. Writer Pass-5 reads `row.settings`;
  // variant-scoped external_id survives the `runTeardown('test-', ...)`
  // filter. Deep merge preserves base `results.cardContents` +
  // `results.sections` (`merge_jsonb_column` is additive per Pitfall 3).
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-low-minimum-answers',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, LOW_MIN_ANSWERS_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantLowMinimumAnswersTemplate;
