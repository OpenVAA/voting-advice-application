/**
 * ALLOWED_TEARDOWN_TABLES completeness check (see phase 140 review WR-04).
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
 * If this test ever fails, it means `bulk_delete`'s collection arrays changed
 * (a table added/removed) without `ALLOWED_TEARDOWN_TABLES` being updated to
 * match — exactly the coverage hole WR-04 named.
 *
 * see phase 140 review IN-01 — why TWO arrays are parsed, not one. `bulk_delete`
 * declares `allowed_collections` (used only to VALIDATE the caller's keys) and
 * `delete_order` (the array it actually ITERATES to perform the deletes). They
 * hold the same 11 names today, so checking either one passes; they are not
 * the same fact. The original check pointed at the validating array, which is
 * the wrong side of the invariant `ALLOWED_TEARDOWN_TABLES` needs: a table
 * present in `allowed_collections` but absent from `delete_order` is ACCEPTED
 * by `bulk_delete` and never DELETED, so adding it here would make the probe
 * count rows nothing removes — reddening `rowsDeleted === rowsBefore` at every
 * one of the 27 `runTeardownAsserted` sites, with this test's own failure
 * message as the instruction that caused it.
 *
 * So: `ALLOWED_TEARDOWN_TABLES` is checked against the INTERSECTION (what
 * `bulk_delete` both accepts and acts on), and a second test asserts the two
 * SQL arrays agree as sets — which is what makes the intersection a safe thing
 * to check rather than a silent way to shrink coverage.
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
 * Extracts a `<name> text[] := ARRAY[...]` literal from `bulk_delete`'s
 * PL/pgSQL body and returns its quoted string elements, in declaration order.
 * Deliberately narrow (matches only this one declaration shape) — this is a
 * completeness CHECK against a known fact, not a general SQL parser.
 *
 * Throws rather than returning empty when the declaration is not found: a
 * silent `[]` would make every comparison below pass vacuously, which is the
 * fake-guard shape this file exists to avoid.
 */
function parseSqlTextArray(sql: string, declaration: 'allowed_collections' | 'delete_order'): Array<string> {
  const match = new RegExp(`${declaration}\\s+text\\[\\]\\s*:=\\s*ARRAY\\[([\\s\\S]*?)\\]`).exec(sql);
  if (!match) {
    throw new Error(
      `allowedTeardownTables.test.ts could not find the \`${declaration} text[] := ARRAY[...]\` ` +
        'declaration in 00001_initial_schema.sql — the bulk_delete function shape changed; update the ' +
        'regex in this test.'
    );
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('ALLOWED_TEARDOWN_TABLES completeness (WR-04, IN-01)', () => {
  it('bulk_delete validates and deletes the same set of collections', () => {
    const sql = readFileSync(SCHEMA_MIGRATION_PATH, 'utf8');
    const allowedCollections = parseSqlTextArray(sql, 'allowed_collections');
    const deleteOrder = parseSqlTextArray(sql, 'delete_order');

    // Sanity: both parses found a non-trivial list (guards against a
    // silently-empty match passing the comparisons vacuously).
    expect(allowedCollections.length).toBeGreaterThan(0);
    expect(deleteOrder.length).toBeGreaterThan(0);

    // Order deliberately ignored: `delete_order` is in reverse dependency order
    // (children first) and `allowed_collections` is not — it is set equality
    // that the intersection check below depends on, not sequence.
    expect(
      [...deleteOrder].sort(),
      'bulk_delete accepts a collection it never deletes (or vice versa) — the two arrays drifted, ' +
        'so ALLOWED_TEARDOWN_TABLES can no longer be checked against either one alone'
    ).toEqual([...allowedCollections].sort());
  });

  it('covers every collection bulk_delete both accepts and deletes, except app_settings', () => {
    const sql = readFileSync(SCHEMA_MIGRATION_PATH, 'utf8');
    const allowedCollections = parseSqlTextArray(sql, 'allowed_collections');
    const deleteOrder = parseSqlTextArray(sql, 'delete_order');

    // The intersection is the honest target: a name must be ACCEPTED by
    // validation and REACHED by the delete loop before teardown may count it.
    const effective = allowedCollections.filter((t) => deleteOrder.includes(t));
    expect(effective.length).toBeGreaterThan(0);

    const expected = effective.filter((t) => t !== 'app_settings').sort();
    expect([...ALLOWED_TEARDOWN_TABLES].sort()).toEqual(expected);
  });
});
