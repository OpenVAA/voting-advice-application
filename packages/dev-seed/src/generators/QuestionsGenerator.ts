/**
 * QuestionsGenerator — content generator for the `questions` table.
 *
 * RESEARCH §4.13: `project_id`, `type` (enum question_type), and `category_id` FK
 * are required; `choices` JSONB is required for
 * singleChoiceOrdinal / singleChoiceCategorical / multipleChoiceCategorical types
 * (validate_question_choices trigger, migration lines 645–689).
 *
 * Ref shape: `category: { external_id }` → resolve_external_ref (bulk_import)
 * converts to `category_id` at write time. Attached AFTER the base row fields —
 * matches the canonical D-06 pattern (refs added inline but only if upstream refs
 * are populated).
 *
 * Subdimensions: per D-20 "subdimension / MISSING_VALUE logic stays in
 * @openvaa/matching". This generator emits shape-valid JSONB choices only; it
 * does NOT annotate subdimension loadings. Phase 57's latent-factor model
 * extends this with richer question type distributions; Phase 56 just exercises
 * the plumbing.
 *
 * D-04/D-26/D-08 + GEN-02/GEN-04 apply — see ElectionsGenerator.ts for the
 * canonical-pattern rationale.
 *
 * Default count = 4: enough questions to exercise the answer emitter & matching
 * across a few dimensions; `i % 4` rotation ensures coverage of the 4
 * representative question_type variants (`singleChoiceOrdinal`, `boolean`,
 * `singleChoiceCategorical`, `text`).
 */

import type { Enums, TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type QuestionsFragment = Fragment<TablesInsert<'questions'>>;

/**
 * QuestionRow carries the `category: { external_id }` ref object — bulk_import
 * strips it at write time and uses resolve_external_ref to populate
 * `category_id`. TablesInsert<'questions'> marks `category_id` AND `type` as
 * required; we relax those here because:
 *   - `category_id` is supplied via the ref sentinel (writer resolves extId → UUID)
 *   - `type` is relaxed to match Fragment's `Partial<TRow>` pass-through shape;
 *     generated rows always set it explicitly, and `fixed[]` users are
 *     contractually required to supply `type` (DB NOT NULL — any fixed row
 *     missing `type` fails loudly at insert with a clear Postgres error).
 */
type QuestionRow = Omit<TablesInsert<'questions'>, 'category_id' | 'type'> & {
  category_id?: string;
  type?: TablesInsert<'questions'>['type'];
  category?: { external_id: string };
};

/**
 * Standard Phase 56 Likert choices (5-point scale). The DB trigger
 * validate_question_choices requires ≥2 entries each with a string `id` key;
 * see migration lines 645–689.
 */
const LIKERT_5: Array<{ id: string; label: { en: string }; normalizableValue: number }> = [
  { id: '1', label: { en: 'Strongly disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Neutral' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Agree' }, normalizableValue: 4 },
  { id: '5', label: { en: 'Strongly agree' }, normalizableValue: 5 }
];

/**
 * Simple categorical choices (for singleChoiceCategorical / multipleChoiceCategorical).
 * Phase 56 emits a minimal 3-option set; Phase 58 templates can supply richer ones.
 */
const CATEGORICAL_3: Array<{ id: string; label: { en: string } }> = [
  { id: 'a', label: { en: 'Option A' } },
  { id: 'b', label: { en: 'Option B' } },
  { id: 'c', label: { en: 'Option C' } }
];

/**
 * Phase 56 emits a mix of question types so the answer emitter exercises every
 * branch. Rotate deterministically (via `i % types.length`) so seeded runs are
 * reproducible. The chosen 4 variants cover: ordinal choice, boolean, categorical
 * choice, and free-text — the main emitter code paths (see emitters/answers.ts).
 */
const PHASE_56_TYPE_ROTATION = [
  'singleChoiceOrdinal',
  'boolean',
  'singleChoiceCategorical',
  'text'
] as const satisfies ReadonlyArray<Enums<'question_type'>>;

export class QuestionsGenerator {
  constructor(private ctx: Ctx) {}

  // Phase 56 ignores ctx here; Phase 57/58 generators read ctx.refs to scale counts.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaults(ctx: Ctx): QuestionsFragment {
    return { count: 4 };
  }

  generate(fragment: QuestionsFragment): Array<TablesInsert<'questions'>> {
    const { faker, projectId, externalIdPrefix, refs } = this.ctx;
    const rows: Array<QuestionRow> = [];

    for (const fx of fragment.fixed ?? []) {
      rows.push({
        ...fx,
        external_id: `${externalIdPrefix}${fx.external_id}`,
        project_id: fx.project_id ?? projectId
      });
    }

    // Pick a category external_id to attach; rotate across available categories so
    // multiple questions land in each. If no categories exist yet (edge case:
    // template supplies questions but no categories), emit rows WITHOUT `category`
    // — bulk_import will then fail loudly with a clear "missing category_id" error
    // rather than this generator silently producing orphans.
    const categoryExtIds = refs.question_categories.map((c) => c.external_id);

    const n = fragment.count ?? 0;
    for (let i = 0; i < n; i++) {
      const type = PHASE_56_TYPE_ROTATION[i % PHASE_56_TYPE_ROTATION.length];

      const row: QuestionRow = {
        external_id: `${externalIdPrefix}q_${String(i).padStart(3, '0')}`,
        project_id: projectId,
        // `type` is NOT NULL on the Insert type; `category_id` is also NOT NULL
        // on TablesInsert<'questions'>, but bulk_import resolves it from the
        // `category` ref sentinel attached below — QuestionRow relaxes the type.
        type,
        // `name` is the JSONB question-text column per the migration (lines 605–629);
        // other DataObject tables use the same `name` localized-string convention.
        name: { en: faker.lorem.sentence({ min: 6, max: 12 }) + '?' },
        allow_open: true,
        required: true,
        sort_order: i,
        is_generated: true
        // category_id injected by bulk_import from the `category` ref below.
      };

      // Choices required for ordinal/categorical types (RESEARCH §4.13). Narrow
      // via a typed tuple so TS recognizes the categorical branch for all types
      // in PHASE_56_TYPE_ROTATION plus any future additions (e.g.
      // multipleChoiceCategorical when Phase 58 templates enable it).
      const CATEGORICAL_TYPES: ReadonlyArray<Enums<'question_type'>> = [
        'singleChoiceCategorical',
        'multipleChoiceCategorical'
      ];
      if (type === 'singleChoiceOrdinal') {
        row.choices = LIKERT_5;
      } else if (CATEGORICAL_TYPES.includes(type)) {
        row.choices = CATEGORICAL_3;
      }

      if (categoryExtIds.length > 0) {
        const catExtId = categoryExtIds[i % categoryExtIds.length];
        row.category = { external_id: catExtId };
      }

      rows.push(row);
    }

    return rows as Array<TablesInsert<'questions'>>;
  }
}
