/**
 * Answer emitter — the random-valid-per-question-type stub behind the function-pointer seam.
 *
 * SINGLE function pointer, NO interface ceremony. The latent-factor emitter is installed by assigning `ctx.answerEmitter`; the candidate generator does not change between emitter generations — only `ctx.answerEmitter` gets populated.
 *
 * The latent emitter can itself fall back to `defaultRandomValidEmit` for categorical questions when no explicit loading / choice mapping is supplied, mirroring this stub.
 *
 * shape-valid ONLY. Subdimension projection / MISSING_VALUE handling stays in `@openvaa/matching`. This emitter does NOT produce correlated or clustered answers — the latent-factor emitter does that.
 */

import type { Faker } from '@faker-js/faker';
import type { Enums, TablesInsert } from '@openvaa/supabase-types';
import type { Ctx } from '../ctx';

/**
 * AnswerEmitter signature.
 *
 *  - `candidate` — the candidate row being emitted (TablesInsert<'candidates'>).
 *    The default emitter does not consume it; the latent emitter does, for the candidate's latent position.
 *  - `questions` — the pre-built list of question rows (TablesInsert<'questions'>[]).
 *  - `ctx` — gives access to the seeded `ctx.faker` for RNG.
 *
 * Return value keys by question `external_id`; matches what `importAnswers` expects (the helper then resolves extId → UUID and stitches the JSONB).
 */
export type AnswerEmitter = (
  candidate: TablesInsert<'candidates'>,
  questions: Array<TablesInsert<'questions'>>,
  ctx: Ctx
) => Record<string, { value: unknown; info?: unknown }>;

type QuestionType = Enums<'question_type'>;

/**
 * The default: random-valid-per-question-type.
 *
 * Mapping per question_type enum:
 *  - `text` / `multipleText` — `faker.lorem.sentence()` / array of words.
 *  - `number` — `faker.number.int` inside the range the question declares in `custom_data.min` / `custom_data.max`, falling back to `0`–`100` only when the question declares neither (see `emitNumberInDeclaredRange`).
 *  - `boolean` — `faker.datatype.boolean()`.
 *  - `date` — `faker.date.recent({ refDate }).toISOString()`, drawn relative to `ctx.refDate` rather than the system clock.
 *  - `image` — `null` (opaque JSONB; the upload path lives in the writer).
 *  - `singleChoiceOrdinal` / `singleChoiceCategorical` — random choice id from `q.choices[].id`.
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
    out[qExtId] = { value: emitValueFor(q, ctx.faker, ctx.refDate) };
  }
  return out;
}

// Compile-time assertion that `defaultRandomValidEmit` conforms to the `AnswerEmitter` seam signature. If the signature drifts, TS reports here.
const _typecheckDefaultEmit: AnswerEmitter = defaultRandomValidEmit;
void _typecheckDefaultEmit;

function emitValueFor(q: TablesInsert<'questions'>, faker: Faker, refDate: Date): unknown {
  const type = q.type as QuestionType;
  switch (type) {
    case 'text':
      return faker.lorem.sentence();
    case 'multipleText': {
      const n = faker.number.int({ min: 1, max: 3 });
      return Array.from({ length: n }, () => faker.lorem.word());
    }
    case 'number':
      return emitNumberInDeclaredRange(q, faker);
    case 'boolean':
      return faker.datatype.boolean();
    case 'date':
      return faker.date.recent({ refDate }).toISOString();
    case 'image':
      return null;
    case 'singleChoiceOrdinal':
    case 'singleChoiceCategorical':
      return pickOneChoiceId(q, faker);
    case 'multipleChoiceCategorical':
      return pickMultipleChoiceIds(q, faker);
    default: {
      // Exhaustiveness guardrail — if a new question_type is added to the DB enum, this branch fires at compile time via `never`. Runtime fallback to null keeps the generator running; the DB upsert will surface the error with a clearer message than a throw from here would.
      const _exhaustive: never = type;
      void _exhaustive;
      return null;
    }
  }
}

/**
 * The span used for a `number` question that declares no range of its own.
 * Pinned by `tests/emitters/answers.test.ts` so it cannot be dropped silently.
 */
const NUMBER_FALLBACK_RANGE = { min: 0, max: 100 } as const;

/**
 * Emit a `number` answer inside the range the question ITSELF declares.
 *
 * `custom_data.min` / `custom_data.max` is the same range `NumberQuestion.isMatchable` reads and the same range `normalizeCoordinate` (`@openvaa/core`) throws outside of. Drawing from a hardcoded `0`–`100` regardless of the declaration produces answers a matchable question cannot normalize. That defect stayed latent for a long time only because anon could not see candidates at all, so no candidate number answer was ever normalized.
 *
 * A malformed declaration (`min > max`) is deliberately NOT papered over: faker throws, the seed run fails loudly, and the template author sees the real error rather than a silently-substituted span.
 *
 * ONE `faker.number.int` draw whatever the range — the pinned-seed determinism contract depends on the number of faker reads per question staying fixed.
 */
function emitNumberInDeclaredRange(q: TablesInsert<'questions'>, faker: Faker): number {
  const customData = (q.custom_data ?? {}) as { min?: unknown; max?: unknown };
  const min = typeof customData.min === 'number' ? customData.min : NUMBER_FALLBACK_RANGE.min;
  const max = typeof customData.max === 'number' ? customData.max : NUMBER_FALLBACK_RANGE.max;
  return faker.number.int({ min, max });
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
