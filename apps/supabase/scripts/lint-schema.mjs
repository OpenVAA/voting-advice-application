#!/usr/bin/env node

/**
 * Custom schema lint script derived from Supabase Splinter advisors.
 *
 * Runs SQL queries against the local Supabase Postgres instance to check for schema-level issues that `supabase db lint` (PL/pgSQL-only) does not cover.
 *
 * Checks implemented:
 *   - 0013 RLS disabled on public tables  (ERROR)
 *   - 0001 Unindexed foreign keys         (WARNING)
 *   - 9001 Read/write permission separation and mechanism reach (ERROR)
 *
 * Check 9001 is local to this project rather than Splinter-derived, which is why its number sits outside Splinter's range. It closes ROADMAP criterion 2 of phase 162 -- "a test that fails if the two predicates ever collapse back into one" -- as a PERMANENT gate rather than a plan-time scan, and it is built on WHAT A PREDICATE REACHES rather than on what it says. A comparison of the two predicate STRINGS has a hole one level up: it stays green when both predicates collapse onto a third shared expression, and green when a write policy is repointed at the read permission on a table whose read predicate carries a public disjunct so the strings still differ. Both of those are planted as controls and recorded in `.planning/phases/162-permissions-auth-model-refactor/162-NEGATIVE-CONTROL-LEDGER.md`.
 *
 * Usage:
 *   node scripts/lint-schema.mjs [--strict]
 *
 * Exit codes:
 *   0 - No errors (warnings may be present) 1 - At least one ERROR-level issue found (or WARNING in --strict mode)
 */

import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const STRICT = process.argv.includes('--strict');

// Tables to exclude from the RLS check (internal / extension tables)
const RLS_EXCLUDE = ['schema_migrations', 'supabase_migrations'];

// ---------------------------------------------------------------------------
// Check 9001 — the ratified exemption lists
//
// THESE THREE LISTS ARE A SECURITY SURFACE. The numbering follows 162-17's ratified allow-lists, whose LIST 2 (the permission members no policy enforces) is asserted in pgTAP rather than here.
// They are a security surface, not a convenience. Every entry was approved individually, with the reason written beside it, at 162-17 Task 2 (`162-CHECKPOINT-DECISIONS.md` § 1 S-5 / S-3 and § 8 C-11). An entry added later without a stated reason is the form in which a gate is quietly widened until it guards nothing — so do not add one without writing why, and do not treat a red from this check as an invitation to extend a list.
// ---------------------------------------------------------------------------

// The schemas whose policies carry this project's authority model.
const AUTHORITY_SCHEMAS = ['public', 'storage'];

// LIST 1 — tables whose READ permission set may legitimately intersect their WRITE permission set.
// Each entry is [schema, table, permission]; only that one member is tolerated on that one table.
const SAME_PERMISSION_ALLOW = [
  // § 3.2 enumerates no separate admin-jobs READ member. The operator ticked S-4 selecting `project.edit_questions`, and 162-11 put all three `admin_jobs` policies on it: the job queue's read and its write are ONE capability, held by whoever administers the project's questions. The intersection is the matrix's construction, not a collapse.
  ['public', 'admin_jobs', 'project.edit_questions']
  // `public.accounts` is deliberately ABSENT. C-11 cited it as known-legitimate because § 3.2 enumerated no separate account-read member; the operator's S-3 NOTE closed that gap, and 162-09 now gates the `accounts` SELECT on grant EXISTENCE via `user_has_account_grant(uuid)` while the UPDATE keeps `account.edit_settings`. Its derived read set is therefore empty and it needs no exemption. If it ever reappears here, that is a finding, not an entry.
];

// LIST 3 — the functions a policy may reach INSTEAD of naming a permission literal. Each is the single definition of one question the authority model does not ask through `user_can`.
const MECHANISM_HELPERS = [
  // 162-08's project-level anon visibility helper — the single definition of that sub-rule, called directly from each entity SELECT assembly under D-36.
  'project_open_for_voters',
  // 162-08's nomination-level anon visibility helper, same arrangement.
  'entity_has_confirmed_nomination',
  // 162-14's storage visibility helper, D-27's named exception: anon carries no `grants` claim, which `user_can` denies by construction, so the public-read storage policy cannot route through the authority mechanism and must route through this one.
  'storage_path_is_public',
  // 162-14's storage AUTHORITY helper — the eleven-segment path-to-permission mapping ratified at that plan's Task 2 Q2. It is the single definition of "which permission does this storage path ask for", so a policy reaching it reaches the authority mechanism by construction even though the permission literal lives in the helper's body rather than in the policy's own expression.
  'storage_path_can',
  // D-30 / 162-09's grant-EXISTENCE predicate for the `accounts` read. It asks "is there ANY grant on this account or on a project it owns", which `user_can` cannot express because `user_can` takes a permission.
  'user_has_account_grant'
];

