import { StoredAnswersSchema, StoredImageSchema } from '@openvaa/app-shared';
import { parseAbsent, parseMalformed, parseOk, parseWithPartialPreserve } from './parseOutcome';
import { parseStoredImage } from './storageUrl';
import type { StoredAnswers, StoredImage } from '@openvaa/app-shared';
import type { Image } from '@openvaa/data';
import type { Json } from '@openvaa/supabase-types';
import type { ParseOutcome, ParseSource } from './parseOutcome.type';

/**
 * The event name an image parse failure is reported under.
 *
 * A CONSTANT, never an interpolation: a downstream sink keys events on a stable message and every varying value belongs in the attribute bag instead (decision **C4** NOTE 1). It therefore has to be right once — changing it later is a breaking change for any sink that keyed on it.
 *
 * It deliberately does NOT say the value was dropped. Under decision **A2** the malformed top-level members are removed and the remainder is re-parsed, so a stored image whose only defect is an unrecognised member under `focalPoint` still yields a usable image; a message asserting the image was dropped would be false at exactly the sites where partial preserve did its job. What was and was not preserved is carried on the record's `preserved` attribute instead.
 */
const IMAGE_PARSE_FAILURE_MESSAGE = 'A stored image did not match its schema.';

/**
 * The event name a stored-answers parse failure is reported under.
 *
 * Same contract as {@link IMAGE_PARSE_FAILURE_MESSAGE}: a constant event name, no interpolation, and no claim that anything was dropped — under **A2** the offending question ids are removed and the rest of the blob survives.
 */
const ANSWERS_PARSE_FAILURE_MESSAGE = 'Stored answers did not match their schema.';

/**
 * Validate an `image` JSONB value and derive the application `Image` from it.
 *
 * This is the two-step the adapter performs at every typed-JSONB read: the column does NOT hold the application type, it holds a storage-relative variant of it, so the stored shape is validated first and the application value is derived from the validated result. It replaces a triple cast that asserted the stored shape without checking it.
 *
 * ## Three states, never one empty value meaning two things (requirement **D8**)
 *
 * This function used to answer an absent column and a malformed column with the same value, which made the two indistinguishable BY CONSTRUCTION at all ten of its call sites — no amount of logging could separate them, only the return type could. It now answers with a {@link ParseOutcome}:
 * - `absent` — the column held `null`/`undefined`, or it held a shape that validated but names no object. No record is emitted; absence is not a failure.
 * - `ok` — the whole value validated and derived.
 * - `malformed` — it did not. Exactly one record is emitted, at `error` (decision **C5(b)**), and `value` carries the derived survivor when partial preserve saved one.
 *
 * ## Partial preserve changes the OUTCOME here, not just the reporting (decision **A2**)
 *
 * The body delegates to `parseWithPartialPreserve` rather than re-implementing the retry, so this site inherits the generalised behaviour: the top-level members zod flagged are removed and the remainder is re-parsed. A stored image whose only defect is an unrecognised member under the nested `focalPoint` object therefore yields a USABLE image with the focal point discarded, where it previously yielded nothing at all. `path` is required (`storedImage.schema.ts`), so removing it makes the retry fail too and a value missing its path is still `malformed` with no survivor — which is correct.
 *
 * It never throws, because one malformed row must not fail the read that contains it (T-157-06).
 * @param stored - The unvalidated JSONB value read from the column.
 * @param supabaseUrl - The Supabase base URL used to build the public object URL.
 * @param source - The column and row the value came from, for the failure record.
 * @returns The three-state parse outcome carrying the derived `Image`.
 */
export function parseImageColumn(
  stored: Json | undefined,
  supabaseUrl: string,
  source: ParseSource
): ParseOutcome<Image> {
  const outcome = parseWithPartialPreserve<StoredImage>(StoredImageSchema, stored, source, IMAGE_PARSE_FAILURE_MESSAGE);

  if (outcome.status === 'absent') return parseAbsent<Image>();

  const image = parseStoredImage(outcome.value, supabaseUrl);

  if (outcome.status === 'malformed') return parseMalformed<Image>(outcome.issues, image);

  // The stored shape validated, yet the derive step can still yield nothing: `path` is `z.string()`, which admits `''`, and an empty path names no object. There is no schema violation to report and no image to show, which is exactly what `absent` means — so it is answered as `absent` rather than invented as a fourth state.
  return image === undefined ? parseAbsent<Image>() : parseOk<Image>(image);
}

