/**
 * `default` built-in template — TMPL-04.
 *
 * Finnish-flavored election with:
 *   - 1 election, 1 constituency_group, 13 constituencies (D-58-02)
 *   - 8 invented parties with Finnish-cultural flavor (D-58-01)
 *   - 100 candidates non-uniformly distributed via `defaultOverrides.candidates`
 *   - 24 questions (18 ordinal + 4 categorical + 1 multi-choice + 1 boolean) via
 *     `defaultOverrides.questions` (D-58-03)
 *   - 4 categories
 *   - generateTranslationsForAllLocales: true (D-58-04)
 *   - seed: 42 (determinism)
 *
 * No real party names, no encoded political positions (D-58-01). Party colors
 * visually distinct hues for political-compass 2D scatter plots. Constituency
 * names are invented Finnish-flavored labels — NOT real Finnish electoral
 * districts.
 *
 * Phase 57 latent emitter auto-wires via `ctx.answerEmitter ??=
 * latentAnswerEmitter(template)` in pipeline.ts — candidates get clustered
 * answers "for free" without explicit override. `latent` block omitted →
 * Phase 57 uses built-in defaults (defaultDimensions, defaultCentroids, etc.).
 *
 * `nominations.count: 100` pairs with `candidates.count: 100` so Phase 56's
 * NominationsGenerator emits one candidate-type nomination per candidate
 * wired to the single election × first constituency.
 */

import { candidatesOverride } from './defaults/candidates-override';
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

  // 13 invented Finnish-flavored district names — NOT real electoral districts.
  // The naming draws on Finnish place-name morphology (suffixes like -maa,
  // -anmaa, compass directions) without duplicating any real constituency.
  constituencies: {
    count: 0,
    fixed: [
      { external_id: 'c_01', name: { en: 'Uudenmaa North' }, sort_order: 0, is_generated: false },
      { external_id: 'c_02', name: { en: 'Uudenmaa South' }, sort_order: 1, is_generated: false },
      { external_id: 'c_03', name: { en: 'Varsinais-Suomi' }, sort_order: 2, is_generated: false },
      { external_id: 'c_04', name: { en: 'Satakunta East' }, sort_order: 3, is_generated: false },
      { external_id: 'c_05', name: { en: 'Pirkanmaa' }, sort_order: 4, is_generated: false },
      { external_id: 'c_06', name: { en: 'Kainuu-Pohjois-Karjala' }, sort_order: 5, is_generated: false },
      { external_id: 'c_07', name: { en: 'Etelä-Savo-Keski-Suomi' }, sort_order: 6, is_generated: false },
      { external_id: 'c_08', name: { en: 'Pohjanmaa Coast' }, sort_order: 7, is_generated: false },
      { external_id: 'c_09', name: { en: 'Keski-Pohjanmaa' }, sort_order: 8, is_generated: false },
      { external_id: 'c_10', name: { en: 'Pohjois-Pohjanmaa' }, sort_order: 9, is_generated: false },
      { external_id: 'c_11', name: { en: 'Lappi-North' }, sort_order: 10, is_generated: false },
      { external_id: 'c_12', name: { en: 'Lappi-South' }, sort_order: 11, is_generated: false },
      { external_id: 'c_13', name: { en: 'Åland Islands' }, sort_order: 12, is_generated: false }
    ]
  },

  // 8 invented parties per D-58-01 — Finnish-cultural flavor, NO real names,
  // NO encoded real political positions. Colors span distinct hues (blues,
  // greens, reds, orange, purple) for visible separation in 2D compass plots.
  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'party_blue',
        name: { en: 'Blue Coalition' },
        short_name: { en: 'BC' },
        color: { normal: '#2546a8', dark: '#6b8dd6' },
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'party_green',
        name: { en: 'Green Wing' },
        short_name: { en: 'GW' },
        color: { normal: '#0a716b', dark: '#4db3ad' },
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'party_social',
        name: { en: 'Social Democrats Union' },
        short_name: { en: 'SDU' },
        color: { normal: '#b42121', dark: '#e06b6b' },
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'party_rural',
        name: { en: 'Rural Alliance' },
        short_name: { en: 'RA' },
        color: { normal: '#3f8f3f', dark: '#7dc77d' },
        sort_order: 3,
        is_generated: false
      },
      {
        external_id: 'party_people',
        name: { en: "People's Movement" },
        short_name: { en: 'PM' },
        color: { normal: '#d88b1e', dark: '#f0b96b' },
        sort_order: 4,
        is_generated: false
      },
      {
        external_id: 'party_red',
        name: { en: 'Red Front' },
        short_name: { en: 'RF' },
        color: { normal: '#8b0000', dark: '#cc4a4a' },
        sort_order: 5,
        is_generated: false
      },
      {
        external_id: 'party_coast',
        name: { en: 'Coastal Party' },
        short_name: { en: 'CP' },
        color: { normal: '#1f8bc2', dark: '#6bb8dc' },
        sort_order: 6,
        is_generated: false
      },
      {
        external_id: 'party_values',
        name: { en: 'Values Coalition' },
        short_name: { en: 'VC' },
        color: { normal: '#5b3f8a', dark: '#9b83c4' },
        sort_order: 7,
        is_generated: false
      }
    ]
  },

  // 4 opinion categories covering standard policy axes. `category_type:
  // 'opinion'` matches Phase 56's QuestionCategoriesGenerator default and
  // signals "these questions drive matching" to the frontend.
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

  // Exact shape via defaultOverrides.questions — override replaces the
  // class-based QuestionsGenerator and emits the 18/4/1/1 mix.
  questions: {
    count: 24
  },

  // Exact shape via defaultOverrides.candidates — override replaces the
  // class-based CandidatesGenerator and emits 100 candidates non-uniformly
  // distributed across the 8 parties per PARTY_WEIGHTS.
  candidates: {
    count: 100
  },

  // One candidate-type nomination per candidate (Phase 56 pattern). Pairs
  // 1:1 with the candidate count; nominations > candidates.length is clamped
  // with a logger warning at generate time.
  nominations: {
    count: 100
  },

  // Mirror the default dynamic-settings `entities` block so the voter app's
  // `/nominations` route (and any other consumer) sees a populated
  // `appSettings.entities` tree. Without this, route loaders that merge
  // `staticSettings` + `appSettingsData` end up with `entities === undefined`
  // and throw `Cannot read properties of undefined (reading 'showAllNominations')`
  // — surfaced by Phase 58 UAT Gap #2.
  //
  // Writer routes this through `updateAppSettings` (merge_jsonb_column RPC),
  // which deep-merges into seed.sql's bootstrap row.
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'appsettings_default',
        settings: {
          entities: {
            showAllNominations: true,
            hideIfMissingAnswers: { candidate: true }
          }
        }
      }
    ]
  }
};

/**
 * Default-template overrides — wired by the CLI in Plan 05's `seed.ts` via
 * `BUILT_IN_OVERRIDES` (see `./index.ts` + Task 3). Paired 1:1 with
 * `defaultTemplate` in `BUILT_IN_TEMPLATES`.
 */
export const defaultOverrides: Overrides = {
  candidates: candidatesOverride,
  questions: questionsOverride
};
