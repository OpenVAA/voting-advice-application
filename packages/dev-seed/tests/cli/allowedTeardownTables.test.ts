/**
 * ALLOWED_TEARDOWN_TABLES completeness check (Phase 140 review WR-04).
 *
 * `assertTeardown.ts`'s docblock states — as this phase's own residual
 * limitation — that a table dropped from `ALLOWED_TEARDOWN_TABLES` goes blind
 * on BOTH sides at once (the probe stops counting it, `bulk_delete` stops
 * deleting it), and that the fix cannot be a second hand-maintained list
 * under `tests/` without recreating the drift this phase closed. It CAN be a
 * check of `ALLOWED_TEARDOWN_TABLES` against the schema fact it claims to
 * mirror, without duplicating the table names anywhere new: the constant's
 * own docblock (`teardown.ts`) states the invariant precisely — "10 tables in
 * schema's `allowed_collections`, minus `app_settings`" — which is a
 * checkable fact against the migration SQL, not a second copy of the list.
 *
 * If this test ever fails, it means `bulk_delete`'s `allowed_collections`
 * array changed (a table added/removed) without `ALLOWED_TEARDOWN_TABLES`
 * being updated to match — exactly the coverage hole WR-04 named.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { ALLOWED_TEARDOWN_TABLES } from '../../src/cli/teardown';

// packages/dev-seed/tests/cli/ -> repo root is four levels up.
const SCHEMA_MIGRATION_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  'apps/supabase/supabase/migrations/00001_initial_schema.sql'
);

/**
 * Extracts the `allowed_collections text[] := ARRAY[...]` literal from
 * `bulk_delete`'s PL/pgSQL body and returns its quoted string elements, in
 * declaration order. Deliberately narrow (matches only this one declaration
 * shape) — this is a completeness CHECK against a known fact, not a general
 * SQL parser.
 */
function parseAllowedCollections(sql: string): Array<string> {
  const match = /allowed_collections\s+text\[\]\s*:=\s*ARRAY\[([\s\S]*?)\]/.exec(sql);
  if (!match) {
    throw new Error(
      'allowedTeardownTables.test.ts could not find the `allowed_collections text[] := ARRAY[...]` ' +
        'declaration in 00001_initial_schema.sql — the bulk_delete function shape changed; update the ' +
        'regex in this test.'
    );
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('ALLOWED_TEARDOWN_TABLES completeness (Phase 140 WR-04)', () => {
  it('covers every allowed_collection in bulk_delete except app_settings', () => {
    const sql = readFileSync(SCHEMA_MIGRATION_PATH, 'utf8');
    const allowedCollections = parseAllowedCollections(sql);

    // Sanity: the parse itself found a non-trivial list (guards against a
    // silently-empty match passing the comparison below vacuously).
    expect(allowedCollections.length).toBeGreaterThan(0);

    const expected = allowedCollections.filter((t) => t !== 'app_settings').sort();
    expect([...ALLOWED_TEARDOWN_TABLES].sort()).toEqual(expected);
  });
});
