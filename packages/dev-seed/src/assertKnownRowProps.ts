/**
 * **Pass 0 of the write path** — the runtime unknown-property guard.
 *
 * `Writer.write()` calls this once, immediately above Pass 1, on the map of collection → rows. It throws on the first row property that is neither permitted nor knowingly discarded, naming the offending key, the collection and the row's `external_id`.
 *
 * ## Why a runtime guard exists beside the type layer
 *
 * Excess property checking is a **fresh-object-literal rule**. A row that reaches a `fixed:` array through an already-loose intermediate variable is not checked at all, so `FixedRow<C>` cannot cover it. This module is the only cover for that residue, and it is also the only layer that sees a template loaded from disk with `--template ./custom.ts`, because every path — built-in and custom alike — funnels through the writer.
 *
 * ## It is PURE, and that is load-bearing
 *
 * No admin client, no network, no `process.env`. It imports exactly one module, `./template/permittedKeys`, so `yarn test:unit` exercises it directly with no database standing behind it.
 *
 * ## It runs BEFORE the two silent-strip rules, not instead of them
 *
 * `bulkImport`'s `_`-prefix rule and its `NON_COLUMN_FIELDS` strip stay exactly where they are. Because Pass 0 runs first, nothing reaches them unrecognised — the strips keep discarding keys the pipeline genuinely handles, and stop being the place an author's typo disappears.
 *
 * ## First offence, not an aggregate — CHOSEN, not defaulted into
 *
 * `bulkImport`'s and `linkJoinTables`' existing failures are all first-failure, and an aggregate over the 1,481 rows a built-in run emits would bury the signal under its own volume. Stated here so a later reader knows this was a decision rather than an omission, recorded in the guard's own spec.
 *
 * ## The `external_id` it does NOT require
 *
 * `feedback`, `accounts` and `projects` have no `external_id` column at all, and the writer's own spec passes rows without one. The guard therefore never reports a missing `external_id` — the RPC hard-requires it for the ten bulk-import tables and raises by name three passes later, and pre-empting that with a worse message would change the failure mode for every such row. When a row has none, the message falls back to the row's index within its collection.
 */

import { deniedKeys, permittedKeys, resolveCollectionName, SKIP_COLUMNS_SOURCE } from './template/permittedKeys';

/** The file an author edits to make an intentionally-new key legal. */
const DECLARATION_MODULE = 'packages/dev-seed/src/template/permittedKeys.ts';

/**
 * How a row is identified in a message: by its `external_id` when it has one, by its index when it does not. Never phrased as a complaint about the absence.
 */
function describeRow(row: Record<string, unknown>, index: number, collection: string): string {
  const externalId = row.external_id ?? row.externalId;
  if (typeof externalId === 'string' && externalId.length > 0) {
    return `row external_id: '${externalId}'`;
  }
  return `row external_id: <none> — index ${index} of collection '${collection}'`;
}

function unknownPropertyMessage(
  key: string,
  collection: string,
  table: string,
  rowLabel: string,
  permitted: ReadonlySet<string>
): string {
  return (
    `assertKnownRowProps: unknown property '${key}' on collection '${collection}' ` +
    `(${rowLabel}; resolved table '${table}'). ` +
    'The seed pipeline never reads it, so it would be silently dropped rather than failing. ' +
    `Permitted keys for '${table}': ${[...permitted].sort().join(', ')}. ` +
    'If the pipeline is meant to read it, declare it in LINK_SENTINELS or COLLECTION_NON_COLUMNS in ' +
    `${DECLARATION_MODULE}.`
  );
}

function deniedPropertyMessage(key: string, collection: string, table: string, rowLabel: string): string {
  return (
    `assertKnownRowProps: property '${key}' on collection '${collection}' ` +
    `(${rowLabel}; resolved table '${table}') is a real column, but the bulk_import RPC discards it ` +
    `via skip_columns (${SKIP_COLUMNS_SOURCE}), so setting it has no effect. Remove it.`
  );
}

/**
 * Assert that every property of every row is one the pipeline actually reads.
 *
 * @param data collection → rows, as `runPipeline` emits it. ⚠ `Writer.write()`
 *   passes its **pre-deletion** `data` parameter, not `bulkData`: by the time Pass 1 runs, `accounts`, `projects`, `feedback` and `app_settings` have been removed from `bulkData`, and `app_settings` is a first-class template-authorable fragment that every single built-in emits a row of.
 * @throws on the FIRST offending property — an unknown key, a key that is a real
 *   column the RPC discards, or a collection this module does not model at all.
 *   An unrecognised collection is loud even when it carries zero rows: returning quietly would let a keying confusion permit every key on every row.
 */
export function assertKnownRowProps(data: Record<string, Array<Record<string, unknown>>>): void {
  for (const [collection, rows] of Object.entries(data)) {
    if (!Array.isArray(rows)) continue;

    const table = resolveCollectionName(collection);
    // Resolved for EVERY array-valued collection, empty ones included — this is what makes an unrecognised collection loud rather than merely unchecked.
    // `permittedKeys` throws here, and its message names both the raw key and the table it resolved to.
    const permitted = permittedKeys(collection);
    const denied = deniedKeys(collection);

    for (const [index, row] of rows.entries()) {
      if (row === null || typeof row !== 'object') continue;
      const rowLabel = describeRow(row, index, collection);
      for (const key of Object.keys(row)) {
        // Denied first: a denied key IS a permitted column, so the allow-list would wave it through and the author would never learn it is dropped.
        if (denied.has(key)) throw new Error(deniedPropertyMessage(key, collection, table, rowLabel));
        if (!permitted.has(key)) throw new Error(unknownPropertyMessage(key, collection, table, rowLabel, permitted));
      }
    }
  }
}
