/**
 * Answer emitter — see phase 56 random-valid-per-question-type stub behind the
 * function-pointer seam.
 *
 * SINGLE function pointer, NO interface ceremony. see phase 57 supplies a
 * latent-factor emitter by assigning `ctx.answerEmitter`. The candidate generator
 * does not change between Phase 56 and Phase 57 — only `ctx.answerEmitter` gets
 * populated.
 *
 * forward note: see phase 57's latent emitter can fall back to
 * `defaultRandomValidEmit` for categorical questions when no explicit loading /
 * choice mapping is supplied, mirroring this Phase 56 stub.
 *
 * shape-valid ONLY. Subdimension projection / MISSING_VALUE handling stays in
 * `@openvaa/matching`. This emitter does NOT produce correlated or clustered
 * answers — see phase 57's latent-factor emitter does that.
 */

import type { Faker } from '@faker-js/faker';
import type { Enums, TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../ctx';

/**
 * AnswerEmitter signature per RESEARCH Open Question 4.
 *
 *  - `candidate` — the candidate row being emitted (TablesInsert<'candidates'>).
 *    see phase 56 does not consume it, but see phase 57's latent emitter will (candidate's
 *    latent position).
 *  - `questions` — the pre-built list of question rows (TablesInsert<'questions'>[]).
 *  - `ctx` — gives access to the seeded `ctx.faker` for RNG.
 *
 * Return value keys by question `external_id`; matches what `importAnswers`
 * expects (the helper then resolves extId → UUID and stitches the JSONB).
 */
export type AnswerEmitter = (
  candidate: TablesInsert<'candidates'>,
  questions: Array<TablesInsert<'questions'>>,
  ctx: Ctx
) => Record<string, { value: unknown; info?: unknown }>;

type QuestionType = Enums<'question_type'>;

/**
 * see phase 56 default: random-valid-per-question-type.
 *
 * Mapping per question_type enum:
 *  - `text` / `multipleText` — `faker.lorem.sentence()` / array of words.
 *  - `number` — `faker.number.int({ min: 0, max: 100 })`.
 *  - `boolean` — `faker.datatype.boolean()`.
 *  - `date` — `faker.date.recent().toISOString()`.
 *  - `image` — `null` (opaque JSONB; upload path is see phase 58).
 *  - `singleChoiceOrdinal` / `singleChoiceCategorical` — random choice id from
 *    `q.choices[].id`.
 *  - `multipleChoiceCategorical` — random non-empty subset of `q.choices[].id`.
 */
export function defaultRandomValidEmit(
  _candidate: TablesInsert<'candidates'>,
  questions: Array<TablesInsert<'questions'>>,
  ctx: Ctx
): Record<string, { value: unknown; info?: unknown }> {
  const out: Record<string, { value: unknown; info?: unknown }> = {};
  for (const q of questions) {
    const qExtId = q.external_id;
    if (!qExtId) continue;
    out[qExtId] = { value: emitValueFor(q, ctx.faker) };
  }
  return out;
}

// Compile-time assertion that `defaultRandomValidEmit` conforms to the
// `AnswerEmitter` seam signature. If the signature drifts, TS reports here.
const _typecheckDefaultEmit: AnswerEmitter = defaultRandomValidEmit;
void _typecheckDefaultEmit;

function emitValueFor(q: TablesInsert<'questions'>, faker: Faker): unknown {
  const type = q.type as QuestionType;
  switch (type) {
    case 'text':
      return faker.lorem.sentence();
    case 'multipleText': {
      const n = faker.number.int({ min: 1, max: 3 });
      return Array.from({ length: n }, () => faker.lorem.word());
    }
    case 'number':
      return faker.number.int({ min: 0, max: 100 });
    case 'boolean':
      return faker.datatype.boolean();
    case 'date':
      return faker.date.recent().toISOString();
    case 'image':
      return null;
    case 'singleChoiceOrdinal':
    case 'singleChoiceCategorical':
      return pickOneChoiceId(q, faker);
    case 'multipleChoiceCategorical':
      return pickMultipleChoiceIds(q, faker);
    default: {
      // Exhaustiveness guardrail — if a new question_type is added to the DB enum,
      // this branch fires at compile time via `never`. Runtime fallback to null
      // keeps the generator running; the DB upsert will surface the error with a
      // clearer message than a throw from here would.
      const _exhaustive: never = type;
      void _exhaustive;
      return null;
    }
  }
}

function pickOneChoiceId(q: TablesInsert<'questions'>, faker: Faker): string | null {
  const choices = extractChoiceIds(q);
  if (choices.length === 0) return null;
  return choices[faker.number.int({ min: 0, max: choices.length - 1 })];
}

function pickMultipleChoiceIds(q: TablesInsert<'questions'>, faker: Faker): Array<string> {
  const choices = extractChoiceIds(q);
  if (choices.length === 0) return [];
  const picked: Array<string> = [];
  for (const c of choices) {
    if (faker.datatype.boolean()) picked.push(c);
  }
  // Guarantee non-empty selection — DB CHECK may require ≥ 1 for multi-choice.
  if (picked.length === 0) {
    picked.push(choices[faker.number.int({ min: 0, max: choices.length - 1 })]);
  }
  return picked;
}

function extractChoiceIds(q: TablesInsert<'questions'>): Array<string> {
  const choices = q.choices;
  if (!Array.isArray(choices)) return [];
  return choices
    .map((c) => {
      if (c && typeof c === 'object' && 'id' in c && typeof (c as { id: unknown }).id === 'string') {
        return (c as { id: string }).id;
      }
      return null;
    })
    .filter((v): v is string => v !== null);
}
