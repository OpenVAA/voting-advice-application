/**
 * Multi-election variant template — 2 elections with cross-nominations.
 *
 * Spec contract:
 *   - tests/tests/specs/variants/multi-election.spec.ts (CONF-01/02/04).
 *   - tests/tests/specs/variants/results-sections.spec.ts (CONF-05/06) — the
 *     results-sections project reuses the multi-election dataset.
 *
 * Base: BUILT_IN_TEMPLATES.e2e (single-election baseline). This variant adds
 * Election-2 + its dedicated constituency group + a single constituency,
 * yielding 2 elections × 1 constituency-each (auto-implied at the voter
 * journey — the spec at multi-election.spec.ts:168-171 explicitly asserts
 * "constituency selection page is NOT shown" with single-constituency-per
 * -election seeds).
 *
 * Per-row `constituency_groups` / `constituencies` declarations override the
 * pipeline's full-fanout default — without them every election would wire to
 * every CG and CONFLATE the two elections' candidate pools.
 *
 * Overlay-row inventory:
 *   - elections: 1 NEW (test-election-2 — Test Election 2026)
 *   - constituency_groups: 1 NEW (test-cg-e2) — overrides base test-cg-1
 *     to declare its single constituency too
 *   - constituencies: 1 NEW (test-constituency-e2 — Election-2's only seat)
 *   - question_categories: 1 NEW (test-cat-e2-policy)
 *   - questions: 2 NEW (test-e2-q-1, test-e2-q-2)
 *   - candidates: 3 NEW (test-e2-cand-1, -2, -3)
 *   - nominations: 6 NEW — 3 for new e2-cand-{1,2,3} and 3 cross-nominations
 *     re-nominating base candidates alpha/beta/gamma onto Election-2 (the
 *     defining multi-election shape: candidates appear on BOTH elections)
 */
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS, type Template } from '@openvaa/dev-seed';
import { mergeSettings } from '@openvaa/app-shared';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-multi-election: BUILT_IN_TEMPLATES.e2e is undefined.');

/**
 * Phase 63 E2E-02 (D-02 + D-03): multi-election overlay. Adds the two popup
 * suppression flags that the legacy `variant-multi-election.setup.ts:43-59`
 * block set on top of the base keys — `showFeedbackPopup` and
 * `showSurveyPopup` at `results.*`. Deep merge (mergeSettings) preserves base
 * `results.cardContents` + `results.sections`; a shallow merge would clobber
 * them (which is why `@openvaa/app-shared#mergeSettings` is used here, NOT
 * `mergeAppSettings` from the frontend — the latter is a SHALLOW merge).
 */
const MULTI_ELECTION_APP_SETTINGS_OVERLAY = {
  // The multi-election spec walks Home → Intro → /elections → /questions and
  // expects to land on a question page directly (no questions intro). Override
  // the now-default `show: true` from E2E_BASE_APP_SETTINGS so the page
  // bypasses the intro step.
  questions: {
    questionsIntro: { allowCategorySelection: false, show: false }
  },
  results: {
    showFeedbackPopup: 0,
    showSurveyPopup: 0
  }
} as const;

type FixedRow = Record<string, unknown>;

function baseFixed(table: 'elections' | 'constituency_groups' | 'constituencies' | 'organizations' | 'question_categories' | 'questions' | 'candidates' | 'nominations'): Array<FixedRow> {
  const fragment = base[table] as { fixed?: Array<FixedRow> } | undefined;
  return fragment?.fixed ?? [];
}

