/**
 * startFromConstituencyGroup variant template — orphan-municipality edge case.
 *
 * Replaces the legacy `tests/tests/data/overlays/startfromcg-overlay` JSON
 * fixture per Phase 59 E2E-02 (deleted in Plan 59-06). Loaded via
 * `yarn dev:seed --template tests/tests/setup/templates/variant-startfromcg.ts`.
 *
 * Spec contract: tests/tests/specs/variants/startfromcg.spec.ts
 * (CONF-related flow-edge tests — reversed flow where picking a constituency
 * does NOT imply a region, and the "Orphan Municipality" constituency has
 * no parent region at all).
 *
 * Base: BUILT_IN_TEMPLATES.e2e (packages/dev-seed/src/templates/e2e.ts).
 *
 * Overlay-row inventory (original JSON -> this template):
 *   - constituencies: 5 NEW (test-const-region-north, -south,
 *     test-const-muni-north-a, -south-a, test-const-muni-orphan). Unlike the
 *     constituency-variant overlay, startfromcg uses muni-orphan (no parent
 *     region) instead of muni-east.
 *   - constituency_groups: 1 NEW (test-cg-regions) + 1 DEDUPED
 *     (test-cg-municipalities already in base, skip)
 *   - elections: 0 NEW (test-election-1 + test-election-2 both in base, skip)
 *   - question_categories: 2 NEW (test-cat-sfcg-local, test-cat-sfcg-e2)
 *   - questions: 2 NEW (test-sfcg-q-1, test-sfcg-e2-q-1)
 *   - candidates: 4 NEW (test-sfcg-cand-north-1, -south-1, -orphan-1, -muni-1)
 *   - nominations: 6 NEW (4 for new candidates + 2 re-nominations of base
 *     candidates alpha/beta to new region constituencies on Election-1)
 *
 * Shape-drift corrections from the legacy JSON overlay: camelCase -> snake_case
 * on every ref object; stringified numeric choice values coerced to numeric
 * form; template-schema-managed fields (project id, published) dropped.
 * See variant-constituency.ts header for the full transcription recipe.
 */
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS, type Template } from '@openvaa/dev-seed';
import { mergeSettings } from '@openvaa/app-shared';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-startfromcg: BUILT_IN_TEMPLATES.e2e is undefined.');

/**
 * Phase 63 E2E-02 (D-02 + D-03): startFromConstituencyGroup variant overlay.
 * Empty overlay — the legacy `variant-startfromcg.setup.ts:44-56` block
 * carried exactly the base keys (no `results.*`), and the spec applies the
 * `startFromConstituencyGroup` ID at runtime (variant-startfromcg.setup.ts:21
 * describes the contract: the UUID is only known after querying the DB).
 */
const STARTFROMCG_APP_SETTINGS_OVERLAY = {} as const;

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

