/**
 * @openvaa/dev-seed SupabaseAdminClient — bulk-write surface for dev data seeding.
 *
 * Split from tests/tests/utils/supabaseAdminClient.ts per D-24 (Phase 56, 2026-04-22).
 * The tests/ file is rewritten as a thin subclass that adds auth/email + legacy
 * E2E query helpers on top of this base.
 *
 * Env-var handling: the module-level fallbacks below preserve backward-compat for
 * tests/ E2E. Env enforcement per D-15 (NF-02 "fail loudly when env missing") is
 * the Writer's responsibility (packages/dev-seed/src/writer.ts), NOT this file —
 * pure generators consuming this client must stay env-free so `yarn test:unit`
 * doesn't require env fixture.
 *
 * Bulk-import routing note (D-11): `bulk_import` RPC's `processing_order` accepts
 * exactly 11 of 16 non-system tables. `accounts`, `projects`, `feedback`,
 * `constituency_group_constituencies`, `election_constituency_groups` are NOT in
 * that list. Callers must route those elsewhere (writer strips accounts/projects,
 * feedback via direct upsert, joins via linkJoinTables). This file does not
 * enforce the routing — it is a thin RPC wrapper.
 */

import { PROPERTY_MAP, TABLE_MAP } from '@openvaa/supabase-types';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Stable UUID for the default test project, from seed.sql.
 */
export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Default Supabase URL for local development (supabase start).
 */
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';

/**
 * Default service_role key for local development (supabase start).
 * This is the standard demo key embedded in the local Supabase CLI.
 */
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

/**
 * Maps camelCase collection names to Supabase snake_case table names.
 * Extends TABLE_MAP with legacy/alias mappings for backward compatibility.
 */
const COLLECTION_MAP: Record<string, string> = {
  ...TABLE_MAP,
  // Legacy aliases
  parties: 'organizations',
  questionTypes: 'question_types'
};

/**
 * Maps camelCase filter field names to Supabase snake_case column names.
 * Extends PROPERTY_MAP with legacy/alias mappings.
 */
const FIELD_MAP: Record<string, string> = {
  ...PROPERTY_MAP,
  // Legacy aliases
  documentId: 'id'
};

/**
 * Result of a find operation.
 *
 * Consumed by the `findData` helper that lives in the tests/ subclass (see D-24);
 * re-exported from here so tests/ can `export type { FindDataResult } from '@openvaa/dev-seed'`.
 */
export interface FindDataResult {
  type: 'success' | 'failure';
  data?: Array<Record<string, unknown>>;
  cause?: string;
}

/**
 * Resolve a collection name: if it matches a COLLECTION_MAP entry, use that;
 * otherwise return as-is (already snake_case).
 */
function resolveCollectionName(collection: string): string {
  return COLLECTION_MAP[collection] ?? collection;
}

/**
 * Convert a camelCase field name to snake_case using FIELD_MAP,
 * or fall through as-is if already snake_case.
 */
function resolveFieldName(field: string): string {
  return FIELD_MAP[field] ?? field;
}

/**
 * Admin-client base for the dev-seed package.
 *
 * Narrow bulk-write surface (D-24): bulkImport, bulkDelete, importAnswers,
 * linkJoinTables, updateAppSettings. Auth / email / legacy E2E query helpers
 * live in the tests/ subclass.
 *
 * `client` and `projectId` are `protected` (not `private`) so the tests/
 * subclass can reuse the Supabase REST client for its auth helpers without
 * re-creating a second client (RESEARCH finding 5).
 */
export class SupabaseAdminClient {
  protected client: SupabaseClient;
  protected projectId: string;

