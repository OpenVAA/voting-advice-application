/**
 * DX-03 integration test — applies `defaultTemplate` + `defaultOverrides` to a
 * live local Supabase and asserts end-to-end correctness.
 *
 * D-58-21 gating: `describe.skipIf(!process.env.SUPABASE_URL)` — the test
 * skips in envs without `supabase start`. Developers run `yarn db:start`
 * (or `supabase start` directly) before `yarn test:unit` to exercise it.
 *
 * Covers (D-58-20):
 *   - Row counts across the bulk-import tables (in-memory + DB-level)
 *   - Relational wiring (candidates → organization_id via organizations ref;
 *     nominations → candidate_id × election_id × constituency_id)
 *   - Portraits: 327 candidates with `image.path` populated; `public-assets`
 *     bucket has ≥327 objects under `${projectId}/candidates/`
 *   - NF-01, expressed as a deterministic OPERATION budget (see below) — NOT
 *     as a wall-clock budget
 *   - TMPL-07: locale fan-out produces every locale key on elections.name
 *
 * NF-01 (rewritten in Phase 135, plan 135-03): this test used to gate on ELAPSED
 * WALL-CLOCK TIME, with a hard ten-second ceiling, measured across `runPipeline`
 * + `fanOutLocales` + `writer.write` — i.e. across ~650 sequential HTTP
 * round-trips to a local Supabase. Its outcome therefore depended on how busy
 * the machine was, not on the code under test: measured 2026-08-10 at 23630 ms
 * under parallel load versus ~6-10 s quiet, against that ten-second ceiling.
 * Sitting inside the blocking `yarn test:unit` CI step, it was an intermittent
 * red build waiting to happen, and it silently forbade running the unit suite
 * beside a dev server.
 *
 * The elapsed time is now MEASURED AND LOGGED but NEVER ASSERTED. What NF-01
 * actually protects — that the write path stays batched and does not degrade
 * into per-row chatter — is asserted directly, as a deterministic budget over
 * `SupabaseAdminClient` operations (§1 in the test body). That budget cannot be
 * moved by scheduling noise, and it fails loudly on the regressions the 10 s
 * number was only ever a proxy for: a lost batch, or an N+1 write.
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
 * Timeout: 300s — a HANG GUARD, not a budget. Nothing in this file asserts on
 * time; the number exists only so a wedged Supabase or storage connection cannot
 * pin CI indefinitely. It previously read 60s, a value DERIVED FROM the NF-01
 * wall-clock budget deleted above ("<10s for the seed step, plus teardown and
 * asserts") — so removing that budget left it with no derivation, and it was
 * measurably too tight. Re-derived from measurement (2026-08-11, 14-core
 * machine, local Supabase): the whole test takes ~7 s quiet, ~15-20 s beside a
 * Vite dev server with 7-11 cores busy, and 68 s with all 14 cores saturated —
 * where it still PASSES, because every assertion below is load-independent.
 * 300 s is ~4.4x the worst legitimately-completing run observed, so it can only
 * fire on a real hang.
 *
 * Do NOT retighten this into a performance signal. Performance is guarded by the
 * operation budget in §1 of the test body, where contention cannot reach it.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeAll, describe, expect, it, type MockInstance, vi } from 'vitest';
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
async function runTeardown(
  prefix: string,
  adminClient: SupabaseAdminClient,
  readClient: SupabaseClient
): Promise<void> {
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
  }, 300_000);

  // Remove the `SupabaseAdminClient.prototype` spies installed by the §1
  // operation-budget guard, so they cannot leak into any other test.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies default template and meets the NF-01 operation budget + D-58-20 assertions', async () => {
    const template = BUILT_IN_TEMPLATES.default;
    const overrides = BUILT_IN_OVERRIDES.default;
    const seed = (template as { seed?: number }).seed ?? 42;
    const prefix = (template as { externalIdPrefix?: string }).externalIdPrefix ?? 'seed_';

    // Counters go on BEFORE the write path runs. `beforeAll`'s teardown has
    // already completed by now, so none of its calls are counted here.
    const readOperationCounts = spyOnAdminClientOperations();

    const writer = new Writer();
    const start = Date.now();

    const rows = runPipeline(template, overrides);
    fanOutLocales(rows, template, seed);
    const { portraits } = await writer.write(rows, prefix);

    const elapsedMs = Date.now() - start;
    const ops = readOperationCounts();

    // -----------------------------------------------------------------------
    // 1. NF-01 — DETERMINISTIC OPERATION BUDGET
    //
    //    This replaces the former hard wall-clock gate (a ten-second ceiling on
    //    elapsed time). It is a different KIND of assertion, not a bigger
    //    threshold — nothing here is measured in milliseconds at all. The
    //    seed step's cost is dominated by SEQUENTIAL round-trips, so the honest
    //    invariant is how many round-trips the write path makes — not how many
    //    milliseconds this particular machine needed to make them. Every count
    //    below is a function of the template alone: identical on an idle box and
    //    a thrashing one. See the NF-01 note in the header docblock.
    // -----------------------------------------------------------------------

    // Elapsed is reported for the record and deliberately NOT asserted on. The
    // log line is the whole of the wall-clock treatment now: a number a human
    // can watch drift, never a condition the suite passes or fails on.
    console.info(`[NF-01] seed step elapsed: ${elapsedMs} ms (observability only — not asserted)`);

    // 1a. Row writes stay BATCHED: three fixed passes (bulk_import →
    //     importAnswers → linkJoinTables) no matter how many rows the template
    //     produced. Splitting a pass per-table or per-row fails here.
    expect(ops.bulkImport).toBe(1);
    expect(ops.importAnswers).toBe(1);
    expect(ops.linkJoinTables).toBe(1);

    // 1b. Portraits cost exactly ONE candidate lookup for the whole run, plus
    //     TWO round-trips per candidate (upload the object, write the image
    //     JSONB). An N+1 lookup, or a third per-candidate call, fails here —
    //     and this is the term that dominates the wall clock, so a real
    //     performance regression lands precisely on this assertion.
    //     `rows.candidates.length` is itself pinned to 327 by §2 below, so this
    //     cannot pass by both sides quietly collapsing to zero.
    expect(ops.selectCandidatesForPortraitUpload).toBe(1);
    expect(ops.uploadPortrait).toBe(rows.candidates.length);
    expect(ops.updateCandidateImage).toBe(rows.candidates.length);

    // 1c. app_settings: one merge_jsonb_column RPC per row, and AT MOST one
    //     question-external-id lookup for the entire payload (the Phase 88
    //     Plan 04 cheap pre-walk gate — 88-04-ADR-cardContents-resolver.md).
    expect(ops.updateAppSettings).toBe(rows.app_settings?.length ?? 0);
    expect(ops.selectQuestionExternalIds).toBeLessThanOrEqual(1);

    // 1d. Nothing ELSE on the admin client is touched by the write path. This
    //     is what makes 1a-1c a budget rather than a checklist: a newly
    //     introduced call cannot go uncounted, it surfaces here by name.
    const unbudgeted = Object.entries(ops).filter(([name, count]) => count > 0 && !BUDGETED_WRITE_OPS.has(name));
    expect(unbudgeted).toEqual([]);

    // -----------------------------------------------------------------------
    // 2. In-memory row counts match the default template (Phase 64 densification)
    // -----------------------------------------------------------------------
    expect(rows.elections.length).toBe(1);
    expect(rows.constituency_groups.length).toBe(1);
    expect(rows.constituencies.length).toBe(5);
    expect(rows.organizations.length).toBe(8);
    expect(rows.candidates.length).toBe(327);
    expect(rows.questions.length).toBe(26);
    expect(rows.question_categories.length).toBe(4);
    // Phase 67: alliances + alliance noms
    expect(rows.alliances.length).toBe(2);
    // 327 candidate noms + 40 org noms + 10 alliance noms (2 alliances × 5 constituencies)
    expect(rows.nominations.length).toBe(327 + 40 + 10);

    // -----------------------------------------------------------------------
    // 3. Portraits uploaded — 327 candidates, one portrait each
    // -----------------------------------------------------------------------
    expect(portraits).toBe(327);

    // -----------------------------------------------------------------------
    // 4. DB-level row counts via `seed_` prefix filter (idempotent re-runs)
    // -----------------------------------------------------------------------
    expect(await countByPrefix(readClient, 'elections', prefix)).toBe(1);
    expect(await countByPrefix(readClient, 'constituency_groups', prefix)).toBe(1);
    expect(await countByPrefix(readClient, 'constituencies', prefix)).toBe(5);
    expect(await countByPrefix(readClient, 'organizations', prefix)).toBe(8);
    expect(await countByPrefix(readClient, 'candidates', prefix)).toBe(327);
    expect(await countByPrefix(readClient, 'questions', prefix)).toBe(26);
    expect(await countByPrefix(readClient, 'question_categories', prefix)).toBe(4);
    // Phase 67: 2 alliance entities + 327 cand noms + 40 org noms + 10 alliance noms
    expect(await countByPrefix(readClient, 'alliances', prefix)).toBe(2);
    expect(await countByPrefix(readClient, 'nominations', prefix)).toBe(327 + 40 + 10);

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
    expect(candidates?.length).toBe(327);
    for (const cand of candidates ?? []) {
      expect(cand.organization_id).not.toBeNull();
      const img = cand.image as { path?: string } | null;
      expect(img?.path).toBeTruthy();
    }

    // -----------------------------------------------------------------------
    // 6. Nominations have FK refs resolved per type:
    //    - Candidate-type: candidate_id non-null, parent_nomination_id non-null
    //    - Organization-type:
    //        * 30 of 40 (parties belonging to an alliance) have
    //          parent_nomination_id non-null pointing at an alliance nom
    //          in the SAME constituency (Phase 67)
    //        * 10 of 40 (party_people, party_coast — 2 standalone × 5 const)
    //          have parent_nomination_id null (Phase 67 no-alliance path)
    //    - Alliance-type: alliance_id non-null, parent_nomination_id null
    //      (alliances cannot have parents per validate_nomination trigger)
    //    - All types: election_id + constituency_id non-null
    // -----------------------------------------------------------------------
    const { data: nominations, error: nomErr } = await readClient
      .from('nominations')
      .select(
        'id, external_id, candidate_id, organization_id, alliance_id, election_id, constituency_id, parent_nomination_id'
      )
      .eq('project_id', TEST_PROJECT_ID)
      .like('external_id', `${prefix}%`);
    expect(nomErr).toBeNull();
    // Phase 67: 327 + 40 + 10 = 377 total
    expect(nominations?.length).toBe(327 + 40 + 10);
    const candNoms = (nominations ?? []).filter((n) => n.candidate_id != null);
    const orgNoms = (nominations ?? []).filter((n) => n.organization_id != null);
    const allianceNoms = (nominations ?? []).filter((n) => n.alliance_id != null);
    expect(candNoms.length).toBe(327);
    expect(orgNoms.length).toBe(40);
    expect(allianceNoms.length).toBe(10);

    for (const nom of candNoms) {
      expect(nom.election_id).not.toBeNull();
      expect(nom.constituency_id).not.toBeNull();
      expect(nom.parent_nomination_id).not.toBeNull();
    }

    // Phase 67: split org-noms by parent presence.
    const orgNomsWithParent = orgNoms.filter((n) => n.parent_nomination_id != null);
    const orgNomsStandalone = orgNoms.filter((n) => n.parent_nomination_id == null);
    // 6 of 8 parties × 5 constituencies = 30 with-parent (alliance members)
    expect(orgNomsWithParent.length).toBe(30);
    // 2 of 8 parties × 5 constituencies = 10 standalone (party_people, party_coast)
    expect(orgNomsStandalone.length).toBe(10);
    for (const nom of orgNoms) {
      expect(nom.election_id).not.toBeNull();
      expect(nom.constituency_id).not.toBeNull();
    }

    // Phase 67: alliance noms have NO parent (validate_nomination trigger).
    const allianceNomIds = new Set(allianceNoms.map((n) => n.id));
    for (const nom of allianceNoms) {
      expect(nom.election_id).not.toBeNull();
      expect(nom.constituency_id).not.toBeNull();
      expect(nom.parent_nomination_id).toBeNull();
    }

    // Phase 67: every parent_nomination_id on an org-nom resolves to an
    // alliance-nom in the same constituency (the wiring that powers the
    // v2.6 P64 supabase-adapter reverse-fill of organizationNominationIds).
    const allianceNomById = new Map(allianceNoms.map((n) => [n.id, n]));
    for (const orgNom of orgNomsWithParent) {
      expect(allianceNomIds.has(orgNom.parent_nomination_id)).toBe(true);
      const parent = allianceNomById.get(orgNom.parent_nomination_id);
      // Constituency identity invariant (validate_nomination trigger:
      // 011-validation-functions.sql:264-272). Belt + suspenders — the
      // trigger would have raised on INSERT, but we also assert here so a
      // future schema-bypass regression surfaces in this test.
      expect(parent?.constituency_id).toBe(orgNom.constituency_id);
      expect(parent?.election_id).toBe(orgNom.election_id);
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
    expect(Object.keys(electionName).sort()).toEqual(['en', 'fi', 'sv']);

    // -----------------------------------------------------------------------
    // 8. Storage bucket has ≥327 portrait objects under
    //    `${projectId}/candidates/` (1 portrait per candidate)
    // -----------------------------------------------------------------------
    const portraitPaths = await listCandidatePortraitPaths(readClient);
    expect(portraitPaths.length).toBeGreaterThanOrEqual(327);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// Local helpers — scoped to the integration test; not exported.
// ---------------------------------------------------------------------------

/**
 * The `SupabaseAdminClient` operations the write path is BUDGETED to perform.
 * Any other operation showing a non-zero count fails §1d by name, so the budget
 * stays closed rather than becoming a checklist of the calls we remembered.
 */