// LIST 4 — policies that legitimately ask no authority question at all.
// Each entry is [schema, table, policy].
const REACHES_NEITHER_ALLOW = [
  // Join-table rows whose visibility is DELEGATED to their parent `constituency_groups` row through an EXISTS. The parent's own policy makes the decision; re-asking it here would be a second copy.
  ['public', 'constituency_group_constituencies', 'anon_select_constituency_group_constituencies'],
  ['public', 'constituency_group_constituencies', 'authenticated_select_constituency_group_constituencies'],
  ['public', 'election_constituency_groups', 'anon_select_election_constituency_groups'],
  ['public', 'election_constituency_groups', 'authenticated_select_election_constituency_groups'],
  // Feedback submission is deliberately open to everyone: WITH CHECK is `true` by design and no authority question is asked on the write. The READ and DELETE sides DO ask one (`feedback.read` / `feedback.manage`) and are not exempt.
  ['public', 'feedback', 'anon_insert_feedback'],
  ['public', 'feedback', 'authenticated_insert_feedback'],
  // Granted TO `supabase_auth_admin` only — the Access Token Hook's own read of the table it projects. A system role, not a user; the user authority model cannot be asked of it.
  ['public', 'grants', 'auth_admin_read_grants'],
  // Granted TO `service_role` only, which bypasses row-level security by definition. The Edge Functions write grants through it; gating it on a permission literal would be decoration.
  ['public', 'grants', 'service_role_manage_grants']
];

/** Render a JS list of strings as a SQL array literal. */
const sqlTextArray = (values) => `ARRAY[${values.map((v) => `'${v}'`).join(', ')}]`;

/** Render a JS list of tuples as a SQL VALUES list. */
const sqlTuples = (rows) => rows.map((r) => `(${r.map((v) => `'${v}'`).join(', ')})`).join(', ');

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
  -- Only this project's own schema. Check 0013 already scopes itself to
  -- 'public'; without the same scoping here the report is dominated by
  -- Supabase-managed auth.* and storage.* tables the project cannot act on,
  -- which is how a gate teaches its readers to ignore it.
  AND c.connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT EXISTS (
    SELECT 1
    FROM pg_index i
    WHERE i.indrelid = c.conrelid
      -- pg_constraint.conkey is a 1-based smallint[]; pg_index.indkey is an
      -- int2vector, which is 0-BASED. Slicing both from 1 compares the FK's
      -- columns against the index's SECOND..Nth columns, so every
      -- single-column FK yields '{n}' = '{}' and is reported as unindexed.
      -- Slice indkey from 0 so the comparison is leading-columns to
      -- leading-columns, which is what "an index covers this FK" means.
      AND c.conkey[1:array_length(c.conkey, 1)]::smallint[]
        = (i.indkey[0:array_length(c.conkey, 1) - 1])::smallint[]
  )
