/**
 * Default-template questions override — enforces the type mix: majority Likert
 * (ordinal), some categorical, exactly 1 boolean, plus (Phase 129 D-15) one
 * number-scale + one multipleChoiceCategorical opinion question so the demo
 * exercises the new question inputs. NO text/date/image/multipleText.
 *
 * Split:
 *   - 18 singleChoiceOrdinal (5-point Likert)
 *   - 5  singleChoiceCategorical (3-5 choices each)
 *   - 1  boolean
 *   - 1  number (D-15 — custom_data min/max, matchable)
 *   - 1  multipleChoiceCategorical (D-15 — 4 choices, minSelections 2 / maxSelections 3)
 *   Total: 26
 *
 * 1/5 of the questions (indices 0, 5, 10, 15, 20, 25) additionally carry a
 * `customData.terms` definition whose trigger is a word from the question's
 * own name, so the in-text term popup (Term.svelte) renders in the demo data.
 *
 * The latent emitter (emitters/latent/project.ts) supports number (via the
 * defaultRandomValidEmit fallback) and multipleChoiceCategorical (mapMulti-
 * Categorical), so candidate answers for both new types are emitted for free.
 *
 * Questions are distributed across the 4 categories from
 * `ctx.refs.question_categories` in round-robin so every category receives
 * questions.
 *
 * The latent emitter (installed in pipeline.ts:177) exercises the latent model
 * for ordinal + categorical types. Boolean falls back to
 * `defaultRandomValidEmit` — same behavior as the default generator.
 *
 * `TYPE_PLAN` contains ordinal / categorical / boolean / number /
 * multipleChoiceCategorical enum values; no `text/date/image/multipleText`
 * path is possible.
 */

import type { Faker } from '@faker-js/faker';
import type { Enums, TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../../types';

type QuestionType = Enums<'question_type'>;

/**
 * Per-index type plan. Length is exactly 26 (questions count).
 *
 *   Indices  0..17 → 18 × singleChoiceOrdinal
 *   Indices 18..22 →  5 × singleChoiceCategorical
 *   Index      23  →  1 × boolean
 *   Index      24  →  1 × number (D-15)
 *   Index      25  →  1 × multipleChoiceCategorical (D-15)
 */
const TYPE_PLAN: ReadonlyArray<QuestionType> = [
  ...(Array(18).fill('singleChoiceOrdinal') as Array<QuestionType>),
  'singleChoiceCategorical',
  'singleChoiceCategorical',
  'singleChoiceCategorical',
  'singleChoiceCategorical',
  'singleChoiceCategorical',
  'boolean',
  'number',
  'multipleChoiceCategorical'
];

/**
 * Standard 5-point Likert choices. Mirrors QuestionsGenerator.LIKERT_5 exactly
 * (including `normalizableValue` on every entry) so the latent emitter's
 * ordinal dispatch (project.ts:10-13 COORDINATE inverse-normalize) works
 * without special-casing.
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
 * (faker-driven per index for visual variety). Labels are faker nouns — the
 * locale fan-out expands `label.en` across locales if the template sets
 * `generateTranslationsForAllLocales: true`.
 *
 * Note: fanOutLocales (locales.ts) does not currently expand nested
 * `choices[].label` fields — only top-level `name`/`info`/`short_name`.
 * Synthetic categorical labels therefore stay in `en` only across locales;
 * the default template tolerates this visual trade-off.
 */
function buildCategoricalChoices(faker: Faker, count: number): Array<{ id: string; label: { en: string } }> {
  return Array.from({ length: count }, (_, i) => ({
    id: `choice_${i}`,
    label: { en: capitalize(faker.word.noun()) }
  }));
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

/**
 * Pick a term-trigger word from a generated question name: the longest
 * mid-sentence word (first word excluded — it is capitalized), stripped of
 * punctuation, length >= 4. Deterministic: longest wins, ties broken by first
 * occurrence. Returns undefined when no word qualifies.
 *
 * The trigger must appear VERBATIM in the question text — `QuestionHeading`
 * splits `question.text` on the trigger strings to render the `<Term>` popup
 * affordance. Locale fan-out mirrors the `en` name to all locales, so an
 * English trigger matches in every locale.
 */
function pickTermTrigger(name: string): string | undefined {
  const words = name
    .split(/\s+/)
    .slice(1)
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ''))
    .filter((w) => w.length >= 4);
  if (words.length === 0) return undefined;
  return words.reduce((longest, w) => (w.length > longest.length ? w : longest));
}

/**
 * Every TERM_EVERY-th question gets a `customData.terms` definition (1/5 of
 * the 24 questions → indices 0, 5, 10, 15, 20) so the in-text term popup
 * (`Term.svelte` toggletip) is exercised by the default demo dataset.
 */
const TERM_EVERY = 5;

/**
 * Questions override. Replaces QuestionsGenerator's type rotation with the
 * fixed split. Row shape matches QuestionsGenerator output (external_id,
 * project_id, type, name, choices[?], category ref, is_generated, sort_order,
 * required, allow_open) so bulk_import + the writer's localization fan-out
 * process these rows identically to generator output.
 */
export function questionsOverride(_fragment: unknown, ctx: Ctx): Array<Record<string, unknown>> {
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
      // Mark categorical questions filterable so they render in the voter
      // results filter modal — combined with the parent-nomination filters
      // (party affiliation), this exercises the full filter surface against
      // the default Finnish demo seed.
      row.custom_data = { filterable: true };
    } else if (type === 'number') {
      // D-15: number-scale opinion question. custom_data min/max makes it
      // matchable (NumberQuestion.isMatchable) and drives the slider input.
      row.custom_data = { min: 0, max: 10 };
    } else if (type === 'multipleChoiceCategorical') {
      // D-15: multi-choice opinion question with 4 choices + the D-07
      // selection-count constraints so the demo exercises the helper text.
      row.choices = buildCategoricalChoices(faker, 4);
      row.custom_data = { filterable: true, minSelections: 2, maxSelections: 3 };
    }
    // boolean: no choices (QuestionsGenerator pattern — boolean is schema-free).

    // 1/5 of questions carry a term definition in customData (see TERM_EVERY).
    // Merged AFTER the type branches so the categorical `filterable` flag is
    // preserved. Trigger is a word from the question's own name; content is
    // seeded-faker prose (deterministic — same seed, same rows).
    if (i % TERM_EVERY === 0) {
      const trigger = pickTermTrigger((row.name as { en: string }).en);
      if (trigger) {
        row.custom_data = {
          ...(row.custom_data as Record<string, unknown> | undefined),
          terms: [
            {
              triggers: [trigger],
              title: capitalize(trigger),
              content: capitalize(faker.lorem.sentence({ min: 8, max: 14 }))
            }
          ]
        };
      }
    }

    rows.push(row);
  }

  return rows as unknown as Array<Record<string, unknown> & Partial<TablesInsert<'questions'>>>;
}
