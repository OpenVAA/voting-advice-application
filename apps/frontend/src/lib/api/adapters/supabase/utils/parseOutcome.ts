import { log } from '@openvaa/app-shared';
import type { z } from 'zod';
import type { ParseIssue, ParseOutcome, ParseSource } from './parseOutcome.type';

/**
 * The message a partial-preserve failure reports under when the caller names none of its own.
 *
 * A constant, never an interpolation: sinks key events on the message, and every varying value belongs in the record's attributes. A caller that wants a narrower event name passes its own constant under the same rule, as `parseJsonbColumn.ts` does for images and stored answers.
 */
const PARSE_FAILURE_MESSAGE = 'A stored JSONB value did not match its schema.';

/**
 * Construct the `ok` arm.
 * @param value - The validated value.
 * @returns The outcome carrying it.
 */
export function parseOk<TValue>(value: TValue): ParseOutcome<TValue> {
  return { status: 'ok', value };
}

/**
 * Construct the `absent` arm — the column held nothing, which is not a failure.
 * @returns The absent outcome.
 */
export function parseAbsent<TValue>(): ParseOutcome<TValue> {
  return { status: 'absent' };
}

/**
 * Construct the `malformed` arm.
 *
 * The issues come first and the survivor second, so the `issues` identifier is present at every construction site. The parse-posture lint rule in `apps/frontend/eslint.config.mjs` requires a parse-failure return to name `issues` or `error`, and this order keeps it silent on compliant code.
 * @param issues - What zod rejected, reduced to paths and refused key names.
 * @param value - The re-parsed survivor, when partial-preserve saved one.
 * @returns The malformed outcome.
 */
export function parseMalformed<TValue>(issues: Array<ParseIssue>, value?: TValue): ParseOutcome<TValue> {
  return { status: 'malformed', value, issues };
}

/**
 * Reduce a zod error to what is safe to log.
 *
 * Each issue keeps its dotted path. An `unrecognized_keys` issue also keeps its `keys` array, the only place an unrecognised top-level key names itself, because zod reports that issue at the empty path.
 * @param error - The zod error from a failed `safeParse`.
 * @returns One `ParseIssue` per zod issue, in zod's own order.
 */
function toIssues(error: z.ZodError): Array<ParseIssue> {
  return error.issues.map((issue) => {
    const path = issue.path.join('.');
    return issue.code === 'unrecognized_keys' ? { path, keys: [...issue.keys] } : { path };
  });
}

/**
 * Derive the top-level member names to drop before the retry.
 *
 * For an issue with a non-empty path the member to drop is the path's first element, which is correct for a nested or mistyped member, whose top-level ancestor is what has to go. An issue at the empty path has no first element to read. An empty-path `unrecognized_keys` issue names its members on `issue.keys` instead, and `keys` is an array because zod batches every unrecognised key of one object into one issue, so it is iterated, never indexed. Any other empty-path issue (the value is a string, not an object) has no member to drop, and the outcome is malformed with no survivor.
 * @param error - The zod error from a failed `safeParse`.
 * @returns The distinct top-level member names to remove, empty when there is nothing droppable.
 */
function rejectedTopLevelMembers(error: z.ZodError): Array<string> {
  const rejected = new Set<string>();
  for (const issue of error.issues) {
    if (issue.path.length > 0) {
      rejected.add(String(issue.path[0]));
    } else if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) rejected.add(key);
    }
  }
  return [...rejected];
}

/**
 * Drop the rejected top-level members and re-parse what is left.
 * @param schema - The schema the value failed against.
 * @param raw - The unvalidated value, as read from the column.
 * @param error - The zod error from the first `safeParse`.
 * @returns The re-parsed survivor, or `undefined` when nothing could be preserved.
 */
function preservedRemainder<TValue>(schema: z.ZodType<TValue>, raw: unknown, error: z.ZodError): TValue | undefined {
  // A non-object value has no top-level members to preserve.
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;

  const rejected = rejectedTopLevelMembers(error);
  // Re-parsing an unchanged value would fail the same way, so the retry runs only when something was rejected.
  if (rejected.length === 0) return undefined;

  const retained = Object.fromEntries(Object.entries(raw).filter(([key]) => !rejected.includes(key)));
  const retry = schema.safeParse(retained);
  return retry.success ? retry.data : undefined;
}

/**
 * Report a parse failure without disclosing the value that caused it.
 *
 * Reported at `error` rather than `warn`: a JSONB column that does not match its schema is a data defect a production operator has to see. The name says "report" rather than a level so a level change cannot make the name wrong.
 *
 * Issue paths and rejected key names are carried as sibling flat fields; the offending value never is. A voting-advice application's `answers` and `custom_data` blobs are author-supplied content that may carry personal data, so the key that was refused is disclosed and what was stored under it is not.
 * @param message - A constant describing what the caller did about the failure. Never interpolated.
 * @param source - The column and row the value came from.
 * @param issues - The reduced issues, of which only paths and refused key names are logged.
 * @param preserved - Whether partial-preserve saved anything.
 */
export function reportParseFailure(
  message: string,
  source: ParseSource,
  issues: Array<ParseIssue>,
  preserved: boolean
): void {
  log.error(message, {
    column: source.column,
    id: source.id ?? undefined,
    issues: issues.map((issue) => issue.path),
    rejectedKeys: issues.flatMap((issue) => issue.keys ?? []),
    preserved
  });
}

/**
 * Validate a JSONB value, preserving the top-level members zod accepts when one of the others is malformed.
 *
 * A plain whole-object `safeParse` would discard a publisher name over one bad image path, which is a visible regression for a column that is pure presentation, so the top-level members zod flagged are dropped and the remainder is re-parsed. Every read path that calls this helper gets that behaviour.
 *
 * Three outcomes, never an empty value that means two things:
 * - `absent` — the column held `null`/`undefined`. No record is emitted; absence is not a failure.
 * - `ok` — the whole value parsed. No record is emitted.
 * - `malformed` — it did not. Exactly ONE record is emitted per failing parse, not one per issue, and `value` carries the survivor when there is one.
 *
 * It never throws: one malformed row must not fail the read that contains it. The retry runs exactly once, never in a loop.
 * @param schema - The schema the stored value must satisfy.
 * @param raw - The unvalidated JSONB value read from the column.
 * @param source - The column and row the value came from, for the failure record.
 * @param message - The event name to report a failure under. A constant, never an interpolation; defaults to the generic one when the caller has no narrower name to give.
 * @returns The three-state parse outcome.
 */
export function parseWithPartialPreserve<TValue>(
  schema: z.ZodType<TValue>,
  raw: unknown,
  source: ParseSource,
  message: string = PARSE_FAILURE_MESSAGE
): ParseOutcome<TValue> {
  if (raw == null) return parseAbsent<TValue>();

  const parsed = schema.safeParse(raw);
  if (parsed.success) return parseOk<TValue>(parsed.data);

  const issues = toIssues(parsed.error);
  const value = preservedRemainder<TValue>(schema, raw, parsed.error);
  reportParseFailure(message, source, issues, value !== undefined);

  return parseMalformed<TValue>(issues, value);
}