const BUDGETED_WRITE_OPS = new Set([
  'bulkImport',
  'importAnswers',
  'linkJoinTables',
  'selectQuestionExternalIds',
  'selectCandidatesForPortraitUpload',
  'uploadPortrait',
  'updateCandidateImage',
  'updateAppSettings'
]);

/**
 * Install call counters on EVERY `SupabaseAdminClient.prototype` method.
 *
 * `vi.spyOn` calls through by default, so the real write path still executes
 * against the live local Supabase — this observes, it does not stub. Spying on
 * the prototype (rather than an instance) is what makes it work at all: `Writer`
 * constructs its own `SupabaseAdminClient` internally and never exposes it.
 *
 * Counted at the admin-client boundary, which is the layer where batching is
 * decided. Queries issued INSIDE a single admin-client method are not visible
 * here; the batching invariants that matter for NF-01 all live at this boundary.
 *
 * `afterEach` restores the originals.
 *
 * @returns a thunk that snapshots `{ methodName: callCount }` when invoked.
 */
function spyOnAdminClientOperations(): () => Record<string, number> {
  const proto = SupabaseAdminClient.prototype as unknown as Record<string, (...args: Array<unknown>) => unknown>;
  const spies: Array<[string, MockInstance]> = Object.getOwnPropertyNames(SupabaseAdminClient.prototype)
    .filter((name) => name !== 'constructor' && typeof proto[name] === 'function')
    .map((name) => [name, vi.spyOn(proto, name)]);
  return () => Object.fromEntries(spies.map(([name, spy]) => [name, spy.mock.calls.length]));
}

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
