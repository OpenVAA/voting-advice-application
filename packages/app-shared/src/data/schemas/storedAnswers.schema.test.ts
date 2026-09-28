/**
 * `StoredAnswersSchema` — the stored shape of the `answers` JSONB column on `candidates` and `organizations`, and of the `entity_answers` RPC field.
 *
 * Covers the empty-entity case, a localised value, a scalar value, the `null` per-question entry the application type permits, and the unknown-key rejection inside a per-question answer object.
 */

import { describe, expect, it } from 'vitest';
import { StoredAnswersSchema } from './storedAnswers.schema';

describe('StoredAnswersSchema', () => {
  it('accepts `{}` — an entity with no answers', () => {
    const result = StoredAnswersSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a localised `value` and a localised `info`', () => {
    const input = {
      q1: { value: { en: 'Yes', fi: 'Kyllä' }, info: { en: 'Because.', fi: 'Koska.' } }
    };
    const result = StoredAnswersSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual(input);
  });

  it('accepts every scalar and array value shape a question type can store', () => {
    const input = {
      text: { value: 'A string.' },
      number: { value: 4 },
      boolean: { value: true },
      multipleChoice: { value: ['a', 'b'] },
      date: { value: '2026-08-30T00:00:00.000Z' },
      unanswered: { value: null }
    };
    expect(StoredAnswersSchema.safeParse(input).success).toBe(true);
  });

  it('accepts a `null` per-question entry, which the application type permits', () => {
    expect(StoredAnswersSchema.safeParse({ q1: null }).success).toBe(true);
  });

  it('accepts a `null` `info`, which the application type permits', () => {
    expect(StoredAnswersSchema.safeParse({ q1: { value: 'x', info: null } }).success).toBe(true);
  });

  it('LEVEL 2: rejects an unknown key INSIDE a per-question answer object', () => {
    // The top level is a record keyed by question id, so it cannot be strict — any id is a legal key. Strictness therefore has to live on the per-question answer object, and this case is what proves it does.
    const result = StoredAnswersSchema.safeParse({ q1: { value: 'x', bogus: 1 } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['q1']);
  });

  ////////////////////////////////////////////////////////////////////////
  // The four shapes `public.validate_answer_value` permits and this schema used to reject.
  //
  // `apps/supabase/supabase/schema/011-validation-functions.sql` is the authority on what the `answers` column may hold, so it is the specification these four cases are read off. Each rejection was TOTAL rather than local: `parseAnswersColumn` returns `undefined` for the whole blob on any failure, so one answer of an admitted-by-the-database shape discarded every OTHER answer the entity had — removing it from matching and, under the default `entities.hideIfMissingAnswers.candidate`, from the results list altogether.
  ////////////////////////////////////////////////////////////////////////

  it('accepts a plain-string `info`, which validate_answer_value:171-177 permits alongside a locale object', () => {
    // `IF jsonb_typeof(p_answer_info) != 'string' AND NOT public.is_localized_string(p_answer_info)` — a bare string passes the first arm, so the database stores it.
    const input = { q1: { value: 'x', info: 'A plain, unlocalised open answer.' } };
    const result = StoredAnswersSchema.safeParse(input);
    expect(result.success).toBe(true);
    // Normalised to the locale-object form the application type declares. Behaviour-neutral: `translateObject` resolves a single-key object to its one string for every requested locale.
    expect(result.success && result.data).toEqual({
      q1: { value: 'x', info: { en: 'A plain, unlocalised open answer.' } }
    });
  });

  it('accepts an answer object with no `value` key, which validate_answer_value:165-169 returns early on', () => {
    // Two ways this reaches the column: the validator itself returns before any type check when `value` is absent, and `JSON.stringify({ value: undefined, info })` DROPS the key outright, which is what `supabaseDataWriter` forwards to `upsert_answers`.
    const input = { q1: { info: { en: 'Orphan info.' } } };
    const result = StoredAnswersSchema.safeParse(input);
    expect(result.success).toBe(true);
    // The absent key is normalised to the `null` the database treats it as, which is also what the application's required `LocalizedAnswer['value']` needs.
    expect(result.success && result.data).toEqual({ q1: { value: null, info: { en: 'Orphan info.' } } });
  });

  it('accepts a `multipleText` value of localised items, per validate_answer_value:217-227', () => {
    // `IF jsonb_typeof(p_item) != 'string' AND NOT public.is_localized_string(p_item)` — each item may be a string OR a locale object, and a multilingual write produces the latter.
    const input = { q1: { value: [{ en: 'a', fi: 'a' }, { en: 'b' }] } };
    const result = StoredAnswersSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual(input);
  });

  it('accepts numeric choice ids in a `multipleChoiceCategorical` value, per validate_answer_value:197-216', () => {
    // The multiple-choice branch validates items only through `is_valid_choice_id`, which compares raw JSONB; the sibling single-choice branch at :197-200 states outright that a choice id is a "string or number". The union already admitted a bare `z.number()` for the single-choice case, so rejecting the array form was an internal asymmetry as well as a divergence from the database.
    const input = { q1: { value: [1, 2] }, q2: { value: ['a', 3] } };
    const result = StoredAnswersSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual(input);
  });
});
