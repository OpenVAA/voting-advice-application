/**
 * `default` built-in template.
 *
 * Finnish-flavored election with:
 *   - 1 election, 1 constituency_group, 5 constituencies
 *   - 8 invented organizations with Finnish-cultural flavor
 *   - 327 candidates non-uniformly distributed via `defaultOverrides.candidates` (`ORGANIZATION_WEIGHTS` sum 327; pairs with `candidates.count: 327`)
 *   - 26 questions (18 ordinal + 5 categorical + 1 boolean + 1 number + 1 multipleChoiceCategorical) via `defaultOverrides.questions`
 *   - 4 categories
 *   - generateTranslationsForAllLocales: true
 *   - seed: 42 (determinism)
 *
 * No real organization names, no encoded political positions. Organization colors are visually distinct hues for political-compass 2D scatter plots. Constituency names are invented Finnish-flavored labels — NOT real Finnish electoral districts.
 *
 * The latent emitter auto-wires via `ctx.answerEmitter ??= latentAnswerEmitter(template)` in pipeline.ts — candidates get clustered answers "for free" without explicit override. The `latent` block is omitted, so built-in defaults (defaultDimensions, defaultCentroids, etc.) apply.
 *
 * `nominations.count: 327` pairs with `candidates.count: 327` so the NominationsGenerator emits one candidate-type nomination per candidate wired to the single election × first constituency.
 *
 * ## external_id idiom
 *
 * Every `external_id` in this file is `<typecode>_<discriminator>` in snake_case, where the typecode is the one emitted by the generator that owns that collection (`ConstituenciesGenerator` → `con`, `OrganizationsGenerator` → `org`, and so on) and the discriminator is semantic for hand-authored rows and zero-padded for generated ones. The constituency and organization collections were reconciled with their generators' typecodes; the five other hand-authored collections already conformed. Derived identifiers — the organization- and alliance-nomination ids in `defaults/nominations-override.ts` — are interpolated from these values and follow the idiom without being written out.
 *
 * This idiom deliberately diverges from the `e2e/base` fixture in four ways.
 * Each is a choice, not an oversight:
 *   1. snake_case rather than the fixture's kebab-case, because this template's own pipeline-generated identifiers are snake_case and matching the fixture would create a fresh divergence INSIDE the template.
 *   2. No fixture namespace prefix. Namespacing is right for a test fixture and wrong for the demo dataset a developer meets first; `externalIdPrefix` already scopes these rows so `db:seed:teardown` can reach them.
 *   3. Generator typecodes rather than the fixture's two-letter codes, for the same reason as (1) — two-letter codes would put this file at odds with every identifier its own pipeline generates.
 *   4. The alliance discriminators keep their uppercase form. It is cosmetic, it conforms on typecode, and lowercasing it would widen the change into two helper functions and every derived nomination identifier for no measured benefit.
 */

import { alliancesOverride } from './defaults/alliances-override';
import { candidatesOverride } from './defaults/candidates-override';
import { nominationsOverride } from './defaults/nominations-override';
import { questionsOverride } from './defaults/questions-override';
import type { Template } from '../template/types';
import type { Overrides } from '../types';

