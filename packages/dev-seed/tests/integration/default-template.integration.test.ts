/**
 * DX-03 integration test — applies `defaultTemplate` + `defaultOverrides` to a
 * live local Supabase and asserts end-to-end correctness.
 *
 * D-58-21 gating: `describe.skipIf(!process.env.SUPABASE_URL)` — the test
 * skips in envs without `supabase start`. Developers run `yarn dev:start`
 * (or `supabase start` directly) before `yarn test:unit` to exercise it.
 *
 * Covers (D-58-20):
 *   - Row counts across the bulk-import tables (in-memory + DB-level)
 *   - Relational wiring (candidates → organization_id via organizations ref;
 *     nominations → candidate_id × election_id × constituency_id)
 *   - Portraits: 100 candidates with `image.path` populated; `public-assets`
 *     bucket has ≥100 objects under `${projectId}/candidates/`
 *   - NF-01: elapsed ≤ 10_000 ms for the seed step
 *   - TMPL-07: locale fan-out produces all 4 locale keys on elections.name
 *
 * Teardown strategy: Plan 07 (teardown CLI) has not yet shipped, so this test
 * invokes `SupabaseAdminClient.bulkDelete` directly with the 10 bulk-deletable
 * tables plus an ad-hoc storage cleanup (Path 2 from RESEARCH §3 — reliable
 * because `pg_net` trigger cleanup is async and would race assertion).
 *
 * Read-side queries use an ad-hoc `createClient` (Plan 09 decision): the
 * `SupabaseAdminClient.client` field is `protected` so table reads would
 * require extending the class. Constructing a narrow read-only client inline
 * keeps the plan self-contained — the write path already goes through the
 * admin client via `Writer`.
 *
 * Timeout: 60s — NF-01 budgets the seed step at <10s, but teardown + storage
 * cleanup + asserts consume additional wall time. Well under typical CI
 * per-test-file limits.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  BUILT_IN_OVERRIDES,
  BUILT_IN_TEMPLATES,
  fanOutLocales,
  runPipeline,
  SupabaseAdminClient,
  TEST_PROJECT_ID,
  Writer
} from '../../src';

const hasSupabase = Boolean(process.env.SUPABASE_URL);

/**
 * Ad-hoc read-only client constructed from env vars. Mirrors the defaults
 * `SupabaseAdminClient` uses (local `supabase start` service-role key), but
 * lives in the test scope so it can issue direct `.from(...).select(...)`
 * queries that the admin client's narrow public surface does not expose.
 */
function makeReadClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Pre-test cleanup. Removes any rows left over from a prior run at the
 * `seed_` prefix plus all storage objects under
 * `${TEST_PROJECT_ID}/candidates/`. Pitfall #5 (pg_net async) means we cannot
 * trust the trigger-based cascade to complete before assertions run — delete
 * storage explicitly.
 */
async function runTeardown(prefix: string, adminClient: SupabaseAdminClient, readClient: SupabaseClient): Promise<void> {
  // 1. Delete rows via bulk_delete RPC (10 bulk-deletable tables; accounts,
  //    projects, app_settings are bootstrap-owned and stay intact per D-11).
  await adminClient.bulkDelete({
    nominations: { prefix },
    candidates: { prefix },
    questions: { prefix },
    question_categories: { prefix },
    organizations: { prefix },
    constituencies: { prefix },
    constituency_groups: { prefix },
    elections: { prefix },
    alliances: { prefix },
    factions: { prefix }
  });

  // 2. Drain candidate portrait folder (Pitfall #5 — trigger fires pg_net
  //    async, don't race assertions).
  const { data: candidateFiles } = await readClient.storage
    .from('public-assets')
    .list(`${TEST_PROJECT_ID}/candidates`, { limit: 1000 });
  if (candidateFiles && candidateFiles.length > 0) {
    // Storage.list returns folder entries (one per candidate UUID dir). For
    // each, list contents + remove.
    const removePaths: Array<string> = [];
    for (const entry of candidateFiles) {
      const { data: inner } = await readClient.storage
        .from('public-assets')
        .list(`${TEST_PROJECT_ID}/candidates/${entry.name}`, { limit: 100 });
      if (inner && inner.length > 0) {
        for (const f of inner) {
          removePaths.push(`${TEST_PROJECT_ID}/candidates/${entry.name}/${f.name}`);
        }
      }
    }
    if (removePaths.length > 0) {
      await readClient.storage.from('public-assets').remove(removePaths);
    }
  }
}