const LIKERT_5_EN: Array<{ id: string; label: { en: string }; normalizableValue: number }> = [
  { id: '1', label: { en: 'Fully disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Somewhat disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Neutral' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Somewhat agree' }, normalizableValue: 4 },
  { id: '5', label: { en: 'Fully agree' }, normalizableValue: 5 }
];

export const variantMultiElectionTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,

  // Pass-through: organizations.
  organizations: { count: 0, fixed: baseFixed('organizations') },

  // Extended: 2 elections. test-election-1 is taken from base + given an
  // explicit `constituency_groups` ref so the pipeline doesn't fall back
  // to full-fanout (which would wire it to test-cg-e2 too). test-election-2
  // is new and declares its own group.
  elections: {
    count: 0,
    fixed: [
      ...baseFixed('elections').map((row) => ({
        ...row,
        constituency_groups: [{ external_id: 'test-cg-1' }]
      })),
      {
        external_id: 'test-election-2',
        name: { en: 'Test Election 2026' },
        short_name: { en: 'Election 2026' },
        election_type: 'general',
        election_date: '2026-06-15',
        sort_order: 1,
        is_generated: false,
        multiple_rounds: false,
        current_round: 1,
        constituency_groups: [{ external_id: 'test-cg-e2' }]
      }
    ]
  },

  // Extended: 1 NEW constituency for Election-2 (test-constituency-e2).
  // Single constituency per election → /constituencies page is bypassed via
  // auto-imply, satisfying the multi-election.spec.ts:168-171 contract.
  constituencies: {
    count: 0,
    fixed: [
      ...baseFixed('constituencies'),
      {
        external_id: 'test-constituency-e2',
        name: { en: 'Test Constituency E2' },
        sort_order: 1,
        is_generated: false
      }
    ]
  },
  candidates: {
    count: 0,
    fixed: [
      ...baseFixed('candidates'),
      {
        external_id: 'test-e2-cand-1',
        first_name: 'E2 Candidate',
        last_name: 'One',
        email: 'e2.cand1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 20,
        is_generated: false,
        answersByExternalId: {
          'test-e2-q-1': { value: '5' },
          'test-e2-q-2': { value: '3' }
        }
      },
      {
        external_id: 'test-e2-cand-2',
        first_name: 'E2 Candidate',
        last_name: 'Two',
        email: 'e2.cand2@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 21,
        is_generated: false,
        answersByExternalId: {
          'test-e2-q-1': { value: '2' },
          'test-e2-q-2': { value: '4' }
        }
      },
      {
        external_id: 'test-e2-cand-3',
        first_name: 'E2 Candidate',
        last_name: 'Three',
        email: 'e2.cand3@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 22,
        is_generated: false,
        answersByExternalId: {
          'test-e2-q-1': { value: '3' },
          'test-e2-q-2': { value: '1' }
        }
      }
    ]
  },

  // Extended: 2 cgs total. test-cg-1 is from base + given an explicit
  // `constituencies` ref (alpha only) so the pipeline doesn't full-fanout
  // it onto test-constituency-e2. test-cg-e2 is new and declares e2.
  constituency_groups: {
    count: 0,
    fixed: [
      ...baseFixed('constituency_groups').map((row) => ({
        ...row,
        constituencies: [{ external_id: 'test-constituency-alpha' }]
      })),
      {
        external_id: 'test-cg-e2',
        name: { en: 'Test CG Election 2' },
        sort_order: 20,
        is_generated: false,
        constituencies: [{ external_id: 'test-constituency-e2' }]
      }
    ]
  },

  // Extended: 1 NEW Election-2-scoped category.
  question_categories: {
    count: 0,
    fixed: [
      ...baseFixed('question_categories'),
      {
        external_id: 'test-cat-e2-policy',
        name: { en: 'Test E2 Category: Policy' },
        category_type: 'opinion',
        sort_order: 20,
        is_generated: false
      }
    ]
  },

  // Extended: 2 NEW Election-2-scoped questions.
  questions: {
    count: 0,
    fixed: [
      ...baseFixed('questions'),
      {
        external_id: 'test-e2-q-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'E2 Question: Should public housing be expanded?' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-cat-e2-policy' },
        allow_open: true,
        required: true,
        sort_order: 201,
        is_generated: false
      },
      {
        external_id: 'test-e2-q-2',
        type: 'singleChoiceOrdinal',
        name: { en: 'E2 Question: Should local taxes be reduced?' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-cat-e2-policy' },
        allow_open: true,
        required: true,
        sort_order: 202,
        is_generated: false
      }
    ]
  },

  // Extended: 6 NEW nomination triangles. Three nominate the new e2-cand-*
  // candidates onto Election-2 × test-constituency-e2. Three cross-nominate
  // base candidates alpha/beta/gamma onto Election-2 — the defining
  // multi-election shape: candidates appear on BOTH elections.
  // Overlay-side `organization` refs on candidate-type nominations dropped
  // per NominationsGenerator.ts contract (candidate-type nominations carry
  // only the candidate ref; organization linkage flows through
  // candidates.organization_id).
  nominations: {
    count: 0,
    fixed: [
      ...baseFixed('nominations'),
      {
        external_id: 'test-nom-e2-cand1',
        candidate: { external_id: 'test-e2-cand-1' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-constituency-e2' },
        election_round: 1
      },
      {
        external_id: 'test-nom-e2-cand2',
        candidate: { external_id: 'test-e2-cand-2' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-constituency-e2' },
        election_round: 1
      },
      {
        external_id: 'test-nom-e2-cand3',
        candidate: { external_id: 'test-e2-cand-3' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-constituency-e2' },
        election_round: 1
      },
      {
        external_id: 'test-nom-e2-alpha',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-constituency-e2' },
        election_round: 1
      },
      {
        external_id: 'test-nom-e2-beta',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-constituency-e2' },
        election_round: 1
      },
      {
        external_id: 'test-nom-e2-gamma',
        candidate: { external_id: 'test-candidate-gamma' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-constituency-e2' },
        election_round: 1
      }
    ]
  },

  // Phase 63 E2E-02 (D-02 + D-03 + RESOLVED Q1): compose variant-scoped
  // app_settings from the base + popup-suppression overlay. Writer Pass-5
  // (Pitfall 2) reads `row.settings`; variant-scoped external_id survives
  // the `runTeardown('test-', ...)` filter (Pitfall 6). Deep merge preserves
  // base `results.cardContents` + `results.sections` (Pitfall 3 additive).
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-multi-election',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, MULTI_ELECTION_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantMultiElectionTemplate;
