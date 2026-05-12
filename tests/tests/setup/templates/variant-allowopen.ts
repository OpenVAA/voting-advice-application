/**
 * AllowOpen variant template — overlay flips customData.allowOpen on a subset
 * of questions (SETTINGS-02).
 *
 * Spec contract: tests/tests/specs/voter/voter-allowopen.spec.ts (SETTINGS-02).
 * Base: BUILT_IN_TEMPLATES.e2e.
 *
 * --- LANDMINE-1 reframing (Phase 77 RESEARCH) ---
 *
 * Per CONTEXT LANDMINE-1: voter has NO authoring surface for open comments.
 * `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts:19,28` accepts
 * only `value`, never `info`. CONTEXT D-07's "voter authors comment text +
 * persists across reload" wording is INACCURATE — what's actually testable
 * is the entity-side display chain in the entity-detail drawer.
 *
 * The voter-side allowOpen surface is the entity-detail drawer's display of
 * the entity's `answer.info` via `<QuestionOpenAnswer>` at
 * EntityOpinions.svelte:76-78. The differential assertion is per-question:
 *   - test-question-1 (allowOpen: true; Alpha has answer.info)
 *     → drawer shows alpha's open comment.
 *   - test-question-3 OVERRIDDEN to allowOpen: false (Alpha has answer.info
 *     from the e2e seed because the seed pre-dates the variant flip)
 *     → drawer STILL shows the comment. THIS DOCUMENTS the architectural fact
 *     that `customData.allowOpen` is candidate-app-only — voter sees existing
 *     comments regardless.
 *   - test-question-7 (allowOpen unchanged: true; Alpha has NO answer.info)
 *     → drawer does NOT render <QuestionOpenAnswer> for this row.
 *
 * Voter-side authoring is captured as PRODUCT-GAP in
 * `.planning/todos/pending/2026-05-12-settings-02-voter-authoring-product-gap.md`.
 *
 * --- Overlay-row inventory ---
 *
 *   - questions: pass-through with `custom_data.allowOpen` mutated on
 *     `test-question-3` (was true in base e2e; flipped to false here).
 *   - app_settings: 1 NEW (test-app-settings-allowopen) — `questionsIntro.show: false`
 *     overlay so the voter doesn't stop on an intro page before reaching results.
 *   - everything else: pass-through (count: 0, fixed: baseFixed(table)).
 */
import { mergeSettings } from '@openvaa/app-shared';
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS } from '@openvaa/dev-seed';
import type { Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-allowopen: BUILT_IN_TEMPLATES.e2e is undefined.');

/**
 * Phase 77 SETTINGS-02: settings overlay. Deep merge (`mergeSettings` from
 * `@openvaa/app-shared`) preserves base `results.cardContents` +
 * `results.sections` + `header.*` + every other base key; a shallow merge
 * would clobber them (per LANDMINE-5 / Pitfall 4 — `mergeAppSettings` from
 * frontend is SHALLOW; do NOT use it here).
 */
const ALLOWOPEN_APP_SETTINGS_OVERLAY = {
  // Bypass the now-default questions intro so the voter lands directly on
  // questions (and then can reach /results) without an intro page. Mirrors
  // the canonical variant-low-minimum-answers overlay.
  questions: {
    questionsIntro: { allowCategorySelection: false, show: false }
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

export const variantAllowopenTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,

  // Pass-through: organizations / elections / constituencies / constituency
  // groups / categories / candidates / nominations inherit the base e2e
  // dataset unchanged. The differential cell anchors are:
  //   - test-question-1: allowOpen: true (base) + Alpha.info present (base seed)
  //   - test-question-3: allowOpen: FALSE (variant override) + Alpha.info present (base seed)
  //   - test-question-7: allowOpen: true (base) + Alpha.info ABSENT (base seed; only value: '4')
  organizations: { count: 0, fixed: baseFixed('organizations') },
  elections: { count: 0, fixed: baseFixed('elections') },
  constituencies: { count: 0, fixed: baseFixed('constituencies') },
  constituency_groups: { count: 0, fixed: baseFixed('constituency_groups') },
  question_categories: { count: 0, fixed: baseFixed('question_categories') },

  // Mutate test-question-3.custom_data.allowOpen from `true` (base) to `false`
  // (variant). Documents the architectural fact that customData.allowOpen
  // gates CANDIDATE authoring, not voter display: Alpha's pre-existing
  // answer.info on test-question-3 (authored when allowOpen was true) is
  // still displayed in the voter drawer.
  questions: {
    count: 0,
    fixed: baseFixed('questions').map((row) => {
      if (row.external_id === 'test-question-3') {
        return {
          ...row,
          custom_data: { ...((row.custom_data ?? {}) as object), allowOpen: false }
        };
      }
      return row;
    })
  },

  candidates: { count: 0, fixed: baseFixed('candidates') },
  nominations: { count: 0, fixed: baseFixed('nominations') },

  // Phase 77 SETTINGS-02: compose variant-scoped app_settings from the base +
  // questionsIntro-disable overlay. Writer Pass-5 reads `row.settings`;
  // variant-scoped external_id survives the `runTeardown('test-', ...)`
  // filter.
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-allowopen',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, ALLOWOPEN_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantAllowopenTemplate;