export const variantStartFromCgTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,

  // Pass-through tables.
  organizations: { count: 0, fixed: baseFixed('organizations') },
  elections: { count: 0, fixed: baseFixed('elections') },

  // Extended: test-cg-regions NEW, test-cg-municipalities DEDUPED (base).
  constituency_groups: {
    count: 0,
    fixed: [
      ...baseFixed('constituency_groups'),
      {
        external_id: 'test-cg-regions',
        name: { en: 'Regions' },
        sort_order: 10,
        is_generated: false
      }
    ]
  },

  // Extended: 5 NEW regional + municipal constituencies. muni-north-a and
  // muni-south-a have parent refs; muni-orphan has NO parent (load-bearing
  // for startfromcg.spec.ts:252 orphan-municipality edge case).
  constituencies: {
    count: 0,
    fixed: [
      ...baseFixed('constituencies'),
      {
        external_id: 'test-const-region-north',
        name: { en: 'North Region' },
        sort_order: 10,
        is_generated: false
      },
      {
        external_id: 'test-const-region-south',
        name: { en: 'South Region' },
        sort_order: 11,
        is_generated: false
      },
      {
        external_id: 'test-const-muni-north-a',
        name: { en: 'North Municipality A' },
        parent: { external_id: 'test-const-region-north' },
        sort_order: 12,
        is_generated: false
      },
      {
        external_id: 'test-const-muni-south-a',
        name: { en: 'South Municipality A' },
        parent: { external_id: 'test-const-region-south' },
        sort_order: 13,
        is_generated: false
      },
      {
        external_id: 'test-const-muni-orphan',
        name: { en: 'Orphan Municipality' },
        sort_order: 15,
        is_generated: false
      }
    ]
  },

  // Extended: 2 NEW scoped categories.
  question_categories: {
    count: 0,
    fixed: [
      ...baseFixed('question_categories'),
      {
        external_id: 'test-cat-sfcg-local',
        name: { en: 'Test SFCG Category: Local Issues' },
        category_type: 'opinion',
        sort_order: 40,
        is_generated: false
      },
      {
        external_id: 'test-cat-sfcg-e2',
        name: { en: 'Test SFCG E2 Category: Municipal Issues' },
        category_type: 'opinion',
        sort_order: 41,
        is_generated: false
      }
    ]
  },

  // Extended: 2 NEW questions.
  questions: {
    count: 0,
    fixed: [
      ...baseFixed('questions'),
      {
        external_id: 'test-sfcg-q-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'SFCG: Should regional development funds be increased?' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-cat-sfcg-local' },
        allow_open: true,
        required: true,
        sort_order: 401,
        is_generated: false
      },
      {
        external_id: 'test-sfcg-e2-q-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'SFCG E2: Should municipal mergers be encouraged?' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-cat-sfcg-e2' },
        allow_open: true,
        required: true,
        sort_order: 411,
        is_generated: false
      }
    ]
  },

  // Extended: 4 NEW candidates. Northern/southern answer base ordinals +
  // the new scoped question; orphan/muni answer only the e2-scoped new
  // question (shape mirrors overlay's sparse answer pattern).
  candidates: {
    count: 0,
    fixed: [
      ...baseFixed('candidates'),
      {
        external_id: 'test-sfcg-cand-north-1',
        first_name: 'SFCG Northern',
        last_name: 'Candidate',
        email: 'sfcg.north1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 40,
        is_generated: false,
        answersByExternalId: {
          'test-question-1': { value: '4' },
          'test-question-2': { value: '3' },
          'test-question-3': { value: '5' },
          'test-question-4': { value: '2' },
          'test-question-5': { value: '4' },
          'test-question-6': { value: '3' },
          'test-question-7': { value: '5' },
          'test-question-8': { value: '4' },
          'test-sfcg-q-1': { value: '5' }
        }
      },
      {
        external_id: 'test-sfcg-cand-south-1',
        first_name: 'SFCG Southern',
        last_name: 'Candidate',
        email: 'sfcg.south1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 41,
        is_generated: false,
        answersByExternalId: {
          'test-question-1': { value: '2' },
          'test-question-2': { value: '4' },
          'test-question-3': { value: '3' },
          'test-question-4': { value: '4' },
          'test-question-5': { value: '2' },
          'test-question-6': { value: '5' },
          'test-question-7': { value: '3' },
          'test-question-8': { value: '2' },
          'test-sfcg-q-1': { value: '2' }
        }
      },
      {
        external_id: 'test-sfcg-cand-orphan-1',
        first_name: 'SFCG Orphan',
        last_name: 'Candidate',
        email: 'sfcg.orphan1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 42,
        is_generated: false,
        answersByExternalId: {
          'test-sfcg-e2-q-1': { value: '4' }
        }
      },
      {
        external_id: 'test-sfcg-cand-muni-1',
        first_name: 'SFCG Municipal',
        last_name: 'Candidate',
        email: 'sfcg.muni1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 43,
        is_generated: false,
        answersByExternalId: {
          'test-sfcg-e2-q-1': { value: '3' }
        }
      }
    ]
  },

  // Extended: 6 NEW nomination triangles. Four new candidates + two
  // re-nominations (alpha/beta) to new region constituencies on Election-1.
  // Overlay-side `organization` refs on candidate-type nominations dropped
  // per NominationsGenerator.ts contract.
  nominations: {
    count: 0,
    fixed: [
      ...baseFixed('nominations'),
      {
        external_id: 'test-nom-sfcg-north1-e1',
        candidate: { external_id: 'test-sfcg-cand-north-1' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-region-north' },
        election_round: 1
      },
      {
        external_id: 'test-nom-sfcg-south1-e1',
        candidate: { external_id: 'test-sfcg-cand-south-1' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-region-south' },
        election_round: 1
      },
      {
        external_id: 'test-nom-sfcg-orphan1-e2',
        candidate: { external_id: 'test-sfcg-cand-orphan-1' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-muni-orphan' },
        election_round: 1
      },
      {
        external_id: 'test-nom-sfcg-muni1-e2-north',
        candidate: { external_id: 'test-sfcg-cand-muni-1' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-muni-north-a' },
        election_round: 1
      },
      {
        external_id: 'test-nom-sfcg-alpha-north',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-region-north' },
        election_round: 1
      },
      {
        external_id: 'test-nom-sfcg-beta-south',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-region-south' },
        election_round: 1
      }
    ]
  },

  // Phase 63 E2E-02 (D-02 + D-03 + RESOLVED Q1): compose variant-scoped
  // app_settings from the base + empty overlay. Writer Pass-5 (Pitfall 2)
  // reads `row.settings`; variant-scoped external_id survives the
  // `runTeardown('test-', ...)` filter (Pitfall 6). The spec-level call at
  // startfromcg.spec.ts:58-81 sets `elections.startFromConstituencyGroup`
  // to the discovered DB UUID at runtime — intentionally not templated.
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-startfromcg',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, STARTFROMCG_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantStartFromCgTemplate;
