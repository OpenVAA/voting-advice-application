#!/usr/bin/env tsx
/**
 * `yarn workspace @openvaa/dev-seed seed:teardown` — CLI-03 entry.
 *
 * Sequence (D-58-07 + RESEARCH §3 + Pitfall #5):
 *   1. Parse `--prefix` / `--help` via `parseArgs` (node:util; keygen.ts
 *      precedent; NOT commander/yargs).
 *   2. `--help` short-circuit => print TEARDOWN_USAGE => exit 0.
 *   3. Prefix length guard (T-58-07-02) — `--prefix ''` or a single char
 *      would `LIKE %` against effectively every external_id; refuse.
 *   4. Construct `SupabaseAdminClient` (module-level env fallbacks per
 *      supabaseAdminClient.ts:34-42 — Writer's D-15 env enforcement is not
 *      replayed here since bulk_delete works against the local demo key
 *      fallback too).
 *   5. `bulkDelete({ nominations, candidates, ... 10 tables }, { prefix })`.
 *      RPC enforces reverse-dependency order server-side.
 *   6. Storage Path 2 cleanup: list + remove portraits (authoritative —
 *      pg_net trigger Path 1 is async-racy per Pitfall #5).
 *   7. Print summary to stdout (rows deleted + storage objects removed +
 *      echo the prefix used), exit 0.
 *   8. On any error: rephrase `fetch failed`/`ECONNREFUSED`/`ENOTFOUND` to
 *      D-58-12 actionable form, stderr + exit 1.
 *
 * Pitfall #6 explicit guardrail: `bulkDelete` argument MUST include only
 * the 10 tables in `ALLOWED_TEARDOWN_TABLES`. `accounts`, `projects`,
 * `feedback` are NOT in schema's `allowed_collections` (raises
 * `Unknown collection for deletion: %`). `app_settings` is in
 * `allowed_collections` but the writer merges-upserts it (not inserts) —
 * resetting app_settings is `supabase:reset`'s job, not teardown's.
 *
 * D-58-17: permissive prefix. Trust GEN-04 contract — no shape verification.
 *
 * Split into `runTeardown(prefix, client)` (pure orchestration — unit
 * testable with a mocked client) and a thin CLI wrapper (parseArgs +
 * process.exit side-effects).
 */

import { parseArgs } from 'node:util';
import { TEARDOWN_USAGE } from './teardown-help';
import { SupabaseAdminClient } from '../supabaseAdminClient';

// Load repo-root .env if present (Node 22+ built-in). Silent no-op if missing.
try {
  process.loadEnvFile(new URL('../../../../.env', import.meta.url).pathname);
} catch {
  // no .env at repo root — env must be exported manually
}
// Fall back to PUBLIC_SUPABASE_URL when SUPABASE_URL is absent (URL is not
// sensitive; only the service_role key is). Dev ergonomics: root .env shared
// with the frontend works for teardown too.
if (!process.env.SUPABASE_URL && process.env.PUBLIC_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
}

/**
 * 10 tables in schema's `allowed_collections`, minus `app_settings`.
 *
 * NOT `accounts` / `projects` / `feedback` — not in schema's
 * `allowed_collections` (Pitfall #6). NOT `app_settings` — writer merges
 * it, doesn't insert; `supabase:reset` handles that path.
 *
 * Order listed here doesn't matter — the RPC re-orders server-side per
 * schema line 2845-2849.
 */
const ALLOWED_TEARDOWN_TABLES = [
  'nominations',
  'questions',
  'question_categories',
  'candidates',
  'factions',
  'alliances',
  'organizations',
  'constituencies',
  'constituency_groups',
  'elections'
] as const;

/**
 * Minimal interface of the admin client `runTeardown` relies on — lets
 * tests substitute a lightweight fake without constructing a full
 * `SupabaseAdminClient` (which would try to `createClient`).
 */
interface TeardownClient {
  bulkDelete(
    collections: Record<string, { prefix?: string; ids?: Array<string>; external_ids?: Array<string> }>
  ): Promise<Record<string, unknown>>;
  listCandidateIdsByPrefix(prefix: string): Promise<Array<string>>;
  listCandidatePortraitPaths(candidateIds?: Array<string>): Promise<Array<string>>;
  removePortraitStorageObjects(paths: Array<string>): Promise<number>;
}

export interface TeardownResult {
  rowsDeleted: number;
  storageRemoved: number;
}

