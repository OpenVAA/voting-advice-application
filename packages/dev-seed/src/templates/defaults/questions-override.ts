/**
 * Default-template questions override — enforces D-58-03 type mix.
 *
 * D-58-03: majority Likert (ordinal), some categorical, some multi-choice,
 * exactly 1 boolean. NO number/text/date/image/multipleText.
 *
 * Split (Claude's Discretion, respecting "majority Likert"):
 *   - 18 singleChoiceOrdinal (5-point Likert)
 *   - 4  singleChoiceCategorical (3-5 choices each)
 *   - 1  multipleChoiceCategorical (4 choices)
 *   - 1  boolean
 *   Total: 24
 *
 * Questions are distributed across the 4 categories from
 * `ctx.refs.question_categories` in round-robin so every category receives
 * questions (Phase 58 D-58-02 + tests 13/14).
 *
 * Phase 57's latent emitter (installed in pipeline.ts:177) exercises the
 * latent model for ordinal + categorical + multi-choice types. Boolean falls
 * back to `defaultRandomValidEmit` per D-57-10 — same behavior as the Phase
 * 56 default generator.
 *
 * T-58-06-04 mitigation: `TYPE_PLAN` contains ONLY the four allowed enum
 * values; no `number/text/date/image/multipleText` path is possible. The
 * plan's acceptance criteria greps for forbidden types and would fail the
 * plan if any appear in this file.
 */

import type { Enums, TablesInsert } from '@openvaa/supabase-types';
import type { Overrides } from '../../types';

type QuestionType = Enums<'question_type'>;

/**
 * Per-index type plan. Length is exactly 24 (D-58-02 questions count).
 *
 *   Indices  0..17 → 18 × singleChoiceOrdinal
 *   Indices 18..21 →  4 × singleChoiceCategorical
 *   Index      22  →  1 × multipleChoiceCategorical
 *   Index      23  →  1 × boolean
 */
const TYPE_PLAN: ReadonlyArray<QuestionType> = [
  ...(Array(18).fill('singleChoiceOrdinal') as Array<QuestionType>),
  'singleChoiceCategorical',
  'singleChoiceCategorical',
  'singleChoiceCategorical',
  'singleChoiceCategorical',
  'multipleChoiceCategorical',
  'boolean'
];

/**
 * Standard 5-point Likert choices. Mirrors QuestionsGenerator.LIKERT_5 exactly
 * (including `normalizableValue` on every entry) so the Phase 57 latent
 * emitter's ordinal dispatch (project.ts:10-13 COORDINATE inverse-normalize)
 * works without special-casing.
 */
const LIKERT_5 = [
  { id: '1', label: { en: 'Strongly disagree' }, normalizableValue: 1 },
  { id: '2', label: { en: 'Disagree' }, normalizableValue: 2 },
  { id: '3', label: { en: 'Neutral' }, normalizableValue: 3 },
  { id: '4', label: { en: 'Agree' }, normalizableValue: 4 },
  { id: '5', label: { en: 'Strongly agree' }, normalizableValue: 5 }
] as const;

/**
 * Build categorical choices for a given category question. Count varies 3-5
 * (faker-driven per index for visual variety). Labels are faker nouns —
 * Phase 58 fan-out expands `label.en` across locales if the template sets
 * `generateTranslationsForAllLocales: true`.
 *
 * Note: fanOutLocales (locales.ts) does not currently expand nested
 * `choices[].label` fields — only top-level `name`/`info`/`short_name`.
 * Synthetic categorical labels therefore stay in `en` only across locales;
 * the default template tolerates this visual trade-off.
 */
function buildCategoricalChoices(
  faker: import('@faker-js/faker').Faker,
  count: number
): Array<{ id: string; label: { en: string } }> {
  return Array.from({ length: count }, (_, i) => ({
    id: `choice_${i}`,
    label: { en: capitalize(faker.word.noun()) }
  }));
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

/**
 * D-25 questions override. Replaces QuestionsGenerator's type rotation with
 * the D-58-03 split. Row shape matches QuestionsGenerator output (external_id,
 * project_id, type, name, choices[?], category ref, is_generated, sort_order,
 * required, allow_open) so bulk_import + the writer's localization fan-out
 * process these rows identically to generator output.
 */
export const questionsOverride: NonNullable<Overrides['questions']> = (_fragment, ctx) => {
  const { faker, projectId, externalIdPrefix } = ctx;
  const cats = ctx.refs.question_categories;
  if (cats.length === 0) {
    throw new Error(
      'questionsOverride: expected at least 1 question category in ctx.refs.question_categories. ' +
        'Templates using this override must populate `question_categories.fixed[]` (or `count`).'
    );
  }

  const rows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < TYPE_PLAN.length; i++) {
    const type = TYPE_PLAN[i];
    const category = cats[i % cats.length];
    const row: Record<string, unknown> = {
      external_id: `${externalIdPrefix}q_${String(i).padStart(3, '0')}`,
      project_id: projectId,
      type,
      name: { en: capitalize(faker.lorem.sentence({ min: 6, max: 12 }).replace(/\.$/, '?')) },
      allow_open: true,
      required: true,
      sort_order: i,
      is_generated: true,
      category: { external_id: category.external_id }
    };

    if (type === 'singleChoiceOrdinal') {
      row.choices = LIKERT_5;
    } else if (type === 'singleChoiceCategorical') {
      // 3-5 choices per categorical question for variety.
      const n = 3 + faker.number.int({ min: 0, max: 2 });
      row.choices = buildCategoricalChoices(faker, n);
    } else if (type === 'multipleChoiceCategorical') {
      // 4 choices — DB CHECK requires >=2 entries; 4 is comfortable.
      row.choices = buildCategoricalChoices(faker, 4);
    }
    // boolean: no choices (QuestionsGenerator pattern — boolean is schema-free).

    rows.push(row);
  }

  return rows as unknown as Array<Record<string, unknown> & Partial<TablesInsert<'questions'>>>;
};
