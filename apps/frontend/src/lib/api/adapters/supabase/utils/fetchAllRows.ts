import { log } from '@openvaa/app-shared';

/**
 * The event name the probable-row-cap warning is filed under.
 *
 * A CONSTANT, never an interpolation (decision **C4** NOTE 1, the rule `isValidResult.ts`'s `INVALID_RESULT_MESSAGE` follows): the varying values travel as flat attributes beside it — `label`, `pageLength`, `pageSize` — and no row data or query text ever does.
 */
export const PROBABLE_ROW_CAP_MESSAGE =
  'A paged read received a short page whose length is a multiple of 1,000, so the server probably caps responses (PostgREST max_rows) below the configured page size.';

/**
 * The granularity a server row cap is assumed to be set in. Supabase's hosted default is 1,000 and every cap met so far has been a multiple of it.
 */
const ROW_CAP_GRANULARITY = 1000;

/**
 * One page as a Supabase / PostgREST read resolves it.
 */
type PageResult<TRow> = { data: Array<TRow> | null; error: { message: string } | null };

/**
 * Read every row of a collection in pages, so a server-side per-response row cap cannot truncate the result silently.
 *
 * PostgREST answers a request for more rows than its `max_rows` with the capped rows and HTTP 200 — no error, no header the client checks. Spike 026 F1 measured the voter app returning 1,000 of 1,510 nominations that way. This helper is the one place every multi-row read of the Supabase data provider goes through (D-07).
 *
 * **The contract.**
 * - `fetchPage(from, to)` is a FACTORY: it must build a FRESH query for every call. A postgrest-js builder mutates its URL on `range()` and re-executes on every `then`, so reusing one across pages is fragile.
 * - The first request is `(0, pageSize - 1)`; each next one starts where the rows RECEIVED end, never at `offset + pageSize` — advancing by the page size would skip every row a capped server withheld.
 * - A full page continues the read.
 * - A shorter page ends it, with one exception — spike 030 option (c), D-09: a non-empty short page whose length is a multiple of 1,000 looks like a server cap below `pageSize`. Then exactly one confirming request is issued at the next offset, and one warning ({@link PROBABLE_ROW_CAP_MESSAGE}) is logged per read. An empty confirming page ends the read (the false alarm: a total that happens to be a multiple of 1,000); a non-empty one proves the cap and the read carries on.
 * - `data: null` without an error is an empty page.
 * - An error on any page rejects with `` `${label}: ${message}` ``, so callers keep the message prefixes they already had.
 *
 * Callers that page a table must order on a unique key (`sort_order`, then `id` — D-08), or page boundaries are not stable across requests.
 *
 * @param fetchPage - Builds and runs a fresh query for the inclusive row range `[from, to]`.
 * @param options.pageSize - Rows requested per page; `staticSettings.dataAdapter.pageSize` for the provider. Must be a positive integer.
 * @param options.label - Prefix for thrown messages and the warning's `label` attribute.
 * @returns Every row, in the order the pages returned them.
 * @throws If `pageSize` is not a positive integer, or any page resolves with an error.
 */
export async function fetchAllRows<TRow>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<TRow>>,
  { pageSize, label }: { pageSize: number; label: string }
): Promise<Array<TRow>> {
  if (!Number.isInteger(pageSize) || pageSize < 1)
    throw new Error(`${label}: the page size must be a positive integer, got ${pageSize}.`);

  const rows: Array<TRow> = [];
  let offset = 0;
  let warned = false;
  for (;;) {
    const { data, error } = await fetchPage(offset, offset + pageSize - 1);
    if (error) throw new Error(`${label}: ${error.message}`);
    const page = data ?? [];
    for (const row of page) rows.push(row);
    offset += page.length;
    if (page.length === pageSize) continue;
    if (page.length > 0 && page.length % ROW_CAP_GRANULARITY === 0) {
      if (!warned) {
        log.warn(PROBABLE_ROW_CAP_MESSAGE, { label, pageLength: page.length, pageSize });
        warned = true;
      }
      continue;
    }
    return rows;
  }
}