export const defaultTemplate: Template = {
  seed: 42,
  externalIdPrefix: 'seed_',
  generateTranslationsForAllLocales: true,

  elections: {
    count: 0, // suppress synthetic emission — fixed[] fully describes this table
    fixed: [
      {
        external_id: 'election_default',
        name: { en: 'OpenVAA Demo Parliamentary Election 2026' },
        short_name: { en: 'Demo 2026' },
        election_type: 'general',
        election_date: '2026-06-15',
        sort_order: 0,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1
      }
    ]
  },

  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'cg_default',
        name: { en: 'Parliamentary Districts' },
        sort_order: 0,
        is_generated: false
      }
    ]
  },

  // 5 invented Finnish-flavored district names — NOT real electoral districts.
  // Sized + ordered largest-to-smallest in alignment with `nominations-override.ts`'s ORGANIZATION_CONSTITUENCY_MATRIX (column 0 = largest constituency, column 4 = smallest).
  constituencies: {
    count: 0,
    fixed: [
      { external_id: 'con_01', name: { en: 'Uudenmaa North' }, sort_order: 0, is_generated: false },
      { external_id: 'con_02', name: { en: 'Uudenmaa South' }, sort_order: 1, is_generated: false },
      { external_id: 'con_03', name: { en: 'Varsinais-Suomi' }, sort_order: 2, is_generated: false },
      { external_id: 'con_04', name: { en: 'Satakunta East' }, sort_order: 3, is_generated: false },
      { external_id: 'con_05', name: { en: 'Pirkanmaa' }, sort_order: 4, is_generated: false }
    ]
  },

  // 8 invented organizations — Finnish-cultural flavor, NO real names, NO encoded real political positions. Colors span distinct hues (blues, greens, reds, orange, purple) for visible separation in 2D compass plots.
  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'org_blue',
        name: { en: 'Blue Coalition' },
        short_name: { en: 'BC' },
        color: { normal: '#2546a8', dark: '#6b8dd6' },
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'org_green',
        name: { en: 'Green Wing' },
        short_name: { en: 'GW' },
        color: { normal: '#0a716b', dark: '#4db3ad' },
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'org_social',
        name: { en: 'Social Democrats Union' },
        short_name: { en: 'SDU' },
        color: { normal: '#b42121', dark: '#e06b6b' },
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'org_rural',
        name: { en: 'Rural Alliance' },
        short_name: { en: 'RA' },
        color: { normal: '#3f8f3f', dark: '#7dc77d' },
        sort_order: 3,
        is_generated: false
      },
      {
        external_id: 'org_people',
        name: { en: "People's Movement" },
        short_name: { en: 'PM' },
        color: { normal: '#d88b1e', dark: '#f0b96b' },
        sort_order: 4,
        is_generated: false
      },
      {
        external_id: 'org_red',
        name: { en: 'Red Front' },
        short_name: { en: 'RF' },
        color: { normal: '#8b0000', dark: '#cc4a4a' },
        sort_order: 5,
        is_generated: false
      },
      {
        external_id: 'org_coast',
        name: { en: 'Coastal Party' },
        short_name: { en: 'CP' },
        color: { normal: '#1f8bc2', dark: '#6bb8dc' },
        sort_order: 6,
        is_generated: false
      },
      {
        external_id: 'org_values',
        name: { en: 'Values Coalition' },
        short_name: { en: 'VC' },
        color: { normal: '#5b3f8a', dark: '#9b83c4' },
        sort_order: 7,
        is_generated: false
      }
    ]
  },

  // 4 opinion categories covering standard policy axes. `category_type: 'opinion'` matches the QuestionCategoriesGenerator default and signals "these questions drive matching" to the frontend.
  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: 'cat_economy',
        name: { en: 'Economy & Taxation' },
        category_type: 'opinion',
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'cat_social',
        name: { en: 'Social & Welfare' },
        category_type: 'opinion',
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'cat_environment',
        name: { en: 'Environment & Energy' },
        category_type: 'opinion',
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'cat_foreign',
        name: { en: 'Foreign & Defence' },
        category_type: 'opinion',
        sort_order: 3,
        is_generated: false
      }
    ]
  },

  // Exact shape via defaultOverrides.questions — override replaces the class-based QuestionsGenerator and emits the 18 ordinal / 5 categorical / 1 boolean / 1 number / 1 multi-choice mix.
  questions: {
    count: 26
  },

  // Exact shape via defaultOverrides.candidates — override replaces the class-based CandidatesGenerator and emits 327 candidates non-uniformly distributed across the 8 organizations per ORGANIZATION_WEIGHTS = [61, 56, 49, 43, 38, 33, 26, 21]. Row sums of `ORGANIZATION_CONSTITUENCY_MATRIX` in nominations-override.
  candidates: {
    count: 327
  },

  // One candidate-type nomination per candidate (327 total), plus one organization-type nomination per (organization × constituency) cell where ≥1 candidate of that organization is nominated in that constituency (40 org noms = 8 organizations × 5 constituencies, since the matrix is dense), plus the 10 alliance noms nominations-override emits (2 alliances × 5 constituencies). Total: 377 nominations, as measured from a db:reset-with-data run. Distribution per `nominations-override.ts`'s ORGANIZATION_CONSTITUENCY_MATRIX (largest constituency: 15→5 across organizations; smallest: 9→3; linear interpolation in between).
  nominations: {
    count: 327
  },

  // Mirror the default dynamic-settings `entities` block so the voter app's `/nominations` route (and every other consumer) sees a populated `appSettings.entities` tree. Without this, route loaders that merge `staticSettings` + `appSettingsData` end up with `entities === undefined` and throw `Cannot read properties of undefined (reading 'showAllNominations')`.
  //
  // Writer routes this through `updateAppSettings` (merge_jsonb_column RPC), which deep-merges into seed.sql's bootstrap row.
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'appsettings_default',
        settings: {
          // `hideIfMissingAnswers.candidate: false` matches the known-good `e2e/base` posture (packages/dev-seed/src/templates/e2e/base.ts).
          // Defensive: removes the symptom class where an under-answered candidate empties the candidates tab. All 327 default candidates are fully answered today, so this is a no-op for the current dataset but guards against future under-answered seeds.
          entities: {
            showAllNominations: true,
            hideIfMissingAnswers: { candidate: false }
          },
          // Surface the Alliance entity tab in voter results.
          // The frontend's `mergeAppSettings` (apps/frontend/src/lib/utils/settings.ts) shallow-merges by root key, so a value written here REPLACES the whole `results` object from the TS defaults — we MUST mirror the full default shape (cardContents for every entity type listed in `sections`, the popup delays) and only diff `sections` to add 'alliance'. Mirrors `packages/app-shared/src/settings/dynamicSettings.ts:59-67`.
          results: {
            cardContents: {
              candidate: ['submatches'],
              organization: ['children'],
              alliance: ['children']
            },
            showFeedbackPopup: 180,
            showSurveyPopup: 500,
            sections: ['candidate', 'organization', 'alliance']
          }
        }
      }
    ]
  }
};

/**
 * Default-template overrides — wired by the CLI in `seed.ts` via `BUILT_IN_OVERRIDES` (see `./index.ts`). Paired 1:1 with `defaultTemplate` in `BUILT_IN_TEMPLATES`.
 */
export const defaultOverrides: Overrides = {
  alliances: alliancesOverride,
  candidates: candidatesOverride,
  nominations: nominationsOverride,
  questions: questionsOverride
};