/**
 * Pure orchestration — no process.exit, no env reads, no stdout writes.
 * The CLI wrapper below composes this with parseArgs + exit codes.
 *
 * Throws on: prefix length guard violation, bulkDelete failure, storage
 * list/remove failure. Caller rephrases + prints.
 */
export async function runTeardown(prefix: string, client: TeardownClient): Promise<TeardownResult> {
  // T-58-07-02 mass-delete guard. `--prefix ''` would be `LIKE %` —
  // equivalent to deleting every row with a non-null external_id across
  // all 10 content tables. Refuse with an actionable message.
  if (!prefix || prefix.length < 2) {
    throw new Error(`--prefix must be at least 2 characters to prevent accidental mass-delete (got '${prefix}').`);
  }

  // Step 1: collect the candidate UUIDs matching the prefix BEFORE we delete
  // the DB rows. After bulkDelete runs, `candidates.external_id LIKE $prefix%`
  // returns nothing, so we'd have no way to scope the storage cleanup — and
  // enumerating all portraits under `${projectId}/candidates/` would wipe
  // every seeded prefix's portraits, not just this one's. Running with a
  // non-default prefix against a DB that already has rows of another prefix
  // would silently destroy the other prefix's portraits.
  const candidateIds = await client.listCandidateIdsByPrefix(prefix);

  // Step 2: bulkDelete rows with the configured prefix (Pitfall #6 guardrail).
  const collections: Record<string, { prefix: string }> = {};
  for (const table of ALLOWED_TEARDOWN_TABLES) {
    collections[table] = { prefix };
  }
  const deleteResult = await client.bulkDelete(collections);
  const rowsDeleted = countDeletedRows(deleteResult);

  // Step 3: Storage Path 2 — explicit list + remove (RESEARCH §3 primary).
  // Path 1 (AFTER-DELETE trigger + pg_net) fires asynchronously; we do NOT
  // rely on it for deterministic teardown. The UUID list from step 1 scopes
  // the cleanup to exactly the candidates this prefix owned.
  const portraitPaths = await client.listCandidatePortraitPaths(candidateIds);
  const storageRemoved = await client.removePortraitStorageObjects(portraitPaths);

  return { rowsDeleted, storageRemoved };
}

/**
 * `bulk_delete` RPC returns `{ [table]: { deleted: N } }` per allowed
 * table. Sum the `deleted` counts across the result.
 *
 * Robust to missing entries (returns 0 for tables that weren't in the
 * response) and non-numeric `deleted` fields (returns 0 for that entry).
 */
function countDeletedRows(result: Record<string, unknown>): number {
  let total = 0;
  for (const value of Object.values(result)) {
    if (value && typeof value === 'object' && 'deleted' in (value as Record<string, unknown>)) {
      const n = (value as { deleted: unknown }).deleted;
      if (typeof n === 'number' && Number.isFinite(n)) total += n;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// CLI wrapper — parseArgs + process.exit side-effects.
// Excluded from unit tests (those exercise `runTeardown` + `TEARDOWN_USAGE`
// via direct import); integration test (Plan 09) subprocess-execs this file.
// ---------------------------------------------------------------------------

// Only run the CLI block when invoked directly (tsx execution). Importing
// this module from tests re-evaluates the exports but must NOT trigger
// parseArgs against the test runner's process.argv.
const isDirectInvocation =
  typeof process.argv[1] === 'string' &&
  (process.argv[1].endsWith('teardown.ts') || process.argv[1].endsWith('teardown.js'));

if (isDirectInvocation) {
  const { values } = parseArgs({
    options: {
      prefix: { type: 'string' },
      help: { type: 'boolean', short: 'h' }
    },
    strict: true,
    allowPositionals: false
  });

  if (values.help) {
    process.stdout.write(TEARDOWN_USAGE);
    process.exit(0);
  }

  const prefix = values.prefix ?? 'seed_';

  try {
    const client = new SupabaseAdminClient();
    const { rowsDeleted, storageRemoved } = await runTeardown(prefix, client);
    process.stdout.write(
      `Teardown complete: ${rowsDeleted} rows deleted, ${storageRemoved} storage objects removed.\n` +
        `Prefix: ${prefix}\n`
    );
    process.exit(0);
  } catch (err) {
    const message = (err as Error)?.message ?? String(err);
    const rephrased = /fetch failed|ECONNREFUSED|ENOTFOUND/.test(message)
      ? `Cannot reach Supabase at ${process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'}. Is 'supabase start' running?`
      : message;
    process.stderr.write(`Error: ${rephrased}\n`);
    process.exit(1);
  }
}
