/**
 * Constituency variant template — extends the Phase 58 e2e base with a
 * region/municipality constituency hierarchy.
 *
 * Replaces the legacy `tests/tests/data/overlays/constituency-overlay`
 * JSON fixture per Phase 59 E2E-02 (deleted in Plan 59-06). Loaded via
 * `yarn dev:seed --template tests/tests/setup/templates/variant-constituency.ts`.
 *
 * Spec contract: tests/tests/specs/variants/constituency.spec.ts (CONF-03).
 * Base: BUILT_IN_TEMPLATES.e2e (packages/dev-seed/src/templates/e2e.ts).
 *
 * Overlay-row inventory (original JSON -> this template):
 *   - constituencies: 5 NEW (test-const-region-north, -south,
 *     test-const-muni-north-a, -south-a, -east)
 *   - constituency_groups: 1 NEW (test-cg-regions) + 1 DEDUPED
 *     (test-cg-municipalities already in base, skip)
 *   - elections: 0 NEW (test-election-1 + test-election-2 both in base; the
 *     overlay REPLACED them with identical external_id but pipeline's post-topo
 *     full-fanout sentinel pass overwrites per-row _constituencyGroups links,
 *     so the overlay's narrower scoping cannot be expressed template-side;
 *     variant specs query elections by external_id, not by link shape)
 *   - question_categories: 2 NEW (test-cat-const-north, test-cat-e2-local)
 *   - questions: 3 NEW (test-const-q-north-1, test-const-e2-q-1, -q-2)
 *   - candidates: 5 NEW (test-const-cand-north-1, -2, -south-1, -muni-1, -2)
 *   - nominations: 8 NEW (5 for new candidates + 3 re-nominations of base
 *     candidates alpha/beta/gamma to new region/municipality constituencies)
 *
 * Shape-drift corrections applied during JSON-to-TS transcription:
 *   - first-name-field -> first_name, last-name-field -> last_name,
 *     tou-accepted-field -> terms_of_use_accepted (snake_case matches
 *     TablesInsert<'candidates'> and the e2e base).
 *   - ID reference objects migrated camelCase -> snake_case on every
 *     reference object (parent, category, candidate, election, constituency,
 *     organization). All accessors below use `external_id` consistently.
 *   - categoryType -> category_type, electionDate -> election_date,
 *     electionStartDate stripped (not a schema column; unused).
 *   - order -> sort_order on categories + questions (matches base e2e rows).
 *   - JSON-level project / published fields dropped per Template schema
 *     (project id is ctx-level; bulk_import defaults published).
 *   - Question `choices[].normalizableValue` coerced string -> number to
 *     match the base template's LIKERT_5 shape (Phase 57 latent emitter
 *     reads the numeric form).
 *   - Question `choices[].key` field dropped (not present on base LIKERT_5).
 *   - Overlay `_constituencies` / `_constituencyGroups` / `_elections`
 *     sentinels dropped: pipeline.ts:229-255 overwrites these with full
 *     fanout per T-56-37, so overlay-level scoping cannot be reproduced
 *     via the template schema. Every election gets every CG, every CG gets
 *     every constituency. Variant specs that rely on narrower scoping must
 *     query by external_id (which they do — see results-sections.spec.ts:171
 *     and multi-election.spec.ts:135).
 */
import { BUILT_IN_TEMPLATES, E2E_BASE_APP_SETTINGS, type Template } from '@openvaa/dev-seed';
import { mergeSettings } from '@openvaa/app-shared';

const base = BUILT_IN_TEMPLATES.e2e;
if (!base) throw new Error('variant-constituency: BUILT_IN_TEMPLATES.e2e is undefined.');

/**
 * Phase 63 E2E-02 (D-02 + D-03): variant-specific `app_settings.settings`
 * overlay. Empty because the legacy `variant-constituency.setup.ts:41-53`
 * block carried the SAME keys as the base e2e block minus the `results.*`
 * block — and `merge_jsonb_column` is additive (Pitfall 3), so the missing
 * `results` keys would be inherited from the base anyway. Authoring the
 * overlay explicitly (rather than deriving implicitly) keeps the variant's
 * intent visible for reviewers.
 */
const CONSTITUENCY_APP_SETTINGS_OVERLAY = {
  // Variant tests walk the journey to a question page; bypass the now-default
  // questions intro from E2E_BASE_APP_SETTINGS.
  questions: {
    questionsIntro: { allowCategorySelection: false, show: false }
  }
} as const;

type FixedRow = Record<string, unknown>;

function baseFixed(table: 'elections' | 'constituency_groups' | 'constituencies' | 'organizations' | 'question_categories' | 'questions' | 'candidates' | 'nominations'): Array<FixedRow> {
  const fragment = base[table] as { fixed?: Array<FixedRow> } | undefined;
  return fragment?.fixed ?? [];
}

