/**
 * `default` built-in template — TMPL-04.
 *
 * Finnish-flavored election with:
 *   - 1 election, 1 constituency_group, 13 constituencies (D-58-02)
 *   - 8 invented parties with Finnish-cultural flavor (D-58-01)
 *   - 100 candidates non-uniformly distributed via `defaultOverrides.candidates`
 *   - 24 questions (18 ordinal + 5 categorical + 1 boolean) via
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
 * `nominations.count: 327` pairs with `candidates.count: 327` so Phase 56's
 * NominationsGenerator emits one candidate-type nomination per candidate
 * wired to the single election × first constituency.
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
  // Sized + ordered largest-to-smallest in alignment with `nominations-override.ts`'s
  // PARTY_CONSTITUENCY_MATRIX (column 0 = largest constituency, column 4 = smallest).
  constituencies: {
    count: 0,
    fixed: [
      { external_id: 'c_01', name: { en: 'Uudenmaa North' }, sort_order: 0, is_generated: false },
      { external_id: 'c_02', name: { en: 'Uudenmaa South' }, sort_order: 1, is_generated: false },
      { external_id: 'c_03', name: { en: 'Varsinais-Suomi' }, sort_order: 2, is_generated: false },
      { external_id: 'c_04', name: { en: 'Satakunta East' }, sort_order: 3, is_generated: false },
      { external_id: 'c_05', name: { en: 'Pirkanmaa' }, sort_order: 4, is_generated: false }
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
  // class-based CandidatesGenerator and emits 327 candidates non-uniformly
  // distributed across the 8 parties per PARTY_WEIGHTS = [61, 56, 49, 43, 38,
  // 33, 26, 21]. Row sums of `PARTY_CONSTITUENCY_MATRIX` in nominations-override.
  candidates: {
    count: 327
  },

  // One candidate-type nomination per candidate (327 total), plus one
  // organization-type nomination per (party × constituency) cell where ≥1
  // candidate of that party is nominated in that constituency (40 org noms
  // = 8 parties × 5 constituencies, since the matrix is dense). Total: 367
  // nominations. Distribution per `nominations-override.ts`'s
  // PARTY_CONSTITUENCY_MATRIX (largest constituency: 15→5 across parties;
  // smallest: 9→3; linear interpolation in between).
  nominations: {
    count: 327
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
          },
          // Phase 67: surface the Alliance entity tab in voter results. The
          // default `dynamicSettings.results.sections` (dynamicSettings.ts:66)
          // is `['candidate', 'organization']`; without this override the
          // alliance tab does not render even though alliance entities + noms
          // exist in the DB (RESEARCH Pitfall 1). The writer's merge_jsonb_column
          // RPC deep-merges this `results` object into the bootstrap row,
          // replacing the `sections` array (a leaf) while leaving sibling keys
          // (cardContents, showFeedbackPopup, showSurveyPopup) intact.
          results: {
            sections: ['candidate', 'organization', 'alliance']
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
  alliances: alliancesOverride,
  candidates: candidatesOverride,
  nominations: nominationsOverride,
  questions: questionsOverride
};