/**
 * Validate an `answers` JSONB value into its stored shape.
 *
 * The derive step is deliberately NOT performed here. `parseAnswers` resolves the locale objects and needs the active locale, and one caller — the writer's candidate read-back — wants the stored shape rather than the resolved one, so this function stops at validation and each caller derives what it needs.
 *
 * ## Three states, never one empty value meaning two things (requirement **D8**)
 *
 * `absent` for a `null`/`undefined` column and no record; `ok` for a value that validated; `malformed` otherwise, with exactly one record at `error` (decision **C5(b)**) and the survivor on `value`. The previous posture answered the first and the last with the same value six lines apart, which is requirement D8's class in its purest form.
 *
 * ## What partial preserve means at THIS site (decision **A2**)
 *
 * `StoredAnswersSchema` is a `z.record`, so it admits any key: the unrecognised-top-level-key hole that partial preserve had to close elsewhere does not arise here, because a zod issue's first path element is always a question id. Partial preserve therefore means DROPPING THE OFFENDING QUESTION IDS and keeping the rest, which is the highest-value application of A2 in this phase — one unacceptable answer previously wiped an entity's whole blob and, under `entities.hideIfMissingAnswers.candidate`, removed that entity from the results list entirely.
 *
 * It never throws (T-157-06).
 * @param stored - The unvalidated JSONB value read from the column.
 * @param source - The column and row the value came from, for the failure record.
 * @returns The three-state parse outcome carrying the validated stored answers.
 */
export function parseAnswersColumn(stored: Json | undefined, source: ParseSource): ParseOutcome<StoredAnswers> {
  return parseWithPartialPreserve<StoredAnswers>(StoredAnswersSchema, stored, source, ANSWERS_PARSE_FAILURE_MESSAGE);
}

/**
 * Narrow an image parse outcome to what the application data model can hold.
 *
 * `absent` and `malformed` both yield nothing HERE, and that is a deliberate LOCAL decision rather than a lost distinction. `@openvaa/data`'s `*Data.image` field is `Image | undefined` and has no third state to carry, so the honest posture at these sites is the same rendering, reached deliberately.
 *
 * The distinction survives everywhere it is actionable: in the `error` record {@link parseImageColumn} already emitted (decision **C5(b)**), and in the {@link ParseOutcome} this function was handed — the caller still holds it and chose to collapse it. A site that CAN act on the difference reads `.status` instead of calling this; `_getAppSettings`, `_setAnswers` and `sendEmail` are the three that do.
 *
 * This is NOT the branded-empty option decision **B1** rejected. A symbol tag is erased implicitly at every `??` and every spread — which is exactly where the defect lived — whereas this erasure is a named function call, so `grep -n 'imageOf('` enumerates every site that chose it; the type still carries the distinction upstream, so a NEW caller of {@link parseImageColumn} must decide rather than being handed a pre-erased value; and the erasure happens AFTER the record is emitted rather than instead of it.
 * @param outcome - The outcome from {@link parseImageColumn}.
 * @returns The derived image, or nothing for an absent or malformed column.
 */
export function imageOf(outcome: ParseOutcome<Image>): Image | undefined {
  return outcome.value;
}

/**
 * Narrow a stored-answers parse outcome to what the consumer can hold.
 *
 * Same contract and same rationale as {@link imageOf}: a deliberate local collapse, greppable by name, taken after the `error` record was emitted and while the caller still holds the outcome.
 *
 * Applied at only THREE of {@link parseAnswersColumn}'s four call sites, because they are not uniform. The two provider reads collapse correctly — `parseAnswers` resolves to an `Answers` shape with no third state at the consumer. The candidate's own answers read in the writer collapses by the recorded discretion call `157.1-04 D-DISC-3`, annotated at that site. The writer's post-RPC read-back does NOT use this accessor: decision **B3** gives it a status branch of its own, and `157.1-06` owns it.
 * @param outcome - The outcome from {@link parseAnswersColumn}.
 * @returns The validated stored answers, or nothing for an absent or malformed column.
 */
export function answersOf(outcome: ParseOutcome<StoredAnswers>): StoredAnswers | undefined {
  return outcome.value;
}