/**
 * Shared Likert-5 choice array — numeric normalizableValue to match the
 * base template's `LIKERT_5_EN` constant (packages/dev-seed/src/templates/e2e.ts:68).
 * The overlay JSON ships stringified values ("1".."5"); stringified form is
 * dropped here per the shape-drift note above.
 */
const LIKERT_5_EN: Array<{ id: string; label: { en: string }; normalizableValue: number }> = [
  { id: '1', label: { en: 'Fully disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Somewhat disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Neutral' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Somewhat agree' }, normalizableValue: 4 },
  { id: '5', label: { en: 'Fully agree' }, normalizableValue: 5 }
];

export const variantConstituencyTemplate: Template = {
  seed: base.seed,
  externalIdPrefix: base.externalIdPrefix,
  generateTranslationsForAllLocales: base.generateTranslationsForAllLocales,

  // Pass-through: overlay doesn't touch organizations.
  organizations: { count: 0, fixed: baseFixed('organizations') },

  // Extended: 2 elections.
  //   - test-election-1 (from base) → BOTH test-cg-regions AND
  //     test-cg-municipalities (constituency.spec.ts:109 — Regions OR
  //     Municipalities, hierarchical).
  //   - test-election-2 (NEW) → test-cg-municipalities only (spec line 110).
  elections: {
    count: 0,
    fixed: [
      ...baseFixed('elections').map((row) => ({
        ...row,
        constituency_groups: [
          { external_id: 'test-cg-regions' },
          { external_id: 'test-cg-municipalities' }
        ]
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
        constituency_groups: [{ external_id: 'test-cg-municipalities' }]
      }
    ]
  },

  // Extended: 3 cgs total. The base test-cg-1 is dropped — variant uses
  // its own test-cg-regions instead. test-cg-municipalities is NEW
  // (constituency.spec.ts:119 binds to the literal "Municipalities" name).
  constituency_groups: {
    count: 0,
    fixed: [
      {
        external_id: 'test-cg-regions',
        name: { en: 'Regions' },
        sort_order: 10,
        is_generated: false,
        constituencies: [
          { external_id: 'test-const-region-north' },
          { external_id: 'test-const-region-south' }
        ]
      },
      {
        external_id: 'test-cg-municipalities',
        name: { en: 'Municipalities' },
        sort_order: 11,
        is_generated: false,
        constituencies: [
          { external_id: 'test-const-muni-north-a' },
          { external_id: 'test-const-muni-south-a' },
          { external_id: 'test-const-muni-east' }
        ]
      }
    ]
  },

  // Extended: 5 NEW regional + municipal constituencies. muni-north-a and
  // muni-south-a have parent refs; muni-east has no parent (no-parent
  // municipality is load-bearing for constituency.spec.ts:15-17 missing
  // nominations warning assertion).
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
        external_id: 'test-const-muni-east',
        name: { en: 'East Municipality' },
        sort_order: 14,
        is_generated: false
      }
    ]
  },

  // Extended: 2 NEW scoped categories. Overlay's per-row _elections /
  // _constituencies sentinels dropped — pipeline's post-topo full-fanout
  // overrides them (T-56-37); spec-level scoping queried by external_id.
  question_categories: {
    count: 0,
    fixed: [
      ...baseFixed('question_categories'),
      {
        external_id: 'test-cat-const-north',
        name: { en: 'Test Category: North Region Issues' },
        category_type: 'opinion',
        sort_order: 30,
        is_generated: false
      },
      {
        external_id: 'test-cat-e2-local',
        name: { en: 'Test E2 Category: Local Issues' },
        category_type: 'opinion',
        sort_order: 31,
        is_generated: false
      }
    ]
  },

  // Extended: 3 NEW questions.
  questions: {
    count: 0,
    fixed: [
      ...baseFixed('questions'),
      {
        external_id: 'test-const-q-north-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'North Region: Should the northern highway be expanded?' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-cat-const-north' },
        allow_open: true,
        required: true,
        sort_order: 301,
        is_generated: false
      },
      {
        external_id: 'test-const-e2-q-1',
        type: 'singleChoiceOrdinal',
        name: { en: 'E2 Local: Should municipal services be consolidated?' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-cat-e2-local' },
        allow_open: true,
        required: true,
        sort_order: 311,
        is_generated: false
      },
      {
        external_id: 'test-const-e2-q-2',
        type: 'singleChoiceOrdinal',
        name: { en: 'E2 Local: Should local parks receive more funding?' },
        choices: LIKERT_5_EN,
        category: { external_id: 'test-cat-e2-local' },
        allow_open: true,
        required: true,
        sort_order: 312,
        is_generated: false
      }
    ]
  },

  // Extended: 5 NEW candidates. Two Northern (test-const-cand-north-1/2)
  // answer both the base voter test-question-1..8 ordinals AND the new
  // test-const-q-north-1 scoped question. One Southern (test-const-cand-south-1)
  // answers only base ordinals. Two Municipal (test-const-cand-muni-1/2)
  // answer only the new e2-local questions.
  candidates: {
    count: 0,
    fixed: [
      ...baseFixed('candidates'),
      {
        external_id: 'test-const-cand-north-1',
        first_name: 'Northern',
        last_name: 'Candidate One',
        email: 'const.north1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 30,
        is_generated: false,
        answersByExternalId: {
          'test-question-1': { value: '4' },
          'test-question-2': { value: '5' },
          'test-question-3': { value: '3' },
          'test-question-4': { value: '2' },
          'test-question-5': { value: '4' },
          'test-question-6': { value: '3' },
          'test-question-7': { value: '5' },
          'test-question-8': { value: '4' },
          'test-const-q-north-1': { value: '5' }
        }
      },
      {
        external_id: 'test-const-cand-north-2',
        first_name: 'Northern',
        last_name: 'Candidate Two',
        email: 'const.north2@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 31,
        is_generated: false,
        answersByExternalId: {
          'test-question-1': { value: '2' },
          'test-question-2': { value: '3' },
          'test-question-3': { value: '4' },
          'test-question-4': { value: '3' },
          'test-question-5': { value: '2' },
          'test-question-6': { value: '4' },
          'test-question-7': { value: '3' },
          'test-question-8': { value: '2' },
          'test-const-q-north-1': { value: '2' }
        }
      },
      {
        external_id: 'test-const-cand-south-1',
        first_name: 'Southern',
        last_name: 'Candidate One',
        email: 'const.south1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 32,
        is_generated: false,
        answersByExternalId: {
          'test-question-1': { value: '3' },
          'test-question-2': { value: '4' },
          'test-question-3': { value: '5' },
          'test-question-4': { value: '1' },
          'test-question-5': { value: '5' },
          'test-question-6': { value: '2' },
          'test-question-7': { value: '4' },
          'test-question-8': { value: '3' }
        }
      },
      {
        external_id: 'test-const-cand-muni-1',
        first_name: 'Municipal',
        last_name: 'Candidate One',
        email: 'const.muni1@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 33,
        is_generated: false,
        answersByExternalId: {
          'test-const-e2-q-1': { value: '4' },
          'test-const-e2-q-2': { value: '5' }
        }
      },
      {
        external_id: 'test-const-cand-muni-2',
        first_name: 'Municipal',
        last_name: 'Candidate Two',
        email: 'const.muni2@openvaa.org',
        terms_of_use_accepted: '2025-01-01T00:00:00.000Z',
        sort_order: 34,
        is_generated: false,
        answersByExternalId: {
          'test-const-e2-q-1': { value: '2' },
          'test-const-e2-q-2': { value: '3' }
        }
      }
    ]
  },

  // Extended: 8 NEW nomination triangles. Overlay nominations include an
  // `organization: { external_id: ... }` field; the base template's nominations
  // drop this per Phase 56 NominationsGenerator.ts (candidate-type nominations
  // carry ONLY the candidate ref; organization linkage flows through
  // candidates.organization_id). We preserve that invariant here too and
  // drop overlay-side `organization` refs on candidate-type nominations.
  nominations: {
    count: 0,
    fixed: [
      ...baseFixed('nominations'),
      {
        external_id: 'test-nom-const-north1-e1',
        candidate: { external_id: 'test-const-cand-north-1' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-region-north' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-north2-e1',
        candidate: { external_id: 'test-const-cand-north-2' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-region-north' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-south1-e1',
        candidate: { external_id: 'test-const-cand-south-1' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-region-south' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-muni1-e2',
        candidate: { external_id: 'test-const-cand-muni-1' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-muni-north-a' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-muni2-e2',
        candidate: { external_id: 'test-const-cand-muni-2' },
        election: { external_id: 'test-election-2' },
        constituency: { external_id: 'test-const-muni-south-a' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-alpha-north',
        candidate: { external_id: 'test-candidate-alpha' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-region-north' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-beta-south',
        candidate: { external_id: 'test-candidate-beta' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-region-south' },
        election_round: 1
      },
      {
        external_id: 'test-nom-const-gamma-east',
        candidate: { external_id: 'test-candidate-gamma' },
        election: { external_id: 'test-election-1' },
        constituency: { external_id: 'test-const-muni-east' },
        election_round: 1
      }
    ]
  },

  // Phase 63 E2E-02 (D-02 + D-03 + RESOLVED Q1): compose variant-scoped
  // app_settings from the base + empty overlay. Writer Pass-5 (Pitfall 2)
  // reads `row.settings`; variant-scoped external_id survives the
  // `runTeardown('test-', ...)` filter (Pitfall 6).
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'test-app-settings-constituency',
        settings: mergeSettings(E2E_BASE_APP_SETTINGS, CONSTITUENCY_APP_SETTINGS_OVERLAY)
      }
    ]
  }
};

export default variantConstituencyTemplate;
