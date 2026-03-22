#!/usr/bin/env node

/**
 * Custom schema lint script derived from Supabase Splinter advisors.
 *
 * Runs SQL queries against the local Supabase Postgres instance to check for
 * schema-level issues that `supabase db lint` (PL/pgSQL-only) does not cover.
 *
 * Checks implemented:
 *   - 0013 RLS disabled on public tables  (ERROR)
 *   - 0001 Unindexed foreign keys         (WARNING)
 *
 * Usage:
 *   node scripts/lint-schema.mjs [--strict]
 *
 * Exit codes:
 *   0 - No errors (warnings may be present)
 *   1 - At least one ERROR-level issue found (or WARNING in --strict mode)
 */

import {execSync} from 'node:child_process';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54332/postgres';
const STRICT = process.argv.includes('--strict');

// Tables to exclude from the RLS check (internal / extension tables)
const RLS_EXCLUDE = ['schema_migrations', 'supabase_migrations'];

// ---------------------------------------------------------------------------
// SQL queries (Splinter-derived)
// ---------------------------------------------------------------------------

/**
 * 0013 - Tables in the public schema with RLS disabled.
 * Returns: schemaname | tablename
 */
const SQL_RLS_DISABLED = `
SELECT t.schemaname, t.tablename
FROM pg_tables t
JOIN pg_class c
  ON c.relname = t.tablename
 AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
WHERE t.schemaname = 'public'
  AND c.relrowsecurity = false
  AND t.tablename NOT LIKE '\\_%'
  AND t.tablename NOT IN (${RLS_EXCLUDE.map((n) => `'${n}'`).join(', ')});
`;

/**
 * 0001 - Foreign keys whose referencing columns lack a corresponding index.
 * Returns: table_name | constraint_name | columns
 */
const SQL_UNINDEXED_FK = `
SELECT
  c.conrelid::regclass AS table_name,
  c.conname            AS constraint_name,
  array_agg(a.attname ORDER BY x.n) AS columns
FROM pg_constraint c
CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS x(attnum, n)
JOIN pg_attribute a
  ON a.attrelid = c.conrelid
 AND a.attnum   = x.attnum
WHERE c.contype = 'f'
  AND c.conrelid::regclass::text NOT LIKE 'pg_%'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_index i
    WHERE i.indrelid = c.conrelid
      AND c.conkey[1:array_length(c.conkey, 1)]
        = i.indkey[1:array_length(c.conkey, 1)]
  )
GROUP BY c.conrelid, c.conname;
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run a SQL query via psql and return the raw rows as an array of string arrays.
 * Each inner array represents one row, fields separated by '|'.
 *
 * SQL is passed via stdin to avoid shell escaping issues with newlines and
 * special characters in the query text.
 */
function runQuery(sql) {
  const stdout = execSync(
    `psql ${DB_URL} --tuples-only --no-align --field-separator='|'`,
    {encoding: 'utf-8', input: sql.trim(), stdio: ['pipe', 'pipe', 'pipe']}
  );
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split('|').map((f) => f.trim()));
}

/**
 * Verify the local Supabase Postgres is reachable.
 */
function ensurePostgresAvailable() {
  try {
    execSync(`psql ${DB_URL} -c "SELECT 1" --tuples-only --no-align`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch {
    console.error(
      'ERROR: Cannot connect to local Supabase Postgres at ' + DB_URL + '.\n' +
      'Make sure the Supabase local dev stack is running:\n' +
      '  yarn supabase:start\n'
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  ensurePostgresAvailable();

  let errorCount = 0;
  let warningCount = 0;

  console.log('=== Schema Lint (Splinter-derived) ===\n');

  // -- Check 1: RLS disabled on public tables (ERROR) -----------------------
  const rlsRows = runQuery(SQL_RLS_DISABLED);
  if (rlsRows.length > 0) {
    errorCount += rlsRows.length;
    console.log('[ERROR] RLS disabled on public tables:');
    for (const [schema, table] of rlsRows) {
      console.log(`  - ${schema}.${table}`);
    }
    console.log();
  }

  // -- Check 2: Unindexed foreign keys (WARNING) ----------------------------
  const fkRows = runQuery(SQL_UNINDEXED_FK);
  if (fkRows.length > 0) {
    warningCount += fkRows.length;
    console.log('[WARNING] Foreign keys without indexes:');
    for (const [table, constraint, columns] of fkRows) {
      const cols = (columns || '').replace(/[{}]/g, '');
      console.log(`  - ${table}.${cols} (constraint: ${constraint})`);
    }
    console.log();
  }

  // -- Summary ---------------------------------------------------------------
  if (errorCount === 0 && warningCount === 0) {
    console.log('No issues found.\n');
  }

  console.log(`Summary: ${errorCount} error(s), ${warningCount} warning(s)`);

  if (STRICT && warningCount > 0) {
    console.log('(--strict mode: treating warnings as errors)');
  }

  const hasErrors = errorCount > 0 || (STRICT && warningCount > 0);
  process.exit(hasErrors ? 1 : 0);
}

main();