GROUP BY c.conrelid, c.conname;
`;

/**
 * 9001 - Read/write permission separation, and mechanism reach, across the authority schemas.
 *
 * Every vocabulary this query uses is DERIVED rather than transcribed: the permission members come from `pg_enum`, the policies from `pg_policies`, and the "which function calls which" relation from a recursive closure over `pg_proc.prosrc`. A hardcoded member list would be a second copy of § 3.2, and this phase exists to end second copies.
 *
 * Reports one row per finding, plus ALWAYS one `census` row. The census is not decoration: the two existing checks print nothing on a clean run, which is correct for them because their silence means "no rows matched a defect query", while silence here would be indistinguishable from "the query matched no policies at all".
 *
 * Returns: kind | object | detail
 *   - census: counts | "<policies> <tables> <members> <rls_enabled_tables>"
 *   - intersect: schema.table | the shared permission member
 *   - identical_predicate: schema.table | "<read policy> = <write policy>"
 *   - reaches_neither: schema.table | "<policy> [<cmd>]"
 *   - broken_exemption: helper name | why it could not be resolved
 *
 * The RLS-enabled table count in the census is scoped to `public` and `storage` LITERALLY rather than through AUTHORITY_SCHEMAS, deliberately: it is the floor the estate must clear, and a floor that moved with the census's own filter could not catch a census that reached nothing.
 */
const SQL_PERMISSION_SEPARATION = `
WITH RECURSIVE
schemas AS (SELECT unnest(${sqlTextArray(AUTHORITY_SCHEMAS)}) AS s),
helper AS (SELECT unnest(${sqlTextArray(MECHANISM_HELPERS)}) AS h),
same_perm AS (SELECT * FROM (VALUES ${sqlTuples(SAME_PERMISSION_ALLOW.length ? SAME_PERMISSION_ALLOW : [['', '', '']])}) v(sch, tbl, perm)),
neither_ok AS (SELECT * FROM (VALUES ${sqlTuples(REACHES_NEITHER_ALLOW.length ? REACHES_NEITHER_ALLOW : [['', '', '']])}) v(sch, tbl, pol)),
fn AS (
  SELECT DISTINCT p.proname::text AS name, p.prosrc AS src
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public', 'private') AND p.prokind = 'f'
),
edge AS (
  SELECT a.name AS caller, b.name AS callee
  FROM fn a JOIN fn b ON a.name <> b.name AND a.src ~ ('\\m' || b.name || '\\s*\\(')
),
closure(root, reached) AS (
  SELECT name, name FROM fn
  UNION
  SELECT c.root, e.callee FROM closure c JOIN edge e ON e.caller = c.reached
),
mem AS (
  SELECT e.enumlabel::text AS m
  FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
  WHERE t.typname = 'grant_permission'
),
pol AS (
  SELECT p.schemaname AS sch, p.tablename AS tbl, p.policyname AS pol, p.cmd,
         COALESCE(p.qual, '') AS q,
         COALESCE(p.qual, '') || ' ' || COALESCE(p.with_check, '') AS expr
  FROM pg_policies p
  WHERE p.schemaname IN (SELECT s FROM schemas)
),
polmem AS (
  SELECT p.sch, p.tbl, p.pol, p.cmd, m.m
  FROM pol p JOIN mem m ON p.expr LIKE '%''' || m.m || '''::grant_permission%'
),
polhelp AS (
  SELECT DISTINCT p.sch, p.tbl, p.pol
  FROM pol p
  JOIN fn f ON p.expr LIKE '%' || f.name || '(%'
  JOIN closure c ON c.root = f.name
  JOIN helper h ON h.h = c.reached
),
sets AS (
  SELECT sch, tbl,
    array_agg(DISTINCT m) FILTER (WHERE cmd IN ('SELECT', 'ALL')) AS rd,
    array_agg(DISTINCT m) FILTER (WHERE cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')) AS wr
  FROM polmem GROUP BY sch, tbl
),
c1 AS (
  SELECT 'intersect' AS kind, s.sch || '.' || s.tbl AS obj, x.m AS detail
  FROM sets s CROSS JOIN LATERAL (SELECT unnest(s.rd) INTERSECT SELECT unnest(s.wr)) x(m)
  WHERE NOT EXISTS (SELECT 1 FROM same_perm sp WHERE sp.sch = s.sch AND sp.tbl = s.tbl AND sp.perm = x.m)
),
c2 AS (
  SELECT DISTINCT 'identical_predicate' AS kind, r.sch || '.' || r.tbl AS obj, r.pol || ' = ' || w.pol AS detail
  FROM pol r
  JOIN pol w ON r.sch = w.sch AND r.tbl = w.tbl AND r.cmd = 'SELECT' AND w.cmd IN ('INSERT', 'UPDATE', 'DELETE')
  WHERE r.q <> '' AND r.q = w.q
    AND NOT EXISTS (
      SELECT 1 FROM same_perm sp
      WHERE sp.sch = r.sch AND sp.tbl = r.tbl AND r.q LIKE '%''' || sp.perm || '''::grant_permission%'
    )
),
c3 AS (
  SELECT 'reaches_neither' AS kind, p.sch || '.' || p.tbl AS obj, p.pol || ' [' || p.cmd || ']' AS detail
  FROM pol p
  WHERE NOT EXISTS (SELECT 1 FROM polmem pm WHERE pm.sch = p.sch AND pm.tbl = p.tbl AND pm.pol = p.pol)
    AND NOT EXISTS (SELECT 1 FROM polhelp ph WHERE ph.sch = p.sch AND ph.tbl = p.tbl AND ph.pol = p.pol)
    AND NOT EXISTS (SELECT 1 FROM neither_ok n WHERE n.sch = p.sch AND n.tbl = p.tbl AND n.pol = p.pol)
),
c4 AS (
  SELECT 'broken_exemption' AS kind, h.h AS obj, 'resolves to no function in pg_proc' AS detail
  FROM helper h
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'private') AND p.proname = h.h
  )
),
census AS (
  SELECT 'census' AS kind, 'counts' AS obj,
    (SELECT count(*) FROM pol)::text || ' ' ||
    (SELECT count(DISTINCT sch || '.' || tbl) FROM pol)::text || ' ' ||
    (SELECT count(*) FROM mem)::text || ' ' ||
    (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname IN ('public', 'storage') AND c.relkind = 'r' AND c.relrowsecurity)::text AS detail
)
SELECT kind, obj, detail FROM (
  SELECT * FROM census
  UNION ALL SELECT * FROM c1
  UNION ALL SELECT * FROM c2
  UNION ALL SELECT * FROM c3
  UNION ALL SELECT * FROM c4
) z
ORDER BY CASE kind WHEN 'census' THEN 0 ELSE 1 END, kind, obj, detail;
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run a SQL query via psql and return the raw rows as an array of string arrays.
 * Each inner array represents one row, fields separated by '|'.
 *
 * SQL is passed via stdin to avoid shell escaping issues with newlines and special characters in the query text.
 */
function runQuery(sql) {
  const stdout = execSync(`psql ${DB_URL} --tuples-only --no-align --field-separator='|'`, {
    encoding: 'utf-8',
    input: sql.trim(),
    stdio: ['pipe', 'pipe', 'pipe']
  });
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
      'ERROR: Cannot connect to local Supabase Postgres at ' +
        DB_URL +
        '.\n' +
        'Make sure the Supabase local dev stack is running:\n' +
        '  yarn db:start\n'
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

  // -- Check 3: Read/write permission separation and mechanism reach (ERROR) --
  const sepRows = runQuery(SQL_PERMISSION_SEPARATION);
  const censusRow = sepRows.find((r) => r[0] === 'census');
  const [policyCount, tableCount, memberCount, rlsTableCount] = (censusRow ? censusRow[2] : '')
    .split(/\s+/)
    .map((n) => Number.parseInt(n, 10));

  // ALWAYS printed, on a clean run as well as a dirty one. A clean verdict from an instrument that reached nothing is the failure mode this line exists to exclude.
  console.log(
    `[9001] census: policies examined: ${policyCount}, tables partitioned: ${tableCount}, ` +
      `permission members: ${memberCount} (row-level-security tables in public+storage: ${rlsTableCount})`
  );

  const findings = sepRows.filter((r) => r[0] !== 'census');
  if (findings.length > 0) {
    errorCount += findings.length;
    console.log('[ERROR] Read/write permission separation (9001):');
    for (const [kind, object, detail] of findings) {
      if (kind === 'intersect') {
        console.log(`  - ${object}: read and write permission sets intersect on '${detail}'`);
      } else if (kind === 'identical_predicate') {
        console.log(`  - ${object}: a read policy and a write policy carry an identical predicate (${detail})`);
      } else if (kind === 'reaches_neither') {
        console.log(
          `  - ${object}: policy ${detail} reaches neither a permission literal nor a named mechanism helper`
        );
      } else {
        console.log(`  - ${object}: exemption ${detail}`);
      }
    }
    console.log();
  }

  // The floor. A census that reached at or below the number of row-level-security tables the estate carries cannot have reached the estate's policies, so a clean verdict from it means nothing.
  if (!Number.isInteger(policyCount) || policyCount <= rlsTableCount) {
    errorCount += 1;
    console.log(
      `[ERROR] 9001 census floor: ${policyCount} policies examined is at or below the ` +
        `${rlsTableCount} row-level-security tables in public+storage. The check reached a fraction ` +
        'of the estate, so its verdict is not a statement about it.\n'
    );
  }

  // The vocabulary floor. § 3.2 fixes the permission enum at 23 members; a derived count other than that means the guard partitioned against a vocabulary the SPEC does not describe.
  if (memberCount !== 23) {
    errorCount += 1;
    console.log(
      `[ERROR] 9001 vocabulary: grant_permission has ${memberCount} members, expected 23 ` +
        '(162-IMPLEMENTATION-BRIEF.md § 3.2, ratified at 162-03).\n'
    );
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
