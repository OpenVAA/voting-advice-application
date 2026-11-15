/**
 * Where a JSONB value came from, carried into the parse-failure record so the report names the read rather than just its shape.
 *
 * Only a column name and a row id are ever carried. The offending value is deliberately absent: a `custom_data` or `answers` blob is author-supplied content, and copying it into a log record would move it into a sink that was never in scope for it (T-157-17).
 *
 * Declared here rather than in `./parseJsonbColumn` on purpose: this module is the seam every read path depends on, so it depends on nothing inside the adapter itself. `157.1-04` converged the two names — `parseJsonbColumn`'s structurally identical `JsonbColumnSource` is gone and both parse helpers now take this type.
 */
export type ParseSource = {
  /** The `table.column` the value was read from. */
  column: string;
  /** The id of the row the value belongs to, when the read has one to hand. */
  id?: string | null;
};

/**
 * One zod issue, reduced to what is safe to log: the dotted path, and — for an `unrecognized_keys` issue, whose path names the CONTAINING object rather than the offending key — the key names.
 *
 * The offending VALUE is never carried (T-157-17). `keys` is the field that closes the A2 hole: zod reports an unrecognised TOP-LEVEL key at the empty path, so the path names no member and only `keys` identifies what was refused.
 */
export type ParseIssue = {
  /** The dotted path zod reported, `''` for an issue at the root. */
  path: string;
  /** Present only for `unrecognized_keys`: the keys zod refused. An array, because zod batches every unrecognised key of one object into a single issue. */
  keys?: Array<string>;
};

/**
 * The result of validating one JSONB value at the adapter boundary.
 *
 * Three statuses, never an empty value that means two things (requirement **D8**, decision **B1(a)**):
 * - `absent` — the column held `null`/`undefined`. Absence is not a failure and emits no record.
 * - `ok` — the whole value parsed.
 * - `malformed` — it did not. `value` carries the re-parsed survivor when partial-preserve saved one and `undefined` when nothing could be preserved; `issues` always names what was rejected.
 *
 * `absent` and `malformed` are distinguishable WITHOUT any narrowing helper: a consumer that does nothing special still sees two different `status` literals. That is the whole content of D8 — a degrade-to-empty made them the same VALUE at every call site.
 *
 * The field names are load-bearing rather than stylistic. `status` rather than `type`, because `type` is already the discriminant on `DataApiActionResult` (`$lib/api/base/actionResult.type.ts`) and on every entity variant, and reusing it invites a comparison typo that typechecks against the wrong union. `value` rather than `data`, because `data` is the Supabase destructuring name in every adapter method. `issues` rather than `errors`, because it matches zod's own `error.issues` and is the identifier the G5 guard selector in `157.1-07` keys on — renaming it silently weakens the guard.
 *
 * The `issues?: undefined` and `value?: undefined` members on the arms that do not carry them are deliberate: TypeScript allows a property access when every arm declares it, so `outcome.issues` is readable without narrowing. That is what keeps the ten `parseImageColumn` call sites from each needing a type guard just to compile.
 *
 * This is a plain object union, deliberately not a `class`. The value crosses SvelteKit's `devalue` load-data serialization boundary, where a constructed instance does not survive and a plain object does, and `CLAUDE.md` § "Instance Checks" records prior `instanceof` trouble in this repository (commit `87efe19a`). It is not a two-state `Result`-alike either: D8's entire content is that `absent` is a THIRD state and not an error.
 */
export type ParseOutcome<TValue> =
  | { status: 'ok'; value: TValue; issues?: undefined }
  | { status: 'absent'; value?: undefined; issues?: undefined }
  | { status: 'malformed'; value: TValue | undefined; issues: Array<ParseIssue> };