  constructor(url?: string, serviceRoleKey?: string, projectId?: string) {
    this.client = createClient(url ?? SUPABASE_URL, serviceRoleKey ?? SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    this.projectId = projectId ?? TEST_PROJECT_ID;
  }

  // ---------------------------------------------------------------------------
  // Bulk data operations
  // ---------------------------------------------------------------------------

  /**
   * Bulk import data via the bulk_import RPC.
   *
   * @param data - Object mapping collection names to arrays of records to import
   * @returns The bulk_import result JSON with created/updated counts per collection
   * @throws Error if the RPC call fails
   */
  async bulkImport(data: Record<string, Array<unknown>>): Promise<Record<string, unknown>> {
    // Non-column fields to strip (handled separately)
    const NON_COLUMN_FIELDS = new Set(['answersByExternalId']);
    const COLLECTION_NON_COLUMNS: Record<string, Set<string>> = {
      candidates: new Set(['email'])
    };

    // Tables with a `published boolean NOT NULL DEFAULT false` column gated by
    // anon RLS (`USING (published = true)`). Seeded rows must be visible to the
    // frontend's anon client, so default `published` to `true` when the record
    // doesn't already set it. Templates can still emit `published: false`
    // explicitly to seed draft rows.
    const PUBLISHABLE_TABLES = new Set([
      'elections',
      'constituency_groups',
      'constituencies',
      'organizations',
      'candidates',
      'factions',
      'alliances',
      'question_categories',
      'questions',
      'nominations'
    ]);

    const cleaned: Record<string, Array<unknown>> = {};
    for (const [collection, records] of Object.entries(data)) {
      // Convert collection name to snake_case table name
      const tableName = resolveCollectionName(collection);
      const extraStrip = COLLECTION_NON_COLUMNS[tableName];
      const isPublishable = PUBLISHABLE_TABLES.has(tableName);
      cleaned[tableName] = (records as Array<Record<string, unknown>>).map((record) => {
        const stripped: Record<string, unknown> = {};
        // Nominations are polymorphic: only one entity FK allowed (candidate OR organization).
        // When a candidate nomination has an 'organization' field (the candidate's party),
        // strip it to avoid check constraint violation. But for organization nominations
        // (no 'candidate' field), keep 'organization' as it's the nominated entity.
        const isNomination = tableName === 'nominations';
        const hasCandidateRef = isNomination && ('candidate' in record || 'candidateExternalId' in record);
        for (const [key, value] of Object.entries(record)) {
          if (key.startsWith('_') || NON_COLUMN_FIELDS.has(key) || extraStrip?.has(key)) continue;
          if (isNomination && key === 'organization' && hasCandidateRef) continue;
          // Convert camelCase property to snake_case column
          const snakeKey = resolveFieldName(key);
          // Convert nested relationship reference objects: {externalId: "..."} → {external_id: "..."}
          if (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            'externalId' in (value as Record<string, unknown>)
          ) {
            stripped[snakeKey] = { external_id: (value as Record<string, unknown>).externalId };
          } else {
            stripped[snakeKey] = value;
          }
        }
        if (isPublishable && !('published' in stripped)) {
          stripped.published = true;
        }
        return stripped;
      });
    }
    const { data: result, error } = await this.client.rpc('bulk_import', {
      p_data: cleaned as Record<string, unknown>
    });
    if (error) throw new Error(`bulkImport failed: ${error.message}`);
    return result as Record<string, unknown>;
  }

  /**
   * Bulk delete data via the bulk_delete RPC.
   *
   * @param collections - Object mapping collection names to deletion criteria
   * @returns The bulk_delete result JSON with deleted counts per collection
   * @throws Error if the RPC call fails
   */
  async bulkDelete(
    collections: Record<string, { prefix?: string; ids?: Array<string>; external_ids?: Array<string> }>
  ): Promise<Record<string, unknown>> {
    const { data: result, error } = await this.client.rpc('bulk_delete', {
      p_data: {
        project_id: this.projectId,
        collections
      }
    });
    if (error) throw new Error(`bulkDelete failed: ${error.message}`);
    return result as Record<string, unknown>;
  }

  // ---------------------------------------------------------------------------
  // Answer import with question UUID resolution
  // ---------------------------------------------------------------------------

  /**
   * Import answers from dataset entries that use `answersByExternalId`.
   *
   * After bulk_import creates questions and candidates, this method resolves
   * question external_ids to UUIDs, builds the `answers` JSONB, and updates
   * each candidate record.
   *
   * @param data - The same dataset passed to bulkImport, containing candidates
   *   with `answersByExternalId` fields
   */
  async importAnswers(data: Record<string, Array<unknown>>): Promise<void> {
    const candidates = data.candidates as Array<Record<string, unknown>> | undefined;
    if (!candidates) return;

    // Collect all question external_ids referenced across all candidates
    const questionExtIds = new Set<string>();
    for (const candidate of candidates) {
      const answersByExtId = (candidate.answersByExternalId ?? candidate.answers_by_external_id) as
        | Record<string, unknown>
        | undefined;
      if (!answersByExtId) continue;
      for (const extId of Object.keys(answersByExtId)) {
        questionExtIds.add(extId);
      }
    }

    if (questionExtIds.size === 0) return;

    // Query question UUIDs by external_id
    const { data: questions, error: qError } = await this.client
      .from('questions')
      .select('id, external_id')
      .in('external_id', [...questionExtIds])
      .eq('project_id', this.projectId);

    if (qError) throw new Error(`importAnswers: failed to query questions: ${qError.message}`);
    if (!questions || questions.length === 0) {
      throw new Error(`importAnswers: no questions found for external_ids: ${[...questionExtIds].join(', ')}`);
    }

    // Build external_id -> UUID map
    const extIdToUuid = new Map<string, string>();
    for (const q of questions) {
      extIdToUuid.set(q.external_id, q.id);
    }

    // For each candidate with answersByExternalId, build UUID-keyed answers and update
    for (const candidate of candidates) {
      const answersByExtId = (candidate.answersByExternalId ?? candidate.answers_by_external_id) as
        | Record<string, unknown>
        | undefined;
      if (!answersByExtId) continue;

      const candidateExtId = (candidate.externalId ?? candidate.external_id) as string;
      if (!candidateExtId) continue;

      // Build answers JSONB keyed by question UUID
      const answers: Record<string, unknown> = {};
      for (const [extId, answer] of Object.entries(answersByExtId)) {
        const uuid = extIdToUuid.get(extId);
        if (uuid) {
          answers[uuid] = answer;
        }
      }

      // Look up candidate id by external_id
      const { data: candidateRow, error: cError } = await this.client
        .from('candidates')
        .select('id')
        .eq('external_id', candidateExtId)
        .eq('project_id', this.projectId)
        .single();

      if (cError) throw new Error(`importAnswers: failed to find candidate ${candidateExtId}: ${cError.message}`);

      // Update candidate answers
      const { error: uError } = await this.client.from('candidates').update({ answers }).eq('id', candidateRow.id);

      if (uError) {
        throw new Error(`importAnswers: failed to update candidate ${candidateExtId} answers: ${uError.message}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // M:N join table linking
  // ---------------------------------------------------------------------------

  /**
   * Populate M:N join tables after bulk_import.
   *
   * Scans imported data for:
   * - `elections[].constituency_groups` -> election_constituency_groups
   * - `constituency_groups[].constituencies` -> constituency_group_constituencies
   * - `question_categories[]._elections` -> question_categories.election_ids JSONB
   *
   * Resolves external_ids to UUIDs and inserts into join tables.
   *
   * @param data - The same dataset passed to bulkImport
   */
  async linkJoinTables(data: Record<string, Array<unknown>>): Promise<void> {
    // Link election -> constituency_groups
    const elections = data.elections as Array<Record<string, unknown>> | undefined;
    if (elections) {
      for (const election of elections) {
        const cgRefObj =
          (election._constituencyGroups as { externalId?: Array<string>; external_id?: Array<string> } | undefined) ??
          (election._constituency_groups as { externalId?: Array<string>; external_id?: Array<string> } | undefined);
        const cgRefs: Array<Record<string, string>> | undefined =
          (cgRefObj?.externalId ?? cgRefObj?.external_id)?.map((id: string) => ({ external_id: id })) ??
          (election.constituencyGroups as Array<Record<string, string>>) ??
          (election.constituency_groups as Array<Record<string, string>>);
        if (!cgRefs || !Array.isArray(cgRefs)) continue;

        const electionExtId = (election.externalId ?? election.external_id) as string;
        if (!electionExtId) continue;

        // Resolve election UUID
        const { data: electionRow, error: eError } = await this.client
          .from('elections')
          .select('id')
          .eq('external_id', electionExtId)
          .eq('project_id', this.projectId)
          .single();
        if (eError) throw new Error(`linkJoinTables: failed to find election ${electionExtId}: ${eError.message}`);

        for (const cgRef of cgRefs) {
          const cgExtId = cgRef.external_id ?? cgRef.externalId;
          if (!cgExtId) continue;

          // Resolve constituency_group UUID
          const { data: cgRow, error: cgError } = await this.client
            .from('constituency_groups')
            .select('id')
            .eq('external_id', cgExtId)
            .eq('project_id', this.projectId)
            .single();
          if (cgError) {
            throw new Error(`linkJoinTables: failed to find constituency_group ${cgExtId}: ${cgError.message}`);
          }

          // Insert join table row (ignore conflicts for idempotency)
          const { error: insertError } = await this.client
            .from('election_constituency_groups')
            .upsert(
              { election_id: electionRow.id, constituency_group_id: cgRow.id },
              { onConflict: 'election_id,constituency_group_id' }
            );
          if (insertError) {
            throw new Error(`linkJoinTables: failed to insert election_constituency_groups: ${insertError.message}`);
          }
        }
      }
    }

    // Link constituency_group -> constituencies
    const cgs = (data.constituencyGroups ?? data.constituency_groups) as Array<Record<string, unknown>> | undefined;
    if (cgs) {
      for (const cg of cgs) {
        const constRefObj = cg._constituencies as
          | { externalId?: Array<string>; external_id?: Array<string> }
          | undefined;
        const constRefs: Array<Record<string, string>> | undefined =
          (constRefObj?.externalId ?? constRefObj?.external_id)?.map((id: string) => ({ external_id: id })) ??
          (cg.constituencies as Array<Record<string, string>> | undefined);
        if (!constRefs || !Array.isArray(constRefs)) continue;

        const cgExtId = (cg.externalId ?? cg.external_id) as string;
        if (!cgExtId) continue;

        // Resolve constituency_group UUID
        const { data: cgRow, error: cgError } = await this.client
          .from('constituency_groups')
          .select('id')
          .eq('external_id', cgExtId)
          .eq('project_id', this.projectId)
          .single();
        if (cgError) {
          throw new Error(`linkJoinTables: failed to find constituency_group ${cgExtId}: ${cgError.message}`);
        }

        for (const constRef of constRefs) {
          const constExtId = constRef.external_id ?? constRef.externalId;
          if (!constExtId) continue;

          // Resolve constituency UUID
          const { data: constRow, error: cError } = await this.client
            .from('constituencies')
            .select('id')
            .eq('external_id', constExtId)
            .eq('project_id', this.projectId)
            .single();
          if (cError) {
            throw new Error(`linkJoinTables: failed to find constituency ${constExtId}: ${cError.message}`);
          }

          // Insert join table row (ignore conflicts for idempotency)
          const { error: insertError } = await this.client
            .from('constituency_group_constituencies')
            .upsert(
              { constituency_group_id: cgRow.id, constituency_id: constRow.id },
              { onConflict: 'constituency_group_id,constituency_id' }
            );
          if (insertError) {
            throw new Error(
              `linkJoinTables: failed to insert constituency_group_constituencies: ${insertError.message}`
            );
          }
        }
      }
    }

    // Link question_categories -> elections (via election_ids JSONB column)
    const categories = (data.questionCategories ?? data.question_categories) as
      | Array<Record<string, unknown>>
      | undefined;
    if (categories) {
      for (const category of categories) {
        const electionRefs = category._elections as
          | { externalId?: Array<string>; external_id?: Array<string> }
          | undefined;
        const electionExtIds = electionRefs?.externalId ?? electionRefs?.external_id;
        if (!electionExtIds?.length) continue;

        const catExtId = (category.externalId ?? category.external_id) as string;
        if (!catExtId) continue;

        // Resolve election UUIDs
        const electionIds: Array<string> = [];
        for (const elExtId of electionExtIds) {
          const { data: elRow, error: elError } = await this.client
            .from('elections')
            .select('id')
            .eq('external_id', elExtId)
            .eq('project_id', this.projectId)
            .single();
          if (elError) throw new Error(`linkJoinTables: failed to find election ${elExtId}: ${elError.message}`);
          electionIds.push(elRow.id);
        }

        // Update the question_category with resolved election_ids
        const { error: updateError } = await this.client
          .from('question_categories')
          .update({ election_ids: electionIds })
          .eq('external_id', catExtId)
          .eq('project_id', this.projectId);
        if (updateError) {
          throw new Error(
            `linkJoinTables: failed to update question_category ${catExtId} election_ids: ${updateError.message}`
          );
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // App settings
  // ---------------------------------------------------------------------------

  /**
   * Deep-merge partial settings into the app_settings.settings JSONB column.
   *
   * Uses the merge_jsonb_column RPC for recursive deep merge. Callers only
   * need to send the settings they want to change.
   *
   * @param partialSettings - Partial settings object to deep-merge
   * @throws Error if the app_settings row is not found or the merge fails
   */
  async updateAppSettings(partialSettings: Record<string, unknown>): Promise<void> {
    // Get the app_settings row ID for this project
    const { data: row, error: fetchError } = await this.client
      .from('app_settings')
      .select('id')
      .eq('project_id', this.projectId)
      .single();

    if (fetchError) throw new Error(`updateAppSettings: failed to fetch app_settings: ${fetchError.message}`);

    // Deep merge via RPC
    const { error } = await this.client.rpc('merge_jsonb_column', {
      p_table_name: 'app_settings',
      p_column_name: 'settings',
      p_row_id: row.id,
      p_partial_data: partialSettings
    });

    if (error) throw new Error(`updateAppSettings: merge failed: ${error.message}`);
  }

  // ---------------------------------------------------------------------------
  // Portrait upload surface (Phase 58 Plan 04 — GEN-09)
  // ---------------------------------------------------------------------------

  /**
   * Select candidate rows for portrait upload (Pitfall #8).
   *
   * `bulk_import` returns aggregate counts, not inserted rows. Portrait upload
   * needs the Postgres-assigned UUIDs + plain-text names for alt-text.
   *
   * Filters: `project_id = this.projectId AND external_id LIKE ${prefix}%`.
   * Only touches generator-produced rows — never bootstrap / user-curated
   * candidates. Deterministic order: sorted by `external_id` ascending so the
   * portrait cycling (portraits[i % 30]) is stable across runs at a fixed
   * seed.
   */
  async selectCandidatesForPortraitUpload(
    externalIdPrefix: string
  ): Promise<Array<{ id: string; external_id: string; first_name: string; last_name: string }>> {
    const { data, error } = await this.client
      .from('candidates')
      .select('id, external_id, first_name, last_name')
      .eq('project_id', this.projectId)
      .like('external_id', `${externalIdPrefix}%`)
      .order('external_id', { ascending: true });
    if (error) throw new Error(`selectCandidatesForPortraitUpload failed: ${error.message}`);
    return (data ?? []) as Array<{ id: string; external_id: string; first_name: string; last_name: string }>;
  }

  /**
   * Upload a portrait JPEG to the `public-assets` bucket.
   *
   * Path: `${projectId}/candidates/${candidateId}/${filename}` — 3-segment
   * RLS-compliant (VERIFIED at migration line 1934-1936).
   *
   * `upsert: true` makes re-runs idempotent.
   * `contentType: 'image/jpeg'` keeps Storage metadata correct.
   *
   * CONTEXT §Specifics: upload failure is seed-blocking — throws with a
   * candidate-scoped message the CLI surfaces + exits 1.
   *
   * @returns the storage path that was written (caller writes it into
   *          `candidates.image.path` via `updateCandidateImage`).
   */
  async uploadPortrait(candidateId: string, externalId: string, filename: string, bytes: Uint8Array): Promise<string> {
    const path = `${this.projectId}/candidates/${candidateId}/${filename}`;
    const { error } = await this.client.storage
      .from('public-assets')
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) throw new Error(`Portrait upload failed for ${externalId}: ${error.message}`);
    return path;
  }

  /**
   * Write the `candidates.image` JSONB column for a single candidate.
   *
   * Column name is `image` (JSONB) — NOT `image_id` (Pitfall #2).
   * Shape is `{ path, alt }` matching the canonical StoredImage
   * (VERIFIED: apps/frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts:9-16).
   *
   * `alt` MUST be populated (Pitfall #4 — WCAG 2.1 AA). Caller builds it
   * as `"${first_name} ${last_name}".trim()`.
   *
   * Direct UPDATE — no merge semantics needed since Phase 58 authors the
   * full shape.
   */
  async updateCandidateImage(
    candidateId: string,
    externalId: string,
    image: { path: string; alt: string }
  ): Promise<void> {
    const { error } = await this.client.from('candidates').update({ image }).eq('id', candidateId);
    if (error) throw new Error(`Image column update failed for ${externalId}: ${error.message}`);
  }

  // ---------------------------------------------------------------------------
  // Storage cleanup surface (Phase 58 Plan 07 — CLI-03 teardown Path 2)
  // ---------------------------------------------------------------------------

  /**
   * List all candidate-portrait file paths under `${projectId}/candidates/` in
   * the `public-assets` bucket — used by `seed:teardown` Path 2 explicit
   * cleanup (D-58-07 + RESEARCH §3).
   *
   * Storage layout (verified by Plan 04's `uploadPortrait`):
   *   `${projectId}/candidates/${candidateId}/${filename}`
   *
   * Enumeration is 2-level: first list candidate-UUID directories, then list
   * files under each. Returns a flat array of fully-qualified paths ready to
   * hand to `.storage.from(...).remove(paths)`.
   *
   * Pitfall #5 (RESEARCH §3): the AFTER-DELETE `pg_net` trigger may or may
   * not have reclaimed these files by the time the teardown CLI gets here.
   * Either way, the explicit list+remove is deterministic — this is the
   * PRIMARY path; the trigger is a nice-to-have async fallback.
   *
   * Missing bucket / missing path is treated as empty (initial state after
   * `supabase:reset` with no seed data yet) — only non-"not found" list
   * errors throw.
   */
  async listCandidatePortraitPaths(candidateIds?: Array<string>): Promise<Array<string>> {
    const rootPath = `${this.projectId}/candidates`;

    // When a UUID list is supplied, scope the enumeration to those folders
    // only. The storage layout is `${projectId}/candidates/${uuid}/...`, so
    // we skip the top-level list() entirely — its only purpose is to find
    // UUID folders, and the caller already told us which ones matter.
    let dirs: Array<{ name?: string }>;
    if (candidateIds) {
      if (candidateIds.length === 0) return [];
      dirs = candidateIds.map((id) => ({ name: id }));
    } else {
      const { data, error: dirError } = await this.client.storage.from('public-assets').list(rootPath, { limit: 1000 });
      if (dirError) {
        const msg = (dirError as { message?: string }).message ?? String(dirError);
        // Bucket missing or path absent — treat as empty (initial state).
        if (/not found|does not exist/i.test(msg)) return [];
        throw new Error(`listCandidatePortraitPaths: list dirs failed: ${msg}`);
      }
      if (!data || data.length === 0) return [];
      dirs = data as Array<{ name?: string }>;
    }

    const paths: Array<string> = [];
    for (const dir of dirs) {
      if (!dir.name || dir.name === '.emptyFolderPlaceholder') continue;
      const subpath = `${rootPath}/${dir.name}`;
      const { data: files, error: fileError } = await this.client.storage
        .from('public-assets')
        .list(subpath, { limit: 100 });
      if (fileError) {
        const msg = (fileError as { message?: string }).message ?? String(fileError);
        throw new Error(`listCandidatePortraitPaths: list files failed at ${subpath}: ${msg}`);
      }
      for (const f of (files ?? []) as Array<{ name?: string }>) {
        if (f.name && f.name !== '.emptyFolderPlaceholder') {
          paths.push(`${subpath}/${f.name}`);
        }
      }
    }
    return paths;
  }

  /**
   * Return candidate UUIDs whose `external_id` matches the given prefix.
   *
   * Used by `runTeardown` to scope storage cleanup to exactly the candidates
   * being deleted (Phase 58 UAT gap — see
   * `.planning/phases/58-templates-cli-default-dataset/58-HUMAN-UAT.md`
   * Gap #1). Must be called BEFORE `bulkDelete` — once the DB rows are gone,
   * this query returns an empty list.
   */
  async listCandidateIdsByPrefix(prefix: string): Promise<Array<string>> {
    const { data, error } = await this.client.from('candidates').select('id').like('external_id', `${prefix}%`);
    if (error) {
      throw new Error(`listCandidateIdsByPrefix failed: ${error.message}`);
    }
    return (data ?? []).map((row) => (row as { id: string }).id);
  }

  /**
   * Remove storage objects in bulk from the `public-assets` bucket.
   *
   * Returns the count of successfully removed objects (Supabase Storage
   * `.remove(paths)` returns `{ data: FileObject[] }` on success; we count
   * the entries of `data`).
   *
   * No-ops for an empty path list (avoids an unnecessary HTTP round-trip).
   *
   * Teardown uses this to reclaim portrait files that the AFTER-DELETE
   * trigger didn't clean up (Pitfall #5 — `pg_net` async race; Path 2 is
   * authoritative).
   */
  async removePortraitStorageObjects(paths: Array<string>): Promise<number> {
    if (paths.length === 0) return 0;
    const { data, error } = await this.client.storage.from('public-assets').remove(paths);
    if (error) {
      const msg = (error as { message?: string }).message ?? String(error);
      throw new Error(`removePortraitStorageObjects failed: ${msg}`);
    }
    return (data ?? []).length;
  }
}
