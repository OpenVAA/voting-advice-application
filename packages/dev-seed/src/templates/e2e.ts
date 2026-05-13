/**
 * `e2e` built-in template — TMPL-05.
 *
 * Shape matches what Playwright specs in `tests/tests/specs/**\/*.spec.ts`
 * depend on. Authored from `.planning/phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md`
 * (Plan 01 output) — NOT from mechanical translation of the legacy JSON
 * fixtures. D-58-15 REJECTS mechanical port: Sections 1–3 of the audit are
 * a POSITIVE inclusion list; Section 4 is an EXCLUSION list.
 *
 * D-58-16: `generateTranslationsForAllLocales` is `false` — Playwright specs
 * run against a single locale and the 4x JSONB payload is pure overhead.
 *
 * Phase 59 rewrites `tests/seed-test-data.ts` to invoke this template; Plan
 * 08's scope stops at the template surface + registry + parity tests.
 * Plan 09's integration test verifies row counts + external_id presence
 * end-to-end against a live Supabase.
 *
 * ## External ID strategy
 *
 * Every `fixed[]` entry here carries its FULL literal external_id (e.g.
 * `'test-candidate-alpha'`). `externalIdPrefix` is `''` so Phase 56's
 * generators pass the id through verbatim
 * (`${externalIdPrefix}${fx.external_id}` → `''+fx.external_id`). This
 * matches the spec-asserted ids in audit §Section 1 without double-prefixing.
 *
 * ## Audit citations
 *
 * Every entry below has a citation to 58-E2E-AUDIT.md — a spec file:line that
 * depends on that exact external_id / name / relational triangle. Adding a
 * new entry without an audit update is a code-review flag.
 *
 * Sections referenced:
 *   §1   — external IDs referenced directly by specs (positive list)
 *   §1.1 — indirected IDs enforced by dataset-shape iteration
 *   §2   — display-text contracts (literal strings asserted by specs)
 *   §2.1 — candidate firstName/lastName via template literal
 *   §2.2 — candidate emails + ordering invariants
 *   §3.1 — default-dataset relational triangles
 *   §3.2 — voter-dataset relational triangles (additive)
 *   §3.3 — candidate-addendum triangles (unconfirmed nominations)
 *   §4.1 — fixture-only external IDs NOT carried forward (D-58-15 exclusion)
 *   §7   — row-count summary / minimum counts per table
 *   §8.1 — scope decision: base template includes overlay-level rows
 *          (test-election-2, test-constituency-e2, test-cg-municipalities)
 *          per Plan 08's must_haves.truths — the audit's §8.1 recommendation
 *          to defer these to Phase 59/60 is overridden by this plan.
 *
 * ## Question choice shape
 *
 * Ordinal questions use the Phase 56 LIKERT_5 convention (normalizableValue
 * per QuestionsGenerator.ts:56-62). The legacy fixtures duplicate `id` as
 * `key` and stringify `normalizableValue`; the canonical shape used here
 * drops the stringification (matches Phase 57's latent emitter which reads
 * `normalizableValue` numerically).
 */

import type { Template } from '../template/types';

/**
 * Base `app_settings.settings` JSONB payload for the e2e template (Phase 63
 * E2E-02).
 *
 * Source of truth for the legacy `updateAppSettings(...)` call that lived in
 * `tests/tests/setup/data.setup.ts:53-72` pre-Phase-63. Copied verbatim so
 * Playwright specs that depend on the 5 top-level keys (questions, results,
 * entities, notifications, analytics) see the same persisted state they got
 * before the migration.
 *
 * Consumed by:
 *   - This file's `e2eTemplate.app_settings.fixed[0].settings` (base).
 *   - `tests/tests/setup/templates/variant-*.ts` — each variant composes this
 *     base with a variant-specific overlay via
 *     `mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)` (D-02 + RESOLVED Q1).
 *
 * Writer routing: Pass-5 (`packages/dev-seed/src/writer.ts:174-181`) reads
 * `row.settings` (Pitfall 2 — DO NOT rename to `value`). The DB column is
 * `settings`; the `merge_jsonb_column` RPC deep-merges into the bootstrap
 * `app_settings` row for the project (additive per Pitfall 3).
 *
 * `as const` keeps the literal types visible to consumers that destructure or
 * assert against specific keys (e.g. the Phase 63 post-seed `toMatchObject`
 * assertions).
 */
export const E2E_BASE_APP_SETTINGS = {
  questions: {
    categoryIntros: { show: false },
    // Questions intro page is shown by default (matches the dynamicSettings
    // default and the spec contract in voter-questions.spec.ts which gates
    // the QUESTION-03 "Answer 0 Questions" regression). Variants that
    // bypass the intro (multi-election etc.) override these per-variant.
    questionsIntro: { allowCategorySelection: true, show: true },
    showResultsLink: true
  },
  results: {
    cardContents: {
      candidate: ['submatches'],
      organization: ['children']
    },
    sections: ['candidate', 'organization']
  },
  entities: {
    hideIfMissingAnswers: { candidate: false },
    showAllNominations: true
  },
  notifications: { voterApp: { show: false } },
  analytics: { trackEvents: false }
} as const;

/**
 * Shared Likert-5 choice array. Every singleChoiceOrdinal question in this
 * template uses this exact shape — satisfies the Phase 57 ordinal-dispatch
 * contract + the spec-invariant `LIKERT_SCALE = 5` read at
 * voter-matching.spec.ts:49 (audit §4 row "Likert-5 choice schema").
 *
 * The labels MAY be regenerated (§4 row flags this as parity-recommended but
 * not spec-required). Preserving verbatim minimizes cross-file churn.
 */
