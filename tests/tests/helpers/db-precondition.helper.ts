/**
 * Database row-count precondition assertion helper.
 *
 * Thin wrapper around `SupabaseAdminClient.findData(...)` that asserts
 * the query succeeded AND returned exactly `expectedCount` rows.
 * Produces a rich diagnostic message that interpolates the actual row
 * shapes (external_id + name) so the failure surface is debuggable.
 *
 * Propagation surface (per 86.2-RESEARCH.md §"Helper #5 propagation"):
 *   ZERO propagation candidates beyond the anchor at extraction time.
 *   The helper is extracted ahead of Phase 86.3+ test-authoring leverage
 *   (the 8 source-skipped tests in 86.3 are likely to add fresh DB
 *   preconditions), NOT for current dedup.
 *
 * Generic over the SupabaseAdminClient instance (test-layer subclass that
 * adds `findData` / `query` / `update` on top of the dev-seed bulk-write
 * base). The helper takes the client instance — it does not construct
 * one — so callers control project scoping and connection reuse.
 */

import { expect } from '@playwright/test';
import type { SupabaseAdminClient } from '../utils/supabaseAdminClient';

/**
 * Assert that a `findData(table, filter)` query returns exactly
 * `expectedCount` rows. Fails-fast with a diagnostic message that
 * includes the table, filter, expected vs actual count, and a sampling
 * of row identifiers + names (matches anchor's diagnostic shape).
 *
 * Diagnostic format:
 *   `<message-prefix>: expected exactly <N> rows under filter <JSON>; got <actual>: <external_id=name>; <external_id=name>; ...`
 *
 * @param client - SupabaseAdminClient instance (test-layer subclass).
 * @param table - collection / table name (camelCase or snake_case).
 * @param filter - `findData` filter object (`{ field: { $eq: value } }`
 *   or `{ field: { $like: 'test-%' } }` etc.).
 * @param expectedCount - exact row count to assert.
 * @param opts.message - optional message prefix for the diagnostic
 *   output (e.g. `'CONF-06 multi-election dataset'`).
 */
export async function assertDbRowCount<TTable extends string>(
  client: SupabaseAdminClient,
  table: TTable,
  filter: Parameters<SupabaseAdminClient['findData']>[1],
  expectedCount: number,
  opts: { message?: string } = {}
): Promise<void> {
  const probe = await client.findData(table, filter);
  expect(probe.type, `${opts.message ?? `precondition: ${table} probe`}: query failed`).toBe('success');
  const rows = (probe.type === 'success' ? (probe.data ?? []) : []) as Array<Record<string, unknown>>;
  expect(
    rows,
    `${opts.message ?? `precondition: ${table}`}: expected exactly ${expectedCount} rows under filter ${JSON.stringify(filter)}; got ${rows.length}: ${rows
      .map((r: Record<string, unknown>) => `${r.external_id ?? r.id}=${JSON.stringify(r.name ?? null)}`)
      .join('; ')}`
  ).toHaveLength(expectedCount);
}
