import { z } from 'zod';
import { staticSettings } from '../../settings/staticSettings';

/**
 * A localised string as it is stored: an object keyed by locale. Mirrors `LocalizedString` in `../localized.type`.
 */
const LocalizedStringSchema = z.record(z.string(), z.string());

/**
 * The locale key a plain-string `info` is filed under when it is normalised into a locale object below.
 *
 * The choice does not affect resolution — `translateObject` falls back through `matchLocale`, then the default locale, then the FIRST remaining key, so a single-key object resolves to its one string for every requested locale — but the default locale is the honest label for a string that carries no locale of its own, and it is the key the multilingual editor shows first.
 */
const DEFAULT_LOCALE =
  staticSettings.supportedLocales.find((locale) => locale.isDefault)?.code ?? staticSettings.supportedLocales[0].code;

/**
 * The value of a single stored answer.
 *
 * ## Deliberately a UNION rather than a tightened per-type shape — do not "complete" this
 *
 * The stored `answers` blob is keyed by question id and carries no question type, so the value's admissible shape is not knowable at this seam: a `text` answer stores a string, `number` a number, `boolean` a boolean, `multipleChoice` an array of ids, `date` an ISO string, and `image` an `Image`-shaped object. Narrowing per question type requires the question row, which arrives on a different read. The authority that resolves the value is `parseAnswers` in the frontend, which branches on `isLocalizedString`. This schema's job is the STRUCTURE around the value, which is what the unknown-key rejection below guards.
 *
 * `z.record(z.string(), z.unknown())` covers both the localised-object form (`{ en: 'Yes' }`) and the `Image` form, which are indistinguishable without the question type.
 *
 * ## The union is read off `public.validate_answer_value`, which is the authority
 *
 * `apps/supabase/supabase/schema/011-validation-functions.sql` is what the database actually enforces on this column, so it — not the application's writers — is the specification for what this schema must admit. The array member is a union rather than `z.array(z.string())` because that function admits two non-string item forms: a `multipleText` item may be a string OR a locale object (`:217-227`), and a `multipleChoiceCategorical` item is validated only through `is_valid_choice_id`, whose sibling single-choice branch states outright that a choice id is a "string or number" (`:197-200`). The union already admitted a bare `z.number()` for a single choice, so rejecting `[1, 2]` was an internal asymmetry as well.
 */
const StoredAnswerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string(), z.number(), z.record(z.string(), z.unknown())])),
  z.record(z.string(), z.unknown()),
  z.null()
]);

/**
 * One stored answer.
 *
 * Mirrors `LocalizedAnswer` in `../localized.type`, whose members are exactly `value` (from the core `Answer` interface) and an optional localised `info`. Strict, because this is the only level at which strictness can live: the enclosing record is keyed by question id, so any key there is legal.
 */
const StoredAnswerSchema = z.strictObject({
  /**
   * The answer value. Its admissible shape depends on the question type; see `StoredAnswerValueSchema`.
   *
   * OPTIONAL ON INPUT, because the key is genuinely absent in stored data: `validate_answer_value` returns before every type check when `value` is missing or null (`011-validation-functions.sql:165-169`), and `JSON.stringify({ value: undefined, info })` DROPS the key, which is the shape `supabaseDataWriter` forwards verbatim to `upsert_answers` for an answer carrying only an open answer.
   *
   * NORMALISED TO `null` ON OUTPUT rather than left optional, because the database treats the two as the same thing — `IF p_answer_value IS NULL OR p_answer_value = 'null'::jsonb THEN RETURN` collapses "absent" and "explicitly null" in one condition — while the application type does not: `LocalizedAnswer` inherits a REQUIRED `value` from the core `Answer` interface, so an optional output member is not assignable to it. Defaulting keeps the widened input without pushing an `undefined` the application contract has no room for.
   */
  value: StoredAnswerValueSchema.default(null),
  /**
   * An optional open answer accompanying the value.
   *
   * ACCEPTED AS a locale object OR a plain string, because `validate_answer_value:171-177` accepts either (`jsonb_typeof(...) = 'string' OR is_localized_string(...)`) and the file header at `:145` documents exactly that. Rejecting the plain-string form did not cost the field; it cost the entity's WHOLE answer blob, since `parseAnswersColumn` degrades any failure to `undefined`.
   *
   * NORMALISED TO the locale-object form on output, under {@link DEFAULT_LOCALE}. This keeps the boundary type equal to the application's `LocalizedAnswer['info']` instead of widening that type across the candidate app — where `LocalizedCandidateData.answers` is an `Answers & LocalizedAnswers` INTERSECTION, so `info` resolves to the nonsense type `string & LocalizedString` and the open-answer `<Input>`'s computed `type` prop only typechecks because that intersection satisfies both arms of the `InputProps` union. Untangling that is a separate piece of work. The normalisation is behaviour-neutral for readers: `translateObject` resolves a single-key locale object to its one string for every locale, which is exactly what `translate()` does with a plain string.
   */
  info: z
    .union([LocalizedStringSchema, z.string()])
    .nullable()
    .optional()
    .transform((value) => (typeof value === 'string' ? { [DEFAULT_LOCALE]: value } : value))
});

/**
 * The stored shape of the `answers` JSONB column on `candidates` and `organizations`, and of the `entity_answers` field returned by the entity RPCs.
 *
 * ## Stored, not application
 *
 * This describes what the DATABASE holds: `value` and `info` may both be locale objects. The APPLICATION type is `Answers` from `@openvaa/data`, in which both are resolved to the active locale. `parseAnswers` in the frontend is the derive step.
 *
 * `z.record` takes TWO arguments in zod 4; the one-argument v3 form is gone.
 */
export const StoredAnswersSchema = z.record(z.string(), StoredAnswerSchema.nullable());

/**
 * The stored shape of an `answers` JSONB value. Mirrors `LocalizedAnswers`, which the frontend declares in `$lib/api/base/dataWriter.type`.
 */
export type StoredAnswers = z.infer<typeof StoredAnswersSchema>;

/**
 * The stored shape of a single answer within {@link StoredAnswers}.
 */
export type StoredAnswer = z.infer<typeof StoredAnswerSchema>;