describe.skipIf(!hasSupabase)('default template integration (DX-03)', () => {
  let adminClient: SupabaseAdminClient;
  let readClient: SupabaseClient;

  beforeAll(async () => {
    adminClient = new SupabaseAdminClient();
    readClient = makeReadClient();
    await runTeardown('seed_', adminClient, readClient);
  }, 60_000);

  it(
    'applies default template and meets NF-01 (<10s) + D-58-20 assertions',
    async () => {
      const template = BUILT_IN_TEMPLATES.default;
      const overrides = BUILT_IN_OVERRIDES.default;
      const seed = (template as { seed?: number }).seed ?? 42;
      const prefix = (template as { externalIdPrefix?: string }).externalIdPrefix ?? 'seed_';

      const writer = new Writer();
      const start = Date.now();

      const rows = runPipeline(template, overrides);
      fanOutLocales(rows, template, seed);
      const { portraits } = await writer.write(rows, prefix);

      const elapsedMs = Date.now() - start;

      // -----------------------------------------------------------------------
      // 1. NF-01 budget — HARD GATE
      // -----------------------------------------------------------------------
      expect(elapsedMs).toBeLessThan(10_000);

      // -----------------------------------------------------------------------
      // 2. In-memory row counts match the default template (D-58-02)
      // -----------------------------------------------------------------------
      expect(rows.elections.length).toBe(1);
      expect(rows.constituency_groups.length).toBe(1);
      expect(rows.constituencies.length).toBe(13);
      expect(rows.organizations.length).toBe(8);
      expect(rows.candidates.length).toBe(100);
      expect(rows.questions.length).toBe(24);
      expect(rows.question_categories.length).toBe(4);
      expect(rows.nominations.length).toBe(100);

      // -----------------------------------------------------------------------
      // 3. Portraits uploaded — 100 candidates, one portrait each
      // -----------------------------------------------------------------------
      expect(portraits).toBe(100);

      // -----------------------------------------------------------------------
      // 4. DB-level row counts via `seed_` prefix filter (idempotent re-runs)
      // -----------------------------------------------------------------------
      expect(await countByPrefix(readClient, 'elections', prefix)).toBe(1);
      expect(await countByPrefix(readClient, 'constituency_groups', prefix)).toBe(1);
      expect(await countByPrefix(readClient, 'constituencies', prefix)).toBe(13);
      expect(await countByPrefix(readClient, 'organizations', prefix)).toBe(8);
      expect(await countByPrefix(readClient, 'candidates', prefix)).toBe(100);
      expect(await countByPrefix(readClient, 'questions', prefix)).toBe(24);
      expect(await countByPrefix(readClient, 'question_categories', prefix)).toBe(4);
      expect(await countByPrefix(readClient, 'nominations', prefix)).toBe(100);

      // -----------------------------------------------------------------------
      // 5. Candidates have organization_id + non-NULL image.path (Pitfall #2 —
      //    column is `image` JSONB, NOT `image_id`)
      // -----------------------------------------------------------------------
      const { data: candidates, error: candErr } = await readClient
        .from('candidates')
        .select('id, external_id, organization_id, image')
        .eq('project_id', TEST_PROJECT_ID)
        .like('external_id', `${prefix}%`);
      expect(candErr).toBeNull();
      expect(candidates?.length).toBe(100);
      for (const cand of candidates ?? []) {
        expect(cand.organization_id).not.toBeNull();
        const img = cand.image as { path?: string } | null;
        expect(img?.path).toBeTruthy();
      }

      // -----------------------------------------------------------------------
      // 6. Nominations have all four FK refs resolved
      // -----------------------------------------------------------------------
      const { data: nominations, error: nomErr } = await readClient
        .from('nominations')
        .select('id, external_id, candidate_id, election_id, constituency_id')
        .eq('project_id', TEST_PROJECT_ID)
        .like('external_id', `${prefix}%`);
      expect(nomErr).toBeNull();
      expect(nominations?.length).toBe(100);
      for (const nom of nominations ?? []) {
        expect(nom.candidate_id).not.toBeNull();
        expect(nom.election_id).not.toBeNull();
        expect(nom.constituency_id).not.toBeNull();
      }

      // -----------------------------------------------------------------------
      // 7. TMPL-07: locale fan-out produced all 4 locale keys on elections.name
      // -----------------------------------------------------------------------
      const { data: election, error: elErr } = await readClient
        .from('elections')
        .select('name')
        .eq('project_id', TEST_PROJECT_ID)
        .like('external_id', `${prefix}%`)
        .single();
      expect(elErr).toBeNull();
      const electionName = (election as { name?: Record<string, string> } | null)?.name ?? {};
      expect(Object.keys(electionName).sort()).toEqual(['da', 'en', 'fi', 'sv']);

      // -----------------------------------------------------------------------
      // 8. Storage bucket has ≥100 portrait objects under
      //    `${projectId}/candidates/` (1 portrait per candidate)
      // -----------------------------------------------------------------------
      const portraitPaths = await listCandidatePortraitPaths(readClient);
      expect(portraitPaths.length).toBeGreaterThanOrEqual(100);
    },
    60_000
  );
});

// ---------------------------------------------------------------------------
// Local helpers — scoped to the integration test; not exported.
// ---------------------------------------------------------------------------

/**
 * Count rows in a table where `external_id LIKE ${prefix}%` scoped to the
 * bootstrap project. Scopes to project_id to avoid cross-test bleed.
 */
async function countByPrefix(client: SupabaseClient, table: string, prefix: string): Promise<number> {
  const { count, error } = await client
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('project_id', TEST_PROJECT_ID)
    .like('external_id', `${prefix}%`);
  if (error) throw new Error(`countByPrefix(${table}) failed: ${error.message}`);
  return count ?? 0;
}

/**
 * Enumerate every portrait object under `${TEST_PROJECT_ID}/candidates/`.
 * Writer uploads to `${projectId}/candidates/${candidateId}/seed-portrait.jpg`
 * (VERIFIED: `SupabaseAdminClient.uploadPortrait` path convention). Each
 * candidate gets one subdirectory containing one file.
 */
async function listCandidatePortraitPaths(client: SupabaseClient): Promise<Array<string>> {
  const paths: Array<string> = [];
  const { data: dirs, error } = await client.storage
    .from('public-assets')
    .list(`${TEST_PROJECT_ID}/candidates`, { limit: 1000 });
  if (error) throw new Error(`listCandidatePortraitPaths (dirs) failed: ${error.message}`);
  for (const entry of dirs ?? []) {
    const { data: files, error: innerErr } = await client.storage
      .from('public-assets')
      .list(`${TEST_PROJECT_ID}/candidates/${entry.name}`, { limit: 100 });
    if (innerErr) {
      throw new Error(`listCandidatePortraitPaths (inner ${entry.name}) failed: ${innerErr.message}`);
    }
    for (const file of files ?? []) {
      paths.push(`${TEST_PROJECT_ID}/candidates/${entry.name}/${file.name}`);
    }
  }
  return paths;
}