const LIKERT_5_EN: Array<{ id: string; label: { en: string }; normalizableValue: number }> = [
  { id: '1', label: { en: 'Fully disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Somewhat disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Neutral' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Somewhat agree' }, normalizableValue: 4 },
  { id: '5', label: { en: 'Fully agree' }, normalizableValue: 5 }
];

export const e2eTemplate: Template = {
  seed: 42,
  externalIdPrefix: '', // D-58-15: full 'test-' literal ids pre-written in fixed[]
  generateTranslationsForAllLocales: false, // D-58-16

  // §1 row 10 — test-election-1. Name per §2 (constituency.spec.ts:292
  // asserts visibility of 'Test Election 2025' literal).
  //
  // Single-election base: exercises the auto-implied path
  // (voter-journey VOTE-02/VOTE-03 contract). Variants that need multiple
  // elections + a hierarchy/selector flow declare their own templates —
  // e.g. `tests/tests/setup/templates/variant-multi-election.ts` adds
  // test-election-2 + test-cg-municipalities + the additional
  // region/municipality constituencies and overrides per-row scoping.
  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'test-election-1',
        name: { en: 'Test Election 2025' },
        short_name: { en: 'Election 2025' },
        election_type: 'general',
        election_date: '2025-06-15',
        sort_order: 0,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1
      }
    ]
  },

  // §4 row "test-cg-1" — structural chain requirement (no literal assertion
  // but voter journey navigation requires election → cg → constituency).
  // Single group + single constituency in the base = auto-implied
  // selection at the voter-app journey level.
  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'test-cg-1',
        name: { en: 'Test Constituency Group' },
        sort_order: 0,
        is_generated: false
      }
    ]
  },

  // §1 row 14 — test-constituency-alpha is referenced verbatim by
  // multi-election.spec.ts + results-sections.spec.ts. Single-constituency
  // base; variants add additional constituencies (test-constituency-e2,
  // -beta, -e3..e5) when their flow requires explicit selection.
  constituencies: {
    count: 0,
    fixed: [
      {
        external_id: 'test-constituency-alpha',
        name: { en: 'Test Constituency Alpha' },
        sort_order: 0,
        is_generated: false
      }
    ]
  },

  // §1.1 — 4 organizations total. voter-results.spec.ts:28 sums
  // `defaultDataset.organizations.length + voterDataset.organizations.length`
  // as `totalPartyCount` — 2 + 2 = 4.
  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'test-party-a',
        name: { en: 'Test Party A' },
        short_name: { en: 'TPA' },
        color: { normal: '#2546a8', dark: '#6b8dd6' },
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-party-b',
        name: { en: 'Test Party B' },
        short_name: { en: 'TPB' },
        color: { normal: '#a82525', dark: '#d67070' },
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'test-voter-party-a',
        name: { en: 'Voter Test Party Alpha' },
        short_name: { en: 'VPA' },
        color: { normal: '#1f8bc2', dark: '#6bb8dc' },
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'test-voter-party-b',
        name: { en: 'Voter Test Party Beta' },
        short_name: { en: 'VPB' },
        color: { normal: '#d88b1e', dark: '#f0b96b' },
        sort_order: 3,
        is_generated: false
      }
    ]
  },

  // §4 row "test-category-economy/social/info + test-voter-cat-economy/social" —
  // external_ids MAY be regenerated but preserved here for parity. Total 5
  // categories: 3 default (1 info + 2 opinion) + 2 voter (both opinion) satisfies
  // matching spec's 8-ordinal filter across the full dataset.
  question_categories: {
    count: 0,
    fixed: [
      {
        external_id: 'test-category-economy',
        name: { en: 'Test Category: Economy' },
        category_type: 'opinion',
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-category-social',
        name: { en: 'Test Category: Social' },
        category_type: 'opinion',
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'test-category-info',
        name: { en: 'Test Category: Background Information' },
        category_type: 'info',
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'test-voter-cat-economy',
        name: { en: 'Test Voter Category: Economy' },
        category_type: 'opinion',
        sort_order: 3,
        is_generated: false
      },
      {
        external_id: 'test-voter-cat-social',
        name: { en: 'Test Voter Category: Social' },
        category_type: 'opinion',
        sort_order: 4,
        is_generated: false
      },
      // E2E-07/directional-metric-anchor: category housing the categorical
      // question that exercises @openvaa/matching's directional SubMatch path.
      // Phase 74 Plan 05 Task 1 — added so the per-category SubMatch grid in
      // voter-detail.spec.ts asserts BOTH metric paths (Manhattan via the 4
      // ordinal categories above + directional via this categorical category).
      // @openvaa/matching/src/algorithms/matchingAlgorithm.ts dispatches
      // categorical-question SubMatches to the directional path transparently;
      // additive — existing CONF-01..CONF-06 invariants stay intact.
      {
        external_id: 'test-category-directional',
        name: { en: 'Test Category: Directional (E2E-07)' },
        category_type: 'opinion',
        sort_order: 5,
        is_generated: false
      },
      // QSPEC-01/boolean-render-anchor: category housing the boolean opinion
      // question that exercises @openvaa/data's BooleanQuestion render branch
      // at OpinionQuestionInput.svelte:100-111. Phase 75 Plan 01 Task 1 —
      // mirrors Phase 74 P05's test-category-directional pattern (CONTEXT
      // D-02). category_type 'opinion' (NOT 'info'; folding into
      // test-category-info would conflate category semantics per CONTEXT
      // Claude's Discretion paragraph 4).
      {
        external_id: 'test-category-boolean',
        name: { en: 'Test Category: Boolean (QSPEC-01)' },
        category_type: 'opinion',
        sort_order: 6,
        is_generated: false
      }
    ]
  },

  // §1.1 — 17 questions total:
  //   • 8 default-dataset ordinal (test-question-1..8) — voter-matching.spec.ts:40-43
  //     filters `type === 'singleChoiceOrdinal'` expecting 8 from defaultDataset
  //   • 1 default-dataset text (test-question-text) — voter-detail.spec.ts:88
  //     reads `alphaAnswers['test-question-text'].value` as campaign slogan
  //   • 8 voter-dataset ordinal (test-voter-q-1..8) — voter-matching.spec.ts:42
  //     spreads all voterDataset.questions requiring singleChoiceOrdinal
  //
  // EXCLUDED (§4.1): test-question-date, test-question-number
  // — zero grep hits in specs; dropping preserves the 8-ordinal filter result.
  // NOTE: test-question-boolean was re-introduced as test-question-boolean-1 in
  // Phase 75 Plan 01 (QSPEC-01 anchor; sort 18, required:false, new category
  // test-category-boolean). The boolean exclusion is no longer "zero grep hits".
  //
  // test-question-1 carries `custom_data.allowOpen: true` per §8.4 —
  // candidate-questions.spec.ts:67-69 depends on the comment field being
  // available when answering the first opinion question.
  questions: {
    count: 0,
    fixed: [
      // Default-dataset opinion questions (test-question-1..4 — Economy)
      {
        external_id: 'test-question-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 1: Should taxes on high incomes be increased?' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-economy' },
        custom_data: { allowOpen: true }, // §8.4 — load-bearing for candidate-questions.spec.ts
        allow_open: true,
        required: true,
        sort_order: 0,
        is_generated: false
      },
      {
        external_id: 'test-question-2',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 2: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-economy' },
        custom_data: { allowOpen: true }, // D-59-12 fix-forward: CAND-12 comment persistence
        allow_open: true,
        required: true,
        sort_order: 1,
        is_generated: false
      },
      {
        external_id: 'test-question-3',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 3: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-economy' },
        custom_data: { allowOpen: true }, // D-59-12 fix-forward: CAND-12 comment persistence
        allow_open: true,
        required: true,
        sort_order: 2,
        is_generated: false
      },
      {
        external_id: 'test-question-4',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 4: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-economy' },
        custom_data: { allowOpen: true }, // D-59-12 fix-forward: CAND-12 comment persistence
        allow_open: true,
        required: true,
        sort_order: 3,
        is_generated: false
      },
      // Default-dataset opinion questions (test-question-5..8 — Social)
      {
        external_id: 'test-question-5',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 5: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-social' },
        custom_data: { allowOpen: true }, // D-59-12 fix-forward: CAND-12 comment persistence
        allow_open: true,
        required: true,
        sort_order: 4,
        is_generated: false
      },
      {
        external_id: 'test-question-6',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 6: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-social' },
        custom_data: { allowOpen: true }, // D-59-12 fix-forward: CAND-12 comment persistence
        allow_open: true,
        required: true,
        sort_order: 5,
        is_generated: false
      },
      {
        external_id: 'test-question-7',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 7: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-social' },
        custom_data: { allowOpen: true }, // D-59-12 fix-forward: CAND-12 comment persistence
        allow_open: true,
        required: true,
        sort_order: 6,
        is_generated: false
      },
      {
        external_id: 'test-question-8',
        type: 'singleChoiceOrdinal',
        name: { en: 'Test Opinion Question 8: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-category-social' },
        custom_data: { allowOpen: true }, // D-59-12 fix-forward: CAND-12 comment persistence
        allow_open: true,
        required: true,
        sort_order: 7,
        is_generated: false
      },
      // Default-dataset info question — voter-detail.spec.ts:88 asserts on
      // alphaAnswers['test-question-text'].value (campaign slogan).
      //
      // Phase 77 / SETTINGS-01 wave B Plan 02 — adds `custom_data.filterable: true`
      // so the question surfaces a TextFilter in the voter results filter dialog
      // (per apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts:55-66
      // which only includes questions where `getCustomData(q).filterable` is truthy).
      // RESEARCH LANDMINE-2 (Phase 77).
      {
        external_id: 'test-question-text',
        type: 'text',
        name: { en: 'Campaign slogan' },
        category: { external_id: 'test-category-info' },
        custom_data: { filterable: true }, // Phase 77 P02 — SETTINGS-01 wave B TextFilter anchor
        allow_open: false,
        required: false,
        sort_order: 8,
        is_generated: false
      },
      // Voter-dataset opinion questions (test-voter-q-1..4 — Voter Economy)
      {
        external_id: 'test-voter-q-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 1: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-economy' },
        allow_open: true,
        required: true,
        sort_order: 9,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-2',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 2: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-economy' },
        allow_open: true,
        required: true,
        sort_order: 10,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-3',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 3: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-economy' },
        allow_open: true,
        required: true,
        sort_order: 11,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-4',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 4: Economy' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-economy' },
        allow_open: true,
        required: true,
        sort_order: 12,
        is_generated: false
      },
      // Voter-dataset opinion questions (test-voter-q-5..8 — Voter Social)
      {
        external_id: 'test-voter-q-5',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 5: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-social' },
        allow_open: true,
        required: true,
        sort_order: 13,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-6',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 6: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-social' },
        allow_open: true,
        required: true,
        sort_order: 14,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-7',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 7: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-social' },
        allow_open: true,
        required: true,
        sort_order: 15,
        is_generated: false
      },
      {
        external_id: 'test-voter-q-8',
        type: 'singleChoiceOrdinal',
        name: { en: 'Voter Test Question 8: Social' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-voter-cat-social' },
        allow_open: true,
        required: true,
        sort_order: 16,
        is_generated: false
      },
      // E2E-07/directional-metric-anchor: categorical question — exercises
      // @openvaa/matching's directional-metric SubMatch path (vs. Manhattan
      // for ordinal questions). singleChoiceCategorical satisfies the
      // SingleChoiceQuestion + categorical-dispatch invariants in
      // packages/matching/src/algorithms/matchingAlgorithm.ts.
      //
      // `required: false` and the sort_order 17 placement keep the voter
      // fixture (voter.fixture.ts default voterAnswerCount=16) unaffected:
      // voter answers the 16 ordinals first, encounters this categorical
      // question last, and the fixture's post-loop fallback clicks "Skip"
      // (nextButton) to navigate to /results. Phase 74 Plan 05 Task 1.
      {
        external_id: 'test-question-directional-1',
        type: 'singleChoiceCategorical',
        name: { en: 'Test Opinion Question Directional 1 (E2E-07)' },
        choices: [
          { id: 'a', label: { en: 'Option A' } },
          { id: 'b', label: { en: 'Option B' } },
          { id: 'c', label: { en: 'Option C' } }
        ],
        category: { external_id: 'test-category-directional' },
        // Phase 77 / SETTINGS-01 wave B Plan 02 — `custom_data.filterable: true`
        // makes this categorical question surface a ChoiceQuestionFilter in the
        // voter results filter dialog (rendered via EnumeratedEntityFilter per
        // EntityFilters.svelte:52-55). Spec uncheck Option A → Alpha filtered out.
        // RESEARCH LANDMINE-2 (Phase 77).
        custom_data: { filterable: true },
        allow_open: false,
        required: false,
        sort_order: 17,
        is_generated: false
      },
      // QSPEC-01/boolean-render-anchor: boolean opinion question — exercises
      // the v2.6 Phase 61 BooleanQuestion render branch at
      // apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte:100-111
      // (booleanChoices: 'No' / 'Yes' synthesized from t('common.answer.*')).
      // NO `choices` field per packages/dev-seed/src/templates/defaults/
      // questions-override.ts:53 (boolean is schema-free; booleanChoices is
      // synthesized at render time, not stored in the question row). Phase 75
      // Plan 01 Task 1 — `required: false` + sort_order 18 keeps the voter
      // fixture's voterAnswerCount=16 Likert loop unaffected; the existing
      // Phase 74 P05 Skip-Next fallback at voter-matching.spec.ts:167-177
      // handles sort 18 transparently (sort-agnostic).
      {
        external_id: 'test-question-boolean-1',
        type: 'boolean',
        name: { en: 'Test Opinion Question Boolean 1 (QSPEC-01)' },
        category: { external_id: 'test-category-boolean' },
        allow_open: false,
        required: false,
        sort_order: 18,
        is_generated: false
      },
      // Phase 76 A11Y-01 cell-3 (name-too-long via HTML5 maxlength) anchor +
      // Phase 76 A11Y-02 displayName reload-persistence anchor.
      // custom_data.maxlength=50 enables the HTML5 native cap assertion at
      // apps/frontend/src/lib/components/input/Input.svelte:602; QuestionInput.svelte:79-85
      // bridges custom_data.maxlength → Input prop. NO `customData.format` field
      // exists on the Question type today (PRODUCT-GAP for email/url) — see
      // .planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md.
      {
        external_id: 'test-question-displayname',
        type: 'text',
        name: { en: 'Display name (Phase 76 anchor)' },
        category: { external_id: 'test-category-info' },
        custom_data: { maxlength: 50 },
        allow_open: false,
        required: false,
        sort_order: 19,
        is_generated: false
      },
      // Phase 76 A11Y-02 bio reload-persistence anchor.
      // custom_data.longText=true triggers <textarea> render path at
      // apps/frontend/src/lib/components/input/QuestionInput.svelte:67;
      // maxlength=500 caps textarea content per Input.svelte:602 native attr.
      {
        external_id: 'test-question-bio',
        type: 'text',
        name: { en: 'Biography (Phase 76 anchor)' },
        category: { external_id: 'test-category-info' },
        custom_data: { longText: true, maxlength: 500 },
        allow_open: false,
        required: false,
        sort_order: 20,
        is_generated: false
      },
      // Phase 76 A11Y-02 social-link reload-persistence anchor (PRODUCT-GAP-PARTIAL:
      // url-format validation deferred per .planning/todos/pending/2026-05-12-a11y-01-product-gap-cells.md;
      // this slot exercises persistence ONLY, asserting the saved URL string
      // round-trips identically across page.reload()).
      //
      // Phase 81 lifts the PRODUCT-GAP-PARTIAL to FULL via subtype:'link' dispatch —
      // QuestionInput.svelte:65 remaps Text+subtype='link' to InputProps['type']='url'
      // → Input.svelte URL validation branch at lines 286-296 is now REACHABLE on this
      // row's candidate-profile input. See
      // .planning/phases/81-a11y-01-product-gap-cells-email-url-format/81-VERIFICATION.md.
      {
        external_id: 'test-question-social-1',
        type: 'text',
        subtype: 'link', // Phase 81 — enables URL dispatch via QuestionInput.svelte:65
        name: { en: 'Social link (Phase 76 anchor)' },
        category: { external_id: 'test-category-info' },
        allow_open: false,
        required: false,
        sort_order: 21,
        is_generated: false
      },
      // Phase 77 / SETTINGS-01 wave B Plan 02 — NumberFilter anchor.
      //
      // First number-typed question in the e2e template. NumberFilter renders
      // via EntityFilters.svelte:48-51 → NumericEntityFilter (2 range sliders).
      // The filter UI's range derives from entity values via parseValues() (see
      // packages/filters/src/filter/number/numberFilter.ts:38-51), NOT from the
      // question's `data.min`/`max` — so the in-DB question shape MAY omit
      // top-level `min`/`max` and the filter still renders correctly as long as
      // ≥1 candidate has a non-missing number answer.
      //
      // `custom_data.{filterable, min, max}`:
      //   - `filterable: true` is the gating flag (filterStore.svelte.ts:55-66).
      //   - `min: 0` + `max: 100` document the intended range; NumberQuestion's
      //     domain class reads `data.min`/`data.max` (NumberQuestionData type),
      //     not `customData.min`/`customData.max` — so these specifically do NOT
      //     propagate to `NumberQuestion.isMatchable` today (the Supabase adapter
      //     does not lift `custom_data.{min,max}` to top-level NumberQuestionData
      //     fields). This is intentional for Plan 02: the filter UI is the
      //     assertion target; matching with min/max is OUT OF SCOPE.
      //
      // sort_order: 22 — placed AFTER Phase 76's test-question-social-1 (sort 21).
      // Voter fixture's default voterAnswerCount=16 Likert loop is unaffected:
      // sort 22 > 16, voter never encounters this info question.
      //
      // `required: false` keeps the voter answer flow + candidate `profileComplete`
      // gating unchanged (this is an info question with `category: test-category-info`).
      {
        external_id: 'test-question-number-1',
        type: 'number',
        name: { en: 'Test Number Question 1 (SETTINGS-01 wave B NumberFilter anchor)' },
        category: { external_id: 'test-category-info' },
        custom_data: { filterable: true, min: 0, max: 100 },
        allow_open: false,
        required: false,
        sort_order: 22,
        is_generated: false
      },
      // Phase 81 A11Y-05 anchor — email-format dispatch via Question.subtype='email'.
      // QuestionInput.svelte:65-67 dispatches subtype==='email' → InputProps['type']='email',
      // which routes through Input.svelte's email validation branch (mirrors the URL branch
      // at Input.svelte:286-296 — pragmatic regex check + handleError on fail + value-preservation
      // by returning before value=assignment).
      //
      // VALUE-DISJOINTNESS INVARIANT (Phase 76 P01 fixture-extension fix):
      // Alpha's answer value MUST NOT contain the substring 'Alpha' / 'alpha'
      // (case-insensitive). The candidate-questions.spec.ts CAND-06 assertion at
      // line 271 reads strict-mode getByText('Alpha', { exact: false }) — adding
      // a cell whose preview-rendered value contains 'alpha' would break that
      // single-anchor lookup. The 'sentinel-81@example.com' value below stays disjoint.
      //
      // sort_order: 23 — placed AFTER Phase 77's test-question-number-1 (sort 22).
      // Voter fixture's default voterAnswerCount=16 Likert loop is unaffected:
      // sort 23 > 16, voter never encounters this info question.
      {
        external_id: 'test-question-email-1',
        type: 'text',
        subtype: 'email',
        name: { en: 'Email address (Phase 81 A11Y-05 anchor)' },
        category: { external_id: 'test-category-info' },
        allow_open: false,
        required: false,
        sort_order: 23,
        is_generated: false
      }
    ]
  },

  // §1 + §2.1 + §2.2 — 13 candidates total.
  //
  // ORDERING INVARIANT (§2.2): test-candidate-alpha MUST be the first
  // registered candidate entry so `defaultDataset.candidates[0]` resolves to
  // it. testCredentials.ts:10 reads `defaultDataset.candidates[0].email` as
  // TEST_CANDIDATE_EMAIL. Phase 59 will consume this ordering when it
  // rewrites seed-test-data.ts.
  //
  // ORDERING INVARIANT (§2.2): test-candidate-unregistered must precede
  // test-candidate-unregistered-2 so registration.spec.ts:28-29 +
  // profile.spec.ts:33-34 can read addendum.candidates[0] / [1] by index.
  // Under the unified template, these are positions [11] and [12] — the
  // filtering by `terms_of_use_accepted` absence in Phase 59 setup code
  // restores the two-element addendum view.
  //
  // terms_of_use_accepted:
  //   • SET on 11 candidates (alpha + beta + gamma + delta + epsilon +
  //     voter-cand-agree/close/neutral/oppose/mixed/partial) — voter-results.spec.ts:40-46
  //     asserts 11 visible candidate cards (spec-asserted invariant).
  //   • ABSENT on 2 addendum + 1 voter-hidden = 3 candidates total hidden from
  //     results; voter-matching.spec.ts:234-240 asserts test-voter-cand-hidden
  //     NOT visible (candidate-level filter).
  //
  // email (§6 + §2.2):
  //   • mock.candidate.2@openvaa.org on test-candidate-alpha — load-bearing;
  //     Phase 59's data.setup.ts reads this via forceRegister.
  //   • test.unregistered@openvaa.org / test.unregistered2@openvaa.org on
  //     the two addendum rows — Phase 59's unregisterCandidate consumes.
  //   bulk_import drops unknown fields; `email` is preserved here as a
  //   Phase 59 hand-off payload (NOT a candidates-table column).
  candidates: {
    count: 0,
    fixed: [
      // Default-dataset registered candidates (test-candidate-alpha FIRST per §2.2)
      {
        external_id: 'test-candidate-alpha',
        first_name: 'Test',
        last_name: 'Candidate Alpha',
        email: 'mock.candidate.2@openvaa.org', // §6 — Phase 59 forceRegister target
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 0,
        is_generated: false,
        organization: { external_id: 'test-party-a' },
        // §1 row 3 + §4 row "info markdown on Alpha" — voter-detail.spec.ts:88
        // reads answersByExternalId['test-question-text'].value as slogan;
        // voter-detail.spec.ts:107-112 iterates Alpha's openAnswerKeys.
        answersByExternalId: {
          'test-question-1': {
            value: '4',
            info: { en: 'I believe progressive taxation helps reduce inequality.' }
          },
          'test-question-3': {
            value: '3',
            info: { en: 'The transition must be balanced with economic realities.' }
          },
          'test-question-5': {
            value: '5',
            info: { en: 'Healthcare is a fundamental right for everyone.' }
          },
          'test-question-7': { value: '4' },
          'test-question-text': { value: { en: 'Progress for all' } },
          // E2E-07/directional-metric-anchor: alpha's answer to the categorical
          // question (Phase 74 Plan 05 Task 1). Voter doesn't answer the
          // categorical (sort_order 17 > voter.fixture default 16), so the
          // directional SubMatch row in alpha's voter-detail drawer is the
          // entity-answered/voter-missing case — exactly what E2E-07's
          // "per-category SubMatch grid renders" asserts.
          'test-question-directional-1': { value: 'a' },
          // QSPEC-01/boolean-render-anchor: alpha's answer to the boolean
          // question (Phase 75 Plan 01 Task 1). Drives QSPEC-01 step 4
          // entity-detail mirror — case-(a) "both answered same value true"
          // per QuestionChoices.svelte:245-253 display-label branch:
          // voter clicks 'Yes' (mapped to `true` via the onChange adapter at
          // OpinionQuestionInput.svelte:110) + alpha answered true → both
          // rows show 'Yes' selected. Spec asserts: .entitySelected count=1,
          // radio[checked] count=1, getByText('You') attached.
          'test-question-boolean-1': { value: true },
          // Phase 76 A11Y-01 (cell-3 anchor) + A11Y-02 (persistence anchors).
          // Display-name + bio + social-link answer cells are read post-reload
          // by Plan 02's persistence spec; A11Y-01 cell-3 fills above the
          // maxlength=50 ceiling and asserts the HTML5 native cap kicks in.
          //
          // VALUE-DISJOINTNESS INVARIANT (Phase 76 P01 fixture-extension fix):
          // these three answer values MUST NOT contain the substring 'Alpha'
          // (case-insensitive substring `alpha`/`Alpha`). The existing
          // candidate-questions.spec.ts CAND-06 assertion at line 271 reads
          // `previewPage.container.getByText('Alpha', { exact: false })` in
          // strict mode — adding more cells whose values render in the preview
          // and contain 'Alpha' would surface the candidate's profile answers
          // alongside the firstName/lastName 'Test Candidate Alpha' heading
          // and break that single-anchor lookup. Phase 76 P01 keeps the
          // additive contract by using disjoint sentinel strings.
          'test-question-displayname': { value: { en: 'Display Name Sentinel 76' } },
          'test-question-bio': {
            value: { en: 'Phase 76 biography sentinel used by A11Y-02 reload-persistence.' }
          },
          // reason: post-Phase-81 sort-21 dispatches to single-locale 'url' input; LocalizedString {en:...} → MISSING_VALUE per TextQuestion._ensureValue. Plain string aligns with new render shape (Pitfall 4 option a).
          'test-question-social-1': { value: 'https://example.com/sentinel-76' },
          // Phase 77 / SETTINGS-01 wave B Plan 02 — Alpha's NumberFilter anchor
          // answer. Value 25 sits well above 0 and below the other 3 candidates'
          // values (60, 50, 75) so a min-slider move to >25 narrows Alpha out
          // deterministically.
          'test-question-number-1': { value: 25 },
          // reason: plain-string shape (NOT LocalizedString) so the subtype:'email' single-locale dispatch's ensureString path renders the seeded value correctly per Pitfall 4. sentinel-81 substring is disjoint from 'alpha' per the value-disjointness invariant.
          'test-question-email-1': { value: 'sentinel-81@example.com' }
        }
      },
      {
        external_id: 'test-candidate-beta',
        first_name: 'Test',
        last_name: 'Candidate Beta',
        email: 'test.beta@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 1,
        is_generated: false,
        organization: { external_id: 'test-party-a' },
        answersByExternalId: {
          'test-question-1': { value: '5' },
          'test-question-2': { value: '5' },
          'test-question-3': { value: '4' },
          'test-question-4': { value: '5' },
          'test-question-5': { value: '4' },
          'test-question-6': { value: '5' },
          'test-question-7': { value: '5' },
          'test-question-8': { value: '4' },
          // Phase 77 / SETTINGS-01 wave B Plan 02 — NumberFilter target.
          'test-question-number-1': { value: 75 }
        }
      },
      {
        external_id: 'test-candidate-gamma',
        first_name: 'Test',
        last_name: 'Candidate Gamma',
        email: 'test.gamma@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 2,
        is_generated: false,
        organization: { external_id: 'test-party-b' },
        answersByExternalId: {
          'test-question-1': { value: '2' },
          'test-question-2': { value: '1' },
          'test-question-3': { value: '2' },
          'test-question-4': { value: '1' },
          'test-question-5': { value: '2' },
          'test-question-6': { value: '1' },
          'test-question-7': { value: '2' },
          'test-question-8': { value: '1' },
          // Phase 77 / SETTINGS-01 wave B Plan 02 — NumberFilter target.
          'test-question-number-1': { value: 50 }
        }
      },
      {
        external_id: 'test-candidate-delta',
        first_name: 'Test',
        last_name: 'Candidate Delta',
        email: 'test.delta@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 3,
        is_generated: false,
        organization: { external_id: 'test-party-b' },
        answersByExternalId: {
          'test-question-1': { value: '1' },
          'test-question-2': { value: '2' },
          'test-question-3': { value: '1' },
          'test-question-4': { value: '2' },
          'test-question-5': { value: '1' },
          'test-question-6': { value: '2' },
          'test-question-7': { value: '1' },
          'test-question-8': { value: '2' }
        }
      },
      {
        external_id: 'test-candidate-epsilon',
        first_name: 'Test',
        last_name: 'Candidate Epsilon',
        email: 'test.epsilon@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 4,
        is_generated: false,
        organization: { external_id: 'test-party-a' },
        answersByExternalId: {
          'test-question-1': { value: '3' },
          'test-question-2': { value: '3' },
          'test-question-3': { value: '3' },
          'test-question-4': { value: '3' },
          'test-question-5': { value: '3' },
          'test-question-6': { value: '3' },
          'test-question-7': { value: '3' },
          'test-question-8': { value: '3' }
        }
      },
      // Voter-dataset registered candidates (§2.1 firstName/lastName verbatim)
      {
        external_id: 'test-voter-cand-agree',
        first_name: 'Fully',
        last_name: 'Agree',
        email: 'voter.cand.agree@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 5,
        is_generated: false,
        organization: { external_id: 'test-voter-party-a' },
        // All voter-q-1..8 at Likert-5 "Fully agree" — voter-matching.spec.ts:202-204
        // asserts this candidate is firstCard (highest match).
        answersByExternalId: {
          'test-voter-q-1': { value: '5' },
          'test-voter-q-2': { value: '5' },
          'test-voter-q-3': { value: '5' },
          'test-voter-q-4': { value: '5' },
          'test-voter-q-5': { value: '5' },
          'test-voter-q-6': { value: '5' },
          'test-voter-q-7': { value: '5' },
          'test-voter-q-8': { value: '5' },
          // Phase 77 / SETTINGS-01 wave B Plan 02 — NumberFilter target.
          'test-question-number-1': { value: 60 }
        }
      },
      {
        external_id: 'test-voter-cand-close',
        first_name: 'Mostly',
        last_name: 'Close',
        email: 'voter.cand.close@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 6,
        is_generated: false,
        organization: { external_id: 'test-voter-party-a' },
        answersByExternalId: {
          'test-voter-q-1': { value: '4' },
          'test-voter-q-2': { value: '4' },
          'test-voter-q-3': { value: '4' },
          'test-voter-q-4': { value: '4' },
          'test-voter-q-5': { value: '4' },
          'test-voter-q-6': { value: '4' },
          'test-voter-q-7': { value: '4' },
          'test-voter-q-8': { value: '4' }
        }
      },
      {
        external_id: 'test-voter-cand-neutral',
        first_name: 'Neutral',
        last_name: 'Middle',
        email: 'voter.cand.neutral@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 7,
        is_generated: false,
        organization: { external_id: 'test-voter-party-a' },
        answersByExternalId: {
          'test-voter-q-1': { value: '3' },
          'test-voter-q-2': { value: '3' },
          'test-voter-q-3': { value: '3' },
          'test-voter-q-4': { value: '3' },
          'test-voter-q-5': { value: '3' },
          'test-voter-q-6': { value: '3' },
          'test-voter-q-7': { value: '3' },
          'test-voter-q-8': { value: '3' }
        }
      },
      {
        external_id: 'test-voter-cand-oppose',
        first_name: 'Fully',
        last_name: 'Oppose',
        email: 'voter.cand.oppose@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 8,
        is_generated: false,
        organization: { external_id: 'test-voter-party-b' },
        // All voter-q-1..8 at Likert-5 "Fully disagree" — voter-matching.spec.ts:212-214
        // asserts this candidate is lastCard (lowest match).
        answersByExternalId: {
          'test-voter-q-1': { value: '1' },
          'test-voter-q-2': { value: '1' },
          'test-voter-q-3': { value: '1' },
          'test-voter-q-4': { value: '1' },
          'test-voter-q-5': { value: '1' },
          'test-voter-q-6': { value: '1' },
          'test-voter-q-7': { value: '1' },
          'test-voter-q-8': { value: '1' }
        }
      },
      {
        external_id: 'test-voter-cand-mixed',
        first_name: 'Mixed',
        last_name: 'Views',
        email: 'voter.cand.mixed@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 9,
        is_generated: false,
        organization: { external_id: 'test-voter-party-b' },
        answersByExternalId: {
          'test-voter-q-1': { value: '5' },
          'test-voter-q-2': { value: '1' },
          'test-voter-q-3': { value: '4' },
          'test-voter-q-4': { value: '2' },
          'test-voter-q-5': { value: '3' },
          'test-voter-q-6': { value: '4' },
          'test-voter-q-7': { value: '2' },
          'test-voter-q-8': { value: '5' }
        }
      },
      {
        external_id: 'test-voter-cand-partial',
        first_name: 'Partial',
        last_name: 'Answers',
        email: 'voter.cand.partial@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 10,
        is_generated: false,
        organization: { external_id: 'test-voter-party-b' },
        // Only 4 of 8 answered — voter-matching.spec.ts:221-231 asserts
        // this candidate is neither first nor last, but visible.
        answersByExternalId: {
          'test-voter-q-1': { value: '4' },
          'test-voter-q-3': { value: '3' },
          'test-voter-q-5': { value: '4' },
          'test-voter-q-7': { value: '3' }
        }
      },
      // Hidden / unregistered candidates (terms_of_use_accepted ABSENT per §8.3)
      {
        external_id: 'test-voter-cand-hidden',
        first_name: 'Hidden',
        last_name: 'NoTerms',
        email: 'voter.cand.hidden@openvaa.org',
        // terms_of_use_accepted DELIBERATELY absent — voter-matching.spec.ts:121
        // finds this via `!c.termsOfUseAccepted` filter + asserts NOT visible
        // at :234-240.
        sort_order: 11,
        is_generated: false,
        organization: { external_id: 'test-voter-party-a' },
        answersByExternalId: {
          'test-voter-q-1': { value: '5' },
          'test-voter-q-2': { value: '5' },
          'test-voter-q-3': { value: '5' },
          'test-voter-q-4': { value: '5' },
          'test-voter-q-5': { value: '5' },
          'test-voter-q-6': { value: '5' },
          'test-voter-q-7': { value: '5' },
          'test-voter-q-8': { value: '5' }
        }
      },
      // Addendum unregistered candidates — §2.2 ordering: addendum[0] then [1].
      // No terms_of_use_accepted, no answersByExternalId. Phase 59's
      // registration/profile specs target these via sendEmail → inviteUserByEmail.
      {
        external_id: 'test-candidate-unregistered',
        first_name: 'Test Candidate',
        last_name: 'Unregistered',
        email: 'test.unregistered@openvaa.org',
        sort_order: 12,
        is_generated: false,
        organization: { external_id: 'test-party-a' }
      },
      {
        external_id: 'test-candidate-unregistered-2',
        first_name: 'Test Candidate',
        last_name: 'Unregistered Two',
        email: 'test.unregistered2@openvaa.org',
        sort_order: 13,
        is_generated: false,
        organization: { external_id: 'test-party-a' }
      },
      // ---------------------------------------------------------------------
      // Phase 74 Plan 05 — E2E-05 4-case voter-vs-entity answer-state markers
      //
      // Four candidates exercising the 4-case answer-state contract in the
      // voter-detail drawer's opinions tab. Each pairs the voter's fixture
      // answers (Likert "Fully agree" via voter.fixture.ts:49 default
      // voterAnswerCount=16, voterAnswerIndex=4) against a specific marker
      // question to produce one of the 4 visual states asserted by
      // voter-detail.spec.ts §"voter-detail answer cases (E2E-05)".
      //
      // Ranking design (matching invariants — voter-matching.spec.ts):
      //   • Each candidate has ONE perfect ordinal-question answer ('5') and
      //     leaves 15 ordinal questions missing.
      //   • Under RelativeMaximum imputation (matchStore.svelte.ts dispatch +
      //     impute.ts:43), each missing ordinal contributes the max diff per
      //     question (4) → total Manhattan distance ≈ 60.
      //   • This sits clearly BETWEEN agree (~32) and oppose (~64), so:
      //       - "agree first" (voter-matching.spec.ts:199-206) — preserved
      //       - "oppose last" (voter-matching.spec.ts:208-216) — preserved
      //       - "partial in middle" (voter-matching.spec.ts:218-232) —
      //         preserved (partial at ~52 stays distinct from Case ~60)
      //   • The 4 Case candidates tie at distance 60 but oppose (64) is
      //     clearly worst → lastCard assertion holds.
      //
      // terms_of_use_accepted SET on all 4 → they appear in voter results.
      // parent_nomination links to test-nom-org-party-a (test-party-a) so
      // buildParentFilters sees their party link (e2e.ts:817-826 comment).
      //
      // E2E-05/case-(a): both answered (voter Q1='5'; entity Q1='5')
      {
        external_id: 'test-candidate-CaseA-Both',
        first_name: 'CaseA',
        last_name: 'Both',
        email: 'voter.cand.casea@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 14,
        is_generated: false,
        organization: { external_id: 'test-party-a' },
        // Marker = test-question-1 (first opinion question in sort order).
        // Both voter (via fixture: '5') and entity ('5') have answered →
        // .first() opinion-question-input in CaseA drawer shows both rows.
        answersByExternalId: {
          'test-question-1': { value: '5' }
        }
      },
      // E2E-05/case-(b): voter answered, entity missing
      {
        external_id: 'test-candidate-CaseB-VoterOnly',
        first_name: 'CaseB',
        last_name: 'VoterOnly',
        email: 'voter.cand.caseb@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 15,
        is_generated: false,
        organization: { external_id: 'test-party-a' },
        // Marker = test-question-1. Voter answered (via fixture: '5'); entity
        // has NO answer for test-question-1. CaseB answers test-question-2='5'
        // to keep matching distance at ~60 (one perfect answer + 15 missing).
        // .first() opinion-question-input in CaseB drawer shows voter row
        // only (no .entitySelected class on test-question-1).
        answersByExternalId: {
          'test-question-2': { value: '5' }
        }
      },
      // E2E-05/case-(c): voter missing, entity answered
      {
        external_id: 'test-candidate-CaseC-EntityOnly',
        first_name: 'CaseC',
        last_name: 'EntityOnly',
        email: 'voter.cand.casec@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 16,
        is_generated: false,
        organization: { external_id: 'test-party-a' },
        // Marker = test-question-directional-1 (categorical question, sort 17,
        // ABOVE voter fixture's voterAnswerCount=16 → voter doesn't answer).
        // Entity has an answer for it. .last() opinion-question-input in
        // CaseC drawer shows entity row only (entitySelected) with no 'You'
        // label. CaseC also answers test-question-1='5' for ranking parity
        // with the other Case candidates (~60 distance).
        answersByExternalId: {
          'test-question-1': { value: '5' },
          'test-question-directional-1': { value: 'b' }
        }
      },
      // E2E-05/case-(d): both missing
      {
        external_id: 'test-candidate-CaseD-Neither',
        first_name: 'CaseD',
        last_name: 'Neither',
        email: 'voter.cand.cased@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 17,
        is_generated: false,
        organization: { external_id: 'test-party-a' },
        // Marker = test-question-directional-1. Voter doesn't answer the
        // categorical (sort 17 > voter fixture count 16); entity also has
        // no answer for it. In CaseD's opinions tab, the directional question
        // renders the "Neither you nor {entity} has answered this question"
        // message (EntityOpinions.svelte:57-60, en/questions.json
        // bothHaventAnswered). CaseD answers test-question-4='5' for ranking
        // parity (~60 distance — keeps oppose clearly last).
        answersByExternalId: {
          'test-question-4': { value: '5' }
        }
      }
    ]
  },

  // §3 — 18 nominations total, one per relational triangle.
  //
  // §3.1 default-dataset: 5 candidate + 2 organization = 7
  // §3.2 voter-dataset:   7 candidate + 2 organization = 9
  // §3.3 addendum:        2 candidate (both unconfirmed: true) = 2
  //
  // Phase 64 Plan 64-01 extension (D-04 + 64-RESEARCH.md §3 + repro-notes.md):
  // The 11 visible candidate nominations are linked to the 4 organization
  // nominations via parent_nomination so buildParentFilters() (in
  // apps/frontend/src/lib/contexts/voter/filters/buildParentFilters.ts) sees
  // a populated parent set and emits a party EnumeratedFilter on the voter
  // results candidates tab. Without this wiring, FilterGroup.filters.length
  // is 0 on the candidates tab and the entity-list-filter button does NOT
  // render — this is the empirically-confirmed root cause of the post-Task-2
  // hard-fail signal in voter-results.spec.ts (RESULTS-01/02 + D-14 + D-15).
  // The 1 hidden candidate (unconfirmed) and 2 addendum candidates (also
  // unconfirmed) intentionally retain NO parent_nomination — adding party
  // links to invisible candidates would be coupling-noise.
  //
  // Distribution (3-3-3-2 across 4 parties):
  //   test-nom-org-party-a       → alpha, beta, agree            (3 candidates)
  //   test-nom-org-party-b       → gamma, delta, close           (3 candidates)
  //   test-voter-nom-org-party-a → epsilon, neutral, oppose      (3 candidates)
  //   test-voter-nom-org-party-b → mixed, partial                (2 candidates)
  // Validation invariant (validate_nomination trigger lines 360-373):
  // each child's election_id, constituency_id, election_round must equal the
  // parent's. All triangles use election=test-election-1, constituency=
  // test-constituency-alpha, election_round=1, so the constraint holds.
  //
  // Organization-type nominations (test-nom-org-*) make the 4 parties
  // visible on the voter results "parties" tab.
  //
  // ALL triangles point at test-election-1 + test-constituency-alpha per §3.
  // test-election-2 + test-constituency-e2 are not wired to any base-template
  // nomination — overlay variants (Phase 59/60) will add their own triangles.
  nominations: {
    count: 0,
    fixed: [
      // §3.1 — default-dataset organization triangles (declared FIRST so the
      // candidate triangles below can resolve parent_nomination external_ids).
      // bulk_import resolves parent_nomination at write time with the same
      // FK semantics as election/constituency refs; declaring parents above
      // children keeps the literal ordering self-documenting even though the
      // resolver doesn't strictly require it.
      {
        external_id: 'test-nom-org-party-a',
        organization: { external_id: 'test-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-nom-org-party-b',
        organization: { external_id: 'test-party-b' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // §3.2 — voter-dataset organization triangles (declared early for the
      // same parent-resolution reason as §3.1's organization triangles).
      {
        external_id: 'test-voter-nom-org-party-a',
        organization: { external_id: 'test-voter-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-org-party-b',
        organization: { external_id: 'test-voter-party-b' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // §3.1 — default-dataset candidate triangles (Phase 64 P01: parent_nomination)
      {
        external_id: 'test-nom-alpha',
        candidate: { external_id: 'test-candidate-alpha' },
        parent_nomination: { external_id: 'test-nom-org-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-nom-beta',
        candidate: { external_id: 'test-candidate-beta' },
        parent_nomination: { external_id: 'test-nom-org-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-nom-gamma',
        candidate: { external_id: 'test-candidate-gamma' },
        parent_nomination: { external_id: 'test-nom-org-party-b' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-nom-delta',
        candidate: { external_id: 'test-candidate-delta' },
        parent_nomination: { external_id: 'test-nom-org-party-b' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-nom-epsilon',
        candidate: { external_id: 'test-candidate-epsilon' },
        parent_nomination: { external_id: 'test-voter-nom-org-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // §3.2 — voter-dataset candidate triangles (Phase 64 P01: parent_nomination)
      {
        external_id: 'test-voter-nom-agree',
        candidate: { external_id: 'test-voter-cand-agree' },
        parent_nomination: { external_id: 'test-nom-org-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-close',
        candidate: { external_id: 'test-voter-cand-close' },
        parent_nomination: { external_id: 'test-nom-org-party-b' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-neutral',
        candidate: { external_id: 'test-voter-cand-neutral' },
        parent_nomination: { external_id: 'test-voter-nom-org-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-oppose',
        candidate: { external_id: 'test-voter-cand-oppose' },
        parent_nomination: { external_id: 'test-voter-nom-org-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-mixed',
        candidate: { external_id: 'test-voter-cand-mixed' },
        parent_nomination: { external_id: 'test-voter-nom-org-party-b' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      {
        external_id: 'test-voter-nom-partial',
        candidate: { external_id: 'test-voter-cand-partial' },
        parent_nomination: { external_id: 'test-voter-nom-org-party-b' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // §8.3 — double-belt-and-braces invisibility for test-voter-cand-hidden:
      // candidate lacks terms_of_use_accepted (candidate-level hidden) AND
      // the nomination carries `unconfirmed: true` (nomination-level hidden).
      // voter-matching.spec.ts:234-240 asserts NOT visible via candidate-level
      // absence; the nomination-level flag is preserved for robustness.
      // No parent_nomination — hidden candidates intentionally have no party
      // affiliation; this row is invisible regardless.
      {
        external_id: 'test-voter-nom-hidden',
        candidate: { external_id: 'test-voter-cand-hidden' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1,
        unconfirmed: true
      },
      // §3.3 — addendum candidate triangles (unconfirmed: true required)
      // No parent_nomination — addendum candidates are unconfirmed test
      // material; party affiliation isn't required for these.
      {
        external_id: 'test-nom-unregistered',
        candidate: { external_id: 'test-candidate-unregistered' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1,
        unconfirmed: true
      },
      {
        external_id: 'test-nom-unregistered-2',
        candidate: { external_id: 'test-candidate-unregistered-2' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1,
        unconfirmed: true
      },
      // ---------------------------------------------------------------------
      // Phase 74 Plan 05 — E2E-05 4-case nominations.
      //
      // Each Case candidate is nominated under test-nom-org-party-a so that
      // buildParentFilters (apps/frontend/src/lib/contexts/voter/filters/
      // buildParentFilters.ts) sees a populated parent set — matches the
      // existing "11 visible candidate nominations are linked to the 4
      // organization nominations" pattern at e2e.ts:817-826.
      //
      // All 4 use test-election-1 + test-constituency-alpha + election_round=1
      // so the validate_nomination trigger (migrations lines 360-373) holds:
      // child's election/constituency/round must equal parent's.
      // ---------------------------------------------------------------------
      // E2E-05/case-(a) nomination
      {
        external_id: 'test-nom-CaseA-Both',
        candidate: { external_id: 'test-candidate-CaseA-Both' },
        parent_nomination: { external_id: 'test-nom-org-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // E2E-05/case-(b) nomination
      {
        external_id: 'test-nom-CaseB-VoterOnly',
        candidate: { external_id: 'test-candidate-CaseB-VoterOnly' },
        parent_nomination: { external_id: 'test-nom-org-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // E2E-05/case-(c) nomination
      {
        external_id: 'test-nom-CaseC-EntityOnly',
        candidate: { external_id: 'test-candidate-CaseC-EntityOnly' },
        parent_nomination: { external_id: 'test-nom-org-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      },
      // E2E-05/case-(d) nomination
      {
        external_id: 'test-nom-CaseD-Neither',
        candidate: { external_id: 'test-candidate-CaseD-Neither' },
        parent_nomination: { external_id: 'test-nom-org-party-a' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-constituency-alpha' },
        election_round: 1
      }
    ]
  },

  // Phase 63 E2E-02: app_settings.fixed[] declaration (D-01 + Pitfall 2 +
  // Pitfall 6). Single-row — app_settings is UNIQUE(project_id), so at most
  // one row per project. External_id literal 'test-app-settings' survives
  // the AppSettingsGenerator's `${externalIdPrefix}${fx.external_id}` pass
  // through (externalIdPrefix is '' for the e2e template per D-58-15) and
  // is matched by `runTeardown('test-', client)` in setup files.
  //
  // Field name is `settings` (NOT `value`) — writer.ts:176 reads
  // `row.settings`; Pitfall 2 warns that a `value` field is silently dropped.
  //
  // Variant templates at tests/tests/setup/templates/variant-*.ts compose
  // this base via `mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY)`.
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings',
        settings: E2E_BASE_APP_SETTINGS
      }
    ]
  }
};
