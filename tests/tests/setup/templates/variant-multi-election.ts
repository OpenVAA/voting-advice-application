/**
 * Multi-election variant template — 2 elections with cross-nominations.
 *
 * Replaces the legacy `tests/tests/data/overlays/multi-election-overlay`
 * JSON fixture per Phase 59 E2E-02 (deleted in Plan 59-06). Loaded via
 * `yarn dev:seed --template tests/tests/setup/templates/variant-multi-election.ts`.
 *
 * Spec contract:
 *   - tests/tests/specs/variants/multi-election.spec.ts (CONF-01/02/04).
 *   - tests/tests/specs/variants/results-sections.spec.ts (CONF-05/06) — the
 *     results-sections project reuses the multi-election dataset.
 *
 * Base: BUILT_IN_TEMPLATES.e2e (packages/dev-seed/src/templates/e2e.ts).
 *
 * Overlay-row inventory (original JSON -> this template):
 *   - constituencies: 0 NEW (test-constituency-e2 already in base, skip)
 *   - constituency_groups: 1 NEW (test-cg-e2)
 *   - elections: 0 NEW (test-election-2 already in base, skip)
 *   - question_categories: 1 NEW (test-cat-e2-policy)
 *   - questions: 2 NEW (test-e2-q-1, test-e2-q-2)
 *   - candidates: 3 NEW (test-e2-cand-1, -2, -3)
 *   - nominations: 6 NEW — 3 for new e2-cand-{1,2,3} and 3 cross-nominations
 *     re-nominating base candidates alpha/beta/gamma onto Election-2 (the
 *     defining shape change of this variant: existing candidates appear on
 *     BOTH elections)
 *
 * Shape-drift corrections from the legacy JSON overlay: camelCase -> snake_case
 * on every ref object; stringified numeric choice values coerced to numeric
 * form; template-schema-managed fields (project id, published) dropped.
 * See variant-constituency.ts header for the full transcription recipe.
 */
import { BUILT_IN_TEMPLATES, type Template } from '@openvaa/dev-seed';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-multi-election: BUILT_IN_TEMPLATES.e2e is undefined.');

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

  // Pass-through tables (overlay adds no rows or adds only duplicates
  // of base rows).
  organizations: { count: 0, fixed: baseFixed('organizations') },
  elections: { count: 0, fixed: baseFixed('elections') },
  constituencies: { count: 0, fixed: baseFixed('constituencies') },
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

  // Extended: 1 NEW cg for Election-2 scoping (post-topo full-fanout still
  // wires every election to every CG; the cg exists for downstream specs
  // that iterate by external_id — results-sections.spec.ts:171-174).
  constituency_groups: {
    count: 0,
    fixed: [
      ...baseFixed('constituency_groups'),
      {
        external_id: 'test-cg-e2',
        name: { en: 'Test CG Election 2' },
        sort_order: 20,
        is_generated: false
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
  }
};

export default variantMultiElectionTemplate;
